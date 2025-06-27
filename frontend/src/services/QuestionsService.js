// src/services/QuestionsService.js
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Language mapping used to access Firestore documents.
// Each language maps to a numeric key used in the Firestore document names.
const langMap = {
  us: '0',
  es: '1',
  ru: '2',
};

/**
 * Fetches placement (initial test) questions for a given language.
 * These are stored under the 'placementQuestions' collection using langMap keys.
 */
export const fetchPlacementQuestions = async (lang) => {
  const langCode = langMap[lang];
  if (!langCode) throw new Error('Unsupported language');

  try {
    const docRef = doc(db, 'placementQuestions', langCode);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('No questions found');

    const data = snap.data();
    return Object.values(data.easy || {}); // Only 'easy' questions are used for placement
  } catch (err) {
    console.error('Error fetching placement questions:', err);
    throw err;
  }
};

/**
 * Fetches regular questions for a specific language and difficulty level.
 * Questions are stored under the 'questions' collection using langMap keys.
 */
export const fetchQuestions = async (lang, difficulty) => {
  const langCode = langMap[lang];
  if (!langCode) throw new Error('Unsupported language');

  try {
    const docRef = doc(db, 'questions', langCode);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error('No question data found for this language');
    }

    const data = snap.data();
    return data[difficulty] || []; // Return question array for the given difficulty
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};
