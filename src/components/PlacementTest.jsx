// src/components/PlacementTest.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import questionsData from './placementQuestions.json';

function PlacementTest() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [completed, setCompleted] = useState(false);

  const navigate = useNavigate();
  const userLang = localStorage.getItem('userLang') || 'us';
  const userName = localStorage.getItem('userName');
  const testQuestions = questionsData[userLang]?.easy || [];

  const handleAnswer = (index) => {
    setSelected(index);
    if (index === testQuestions[current].correct) {
      setScore(prev => prev + 1);
    }

    if (current + 1 === testQuestions.length) {
      setTimeout(() => finishTest(), 1500);
    }
  };

  const nextQuestion = () => {
    setSelected(null);
    if (current + 1 < testQuestions.length) {
      setCurrent(current + 1);
    }
  };

  const finishTest = async () => {
    setCompleted(true);
    let difficulty = 'easy';
    if (score === 5) difficulty = 'hard';
    else if (score >= 3) difficulty = 'medium';

    localStorage.setItem('userDifficulty', difficulty);

    try {
      await fetch(`http://localhost:5000/api/user/${userName}/difficulty`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: userLang, difficulty })
      });
    } catch (err) {
      console.error('Error saving difficulty:', err);
    }

    setTimeout(() => navigate('/'), 2000);
  };

  if (!userName) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center text-red-600">
        <p>אנא התחבר לפני תחילת המבחן.</p>
      </div>
    );
  }

  const progressPercent = Math.round(((current + (selected !== null ? 1 : 0)) / testQuestions.length) * 100);

  return (
    <div dir="rtl" className="bg-blue-100 text-black dark:bg-gray-900 dark:text-white min-h-screen transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 text-center">
        <h1 className="text-3xl font-bold">
          מבחן רמת התחלה - {userLang.toUpperCase()}
        </h1>

        {/* Progress Bar */}
        {!completed && (
          <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-4 mt-4 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {!completed ? (
          <>
            <div className="text-lg font-medium mt-2">
              שאלה <span className="font-bold">{current + 1}</span> מתוך <span className="font-bold">{testQuestions.length}</span>
            </div>
            <div className="text-2xl font-semibold">{testQuestions[current].question}</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              {testQuestions[current].answers.map((ans, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                  className={`p-4 rounded-xl shadow-md border text-right transition-all duration-200 ease-in-out hover:scale-105
                    ${selected === i
                      ? i === testQuestions[current].correct
                        ? 'bg-green-200 dark:bg-green-700'
                        : 'bg-red-200 dark:bg-red-700'
                      : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700'
                    }`}
                >
                  {ans}
                </button>
              ))}
            </div>

            {selected !== null && current + 1 < testQuestions.length && (
              <button
                onClick={nextQuestion}
                className="mt-8 px-8 py-3 bg-blue-600 text-white font-semibold rounded-full shadow hover:bg-blue-700 transition"
              >
                לשאלה הבאה →
              </button>
            )}
          </>
        ) : (
          <div className="animate-bounce bg-green-100 dark:bg-green-800 p-6 rounded-xl shadow-lg max-w-md mx-auto text-green-700 dark:text-green-200 text-xl font-semibold">
            סיימת את המבחן! רמתך הנוכחית: {score === 5 ? 'קשה' : score >= 3 ? 'בינוני' : 'קל'}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlacementTest;
