// src/quiz/Question.jsx
import React, { useState } from "react";
import AnswerButton from "./AnswerButton";

const Question = ({ question, onAnswer }) => {
  const [selected, setSelected] = useState(null);

  const handleClick = (option) => {
    setSelected(option);
    onAnswer(option === question.answer);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
      <h2 className="text-2xl font-semibold mb-6">{question.q}</h2>
      {question.options.map((opt, i) => (
        <AnswerButton
          key={i}
          text={opt}
          onClick={() => handleClick(opt)}
          isCorrect={opt === question.answer}
          isSelected={selected === opt}
        />
      ))}
    </div>
  );
};

export default Question;
