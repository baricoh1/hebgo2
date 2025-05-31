// src/components/Questions.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import questionsData from './questions.json';

import ball0 from '../images/ball0.png';
import ball1 from '../images/ball1.png';
import ball2 from '../images/ball2.png';
import ball3 from '../images/ball3.png';
import ball4 from '../images/ball4.png';
import ball5 from '../images/ball5.png';
import ball6 from '../images/ball6.png';
import ball7 from '../images/ball7.png';
import ball8 from '../images/ball8.png';
import ball9 from '../images/ball9.png';
import ball10 from '../images/ball10.png';
import correctSound from '../sounds/right_answer.mp3';
import wrongSound from '../sounds/wrong_answer.mp3';

function Questions() {
  const MAX_QUESTIONS = 10;
  const MAX_QUESTIONS_PER_CATEGORY = 20;
  const navigate = useNavigate();

  // Load user settings from localStorage
  const userName = localStorage.getItem('userName');
  const lang = localStorage.getItem('userLang');
  const difficulty = localStorage.getItem('userDifficulty');
  const hintButtonText = {
    en: "Show Hint",
    es: "Mostrar pista",
    ru: "Показать подсказку",
  };
  const currentHintText = hintButtonText[lang] || "Show Hint";

  // Load question list for the selected language and difficulty
  const questionsList = questionsData?.[lang]?.[difficulty] || [];
  if (!lang || !difficulty || questionsList.length === 0) {
    return (
      <div className="p-4 text-red-600">
        לא ניתן לטעון את השאלות. ודא שהשפה והרמה נבחרו כראוי.
      </div>
    );
  }

  // Retrieve stored progress from localStorage
  const loadStoredProgress = () => {
    try {
      const stored = localStorage.getItem('userProgress');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      const catProg = parsed?.[lang]?.[difficulty];
      return Array.isArray(catProg) ? catProg : [];
    } catch {
      return [];
    }
  };

  // State variables
  const [locked, setLocked] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(null);
  const [seenQuestions, setSeenQuestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAutoHint, setShowAutoHint] = useState(false);
  const [time, setTime] = useState(30);
  const [toast, setToast] = useState(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);

  // Prevent repeated fetches
  const initialLoadComplete = useRef(false);

  // Initialize correctIndexes from localStorage
  const [correctIndexes, setCorrectIndexes] = useState(loadStoredProgress);

  // On mount: immediately load next question and fetch server progress
  useEffect(() => {
    if (questionIndex === null && !showRestartModal) {
      loadNextQuestion();
    }
    if (!initialLoadComplete.current) {
      fetch(`http://localhost:5000/api/user/${userName}`)
        .then((res) => res.json())
        .then((data) => {
          const serverProg = data.progress?.[lang]?.[difficulty] || [];
          if (serverProg.length !== correctIndexes.length) {
            setCorrectIndexes(serverProg);
            try {
              const prev = JSON.parse(localStorage.getItem('userProgress') || "{}");
              const upd = {
                ...prev,
                [lang]: {
                  ...(prev[lang] || {}),
                  [difficulty]: serverProg,
                },
              };
              localStorage.setItem('userProgress', JSON.stringify(upd));
            } catch {}
          }
          if (serverProg.length >= MAX_QUESTIONS_PER_CATEGORY) {
            setShowRestartModal(true);
          }
          if (data.gender) {
            localStorage.setItem('userGender', data.gender);
          }
          if (data.difficulty) {
            localStorage.setItem('userDifficulty', data.difficulty);
          }
          initialLoadComplete.current = true;
        })
        .catch(() => {
          initialLoadComplete.current = true;
        });
    }
  }, [questionIndex, showRestartModal]);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          if (!locked) {
            setLocked(true);
            setToast({ message: '❌ תם הזמן!', type: 'error' });
            setTimeout(() => {
              setToast(null);
              nextQuestionAfterTimeout();
              setLocked(false);
              setShowAutoHint(false);
            }, 1000);
          }
          return 30;
        }
        if (t === 11) {
          setShowAutoHint(true);
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  // Choose next question index not yet seen or correct
  const getNextQuestionIndex = () => {
    const available = [];
    for (let i = 0; i < questionsList.length; i++) {
      if (!seenQuestions.includes(i) && !correctIndexes.includes(i)) {
        available.push(i);
      }
    }
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  };

  // Store progress in localStorage
  const storeProgressLocally = (arr) => {
    try {
      const prev = JSON.parse(localStorage.getItem('userProgress') || "{}");
      const upd = {
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          [difficulty]: arr,
        },
      };
      localStorage.setItem('userProgress', JSON.stringify(upd));
    } catch {}
  };

  // Save progress to server
  const saveProgressToDB = (updatedProgress) => {
    fetch('http://localhost:5000/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userName,
        language: lang,
        difficulty,
        progress: {
          [lang]: {
            [difficulty]: updatedProgress,
          },
        },
      }),
    }).catch(() => {});
  };

  // Restart category progress
  const handleRestart = () => {
    fetch('http://localhost:5000/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userName,
        language: lang,
        difficulty,
        progress: {
          [lang]: {
            [difficulty]: [],
          },
        },
      }),
    })
      .then(() => {
        setCorrectIndexes([]);
        setSeenQuestions([]);
        setCurrentQuestionNumber(1);
        storeProgressLocally([]);
        setShowRestartModal(false);
        loadNextQuestion();
      })
      .catch(() => {});
  };

  // Load the next question or end the quiz
  const loadNextQuestion = () => {
    if (currentQuestionNumber > MAX_QUESTIONS) {
      setShowEndModal(true);
      return;
    }
    if (correctIndexes.length >= MAX_QUESTIONS_PER_CATEGORY) {
      setShowRestartModal(true);
      return;
    }
    const nextIndex = getNextQuestionIndex();
    if (nextIndex === null) {
      setSeenQuestions([]);
      setShowEndModal(true);
    } else {
      setSeenQuestions((prev) => [...prev, nextIndex]);
      setQuestionIndex(nextIndex);
      setSelected(null);
      setShowHint(false);
      setShowAutoHint(false);
      setTime(30);
    }
  };

  // Called when time runs out
  const nextQuestionAfterTimeout = () => {
    const isLast = currentQuestionNumber >= MAX_QUESTIONS;
    setCurrentQuestionNumber((prev) => prev + 1);
    if (isLast) {
      setShowEndModal(true);
    } else {
      loadNextQuestion();
    }
  };

  // Handle answer selection
  const handleAnswerClick = (idx) => {
    if (selected !== null || locked) return;
    setSelected(idx);
    setLocked(true);

    const correctAudio = new Audio(correctSound);
    const wrongAudio = new Audio(wrongSound);

    if (idx === question.correct) {
      correctAudio.play();
      if (!correctIndexes.includes(questionIndex)) {
        const updated = [...correctIndexes, questionIndex];
        setCorrectIndexes(updated);
        storeProgressLocally(updated);
        saveProgressToDB(updated);
      }
      setCorrectCount((c) => c + 1);
      setToast({ message: '✅ תשובה נכונה!', type: 'success' });
    } else {
      wrongAudio.play();
      setToast({ message: '❌ תשובה שגויה!', type: 'error' });
    }

    setTimeout(() => {
      setToast(null);
      const isLast = currentQuestionNumber >= MAX_QUESTIONS;
      setCurrentQuestionNumber((prev) => prev + 1);
      if (isLast) {
        setShowEndModal(true);
      } else {
        loadNextQuestion();
      }
      setLocked(false);
    }, 1500);
  };

  // Format seconds into MM:SS
  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  // Return image based on correctCount
  const getResultImage = () => {
    return [
      ball0,
      ball1,
      ball2,
      ball3,
      ball4,
      ball5,
      ball6,
      ball7,
      ball8,
      ball9,
      ball10,
    ][correctCount] || ball0;
  };

  // Current question object or placeholder
  const question =
    questionIndex !== null && questionsList[questionIndex]
      ? questionsList[questionIndex]
      : { question: '', answers: [], hint: '', authohint: '' };

  // Compute percentage progress
  const progressPercent = ((currentQuestionNumber - 1) / MAX_QUESTIONS) * 100;

  return (
    <div
      dir="rtl"
      className="bg-blue-100 text-black dark:bg-gray-900 dark:text-white min-h-screen transition-colors duration-300"
    >
      <div
        className={`relative z-10 ${
          showEndModal || showRestartModal ? 'pointer-events-none filter blur-sm' : ''
        }`}
      >
        <div className="max-w-4xl mx-auto flex flex-col p-4 space-y-4">
          {/* Show loading only in question area */}
          {questionIndex === null && !showRestartModal ? (
            <div className="p-4 text-center text-lg">טוען שאלה...</div>
          ) : (
            <>
              {/* Header */}
              <header className="flex flex-row-reverse justify-between items-center bg-blue-200 dark:bg-blue-950 p-4 rounded-lg shadow">
                <button
                  onClick={() => navigate('/')}
                  className="text-xl font-semibold hover:underline"
                >
                  ← חזרה לעמוד ראשי
                </button>
                <div className="flex items-center mx-3 gap-2">
                  <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    שאלה
                  </span>
                  <span className="bg-blue-500 text-white rounded-full px-3 py-1 shadow-md">
                    {currentQuestionNumber}
                  </span>
                </div>
                <div className="bg-white py-1 px-3 rounded shadow dark:bg-gray-100">
                  <span className={time <= 5 ? 'text-red-600 font-bold' : 'text-blue-600'}>
                    {formatTime(time)}
                  </span>
                </div>
              </header>

              {/* Progress Bar */}
              <div className="w-full bg-gray-300 dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-right text-sm text-gray-600 dark:text-gray-300">
                שאלה {currentQuestionNumber} מתוך {MAX_QUESTIONS}
              </p>

              {/* Main question area */}
              <main className="bg-white/90 dark:bg-gray-800 p-6 rounded-xl shadow-lg text-lg flex-grow transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-right text-blue-800 dark:text-blue-300">
                  {question.question}
                </h2>

                <ul className="space-y-2 text-right list-none p-0 m-0">
                  {question.answers.map((ans, idx) => {
                    const isCorrect = idx === question.correct;
                    const isSelected = idx === selected;
                    let bg = 'bg-white dark:bg-gray-600';
                    if (selected !== null) {
                      if (isSelected && isCorrect) bg = 'bg-green-400';
                      else if (isSelected && !isCorrect) bg = 'bg-red-400';
                      else if (isCorrect) bg = 'bg-green-400';
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerClick(idx)}
                        disabled={selected !== null || locked}
                        className={`w-full text-right p-3 rounded-lg border shadow hover:bg-blue-100 ${bg} ${
                          selected !== null || locked ? 'cursor-not-allowed' : ''
                        }`}
                      >
                        {ans}
                      </button>
                    );
                  })}
                </ul>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500"
                    onClick={() => setShowHint(true)}
                    disabled={locked}
                  >
                    {currentHintText}
                  </button>
                </div>

                {showHint && (
                  <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900 rounded text-right">
                    💡 {question.hint}
                  </div>
                )}

                {showAutoHint && question.authohint && (
                  <div className="mt-2 p-3 bg-blue-100 dark:bg-blue-900 rounded text-right animate-pulse">
                    🤖 {question.authohint}
                  </div>
                )}
              </main>

              {/* Footer with falafel count */}
              <footer className="text-right text-lg mt-4">
                סך הכל פלאפלים שנאספו: {correctCount} 🧆
              </footer>
            </>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* End Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 max-w-sm">
            <h2 className="text-2xl font-bold text-center">
              סיימת את כל {MAX_QUESTIONS} השאלות!
            </h2>
            <div className="flex justify-center">
              <img src={getResultImage()} alt="Result" className="w-32 h-32" />
            </div>
            <p className="text-center">
              תשובות נכונות: {correctCount} מתוך {MAX_QUESTIONS}
            </p>
            <button
              onClick={() => {
                setShowEndModal(false);
                navigate('/progress');
              }}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              חזרה להתקדמות
            </button>
          </div>
        </div>
      )}

      {/* Restart Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 max-w-sm">
            <h2 className="text-2xl font-bold text-center">האם ברצונך להתחיל מחדש?</h2>
            <p className="text-center">כבר השלמת את כל השאלות בקטגוריה זו.</p>
            <div className="flex justify-between space-x-4 rtl:space-x-reverse">
              <button
                onClick={() => setShowRestartModal(false)}
                className="flex-1 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
              >
                לא, תודה
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                כן, התחל מחדש
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Questions;
