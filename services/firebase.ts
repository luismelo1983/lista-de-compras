import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA7Wq13_QhuSxUKP732QaGHfRQ0KfrPJ80",
  authDomain: "lista-de-compras-a6e5e.firebaseapp.com",
  projectId: "lista-de-compras-a6e5e",
  storageBucket: "lista-de-compras-a6e5e.firebasestorage.app",
  messagingSenderId: "1019830423932",
  appId: "1:1019830423932:web:12f19f2907875b86ded4f9",
  measurementId: "G-7SDZLELYHR"
};

// Robust Singleton Initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Explicitly register services to the app instance
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;