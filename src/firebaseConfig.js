// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyGkIDApbYkpDM95hwdvgtXhYrBWIxdMU",
  authDomain: "gen-lang-client-0512351602.firebaseapp.com",
  projectId: "gen-lang-client-0512351602",
  storageBucket: "gen-lang-client-0512351602.firebasestorage.app",
  messagingSenderId: "717123814710",
  appId: "1:717123814710:web:ac329de03dd3383e851f97"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تصدير الأدوات لاستخدامها في باقي الموقع
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
