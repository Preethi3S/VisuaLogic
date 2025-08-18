import React, { useState, useEffect } from "react";

const syscalls = [
  { name: "File Read", color: "#4B6CB7", description: "Read a file from disk." },
  { name: "Network Send", color: "#67C8FF", description: "Send data over network." },
  { name: "Process Create", color: "#F59E0B", description: "Create a new process." },
];

const SVG_WIDTH = 900;
const SVG_HEIGHT = 500;
const CENTER_X = SVG_WIDTH / 2;
const positions = {
  userApp: [CENTER_X, 50],
  api: [CENTER_X, 150],
  syscall: [CENTER_X, 250],
  kernel: [CENTER_X, 350],
};

export default function SystemCallScene() {
  const [activeCalls, setActiveCalls] = useState([]);

  // Animate active system call requests down stack
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCalls((prev) =>
        prev
          .map((call) => {
            let newProgress = call.progress + 0.02;
            let newStage = call.stage;
            let newTooltip = call.tooltip;

            switch (call.stage) {
              case "request":
                if (newProgress >= 1) {
                  newStage = "syscall";
                  newProgress = 0;
                  newTooltip = `API Library forwards ${syscalls[call.index].name} request to System Call.`;
                }
                break;
              case "syscall":
                if (newProgress >= 1) {
                  newStage = "kernel";
                  newProgress = 0;
                  newTooltip = `Kernel handles ${syscalls[call.index].name}.`;
                }
                break;
              case "kernel":
                if (newProgress >= 1) {
                  newStage = "response";
                  newProgress = 0;
                  newTooltip = `Response sent back to User Application.`;
                }
                break;
              case "response":
                if (newProgress >= 1) {
                  return null;
                }
                break;
            }
            return { ...call, progress: newProgress, stage: newStage, tooltip: newTooltip };
          })
          .filter(Boolean)
      );
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Apply cyber grid only (static, no animation classes)
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => {
      document.body.classList.remove("bg-cyber-grid");
    };
  }, []);

  // Trigger a system call
  const triggerSystemCall = (index) => {
    const newCall = {
      id: Date.now() + Math.random(),
      index,
      stage: "request",
      progress: 0,
      tooltip: `User Application sends ${syscalls[index].name} request.`,
    };
    setActiveCalls((prev) => [...prev, newCall]);
  };

  // Compute sphere Y positions based on stage
  const getY = (call) => {
    const { stage, progress } = call;
    switch (stage) {
      case "request":
        return positions.userApp[1] + 50 + progress * (positions.api[1] - positions.userApp[1]);
      case "syscall":
        return positions.api[1] + 50 + progress * (positions.syscall[1] - positions.api[1]);
      case "kernel":
        return positions.syscall[1] + 50 + progress * (positions.kernel[1] - positions.syscall[1]);
      case "response":
        return positions.kernel[1] + 50 - progress * (positions.kernel[1] - positions.userApp[1]);
      default:
        return positions.userApp[1] + 50;
    }
  };

  return (
    <div className="relative min-h-screen w-full font-sans overflow-hidden text-cyan-100">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />

      <div className="relative z-10 min-h-screen w-full">
        {/* Explanation */}
        <div className="text-center max-w-3xl mx-auto mb-8 mt-4">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2 drop-shadow-[0_1px_10px_#67C8FF]">System Calls & API Flow</h1>
          <p className="text-lg text-cyan-200 mb-1">
            A <span className="text-cyan-300 font-semibold">system call</span> is a request from
            a <span className="text-emerald-400 font-semibold">user program</span> to the OS kernel.<br />
            CPU pauses user-code, kernel executes the service, then response returns to User App.
          </p>
        </div>

        {/* Buttons */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          {syscalls.map((call, i) => (
            <button
              key={call.name}
              className={`px-4 py-2 rounded-2xl font-semibold shadow-lg border-2 transition-all duration-200
                bg-cyan-400 text-black hover:bg-cyan-300 border-cyan-200`}
              onClick={() => triggerSystemCall(i)}
            >
              {call.name}
            </button>
          ))}
        </div>

        {/* SVG Flow */}
        <div className="w-full flex justify-center">
          <svg width={SVG_WIDTH} height={SVG_HEIGHT}>
            {/* Layers/Blocks */}
            {Object.entries(positions).map(([label, [x, y]]) => (
              <g key={label}>
                <rect
                  x={x - 100}
                  y={y}
                  width={200}
                  height={50}
                  fill={
                    label === "userApp"
                      ? "#67C8FF"
                      : label === "api"
                      ? "#4B6CB7"
                      : label === "syscall"
                      ? "#F59E0B"
                      : "#10B981"
                  }
                  rx="14"
                  opacity={0.9}
                  className="drop-shadow"
                />
                <text
                  x={x}
                  y={y + 30}
                  textAnchor="middle"
                  fill={label === "userApp" ? "#17223B" : "#fff"}
                  fontWeight="bold"
                  fontSize="18"
                  style={{ letterSpacing: 1 }}
                >
                  {label === "userApp"
                    ? "User Application"
                    : label === "api"
                    ? "API Library"
                    : label === "syscall"
                    ? "System Call"
                    : "Kernel / Hardware"}
                </text>
              </g>
            ))}

            {/* Active calls */}
            {activeCalls.map((call, i) => (
              <g key={call.id}>
                {/* Flow line */}
                <line
                  x1={CENTER_X}
                  y1={positions.userApp[1] + 50}
                  x2={CENTER_X}
                  y2={positions.kernel[1]}
                  stroke={syscalls[call.index].color}
                  strokeWidth="3"
                  strokeDasharray="8"
                  strokeDashoffset={call.progress * 20}
                />
                {/* Animated moving sphere */}
                <circle
                  cx={CENTER_X}
                  cy={getY(call)}
                  r={12}
                  fill={syscalls[call.index].color}
                  className="drop-shadow-lg"
                  style={{ filter: `drop-shadow(0 0 12px ${syscalls[call.index].color}77)` }}
                />
                {/* Tooltip below diagram */}
                <text
                  x={CENTER_X}
                  y={positions.kernel[1] + 85 + 22 * i}
                  textAnchor="middle"
                  fill={syscalls[call.index].color}
                  fontWeight="bold"
                  fontSize="15"
                  style={{ filter: `drop-shadow(0 0 6px ${syscalls[call.index].color}22)` }}
                >
                  {call.tooltip}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
