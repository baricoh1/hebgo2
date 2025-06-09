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
  /* ------------------------------------------------------------------
     CONSTANTS & BASIC DATA
  ------------------------------------------------------------------ */
  const MAX_QUESTIONS = 10;
  const MAX_QUESTIONS_PER_CATEGORY = 20;
  const navigate = useNavigate();

  const userName = localStorage.getItem('userName');
  const lang     = localStorage.getItem('userLang');
  const [currentDifficulty, setCurrentDifficulty] = useState(
    localStorage.getItem('userDifficulty')
  );

  const hintTextMap = { en: 'Show Hint', es: 'Mostrar pista', ru: 'Показать подсказку' };
  const currentHintText = hintTextMap[lang] || 'Show Hint';

  const questionsList = questionsData?.[lang]?.[currentDifficulty] || [];
  if (!lang || !currentDifficulty || questionsList.length === 0) {
    return <div className="p-4 text-red-600">לא ניתן לטעון את השאלות. ודא שהשפה והרמה נבחרו כראוי.</div>;
  }

  /* ------------------------------------------------------------------
     REACT STATE
  ------------------------------------------------------------------ */
  const [questionIndex, setQuestionIndex] = useState(null);
  const seenQuestions = useRef([]);
  const [selected, setSelected]           = useState(null);
  //const [correctIndexes, setCorrectIndexes] = useState([]);
  const correctIndexes = useRef([]) ;
  const [correctCount, setCorrectCount]   = useState(0);
  const [locked, setLocked]               = useState(false);
  const [showHint, setShowHint]           = useState(false);
  const [showAutoHint, setShowAutoHint]   = useState(false);
  const [time, setTime]                   = useState(30);
  const [toast, setToast]                 = useState(null);
  const [showEndModal, setShowEndModal]   = useState(false);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [questionsThisRound, setQuestionsThisRound] = useState(MAX_QUESTIONS);

  // hide quiz UI during level-up
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  const getNextDifficulty = (level) => {
    const levels = ['easy', 'medium', 'hard'];
    const idx = levels.indexOf(level);
    return idx < levels.length - 1 ? levels[idx + 1] : null;
  };

  const getDifficultyDisplayName = (level) => {
    const names = { easy: 'קל', medium: 'בינוני', hard: 'קשה' };
    return names[level] || level;
  };


  /* ------------------------------------------------------------------
     FIREBASE HELPERS
  ------------------------------------------------------------------ */
  const fetchProgressFromDB = async () => {
    try {
      const userRef = doc(db, 'users', userName);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return;
      const data = snap.data();

      const serverProg = data.progress?.[lang]?.[currentDifficulty] || [];
      //setCorrectIndexes(serverProg);
      correctIndexes.current = serverProg;

      // AUTO LEVEL-UP
      if (serverProg.length >= MAX_QUESTIONS_PER_CATEGORY) {
        const next = getNextDifficulty(currentDifficulty);
        if (next) {
          setToast({
            message: `🎉 כל הכבוד! עלית לרמה ${getDifficultyDisplayName(next)}!`,
            type: 'levelup'
          });
          setIsLevelingUp(true);
          await setDoc(userRef, { difficulty: next }, { merge: true });
          localStorage.setItem('userDifficulty', next);
          setTimeout(() => {
            setToast(null);
            setCurrentDifficulty(next);
            window.location.reload();
          }, 3000);
        }
      }

      if (data.gender) {
        localStorage.setItem('userGender', data.gender);
      }

      
      const remaining = MAX_QUESTIONS_PER_CATEGORY - serverProg.length;
      setQuestionsThisRound(Math.min(MAX_QUESTIONS, remaining));
      loadNextQuestion();
    } catch (err) {
      console.error('Error fetching user progress:', err);
    }
  };

  const saveProgressToDB = async (updatedArr) => {
    try {
      const ref = doc(db, 'users', userName);
      const snap = await getDoc(ref);
      const base = snap.exists() ? snap.data() : {};
      await setDoc(
        ref,
        {
          ...base,
          progress: {
            ...(base.progress || {}),
            [lang]: {
              ...(base.progress?.[lang] || {}),
              [currentDifficulty]: updatedArr,
            },
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error writing progress:', err);
    }
  };

  /* ------------------------------------------------------------------
     EFFECTS
  ------------------------------------------------------------------ */
  // 1) Fetch progress once on mount
  useEffect(() => {
    fetchProgressFromDB();
  }, []);

  // 2) Re-fetch (and clear) when difficulty changes
  useEffect(() => {
    correctIndexes. current = [];
    fetchProgressFromDB();
  }, [currentDifficulty]);


  // Timer
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

 
  useEffect(() => {
    seenQuestions.current = [];
  }, [currentDifficulty]);

  useEffect(() => {
    seenQuestions.current = [];
  }, []);

  /* ------------------------------------------------------------------
     QUESTION FLOW HELPERS
  ------------------------------------------------------------------ */
  const getNextQuestionIndex = () => {
    // filter only questions that are NOT in seenQuestions AND NOT in correctIndexes
    const candidates = questionsList
      .map((_, i) => i)
      .filter(
        (i) =>
          !seenQuestions.current.includes(i) &&
          !correctIndexes.current.includes(i)
      );
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const loadNextQuestion = () => {
    if (currentQuestionNumber > questionsThisRound) return setShowEndModal(true);
    const nxt = getNextQuestionIndex();
    if (nxt === null) {
      seenQuestions.current = [];
      setShowEndModal(true);
    } else {
      
      if (!correctIndexes.current.includes(nxt)) {
        seenQuestions.current = [...seenQuestions.current, nxt];
      }
      setQuestionIndex(nxt);
      setSelected(null);
      setShowHint(false);
      setShowAutoHint(false);
      setTime(30);
    }
  };

  const nextQuestionAfterTimeout = () => {
    const last = currentQuestionNumber >= questionsThisRound;
    setCurrentQuestionNumber((n) => n + 1);
    if (last) setShowEndModal(true);
    else loadNextQuestion();
  };

  const handleAnswerClick = async (idx) => {
    if (selected !== null || locked) return;
    setSelected(idx);
    setLocked(true);

    const correctAudio = new Audio(correctSound);
    const wrongAudio   = new Audio(wrongSound);

    if (idx === question.correct) {
      correctAudio.play();
      if (!correctIndexes.current.includes(questionIndex)) {
        const updated = [...correctIndexes.current, questionIndex];
        //setCorrectIndexes(updated);
        correctIndexes.current = updated;
        await saveProgressToDB(updated);
      }
      setCorrectCount((c) => c + 1);
      setToast({ message: '✅ תשובה נכונה!', type: 'success' });
    } else {
      wrongAudio.play();
      setToast({ message: '❌ תשובה שגויה!', type: 'error' });
    }

    setTimeout(() => {
      setToast(null);
      const isLast = currentQuestionNumber >= questionsThisRound;
      setCurrentQuestionNumber((n) => n + 1);
      if (isLast) setShowEndModal(true);
      else loadNextQuestion();
      setLocked(false);
    }, 1500);
  };

  function splitQuestionText(text) {
    const heMatch = text.match(/['״'][א-ת\s_\-.,:()]+['״]/);
    const hePart  = heMatch ? heMatch[0] : '';
    const enPart  = hePart ? text.replace(hePart, '').replace(/[?؟!]/g, '').trim() : text;
    const punctuationMatch = text.trim().match(/[?؟!]+$/);
    const punctuation = punctuationMatch ? punctuationMatch[0] : '';
    return { enPart, hePart, punctuation };
  }

  /* ------------------------------------------------------------------
     RENDER HELPERS
  ------------------------------------------------------------------ */
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const getResultImage = () =>
    [ball0, ball1, ball2, ball3, ball4, ball5, ball6, ball7, ball8, ball9, ball10][
      correctCount
    ] || ball0;

  const question =
    questionIndex !== null
      ? questionsList[questionIndex]
      : { question: '', answers: [], hint: '', authohint: '' };

  const progressPercent = ((currentQuestionNumber - 1) / MAX_QUESTIONS) * 100;
  const { enPart, hePart, punctuation } = splitQuestionText(question.question);

  // EARLY RETURN DURING LEVEL-UP
  if (isLevelingUp) {
    return (
      <div
        dir="rtl"
        className="bg-blue-100 dark:bg-gray-900 text-black dark:text-white min-h-screen
                   flex items-center justify-center transition-colors duration-300"
      >
        {toast && (
          <div
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2
                       bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse
                       text-white px-6 py-3 rounded-full shadow-lg text-lg z-50"
          >
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  // לפני ה־return הראשי:
  if (questionsThisRound === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">אין שאלות זמינות לסבב זה!</h2>
          <p className="mb-4">סיימת את כל השאלות ברמה ובשפה הנוכחית.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            חזרה לעמוד הראשי
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="bg-blue-100 dark:bg-gray-900 text-black dark:text-white min-h-screen transition-colors duration-300"
    >
      {/* QUIZ AREA */}
      <div className={`relative z-10 ${showEndModal ? 'pointer-events-none blur-sm' : ''}`}>
        <div className="max-w-4xl mx-auto flex flex-col p-4 space-y-4">
          {questionIndex === null ? (
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
                  <span
                    className={time <= 5 ? 'text-red-600 font-bold' : 'text-blue-600'}
                  >
                    {formatTime(time)}
                  </span>
                </div>
              </header>

              {/* Progress Bar */}
              <div className="w-full bg-gray-300 dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-500 h-2 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-right text-sm text-gray-600 dark:text-gray-300">
                שאלה {currentQuestionNumber} מתוך {questionsThisRound}
              </p>

              {/* Question Card */}
              <main className="bg-white/90 dark:bg-gray-800 p-6 rounded-xl shadow-lg text-lg flex-grow transition-all duration-300">
                <div className="flex flex-row justify-center items-center flex-wrap gap-2 text-xl font-bold text-blue-900 dark:text-blue-200">
                  <span className="text-purple-700 dark:text-purple-400 font-bold" dir="rtl">
                    {hePart}
                    {punctuation}
                  </span>
                  <span className="text-blue-900 dark:text-blue-200" dir="ltr">
                    {enPart}
                  </span>
                </div>

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

              {/* Footer */}
              <footer className="text-right text-lg mt-4">
                סה״כ פלאפלים שנאספו: {correctCount} 🧆
              </footer>
            </>
          )}
        </div>
      </div>

      {/* TOAST */}
      {toast && !isLevelingUp && (
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-lg shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-600'
              : toast.type === 'levelup'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse'
              : 'bg-red-600'
          } text-white`}
        >
          {toast.message}
        </div>
      )}

      {/* END MODAL */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 max-w-sm">
            <h2 className="text-2xl font-bold text-center">
              סיימת את כל {questionsThisRound} השאלות!
            </h2>
            <div className="flex justify-center">
              <img src={getResultImage()} alt="Result" className="w-32 h-32" />
            </div>
            <p className="text-center">
              תשובות נכונות: {correctCount} מתוך {questionsThisRound}
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
    </div>
  );
}

export default Questions;
