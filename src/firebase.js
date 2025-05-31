// Import the functions you need from the SDKs you need
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAIKhw3ci0ghZTHn684Ymb3wXGHLpL-2qQ",
  authDomain: "hebgo-1bd1e.firebaseapp.com",
  projectId: "hebgo-1bd1e",
  storageBucket: "hebgo-1bd1e.firebasestorage.app",
  messagingSenderId: "636073390957",
  appId: "1:636073390957:web:f5a7f2d4c0b4b6636d6064",
  measurementId: "G-DZY5XHD5GZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);





