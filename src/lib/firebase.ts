
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence, inMemoryPersistence, type Auth } from "firebase/auth";
import { getFirestore, serverTimestamp, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;

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

} else {
  console.warn("Firebase configuration is MISSING. The app will run in a mock state. Please set up your .env.local file.");
  
  app = {} as FirebaseApp;
  auth = {
    onAuthStateChanged: () => () => {}, // Return an empty unsubscribe function
  } as unknown as Auth;
  db = {} as Firestore;
  rtdb = {} as Database;
}

export { app, auth, db, rtdb, serverTimestamp };
