// mobile/src/lib/firebase.ts
// Firebase initialization with React Native AsyncStorage persistence so
// the user stays signed in across app restarts.
import Constants from 'expo-constants';
import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-expect-error - getReactNativePersistence is not exported in types
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId,
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Fast refresh re-runs this file — fall back to the existing instance.
  auth = getAuth(app);
}

export { app, auth };
export const db = getFirestore(app);
