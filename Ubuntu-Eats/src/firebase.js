// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGsQG8-0j79bK3_fzM_gCyt90IpIOvmd8",
  authDomain: "ubuntu-eats.firebaseapp.com",
  projectId: "ubuntu-eats",
  storageBucket: "ubuntu-eats.firebasestorage.app",
  messagingSenderId: "655680348525",
  appId: "1:655680348525:web:802bb7942b47a88328fa64",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth & firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
