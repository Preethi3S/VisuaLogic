// src/quiz/quizData.js
export const quizTopics = [
  {
    id: "os-scheduling",
    title: "OS Scheduling Quiz",
    color: "#4B6CB7",
    icon: "Cpu",
    questions: [
      { q: "What is a process?", options: ["A program", "A task", "Both", "None"], answer: "Both" },
      { q: "Which algorithm is preemptive?", options: ["FCFS", "SJF", "Round Robin", "Priority Non-preemptive"], answer: "Round Robin" },
    ],
  },
  {
    id: "compiler-design",
    title: "Compiler Design Quiz",
    color: "#67C8FF",
    icon: "Code",
    questions: [
      { q: "What is lexical analysis?", options: ["Parsing code", "Tokenizing code", "Optimization", "Linking"], answer: "Tokenizing code" },
      { q: "Which phase generates intermediate code?", options: ["Syntax Analysis", "Semantic Analysis", "Code Generation", "Lexical Analysis"], answer: "Code Generation" },
    ],
  },
  {
    id: "dsa-challenge",
    title: "DSA Challenge",
    color: "#F97316",
    icon: "Terminal",
    questions: [
      { q: "Big O of binary search?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], answer: "O(log n)" },
      { q: "Which data structure is FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], answer: "Queue" },
    ],
  },
];
