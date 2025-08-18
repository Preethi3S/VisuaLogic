import React, { useEffect, useMemo, useRef, useState } from "react";

const ALGOS = ["FCFS", "RR", "SJF", "PRIORITY"];

function createThread(id, arrival = 0, burst = 5, priority = 0) {
  return {
    id,
    name: `T${id}`,
    arrival: Number(arrival),
    burst: Number(burst),
    remaining: Number(burst),
    priority: Number(priority),
    start: null,
    completion: null,
    state: "ready",
  };
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function ThreadScheduling() {
  const [threads, setThreads] = useState([
    createThread(1, 0, 6, 0),
    createThread(2, 1, 4, 1),
    createThread(3, 2, 3, 2),
  ]);
  const nextId = useRef(4);

  const [algo, setAlgo] = useState("FCFS");
  const [preemptive, setPreemptive] = useState(false);
  const [quantum, setQuantum] = useState(2);
  const [cores, setCores] = useState(2);
  const [tickMs, setTickMs] = useState(450);
  const [contextSwitchMs, setContextSwitchMs] = useState(1);

  const simRef = useRef({
    time: 0,
    coreAssigned: Array(8).fill(null),
    coreQuantumUsed: Array(8).fill(0),
    timeline: [],
  });

  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);
  const [gantt, setGantt] = useState([]);

  useEffect(() => {
    simRef.current.coreAssigned = Array(Math.max(1, cores)).fill(null);
    simRef.current.coreQuantumUsed = Array(Math.max(1, cores)).fill(0);
  }, [cores]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        tick();
      }, clamp(tickMs, 50, 2000));
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, algo, preemptive, quantum, tickMs, cores, contextSwitchMs]);

  // Apply static cyber grid background, no animation
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => {
      document.body.classList.remove("bg-cyber-grid");
    };
  }, []);

  function addThread(arr = 0, burst = 4, pri = 0) {
    const id = nextId.current++;
    const t = createThread(id, arr, burst, pri);
    setThreads((prev) => [...prev, t].sort((a, b) => a.arrival - b.arrival || a.id - b.id));
  }

  function removeThread(id) {
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }

  function resetSimulation(full = false) {
    setIsRunning(false);
    clearInterval(timerRef.current);
    simRef.current = {
      time: 0,
      coreAssigned: Array(Math.max(1, cores)).fill(null),
      coreQuantumUsed: Array(Math.max(1, cores)).fill(0),
      timeline: [],
    };
    setGantt([]);
    setThreads((prev) =>
      prev.map((t) => ({
        ...t,
        remaining: t.burst,
        start: null,
        completion: null,
        state: t.arrival === 0 ? "ready" : "waiting",
      }))
    );
    if (full) {
      setThreads([]);
      nextId.current = 1;
    }
  }

  function pickNextForCore(coreIndex, snapshot) {
    const time = simRef.current.time;
    const ready = snapshot.filter((t) => t.arrival <= time && t.remaining > 0);
    if (!ready.length) return null;

    if (algo === "FCFS") return ready.sort((a, b) => a.arrival - b.arrival || a.id - b.id)[0];
    if (algo === "SJF") {
      if (preemptive) return ready.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival)[0];
      else return ready.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival)[0];
    }
    if (algo === "PRIORITY") return ready.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival)[0];
    if (algo === "RR") {
      if (!simRef.current.rrQueue) simRef.current.rrQueue = [];
      const toAdd = ready.map((r) => r.id).filter((id) => !simRef.current.rrQueue.includes(id));
      simRef.current.rrQueue.push(...toAdd);
      simRef.current.rrQueue = simRef.current.rrQueue.filter((id) => {
        const t = snapshot.find((x) => x.id === id);
        return t && t.remaining > 0 && t.arrival <= time;
      });
      if (!simRef.current.rrQueue.length) return null;
      const pid = simRef.current.rrQueue[0];
      return snapshot.find((p) => p.id === pid);
    }
    return ready[0];
  }

  function tick() {
    let snapshot;
    setThreads((prev) => {
      snapshot = prev.map((t) => ({ ...t }));
      return prev;
    });
    const s = simRef.current;
    const time = s.time;

    setThreads((prev) => prev.map(t => (t.arrival <= time && t.remaining > 0 ? { ...t, state: 'ready' } : t)));

    for (let c = 0; c < cores; c++) {
      const assignedId = s.coreAssigned[c];
      if (assignedId == null) {
        const next = pickNextForCore(c, snapshot);
        if (next) {
          s.coreAssigned[c] = next.id;
          s.coreQuantumUsed[c] = 0;
          setGantt((g) => [...g, { core: c, threadId: next.id, start: time, end: null }]);
          setThreads((prev) => prev.map(t => t.id === next.id ? { ...t, start: t.start == null ? time : t.start, state: 'running' } : t));
        }
      }

      const runningId = s.coreAssigned[c];
      if (runningId != null) {
        setThreads((prev) => prev.map(t => {
          if (t.id !== runningId) return t;
          const newRem = Math.max(0, t.remaining - 1);
          const updates = { ...t, remaining: newRem, state: newRem === 0 ? 'finished' : 'running' };
          if (newRem === 0) {
            updates.completion = time + 1;
            setGantt((g) => {
              const g2 = [...g];
              for (let i = g2.length - 1; i >= 0; i--) {
                if (g2[i].core === c && g2[i].threadId === runningId && g2[i].end == null) {
                  g2[i] = { ...g2[i], end: time + 1 };
                  break;
                }
              }
              return g2;
            });
            s.coreAssigned[c] = null;
            if (algo === 'RR') {
              s.rrQueue = (s.rrQueue || []).filter(x => x !== runningId);
              s.coreQuantumUsed[c] = 0;
            }
          } else {
            if (algo === 'RR') {
              s.coreQuantumUsed[c] = (s.coreQuantumUsed[c] || 0) + 1;
              if (s.coreQuantumUsed[c] >= Math.max(1, Number(quantum))) {
                s.coreQuantumUsed[c] = 0;
                s.rrQueue = (s.rrQueue || []).filter(x => x !== runningId);
                s.rrQueue.push(runningId);
                setGantt((g) => {
                  const g2 = [...g];
                  for (let i = g2.length - 1; i >= 0; i--) {
                    if (g2[i].core === c && g2[i].threadId === runningId && g2[i].end == null) {
                      g2[i] = { ...g2[i], end: time + 1 };
                      break;
                    }
                  }
                  return g2;
                });
                s.coreAssigned[c] = null;
              }
            }
          }
          return updates;
        }));
      }
    }

    s.time += 1;
  }

  const finishedCount = threads.filter(t => t.remaining === 0).length;
  const allDone = threads.length > 0 && finishedCount === threads.length;
  const results = useMemo(
    () => threads.map(t => ({
      id: t.id,
      name: t.name,
      arrival: t.arrival,
      burst: t.burst,
      completion: t.completion,
      turnaround: t.completion != null ? t.completion - t.arrival : "-",
      waiting: t.completion != null ? t.completion - t.arrival - t.burst : "-",
    })),
    [threads]
  );

  function exportCSV() {
    const header = ['id,name,arrival,burst,completion,turnaround,waiting'];
    const lines = [header.join(',')];
    results.forEach(r => 
      lines.push([r.id, r.name, r.arrival, r.burst, r.completion ?? '-', r.turnaround, r.waiting].join(','))
    );
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = 'thread-sched.csv'; 
    document.body.appendChild(a); 
    a.click(); 
    a.remove(); 
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative min-h-screen font-sans">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 min-h-screen">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="rounded-2xl glass-card bg-black/70 border border-cyan-300/25 shadow-lg p-5 min-w-[350px]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-cyan-300">Thread Scheduling</h3>
              <div className="text-xs text-cyan-400">Sim time: <strong>{simRef.current.time}</strong></div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-cyan-200">Algorithm</label>
              <select
                value={algo}
                onChange={e => setAlgo(e.target.value)}
                className="p-2 rounded-xl border border-cyan-300 bg-black/60 text-cyan-100"
              >
                {ALGOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <label className="text-xs text-cyan-200">Cores</label>
              <input
                type="number"
                min={1}
                max={8}
                value={cores}
                onChange={e => setCores(clamp(Number(e.target.value || 1), 1, 8))}
                className="p-2 rounded-xl border border-cyan-300 bg-black/60 text-cyan-100"
              />
              <label className="text-xs text-cyan-200">Context switch cost (ticks)</label>
              <input
                type="number"
                min={0}
                max={10}
                value={contextSwitchMs}
                onChange={e => setContextSwitchMs(clamp(Number(e.target.value || 1), 0, 10))}
                className="p-2 rounded-xl border border-cyan-300 bg-black/60 text-cyan-100"
              />
              {algo === 'RR' && (
                <>
                  <label className="text-xs text-cyan-200">Quantum (time units)</label>
                  <input
                    type="number"
                    min={1}
                    value={quantum}
                    onChange={e => setQuantum(clamp(Number(e.target.value || 1), 1, 100))}
                    className="p-2 rounded-xl border border-cyan-300 bg-black/60 text-cyan-100"
                  />
                </>
              )}
              <label className="text-xs text-cyan-200">Tick speed (ms per time unit)</label>
              <input
                type="range"
                min="75"
                max="1200"
                value={tickMs}
                onChange={e => setTickMs(Number(e.target.value))}
                className="accent-cyan-400"
              />
              <div className="text-xs text-cyan-400">Current: {tickMs} ms</div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsRunning(true)}
                  className="flex-1 p-2 rounded-xl bg-indigo-600 text-white font-semibold shadow"
                >
                  Start
                </button>
                <button
                  onClick={() => setIsRunning(false)}
                  className="flex-1 p-2 rounded-xl bg-white/10 text-cyan-200 border border-cyan-300 font-semibold"
                >
                  Pause
                </button>
                <button
                  onClick={() => resetSimulation(false)}
                  className="p-2 rounded-xl bg-rose-500 text-white font-semibold"
                >
                  Reset
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => addThread(0, Math.floor(Math.random()*8)+2, Math.floor(Math.random()*3))}
                  className="p-2 rounded-xl bg-emerald-500 text-black font-semibold flex-1 shadow"
                >
                  Add Random Thread
                </button>
                <button
                  onClick={() => { setThreads([]); nextId.current = 1; resetSimulation(true); }}
                  className="p-2 rounded-xl bg-white/10 border border-cyan-300 text-cyan-200"
                >
                  Clear
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={exportCSV}
                  className="p-2 rounded-xl bg-amber-400 text-black font-semibold"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl glass-card bg-black/70 border border-cyan-400/20 shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-cyan-300">Cores & Timeline</h3>
                <div className="text-xs text-cyan-400">
                  Cores: {cores} • Algorithm: {algo} • Preemptive: {String(preemptive)}
                </div>
              </div>
              <div className="text-xs text-cyan-400">
                Completed: {finishedCount}/{threads.length}
              </div>
            </div>
            <div className="mb-3">
              <div className="grid gap-2">
                {Array.from({ length: cores }).map((_, c) => (
                  <div
                    key={c}
                    className="rounded-lg border border-cyan-700/30 bg-black/50 p-2"
                  >
                    <div className="text-sm font-semibold mb-1 text-cyan-300">
                      Core {c}
                    </div>
                    <div className="flex gap-1 items-center overflow-x-auto">
                      {gantt.filter(g => g.core === c).length === 0 && (
                        <div className="text-xs text-cyan-500">No timeline yet</div>
                      )}
                      {gantt.filter(g => g.core === c).map((g, idx) => (
                        <div
                          key={idx}
                          className="p-1 bg-cyan-300 text-black rounded text-xs border border-cyan-400 font-semibold whitespace-nowrap"
                          style={{ minWidth: Math.max(28, (g.end ? (g.end - g.start) : 1) * 18) }}
                        >
                          {`T${g.threadId} ${g.start}${g.end ? ` - ${g.end}` : " - ..."}`}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-cyan-700/30 bg-black/50 p-3 text-cyan-200">
              <div className="text-sm font-semibold mb-2">Threads</div>
              <div className="overflow-auto max-h-56">
                <table className="w-full text-sm table-auto">
                  <thead>
                    <tr className="text-left text-cyan-400">
                      <th className="p-2">Thread</th>
                      <th className="p-2">Arrival</th>
                      <th className="p-2">Burst</th>
                      <th className="p-2">Remaining</th>
                      <th className="p-2">Priority</th>
                      <th className="p-2">State</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {threads.map(t => (
                      <tr key={t.id} className="border-t border-cyan-700/20">
                        <td className="p-2">{t.name}</td>
                        <td className="p-2">{t.arrival}</td>
                        <td className="p-2">{t.burst}</td>
                        <td className="p-2">{t.remaining}</td>
                        <td className="p-2">{t.priority}</td>
                        <td className="p-2">{t.state}</td>
                        <td className="p-2">
                          <button
                            onClick={() => removeThread(t.id)}
                            className="text-xs bg-rose-400 p-1 rounded text-white"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-cyan-700/30 bg-black/50 p-3 text-cyan-200">
              <div className="text-sm font-semibold mb-2">Results</div>
              {allDone ? (
                <div className="text-xs text-cyan-100">
                  <div>All threads finished.</div>
                  <div className="mt-2 overflow-auto max-h-56">
                    <table className="w-full text-sm table-auto">
                      <thead>
                        <tr className="text-left text-cyan-400">
                          <th className="p-1">Thread</th>
                          <th className="p-1">Arrival</th>
                          <th className="p-1">Burst</th>
                          <th className="p-1">Completion</th>
                          <th className="p-1">Turnaround</th>
                          <th className="p-1">Waiting</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map(r => (
                          <tr key={r.id} className="border-t border-cyan-700/20">
                            <td className="p-1">{r.name}</td>
                            <td className="p-1">{r.arrival}</td>
                            <td className="p-1">{r.burst}</td>
                            <td className="p-1">{r.completion}</td>
                            <td className="p-1">{r.turnaround}</td>
                            <td className="p-1">{r.waiting}</td>
                          </tr>  
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-cyan-400">
                  Simulation in progress or not yet computed.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
