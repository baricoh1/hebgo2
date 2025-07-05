// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // ✅ import auth module

const firebaseConfig = {
  apiKey: "AIzaSyChbfQWxcgbQyaFyY4LQ5zFauGn0J7rvvY",
  authDomain: "hebgo-38419.firebaseapp.com",
  projectId: "hebgo-38419",
  storageBucket: "hebgo-38419.appspot.com", 
  messagingSenderId: "737678858666",
  appId: "1:737678858666:web:29fc2bd917d31849cdf3d3",
  measurementId: "G-YE7PG8TYSP"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Firestore & Auth services
const db = getFirestore(app);
const auth = getAuth(app); // <-- this is new

// 🔁 Export everything you need
export { app, db, auth };
