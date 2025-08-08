# Firebase Setup Guide for Solarify Mobile Apps

This guide walks you through setting up Firebase for both iOS and Android versions of the Solarify mobile app.

## Overview

Solarify mobile apps use the same Firebase project as the web application, ensuring data consistency and unified authentication across all platforms.

## Prerequisites

- Existing Firebase project (from web app setup)
- Firebase CLI installed (`npm install -g firebase-tools`)
- Apple Developer Account (for iOS)
- Google Play Console Account (for Android)

## Firebase Project Configuration

### 1. Add Mobile Apps to Existing Project

Since you already have a Firebase project for the web app, you'll add iOS and Android apps to the same project.

#### iOS App Setup

1. **Go to Firebase Console:**
   - Navigate to your existing Solarify Firebase project
   - Click "Add app" and select iOS

2. **Register iOS App:**
   ```
   Bundle ID: com.solarify.mobile
   App nickname: Solarify iOS
   App Store ID: (leave empty for now)
   ```

3. **Download Configuration:**
   - Download `GoogleService-Info.plist`
   - Place it in `SolarifyMobile/ios/SolarifyMobile/`

#### Android App Setup

1. **Go to Firebase Console:**
   - In the same project, click "Add app" and select Android

2. **Register Android App:**
   ```
   Package name: com.solarify.mobile
   App nickname: Solarify Android
   SHA-1 certificate fingerprint: (generate using keytool - see below)
   ```

3. **Generate SHA-1 fingerprint:**
   ```bash
   cd android/app
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

4. **Download Configuration:**
   - Download `google-services.json`
   - Place it in `SolarifyMobile/android/app/`

### 2. Enable Required Firebase Services

Ensure the following services are enabled in your Firebase project:

- **Authentication** ✅ (already enabled for web)
- **Firestore Database** ✅ (already enabled for web)
- **Storage** ✅ (for photo uploads)
- **Cloud Messaging** 🆕 (for push notifications)
- **App Distribution** 🆕 (for testing)

## Mobile-Specific Configuration

### Cloud Messaging (Push Notifications)

1. **iOS Setup:**
   - Upload APNs certificate or key to Firebase Console
   - Enable Push Notifications in Xcode capabilities

2. **Android Setup:**
   - Firebase automatically configures FCM for Android
   - No additional setup required

### Firebase App Distribution

For beta testing and internal distribution:

1. **Enable App Distribution** in Firebase Console
2. **Upload builds** for testing:
   ```bash
   # iOS
   firebase appdistribution:distribute ios/build/Build/Products/Release-iphoneos/SolarifyMobile.ipa \
     --app 1:123456789:ios:abcdef123456 \
     --groups "testers"

   # Android
   firebase appdistribution:distribute android/app/build/outputs/apk/release/app-release.apk \
     --app 1:123456789:android:abcdef123456 \
     --groups "testers"
   ```

## Code Configuration

### Update Mobile App Configuration

Update `SolarifyMobile/src/constants/config.ts`:

```typescript
export const CONFIG = {
  APP_NAME: 'Solarify',
  VERSION: '1.0.0',
  
  // Firebase Configuration
  FIREBASE_CONFIG: {
    apiKey: "your-api-key",
    authDomain: "solarify-prod.firebaseapp.com",
    projectId: "solarify-prod",
    storageBucket: "solarify-prod.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    
    // iOS-specific
    iosBundleId: "com.solarify.mobile",
    
    // Android-specific
    androidPackageName: "com.solarify.mobile"
  },
  
  // Environment-specific endpoints
  API_BASE_URL: __DEV__ 
    ? 'https://solarify-staging.web.app/api' 
    : 'https://solarify-prod.web.app/api',
    
  // ... rest of config
} as const;
```

### Firebase Security Rules (Mobile-Optimized)

Update Firestore security rules to support mobile use cases:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // RFQs - homeowners can create/edit their own, installers can read active ones
    match /rfqs/{rfqId} {
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.homeowner_id;
      allow read, update: if request.auth != null && (
        request.auth.uid == resource.data.homeowner_id ||
        resource.data.status == 'active'
      );
    }
    
    // Quotes - installers can create, homeowners can read their RFQ quotes
    match /quotes/{quoteId} {
      allow create: if request.auth != null &&
        request.auth.token.role == 'installer';
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.installer_id ||
        request.auth.uid == get(/databases/$(database)/documents/rfqs/$(resource.data.rfq_id)).data.homeowner_id
      );
    }
    
    // Photo uploads - users can upload to their own folders
    match /photo_uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public data (solar incentives, utility rates, etc.)
    match /public_data/{document=**} {
      allow read: if true;
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User-specific photo uploads
    match /uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        resource.size < 10 * 1024 * 1024 && // 10MB limit
        resource.contentType.matches('image/.*');
    }
    
    // RFQ-specific photos
    match /rfq_photos/{rfqId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        exists(/databases/(default)/documents/rfqs/$(rfqId)) &&
        get(/databases/(default)/documents/rfqs/$(rfqId)).data.homeowner_id == request.auth.uid;
    }
    
    // Public assets
    match /public/{allPaths=**} {
      allow read: if true;
    }
  }
}
```

## Platform-Specific Setup

### iOS Configuration

1. **Update Info.plist:**
   ```xml
   <!-- Camera permission -->
   <key>NSCameraUsageDescription</key>
   <string>Solarify needs camera access to capture roof photos for solar assessments</string>
   
   <!-- Location permission -->
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>Solarify uses location to find nearby solar installers and optimize system design</string>
   
   <!-- Photo library permission -->
   <key>NSPhotoLibraryUsageDescription</key>
   <string>Solarify needs photo access to select roof images for solar assessments</string>
   ```

2. **Update AppDelegate.m:**
   ```objc
   #import <Firebase.h>
   #import <UserNotifications/UserNotifications.h>
   
   - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
   {
     [FIRApp configure]; // Add this line
     
     // Request notification permissions
     UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
     center.delegate = self;
     [center requestAuthorizationWithOptions:(UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge)
                           completionHandler:^(BOOL granted, NSError * _Nullable error) {
                             // Handle permission response
                           }];
     
     return YES;
   }
   ```

### Android Configuration

1. **Update AndroidManifest.xml:**
   ```xml
   <!-- Permissions -->
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.INTERNET" />
   
   <!-- Firebase Messaging Service -->
   <service
     android:name=".java.MyFirebaseMessagingService"
     android:exported="false">
     <intent-filter>
       <action android:name="com.google.firebase.MESSAGING_EVENT" />
     </intent-filter>
   </service>
   ```

2. **Update build.gradle (app level):**
   ```gradle
   dependencies {
     // Firebase
     implementation 'com.google.firebase:firebase-analytics'
     implementation 'com.google.firebase:firebase-messaging'
     
     // Camera and location
     implementation 'com.google.android.gms:play-services-location:21.0.1'
   }
   
   apply plugin: 'com.google.gms.google-services'
   ```

## Testing Firebase Integration

### Test Authentication

```typescript
// src/services/auth.service.test.ts
import { AuthService } from '@solarify/services';

describe('AuthService', () => {
  test('should authenticate user with email/password', async () => {
    const result = await AuthService.signInWithEmailAndPassword(
      'test@example.com',
      'password123'
    );
    
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });
});
```

### Test Firestore Connection

```typescript
// src/services/firestore.service.test.ts
import { RFQService } from '@solarify/services';

describe('RFQService', () => {
  test('should create and retrieve RFQ', async () => {
    const rfqData = {
      property: {
        address: '123 Solar St, Sunnydale, CA',
        latitude: 37.7749,
        longitude: -122.4194,
        // ... other properties
      },
      // ... other RFQ data
    };
    
    const createdRFQ = await RFQService.createRFQ(rfqData);
    const retrievedRFQ = await RFQService.getRFQ(createdRFQ.id);
    
    expect(retrievedRFQ.property.address).toBe(rfqData.property.address);
  });
});
```

## Debugging Firebase Issues

### Common Issues

1. **Authentication Errors:**
   ```bash
   # Check Firebase project configuration
   firebase projects:list
   firebase use <project-id>
   ```

2. **iOS Build Errors:**
   - Ensure `GoogleService-Info.plist` is added to Xcode project
   - Clean build folder: `cd ios && xcodebuild clean`

3. **Android Build Errors:**
   - Verify `google-services.json` is in `android/app/`
   - Clean build: `cd android && ./gradlew clean`

### Enable Debug Logging

**iOS:**
```objc
[FIRApp configure];
[[FIRConfiguration sharedInstance] setLoggerLevel:FIRLoggerLevelDebug];
```

**Android:**
```bash
adb shell setprop log.tag.FirebaseApp DEBUG
adb shell setprop log.tag.FirebaseAuth DEBUG
adb shell setprop log.tag.FirebaseDatabase DEBUG
```

## Production Considerations

### Security

1. **API Keys:** Use different API keys for development and production
2. **Security Rules:** Test rules thoroughly before production deployment
3. **Certificate Pinning:** Implement for production apps

### Performance

1. **Offline Persistence:** Enable for better offline experience
   ```typescript
   import { enableNetwork, disableNetwork } from 'firebase/firestore';
   
   // Enable offline persistence
   await enableNetwork(db);
   ```

2. **Indexing:** Create composite indexes for complex queries
3. **Data Pagination:** Implement for large data sets

### Monitoring

1. **Firebase Crashlytics:** For crash reporting
2. **Performance Monitoring:** Track app performance
3. **Analytics:** User behavior tracking

## Next Steps

1. **Complete Firebase setup** for both iOS and Android
2. **Test authentication flow** on both platforms
3. **Implement push notifications** for quote updates
4. **Set up offline synchronization** for field work scenarios
5. **Configure app distribution** for beta testing

For detailed implementation guides, see:
- [Authentication Implementation](./auth-implementation.md)
- [Push Notifications Setup](./push-notifications.md)
- [Offline Sync Strategy](./offline-sync.md)