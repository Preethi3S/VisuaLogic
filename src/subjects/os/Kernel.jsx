import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";

/**
 * KernelScene.jsx — Cyber-grid, Animated, and Interactive Kernel Visualizer
 * Features:
 *  - 3D View: Kernel (core) + modules, layout switches (Monolithic/Microkernel/Hybrid)
 *  - Animated cyber grid background
 *  - OrbitControls, glowing effects, spotlight, and dynamic module orbits
 *  - Tooltip overlays with full module info
 *  - Color-animated kernel core and shimmering highlight rings
 */

const components = [
  { name: "Device Drivers", color: "#4B6CB7", desc: "Interface with hardware devices." },
  { name: "File System", color: "#67C8FF", desc: "Manages file operations and storage." },
  { name: "System Calls", color: "#F59E0B", desc: "User programs' gateway to OS services." },
  { name: "Memory Management", color: "#10B981", desc: "Handles allocation, mapping, and protection of RAM." },
  { name: "Process Scheduler", color: "#F59E0B", desc: "Decides process execution order." },
];

const positions = {
  monolithic: [
    [1.7, 0, 0],
    [-1.7, 0, 0],
    [0, 1.7, 0],
    [0, -1.7, 0],
    [0, 0, 1.7],
  ],
  microkernel: [
    [5, 0, 0],
    [-5, 0, 0],
    [0, 5, 0],
    [0, -5, 0],
    [0, 0, 5],
  ],
  hybrid: [
    [2.7, 0.7, 0],
    [-2.7, -0.4, 0],
    [0.7, 2.1, 0.3],
    [-1.9, -2, 0.3],
    [0, 0.7, 2.7],
  ],
};

// Glowing highlight ring
function HaloRing({ position, color, radius = 2.1, pulse = false }) {
  return (
    <mesh position={position}>
      <torusGeometry args={[radius, 0.06, 22, 48]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={pulse ? 0.8 : 0.5}
        transparent
        opacity={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}

function AnimatedGlowKernel(props) {
  // Animated core: rotates and pulses between two colors
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      const t = Math.abs(Math.sin(clock.getElapsedTime() * 1.5));
      meshRef.current.material.emissiveIntensity = 0.4 + t * 0.7;
      meshRef.current.material.color.setHSL(0.61 + 0.10 * t, 0.72, 0.35 + 0.31 * t);
      meshRef.current.material.emissive.set("#67C8FF");
    }
  });
  return (
    <mesh ref={meshRef} {...props}>
      <sphereGeometry args={[1.55, 42, 42]} />
      <meshStandardMaterial color="#24344e" emissive="#67C8FF" emissiveIntensity={0.5} metalness={0.25} roughness={0.5} />
    </mesh>
  );
}

function AnimatedComponentSphere({ position, component, orbitIndex, arch }) {
  // Animated orbit trail for microkernel & hybrid
  const meshRef = useRef();
  const highlightRef = useRef();
  const [hovered, setHovered] = useState(false);
  useFrame(({ clock }) => {
    let pos = [...position];
    // Make components softly orbit for microkernel/hybrid
    if (arch !== "monolithic") {
      const angle = clock.getElapsedTime() * 0.4 + orbitIndex * 1.1;
      const r = (arch === "microkernel" ? 5.0 : 2.9);
      const h = (arch === "microkernel" ? 0 : 0.18 * Math.sin(orbitIndex + clock.getElapsedTime() * 0.6));
      pos[0] = Math.cos(angle) * r;
      pos[2] = Math.sin(angle) * r;
      pos[1] = h + (arch === "microkernel" ? (orbitIndex - 2) * 1.1 : 0);
      if (meshRef.current) meshRef.current.position.set(pos[0], pos[1], pos[2]);
      if (highlightRef.current) highlightRef.current.visible = hovered;
    }
  });
  return (
    <>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.22 : 1}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[0.53, 36, 32]} />
        <meshStandardMaterial color={component.color} emissive={component.color} emissiveIntensity={hovered ? 0.45 : 0.19} metalness={0.9} roughness={0.41} />
        {hovered && (
          <Html distanceFactor={12} center>
            <div className="bg-white/90 border border-indigo-200 px-3 py-2 rounded-2xl shadow-lg text-gray-800 transition-all text-sm w-52">
              <h1 className="font-bold pb-1">{component.name}</h1>
              <p>{component.desc}</p>
            </div>
          </Html>
        )}
      </mesh>
      {/* Subtle halo on hover */}
      <mesh ref={highlightRef} position={position} visible={false}>
        <sphereGeometry args={[0.63, 24, 24]} />
        <meshStandardMaterial color={component.color} emissive={component.color} emissiveIntensity={0.45} opacity={0.18} transparent />
      </mesh>
    </>
  );
}

// Orbiting labels for architecture type
function ArchLabel3D({ label, color = "#67C8FF" }) {
  return (
    <Html position={[0, 4.8, 0]} center>
      <span
        style={{
          background: "rgba(21,26,43,0.93)",
          borderRadius: "1rem",
          fontWeight: 600,
          padding: "0.36rem 1.2rem",
          color,
          letterSpacing: "0.04em",
          boxShadow: "0 1px 6px 0 #67C8FFA3, 0 0px 14px 0 #212C40",
          border: "1px solid #334f7e5c",
        }}
      >
        {label}
      </span>
    </Html>
  );
}

export default function KernelScene() {
  const [arch, setArch] = useState("monolithic");
  const kernelRef = useRef();

  // Cyber-grid background overlay absolute
  return (
    <div className="relative min-h-screen w-full font-sans overflow-hidden">
      {/* Cyber Grid Animated Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* 3D Canvas */}
      <div className="relative z-10 h-[80vh] w-full mx-auto">
        {/* Top Right Arch Choice UI */}
        <div className="absolute top-4 right-10 z-20 flex gap-4">
          <button
            className={`px-5 py-2 rounded-2xl font-bold text-white shadow-lg border-2 ${arch === "monolithic" ? "bg-indigo-600 border-indigo-400" : "bg-indigo-900/70 border-indigo-500/30 hover:bg-indigo-600/50"}`}
            onClick={() => setArch("monolithic")}
          >
            Monolithic
          </button>
          <button
            className={`px-5 py-2 rounded-2xl font-bold text-white shadow-lg border-2 ${arch === "microkernel" ? "bg-sky-500 border-sky-300" : "bg-sky-900/70 border-sky-500/20 hover:bg-sky-500/50"}`}
            onClick={() => setArch("microkernel")}
          >
            Microkernel
          </button>
          <button
            className={`px-5 py-2 rounded-2xl font-bold text-white shadow-lg border-2 ${arch === "hybrid" ? "bg-emerald-500 border-emerald-300" : "bg-emerald-900/80 border-emerald-500/20 hover:bg-emerald-600/70"}`}
            onClick={() => setArch("hybrid")}
          >
            Hybrid
          </button>
        </div>

        {/* Label at top-center */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-cyan-200 text-2xl font-bold drop-shadow-[0_1px_8px_#67C8FF] bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyan-500/20">
          OS Kernel Architecture Visualizer
        </div>

        {/* 3D Scene */}
        <Canvas camera={{ position: [10, 10, 15], fov: 60 }} shadows>
          {/* Lighting */}
          <ambientLight intensity={0.55} />
          <pointLight position={[10, 18, 7]} intensity={0.7} color="#67C8FF" />
          <spotLight position={[-15, 20, 10]} angle={0.24} penumbra={0.7} intensity={1} color="#EDF6FF" castShadow />
          {/* Kernel Core */}
          <group ref={kernelRef}>
            <AnimatedGlowKernel />
            {/* Add a shimmering ring for the core */}
            <HaloRing position={[0, 0, 0]} color="#67C8FF" radius={2.1} pulse={arch !== "monolithic"} />
            {/* Label */}
            <ArchLabel3D label={arch.charAt(0).toUpperCase() + arch.slice(1)} color="#FDE68A" />
          </group>
          {/* Orbiting Modules/Components */}
          {components.map((comp, i) => (
            <AnimatedComponentSphere
              key={comp.name}
              position={positions[arch][i]}
              component={comp}
              orbitIndex={i}
              arch={arch}
            />
          ))}
          <OrbitControls enablePan={false} minDistance={6} maxDistance={38} />
        </Canvas>
      </div>
      {/* Blurb / Legend */}
      <div className="relative z-20 max-w-2xl mx-auto mt-8 p-4 rounded-2xl bg-black/60 border border-cyan-400/15 text-cyan-100 text-md shadow-xl text-center backdrop-blur">
        <b>How to use:</b> Select an OS kernel architecture above to see the arrangement of core modules:
        <span className="ml-2 text-cyan-300">Monolithic</span> (<span className="text-white">tight & fast</span>),
        <span className="ml-2 text-sky-400">Microkernel</span> (
        <span className="text-white">modular, passive core, separate servers</span>),
        <span className="ml-2 text-emerald-300">Hybrid</span> (
        <span className="text-white">flexible & adaptive</span>).
        <br />
        <span className="text-amber-300">Hover modules</span> to see their function. Core and module layout animates for each OS kernel style.
      </div>
    </div>
  );
}
