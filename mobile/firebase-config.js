// =============================================================================
// Firebase Configuration for Mobile Apps
// =============================================================================
// This configuration works for both iOS and Android React Native apps
// =============================================================================

import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';

// Firebase configuration object
// These values should be replaced with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "solarify-project.firebaseapp.com",
  projectId: "solarify-project",
  storageBucket: "solarify-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:abcdef123456",
  
  // iOS specific configuration
  iosClientId: "123456789-abcdef.apps.googleusercontent.com",
  iosBundleId: "com.solarify.mobile",
  
  // Android specific configuration
  androidClientId: "123456789-abcdef.apps.googleusercontent.com",
  androidPackageName: "com.solarify.mobile",
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Export Firebase services
export { 
  app as default,
  auth,
  firestore,
  storage,
  messaging 
};

// Firebase service instances
export const firebaseAuth = auth();
export const firebaseFirestore = firestore();
export const firebaseStorage = storage();
export const firebaseMessaging = messaging();

// Helper functions for common operations
export const FirebaseHelpers = {
  // Authentication helpers
  signInWithEmail: (email, password) => firebaseAuth.signInWithEmailAndPassword(email, password),
  signUpWithEmail: (email, password) => firebaseAuth.createUserWithEmailAndPassword(email, password),
  signOut: () => firebaseAuth.signOut(),
  getCurrentUser: () => firebaseAuth.currentUser,
  
  // Firestore helpers
  getCollection: (collectionName) => firebaseFirestore.collection(collectionName),
  getDocument: (collectionName, docId) => firebaseFirestore.collection(collectionName).doc(docId),
  addDocument: (collectionName, data) => firebaseFirestore.collection(collectionName).add(data),
  
  // Storage helpers
  uploadFile: (path, uri) => firebaseStorage.ref(path).putFile(uri),
  downloadUrl: (path) => firebaseStorage.ref(path).getDownloadURL(),
  
  // Messaging helpers
  requestPermission: () => firebaseMessaging.requestPermission(),
  getToken: () => firebaseMessaging.getToken(),
  subscribeToTopic: (topic) => firebaseMessaging.subscribeToTopic(topic),
};

// Export configuration for manual setup
export { firebaseConfig };