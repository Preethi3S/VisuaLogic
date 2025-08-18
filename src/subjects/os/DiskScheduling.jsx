import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";


const ALGORITHMS = ["FCFS", "SSTF", "SCAN", "C-SCAN", "LOOK", "C-LOOK"];

function parseRequests(s) {
  if (!s) return [];
  return s.trim().split(/[ ,]+/).filter(Boolean).map(x => Number(x));
}

function simulateFCFS(requests, head) {
  const seq = [];
  const moves = [];
  let cur = head;
  for (const r of requests) {
    seq.push(r);
    const d = Math.abs(r - cur);
    moves.push(d);
    cur = r;
  }
  const total = moves.reduce((a,b)=>a+b,0);
  return { sequence: [head, ...seq], moves: [0, ...moves], total, avg: (moves.length? total/moves.length:0) };
}

function simulateSSTF(requests, head) {
  const remaining = [...requests];
  const seq = [];
  const moves = [];
  let cur = head;
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Math.abs(remaining[0] - cur);
    for (let i=1;i<remaining.length;i++){
      const d = Math.abs(remaining[i]-cur);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    const pick = remaining.splice(bestIdx,1)[0];
    seq.push(pick);
    moves.push(Math.abs(pick-cur));
    cur = pick;
  }
  const total = moves.reduce((a,b)=>a+b,0);
  return { sequence: [head, ...seq], moves: [0, ...moves], total, avg: (moves.length? total/moves.length:0) };
}

function simulateSCAN(requests, head, direction='right', minCylinder=0, maxCylinder=199) {
  const left = requests.filter(r => r < head).sort((a,b)=>b-a);
  const right = requests.filter(r => r >= head).sort((a,b)=>a-b);
  const seq = [];
  const moves = [];
  let cur = head;
  if (direction === 'right') {
    for (const r of right) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
    if (cur !== maxCylinder) { seq.push(maxCylinder); moves.push(Math.abs(maxCylinder-cur)); cur = maxCylinder; }
    for (const r of left) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
  } else {
    for (const r of left) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
    if (cur !== minCylinder) { seq.push(minCylinder); moves.push(Math.abs(minCylinder-cur)); cur = minCylinder; }
    for (const r of right) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
  }
  const total = moves.reduce((a,b)=>a+b,0);
  return { sequence: [head, ...seq], moves: [0, ...moves], total, avg: (moves.length? total/moves.length:0) };
}

function simulateCSCAN(requests, head, direction='right', minCylinder=0, maxCylinder=199) {
  const left = requests.filter(r => r < head).sort((a,b)=>b-a);
  const right = requests.filter(r => r >= head).sort((a,b)=>a-b);
  const seq = [];
  const moves = [];
  let cur = head;
  if (direction === 'right') {
    for (const r of right) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
    if (cur !== maxCylinder) { seq.push(maxCylinder); moves.push(Math.abs(maxCylinder-cur)); cur = maxCylinder; }
    cur = minCylinder;
    const leftAsc = left.slice().sort((a,b)=>a-b);
    for (const r of leftAsc) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
  } else {
    for (const r of left) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
    if (cur !== minCylinder) { seq.push(minCylinder); moves.push(Math.abs(minCylinder-cur)); cur = minCylinder; }
    cur = maxCylinder;
    const rightDesc = right.slice().sort((a,b)=>b-a);
    for (const r of rightDesc) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
  }
  const total = moves.reduce((a,b)=>a+b,0);
  return { sequence: [head, ...seq], moves: [0, ...moves], total, avg: (moves.length? total/moves.length:0) };
}

function simulateLOOK(requests, head, direction='right') {
  const left = requests.filter(r => r < head).sort((a,b)=>b-a);
  const right = requests.filter(r => r >= head).sort((a,b)=>a-b);
  const seq = [];
  const moves = [];
  let cur = head;
  if (direction === 'right') {
    for (const r of right) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
    for (const r of left) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
  } else {
    for (const r of left) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
    for (const r of right) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
  }
  const total = moves.reduce((a,b)=>a+b,0);
  return { sequence: [head, ...seq], moves: [0, ...moves], total, avg: (moves.length? total/moves.length:0) };
}

function simulateCLOOK(requests, head, direction='right') {
  const left = requests.filter(r => r < head).sort((a,b)=>b-a);
  const right = requests.filter(r => r >= head).sort((a,b)=>a-b);
  const seq = [];
  const moves = [];
  let cur = head;
  if (direction === 'right') {
    for (const r of right) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
    if (left.length) {
      cur = left[left.length-1] * 1;
      const leftAsc = left.slice().sort((a,b)=>a-b);
      for (const r of leftAsc) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
    }
  } else {
    for (const r of left) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
    if (right.length) {
      cur = right[0] * 1;
      const rightDesc = right.slice().sort((a,b)=>b-a);
      for (const r of rightDesc) { seq.push(r); moves.push(Math.abs(r-cur)); cur = r; }
    }
  }
  const total = moves.reduce((a,b)=>a+b,0);
  return { sequence: [head, ...seq], moves: [0, ...moves], total, avg: (moves.length? total/moves.length:0) };
}

export default function DiskScheduling() {
  const [algo, setAlgo] = useState(ALGORITHMS[0]);
  const [reqString, setReqString] = useState("98, 183, 37, 122, 14, 124, 65, 67");
  const [requests, setRequests] = useState(parseRequests(reqString));
  const [headStart, setHeadStart] = useState(53);
  const [direction, setDirection] = useState('right');
  const [minCylinder, setMinCylinder] = useState(0);
  const [maxCylinder, setMaxCylinder] = useState(199);

  const [simResult, setSimResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [tickMs, setTickMs] = useState(450);
  const timerRef = useRef(null);

  useEffect(() => { setRequests(parseRequests(reqString)); }, [reqString]);

  useEffect(() => {
    if (isRunning && simResult) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setStepIndex(i => {
          if (!simResult) return i;
          if (i >= simResult.sequence.length - 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsRunning(false);
            return i;
          }
          return i + 1;
        });
      }, Math.max(30, tickMs));
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
  }, [isRunning, simResult, tickMs]);

  function compute() {
    const reqs = parseRequests(reqString);
    let result = null;
    if (algo === 'FCFS') result = simulateFCFS(reqs, headStart);
    if (algo === 'SSTF') result = simulateSSTF(reqs, headStart);
    if (algo === 'SCAN') result = simulateSCAN(reqs, headStart, direction, minCylinder, maxCylinder);
    if (algo === 'C-SCAN') result = simulateCSCAN(reqs, headStart, direction, minCylinder, maxCylinder);
    if (algo === 'LOOK') result = simulateLOOK(reqs, headStart, direction);
    if (algo === 'C-LOOK') result = simulateCLOOK(reqs, headStart, direction);
    setSimResult(result);
    setStepIndex(0);
    setIsRunning(false);
  }

  function reset() {
    setSimResult(null);
    setStepIndex(0);
    setIsRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function play() { if (simResult) setIsRunning(true); }
  function pause() { setIsRunning(false); if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
  function stepForward() { if (!simResult) return; setStepIndex(i => Math.min(simResult.sequence.length-1, i+1)); }
  function stepBack() { if (!simResult) return; setStepIndex(i => Math.max(0, i-1)); }

  function exportCSV() {
    if (!simResult) return;
    const rows = [];
    const seq = simResult.sequence;
    const moves = simResult.moves;
    for (let i=0;i<seq.length;i++) {
      rows.push([i, seq[i], moves[i]]);
    }
    const header = ['step','cylinder','move'];
    const csv = [header.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'disk-scheduling.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  const currentCylinder = simResult ? simResult.sequence[stepIndex] : headStart;
  const currentMove = simResult ? simResult.moves[stepIndex] : 0;
  const total = simResult ? simResult.total : 0;
  const avg = simResult ? simResult.avg : 0;

  const range = Math.max(1, maxCylinder - minCylinder);

  return (
    <div className="relative min-h-screen font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />
      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-8 text-cyan-100">

        <div className="flex gap-4 flex-col md:flex-row mb-6">

          <div className="rounded-2xl glass-card bg-black/60 border border-cyan-400/30 shadow-lg p-4 min-w-[360px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-cyan-300">Disk Scheduling</h3>
              <div className="text-xs text-cyan-400">Visualizer</div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs text-cyan-300">Algorithm</label>
              <select value={algo} onChange={e => setAlgo(e.target.value)} className="p-2 rounded-xl border bg-black/70 border-cyan-400/40 text-cyan-200">
                {ALGORITHMS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <label className="text-xs text-cyan-300">Requests (space or comma)</label>
              <textarea className="p-2 rounded-xl border bg-black/70 border-cyan-400/40 text-cyan-200 h-20" value={reqString} onChange={e => setReqString(e.target.value)} />

              <label className="text-xs text-cyan-300">Initial head position</label>
              <input type="number" className="p-2 rounded-xl border bg-black/70 border-cyan-400/40 text-cyan-200" value={headStart} onChange={e => setHeadStart(Number(e.target.value || 0))} />

              <div className="flex gap-2">
                <div>
                  <label className="text-xs text-cyan-300">Min cylinder</label>
                  <input type="number" className="p-2 rounded-xl border bg-black/70 border-cyan-400/40 text-cyan-200" value={minCylinder} onChange={e => setMinCylinder(Number(e.target.value || 0))} />
                </div>
                <div>
                  <label className="text-xs text-cyan-300">Max cylinder</label>
                  <input type="number" className="p-2 rounded-xl border bg-black/70 border-cyan-400/40 text-cyan-200" value={maxCylinder} onChange={e => setMaxCylinder(Number(e.target.value || 199))} />
                </div>
              </div>

              {(algo === 'SCAN' || algo === 'C-SCAN' || algo === 'LOOK' || algo === 'C-LOOK') && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-cyan-300">Direction</label>
                  <select value={direction} onChange={e=>setDirection(e.target.value)} className="p-2 rounded-xl border bg-black/70 border-cyan-400/40 text-cyan-200">
                    <option value="right">Right (increasing)</option>
                    <option value="left">Left (decreasing)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button onClick={compute} className="flex-1 p-2 rounded-xl bg-indigo-600 text-white shadow">Simulate</button>
                <button onClick={() => {
                  const n = parseInt(prompt('How many random requests?', '8') || '8', 10);
                  if (!isNaN(n)) {
                    const arr = [];
                    for (let i = 0; i < n; i++) {
                      arr.push(Math.floor(Math.random() * (maxCylinder - minCylinder + 1)) + minCylinder);
                    }
                    setReqString(arr.join(', '));
                  }
                }} className="p-2 rounded-xl bg-cyan-500 text-white shadow">Random</button>
                <button onClick={reset} className="p-2 rounded-xl bg-white/10 border border-cyan-400/30 text-cyan-300 shadow">Reset</button>
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-cyan-300">
                <div>Tick</div>
                <input type="range" min={30} max={1500} value={tickMs} onChange={e => setTickMs(Number(e.target.value))} />
                <div>{tickMs} ms</div>
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={play} disabled={!simResult || isRunning} className="p-2 rounded-xl bg-emerald-500 text-white flex-1 shadow">Play</button>
                <button onClick={pause} disabled={!isRunning} className="p-2 rounded-xl bg-white/10 border border-cyan-400/30 text-cyan-300 shadow">Pause</button>
                <button onClick={stepBack} className="p-2 rounded-xl bg-white/10 border border-cyan-400/30 text-cyan-300 shadow">Step &lt;</button>
                <button onClick={stepForward} className="p-2 rounded-xl bg-white/10 border border-cyan-400/30 text-cyan-300 shadow">Step &gt;</button>
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={exportCSV} disabled={!simResult} className="p-2 rounded-xl bg-amber-400 text-black flex-1 shadow">Export CSV</button>
                <div className="p-2 rounded-xl bg-black/60 border text-sm text-cyan-200">Total movement: <strong className="text-indigo-300">{total}</strong></div>
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl glass-card bg-black/60 border border-cyan-400/30 shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-bold text-cyan-300">Visualization</div>
                <div className="text-xs text-cyan-400">Step {stepIndex+1} / {simResult ? simResult.sequence.length : 0}</div>
              </div>
              <div className="text-xs text-cyan-300">Current: <strong>{currentCylinder}</strong> • Move: {currentMove}</div>
            </div>

            <div className="mb-4">
              <div className="w-full h-12 rounded-lg bg-cyan-900/30 relative overflow-hidden border">
                <div className="absolute left-1 text-xs text-cyan-500 top-1">{minCylinder}</div>
                <div className="absolute right-1 text-xs text-cyan-500 top-1">{maxCylinder}</div>
                {simResult && simResult.sequence.map((cyl, idx) => {
                  const frac = (cyl - minCylinder) / range;
                  const leftPct = Math.max(0, Math.min(1, frac)) * 100;
                  const active = idx === stepIndex;
                  return (
                    <motion.div key={idx} layout style={{ left: `${leftPct}%` }} className={`absolute transform -translate-x-1/2 top-2 flex flex-col items-center`}>
                      <div className={`w-5 h-5 rounded-full ${active ? 'bg-indigo-600 text-white drop-shadow-[0_0_10px_#67C8FF]' : 'bg-white border text-indigo-600'} flex items-center justify-center text-xs`}>{String(cyl)}</div>
                      <div className="text-[10px] text-cyan-400 mt-1">{idx}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-cyan-400/20 bg-black/50 p-3">
                <div className="text-sm font-semibold mb-2 text-cyan-300">Seek Sequence</div>
                {simResult ? (
                  <div className="text-xs text-cyan-100">
                    <div className="mb-2">Sequence: {simResult.sequence.join(' → ')}</div>
                    <div className="mb-2">Moves per step: {simResult.moves.join(', ')}</div>
                    <div>Total movement: <strong>{simResult.total}</strong></div>
                    <div>Average per request: <strong>{simResult.avg.toFixed(2)}</strong></div>
                  </div>
                ) : <div className="text-xs text-cyan-700">No simulation yet</div>}
              </div>

              <div className="rounded-lg border border-cyan-400/20 bg-black/50 p-3">
                <div className="text-sm font-semibold mb-2 text-cyan-300">Step details</div>
                {simResult ? (
                  <div className="text-xs text-cyan-100">
                    <div>Step: {stepIndex}</div>
                    <div>Head at: {simResult.sequence[stepIndex]}</div>
                    <div>Movement this step: {simResult.moves[stepIndex]}</div>
                    <div>Cumulative: {simResult.moves.slice(0, stepIndex+1).reduce((a,b)=>a+b,0)}</div>
                  </div>
                ) : <div className="text-xs text-cyan-700">Compute simulation to see details</div>}
              </div>
            </div>

            <div className="mt-4">
              <div className="rounded-lg border border-cyan-400/20 bg-black/50 p-3">
                <div className="text-sm font-semibold mb-2 text-cyan-300">Summary table</div>
                {simResult ? (
                  <table className="w-full text-sm table-auto">
                    <thead>
                      <tr className="text-left text-cyan-400"><th className="p-1">Step</th><th className="p-1">Cylinder</th><th className="p-1">Move</th></tr>
                    </thead>
                    <tbody>
                      {simResult.sequence.map((c, i) => (
                        <tr key={i} className={`border-t border-cyan-400/10 ${i===stepIndex ? 'bg-cyan-900/20' : ''}`}>
                          <td className="p-1">{i}</td>
                          <td className="p-1">{c}</td>
                          <td className="p-1">{simResult.moves[i]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="text-xs text-cyan-700">No results</div>}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
