// src/components/Home.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const timeoutRef = useRef(null);

  const [userName, setUserName] = useState(() => localStorage.getItem('userName'));
  const [uid, setUid] = useState(() => localStorage.getItem('userUID'));
  const [gender, setGender] = useState(() => localStorage.getItem('userGender') || 'other');

  useEffect(() => {
    if (document.activeElement) {
      document.activeElement.blur();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userName');
    localStorage.removeItem('userUID');
    localStorage.removeItem('userLang');
    localStorage.removeItem('userDifficulty');
    localStorage.removeItem('userGender');

    setUid(null);
    setGender(null);
    setUserName(null);

    setShowToast(true);
    navigate('/');

    timeoutRef.current = setTimeout(() => {
      setShowToast(false);
      timeoutRef.current = null;
    }, 2500);
  };

  const goToLogin = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    navigate('/login');
  };

  const renderWelcome = () => {
    if (!uid) {
      return (
        <>
          {gender === 'female' ? 'ברוכה הבאה' : '!ברוך הבא'} ל־
          <span className="text-blue-700 dark:text-blue-400">Hebrew Go 🎓</span>
        </>
      );
    }
    return (
      <>
        {gender === 'female' ? 'ברוכה הבאה' : 'ברוך הבא'}{' '}
        <span className="text-blue-700 dark:text-blue-400">{userName || 'משתמש'} 🎓</span>
      </>
    );
  };

  return (
    <div className="min-h-screen w-full bg-blue-100 dark:bg-gray-900 flex items-center justify-center p-6">
      <div dir="rtl" className="w-full max-w-4xl px-6 py-6 flex flex-col items-center text-center space-y-6">
        <img
          src="/images/logo.png"
          alt="Hebrew Go Logo"
          className="h-60 sm:h-64 md:h-72 bg-white p-4 rounded-xl shadow-lg transition-transform duration-500 hover:scale-105"
        />

        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
          {renderWelcome()}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {uid ? (
            <>
              <button
                onClick={() => navigate('/progress')}
                className="w-full h-16 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-xl shadow-md transition-all"
              >
                📊 צפייה בהתקדמות
              </button>
              <button
                onClick={() => navigate('/questions')}
                className="w-full h-16 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-md transition-all"
              >
                🚀 התחל משחק
              </button>
              <button
                onClick={handleLogout}
                className="w-full h-16 bg-red-500 hover:bg-red-600 text-white text-lg font-semibold rounded-xl shadow-md transition-all"
              >
                🔒 התנתק
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="w-full h-16 bg-yellow-400 hover:bg-yellow-500 text-white text-lg font-semibold rounded-xl shadow-md transition-all"
              >
                ⚙️ הגדרות
              </button>
            </>
          ) : (
            <button
              onClick={goToLogin}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xl font-bold rounded-full shadow-lg transition-transform duration-300 transform hover:scale-105 col-span-1 sm:col-span-2"
            >
              🔑 התחברות
            </button>
          )}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg text-lg z-50">
          ✅ התנתקת בהצלחה!
        </div>
      )}
    </div>
  );
}

export default Home;
