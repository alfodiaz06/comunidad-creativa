import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA-DAC6U99thD6Vy3uuAdkqXfYxrr3w83Q",
  authDomain: "eduvault-prod.firebaseapp.com",
  projectId: "eduvault-prod",
  storageBucket: "eduvault-prod.firebasestorage.app",
  messagingSenderId: "445324796415",
  appId: "1:445324796415:web:677fffe4421b5ea9f747ca",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
