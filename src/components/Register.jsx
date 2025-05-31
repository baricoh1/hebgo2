import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaLock, FaVenusMars, FaLanguage } from 'react-icons/fa';
import { getDatabase, ref, set } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

function Register() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('other');
  const [lang, setLang] = useState('us');
  const navigate = useNavigate();

  const defaultProgress = {
    us: { easy: [], medium: [], hard: [] },
    es: { easy: [], medium: [], hard: [] },
    ru: { easy: [], medium: [], hard: [] }
  };

  const handleRegister = async () => {
    if (!userName || !password) {
      alert('אנא מלא שם משתמש וסיסמה.');
      return;
    }

    try {
      const auth = getAuth();
      const email = `${userName}@fake.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const db = getDatabase();
      await set(ref(db, 'users/' + userName), {
        gender,
        progress: defaultProgress,
        difficulty: 'easy'
      });

      alert('✅ נרשמת בהצלחה!');
      localStorage.setItem('userName', userName);
      localStorage.setItem('userLang', lang);
      localStorage.setItem('userDifficulty', 'easy');
      navigate('/placement');
    } catch (err) {
      console.error('Registration error:', err);
      alert('שגיאה בהרשמה: ' + err.message);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-blue-100 to-blue-200 p-6">
      <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-blue-200 rounded-3xl shadow-2xl p-10 space-y-8 transition-all duration-300">
        <h1 className="text-4xl font-bold text-center text-blue-700">הרשמה</h1>

        <div className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-400 transition">
              <FaUserAlt className="text-gray-400 me-3" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-gray-800"
                placeholder="הקלד שם משתמש"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-400 transition">
              <FaLock className="text-gray-400 me-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-gray-800"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מין</label>
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 py-3">
              <FaVenusMars className="text-gray-400 me-3" />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-gray-800"
              >
                <option value="male">זכר</option>
                <option value="female">נקבה</option>
                <option value="other">אחר</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שפה מועדפת</label>
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 py-3">
              <FaLanguage className="text-gray-400 me-3" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-gray-800"
              >
                <option value="us">English</option>
                <option value="es">Español</option>
                <option value="ru">Русский</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRegister}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-md transition-all duration-300"
          >
            הירשם
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 text-sm text-blue-600 hover:underline text-center"
          >
            כבר יש לי משתמש ← התחבר
          </button>

        </div>
      </div>
    </div>
  );
}

export default Register;
