import React, { useState, useEffect } from "react";

const modules = [
  { name: "Authentication", color: "#4B6CB7", info: "Passwords, Biometrics, MFA" },
  { name: "Access Control", color: "#67C8FF", info: "Read/Write/Execute Permissions" },
  { name: "Policies", color: "#F59E0B", info: "Process Isolation, File Protection" },
  { name: "Encryption", color: "#10B981", info: "Data Encryption & Secure Storage" },
];

export default function Security2DScene() {
  const [hoveredModule, setHoveredModule] = useState(null);
  const [angleOffset, setAngleOffset] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const radius = 150;

  // Modules rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAngleOffset(prev => prev + 0.01);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Randomly trigger alerts for modules
  useEffect(() => {
    const interval = setInterval(() => {
      const randomModule = modules[Math.floor(Math.random() * modules.length)];
      const ts = Date.now();
      setAlerts(prev => [...prev, { module: randomModule.name, id: ts }]);
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== ts));
      }, 2000);
    }, 4000);
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

  return (
    <div className="relative min-h-screen w-full font-sans text-cyan-100 overflow-hidden">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />

      <div className="relative z-10 flex flex-col min-h-screen items-center justify-start">
        <h1 className="text-3xl font-bold text-cyan-300 mb-8 mt-10 drop-shadow-[0_1px_10px_#67C8FF]">
          Security &amp; Protection
        </h1>

        <div className="relative w-96 h-96 flex items-center justify-center mx-auto">
          {/* Central Kernel */}
          <div className="w-24 h-24 rounded-full bg-black/60 flex items-center justify-center text-cyan-200 font-bold text-lg shadow-xl border-2 border-cyan-400/30">
            Kernel
          </div>
          {/* Modules in circular layout */}
          {modules.map((mod, i) => {
            const angle = (i / modules.length) * Math.PI * 2 + angleOffset;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const isAlert = alerts.some(a => a.module === mod.name);
            return (
              <div
                key={mod.name}
                className={`
                  absolute w-30 h-14 rounded-2xl flex items-center justify-center cursor-pointer
                  transition-all duration-300 text-base font-bold border-2
                  ${hoveredModule === mod.name ? "bg-cyan-400/80 text-black border-cyan-300 scale-105 shadow-lg shadow-cyan-400/30" : "bg-cyan-900/70 text-cyan-100 border-cyan-800"}
                  ${isAlert ? "bg-rose-500 border-rose-300 text-white scale-125 shadow-2xl shadow-rose-500/40" : ""}
                `}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  width: 120,
                  height: 56,
                  zIndex: isAlert ? 2 : 1,
                }}
                onMouseEnter={() => setHoveredModule(mod.name)}
                onMouseLeave={() => setHoveredModule(null)}
              >
                {mod.name}
              </div>
            );
          })}
        </div>

        {/* Hovered Module Info */}
        {hoveredModule && (
          <div className="absolute bottom-20 w-96 p-4 bg-black/80 border border-cyan-400/25 rounded-2xl shadow-2xl text-center text-cyan-100 font-semibold z-20">
            {modules.find((m) => m.name === hoveredModule)?.info}
          </div>
        )}

        {/* Alerts Panel */}
        <div className="absolute top-8 right-10 w-72 bg-black/70 border border-cyan-400/20 p-4 rounded-2xl shadow-xl text-cyan-100 z-20">
          <h2 className="font-bold text-lg mb-2 text-cyan-200">Active Security Alerts</h2>
          {alerts.length === 0 ? (
            <div className="text-sm text-cyan-400">No active alerts</div>
          ) : (
            <ul className="space-y-1">
              {alerts.map(a => (
                <li key={a.id} className="text-sm text-yellow-400 font-semibold">
                  <span className="mr-1">⚡</span>
                  {a.module} triggered!
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
