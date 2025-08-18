import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * src/subjects/os/CPUScheduler.jsx
 * Updated and fixed: prevents "Cannot read properties of undefined (reading 'filter')" by
 * - taking a synchronous snapshot from a processesRef inside tick()
 * - making pickNext robust when given undefined
 * - keeping sim state in simRef and processes in processesRef to avoid stale closures
 *
 * Improvements:
 * - faster and safer tick loop that uses setInterval but reads latest state from refs
 * - export results to CSV and copy results to clipboard
 * - clearer Gantt rendering and improved progress calculations
 * - minor UI polishing and accessibility improvements
 *
 * Algorithms supported: FCFS, SJF (preemptive & non), RR, PRIORITY
 * Theme colors follow project palette.
 */

function createProcess(id, arrival = 0, burst = 4, priority = 0) {
  return {
    id,
    name: `P${id}`,
    arrival: Number(arrival),
    burst: Number(burst),
    remaining: Number(burst),
    priority: Number(priority),
    startTime: null,
    completionTime: null,
    responseTime: null,
    state: "waiting", // waiting, ready, running, finished
    notes: "",
  };
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

export default function CPUScheduler() {
  // --- UI state
  const [algo, setAlgo] = useState("FCFS");
  const [preemptive, setPreemptive] = useState(false);
  const [quantum, setQuantum] = useState(2);
  const [tickMs, setTickMs] = useState(300);
  const [isRunning, setIsRunning] = useState(false);

  // processes state and refs
  const [processes, setProcesses] = useState([]);
  const processesRef = useRef(processes);
  useEffect(() => { processesRef.current = processes; }, [processes]);

  const nextIdRef = useRef(1);

  // inspector
  const [selectedPid, setSelectedPid] = useState(null);

  // simulation internals
  const simRef = useRef({ time: 0, runningPid: null, rrQueue: [], rrQuantumUsed: 0 });

  // UI traces
  const [gantt, setGantt] = useState([]); // { pid, start, end }
  const [completedOrder, setCompletedOrder] = useState([]);

  // keep timer id
  const timerRef = useRef(null);

  // Derived helper: sorted by arrival then id (used in UI)
  const sortedProcesses = useMemo(() => {
    return [...processes].sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  }, [processes]);

  /* -------------------------
     pickNext: robust scheduler selector
     Accepts optional stateSnapshot (array). If not provided, uses processesRef.
     ------------------------- */
  function pickNext(stateSnapshot) {
    const snapshot = Array.isArray(stateSnapshot) ? stateSnapshot : (processesRef.current || []);
    const time = simRef.current.time;

    const ready = snapshot.filter(p => p.arrival <= time && p.remaining > 0);
    if (!ready || ready.length === 0) return null;

    if (algo === "FCFS") {
      return ready.sort((a, b) => a.arrival - b.arrival || a.id - b.id)[0];
    }

    if (algo === "SJF") {
      if (preemptive) {
        return ready.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival);
      } else {
        return ready.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
      }
    }

    if (algo === "PRIORITY") {
      // lower number -> higher priority
      return ready.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
    }

    if (algo === "RR") {
      // ensure rrQueue is initialized to the order of arrivals that have arrived
      if (!Array.isArray(simRef.current.rrQueue) || simRef.current.rrQueue.length === 0) {
        // build queue from ready set in arrival order
        simRef.current.rrQueue = ready.sort((a,b)=> a.arrival - b.arrival || a.id - b.id).map(p => p.id);
      }
      // filter rrQueue to keep only still-valid ids
      simRef.current.rrQueue = (simRef.current.rrQueue || []).filter(id => {
        const p = snapshot.find(x => x.id === id);
        return p && p.remaining > 0 && p.arrival <= time;
      });
      if (simRef.current.rrQueue.length === 0) return null;
      const pid = simRef.current.rrQueue[0];
      return snapshot.find(p => p.id === pid) || null;
    }
    return ready || null;
  }

  /* -------------------------
     tick(): run 1 simulated time unit
     Uses processesRef to obtain a synchronous snapshot, preventing undefined issues.
     ------------------------- */
  function tick() {
    // take immediate snapshot from ref
    const snapshot = (processesRef.current || []).map(p => ({ ...p }));
    const s = simRef.current;
    const time = s.time;

    // quick early exit: nothing pending
    if (snapshot.length === 0) {
      s.time += 1;
      return;
    }

    // mark waiting -> ready for those that have arrived
    setProcesses(prev => prev.map(p => {
      if (p.arrival <= time && p.remaining > 0 && p.state === "waiting") {
        return { ...p, state: "ready" };
      }
      return p;
    }));

    const picked = pickNext(snapshot);

    if (!picked) {
      // nothing ready now; advance time
      s.time += 1;
      return;
    }

    const pid = picked.id;

    // If new process scheduled (different from running), start a new gantt slice
    if (s.runningPid !== pid) {
      setGantt(prev => [...prev, { pid, start: time, end: null }]);
      s.runningPid = pid;
      if (algo === "RR") s.rrQuantumUsed = 0;
      // set startTime & state
      setProcesses(prev => prev.map(p => p.id === pid ? ({ ...p, startTime: p.startTime ?? time, state: "running" }) : p));
    }

    // consume 1 time unit for the running process
    setProcesses(prev => prev.map(p => {
      if (p.id !== pid) return p;

      const newRem = Math.max(0, p.remaining - 1);
      const updates = { ...p, remaining: newRem, state: newRem === 0 ? "finished" : "running" };

      if (p.startTime === null) updates.startTime = time;

      if (newRem === 0) {
        updates.completionTime = time + 1;
        updates.responseTime = (updates.startTime !== null) ? (updates.startTime - updates.arrival) : 0;

        // close gantt slice
        setGantt(g => {
          const g2 = [...g];
          for (let i = g2.length - 1; i >= 0; i--) {
            if (g2[i].pid === pid && g2[i].end === null) {
              g2[i] = { ...g2[i], end: time + 1 };
              break;
            }
          }
          return g2;
        });

        if (algo === "RR") {
          s.rrQueue = (s.rrQueue || []).filter(x => x !== pid);
          s.rrQuantumUsed = 0;
        }

        s.runningPid = null;
        setCompletedOrder(prev => [...prev, pid]);
      } else {
        // not finished
        if (algo === "RR") {
          s.rrQuantumUsed = (s.rrQuantumUsed || 0) + 1;
          if (s.rrQuantumUsed >= Math.max(1, Number(quantum))) {
            s.rrQuantumUsed = 0;
            // close gantt slice
            setGantt(g => {
              const g2 = [...g];
              for (let i = g2.length - 1; i >= 0; i--) {
                if (g2[i].pid === pid && g2[i].end === null) {
                  g2[i] = { ...g2[i], end: time + 1 };
                  break;
                }
              }
              return g2;
            });

            // rotate queue
            s.rrQueue = (s.rrQueue || []).filter(x => x !== pid);
            s.rrQueue.push(pid);
            s.runningPid = null; // allow scheduler to pick next on next tick
          }
        } else {
          // For preemptive SJF / PRIORITY we simply rely on the next tick to possibly preempt
        }
      }

      return updates;
    }));

    // finally advance time
    s.time += 1;
  }

  /* -------------------------
     control loop: start / stop
     - ensures latest tick function reads freshest state from refs
     ------------------------- */
  useEffect(() => {
    // clear any previous interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isRunning) {
      const ms = clamp(tickMs, 50, 5000);
      timerRef.current = setInterval(() => {
        tick();
      }, ms);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // we intentionally do not put tick in deps; tick reads from refs
  }, [isRunning, tickMs, algo, preemptive, quantum]);

  /* -------------------------
     results & finished detection
     ------------------------- */
  const finishedCount = processes.filter(p => p.remaining === 0).length;
  const allDone = finishedCount === processes.length && processes.length > 0;

  const results = useMemo(() => {
    return [...processes]
      .sort((a, b) => a.id - b.id)
      .map(p => {
        const completion = p.completionTime ?? "-";
        const turnaround = p.completionTime != null ? (p.completionTime - p.arrival) : "-";
        const waiting = turnaround !== "-" ? (turnaround - p.burst) : "-";
        const response = p.responseTime != null ? p.responseTime : (p.startTime != null ? p.startTime - p.arrival : "-");
        return { ...p, completion, turnaround, waiting, response };
      });
  }, [processes]);

  /* -------------------------
     Add / update / remove / reset helpers
     ------------------------- */
  function addProcess(arrival = 0, burst = 4, priority = 0) {
    const id = nextIdRef.current++;
    const p = createProcess(id, arrival, burst, priority);
    setProcesses(prev => [...prev, p].sort((a, b) => a.arrival - b.arrival || a.id - b.id));
  }

  function updateProcess(id, patch) {
    setProcesses(prev => prev.map(p => p.id === id ? ({ ...p, ...patch }) : p).sort((a,b)=> a.arrival - b.arrival || a.id - b.id));
  }

  function removeProcess(id) {
    setProcesses(prev => prev.filter(p => p.id !== id));
    simRef.current.rrQueue = (simRef.current.rrQueue || []).filter(x => x !== id);
    if (simRef.current.runningPid === id) simRef.current.runningPid = null;
  }

  function resetSimulation(keepProcesses = true) {
    setProcesses(prev => prev.map(p => ({ ...p, remaining: p.burst, startTime: null, completionTime: null, responseTime: null, state: "waiting" })));
    simRef.current = { time: 0, runningPid: null, rrQueue: [], rrQuantumUsed: 0 };
    setGantt([]);
    setCompletedOrder([]);
    setIsRunning(false);
    if (!keepProcesses) {
      setProcesses([]);
      nextIdRef.current = 1;
    }
  }

  /* -------------------------
     Export / copy results (neat table output)
     ------------------------- */
  function resultsToCSV(rows) {
    const header = ["Process", "Arrival", "Burst", "Priority", "Completion", "Turnaround", "Waiting", "Response"];
    const lines = [header.join(",")];
    rows.forEach(r => {
      lines.push([r.name, r.arrival, r.burst, r.priority, r.completion, r.turnaround, r.waiting, r.response].join(","));
    });
    return lines.join("\n");
  }

  function downloadCSV() {
    const csv = resultsToCSV(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cpu-scheduler-results.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copyResultsToClipboard() {
    const csv = resultsToCSV(results);
    try {
      await navigator.clipboard.writeText(csv);
      // feedback
      alert("Results copied to clipboard (CSV)");
    } catch (e) {
      console.error(e);
      alert("Failed to copy - your browser may not allow clipboard access");
    }
  }

  /* -------------------------
     Inspector explanation
     ------------------------- */
  function renderProcessExplanation(pid) {
    const p = processes.find(x => x.id === pid);
    if (!p) return <div className="text-sm text-gray-600">No process selected.</div>;
    return (
      <>
        <div className="text-sm"><strong>{p.name}</strong></div>
        <div className="text-xs text-gray-600 mt-1">Arrival: {p.arrival} • Burst: {p.burst} • Priority: {p.priority}</div>
        <div className="mt-2 text-xs text-gray-700">
          <strong>State:</strong> {p.state} <br />
          <strong>Remaining:</strong> {p.remaining} <br />
          <strong>Start:</strong> {p.startTime ?? "-"} • <strong>Complete:</strong> {p.completionTime ?? "-"}
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <em>Explanation:</em> When a process arrives it becomes <strong>ready</strong>. The scheduler picks from ready processes according to the chosen algorithm. For RR the quantum rotates processes in the round-robin queue. Lower priority numbers mean higher priority.
        </div>
      </>
    );
  }

  /* -------------------------
     UI constants
     ------------------------- */
  const cardBase = "rounded-2xl bg-white shadow p-3";
  const colorMap = {
    waiting: "#4B6CB7",
    ready: "#4B6CB7",
    running: "#F59E0B",
    finished: "#10B981",
  };

  /* -------------------------
     Render
     ------------------------- */
  return (
    <div className="w-full min-h-screen p-6 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse text-[#1F2937]">
      {/* Header / Controls */}
      <div className="flex gap-4 mb-6">
        <div className={`${cardBase} min-w-[360px]`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">CPU Scheduler</h3>
            <div className="text-xs text-gray-500">Sim time: <strong>{simRef.current.time}</strong></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select className="col-span-2 p-2 rounded border" value={algo} onChange={(e) => setAlgo(e.target.value)}>
              <option value="FCFS">FCFS</option>
              <option value="SJF">SJF</option>
              <option value="RR">Round Robin (RR)</option>
              <option value="PRIORITY">Priority</option>
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input aria-label="preemptive" type="checkbox" checked={preemptive} onChange={(e)=>setPreemptive(e.target.checked)} /> Preemptive
            </label>

            {algo === "RR" ? (
              <div className="col-span-2">
                <label className="text-xs text-gray-600">Quantum (time units)</label>
                <input aria-label="quantum" type="number" min={1} value={quantum} onChange={(e)=>setQuantum(clamp(Number(e.target.value||1),1,100))} className="w-full p-2 rounded border" />
              </div>
            ) : (
              <div className="text-xs text-gray-500">Quantum used only for RR</div>
            )}

            <div className="col-span-2">
              <label className="text-xs text-gray-600">Tick speed (ms per time unit)</label>
              <input aria-label="tickSpeed" type="range" min="50" max="2000" value={tickMs} onChange={(e)=>setTickMs(Number(e.target.value))} />
              <div className="text-xs text-gray-500">Current: {tickMs} ms</div>
            </div>

            <div className="flex gap-2 mt-2 col-span-2">
              <button
                onClick={() => setIsRunning(true)}
                className="flex-1 p-2 rounded bg-[#4B6CB7] text-white font-semibold shadow"
                >
                Start
              </button>
              <button
                onClick={() => setIsRunning(false)}
                className="flex-1 p-2 rounded bg-gray-100 text-gray-800 border"
                >
                Pause
              </button>
              <button
                onClick={() => resetSimulation(true)}
                className="p-2 rounded bg-red-400 text-white"
                >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Add / Bulk controls */}
        <div className={`${cardBase} flex-1`}>
          <AddProcessForm onAdd={(a,b,pri) => addProcess(a,b,pri)} />

          <div className="mt-4 flex gap-2">
            <button onClick={() => { resetSimulation(false); }} className="p-2 rounded bg-red-500 text-white flex-1">Reset & Clear</button>
            <button onClick={downloadCSV} className="p-2 rounded bg-[#67C8FF] text-white">Export CSV</button>
            <button onClick={copyResultsToClipboard} className="p-2 rounded bg-gray-100 border">Copy CSV</button>
          </div>
        </div>

        {/* Selected / Explanation */}
        <div className={`${cardBase} w-[320px]`}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Inspector</div>
            <div className="text-xs text-gray-500">Click a process to inspect</div>
          </div>

          <div>
            {selectedPid ? renderProcessExplanation(selectedPid) : <div className="text-sm text-gray-600">Select a process from the queue or completed list to see details and explanation.</div>}
          </div>
        </div>
      </div>

      {/* Main visual area */}
      <div className="grid grid-cols-12 gap-4">
        {/* Ready Queue */}
        <div className="col-span-5">
          <div className={`${cardBase}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Ready Queue</div>
              <div className="text-xs text-gray-500">Arrivals appear here</div>
            </div>

            <div className="min-h-[140px]">
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {sortedProcesses.filter(p => p.arrival <= simRef.current.time && p.remaining > 0).map(p => (
                    <motion.div
                      layout
                      key={p.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      onClick={() => setSelectedPid(p.id)}
                      className="cursor-pointer flex items-center justify-between p-3 rounded-lg border"
                      style={{ background: p.state === "running" ? "#fff7ed" : "#ffffff" }}
                    >
                      <div className="flex items-center gap-3">
                        <div style={{ width: 48, height: 48, background: colorMap[p.state], borderRadius: 12 }} className="flex items-center justify-center text-white font-bold">
                          {p.name}
                        </div>
                        <div>
                          <div className="font-semibold">Burst {p.burst} • Rem {p.remaining}</div>
                          <div className="text-xs text-gray-500">Arr: {p.arrival} • Pri: {p.priority}</div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div>Start: {p.startTime ?? "-"}</div>
                        <div>Complete: {p.completionTime ?? "-"}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* future arrivals */}
                <div className="mt-2 text-xs text-gray-400">Future arrivals</div>
                {sortedProcesses.filter(p => p.arrival > simRef.current.time).map(p => (
                  <div key={`f${p.id}`} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-3">
                      <div style={{ width: 38, height: 38, background: "#eef2ff", borderRadius: 10 }} className="flex items-center justify-center font-semibold text-[#4B6CB7]">
                        {p.name}
                      </div>
                      <div className="text-sm">Arrives at {p.arrival}</div>
                    </div>
                    <div className="text-xs text-gray-500">Burst {p.burst}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CPU and Gantt */}
        <div className="col-span-4">
          <div className={`${cardBase} mb-4`}>
            <div className="font-semibold mb-2">CPU</div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-28 rounded-xl border flex items-center justify-center relative bg-black/5">
                  {/* CPU slot - show running process */}
                  <AnimatePresence>
                    {simRef.current.runningPid ? (
                      <motion.div
                        layout
                        key={simRef.current.runningPid}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="absolute left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow"
                        style={{ background: "#fff7ed", display: "flex", alignItems: "center", gap: 12 }}
                        onClick={() => setSelectedPid(simRef.current.runningPid)}
                      >
                        <div style={{ width: 64, height: 64, borderRadius: 12, background: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                          {processes.find(p => p.id === simRef.current.runningPid)?.name}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">Running</div>
                          <div className="text-xs text-gray-600">PID: {simRef.current.runningPid}</div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-gray-500"
                      >
                        Idle
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* small progress bar computed from gantt last slice for running pid */}
                <div className="mt-3">
                  <ProgressBar
                    pid={simRef.current.runningPid}
                    processes={processes}
                    gantt={gantt}
                  />
                </div>
              </div>

              <div style={{ width: 140 }}>
                <div className="text-xs text-gray-500 mb-2">Controls</div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setIsRunning(s => !s); }} className="p-2 rounded bg-[#67C8FF] text-white">Toggle</button>
                  <button onClick={() => setIsRunning(false)} className="p-2 rounded bg-gray-100 border">Pause</button>
                  <button onClick={() => resetSimulation(true)} className="p-2 rounded bg-red-400 text-white">Reset</button>
                </div>
              </div>
            </div>
          </div>

          {/* Gantt */}
          <div className={`${cardBase}`}>
            <div className="font-semibold mb-2">Gantt (sim time)</div>
            <div className="flex gap-2 items-center overflow-x-auto pb-2">
              {gantt.length === 0 && <div className="text-xs text-gray-400">No gantt entries yet</div>}
              {gantt.map((g, idx) => {
                const width = Math.max(1, (g.end ? (g.end - g.start) : 1));
                const proc = processes.find(p => p.id === g.pid) || {};
                const color = colorMap[proc.state || "waiting"];
                return (
                  <div key={idx} className="flex-shrink-0">
                    <div style={{ minWidth: 28 * width }} className="rounded-lg p-2 text-center text-white font-semibold" onClick={() => setSelectedPid(g.pid)} >
                      <div style={{ background: color, padding: "6px 8px", borderRadius: 8 }}>
                        <div>{proc.name ?? `P${g.pid}`}</div>
                        <div className="text-xs">{g.start}{g.end ? ` - ${g.end}` : " - ..."}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="col-span-3">
          <div className={`${cardBase}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Completed</div>
              <div className="text-xs text-gray-500">Done sequence</div>
            </div>

            <div className="flex flex-col gap-2">
              {processes.filter(p => p.remaining === 0).map(p => (
                <motion.div key={p.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between p-2 rounded border bg-[#f0fff6] cursor-pointer" onClick={() => setSelectedPid(p.id)}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 44, height: 44, background: "#10B981", borderRadius: 10 }} className="flex items-center justify-center text-white font-semibold">{p.name}</div>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-500">Turnaround: {p.completionTime != null ? (p.completionTime - p.arrival) : "-"}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">{p.completionTime ?? "-"}</div>
                </motion.div>
              ))}

              {processes.filter(p => p.remaining === 0).length === 0 && <div className="text-xs text-gray-400">No completed processes yet</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Results table (fade-in when all done) */}
      <div className="mt-6">
        <AnimatePresence>
          {allDone && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`${cardBase}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">Results</h3>
                  <div className="text-xs text-gray-500">Completion / Turnaround / Waiting / Response</div>
                </div>
                <div className="text-sm text-gray-600">Avg Turnaround: {(() => {
                  const finished = results.filter(r => r.completion !== "-");
                  const sum = finished.reduce((s, r) => s + Number(r.turnaround), 0);
                  return finished.length ? (sum / finished.length).toFixed(2) : "-";
                })()}</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="p-2">Process</th>
                      <th className="p-2">Arrival</th>
                      <th className="p-2">Burst</th>
                      <th className="p-2">Priority</th>
                      <th className="p-2">Completion</th>
                      <th className="p-2">Turnaround</th>
                      <th className="p-2">Waiting</th>
                      <th className="p-2">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.id} className="border-t">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.arrival}</td>
                        <td className="p-2">{r.burst}</td>
                        <td className="p-2">{r.priority}</td>
                        <td className="p-2">{r.completion}</td>
                        <td className="p-2">{r.turnaround}</td>
                        <td className="p-2">{r.waiting}</td>
                        <td className="p-2">{r.response}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------------
   Subcomponents
   ------------------------- */

function AddProcessForm({ onAdd }) {
  const [arrival, setArrival] = useState(0);
  const [burst, setBurst] = useState(4);
  const [priority, setPriority] = useState(0);

  return (
    <div>
      <div className="font-semibold mb-2">Add Process</div>
      <div className="flex gap-2">
        <input className="p-2 rounded border flex-1" type="number" value={arrival} onChange={e => setArrival(Number(e.target.value||0))} placeholder="Arrival" min={0} />
        <input className="p-2 rounded border w-20" type="number" value={burst} onChange={e => setBurst(Number(e.target.value||1))} placeholder="Burst" min={1} />
        <input className="p-2 rounded border w-20" type="number" value={priority} onChange={e => setPriority(Number(e.target.value||0))} placeholder="Prio" min={0} />
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => { onAdd(arrival, burst, priority); setArrival(0); setBurst(4); setPriority(0); }} className="p-2 rounded bg-[#10B981] text-white flex-1">Add</button>
        <button onClick={() => { setArrival(0); setBurst(4); setPriority(0); }} className="p-2 rounded bg-gray-100 border">Reset</button>
      </div>
      <div className="mt-2 text-xs text-gray-500">Enter arrival, burst and priority (priority lower number = higher priority).</div>

      {/* quick sample buttons */}
      <div className="mt-3 flex gap-2">
        <button onClick={() => { onAdd(0, 4, 0); onAdd(1, 3, 1); onAdd(2, 2, 2); }} className="text-xs p-1 rounded bg-[#eef2ff] border">Add sample 3</button>
        <button onClick={() => { onAdd(0, 5, 2); onAdd(2, 3, 1); onAdd(4, 1, 0); }} className="text-xs p-1 rounded bg-[#eef2ff] border">Add sample alt</button>
      </div>
    </div>
  );
}

function ProgressBar({ pid, processes, gantt }) {
  if (!pid) return <div className="h-3 rounded bg-gray-200" />;
  const p = processes.find(x => x.id === pid);
  if (!p) return <div className="h-3 rounded bg-gray-200" />;

  const progress = p.burst === 0 ? 1 : (p.burst - p.remaining) / p.burst;
  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">Progress</div>
      <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
        <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: "#F59E0B" }} />
      </div>
      <div className="text-xs text-gray-500 mt-1">Remaining: {p.remaining} / {p.burst}</div>
    </div>
  );
}
