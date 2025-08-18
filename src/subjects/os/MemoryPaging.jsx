import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * PageReplacement.jsx
 * Interactive visualizer for page replacement algorithms: FIFO, LRU, Optimal, LFU
 * Now with cyber grid theme and glassy cards.
 */

const ALGORITHMS = ["FIFO", "LRU", "Optimal", "LFU"];

function parseReferenceString(s) {
  if (!s) return [];
  return s.trim().split(/[ ,]+/).filter(Boolean).map(x => (isNaN(Number(x)) ? x : Number(x)));
}

// ------------- Algorithm simulators --------------
function simulateFIFO(refs, framesCount) {
  const frames = Array(framesCount).fill(null);
  const queue = [];
  const steps = [];
  refs.forEach(page => {
    const inFrame = frames.includes(page);
    let fault = false, evicted = null;
    if (!inFrame) {
      fault = true;
      const emptyIndex = frames.findIndex(x => x === null);
      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
        queue.push(emptyIndex);
      } else {
        const evictIndex = queue.shift();
        evicted = frames[evictIndex];
        frames[evictIndex] = page;
        queue.push(evictIndex);
      }
    }
    steps.push({ request: page, frames: [...frames], fault, evicted });
  });
  return steps;
}

function simulateLRU(refs, framesCount) {
  const frames = Array(framesCount).fill(null);
  const lastUsed = new Map();
  const steps = [];
  let time = 0;
  refs.forEach(page => {
    const inFrame = frames.includes(page);
    let fault = false, evicted = null;
    if (inFrame) {
      lastUsed.set(page, time);
    } else {
      fault = true;
      const emptyIndex = frames.findIndex(x => x === null);
      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
        lastUsed.set(page, time);
      } else {
        let lruPage = null, lruTime = Infinity, evictIndex = -1;
        frames.forEach((p, idx) => {
          const lu = lastUsed.has(p) ? lastUsed.get(p) : -Infinity;
          if (lu < lruTime) { lruTime = lu; lruPage = p; evictIndex = idx; }
        });
        evicted = frames[evictIndex];
        lastUsed.delete(evicted);
        frames[evictIndex] = page;
        lastUsed.set(page, time);
      }
    }
    steps.push({ request: page, frames: [...frames], fault, evicted });
    time += 1;
  });
  return steps;
}

function simulateOptimal(refs, framesCount) {
  const frames = Array(framesCount).fill(null);
  const steps = [];
  for (let i = 0; i < refs.length; i++) {
    const page = refs[i];
    const inFrame = frames.includes(page);
    let fault = false, evicted = null;
    if (!inFrame) {
      fault = true;
      const emptyIndex = frames.findIndex(x => x === null);
      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
      } else {
        const distances = frames.map(p => {
          let dist = Infinity;
          for (let k = i + 1; k < refs.length; k++) {
            if (refs[k] === p) { dist = k - i; break; }
          }
          return dist;
        });
        let maxDist = -1, evictIndex = 0;
        distances.forEach((d, idx) => { if (d > maxDist) { maxDist = d; evictIndex = idx; } });
        evicted = frames[evictIndex];
        frames[evictIndex] = page;
      }
    }
    steps.push({ request: page, frames: [...frames], fault, evicted });
  }
  return steps;
}

function simulateLFU(refs, framesCount) {
  const frames = Array(framesCount).fill(null);
  const freq = new Map();
  const steps = [];
  refs.forEach(page => {
    freq.set(page, (freq.get(page) || 0) + 1);
    const inFrame = frames.includes(page);
    let fault = false, evicted = null;
    if (!inFrame) {
      fault = true;
      const emptyIndex = frames.findIndex(x => x === null);
      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
      } else {
        let minFreq = Infinity, evictIndex = 0;
        frames.forEach((p, idx) => {
          const f = freq.get(p) || 0;
          if (f < minFreq) { minFreq = f; evictIndex = idx; }
        });
        evicted = frames[evictIndex];
        frames[evictIndex] = page;
      }
    }
    steps.push({ request: page, frames: [...frames], fault, evicted });
  });
  return steps;
}

// ------------------- Component -------------------
export default function PageReplacement() {
  const [algo, setAlgo] = useState(ALGORITHMS[0]);
  const [framesCount, setFramesCount] = useState(3);
  const [refString, setRefString] = useState("7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2");
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [tickMs, setTickMs] = useState(600);
  const timerRef = useRef(null);

  const parsedRefs = useMemo(() => parseReferenceString(refString), [refString]);

  useEffect(() => {
    setSteps([]);
    setCurrentStep(0);
    setIsRunning(false);
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, [algo, framesCount, refString]);

  function computeSteps() {
    const refs = parsedRefs;
    let s = [];
    if (algo === "FIFO") s = simulateFIFO(refs, framesCount);
    if (algo === "LRU") s = simulateLRU(refs, framesCount);
    if (algo === "Optimal") s = simulateOptimal(refs, framesCount);
    if (algo === "LFU") s = simulateLFU(refs, framesCount);
    setSteps(s);
    setCurrentStep(0);
    setIsRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function play() {
    if (!steps || steps.length === 0) return;
    setIsRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, Math.max(50, tickMs));
  }

  function pause() {
    setIsRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function stepForward() { setCurrentStep(s => Math.min((steps.length - 1), s + 1)); }
  function stepBack() { setCurrentStep(s => Math.max(0, s - 1)); }
  function reset() { pause(); setCurrentStep(0); setSteps([]); }

  function exportCSV() {
    if (!steps || steps.length === 0) return;
    const header = ["Request", ...Array.from({ length: framesCount }, (_, i) => `Frame${i}`), "Fault", "Evicted"];
    const lines = [header.join(",")];
    steps.forEach(st => {
      const row = [st.request, ...st.frames.map(x => (x === null ? "-" : x)), st.fault ? "1" : "0", st.evicted ?? "-"];
      lines.push(row.join(","));
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "page-replacement-results.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const totalFaults = steps.reduce((s, st) => s + (st.fault ? 1 : 0), 0);
  const current = steps[currentStep] || null;

  // Apply cyber grid background
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid", "animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => document.body.classList.remove("bg-cyber-grid", "animate-cyber-grid", "animate-cyber-grid-pulse");
  }, []);

  return (
    <div className="relative min-h-screen font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />
      <div className="relative z-10 w-full min-h-screen p-6 max-w-6xl mx-auto">
        <div className="flex gap-6 mb-8 flex-col md:flex-row">
          {/* Left controls */}
          <div className="rounded-2xl glass-card bg-black/70 border border-cyan-300/25 shadow-lg p-5 min-w-[350px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-cyan-300">Page Replacement</h3>
              <div className="text-xs text-cyan-400">Simulator</div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-cyan-200">Algorithm</label>
              <select className="p-2 rounded-xl border bg-black/60 border-cyan-200 text-cyan-100" value={algo} onChange={e => setAlgo(e.target.value)}>
                {ALGORITHMS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <label className="text-xs text-cyan-200">Frames</label>
              <input type="number" min={1} max={12} value={framesCount} onChange={e => setFramesCount(Math.max(1, Math.min(12, Number(e.target.value || 3))))} className="p-2 rounded-xl border bg-black/60 border-cyan-200 text-cyan-100" />
              <label className="text-xs text-cyan-200">Reference string (space or comma separated)</label>
              <textarea value={refString} onChange={e => setRefString(e.target.value)} className="p-2 rounded-xl border bg-black/60 border-cyan-200 text-cyan-100 h-20" />
              <div className="flex gap-2 mt-2">
                <button onClick={computeSteps} className="flex-1 p-2 rounded-xl bg-indigo-600 text-white font-semibold shadow">Simulate</button>
                <button onClick={reset} className="p-2 rounded-xl bg-white/10 border border-cyan-200 text-cyan-100">Reset</button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-cyan-200">
                <div>Tick (ms)</div>
                <input type="range" min={50} max={1500} value={tickMs} onChange={e => setTickMs(Number(e.target.value))} />
                <div>{tickMs} ms</div>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={play} disabled={!steps || steps.length === 0 || isRunning} className="p-2 rounded-xl bg-cyan-400 text-black flex-1 shadow font-semibold">Play</button>
                <button onClick={pause} disabled={!isRunning} className="p-2 rounded-xl bg-white/10 border border-cyan-200 text-cyan-100">Pause</button>
                <button onClick={stepBack} className="p-2 rounded-xl bg-white/10 border border-cyan-200 text-cyan-100">Step &lt;</button>
                <button onClick={stepForward} className="p-2 rounded-xl bg-white/10 border border-cyan-200 text-cyan-100">Step &gt;</button>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={exportCSV} className="p-2 rounded-xl bg-emerald-500 text-black flex-1 shadow font-semibold">Export CSV</button>
                <div className="p-2 rounded-xl bg-black/50 border text-sm text-cyan-100 shadow">Faults: <strong className="text-amber-400">{totalFaults}</strong></div>
              </div>
            </div>
          </div>
          {/* Visualization */}
          <div className="flex-1 rounded-2xl glass-card bg-black/70 border border-cyan-400/20 shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-bold text-cyan-200">Visualization</div>
                <div className="text-xs text-cyan-400">
                  Step {currentStep + 1} / {steps.length || 0}
                </div>
              </div>
              <div className="text-xs text-cyan-300">
                Request: <strong className="ml-1">{current ? String(current.request) : "-"}</strong>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* Frames panel */}
              <div className="col-span-2">
                <div className="rounded-lg border border-cyan-900/20 p-3 bg-black/40">
                  <div className="flex gap-2 items-center mb-2">
                    <div className="text-sm font-semibold text-cyan-300">Frames</div>
                    <div className="text-xs text-cyan-400">(step-through)</div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {Array.from({ length: framesCount }).map((_, idx) => {
                      const value = current ? current.frames[idx] : null;
                      return (
                        <motion.div key={idx} layout initial={{ opacity: 0.8 }} animate={{ opacity: 1 }} className="flex items-center justify-between p-3 rounded-lg border border-cyan-900/15 bg-black/50">
                          <div className="flex items-center gap-3">
                            <div style={{ width: 48, height: 48, background: value === null ? '#182b40' : '#222e39', borderRadius: 8, border: "2px solid #4B6CB7" }} className="flex items-center justify-center font-semibold text-cyan-200">
                              {value === null ? '-' : String(value)}
                            </div>
                            <div>
                              <div className="text-sm text-cyan-200">Frame {idx}</div>
                              <div className="text-xs text-cyan-400">{value === null ? 'empty' : `page ${value}`}</div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-sm">
                    {current ? (
                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${current.fault ? 'bg-[#fff4e6] text-[#F59E0B]' : 'bg-[#eefcf6] text-[#10B981]'}`}>{current.fault ? 'Page Fault' : 'Hit'}</div>
                        {current.evicted != null && (
                          <div className="text-xs text-cyan-400">Evicted: <span className="font-semibold">{current.evicted}</span></div>
                        )}
                      </div>
                    ) : <div className="text-xs text-cyan-400">No step computed</div>}
                  </div>
                </div>
              </div>
              {/* Timeline */}
              <div>
                <div className="rounded-lg border border-cyan-900/20 bg-black/40 p-3">
                  <div className="text-sm font-semibold mb-2 text-cyan-300">Timeline</div>
                  <div className="overflow-x-auto">
                    <div className="flex gap-2">
                      {steps.length === 0 && <div className="text-xs text-cyan-400">No simulation yet</div>}
                      {steps.map((st, i) => (
                        <div key={i} className={`p-2 rounded-lg text-center min-w-[64px] ${i === currentStep ? 'ring-2 ring-cyan-400 bg-cyan-900/30' : 'border border-cyan-900/10 bg-black/60 text-cyan-200'}`}>
                          <div className="text-sm font-semibold">{String(st.request)}</div>
                          <div className={`text-xs ${st.fault ? 'text-amber-400' : 'text-emerald-400'}`}>{st.fault ? 'F' : 'H'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-cyan-400">Legend: <span className="ml-2 px-1 py-0.5 bg-[#fff4e6] text-[#F59E0B] rounded">F</span> = Fault, <span className="ml-2 px-1 py-0.5 bg-[#eefcf6] text-[#10B981] rounded">H</span> = Hit</div>
                </div>
                {/* summary */}
                <div className="rounded-lg border border-cyan-900/20 bg-black/40 p-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-cyan-300">Summary</div>
                    <div className="text-xs text-cyan-400">Total faults: <strong className="text-amber-400">{totalFaults}</strong></div>
                  </div>
                  <div className="text-xs text-cyan-400">Reference: <span className="font-mono">{parsedRefs.join(', ')}</span></div>
                  <div className="mt-2 text-xs">
                    {steps.length > 0 ? (
                      <table className="w-full text-xs table-auto border">
                        <thead>
                          <tr className="text-left text-cyan-400"><th className="p-1">Step</th><th className="p-1">Req</th><th className="p-1">Fault</th><th className="p-1">Evicted</th></tr>
                        </thead>
                        <tbody>
                          {steps.map((st, i) => (
                            <tr key={i} className={`border-t border-cyan-900/15 ${i === currentStep ? 'bg-cyan-900/20' : ''}`} onClick={() => setCurrentStep(i)}>
                              <td className="p-1">{i + 1}</td>
                              <td className="p-1">{String(st.request)}</td>
                              <td className="p-1">{st.fault ? 'Yes' : 'No'}</td>
                              <td className="p-1">{st.evicted == null ? '-' : String(st.evicted)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <div className="text-xs text-cyan-400">No steps computed — click Simulate</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
