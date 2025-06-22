// src/services/userSettingsService.js
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Saves the user's selected language and difficulty to Firestore.
 * Uses merge: true to preserve other fields in the user document.
 */
export const saveUserSettingsToDB = async (uid, lang, difficulty) => {
  if (!uid) return;

  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        language: lang,
        difficulty: difficulty,
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to update user settings in DB:', err);
    throw err;
  }
};
