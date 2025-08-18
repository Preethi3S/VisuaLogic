import React, { useEffect, useRef, useState } from "react";

export default function WebsiteArchitecture() {
  // UI & simulation state...
  const [logs, setLogs] = useState([]);
  const [highlight, setHighlight] = useState(""); // "client" | "server" | ""
  const [requestType, setRequestType] = useState("GET");
  const [isRunning, setIsRunning] = useState(false);

  // SVG refs for curved paths
  const reqPathRef = useRef(null);
  const resPathRef = useRef(null);

  // Packet state
  const [packets, setPackets] = useState([]);
  const rafRef = useRef(null);

  // Geometry (viewBox coordinates)
  const view = { w: 900, h: 260 };
  const clientBox = { x: 40, y: 40, w: 180, h: 180 };
  const serverBox = { x: view.w - 40 - 180, y: 40, w: 180, h: 180 };

  // Helper: append logs
  const pushLog = (line) => setLogs((prev) => [...prev, line]);

  // Server responses for request methods
  const statusFor = (method) => {
    switch (method) {
      case "POST":
        return { code: 201, text: "Created" };
      case "PUT":
        return { code: 200, text: "OK (updated)" };
      case "DELETE":
        return { code: 204, text: "No Content" };
      default:
        return { code: 200, text: "OK" };
    }
  };

  // Fake payload examples
  const samplePayload = (method) => {
    if (method === "GET") return undefined;
    if (method === "DELETE") return undefined;
    if (method === "POST") return { title: "New Post", body: "Hello" };
    if (method === "PUT") return { title: "Updated Title" };
  };

  const reset = () => {
    setLogs([]);
    setHighlight("");
    setPackets([]);
    setIsRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const run = () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);

    const payload = samplePayload(requestType);
    pushLog(
      `Client → Server: ${requestType} /articles ${
        payload ? `with payload ${JSON.stringify(payload)}` : "(no body)"}`
    );
    setHighlight("client");

    // Create animated packet dots
    const colors = ["#67C8FF", "#4B6CB7", "#10B981", "#F59E0B", "#111827"];
    const burst = Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      phase: "request",
      startTime: performance.now(),
      progress: 0,
      active: true,
      color: colors[i % colors.length],
      delay: i * 140,
    }));
    setPackets(burst);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const DURATION_REQ = 2000; // ms
  const DURATION_RES = 2200; // ms

  const tick = (now) => {
    setPackets((prev) => {
      const next = prev.map((p) => {
        if (!p.active) return p;
        const pathEl =
          p.phase === "request" ? reqPathRef.current : resPathRef.current;
        if (!pathEl) return p;

        const elapsed = now - (p.startTime + p.delay);
        const dur = p.phase === "request" ? DURATION_REQ : DURATION_RES;
        const progress = Math.max(0, Math.min(1, elapsed / dur));

        // Switch to response when request reaches server
        if (progress >= 1 && p.phase === "request") {
          return {
            ...p,
            phase: "response",
            startTime: now,
            delay: 0,
            progress: 0,
          };
        }

        // Finish after response arrives at client
        if (progress >= 1 && p.phase === "response") {
          return { ...p, active: false, progress: 1 };
        }

        return { ...p, progress };
      });

      // Highlight + logs side-effects
      const someoneOnRequest = next.some(
        (p) => p.phase === "request" && p.active
      );
      const someoneOnResponse = next.some(
        (p) => p.phase === "response" && p.active
      );

      if (someoneOnRequest) {
        if (highlight !== "client") setHighlight("client");
      } else if (someoneOnResponse) {
        if (highlight !== "server") {
          setHighlight("server");
          pushLog(`Server: Processing ${requestType} /articles`);
          const { code, text } = statusFor(requestType);
          pushLog(
            `Server → Client: ${code} ${text}${
              requestType !== "DELETE" ? " with JSON" : ""
            }`
          );
        }
      }

      const anyActive = next.some((p) => p.active);
      if (!anyActive) {
        setHighlight("client");
        pushLog(
          "Client: Response received. Rendering page (update DOM / hydrate state)"
        );
        setIsRunning(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
      return next;
    });
  };

  const packetDot = (p) => {
    const pathEl =
      p.phase === "request" ? reqPathRef.current : resPathRef.current;
    if (!pathEl) return null;
    const len = pathEl.getTotalLength();
    const pt = pathEl.getPointAtLength(len * p.progress);
    return (
      <circle
        key={`${p.id}-${p.phase}`}
        cx={pt.x}
        cy={pt.y}
        r={6}
        fill={p.color}
        opacity={p.active ? 0.85 : 0}
        stroke="#111827"
        strokeWidth={1}
        style={{
          filter: `drop-shadow(0 0 8px ${p.color})`,
          transition: "opacity 0.2s"
        }}
      />
    );
  };

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  return (
    <div className="relative min-h-screen font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Main Content */}
      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-8">
        <h1 className="text-2xl font-extrabold text-cyan-400 drop-shadow-[0_0_10px_#67C8FF] mb-4">
          Website Architecture Visualizer
        </h1>

        {/* Controls */}
        <div className="glass-card bg-black/50 border border-cyan-400/30 flex flex-wrap items-center gap-3 rounded-2xl p-4 mb-6 shadow-lg">
          <label className="flex items-center gap-2 text-cyan-200">
            <span className="text-sm">Request Type</span>
            <select
              className="p-2 border rounded-xl bg-black/70 border-cyan-500/30 text-cyan-300"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              disabled={isRunning}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </label>
          <button
            className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-semibold shadow border border-cyan-400/50 hover:bg-cyan-400 disabled:opacity-50"
            onClick={run}
            disabled={isRunning}
          >
            {isRunning ? "Running…" : "Send Request"}
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-white/10 border border-cyan-500/40 text-cyan-300 font-semibold shadow"
            onClick={reset}
            disabled={isRunning}
          >
            Reset
          </button>
        </div>

        {/* Diagram */}
        <div className="w-full overflow-hidden rounded-2xl border bg-black/60 border-cyan-400/20 shadow-md relative">
          <svg viewBox={`0 0 ${view.w} ${view.h}`} className="w-full h-[280px]">
            {/* Request path (top curve) */}
            <path
              ref={reqPathRef}
              d={`M ${clientBox.x + clientBox.w} ${clientBox.y + clientBox.h / 3}
                  C ${clientBox.x + clientBox.w + 160} ${clientBox.y - 40},
                    ${serverBox.x - 160} ${serverBox.y - 40},
                    ${serverBox.x} ${serverBox.y + serverBox.h / 3}`}
              stroke="#67C8FF"
              strokeWidth={2.5}
              fill="none"
            />

            {/* Response path (bottom curve) */}
            <path
              ref={resPathRef}
              d={`M ${serverBox.x} ${serverBox.y + (serverBox.h * 2) / 3}
                  C ${serverBox.x - 160} ${serverBox.y + serverBox.h + 60},
                    ${clientBox.x + clientBox.w + 160} ${clientBox.y + clientBox.h + 60},
                    ${clientBox.x + clientBox.w} ${clientBox.y + (clientBox.h * 2) / 3}`}
              stroke="#67C8FF"
              strokeWidth={2.5}
              fill="none"
            />

            {/* Arrowheads */}
            <defs>
              <marker
                id="ah"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#67C8FF" />
              </marker>
            </defs>
            <line
              x1={serverBox.x - 10}
              y1={serverBox.y + serverBox.h / 3}
              x2={serverBox.x}
              y2={serverBox.y + serverBox.h / 3}
              stroke="#67C8FF"
              strokeWidth={2.5}
              markerEnd="url(#ah)"
            />
            <line
              x1={clientBox.x + clientBox.w}
              y1={clientBox.y + (clientBox.h * 2) / 3}
              x2={clientBox.x + clientBox.w + 10}
              y2={clientBox.y + (clientBox.h * 2) / 3}
              stroke="#67C8FF"
              strokeWidth={2.5}
              markerEnd="url(#ah)"
            />

            {/* Animated packets */}
            {packets.map((p) => p.active && packetDot(p))}

            {/* Client box */}
            <rect
              x={clientBox.x}
              y={clientBox.y}
              width={clientBox.w}
              height={clientBox.h}
              rx={18}
              ry={18}
              fill={highlight === "client" ? "#FDE68A" : "#1a2742"}
              stroke={highlight === "client" ? "#CA8A04" : "#67C8FF"}
              strokeWidth={3}
            />
            <text
              x={clientBox.x + 16}
              y={clientBox.y + 36}
              fontSize={16}
              fill="#67C8FF"
              style={{ fontWeight: 600, filter: "drop-shadow(0 0 6px #67C8FF99)" }}
            >
              Client (Browser)
            </text>
            <text
              x={clientBox.x + 16}
              y={clientBox.y + 64}
              fontSize={12}
              fill="#aadfff"
            >
              HTML/CSS/JS
            </text>

            {/* Server box */}
            <rect
              x={serverBox.x}
              y={serverBox.y}
              width={serverBox.w}
              height={serverBox.h}
              rx={18}
              ry={18}
              fill={highlight === "server" ? "#FDE68A" : "#16281e"}
              stroke={highlight === "server" ? "#CA8A04" : "#10B981"}
              strokeWidth={3}
            />
            <text
              x={serverBox.x + 16}
              y={serverBox.y + 36}
              fontSize={16}
              fill="#10B981"
              style={{ fontWeight: 600, filter: "drop-shadow(0 0 6px #10B98199)" }}
            >
              Server
            </text>
            <text
              x={serverBox.x + 16}
              y={serverBox.y + 64}
              fontSize={12}
              fill="#afffd5"
            >
              App + DB
            </text>
          </svg>
        </div>

        {/* Logs */}
        <div className="glass-card border rounded-lg bg-black/50 border-cyan-400/30 text-cyan-200 p-4 shadow">
          <h2 className="text-lg font-semibold text-cyan-300 mb-2">
            HTTP Request/Response Cycle
          </h2>
          {logs.length === 0 ? (
            <p className="text-cyan-400/70">
              Click "Send Request" to simulate the flow.
            </p>
          ) : (
            <ol className="list-decimal pl-6 space-y-1">
              {logs.map((l, i) => (
                <li key={i} className="font-mono text-sm">
                  {l}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Legend */}
        <div className="glass-card flex flex-wrap gap-6 text-sm text-cyan-200 bg-black/40 border border-cyan-400/30 rounded-xl p-4 shadow">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-cyan-400" />
            Packet (segment)
          </span>
          <span className="">Top curve: <span className="text-cyan-300">Request →</span></span>
          <span className="">Bottom curve: <span className="text-cyan-300">← Response</span></span>
        </div>
      </div>
    </div>
  );
}
