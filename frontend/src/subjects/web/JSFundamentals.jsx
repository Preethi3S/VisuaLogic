// src/scenes/JSFundamentals.jsx
import React, { useState, useEffect } from "react";

export default function JSFundamentals() {
  // ----------------------
  // Scope & Step-through
  // ----------------------
  const scopeSteps = [
    { scope: "global", text: "Declare globalVar" },
    { scope: "function", text: "Enter function: funcVar declared" },
    { scope: "block", text: "Enter block: blockVar declared" },
    { scope: "function", text: "Exit block" },
    { scope: "global", text: "Exit function" },
  ];
  const [scopeIndex, setScopeIndex] = useState(0);

  const nextScopeStep = () => setScopeIndex((prev) => Math.min(prev + 1, scopeSteps.length - 1));
  const prevScopeStep = () => setScopeIndex((prev) => Math.max(prev - 1, 0));

  // ----------------------
  // Event Bubbling & Config
  // ----------------------
  const [eventLog, setEventLog] = useState([]);
  const [highlightedDiv, setHighlightedDiv] = useState(null);
  const [eventConfig, setEventConfig] = useState({
    outer: { capture: true, bubble: true },
    middle: { capture: true, bubble: true },
    inner: { capture: true, bubble: true },
  });

  const logEvent = (e, phase) => {
    const targetId = e.currentTarget?.id || "unknown";
    if (!eventConfig[targetId]?.[phase === "capturing" ? "capture" : "bubble"]) return;
    setHighlightedDiv(targetId);
    setEventLog((prev) => [...prev, `${targetId} received event during ${phase}`]);
    setTimeout(() => setHighlightedDiv(null), 800);
  };

  // ----------------------
  // Hoisting Visualization
  // ----------------------
  const hoistExample = [
    { code: "console.log(a); var a = 10;", output: "undefined" },
    { code: "console.log(b); let b = 5;", output: "ReferenceError" },
    { code: "func(); function func(){ console.log('hi'); }", output: "hi" },
  ];

  // ----------------------
  // Closures Demo
  // ----------------------
  const [closureOutput, setClosureOutput] = useState("");
  const runClosure = () => {
    function outer(x) {
      return function inner(y) {
        return x + y;
      };
    }
    const add5 = outer(5);
    const result = add5(10);
    setClosureOutput(`add5(10) = ${result}`);
  };

  // ----------------------
  // Call Stack Visualization
  // ----------------------
  const [callStack, setCallStack] = useState([]);
  const runCallStack = () => {
    const stack = [];
    function first() {
      stack.push("first()");
      second();
      stack.pop();
      setCallStack([...stack]);
    }
    function second() {
      stack.push("second()");
      third();
      stack.pop();
      setCallStack([...stack]);
    }
    function third() {
      stack.push("third()");
      stack.pop();
      setCallStack([...stack]);
    }
    first();
  };

  // ----------------------
  // Async Flow
  // ----------------------
  const [asyncLog, setAsyncLog] = useState([]);
  const runAsyncExample = () => {
    setAsyncLog([]);
    setTimeout(() => setAsyncLog((prev) => [...prev, "setTimeout executed"]), 0);
    Promise.resolve().then(() => setAsyncLog((prev) => [...prev, "Promise resolved"]));
    setAsyncLog((prev) => [...prev, "Sync code executed"]);
  };

  return (
    <div className="relative min-h-screen font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Main Content Above Grid */}
      <div className="relative z-10 p-6 max-w-3xl mx-auto space-y-12">
        <h1 className="text-2xl font-extrabold text-cyan-400 drop-shadow-[0_0_10px_#67C8FF] mb-6">
          JavaScript Fundamentals Visualizer
        </h1>

        {/* Scope Step-through */}
        <div className="glass-card border p-4 rounded-2xl bg-black/60 border-cyan-400/30 shadow-lg">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2">Variable Scope</h2>
          <div className="flex gap-6 justify-center mb-4">
            {["global", "function", "block"].map((scope) => (
              <div
                key={scope}
                className={`w-36 h-24 border-2 rounded-2xl flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
                  scopeSteps[scopeIndex].scope === scope
                    ? "bg-yellow-400 border-yellow-500 text-black drop-shadow-[0_0_5px_#FDE68A]"
                    : "bg-cyan-800/40 border-cyan-400/40 text-cyan-300"
                }`}
              >
                {scope.charAt(0).toUpperCase() + scope.slice(1)} Scope
              </div>
            ))}
          </div>
          <p className="text-cyan-100 text-center mb-2">{scopeSteps[scopeIndex].text}</p>
          <div className="flex justify-center gap-2">
            <button onClick={prevScopeStep} className="px-3 py-1 rounded-xl border border-cyan-400 text-cyan-200 bg-black/30">Previous</button>
            <button onClick={nextScopeStep} className="px-3 py-1 rounded-xl border border-cyan-400 text-cyan-200 bg-black/30">Next</button>
          </div>
        </div>

        {/* Event Bubbling */}
        <div className="glass-card border p-4 rounded-2xl bg-black/60 border-cyan-400/30 shadow-lg">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2">Event Bubbling & Capturing</h2>
          <div className="flex gap-4 mb-2">
            {["outer", "middle", "inner"].map((id) => (
              <label key={id} className="flex gap-1 items-center text-cyan-200">
                <span>{id} capture</span>
                <input
                  type="checkbox"
                  checked={eventConfig[id].capture}
                  onChange={() => setEventConfig({
                    ...eventConfig,
                    [id]: { ...eventConfig[id], capture: !eventConfig[id].capture }
                  })}
                />
                <span>bubble</span>
                <input
                  type="checkbox"
                  checked={eventConfig[id].bubble}
                  onChange={() => setEventConfig({
                    ...eventConfig,
                    [id]: { ...eventConfig[id], bubble: !eventConfig[id].bubble }
                  })}
                />
              </label>
            ))}
          </div>
          <div
            id="outer"
            onClickCapture={(e) => logEvent(e, "capturing")}
            onClick={(e) => logEvent(e, "bubbling")}
            className={`p-6 border rounded-2xl mb-4 relative transition-colors duration-200 ${
              highlightedDiv === "outer" ? "bg-yellow-400/80" : "bg-cyan-900/40"
            }`}
          >
            Outer
            <div
              id="middle"
              onClickCapture={(e) => logEvent(e, "capturing")}
              onClick={(e) => logEvent(e, "bubbling")}
              className={`p-6 border rounded-2xl mt-2 relative transition-colors duration-200 ${
                highlightedDiv === "middle" ? "bg-yellow-400/80" : "bg-cyan-900/60"
              }`}
            >
              Middle
              <div
                id="inner"
                onClickCapture={(e) => logEvent(e, "capturing")}
                onClick={(e) => logEvent(e, "bubbling")}
                className={`p-6 border rounded-2xl mt-2 relative transition-colors duration-200 ${
                  highlightedDiv === "inner" ? "bg-yellow-400/80" : "bg-cyan-900/80"
                }`}
              >
                Inner
              </div>
            </div>
          </div>
          <div className="border rounded-2xl p-2 bg-black/70 min-h-[80px] text-cyan-200 shadow">
            {eventLog.map((line, i) => (<div key={i}>{line}</div>))}
          </div>
          <button onClick={() => setEventLog([])} className="mt-2 px-3 py-1 rounded-xl border border-cyan-400 text-cyan-200 bg-black/30">Clear Log</button>
        </div>

        {/* Hoisting */}
        <div className="glass-card border p-4 rounded-2xl bg-black/60 border-cyan-400/30 shadow-lg">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2">Hoisting</h2>
          <ul className="list-disc pl-5">
            {hoistExample.map((ex, i) => (
              <li key={i}>
                <pre className="bg-cyan-900 text-cyan-200 p-2 rounded-xl mb-1">{ex.code}</pre>
                <span className="text-cyan-100">Output: {ex.output}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Closures */}
        <div className="glass-card border p-4 rounded-2xl bg-black/60 border-cyan-400/30 shadow-lg">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2">Closures</h2>
          <button onClick={runClosure} className="px-3 py-1 rounded-xl border border-cyan-400 text-cyan-200 bg-black/30 mb-2">Run Closure Demo</button>
          <div className="border p-2 rounded-xl bg-black/70 text-cyan-100">{closureOutput || "Click button to run closure example"}</div>
        </div>

        {/* Call Stack */}
        <div className="glass-card border p-4 rounded-2xl bg-black/60 border-cyan-400/30 shadow-lg">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2">Call Stack Visualization</h2>
          <button onClick={runCallStack} className="px-3 py-1 rounded-xl border border-cyan-400 text-cyan-200 bg-black/30 mb-2">Run Call Stack</button>
          <div className="flex flex-col-reverse border rounded-xl p-2 bg-black/70 min-h-[100px] text-cyan-200">
            {callStack.map((fn, i) => <div key={i} className="border-b py-1">{fn}</div>)}
          </div>
        </div>

        {/* Async Flow */}
        <div className="glass-card border p-4 rounded-2xl bg-black/60 border-cyan-400/30 shadow-lg">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2">Async Flow</h2>
          <button onClick={runAsyncExample} className="px-3 py-1 rounded-xl border border-cyan-400 text-cyan-200 bg-black/30 mb-2">Run Async Example</button>
          <div className="border p-2 rounded-xl bg-black/70 min-h-[80px] text-cyan-200">
            {asyncLog.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
