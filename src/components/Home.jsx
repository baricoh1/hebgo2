// src/components/Home.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../logo.png';

import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebase'; // assuming firebase is initialized in firebase.js

const db = getFirestore(app);

function Home() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const timeoutRef = useRef(null);

  const [userName, setUserName] = useState(() => localStorage.getItem('userName'));
  const [gender, setGender] = useState(() => localStorage.getItem('userGender') || null);

  useEffect(() => {
    if (userName && !gender) {
      const fetchUser = async () => {
        try {
          const docRef = doc(db, 'users', userName);
          const userSnap = await getDoc(docRef);
          if (userSnap.exists()) {
            const g = userSnap.data().gender || 'other';
            setGender(g);
            localStorage.setItem('userGender', g);
          } else {
            setGender('other');
            localStorage.setItem('userGender', 'other');
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          setGender('other');
          localStorage.setItem('userGender', 'other');
        }
      };

      fetchUser();
    }
  }, [userName, gender]);

  useEffect(() => {
    if (document.activeElement) {
      document.activeElement.blur();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userName');
    localStorage.removeItem('userLang');
    localStorage.removeItem('userDifficulty');
    localStorage.removeItem('userGender');

    setUserName(null);
    setGender(null);

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
    if (!userName) {
      return (
        <>
          {gender === 'female' ? 'ברוכה הבאה' : 'ברוך הבא'} ל־
          <span className="text-blue-700">Hebrew Go 🎓</span>
        </>
      );
    }
    return (
      <>
        {gender === 'female' ? 'ברוכה הבאה' : 'ברוך הבא'}{' '}
        <span className="text-blue-700">{userName} 🎓</span>
      </>
    );
  };

  return (
    <div className="min-h-screen w-full bg-blue-100 flex items-center justify-center p-6">
      <div dir="rtl" className="w-full max-w-4xl px-6 py-6 flex flex-col items-center text-center space-y-6">
        <img
          src={logo}
          alt="Hebrew Go Logo"
          className="h-60 sm:h-64 md:h-72 bg-white p-4 rounded-xl shadow-lg transition-transform duration-500 hover:scale-105"
        />

        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
          {renderWelcome()}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {userName ? (
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
