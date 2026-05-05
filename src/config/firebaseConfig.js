const REQUIRED_FIREBASE_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const missingFirebaseEnvKeys = REQUIRED_FIREBASE_ENV_KEYS.filter((key) => {
  const value = import.meta.env[key];
  return typeof value !== "string" || value.trim() === "";
});

export const isFirebaseConfigComplete = missingFirebaseEnvKeys.length === 0;

export function getFirebaseConfigStatus() {
  return {
    enabled: isFirebaseConfigComplete,
    missingKeys: missingFirebaseEnvKeys,
    warning: isFirebaseConfigComplete
      ? null
      : `Firebase is not configured. Missing: ${missingFirebaseEnvKeys.join(", ")}.`,
  };
}
