import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Optional node icons and backgrounds for extra clarity
const listTypeInfos = {
  singly: {
    label: "Singly Linked List",
    color: "#4B6CB7",
    icon: "➡️",
    desc: "Each node points only to the next node."
  },
  doubly: {
    label: "Doubly Linked List",
    color: "#10B981",
    icon: "⇄",
    desc: "Each node points to both the next and previous nodes."
  },
  circular: {
    label: "Circular Linked List",
    color: "#67C8FF",
    icon: "🔁",
    desc: "Last node points back to the head. Traversal can repeat forever."
  }
};

export default function LinkedListVisualizer() {
  const [listType, setListType] = useState("singly");
  const [nodes, setNodes] = useState([]);
  const [value, setValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [steps, setSteps] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(null);

  // Apply static cyber grid background for all scenes
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid");
    return () => document.body.classList.remove("bg-cyber-grid");
  }, []);

  const addNode = () => {
    if (!value) return;
    const newSteps = [`Creating new node with value '${value}'`];
    newSteps.push(
      nodes.length === 0
        ? "Head node created."
        : `Linking new node to ${nodes.length === 1 ? "head node" : "previous tail node"}...`
    );
    setNodes(prev => [...prev, value]);
    setSteps(newSteps);
    setValue("");
    setHighlightIndex(null);
  };

  const deleteNode = (index) => {
    const newSteps = [`Deleting node at index ${index} (${nodes[index]})`];
    setNodes(prev => prev.filter((_, i) => i !== index));
    setSteps(newSteps);
    setHighlightIndex(null);
  };

  const reverseList = () => {
    let desc = "";
    switch (listType) {
      case "singly":
        desc = "Reversing all next pointers...";
        break;
      case "doubly":
        desc = "Swapping prev and next pointers...";
        break;
      case "circular":
        desc = "Breaking circle, reversing nodes, reconnecting circle...";
        break;
      default:
        desc = "Reversing list...";
    }
    const newSteps = [desc, "List reversed!"];
    setNodes(prev => [...prev].reverse());
    setSteps(newSteps);
    setHighlightIndex(null);
  };

  const searchNode = () => {
    const newSteps = [`Searching for value '${searchValue}'...`];
    let foundIndex = null;
    nodes.forEach((node, idx) => {
      if (node === searchValue) foundIndex = idx;
    });
    if (foundIndex !== null) {
      newSteps.push(`Value found at index ${foundIndex}.`);
      setHighlightIndex(foundIndex);
    } else {
      newSteps.push("Value not found.");
      setHighlightIndex(null);
    }
    setSteps(newSteps);
    setSearchValue("");
  };

  // Arrow rendering for links
  const renderArrow = (from, to) => (
    <svg width="54" height="30" style={{ margin: "0 -20px" }}>
      <motion.path
        d="M2 18 Q25 28 52 18"
        stroke="#06b6d4"
        strokeWidth="3"
        fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 0.25 }}
        filter="url(#neonArrow)"
        markerEnd="url(#arrowhead)"
      />
      <defs>
        <marker id="arrowhead" markerWidth="9" markerHeight="9" refX="5" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,8 L8,4 z" fill="#06b6d4" />
        </marker>
        <filter id="neonArrow"><feGaussianBlur stdDeviation="1.6" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
    </svg>
  );

  return (
    <div className="relative min-h-screen w-full font-sans">
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div className="relative z-10 max-w-4xl mx-auto p-8 bg-white/90 rounded-2xl shadow-2xl" style={{ marginTop: 32 }}>

        <h2 className="text-3xl font-bold mb-4 text-cyan-700 flex items-center gap-3">
          <span>{listTypeInfos[listType].icon}</span>
          Linked List Visualizer
        </h2>
        <div className="mb-2 font-semibold text-cyan-900">
          {listTypeInfos[listType].label} <span className="text-cyan-500 text-base ml-2">{listTypeInfos[listType].desc}</span>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center mb-7 py-3">
          <select value={listType} onChange={e => { setListType(e.target.value); setSteps([`Changed to ${listTypeInfos[e.target.value].label}.`]); setHighlightIndex(null); }}
                  className="px-3 py-2 border rounded bg-cyan-50 border-cyan-400 font-bold text-cyan-800">
            {Object.entries(listTypeInfos).map(([key, info]) =>
              <option value={key} key={key}>{info.label}</option>
            )}
          </select>
          <input type="text" placeholder="Value"
                 value={value}
                 maxLength={10}
                 onChange={e => setValue(e.target.value)}
                 className="px-3 py-2 border border-cyan-400 rounded focus:outline-cyan-400"
          />
          <motion.button whileTap={{ scale: 0.97 }} className="px-4 py-2 bg-gradient-to-l from-indigo-600 to-cyan-400 text-white rounded font-semibold shadow" onClick={addNode}>
            Add Node
          </motion.button>
          <input type="text" placeholder="Search"
                 value={searchValue}
                 maxLength={10}
                 onChange={e => setSearchValue(e.target.value)}
                 className="px-3 py-2 border border-cyan-400 rounded focus:outline-cyan-400"
          />
          <button className="px-4 py-2 bg-orange-100 text-cyan-900 font-semibold rounded" onClick={searchNode}>
            Search
          </button>
          <button className="px-4 py-2 bg-slate-800 text-cyan-100 rounded font-bold shadow" onClick={reverseList}>
            Reverse
          </button>
        </div>

        {/* Visualization */}
        <div className="flex flex-row items-center justify-center p-6 min-h-[130px] bg-white/70 rounded-2xl shadow" style={{ overflowX: "auto" }}>
          <AnimatePresence>
            {nodes.map((node, index) => (
              <React.Fragment key={index}>
                <motion.div
                  initial={{ scale: 0, y: 16, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0, y: 20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative flex flex-col items-center mx-2"
                >
                  <motion.div
                    className="flex items-center justify-center font-semibold text-lg border-2 shadow-lg glass-card"
                    style={{
                      width: 55, height: 55,
                      borderRadius: 12,
                      borderColor: highlightIndex === index ? "#10B981" : "#4B6CB7",
                      background: highlightIndex === index
                        ? "linear-gradient(110deg, #10B981 80%, #4B6CB7 100%)"
                        : "linear-gradient(120deg, #e0f2fe 65%, #bae6fd 100%)",
                      color: highlightIndex === index ? "#fff" : "#1F2937",
                      boxShadow: highlightIndex === index ? "0 0 16px #10B98166" : "0 1px 7px #4B6CB722"
                    }}
                    animate={highlightIndex === index ? { scale: [1, 1.17, 1] } : { scale: 1 }}
                    transition={highlightIndex === index
                      ? { repeat: Infinity, duration: 1.1 } : { type: "spring", stiffness: 210, damping: 18 }}
                  >
                    {node}
                  </motion.div>
                  <button
                    onClick={() => deleteNode(index)}
                    className="absolute top-[-12px] right-[-12px] bg-rose-500 rounded-full w-6 h-6 text-xs text-white font-bold shadow border-2 border-gray-100 hover:scale-110 transition"
                  >
                    ×
                  </button>
                  <span className="mt-1 text-xs font-semibold text-cyan-900">
                    {index === 0 ? "HEAD" : ""}
                    {index === nodes.length - 1 ? "TAIL" : ""}
                  </span>
                </motion.div>
                {index < nodes.length - 1 && (
                  <motion.div key={`arrow-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginLeft: -8, marginRight: -8 }}>
                    {renderArrow(index, index + 1)}
                  </motion.div>
                )}
              </React.Fragment>
            ))}
            {/* Circular Link Indicator */}
            {listType === "circular" && nodes.length > 1 && (
              <motion.div
                key="circular-link"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: [0.9, 1.2, 1], opacity: 1 }}
                style={{ color: "#4B6CB7", fontWeight: "bold", marginLeft: -14, marginRight: -3, fontSize: 34 }}
                transition={{ repeat: Infinity, duration: 1.8 }}
              >
                ↺
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step-by-step Explanation */}
        <div className="mt-8 bg-cyan-50 rounded-2xl border border-cyan-200/60 shadow px-6 py-5">
          <h4 className="text-xl mb-2 text-cyan-700 font-bold">Steps & Explanations</h4>
          {steps.length === 0
            ? <div className="text-cyan-700 text-base opacity-70">Add, search, or reverse to view algorithm explanations.</div>
            : (
              <ul className="list-disc list-inside text-cyan-800 text-base space-y-1">
                {steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            )
          }
        </div>
      </div>
    </div>
  );
}
