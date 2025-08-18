import React, { useEffect, useRef, useState } from "react";

const WIDTH = 900;
const HEIGHT = 600;
const NODE_RADIUS = 18;
const PACKET_SPEED = 0.004;

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function buildTopology(type, nodeCount = 8) {
  const center = { x: WIDTH / 2, y: HEIGHT / 2 };
  const radius = Math.min(WIDTH, HEIGHT) * 0.35;
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = (Math.PI * 2 * i) / nodeCount - Math.PI / 2;
    nodes.push({ id: i, x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle), label: `N${i}` });
  }
  const links = []; let id = 0; const linkAdd = (s, t) => links.push({ id: id++, source: s, target: t, active: true });
  if (type === "ring") {
    for (let i = 0; i < nodeCount; i++) linkAdd(i, (i + 1) % nodeCount);
  } else if (type === "bus") {
    const left = 100, right = WIDTH - 100;
    for (let i = 0; i < nodeCount; i++) {
      nodes[i].x = left + ((right - left) * i) / (nodeCount - 1);
      nodes[i].y = center.y;
    }
    for (let i = 0; i < nodeCount - 1; i++) linkAdd(i, i + 1);
  } else if (type === "star") {
    nodes[0].x = center.x; nodes[0].y = center.y;
    const leafRadius = radius * 0.9;
    for (let i = 1; i < nodeCount; i++) {
      const angle = (Math.PI * 2 * i) / (nodeCount - 1) - Math.PI / 2;
      nodes[i].x = center.x + leafRadius * Math.cos(angle);
      nodes[i].y = center.y + leafRadius * Math.sin(angle);
      linkAdd(0, i);
    }
  } else if (type === "mesh") {
    for (let i = 0; i < nodeCount; i++) for (let j = i + 1; j < nodeCount; j++) linkAdd(i, j);
  } else if (type === "hybrid") {
    const groups = 3, perGroup = Math.max(3, Math.floor(nodeCount / groups));
    const groupCenterRadius = radius * 0.6, groupCenters = [];
    for (let g = 0; g < groups; g++) {
      const a = (Math.PI * 2 * g) / groups - Math.PI / 2;
      groupCenters.push({ x: center.x + groupCenterRadius * Math.cos(a), y: center.y + groupCenterRadius * Math.sin(a) });
    }
    let idx = 0;
    for (let g = 0; g < groups; g++) {
      const gc = groupCenters[g], r = 60, count = Math.min(perGroup, nodeCount - idx), base = idx;
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count;
        nodes[idx].x = gc.x + r * Math.cos(ang);
        nodes[idx].y = gc.y + r * Math.sin(ang);
        idx++;
      }
      for (let i = 0; i < count; i++) linkAdd(base + i, base + ((i + 1) % count));
    }
    const connectors = [0, Math.min(perGroup, nodeCount - perGroup), Math.min(perGroup * 2, nodeCount - 1)];
    for (let i = 0; i < connectors.length - 1; i++) linkAdd(connectors[i], connectors[i + 1]);
  }
  return { nodes, links };
}

export default function NetworkTopologiesVisualizer() {
  const [topology, setTopology] = useState("star");
  const [nodeCount, setNodeCount] = useState(8);
  const [model, setModel] = useState(() => buildTopology("star", 8));
  const [running, setRunning] = useState(false);
  const [packets, setPackets] = useState([]);
  const nextPacketId = useRef(1);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Apply static cyber grid background, no animation
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => {
      document.body.classList.remove("bg-cyber-grid");
    };
  }, []);

  useEffect(() => setModel(buildTopology(topology, nodeCount)), [topology, nodeCount]);

  useEffect(() => {
    function step(ts) {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = ts - lastTimeRef.current;
      lastTimeRef.current = ts;
      setPackets(prev =>
        prev
          .map(p => ({ ...p, t: p.t + PACKET_SPEED * dt }))
          .filter(p => p.t <= 1.0001)
      );
      if (running) rafRef.current = requestAnimationFrame(step);
    }
    if (running) {
      rafRef.current = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafRef.current);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    }
  }, [running]);

  function sendRandomPacket() {
    const activeLinks = model.links.filter(l => l.active);
    if (activeLinks.length === 0) return;
    const link = activeLinks[Math.floor(Math.random() * activeLinks.length)];
    const colors = ["#10B981", "#F59E0B", "#4B6CB7", "#67C8FF", "#EF4444"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const packet = { id: nextPacketId.current++, linkId: link.id, t: 0, color };
    setPackets(p => [...p, packet]);
  }
  function sendPacketOnLink(linkId) {
    const link = model.links.find(l => l.id === linkId);
    if (!link || !link.active) return;
    const color = "#10B981";
    const packet = { id: nextPacketId.current++, linkId: link.id, t: 0, color };
    setPackets(p => [...p, packet]);
  }
  function toggleLink(id) {
    setModel(m => ({ ...m, links: m.links.map(l => (l.id === id ? { ...l, active: !l.active } : l)) }));
    setPackets(p => p.filter(packet => packet.linkId !== id));
  }
  function toggleNode(nodeId) {
    setModel(m => ({ ...m, links: m.links.map(l => (l.source === nodeId || l.target === nodeId ? { ...l, active: !l.active } : l)) }));
    setPackets(p => p.filter(packet => {
      const link = model.links.find(l => l.id === packet.linkId);
      if (!link) return false;
      return !(link.source === nodeId || link.target === nodeId);
    }));
  }
  function linkGeom(link) {
    const s = model.nodes[link.source];
    const t = model.nodes[link.target];
    return { sx: s.x, sy: s.y, tx: t.x, ty: t.y };
  }
  function renderPackets() {
    return packets.map(pkt => {
      const link = model.links.find(l => l.id === pkt.linkId);
      if (!link) return null;
      const s = model.nodes[link.source];
      const t = model.nodes[link.target];
      const pos = lerp(s, t, pkt.t);
      return <circle key={pkt.id} cx={pos.x} cy={pos.y} r={7} fill={pkt.color} opacity={0.95} />;
    });
  }

  return (
    <div className="relative min-h-screen w-full font-sans bg-transparent">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div className="relative z-10 flex gap-5 p-7">
        <div style={{ width: 720 }}>
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" style={{ borderRadius: 14, background: "transparent" }}>
            {/* Links */}
            <g>
              {model.links.map(link => {
                const s = model.nodes[link.source];
                const t = model.nodes[link.target];
                const midx = (s.x + t.x) / 2;
                const midy = (s.y + t.y) / 2;
                const stroke = link.active ? "#1F2937" : "#EF4444";
                const strokeDash = link.active ? "" : "4 6";
                return (
                  <g key={link.id} style={{ cursor: "pointer" }} onClick={() => toggleLink(link.id)}>
                    <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={stroke} strokeWidth={link.active ? 2.5 : 3} strokeDasharray={strokeDash} opacity={0.9} />
                    <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth={22} onClick={() => sendPacketOnLink(link.id)} />
                    <text x={midx} y={midy - 8} fontSize={10} textAnchor="middle" fill="#374151">{link.active ? "" : "DOWN"}</text>
                  </g>
                );
              })}
            </g>
            {/* Packets */}
            <g>{renderPackets()}</g>
            {/* Nodes */}
            <g>
              {model.nodes.map(node => (
                <g key={node.id} style={{ cursor: "pointer" }} onClick={() => toggleNode(node.id)}>
                  <circle cx={node.x} cy={node.y} r={NODE_RADIUS} fill="#FFFFFF" stroke="#1F2937" strokeWidth={2} />
                  <text x={node.x} y={node.y + 5} fontSize={11} fontWeight={600} textAnchor="middle" fill="#1F2937">{node.label}</text>
                </g>
              ))}
            </g>
            {/* Legend */}
            <g transform={`translate(${WIDTH - 220}, 20)`}>
              <rect x={0} y={-6} width={200} height={86} rx={8} fill="#FFFFFF" stroke="#E5E7EB" />
              <text x={12} y={12} fontSize={12} fontWeight={700} fill="#1F2937">Controls</text>
              <text x={12} y={30} fontSize={11} fill="#374151">• Click a link to toggle failure</text>
              <text x={12} y={46} fontSize={11} fill="#374151">• Click a node to toggle its links</text>
              <text x={12} y={62} fontSize={11} fill="#374151">• Click thick invisible line to send packet</text>
            </g>
          </svg>
        </div>
        <div style={{ width: 320 }}>
          <div style={{ padding: 12, background: "#111827ea", borderRadius: 12, boxShadow: "0 6px 22px 0 #67c8ff1a", border: "1.5px solid #334155" }}>
            <h3 style={{ margin: 0, marginBottom: 10, color: "#e0f2fe", fontWeight: 700, fontSize: 19 }}>Network Topologies</h3>
            <label style={{ display: "block", marginBottom: 8, color: "#bae6fd" }}>
              Topology
              <select value={topology} onChange={e => setTopology(e.target.value)} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, borderRadius: 7, background: "#0e172ab8", color: "#a5f3fc" }}>
                <option value="star">Star</option>
                <option value="ring">Ring</option>
                <option value="bus">Bus</option>
                <option value="mesh">Mesh</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label style={{ display: "block", marginBottom: 12, color: "#bae6fd" }}>
              Node count
              <input type="range" min={4} max={12} value={nodeCount} onChange={e => setNodeCount(parseInt(e.target.value))} style={{ width: "100%" }} />
              <div style={{ fontSize: 12, color: "#7dd3fc" }}>Nodes: {nodeCount}</div>
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setRunning(r => !r)} style={buttonStyle}>{running ? "Pause" : "Start"}</button>
              <button onClick={() => { sendRandomPacket(); }} style={buttonStyle}>Send Packet</button>
              <button onClick={() => { setPackets([]); }} style={buttonStyle}>Clear Packets</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button onClick={() => {
                setModel(m => ({ ...buildTopology(topology, nodeCount) }));
                setPackets([]);
              }} style={secondaryButton}>Reset Failures</button>
              <button onClick={() => {
                const links = model.links;
                if (links.length === 0) return;
                const l = links[Math.floor(Math.random() * links.length)];
                toggleLink(l.id);
              }} style={secondaryButton}>Simulate Random Failure</button>
            </div>
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, color: "#bae6fd", marginBottom: 6 }}>Current links ({model.links.length})</div>
              <div style={{ maxHeight: 160, overflow: "auto", padding: 6, background: "#0d253a", borderRadius: 8 }}>
                {model.links.map(l => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", alignItems: "center" }}>
                    <div style={{ fontSize: 13, color: "#a5f3fc" }}>#{l.id} — {model.nodes[l.source].label} ↔ {model.nodes[l.target].label}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: l.active ? "#10B981" : "#EF4444" }} />
                      <button onClick={() => toggleLink(l.id)} style={tinyButton}>{l.active ? "Down" : "Up"}</button>
                      <button onClick={() => sendPacketOnLink(l.id)} style={tinyButton}>Send</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "#bae6fd" }}>
              Tips: Click links to toggle failure. Click nodes to toggle all their links. Use "Send Packet" to visually trace how the topology forwards the packet.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  background: "#4B6CB7",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};
const secondaryButton = {
  padding: "8px 12px",
  border: "1px solid #4B6CB7",
  borderRadius: 8,
  background: "#071b2a",
  color: "#bae6fd",
  cursor: "pointer",
  fontWeight: 600,
};
const tinyButton = {
  padding: "6px 8px",
  border: "none",
  borderRadius: 6,
  background: "#67C8FF",
  color: "#fff",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
};
