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

/**
 * Updates only the user's difficulty and language in Firestore,
 * and includes a timestamp indicating when the update occurred.
 */
export const saveUserDifficulty = async (uid, lang, difficulty) => {
  if (!uid) return;

  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        difficulty,
        lang,
        updatedAt: new Date(), // Records time of update
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving difficulty to Firebase:', err);
    throw err;
  }
};
