// src/quiz/QuizHome.jsx
import React from "react";
import { Link } from "react-router-dom";
import QuizCard from "./QuizCard";
import { quizTopics } from "./quizData";

const QuizHome = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-center text-[#1F2937] mb-12">Test Your Knowledge</h1>
      
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {quizTopics.map((topic) => (
          <QuizCard key={topic.id} topic={topic} />
        ))}
      </div>

      <Link
        to="/"
        className="px-6 py-3 rounded-full font-bold text-white bg-[#4B6CB7] hover:bg-[#3A54A0] transition-colors shadow-lg hover:shadow-xl"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default QuizHome;
