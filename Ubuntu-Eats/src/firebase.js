import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQ9fs_fzZaPY74GoAEe12vAxJmITjXzUE",
  authDomain: "ubuntu-eats.firebaseapp.com",
  projectId: "ubuntu-eats",
  storageBucket: "ubuntu-eats.firebasestorage.app",
  messagingSenderId: "655680348525",
  appId: "1:655680348525:web:802bb7942b47a88328fa64",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
