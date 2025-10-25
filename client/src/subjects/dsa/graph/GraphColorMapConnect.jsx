// src/scenes/GraphAdvanced.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";

export default function GraphAdvanced() {
  const nodes = ["A", "B", "C", "D", "E"];
  const edges = [
    ["A", "B"],
    ["A", "C"],
    ["B", "C"],
    ["B", "D"],
    ["C", "E"],
    ["D", "E"],
  ];

  const positions = {
    A: [100, 50],
    B: [300, 50],
    C: [200, 150],
    D: [300, 250],
    E: [100, 250],
  };

  const [algorithm, setAlgorithm] = useState("Coloring");
  const [colors, setColors] = useState({});
  const [matching, setMatching] = useState([]);
  const [components, setComponents] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // --- Graph Coloring (Greedy) ---
  const runColoring = () => {
    let adjacencyList = {};
    nodes.forEach((n) => (adjacencyList[n] = []));
    edges.forEach(([u, v]) => {
      adjacencyList[u].push(v);
      adjacencyList[v].push(u);
    });

    const colorMap = {};
    nodes.forEach((node) => {
      const used = new Set(adjacencyList[node].map((nbr) => colorMap[nbr]));
      let c = 1;
      while (used.has(c)) c++;
      colorMap[node] = c;
    });

    setColors(colorMap);
    setMatching([]);
    setComponents([]);
  };

  // --- Maximum Matching (Greedy approximation) ---
  const runMatching = () => {
    const matched = new Set();
    const matches = [];

    edges.forEach(([u, v]) => {
      if (!matched.has(u) && !matched.has(v)) {
        matches.push([u, v]);
        matched.add(u);
        matched.add(v);
      }
    });

    setMatching(matches);
    setColors({});
    setComponents([]);
  };

  // --- Connectivity (DFS to find components) ---
  const runConnectivity = () => {
    let adjacencyList = {};
    nodes.forEach((n) => (adjacencyList[n] = []));
    edges.forEach(([u, v]) => {
      adjacencyList[u].push(v);
      adjacencyList[v].push(u);
    });

    const visitedSet = new Set();
    const comps = [];

    const dfs = (node, comp) => {
      visitedSet.add(node);
      comp.push(node);
      adjacencyList[node].forEach((nbr) => {
        if (!visitedSet.has(nbr)) dfs(nbr, comp);
      });
    };

    nodes.forEach((n) => {
      if (!visitedSet.has(n)) {
        const comp = [];
        dfs(n, comp);
        comps.push(comp);
      }
    });

    setComponents(comps);
    setColors({});
    setMatching([]);
  };

  const runAlgorithm = () => {
    if (algorithm === "Coloring") runColoring();
    else if (algorithm === "Matching") runMatching();
    else runConnectivity();
  };

  const colorPalette = ["#67C8FF", "#10B981", "#F59E0B", "#4B6CB7", "#FF6B6B"];

  // Degree lookup
  const adjList = {};
  nodes.forEach((n) => (adjList[n] = []));
  edges.forEach(([u, v]) => {
    adjList[u].push(v);
    adjList[v].push(u);
  });

  // Color legend: show what colors mean
  function renderLegend() {
    if (algorithm === "Coloring") {
      // Show which node got which color
      return (
        <div className="flex flex-wrap gap-3 justify-center mt-3">
          {Object.entries(colors).map(([node, colorIdx]) => (
            <div key={node} className="flex items-center gap-2 px-2 py-1 rounded border bg-white/90">
              <span style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                background: colorPalette[(colorIdx - 1) % colorPalette.length],
                borderRadius: '50%',
                border: '1px solid #333'
              }}/>
              <span className="font-semibold">{node}</span>
              <span className="text-xs text-gray-500">(Color {colorIdx})</span>
            </div>
          ))}
        </div>
      );
    }
    if (algorithm === "Connectivity" && components.length) {
      return (
        <div className="flex flex-wrap gap-3 justify-center mt-3">
          {components.map((comp, idx) => (
            <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded border bg-white/90">
              <span style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                background: colorPalette[idx % colorPalette.length],
                borderRadius: '50%',
                border: '1px solid #333'
              }}/>{" "}
              <span className="font-semibold">Comp {idx + 1}: {comp.join(", ")}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Cyber Grid Animated Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Main content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center py-8">
        <motion.h2
          className="text-3xl font-bold text-blue-500 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80 }}
        >
          🎨 Advanced Graph Visualizer
        </motion.h2>

        {/* Algorithm selection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-3 rounded-lg bg-white/80 backdrop-blur shadow flex flex-wrap gap-2 items-center justify-center"
        >
          {["Coloring", "Matching", "Connectivity"].map((algo) => (
            <button
              key={algo}
              disabled={algorithm === algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-4 py-2 rounded font-semibold transition 
                ${
                  algorithm === algo
                    ? "bg-blue-500 text-white cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-blue-400 hover:text-white"
                }`}
            >
              {algo}
            </button>
          ))}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={runAlgorithm}
            className="px-4 py-2 rounded font-semibold bg-green-500 text-white"
          >
            Run
          </motion.button>
        </motion.div>

        {/* Graph SVG */}
        <motion.svg
          width="400"
          height="300"
          className="rounded-lg"
          style={{ background: "#fff", boxShadow: "0 8px 32px rgba(67,201,255,0.07)" }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Edges */}
          {edges.map(([u, v], i) => {
            const [x1, y1] = positions[u];
            const [x2, y2] = positions[v];
            const isMatched = matching.some(([a, b]) =>
              (a === u && b === v) || (a === v && b === u)
            );
            const isHovered = hoveredEdge === `${u}-${v}` || hoveredEdge === `${v}-${u}`;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={
                  isMatched
                    ? "#10B981"
                    : isHovered
                    ? "#FF6B6B"
                    : "#4B6CB7"
                }
                strokeWidth={isMatched ? "5" : isHovered ? "5" : "2"}
                style={{
                  filter: isMatched ? "drop-shadow(0 0 8px #10B981)" : undefined,
                  transition: "stroke 0.2s, stroke-width 0.2s"
                }}
                onMouseEnter={() => setHoveredEdge(`${u}-${v}`)}
                onMouseLeave={() => setHoveredEdge(null)}
                className={isMatched ? "animate-pulse" : ""}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const [x, y] = positions[node];
            let fill = "#67C8FF";
            let outline = "#1F2937";

            if (algorithm === "Coloring" && colors[node])
              fill = colorPalette[(colors[node] - 1) % colorPalette.length];

            if (algorithm === "Connectivity" && components.length) {
              components.forEach((comp, idx) => {
                if (comp.includes(node)) fill = colorPalette[idx % colorPalette.length];
              });
            }

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
                  r={isHovered ? 29 : 22}
                  fill={fill}
                  stroke={outline}
                  strokeWidth={isHovered ? 5 : 2}
                  style={{
                    filter: isHovered
                      ? "drop-shadow(0 0 16px #FF6B6B)"
                      : "drop-shadow(0 0 6px #aaf)",
                    transition: "r 0.18s, stroke-width 0.16s"
                  }}
                />
                <text
                  x={x}
                  y={y + 6}
                  fontWeight="bold"
                  fill="#1F2937"
                  textAnchor="middle"
                  style={{
                    fontSize: isHovered ? "1.3em" : "1em",
                    textShadow: "0 0 6px #fff"
                  }}
                >
                  {node}
                </text>
                {isHovered && (
                  <text
                    x={x}
                    y={y - 32}
                    textAnchor="middle"
                    fontWeight="bold"
                    fill="#FF6B6B"
                    fontSize="0.9em"
                  >
                    Degree: {adjList[node].length}
                  </text>
                )}
              </g>
            );
          })}
        </motion.svg>

        {renderLegend()}

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md mx-auto
            bg-white/90 backdrop-blur border rounded-lg shadow-md mt-8 p-4 flex flex-col items-center"
        >
          {algorithm === "Coloring" && (
            <>
              <h3 className="font-semibold text-blue-500 text-lg mb-2">Node Colors</h3>
              <p>
                {nodes.map((n) => `${n}: ${colors[n] || "-"} `).join(" | ")}
              </p>
            </>
          )}
          {algorithm === "Matching" && (
            <>
              <h3 className="font-semibold text-green-600 text-lg mb-2">Matching</h3>
              <p>
                {matching.length
                  ? matching.map(([u, v]) => `${u}-${v}`).join(", ")
                  : "..."}
              </p>
            </>
          )}
          {algorithm === "Connectivity" && (
            <>
              <h3 className="font-semibold text-purple-500 text-lg mb-2">Connected Components</h3>
              <p>
                {components.length
                  ? components
                      .map((comp, i) => `C${i + 1}: ${comp.join(", ")}`)
                      .join(" | ")
                  : "..."}
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
