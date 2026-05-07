import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigComplete } from "../config/firebaseConfig.js";

export const isFirebaseEnabled = isFirebaseConfigComplete;

export const firebaseApp = isFirebaseEnabled ? initializeApp(firebaseConfig) : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;

export const db = firebaseApp ? getFirestore(firebaseApp) : null;
