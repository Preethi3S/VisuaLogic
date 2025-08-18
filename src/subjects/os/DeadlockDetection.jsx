import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";


const MODES = [
  "Wait-For Graph",
  "Resource-Allocation Graph",
  "Banker's Algorithm",
  "Recovery Simulation",
];


function generateEmptyMatrices(P, R) {
  const alloc = Array.from({ length: P }, () => Array(R).fill(0));
  const req = Array.from({ length: P }, () => Array(R).fill(0));
  const avail = Array(R).fill(0);
  return { alloc, req, avail };
}


function randomScenario(P, R, maxUnits = 5) {
  const alloc = Array.from({ length: P }, () => Array.from({ length: R }, () => Math.floor(Math.random() * (maxUnits + 1))));
  const req = Array.from({ length: P }, () => Array.from({ length: R }, () => Math.floor(Math.random() * (maxUnits + 1))));
  const totalAlloc = Array(R).fill(0);
  for (let i = 0; i < P; i++) for (let j = 0; j < R; j++) totalAlloc[j] += alloc[i][j];
  const avail = Array.from({ length: R }, (_, j) => Math.max(0, Math.floor(Math.random() * (maxUnits + 1)) + Math.max(0, maxUnits - totalAlloc[j])));
  return { alloc, req, avail };
}


function detectCycleInDirectedGraph(adj) {
  const nodes = Object.keys(adj);
  const visited = new Set();
  const stack = new Set();
  let cycle = null;

  function dfs(u, path) {
    visited.add(u);
    stack.add(u);
    path.push(u);
    const neighbors = adj[u] || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        const res = dfs(v, path);
        if (res) return true;
      } else if (stack.has(v)) {
        const idx = path.indexOf(v);
        cycle = path.slice(idx);
        return true;
      }
    }
    stack.delete(u);
    path.pop();
    return false;
  }

  for (const n of nodes) {
    if (!visited.has(n)) {
      if (dfs(n, [])) break;
    }
  }

  return { hasCycle: !!cycle, cycleNodes: cycle || [] };
}


function buildWaitForGraphFromAllocation(allocation, request) {
  const P = allocation.length;
  const R = (allocation[0] || []).length;
  const adj = {};
  for (let i = 0; i < P; i++) adj[`P${i}`] = [];
  for (let i = 0; i < P; i++) {
    for (let k = 0; k < R; k++) {
      if (request[i][k] > 0) {
        for (let j = 0; j < P; j++) {
          if (allocation[j][k] > 0) {
            if (i !== j && !adj[`P${i}`].includes(`P${j}`)) adj[`P${i}`].push(`P${j}`);
          }
        }
      }
    }
  }
  return adj;
}


function buildResourceAllocationGraph(allocation, request, avail) {
  const P = allocation.length;
  const R = (allocation[0] || []).length;
  const adj = {};
  for (let i = 0; i < P; i++) adj[`P${i}`] = [];
  for (let k = 0; k < R; k++) adj[`R${k}`] = [];
  for (let i = 0; i < P; i++) for (let k = 0; k < R; k++) if (request[i][k] > 0) adj[`P${i}`].push(`R${k}`);
  for (let i = 0; i < P; i++) for (let k = 0; k < R; k++) if (allocation[i][k] > 0) adj[`R${k}`].push(`P${i}`);
  return adj;
}


function bankersSafetyCheck(allocation, request, available) {
  const P = allocation.length;
  const R = (allocation[0] || []).length;
  const work = available.slice();
  const finish = Array(P).fill(false);
  const safeSeq = [];
  let progressed = true;

  while (progressed) {
    progressed = false;
    for (let i = 0; i < P; i++) {
      if (finish[i]) continue;
      let can = true;
      for (let k = 0; k < R; k++) if (request[i][k] > work[k]) { can = false; break; }
      if (can) {
        for (let k = 0; k < R; k++) work[k] += allocation[i][k];
        finish[i] = true;
        safeSeq.push(i);
        progressed = true;
      }
    }
  }

  const safe = finish.every(f => f);
  return { safe, safeSeq, finish, work };
}


function simulateRecovery(allocation, request, available, strategy = 'kill') {
  const P = allocation.length;
  const R = (allocation[0] || []).length;
  const alloc = allocation.map(row => row.slice());
  const req = request.map(row => row.slice());
  let avail = available.slice();
  const history = [];

  let check = bankersSafetyCheck(alloc, req, avail);
  history.push({ alloc: alloc.map(r => r.slice()), req: req.map(r => r.slice()), avail: avail.slice(), safe: check.safe, safeSeq: check.safeSeq.slice() });

  if (check.safe) return history;

  if (strategy === 'kill') {
    const alive = new Set(Array.from({ length: P }, (_, i) => i));
    while (!check.safe && alive.size > 0) {
      let victim = null;
      let maxAlloc = -1;
      for (let i of alive) {
        const totalAlloc = alloc[i].reduce((a, b) => a + b, 0);
        if (totalAlloc > maxAlloc) { maxAlloc = totalAlloc; victim = i; }
      }
      if (victim == null) break;
      for (let k = 0; k < R; k++) { avail[k] += alloc[victim][k]; alloc[victim][k] = 0; req[victim][k] = 0; }
      alive.delete(victim);
      check = bankersSafetyCheck(alloc, req, avail);
      history.push({ action: `killed P${victim}`, alloc: alloc.map(r => r.slice()), req: req.map(r => r.slice()), avail: avail.slice(), safe: check.safe, safeSeq: check.safeSeq.slice() });
      if (check.safe) break;
    }
  } else if (strategy === 'rollback') {
    const alive = new Set(Array.from({ length: P }, (_, i) => i));
    while (!check.safe && alive.size > 0) {
      let victim = null;
      let maxAlloc = -1;
      for (let i of alive) {
        const totalAlloc = alloc[i].reduce((a, b) => a + b, 0);
        if (totalAlloc > maxAlloc) { maxAlloc = totalAlloc; victim = i; }
      }
      if (victim == null) break;
      for (let k = 0; k < R; k++) {
        const release = Math.floor(alloc[victim][k] / 2);
        alloc[victim][k] -= release;
        avail[k] += release;
      }
      check = bankersSafetyCheck(alloc, req, avail);
      history.push({ action: `rolled back P${victim}`, alloc: alloc.map(r => r.slice()), req: req.map(r => r.slice()), avail: avail.slice(), safe: check.safe, safeSeq: check.safeSeq.slice() });
      if (check.safe) break;
      alive.delete(victim);
    }
  }

  return history;
}


export default function DeadlockDetection() {
  const [mode, setMode] = useState(MODES[0]);
  const [processCount, setProcessCount] = useState(5);
  const [resourceTypes, setResourceTypes] = useState(3);
  const [allocation, setAllocation] = useState(() => generateEmptyMatrices(5, 3).alloc);
  const [request, setRequest] = useState(() => generateEmptyMatrices(5, 3).req);
  const [available, setAvailable] = useState(() => generateEmptyMatrices(5, 3).avail);

  const [graphAdj, setGraphAdj] = useState(null);
  const [graphResult, setGraphResult] = useState(null);

  const [bankerResult, setBankerResult] = useState(null);
  const [recoveryHistory, setRecoveryHistory] = useState(null);

  useEffect(() => {
    const { alloc, req, avail } = generateEmptyMatrices(processCount, resourceTypes);
    setAllocation(alloc);
    setRequest(req);
    setAvailable(avail);
    setGraphAdj(null);
    setGraphResult(null);
    setBankerResult(null);
    setRecoveryHistory(null);
  }, [processCount, resourceTypes]);


  function handleRandom() {
    const { alloc, req, avail } = randomScenario(processCount, resourceTypes, 4);
    setAllocation(alloc);
    setRequest(req);
    setAvailable(avail);
  }


  function buildWaitFor() {
    const adj = buildWaitForGraphFromAllocation(allocation, request);
    setGraphAdj(adj);
    const res = detectCycleInDirectedGraph(adj);
    setGraphResult(res);
  }


  function buildRAG() {
    const adj = buildResourceAllocationGraph(allocation, request, available);
    setGraphAdj(adj);
    const res = detectCycleInDirectedGraph(adj);
    setGraphResult(res);
  }


  function runBanker() {
    const res = bankersSafetyCheck(allocation, request, available);
    setBankerResult(res);
  }


  function runRecovery(strategy = 'kill') {
    const hist = simulateRecovery(allocation, request, available, strategy);
    setRecoveryHistory(hist);
  }


  function exportCSV() {
    const header = ['process', ...Array.from({ length: resourceTypes }, (_, i) => `R${i}`)];
    const lines = [];
    lines.push(['-- ALLOCATION --'].join(','));
    lines.push(header.join(','));
    allocation.forEach((row, i) => lines.push([`P${i}`, ...row].join(',')));
    lines.push(['-- REQUEST --'].join(','));
    lines.push(header.join(','));
    request.forEach((row, i) => lines.push([`P${i}`, ...row].join(',')));
    lines.push(['-- AVAILABLE --'].join(','));
    lines.push(['avail', ...available].join(','));
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'deadlock-matrices.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }


  function setAlloc(i, j, v) {
    const copy = allocation.map(r => r.slice()); copy[i][j] = Math.max(0, Number(v) || 0); setAllocation(copy);
  }
  function setReq(i, j, v) { const copy = request.map(r => r.slice()); copy[i][j] = Math.max(0, Number(v) || 0); setRequest(copy); }
  function setAvail(j, v) { const copy = available.slice(); copy[j] = Math.max(0, Number(v) || 0); setAvailable(copy); }


  function renderGraph(svgW = 600, svgH = 360) {
    if (!graphAdj) return <div className="text-xs text-gray-500">No graph built</div>;
    const nodes = Object.keys(graphAdj);
    const pNodes = nodes.filter(n => n.startsWith('P'));
    const rNodes = nodes.filter(n => n.startsWith('R'));
    const centerX = svgW / 2; const centerY = svgH / 2;
    const radius = Math.min(svgW, svgH) * 0.35;
    const positions = {};
    pNodes.forEach((n, i) => {
      const ang = (i / pNodes.length) * Math.PI * 2 - Math.PI / 2;
      positions[n] = { x: centerX + radius * Math.cos(ang), y: centerY + radius * Math.sin(ang) };
    });
    rNodes.forEach((n, i) => {
      const ang = (i / Math.max(1, rNodes.length)) * Math.PI * 2 + Math.PI / 6;
      const r2 = radius * 0.5;
      positions[n] = { x: centerX + r2 * Math.cos(ang), y: centerY + r2 * Math.sin(ang) };
    });
    const edges = [];
    for (const u of Object.keys(graphAdj)) for (const v of graphAdj[u]) edges.push({ from: u, to: v });

    const cycleSet = new Set(graphResult?.cycleNodes || []);

    return (
      <svg width={svgW} height={svgH}>
        {edges.map((e, idx) => {
          const a = positions[e.from]; const b = positions[e.to];
          if (!a || !b) return null;
          const dx = b.x - a.x; const dy = b.y - a.y; const ang = Math.atan2(dy, dx);
          const dist = Math.hypot(dx, dy);
          const startOff = 18; const endOff = 18;
          const sx = a.x + startOff * Math.cos(ang);
          const sy = a.y + startOff * Math.sin(ang);
          const ex = b.x - endOff * Math.cos(ang);
          const ey = b.y - endOff * Math.sin(ang);
          return (
            <g key={idx}>
              <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#4B6CB7" strokeWidth={2} markerEnd="url(#arrow)" />
            </g>
          );
        })}

        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#4B6CB7" />
          </marker>
        </defs>

        {Object.keys(positions).map((n) => {
          const p = positions[n];
          const isP = n.startsWith('P');
          const radiusNode = isP ? 22 : 14;
          const fill = cycleSet.has(n) ? '#F59E0B' : (isP ? '#eef2ff' : '#fff7ed');
          const stroke = isP ? '#4B6CB7' : '#F59E0B';
          return (
            <g key={n} transform={`translate(${p.x},${p.y})`}>
              <circle r={radiusNode} fill={fill} stroke={stroke} strokeWidth={2} />
              <text x={0} y={5} fontSize={12} fontWeight={700} textAnchor="middle" fill="#1F2937">{n}</text>
            </g>
          );
        })}
      </svg>
    );
  }


  return (
    <div className="relative min-h-screen font-sans">
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      <div className="relative z-10 w-full min-h-screen p-6 text-cyan-100 max-w-7xl mx-auto space-y-6">

        <div className="flex gap-4 mb-6 flex-col md:flex-row">
          <div className="rounded-2xl glass-card bg-black/60 border border-cyan-400/30 shadow-lg p-4 min-w-[340px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-cyan-300">Deadlock Visualizer</h3>
              <div className="text-xs text-cyan-400">Mode: {mode}</div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-cyan-300">Mode</label>
              <select value={mode} onChange={e=>setMode(e.target.value)} className="p-2 rounded-xl border bg-black/70 border-cyan-400/40 text-cyan-200">
                {MODES.map(m=> <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex gap-2">
                <div>
                  <label className="text-xs text-cyan-300">Processes</label>
                  <input type="number" min={1} max={12} value={processCount} onChange={e=>setProcessCount(Math.max(1,Math.min(12,Number(e.target.value||1))))} className="p-2 rounded-xl border bg-black/70 border-cyan-400/40 text-cyan-200" />
                </div>
                <div>
                  <label className="text-xs text-cyan-300">Resource types</label>
                  <input type="number" min={1} max={8} value={resourceTypes} onChange={e=>setResourceTypes(Math.max(1,Math.min(8,Number(e.target.value||1))))} className="p-2 rounded-xl border bg-black/70 border-cyan-400/40 text-cyan-200" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRandom} className="p-2 rounded-xl bg-cyan-500 text-white shadow">Random scenario</button>
                <button onClick={exportCSV} className="p-2 rounded-xl bg-emerald-500 text-black shadow">Export CSV</button>
              </div>
              <div className="text-xs text-cyan-400">
                Allocation and Request matrices represent current allocation and remaining need (for Banker's algorithm use remaining need)
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl glass-card bg-black/60 border border-cyan-400/30 shadow-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-cyan-400/20 bg-black/50 p-3">
                <div className="text-sm font-semibold mb-2 text-cyan-300">Allocation matrix</div>
                <div className="overflow-auto">
                  <table className="text-sm table-auto">
                    <thead>
                      <tr className="text-left text-cyan-400"><th className="p-1">Proc</th>{Array.from({ length: resourceTypes }).map((_,j)=>(<th key={j} className="p-1">R{j}</th>))}</tr>
                    </thead>
                    <tbody>
                      {allocation.map((row,i)=> (
                        <tr key={i} className="border-t border-cyan-400/10">
                          <td className="p-1">P{i}</td>
                          {row.map((val,j)=> (
                            <td key={j} className="p-1">
                              <input
                                className="w-16 p-1 border rounded-xl bg-black/70 border-cyan-400/30 text-cyan-100"
                                type="number"
                                min={0}
                                value={val}
                                onChange={e=>setAlloc(i,j,Number(e.target.value||0))}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-lg border border-cyan-400/20 bg-black/50 p-3">
                <div className="text-sm font-semibold mb-2 text-cyan-300">Request matrix (remaining need)</div>
                <div className="overflow-auto">
                  <table className="text-sm table-auto">
                    <thead>
                      <tr className="text-left text-cyan-400"><th className="p-1">Proc</th>{Array.from({ length: resourceTypes }).map((_,j)=>(<th key={j} className="p-1">R{j}</th>))}</tr>
                    </thead>
                    <tbody>
                      {request.map((row,i)=> (
                        <tr key={i} className="border-t border-cyan-400/10">
                          <td className="p-1">P{i}</td>
                          {row.map((val,j)=> (
                            <td key={j} className="p-1">
                              <input
                                className="w-16 p-1 border rounded-xl bg-black/70 border-cyan-400/30 text-cyan-100"
                                type="number"
                                min={0}
                                value={val}
                                onChange={e=>setReq(i,j,Number(e.target.value||0))}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-lg border border-cyan-400/20 bg-black/50 p-3 col-span-2">
                <div className="text-sm font-semibold mb-2 text-cyan-300">Available vector</div>
                <div className="flex gap-2">
                  {available.map((val,j)=>(
                    <div key={j} className="flex flex-col">
                      <div className="text-xs text-cyan-400">R{j}</div>
                      <input
                        className="w-20 p-1 border rounded-xl bg-black/70 border-cyan-400/30 text-cyan-200"
                        type="number"
                        min={0}
                        value={val}
                        onChange={e=>setAvail(j,Number(e.target.value||0))}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-2 flex gap-2 mt-2">
                <button onClick={()=>{ if (mode==='Wait-For Graph') buildWaitFor(); else if (mode==='Resource-Allocation Graph') buildRAG(); else if (mode==='Banker\'s Algorithm') runBanker(); else runBanker(); }} className="p-2 rounded-xl bg-indigo-600 text-white shadow">Build</button>
                <button onClick={()=>{ if (mode==='Recovery Simulation') runRecovery('kill'); else runRecovery('kill'); }} className="p-2 rounded-xl bg-amber-500 text-black shadow">Run Recovery (kill)</button>
                <button onClick={()=>runRecovery('rollback')} className="p-2 rounded-xl bg-cyan-500 text-white shadow">Run Recovery (rollback)</button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl glass-card bg-black/60 border border-cyan-400/20 shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-bold text-cyan-200">Visualization / Results</div>
            <div className="text-xs text-cyan-500">Action</div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 rounded-lg border border-cyan-400/20 bg-black/70 p-3">
              <div className="text-sm font-semibold mb-2 text-cyan-300">Graph</div>
              <div className="w-full overflow-auto p-2">
                {renderGraph(820,360)}
              </div>
              <div className="mt-2 text-xs text-cyan-400">
                {graphResult ? (
                  <>
                    <div>Cycle detected: <strong className="text-amber-400">{String(graphResult.hasCycle)}</strong></div>
                    {graphResult.hasCycle && <div>Cycle nodes: {graphResult.cycleNodes.join(' → ')}</div>}
                  </>
                ) : <div className="text-xs text-cyan-700">No result yet</div>}
              </div>
            </div>
            <div className="rounded-lg border border-cyan-400/20 bg-black/70 p-3">
              <div className="text-sm font-semibold mb-2 text-cyan-300">Banker's Result</div>
              {bankerResult ? (
                <div className="text-xs text-cyan-100">
                  <div>Safe: <strong className={bankerResult.safe ? 'text-emerald-400' : 'text-amber-400'}>{String(bankerResult.safe)}</strong></div>
                  <div>Safe seq: {bankerResult.safeSeq.map(i => `P${i}`).join(', ')}</div>
                </div>
              ) : <div className="text-xs text-cyan-700">No banker check run</div>}
              <div className="mt-3 text-sm font-semibold text-cyan-300">Recovery History</div>
              {recoveryHistory ? (
                <div className="text-xs text-cyan-100 max-h-48 overflow-auto">
                  {recoveryHistory.map((h,idx)=> (
                    <div key={idx} className="border-b border-cyan-400/10 py-1">
                      <div><strong className="text-cyan-300">{h.action ?? 'initial'}</strong> - safe: <span className={h.safe ? "text-emerald-400" : "text-amber-400"}>{String(h.safe)}</span></div>
                      <div className="text-[11px] text-cyan-500">avail: [{h.avail.join(', ')}] seq: [{h.safeSeq.join(', ')}]</div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-xs text-cyan-700">No recovery run</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
