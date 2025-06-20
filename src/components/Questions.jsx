// src/components/Questions.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchQuestions } from '../services/QuestionsService';
import { getUserProgress , saveUserProgress , levelUpUser} from '../services/ProgressService';

const balls = [
  '/images/ball0.png',
  '/images/ball1.png',
  '/images/ball2.png',
  '/images/ball3.png',
  '/images/ball4.png',
  '/images/ball5.png',
  '/images/ball6.png',
  '/images/ball7.png',
  '/images/ball8.png',
  '/images/ball9.png',
  '/images/ball10.png',
];

function Questions() {
  /* ------------------------------------------------------------------
     CONSTANTS & BASIC DATA
  ------------------------------------------------------------------ */
  const MAX_QUESTIONS = 10;
  const MAX_QUESTIONS_PER_CATEGORY = 20;
  const navigate = useNavigate();

  const userName = localStorage.getItem('userName');
  const lang = localStorage.getItem('userLang');
  const [currentDifficulty, setCurrentDifficulty] = useState(
    localStorage.getItem('userDifficulty')
  );

  // Fix language mapping consistency
  const langMap = { 
    "en": "0", "us": "0", // Support both en and us
    "es": "1", 
    "ru": "2" 
  };
  
  const hintTextMap = { en: 'Show Hint', es: 'Mostrar pista', ru: 'Показать подсказку' };
  const currentHintText = hintTextMap[lang] || 'Show Hint';

  /* ------------------------------------------------------------------
     REACT STATE - MOVED BEFORE EARLY RETURNS
  ------------------------------------------------------------------ */
  const [questionsList, setQuestionsList] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(null);
  const seenQuestions = useRef([]);
  const [selected, setSelected] = useState(null);
  const correctIndexes = useRef([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showAutoHint, setShowAutoHint] = useState(false);
  const [time, setTime] = useState(30);
  const [toast, setToast] = useState(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [questionsThisRound, setQuestionsThisRound] = useState(MAX_QUESTIONS);
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  // Early return checks AFTER state declarations
  if (!lang || !currentDifficulty) {
    return (
      <div className="p-4 text-red-600">
        לא ניתן לטעון את השאלות. ודא שהשפה והרמה נבחרו כראוי.
      </div>
    );
  }

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
     FIREBASE HELPERS - IMPROVED ERROR HANDLING
  ------------------------------------------------------------------ */
  const fetchQuestionsFromDB = useCallback(async () => {
    console.log('🔄 Fetching questions for:', { lang, currentDifficulty });
    try {
      const selected = await fetchQuestions(lang, currentDifficulty);
      console.log('✅ Questions fetched:', selected.length);
      setQuestionsList(selected);
      setDataLoaded(true);
    } catch (err) {
      console.error("❌ Error fetching questions:", err);
      setToast({ message: 'שגיאה בטעינת השאלות', type: 'error' });
    }
  }, [lang, currentDifficulty]);

  const fetchProgressFromDB = useCallback(async () => {
    console.log('🔄 Fetching progress...');
    try {
      const uid = localStorage.getItem('userUID');
      const { progress, gender } = await getUserProgress(uid, lang, currentDifficulty);

      if (!progress) {
        console.log('📝 No existing progress found');
        setProgressReady(true);
        return;
      }
      
      const serverProg = progress;
      console.log('📊 Server progress:', serverProg.length, 'questions');
      
      // MERGE instead of overwrite
      const mergedProgress = [...new Set([...correctIndexes.current, ...serverProg])];
      correctIndexes.current = mergedProgress;

      // AUTO LEVEL-UP - Check if we've completed the category
      if (serverProg.length >= MAX_QUESTIONS_PER_CATEGORY) {
        const next = getNextDifficulty(currentDifficulty);
        if (next) {
          console.log('🚀 Triggering level up from', currentDifficulty, 'to', next);
          setIsLevelingUp(true);
          
          // Update database first
          await levelUpUser(uid, next);
          
          // Reset game state for new difficulty
          correctIndexes.current = [];
          seenQuestions.current = [];
          setCorrectCount(0);
          setCurrentQuestionNumber(1);
          setQuestionsThisRound(MAX_QUESTIONS);
          setQuestionIndex(null);
          setSelected(null);
          setLocked(false);
          setShowHint(false);
          setShowAutoHint(false);
          setTime(30);
          setShowEndModal(false);
          
          // Update difficulty and restart
          setTimeout(() => {
            setToast(null);
            setCurrentDifficulty(next);
            localStorage.setItem('userDifficulty', next);
            setIsLevelingUp(false);
            setDataLoaded(false);
            setProgressReady(false);
          }, 3000);
          return;
        } else {
          // No next difficulty available - user completed all levels
          console.log('🏆 User completed all difficulty levels!');
          setToast({
            message: '🏆 מזל טוב! סיימת את כל הרמות!',
            type: 'levelup'
          });
          setTimeout(() => {
            navigate('/progress');
          }, 3000);
          return;
        }
      }

      if (gender) {
        localStorage.setItem('userGender', gender);
      }

      const remaining = MAX_QUESTIONS_PER_CATEGORY - serverProg.length;
      setQuestionsThisRound(Math.min(MAX_QUESTIONS, remaining));
      setProgressReady(true);
    } catch (err) {
      console.error('❌ Error fetching user progress:', err);
      setProgressReady(true); // Continue even if progress fetch fails
    }
  }, [lang, currentDifficulty, navigate]);

  const saveProgressToDB = async (updatedArr) => {
    try {
      const uid = localStorage.getItem('userUID');
      await saveUserProgress(uid, lang, currentDifficulty, updatedArr);
      console.log('💾 Saved to database:', updatedArr.length, 'correct answers');
    } catch (err) {
      console.error('❌ Error saving progress to DB:', err);
    }
  };

  /* ------------------------------------------------------------------
     QUESTION FLOW HELPERS - IMPROVED VALIDATION
  ------------------------------------------------------------------ */
  const getNextQuestionIndex = useCallback(() => {
    console.log('❓ Getting next question index...');
    console.log('questionsList length:', questionsList.length);
    console.log('seenQuestions:', seenQuestions.current.length);
    console.log('correctIndexes:', correctIndexes.current.length);
    
    if (!questionsList || questionsList.length === 0) {
      console.warn('❌ No questions available');
      return null;
    }
    
    // Filter questions that haven't been seen AND haven't been answered correctly
    const candidates = questionsList
      .map((_, i) => i)
      .filter(
        (i) =>
          !seenQuestions.current.includes(i) &&
          !correctIndexes.current.includes(i)
      );
      
    console.log('✅ Available question candidates:', candidates.length);
    
    if (candidates.length === 0) {
      console.log('❌ No more questions available');
      return null;
    }
    
    const selectedIndex = candidates[Math.floor(Math.random() * candidates.length)];
    console.log('🎯 Selected question index:', selectedIndex);
    return selectedIndex;
  }, [questionsList]);

  const loadNextQuestion = useCallback(() => {
    console.log('🔄 Loading next question...');
    console.log('Current question number:', currentQuestionNumber);
    console.log('Questions this round:', questionsThisRound);
    
    if (isLevelingUp) {
      console.log('⏸️ Skipping - currently leveling up');
      return;
    }
    
    if (currentQuestionNumber > questionsThisRound) {
      console.log('🏁 All questions completed, showing end modal');
      setShowEndModal(true);
      return;
    }
    
    const nxt = getNextQuestionIndex();
    if (nxt === null) {
      console.log('❌ No more questions available, ending quiz');
      setShowEndModal(true);
    } else {
      // Add to seen questions (but don't add already correct ones)
      if (!correctIndexes.current.includes(nxt)) {
        seenQuestions.current = [...seenQuestions.current, nxt];
      }
      
      setQuestionIndex(nxt);
      setSelected(null);
      setShowHint(false);
      setShowAutoHint(false);
      setTime(30);
      
      console.log('✅ Loaded question index:', nxt);
    }
  }, [currentQuestionNumber, questionsThisRound, isLevelingUp, getNextQuestionIndex]);

  // Shared function for moving to next question
  const moveToNextQuestion = useCallback(() => {
    console.log('➡️ Moving to next question...');
    
    if (isLevelingUp) {
      console.log('⏸️ Skipping - currently leveling up');
      return;
    }
    
    setCurrentQuestionNumber((prev) => {
      const nextNum = prev + 1;
      console.log('Question number:', prev, '->', nextNum);
      
      if (nextNum > questionsThisRound) {
        console.log('🏁 Quiz completed');
        setShowEndModal(true);
        return nextNum;
      }
      
      // Load next question after state update
      setTimeout(() => {
        loadNextQuestion();
      }, 0);
      
      return nextNum;
    });
  }, [isLevelingUp, questionsThisRound, loadNextQuestion]);

  const nextQuestionAfterTimeout = useCallback(() => {
    console.log('⏰ Question timeout');
    moveToNextQuestion();
  }, [moveToNextQuestion]);

  const handleAnswerClick = async (idx) => {
    if (selected !== null || locked || isLevelingUp) return;
    
    console.log('👆 Answer clicked:', idx);
    setSelected(idx);
    setLocked(true);

    const correctAudio = new Audio('/sounds/right_answer.mp3');
    const wrongAudio = new Audio('/sounds/wrong_answer.mp3');
    const question = questionsList[questionIndex];

    if (idx === question.correct) {
      correctAudio.play().catch(e => console.log('Audio play failed:', e));
      
      // Only add if not already in the array
      if (!correctIndexes.current.includes(questionIndex)) {
        const updated = [...correctIndexes.current, questionIndex];
        correctIndexes.current = updated;
        
        console.log('✅ Correct answer! Question index:', questionIndex);
        console.log('📊 Total correct answers:', updated.length);
        
        // Save to database asynchronously
        saveProgressToDB(updated);
      }
      
      setCorrectCount((c) => c + 1);
      setToast({ message: '✅ תשובה נכונה!', type: 'success' });
    } else {
      wrongAudio.play().catch(e => console.log('Audio play failed:', e));
      console.log('❌ Wrong answer for question index:', questionIndex);
      setToast({ message: '❌ תשובה שגויה!', type: 'error' });
    }

    setTimeout(() => {
      if (isLevelingUp) return;
      
      setToast(null);
      setLocked(false);
      moveToNextQuestion();
    }, 1500);
  };

  /* ------------------------------------------------------------------
     EFFECTS - FIXED DEPENDENCIES AND LOADING SEQUENCE
  ------------------------------------------------------------------ */
  
  // 1) Load questions when difficulty changes
  useEffect(() => {
    console.log('🔄 Effect: Loading questions for difficulty change');
    if (lang && currentDifficulty && !isLevelingUp) {
      setDataLoaded(false);
      setProgressReady(false);
      setQuestionIndex(null);
      fetchQuestionsFromDB();
    }
  }, [lang, currentDifficulty, isLevelingUp, fetchQuestionsFromDB]);

  // 2) Load progress after questions are loaded
  useEffect(() => {
    console.log('🔄 Effect: Loading progress after questions loaded');
    if (dataLoaded && !progressReady && !isLevelingUp) {
      fetchProgressFromDB();
    }
  }, [dataLoaded, progressReady, isLevelingUp, fetchProgressFromDB]);

  // 3) Load first question when both data and progress are ready
  useEffect(() => {
    console.log('🔄 Effect: Loading first question');
    console.log('dataLoaded:', dataLoaded);
    console.log('progressReady:', progressReady);
    console.log('questionIndex:', questionIndex);
    console.log('questionsList.length:', questionsList.length);
    console.log('isLevelingUp:', isLevelingUp);
    
    if (dataLoaded && progressReady && questionIndex === null && questionsList.length > 0 && !isLevelingUp) {
      console.log('✅ All conditions met - loading first question');
      loadNextQuestion();
    }
  }, [dataLoaded, progressReady, questionIndex, questionsList.length, isLevelingUp, loadNextQuestion]);

  // Timer effect
  useEffect(() => {
    if (isLevelingUp || questionIndex === null) return;
    
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
  }, [locked, isLevelingUp, questionIndex, nextQuestionAfterTimeout]);

  /* ------------------------------------------------------------------
     RENDER HELPERS
  ------------------------------------------------------------------ */
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    
  const getResultImage = () => balls[correctCount] || balls[0];
   
  // EARLY RETURN DURING LEVEL-UP
  if (isLevelingUp) {
    return (
      <div
        dir="rtl"
        className="bg-blue-100 dark:bg-gray-900 text-black dark:text-white min-h-screen
                   flex items-center justify-center transition-colors duration-300"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">מעלה רמה...</h2>
          <p className="text-gray-600 dark:text-gray-300">מתכונן למשחק חדש ברמה הבאה!</p>
        </div>
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

  // Loading states
  if (!dataLoaded || !progressReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold">טוען נתונים...</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            שאלות: {dataLoaded ? '✅' : '⏳'} | התقדמות: {progressReady ? '✅' : '⏳'}
          </p>
        </div>
      </div>
    );
  }

  // No questions available
  if (questionsList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">אין שאלות זמינות!</h2>
          <p className="mb-4">לא נמצאו שאלות לשפה ורמה שנבחרו.</p>
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

  const question = questionIndex !== null ? questionsList[questionIndex] : null;
  
  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-100 dark:bg-gray-900">
        <div className="text-xl">טוען שאלה...</div>
      </div>
    );
  }

  const progressPercent = ((currentQuestionNumber - 1) / questionsThisRound) * 100;
  const fullQuestionText = question.question;

  return (
    <div
      dir="rtl"
      className="bg-blue-100 dark:bg-gray-900 text-black dark:text-white min-h-screen transition-colors duration-300"
    >
      {/* DEBUG INFO - Remove in production */}
      <div className="fixed top-0 left-0 bg-black text-white p-2 text-xs z-50">
        Questions: {questionsList.length} | Question: {currentQuestionNumber}/{questionsThisRound}
      </div>

      {/* QUIZ AREA */}
      <div className={`relative z-10 ${showEndModal ? 'pointer-events-none blur-sm' : ''}`}>
        <div className="max-w-4xl mx-auto flex flex-col p-4 space-y-4">
          {/* Header */}
          <header className="flex flex-row-reverse justify-between items-center bg-blue-200 dark:bg-blue-950 p-4 rounded-lg shadow">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              disabled={isLevelingUp}
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
            <div className="text-center text-xl font-bold text-blue-900 dark:text-blue-200 mb-6">
              {fullQuestionText}
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
                    disabled={selected !== null || locked || isLevelingUp}
                    className={`w-full text-right p-3 rounded-lg border shadow hover:bg-blue-100 ${bg} ${
                      selected !== null || locked || isLevelingUp ? 'cursor-not-allowed' : ''
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
                disabled={locked || isLevelingUp}
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
      {showEndModal && !isLevelingUp && (
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