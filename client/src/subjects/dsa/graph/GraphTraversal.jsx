import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function GraphTraversal() {
  const nodes = ["A", "B", "C", "D", "E"];
  const edges = [
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["C", "E"],
    ["D", "E"],
  ];

  // adjacency list
  const adjacencyList = {};
  nodes.forEach((n) => (adjacencyList[n] = []));
  edges.forEach(([u, v]) => {
    adjacencyList[u].push(v);
    adjacencyList[v].push(u);
  });

  const [visited, setVisited] = useState([]);
  const [running, setRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState("BFS");
  const [traversalEdges, setTraversalEdges] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // positions for drawing
  const positions = {
    A: [200, 50],
    B: [100, 150],
    C: [300, 150],
    D: [100, 250],
    E: [300, 250],
  };

  // traversal animations
  const runTraversal = () => {
    setVisited([]);
    setTraversalEdges([]);
    setRunning(true);

    let order = [];
    let passedEdges = [];
    if (algorithm === "BFS") {
      let queue = ["A"];
      let seen = new Set(["A"]);
      while (queue.length) {
        let node = queue.shift();
        order.push(node);
        adjacencyList[node].forEach((nbr) => {
          if (!seen.has(nbr)) {
            seen.add(nbr);
            queue.push(nbr);
            passedEdges.push([node, nbr]);
          }
        });
      }
    } else {
      let stack = ["A"];
      let seen = new Set();
      while (stack.length) {
        let node = stack.pop();
        if (!seen.has(node)) {
          seen.add(node);
          order.push(node);
          [...adjacencyList[node]].reverse().forEach((nbr) => {
            if (!seen.has(nbr)) {
              stack.push(nbr);
              passedEdges.push([node, nbr]);
            }
          });
        }
      }
    }

    // animate step by step
    order.forEach((node, i) => {
      setTimeout(() => {
        setVisited((prev) => [...prev, node]);
        setTraversalEdges(passedEdges.slice(0, i));
        if (i === order.length - 1) setRunning(false);
      }, i * 800);
    });
  };

  // Helper for finding whether edge was in the traversal so far
  function edgeIsTraversed(u, v) {
    return traversalEdges.some(([a, b]) =>
      (a === u && b === v) || (a === v && b === u)
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Cyber grid background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center py-7 w-full">
        <motion.h2
          className="text-3xl font-bold text-blue-500 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80 }}
        >
          🔍 Graph Traversal Visualizer
        </motion.h2>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-6 p-3 rounded-lg bg-white/80 backdrop-blur shadow flex flex-wrap gap-2 items-center justify-center"
        >
          <button
            disabled={running}
            onClick={() => setAlgorithm("BFS")}
            className={`px-4 py-2 rounded font-semibold transition ${
              algorithm === "BFS" ? "bg-blue-500 text-white cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-blue-400 hover:text-white"
            }`}
          >
            BFS
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
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.97 }}
            disabled={running}
            onClick={runTraversal}
            className="px-4 py-2 rounded font-semibold bg-green-500 text-white"
          >
            Start {algorithm}
          </motion.button>
          {running && (
            <span className="ml-3 text-blue-500 font-semibold animate-pulse">Running...</span>
          )}
        </motion.div>

        {/* SVG Graph */}
        <motion.svg
          width="400"
          height="320"
          className="rounded-lg"
          style={{ background: "#fff", boxShadow: "0 8px 32px rgba(67,201,255,0.07)" }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.13 }}
        >
          {/* Edges */}
          {edges.map(([u, v], i) => {
            const [x1, y1] = positions[u];
            const [x2, y2] = positions[v];
            const traversed = edgeIsTraversed(u, v);
            const isHovered = hoveredEdge === `${u}-${v}` || hoveredEdge === `${v}-${u}`;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={
                  traversed
                    ? "#10B981"
                    : isHovered
                    ? "#FF6B6B"
                    : "#4B6CB7"
                }
                strokeWidth={traversed || isHovered ? "4" : "2"}
                style={{
                  filter: traversed ? "drop-shadow(0 0 8px #10B981)" : undefined,
                  transition: "stroke 0.2s, stroke-width 0.2s"
                }}
                onMouseEnter={() => setHoveredEdge(`${u}-${v}`)}
                onMouseLeave={() => setHoveredEdge(null)}
              />
            );
          })}
          {/* Nodes */}
          {nodes.map((node, idx) => {
            const [x, y] = positions[node];
            const isVisited = visited.includes(node);
            const visitIdx = visited.indexOf(node);
            const isCurrent = visitIdx === visited.length - 1 && running;
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
                  r={isHovered ? 25 : 20}
                  fill={isVisited ? "#10B981" : "#67C8FF"}
                  stroke={isCurrent ? "#F59E0B" : "#1F2937"}
                  strokeWidth={isHovered ? 5 : 2}
                  style={{
                    filter: isHovered
                      ? "drop-shadow(0 0 16px #FF6B6B)"
                      : isVisited
                      ? "drop-shadow(0 0 8px #10B981)"
                      : "drop-shadow(0 0 6px #aaf)",
                    transition: "r 0.18s, stroke-width 0.16s"
                  }}
                />
                {/* Traversal number label */}
                {isVisited && (
                  <text
                    x={x}
                    y={y - 36}
                    fontWeight="bold"
                    fill="#10B981"
                    fontSize="1em"
                    textAnchor="middle"
                  >
                    {visitIdx + 1}
                  </text>
                )}
                <text
                  x={x}
                  y={y + 7}
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

        {/* Traversal order display */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23 }}
          className="w-full max-w-md bg-white/90 rounded shadow-md mt-8 p-4"
        >
          <h3 className="font-semibold text-blue-500 text-lg mb-2">Traversal Order</h3>
          <p className="text-gray-800 text-xl">{visited.join(" → ")}</p>
        </motion.div>
      </div>
    </div>
  );
}
