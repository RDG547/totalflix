import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCq7LsKkyvs06oRQsZh8FpT8UeEERClXb8",
  authDomain: "total-flix.firebaseapp.com",
  projectId: "total-flix",
  storageBucket: "total-flix.firebasestorage.app",
  messagingSenderId: "405514835624",
  appId: "1:405514835624:web:abcd44d5e6fcb8825f149d",
  measurementId: "G-KTM6LCYZ71"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
