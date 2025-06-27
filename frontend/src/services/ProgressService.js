// src/services/UserProgressService.js
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetches the full user progress data from Firestore.
 * Includes username, gender, difficulty, language, and progress object.
 */
export const getUserProgressData = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));

  if (!userDoc.exists()) throw new Error('User not found');

  const data = userDoc.data();
  return {
    userName: data.username || null,
    gender: data.gender || 'other',
    difficulty: data.difficulty || 'easy',
    language: data.language || 'us',
    progress: data.progress || {
      us: { easy: [], medium: [], hard: [] },
      es: { easy: [], medium: [], hard: [] },
      ru: { easy: [], medium: [], hard: [] },
    },
  };
};

/**
 * Retrieves the progress array and gender for a specific user, language, and difficulty.
 */
export const getUserProgress = async (uid, lang, difficulty) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return { progress: null, gender: null };

  const data = snap.data();
  const progress = data.progress?.[lang]?.[difficulty] || [];
  const gender = data.gender || null;

  return { progress, gender };
};

/**
 * Saves updated progress array to Firestore for a specific user, language, and difficulty.
 */
export const saveUserProgress = async (uid, lang, difficulty, updatedArr) => {
  const ref = doc(db, 'users', uid);
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
};

/**
 * Updates the user's difficulty level in Firestore and localStorage.
 */
export const levelUpUser = async (uid, nextDifficulty) => {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { difficulty: nextDifficulty }, { merge: true });
  localStorage.setItem('userDifficulty', nextDifficulty);
};
