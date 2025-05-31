// src/firebase.js
import { initializeApp } from "firebase/app";
// Optional: remove if you don’t use analytics
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAIKhw3ci0ghZTHn684Ymb3wXGHLpL-2qQ",
  authDomain: "hebgo-1bd1e.firebaseapp.com",
  projectId: "hebgo-1bd1e",
  storageBucket: "hebgo-1bd1e.appspot.com",
  messagingSenderId: "636073390957",
  appId: "1:636073390957:web:a9129a258a3b49366d6064",
  measurementId: "G-5JEPL03PWP"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Optional

export { app };
