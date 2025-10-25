// src/subjects/webdesign/WebDesignScene.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Palette, Zap, Code, GitBranch, ServerCog, Monitor, FileText } from "lucide-react";

const topics = [
  {
    name: "Frontend Inspector",
    path: "/web/frontend",
    icon: Palette,
    description: "Inspect and understand frontend design structure.",
    color: "#4B6CB7",
  },
  {
    name: "Animation Visualizer",
    path: "/web/animate",
    icon: Zap,
    description: "Visualize animations and transitions in UI.",
    color: "#67C8FF",
  },
  {
    name: "HTML Visualizer",
    path: "/web/html",
    icon: Monitor,
    description: "Learn and visualize HTML structure for web pages.",
    color: "#E34F26",
  },
  {
    name: "CSS Visualizer",
    path: "/web/css",
    icon: FileText,
    description: "Understand CSS styling and layout visually.",
    color: "#1572B6",
  },
  {
    name: "JavaScript Fundamentals",
    path: "/web/js",
    icon: Code,
    description: "Explore core JavaScript concepts interactively.",
    color: "#F7DF1E",
  },
  {
    name: "Website Architecture",
    path: "/web/architecture",
    icon: ServerCog,
    description: "Visualize how a website is structured and deployed.",
    color: "#10B981",
  },
  {
    name: "Git Branching Visualizer",
    path: "/web/git",
    icon: GitBranch,
    description: "Understand Git workflows and branching visually.",
    color: "#F59E0B",
  },
  {
    name: "Deployment Workflow",
    path: "/web/cicd",
    icon: Code,
    description: "Learn modern CI/CD deployment pipelines interactively.",
    color: "#8B5CF6",
  },
];

export default function WebDesignScene() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid z-0" />

      {/* Main Content */}
      <div className="relative z-10 p-8">
        <motion.h1
          className="text-4xl font-bold text-[#67C8FF] mb-6 drop-shadow-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Web Design Flow
        </motion.h1>

        <motion.p
          className="text-lg text-gray-200 mb-10 max-w-2xl drop-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Explore tools and concepts to understand and visualize modern web
          design workflows.
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <motion.div
                key={topic.name}
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                style={{ borderTop: `4px solid ${topic.color}` }}
              >
                <Icon className="w-10 h-10 mb-4" color={topic.color} />
                <h2 className="text-xl font-semibold text-[#1F2937] mb-2">
                  {topic.name}
                </h2>
                <p className="text-gray-600 mb-4">{topic.description}</p>
                <Link
                  to={topic.path}
                  className="px-4 py-2 rounded-lg text-white font-medium"
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
}
