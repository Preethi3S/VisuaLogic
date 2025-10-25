import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Globe, Router, Calculator, Network } from "lucide-react";

const topics = [
  {
    name: "OSI Model",
    icon: Globe,
    link: "/cn/osimodel",
    desc: "Understand the 7 layers of networking through an interactive visualization.",
  },
  {
    name: "Packet Flow",
    icon: Router,
    link: "/cn/packetflow",
    desc: "Visualize how data is broken into packets and travels through a network.",
  },
  {
    name: "Subnetting Calculator",
    icon: Calculator,
    link: "/cn/subnettingcalculator",
    desc: "Calculate subnets, IP ranges, and network addresses with ease.",
  },
  {
    name: "TCP Handshake",
    icon: Network,
    link: "/cn/tcphandshake",
    desc: "Step-by-step simulation of the TCP 3-way handshake process.",
  },
];

export default function NetworksScene() {
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
          Computer Networks
        </motion.h1>

        <motion.p
          className="text-lg text-gray-200 mb-10 max-w-2xl drop-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Dive into the fundamentals of networking, from OSI layers to TCP
          handshakes, through interactive visualizations.
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
              >
                <Icon className="w-10 h-10 text-[#67C8FF] mb-4" />
                <h2 className="text-xl font-semibold text-[#1F2937] mb-2">
                  {topic.name}
                </h2>
                <p className="text-gray-600 mb-4">{topic.desc}</p>
                <Link
                  to={topic.link}
                  className="text-[#4B6CB7] font-medium hover:underline"
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
