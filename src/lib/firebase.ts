import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB0eED9JbSQXvPfFJPNOhRiZSm5PpbTkjk",
  authDomain: "portfolio-mali-erdogan.firebaseapp.com",
  projectId: "portfolio-mali-erdogan",
  storageBucket: "portfolio-mali-erdogan.firebasestorage.app",
  messagingSenderId: "263756724892",
  appId: "1:263756724892:web:517a7b71798c682e554b59",
  measurementId: "G-11J83J99DY"
};

// Initialize Firebase (Singleton pattern to prevent re-initialization errors in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
