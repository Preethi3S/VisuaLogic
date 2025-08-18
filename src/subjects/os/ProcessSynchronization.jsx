import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcessSynchronization() {
  const topics = [
    { id: "peterson", name: "Peterson’s Algorithm" },
    { id: "producerConsumer", name: "Producer-Consumer Problem" },
    { id: "readersWriters", name: "Readers-Writers Problem" },
    { id: "diningPhilosophers", name: "Dining Philosophers Problem" },
  ];

  const [selectedTopic, setSelectedTopic] = useState("peterson");

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      <div className="relative z-10 p-6 max-w-4xl min-h-screen mx-auto text-cyan-100">
        <h1 className="text-3xl font-bold mb-6 text-cyan-400 drop-shadow-[0_1px_10px_#67C8FF]">Process Synchronization</h1>

        {/* Topic Selection */}
        <div className="flex gap-4 mb-8">
          {topics.map((t) => (
            <button
              key={t.id}
              className={`px-4 py-2 rounded-2xl font-semibold shadow-lg border-2 transition-all duration-200
                ${
                  selectedTopic === t.id
                  ? "bg-indigo-500 border-indigo-400 text-white"
                  : "bg-black/40 border-cyan-900/40 text-cyan-200 hover:bg-indigo-400/20"
                }`
              }
              onClick={() => setSelectedTopic(t.id)}
              style={{ minWidth: 140 }}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Topic Visualization */}
        <AnimatePresence mode="wait">
          {selectedTopic === "peterson" && <Peterson key="peterson" />}
          {selectedTopic === "producerConsumer" && <ProducerConsumer key="producerConsumer" />}
          {selectedTopic === "readersWriters" && <ReadersWriters key="readersWriters" />}
          {selectedTopic === "diningPhilosophers" && <DiningPhilosophers key="diningPhilosophers" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------- 1. Peterson’s Algorithm -------------------- */
function Peterson() {
  const [turn, setTurn] = useState(0);
  const [critical, setCritical] = useState(null);

  const enterCritical = (proc) => {
    setTurn(proc);
    setCritical(proc);
    setTimeout(() => setCritical(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -28 }}
      className="p-6 glass-card bg-black/70 border border-cyan-400/30 rounded-2xl shadow-xl"
    >
      <h2 className="text-xl font-bold mb-2 text-cyan-300">Peterson’s Algorithm</h2>
      <p className="mb-6 text-cyan-100">
        Demonstrates mutual exclusion between two processes using flags and turn variable.
      </p>

      <div className="flex gap-10 justify-center">
        {[0, 1].map((proc) => (
          <motion.div
            key={proc}
            className={`w-40 h-40 flex flex-col items-center justify-center rounded-2xl border-4 ring-2 ring-cyan-500/20
              ${critical === proc ? "border-emerald-400 bg-emerald-400/10 shadow-lg" : "border-cyan-400/30 bg-black/30"}`
            }
            whileHover={{ scale: 1.07 }}
          >
            <button
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-2 rounded shadow"
              onClick={() => enterCritical(proc)}
            >
              P{proc} Enter
            </button>
            <div className="mt-3 text-sm font-semibold text-cyan-200">
              {critical === proc
                ? "In Critical Section"
                : turn === proc
                ? "Waiting"
                : "Idle"}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* -------------------- 2. Producer-Consumer Problem -------------------- */
function ProducerConsumer() {
  const [buffer, setBuffer] = useState([]);
  const capacity = 5;

  const produce = () => {
    if (buffer.length < capacity) {
      setBuffer([...buffer, `Item ${buffer.length + 1}`]);
    }
  };

  const consume = () => {
    if (buffer.length > 0) {
      setBuffer(buffer.slice(1));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -28 }}
      className="p-6 glass-card bg-black/70 border border-cyan-400/30 rounded-2xl shadow-xl"
    >
      <h2 className="text-xl font-bold mb-2 text-cyan-300">Producer-Consumer Problem</h2>
      <p className="mb-6 text-cyan-100">
        Illustrates synchronization between producer and consumer processes with a bounded buffer.
      </p>
      <div className="flex gap-6 mb-6 justify-center">
        <button onClick={produce} className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2 rounded-2xl shadow">Produce</button>
        <button onClick={consume} className="bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-2 rounded-2xl shadow">Consume</button>
      </div>
      <div className="flex gap-2 justify-center">
        {Array.from({ length: capacity }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-16 h-16 flex items-center justify-center rounded-xl border-2 font-semibold 
              ${buffer[i] ? "bg-cyan-400 border-cyan-400 text-black shadow-lg" : "bg-black/30 border-cyan-800 text-cyan-500"}`}
          >
            {buffer[i] || ""}
          </motion.div>
        ))}
      </div>
      <div className="text-xs mt-2 text-cyan-400 text-center">{buffer.length}/{capacity} full</div>
    </motion.div>
  );
}

/* -------------------- 3. Readers-Writers Problem -------------------- */
function ReadersWriters() {
  const [readers, setReaders] = useState(0);
  const [writerActive, setWriterActive] = useState(false);

  const startRead = () => {
    if (!writerActive) setReaders(readers + 1);
  };
  const stopRead = () => {
    if (readers > 0) setReaders(readers - 1);
  };
  const startWrite = () => {
    if (readers === 0 && !writerActive) setWriterActive(true);
  };
  const stopWrite = () => {
    setWriterActive(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -28 }}
      className="p-6 glass-card bg-black/70 border border-cyan-400/30 rounded-2xl shadow-xl"
    >
      <h2 className="text-xl font-bold mb-2 text-cyan-300">Readers-Writers Problem</h2>
      <p className="mb-6 text-cyan-100">
        Demonstrates read and write locks ensuring no conflict between readers and writers.
      </p>
      <div className="flex gap-4 mb-6 justify-center flex-wrap">
        <button onClick={startRead} className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl shadow">Start Read</button>
        <button onClick={stopRead} className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-xl shadow">Stop Read</button>
        <button onClick={startWrite} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl shadow">Start Write</button>
        <button onClick={stopWrite} className="bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-xl shadow">Stop Write</button>
      </div>
      <div className="flex gap-10 justify-center">
        <div className="p-4 border-2 rounded-xl bg-black/30 border-cyan-400 text-lg font-semibold text-cyan-200 shadow-md">
          Readers: {readers}
        </div>
        <div
          className={`p-4 border-2 rounded-xl text-lg font-semibold shadow-md
            ${writerActive ? "bg-cyan-400 text-black border-cyan-400" : "bg-black/30 text-cyan-200 border-cyan-400"}`}
        >
          Writer: {writerActive ? "Active" : "Idle"}
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------- 4. Dining Philosophers Problem -------------------- */
function DiningPhilosophers() {
  const philosophers = ["P0", "P1", "P2", "P3", "P4"];
  const [eating, setEating] = useState(Array(5).fill(false));

  const toggleEat = (index) => {
    setEating((prev) =>
      prev.map((val, i) => (i === index ? !val : val))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -28 }}
      className="p-6 glass-card bg-black/70 border border-cyan-400/30 rounded-2xl shadow-xl"
    >
      <h2 className="text-xl font-bold mb-2 text-cyan-300">Dining Philosophers Problem</h2>
      <p className="mb-6 text-cyan-100">
        Shows philosophers alternately thinking and eating, avoiding deadlock.
      </p>
      <div className="flex gap-5 justify-center">
        {philosophers.map((ph, i) => (
          <motion.div
            key={ph}
            className={`p-4 rounded-xl border-2 text-center cursor-pointer shadow text-lg font-semibold
              ${eating[i] ? "bg-emerald-500/80 text-black border-emerald-400" : "bg-black/30 text-cyan-200 border-cyan-400"}`}
            whileHover={{ scale: 1.07 }}
            onClick={() => toggleEat(i)}
            style={{ minWidth: 70 }}
          >
            {ph}
            <div className="text-sm font-normal mt-2">
              {eating[i] ? "Eating 🍽" : "Thinking 💭"}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
