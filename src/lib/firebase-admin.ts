import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { serverEnv } from './env';

let app: App;
let auth: Auth;
let db: Firestore;
let storage: Storage;

// Initialize Firebase Admin SDK (server-side only)
function initializeFirebaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin SDK should only be used on the server side');
  }

  try {
    // Check if Firebase Admin is already initialized
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      // Initialize with service account credentials
      const privateKey = serverEnv.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      app = initializeApp({
        credential: cert({
          projectId: serverEnv.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: serverEnv.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket: `${serverEnv.FIREBASE_ADMIN_PROJECT_ID}.appspot.com`,
      });

      console.log('✅ Firebase Admin SDK initialized successfully');
    }

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    return { app, auth, db, storage };
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw new Error('Firebase Admin initialization failed');
  }
}

// Initialize if on server-side
if (typeof window === 'undefined') {
  try {
    const services = initializeFirebaseAdmin();
    app = services.app;
    auth = services.auth;
    db = services.db;
    storage = services.storage;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// Helper function to verify authentication tokens
export async function verifyAuthToken(token: string) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return { success: true, user: decodedToken };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { success: false, error: 'Invalid token' };
  }
}

// Helper function to get user role
export async function getUserRole(uid: string): Promise<string | null> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData?.role || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

// Helper function to check if user has required role
export async function hasRole(uid: string, requiredRole: string): Promise<boolean> {
  try {
    const userRole = await getUserRole(uid);
    return userRole === requiredRole;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

// Helper function to create custom claims for roles
export async function setUserRole(uid: string, role: string) {
  try {
    await auth.setCustomUserClaims(uid, { role });
    console.log(`✅ Set custom claims for user ${uid}: role=${role}`);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
}

// Health check for Firebase Admin
export function checkAdminConnection(): boolean {
  try {
    return !!(app && auth && db && storage);
  } catch (error) {
    console.error('Firebase Admin connection check failed:', error);
    return false;
  }
}

// Export services (will be undefined on client-side)
export { app as adminApp, auth as adminAuth, db as adminDb, storage as adminStorage };