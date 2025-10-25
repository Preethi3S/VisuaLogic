// src/scenes/AnimationVisualizer.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JSXParser from "react-jsx-parser";

export default function AnimationVisualizer() {
  const [code, setCode] = useState(`
<div className="box animate-bounce bg-blue-500 p-4 rounded text-white">
  Hello Animation!
</div>
<div className="card animate-pulse bg-white p-4 rounded mt-4 shadow">
  Card with pulse
</div>
  `);

  const [occurrences, setOccurrences] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const normalized = code.replace(/class\s*=/g, "className=");
    const matches = Array.from(normalized.matchAll(/animate-[\w-]+/g)).map(
      (m) => ({ value: m[0], index: m.index })
    );
    setOccurrences(matches);
    setCurrentStep(0);
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [code]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startPlaying = () => {
    if (occurrences.length === 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % occurrences.length);
    }, 1500);
  };

  const stopPlaying = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getModifiedCode = () => {
    const base = code.replace(/class\s*=/g, "className=");
    if (occurrences.length === 0) return base;

    let out = "";
    let lastPos = 0;
    occurrences.forEach((occ, idx) => {
      const pos = occ.index;
      out += base.slice(lastPos, pos);
      out += idx === currentStep ? occ.value : "";
      lastPos = pos + occ.value.length;
    });
    out += base.slice(lastPos);

    out = out.replace(/className\s*=\s*"([^"]*)"/g, (m, p1) => {
      const cleaned = p1.replace(/\s+/g, " ").trim();
      return `className="${cleaned}"`;
    });
    out = out.replace(/className\s*=\s*'([^']*)'/g, (m, p1) => {
      const cleaned = p1.replace(/\s+/g, " ").trim();
      return `className='${cleaned}'`;
    });

    return out;
  };

  const modifiedCode = getModifiedCode();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Main Content */}
      <div className="relative z-10 p-8">
        <motion.h1
          className="text-3xl font-bold text-[#67C8FF] mb-6 drop-shadow-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Animation Visualizer
        </motion.h1>

        <motion.p
          className="text-lg text-gray-200 mb-8 max-w-2xl drop-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Step through Tailwind animation classes one by one and preview them in
          real-time.
        </motion.p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Code Input */}
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg">
            <h2 className="font-semibold mb-2 text-[#1F2937]">
              Paste Your JSX Code
            </h2>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 border p-2 font-mono rounded"
              spellCheck={false}
            />
            <p className="text-xs text-gray-500 mt-2">
              Tip: use <code>className=</code> (or <code>class=</code> will be
              normalized).
            </p>
          </div>

          {/* Live Preview */}
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg">
            <h2 className="font-semibold mb-2 text-[#1F2937]">Live Preview</h2>
            <div className="border p-4 min-h-[200px] flex items-start justify-center rounded bg-gray-50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep + "-" + occurrences.length}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full"
                >
                  <JSXParser jsx={modifiedCode} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Timeline + Step Controls */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg mt-6">
          <h2 className="font-semibold mb-2 text-[#1F2937]">
            Animation Timeline & Steps
          </h2>

          {occurrences.length === 0 ? (
            <p className="text-gray-600">No animations detected.</p>
          ) : (
            <>
              {/* Timeline */}
              <div className="flex flex-wrap gap-2 mb-4">
                {occurrences.map((occ, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentStep(idx);
                      stopPlaying();
                    }}
                    className={`px-3 py-1 rounded text-sm border transition ${
                      idx === currentStep
                        ? "bg-[#4B6CB7] text-white border-[#4B6CB7]"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {occ.value}{" "}
                    <span className="text-xs text-gray-400 ml-2">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentStep((prev) => Math.max(prev - 1, 0));
                    stopPlaying();
                  }}
                  className="px-3 py-1 bg-gray-300 rounded"
                >
                  Prev
                </button>

                {isPlaying ? (
                  <button
                    onClick={stopPlaying}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={startPlaying}
                    className="px-3 py-1 bg-green-500 text-white rounded"
                  >
                    Play
                  </button>
                )}

                <button
                  onClick={() => {
                    setCurrentStep((prev) =>
                      Math.min(prev + 1, occurrences.length - 1)
                    );
                    stopPlaying();
                  }}
                  className="px-3 py-1 bg-gray-300 rounded"
                >
                  Next
                </button>

                <div className="ml-4 text-sm text-gray-700">
                  Step {currentStep + 1} / {occurrences.length}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
