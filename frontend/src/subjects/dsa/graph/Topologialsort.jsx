import React, { useState } from "react";
import { motion } from "framer-motion";

export default function TopologicalSort() {
  const nodes = ["A", "B", "C", "D", "E"];
  const edges = [
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["C", "D"],
    ["D", "E"],
  ];

  const positions = {
    A: [100, 50],
    B: [300, 50],
    C: [100, 150],
    D: [300, 150],
    E: [200, 250],
  };

  const [order, setOrder] = useState([]);
  const [visited, setVisited] = useState([]);
  const [running, setRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState("Kahn");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  const adjacencyList = {};
  nodes.forEach((n) => (adjacencyList[n] = []));
  edges.forEach(([u, v]) => adjacencyList[u].push(v));

  // --- Kahn's Algorithm (BFS) ---
  const runKahn = () => {
    setOrder([]);
    setVisited([]);
    setRunning(true);

    const inDegree = {};
    nodes.forEach((n) => (inDegree[n] = 0));
    edges.forEach(([u, v]) => inDegree[v]++);

    const queue = nodes.filter((n) => inDegree[n] === 0);
    const result = [];
    const steps = [];

    while (queue.length) {
      const node = queue.shift();
      result.push(node);
      steps.push([...result]);
      adjacencyList[node].forEach((nbr) => {
        inDegree[nbr]--;
        if (inDegree[nbr] === 0) queue.push(nbr);
      });
    }

    steps.forEach((step, i) => {
      setTimeout(() => {
        setOrder(step);
        setVisited(step);
        if (i === steps.length - 1) setRunning(false);
      }, i * 900);
    });
  };

  // --- DFS-based Topological Sort ---
  const runDFS = () => {
    setOrder([]);
    setVisited([]);
    setRunning(true);

    const visitedSet = new Set();
    const result = [];
    const steps = [];

    const dfs = (node) => {
      visitedSet.add(node);
      adjacencyList[node].forEach((nbr) => {
        if (!visitedSet.has(nbr)) dfs(nbr);
      });
      result.unshift(node);
      steps.push([...result]);
    };

    nodes.forEach((n) => {
      if (!visitedSet.has(n)) dfs(n);
    });

    steps.forEach((step, i) => {
      setTimeout(() => {
        setOrder(step);
        setVisited(step);
        if (i === steps.length - 1) setRunning(false);
      }, i * 900);
    });
  };

  const runSort = () => {
    if (algorithm === "Kahn") runKahn();
    else runDFS();
  };

  // Extra helpers
  function edgeIsVisited(u, v) {
    for (let i = 1; i < visited.length; i++) {
      if (
        (visited[i - 1] === u && visited[i] === v) ||
        (visited[i - 1] === v && visited[i] === u)
      ) {
        return true;
      }
    }
    return false;
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
          📝 Topological Sorting Visualizer
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-6 p-3 rounded-lg bg-white/80 backdrop-blur shadow flex flex-wrap gap-2 items-center justify-center"
        >
          <button
            disabled={running}
            onClick={() => setAlgorithm("Kahn")}
            className={`px-4 py-2 rounded font-semibold transition ${
              algorithm === "Kahn" ? "bg-blue-500 text-white cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-blue-400 hover:text-white"
            }`}
          >
            Kahn (BFS)
          </button>
          <button
            disabled={running}
            onClick={() => setAlgorithm("DFS")}
            className={`px-4 py-2 rounded font-semibold transition ${
              algorithm === "DFS" ? "bg-blue-500 text-white cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-blue-400 hover:text-white"
            }`}
          >
            DFS
          </button>
          <motion.button
            disabled={running}
            onClick={runSort}
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
          height="320"
          className="rounded-lg"
          style={{ background: "#fff", boxShadow: "0 8px 32px rgba(67,201,255,0.07)" }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.14 }}
        >
          {/* Edges */}
          {edges.map(([u, v], i) => {
            const [x1, y1] = positions[u];
            const [x2, y2] = positions[v];
            const isVisited = edgeIsVisited(u, v);
            const isHovered = hoveredEdge === `${u}-${v}` || hoveredEdge === `${v}-${u}`;
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isVisited ? "#10B981" : isHovered ? "#FF6B6B" : "#4B6CB7"}
                  strokeWidth={isVisited || isHovered ? "5" : "2"}
                  style={{
                    filter: isVisited ? "drop-shadow(0 0 14px #10B981)" : undefined,
                    transition: "stroke 0.2s, stroke-width 0.2s"
                  }}
                  onMouseEnter={() => setHoveredEdge(`${u}-${v}`)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  className={isVisited ? "animate-pulse" : ""}
                />
              </g>
            );
          })}
          {/* Nodes */}
          {nodes.map((node) => {
            const [x, y] = positions[node];
            const isVisitedNode = visited.includes(node);
            const isHovered = hoveredNode === node;
            const visitOrder = order.indexOf(node);
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
                  fill={isVisitedNode ? "#10B981" : "#67C8FF"}
                  stroke="#1F2937"
                  strokeWidth={isHovered ? 5 : 2}
                  style={{
                    filter: isHovered
                      ? "drop-shadow(0 0 12px #FF6B6B)"
                      : isVisitedNode
                      ? "drop-shadow(0 0 15px #10B981)"
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
                {/* Visit order number */}
                {isVisitedNode && (
                  <text x={x} y={y - 26} textAnchor="middle" fontSize="14" fill="#10B981" fontWeight="bold">
                    {visitOrder + 1}
                  </text>
                )}
              </g>
            );
          })}
        </motion.svg>
        {/* Order Result Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23 }}
          className="w-full max-w-md bg-white/90 rounded shadow-md mt-8 p-4"
        >
          <h3 className="font-semibold text-blue-500 text-lg mb-2">Topological Order</h3>
          <p className="text-gray-800 text-xl">{order.length ? order.join(" → ") : "..."}</p>
        </motion.div>
      </div>
    </div>
  );
}
