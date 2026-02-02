// firebase.js - Firebase Configuration
// Follow the setup instructions to get your config values

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ IMPORTANT: Replace these with YOUR Firebase project credentials
// Get these from: Firebase Console → Project Settings → Your Apps → Config
const firebaseConfig = {
  apiKey: "AIzaSyAoiNNgSBq1K9cNQcNy4ShuVNlRoqx-iOI",
  authDomain: "melody-cards.firebaseapp.com",
  projectId: "melody-cards",
  storageBucket: "melody-cards.firebasestorage.app",
  messagingSenderId: "1032821369238",
  appId: "1:1032821369238:web:c74c3862ebca67749855b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };
export default app;
