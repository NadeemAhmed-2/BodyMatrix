import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCextMJP_Gvkr1qqBLYtfdg3p8zEXIQcqc",
  authDomain: "body-matrix-23.firebaseapp.com",
  projectId: "body-matrix-23",
  storageBucket: "body-matrix-23.firebasestorage.app",
  messagingSenderId: "368618655974",
  appId: "1:368618655974:web:94bf358ea344a9da6feb27",
  measurementId: "G-GLB14NW5P0"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // Fallback if initializeAuth was already called or fails
    auth = getAuth(app);
  }
}

export { auth };
