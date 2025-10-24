import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJovs00K-CUaIYgIArlLnIFDgsFyr4k_w",
  authDomain: "progress-checker-4f980.firebaseapp.com",
  projectId: "progress-checker-4f980",
  storageBucket: "progress-checker-4f980.firebasestorage.app",
  messagingSenderId: "295172376195",
  appId: "1:295172376195:web:e357cad649f7b39ade7db6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export { serverTimestamp };
