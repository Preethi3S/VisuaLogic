import React, { useState } from "react";
import { motion } from "framer-motion";

export default function MSTVisualizer() {
  const nodes = ["A", "B", "C", "D", "E"];
  const edges = [
    ["A", "B", 4],
    ["A", "C", 2],
    ["B", "C", 5],
    ["B", "D", 10],
    ["C", "E", 3],
    ["E", "D", 4],
  ];

  const positions = {
    A: [100, 100],
    B: [300, 100],
    C: [200, 200],
    D: [400, 200],
    E: [300, 300],
  };

  const [mstEdges, setMstEdges] = useState([]);
  const [running, setRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState("Prim");
  const [currentStepEdges, setCurrentStepEdges] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // --- Prim's Algorithm ---
  const runPrims = (start = "A") => {
    setMstEdges([]);
    setRunning(true);
    setCurrentStepEdges([]);

    let visited = new Set([start]);
    let chosenEdges = [];
    let steps = [];

    while (visited.size < nodes.length) {
      let candidates = edges.filter(
        ([u, v]) =>
          (visited.has(u) && !visited.has(v)) ||
          (visited.has(v) && !visited.has(u))
      );
      let smallest = candidates.reduce((a, b) => (a[2] < b ? a : b));
      chosenEdges.push(smallest);
      steps.push([...chosenEdges]);
      visited.add(smallest);
      visited.add(smallest);
    }

    steps.forEach((step, i) => {
      setTimeout(() => {
        setMstEdges(step);
        setCurrentStepEdges([step[step.length - 1]]);
        if (i === steps.length - 1) {
          setCurrentStepEdges([]);
          setRunning(false);
        }
      }, i * 1200);
    });
  };

  // --- Kruskal's Algorithm ---
  const runKruskals = () => {
    setMstEdges([]);
    setRunning(true);
    setCurrentStepEdges([]);

    let sortedEdges = [...edges].sort((a, b) => a - b);
    let parent = {};
    nodes.forEach((n) => (parent[n] = n));

    const find = (n) => {
      if (parent[n] !== n) parent[n] = find(parent[n]);
      return parent[n];
    };
    const union = (u, v) => {
      let ru = find(u);
      let rv = find(v);
      if (ru !== rv) parent[ru] = rv;
    };

    let chosenEdges = [];
    let steps = [];
    sortedEdges.forEach(([u, v, w]) => {
      if (find(u) !== find(v)) {
        chosenEdges.push([u, v, w]);
        union(u, v);
        steps.push([...chosenEdges]);
      }
    });

    steps.forEach((step, i) => {
      setTimeout(() => {
        setMstEdges(step);
        setCurrentStepEdges([step[step.length - 1]]);
        if (i === steps.length - 1) {
          setCurrentStepEdges([]);
          setRunning(false);
        }
      }, i * 1200);
    });
  };

  const runMST = () => {
    if (algorithm === "Prim") runPrims();
    else runKruskals();
  };

  // Extra helpers
  function edgeIsInMST(u, v) {
    return mstEdges.some(
      ([a, b]) => (a === u && b === v) || (a === v && b === u)
    );
  }
  function edgeIsCurrent(u, v) {
    return currentStepEdges.some(
      ([a, b]) => (a === u && b === v) || (a === v && b === u)
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      <div className="relative z-10 flex flex-col items-center justify-center py-7 w-full">
        <motion.h2
          className="text-3xl font-bold text-blue-500 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80 }}
        >
          🌲 Minimum Spanning Tree Visualizer
        </motion.h2>
        {/* Algorithm Selection Controls */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-6 p-3 rounded-lg bg-white/80 backdrop-blur shadow flex flex-wrap gap-2 items-center justify-center"
        >
          <button
            disabled={running}
            onClick={() => setAlgorithm("Prim")}
            className={`px-4 py-2 rounded font-semibold transition ${
              algorithm === "Prim" ? "bg-blue-500 text-white cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-blue-400 hover:text-white"
            }`}
          >
            Prim’s
          </button>
          <button
            disabled={running}
            onClick={() => setAlgorithm("Kruskal")}
            className={`px-4 py-2 rounded font-semibold transition ${
              algorithm === "Kruskal" ? "bg-blue-500 text-white cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-blue-400 hover:text-white"
            }`}
          >
            Kruskal’s
          </button>
          <motion.button
            disabled={running}
            onClick={runMST}
            className="px-4 py-2 rounded font-semibold bg-green-500 text-white"
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.96 }}
          >
            Start {algorithm}
          </motion.button>
          {running && (
            <span className="ml-3 text-blue-500 font-semibold animate-pulse">Running...</span>
          )}
        </motion.div>
        {/* SVG Graph */}
        <motion.svg
          width="500"
          height="400"
          className="rounded-lg"
          style={{ background: "#fff", boxShadow: "0 8px 32px rgba(67,201,255,0.07)" }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.14 }}
        >
          {/* Edges */}
          {edges.map(([u, v, w], i) => {
            const [x1, y1] = positions[u];
            const [x2, y2] = positions[v];
            const inMST = edgeIsInMST(u, v);
            const isCurrentEdge = edgeIsCurrent(u, v);
            const isHovered = hoveredEdge === `${u}-${v}` || hoveredEdge === `${v}-${u}`;
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isCurrentEdge
                      ? "#F59E0B"
                      : inMST
                      ? "#10B981"
                      : isHovered
                      ? "#FF6B6B"
                      : "#4B6CB7"
                  }
                  strokeWidth={isCurrentEdge || inMST || isHovered ? "5" : "2"}
                  style={{
                    filter:
                      isCurrentEdge
                        ? "drop-shadow(0 0 15px #F59E0B)"
                        : inMST
                        ? "drop-shadow(0 0 12px #10B981)"
                        : undefined,
                    transition: "stroke 0.2s, stroke-width 0.2s"
                  }}
                  onMouseEnter={() => setHoveredEdge(`${u}-${v}`)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  className={isCurrentEdge || inMST ? "animate-pulse" : ""}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 5}
                  fontSize="14"
                  fill="#1F2937"
                  textAnchor="middle"
                  fontWeight={isCurrentEdge || inMST ? "bold" : "normal"}
                  style={{
                    textShadow: inMST || isCurrentEdge ? "0 0 8px #10B981" : undefined
                  }}
                >
                  {w}
                </text>
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
                  r={isHovered ? 27 : 22}
                  fill="#67C8FF"
                  stroke="#1F2937"
                  strokeWidth={isHovered ? 5 : 2}
                  style={{
                    filter: isHovered
                      ? "drop-shadow(0 0 12px #FF6B6B)"
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
        </motion.svg>
        {/* Result Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23 }}
          className="w-full max-w-md bg-white/90 rounded shadow-md mt-8 p-4"
        >
          <h3 className="font-semibold text-blue-500 text-lg mb-2">
            MST Edges ({algorithm})
          </h3>
          <p className="text-gray-800 text-xl">
            {mstEdges.length
              ? mstEdges.map(([u, v, w]) => `${u}-${v}(${w})`).join(", ")
              : "..."}
          </p>
          {mstEdges.length > 0 && (
            <p className="text-green-700 font-semibold">
              Total Cost: {mstEdges.reduce((sum, [, , w]) => sum + w, 0)}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
