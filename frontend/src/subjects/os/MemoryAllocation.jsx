import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MemoryAllocation.jsx
 * Visualizer for contiguous memory allocation strategies and the buddy allocator.
 * Algorithms: First Fit, Best Fit, Worst Fit, Next Fit, Buddy System (power-of-two splitting)
 */

const ALGORITHMS = ["First Fit", "Best Fit", "Worst Fit", "Next Fit", "Buddy"];

// Helper: format bytes/units
function formatSize(n) {
  if (n >= 1024) return `${(n / 1024).toFixed(2)} MB`;
  return `${n} KB`;
}

// Represent memory as a list of segments { start, size, pid|null }
function makeInitialMemory(total) {
  return [{ start: 0, size: total, pid: null }];
}

// Deep copy segments
function cloneSegments(segs) {
  return segs.map(s => ({ ...s }));
}

// -------- Allocation simulators --------
function simulateFirstFit(initialSegs, requests) {
  const steps = [];
  let segs = cloneSegments(initialSegs);
  requests.forEach(req => {
    const { pid, size } = req;
    const before = cloneSegments(segs);
    let allocated = false;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (s.pid === null && s.size >= size) {
        const allocatedSeg = { start: s.start, size, pid };
        const remainingSize = s.size - size;
        if (remainingSize > 0) {
          const remainingSeg = { start: s.start + size, size: remainingSize, pid: null };
          segs.splice(i, 1, allocatedSeg, remainingSeg);
        } else {
          segs.splice(i, 1, allocatedSeg);
        }
        allocated = true;
        break;
      }
    }
    steps.push({ action: 'alloc', pid, size, beforeSegments: before, afterSegments: cloneSegments(segs), allocated });
  });
  return steps;
}

function simulateBestFit(initialSegs, requests) {
  const steps = [];
  let segs = cloneSegments(initialSegs);
  requests.forEach(req => {
    const { pid, size } = req;
    const before = cloneSegments(segs);
    let bestIdx = -1, bestSize = Infinity, allocated = false;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (s.pid === null && s.size >= size && s.size < bestSize) {
        bestSize = s.size; bestIdx = i;
      }
    }
    if (bestIdx !== -1) {
      const s = segs[bestIdx];
      const allocatedSeg = { start: s.start, size, pid };
      const remainingSize = s.size - size;
      if (remainingSize > 0) {
        const remainingSeg = { start: s.start + size, size: remainingSize, pid: null };
        segs.splice(bestIdx, 1, allocatedSeg, remainingSeg);
      } else {
        segs.splice(bestIdx, 1, allocatedSeg);
      }
      allocated = true;
    }
    steps.push({ action: 'alloc', pid, size, beforeSegments: before, afterSegments: cloneSegments(segs), allocated });
  });
  return steps;
}

function simulateWorstFit(initialSegs, requests) {
  const steps = [];
  let segs = cloneSegments(initialSegs);
  requests.forEach(req => {
    const { pid, size } = req;
    const before = cloneSegments(segs);
    let worstIdx = -1, worstSize = -1, allocated = false;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (s.pid === null && s.size >= size && s.size > worstSize) {
        worstSize = s.size; worstIdx = i;
      }
    }
    if (worstIdx !== -1) {
      const s = segs[worstIdx];
      const allocatedSeg = { start: s.start, size, pid };
      const remainingSize = s.size - size;
      if (remainingSize > 0) {
        const remainingSeg = { start: s.start + size, size: remainingSize, pid: null };
        segs.splice(worstIdx, 1, allocatedSeg, remainingSeg);
      } else {
        segs.splice(worstIdx, 1, allocatedSeg);
      }
      allocated = true;
    }
    steps.push({ action: 'alloc', pid, size, beforeSegments: before, afterSegments: cloneSegments(segs), allocated });
  });
  return steps;
}

function simulateNextFit(initialSegs, requests) {
  const steps = [];
  let segs = cloneSegments(initialSegs);
  let lastIndex = 0;
  requests.forEach(req => {
    const { pid, size } = req;
    const before = cloneSegments(segs);
    let allocated = false;
    const n = segs.length;
    for (let offset = 0; offset < n; offset++) {
      const i = (lastIndex + offset) % n;
      const s = segs[i];
      if (s.pid === null && s.size >= size) {
        const allocatedSeg = { start: s.start, size, pid };
        const remainingSize = s.size - size;
        if (remainingSize > 0) {
          const remainingSeg = { start: s.start + size, size: remainingSize, pid: null };
          segs.splice(i, 1, allocatedSeg, remainingSeg);
          lastIndex = i + 1;
        } else {
          segs.splice(i, 1, allocatedSeg);
          lastIndex = i + 1;
        }
        allocated = true;
        break;
      }
    }
    steps.push({ action: 'alloc', pid, size, beforeSegments: before, afterSegments: cloneSegments(segs), allocated });
  });
  return steps;
}

function nextPowerOfTwo(n) {
  let p = 1; while (p < n) p <<= 1; return p;
}

function simulateBuddy(totalSize, requests) {
  const steps = [];
  const freeList = new Map();
  function addFree(start, size) {
    if (!freeList.has(size)) freeList.set(size, []);
    freeList.get(size).push(start);
  }
  function removeFree(start, size) {
    const arr = freeList.get(size) || [];
    const idx = arr.indexOf(start);
    if (idx !== -1) arr.splice(idx, 1);
  }
  addFree(0, totalSize);
  const allocMap = {};
  requests.forEach(req => {
    const { pid, size } = req;
    const before = { free: new Map(Array.from(freeList.entries())), alloc: { ...allocMap } };
    let allocated = false;
    const need = nextPowerOfTwo(size);
    let blockSize = need;
    while (blockSize <= totalSize) {
      if (freeList.has(blockSize) && freeList.get(blockSize).length > 0) break;
      blockSize <<= 1;
    }
    if (blockSize <= totalSize && freeList.has(blockSize) && freeList.get(blockSize).length > 0) {
      let start = freeList.get(blockSize).shift();
      while (blockSize > need) {
        blockSize >>= 1;
        addFree(start + blockSize, blockSize);
      }
      allocMap[pid] = { start, size: blockSize, reqSize: size };
      allocated = true;
    }
    steps.push({ action: 'alloc', pid, size, before, after: { free: new Map(Array.from(freeList.entries())), alloc: { ...allocMap } }, allocated });
  });
  return steps;
}

// Misc helpers: free process, compact memory
function freeProcess(segs, pid) {
  const before = cloneSegments(segs);
  let segsCopy = cloneSegments(segs);
  for (let s of segsCopy) if (s.pid === pid) s.pid = null;
  const merged = [];
  for (let s of segsCopy) {
    if (merged.length === 0) merged.push({ ...s });
    else {
      const last = merged[merged.length - 1];
      if (last.pid === null && s.pid === null && last.start + last.size === s.start) {
        last.size += s.size;
      } else merged.push({ ...s });
    }
  }
  return { before, after: merged };
}

function compactMemory(segs) {
  const before = cloneSegments(segs);
  let cur = 0;
  const allocated = segs.filter(s => s.pid !== null);
  const newSegs = [];
  for (let a of allocated) {
    newSegs.push({ start: cur, size: a.size, pid: a.pid });
    cur += a.size;
  }
  const freeSize = segs.reduce((acc, s) => s.pid === null ? acc + s.size : acc, 0);
  if (freeSize > 0) newSegs.push({ start: cur, size: freeSize, pid: null });
  return { before, after: newSegs };
}

// -------------------- Component -------------------
export default function MemoryAllocation() {
  const [totalMemory, setTotalMemory] = useState(1024); // in KB
  const [segments, setSegments] = useState(() => makeInitialMemory(1024));
  const [algorithm, setAlgorithm] = useState(ALGORITHMS[0]);
  const [processes, setProcesses] = useState([]);
  const pidRef = useRef(1);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);
  const [tickMs, setTickMs] = useState(500);
  const [buddySteps, setBuddySteps] = useState([]);

  // --- cyber grid background ---
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid", "animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => {
      document.body.classList.remove("bg-cyber-grid", "animate-cyber-grid", "animate-cyber-grid-pulse");
    };
  }, []);

  useEffect(() => {
    setSegments(makeInitialMemory(totalMemory));
    setProcesses([]);
    pidRef.current = 1;
    setSteps([]);
    setStepIndex(0);
  }, [totalMemory]);

  useEffect(() => {
    if (isRunning && steps.length) {
      timerRef.current = setInterval(() => {
        setStepIndex(i => {
          if (i >= steps.length - 1) { clearInterval(timerRef.current); timerRef.current = null; setIsRunning(false); return i; }
          return i + 1;
        });
      }, Math.max(50, tickMs));
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isRunning, steps, tickMs]);

  function addProcessManual(size) {
    const pid = pidRef.current++;
    const p = { pid: `P${pid}`, size: Number(size) };
    setProcesses(prev => [...prev, p]);
  }

  function removeProcessById(pid) {
    setProcesses(prev => prev.filter(p => p.pid !== pid));
    setSegments(prev => {
      const { after } = freeProcess(prev, pid);
      return after;
    });
  }

  function computeSimulation() {
    const requests = processes.map(p => ({ pid: p.pid, size: p.size }));
    if (algorithm === 'First Fit') setSteps(simulateFirstFit(segments, requests));
    if (algorithm === 'Best Fit') setSteps(simulateBestFit(segments, requests));
    if (algorithm === 'Worst Fit') setSteps(simulateWorstFit(segments, requests));
    if (algorithm === 'Next Fit') setSteps(simulateNextFit(segments, requests));
    if (algorithm === 'Buddy') {
      const s = simulateBuddy(totalMemory, requests);
      setBuddySteps(s);
      setSteps(s.map((bs, i) => ({ action: 'buddy-step', idx: i, before: bs.before, after: bs.after, pid: bs.pid, size: bs.size, allocated: bs.allocated })));
    }
    setStepIndex(0);
    setIsRunning(false);
  }

  function applyStep(index) {
    const st = steps[index];
    if (!st) return;
    if (st.action === 'alloc') setSegments(st.afterSegments);
    // for buddy system, could render buddy-specific panel
  }

  useEffect(() => { applyStep(stepIndex); }, [stepIndex]);

  function play() { if (steps.length) setIsRunning(true); }
  function pause() { setIsRunning(false); if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
  function stepForward() { setStepIndex(i => Math.min(steps.length - 1, i + 1)); }
  function stepBack() { setStepIndex(i => Math.max(0, i - 1)); }

  function compact() {
    const { before, after } = compactMemory(segments);
    setSegments(after);
    setSteps(prev => [...prev, { action: 'compact', beforeSegments: before, afterSegments: after }]);
  }

  function randomScenario(n = 6, maxSize = Math.max(1, Math.floor(totalMemory / 4))) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      const pid = `P${pidRef.current++}`;
      arr.push({ pid, size: Math.max(1, Math.floor(Math.random() * maxSize) + 1) });
    }
    setProcesses(prev => [...prev, ...arr]);
  }

  function exportCSV() {
    const header = ['pid', 'size'];
    const lines = [header.join(',')];
    processes.forEach(p => lines.push([p.pid, p.size].join(',')));
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'memory-scenario.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  const totalFree = segments.reduce((acc, s) => s.pid === null ? acc + s.size : acc, 0);
  const externalFrag = (() => {
    if (processes.length === 0) return 0;
    const avg = processes.reduce((a, b) => a + b.size, 0) / processes.length;
    return segments.filter(s => s.pid === null && s.size < avg).reduce((a, b) => a + b.size, 0);
  })();
  // Buddy fragmentation omitted for brevity...

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />
      {/* Main Content */}
      <div className="relative z-10 w-full min-h-screen p-6 max-w-7xl mx-auto">
        <div className="flex gap-6 mb-6 flex-col md:flex-row">
          <div className="rounded-2xl glass-card bg-black/70 border border-cyan-300/25 shadow-lg p-4 min-w-[340px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-cyan-300">Memory Allocation</h3>
              <div className="text-xs text-cyan-400">Strategy: {algorithm}</div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-cyan-200">Total memory (KB)</label>
              <input type="number" min={64} max={65536} value={totalMemory} onChange={e => setTotalMemory(Math.max(64, Number(e.target.value || 1024)))} className="p-2 rounded-xl border bg-black/60 border-cyan-200 text-cyan-100" />

              <label className="text-xs text-cyan-200">Algorithm</label>
              <select value={algorithm} onChange={e => setAlgorithm(e.target.value)} className="p-2 rounded-xl border bg-black/60 border-cyan-200 text-cyan-100">
                {ALGORITHMS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <div className="flex gap-2">
                <input id="procSize" className="p-2 rounded-xl border bg-black/60 border-cyan-200 text-cyan-100 flex-1" placeholder="Process size (KB)" />
                <button onClick={() => { const el = document.getElementById('procSize'); const v = Number(el.value || 0); if (v > 0) addProcessManual(v); el.value = ''; }} className="p-2 rounded-xl bg-emerald-500 text-black shadow font-semibold">Add</button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => randomScenario(5)} className="p-2 rounded-xl bg-cyan-400 text-black font-semibold shadow">Random</button>
                <button onClick={computeSimulation} className="p-2 rounded-xl bg-indigo-600 text-white font-semibold shadow">Simulate</button>
                <button onClick={compact} className="p-2 rounded-xl bg-yellow-400 text-black font-semibold shadow">Compact</button>
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={play} className="p-2 rounded-xl bg-emerald-500 text-black flex-1 shadow font-semibold">Play</button>
                <button onClick={pause} className="p-2 rounded-xl bg-white/10 border border-cyan-300/40 text-cyan-200">Pause</button>
                <button onClick={stepBack} className="p-2 rounded-xl bg-white/10 border border-cyan-300/40 text-cyan-200">Step &lt;</button>
                <button onClick={stepForward} className="p-2 rounded-xl bg-white/10 border border-cyan-300/40 text-cyan-200">Step &gt;</button>
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={exportCSV} className="p-2 rounded-xl bg-cyan-400 text-black flex-1 font-semibold shadow">Export</button>
                <div className="p-2 rounded-xl bg-black/50 border text-sm text-cyan-100">Free: <strong>{totalFree} KB</strong></div>
              </div>

              <div className="mt-2 text-xs text-cyan-200">External fragmentation (heuristic): <span className="font-bold">{externalFrag} KB</span></div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl glass-card bg-black/70 border border-cyan-400/20 shadow p-4">
            <div className="text-sm font-bold mb-2 text-cyan-300">Processes</div>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <div className="max-h-40 overflow-auto border rounded-xl bg-black/40 p-2">
                  {processes.length === 0 && <div className="text-xs text-cyan-400">No processes</div>}
                  {processes.map(p => (
                    <div key={p.pid} className="flex items-center justify-between p-2 border-b border-cyan-700/20">
                      <div>
                        <div className="font-semibold text-cyan-200">{p.pid}</div>
                        <div className="text-xs text-cyan-400">Size: {p.size} KB</div>
                      </div>
                      <button onClick={() => removeProcessById(p.pid)} className="text-xs p-1 rounded-xl bg-rose-400 text-white">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 360 }}>
                <div className="text-sm font-bold mb-2 text-cyan-300">Steps</div>
                <div className="max-h-40 overflow-auto border rounded-xl p-2 text-xs bg-black/40">
                  {steps.length === 0 && <div className="text-xs text-cyan-400">No steps computed</div>}
                  {steps.map((st, i) => (
                    <div key={i} className={`p-1 ${i === stepIndex ? 'bg-cyan-900/30 rounded' : ''}`}>#{i + 1} {st.action} {st.pid ? ` ${st.pid}` : ''} {st.size ? `(${st.size}KB)` : ''} {st.allocated === false ? '(failed)' : ''}</div>
                  ))}
                </div>
              </div>
            </div>
            {/* Memory visualization */}
            <div className="rounded-lg border border-cyan-700/20 p-3 bg-black/50">
              <div className="text-sm font-bold mb-2 text-cyan-300">Memory</div>
              <div className="w-full border rounded-xl overflow-hidden" style={{ height: 160 }}>
                <div className="relative h-full">
                  {segments.map((seg, idx) => {
                    const leftPct = (seg.start / totalMemory) * 100;
                    const widthPct = (seg.size / totalMemory) * 100;
                    const color =
                      seg.pid === null
                        ? "#1a2742"
                        : `hsl(${(seg.pid.charCodeAt(1) * 63) % 360}, 70%, 65%)`;
                    return (
                      <motion.div
                        key={idx}
                        layout
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        className="absolute top-0 bottom-0 border-l border-cyan-500"
                      >
                        <div
                          className={`h-full flex items-center justify-center text-xs font-bold text-cyan-900`}
                          style={{ background: seg.pid === null ? "#0f1d2a" : color }}
                        >
                          {seg.pid === null
                            ? `${seg.size} KB free`
                            : `${seg.pid} • ${seg.size} KB`}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 text-xs text-cyan-400">Legend: free segments (dark) • allocated (colored)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
