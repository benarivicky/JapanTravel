// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCT81UBSC9sz3F8awSN14xyLWGs_VreOrc",
  authDomain: "japantravelplanners-d2992.firebaseapp.com",
  projectId: "japantravelplanners-d2992",
  storageBucket: "japantravelplanners-d2992.firebasestorage.app",
  messagingSenderId: "74401408081",
  appId: "1:74401408081:web:b800d86167f5962ac3c470"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
