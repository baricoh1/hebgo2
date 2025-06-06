// src/components/Questions.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import questionsData from './questions.json';

// Images & sounds omitted for brevity...

function Questions() {
  /* ------------------------------------------------------------------
     CONSTANTS & BASIC DATA
  ------------------------------------------------------------------ */
  const MAX_QUESTIONS_PER_ROUND = 10;  
  const MAX_QUESTIONS_PER_CATEGORY = 20; 
  const navigate = useNavigate();

  // 1. We pull userName + lang + difficulty from localStorage
  //    (we assume userName is already set when the user logs in)
  const userName   = localStorage.getItem('userName');               
  const lang       = localStorage.getItem('userLang');
  const [difficultyState, setDifficultyState] = useState(
    localStorage.getItem(`userDifficulty_${userName}`) || 'easy'
  );
  const difficulty = difficultyState;

  // 2. Order of difficulties
  const difficultiesOrder = ['easy', 'medium', 'hard'];
  function getNextDifficulty() {
    const idx = difficultiesOrder.indexOf(difficulty);
    return idx === -1 || idx === difficultiesOrder.length - 1
      ? null
      : difficultiesOrder[idx + 1];
  }

  const hintTextMap = { en: 'Show Hint', es: 'Mostrar pista', ru: 'Показать подсказку' };
  const currentHintText = hintTextMap[lang] || 'Show Hint';

  // 3. Load questions JSON for current lang & difficulty
  const questionsList = questionsData?.[lang]?.[difficulty] || [];
  if (!lang || !difficulty || questionsList.length === 0) {
    return (
      <div className="p-4 text-red-600">
        לא ניתן לטעון את השאלות. ודא שהשפה והרמה נבחרו כראוי.
      </div>
    );
  }

  /* ------------------------------------------------------------------
     HELPERS TO INTERACT WITH LOCAL STORAGE (NAMESPACE BY userName)
  ------------------------------------------------------------------ */
  const PROGRESS_KEY = `userProgress_${userName}`;       // per-user key
  const DIFF_KEY     = `userDifficulty_${userName}`;     // per-user key

  // loadStoredProgress now reads from `userProgress_${userName}`
  const loadStoredProgress = () => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed?.[lang]?.[difficulty] || [];
    } catch {
      return [];
    }
  };

  // storeProgressLocally now writes to `userProgress_${userName}`
  const storeProgressLocally = (array) => {
    try {
      const prev = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
      const upd = {
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          [difficulty]: array,
        },
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(upd));
    } catch (e) {
      console.error('localStorage error:', e);
    }
  };

  /* ------------------------------------------------------------------
     REACT STATE
  ------------------------------------------------------------------ */
  const [questionIndex, setQuestionIndex] = useState(null);
  const [seenQuestions, setSeenQuestions] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [correctIndexes, setCorrectIndexes] = useState(loadStoredProgress);
  const [correctCount, setCorrectCount]     = useState(0);
  const [locked, setLocked]                 = useState(false);
  const [showHint, setShowHint]             = useState(false);
  const [showAutoHint, setShowAutoHint]     = useState(false);
  const [time, setTime]                     = useState(30);
  const [toast, setToast]                   = useState(null);
  const [showEndModal, setShowEndModal]     = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showFinalModal, setShowFinalModal]     = useState(false);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const initialLoad = useRef(false);

  /* ------------------------------------------------------------------
     FIREBASE HELPERS
  ------------------------------------------------------------------ */
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
      if (data.gender) {
        localStorage.setItem('userGender', data.gender);
        setGender(data.gender);
      }
      // if user already has 20 in this category, show Restart modal
      if (serverProg.length >= MAX_QUESTIONS_PER_CATEGORY) {
        setShowRestartModal(true);
      }
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
              [difficulty]: updatedArr,
            },
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error writing progress:', err);
    }
  };

  const resetCategoryInDB = async () => {
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
              [difficulty]: [],
            },
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error resetting category:', err);
    }
  };

  /* ------------------------------------------------------------------
     INITIAL LOAD & RELOAD ON DIFFICULTY CHANGE
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!initialLoad.current) {
      fetchProgressFromDB();
      initialLoad.current = true;
    }
    // whenever difficulty changes, reset all relevant state and load new questions
    setQuestionIndex(null);
    setSeenQuestions([]);
    setCorrectIndexes(loadStoredProgress());
    setCorrectCount(0);
    setCurrentQuestionNumber(1);
    setShowEndModal(false);
    setShowRestartModal(false);
    setShowFinalModal(false);
    loadNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  /* ------------------------------------------------------------------
     TIMER HOOK
  ------------------------------------------------------------------ */
  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          if (!locked) {
            setLocked(true);
            setToast({ message: '❌ Time’s up!', type: 'error' });
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

  /* ------------------------------------------------------------------
     QUESTION FLOW HELPERS
  ------------------------------------------------------------------ */
  const getNextQuestionIndex = () => {
    const candidates = questionsList
      .map((_, i) => i)
      .filter((i) => !seenQuestions.includes(i) && !correctIndexes.includes(i));
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const loadNextQuestion = () => {
    // 1. If user has ≥20 correct in this category already → move to next difficulty or show final modal
    if (correctIndexes.length >= MAX_QUESTIONS_PER_CATEGORY) {
      const nextDiff = getNextDifficulty();
      if (nextDiff) {
        // write the new difficulty into localStorage (namespaced)
        localStorage.setItem(DIFF_KEY, nextDiff);
        setDifficultyState(nextDiff);
        // reset category-specific progress and state
        setCorrectIndexes([]);
        storeProgressLocally([]); 
        setSeenQuestions([]);
        setQuestionIndex(null);
        setCorrectCount(0);
        setCurrentQuestionNumber(1);
        return;
      } else {
        setShowFinalModal(true);
        return;
      }
    }

    // 2. If user already answered 10 this round → show end-of-round modal
    if (currentQuestionNumber > MAX_QUESTIONS_PER_ROUND) {
      setShowEndModal(true);
      return;
    }

    // 3. Otherwise choose a new question index
    const nxt = getNextQuestionIndex();
    if (nxt === null) {
      setShowEndModal(true);
    } else {
      setSeenQuestions((prev) => [...prev, nxt]);
      setQuestionIndex(nxt);
      setSelected(null);
      setShowHint(false);
      setShowAutoHint(false);
      setTime(30);
    }
  };

  const nextQuestionAfterTimeout = () => {
    const isLastInRound = currentQuestionNumber >= MAX_QUESTIONS_PER_ROUND;
    if (isLastInRound) {
      setShowEndModal(true);
    } else {
      setCurrentQuestionNumber((n) => n + 1);
      loadNextQuestion();
      setLocked(false);
    }
  };

  const handleAnswerClick = (idx) => {
    if (selected !== null || locked) return;
    setSelected(idx);
    setLocked(true);

    const correctAudio = new Audio(correctSound);
    const wrongAudio   = new Audio(wrongSound);

    if (idx === question.correct) {
      correctAudio.play();
      if (!correctIndexes.includes(questionIndex)) {
        const updated = [...correctIndexes, questionIndex];
        setCorrectIndexes(updated);
        storeProgressLocally(updated);
        saveProgressToDB(updated);
      }
      setCorrectCount((c) => c + 1);
      setToast({ message: '✅ Correct!', type: 'success' });
    } else {
      wrongAudio.play();
      setToast({ message: '❌ Wrong!', type: 'error' });
    }

    setTimeout(() => {
      setToast(null);
      const isLastInRound = currentQuestionNumber >= MAX_QUESTIONS_PER_ROUND;
      if (isLastInRound) {
        setShowEndModal(true);
      } else {
        setCurrentQuestionNumber((n) => n + 1);
        loadNextQuestion();
        setLocked(false);
      }
    }, 1500);
  };

  function splitQuestionText(text) {
    const hebrewMatch = text.match(/['"״]?[א-ת\s,:()"'״]+['"״]?/g);
    if (!hebrewMatch) return { enPart: text, hePart: '', punctuation: '' };

    const hePart = hebrewMatch.join(' ').trim();
    const enPart = text.replace(hePart, '').replace(/[?؟!]/g, '').trim();
    const punctuationMatch = text.match(/[?؟!]/);
    const punctuation = punctuationMatch ? punctuationMatch[0] : '';
    return { enPart, hePart, punctuation };
  }

  /* ------------------------------------------------------------------
     RENDER HELPERS
  ------------------------------------------------------------------ */
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const getResultImage = () =>
    [ball0, ball1, ball2, ball3, ball4, ball5, ball6, ball7, ball8, ball9, ball10][correctCount] || ball0;

  const question =
    questionIndex !== null
      ? questionsList[questionIndex]
      : { question: '', answers: [], hint: '', authohint: '' };
  const progressPercent = ((currentQuestionNumber - 1) / MAX_QUESTIONS_PER_ROUND) * 100;
  const { enPart, hePart } = splitQuestionText(question.question);

  /* ------------------------------------------------------------------
     JSX RETURN
  ------------------------------------------------------------------ */
  return (
    <div
      dir="rtl"
      className="bg-blue-100 text-black dark:bg-gray-900 dark:text-white min-h-screen transition-colors duration-300"
    >
      {/* --------------------------- QUIZ AREA --------------------------- */}
      <div className={`relative z-10 ${showEndModal || showRestartModal || showFinalModal ? 'pointer-events-none blur-sm' : ''}`}>
        <div className="max-w-4xl mx-auto flex flex-col p-4 space-y-4">
          {questionIndex === null && !showRestartModal && !showFinalModal ? (
            <div className="p-4 text-center text-lg">Loading question...</div>
          ) : (
            <>
              {/* Header */}
              <header className="flex flex-row-reverse justify-between items-center bg-blue-200 dark:bg-blue-950 p-4 rounded-lg shadow">
                <button onClick={() => navigate('/')} className="text-xl font-semibold hover:underline">
                  ← Back to Home
                </button>
                <div className="flex items-center mx-3 gap-2">
                  <span className="text-base font-semibold text-gray-700 dark:text-gray-300">Question</span>
                  <span className="bg-blue-500 text-white rounded-full px-3 py-1 shadow-md">{currentQuestionNumber}</span>
                </div>
                <div className="bg-white py-1 px-3 rounded shadow dark:bg-gray-100">
                  <span className={time <= 5 ? 'text-red-600 font-bold' : 'text-blue-600'}>
                    {formatTime(time)}
                  </span>
                </div>
              </header>

              {/* Progress Bar */}
              <div className="w-full bg-gray-300 dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-blue-500 h-2 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-right text-sm text-gray-600 dark:text-gray-300">
                Question {currentQuestionNumber} of {MAX_QUESTIONS_PER_ROUND}
              </p>

              {/* Question Card */}
              <main className="bg-white/90 dark:bg-gray-800 p-6 rounded-xl shadow-lg text-lg flex-grow transition-all duration-300">
                <div className="flex flex-row justify-center items-center flex-wrap gap-2 text-xl font-bold text-blue-900 dark:text-blue-200">
                  <span className="text-purple-700 dark:text-purple-400 font-bold" dir="rtl">{hePart}</span>
                  <span className="text-blue-900 dark:text-blue-200" dir="ltr">{enPart}</span>
                </div>
                <ul className="space-y-2 text-right list-none p-0 m-0">
                  {question.answers.map((ans, idx) => {
                    const isCorrect = idx === question.correct;
                    const isSelected = idx === selected;
                    let bg = 'bg-white dark:bg-gray-600';
                    if (selected !== null) {
                      if (isSelected && isCorrect)       bg = 'bg-green-400';
                      else if (isSelected && !isCorrect)  bg = 'bg-red-400';
                      else if (isCorrect)                 bg = 'bg-green-400';
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerClick(idx)}
                        disabled={selected !== null || locked}
                        className={`w-full text-right p-3 rounded-lg border shadow hover:bg-blue-100 ${bg} ${(selected !== null || locked) ? 'cursor-not-allowed' : ''}`}
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
                  <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900 rounded text-right">💡 {question.hint}</div>
                )}
                {showAutoHint && question.authohint && (
                  <div className="mt-2 p-3 bg-blue-100 dark:bg-blue-900 rounded text-right animate-pulse">
                    🤖 {question.authohint}
                  </div>
                )}
              </main>

              {/* Footer */}
              <footer className="text-right text-lg mt-4">Total correct: {correctCount} 🧆</footer>
            </>
          )}
        </div>
      </div>

      {/* --------------------------- TOAST --------------------------- */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {toast.message}
        </div>
      )}

      {/* --------------------------- END MODAL --------------------------- */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 max-w-sm">
            <h2 className="text-2xl font-bold text-center">
              You’ve completed {MAX_QUESTIONS_PER_ROUND} questions!
            </h2>
            <div className="flex justify-center">
              <img src={getResultImage()} alt="Result" className="w-32 h-32" />
            </div>
            <p className="text-center">
              Correct in this round: {correctCount} / {MAX_QUESTIONS_PER_ROUND}
            </p>
            <button
              onClick={() => navigate('/progress')}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Continue to Progress
            </button>
          </div>
        </div>
      )}

      {/* --------------------------- RESTART MODAL --------------------------- */}
      {showRestartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 max-w-sm">
            <h2 className="text-2xl font-bold text-center">
              Start Over or Move to Next Level?
            </h2>
            <p className="text-center">
              You already have 20 correct answers in this category.
            </p>
            <div className="flex justify-between space-x-4 rtl:space-x-reverse">
              <button
                onClick={() => {
                  setShowRestartModal(false);
                  loadNextQuestion(); 
                }}
                className="flex-1 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
              >
                No, Thanks
              </button>
              <button
                onClick={async () => {
                  await resetCategoryInDB();
                  setCorrectIndexes([]);
                  setSeenQuestions([]);
                  setCorrectCount(0);
                  setCurrentQuestionNumber(1);
                  storeProgressLocally([]);
                  setShowRestartModal(false);
                  loadNextQuestion();
                }}
                className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Yes, Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ FINAL (All Levels) MODAL ------------------ */}
      {showFinalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 max-w-sm">
            <h2 className="text-2xl font-bold text-center">All Levels Completed!</h2>
            <p className="text-center">Congratulations – you have finished every level.</p>
            <button
              onClick={() => navigate('/progress')}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Back to Progress
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Questions;
