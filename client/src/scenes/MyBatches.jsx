// src/scenes/MyBatches.jsx
import React from "react";
import { motion } from "framer-motion";

export default function MyBatches() {
  const batches = JSON.parse(localStorage.getItem("userBatches") || "[]");

  if (!batches.length) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        {/* Cyber Grid Background */}
        <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid z-0" />
        <p className="relative z-10 text-center text-2xl text-gray-200 drop-shadow-lg">
          No batches earned yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid z-0" />

      <div className="relative z-10 max-w-6xl mx-auto py-16 px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {batches.map((b, i) => (
          <motion.div
            key={i}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
          >
            <img
              src="/assets/badge.png"
              alt="Badge"
              className="w-24 h-24 mb-4 animate-bounce"
            />
            <p className="font-semibold text-[#1F2937] mb-2">
              Topic: {b.topicId}
            </p>
            <p className="text-gray-600">Week: {b.week}</p>
            <p className="text-gray-600">
              Earned: {new Date(b.earnedAt).toLocaleDateString()}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
