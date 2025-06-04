// src/components/Questions.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import questionsData from './questions.json';

// Images
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

// Sounds
import correctSound from '../sounds/right_answer.mp3';
import wrongSound from '../sounds/wrong_answer.mp3';

function Questions() {
  const MAX_QUESTIONS = 10;
  const MAX_QUESTIONS_PER_CATEGORY = 20;
  const navigate = useNavigate();

  const userName = localStorage.getItem('userName');
  const lang = localStorage.getItem('userLang');
  const difficulty = localStorage.getItem('userDifficulty');

  const difficultyOrder = ['easy', 'medium', 'hard'];
  const getNextDifficulty = (current) => {
    const index = difficultyOrder.indexOf(current);
    return index >= 0 && index < difficultyOrder.length - 1 ? difficultyOrder[index + 1] : null;
  };

  const hintTextMap = { en: 'Show Hint', es: 'Mostrar pista', ru: 'Показать подсказку' };
  const currentHintText = hintTextMap[lang] || 'Show Hint';

  const questionsList = questionsData?.[lang]?.[difficulty] || [];
  if (!lang || !difficulty || questionsList.length === 0) {
    return <div className="p-4 text-red-600">לא ניתן לטעון את השאלות. ודא שהשפה והרמה נבחרו כראוי.</div>;
  }

  const loadStoredProgress = () => {
    try {
      const raw = localStorage.getItem('userProgress');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed?.[lang]?.[difficulty] || [];
    } catch {
      return [];
    }
  };

  const storeProgressLocally = (array) => {
    try {
      const prev = JSON.parse(localStorage.getItem('userProgress') || '{}');
      const upd = {
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          [difficulty]: array,
        },
      };
      localStorage.setItem('userProgress', JSON.stringify(upd));
    } catch (e) {
      console.error('localStorage error:', e);
    }
  };

  const [questionIndex, setQuestionIndex] = useState(null);
  const [seenQuestions, setSeenQuestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [correctIndexes, setCorrectIndexes] = useState(loadStoredProgress);
  const [correctCount, setCorrectCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showAutoHint, setShowAutoHint] = useState(false);
  const [time, setTime] = useState(30);
  const [toast, setToast] = useState(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);

  const initialLoad = useRef(false);

  const fetchProgressFromDB = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', userName));
      if (!snap.exists()) return;
      const data = snap.data();

      const serverProg = data?.progress?.[lang]?.[difficulty] || [];
      if (serverProg.length !== correctIndexes.length) {
        setCorrectIndexes(serverProg);
        storeProgressLocally(serverProg);
      }

      if (data.gender) localStorage.setItem('userGender', data.gender);
    } catch (err) {
      console.error('Error fetching user progress:', err);
    }
  };

  const saveProgressToDB = async (updatedArr) => {
    try {
      const ref = doc(db, 'users', userName);
      const snap = await getDoc(ref);
      const base = snap.exists() ? snap.data() : {};
      await setDoc(ref, {
        ...base,
        progress: {
          ...(base.progress || {}),
          [lang]: {
            ...(base.progress?.[lang] || {}),
            [difficulty]: updatedArr,
          },
        },
      }, { merge: true });
    } catch (err) {
      console.error('Error writing progress:', err);
    }
  };

  const resetCategoryInDB = async () => {
    try {
      const ref = doc(db, 'users', userName);
      const snap = await getDoc(ref);
      const base = snap.exists() ? snap.data() : {};
      await setDoc(ref, {
        ...base,
        progress: {
          ...(base.progress || {}),
          [lang]: {
            ...(base.progress?.[lang] || {}),
            [difficulty]: [],
          },
        },
      }, { merge: true });
    } catch (err) {
      console.error('Error resetting category:', err);
    }
  };

  useEffect(() => {
    if (questionIndex === null && !showRestartModal) loadNextQuestion();
    if (!initialLoad.current) {
      fetchProgressFromDB();
      initialLoad.current = true;
    }
  }, [questionIndex, showRestartModal]);

  useEffect(() => {
    const id = setInterval(() => {
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
        if (t === 11) setShowAutoHint(true);
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [locked]);

  const getNextQuestionIndex = () => {
    const candidates = questionsList.map((_, i) => i)
      .filter(i => !seenQuestions.includes(i) && !correctIndexes.includes(i));
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const loadNextQuestion = () => {
    if (currentQuestionNumber > MAX_QUESTIONS) return setShowEndModal(true);
    if (correctIndexes.length >= MAX_QUESTIONS_PER_CATEGORY) {
      const nextDiff = getNextDifficulty(difficulty);
      if (nextDiff) {
        localStorage.setItem('userDifficulty', nextDiff);
        window.location.reload();
      } else {
        setShowEndModal(true);
      }
      return;
    }

    const nxt = getNextQuestionIndex();
    if (nxt === null) {
      setSeenQuestions([]);
      setShowEndModal(true);
    } else {
      setSeenQuestions(prev => [...prev, nxt]);
      setQuestionIndex(nxt);
      setSelected(null);
      setShowHint(false);
      setShowAutoHint(false);
      setTime(30);
    }
  };

  const nextQuestionAfterTimeout = () => {
    const last = currentQuestionNumber >= MAX_QUESTIONS;
    setCurrentQuestionNumber(n => n + 1);
    if (last) setShowEndModal(true); else loadNextQuestion();
  };

  const getResultImage = () => [ball0, ball1, ball2, ball3, ball4, ball5, ball6, ball7, ball8, ball9, ball10][correctCount] || ball0;

  return (
    <>
      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 max-w-sm">
            <h2 className="text-2xl font-bold text-center">
              {getNextDifficulty(difficulty)
                ? 'סיימת את הרמה הזו! ⬆️'
                : 'סיימת את כל הרמות! 🎉'}
            </h2>
            <div className="flex justify-center">
              <img src={getResultImage()} alt="Result" className="w-32 h-32" />
            </div>
            <p className="text-center">תשובות נכונות: {correctCount} מתוך {MAX_QUESTIONS}</p>
            {getNextDifficulty(difficulty) ? (
              <button
                onClick={() => {
                  localStorage.setItem('userDifficulty', getNextDifficulty(difficulty));
                  window.location.reload();
                }}
                className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                המשך לרמה הבאה
              </button>
            ) : (
              <button
                onClick={() => navigate('/progress')}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                חזרה להתקדמות
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Questions;
