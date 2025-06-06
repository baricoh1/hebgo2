// src/components/Progress.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

import lvl0 from '../images/lvl0.png';
import lvl1 from '../images/lvl1.png';
import lvl2 from '../images/lvl2.png';
import lvl3 from '../images/lvl3.png';
import lvl0girl from '../images/lvl0girl.png';
import lvl1girl from '../images/lvl1girl.png';
import lvl2girl from '../images/lvl2girl.png';
import lvl3girl from '../images/lvl3girl.png';

function Progress() {
  const navigate = useNavigate();

  // 1. Retrieve userName and gender from localStorage (or default)
  const [userName] = useState(() => localStorage.getItem('userName') || 'User');
  const [gender, setGender] = useState(() => localStorage.getItem('userGender') || 'other');

  // 2. Build the per-user localStorage keys:
  //    - PROGRESS_KEY holds progress arrays per category (easy, medium, hard)
  //    - DIFF_KEY holds the current difficulty string ("easy","medium","hard")
  const PROGRESS_KEY = `userProgress_${userName}`;
  const DIFF_KEY     = `userDifficulty_${userName}`;

  // 3. trueLevel comes from localStorage.userDifficulty_<userName>, default "easy"
  const [trueLevel, setTrueLevel] = useState(
    () => localStorage.getItem(DIFF_KEY) || 'easy'
  );

  // 4. Whenever localStorage.userDifficulty_<userName> changes, update trueLevel
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === DIFF_KEY) {
        setTrueLevel(e.newValue || 'easy');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [DIFF_KEY]);

  // 5. Optionally fetch gender and (if stored) difficulty from Firestore, then sync to localStorage
  useEffect(() => {
    async function fetchUserData() {
      if (!userName) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userName));
        if (!userDoc.exists()) return;
        const data = userDoc.data();
        if (data.gender) {
          setGender(data.gender);
          localStorage.setItem('userGender', data.gender);
        }
        if (data.difficulty) {
          localStorage.setItem(DIFF_KEY, data.difficulty);
          setTrueLevel(data.difficulty);
        }
      } catch (err) {
        console.error('Error fetching user document:', err);
      }
    }
    fetchUserData();
  }, [userName, DIFF_KEY]);

  // 6. Map English keys to Hebrew labels
  const levelLabels = {
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
  };

  // 7. Choose the correct image based on trueLevel + gender
  let levelImage;
  if (gender === 'female') {
    if (trueLevel === 'hard') levelImage = lvl3girl;
    else if (trueLevel === 'medium') levelImage = lvl2girl;
    else levelImage = lvl1girl;
  } else {
    if (trueLevel === 'hard') levelImage = lvl3;
    else if (trueLevel === 'medium') levelImage = lvl2;
    else levelImage = lvl1;
  }

  // 8. Load progress from localStorage under PROGRESS_KEY,
  //    which must be an object shaped like { us: { easy:[], medium:[], hard:[] }, ... }
  //    Default empty for “us” if nothing’s present
  const [progress, setProgress] = useState({
    us: { easy: [], medium: [], hard: [] },
  });

  useEffect(() => {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.us && typeof parsed.us === 'object') {
          setProgress((prev) => ({ ...prev, us: parsed.us }));
        }
      } catch {
        // If parse fails, ignore and keep default
      }
    }
  }, [PROGRESS_KEY]);

  // 9. Safely compute counts with optional chaining + fallback to empty array
  const easyCount = (progress.us?.easy ?? []).length;
  const mediumCount = (progress.us?.medium ?? []).length;
  const hardCount = (progress.us?.hard ?? []).length;

  // 10. Helper to get width percentage of a 20-question bar
  const getPercent = (val) => `${(val / 20) * 100}%`;

  return (
    <div
      className="min-h-screen bg-blue-100 text-black dark:bg-gray-900 dark:text-white transition-colors duration-300 p-6"
      dir="rtl"
    >
      {/* --- Top section: level image + label --- */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={levelImage}
          alt="Player Level"
          className="w-48 h-auto rounded-full border-4 border-blue-300 shadow-xl"
        />
        <p className="text-xl mt-1 font-bold text-indigo-700 dark:text-indigo-300">
          הרמה הנבחרת היא: {levelLabels[trueLevel]}
        </p>
      </div>

      {/* --- Welcome message --- */}
      <p className="text-center text-lg text-gray-600 dark:text-gray-300 mb-6">
        {gender === 'female' ? 'ברוכה הבאה' : 'ברוך הבא'}, {userName} 👋
      </p>

      {/* --- Progress bars for Easy/Medium/Hard --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {/* Easy Bar */}
        <div className="p-4 bg-green-100 dark:bg-green-800 rounded shadow text-center">
          <p className="font-bold text-lg">🔰 קל</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div
              className="h-3 bg-green-500 rounded"
              style={{ width: getPercent(easyCount) }}
            />
          </div>
          <p className="mt-2">
            {easyCount} מתוך 20 (נותרו {20 - easyCount})
          </p>
        </div>

        {/* Medium Bar */}
        <div className="p-4 bg-yellow-100 dark:bg-yellow-700 rounded shadow text-center">
          <p className="font-bold text-lg">⚔️ בינוני</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div
              className="h-3 bg-yellow-500 rounded"
              style={{ width: getPercent(mediumCount) }}
            />
          </div>
          <p className="mt-2">
            {mediumCount} מתוך 20 (נותרו {20 - mediumCount})
          </p>
        </div>

        {/* Hard Bar */}
        <div className="p-4 bg-red-100 dark:bg-red-700 rounded shadow text-center">
          <p className="font-bold text-lg">🔥 קשה</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div
              className="h-3 bg-red-500 rounded"
              style={{ width: getPercent(hardCount) }}
            />
          </div>
          <p className="mt-2">
            {hardCount} מתוך 20 (נותרו {20 - hardCount})
          </p>
        </div>
      </div>

      {/* --- Back to Home button --- */}
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
