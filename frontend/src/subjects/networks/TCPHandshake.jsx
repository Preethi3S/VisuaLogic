import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { label: "SYN", from: "Client", to: "Server", description: "Client sends SYN to initiate connection.", color: "#4B6CB7" },
  { label: "SYN-ACK", from: "Server", to: "Client", description: "Server responds with SYN-ACK to acknowledge.", color: "#10B981" },
  { label: "ACK", from: "Client", to: "Server", description: "Client sends ACK to finalize handshake.", color: "#F59E0B" },
];

const duration = 1800; // ms per animation step

export default function TCPHandshake() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      if (stepIndex < steps.length - 1) {
        timer = setTimeout(() => setStepIndex(stepIndex + 1), duration);
      } else {
        timer = setTimeout(() => setStepIndex(0), duration + 600);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex]);

  // Static cyber grid background (no animation)
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => {
      document.body.classList.remove("bg-cyber-grid");
    };
  }, []);

  const currentStep = steps[stepIndex];
  const isLeftToRight = currentStep.from === "Client";
  const packetColors = {
    SYN: "#4B6CB7",
    "SYN-ACK": "#10B981",
    ACK: "#F59E0B"
  };

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div className="relative z-10 max-w-4xl mx-auto p-8 bg-black/70 rounded-2xl shadow-lg select-none">
        <h2 className="text-3xl font-bold mb-10 text-cyan-300 tracking-wide drop-shadow-[0_1px_10px_#4B6CB7]">TCP 3-Way Handshake</h2>

        {/* Device Row */}
        <div className="relative h-64 flex items-center justify-between mb-8 px-12">
          {/* SVG path for packet animation background */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%" height="100%" viewBox="0 0 600 180" fill="none"
            style={{ left: 0, top: 28, zIndex: 0 }}
          >
            <path
              d="M 100 90 Q 300 45 500 90"
              stroke="#67C8FF88"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6"
              filter="url(#glow1)"
            />
            <path
              d="M 500 130 Q 300 175 100 130"
              stroke="#67C8FF77"
              strokeWidth="4"
              fill="none"
              strokeDasharray="6"
              filter="url(#glow2)"
            />
            <defs>
              <filter id="glow1"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glow2"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            {/* Arrows */}
            <Arrow x={isLeftToRight ? 470 : 130} y={isLeftToRight ? 83 : 132} direction={isLeftToRight ? "right" : "left"} color={packetColors[currentStep.label]} />
          </svg>

          {/* Client Avatar */}
          <DeviceBlock
            label="Client"
            color="#4B6CB7"
            icon="💻"
            active={isLeftToRight}
            desc="Initiator"
            position="left"
          />
          {/* Animated packet */}
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={isLeftToRight ? { x: 0, y: 0, opacity: 0, scale: 0.7 } : { x: 400, y: 40, opacity: 0, scale: 0.7 }}
              animate={isLeftToRight
                ? { x: 400, y: -7, opacity: 1, scale: 1 }
                : { x: 0, y: 42, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: duration / 1000, type: "spring", bounce: 0.35 }}
              className="absolute left-[120px] top-[69px] z-10"
              style={{
                zIndex: 30,
                pointerEvents: "none"
              }}
            >
              <motion.div
                className="w-32 h-14 rounded-xl shadow-lg flex items-center justify-center font-mono text-lg font-semibold"
                style={{
                  background: `linear-gradient(92deg, ${packetColors[currentStep.label]}BB 30%, #19197099 100%)`,
                  border: `2.5px solid ${packetColors[currentStep.label]}`,
                  color: "#FFF",
                  textShadow: "0 0 8px #33415570"
                }}
                animate={{
                  scale: [1, 1.15, 1]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: 0.25,
                  repeatType: "loop",
                  ease: "easeInOut"
                }}
              >
                {currentStep.label}
              </motion.div>
            </motion.div>
          </AnimatePresence>
          {/* Server Avatar */}
          <DeviceBlock
            label="Server"
            color="#10B981"
            icon="🖥️"
            active={!isLeftToRight}
            desc="Responder"
            position="right"
          />
        </div>

        {/* Stepper */}
        <div className="mx-auto mb-5 flex items-center justify-center gap-4">
          {steps.map((s, idx) => (
            <div
              key={s.label}
              className={`flex flex-col items-center transition-all`}
              style={{ opacity: idx === stepIndex ? 1 : 0.45 }}
            >
              <div
                className={`h-3 w-3 rounded-full mb-1`}
                style={{ background: steps[idx].color }}
              />
              <span className="uppercase text-xs tracking-wider font-semibold" style={{ color: steps[idx].color }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <p className="mt-3 py-3 px-3 text-base text-cyan-100 bg-[#1e293b] border border-cyan-400/10 max-w-2xl mx-auto rounded-lg shadow-inner">
          <strong className="text-cyan-200">{currentStep.label}:</strong>{" "}
          {currentStep.description}
        </p>

        {/* Controls */}
        <div className="mt-7 flex justify-center items-center gap-6">
          {isPlaying ? (
            <button
              onClick={() => setIsPlaying(false)}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition"
              aria-label="Pause animation"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={() => setIsPlaying(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              aria-label="Play animation"
            >
              Play
            </button>
          )}
          <button
            onClick={() => {
              setIsPlaying(false);
              setStepIndex(0);
            }}
            className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-100 transition"
            aria-label="Reset animation"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// Device block with icon and neon accent
function DeviceBlock({ label, icon, color, active, desc, position }) {
  return (
    <div
      className={`flex flex-col items-center z-10 transition-all duration-300`}
      style={{
        transform: active ? "scale(1.09)" : "scale(0.95)",
        opacity: active ? 1 : 0.70,
        filter: active ? "drop-shadow(0 0 10px #67C8FF88)" : "none",
        minWidth: 110
      }}
    >
      <div
        className={`rounded-full shadow-lg border-4 flex items-center justify-center text-4xl mb-3`}
        style={{
          width: 80,
          height: 80,
          background: `linear-gradient(120deg, ${color} 50%, #191970 100%)`,
          borderColor: color,
          color: "#fff",
        }}
      >
        <span>{icon}</span>
      </div>
      <div className="text-base font-bold text-cyan-100">{label}</div>
      <div className="text-xs font-semibold text-cyan-400">{desc}</div>
    </div>
  );
}

// Neon arrow for current animation direction
function Arrow({ x, y, direction, color }) {
  if (direction === "right") {
    return (
      <polygon
        points={`${x},${y} ${x + 18},${y - 7} ${x + 18},${y + 7}`}
        fill={color}
        opacity="0.88"
      />
    );
  } else {
    // Left
    return (
      <polygon
        points={`${x},${y} ${x - 18},${y - 7} ${x - 18},${y + 7}`}
        fill={color}
        opacity="0.88"
      />
    );
  }
}
