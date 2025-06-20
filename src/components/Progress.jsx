// Import React and hooks, navigation, and progress data service
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProgressData } from '../services/ProgressService';

// Import character images for different levels and genders
const lvl0 = '/images/lvl0.png';
const lvl1 = '/images/lvl1.png';
const lvl2 = '/images/lvl2.png';
const lvl3 = '/images/lvl3.png';
const lvl0girl = '/images/lvl0girl.png';
const lvl1girl = '/images/lvl1girl.png';
const lvl2girl = '/images/lvl2girl.png';
const lvl3girl = '/images/lvl3girl.png';

function Progress() {
  // Define the maximum number of questions per level
  const MAX_QUESTIONS = 20;

  const navigate = useNavigate();

  // User-related states
  const [userName, setUserName] = useState(null);
  const [gender, setGender] = useState('other');
  const [trueLevel, setTrueLevel] = useState('easy');
  const [selectedLang, setSelectedLang] = useState('us');

  // State to store progress per language and difficulty level
  const [progress, setProgress] = useState({
    us: { easy: [], medium: [], hard: [] },
    es: { easy: [], medium: [], hard: [] },
    ru: { easy: [], medium: [], hard: [] },
  });

  // Fetch user progress data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const uid = localStorage.getItem('userUID');
      if (!uid) return;

      try {
        const data = await getUserProgressData(uid);
        setUserName(data.userName);
        setGender(data.gender);
        setTrueLevel(data.difficulty);
        setSelectedLang(data.language);
        setProgress(data.progress);
      } catch (err) {
        console.error('Error fetching user progress:', err);
      }
    };

    fetchUserData();
  }, []);

  // Labels for difficulty levels (translated to Hebrew)
  const levelLabels = {
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
  };

  // Extract progress data for the selected language
  const easy = progress[selectedLang]?.easy?.length || 0;
  const medium = progress[selectedLang]?.medium?.length || 0;
  const hard = progress[selectedLang]?.hard?.length || 0;

  // Total number of completed questions
  const falafels = easy + medium + hard;

  // Check if user has completed each difficulty level
  const easyDone = easy >= MAX_QUESTIONS;
  const mediumDone = medium >= MAX_QUESTIONS;
  const hardDone = hard >= MAX_QUESTIONS;

  // Choose appropriate image based on gender and level completion
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

  // Helper function to convert number to percent string
  const getPercent = (val) => `${(val / MAX_QUESTIONS) * 100}%`;

  return (
    <div className="min-h-screen bg-blue-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300 p-6" dir="rtl">
      
      {/* Avatar and current level display */}
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

      {/* Welcome message */}
      <p className="text-center text-lg text-gray-600 dark:text-gray-300 mb-6">
        {gender === 'female' ? 'ברוכה הבאה' : 'ברוך הבא'}, {userName} 👋
      </p>

      {/* Progress indicators for each level */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        
        {/* Easy level progress */}
        <div className="p-4 bg-green-100 dark:bg-green-800 rounded shadow text-center">
          <p className="font-bold text-lg">🔰 קל</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div className="h-3 bg-green-500 rounded" style={{ width: getPercent(easy) }} />
          </div>
          <p className="mt-2">
            {easy} מתוך {MAX_QUESTIONS} (נותרו {Math.max(0, MAX_QUESTIONS - easy)})
          </p>
        </div>

        {/* Medium level progress */}
        <div className="p-4 bg-yellow-100 dark:bg-yellow-700 rounded shadow text-center">
          <p className="font-bold text-lg">⚔️ בינוני</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div className="h-3 bg-yellow-500 rounded" style={{ width: getPercent(medium) }} />
          </div>
          <p className="mt-2">
            {medium} מתוך {MAX_QUESTIONS} (נותרו {Math.max(0, MAX_QUESTIONS - medium)})
          </p>
        </div>

        {/* Hard level progress */}
        <div className="p-4 bg-red-100 dark:bg-red-700 rounded shadow text-center">
          <p className="font-bold text-lg">🔥 קשה</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div className="h-3 bg-red-500 rounded" style={{ width: getPercent(hard) }} />
          </div>
          <p className="mt-2">
            {hard} מתוך {MAX_QUESTIONS} (נותרו {Math.max(0, MAX_QUESTIONS - hard)})
          </p>
        </div>
      </div>

      {/* Total progress summary */}
      <div className="text-center mt-6 text-lg text-gray-700 dark:text-gray-300">
        🥙 סה״כ פלאפלים שנאספו: <span className="font-bold">{falafels}</span>
      </div>

      {/* Congratulatory message if all levels are completed */}
      {easyDone && mediumDone && hardDone && (
        <div className="mt-6 max-w-md mx-auto p-4 bg-green-200 dark:bg-green-700 rounded text-center shadow text-xl font-semibold text-green-900 dark:text-green-100">
          🏆 כל הכבוד! השלמת את כל השלבים!
        </div>
      )}

      {/* Navigation button back to homepage */}
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
