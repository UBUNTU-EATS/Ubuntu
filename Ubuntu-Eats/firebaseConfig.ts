import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGsQG8-0j79bK3_fzM_gCyt90IpIOvmd8",
  authDomain: "ubuntu-eats.firebaseapp.com",
  projectId: "ubuntu-eats",
  storageBucket: "ubuntu-eats.firebasestorage.app",
  messagingSenderId: "655680348525",
  appId: "1:655680348525:web:9826e304f50e5c4b28fa64"
};

// Debug: Check if config values are loaded
console.log('Firebase Config Check:', {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: !!firebaseConfig.authDomain,
  projectId: !!firebaseConfig.projectId,
});

// Only initialize if we have the required config
if (!firebaseConfig.apiKey) {
  console.error('Firebase configuration is missing. Check environment variables.');
  throw new Error('Firebase configuration is incomplete');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();