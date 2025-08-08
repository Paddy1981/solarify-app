
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence, inMemoryPersistence, type Auth } from "firebase/auth";
import { getFirestore, serverTimestamp, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { clientEnv, validateEnvironment } from "./env";

// Validate environment on module load
if (!validateEnvironment()) {
  console.error('Firebase configuration validation failed. Check environment variables.');
}

const firebaseConfig = {
  apiKey: clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: clientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: clientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: clientEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: clientEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isFirebaseConfigured = !!firebaseConfig.apiKey && validateEnvironment();

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;
let storage: FirebaseStorage;

if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  if (typeof window !== 'undefined') {
    try {
      auth = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence]
      });
    } catch (error) {
      console.error("Error initializing Firebase Auth with persistence:", error);
      auth = getAuth(app);
    }
  } else {
    auth = getAuth(app);
  }

  db = getFirestore(app);
  rtdb = getDatabase(app);
  storage = getStorage(app);

} else {
  console.warn("Firebase configuration is MISSING. The app will run in a mock state. Please set up your .env.local file.");
  
  app = {} as FirebaseApp;
  auth = {
    onAuthStateChanged: () => () => {}, // Return an empty unsubscribe function
  } as unknown as Auth;
  db = {} as Firestore;
  rtdb = {} as Database;
  storage = {} as FirebaseStorage;
}

// Health check function
export function checkFirebaseConnection(): boolean {
  try {
    return !!(app && auth && db && storage && isFirebaseConfigured);
  } catch (error) {
    console.error('Firebase connection check failed:', error);
    return false;
  }
}

// Export configuration info for debugging (development only)
export const firebaseDebugInfo = process.env.NODE_ENV === 'development' ? {
  projectId: firebaseConfig.projectId,
  isConfigured: isFirebaseConfigured,
  hasValidConfig: validateEnvironment(),
} : undefined;

export { app, auth, db, rtdb, storage, serverTimestamp };
