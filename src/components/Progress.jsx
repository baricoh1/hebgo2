// src/components/Progress.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import lvl0 from '../images/lvl0.png';
import lvl1 from '../images/lvl1.png';
import lvl2 from '../images/lvl2.png';
import lvl3 from '../images/lvl3.png';
import lvl0girl from '../images/lvl0girl.png';
import lvl1girl from '../images/lvl1girl.png';
import lvl2girl from '../images/lvl2girl.png';
import lvl3girl from '../images/lvl3girl.png';

function Progress() {
  const MAX_QUESTIONS = 20;
  const navigate = useNavigate();

  // Initialize userName, gender, and difficulty from localStorage
  const [userName, setUserName] = useState(
    () => localStorage.getItem('userName') || null
  );
  const [gender, setGender] = useState(
    () => localStorage.getItem('userGender') || 'other'
  );
  const [trueLevel, setTrueLevel] = useState(
    () => localStorage.getItem('userDifficulty') || 'easy'
  );

  // Default selected language is "us"
  const [selectedLang, setSelectedLang] = useState('us');

  // Default progress structure if nothing in localStorage
  const defaultProgress = {
    us: { easy: [], medium: [], hard: [] },
    es: { easy: [], medium: [], hard: [] },
    ru: { easy: [], medium: [], hard: [] }
  };
  // Load progress from localStorage or use default
  const [progress, setProgress] = useState(() => {
    try {
      const stored = localStorage.getItem('userProgress');
      return stored ? JSON.parse(stored) : defaultProgress;
    } catch {
      return defaultProgress;
    }
  });

  // Fetch user data on mount or when userName changes
  useEffect(() => {
    if (!userName) {
      const storedUser = localStorage.getItem('userName');
      setUserName(storedUser);
      return;
    }

    fetch(`http://localhost:5000/api/user/${userName}`)
      .then((res) => res.json())
      .then((data) => {
        // Update progress from server and store in localStorage
        if (data.progress) {
          setProgress(data.progress);
          localStorage.setItem('userProgress', JSON.stringify(data.progress));
        }

        // Update gender if returned from server
        if (data.gender) {
          setGender(data.gender);
          localStorage.setItem('userGender', data.gender);
        }

        // Update difficulty if returned from server
        if (data.difficulty) {
          setTrueLevel(data.difficulty);
          localStorage.setItem('userDifficulty', data.difficulty);
        }
      })
      .catch((err) => {
        console.error('Error fetching user data:', err);
      });
  }, [userName]);

  // Labels for display
  const levelLabels = {
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
  };

  // Calculate counts for each difficulty
  const easy = progress[selectedLang]?.easy?.length || 0;
  const medium = progress[selectedLang]?.medium?.length || 0;
  const hard = progress[selectedLang]?.hard?.length || 0;
  const falafels = easy + medium + hard;

  // Check if each level is complete
  const easyDone = easy >= MAX_QUESTIONS;
  const mediumDone = medium >= MAX_QUESTIONS;
  const hardDone = hard >= MAX_QUESTIONS;

  // Choose appropriate level image based on gender and completion
  let levelImage;
  if (gender === 'female') {
    if (easyDone && mediumDone && hardDone) levelImage = lvl3girl;
    else if (easyDone && mediumDone) levelImage = lvl2girl;
    else if (easyDone) levelImage = lvl1girl;
    else levelImage = lvl0girl;
  } else {
    if (easyDone && mediumDone && hardDone) levelImage = lvl3;
    else if (easyDone && mediumDone) levelImage = lvl2;
    else if (easyDone) levelImage = lvl1;
    else levelImage = lvl0;
  }

  // Calculate percentage width for progress bar
  const getPercent = (val) => `${(val / MAX_QUESTIONS) * 100}%`;

  return (
    <div
      className="min-h-screen bg-blue-100 text-black dark:bg-gray-900 dark:text-white transition-colors duration-300 p-6"
      dir="rtl"
    >
      {/* Display level image and selected level label */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={levelImage}
          alt="רמת שחקן"
          className="w-48 h-auto rounded-full border-4 border-blue-300 shadow-xl"
        />
        <p className="text-xl mt-1 font-bold text-indigo-700 dark:text-indigo-300">
          הרמה הנבחרת היא: {levelLabels[trueLevel]}
        </p>
      </div>

      {/* Greeting based on gender */}
      <p className="text-center text-lg text-gray-600 dark:text-gray-300 mb-6">
        {gender === 'female' ? 'ברוכה הבאה' : 'ברוך הבא'}, {userName} 👋
      </p>

      {/* Display progress cards for each difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {/* Easy card */}
        <div className="p-4 bg-green-100 dark:bg-green-800 rounded shadow text-center">
          <p className="font-bold text-lg">🔰 קל</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            {/* Progress bar fill */}
            <div
              className="h-3 bg-green-500 rounded"
              style={{ width: getPercent(easy) }}
            />
          </div>
          <p className="mt-2">
            {easy} מתוך {MAX_QUESTIONS} (נותרו {MAX_QUESTIONS - easy})
          </p>
        </div>

        {/* Medium card */}
        <div className="p-4 bg-yellow-100 dark:bg-yellow-700 rounded shadow text-center">
          <p className="font-bold text-lg">⚔️ בינוני</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div
              className="h-3 bg-yellow-500 rounded"
              style={{ width: getPercent(medium) }}
            />
          </div>
          <p className="mt-2">
            {medium} מתוך {MAX_QUESTIONS} (נותרו {MAX_QUESTIONS - medium})
          </p>
        </div>

        {/* Hard card */}
        <div className="p-4 bg-red-100 dark:bg-red-700 rounded shadow text-center">
          <p className="font-bold text-lg">🔥 קשה</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div
              className="h-3 bg-red-500 rounded"
              style={{ width: getPercent(hard) }}
            />
          </div>
          <p className="mt-2">
            {hard} מתוך {MAX_QUESTIONS} (נותרו {MAX_QUESTIONS - hard})
          </p>
        </div>
      </div>

      {/* Total falafel count */}
      <div className="text-center mt-6 text-lg text-gray-700 dark:text-gray-300">
        🥙 סה״כ פלאפלים שנאספו: <span className="font-bold">{falafels}</span>
      </div>

      {/* Show badge if all levels complete */}
      {easyDone && mediumDone && hardDone && (
        <div className="mt-6 max-w-md mx-auto p-4 bg-green-200 dark:bg-green-700 rounded text-center shadow text-xl font-semibold text-green-900 dark:text-green-100">
          🏆 כל הכבוד! השלמת את כל השלבים!
        </div>
      )}

      {/* Back to Home button */}
      <div className="flex justify-center mt-10">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          ← חזרה לדף הבית
        </button>
      </div>
    </div>
  );
}

export default Progress;
