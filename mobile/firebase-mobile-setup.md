# Firebase Mobile Setup Guide

## Overview
This guide provides step-by-step instructions for configuring Firebase for the Solarify mobile applications (iOS and Android).

## Prerequisites

1. Firebase project created and configured for web
2. React Native development environment set up
3. Android Studio (for Android) and Xcode (for iOS) installed

## Firebase Console Configuration

### 1. Add Mobile Apps to Firebase Project

#### iOS Configuration
1. Go to Firebase Console → Project Settings
2. Click "Add app" → Select iOS
3. Fill in the app information:
   - **iOS bundle ID**: `com.solarify.mobile`
   - **App nickname**: `Solarify iOS`
   - **App Store ID**: (leave blank for now)

4. Download `GoogleService-Info.plist`
5. Place the file in: `mobile/SolarifyMobile/ios/SolarifyMobile/`

#### Android Configuration
1. Go to Firebase Console → Project Settings
2. Click "Add app" → Select Android
3. Fill in the app information:
   - **Android package name**: `com.solarify.mobile`
   - **App nickname**: `Solarify Android`
   - **Debug signing certificate SHA-1**: (optional for development)

4. Download `google-services.json`
5. Place the file in: `mobile/SolarifyMobile/android/app/`

### 2. Enable Firebase Services

Enable the following services in Firebase Console:

#### Authentication
- Go to Authentication → Sign-in method
- Enable the following providers:
  - ✅ Email/Password
  - ✅ Google Sign-In
  - ✅ Apple Sign-In (iOS only)
  - ✅ Anonymous (for guest access)

#### Cloud Firestore
- Go to Firestore Database → Create database
- Choose production mode
- Select your preferred location
- Import existing rules from `firestore.rules`

#### Cloud Storage
- Go to Storage → Get started
- Choose production mode
- Select your preferred location
- Import existing rules from `storage.rules`

#### Cloud Messaging (Push Notifications)
- Already enabled by default
- Configure APNs certificates for iOS
- Configure FCM for Android

## Mobile App Configuration

### React Native Firebase Setup

1. **Install React Native Firebase packages**:
   ```bash
   cd mobile/SolarifyMobile
   npm install @react-native-firebase/app
   npm install @react-native-firebase/auth
   npm install @react-native-firebase/firestore
   npm install @react-native-firebase/storage
   npm install @react-native-firebase/messaging
   ```

2. **iOS Specific Setup**:
   ```bash
   cd ios
   pod install
   ```

3. **Android Specific Setup**:
   - Ensure `google-services.json` is in `android/app/`
   - Add to `android/build.gradle`:
     ```gradle
     dependencies {
         classpath 'com.google.gms:google-services:4.3.15'
     }
     ```
   - Add to `android/app/build.gradle`:
     ```gradle
     apply plugin: 'com.google.gms.google-services'
     ```

### Firebase Configuration File

The `firebase-config.js` file is already set up with the following configuration:

```javascript
// Firebase configuration object
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "solarify-project.firebaseapp.com",
  projectId: "solarify-project",
  storageBucket: "solarify-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:abcdef123456",
  
  // iOS specific
  iosClientId: "123456789-abcdef.apps.googleusercontent.com",
  iosBundleId: "com.solarify.mobile",
  
  // Android specific
  androidClientId: "123456789-abcdef.apps.googleusercontent.com",
  androidPackageName: "com.solarify.mobile",
};
```

**⚠️ Important**: Replace the placeholder values with your actual Firebase project configuration.

## Security Configuration

### Firestore Security Rules

Update your `firestore.rules` file to include mobile-specific rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // RFQs (Request for Quotes)
    match /rfqs/{rfqId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid in resource.data.installerIds);
    }
    
    // Products
    match /products/{productId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'supplier';
    }
    
    // Quotes
    match /quotes/{quoteId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.homeownerId || 
         request.auth.uid == resource.data.installerId);
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.installerId;
    }
  }
}
```

### Storage Security Rules

Update your `storage.rules` file:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile photos
    match /users/{userId}/profile/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // RFQ related photos (roof photos, system photos)
    match /rfqs/{rfqId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/rfqs/$(rfqId)).data.userId == request.auth.uid;
    }
    
    // Product images
    match /products/{productId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Testing the Setup

### 1. Test Authentication
```javascript
import { firebaseAuth } from './firebase-config';

// Test email/password signup
const testAuth = async () => {
  try {
    const result = await firebaseAuth.createUserWithEmailAndPassword(
      'test@example.com',
      'password123'
    );
    console.log('Auth success:', result.user);
  } catch (error) {
    console.error('Auth error:', error);
  }
};
```

### 2. Test Firestore
```javascript
import { firebaseFirestore } from './firebase-config';

// Test Firestore write
const testFirestore = async () => {
  try {
    await firebaseFirestore
      .collection('users')
      .doc('test-user')
      .set({
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      });
    console.log('Firestore write success');
  } catch (error) {
    console.error('Firestore error:', error);
  }
};
```

### 3. Test Storage
```javascript
import { firebaseStorage } from './firebase-config';

// Test Storage upload (example with a test file)
const testStorage = async (fileUri) => {
  try {
    const reference = firebaseStorage.ref('test/test-file.jpg');
    await reference.putFile(fileUri);
    const url = await reference.getDownloadURL();
    console.log('Storage upload success:', url);
  } catch (error) {
    console.error('Storage error:', error);
  }
};
```

## Push Notifications Setup

### iOS APNs Configuration
1. Generate APNs certificate in Apple Developer Console
2. Upload certificate to Firebase Console → Project Settings → Cloud Messaging
3. Configure notification capabilities in Xcode

### Android FCM Configuration
1. FCM is automatically configured with `google-services.json`
2. Test push notifications from Firebase Console

## Deployment Checklist

Before deploying mobile apps:

- [ ] Firebase configuration files are in place
- [ ] Security rules are configured and tested
- [ ] Authentication providers are enabled
- [ ] Push notifications are configured
- [ ] Database indexes are optimized
- [ ] Storage buckets are configured
- [ ] App Store/Play Store metadata is ready

## Common Issues and Solutions

### Issue: Firebase not initializing
**Solution**: Ensure configuration files are in correct locations and packages are properly linked.

### Issue: Authentication not working
**Solution**: Check that auth providers are enabled in Firebase Console and configuration is correct.

### Issue: Firestore permission denied
**Solution**: Review security rules and ensure user authentication is working.

### Issue: Push notifications not working
**Solution**: Verify APNs certificates (iOS) and FCM configuration (Android).

## Next Steps

After Firebase setup is complete:

1. Build and test the mobile applications
2. Deploy to app stores
3. Set up analytics and crash reporting
4. Configure performance monitoring
5. Set up automated testing

## Support Resources

- [Firebase iOS Guide](https://firebase.google.com/docs/ios/setup)
- [Firebase Android Guide](https://firebase.google.com/docs/android/setup)
- [React Native Firebase Documentation](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com/)