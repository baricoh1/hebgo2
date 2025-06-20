// Core React and router imports
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Services for fetching questions and managing progress
import { fetchQuestions } from '../services/QuestionsService';
import { getUserProgress, saveUserProgress, levelUpUser } from '../services/ProgressService';

// Array of images representing the result score
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
     CONSTANTS & USER DATA
  ------------------------------------------------------------------ */
  // Game limits
  const MAX_QUESTIONS = 10;
  const MAX_QUESTIONS_PER_CATEGORY = 20;

  // Navigation function
  const navigate = useNavigate();

  // Retrieve user info from local storage
  const lang = localStorage.getItem('userLang');
  const [currentDifficulty, setCurrentDifficulty] = useState(localStorage.getItem('userDifficulty'));

  // Mapping for language and hints
  const hintTextMap = { en: 'Show Hint', es: 'Mostrar pista', ru: 'Показать подсказку' };
  const currentHintText = hintTextMap[lang] || 'Show Hint';

  /* ------------------------------------------------------------------
     STATE MANAGEMENT
  ------------------------------------------------------------------ */
  // Main states for questions, progress, and UI interaction
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




  // Return message if language or difficulty are missing
  if (!lang || !currentDifficulty) {
    return (
      <div className="p-4 text-red-600">
        לא ניתן לטעון את השאלות. ודא שהשפה והרמה נבחרו כראוי.
      </div>
    );
  }

  // Get next level after current
  const getNextDifficulty = (level) => {
    const levels = ['easy', 'medium', 'hard'];
    const idx = levels.indexOf(level);
    return idx < levels.length - 1 ? levels[idx + 1] : null;
  };



  /* ------------------------------------------------------------------
     DATABASE OPERATIONS
  ------------------------------------------------------------------ */
  // Fetch questions based on selected language and difficulty
  const fetchQuestionsFromDB = async () => {
    try {
      const selected = await fetchQuestions(lang, currentDifficulty);
      setQuestionsList(selected);
      setDataLoaded(true);
    } catch (err) {
      console.error("❌ Error fetching questions:", err);
      setToast({ message: 'שגיאה בטעינת השאלות', type: 'error' });
    }
  };

  // Fetch user's progress from the database and handle level-up logic
  const fetchProgressFromDB = async () => {
    try {
      // Get user ID from localStorage
      const uid = localStorage.getItem('userUID');

      // Fetch user's progress and gender for current language and difficulty
      const { progress, gender } = await getUserProgress(uid, lang, currentDifficulty);

      // If no progress is returned, mark progress as ready and exit
      if (!progress) {
        setProgressReady(true);
        return;
      }

      const serverProg = progress;

      // Merge current local progress with server progress to avoid duplicates
      const mergedProgress = [...new Set([...correctIndexes.current, ...serverProg])];
      correctIndexes.current = mergedProgress;

      // Auto level-up logic: if user completed the full question set in this category
      if (serverProg.length >= MAX_QUESTIONS_PER_CATEGORY) {
        const next = getNextDifficulty(currentDifficulty);

        // If there's a next level, initiate level-up sequence
        if (next) {
          setIsLevelingUp(true);

          // Update difficulty level in backend
          await levelUpUser(uid, next);

          // Reset all relevant game state before advancing
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

          // Update local difficulty and trigger re-fetch after delay
          setTimeout(() => {
            setToast(null);
            setCurrentDifficulty(next);
            setIsLevelingUp(false);
            setDataLoaded(false);
            setProgressReady(false);
          }, 3000);
          return;
        } else {
          // If no next difficulty exists, user completed all levels
          setToast({
            message: '🎉 כל הכבוד, עלית רמה!',
            type: 'levelup'
          });

          // Navigate to progress screen after short delay
          setTimeout(() => {
            navigate('/progress');
          }, 3000);
          return;
        }
      }

      // If gender was returned, save it locally
      if (gender) {
        localStorage.setItem('userGender', gender);
      }

      // Calculate how many questions are left in the current category
      const remaining = MAX_QUESTIONS_PER_CATEGORY - serverProg.length;

      // Set number of questions to show this round (up to MAX_QUESTIONS)
      setQuestionsThisRound(Math.min(MAX_QUESTIONS, remaining));

      // Mark progress data as ready to proceed
      setProgressReady(true);
    } catch (err) {
      // Log any errors and still allow progress to continue
      console.error('Error fetching user progress:', err);
      setProgressReady(true); // Allow app to continue even if this fails
    }
  };

  // Save updated progress array to the database for the current user
  const saveProgressToDB = async (updatedArr) => {
    try {
      // Retrieve user ID
      const uid = localStorage.getItem('userUID');

      // Send updated progress to backend
      await saveUserProgress(uid, lang, currentDifficulty, updatedArr);
    } catch (err) {
      // Log any errors during save operation
      console.error('Error saving progress to DB:', err);
    }
  };


  /* ------------------------------------------------------------------
   EFFECTS - IMPROVED LOADING SEQUENCE
------------------------------------------------------------------ */

  // 1) Load questions first when language and difficulty are available,
  //    and the user is not currently leveling up
  useEffect(() => {
    if (lang && currentDifficulty && !isLevelingUp) {
      fetchQuestionsFromDB();
    }
  }, [lang, currentDifficulty, isLevelingUp]);

  // 2) After questions are loaded, fetch user's progress
  //    Only if not already done and not in level-up mode
  useEffect(() => {
    if (dataLoaded && !progressReady && !isLevelingUp) {
      fetchProgressFromDB();
    }
  }, [dataLoaded, isLevelingUp]);

  // 3) Reset progress-related state when difficulty changes
  //    This clears previous session's progress and prepares for the new difficulty level
useEffect(() => {
  if (!isLevelingUp) {
    correctIndexes.current = [];        // Clear correct answers
    seenQuestions.current = [];         // Clear seen questions
    setProgressReady(false);            // Reset progress readiness flag
    setDataLoaded(false);               // Mark questions as not loaded

    if (questionIndex !== null) {
      setQuestionIndex(null);           // Clear only if something exists
    }

    setCurrentQuestionNumber(1);        // Reset question counter
    
  }
}, [currentDifficulty]);


// 4) Once both questions and progress are ready, load the next question exactly once per reset
useEffect(() => {

  if (
    dataLoaded &&
    progressReady &&
    questionIndex === null &&   
    questionsList.length > 0 &&
    !isLevelingUp
  ) {
    loadNextQuestion();
  }
}, [
  dataLoaded,
  progressReady,
  questionIndex,
  questionsList.length,
  isLevelingUp,
]);

// 1) Reset and start countdown on every change of questionIndex
useEffect(() => {
  if (isLevelingUp) return;

  setTime(30);
  setShowAutoHint(false);
  setToast(null);


  const intervalId = setInterval(() => {
    setTime(prev => prev - 1);
  }, 1000);

  return () => clearInterval(intervalId);
}, [questionIndex, isLevelingUp]);

useEffect(() => {
  if (time === 11) {
    setShowAutoHint(true);
  }
  if (time <= 0) {
    setToast({ message: '❌ תם הזמן!', type: 'error' });
    nextQuestionAfterTimeout();
  }
}, [time]);


  /* ------------------------------------------------------------------
     QUESTION FLOW HELPERS - IMPROVED VALIDATION
  ------------------------------------------------------------------ */

  // Selects the index of the next available question
  // Filters out questions already seen or correctly answered
  const getNextQuestionIndex = () => {
    if (!questionsList || questionsList.length === 0) {
      console.warn('No questions available');
      return null;
    }

    // Get all indexes of questions that haven't been seen or answered correctly
    const candidates = questionsList
      .map((_, i) => i)
      .filter(
        (i) =>
          !seenQuestions.current.includes(i) &&
          !correctIndexes.current.includes(i)
      );

    if (candidates.length === 0) return null;

    // Return a random candidate from the filtered list
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  // Loads the next question to be displayed
  const loadNextQuestion = () => {

     if (isLevelingUp){
       return; // Prevent loading while transitioning levels 
       }
// Prevent re-loading if a question is already selected

  if (questionIndex !== null)return; 
    

    // If user answered all questions for this round, show the end modal
    if (currentQuestionNumber > questionsThisRound) {
      setShowEndModal(true);
      navigate('/progress'); 
      return;
    }

    const nxt = getNextQuestionIndex();

    if (nxt === null) {
      setShowEndModal(true);
      navigate('/progress'); 
    } else {
        if (!seenQuestions.current.includes(nxt)) {
          seenQuestions.current.push(nxt);
    }

      // Update state to show the selected question
      setQuestionIndex(nxt);
      setSelected(null);
      setShowHint(false);
      setShowAutoHint(false);
      setTime(30); // Reset timer

    }
  };
const nextQuestionAfterTimeout = () => {
  if (isLevelingUp) return; // Skip if currently transitioning to the next level

  const last = currentQuestionNumber >= questionsThisRound; // Check if this is the last question

  if (last) {
    setShowEndModal(true);  // Show end-of-quiz modal
    return;
  }

  if (questionIndex !== null && !seenQuestions.current.includes(questionIndex)) {
    seenQuestions.current.push(questionIndex);
  }
  setQuestionIndex(null);
  setCurrentQuestionNumber(n => {
    return n + 1;
  });

  setLocked(false);
};


  // Handles user answer selection
  const handleAnswerClick = async (idx) => {
    // Prevent interaction if a choice has already been made, the UI is locked, or a level-up is in progress
    if (selected !== null  || isLevelingUp){
      return; // Exit if already selected, locked, or leveling up 
    } 

    setSelected(idx); // Mark the selected answer
    setLocked(true);  // Lock UI to prevent double-clicks

    const correctAudio = new Audio('/sounds/right_answer.mp3');
    const wrongAudio = new Audio('/sounds/wrong_answer.mp3');
    const question = questionsList[questionIndex]; // Get the current question
    if (questionIndex !== null && !seenQuestions.current.includes(questionIndex)) {
      seenQuestions.current.push(questionIndex);
}


    // If the answer is correct:
    if (idx === question.correct) {
      correctAudio.play().catch(e => console.log('Audio play failed:', e));

      // Add the question to the correct list only if not already saved
      if (questionIndex !== null && !correctIndexes.current.includes(questionIndex)) {
        const updated = [...correctIndexes.current, questionIndex];
        correctIndexes.current = updated;
        saveProgressToDB(updated); // Save progress in background
      } else {
        console.log('ℹ️ Question', questionIndex, 'already answered correctly');
      }

      setCorrectCount((c) => c + 1); // Increase correct answers counter
      setToast({ message: '✅ תשובה נכונה!', type: 'success' }); // Show success toast
    } else {
      // Wrong answer
      wrongAudio.play().catch(e => console.log('Audio play failed:', e));
      setToast({ message: '❌ תשובה שגויה!', type: 'error' }); // Show error toast
    }

    // Wait 1.5 seconds before loading the next question
setTimeout(() => {
  if (isLevelingUp) return;

  setToast(null);
  setQuestionIndex(null);
  setCurrentQuestionNumber(n => n + 1);
  setLocked(false);
}, 1500);

  };

  /* ------------------------------------------------------------------
     RENDER HELPERS
  ------------------------------------------------------------------ */

  // Converts seconds to mm:ss format for countdown timer display
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Returns the image corresponding to the number of correct answers
  const getResultImage = () => balls[correctCount] || balls[0];

  // EARLY RETURN DURING LEVEL-UP – loading screen for level transition
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

  // EARLY RETURN: Display message if no questions available or still loading
  if (questionsList.length === 0 && (!dataLoaded || !progressReady)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          {dataLoaded && progressReady ? (
            <>
              <h2 className="text-2xl font-bold mb-4 text-red-600">אין שאלות זמינות!</h2>
              <p className="mb-4">לא נמצאו שאלות לשפה ורמה שנבחרו.</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                חזרה לעמוד הראשי
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold">טוען שאלות...</h2>
            </>
          )}
        </div>
      </div>
    );
  }

  // Get the current question object from the list
  const question = questionIndex !== null ? questionsList[questionIndex] : null;

  // Show loading screen if question is not ready yet
  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-100 dark:bg-gray-900">
        <div className="text-xl">טוען שאלה...</div>
      </div>
    );
  }

  // Calculate progress bar percentage
  const progressPercent = ((currentQuestionNumber - 1) / questionsThisRound) * 100;

  // Store full question text
  const fullQuestionText = question.question;
  return (
    <div
      dir="rtl"
      className="bg-blue-100 dark:bg-gray-900 text-black dark:text-white min-h-screen transition-colors duration-300"
    >
      {/* QUIZ AREA - Blur and disable interactions if end modal is open */}
      <div className={`relative z-10 ${showEndModal ? 'pointer-events-none blur-sm' : ''}`}>
        <div className="max-w-4xl mx-auto flex flex-col p-4 space-y-4">

          {/* HEADER - Contains back button, question number, and countdown timer */}
          <header className="flex flex-row-reverse justify-between items-center bg-blue-200 dark:bg-blue-950 p-4 rounded-lg shadow">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              disabled={isLevelingUp} // Prevent navigating away during level-up
            >
              ← חזרה לעמוד ראשי
            </button>

            {/* Current question number indicator */}
            <div className="flex items-center mx-3 gap-2">
              <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
                שאלה
              </span>
              <span className="bg-blue-500 text-white rounded-full px-3 py-1 shadow-md">
                {currentQuestionNumber}
              </span>
            </div>

            {/* Countdown timer with red highlight if time is low */}
            <div className="bg-white py-1 px-3 rounded shadow dark:bg-gray-100">
              <span
                className={time <= 5 ? 'text-red-600 font-bold' : 'text-blue-600'}
              >
                {formatTime(time)}
              </span>
            </div>
          </header>

          {/* PROGRESS BAR - Shows percent completion of quiz */}
          <div className="w-full bg-gray-300 dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-blue-500 h-2 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Progress text */}
          <p className="text-right text-sm text-gray-600 dark:text-gray-300">
            שאלה {currentQuestionNumber} מתוך {questionsThisRound}
          </p>

          {/* QUESTION CARD - Displays question text, answers, hints */}
          <main className="bg-white/90 dark:bg-gray-800 p-6 rounded-xl shadow-lg text-lg flex-grow transition-all duration-300">
            {/* Question title */}
            <div className="text-center text-xl font-bold text-blue-900 dark:text-blue-200">
              {fullQuestionText}
            </div>

            {/* Answers list */}
            <ul className="space-y-2 text-right list-none p-0 m-0">
              {question.answers.map((ans, idx) => {
                const isCorrect = idx === question.correct;
                const isSelected = idx === selected;
                let bg = 'bg-white dark:bg-gray-600';

                // Highlighting logic after selection
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
                    className={`w-full text-right p-3 rounded-lg border shadow hover:bg-blue-100 ${bg} ${selected !== null || locked || isLevelingUp ? 'cursor-not-allowed' : ''
                      }`}
                  >
                    {ans}
                  </button>
                );
              })}
            </ul>

            {/* Show Hint Button */}
            <div className="mt-6 flex items-center justify-between">
              <button
                className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500"
                onClick={() => setShowHint(true)}
                disabled={locked || isLevelingUp}
              >
                {currentHintText}
              </button>
            </div>

            {/* Manual Hint Display */}
            {showHint && (
              <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900 rounded text-right">
                💡 {question.hint}
              </div>
            )}

            {/* Auto Hint Display (when time gets low) */}
            {showAutoHint && question.authohint && (
              <div className="mt-2 p-3 bg-blue-100 dark:bg-blue-900 rounded text-right animate-pulse">
                🤖 {question.authohint}
              </div>
            )}
          </main>

          {/* FOOTER - Shows total score (falafel count) */}
          <footer className="text-right text-lg mt-4">
            סה״כ פלאפלים שנאספו: {correctCount} 🧆
          </footer>
        </div>
      </div>

      {/* TOAST MESSAGE - Appears after answer selection */}
      {toast && !isLevelingUp && (
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-lg shadow-lg ${toast.type === 'success'
              ? 'bg-green-600'
              : toast.type === 'levelup'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse'
                : 'bg-red-600'
            } text-white`}
        >
          {toast.message}
        </div>
      )}

      {/* END MODAL - Displayed after final question */}
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