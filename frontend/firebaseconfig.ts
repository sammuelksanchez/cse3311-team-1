// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import Constants from 'expo-constants';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: "spendora-8a84e.firebaseapp.com",
  projectId: "spendora-8a84e",
  storageBucket: "spendora-8a84e.firebasestorage.app",
  messagingSenderId: "835651897002",
  appId: "1:835651897002:web:cd45c575dd42a68068f2d3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);