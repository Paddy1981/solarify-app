
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

let app: FirebaseApp;
// Check if all required Firebase config keys are present
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

if (isFirebaseConfigured && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else if (isFirebaseConfigured) {
  app = getApp();
} else {
  console.error("Firebase configuration is missing. Please set up your .env.local file.");
  // Create a dummy app object to avoid crashing the app on server-side where auth might be accessed
  app = {} as FirebaseApp;
}


// Initialize Auth with explicit persistence settings.
// Firebase will attempt to use them in the order provided.
// indexedDBLocalPersistence is generally preferred by Firebase for web.
// browserLocalPersistence uses localStorage.
// inMemoryPersistence means session is lost when tab/window is closed.
let authInstance;
if (isFirebaseConfigured) {
    if (typeof window !== 'undefined') { // Ensure this runs only in the browser
      try {
        authInstance = initializeAuth(app, {
          persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence]
        });
      } catch (error) {
        console.error("Error initializing Firebase Auth with persistence:", error);
        // Fallback to getAuth if initializeAuth fails for some reason
        authInstance = getAuth(app);
      }
    } else {
      // For server environments or when window is not available during SSR pre-render
      authInstance = getAuth(app);
    }
} else {
    // Provide a dummy auth object if not configured to prevent crashes
    authInstance = {} as any;
}


const auth = authInstance;
const db = isFirebaseConfigured ? getFirestore(app) : ({} as any);
const rtdb = isFirebaseConfigured ? getDatabase(app) : ({} as any);


export { app, auth, db, rtdb, serverTimestamp };
