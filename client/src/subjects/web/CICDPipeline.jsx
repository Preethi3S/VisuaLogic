// src/scenes/DeploymentWorkflow.jsx
// VisuaLogic: CI/CD Pipeline & Deployment Workflow visualization with gates
// React + @react-three/fiber + drei + Tailwind UI overlays

import React, { useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

const stages = [
  {
    name: "Developer",
    desc: "Writes code locally and pushes to Git repository.",
    color: "#4B6CB7",
  },
  {
    name: "Version Control",
    desc: "Code is stored in GitHub/GitLab/Bitbucket.",
    color: "#67C8FF",
  },
  {
    name: "CI System",
    desc: "Build, linting, unit tests run in CI (Jenkins, GitHub Actions).",
    color: "#10B981",
  },
  {
    name: "Artifact Repository",
    desc: "Build artifacts stored (Docker Hub, Nexus, AWS ECR).",
    color: "#F59E0B",
  },
  {
    name: "Staging",
    desc: "Deployment to staging environment for integration testing.",
    color: "#8B5CF6",
  },
  {
    name: "Production",
    desc: "Final deployment to production environment.",
    color: "#EF4444",
  },
];

function StageBox({ stage, position, isActive }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[2, 1, 1]} />
      <meshStandardMaterial
        color={isActive ? stage.color : "#151a27"}
        emissive={isActive ? stage.color : "#21293c"}
        emissiveIntensity={isActive ? 0.7 : 0.2}
      />
      <Html distanceFactor={10}>
        <div
          className={`p-2 rounded-xl shadow-md w-40 border-2 ${
            isActive
              ? "bg-white bg-opacity-90 border-cyan-400 drop-shadow-[0_0_10px_#67C8FFbb]"
              : "bg-gray-900 bg-opacity-60 border-gray-700"
          } text-center`}
        >
          <p className="font-bold text-cyan-600 drop-shadow-[0_0_4px_#67C8FFdd]">{stage.name}</p>
        </div>
      </Html>
    </mesh>
  );
}

function Arrow({ from, to }) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const length = dir.length();
  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const rotation = new THREE.Euler();
  rotation.y = Math.atan2(dir.x, dir.z);
  return (
    <mesh position={mid} rotation={rotation}>
      <cylinderGeometry args={[0.08, 0.1, length, 12]} />
      <meshStandardMaterial color="#67C8FF" emissive="#67C8FF" emissiveIntensity={0.25} />
    </mesh>
  );
}

function Gate({ position, label, isActive }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 4]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={isActive ? "#10B981" : "#21293c"}
        emissive={isActive ? "#67C8FF" : "#2d3748"}
        emissiveIntensity={isActive ? 0.6 : 0.2}
        transparent={true}
        opacity={0.85}
      />
      <Html distanceFactor={10}>
        <div className="text-xs font-semibold text-cyan-600 bg-white bg-opacity-80 rounded px-1 shadow">
          {label}
        </div>
      </Html>
    </mesh>
  );
}

function ArtifactToken({ pathPoints, activeIndex }) {
  const meshRef = React.useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (clock.getElapsedTime() % 3) / 3; // loop every 3s
    const i = activeIndex % (pathPoints.length - 1);
    const start = pathPoints[i];
    const end = pathPoints[i + 1];
    meshRef.current.position.lerpVectors(start, end, t);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.35, 32, 32]} />
      <meshStandardMaterial color="#F59E0B" emissive="#67C8FF" emissiveIntensity={0.75} />
    </mesh>
  );
}

export default function DeploymentWorkflow() {
  const [activeIndex, setActiveIndex] = useState(0);

  // cycle through pipeline stages
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % stages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // positions of each stage box
  const positions = stages.map((_, idx) =>
    new THREE.Vector3(idx * 3 - (stages.length * 1.5), 0, 0)
  );

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0"></div>

      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center z-30">
        <h1 className="text-3xl font-extrabold text-[#67C8FF] drop-shadow-[0_0_10px_#67C8FFbb] mb-2">
          Deployment Workflow (CI/CD Pipeline)
        </h1>
        <p className="text-cyan-200 drop-shadow-[0_0_5px_#67C8FF88]">
          High-level flow of code moving from development to production
        </p>
      </div>

      {/* 3D Visualization */}
      <Canvas camera={{ position: [0, 5, 12], fov: 52 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 6]} />
        <OrbitControls enablePan={false} />

        {stages.map((stage, idx) => (
          <StageBox
            key={stage.name}
            stage={stage}
            isActive={idx === activeIndex}
            position={positions[idx].toArray()}
          />
        ))}

        {/* Arrows between stages */}
        {positions.map((pos, idx) => {
          if (idx < positions.length - 1) {
            return <Arrow key={idx} from={pos} to={positions[idx + 1]} />;
          }
          return null;
        })}

        {/* Gates between certain stages */}
        {positions.map((pos, idx) => {
          if (idx < positions.length - 1) {
            const mid = new THREE.Vector3().addVectors(pos, positions[idx + 1]).multiplyScalar(0.5);
            return (
              <Gate
                key={`gate-${idx}`}
                position={[mid.x, -1.5, mid.z]}
                label={"Gate"}
                isActive={idx === activeIndex - 1}
              />
            );
          }
          return null;
        })}

        {/* Animated Artifact Token */}
        <ArtifactToken pathPoints={positions} activeIndex={activeIndex} />
      </Canvas>

      {/* Description Panel */}
      <motion.div
        key={activeIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-2/3 bg-white/10 backdrop-blur-2xl border border-cyan-400/20 rounded-2xl shadow-xl text-center p-4 z-30"
      >
        <h2 className="text-xl font-semibold text-[#67C8FF] drop-shadow-[0_0_8px_#67C8FFbb]">
          {stages[activeIndex].name}
        </h2>
        <p className="text-cyan-200">{stages[activeIndex].desc}</p>
      </motion.div>
    </div>
  );
}
