import React, { useState } from "react";

export default function CSSVisualizer() {
  // Breakpoints
  const [breakpoint, setBreakpoint] = useState("desktop");

  // Flexbox properties
  const [flexDirection, setFlexDirection] = useState("row");
  const [justifyContent, setJustifyContent] = useState("flex-start");
  const [alignItems, setAlignItems] = useState("stretch");

  // Layout mode: flex or grid
  const [layoutMode, setLayoutMode] = useState("flex");

  // Active box (for hover/click effect)
  const [activeBox, setActiveBox] = useState(null);

  // Flexbox individual box properties
  const [flexProps, setFlexProps] = useState({
    1: { grow: 1, shrink: 1, basis: "auto" },
    2: { grow: 1, shrink: 1, basis: "auto" },
    3: { grow: 1, shrink: 1, basis: "auto" },
  });

  const sizes = {
    mobile: 300,
    tablet: 600,
    desktop: 900,
  };

  const specificityData = [
    { selector: "inline style", specificity: 1000 },
    { selector: "#id", specificity: 100 },
    { selector: ".class, [attr], :pseudo-class", specificity: 10 },
    { selector: "element, :pseudo-element", specificity: 1 },
  ];

  const boxes = [
    { id: 1, color: "#67C8FF" },
    { id: 2, color: "#4B6CB7" },
    { id: 3, color: "#10B981" },
  ];

  return (
    <div className="relative min-h-screen font-sans text-white">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Main app content */}
      <div className="relative max-w-5xl mx-auto space-y-12 p-6 z-10">
        <h1 className="text-3xl font-extrabold text-cyan-400 drop-shadow-[0_0_10px_#00e0ff] mb-6">
          CSS Concepts Interactive Visualizer
        </h1>

        {/* 1. Selectors & Specificity */}
        <div className="glass-card p-6 rounded-2xl shadow-lg bg-black/50 border border-cyan-600/40">
          <h2 className="text-xl font-semibold text-cyan-300 mb-4 drop-shadow-[0_0_6px_#00e0ff]">
            Selectors & Specificity
          </h2>
          <div className="flex flex-col gap-2">
            {specificityData.map((item) => (
              <div
                key={item.selector}
                className="bg-indigo-700/60 rounded p-2 text-sm font-medium shadow-md border border-cyan-400/50"
                style={{ width: `${item.specificity / 10}%` }}
              >
                {item.selector} ({item.specificity})
              </div>
            ))}
          </div>
          <p className="mt-3 text-cyan-200/80 text-sm">
            Wider bars indicate higher specificity. Inline &gt; ID &gt; Class &gt; Element
          </p>
        </div>

        {/* 2. Responsive Breakpoints */}
        <div className="glass-card p-6 rounded-2xl shadow-lg bg-black/50 border border-cyan-600/40">
          <h2 className="text-xl font-semibold text-cyan-300 mb-4 drop-shadow-[0_0_6px_#00e0ff]">
            Responsive Design Breakpoints
          </h2>
          <div className="flex gap-4 mb-4">
            {["mobile", "tablet", "desktop"].map((bp) => (
              <button
                key={bp}
                onClick={() => setBreakpoint(bp)}
                className={`px-4 py-2 rounded-xl border transition shadow-md ${
                  breakpoint === bp
                    ? "bg-cyan-500/80 border-cyan-300 text-white drop-shadow-[0_0_8px_#00e0ff]"
                    : "bg-white/10 border-cyan-500/40 text-cyan-300"
                }`}
              >
                {bp}
              </button>
            ))}
          </div>
          <div
            className="border-2 border-cyan-500/60 rounded-xl bg-black/70 flex items-center justify-center text-lg font-semibold shadow-inner transition-all duration-300"
            style={{
              width: sizes[breakpoint],
              height: 200,
            }}
          >
            {breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)} View
          </div>
        </div>

        {/* 3. Flex/Grid Layout Playground */}
        <div className="glass-card p-6 rounded-2xl shadow-lg bg-black/50 border border-cyan-600/40">
          <h2 className="text-xl font-semibold text-cyan-300 mb-4 drop-shadow-[0_0_6px_#00e0ff]">
            Layout Playground
          </h2>

          {/* Layout Mode Switch */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setLayoutMode("flex")}
              className={`px-3 py-1 border rounded-lg text-sm transition shadow ${
                layoutMode === "flex"
                  ? "bg-cyan-500/80 border-cyan-300 text-white drop-shadow-[0_0_8px_#00e0ff]"
                  : "bg-white/10 border-cyan-500/40 text-cyan-300"
              }`}
            >
              Flexbox
            </button>
            <button
              onClick={() => setLayoutMode("grid")}
              className={`px-3 py-1 border rounded-lg text-sm transition shadow ${
                layoutMode === "grid"
                  ? "bg-cyan-500/80 border-cyan-300 text-white drop-shadow-[0_0_8px_#00e0ff]"
                  : "bg-white/10 border-cyan-500/40 text-cyan-300"
              }`}
            >
              Grid
            </button>
          </div>

          {/* Flexbox Controls */}
          {layoutMode === "flex" && (
            <div className="flex gap-2 mb-6 flex-wrap">
              <select
                value={flexDirection}
                onChange={(e) => setFlexDirection(e.target.value)}
                className="p-2 bg-black/70 border border-cyan-500/50 rounded-lg text-cyan-200 text-sm"
              >
                <option value="row">row</option>
                <option value="row-reverse">row-reverse</option>
                <option value="column">column</option>
                <option value="column-reverse">column-reverse</option>
              </select>

              <select
                value={justifyContent}
                onChange={(e) => setJustifyContent(e.target.value)}
                className="p-2 bg-black/70 border border-cyan-500/50 rounded-lg text-cyan-200 text-sm"
              >
                <option value="flex-start">flex-start</option>
                <option value="center">center</option>
                <option value="flex-end">flex-end</option>
                <option value="space-between">space-between</option>
                <option value="space-around">space-around</option>
              </select>

              <select
                value={alignItems}
                onChange={(e) => setAlignItems(e.target.value)}
                className="p-2 bg-black/70 border border-cyan-500/50 rounded-lg text-cyan-200 text-sm"
              >
                <option value="stretch">stretch</option>
                <option value="flex-start">flex-start</option>
                <option value="center">center</option>
                <option value="flex-end">flex-end</option>
              </select>
            </div>
          )}

          {/* Flex Properties Controls */}
          {layoutMode === "flex" && (
            <div className="mb-6 space-y-2 text-cyan-200">
              {boxes.map((box) => (
                <div key={box.id} className="flex gap-2 items-center flex-wrap text-sm">
                  <span className="text-cyan-100/90">Box {box.id}:</span>
                  <input
                    type="number"
                    min={0}
                    value={flexProps[box.id].grow}
                    onChange={(e) =>
                      setFlexProps({
                        ...flexProps,
                        [box.id]: {
                          ...flexProps[box.id],
                          grow: +e.target.value,
                        },
                      })
                    }
                    className="w-14 bg-black/70 border border-cyan-500/50 p-1 rounded text-cyan-200"
                  />
                  <input
                    type="number"
                    min={0}
                    value={flexProps[box.id].shrink}
                    onChange={(e) =>
                      setFlexProps({
                        ...flexProps,
                        [box.id]: {
                          ...flexProps[box.id],
                          shrink: +e.target.value,
                        },
                      })
                    }
                    className="w-14 bg-black/70 border border-cyan-500/50 p-1 rounded text-cyan-200"
                  />
                  <input
                    type="text"
                    value={flexProps[box.id].basis}
                    onChange={(e) =>
                      setFlexProps({
                        ...flexProps,
                        [box.id]: {
                          ...flexProps[box.id],
                          basis: e.target.value,
                        },
                      })
                    }
                    className="w-20 bg-black/70 border border-cyan-500/50 p-1 rounded text-cyan-200"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Responsive Layout Container */}
          <div
            className="border-2 border-cyan-400/50 rounded-xl bg-black/40 relative mx-auto shadow-inner"
            style={{
              width: sizes[breakpoint],
              minHeight: 250,
              display: layoutMode === "flex" ? "flex" : "grid",
              flexDirection: layoutMode === "flex" ? flexDirection : undefined,
              justifyContent: layoutMode === "flex" ? justifyContent : undefined,
              alignItems: layoutMode === "flex" ? alignItems : undefined,
              gridTemplateColumns:
                layoutMode === "grid" ? "repeat(auto-fit, minmax(60px, 1fr))" : undefined,
              gap: layoutMode === "grid" ? 12 : undefined,
            }}
          >
            {boxes.map((box) => (
              <div
                key={box.id}
                onClick={() => setActiveBox(box.id)}
                className="relative group shadow-lg rounded-xl cursor-pointer flex justify-center items-center font-bold text-white"
                style={{
                  flexGrow: layoutMode === "flex" ? flexProps[box.id].grow : undefined,
                  flexShrink: layoutMode === "flex" ? flexProps[box.id].shrink : undefined,
                  flexBasis: layoutMode === "flex" ? flexProps[box.id].basis : undefined,
                  width: 60,
                  height: 60,
                  backgroundColor: activeBox === box.id ? "#F59E0B" : box.color,
                  boxShadow:
                    activeBox === box.id
                      ? "0 0 20px rgba(245, 158, 11, 0.9)"
                      : "0 0 12px rgba(0, 255, 255, 0.6)",
                  transition: "transform 0.2s, background-color 0.2s, box-shadow 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.9)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    activeBox === box.id
                      ? "0 0 20px rgba(245, 158, 11, 0.9)"
                      : "0 0 12px rgba(0, 255, 255, 0.6)";
                }}
              >
                {box.id}
                <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-cyan-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-cyan-400/40">
                  {layoutMode === "flex"
                    ? `grow: ${flexProps[box.id].grow}, shrink: ${flexProps[box.id].shrink}, basis: ${flexProps[box.id].basis}`
                    : "Grid item"}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-cyan-300/80 text-sm">
            Click a box to highlight it. Hover to see its flex/grid properties. Resize
            the container using breakpoints to see responsive behavior.
          </p>
        </div>
      </div>
    </div>
  );
}
