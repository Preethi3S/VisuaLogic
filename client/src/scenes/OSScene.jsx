// src/scenes/OSScene.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Cpu,
  HardDrive,
  Database,
  GitFork,
  Layers,
  Server,
  FileText,
  Repeat,
  Workflow,
  Usb,
  PhoneCall,
  Shield,
  Bell,
  Cpu as Chip,
  Power,
} from "lucide-react";

const topics = [
  {
    name: "CPU Scheduling",
    icon: Cpu,
    link: "/os/cpuscheduling",
    desc: "Visualize different CPU scheduling algorithms like FCFS, SJF, Round Robin, and Priority.",
  },
  {
    name: "Memory Management",
    icon: Database,
    link: "/os/memorymanagement",
    desc: "Understand how operating systems manage RAM allocation and deallocation.",
  },
  {
    name: "Disk Scheduling",
    icon: HardDrive,
    link: "/os/diskscheduling",
    desc: "Explore algorithms for optimizing disk head movement.",
  },
  {
    name: "Deadlock Detection",
    icon: Workflow,
    link: "/os/deadlockdetection",
    desc: "Learn how OS detects and handles deadlocks in processes.",
  },
  {
    name: "Memory Allocation",
    icon: Layers,
    link: "/os/memoryallocation",
    desc: "First-fit, Best-fit, and Worst-fit memory allocation strategies.",
  },
  {
    name: "Process Synchronization",
    icon: GitFork,
    link: "/os/processsynchronization",
    desc: "Semaphores, mutexes, and process coordination.",
  },
  {
    name: "Virtual Memory",
    icon: Server,
    link: "/os/virtualmemory",
    desc: "Paging, segmentation, and demand paging concepts.",
  },
  {
    name: "Thread Scheduling",
    icon: Repeat,
    link: "/os/threadscheduling",
    desc: "Multithreading and scheduling strategies for threads.",
  },
  {
    name: "File System Management",
    icon: FileText,
    link: "/os/filesystemmanagement",
    desc: "How OS organizes, stores, and retrieves files.",
  },
  {
    name: "I/O Management",
    icon: Usb,
    link: "/os/iomanagement",
    desc: "Discover how OS handles device drivers and I/O operations efficiently.",
  },
  {
    name: "System Calls & APIs",
    icon: PhoneCall,
    link: "/os/systemcalls",
    desc: "Understand the interface between applications and the OS kernel.",
  },
  {
    name: "Boot Process",
    icon: Power,
    link: "/os/bootprocess",
    desc: "Step-by-step breakdown of how an OS boots and initializes hardware.",
  },
  {
    name: "Security & Protection",
    icon: Shield,
    link: "/os/security",
    desc: "Explore OS-level security mechanisms, authentication, and access control.",
  },
  {
    name: "Interrupt Handling",
    icon: Bell,
    link: "/os/interrupthandling",
    desc: "Learn how OS handles hardware and software interrupts.",
  },
  {
    name: "Kernel Architecture",
    icon: Chip,
    link: "/os/kernelarchitecture",
    desc: "Monolithic, microkernel, and hybrid kernel designs explained.",
  },
];

export default function OSScene() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />


      {/* Main content */}
      <div className="relative z-10 p-8">
        <motion.h1
          className="text-4xl font-bold text-[#67C8FF] mb-6 drop-shadow-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Operating System
        </motion.h1>

        <motion.p
          className="text-lg text-gray-200 mb-10 max-w-2xl drop-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Explore core operating system concepts through interactive
          visualizations — from CPU scheduling to file system management.
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
