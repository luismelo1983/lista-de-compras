import * as firebaseApp from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// ------------------------------------------------------------------
// CONFIGURAÇÃO FIREBASE
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyA7Wq13_QhuSxUKP732QaGHfRQ0KfrPJ80",
  authDomain: "lista-de-compras-a6e5e.firebaseapp.com",
  projectId: "lista-de-compras-a6e5e",
  storageBucket: "lista-de-compras-a6e5e.firebasestorage.app",
  messagingSenderId: "1019830423932",
  appId: "1:1019830423932:web:12f19f2907875b86ded4f9",
  measurementId: "G-7SDZLELYHR"
};

// Inicializa o Firebase
const app = firebaseApp.initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Inicializa Firestore com persistência offline habilitada
// Isso permite que o app funcione sem internet e sincronize depois
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager() 
  })
});