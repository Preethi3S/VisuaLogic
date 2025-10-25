// src/scenes/DBMSScene.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FolderTree,
  Table2,
  Database,
  Workflow,
  GitBranch,
  Layers,
  Server,
} from "lucide-react";

const topics = [
  {
    name: "ER Diagram",
    icon: FolderTree,
    link: "/dbms/erdiagram",
    desc: "Visualize entities, attributes, and relationships in a database system.",
  },
  {
    name: "Relational Schema",
    icon: Table2,
    link: "/dbms/relationalschema",
    desc: "Understand how tables are structured and linked in relational databases.",
  },
  {
    name: "SQL Practice",
    icon: Database,
    link: "/dbms/sqlpractice",
    desc: "Write and execute SQL queries interactively to strengthen skills.",
  },
  {
    name: "Normalization",
    icon: Workflow,
    link: "/dbms/normalizer",
    desc: "Learn and apply normalization rules to improve database design.",
  },
  {
    name: "SQL Flow",
    icon: GitBranch,
    link: "/dbms/sqlflow",
    desc: "Visualize how SQL queries are processed by the DBMS.",
  },
  {
    name: "Transaction Management",
    icon: Server,
    link: "/dbms/transaction",
    desc: "Understand ACID properties and transaction handling in databases.",
  },
  {
    name: "Indexing",
    icon: Layers,
    link: "/dbms/indexing",
    desc: "See how indexing improves query performance.",
  },
];

export default function DBMSScene() {
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
          Database Management Systems
        </motion.h1>

        <motion.p
          className="text-lg text-gray-200 mb-10 max-w-2xl drop-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Explore the core concepts of DBMS with interactive diagrams,
          normalizations, and SQL flow visualizations.
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
