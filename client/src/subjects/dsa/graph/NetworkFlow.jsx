import React, { useState } from "react";
import { motion } from "framer-motion";

export default function NetworkFlow() {
  const nodes = ["S", "A", "B", "C", "T"];
  const edges = [
    ["S", "A", 10],
    ["S", "C", 10],
    ["A", "B", 4],
    ["A", "C", 2],
    ["C", "B", 8],
    ["B", "T", 10],
    ["C", "T", 10],
  ];

  const positions = {
    S: [50, 150],
    A: [150, 50],
    B: [300, 50],
    C: [150, 250],
    T: [400, 150],
  };

  const [flowEdges, setFlowEdges] = useState([]);
  const [running, setRunning] = useState(false);
  const [maxFlow, setMaxFlow] = useState(0);
  const [currentStep, setCurrentStep] = useState({});
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  const runFordFulkerson = () => {
    setFlowEdges([]);
    setRunning(true);
    setMaxFlow(0);
    setCurrentStep({});

    // Build residual graph
    const capacity = {};
    edges.forEach(([u, v, w]) => {
      capacity[`${u}-${v}`] = w;
      capacity[`${v}-${u}`] = 0; // residual
    });

    const adj = {};
    nodes.forEach((n) => (adj[n] = []));
    edges.forEach(([u, v]) => {
      adj[u].push(v);
      adj[v].push(u);
    });

    let totalFlow = 0;
    const steps = [];

    const bfs = () => {
      const parent = {};
      const visited = new Set();
      const queue = ["S"];
      visited.add("S");

      while (queue.length) {
        const u = queue.shift();
        for (let v of adj[u]) {
          if (!visited.has(v) && capacity[`${u}-${v}`] > 0) {
            visited.add(v);
            parent[v] = u;
            if (v === "T") return parent;
            queue.push(v);
          }
        }
      }
      return null;
    };

    let parent;
    while ((parent = bfs())) {
      // find bottleneck
      let path = [];
      let v = "T";
      let bottleneck = Infinity;
      while (v !== "S") {
        const u = parent[v];
        bottleneck = Math.min(bottleneck, capacity[`${u}-${v}`]);
        path.unshift([u, v]);
        v = u;
      }

      totalFlow += bottleneck;
      path.forEach(([u, v]) => {
        capacity[`${u}-${v}`] -= bottleneck;
        capacity[`${v}-${u}`] += bottleneck;
      });

      steps.push({ path, bottleneck, totalFlow });
    }

    // Animate steps
    steps.forEach((step, i) => {
      setTimeout(() => {
        setFlowEdges(step.path.map(([u, v]) => ({ u, v, bottleneck: step.bottleneck })));
        setMaxFlow(step.totalFlow);
        setCurrentStep(step);
        if (i === steps.length - 1) setRunning(false);
      }, i * 1700);
    });
  };

  // Edge/Node hover helpers
  function edgeIsActive(u, v) {
    return flowEdges.some(
      (e) => (e.u === u && e.v === v) || (e.u === v && e.v === u)
    );
  }

  function getEdgeBottleneck(u, v) {
    const fe = flowEdges.find(
      (e) => (e.u === u && e.v === v) || (e.u === v && e.v === u)
    );
    return fe ? fe.bottleneck : null;
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center py-8">
        <motion.h2
          className="text-3xl font-bold text-blue-500 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80 }}
        >
          💧 Network Flow Visualizer (Ford-Fulkerson)
        </motion.h2>
        <motion.button
          disabled={running}
          onClick={runFordFulkerson}
          className="mb-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded shadow hover:bg-blue-600 transition"
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.96 }}
        >
          Start Max Flow
        </motion.button>
        {running && (
          <span className="text-blue-600 font-medium animate-pulse mb-2">Running...</span>
        )}
        {/* SVG Graph */}
        <motion.svg
          width="500"
          height="350"
          className="rounded-lg"
          style={{ background: "#fff", boxShadow: "0 8px 32px rgba(67,201,255,0.07)", marginTop: 2 }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Edges */}
          {edges.map(([u, v, w], i) => {
            const [x1, y1] = positions[u];
            const [x2, y2] = positions[v];
            const active = edgeIsActive(u, v);
            const isHovered = hoveredEdge === `${u}-${v}` || hoveredEdge === `${v}-${u}`;
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    active
                      ? "#10B981"
                      : isHovered
                      ? "#FF6B6B"
                      : "#4B6CB7"
                  }
                  strokeWidth={active || isHovered ? "5" : "2"}
                  markerEnd="url(#arrow)"
                  style={{
                    filter: active ? "drop-shadow(0 0 10px #10B981)" : undefined,
                    transition: "stroke 0.2s, stroke-width 0.2s"
                  }}
                  onMouseEnter={() => setHoveredEdge(`${u}-${v}`)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  className={active ? "animate-pulse" : ""}
                />
                {/* Capacity label */}
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 5}
                  fontSize="14"
                  fill={active ? "#10B981" : "#1F2937"}
                  fontWeight={active ? "bold" : "normal"}
                  textAnchor="middle"
                  style={{
                    textShadow: active
                      ? "0 0 6px #10B981"
                      : "0 0 4px #4B6CB7"
                  }}
                >
                  {w}
                </text>
                {/* Bottleneck display on active edge */}
                {active && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 + 16}
                    fontSize="13"
                    fill="#F59E0B"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Bn: {getEdgeBottleneck(u, v)}
                  </text>
                )}
              </g>
            );
          })}
          {/* Nodes */}
          {nodes.map((node) => {
            const [x, y] = positions[node];
            const isHovered = hoveredNode === node;
            return (
              <g
                key={node}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: "pointer" }}
              >
                <motion.circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 28 : 22}
                  fill="#67C8FF"
                  stroke="#1F2937"
                  strokeWidth={isHovered ? 5 : 2}
                  style={{
                    filter: isHovered
                      ? "drop-shadow(0 0 10px #FF6B6B)"
                      : "drop-shadow(0 0 7px #67C8FF)",
                    transition: "r 0.18s, stroke-width 0.16s"
                  }}
                />
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  fontWeight="bold"
                  fill="#1F2937"
                  style={{
                    fontSize: isHovered ? "1.3em" : "1em",
                    textShadow: "0 0 6px #fff"
                  }}
                >
                  {node}
                </text>
              </g>
            );
          })}
          {/* Arrow Marker */}
          <defs>
            <marker
              id="arrow"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#4B6CB7" />
            </marker>
          </defs>
        </motion.svg>
        {/* Path and result display */}
        {currentStep.path && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.23 }}
            className="w-full max-w-md bg-white/90 rounded shadow-md mt-8 p-4"
          >
            <h3 className="font-semibold text-blue-500 text-lg mb-1">Current Path</h3>
            <div className="mb-1 text-gray-800">
              {currentStep.path.map(([u, v]) => `${u}→${v}`).join(" → ")}
            </div>
            <div>
              <span className="text-green-600 font-semibold">Bottleneck: </span>
              <span className="font-bold">{currentStep.bottleneck}</span>
            </div>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-md bg-white/90 rounded shadow-md mt-4 p-4"
        >
          <h3 className="font-semibold text-blue-500 text-lg mb-2">Max Flow</h3>
          <p className="text-xl font-bold text-green-700">{maxFlow}</p>
        </motion.div>
      </div>
    </div>
  );
}
