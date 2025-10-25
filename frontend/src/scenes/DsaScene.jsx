import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  SortAsc,
  Layers,
  GitBranch,
  Network,
  Search,
  TreePine,
  GitFork,
  Workflow,
  List,
  Code2,
} from "lucide-react";

const topics = [
  {
    name: "Sorting Visualizer",
    icon: SortAsc,
    link: "/dsa/sortingvisualizer",
    desc: "Animated comparison of sorting algorithms like Bubble, Merge, Quick, and Heap sort.",
  },
  {
    name: "Stack & Queue",
    icon: Layers,
    link: "/dsa/stackqueue",
    desc: "Push, pop, enqueue, dequeue — see stack & queue operations in action.",
  },
  {
    name: "Recursion & Backtracking",
    icon: GitBranch,
    link: "/dsa/recbt",
    desc: "Explore how recursion works and solve puzzles using backtracking.",
  },
  {
    name: "Graph Basics",
    icon: Network,
    link: "/dsa/graph",
    desc: "Introduction to graphs, vertices, edges, and basic concepts.",
  },
  {
    name: "Graph Traversals",
    icon: Network,
    link: "/dsa/graphtraversal",
    desc: "Visual BFS and DFS traversals on different types of graphs.",
  },
  {
    name: "Shortest Path (Dijkstra)",
    icon: Network,
    link: "/dsa/shortestpath",
    desc: "Visualize Dijkstra's algorithm for finding shortest paths.",
  },
  {
    name: "Network Flow",
    icon: Network,
    link: "/dsa/networkflow",
    desc: "Understand max-flow algorithms and see flows in action.",
  },
  {
    name: "Topological Sort",
    icon: Network,
    link: "/dsa/topology",
    desc: "Learn how topological sorting orders DAG vertices.",
  },
  {
    name: "Minimum Spanning Tree",
    icon: Network,
    link: "/dsa/spanningtree",
    desc: "Visualize Kruskal's and Prim's algorithms for MSTs.",
  },
  {
    name: "Graph Advanced",
    icon: Network,
    link: "/dsa/map",
    desc: "Graph coloring, connectivity, and more advanced concepts.",
  },
  {
    name: "Search Algorithms",
    icon: Search,
    link: "/dsa/searchvisualizer",
    desc: "Linear, binary search and other searching techniques visualized.",
  },
  {
    name: "Tree Traversals",
    icon: TreePine,
    link: "/dsa/treevisualizer",
    desc: "Inorder, Preorder, Postorder traversals for binary trees.",
  },
  {
    name: "Segment Tree",
    icon: GitFork,
    link: "/dsa/segmenttreevisualizer",
    desc: "Learn how segment trees store and process range queries.",
  },
  {
    name: "AVL Tree",
    icon: Workflow,
    link: "/dsa/avltreevisualizer",
    desc: "Balanced binary search tree operations explained.",
  },
  {
    name: "Red-Black Tree",
    icon: Workflow,
    link: "/dsa/redblacktreevisualizer",
    desc: "Another self-balancing BST — see insertions and rotations.",
  },
  {
    name: "Linked List",
    icon: List,
    link: "/dsa/linkedlist",
    desc: "Understand singly, doubly, and circular linked lists.",
  },
  {
    name: "Code Flow Visualizer",
    icon: Code2,
    link: "/dsa/code",
    desc: "See how code executes step-by-step in a visual flow diagram.",
  },
];

export default function DSAScene() {
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
          Data Structures & Algorithms
        </motion.h1>

        <motion.p
          className="text-lg text-gray-200 mb-10 max-w-2xl drop-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Visualize and interact with core DSA concepts — from basic data
          structures to advanced algorithms.
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
