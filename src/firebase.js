// Import the functions you need from the SDKs you need
import { getFirestore } from "firebase/firestore";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0P7Epgzq3yFPeA4b6MiNW8Omk_vH_iGc",
  authDomain: "hebgo-38419.firebaseapp.com",
  projectId: "hebgo-38419",
  storageBucket: "hebgo-38419.firebasestorage.app",
  messagingSenderId: "737678858666",
  appId: "1:737678858666:web:29fc2bd917d31849cdf3d3",
  measurementId: "G-YE7PG8TYSP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);



