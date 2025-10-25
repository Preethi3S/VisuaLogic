import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const layers = [
  {
    id: 7,
    name: "Application",
    descClient: "User interacts with the application (e.g., Web browser, Email). Data is created for communication.",
    descServer: "Server application receives the intended data for the end user after processing lower layers.",
    color: "#4B6CB7",
    icon: "🌐"
  },
  {
    id: 6,
    name: "Presentation",
    descClient: "Data is translated between user format and network format (encryption/decryption, compression, encoding).",
    descServer: "Data is decoded and translated into a format understandable for the server application.",
    color: "#67C8FF",
    icon: "🔒"
  },
  {
    id: 5,
    name: "Session",
    descClient: "Establishes, manages, and terminates sessions between devices (manages dialogs, synchronization).",
    descServer: "Session details allow data to be properly routed to the correct application/session on the server.",
    color: "#10B981",
    icon: "🗨️"
  },
  {
    id: 4,
    name: "Transport",
    descClient: "Divides data into segments, ensures reliable, ordered delivery (TCP/UDP), adds source/destination ports.",
    descServer: "Segments are received, reassembled, errors checked, then handed off to the matched session.",
    color: "#F59E0B",
    icon: "🚚"
  },
  {
    id: 3,
    name: "Network",
    descClient: "Attaches logical addressing (IP), routes packets across the network, picks the next destination.",
    descServer: "Receives packets, uses IPs to determine destination, routes toward the final receiver device.",
    color: "#EF4444",
    icon: "🗺️"
  },
  {
    id: 2,
    name: "Data Link",
    descClient: "Frames packets for local network, adds MAC address, performs error detection, prepares for physical transfer.",
    descServer: "Receives frames, checks MAC and error bits, reassembles into packets for the network layer.",
    color: "#9333EA",
    icon: "🔗"
  },
  {
    id: 1,
    name: "Physical",
    descClient: "Data is converted into electrical/optical signals for transmission over the medium (cables, radio, etc).",
    descServer: "Signals are received and converted back to binary data, then passed up to data link layer.",
    color: "#64748B",
    icon: "⚡"
  }
];

export default function OSIModelVisualizer() {
  const [active, setActive] = useState(7);
  const [hovered, setHovered] = useState(null);
  const [direction, setDirection] = useState("down"); // 'down' = sender→network, 'up' = receiver←network

  // Cyber grid background
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => document.body.classList.remove("bg-cyber-grid");
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => {
        if (direction === "down") {
          if (prev > 1) return prev - 1;
          setDirection("up"); // reached bottom, now move up stack at receiver
          return 1;
        } else {
          if (prev < 7) return prev + 1;
          setDirection("down"); // reached top, restart
          return 7;
        }
      });
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [direction]);

  // Returns detailed info for popup panel
  function getDetails(id) {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return {};
    const isSender = direction === "down";
    return {
      icon: layer.icon,
      name: layer.name,
      desc: isSender ? layer.descClient : layer.descServer,
      color: layer.color,
      role: isSender
        ? "Data moving DOWN stack: User → Network"
        : "Data moving UP stack: Network → User"
    };
  }

  const show = hovered || active;
  const info = getDetails(show);

  return (
    <div className="relative min-h-screen w-full font-sans select-none">
      {/* Cyber grid */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />

      <div className="relative z-10 flex flex-col items-center justify-center py-18" style={{ minHeight: "95vh" }}>
        <h2 className="text-3xl md:text-4xl font-bold mb-10 mt-7 text-cyan-200 tracking-wide drop-shadow-[0_1px_10px_#4B6CB7]">OSI Model Visualizer</h2>
        <div className="flex flex-col md:flex-row items-start justify-center gap-12 px-3">
          {/* Sender */}
          <OSIStack
            layers={layers}
            side="left"
            active={active}
            setHovered={setHovered}
            direction={direction}
          />
          {/* Pulsing data orb and animated arrow for direction */}
          <motion.div className="relative flex flex-col items-center justify-center" initial={false}>
            <motion.div
              className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-3xl font-bold border-4 mb-2"
              style={{
                background: "linear-gradient(135deg, #4B6CB7 60%, #67C8FF 100%)",
                color: "#fff",
                borderColor: "#67C8FF",
                boxShadow: "0 0 40px #67C8FF55"
              }}
              animate={{ scale: [1, 1.16, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ repeat: Infinity, duration: 1.3, repeatType: "loop", ease: "easeInOut" }}
            >
              🧬
            </motion.div>
            {/* Data transfer arrow */}
            <motion.svg width={82} height={80} viewBox="0 0 82 80" fill="none">
              {direction === "down" ? (
                <>
                  <motion.path
                    d="M41 8 Q67 40 41 72"
                    stroke="#10B981"
                    strokeWidth={5}
                    strokeDasharray="6"
                    style={{ filter: "drop-shadow(0 0 8px #10B98199)" }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                  />
                  <motion.polygon
                    points="38,67 41,77 44,67"
                    fill="#10B981"
                    animate={{ opacity: [1, 0.66, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                  />
                </>
              ) : (
                <>
                  <motion.path
                    d="M41 72 Q15 40 41 8"
                    stroke="#F59E0B"
                    strokeWidth={5}
                    strokeDasharray="6"
                    style={{ filter: "drop-shadow(0 0 8px #F59E0BB7)" }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                  />
                  <motion.polygon
                    points="38,15 41,5 44,15"
                    fill="#F59E0B"
                    animate={{ opacity: [1, 0.66, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                  />
                </>
              )}
            </motion.svg>
            <div className="mt-2 font-mono text-cyan-200 text-xs text-center">
              {direction === "down"
                ? "Sending: User → Server"
                : "Receiving: Server → User"}
            </div>
          </motion.div>
          {/* Receiver */}
          <OSIStack
            layers={layers}
            side="right"
            active={active}
            setHovered={setHovered}
            direction={direction}
          />
        </div>
        {/* Layer explain panel */}
        <AnimatePresence>
          {show && (
            <motion.div
              key={`${show}-${direction}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              className="mt-10 px-7 py-6 bg-black/90 border border-cyan-400/30 text-cyan-100 rounded-2xl shadow-xl max-w-2xl text-center font-medium"
            >
              <div className="text-3xl inline-block align-middle mr-2" style={{ color: info.color }}>
                {info.icon}
              </div>
              <span className="text-2xl font-bold mb-1 align-middle" style={{ color: info.color }}>{info.name}</span>
              <div className="text-base mt-2 text-cyan-100">{info.desc}</div>
              <div className="mt-3 text-cyan-400/80 text-xs">{info.role}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// OSI layer glassy vertical stack
function OSIStack({ side, layers, active, setHovered, direction }) {
  return (
    <div
      className={`flex flex-col gap-3 select-none`}
      style={{
        alignItems: side === "left" ? "flex-end" : "flex-start",
        minWidth: 170
      }}
    >
      {layers.slice().reverse().map(layer => (
        <motion.div
          key={layer.id}
          className="relative w-44 h-14 rounded-xl shadow-xl border cursor-pointer"
          style={{
            background: `linear-gradient(96deg, ${layer.color} 70%, #191970bb 100%)`,
            borderColor: layer.color,
            color: "#fff",
            boxShadow: active === layer.id ? `0 0 18px ${layer.color}50` : "none",
            opacity: active === layer.id ? 1 : 0.62,
            scale: active === layer.id ? 1.11 : 1,
            outline: active === layer.id ? `2px solid ${layer.color}` : "",
            filter: active === layer.id ? "drop-shadow(0 0 14px #67C8FF77)" : ""
          }}
          whileHover={{ scale: 1.15, opacity: 1 }}
          onMouseEnter={() => setHovered(layer.id)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className={`absolute left-2 top-1.5 text-xl`}>{layer.icon}</div>
          <div className="pl-10 pr-3 py-1 text-left font-bold text-base">{layer.name}</div>
          {/* Direction chevron */}
          {active === layer.id && (
            <motion.div
              className={`absolute right-3 top-4`}
              initial={false}
              animate={{ opacity: 1, scale: [1, 1.21, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              {direction === "down"
                ? <span style={{ color: "#10B981", fontSize: 22 }}>▼</span>
                : <span style={{ color: "#F59E0B", fontSize: 22 }}>▲</span>}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
