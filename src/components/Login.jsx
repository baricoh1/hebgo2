// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaLock } from 'react-icons/fa';

function Login() {
 
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

 
  console.log(
    "🔍 [Login] rendered. localStorage.userName =",
    localStorage.getItem('userName'),
    "localStorage.userGender =",
    localStorage.getItem('userGender')
  );


  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userName || !password) {
      alert('אנא מלא שם משתמש וסיסמה.');
      return;
    }

    try {
  
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userName, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(`התחברות נכשלה: ${data.error || res.statusText}`);
      } else {
        alert('✅ התחברות הצליחה!');

     
        localStorage.setItem('userName', userName);

     
        if (data.gender) {
          localStorage.setItem('userGender', data.gender);
          navigate('/'); 
        } else {
      
          fetch(`http://localhost:5000/api/user/${userName}`)
            .then((res2) => res2.json())
            .then((userData) => {
              
              const g = userData.gender ?? 'other';
              localStorage.setItem('userGender', g);
              navigate('/'); 
            })
            .catch((err) => {
              console.error('Error fetching gender after login:', err);
    
              localStorage.setItem('userGender', 'other');
              navigate('/');
            });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('שגיאה בשרת במהלך התחברות.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center
                  bg-gradient-to-br from-cyan-100 via-blue-100 to-blue-200 p-6 rtl"
    >
      <div
        className="w-full max-w-md bg-white/60 backdrop-blur-xl
                    border border-blue-200 rounded-3xl shadow-2xl
                    p-10 space-y-8 transition-all duration-300"
      >
        <h1 className="text-4xl font-bold text-center text-blue-700">
          התחברות
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username field */}
          <div>
            <label
              htmlFor="userInput"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              שם משתמש
            </label>
            <div
              className="flex items-center bg-white border border-gray-300
                          rounded-xl px-4 py-3 shadow-sm
                          focus-within:ring-2 focus-within:ring-blue-400 transition"
            >
              <FaUserAlt className="text-gray-400 me-3" />
              <input
                type="text"
                id="userInput"
                placeholder="הקלד שם משתמש"
                className="flex-1 bg-transparent focus:outline-none text-gray-800"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor="passInput"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              סיסמה
            </label>
            <div
              className="flex items-center bg-white border border-gray-300
                          rounded-xl px-4 py-3 shadow-sm
                          focus-within:ring-2 focus-within:ring-blue-400 transition"
            >
              <FaLock className="text-gray-400 me-3" />
              <input
                type="password"
                id="passInput"
                placeholder="הקלד סיסמה"
                className="flex-1 bg-transparent focus:outline-none text-gray-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Login & Register buttons */}
          <div className="flex gap-4 rtl:space-x-reverse">
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500
                         hover:from-blue-600 hover:to-cyan-600 text-white
                         font-semibold rounded-xl shadow-md transition-all duration-300"
            >
              התחבר
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-500
                         hover:from-green-600 hover:to-teal-600 text-white
                         font-semibold rounded-xl shadow-md transition-all duration-300"
            >
              הרשמה
            </button>
          </div>
        </form>

        {/* Back to Home button */}
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 mt-4 bg-white border border-gray-300
                     hover:bg-gray-100 text-gray-700 rounded-xl shadow-sm transition"
        >
          ← חזרה לדף הבית
        </button>
      </div>
    </div>
  );
}

export default Login;
