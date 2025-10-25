import React, { useState, useEffect, useRef } from "react";

// Devices and their interrupt reasons
const devices = [
  { name: "Keyboard", color: "#4B6CB7", reason: "Key pressed" },
  { name: "Mouse", color: "#67C8FF", reason: "Mouse moved or clicked" },
  { name: "Disk", color: "#F59E0B", reason: "I/O request completed" },
  { name: "Network", color: "#10B981", reason: "Incoming network packet" },
];

const SVG_WIDTH = 900;
const SVG_HEIGHT = 500;
const CENTER_X = SVG_WIDTH / 2;
const CENTER_Y = SVG_HEIGHT / 2;
const CPU_RADIUS = 60;
const DEVICE_RADIUS = 30;

export default function InterruptScene() {
  const [interrupts, setInterrupts] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [cpuProgress, setCpuProgress] = useState(0);
  const [signalPosition, setSignalPosition] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [stage, setStage] = useState("idle"); // idle, signal, cpu, done
  const [tooltip, setTooltip] = useState("CPU is idle, executing main task.");
  const gridOffset = useRef(0);

  // Device positions arranged in a semi-circle
  const devicePositions = devices.map((_, i) => {
    const angle = (Math.PI / (devices.length + 1)) * (i + 1);
    const x = CENTER_X + 250 * Math.cos(angle - Math.PI / 2);
    const y = CENTER_Y + 150 * Math.sin(angle - Math.PI / 2);
    return { x, y };
  });

  const triggerInterrupt = (deviceIndex) => {
    if (interrupts.length === 0) {
      setActiveDevice(deviceIndex);
      setInterrupts([{ deviceIndex, progress: 0 }]);
      setSignalPosition({ ...devicePositions[deviceIndex] });
      setCpuProgress(0);
      setStage("signal");
      setTooltip(
        `${devices[deviceIndex].name} triggered an interrupt! CPU pauses main task.`
      );
    }
  };

  const triggerRandomInterrupt = () => {
    const index = Math.floor(Math.random() * devices.length);
    triggerInterrupt(index);
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying || interrupts.length === 0) return;

    const interval = setInterval(() => {
      gridOffset.current += 0.5;

      setInterrupts((prev) =>
        prev
          .map((intr) => {
            const devicePos = devicePositions[intr.deviceIndex];
            switch (stage) {
              case "signal":
                {
                  const newProgress = intr.progress + 0.03;
                  if (newProgress >= 1) {
                    setStage("cpu");
                    setTooltip(
                      `CPU received interrupt from ${devices[intr.deviceIndex].name}. Executing ISR.`
                    );
                    return { ...intr, stage: "cpu", progress: 0 };
                  } else {
                    // Quadratic Bezier curve for signal
                    const t = newProgress;
                    const ctrlX = (devicePos.x + CENTER_X) / 2;
                    const ctrlY = CENTER_Y - 100;
                    const x =
                      (1 - t) * (1 - t) * devicePos.x +
                      2 * (1 - t) * t * ctrlX +
                      t * t * CENTER_X;
                    const y =
                      (1 - t) * (1 - t) * devicePos.y +
                      2 * (1 - t) * t * ctrlY +
                      t * t * CENTER_Y;
                    setSignalPosition({ x, y });
                    return { ...intr, progress: newProgress };
                  }
                }
              case "cpu":
                {
                  const cpuProgressNew = intr.progress + 0.02;
                  setCpuProgress(cpuProgressNew);
                  if (cpuProgressNew >= 1) {
                    setStage("done");
                    setTooltip(
                      "ISR handled. CPU resumes main task."
                    );
                    setActiveDevice(null);
                    setSignalPosition(null);
                    setCpuProgress(0);
                    return { ...intr, stage: "done" };
                  } else return { ...intr, progress: cpuProgressNew };
                }
              default:
                return intr;
            }
          })
          .filter((i) => i.stage !== "done")
      );
    }, 25);

    return () => clearInterval(interval);
  }, [interrupts, isPlaying, stage]);

  // Particle trail
  const renderParticles = () => {
    if (!signalPosition || activeDevice === null) return null;
    const particles = [];
    const { x: startX, y: startY } = devicePositions[activeDevice];
    const { x: endX, y: endY } = signalPosition;
    for (let i = 0; i < 6; i++) {
      const t = i / 6;
      const px = startX + (endX - startX) * t;
      const py = startY + (endY - startY) * t;
      const radius = 3 * (1 - t);
      particles.push(
        <circle
          key={i}
          cx={px}
          cy={py}
          r={radius}
          fill="#FFD700"
          opacity={0.5 + Math.random() * 0.3}
        />
      );
    }
    return particles;
  };

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      <div className="relative z-10 flex flex-col items-center p-4">
        {/* Top Section */}
        <div className="glass-card text-center text-cyan-100 max-w-3xl mb-6 p-4 rounded-2xl bg-black/70 border border-cyan-400/30 shadow-lg">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2 drop-shadow-[0_0_8px_#67C8FF]">
            Interrupt Handling in OS
          </h1>
          <p className="text-lg text-cyan-200 mb-4">
            An <span className="text-cyan-300 font-semibold">interrupt</span> is a signal sent to the CPU by hardware or software indicating an event that requires immediate attention. The CPU pauses its current <span className="text-green-400 font-semibold">main task</span>, executes the <span className="text-green-400 font-semibold">Interrupt Service Routine (ISR)</span>, and then resumes the main task.
          </p>
          <p className="text-cyan-400">Steps to handle an interrupt:</p>
          <ol className="text-cyan-200 list-decimal list-inside">
            <li>Device sends an interrupt signal.</li>
            <li>CPU pauses the current main process.</li>
            <li>ISR executes the interrupt logic.</li>
            <li>CPU resumes the main task.</li>
          </ol>
        </div>

        {/* Buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          {devices.map((dev, i) => (
            <button
              key={dev.name}
              className="px-3 py-1 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm transition-transform transform hover:scale-105 font-semibold shadow"
              onClick={() => triggerInterrupt(i)}
            >
              Trigger {dev.name} Interrupt
            </button>
          ))}
          <button
            className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-sm transition-transform transform hover:scale-105 font-semibold shadow"
            onClick={triggerRandomInterrupt}
          >
            Random Interrupt
          </button>
          <button
            className="px-3 py-1 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black text-sm transition-transform transform hover:scale-105 font-semibold shadow"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>

        {/* SVG Animation */}
        <div className="glass-card rounded-2xl border border-cyan-400/10 shadow bg-black/60 w-auto mx-auto flex justify-center">
          <svg width={SVG_WIDTH} height={SVG_HEIGHT}>
            {/* Cyber Grid Pattern */}
            <defs>
              <pattern
                id="gridPattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M 0 ${gridOffset.current % 40} L 40 ${gridOffset.current % 40} M ${gridOffset.current % 40} 0 L ${gridOffset.current % 40} 40`}
                  stroke="#67C8FF"
                  strokeWidth="0.3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPattern)" />

            {/* CPU */}
            <circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={CPU_RADIUS}
              fill={activeDevice !== null ? "#FFD700" : "#17223B"}
              stroke="#67C8FF"
              strokeWidth={activeDevice !== null ? 4 : 2}
              style={{ filter: activeDevice !== null ? "drop-shadow(0 0 18px #f59e0b)" : "drop-shadow(0 0 7px #67C8FF)" }}
            />
            <text
              x={CENTER_X}
              y={CENTER_Y + 5}
              textAnchor="middle"
              fill="#fff"
              fontWeight="bold"
              fontSize="22"
              style={{ letterSpacing: "2px", filter: "drop-shadow(0 0 4px #222)" }}
            >
              CPU
            </text>

            {/* Main Task Progress */}
            <rect
              x={CENTER_X - 150}
              y={CENTER_Y + CPU_RADIUS + 30}
              width={300}
              height={12}
              fill="#4B6CB7"
              rx="6"
              opacity={activeDevice !== null ? 0.3 : 1}
            />
            <rect
              x={CENTER_X - 150}
              y={CENTER_Y + CPU_RADIUS + 30}
              width={300 * (activeDevice !== null ? 0.3 : cpuProgress)}
              height={12}
              fill="#67C8FF"
              rx="6"
              style={{ filter: "drop-shadow(0 0 10px #67C8FF88)" }}
            />

            {/* ISR Progress */}
            {activeDevice !== null && stage === "cpu" && (
              <rect
                x={CENTER_X - 150}
                y={CENTER_Y + CPU_RADIUS + 50}
                width={300 * cpuProgress}
                height={12}
                fill="#10B981"
                rx="6"
                style={{ filter: "drop-shadow(0 0 10px #10B98188)" }}
              />
            )}

            {/* Devices */}
            {devices.map((device, i) => {
              const { x, y } = devicePositions[i];
              const isActive = i === activeDevice;
              return (
                <g
                  key={device.name}
                  style={{ cursor: "pointer" }}
                  onClick={() => triggerInterrupt(i)}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={DEVICE_RADIUS}
                    fill={isActive ? "#FFD700" : device.color}
                    stroke="#fff"
                    strokeWidth={2}
                    style={{ filter: isActive ? "drop-shadow(0 0 12px #F59E0B)" : "drop-shadow(0 0 7px #fff)" }}
                  />
                  <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    fill="#fff"
                    fontWeight="bold"
                    fontSize="15"
                    style={{ filter: "drop-shadow(0 0 4px #222)" }}
                  >
                    {device.name}
                  </text>
                </g>
              );
            })}

            {/* Signal Particles */}
            {renderParticles()}

            {/* Main Signal Line */}
            {signalPosition && (
              <line
                x1={devicePositions[activeDevice].x}
                y1={devicePositions[activeDevice].y}
                x2={signalPosition.x}
                y2={signalPosition.y}
                stroke="#FFD700"
                strokeWidth="2"
                strokeDasharray="6"
                strokeLinecap="round"
              />
            )}

            {/* Tooltip */}
            <text
              x={CENTER_X}
              y={CENTER_Y - CPU_RADIUS - 30}
              textAnchor="middle"
              fill="#FFD700"
              fontWeight="bold"
              fontSize="15"
              style={{ filter: "drop-shadow(0 0 9px #FFD70099)" }}
            >
              {tooltip}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
