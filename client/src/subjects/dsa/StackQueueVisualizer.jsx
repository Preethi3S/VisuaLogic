import React, { useState, useEffect } from "react";

export default function StackQueueVisualizer() {
  const [stack, setStack] = useState([]);
  const [queue, setQueue] = useState([]);
  const [input, setInput] = useState("");
  const [log, setLog] = useState([]);

  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid");
    return () => document.body.classList.remove("bg-cyber-grid");
  }, []);

  const addLog = (msg) => setLog((prev) => [msg, ...prev]);

  // Stack actions
  const pushStack = () => {
    if (!input.trim()) return;
    setStack((prev) => [...prev, { id: Date.now(), val: input }]);
    addLog(`Pushed ${input} to Stack`);
    setInput("");
  };
  const popStack = () => {
    if (stack.length === 0) return;
    const popped = stack[stack.length - 1];
    setStack((prev) => prev.slice(0, -1));
    addLog(`Popped ${popped.val} from Stack`);
  };

  // Queue actions
  const enqueue = () => {
    if (!input.trim()) return;
    setQueue((prev) => [...prev, { id: Date.now(), val: input }]);
    addLog(`Enqueued ${input} to Queue`);
    setInput("");
  };
  const dequeue = () => {
    if (queue.length === 0) return;
    const dequeued = queue[0];
    setQueue((prev) => prev.slice(1));
    addLog(`Dequeued ${dequeued.val} from Queue`);
  };

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Static Cyber Grid background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div className="relative z-10 p-7 max-w-3xl mx-auto min-h-screen flex flex-col gap-7"
        style={{
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        }}
      >
        <h1 className="text-3xl font-bold text-center mb-4 text-[#4B6CB7] drop-shadow-md">
          Stack & Queue Visualizer
        </h1>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter value"
            className="border rounded-lg px-3 py-2 bg-white/80 focus:outline-[#4B6CB7] text-[#334155] font-mono"
          />
          <button
            onClick={pushStack}
            className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white px-4 py-2 rounded-lg font-bold shadow"
          >
            Push Stack
          </button>
          <button
            onClick={popStack}
            className="bg-indigo-300 text-white px-4 py-2 rounded-lg font-bold shadow"
          >
            Pop Stack
          </button>
          <button
            onClick={enqueue}
            className="bg-gradient-to-r from-green-400 to-cyan-400 text-white px-4 py-2 rounded-lg font-bold shadow"
          >
            Enqueue
          </button>
          <button
            onClick={dequeue}
            className="bg-green-300 text-white px-4 py-2 rounded-lg font-bold shadow"
          >
            Dequeue
          </button>
        </div>

        <div className="flex justify-around gap-10 flex-wrap">
          {/* Stack */}
          <div className="bg-white/90 p-6 rounded-2xl shadow-lg min-h-[260px] flex flex-col flex-1 max-w-xs">
            <h2 className="font-bold mb-4 text-[#4B6CB7] text-lg">Stack (LIFO)</h2>
            <div className="flex-1 flex items-start justify-center">
              <div className="w-48 h-56 p-2 border-2 border-dashed border-[#4B6CB7] rounded-lg bg-[#EFF6FF] overflow-y-auto flex flex-col-reverse items-center gap-2">
                {stack.length === 0 && (
                  <div className="text-xs text-gray-400">(empty)</div>
                )}
                {stack.map((node) => (
                  <div
                    key={node.id}
                    className="w-40 h-12 flex items-center justify-center rounded-md shadow-md bg-white border border-blue-300 transition-all font-semibold text-blue-700"
                  >
                    <div className="font-mono">{node.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500 text-center">Top is at the bottom.</div>
          </div>

          {/* Queue */}
          <div className="bg-white/90 p-6 rounded-2xl shadow-lg min-h-[260px] flex flex-col flex-1 max-w-xs">
            <h2 className="font-bold mb-4 text-green-600 text-lg">Queue (FIFO)</h2>
            <div className="flex-1 flex items-start justify-center">
              <div className="w-48 h-56 p-2 border-2 border-dashed border-green-400 rounded-lg bg-[#F0FFFA] overflow-x-auto flex flex-row items-center gap-2">
                {queue.length === 0 && (
                  <div className="text-xs text-gray-400">(empty)</div>
                )}
                {queue.map((node) => (
                  <div
                    key={node.id}
                    className="w-12 h-12 flex items-center justify-center rounded-md shadow-md bg-white border border-green-300 transition-all font-semibold text-green-600"
                  >
                    <div className="font-mono">{node.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500 text-center">Front is at the left.</div>
          </div>
        </div>

        {/* Operation log */}
        <div className="bg-white/80 p-6 rounded-2xl shadow-lg">
          <h2 className="font-bold mb-3 text-indigo-700 text-lg">Operation Log</h2>
          <ul className="text-sm text-gray-700 list-disc pl-6 space-y-1 max-h-44 overflow-y-auto font-mono">
            {log.map((entry, idx) => (
              <li key={idx}>{entry}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
