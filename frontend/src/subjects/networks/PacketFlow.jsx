import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const devices = [
  { id: 0, name: "Sender", color: "#4B6CB7", icon: "📤" },
  { id: 1, name: "Router 1", color: "#67C8FF", icon: "🔁" },
  { id: 2, name: "Router 2", color: "#10B981", icon: "🔁" },
  { id: 3, name: "Receiver", color: "#F59E0B", icon: "📥" }
];

const packetSteps = [
  {
    deviceIndex: 0,
    action: "Packet created at Sender",
    description: "The sender prepares the packet with source & destination addresses."
  },
  {
    deviceIndex: 1,
    action: "Packet arrives at Router 1",
    description: "Router 1 checks routing table and forwards packet accordingly."
  },
  {
    deviceIndex: 2,
    action: "Packet arrives at Router 2",
    description: "Router 2 examines packet TTL and forwards to destination."
  },
  {
    deviceIndex: 3,
    action: "Packet received at Receiver",
    description: "Receiver accepts the packet and processes the data."
  }
];

const devicePositions = [
  { x: 50, y: 140 },
  { x: 240, y: 57 },
  { x: 470, y: 198 },
  { x: 650, y: 140 }
];

const stepDuration = 2500; // ms

export default function PacketFlow() {
  const [currentStep, setCurrentStep] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => document.body.classList.remove("bg-cyber-grid");
  }, []);

  const startAnimation = () => {
    if (!isPlaying) {
      if (currentStep === null) setCurrentStep(0);
      setIsPlaying(true);
    }
  };

  const pauseAnimation = () => {
    setIsPlaying(false);
    clearTimeout(timerRef.current);
  };

  const resetAnimation = () => {
    setIsPlaying(false);
    setCurrentStep(null);
    clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (isPlaying && currentStep !== null) {
      if (currentStep < packetSteps.length - 1) {
        timerRef.current = setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
        }, stepDuration / speed);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentStep, speed]);

  if (currentStep === null) {
    return (
      <div className="relative min-h-screen w-full font-sans">
        <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
        <div className="relative z-10 max-w-4xl mx-auto p-10 bg-black/80 rounded-2xl shadow-2xl flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-6 text-cyan-200 drop-shadow-[0_2px_12px_#67C8FF]">
            Packet Flow Visualization
          </h2>
          <p className="mb-8 text-cyan-100 text-lg">Click <b>Start</b> to watch a packet traverse the network path with glowing animations.</p>
          <button
            onClick={startAnimation}
            className="px-7 py-3 bg-indigo-600 text-white text-lg rounded-xl font-bold shadow transition hover:bg-indigo-700"
          >
            Start Animation
          </button>
        </div>
      </div>
    );
  }

  const step = packetSteps[currentStep];
  const { deviceIndex, action, description } = step;
  const packetColor = devices[deviceIndex].color;

  // Calculate packet's (x,y) along Bezier curve between devices
  function getPacketMidpoint(step, t = 1) {
    // Control points for cubic Bezier between current and next
    const p0 = devicePositions[step];
    const p1 = devicePositions[step] || devicePositions[0];
    const p2 = devicePositions[step + 1] || devicePositions[devicePositions.length - 1];
    const p3 = devicePositions[step + 1] || devicePositions[devicePositions.length - 1];
    if (!p1 || !p2) return { x: 50, y: 140 };
    // Simple quadratic for just 2 points
    const tt = Math.max(0, Math.min(1, t));
    // Control: curve goes up then down/sideways based on direction
    const bend = step % 2 === 0 ? -70 : 70;
    const cpx = (p1.x + p2.x) / 2;
    const cpy = ((p1.y + p2.y) / 2) + bend;
    // Bezier quadratic
    const x = Math.pow(1 - tt, 2) * p1.x + 2 * (1 - tt) * tt * cpx + Math.pow(tt, 2) * p2.x;
    const y = Math.pow(1 - tt, 2) * p1.y + 2 * (1 - tt) * tt * cpy + Math.pow(tt, 2) * p2.y;
    return { x, y };
  }

  return (
    <div className="relative min-h-screen w-full font-sans">
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div
        className="relative z-10 max-w-4xl mx-auto p-10 mt-14 bg-black/80 rounded-2xl shadow-2xl select-none"
        tabIndex={0}
        aria-live="polite"
        aria-atomic="true"
      >
        <h2 className="text-3xl font-bold mb-10 text-cyan-200 text-center tracking-wide drop-shadow-[0_2px_12px_#67C8FF]">
          Packet Flow Visualization
        </h2>
        {/* Device Network Path */}
        <div className="relative mb-8 mt-2" style={{ height: 250, width: "710px", margin: "0 auto" }}>
          {/* Neon flow paths */}
          <svg className="absolute left-0 top-0 z-0 pointer-events-none"
            width={700} height={220} viewBox="0 0 700 220" fill="none">
            {/* Curved links */}
            {[0, 1, 2].map(d => {
              const from = devicePositions[d];
              const to = devicePositions[d + 1];
              const bend = d % 2 === 0 ? -90 : 90;
              const cpx = (from.x + to.x) / 2;
              const cpy = ((from.y + to.y) / 2) + bend;
              return (
                <path
                  key={d}
                  d={`M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`}
                  stroke="#67C8FF"
                  strokeWidth="6"
                  fill="none"
                  opacity={currentStep > d ? 1 : 0.35}
                  strokeDasharray="8"
                  filter="url(#neonglow2)"
                  style={{ filter: "drop-shadow(0 0 10px #67C8FF88)" }}
                />
              );
            })}
            <defs>
              <filter id="neonglow2"><feGaussianBlur stdDeviation="2.3" result="cB"/><feMerge><feMergeNode in="cB"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
          </svg>
          {/* Devices */}
          {devices.map((device, idx) => (
            <DeviceBlock
              key={device.id}
              {...device}
              x={devicePositions[idx].x}
              y={devicePositions[idx].y}
              active={idx === deviceIndex}
              idx={idx}
            />
          ))}
          {/* Animated Packet */}
          <AnimatePresence mode="wait">
            {deviceIndex < devicePositions.length &&
              <PacketBubble
                key={deviceIndex}
                fromIdx={deviceIndex === 0 ? 0 : deviceIndex - 1}
                toIdx={deviceIndex}
                step={deviceIndex}
                packetColor={packetColor}
              />
            }
          </AnimatePresence>
        </div>
        {/* Stepper */}
        <div className="flex items-center justify-center mb-7 gap-8">
          {devices.map((device, idx) => (
            <div key={device.id} className="flex flex-col items-center"
                 style={{ opacity: deviceIndex === idx ? 1 : 0.50, minWidth: 77 }}>
              <div
                className="h-3 w-3 rounded-full mb-1"
                style={{ background: device.color, filter: deviceIndex === idx ? `drop-shadow(0 0 6px ${device.color})` : "none" }}
              />
              <span className="uppercase text-xs tracking-wider font-semibold" style={{ color: device.color }}>{device.name}</span>
            </div>
          ))}
        </div>
        {/* Action & Description */}
        <div className="mb-4 text-center p-4 bg-black/60 border border-cyan-400/20 rounded-2xl min-h-[90px] shadow-lg">
          <h3 className="text-xl font-bold mb-2" style={{ color: packetColor, letterSpacing: "0.5px" }}>
            {action}
          </h3>
          <p className="text-cyan-100 font-medium">{description}</p>
        </div>
        {/* Controls */}
        <div className="mt-7 flex justify-center items-center gap-6">
          {isPlaying ? (
            <button
              onClick={pauseAnimation}
              className="px-7 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition"
              aria-label="Pause animation"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={startAnimation}
              disabled={currentStep === packetSteps.length - 1}
              className="px-7 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              aria-label="Play animation"
            >
              Play
            </button>
          )}
          <button
            onClick={resetAnimation}
            className="px-7 py-3 border border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-100 transition"
            aria-label="Reset animation"
          >
            Reset
          </button>
          {/* Speed control */}
          <label
            htmlFor="speed"
            className="font-semibold text-cyan-100 select-none"
            aria-label="Animation speed control"
          >
            Speed:
          </label>
          <input
            id="speed"
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-24 accent-indigo-500"
            aria-valuemin={0.25}
            aria-valuemax={3}
            aria-valuenow={speed}
            aria-valuetext={`${speed} times speed`}
          />
          <span className="w-8 text-center font-mono text-cyan-100">{speed.toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
}

// Device avatar block with neon accents
function DeviceBlock({ name, color, x, y, icon, active, idx }) {
  return (
    <motion.div
      className="absolute transition-all flex flex-col items-center"
      style={{
        left: x - 37,
        top: y - 47,
        zIndex: 5,
        // pointerEvents: "none",
      }}
      animate={{
        scale: active ? 1.15 : 1,
        opacity: active ? 1 : 0.75,
        filter: active
          ? `drop-shadow(0 0 12px ${color}A0)`
          : "",
      }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
    >
      <div
        className="rounded-full shadow-xl border-4 flex items-center justify-center text-3xl mb-2 font-bold"
        style={{
          width: 75,
          height: 75,
          background: `linear-gradient(120deg, ${color} 55%, #111927 100%)`,
          borderColor: color,
          color: "#fff",
          textShadow: "0 2px 8px #10101070"
        }}
      >
        {icon}
      </div>
      <div className="font-semibold text-sm text-cyan-50">{name}</div>
    </motion.div>
  );
}

// Animated Packet Bubble
function PacketBubble({ fromIdx, toIdx, step, packetColor }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    setT(0);
    const start = Date.now();
    let frame;
    function animate() {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / stepDuration);
      setT(progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
    }
    animate();
    return () => frame && cancelAnimationFrame(frame);
    // eslint-disable-next-line
  }, [step]);

  // Calculate Bezier along path
  const p1 = devicePositions[fromIdx];
  const p2 = devicePositions[toIdx];
  if (!p1 || !p2) return null;
  const bend = fromIdx % 2 === 0 ? -90 : 90;
  const cpx = (p1.x + p2.x) / 2;
  const cpy = ((p1.y + p2.y) / 2) + bend;
  // Quadratic Bezier
  function bezier(t) {
    const x = Math.pow(1 - t, 2) * p1.x + 2 * (1 - t) * t * cpx + Math.pow(t, 2) * p2.x;
    const y = Math.pow(1 - t, 2) * p1.y + 2 * (1 - t) * t * cpy + Math.pow(t, 2) * p2.y;
    return { x, y };
  }
  const pos = bezier(t);

  return (
    <motion.div
      className="absolute z-20"
      style={{
        left: pos.x - 20,
        top: pos.y - 20,
        width: 42,
        height: 42,
        pointerEvents: "none"
      }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [1.1, 1, 1.1], opacity: 1 }}
      transition={{ duration: 1.3, repeat: Infinity, repeatType: "mirror" }}
    >
      <div
        className="rounded-full bg-gradient-to-br flex items-center justify-center font-mono text-lg font-bold"
        style={{
          background: `linear-gradient(120deg, ${packetColor} 62%, #22223E 100%)`,
          boxShadow: `0 0 12px 2.5px ${packetColor}99, 0 0 0 5px #10101022`,
          border: `2px solid ${packetColor}`,
          color: "#fff",
          width: 42,
          height: 42,
          textShadow: "0 1px 6px #0007"
        }}
      >
        📨
      </div>
    </motion.div>
  );
}
