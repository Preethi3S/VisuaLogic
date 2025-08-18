// src/subjects/compilerdesign/CDHome.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, GitBranch, Layers, Code2 } from "lucide-react";

const topics = [
  {
    name: "Lexical Analysis",
    path: "/cd/lexicalanalysis",
    icon: FileText,
    description: "Tokenize source code into meaningful units.",
    color: "#4B6CB7",
  },
  {
    name: "Syntax Analysis",
    path: "/cd/syntaxanalysis",
    icon: GitBranch,
    description: "Parse tokens according to grammar rules.",
    color: "#67C8FF",
  },
  {
    name: "Semantic Analysis",
    path: "/cd/semanticanalysis",
    icon: Layers,
    description: "Ensure the program has valid meaning.",
    color: "#10B981",
  },
  {
    name: "Intermediate Code Generation",
    path: "/cd/icg",
    icon: Code2,
    description: "Generate machine-independent code representation.",
    color: "#F59E0B",
  },
];

const CompilerScene = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid z-0" />

      {/* Main Content */}
      <div className="relative z-10 p-8">
        <motion.h1
          className="text-5xl font-bold text-[#67C8FF] mb-6 drop-shadow-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Compiler Design
        </motion.h1>

        <motion.p
          className="text-lg text-gray-200 mb-10 max-w-2xl drop-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Learn each phase of compiler design with interactive visualizations —
          from lexical analysis to intermediate code generation.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <motion.div
                key={index}
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow flex flex-col items-center text-center"
                style={{ borderTop: `4px solid ${topic.color}` }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
              >
                <Icon size={40} color={topic.color} className="mb-3" />
                <h2 className="text-lg font-semibold text-[#1F2937] mb-2">
                  {topic.name}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {topic.description}
                </p>
                <Link
                  to={topic.path}
                  className="px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition"
                  style={{ backgroundColor: topic.color }}
                >
                  Explore →
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompilerScene;
