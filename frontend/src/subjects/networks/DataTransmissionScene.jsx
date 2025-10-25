import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

function Node({ label, className }) {
  return (
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${className}`}
    >
      {label}
    </div>
  );
}

function Packet({ delay, pathClass }) {
  return (
    <motion.div
      className={`w-4 h-4 rounded-full bg-orange-500 absolute ${pathClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 3, repeat: Infinity, delay }}
    />
  );
}

function Frame({ bits, hasError, delay }) {
  return (
    <motion.div
      className={`px-4 py-2 rounded-lg font-mono text-sm ${
        hasError ? "bg-red-300 text-red-800" : "bg-green-200 text-green-800"
      }`}
      initial={{ x: -200, opacity: 0 }}
      animate={{ x: [-200, 0, 200], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 4, repeat: Infinity, delay }}
    >
      {bits}
    </motion.div>
  );
}

export default function DataTransmissionScene() {
  const [tab, setTab] = useState("switching");
  const [mode, setMode] = useState("circuit");
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);

  const circuitSteps = [
    "Step 1: A dedicated circuit path is established between A and B.",
    "Step 2: Data flows continuously along this path.",
    "Step 3: Receiver B gets the complete message in order.",
  ];
  const packetSteps = [
    "Step 1: Message is divided into packets.",
    "Step 2: Each packet takes different paths via routers R1 or R2.",
    "Step 3: Packets arrive at B and are reassembled in the correct order.",
  ];
  const frameSteps = [
    "Step 1: Data is split into frames for transmission.",
    "Step 2: Each frame carries error-detection bits.",
    "Step 3: If error detected → frame retransmitted.",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [tab, mode]);

  // Static cyber grid background (no animation)
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => {
      document.body.classList.remove("bg-cyber-grid");
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div className="relative z-10 w-full h-screen flex flex-col items-center justify-start pt-10">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => { setTab("switching"); setStep(0); }}
            className={`px-4 py-2 rounded-xl font-semibold ${
              tab === "switching" ? "bg-indigo-600 text-white" : "bg-black/40 text-cyan-200"
            }`}
          >
            Switching
          </button>
          <button
            onClick={() => { setTab("framing"); setStep(0); }}
            className={`px-4 py-2 rounded-xl font-semibold ${
              tab === "framing" ? "bg-indigo-600 text-white" : "bg-black/40 text-cyan-200"
            }`}
          >
            Framing
          </button>
        </div>

        {/* Switching Visualization */}
        {tab === "switching" && (
          <div className="relative w-[650px] h-[320px] border border-cyan-400 rounded-2xl bg-black/70 shadow-md flex items-center justify-center">
            {/* Controls */}
            <div className="absolute top-2 left-2 bg-black/30 border border-cyan-400 p-2 rounded-lg">
              <button
                onClick={() => { setMode("circuit"); setStep(0); }}
                className={`px-2 py-1 mr-2 rounded-xl ${
                  mode === "circuit" ? "bg-indigo-600 text-white" : "bg-black/40 text-cyan-200"
                }`}
              >
                Circuit
              </button>
              <button
                onClick={() => { setMode("packet"); setStep(0); }}
                className={`px-2 py-1 rounded-xl ${
                  mode === "packet" ? "bg-indigo-600 text-white" : "bg-black/40 text-cyan-200"
                }`}
              >
                Packet
              </button>
            </div>
            {/* Lines (paths) */}
            {mode === "circuit" ? (
              <motion.div
                className="absolute top-1/2 left-[72px] h-1 w-[500px] bg-green-400"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            ) : (
              <>
                <motion.div
                  className="absolute w-[250px] h-1 bg-sky-400 top-[90px] left-[130px] rotate-[15deg]"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute w-[250px] h-1 bg-sky-400 bottom-[90px] left-[130px] -rotate-[15deg]"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
              </>
            )}
            {/* Nodes */}
            <Node label="A" className="bg-indigo-600 absolute left-6 top-1/2 -translate-y-1/2" />
            <Node label="B" className="bg-indigo-600 absolute right-6 top-1/2 -translate-y-1/2" />
            <Node label="R1" className="bg-sky-400 absolute top-12 left-1/2 -translate-x-1/2" />
            <Node label="R2" className="bg-sky-400 absolute bottom-12 left-1/2 -translate-x-1/2" />
            {/* Packets */}
            {mode === "circuit" ? (
              <Packet delay={0} pathClass="top-1/2 left-12" />
            ) : (
              <>
                <Packet delay={0} pathClass="top-[70px] left-[70px]" />
                <Packet delay={1} pathClass="bottom-[70px] left-[70px]" />
              </>
            )}
          </div>
        )}

        {/* Framing Visualization */}
        {tab === "framing" && (
          <div className="relative w-[650px] h-[320px] border border-cyan-400 rounded-2xl bg-black/70 shadow-md flex flex-col items-center justify-center space-y-4">
            {/* Error Control */}
            <div className="absolute top-2 left-2 bg-black/30 border border-cyan-400 p-2 rounded-lg">
              <button
                onClick={() => setError((e) => !e)}
                className={`px-3 py-1 rounded-xl ${
                  error ? "bg-rose-600 text-white" : "bg-black/40 text-cyan-200"
                }`}
              >
                {error ? "Error On" : "Error Off"}
              </button>
            </div>
            {/* Frames flow */}
            <Frame bits="1011001" hasError={false} delay={0} />
            <Frame bits="1100110" hasError={error} delay={1} />
            <Frame bits="1110001" hasError={false} delay={2} />
          </div>
        )}

        {/* Caption / Walkthrough */}
        <div className="mt-6 max-w-2xl text-center bg-black/70 border border-cyan-400 px-4 py-3 rounded-xl shadow-md">
          <p className="text-cyan-100 font-medium">
            {tab === "switching"
              ? mode === "circuit"
                ? circuitSteps[step]
                : packetSteps[step]
              : frameSteps[step]}
          </p>
        </div>
      </div>
    </div>
  );
}
