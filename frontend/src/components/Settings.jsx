import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

function Settings() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('us');
  const [difficulty, setDifficulty] = useState('easy');

  useEffect(() => {
    const savedLang = localStorage.getItem('userLang') || 'us';
    const savedDifficulty = localStorage.getItem('userDifficulty') || 'easy';
    setLang(savedLang);
    setDifficulty(savedDifficulty);
  }, []);

  const saveSettings = async () => {
    localStorage.setItem('userLang', lang);
    localStorage.setItem('userDifficulty', difficulty);

    const userName = localStorage.getItem('userName');
    if (userName) {
      try {
        await setDoc(doc(db, 'users', userName), {
          difficulty: difficulty,
          language: lang,
        }, { merge: true });
      } catch (err) {
        console.error('Failed to update user settings in DB:', err);
      }
    }

    alert('✅ ההגדרות נשמרו בהצלחה!');
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-blue-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300 flex items-center justify-center">
      <div dir="rtl" className="w-full max-w-2xl px-6 py-10 flex flex-col space-y-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">

        <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-700 dark:text-blue-400">
          הגדרות משתמש ⚙️
        </h1>

        <div>
          <label className="block mb-2 text-lg font-medium">בחר שפה</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full p-3 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white shadow"
          >
            <option value="us">English</option>
            <option value="es">Español</option>
            <option value="ru">Русский</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-lg font-medium">בחר רמת קושי</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full p-3 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white shadow"
          >
            <option value="easy">קל</option>
            <option value="medium">בינוני</option>
            <option value="hard">קשה</option>
          </select>
        </div>

        <button
          onClick={saveSettings}
          className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-md transition-all"
        >
          שמור הגדרות 💾
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full h-12 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-black dark:text-white rounded-lg shadow transition"
        >
          חזרה לדף הבית⬅️
        </button>
      </div>
    </div>
  );
}

export default Settings;
