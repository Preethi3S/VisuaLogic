// src/quiz/QuizHome.jsx
import React from "react";
import QuizCard from "./QuizCard";
import { quizTopics } from "./quizData";

const QuizHome = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6">
      <h1 className="text-4xl font-bold text-center text-[#1F2937] mb-12">Test Your Knowledge</h1>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {quizTopics.map((topic) => (
          <QuizCard key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
};

export default QuizHome;
