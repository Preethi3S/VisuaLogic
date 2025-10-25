// src/quiz/QuizCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { Cpu, Code, Terminal } from "lucide-react";
import { Link } from "react-router-dom";

const iconMap = { Cpu, Code, Terminal };

const QuizCard = ({ topic }) => {
  const Icon = iconMap[topic.icon] || Cpu;

  return (
    <motion.div
      whileHover={{ scale: 1.05, boxShadow: `0 10px 20px ${topic.color}55` }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center cursor-pointer"
    >
      <Icon size={50} color={topic.color} className="mb-4 animate-bounce" />
      <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
      <p className="text-gray-500 mb-4">{topic.questions.length} Questions</p>
      <Link
        to={`/quiz/${topic.id}`}
        className="px-6 py-2 rounded-full text-white font-bold"
        style={{ backgroundColor: topic.color }}
      >
        Start Quiz
      </Link>
    </motion.div>
  );
};

export default QuizCard;
