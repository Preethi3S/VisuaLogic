import React, { useEffect, useState } from "react";
import { getBadges } from "../quiz/quizService";

export default function BatchesScene() {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    setBadges(getBadges());
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Badges</h2>
      <div className="flex flex-wrap gap-4">
        {badges.length > 0 ? (
          badges.map((badge) => (
            <div key={badge.id} className="p-4 bg-white rounded-lg shadow-lg">
              <span className="text-4xl">{badge.icon}</span>
              <h3 className="font-semibold mt-2">{badge.name}</h3>
              <p className="text-sm text-gray-500">
                Earned on {new Date(badge.earnedOn).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <p>No badges earned yet. Take quizzes to earn some!</p>
        )}
      </div>
    </div>
  );
}
