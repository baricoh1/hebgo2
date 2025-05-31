import React from 'react';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen text-black dark:text-white transition-colors duration-300
                    bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
      <Outlet />
    </div>
  );
}

export default App;
