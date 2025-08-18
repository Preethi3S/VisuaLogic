import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function RecursionBacktrackingVisualizer() {
  const [code, setCode] = useState(`function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log(factorial(5));`);
  const [allSteps, setAllSteps] = useState([]);
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  // Apply cyber grid background
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid");
    return () => document.body.classList.remove("bg-cyber-grid");
  }, []);

  const runCode = () => {
    try {
      setError("");
      clearInterval(intervalRef.current);
      setVisibleSteps([]);

      // Extract function names
      const fnNames = [];
      const withMarkers = code.replace(
        /function\s+([a-zA-Z0-9_]+)\s*\(/g,
        (match, name) => {
          fnNames.push(name);
          return match;
        }
      );

      // Instrumentation wrapper
      const instrumented = `
        let __steps = [];
        function __push(name, args) { 
          __steps.push({ type: "push", name, args: Array.from(args) }); 
        }
        function __pop() { __steps.push({ type: "pop" }); }
        function __log(msg) { __steps.push({ type: "log", msg }); }

        ${withMarkers}

        ${fnNames.map(fn => `const __orig_${fn} = ${fn};`).join("\n")}

        ${fnNames.map(fn => `
          ${fn} = function(...args) {
            __push("${fn}", args);
            __log("Call: ${fn}(" + args.join(", ") + ")");
            const res = __orig_${fn}.apply(this, args);
            __log("Return from ${fn} => " + res);
            __pop();
            return res;
          };
        `).join("\n")}

        try {
          ${fnNames.length ? `${fnNames[0]}(5);` : ""}
        } catch(e) {
          __log("Error: " + e.message);
        }

        return __steps;
      `;

      const stepsResult = new Function(instrumented)();
      setAllSteps(stepsResult);

      // Animate step playback
      let i = 0;
      intervalRef.current = setInterval(() => {
        if (i >= stepsResult.length) {
          clearInterval(intervalRef.current);
          return;
        }
        setVisibleSteps(prev => [...prev, stepsResult[i]]);
        i++;
      }, 680);
    } catch (err) {
      setError(err.message);
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setVisibleSteps([]);
    setAllSteps([]);
    setError("");
  };

  // Filter out any undefined or malformed steps
  const safeSteps = (visibleSteps || []).filter(s => s && s.type);

  // Build current call stack from visible steps
  const callStack = safeSteps.reduce((stack, step) => {
    if (step.type === "push") {
      stack.push(`${step.name}(${step.args.join(", ")})`);
    } else if (step.type === "pop") {
      stack.pop();
    }
    return [...stack];
  }, []);

  // Collect only logs
  const logs = safeSteps.filter(s => s.type === "log").map(s => s.msg);

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Static cyber grid background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div className="relative z-10 max-w-4xl mx-auto p-10 bg-black/80 rounded-2xl shadow-2xl" style={{ marginTop: 40 }}>

        <h2 className="text-3xl font-bold mb-6 text-indigo-300 tracking-wide flex items-center gap-2">
          <span>🌀</span> Recursion & Backtracking Visualizer
        </h2>
        <p className="mb-5 text-cyan-100">Step through recursive call stacks and visualize backtracking as it happens, live!</p>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{
            width: "100%",
            height: "140px",
            padding: "10px",
            background: "#0d172a",
            color: "#cbd5e1",
            border: "1.5px solid #67C8FF",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: 15,
            marginBottom: 8,
            marginTop: 2
          }}
        />
        <div style={{ marginTop: 4, marginBottom: 18 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={runCode}
            className="px-6 py-3 bg-gradient-to-r from-[#4B6CB7] to-[#67C8FF] text-white font-bold rounded-xl shadow-lg mr-4"
          >
            Run (Animated)
          </motion.button>
          <button
            onClick={reset}
            className="px-6 py-3 bg-orange-400 text-white font-bold rounded-xl shadow-lg"
          >
            Reset
          </button>
        </div>
        {error && <p className="text-red-400 font-semibold">{error}</p>}

        <div className="flex flex-col md:flex-row gap-8 mt-10">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 text-cyan-200">Call Stack</h3>
            <div className="bg-black/40 border border-cyan-800 rounded-xl p-5 min-h-[160px] font-mono text-cyan-100 text-lg shadow">
              {callStack.length === 0
                ? <em className="opacity-60">No active calls</em>
                : (
                  <AnimatePresence>
                    {callStack.map((item, idx) => (
                      <motion.div
                        key={item + idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.21 }}
                        className="mb-1"
                      >
                        <span className="mr-2 text-indigo-300">↳</span>
                        <span className="">{item}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )
              }
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 text-amber-200">Execution Log</h3>
            <div className="bg-black/40 border border-amber-400/40 rounded-xl p-5 min-h-[160px] font-mono text-amber-100 text-base shadow">
              {logs.length === 0
                ? <em className="opacity-50">No logs yet</em>
                : (
                  <AnimatePresence>
                    {logs.map((msg, idx) => (
                      <motion.div
                        key={msg + idx}
                        initial={{ opacity: 0, x: 22 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 22 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        ● {msg}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
