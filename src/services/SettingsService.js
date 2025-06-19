// src/services/userSettingsService.js
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const saveUserSettingsToDB = async (uid, lang, difficulty) => {
  if (!uid) return;

  try {
    await setDoc(doc(db, 'users', uid), {
      language: lang,
      difficulty: difficulty,
    }, { merge: true });
  } catch (err) {
    console.error('Failed to update user settings in DB:', err);
    throw err;
  }
};


export const saveUserDifficulty = async (uid, lang, difficulty) => {
  if (!uid) return;

  try {
    await setDoc(doc(db, 'users', uid), {
      difficulty,
      lang,
      updatedAt: new Date(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving difficulty to Firebase:', err);
    throw err;
  }
};