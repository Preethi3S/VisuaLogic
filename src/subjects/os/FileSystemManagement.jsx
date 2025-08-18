import React, { useState } from "react";
import { motion } from "framer-motion";

/**
 * File System Management Visualizer — Cyber Grid Theme
 * Concepts:
 * - File Allocation: Contiguous, Linked, Indexed
 * - Directory Structures: Single-level, Two-level, Tree
 * - Free Space Management: Bit Vector, Linked List
 */

const BLOCK_COUNT = 40; // Total disk blocks for visualization
const allocationMethods = ["Contiguous", "Linked", "Indexed"];

const FileSystemManagement = () => {
  const [blocks, setBlocks] = useState(
    Array.from({ length: BLOCK_COUNT }, (_, i) => ({
      id: i,
      status: "free", // free, allocated, index, directory
      file: null,
    }))
  );
  const [files, setFiles] = useState([]);
  const [method, setMethod] = useState("Contiguous");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(5);

  // Reset disk
  const resetDisk = () => {
    setBlocks(
      Array.from({ length: BLOCK_COUNT }, (_, i) => ({
        id: i,
        status: "free",
        file: null,
      }))
    );
    setFiles([]);
  };

  // Allocate file based on selected method
  const allocateFile = () => {
    if (!fileName) return alert("Enter a file name");
    if (files.find((f) => f.name === fileName)) {
      return alert("File name already exists");
    }

    let newBlocks = [...blocks];
    let allocation = [];

    if (method === "Contiguous") {
      let start = -1;
      let count = 0;
      for (let i = 0; i < BLOCK_COUNT; i++) {
        if (newBlocks[i].status === "free") {
          if (start === -1) start = i;
          count++;
          if (count === fileSize) break;
        } else {
          start = -1;
          count = 0;
        }
      }
      if (count < fileSize) return alert("Not enough contiguous space");
      for (let i = start; i < start + fileSize; i++) {
        newBlocks[i] = { ...newBlocks[i], status: "allocated", file: fileName };
        allocation.push(i);
      }
    }

    if (method === "Linked") {
      let freeBlocks = newBlocks
        .filter((b) => b.status === "free")
        .slice(0, fileSize);
      if (freeBlocks.length < fileSize)
        return alert("Not enough free blocks");
      freeBlocks.forEach((b) => {
        newBlocks[b.id] = { ...b, status: "allocated", file: fileName };
        allocation.push(b.id);
      });
    }

    if (method === "Indexed") {
      let freeBlocks = newBlocks.filter((b) => b.status === "free");
      if (freeBlocks.length < fileSize + 1)
        return alert("Not enough free blocks for index method");
      let indexBlock = freeBlocks[0];
      newBlocks[indexBlock.id] = {
        ...indexBlock,
        status: "index",
        file: fileName,
      };
      let dataBlocks = freeBlocks.slice(1, fileSize + 1);
      dataBlocks.forEach((b) => {
        newBlocks[b.id] = { ...b, status: "allocated", file: fileName };
        allocation.push(b.id);
      });
      allocation.push(`Index:${indexBlock.id}`);
    }

    setBlocks(newBlocks);
    setFiles([...files, { name: fileName, size: fileSize, allocation }]);
    setFileName("");
  };

  // Delete file
  const deleteFile = (name) => {
    let newBlocks = blocks.map((b) =>
      b.file === name ? { ...b, status: "free", file: null } : b
    );
    setBlocks(newBlocks);
    setFiles(files.filter((f) => f.name !== name));
  };

  return (
    <div className="relative min-h-screen font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Main Content */}
      <div className="relative z-10 p-6 max-w-4xl mx-auto text-cyan-100 space-y-8">
        <h1 className="text-3xl font-bold mb-4 drop-shadow-[0_0_12px_#67C8FF] text-cyan-400">
          File System Management Visualizer
        </h1>

        {/* Controls */}
        <div className="glass-card flex gap-4 mb-6 flex-wrap bg-black/60 border border-cyan-400/40 p-4 rounded-2xl shadow-lg">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="border border-cyan-400 rounded-xl p-2 bg-black/70 text-cyan-200"
          >
            {allocationMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="File Name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="border border-cyan-400 rounded-xl p-2 bg-black/70 text-cyan-200"
          />
          <input
            type="number"
            min="1"
            max={BLOCK_COUNT}
            value={fileSize}
            onChange={(e) => setFileSize(parseInt(e.target.value))}
            className="border border-cyan-400 rounded-xl p-2 w-20 bg-black/70 text-cyan-200"
          />
          <button
            onClick={allocateFile}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl shadow font-semibold"
          >
            Allocate
          </button>
          <button
            onClick={resetDisk}
            className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl shadow"
          >
            Reset Disk
          </button>
        </div>

        {/* Disk Blocks */}
        <div className="glass-card grid grid-cols-10 gap-2 mb-6 p-4 bg-black/70 border border-cyan-400/20 rounded-2xl shadow">
          {blocks.map((block) => (
            <motion.div
              key={block.id}
              layout
              className={`h-12 flex items-center justify-center text-xs rounded-xl font-semibold border-2
              ${
                block.status === "free"
                  ? "bg-cyan-950 border-cyan-900 text-cyan-400"
                  : block.status === "allocated"
                  ? "bg-indigo-500 border-indigo-300 text-white shadow-lg"
                  : block.status === "index"
                  ? "bg-yellow-400 border-yellow-300 text-black shadow-lg"
                  : "bg-gray-400 border-gray-400"
              }`}
            >
              {block.id}
            </motion.div>
          ))}
        </div>

        {/* File Table */}
        <div className="glass-card bg-black/70 border border-cyan-400/20 p-4 rounded-2xl shadow-lg">
          <h2 className="font-semibold mb-2 text-cyan-300">Files</h2>
          <table className="w-full border border-cyan-400/20 text-cyan-100">
            <thead>
              <tr className="bg-cyan-900/30">
                <th className="border border-cyan-400/10 px-2 py-1">Name</th>
                <th className="border border-cyan-400/10 px-2 py-1">Size</th>
                <th className="border border-cyan-400/10 px-2 py-1">Allocation</th>
                <th className="border border-cyan-400/10 px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.name}>
                  <td className="border border-cyan-400/10 px-2 py-1">{file.name}</td>
                  <td className="border border-cyan-400/10 px-2 py-1">{file.size}</td>
                  <td className="border border-cyan-400/10 px-2 py-1">
                    {file.allocation.join(", ")}
                  </td>
                  <td className="border border-cyan-400/10 px-2 py-1">
                    <button
                      onClick={() => deleteFile(file.name)}
                      className="bg-rose-500 text-white px-3 py-1 rounded-xl shadow"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center p-2 text-cyan-400">
                    No files allocated
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FileSystemManagement;
