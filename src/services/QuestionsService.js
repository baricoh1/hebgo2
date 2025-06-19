// src/services/questionsService.js
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Language mapping used for placement question docs
const langMap = {
  us: '0',
  es: '1',
  ru: '2',
};

export const fetchPlacementQuestions = async (lang) => {
  const langCode = langMap[lang];
  if (!langCode) throw new Error('Unsupported language');

  try {
    const docRef = doc(db, 'placementQuestions', langCode);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('No questions found');

    const data = snap.data();
    return Object.values(data.easy || {});
  } catch (err) {
    console.error('Error fetching placement questions:', err);
    throw err;
  }
};