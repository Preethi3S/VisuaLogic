import React, { useState } from "react";
import { motion } from "framer-motion";

export default function GraphBasics() {
  const [view, setView] = useState("list");
  const [inputType, setInputType] = useState("list");
  const [inputValue, setInputValue] = useState("");
  const [nodes, setNodes] = useState(["A", "B", "C", "D"]);
  const [edges, setEdges] = useState([
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["C", "D"],
  ]);
  const [adjList, setAdjList] = useState({});
  const [adjMatrix, setAdjMatrix] = useState([]);

  React.useEffect(() => {
    // Adjacency List
    const list = {};
    nodes.forEach((n) => (list[n] = []));
    edges.forEach(([u, v]) => {
      list[u].push(v);
      list[v].push(u);
    });
    setAdjList(list);

    // Adjacency Matrix
    setAdjMatrix(
      nodes.map((u) =>
        nodes.map((v) =>
          edges.some(([a, b]) => (a === u && b === v) || (a === v && b === u)) ? 1 : 0
        )
      )
    );
  }, [nodes, edges]);

  function handleParse() {
    if (inputType === "list") {
      try {
        const obj = JSON.parse(inputValue);
        const parsedNodes = Object.keys(obj);
        let parsedEdges = [];
        parsedNodes.forEach((u) => {
          obj[u].forEach((v) => {
            if (!parsedEdges.find(([a, b]) => (a === u && b === v) || (a === v && b === u)))
              parsedEdges.push([u, v]);
          });
        });
        setNodes(parsedNodes);
        setEdges(parsedEdges);
      } catch (e) {
        alert("Invalid adjacency list format.\nExample: {\"A\": [\"B\", \"C\"], \"B\": [\"A\"]}");
      }
    } else {
      try {
        const arr = JSON.parse(inputValue);
        const [parsedNodes, matrix] = arr;
        let parsedEdges = [];
        for (let i = 0; i < matrix.length; i++)
          for (let j = i + 1; j < matrix.length; j++)
            if (matrix[i][j]) parsedEdges.push([parsedNodes[i], parsedNodes[j]]);
        setNodes(parsedNodes);
        setEdges(parsedEdges);
      } catch (e) {
        alert("Invalid adjacency matrix format.\nExample: [[\"A\",\"B\"],[ [0,1],[1,0] ]]");
      }
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Animated Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <motion.h2
          className="text-3xl font-bold text-blue-500 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80 }}
        >
          Graph Basics
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-4 rounded-lg bg-white/80 backdrop-blur-md shadow-md"
          style={{ minWidth: 320, maxWidth: 400 }}
        >
          <div className="mb-4">
            <label className="mr-3 font-medium">Input Type:</label>
            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
              className="border p-1 rounded"
            >
              <option value="list">Adjacency List</option>
              <option value="matrix">Adjacency Matrix</option>
            </select>
          </div>
          <textarea
            rows={4}
            placeholder={
              inputType === "list"
                ? '{"A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D"], "D": ["B", "C"]}'
                : '[["A","B","C","D"], [[0,1,1,0],[1,0,0,1],[1,0,0,1],[0,1,1,0]]]'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full border rounded p-2 mb-3"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleParse}
            className="px-4 py-2 bg-blue-500 text-white rounded shadow font-semibold"
          >
            Load Graph
          </motion.button>
        </motion.div>

        <motion.button
          onClick={() => setView(view === "list" ? "matrix" : "list")}
          className="mb-4 px-4 py-2 bg-blue-400 text-white rounded shadow font-semibold hover:bg-blue-500 transition"
          whileTap={{ scale: 0.95 }}
        >
          Switch to {view === "list" ? "Adjacency Matrix" : "Adjacency List"}
        </motion.button>

        {/* Simple SVG Graph Drawing */}
        <motion.svg
          width="340"
          height="200"
          style={{ border: "1px solid #ddd", borderRadius: 16, background: "#fff", marginBottom: 16 }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Arrange nodes in a circle */}
          {nodes.map((node, i) => {
            const angle = (2 * Math.PI * i) / nodes.length;
            const x = 170 + 65 * Math.cos(angle);
            const y = 100 + 65 * Math.sin(angle);
            return <circle key={node} cx={x} cy={y} r="20" fill="#67C8FF" stroke="#1F2937" strokeWidth="2" />;
          })}
          {/* Draw edges */}
          {edges.map(([u, v], i) => {
            const uIndex = nodes.indexOf(u);
            const vIndex = nodes.indexOf(v);
            const angleU = (2 * Math.PI * uIndex) / nodes.length;
            const angleV = (2 * Math.PI * vIndex) / nodes.length;
            const x1 = 170 + 65 * Math.cos(angleU);
            const y1 = 100 + 65 * Math.sin(angleU);
            const x2 = 170 + 65 * Math.cos(angleV);
            const y2 = 100 + 65 * Math.sin(angleV);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4B6CB7" strokeWidth="2" />
            );
          })}
          {/* Node labels */}
          {nodes.map((node, i) => {
            const angle = (2 * Math.PI * i) / nodes.length;
            const x = 170 + 65 * Math.cos(angle);
            const y = 100 + 65 * Math.sin(angle);
            return (
              <text key={node} x={x} y={y + 6} textAnchor="middle" fontWeight="bold" fill="#1F2937">
                {node}
              </text>
            );
          })}
        </motion.svg>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="bg-white/80 backdrop-blur rounded shadow-md p-4"
          style={{ minWidth: 260, maxWidth: 400, marginBottom: 24 }}
        >
          {view === "list" ? (
            <div>
              <div className="font-semibold text-blue-500 mb-2">Adjacency List</div>
              <pre className="text-gray-800 bg-gray-50 p-2 rounded border">{JSON.stringify(adjList, null, 2)}</pre>
            </div>
          ) : (
            <div>
              <div className="font-semibold text-blue-500 mb-2">Adjacency Matrix</div>
              <table className="table-auto border-collapse border w-full mb-2">
                <thead>
                  <tr>
                    <th></th>
                    {nodes.map((node) => (
                      <th key={node} className="border px-2 py-1">{node}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adjMatrix.map((row, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{nodes[i]}</td>
                      {row.map((val, j) => (
                        <td key={j} className="border px-2 py-1">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
