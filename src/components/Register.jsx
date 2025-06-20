import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaLock, FaVenusMars, FaLanguage } from 'react-icons/fa';
import { registerUser } from '../services/AuthService';

function Register() {
  // State variables for form inputs
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('other'); // Default gender
  const [lang, setLang] = useState('us'); // Default language
  const navigate = useNavigate(); // Navigation hook from React Router

  // Handles the registration process
  const handleRegister = async () => {
    // Basic validation: Check if required fields are filled
    if (!email || !password || !username) {
      alert('אנא מלא אימייל, שם משתמש וסיסמה.');
      return;
    }

    try {
      // Register the user via the backend service
      const userData = await registerUser(email, password, username, gender, lang);

      // Store returned user data in localStorage
      localStorage.setItem('userUID', userData.uid);
      localStorage.setItem('userGender', gender);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', userData.username);
      localStorage.setItem('userLang', userData.lang);
      localStorage.setItem('userDifficulty', userData.difficulty);

      // Notify success and navigate to placement page
      alert('✅ נרשמת בהצלחה!');
      navigate('/placement');
    } catch (err) {
      // Handle registration errors
      console.error('Registration error:', err);
      alert('שגיאה בהרשמה: ' + err.message);
    }
  };

  return (
    // Main container with background and padding
    <div dir="rtl" className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-cyan-100 via-blue-100 to-blue-200 
      dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6">

      {/* Card container for the registration form */}
      <div className="w-full max-w-md 
        bg-white/60 dark:bg-gray-800/70 
        backdrop-blur-xl border border-blue-200 dark:border-gray-700 
        rounded-3xl shadow-2xl p-10 space-y-8 text-gray-900 dark:text-white">

        {/* Title */}
        <h1 className="text-4xl font-bold text-center text-blue-700 dark:text-blue-300">
          הרשמה
        </h1>

        {/* Registration form */}
        <div className="space-y-5">
          {/* Email input field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">אימייל</label>
            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3">
              <FaUserAlt className="text-gray-400 me-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-white"
                placeholder="example@email.com"
              />
            </div>
          </div>

          {/* Username input field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">שם משתמש</label>
            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3">
              <FaUserAlt className="text-gray-400 me-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-white"
                placeholder="הקלד שם משתמש"
              />
            </div>
          </div>

          {/* Password input field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סיסמה</label>
            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3">
              <FaLock className="text-gray-400 me-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Gender selection dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מין</label>
            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3">
              <FaVenusMars className="text-gray-400 me-3" />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-white"
              >
                <option value="male">זכר</option>
                <option value="female">נקבה</option>
                <option value="other">אחר</option>
              </select>
            </div>
          </div>

          {/* Preferred language dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">שפה מועדפת</label>
            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3">
              <FaLanguage className="text-gray-400 me-3" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-white"
              >
                <option value="us">English</option>
                <option value="es">Español</option>
                <option value="ru">Русский</option>
              </select>
            </div>
          </div>

          {/* Submit registration button */}
          <button
            onClick={handleRegister}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 
            text-white font-semibold rounded-xl shadow-md transition"
          >
            הירשם
          </button>

          {/* Link to login page */}
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 text-sm text-blue-600 dark:text-blue-300 hover:underline text-center"
          >
            כבר יש לי משתמש ← התחבר
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;