// src/components/Questions.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
  const [questionsData, setQuestionsData] = useState(null);
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
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [seenQuestions, setSeenQuestions] = useState([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const navigate = useNavigate();

  const userLang = localStorage.getItem('userLang');
  const userDifficulty = localStorage.getItem('userDifficulty');
  const userName = localStorage.getItem('userName');

  useEffect(() => {
    fetch('/questions.json')
      .then((res) => res.json())
      .then((data) => setQuestionsData(data))
      .catch((err) => console.error('Error loading questions.json:', err));
  }, []);

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
    if (questionsData) loadProgress();
  }, [userLang, userDifficulty, userName, questionsData]);

  useEffect(() => {
    if (questionIndex === null && questionsList.length > 0) {
      const remaining = questionsList.map((_, i) => i).filter(i => !correctIndexes.includes(i));
      if (remaining.length === 0 || correctIndexes.length >= 20) {
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
      const isLast = currentQuestionNumber >= MAX_QUESTIONS;
      setCurrentQuestionNumber(n => n + 1);
      if (isLast) setShowEndModal(true); else setQuestionIndex(null);
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

  if (!questionsData || !userLang || !userDifficulty || questionsList.length === 0) {
    return <div className="p-4 text-red-600">לא ניתן לטעון את השאלות. ודא שהשפה והרמה נבחרו כראוי.</div>;
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const question = questionsList[questionIndex] || { question: '', answers: [], hint: '', authohint: '' };
  const progressPercent = ((currentQuestionNumber - 1) / MAX_QUESTIONS) * 100;
  const getResultImage = () => [ball0, ball1, ball2, ball3, ball4, ball5, ball6, ball7, ball8, ball9, ball10][correctCount] || ball0;

  return (
    <div dir="rtl" className="bg-blue-100 text-black dark:bg-gray-900 dark:text-white min-h-screen p-6">
      <div className={`relative z-10 ${showEndModal || showRestartModal ? 'pointer-events-none blur-sm' : ''}`}>
        <div className="max-w-4xl mx-auto flex flex-col p-4 space-y-4">
          <header className="flex flex-row-reverse justify-between items-center bg-blue-200 dark:bg-blue-950 p-4 rounded-lg shadow">
            <button onClick={() => navigate('/')} className="text-xl font-semibold hover:underline">← חזרה לעמוד ראשי</button>
            <div className="flex items-center mx-3 gap-2">
              <span className="text-base font-semibold text-gray-700 dark:text-gray-300">שאלה</span>
              <span className="bg-blue-500 text-white rounded-full px-3 py-1 shadow-md">{currentQuestionNumber}</span>
            </div>
            <div className="bg-white py-1 px-3 rounded shadow dark:bg-gray-100">
              <span className={time <= 5 ? 'text-red-600 font-bold' : 'text-blue-600'}>{formatTime(time)}</span>
            </div>
          </header>

          <div className="w-full bg-gray-300 dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-500 h-2 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>

          <main className="bg-white/90 dark:bg-gray-800 p-6 rounded-xl shadow-lg text-lg flex-grow transition-all duration-300">
            <div className="text-xl font-bold text-blue-900 dark:text-blue-200 text-center mb-4">{question.question}</div>
            <ul className="space-y-2">
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
                  <button key={idx} onClick={() => handleAnswerClick(idx)} disabled={selected !== null || locked} className={`w-full text-right p-3 rounded-lg border shadow hover:bg-blue-100 ${bg} ${(selected !== null || locked) ? 'cursor-not-allowed' : ''}`}>{ans}</button>
                );
              })}
            </ul>

            <div className="mt-6 flex items-center justify-between">
              <button className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500" onClick={() => setShowHint(true)} disabled={locked}>הצג רמז</button>
            </div>

            {showHint && <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900 rounded text-right">💡 {question.hint}</div>}
            {showAutoHint && question.authohint && <div className="mt-2 p-3 bg-blue-100 dark:bg-blue-900 rounded text-right animate-pulse">🤖 {question.authohint}</div>}
          </main>

          <footer className="text-right text-lg mt-4">סה״כ פלאפלים שנאספו: {correctCount} 🧆</footer>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>{toast.message}</div>
      )}

      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 max-w-sm">
            <h2 className="text-2xl font-bold text-center">סיימת את כל {MAX_QUESTIONS} השאלות!</h2>
            <div className="flex justify-center"><img src={getResultImage()} alt="Result" className="w-32 h-32" /></div>
            <p className="text-center">תשובות נכונות: {correctCount} מתוך {MAX_QUESTIONS}</p>
            <button onClick={() => { setShowEndModal(false); navigate('/progress'); }} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">חזרה להתקדמות</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Questions;
