"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBLL0rmRBUj_wds9b9QRwRSMzB9Zt78Gyk",
  authDomain: "rpg-study-4c228.firebaseapp.com",
  projectId: "rpg-study-4c228",
  storageBucket: "rpg-study-4c228.firebasestorage.app",
  messagingSenderId: "952882880895",
  appId: "1:952882880895:web:58c89581449491c702fa4a",
  measurementId: "G-80SC4FWV4X"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Analytics runs client-side only
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, analytics };
