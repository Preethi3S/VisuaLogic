// src/quiz/AnswerButton.jsx
import React from "react";
import { motion } from "framer-motion";

const AnswerButton = ({ text, onClick, isCorrect, isSelected }) => {
  let bgColor = "bg-gray-200";
  if (isSelected) bgColor = isCorrect ? "bg-green-500" : "bg-red-500";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={`w-full px-4 py-2 my-2 rounded-lg text-white font-medium ${bgColor} transition-colors duration-300`}
    >
      {text}
    </motion.button>
  );
};

export default AnswerButton;
