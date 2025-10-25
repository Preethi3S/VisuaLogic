// src/scenes/SecurityScene.jsx
import React, { useRef, useEffect, useState } from "react";

// ----------- Firewall Visualizer -----------
function FirewallVisualizer() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [running, setRunning] = useState(true);
  const [blockHTTP, setBlockHTTP] = useState(true);
  const packetsRef = useRef([]);
  const rulesRef = useRef({ blockHTTP });

  useEffect(() => { rulesRef.current = { blockHTTP }; }, [blockHTTP]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 820; canvas.height = 360;

    const firewall = { x: 360, y: 80, w: 120, h: 200 };

    function spawnPacket() {
      const p = {
        x: 40, y: 120 + Math.random() * 120,
        vx: 1.5,
        port: [80, 443, 22][Math.floor(Math.random() * 3)],
        state: "toFW", color: "#67C8FF"
      };
      packetsRef.current.push(p);
    }

    function inspect(p) {
      p.vx = 0;
      setTimeout(() => {
        if (rulesRef.current.blockHTTP && p.port === 80) {
          p.vx = -1.5; p.color = "#F59E0B"; p.state = "blocked";
        } else { p.vx = 1.8; p.color = "#10B981"; p.state = "passed"; }
      }, 400);
    }

    function loop() {
      if (Math.random() < 0.02) spawnPacket();
      ctx.clearRect(0, 0, 820, 360);

      ctx.fillStyle = "#0d1117"; ctx.strokeStyle = "#67C8FF"; ctx.lineWidth = 2;
      ctx.fillRect(firewall.x, firewall.y, firewall.w, firewall.h);
      ctx.strokeRect(firewall.x, firewall.y, firewall.w, firewall.h);
      ctx.fillStyle = "#67C8FF"; ctx.font = "14px monospace";
      ctx.fillText("FIREWALL", firewall.x + 15, firewall.y + 20);

      for (let i = packetsRef.current.length - 1; i >= 0; i--) {
        const p = packetsRef.current[i];
        p.x += p.vx;
        if (p.state === "toFW" && p.x >= firewall.x) { inspect(p); }
        if ((p.state === "blocked" && p.x < 0) || (p.state === "passed" && p.x > 820)) {
          packetsRef.current.splice(i, 1);
        }
        ctx.beginPath(); ctx.fillStyle = p.color; ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "10px monospace"; ctx.fillText(p.port, p.x - 6, p.y + 3);
      }
      if (running) rafRef.current = requestAnimationFrame(loop);
    }

    if (running) rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  return (
    <div>
      <button style={btnStyle} onClick={() => setRunning(r => !r)}>{running ? "Pause" : "Play"}</button>
      <label style={{ marginLeft: 12, color: "#fff" }}>
        <input type="checkbox" checked={blockHTTP} onChange={e => setBlockHTTP(e.target.checked)} />
        Block Port 80
      </label>
      <canvas ref={canvasRef} style={canvasStyle} />
    </div>
  );
}

// ----------- NAT Visualizer -----------
function NATVisualizer() {
  const canvasRef = useRef(null); const rafRef = useRef(null);
  const [running, setRunning] = useState(true);
  const publicIP = "203.0.113.5"; const tableRef = useRef([]); const packetsRef = useRef([]);

  useEffect(() => {
    const c = canvasRef.current, ctx = c.getContext("2d"); c.width = 820; c.height = 360;
    function spawn() { packetsRef.current.push({ x: 60, y: 100 + Math.random() * 120, vx: 1.5, state: "toNAT", src: "192.168.0." + Math.floor(2 + Math.random() * 10), sport: 1000 + Math.floor(Math.random() * 5000) }); }
    function loop() {
      if (Math.random() < 0.02) spawn();
      ctx.clearRect(0, 0, 820, 360);

      ctx.fillStyle = "#0d1117"; ctx.strokeStyle = "#67C8FF"; ctx.lineWidth = 2;
      ctx.fillRect(360, 80, 120, 200); ctx.strokeRect(360, 80, 120, 200);
      ctx.fillStyle = "#67C8FF"; ctx.font = "14px monospace"; ctx.fillText("NAT", 400, 100);

      packetsRef.current.forEach((p, i) => {
        p.x += p.vx;
        if (p.state === "toNAT" && p.x >= 360) {
          const port = 40000 + Math.floor(Math.random() * 2000);
          tableRef.current.push({ pri: `${p.src}:${p.sport}`, pub: `${publicIP}:${port}` });
          p.state = "toNet"; p.vx = 1.8; p.color = "#67C8FF";
        }
        if (p.state === "toNet" && p.x > 820) packetsRef.current.splice(i, 1);
        ctx.beginPath(); ctx.fillStyle = p.color || "#10B981";
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
      });

      if (running) rafRef.current = requestAnimationFrame(loop);
    }
    if (running) rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  return (
    <div>
      <button style={btnStyle} onClick={() => setRunning(r => !r)}>{running ? "Pause" : "Play"}</button>
      <canvas ref={canvasRef} style={canvasStyle} />
      <div style={{ marginTop: 8, fontSize: 13, color: "#fff", fontFamily: "monospace" }}>
        <strong>Translation Table:</strong>
        {tableRef.current.slice(-6).map((m, i) => <div key={i}>{m.pri} → {m.pub}</div>)}
      </div>
    </div>
  );
}

// ----------- VPN Visualizer -----------
function VPNVisualizer() {
  const canvasRef = useRef(null); const rafRef = useRef(null);
  const [running, setRunning] = useState(true); const [encrypted, setEncrypted] = useState(true);
  const packetsRef = useRef([]);

  useEffect(() => {
    const c = canvasRef.current, ctx = c.getContext("2d"); c.width = 820; c.height = 360;
    function spawn() { packetsRef.current.push({ x: 60, y: 180, vx: 1.5, state: "client" }); }
    function loop() {
      if (Math.random() < 0.02) spawn();
      ctx.clearRect(0, 0, 820, 360);
      ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
      ctx.fillText("Client", 40, 200); ctx.fillText("Server", 740, 200);

      ctx.strokeStyle = encrypted ? "#4B6CB7" : "#9CA3AF"; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(100, 180); ctx.lineTo(720, 180); ctx.stroke(); ctx.setLineDash([]);

      packetsRef.current.forEach((p, i) => {
        p.x += p.vx;
        if (p.x > 720) packetsRef.current.splice(i, 1);
        if (encrypted) { ctx.fillStyle = "#4B6CB7"; ctx.fillRect(p.x, p.y - 6, 24, 12); ctx.fillStyle = "#fff"; ctx.fillText("🔒", p.x + 4, p.y + 4); }
        else { ctx.beginPath(); ctx.fillStyle = "#67C8FF"; ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill(); }
      });

      if (running) rafRef.current = requestAnimationFrame(loop);
    }
    if (running) rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, encrypted]);

  return (
    <div>
      <button style={btnStyle} onClick={() => setRunning(r => !r)}>{running ? "Pause" : "Play"}</button>
      <label style={{ marginLeft: 12, color: "#fff" }}>
        <input type="checkbox" checked={encrypted} onChange={e => setEncrypted(e.target.checked)} />
        Encrypt Tunnel
      </label>
      <canvas ref={canvasRef} style={canvasStyle} />
    </div>
  );
}

// ----------- Shared Styles -----------
const canvasStyle = {
  marginTop: 8,
  backgroundColor: "#0d1117",
  border: "1px solid #67C8FF",
  borderRadius: "6px",
  boxShadow: "0 0 10px rgba(103,200,255,0.4)",
};
const btnStyle = {
  background: "#4B6CB7",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontFamily: "monospace",
};

// ----------- Main SecurityScene Wrapper -----------
export default function SecurityScene() {
  const [active, setActive] = useState("firewall");

  // Static cyber grid background (no animation classes)
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => {
      document.body.classList.remove("bg-cyber-grid");
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div className="relative z-10" style={{
        padding: 16,
        fontFamily: "monospace",
        // Remove backgroundColor/backgroundImage, now handled by cyber grid
        color: "#fff",
        minHeight: "100vh"
      }}>
        <h2 style={{ color: "#67C8FF" }}>🔐 Security Concepts</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button style={btnStyle} onClick={() => setActive("firewall")}>Firewall</button>
          <button style={btnStyle} onClick={() => setActive("nat")}>NAT</button>
          <button style={btnStyle} onClick={() => setActive("vpn")}>VPN</button>
        </div>
        {active === "firewall" && <FirewallVisualizer />}
        {active === "nat" && <NATVisualizer />}
        {active === "vpn" && <VPNVisualizer />}
      </div>
    </div>
  );
}
