import React, { useState } from "react";
import { motion } from "framer-motion";

export default function DijkstraVisualizer() {
  const nodes = ["A", "B", "C", "D", "E"];
  const edges = [
    ["A", "B", 4],
    ["A", "C", 2],
    ["B", "C", 5],
    ["B", "D", 10],
    ["C", "E", 3],
    ["E", "D", 4],
  ];

  // positions for drawing
  const positions = {
    A: [100, 100],
    B: [300, 100],
    C: [200, 200],
    D: [400, 200],
    E: [300, 300],
  };

  const [distances, setDistances] = useState({});
  const [visited, setVisited] = useState([]);
  const [path, setPath] = useState([]);
  const [running, setRunning] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // Run Dijkstra's algorithm with animation
  const runDijkstra = (start = "A", target = "D") => {
    setDistances({});
    setVisited([]);
    setPath([]);
    setRunning(true);

    let dist = {};
    let prev = {};
    nodes.forEach((n) => (dist[n] = Infinity));
    dist[start] = 0;

    let unvisited = new Set(nodes);
    let order = [];

    while (unvisited.size) {
      let u = [...unvisited].reduce((a, b) => (dist[a] < dist[b] ? a : b));
      unvisited.delete(u);
      order.push(u);

      edges.forEach(([src, dest, w]) => {
        if (src === u && unvisited.has(dest)) {
          let alt = dist[u] + w;
          if (alt < dist[dest]) {
            dist[dest] = alt;
            prev[dest] = u;
          }
        } else if (dest === u && unvisited.has(src)) {
          let alt = dist[u] + w;
          if (alt < dist[src]) {
            dist[src] = alt;
            prev[src] = u;
          }
        }
      });
    }

    // animate visiting order
    order.forEach((node, i) => {
      setTimeout(() => {
        setVisited((prevVisited) => [...prevVisited, node]);
        setDistances({ ...dist });
        if (i === order.length - 1) {
          // build shortest path
          let pathArr = [];
          let u = target;
          while (u) {
            pathArr.unshift(u);
            u = prev[u];
          }
          setPath(pathArr);
          setRunning(false);
        }
      }, i * 1200);
    });
  };

  // Helpers
  function edgeIsInPath(u, v) {
    for (let i = 1; i < path.length; i++) {
      if (
        (path[i - 1] === u && path[i] === v) ||
        (path[i - 1] === v && path[i] === u)
      ) {
        return true;
      }
    }
    return false;
  }
  function edgeIsVisited(u, v) {
    return visited.includes(u) && visited.includes(v);
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
          🛣️ Dijkstra’s Shortest Path Visualizer
        </motion.h2>
        <motion.button
          onClick={() => runDijkstra("A", "D")}
          disabled={running}
          className="mb-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded shadow hover:bg-blue-600 transition"
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.96 }}
        >
          Start Dijkstra (A → D)
        </motion.button>
        {running && (
          <span className="text-blue-600 font-medium animate-pulse mb-2">Running...</span>
        )}
        {/* SVG Graph */}
        <motion.svg
          width="500"
          height="400"
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
            const isPath = edgeIsInPath(u, v);
            const isVisited = edgeIsVisited(u, v);
            const isHovered = hoveredEdge === `${u}-${v}` || hoveredEdge === `${v}-${u}`;
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isPath
                      ? "#10B981"
                      : isVisited
                      ? "#F59E0B"
                      : isHovered
                      ? "#FF6B6B"
                      : "#4B6CB7"
                  }
                  strokeWidth={
                    isPath || isVisited || isHovered ? "5" : "2"
                  }
                  style={{
                    filter: isPath
                      ? "drop-shadow(0 0 12px #10B981)"
                      : isVisited
                      ? "drop-shadow(0 0 8px #F59E0B)"
                      : undefined,
                    transition: "stroke 0.2s, stroke-width 0.2s"
                  }}
                  onMouseEnter={() => setHoveredEdge(`${u}-${v}`)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  className={isPath || isVisited ? "animate-pulse" : ""}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 5}
                  fontSize="14"
                  fill="#1F2937"
                  textAnchor="middle"
                  fontWeight={isPath ? "bold" : "normal"}
                  style={{
                    textShadow: isPath ? "0 0 8px #10B981" : undefined
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
            const isVisitedNode = visited.includes(node);
            const isPathNode = path.includes(node);
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
                  fill={
                    isPathNode
                      ? "#10B981"
                      : isVisitedNode
                      ? "#F59E0B"
                      : "#67C8FF"
                  }
                  stroke="#1F2937"
                  strokeWidth={isHovered ? 5 : 2}
                  style={{
                    filter: isHovered
                      ? "drop-shadow(0 0 12px #FF6B6B)"
                      : isPathNode
                      ? "drop-shadow(0 0 15px #10B981)"
                      : isVisitedNode
                      ? "drop-shadow(0 0 9px #F59E0B)"
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
                {/* Distance Labels */}
                {distances[node] !== undefined && (
                  <text
                    x={x}
                    y={y + 35}
                    textAnchor="middle"
                    fontSize="13"
                    fill="#4B6CB7"
                  >
                    d={distances[node] === Infinity ? "∞" : distances[node]}
                  </text>
                )}
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
            Shortest Path (A → D)
          </h3>
          <p className="text-gray-800 text-xl">
            {path.length ? (
              <>
                {path.join(" → ")}{" "}
                <span className="text-green-700 font-semibold">
                  (cost: {distances["D"]})
                </span>
              </>
            ) : (
              "..."
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
