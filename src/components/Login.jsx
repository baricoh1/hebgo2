// Import React and hooks, navigation, icons, and the login service
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaLock } from 'react-icons/fa';
import { loginUser } from '../services/AuthService';

function Login() {
  // State for email and password input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Navigation hook from React Router
  const navigate = useNavigate();

  // Handles the login form submission
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent page reload

    // Validate inputs
    if (!email || !password) {
      alert('אנא מלא אימייל וסיסמה.');
      return;
    }

    try {
      // Attempt to login via service
      await loginUser(email, password); 
      alert('✅ התחברות הצליחה!');
      navigate('/'); // Redirect to homepage on success
    } catch (err) {
      // Show error message on failure
      alert('שגיאה: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-cyan-100 via-blue-100 to-blue-200 
      dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 rtl">
      
      {/* Login box container */}
      <div className="w-full max-w-md 
        bg-white/60 dark:bg-gray-800/70 
        backdrop-blur-xl border border-blue-200 dark:border-gray-700 
        rounded-3xl shadow-2xl p-10 space-y-8 text-gray-900 dark:text-white">
        
        {/* Title */}
        <h1 className="text-4xl font-bold text-center text-blue-700 dark:text-blue-300">
          התחברות
        </h1>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              אימייל
            </label>
            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3">
              <FaUserAlt className="text-gray-400 me-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Update state
                className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-white"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              סיסמה
            </label>
            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3">
              <FaLock className="text-gray-400 me-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Update state
                className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Submit + Register buttons */}
          <div className="flex gap-4 rtl:space-x-reverse">
            {/* Login button */}
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
              text-white font-semibold rounded-xl shadow-md transition"
            >
              התחבר
            </button>

            {/* Navigate to register page */}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 
              text-white font-semibold rounded-xl shadow-md transition"
            >
              הרשמה
            </button>
          </div>
        </form>

        {/* Return to homepage button */}
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 mt-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
          hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white rounded-xl shadow-sm transition"
        >
          ← חזרה לדף הבית
        </button>
      </div>
    </div>
  );
}

export default Login;
