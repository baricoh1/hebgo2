// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA0P7Epgzq3yFPeA4b6MiNW8Omk_vH_iGc",
  authDomain: "hebgo-38419.firebaseapp.com",
  projectId: "hebgo-38419",
  storageBucket: "hebgo-38419.appspot.com", // <- תיקנתי לך פה גם
  messagingSenderId: "737678858666",
  appId: "1:737678858666:web:29fc2bd917d31849cdf3d3",
  measurementId: "G-YE7PG8TYSP"
};

// יצירת אפליקציה
const app = initializeApp(firebaseConfig);

// יצירת חיבור ל-Firestore
const db = getFirestore(app);

// 🔁 כאן החשוב:
export { app, db };
