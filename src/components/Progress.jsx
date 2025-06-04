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
  const MAX_QUESTIONS = 20;
  const navigate = useNavigate();

  // לוקח שם משתמש ו־gender מה־localStorage
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || null);
  const [gender, setGender] = useState(() => localStorage.getItem('userGender') || 'other');

  // שפת הממשק הנבחרת (us/es/ru)
  const [selectedLang, setSelectedLang] = useState('us');

  // ברירת המחדל לפרוגרס
  const defaultProgress = {
    us: { easy: [], medium: [], hard: [] },
    es: { easy: [], medium: [], hard: [] },
    ru: { easy: [], medium: [], hard: [] },
  };

  // ה־state שבו נשמרת כל תיבת ה־progress
  const [progress, setProgress] = useState(() => {
    try {
      const stored = localStorage.getItem('userProgress');
      return stored ? JSON.parse(stored) : defaultProgress;
    } catch {
      return defaultProgress;
    }
  });

  // בפעם הראשונה ובכל פעם ששם המשתמש משתנה, נטען מה־Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userName) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userName));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // אם יש פרוגרס ב־DB, מעדכנים גם ב־state וגם ב־localStorage
          if (data.progress) {
            setProgress(data.progress);
            localStorage.setItem('userProgress', JSON.stringify(data.progress));
          }
          // אם יש gender בשכבת ה־DB, נשמור גם בלוקאל
          if (data.gender) {
            setGender(data.gender);
            localStorage.setItem('userGender', data.gender);
          }
          // כאן לא קוראים ל־data.difficulty, כי נחשב את הרמה דינמית מתוך פרוגרס
        }
      } catch (err) {
        console.error('Error fetching user document:', err);
      }
    };
    fetchUserData();
  }, [userName]);

  // פונקציה שמחזירה "easy"/"medium"/"hard" בהתאם למספר התשובות הנכונות
  const getComputedLevel = () => {
    // לוודא ש־progress נמצא בסקופ של הקומפוננטה
    const easyCount = progress[selectedLang]?.easy?.length || 0;
    const mediumCount = progress[selectedLang]?.medium?.length || 0;
    const hardCount = progress[selectedLang]?.hard?.length || 0;

    if (hardCount >= MAX_QUESTIONS) return 'hard';
    if (mediumCount >= MAX_QUESTIONS) return 'medium';
    if (easyCount >= MAX_QUESTIONS) return 'easy';
    return 'easy';
  };

  // בונים state שנקרא trueLevel, ומעדכנים אותו בכל פעם שה־progress או השפה ישתנו
  const [trueLevel, setTrueLevel] = useState(getComputedLevel());
  useEffect(() => {
    setTrueLevel(getComputedLevel());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, selectedLang]);

  // תוויות בעברית לכל רמה
  const levelLabels = {
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
  };

  // מחושבים מספר הפרוגרס בפועל
  const easy = progress[selectedLang]?.easy?.length || 0;
  const medium = progress[selectedLang]?.medium?.length || 0;
  const hard = progress[selectedLang]?.hard?.length || 0;
  const falafels = easy + medium + hard;

  const easyDone = easy >= MAX_QUESTIONS;
  const mediumDone = medium >= MAX_QUESTIONS;
  const hardDone = hard >= MAX_QUESTIONS;

  // בוחרים תמונה בהתאם לאם המשתמש אישה או לא, וגם לפי ה־Done של כל רמה
  let levelImage;
  if (gender === 'female') {
    if (hardDone) levelImage = lvl3girl;
    else if (mediumDone) levelImage = lvl2girl;
    else if (easyDone) levelImage = lvl1girl;
    else levelImage = lvl0girl;
  } else {
    if (hardDone) levelImage = lvl3;
    else if (mediumDone) levelImage = lvl2;
    else if (easyDone) levelImage = lvl1;
    else levelImage = lvl0;
  }

  // פונקציה לעיגול באחוזים עבור פס התקדמות
  const getPercent = (val) => `${(val / MAX_QUESTIONS) * 100}%`;

  return (
    <div
      className="min-h-screen bg-blue-100 text-black dark:bg-gray-900 dark:text-white transition-colors duration-300 p-6"
      dir="rtl"
    >
      {/* חלק עליון: תמונת רמה וטקסט */}
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

      {/* ברכה אישית */}
      <p className="text-center text-lg text-gray-600 dark:text-gray-300 mb-6">
        {gender === 'female' ? 'ברוכה הבאה' : 'ברוך הבא'}, {userName} 👋
      </p>

      {/* פסים גרפיים לתצוגת התקדמות לכל רמה */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {/* קל */}
        <div className="p-4 bg-green-100 dark:bg-green-800 rounded shadow text-center">
          <p className="font-bold text-lg">🔰 קל</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div className="h-3 bg-green-500 rounded" style={{ width: getPercent(easy) }} />
          </div>
          <p className="mt-2">
            {easy} מתוך {MAX_QUESTIONS} (נותרו {MAX_QUESTIONS - easy})
          </p>
        </div>

        {/* בינוני */}
        <div className="p-4 bg-yellow-100 dark:bg-yellow-700 rounded shadow text-center">
          <p className="font-bold text-lg">⚔️ בינוני</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div className="h-3 bg-yellow-500 rounded" style={{ width: getPercent(medium) }} />
          </div>
          <p className="mt-2">
            {medium} מתוך {MAX_QUESTIONS} (נותרו {MAX_QUESTIONS - medium})
          </p>
        </div>

        {/* קשה */}
        <div className="p-4 bg-red-100 dark:bg-red-700 rounded shadow text-center">
          <p className="font-bold text-lg">🔥 קשה</p>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div className="h-3 bg-red-500 rounded" style={{ width: getPercent(hard) }} />
          </div>
          <p className="mt-2">
            {hard} מתוך {MAX_QUESTIONS} (נותרו {MAX_QUESTIONS - hard})
          </p>
        </div>
      </div>

      {/* סה"כ פלאפלים (סך כל התשובות הנכונות) */}
      <div className="text-center mt-6 text-lg text-gray-700 dark:text-gray-300">
        🥙 סה״כ פלאפלים שנאספו: <span className="font-bold">{falafels}</span>
      </div>

      {/* הודעת סיום כאשר השלימו את כל הרמות */}
      {easyDone && mediumDone && hardDone && (
        <div className="mt-6 max-w-md mx-auto p-4 bg-green-200 dark:bg-green-700 rounded text-center shadow text-xl font-semibold text-green-900 dark:text-green-100">
          🏆 כל הכבוד! השלמת את כל השלבים!
        </div>
      )}

      {/* כפתור לחזרה לדף הבית */}
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
