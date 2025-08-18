import React, { useState, useEffect } from "react";

const sampleDOM = {
  tag: "html",
  children: [
    {
      tag: "head",
      children: [
        { tag: "title", children: [] },
        { tag: "meta", children: [] },
      ],
    },
    {
      tag: "body",
      children: [
        {
          tag: "div",
          children: [
            { tag: "h1", children: [] },
            { tag: "p", children: [] },
          ],
        },
        { tag: "footer", children: [] },
      ],
    },
  ],
};

const TreeNode = ({ node, level = 0, onSelect, selected, visible }) => {
  if (!visible) return null;
  return (
    <div
      style={{
        marginLeft: level * 20,
        padding: "4px 10px",
        border: selected === node ? "2px solid #67C8FF" : "1px dashed #4B6CB7",
        borderRadius: "8px",
        cursor: "pointer",
        background: selected === node ? "rgba(103,200,255,0.08)" : "rgba(75,108,183,0.07)",
        boxShadow: selected === node ? "0 0 12px #67C8FF88" : "0 0 4px #4B6CB788",
        color: "#67C8FF",
        fontWeight: selected === node ? "bold" : "normal",
        transition: "all 0.3s",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
    >
      &lt;{node.tag}&gt;
      {node.children.map((child, idx) => (
        <TreeNode
          key={idx}
          node={child}
          level={level + 1}
          onSelect={onSelect}
          selected={selected}
          visible={child.visible !== false}
        />
      ))}
    </div>
  );
};

export default function HTMLVisualizer() {
  const [selected, setSelected] = useState(null);
  const [hoveredBox, setHoveredBox] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [domState, setDomState] = useState(sampleDOM);

  // Recursive function to flatten nodes for simulation
  const flattenNodes = (node) => {
    let arr = [node];
    node.children.forEach((child) => {
      arr = arr.concat(flattenNodes(child));
    });
    return arr;
  };

  const allNodes = flattenNodes(domState);

  useEffect(() => {
    if (!playing) return;
    let index = 0;
    const interval = setInterval(() => {
      if (index >= allNodes.length) {
        clearInterval(interval);
        setPlaying(false);
        return;
      }
      allNodes[index].visible = true;
      setDomState({ ...domState });
      index++;
    }, 800);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [playing]);

  const boxSections = ["margin", "border", "padding", "content"];
  const colors = {
    margin: "#F59E0B66",
    border: "#4B6CB799",
    padding: "#67C8FF99",
    content: "#10B981cc",
  };

  return (
    <div className="relative min-h-screen font-sans text-white">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Main Content Above Grid */}
      <div className="relative z-10 p-6 max-w-2xl mx-auto space-y-10">
        <h1 className="text-2xl font-bold text-cyan-400 drop-shadow-[0_0_12px_#67C8FF] mb-4">
          HTML Structure & Box Model Interactive Visualizer
        </h1>

        {/* Controls */}
        <div className="mb-6 flex gap-4">
          <button
            className={`px-4 py-2 rounded-xl font-semibold shadow border border-cyan-400 transition-colors ${
              playing
                ? "bg-cyan-600 text-white"
                : "bg-cyan-500/80 text-white hover:bg-cyan-400"
            }`}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            className="px-4 py-2 rounded-xl font-semibold shadow bg-white/10 text-cyan-300 border border-cyan-400/40"
            onClick={() => {
              allNodes.forEach((node) => (node.visible = false));
              setDomState({ ...domState });
              setPlaying(false);
              setSelected(null);
            }}
          >
            Reset
          </button>
        </div>

        {/* DOM Tree */}
        <div className="mb-12 glass-card p-4 rounded-2xl bg-black/60 border border-cyan-400/30 shadow-lg">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2 drop-shadow-[0_0_6px_#67C8FF]">
            DOM Tree
          </h2>
          <TreeNode
            node={domState}
            onSelect={setSelected}
            selected={selected}
            visible={domState.visible !== false}
          />
          {selected && (
            <p className="mt-2 text-cyan-200">
              Selected: &lt;{selected.tag}&gt; — Children: {selected.children.length}
            </p>
          )}
        </div>

        {/* Box Model */}
        <div className="glass-card p-4 rounded-2xl bg-black/60 border border-cyan-400/30 shadow-lg">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2 drop-shadow-[0_0_6px_#67C8FF]">
            CSS Box Model
          </h2>
          <div style={{ position: "relative", height: 220, width: 220, margin: "0 auto" }}>
            {boxSections.map((section, idx) => {
              const size = 200 - idx * 40;
              return (
                <div
                  key={section}
                  onMouseEnter={() => setHoveredBox(section)}
                  onMouseLeave={() => setHoveredBox(null)}
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: colors[section],
                    position: "absolute",
                    top: idx * 10,
                    left: idx * 10,
                    border: "2px solid #67C8FF",
                    textShadow: "0 0 8px #67C8FF",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 8,
                    fontWeight: "500",
                    fontSize: 19 - idx * 2,
                    boxShadow:
                      hoveredBox === section
                        ? "0 0 24px #67C8FF"
                        : "0 0 8px #4B6CB744",
                    transition: "all 0.2s",
                    transform: hoveredBox === section ? "scale(1.07)" : "scale(1)",
                    cursor: "pointer",
                  }}
                >
                  {section}
                </div>
              );
            })}
          </div>
          {hoveredBox && (
            <p className="mt-2 text-cyan-200">
              Hovered: <span className="font-bold">{hoveredBox}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
