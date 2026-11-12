/**
 * Firebase Client Configuration
 * Project: after-hours-studio-9b4
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA1CiPA9SsK6Vzki8t4NV-nGe9P3RSPNVQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "after-hours-studio-9b4.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "after-hours-studio-9b4",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "after-hours-studio-9b4.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "791993110767",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:791993110767:web:5daf440baab2fd9b764b1a",
};
