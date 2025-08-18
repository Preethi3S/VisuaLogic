// src/subjects/ai/AIScene.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, RotateCcw } from "lucide-react";

const topics = [
  {
    name: "Neural Networks",
    path: "/ai/neuralnetworks",
    icon: Brain,
    description: "Visualize the architecture and flow of neural networks.",
    color: "#4B6CB7", // Indigo
  },
  {
    name: "Backpropagation",
    path: "/ai/backpropagation",
    icon: RotateCcw,
    description:
      "Understand error propagation and weight updates in neural networks.",
    color: "#67C8FF", // Sky Blue
  },
];

const AIScene = () => {
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
          Artificial Intelligence
        </motion.h1>

        <motion.p
          className="text-lg text-gray-200 mb-10 max-w-2xl drop-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Explore core AI concepts and algorithms with visual simulations —
          from neural network architecture to backpropagation mechanics.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

export default AIScene;
