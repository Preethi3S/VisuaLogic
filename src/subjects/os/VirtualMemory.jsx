import React, { useEffect, useMemo, useRef, useState } from "react";

function parseRefString(s) {
  if (!s) return [];
  return s.trim().split(/[ ,]+/).filter(Boolean).map(x => Number(x));
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function formatBin(n, width) {
  return n.toString(2).padStart(width, '0');
}
function allocateFrame_FIFO(frames, page) {
  const idx = frames.findIndex(f => f.page === page);
  if (idx !== -1) return { hit: true, index: idx, frames };
  const freeIdx = frames.findIndex(f => f.page === null);
  const newFrames = frames.map(f => ({ ...f }));
  if (freeIdx !== -1) {
    newFrames[freeIdx].page = page;
    return { hit: false, evicted: null, index: freeIdx, frames: newFrames };
  }
  let oldest = 0; let maxAge = frames[0].age ?? 0;
  frames.forEach((f,i)=>{ const a = f.age ?? 0; if (a > maxAge) { maxAge = a; oldest = i; } });
  const ev = frames[oldest].page;
  newFrames[oldest].page = page;
  for (let f of newFrames) { f.age = (f.age||0) + 1; }
  newFrames[oldest].age = 0;
  return { hit: false, evicted: ev, index: oldest, frames: newFrames };
}
function tlbLookup(tlb, page) {
  const idx = tlb.findIndex(e => e.page === page);
  if (idx !== -1) return { hit: true, index: idx };
  return { hit: false, index: -1 };
}
function tlbInsert(tlb, entry, capacity) {
  const copy = tlb.map(e => ({ ...e }));
  const idx = copy.findIndex(e => e.page === entry.page);
  if (idx !== -1) {
    copy[idx] = { page: entry.page, frame: entry.frame, last: Date.now() };
    return copy.slice(0);
  }
  if (copy.length < capacity) { copy.push({ ...entry, last: Date.now() }); return copy; }
  let lruIdx = 0; let lruTime = copy[0].last;
  for (let i=1;i<copy.length;i++){ if (copy[i].last < lruTime) { lruTime = copy[i].last; lruIdx = i; } }
  copy.splice(lruIdx,1); copy.push({ ...entry, last: Date.now() });
  return copy;
}
function simulateSingleLevel(params) {
  const { pagesRef, framesCount, tlbSize } = params;
  const frames = Array.from({ length: framesCount }, () => ({ page: null, age: 0 }));
  const pageTable = {};
  const tlb = [];
  const steps = [];
  let time = 0;
  for (const page of pagesRef) {
    const tlbRes = tlbLookup(tlb, page);
    if (tlbRes.hit) {
      const frame = tlb[tlbRes.index].frame;
      tlb[tlbRes.index].last = Date.now();
      steps.push({ page, tlbHit: true, pageFault: false, frame, frames: frames.map(f=> ({...f})), tlb: tlb.map(e=>({...e})) });
    } else {
      const mapped = pageTable[page];
      if (mapped != null) {
        const frame = mapped;
        const newTLB = tlbInsert(tlb, { page, frame }, tlbSize);
        tlb.length = 0; tlb.push(...newTLB);
        steps.push({ page, tlbHit: false, pageFault: false, frame, frames: frames.map(f=> ({...f})), tlb: tlb.map(e=>({...e})) });
      } else {
        const allocRes = allocateFrame_FIFO(frames, page);
        for (let i=0;i<frames.length;i++){ frames[i] = allocRes.frames[i]; frames[i].age = (frames[i].age||0) + 1; }
        if (allocRes.index != null) { pageTable[page] = allocRes.index; }
        if (allocRes.evicted != null) { pageTable[allocRes.evicted] = null; }
        const newTLB = tlbInsert(tlb, { page, frame: allocRes.index }, tlbSize);
        tlb.length = 0; tlb.push(...newTLB);
        steps.push({ page, tlbHit: false, pageFault: true, frame: allocRes.index, evicted: allocRes.evicted, frames: frames.map(f=> ({...f})), tlb: tlb.map(e=>({...e})), pageTable: { ...pageTable } });
      }
    }
    time += 1;
  }
  return steps;
}
function simulateTwoLevel(params) {
  const { pagesRef, framesCount, tlbSize, topBits, secondBits } = params;
  const frames = Array.from({ length: framesCount }, () => ({ page: null, age: 0 }));
  const tlb = [];
  const topTable = {};
  const pageTableMapping = {};
  const steps = [];
  function splitPage(page) {
    const lowMask = (1 << secondBits) - 1;
    const second = page & lowMask;
    const top = page >> secondBits;
    return { top, second };
  }
  for (const page of pagesRef) {
    const tlbRes = tlbLookup(tlb, page);
    if (tlbRes.hit) {
      const frame = tlb[tlbRes.index].frame;
      tlb[tlbRes.index].last = Date.now();
      steps.push({ page, tlbHit: true, pageFault: false, frame, frames: frames.map(f=>({...f})), tlb: tlb.map(e=>({...e})) });
    } else {
      const { top, second } = splitPage(page);
      let secondTable = topTable[top];
      if (!secondTable) {
        topTable[top] = {};
        secondTable = topTable[top];
      }
      if (secondTable[second] != null) {
        const frame = secondTable[second];
        const newTLB = tlbInsert(tlb, { page, frame }, tlbSize);
        tlb.length = 0; tlb.push(...newTLB);
        steps.push({ page, tlbHit: false, pageFault: false, frame, frames: frames.map(f=>({...f})), tlb: tlb.map(e=>({...e})), pageTableTop: { ...topTable } });
      } else {
        const allocRes = allocateFrame_FIFO(frames, page);
        for (let i=0;i<frames.length;i++){ frames[i] = allocRes.frames[i]; frames[i].age = (frames[i].age||0) + 1; }
        if (allocRes.index != null) {
          secondTable[second] = allocRes.index;
          pageTableMapping[page] = allocRes.index;
        }
        if (allocRes.evicted != null) {
          delete pageTableMapping[allocRes.evicted];
        }
        const newTLB = tlbInsert(tlb, { page, frame: allocRes.index }, tlbSize);
        tlb.length = 0; tlb.push(...newTLB);
        steps.push({ page, tlbHit: false, pageFault: true, frame: allocRes.index, evicted: allocRes.evicted, frames: frames.map(f=>({...f})), tlb: tlb.map(e=>({...e})), pageTableTop: { ...topTable } });
      }
    }
  }
  return steps;
}

export default function VirtualMemory() {
  const [pageBits, setPageBits] = useState(8);
  const [offsetBits, setOffsetBits] = useState(8);
  const [framesCount, setFramesCount] = useState(4);
  const [tlbSize, setTlbSize] = useState(4);
  const [mode, setMode] = useState('single');
  const [refString, setRefString] = useState('0 1 2 3 2 1 4 0 5 2 1');
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);
  const [tickMs, setTickMs] = useState(600);

  // Static cyber grid on mount
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => { document.body.classList.remove("bg-cyber-grid"); };
  }, []);

  const pagesRef = useMemo(() => parseRefString(refString), [refString]);

  useEffect(() => {
    if (isRunning && steps.length) {
      timerRef.current = setInterval(() => {
        setStepIndex(i => Math.min(steps.length - 1, i + 1));
      }, clamp(tickMs, 50, 2000));
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isRunning, steps, tickMs]);

  function compute() {
    setSteps([]); setStepIndex(0);
    const params = { pagesRef, framesCount, tlbSize };
    let s = [];
    if (mode === 'single') { s = simulateSingleLevel(params); }
    else { params.topBits = Math.max(1, pageBits - 4); params.secondBits = Math.max(1, pageBits - params.topBits); s = simulateTwoLevel(params); }
    setSteps(s);
  }
  function play() { if (steps.length) setIsRunning(true); }
  function pause() { setIsRunning(false); if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
  function stepForward() { setStepIndex(i => Math.min(steps.length - 1, i + 1)); }
  function stepBack() { setStepIndex(i => Math.max(0, i - 1)); }
  function exportCSV() {
    if (!steps.length) return;
    const lines = ['page,tlbHit,pageFault,frame,evicted'];
    steps.forEach(st => lines.push([st.page, st.tlbHit?1:0, st.pageFault?1:0, st.frame, st.evicted ?? '-'].join(',')));
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'vm-sim.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  const current = steps[stepIndex] || null;

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0"></div>
      <div className="relative z-10 w-full min-h-screen p-6 max-w-7xl mx-auto">
        <div className="flex gap-4 mb-6 flex-col md:flex-row">
          <div className="rounded-2xl glass-card bg-black/70 border border-cyan-300/25 shadow-lg p-5 min-w-[340px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-cyan-300">Virtual Memory</h3>
              <div className="text-xs text-cyan-400">Paging & TLB visualizer</div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-cyan-200">Mode</label>
              <select value={mode} onChange={e=>setMode(e.target.value)} className="p-2 rounded-xl border border-cyan-300 bg-black/60 text-cyan-100">
                <option value="single">Single-level page table</option>
                <option value="two">Two-level page table</option>
              </select>
              <div className="flex gap-2">
                <div>
                  <label className="text-xs text-cyan-200">Page bits</label>
                  <input type="number" min={2} max={16} value={pageBits} onChange={e=>setPageBits(clamp(Number(e.target.value||8),2,16))} className="p-2 rounded-xl border border-cyan-300 bg-black/60 text-cyan-100 w-24" />
                </div>
                <div>
                  <label className="text-xs text-cyan-200">Offset bits</label>
                  <input type="number" min={1} max={16} value={offsetBits} onChange={e=>setOffsetBits(clamp(Number(e.target.value||8),1,16))} className="p-2 rounded-xl border border-cyan-300 bg-black/60 text-cyan-100 w-24" />
                </div>
              </div>
              <label className="text-xs text-cyan-200">Physical frames</label>
              <input type="number" min={1} max={64} value={framesCount} onChange={e=>setFramesCount(clamp(Number(e.target.value||4),1,64))} className="p-2 rounded-xl border border-cyan-300 bg-black/60 text-cyan-100" />
              <label className="text-xs text-cyan-200">TLB entries</label>
              <input type="number" min={0} max={16} value={tlbSize} onChange={e=>setTlbSize(clamp(Number(e.target.value||4),0,16))} className="p-2 rounded-xl border border-cyan-300 bg-black/60 text-cyan-100" />
              <label className="text-xs text-cyan-200">Reference string (page numbers)</label>
              <textarea value={refString} onChange={e=>setRefString(e.target.value)} className="p-2 rounded-xl border border-cyan-300 bg-black/60 text-cyan-100 h-20" />
              <div className="flex gap-2 mt-2">
                <button onClick={compute} className="flex-1 p-2 rounded-xl bg-indigo-600 text-white font-semibold shadow">Compute</button>
                <button onClick={play} className="p-2 rounded-xl bg-emerald-500 text-black font-semibold">Play</button>
                <button onClick={pause} className="p-2 rounded-xl bg-white/10 border border-cyan-300 text-cyan-100">Pause</button>
                <button onClick={exportCSV} className="p-2 rounded-xl bg-amber-400 text-black font-semibold">Export CSV</button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-cyan-200">
                <div>Tick (ms)</div>
                <input type="range" min={50} max={1500} value={tickMs} onChange={e=>setTickMs(Number(e.target.value))} className="accent-cyan-400" />
                <div>{tickMs} ms</div>
              </div>
            </div>
          </div>
          <div className="flex-1 rounded-2xl glass-card bg-black/70 border border-cyan-400/20 shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-bold text-cyan-300">Translation Visualization</div>
                <div className="text-xs text-cyan-400">Step {stepIndex+1} / {steps.length || 0}</div>
              </div>
              <div className="text-xs text-cyan-300">Current page: <strong>{current ? String(current.page) : '-'}</strong></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 rounded-lg border border-cyan-700/25 bg-black/50 p-3">
                <div className="text-sm font-semibold mb-2 text-cyan-200">Address breakdown</div>
                <div className="text-xs text-cyan-400 mb-2">Page bits: {pageBits} • Offset bits: {offsetBits}</div>
                <div className="mb-2">
                  <div className="text-xs text-cyan-400">Reference sequence</div>
                  <div className="flex gap-1 overflow-x-auto py-2">
                    {pagesRef.map((p,i)=> (
                      <div key={i} className={`px-2 py-1 rounded ${current && current.page === p ? 'bg-indigo-600 text-white' : 'bg-black/40 text-cyan-200 border border-cyan-700/20'}`}>{p}</div>
                    ))}
                  </div>
                </div>
                <div className="text-sm font-semibold mb-2 text-cyan-200">TLB</div>
                <div className="flex gap-2 mb-3">
                  {current && current.tlb && current.tlb.length ? current.tlb.map((e,i)=> (
                    <div key={i} className="p-2 border border-cyan-400 bg-black/30 rounded text-xs">
                      <div>Page: {e.page}</div>
                      <div>Frame: {e.frame}</div>
                    </div>
                  )) : <div className="text-xs text-cyan-400">No TLB entries</div>}
                </div>
                <div className="text-sm font-semibold mb-2 text-cyan-200">Physical frames</div>
                <div className="flex gap-2">
                  {current && current.frames ? current.frames.map((f,i)=> (
                    <div key={i} className={`p-2 border border-cyan-400 rounded text-xs ${f.page == null ? 'bg-black/40 text-cyan-500' : 'bg-cyan-100 text-cyan-900'}`}>
                      <div>Frame {i}</div>
                      <div>{f.page == null ? '-' : `P${f.page}`}</div>
                    </div>
                  )) : <div className="text-xs text-cyan-400">No frames yet</div>}
                </div>
              </div>
              <div className="rounded-lg border border-cyan-700/25 bg-black/50 p-3">
                <div className="text-sm font-semibold mb-2 text-cyan-200">Details</div>
                {current ? (
                  <div className="text-xs text-cyan-100">
                    <div>Page: <strong>{current.page}</strong></div>
                    <div>TLB Hit: <strong>{current.tlbHit ? 'Yes' : 'No'}</strong></div>
                    <div>Page Fault: <strong>{current.pageFault ? 'Yes' : 'No'}</strong></div>
                    <div>Frame: <strong>{current.frame}</strong></div>
                    {current.evicted != null && <div>Evicted: <strong>{current.evicted}</strong></div>}
                  </div>
                ) : <div className="text-xs text-cyan-400">No step selected</div>}
                <div className="mt-4 text-sm font-semibold text-cyan-200">Statistics</div>
                <div className="text-xs text-cyan-100 mt-2">
                  <div>Steps: {steps.length}</div>
                  <div>Page faults: {steps.filter(s => s.pageFault).length}</div>
                  <div>TLB hits: {steps.filter(s => s.tlbHit).length}</div>
                </div>
              </div>
              {/* Page table panel */}
              <div className="mt-4 rounded-lg border border-cyan-700/25 bg-black/50 p-3 text-cyan-200">
                <div className="text-sm font-semibold mb-2">Page Table</div>
                <div className="text-xs">
                  {mode === 'single' ? (
                    <div>Single-level page table (implicit): pages mapped to frames in TLB/frames view.</div>
                  ) : (
                    <div>Two-level page table: top-level and second-level tables shown for referenced pages.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
