// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA0P7Epgzq3yFPeA4b6MiNW8Omk_vH_iGc",
  authDomain: "hebgo-38419.firebaseapp.com",
  projectId: "hebgo-38419",
  storageBucket: "hebgo-38419.appspot.com", // תקן ל-appspot.com, לא .app
  messagingSenderId: "737678858666",
  appId: "1:737678858666:web:29fc2bd917d31849cdf3d3",
  measurementId: "G-YE7PG8TYSP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
