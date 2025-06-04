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

function getNextDifficulty(current) {
  if (current === 'easy') return 'medium';
  if (current === 'medium') return 'hard';
  return null;
}

function Questions() {
  const MAX_QUESTIONS = 10;
  const [questionIndex, setQuestionIndex] = useState(null);
  const [correctIndexes, setCorrectIndexes] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState(null);
  const [time, setTime] = useState(30);
  const [showHint, setShowHint] = useState(false);
  const [showAutoHint, setShowAutoHint] = useState(false);
  const navigate = useNavigate();

  const userLang = localStorage.getItem('userLang');
  const userDifficulty = localStorage.getItem('userDifficulty');
  const userName = localStorage.getItem('userName');
  const questionsList = questionsData?.[userLang]?.[userDifficulty] || [];

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userName));
        const data = snap.exists() ? snap.data() : {};
        const progress = data?.progress?.[userLang]?.[userDifficulty] || [];
        setCorrectIndexes(progress);
      } catch (e) {
        console.error(e);
      }
    };
    loadProgress();
  }, [userLang, userDifficulty, userName]);

  useEffect(() => {
    if (questionIndex === null && questionsList.length > 0) {
      const remaining = questionsList.map((_, i) => i).filter(i => !correctIndexes.includes(i));
      if (remaining.length === 0 || correctIndexes.length >= MAX_QUESTIONS) {
        const next = getNextDifficulty(userDifficulty);
        if (next) {
          localStorage.setItem('userDifficulty', next);
          window.location.reload();
        } else {
          setShowEndModal(true);
        }
      } else {
        const random = remaining[Math.floor(Math.random() * remaining.length)];
        setQuestionIndex(random);
        setSelected(null);
        setLocked(false);
        setShowHint(false);
        setShowAutoHint(false);
        setTime(30);
      }
    }
  }, [questionIndex, correctIndexes, questionsList, userDifficulty]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          if (!locked) {
            setLocked(true);
            setToast({ message: '❌ תם הזמן!', type: 'error' });
            setTimeout(() => {
              setToast(null);
              setQuestionIndex(null);
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
    return () => clearInterval(timer);
  }, [locked]);

  const handleAnswerClick = (idx) => {
    if (selected !== null || locked) return;
    setSelected(idx);
    setLocked(true);

    const correctAudio = new Audio(correctSound);
    const wrongAudio = new Audio(wrongSound);
    const correct = questionsList[questionIndex].correct;

    if (idx === correct) {
      correctAudio.play();
      if (!correctIndexes.includes(questionIndex)) {
        const updated = [...correctIndexes, questionIndex];
        setCorrectIndexes(updated);
        setCorrectCount(c => c + 1);
        saveProgressToDB(updated);
      }
      setToast({ message: '✅ תשובה נכונה!', type: 'success' });
    } else {
      wrongAudio.play();
      setToast({ message: '❌ תשובה שגויה!', type: 'error' });
    }

    setTimeout(() => {
      setToast(null);
      setQuestionIndex(null);
      setLocked(false);
    }, 1500);
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
          [userLang]: {
            ...(base.progress?.[userLang] || {}),
            [userDifficulty]: updatedArr,
          },
        },
      }, { merge: true });
    } catch (err) {
      console.error('Error writing progress:', err);
    }
  };

  if (!userLang || !userDifficulty || questionsList.length === 0) {
    return <div className="p-4 text-red-600">לא ניתן לטעון את השאלות. ודא שהשפה והרמה נבחרו כראוי.</div>;
  }

  return (
    <div dir="rtl" className="bg-blue-100 text-black dark:bg-gray-900 dark:text-white min-h-screen p-6">
      {showEndModal ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">סיימת את כל השאלות!</h2>
          <p className="mb-2">תשובות נכונות: {correctCount} מתוך {MAX_QUESTIONS}</p>
          <img src={ball10} alt="Result" className="w-32 h-32 mx-auto" />
          <button onClick={() => navigate('/progress')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">חזרה לעמוד התקדמות</button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl">
          <div className="mb-4 text-xl font-bold text-center">שאלה {questionIndex + 1}</div>
          <p className="text-lg mb-4 text-center">{questionsList[questionIndex]?.question}</p>
          <ul className="space-y-3">
            {questionsList[questionIndex]?.answers.map((ans, idx) => (
              <li key={idx}>
                <button onClick={() => handleAnswerClick(idx)} disabled={locked || selected !== null} className="w-full px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-blue-200 disabled:opacity-50">
                  {ans}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between items-center">
            <button onClick={() => setShowHint(true)} disabled={locked} className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500">הצג רמז</button>
            <div className={time <= 5 ? 'text-red-600 font-bold' : 'text-blue-600'}>{time} שניות</div>
          </div>

          {showHint && <div className="mt-3 p-3 bg-yellow-100 rounded">💡 {questionsList[questionIndex]?.hint}</div>}
          {showAutoHint && questionsList[questionIndex]?.authohint && <div className="mt-3 p-3 bg-blue-100 animate-pulse">🤖 {questionsList[questionIndex]?.authohint}</div>}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default Questions;
