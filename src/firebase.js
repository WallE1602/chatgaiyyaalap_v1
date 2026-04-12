// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjmQmqKybLFz3xNGQJvoTgphAQfdQxbiM",
  authDomain: "chatgaiyyaalap.firebaseapp.com",
  projectId: "chatgaiyyaalap",
  storageBucket: "chatgaiyyaalap.firebasestorage.app",
  messagingSenderId: "230950603465",
  appId: "1:230950603465:web:78559c34f608a238951b18",
  measurementId: "G-TVME5CBQT9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
