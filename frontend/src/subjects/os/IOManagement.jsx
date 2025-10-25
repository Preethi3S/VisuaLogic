import React, { useState, useEffect, useRef } from "react";
import { Usb } from "lucide-react";

const COLORS = {
  cpu: "#8B5CF6",
  device: "#5B8DEF",
  mem: "#22C55E",
  dma: "#E879F9",
  irq: "#F43F5E",
  request: "#67C8FF",
  bg: "#0F172A",
  text: "#CBD5E0",
  warning: "#F59E0B",
  highlight: "#FFD700",
  pathHighlight: "#F59E0B",
};

// Quadratic Bezier interpolation
function bezier(t, p0, p1, p2) {
  const u = 1 - t;
  const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
  const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
  return { x, y };
}
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function IOMgmtScene() {
  const [mode, setMode] = useState("Interrupts");
  const [running, setRunning] = useState(true);
  const [deviceSpeed, setDeviceSpeed] = useState(1.0);
  const [arrivalRate, setArrivalRate] = useState(0.8);
  const [queueLimit, setQueueLimit] = useState(6);
  const [requests, setRequests] = useState([]);
  const [queue, setQueue] = useState([]);
  const [completed, setCompleted] = useState(0);
  const [dropped, setDropped] = useState(0);
  const [highlight, setHighlight] = useState({
    cpu: false,
    device: false,
    mem: false,
    dma: false,
    cpuToDevice: false,
    deviceToMem: false,
    irq: false,
  });
  const [explanation, setExplanation] = useState(
    "Welcome! This simulation visualizes how your computer handles data requests. Observe the flow from CPU to Device and Memory."
  );

  const accumulator = useRef(0);
  const lastTime = useRef(Date.now());

  const positions = {
    cpu: { x: 100, y: 150 },
    device: { x: 300, y: 150 },
    mem: { x: 500, y: 150 },
    dma: { x: 300, y: 300 },
  };

  // Cyber grid background (tailwind covers bg, so don't add body style)

  useEffect(() => {
    document.body.style.background = COLORS.bg;
    document.body.style.fontFamily = "Inter, sans-serif";
    return () => {
      document.body.style.background = "";
      document.body.style.fontFamily = "";
    };
  }, []);

  useEffect(() => {
    switch (mode) {
      case "Polling":
        setExplanation(
          "In **Polling** mode, the CPU constantly checks if the Device is ready for data, like **repeatedly checking your front door for a delivery**. This keeps the CPU busy and less efficient for other tasks. Look for the CPU highlighting!"
        );
        break;
      case "Interrupts":
        setExplanation(
          "In **Interrupts** mode, the Device signals the CPU when it's done or needs attention, like the **delivery person ringing your doorbell**. This frees the CPU to do other work, only responding when interrupted. Watch for data moving to Memory."
        );
        break;
      case "DMA":
        setExplanation(
          "In **DMA** (Direct Memory Access) mode, the DMA Controller handles data transfers between the Device and Memory directly, without CPU involvement. Think of it like the **delivery person handing the package directly to your neighbor** who then puts it inside for you. This is the most efficient method for large data transfers."
        );
        break;
      default:
        setExplanation("Select a mode to understand how I/O operations are managed.");
    }
  }, [mode]);

  useEffect(() => {
    let anim;
    function loop() {
      const now = Date.now();
      const delta = (now - lastTime.current) / 1000;
      lastTime.current = now;

      if (running) {
        accumulator.current += delta * arrivalRate;
        while (accumulator.current >= 1) {
          accumulator.current -= 1;
          const id = Math.random().toString(36).slice(2, 6);
          setRequests((prev) => [
            ...prev,
            {
              id,
              progress: 0,
              phase: "toDevice",
              tooltip: `I/O Request ${id}`,
            },
          ]);
          setExplanation(`CPU initiates **I/O Request** #${id}. Request moving to Device.`);
          setHighlight((h) => ({ ...h, cpu: true, cpuToDevice: true }));
        }

        setRequests((prev) => {
          const next = [];
          const currentHighlights = {
            cpu: false,
            device: false,
            mem: false,
            dma: false,
            cpuToDevice: false,
            deviceToMem: false,
            irq: false,
          };
          prev.forEach((r) => {
            r.progress = Math.min(1, r.progress + delta * 0.8);
            if (r.phase === "toDevice") {
              currentHighlights.cpuToDevice = true;
              if (r.progress >= 1) {
                if (queue.length < queueLimit) {
                  setQueue((q) => [...q, { id: r.id, service: 0 }]);
                  setExplanation(
                    `I/O Request #${r.id} arrived at the **Device** and joined the queue.`
                  );
                  currentHighlights.device = true;
                } else {
                  setDropped((d) => d + 1);
                  setExplanation(
                    `I/O Request #${r.id} was **DROPPED**! Device queue full. ⚠️ This is like your delivery being returned because your porch was too full!`
                  );
                  currentHighlights.device = true;
                }
              } else {
                next.push(r);
              }
            } else if (r.phase === "toMemory" || r.phase === "dmaToMemory") {
              currentHighlights.deviceToMem = true;
              if (r.progress >= 1) {
                setCompleted((c) => c + 1);
                setExplanation(
                  `Data for request #${r.id.replace(
                    "-back",
                    ""
                  )} reached **Memory**. Operation completed.`
                );
                currentHighlights.mem = true;
              } else {
                next.push(r);
              }
            } else {
              next.push(r);
            }
          });
          setHighlight(currentHighlights);
          return next;
        });

        if (queue.length > 0) {
          setQueue((q) => {
            const nq = [...q];
            nq[0].service += delta * deviceSpeed;
            setHighlight((h) => ({ ...h, device: true }));
            if (nq[0].service >= 1) {
              const id = nq[0].id;
              let newPhase = "toMemory";
              let tooltip = "Data moving to Memory after Device processing";
              let explanationText = `**Device** completed processing I/O Request #${id}, now sending **Data Transfer** to Memory.`;

              if (mode === "Polling") {
                explanationText = `In **Polling** mode, the CPU would be busy checking the Device's status (like **still checking the door**). Data for Request #${id} is now transferring to Memory.`;
                setHighlight((h) => ({
                  ...h,
                  cpu: true,
                  device: true,
                  deviceToMem: true,
                }));
              } else if (mode === "Interrupts") {
                explanationText = `In **Interrupts** mode, the Device sends an interrupt (the **doorbell rings!**) to the CPU. Data for Request #${id} is now transferring to Memory.`;
                setHighlight((h) => ({
                  ...h,
                  irq: true,
                  device: true,
                  deviceToMem: true,
                }));
              } else if (mode === "DMA") {
                newPhase = "dmaToMemory";
                tooltip = "DMA Controller handles data transfer directly to Memory";
                explanationText = `In **DMA** mode, the DMA Controller directly transfers data for Request #${id} from Device to Memory, **freeing the CPU for other tasks** (your neighbor handles the package!).`;
                setHighlight((h) => ({
                  ...h,
                  dma: true,
                  device: true,
                  deviceToMem: true,
                }));
              }

              setRequests((prev) => [
                ...prev,
                { id: id + "-back", progress: 0, phase: newPhase, tooltip: tooltip },
              ]);
              setExplanation(explanationText);
              nq.shift();
            } else {
              setExplanation(
                `**Device** is currently servicing I/O Request #${nq[0].id}.`
              );
            }
            return nq;
          });
        } else {
          setHighlight((h) => ({ ...h, device: false, irq: false }));
          setExplanation("Device queue is empty. Ready for new requests!");
        }
      }
      anim = requestAnimationFrame(loop);
    }
    anim = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(anim);
  }, [running, mode, deviceSpeed, arrivalRate, queue, queueLimit]);

  function resetSim() {
    accumulator.current = 0;
    setRequests([]);
    setQueue([]);
    setCompleted(0);
    setDropped(0);
    setHighlight({
      cpu: false,
      device: false,
      mem: false,
      dma: false,
      cpuToDevice: false,
      deviceToMem: false,
      irq: false,
    });
    setExplanation(
      "Simulation reset. Observe the flow of I/O requests for different management modes!"
    );
  }

  function getPosition(r) {
    const t = easeInOutQuad(r.progress);
    let p0, p1, p2;
    if (r.phase === "toDevice") {
      p0 = positions.cpu;
      p2 = positions.device;
      p1 = { x: (p0.x + p2.x) / 2, y: p0.y - 50 };
    } else if (r.phase === "toMemory") {
      p0 = positions.device;
      p2 = positions.mem;
      p1 = { x: (p0.x + p2.x) / 2, y: p0.y - 50 };
    } else if (r.phase === "dmaToMemory") {
      p0 = positions.device;
      p2 = positions.mem;
      p1 = { x: positions.dma.x, y: positions.dma.y };
    } else {
      return { x: 0, y: 0 };
    }
    return bezier(t, p0, p1, p2);
  }

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />
      {/* Title Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/10 backdrop-blur rounded-2xl px-4 py-2 flex items-center gap-2 shadow-lg">
        <Usb size={18} className="text-white" />
        <span className="font-medium text-white">
          VisuaLogic • I/O Management Simulation
        </span>
      </div>
      {/* Main SVG Container */}
      <div className="relative z-10 flex flex-col items-center p-4">
        <svg width="700" height="450" viewBox="0 0 700 450">
          {/* Arrow definitions */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="6"
              refX="3"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 6 3, 0 6" fill="white" />
            </marker>
            <marker
              id="arrowhead-highlight"
              markerWidth="6"
              markerHeight="6"
              refX="3"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 6 3, 0 6" fill={COLORS.pathHighlight} />
            </marker>
          </defs>
          {/* CPU */}
          <rect
            x={positions.cpu.x}
            y={positions.cpu.y}
            width={80}
            height={50}
            rx={8}
            fill={highlight.cpu ? COLORS.highlight : COLORS.cpu}
            className="transition-all duration-200 ease-in-out shadow-md"
          />
          <text
            x={positions.cpu.x + 40}
            y={positions.cpu.y + 30}
            fill="white"
            fontSize={12}
            textAnchor="middle"
            className="font-bold"
          >
            CPU
          </text>
          {/* Device */}
          <rect
            x={positions.device.x}
            y={positions.device.y}
            width={80}
            height={50}
            rx={8}
            fill={highlight.device ? COLORS.highlight : COLORS.device}
            className="transition-all duration-200 ease-in-out shadow-md"
          />
          <text
            x={positions.device.x + 40}
            y={positions.device.y + 20}
            fill="white"
            fontSize={12}
            textAnchor="middle"
            className="font-bold"
          >
            Device
          </text>
          <text
            x={positions.device.x + 40}
            y={positions.device.y + 40}
            fill="white"
            fontSize={10}
            textAnchor="middle"
          >
            I/O Controller
          </text>
          {/* Memory */}
          <rect
            x={positions.mem.x}
            y={positions.mem.y}
            width={80}
            height={50}
            rx={8}
            fill={highlight.mem ? COLORS.highlight : COLORS.mem}
            className="transition-all duration-200 ease-in-out shadow-md"
          />
          <text
            x={positions.mem.x + 40}
            y={positions.mem.y + 30}
            fill="white"
            fontSize={12}
            textAnchor="middle"
            className="font-bold"
          >
            Memory
          </text>
          {/* DMA (only in DMA mode) */}
          {(mode === "DMA" || highlight.dma) && (
            <>
              <rect
                x={positions.dma.x}
                y={positions.dma.y}
                width={80}
                height={50}
                rx={8}
                fill={highlight.dma ? COLORS.highlight : COLORS.dma}
                className="transition-all duration-200 ease-in-out shadow-md"
              />
              <text
                x={positions.dma.x + 40}
                y={positions.dma.y + 30}
                fill="white"
                fontSize={12}
                textAnchor="middle"
                className="font-bold"
              >
                DMA
              </text>
            </>
          )}
          {/* CPU to Device path */}
          <path
            d={`M${positions.cpu.x + 80},${positions.cpu.y + 25} Q${(positions.cpu.x + positions.device.x) / 2},${positions.cpu.y - 50} ${positions.device.x},${positions.device.y + 25}`}
            stroke={highlight.cpuToDevice ? COLORS.pathHighlight : COLORS.request}
            strokeWidth={2}
            fill="none"
            markerEnd={
              highlight.cpuToDevice
                ? "url(#arrowhead-highlight)"
                : "url(#arrowhead)"
            }
            className="transition-all duration-200 ease-in-out"
          />
          <text
            x={(positions.cpu.x + positions.device.x) / 2}
            y={positions.cpu.y - 30}
            fill={COLORS.text}
            fontSize={10}
            textAnchor="middle"
            className="font-semibold"
          >
            I/O Request
          </text>
          {/* Device to Mem path */}
          <path
            d={`M${positions.device.x + 80},${positions.device.y + 25} Q${(positions.device.x + positions.mem.x) / 2},${positions.device.y - 50} ${positions.mem.x},${positions.mem.y + 25}`}
            stroke={highlight.deviceToMem ? COLORS.pathHighlight : COLORS.mem}
            strokeWidth={2}
            fill="none"
            markerEnd={
              highlight.deviceToMem
                ? "url(#arrowhead-highlight)"
                : "url(#arrowhead)"
            }
            className="transition-all duration-200 ease-in-out"
          />
          <text
            x={(positions.device.x + positions.mem.x) / 2}
            y={positions.device.y - 30}
            fill={COLORS.text}
            fontSize={10}
            textAnchor="middle"
            className="font-semibold"
          >
            Data Transfer
          </text>
          {/* Device Queue */}
          <text
            x={positions.device.x + 40}
            y={positions.device.y - 30 - (queueLimit * 15) / 2}
            fill={COLORS.text}
            fontSize={10}
            textAnchor="middle"
            className="font-semibold"
          >
            Device Queue
          </text>
          {queue.map((q, i) => (
            <circle
              key={q.id}
              cx={positions.device.x + 40}
              cy={positions.device.y - 10 - i * 15}
              r={6}
              fill={COLORS.request}
              className="shadow-sm"
            />
          ))}
          {/* Moving requests */}
          {requests.map((r) => {
            const pos = getPosition(r);
            return (
              <circle
                key={r.id}
                cx={pos.x}
                cy={pos.y}
                r={8}
                fill={COLORS.request}
                className="shadow-md"
              >
                <title>{r.tooltip}</title>
              </circle>
            );
          })}
          {/* IRQ line (Interrupts mode) */}
          {mode === "Interrupts" && (
            <path
              d={`M${positions.device.x + 40},${positions.device.y + 50} L${positions.cpu.x + 40},${positions.cpu.y + 50}`}
              stroke={highlight.irq ? COLORS.irq : COLORS.text}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              fill="none"
            >
              <title>Interrupt Request Line</title>
            </path>
          )}
          {mode === "Interrupts" && (
            <text
              x={(positions.device.x + positions.cpu.x) / 2}
              y={positions.device.y + 65}
              fill={COLORS.text}
              fontSize={9}
              textAnchor="middle"
              className="font-semibold"
            >
              Interrupt Signal
            </text>
          )}
        </svg>
        {/* Control Panel */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl px-5 py-4 rounded-2xl border border-white/15 flex flex-col gap-3 text-white shadow-xl w-[90%] max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
              {["Polling", "Interrupts", "DMA"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-1.5 rounded-xl font-semibold transition-all duration-200
                  ${mode === m ? "bg-white/20 text-white shadow-inner" : "text-white/70 hover:bg-white/10"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRunning((r) => !r)}
                className="px-4 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition-all duration-200 font-semibold shadow-md"
              >
                {running ? "Pause Simulation" : "Play Simulation"}
              </button>
              <button
                onClick={resetSim}
                className="px-4 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition-all duration-200 font-semibold shadow-md"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="text-sm opacity-90 text-center bg-white/5 rounded-lg p-3 border border-white/10 font-mono">
            {explanation}
          </div>
          <div className="flex flex-col md:flex-row justify-around items-center gap-4 mt-2">
            {/* Device Speed Slider */}
            <div className="flex flex-col items-center w-full md:w-1/3">
              <label htmlFor="deviceSpeed" className="text-sm font-semibold mb-1">
                Device Speed: {deviceSpeed.toFixed(1)}x
              </label>
              <input
                id="deviceSpeed"
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={deviceSpeed}
                onChange={(e) => setDeviceSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer range-lg accent-blue-400"
              />
            </div>
            {/* Arrival Rate Slider */}
            <div className="flex flex-col items-center w-full md:w-1/3">
              <label htmlFor="arrivalRate" className="text-sm font-semibold mb-1">
                Arrival Rate: {arrivalRate.toFixed(1)}/s
              </label>
              <input
                id="arrivalRate"
                type="range"
                min="0.1"
                max="1.5"
                step="0.1"
                value={arrivalRate}
                onChange={(e) => setArrivalRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer range-lg accent-purple-400"
              />
            </div>
            {/* Queue Limit Slider */}
            <div className="flex flex-col items-center w-full md:w-1/3">
              <label htmlFor="queueLimit" className="text-sm font-semibold mb-1">
                Queue Limit: {queueLimit}
              </label>
              <input
                id="queueLimit"
                type="range"
                min="1"
                max="10"
                step="1"
                value={queueLimit}
                onChange={(e) => setQueueLimit(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer range-lg accent-green-400"
              />
            </div>
          </div>
          <div className="flex justify-around text-xs mt-2 opacity-80">
            <span>
              Requests Completed: <span className="font-bold">{completed}</span>
            </span>
            <span className={dropped > 0 ? "text-red-300 font-bold" : ""}>
              Requests Dropped: <span className="font-bold">{dropped}</span>
            </span>
            <span>
              Queue Size: <span className="font-bold">{queue.length}/{queueLimit}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
