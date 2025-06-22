// Import React, hooks, navigation, and services for questions and settings
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPlacementQuestions } from '../services/QuestionsService';
import { saveUserSettingsToDB } from '../services/SettingsService';

function PlacementTest() {
  // State for current question index
  const [current, setCurrent] = useState(0);

  // State to track score and selected answer
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);

  // State to track completion and final difficulty level
  const [completed, setCompleted] = useState(false);
  const [finalLevel, setFinalLevel] = useState(null);

  // Question data and loading state
  const [testQuestions, setTestQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation and user data from local storage
  const navigate = useNavigate();
  const userLang = localStorage.getItem('userLang') || 'us';
  const userName = localStorage.getItem('userName');

  // Load questions from server when component mounts or userLang changes
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const questions = await fetchPlacementQuestions(userLang);
        setTestQuestions(questions);
      } catch (err) {
        console.error(err.message); // Log error if fetching fails
      } finally {
        setLoading(false); // Hide loading screen after attempt
      }
    };

    loadQuestions();
  }, [userLang]);

  // Handle answer selection by user
  const handleAnswer = (index) => {
    const isCorrect = index === testQuestions[current].correct;
    const nextScore = score + (isCorrect ? 1 : 0);
    setSelected(index);

    // If this is the last question, finish test after short delay
    if (current + 1 === testQuestions.length) {
      setTimeout(() => finishTest(nextScore), 1500);
    } else {
      // Otherwise, move to the next question
      setTimeout(() => {
        setCurrent((prev) => prev + 1);
        setScore(nextScore);
        setSelected(null);
      }, 1000);
    }
  };

  // Finalize the test and determine user's difficulty level
  const finishTest = async (finalScore) => {
    setCompleted(true);

    // Determine difficulty based on score
    let difficulty = 'easy';
    if (finalScore === 5) difficulty = 'hard';
    else if (finalScore >= 3) difficulty = 'medium';

    // Set translated label for display
    setFinalLevel(
      difficulty === 'hard' ? 'קשה' :
      difficulty === 'medium' ? 'בינוני' :
      'קל'
    );

    // Save difficulty locally and in backend
    localStorage.setItem('userDifficulty', difficulty);

    try {
      const uid = localStorage.getItem('userUID');
      await saveUserSettingsToDB(uid, userLang, difficulty);
    } catch {
      // Error handling skipped – could show toast if needed
    }

    // Redirect user to homepage after delay
    setTimeout(() => navigate('/'), 2000);
  };

  // Show message if user is not logged in
  if (!userName) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center text-red-600">
        <p>אנא התחבר לפני תחילת המבחן.</p>
      </div>
    );
  }

  // Show loading screen while fetching questions
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        טוען שאלות מהמבחן...
      </div>
    );
  }

  // Calculate percentage progress for progress bar
  const progressPercent = Math.round(
    ((current + (selected !== null ? 1 : 0)) / testQuestions.length) * 100
  );

  return (
    <div
      dir="rtl"
      className="bg-blue-100 text-black dark:bg-gray-900 dark:text-white min-h-screen transition-colors duration-300"
    >
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 text-center">
        {/* Title */}
        <h1 className="text-3xl font-bold">
          מבחן רמת התחלה - {userLang.toUpperCase()}
        </h1>

        {/* Progress bar shown only during test */}
        {!completed && (
          <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-4 mt-4 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Test in progress */}
        {!completed ? (
          <>
            {/* Question header */}
            <div className="text-lg font-medium mt-2">
              שאלה <span className="font-bold">{current + 1}</span> מתוך{' '}
              <span className="font-bold">{testQuestions.length}</span>
            </div>

            {/* Actual question */}
            <div className="text-2xl font-semibold">
              {testQuestions[current].question}
            </div>

            {/* Multiple choice answers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              {testQuestions[current].answers.map((ans, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null} // Prevent answering twice
                  className={`p-4 rounded-xl shadow-md border text-right transition-all duration-200 ease-in-out hover:scale-105
                    ${
                      selected === i
                        ? i === testQuestions[current].correct
                          ? 'bg-green-200 dark:bg-green-700' // correct answer
                          : 'bg-red-200 dark:bg-red-700'     // wrong answer
                        : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700'
                    }`}
                >
                  {ans}
                </button>
              ))}
            </div>
          </>
        ) : (
          // Display final result after completion
          <div className="animate-bounce bg-green-100 dark:bg-green-800 p-6 rounded-xl shadow-lg max-w-md mx-auto text-green-700 dark:text-green-200 text-xl font-semibold">
            סיימת את המבחן! רמתך הנוכחית: {finalLevel}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlacementTest;
