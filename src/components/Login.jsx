// ✅ Login.jsx - read from Firestore, no auth module
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaLock } from 'react-icons/fa';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userName || !password) {
      alert('אנא3 מלא שם משתמש וסיסמה.');
      return;
    }

    try {
      const userRef = doc(db, 'users', userName);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) throw new Error('שם משתמש לא נמצא');

      const userData = userSnap.data();
      if (userData.password !== password) throw new Error('סיסמה שגויה');

      alert('✅ התחברות הצליחה!');
      localStorage.setItem('userName', userName);
      localStorage.setItem('userGender', userData.gender || 'other');
      localStorage.setItem('userLang', userData.lang || 'us');
      localStorage.setItem('userDifficulty', userData.difficulty || 'easy');

      navigate('/');
    } catch (err) {
      alert('שגיאה: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-blue-100 to-blue-200 p-6 rtl">
      <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-blue-200 rounded-3xl shadow-2xl p-10 space-y-8">
        <h1 className="text-4xl font-bold text-center text-blue-700">התחברות</h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 py-3">
              <FaUserAlt className="text-gray-400 me-3" />
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="flex-1 bg-transparent focus:outline-none text-gray-800" placeholder="הקלד שם משתמש" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 py-3">
              <FaLock className="text-gray-400 me-3" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 bg-transparent focus:outline-none text-gray-800" placeholder="••••••••" required />
            </div>
          </div>

          <div className="flex gap-4 rtl:space-x-reverse">
            <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-md">
              התחבר
            </button>
            <button type="button" onClick={() => navigate('/register')} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-xl shadow-md">
              הרשמה
            </button>
          </div>
        </form>

        <button onClick={() => navigate('/')} className="w-full py-3 mt-4 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl shadow-sm">
          ← חזרה לדף הבית
        </button>
      </div>
    </div>
  );
}

export default Login;
