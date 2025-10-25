import React, { useState, useEffect, useRef } from "react";

const stages = [
  { name: "POST", duration: 2000, desc: "Power-On Self-Test checks hardware." },
  { name: "Bootloader", duration: 2000, desc: "Bootloader loads the OS kernel." },
  { name: "Kernel Init", duration: 2500, desc: "Kernel initializes devices and memory." },
  { name: "System Services", duration: 2000, desc: "OS starts essential services." },
  { name: "Login", duration: 1500, desc: "User login screen appears." },
];

export default function BootProcessPage() {
  const [currentStage, setCurrentStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const progressRef = useRef(0);
  const trailRef = useRef([]);
  const stageWidth = 144;

  // Stage progression
  useEffect(() => {
    if (!playing) return;
    if (currentStage < stages.length) {
      const timer = setTimeout(
        () => setCurrentStage(currentStage + 1),
        stages[currentStage].duration
      );
      return () => clearTimeout(timer);
    }
  }, [currentStage, playing]);

  // Animate progress dot and trail
  useEffect(() => {
    let start = performance.now();
    const animateDot = (time) => {
      if (!playing) {
        start = time;
        requestAnimationFrame(animateDot);
        return;
      }

      const stageDuration = stages[currentStage]?.duration || 1;
      const elapsed = time - start;
      progressRef.current = Math.min(elapsed / stageDuration, 1);

      // Update trail
      trailRef.current = [
        ...trailRef.current,
        progressRef.current + currentStage
      ].slice(-20);

      if (progressRef.current >= 1) start = time;

      requestAnimationFrame(animateDot);
    };
    requestAnimationFrame(animateDot);
  }, [currentStage, playing]);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center text-white overflow-hidden bg-black">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Introduction Section */}
      <div className="relative z-10 max-w-4xl p-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-400 mb-4">
          Boot Process
        </h1>
        <p className="text-lg text-gray-200 mb-6">
          The boot process is the sequence of steps a computer takes to start up.
          During the first boot, the system performs hardware checks, loads the
          bootloader, initializes the kernel, starts essential services, and finally
          presents the login screen to the user.
        </p>
        <p className="text-gray-400 mb-8">
          Watch the step-by-step animation below. You can pause or play the process at any time.
        </p>
      </div>

      {/* Animated Boot Process */}
      <div className="relative flex gap-4 mt-4 mb-8">
        {stages.map((stage, idx) => (
          <div
            key={stage.name}
            className={`relative w-36 h-20 flex items-center justify-center rounded-lg transition-all duration-500
            ${idx === currentStage ? "bg-sky-400 shadow-lg shadow-sky-400/50 scale-110" : "bg-gray-700"}`}
          >
            <span className="text-white font-bold text-center">{stage.name}</span>
            {idx === currentStage && (
              <div className="absolute bottom-[-40px] w-40 text-center text-sm text-gray-300">
                {stage.desc}
              </div>
            )}
          </div>
        ))}

        {/* Trail Glow */}
        {trailRef.current.map((pos, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-yellow-400 rounded-full blur-xl opacity-70"
            style={{
              transform: `translateX(${pos * stageWidth}px) translateY(-20px)`,
              opacity: `${0.7 * (i / trailRef.current.length)}`,
            }}
          />
        ))}

        {/* Progress Dot */}
        <div
          className="absolute top-0 left-0 w-4 h-4 bg-yellow-400 rounded-full shadow-lg"
          style={{
            transform: `translateX(${progressRef.current * stageWidth + currentStage * stageWidth}px) translateY(-20px)`,
          }}
        />
      </div>

      {/* Play / Pause Buttons */}
      <div className="relative z-10 mb-12">
        <button
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold"
          onClick={() => setPlaying(!playing)}
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}
