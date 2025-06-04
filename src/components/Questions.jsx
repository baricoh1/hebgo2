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

  if (!questionsData || !userLang || !userDifficulty || questionsList.length === 0) {
    return <div className="p-4 text-red-600">לא ניתן לטעון את השאלות. ודא שהשפה והרמה נבחרו כראוי.</div>;
  }

  return (
    <div dir="rtl" className="bg-blue-100 text-black dark:bg-gray-900 dark:text-white min-h-screen p-6">
      {/* Content remains the same */}
      {/* ... */}
    </div>
  );
}

export default Questions;
