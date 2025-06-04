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

  // 1. שליפת שם המשתמש והמגדר מתוך localStorage (או ברירת מחדל)
  const [userName] = useState(() => localStorage.getItem('userName') || 'משתמש');
  const [gender, setGender] = useState(() => localStorage.getItem('userGender') || 'other');

  // 2. קביעת הרמה הישירה מתוך localStorage.userDifficulty
  //    ברירת מחדל "easy" אם לא קיים
  const [trueLevel, setTrueLevel] = useState(
    () => localStorage.getItem('userDifficulty') || 'easy'
  );

  // 3. מאזין לאירוע storage, כדי לעדכן trueLevel ברגע שמישהו משנה localStorage.userDifficulty
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'userDifficulty') {
        setTrueLevel(e.newValue || 'easy');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // 4. במידה ויש לנו ב־Firestore שדה data.gender, נטען אותו ונעדכן גם בלוקאל
  useEffect(() => {
    async function fetchUserData() {
      if (!userName) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userName));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.gender) {
            setGender(data.gender);
            localStorage.setItem('userGender', data.gender);
          }
          // אם רוצים גם לעדכן את userDifficulty מתוך DB, תוכלו לעשות כאן:
          // if (data.difficulty) {
          //   localStorage.setItem('userDifficulty', data.difficulty);
          //   setTrueLevel(data.difficulty);
          // }
        }
      } catch (err) {
        console.error('Error fetching user document:', err);
      }
    }
    fetchUserData();
  }, [userName]);

  // 5. תוויות בעברית לכל רמה
  const levelLabels = {
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
  };

  // 6. בחירת תמונה בהתאם לרמה ולמין המשתמש
  let levelImage;
  if (gender === 'female') {
    if (trueLevel === 'hard')   levelImage = lvl3girl;
    else if (trueLevel === 'medium') levelImage = lvl2girl;
    else                           levelImage = lvl1girl;
  } else {
    if (trueLevel === 'hard')   levelImage = lvl3;
    else if (trueLevel === 'medium') levelImage = lvl2;
    else                           levelImage = lvl1;
  }

  // 7. (אופציונלי) תצוגת פסים אם תרצה להראות את ההתקדמות מתוך progress:
  //    נטען רק כדי להציג פסי “קל/בינוני/קשה” (לא משפיע על choice של trueLevel)
  const [progress, setProgress] = useState({ us: { easy: [], medium: [], hard: [] } });
  useEffect(() => {
    const stored = localStorage.getItem('userProgress');
    if (stored) {
      setProgress(JSON.parse(stored));
    }
  }, []);

  const easyCount   = progress.us.easy.length   || 0;
  const mediumCount = progress.us.medium.length || 0;
  const hardCount   = progress.us.hard.length   || 0;

  const getPercent = (val) => `${(val / 20) * 100}%`;

  return (
    <div
      className="min-h-screen bg-blue-100 text-black dark:bg-gray-900 dark:text-white transition-colors duration-300 p-6"
      dir="rtl"
    >
      {/* ---------- חלק עליון: תמונה וטקסט ---------- */}
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

      {/* ---------- ברכה אישית ---------- */}
      <p className="text-center text-lg text-gray-600 dark:text-gray-300 mb-6">
        {gender === 'female' ? 'ברוכה הבאה' : 'ברוך הבא'}, {userName} 👋
      </p>

      {/* ---------- פסים גרפיים להצגת התקדמות בכל רמה ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {/* פס קל */}
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

        {/* פס בינוני */}
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

        {/* פס קשה */}
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

      {/* ---------- כפתור חזרה לדף הבית ---------- */}
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
