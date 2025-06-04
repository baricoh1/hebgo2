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

  // 2. נניח שהשפה קבועה ל־'us'
  const [selectedLang] = useState('us');

  // 3. ברירת מחדל לפרוגרס
  const defaultProgress = {
    us: { easy: [], medium: [], hard: [] },
    es: { easy: [], medium: [], hard: [] },
    ru: { easy: [], medium: [], hard: [] },
  };

  // 4. State שמשמור את המידע של progress (מתוך localStorage או default)
  const [progress, setProgress] = useState(() => {
    try {
      const stored = localStorage.getItem('userProgress');
      return stored ? JSON.parse(stored) : defaultProgress;
    } catch {
      return defaultProgress;
    }
  });

  // 5. נטען מה־Firestore את הנתונים (progress + gender) בפעם הראשונה
  useEffect(() => {
    async function fetchUserData() {
      if (!userName) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userName));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // אם קיים data.progress נעדכן state ונשמור בלוקאל
          if (data.progress) {
            setProgress(data.progress);
            localStorage.setItem('userProgress', JSON.stringify(data.progress));
          }
          // אם קיים data.gender נעדכן אותו
          if (data.gender) {
            setGender(data.gender);
            localStorage.setItem('userGender', data.gender);
          }
        }
      } catch (err) {
        console.error('Error fetching user document:', err);
      }
    }
    fetchUserData();
  }, [userName]);

  // 6. חישוב סך כל התשובות הנכונות (קל + בינוני + קשה)
  const easyCount = progress[selectedLang]?.easy?.length   || 0;
  const mediumCount = progress[selectedLang]?.medium?.length || 0;
  const hardCount = progress[selectedLang]?.hard?.length   || 0;
  const totalCorrect = easyCount + mediumCount + hardCount;

  // 7. קביעת רמה על פי סך התשובות הנכונות:
  //    0-19 => 'easy'; 20-39 => 'medium'; 40+ => 'hard'
  const getComputedLevel = () => {
    if (totalCorrect >= 40) return 'hard';
    if (totalCorrect >= 20) return 'medium';
    return 'easy';
  };

  // 8. State של הרמה המוצגת, שמתעדכן אוטומטית כש-totalCorrect משתנה
  const [trueLevel, setTrueLevel] = useState(getComputedLevel());
  useEffect(() => {
    setTrueLevel(getComputedLevel());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCorrect]);

  // 9. תוויות עבריות לכל רמה
  const levelLabels = {
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
  };

  // 10. חישוב האם כל רמה “נספרה” מלאה (20 לנקודה למעלה בקל ובינוני, ו-40 ב-hard)
  //     לצורך הצגת אייקון התמונה, נבדוק אם full thresholds התקיימו:
  const easyDone = easyCount >= 20;
  const mediumDone = mediumCount >= 20;
  const hardDone = hardCount >= 20; // בכל רמה מאגר נפרד צריך 20, אך לרמה "'hard'" דרוש רק לצורך תמונה להראות סיום כל השלבים

  // 11. בחירת תמונה בהתאם למגדר ולמצב השלמת השלבים:
  let levelImage;
  if (gender === 'female') {
    if (totalCorrect >= 40)       levelImage = lvl3girl;
    else if (totalCorrect >= 20)  levelImage = lvl2girl;
    else                           levelImage = lvl1girl;
    // שימו לב: כאן בחרנו להראות שלב 1girl כבר ב־easy (כי 0-19). אפשר להתאים כרצונכם
  } else {
    if (totalCorrect >= 40)       levelImage = lvl3;
    else if (totalCorrect >= 20)  levelImage = lvl2;
    else                           levelImage = lvl1;
  }

  // 12. חישוב פס ההתקדמות באחוזים (לרמת קל, בינוני, קשה בנפרד)
  const getPercent = (val) => `${(val / 20) * 100}%`; // 20 תשובות לכל level בתוך פס

  return (
    <div
      className="min-h-screen bg-blue-100 text-black dark:bg-gray-900 dark:text-white transition-colors duration-300 p-6"
      dir="rtl"
    >
      {/* ---------- חלק עליון: תמונת רמה וטקסט ---------- */}
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

      {/* ---------- סה"כ פלאפלים (סך כל התשובות הנכונות) ---------- */}
      <div className="text-center mt-6 text-lg text-gray-700 dark:text-gray-300">
        🥙 סה״כ פלאפלים שנאספו: <span className="font-bold">{totalCorrect}</span>
      </div>

      {/* ---------- הודעת סיום: כאשר השלים 60 שאלות נכונות בסה״כ (3 רמות × 20) ---------- */}
      {totalCorrect >= 60 && (
        <div className="mt-6 max-w-md mx-auto p-4 bg-green-200 dark:bg-green-700 rounded text-center shadow text-xl font-semibold text-green-900 dark:text-green-100">
          🏆 כל הכבוד! השלמת את כל השלבים!
        </div>
      )}

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

  // 2. נניח שהשפה קבועה ל־'us'
  const [selectedLang] = useState('us');

  // 3. ברירת מחדל לפרוגרס
  const defaultProgress = {
    us: { easy: [], medium: [], hard: [] },
    es: { easy: [], medium: [], hard: [] },
    ru: { easy: [], medium: [], hard: [] },
  };

  // 4. State שמשמור את המידע של progress (מתוך localStorage או default)
  const [progress, setProgress] = useState(() => {
    try {
      const stored = localStorage.getItem('userProgress');
      return stored ? JSON.parse(stored) : defaultProgress;
    } catch {
      return defaultProgress;
    }
  });

  // 5. נטען מה־Firestore את הנתונים (progress + gender) בפעם הראשונה
  useEffect(() => {
    async function fetchUserData() {
      if (!userName) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userName));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // אם קיים data.progress נעדכן state ונשמור בלוקאל
          if (data.progress) {
            setProgress(data.progress);
            localStorage.setItem('userProgress', JSON.stringify(data.progress));
          }
          // אם קיים data.gender נעדכן אותו
          if (data.gender) {
            setGender(data.gender);
            localStorage.setItem('userGender', data.gender);
          }
        }
      } catch (err) {
        console.error('Error fetching user document:', err);
      }
    }
    fetchUserData();
  }, [userName]);

  // 6. חישוב סך כל התשובות הנכונות (קל + בינוני + קשה)
  const easyCount = progress[selectedLang]?.easy?.length   || 0;
  const mediumCount = progress[selectedLang]?.medium?.length || 0;
  const hardCount = progress[selectedLang]?.hard?.length   || 0;
  const totalCorrect = easyCount + mediumCount + hardCount;

  // 7. קביעת רמה על פי סך התשובות הנכונות:
  //    0-19 => 'easy'; 20-39 => 'medium'; 40+ => 'hard'
  const getComputedLevel = () => {
    if (totalCorrect >= 40) return 'hard';
    if (totalCorrect >= 20) return 'medium';
    return 'easy';
  };

  // 8. State של הרמה המוצגת, שמתעדכן אוטומטית כש-totalCorrect משתנה
  const [trueLevel, setTrueLevel] = useState(getComputedLevel());
  useEffect(() => {
    setTrueLevel(getComputedLevel());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCorrect]);

  // 9. תוויות עבריות לכל רמה
  const levelLabels = {
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
  };

  // 10. חישוב האם כל רמה “נספרה” מלאה (20 לנקודה למעלה בקל ובינוני, ו-40 ב-hard)
  //     לצורך הצגת אייקון התמונה, נבדוק אם full thresholds התקיימו:
  const easyDone = easyCount >= 20;
  const mediumDone = mediumCount >= 20;
  const hardDone = hardCount >= 20; // בכל רמה מאגר נפרד צריך 20, אך לרמה "'hard'" דרוש רק לצורך תמונה להראות סיום כל השלבים

  // 11. בחירת תמונה בהתאם למגדר ולמצב השלמת השלבים:
  let levelImage;
  if (gender === 'female') {
    if (totalCorrect >= 40)       levelImage = lvl3girl;
    else if (totalCorrect >= 20)  levelImage = lvl2girl;
    else                           levelImage = lvl1girl;
    // שימו לב: כאן בחרנו להראות שלב 1girl כבר ב־easy (כי 0-19). אפשר להתאים כרצונכם
  } else {
    if (totalCorrect >= 40)       levelImage = lvl3;
    else if (totalCorrect >= 20)  levelImage = lvl2;
    else                           levelImage = lvl1;
  }

  // 12. חישוב פס ההתקדמות באחוזים (לרמת קל, בינוני, קשה בנפרד)
  const getPercent = (val) => `${(val / 20) * 100}%`; // 20 תשובות לכל level בתוך פס

  return (
    <div
      className="min-h-screen bg-blue-100 text-black dark:bg-gray-900 dark:text-white transition-colors duration-300 p-6"
      dir="rtl"
    >
      {/* ---------- חלק עליון: תמונת רמה וטקסט ---------- */}
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

      {/* ---------- סה"כ פלאפלים (סך כל התשובות הנכונות) ---------- */}
      <div className="text-center mt-6 text-lg text-gray-700 dark:text-gray-300">
        🥙 סה״כ פלאפלים שנאספו: <span className="font-bold">{totalCorrect}</span>
      </div>

      {/* ---------- הודעת סיום: כאשר השלים 60 שאלות נכונות בסה״כ (3 רמות × 20) ---------- */}
      {totalCorrect >= 60 && (
        <div className="mt-6 max-w-md mx-auto p-4 bg-green-200 dark:bg-green-700 rounded text-center shadow text-xl font-semibold text-green-900 dark:text-green-100">
          🏆 כל הכבוד! השלמת את כל השלבים!
        </div>
      )}

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
