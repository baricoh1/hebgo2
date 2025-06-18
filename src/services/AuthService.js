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

// Login function to be used in your Login.jsx
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) throw new Error('לא נמצאו נתוני משתמש במסד.');

  const userData = userSnap.data();

  // Save data to localStorage
  localStorage.setItem('userEmail', user.email);
  localStorage.setItem('userName', userData.username || 'anonymous');
  localStorage.setItem('userGender', userData.gender || 'other');
  localStorage.setItem('userLang', userData.language || 'us');
  localStorage.setItem('userDifficulty', userData.difficulty || 'easy');
  localStorage.setItem('userUID', user.uid);

  return userData;
};
