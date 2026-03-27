const firebaseConfig = {
  apiKey: "AIzaSyCtXGn956-fwfKbN7OOwpJhZoeJUvelVyE",
  authDomain: "treinamentos-orgadata.firebaseapp.com",
  projectId: "treinamentos-orgadata",
  storageBucket: "treinamentos-orgadata.firebasestorage.app",
  messagingSenderId: "915596483887",
  appId: "1:915596483887:web:3f38d6d786dba0a94095da",
  measurementId: "G-4NVMYZV4XC"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAnalytics,
  isSupported as isAnalyticsSupported
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";

const app = initializeApp(firebaseConfig);

window.firebaseConfig = firebaseConfig;
window.firebaseApp = app;
window.firebaseAnalytics = null;

try {
  const analyticsSupported = await isAnalyticsSupported();
  if (analyticsSupported) {
    window.firebaseAnalytics = getAnalytics(app);
  }
} catch (error) {
  console.warn("Firebase Analytics n\u00e3o dispon\u00edvel neste ambiente.", error);
}