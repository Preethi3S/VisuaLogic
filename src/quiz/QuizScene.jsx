// src/quiz/QuizScene.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { quizTopics } from "./quizData";
import Question from "./Question";
import { motion } from "framer-motion";

// Helper to get week number of the year
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const QuizScene = ({ isWeeklyContest = false }) => {
  const { topic } = useParams();
  const selectedTopic = quizTopics.find((t) => t.id === topic);

  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [exitingFullscreen, setExitingFullscreen] = useState(false);

  const navigate = useNavigate();

  if (!selectedTopic) return <div>Topic not found</div>;

  // Weekly Contest availability check
  const today = new Date();
  const week = getWeekNumber(today);
  const isSunday = today.getDay() === 0; // Sunday = 0
  const lastContest = JSON.parse(localStorage.getItem("weeklyContestParticipation") || "{}");
  const participatedThisWeek = lastContest.week === week;

  if (isWeeklyContest && (!isSunday || participatedThisWeek)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        {!isSunday ? (
          <p className="text-center text-xl">
            Weekly contest is available only on Sundays.
          </p>
        ) : (
          <p className="text-center text-xl">
            You have already participated in this week's contest. Check back next Sunday!
          </p>
        )}
      </div>
    );
  }

  // Enter full screen on quiz start
  useEffect(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }, []);

  // Auto quit on fullscreen exit (e.g. Escape press), except when exiting due to quiz completion
  useEffect(() => {
    const onFullScreenChange = () => {
      if (!document.fullscreenElement) {
        // Only quit if fullscreen exit not caused by quiz completion
        if (!exitingFullscreen) {
          handleQuit();
        }
      }
    };

    document.addEventListener("fullscreenchange", onFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullScreenChange);
    };
  }, [exitingFullscreen]);

  // Timer countdown for each question
  useEffect(() => {
    if (completed) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleAnswer(null); // auto-move if no answer
          return 30; // reset timer
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQ, completed]);

  // Handle answer or timeout
  const handleAnswer = (correct) => {
    if (correct) setScore((s) => s + 1);

    if (currentQ + 1 < selectedTopic.questions.length) {
      setCurrentQ(currentQ + 1);
      setTimeLeft(30); // reset timer
    } else {
      setCompleted(true);
      setExitingFullscreen(true); // Indicate intentional fullscreen exit
      if (document.exitFullscreen) document.exitFullscreen();

      // Weekly contest logic
      if (isWeeklyContest) {
        localStorage.setItem(
          "weeklyContestParticipation",
          JSON.stringify({ week, score, topicId: selectedTopic.id })
        );

        const badgeThreshold = 0.8; // 80% score
        if (score / selectedTopic.questions.length >= badgeThreshold) {
          let batches = JSON.parse(localStorage.getItem("userBatches") || "[]");

          // Avoid duplicate badges
          const alreadyHasBadge = batches.some(
            (b) => b.topicId === selectedTopic.id && b.week === week
          );

          if (!alreadyHasBadge) {
            batches.push({
              topicId: selectedTopic.id,
              week,
              topicTitle: selectedTopic.title,
              earnedAt: today.toISOString(),
              badgeImage: "/assets/badge.png"
            });
            localStorage.setItem("userBatches", JSON.stringify(batches));
          }
        }
      }
    }
  };

 
  // Handler for quitting the quiz
  const handleQuit = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    navigate("/quiz");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">{selectedTopic.title}</h1>

      {!completed ? (
        <>
          <p className="text-gray-600 mb-4">
            Question {currentQ + 1} of {selectedTopic.questions.length} | Time Left: {timeLeft}s
          </p>

          {/* Quit Button */}
          <button
            onClick={handleQuit}
            className="mb-6 px-4 py-2 rounded-full font-bold text-white bg-red-500 hover:bg-red-600"
          >
            Quit
          </button>

          <motion.div
            key={currentQ}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl"
          >
            <Question
              question={selectedTopic.questions[currentQ]}
              onAnswer={handleAnswer}
            />
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-2xl font-semibold mb-4">Quiz Completed!</h2>
          <p className="text-gray-700 mb-4">
            Your Score: {score} / {selectedTopic.questions.length}
          </p>

          <Link
            to="/quiz"
            className="px-6 py-2 rounded-full font-bold text-white"
            style={{ backgroundColor: selectedTopic.color }}
          >
            Back to Quiz Home
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default QuizScene;
