// src/scenes/RoutingScene.jsx
import React, { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";

/*
RoutingScene.jsx
- Visualizes IP routing: packet movement, subnetting, Distance Vector and Link-State routing table construction.
- Single-file scene: Canvas + HTML controls overlay.
- Palette (VisuaLogic):
  Primary Indigo: #4B6CB7
  Accent Sky Blue: #67C8FF
  Background: #F8FAFC
  Card/white: #FFFFFF
  Text: #1F2937
  Success: #10B981
  Warning: #F59E0B
*/

const PALETTE = {
  primary: "#4B6CB7",
  accent: "#67C8FF",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1F2937",
  success: "#10B981",
  warn: "#F59E0B",
};

// ---------- Sample network definition ----------
const sampleNodes = [
  // id, x, y, ip, cidr
  { id: 0, name: "R0", pos: [-5, 2, 0], ip: "10.0.0.1", cidr: 24 },
  { id: 1, name: "R1", pos: [0, 3.5, 0], ip: "10.0.1.1", cidr: 24 },
  { id: 2, name: "R2", pos: [5, 2, 0], ip: "10.0.2.1", cidr: 24 },
  { id: 3, name: "R3", pos: [-3, -2.5, 0], ip: "10.0.3.1", cidr: 24 },
  { id: 4, name: "R4", pos: [3, -2.5, 0], ip: "10.0.4.1", cidr: 24 },
  { id: 5, name: "H", pos: [0, 0, 0], ip: "192.168.100.10", cidr: 28 },
];

const sampleEdges = [
  // [u, v, cost]
  [0, 1, 2],
  [1, 2, 2],
  [0, 3, 3],
  [1, 5, 5],
  [3, 4, 4],
  [4, 2, 3],
  [5, 4, 10],
];

// ---------- Utilities: IP & subnet helpers ----------
function ipToInt(ip) {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}
function intToIp(i) {
  return [(i >>> 24) & 255, (i >>> 16) & 255, (i >>> 8) & 255, i & 255].join(".");
}
function cidrMask(cidr) {
  return cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
}
function networkAddress(ip, cidr) {
  const ipi = ipToInt(ip);
  return intToIp(ipi & cidrMask(cidr));
}
function broadcastAddress(ip, cidr) {
  const ipi = ipToInt(ip);
  return intToIp((ipi & cidrMask(cidr)) | (~cidrMask(cidr) >>> 0));
}
function hostRange(ip, cidr) {
  const net = ipToInt(networkAddress(ip, cidr));
  const bcast = ipToInt(broadcastAddress(ip, cidr));
  if (cidr >= 31) return [];
  return [intToIp(net + 1), intToIp(bcast - 1)];
}

// ---------- Graph helpers ----------
function buildAdjacency(nodes, edges) {
  const adj = {};
  nodes.forEach((n) => (adj[n.id] = []));
  edges.forEach(([u, v, w]) => {
    adj[u].push({ to: v, weight: w });
    adj[v].push({ to: u, weight: w });
  });
  return adj;
}

// ---------- Distance Vector algorithm (collect snapshots) ----------
function computeDistanceVectorSnapshots(nodes, edges, maxIter = 10) {
  const N = nodes.length;
  const adj = buildAdjacency(nodes, edges);

  // initialize tables: tables[nodeId][destId] = { cost, nextHop }
  let tables = {};
  nodes.forEach((n) => {
    tables[n.id] = {};
    nodes.forEach((d) => {
      if (n.id === d.id) {
        tables[n.id][d.id] = { cost: 0, nextHop: null };
      } else {
        // direct neighbor?
        const neigh = (adj[n.id] || []).find((x) => x.to === d.id);
        if (neigh) tables[n.id][d.id] = { cost: neigh.weight, nextHop: d.id };
        else tables[n.id][d.id] = { cost: Infinity, nextHop: null };
      }
    });
  });

  const snapshots = [JSON.parse(JSON.stringify(tables))];

  for (let iter = 0; iter < maxIter; iter++) {
    const old = snapshots[snapshots.length - 1];
    const next = JSON.parse(JSON.stringify(old)); // shallow copy of structure
    let changed = false;

    for (let u of nodes) {
      for (let neighbor of adj[u.id]) {
        const v = neighbor.to;
        const w_uv = neighbor.weight;
        // for each destination d, consider route u->v + v->d
        for (let d of nodes) {
          const costViaV = (old[v][d.id].cost === Infinity) ? Infinity : old[v][d.id].cost + w_uv;
          if (costViaV < next[u.id][d.id].cost) {
            next[u.id][d.id].cost = costViaV;
            next[u.id][d.id].nextHop = v; // first hop toward destination is neighbor v
            changed = true;
          }
        }
      }
    }

    snapshots.push(next);
    if (!changed) break;
  }

  return snapshots;
}

// ---------- Link State (Dijkstra) snapshots for a chosen source ----------
function computeDijkstraSnapshots(nodes, edges, sourceId) {
  const N = nodes.length;
  const adj = buildAdjacency(nodes, edges);

  const dist = {};
  const prev = {};
  const visited = {};
  nodes.forEach((n) => {
    dist[n.id] = Infinity;
    prev[n.id] = null;
    visited[n.id] = false;
  });
  dist[sourceId] = 0;

  const snapshots = [];
  // simple Dijkstra (no PQ optimization for clarity)
  for (let step = 0; step < N; step++) {
    // pick unvisited node with min dist
    let u = null;
    let best = Infinity;
    for (let n of nodes) {
      if (!visited[n.id] && dist[n.id] < best) {
        best = dist[n.id];
        u = n.id;
      }
    }
    if (u === null) break;
    visited[u] = true;

    // relax neighbors
    for (let nb of adj[u]) {
      const alt = dist[u] + nb.weight;
      if (alt < dist[nb.to]) {
        dist[nb.to] = alt;
        prev[nb.to] = u;
      }
    }

    // capture snapshot: distances and prev at this step
    const tableSnapshot = { dist: { ...dist }, prev: { ...prev }, visited: { ...visited } };
    snapshots.push(tableSnapshot);
  }

  // Build final routing table (next hop)
  const finalTable = {};
  nodes.forEach((n) => {
    if (n.id === sourceId) {
      finalTable[n.id] = { cost: 0, nextHop: null };
    } else if (!isFinite(dist[n.id])) {
      finalTable[n.id] = { cost: Infinity, nextHop: null };
    } else {
      // find first hop by backtracking prev until we reach a neighbor of source
      let cur = n.id;
      let prevNode = prev[cur];
      let hop = cur;
      while (prevNode !== null && prevNode !== sourceId) {
        hop = prevNode;
        prevNode = prev[prevNode];
      }
      finalTable[n.id] = { cost: dist[n.id], nextHop: prevNode === null ? null : hop };
    }
  });

  return { snapshots, finalTable };
}

// ---------- Utility: build a path from routing table (per-mode) ----------
function buildPathFromTables(mode, snapshotForAll, sourceId, destId, nodes) {
  // mode: "DV" or "LS"
  if (mode === "DV") {
    const final = snapshotForAll[snapshotForAll.length - 1]; // last snapshot
    const table = final[sourceId];
    if (!table || table[destId].cost === Infinity) return null;
    const path = [sourceId];
    let cur = sourceId;
    const maxHops = nodes.length + 2;
    while (cur !== destId && path.length < maxHops) {
      const nextHop = final[cur][destId].nextHop;
      if (nextHop == null) return null;
      path.push(nextHop);
      cur = nextHop;
    }
    if (cur !== destId) return null;
    return path;
  } else {
    // link-state: snapshotForAll is a map of sourceId=>finalTable
    const finalTable = snapshotForAll[sourceId];
    if (!finalTable || finalTable[destId].cost === Infinity) return null;
    const path = [sourceId];
    let cur = sourceId;
    const maxHops = nodes.length + 2;
    while (cur !== destId && path.length < maxHops) {
      const nextHop = finalTable[destId].nextHop;
      // nextHop gives first hop from source to dest; but we must actually step through
      // We'll use Dijkstra's prev approach instead: recreate shortest path using BFS on adjacency limited to distances,
      // simpler approach: greedily move to neighbor that reduces distance to dest per finalTable info.
      // For simplicity: we do repeated lookup: from cur, find neighbor with lowest cost to dest via the final per-node distances.
      // But we only have final per-source finalTable (first-hop for each dest). So repeatedly:
      const nh = finalTable[destId].nextHop;
      if (nh == null) return null;
      // if at source, nh is first hop; if not at source, to find next hop from current node we would need finalTable of current node.
      // So we do path by querying each node's finalTable from a precomputed map of finalTables (snapshotForAll).
      const perNodeTable = snapshotForAll[cur];
      if (!perNodeTable) return null;
      const next = perNodeTable[destId].nextHop;
      if (next == null) return null;
      path.push(next);
      cur = next;
    }
    if (cur !== destId) return null;
    return path;
  }
}

// ---------- React subcomponents ----------
function RouterNode({ node, selected, onSelect }) {
  const ref = useRef();
  return (
    <mesh position={node.pos} ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}>
      <sphereGeometry args={[0.45, 24, 24]} />
      <meshStandardMaterial color={selected ? PALETTE.success : PALETTE.primary} />
      <Html distanceFactor={10} center style={{ pointerEvents: "none" }}>
        <div style={{
          background: PALETTE.card, padding: "6px 8px", borderRadius: 6,
          fontSize: 12, color: PALETTE.text, boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
        }}>
          <strong>{node.name}</strong><br />
          <span style={{ fontSize: 11 }}>{node.ip}/{node.cidr}</span>
        </div>
      </Html>
    </mesh>
  );
}

function LinkEdge({ aPos, bPos, weight, highlight }) {
  // Line points: [aPos, bPos]
  return (
    <Line points={[aPos, bPos]} lineWidth={2} dashed={false}>
      <meshBasicMaterial attach="material" color={highlight ? PALETTE.accent : "#999"} />
    </Line>
  );
}

function Packet({ pathPoints, speed = 1, color = PALETTE.accent, running }) {
  const ref = useRef();
  const startTime = useRef(Date.now());
  const progressRef = useRef(0); // 0..1 across whole path
  const totalLen = useMemo(() => {
    if (!pathPoints || pathPoints.length < 2) return 0;
    let L = 0;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      L += new THREE.Vector3(...pathPoints[i]).distanceTo(new THREE.Vector3(...pathPoints[i + 1]));
    }
    return L;
  }, [pathPoints]);

  useFrame((_, delta) => {
    if (!running || !pathPoints || pathPoints.length < 2) return;
    const move = speed * delta; // units per second relative
    // convert to fraction along totalLen
    const fracDelta = (totalLen === 0) ? 0 : move / totalLen;
    progressRef.current = Math.min(1, progressRef.current + fracDelta);
    // compute position by walking segments proportional to totalLen
    let remain = progressRef.current * totalLen;
    let p = pathPoints[0];
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const a = new THREE.Vector3(...pathPoints[i]);
      const b = new THREE.Vector3(...pathPoints[i + 1]);
      const seg = a.distanceTo(b);
      if (remain > seg) {
        remain -= seg;
      } else {
        const t = seg === 0 ? 0 : remain / seg;
        const pos = a.clone().lerp(b, t);
        ref.current.position.set(pos.x, pos.y, pos.z + 0.25);
        // simple orientation
        break;
      }
    }
  });

  if (!pathPoints || pathPoints.length < 2) return null;
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshStandardMaterial emissive={color} color={color} />
    </mesh>
  );
}

// ---------- Main Scene ----------
export default function RoutingScene({ nodes = sampleNodes, edges = sampleEdges }) {
  // UI state
  const [mode, setMode] = useState("DV"); // "DV" or "LS"
  const [dvSnapshots, setDvSnapshots] = useState(null);
  const [lsFinalTables, setLsFinalTables] = useState(null); // map: sourceId => finalTable
  const [lsDijkstraSnapshots, setLsDijkstraSnapshots] = useState({}); // map: sourceId => snapshots
  const [play, setPlay] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [selectedNode, setSelectedNode] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedSourceForLS, setSelectedSourceForLS] = useState(nodes[0].id);
  const [packetSource, setPacketSource] = useState(nodes[5].id); // default H
  const [packetDest, setPacketDest] = useState(nodes[2].id);
  const [packetPathPoints, setPacketPathPoints] = useState(null);
  const [packetRunning, setPacketRunning] = useState(false);

  // Precompute adjacency
  const adj = useMemo(() => buildAdjacency(nodes, edges), [nodes, edges]);

  // compute DV snapshots once on mount or when topology changes
  useEffect(() => {
    const s = computeDistanceVectorSnapshots(nodes, edges, 20);
    setDvSnapshots(s);
  }, [nodes, edges]);

  // compute LS final tables & snapshots for each source
  useEffect(() => {
    const mapFinal = {};
    const mapSnaps = {};
    nodes.forEach((n) => {
      const { snapshots, finalTable } = computeDijkstraSnapshots(nodes, edges, n.id);
      mapFinal[n.id] = finalTable;
      mapSnaps[n.id] = snapshots;
    });
    setLsFinalTables(mapFinal);
    setLsDijkstraSnapshots(mapSnaps);
  }, [nodes, edges]);

  // compute packet path whenever user triggers (or mode / routing recompute)
  useEffect(() => {
    if (mode === "DV" && dvSnapshots) {
      const path = buildPathFromTables("DV", dvSnapshots, packetSource, packetDest, nodes);
      if (path) {
        setPacketPathPoints(path.map((id) => nodes.find((n) => n.id === id).pos));
      } else {
        setPacketPathPoints(null);
      }
    } else if (mode === "LS" && lsFinalTables) {
      // snapshotForAll in buildPath expects map of nodeId->finalTable; we provide lsFinalTables
      const path = buildPathFromTables("LS", lsFinalTables, packetSource, packetDest, nodes);
      if (path) {
        setPacketPathPoints(path.map((id) => nodes.find((n) => n.id === id).pos));
      } else setPacketPathPoints(null);
    }
  }, [mode, packetSource, packetDest, dvSnapshots, lsFinalTables, nodes]);

  // handle play auto stepping for algorithm snapshots
  useEffect(() => {
    if (!play) return;
    const interval = setInterval(() => {
      // advance step index depending on mode
      if (mode === "DV" && dvSnapshots) {
        setStepIndex((s) => Math.min(dvSnapshots.length - 1, s + 1));
      } else if (mode === "LS" && lsDijkstraSnapshots[selectedSourceForLS]) {
        const snaps = lsDijkstraSnapshots[selectedSourceForLS];
        setStepIndex((s) => Math.min(snaps.length - 1, s + 1));
      }
    }, 1000 / Math.max(0.2, speed));
    return () => clearInterval(interval);
  }, [play, mode, dvSnapshots, lsDijkstraSnapshots, selectedSourceForLS, speed]);

  // helpers to read current routing snapshot for UI
  const currentDvTable = useMemo(() => {
    if (!dvSnapshots) return null;
    const idx = Math.min(stepIndex, dvSnapshots.length - 1);
    return dvSnapshots[idx];
  }, [dvSnapshots, stepIndex]);

  const currentLsSnapshot = useMemo(() => {
    if (!lsDijkstraSnapshots[selectedSourceForLS]) return null;
    const snaps = lsDijkstraSnapshots[selectedSourceForLS];
    const idx = Math.min(stepIndex, snaps.length - 1);
    return snaps[idx];
  }, [lsDijkstraSnapshots, selectedSourceForLS, stepIndex]);

  // Start packet animation (play the packet along computed path)
  function sendPacket() {
    if (!packetPathPoints) { alert("No route found"); return; }
    setPacketRunning(true);
    setTimeout(() => {
      // simple auto-stop after 6 seconds; user can stop manually
      setTimeout(() => setPacketRunning(false), 6000);
    }, 0);
  }

  // Subnet info for selected node
  const selectedSubnetInfo = useMemo(() => {
    if (selectedNode == null) return null;
    const node = nodes.find((n) => n.id === selectedNode);
    if (!node) return null;
    return {
      networkAddress: networkAddress(node.ip, node.cidr),
      broadcast: broadcastAddress(node.ip, node.cidr),
      hostRange: hostRange(node.ip, node.cidr),
      prefix: `/${node.cidr}`,
    };
  }, [selectedNode, nodes]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: PALETTE.bg }}>
      <div style={{ width: "75%", height: "100vh" }}>
        <Canvas camera={{ position: [0, 0, 18], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 10]} intensity={0.6} />
          <OrbitControls />
          {/* Edges */}
          {edges.map(([u, v, w], i) => {
            const a = nodes.find((n) => n.id === u).pos;
            const b = nodes.find((n) => n.id === v).pos;
            // highlight edge if it's on packet path
            const onPath = packetPathPoints && packetPathPoints.some((p, idx) => {
              if (idx === packetPathPoints.length - 1) return false;
              const a1 = packetPathPoints[idx], b1 = packetPathPoints[idx + 1];
              return (a1[0] === a[0] && a1[1] === a[1] && b1[0] === b[0] && b1[1] === b[1]) ||
                (a1[0] === b[0] && a1[1] === b[1] && b1[0] === a[0] && b1[1] === a[1]);
            });
            return <LinkEdge key={i} aPos={a} bPos={b} weight={w} highlight={onPath} />;
          })}

          {/* Nodes */}
          {nodes.map((n) =>
            <RouterNode key={n.id} node={n} selected={selectedNode === n.id} onSelect={setSelectedNode} />
          )}

          {/* Packet */}
          <Packet pathPoints={packetPathPoints} speed={speed} running={packetRunning} />
        </Canvas>
      </div>

      {/* Right-side control panel */}
      <div style={{
        width: "25%", padding: 16, boxSizing: "border-box", color: PALETTE.text,
        fontFamily: "Inter, Roboto, sans-serif"
      }}>
        <div style={{ background: PALETTE.card, padding: 12, borderRadius: 8, boxShadow: "0 8px 18px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 8px 0" }}>Routing & Addressing</h3>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13 }}>Algorithm</label><br />
            <select value={mode} onChange={(e) => { setMode(e.target.value); setStepIndex(0); setPlay(false); }} style={{ width: "100%", padding: 6 }}>
              <option value="DV">Distance Vector (RIP-style)</option>
              <option value="LS">Link State (OSPF-style)</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button onClick={() => { setPlay(!play); }} style={{ flex: 1, padding: 8 }}>{play ? "Pause" : "Play"}</button>
            <button onClick={() => { setStepIndex((s) => Math.max(0, s - 1)); setPlay(false); }} style={{ padding: 8 }}>◀</button>
            <button onClick={() => { setStepIndex((s) => s + 1); setPlay(false); }} style={{ padding: 8 }}>▶</button>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13 }}>Speed (packet & animation)</label>
            <input type="range" min="0.2" max="4" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: 12 }}>x {speed.toFixed(1)}</div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />

          <div>
            <label style={{ fontSize: 13 }}>Send packet</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <select value={packetSource} onChange={(e) => setPacketSource(parseInt(e.target.value))} style={{ flex: 1 }}>
                {nodes.map((n) => <option key={n.id} value={n.id}>{n.name} ({n.ip})</option>)}
              </select>
              <select value={packetDest} onChange={(e) => setPacketDest(parseInt(e.target.value))} style={{ flex: 1 }}>
                {nodes.map((n) => <option key={n.id} value={n.id}>{n.name} ({n.ip})</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={sendPacket} style={{ flex: 1, padding: 8, background: PALETTE.accent, border: "none", borderRadius: 6 }}>Send</button>
              <button onClick={() => setPacketRunning(false)} style={{ padding: 8 }}>Stop</button>
            </div>
            <div style={{ marginTop: 6, fontSize: 12 }}>
              {packetPathPoints ? <span>Path length: {packetPathPoints.length - 1} hops</span> : <span style={{ color: "#b33" }}>No route</span>}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />

          {/* Algorithm snapshot / explanation */}
          <div style={{ fontSize: 13 }}>
            <strong>Snapshot (step {stepIndex})</strong>
            <div style={{ marginTop: 8, maxHeight: 160, overflow: "auto", background: "#fbfbfd", padding: 8, borderRadius: 6 }}>
              {mode === "DV" ? (
                currentDvTable ? (
                  <div>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>Distance Vector: each router stores cost & next hop per destination.</div>
                    <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                      <thead>
                        <tr><th style={{ textAlign: "left" }}>Router</th><th>Dest</th><th>Cost</th><th>Next</th></tr>
                      </thead>
                      <tbody>
                        {nodes.map((n) => (
                          <tr key={n.id}>
                            <td style={{ verticalAlign: "top", padding: 4 }}>{n.name}</td>
                            <td colSpan={3} style={{ padding: 4 }}>
                              {nodes.map((d) => {
                                const cell = currentDvTable[n.id][d.id];
                                return (
                                  <div key={d.id} style={{ fontSize: 12, marginBottom: 2 }}>
                                    <strong>{d.name}:</strong> {cell.cost === Infinity ? "∞" : cell.cost} {cell.nextHop !== null ? `(via ${nodes.find(x=>x.id===cell.nextHop).name})` : ""}
                                  </div>
                                );
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div>Computing DV snapshots...</div>
              ) : (
                lsDijkstraSnapshots[selectedSourceForLS] ? (
                  <div>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>
                      Link-State: selected source <strong>{nodes.find(n => n.id === selectedSourceForLS).name}</strong> runs Dijkstra.
                    </div>

                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <select value={selectedSourceForLS} onChange={(e) => { setSelectedSourceForLS(parseInt(e.target.value)); setStepIndex(0); }}>
                        {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                      </select>
                      <div style={{ fontSize: 12, alignSelf: "center" }}>step {stepIndex}/{Math.max(0, (lsDijkstraSnapshots[selectedSourceForLS]||[]).length - 1)}</div>
                    </div>

                    {currentLsSnapshot ? (
                      <div style={{ fontSize: 12 }}>
                        <div><strong>Visited:</strong> {Object.keys(currentLsSnapshot.visited).filter(k => currentLsSnapshot.visited[k]).map(k => nodes.find(n => n.id === parseInt(k)).name).join(", ")}</div>
                        <div style={{ marginTop: 6 }}>
                          {nodes.map(d => (
                            <div key={d.id} style={{ marginTop: 4 }}>
                              <strong>{d.name}</strong> — dist: {currentLsSnapshot.dist[d.id] === Infinity ? "∞" : currentLsSnapshot.dist[d.id]} prev: {currentLsSnapshot.prev[d.id] === null ? "-" : nodes.find(n=>n.id===currentLsSnapshot.prev[d.id]).name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : <div>No Dijkstra snapshot</div>}
                  </div>
                ) : <div>Preparing Link-State data...</div>
              )}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />

          {/* Subnet inspector */}
          <div>
            <strong>Subnet inspector</strong>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              <div>Select a router in the 3D view to inspect its subnet</div>
              {selectedSubnetInfo ? (
                <div style={{ marginTop: 8 }}>
                  <div><strong>Network:</strong> {selectedSubnetInfo.networkAddress}{selectedSubnetInfo.prefix}</div>
                  <div><strong>Broadcast:</strong> {selectedSubnetInfo.broadcast}</div>
                  <div><strong>Host range:</strong> {selectedSubnetInfo.hostRange.join(" — ")}</div>
                </div>
              ) : <div style={{ marginTop: 8, color: "#666" }}>No router selected</div>}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />

          <div style={{ fontSize: 12 }}>
            <strong>Notes</strong>
            <ul style={{ fontSize: 12 }}>
              <li>Distance Vector: routers exchange full tables with neighbors; converge over iterations.</li>
              <li>Link-State: routers flood link info, each router runs Dijkstra locally to build shortest-path tree.</li>
              <li>Packet uses current routing tables to determine next-hop at each router.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
