// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDXpN6QYVLVhAhWKD9XGQYA-C9m78gxpY8",
  authDomain: "earnly-5d310.firebaseapp.com",
  projectId: "earnly-5d310",
  storageBucket: "earnly-5d310.firebasestorage.app",
  messagingSenderId: "171420312697",
  appId: "1:171420312697:web:6d6f5a8140a3bef8bae0a8",
  measurementId: "G-0F3TMPP96J"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);