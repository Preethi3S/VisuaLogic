// src/quiz/quizService.js
export const saveProgress = (topicId, score) => {
  const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");
  history.push({ topicId, score, date: new Date() });
  localStorage.setItem("quizHistory", JSON.stringify(history));
};

export const getProgress = () => {
  return JSON.parse(localStorage.getItem("quizHistory") || "[]");
};

// quizService.js
export const saveBadge = (badge) => {
  const badges = JSON.parse(localStorage.getItem("badges") || "[]");
  badges.push({
    ...badge,
    date: new Date().toISOString()
  });
  localStorage.setItem("badges", JSON.stringify(badges));
};
