import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen text-black dark:text-white transition-colors duration-300">
      {/* 🔘 כפתור מעבר מצב כהה/בהיר */}
      <button
  onClick={() => setDarkMode(!darkMode)}
  className="absolute top-4 left-4 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition z-50"
>
  {darkMode ? '☀ מצב בהיר' : '🌙 מצב כהה'}
</button>


      {/* תוכן הדף נטען כאן */}
      <Outlet />
    </div>
  );
}

export default App;
