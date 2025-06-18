// src/services/UserProgressService.js
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
