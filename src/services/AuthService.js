// src/services/authService.js
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const defaultProgress = {
  us: { easy: [], medium: [], hard: [] },
  es: { easy: [], medium: [], hard: [] },
  ru: { easy: [], medium: [], hard: [] }
};

export const registerUser = async (email, password, username, gender, lang) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Check if doc with same username exists — optional
  const oldRef = doc(db, 'users', username);
  const oldSnap = await getDoc(oldRef);
  if (oldSnap.exists()) {
    await deleteDoc(oldRef);
  }

  // Save user data to Firestore under UID
  await setDoc(doc(db, 'users', user.uid), {
    username,
    gender,
    language: lang,
    progress: defaultProgress,
    difficulty: 'easy',
  });

  // Return data for storage
  return {
    uid: user.uid,
    email: user.email,
    username,
    lang,
    difficulty: 'easy'
  };
};
