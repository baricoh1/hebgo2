import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUserSettingsToDB } from '../services/SettingsService';

function Settings() {
  const navigate = useNavigate(); // Hook for navigation
  const [lang, setLang] = useState('us'); // State for selected language
  const [difficulty, setDifficulty] = useState('easy'); // State for selected difficulty

  // Load saved settings from localStorage when component mounts
  useEffect(() => {
    const savedLang = localStorage.getItem('userLang') || 'us';
    const savedDifficulty = localStorage.getItem('userDifficulty') || 'easy';
    setLang(savedLang);
    setDifficulty(savedDifficulty);
  }, []);

  // Save user settings both locally and to the database
  const saveSettings = async () => {
    // Save to localStorage
    localStorage.setItem('userLang', lang);
    localStorage.setItem('userDifficulty', difficulty);

    // Save to DB if user is logged in
    const uid = localStorage.getItem('userUID');
    if (uid) {
      try {
        await saveUserSettingsToDB(uid, lang, difficulty);
      } catch (err) {
        console.error('Failed to update user settings in DB:', err);
      }
    }

    // Show confirmation and return to home
    alert('✅ ההגדרות נשמרו בהצלחה!');
    navigate('/');
  };

  return (
    // Main container with RTL layout and dark/light styling
    <div className="min-h-screen w-full bg-blue-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300 flex items-center justify-center">
      <div dir="rtl" className="w-full max-w-2xl px-6 py-10 flex flex-col space-y-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-700 dark:text-blue-400">
          הגדרות משתמש ⚙️
        </h1>

        {/* Language selection */}
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

        {/* Difficulty level selection */}
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

        {/* Save button */}
        <button
          onClick={saveSettings}
          className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-md transition-all"
        >
          שמור הגדרות 💾
        </button>

        {/* Back to home button */}
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