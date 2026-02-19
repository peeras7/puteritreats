import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your exact Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1YHtw4DA_ZbLGFU-orb1xfIVc-KLIthU",
  authDomain: "treats-43a84.firebaseapp.com",
  projectId: "treats-43a84",
  storageBucket: "treats-43a84.firebasestorage.app",
  messagingSenderId: "416741551477",
  appId: "1:416741551477:web:d55b4bb33a4906655b373c",
  measurementId: "G-JHP9W380Y2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Database and Authentication
const db = getFirestore(app);
const auth = getAuth(app);

// Export them so the rest of your app can use them
export { db, auth };