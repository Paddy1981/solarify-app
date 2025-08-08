# Simplified Firebase Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Solarify web application and mobile apps to Firebase.

## Prerequisites

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Authentication**
   ```bash
   firebase login
   ```

## Web Application Deployment

### Step 1: Build the Application
```bash
# Clean build
npm run build
```

### Step 2: Deploy to Firebase Hosting
```bash
# Deploy to staging
firebase deploy --only hosting --project staging

# Deploy to production
firebase deploy --only hosting --project production
```

### Step 3: Deploy Backend Services
```bash
# Deploy Firestore rules
firebase deploy --only firestore

# Deploy storage rules
firebase deploy --only storage

# Deploy all Firebase services
firebase deploy
```

## Mobile Application Setup

### Step 1: Configure Firebase for Mobile

1. **iOS Configuration**
   - Download `GoogleService-Info.plist` from Firebase Console
   - Place in `mobile/SolarifyMobile/ios/SolarifyMobile/`

2. **Android Configuration**
   - Download `google-services.json` from Firebase Console
   - Place in `mobile/SolarifyMobile/android/app/`

### Step 2: Build Mobile Apps

```bash
cd mobile

# Setup React Native development environment
./scripts/setup-mobile-development.sh

# Build Android APK
cd SolarifyMobile
npx react-native build-android --variant=release

# Build iOS IPA (requires Xcode)
npx react-native build-ios --configuration=Release
```

### Step 3: Deploy to App Stores

```bash
# Using Fastlane for automated deployment
cd mobile
fastlane ios release
fastlane android release
```

## Environment Variables

Create `.env` files in the root directory:

### `.env.local`
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

## Deployment Scripts Available

The following npm scripts are available for deployment:

- `npm run deploy:staging` - Deploy to staging environment
- `npm run deploy:production` - Deploy to production environment
- `npm run build` - Build the application
- `npm run test:ci` - Run tests in CI mode

## Firebase Project Structure

```
firebase.json          # Firebase configuration
firestore.rules        # Firestore security rules
firestore.indexes.json # Firestore indexes
storage.rules          # Cloud Storage security rules
out/                   # Built static files (generated)
```

## Verification Steps

After deployment, verify:

1. **Web Application**
   - Visit your Firebase Hosting URL
   - Test core functionality
   - Check browser console for errors

2. **Mobile Applications**
   - Install on test devices
   - Verify Firebase integration
   - Test push notifications

3. **Backend Services**
   - Test Firestore operations
   - Verify authentication flows
   - Check storage uploads

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (requires 18+)
   - Clear cache: `npm cache clean --force`
   - Delete `node_modules` and reinstall

2. **Firebase Deployment Issues**
   - Verify authentication: `firebase login:list`
   - Check project access: `firebase projects:list`
   - Validate configuration files

3. **Mobile Build Issues**
   - Update React Native CLI
   - Check Android/iOS development environment setup
   - Verify Firebase configuration files

## Next Steps

After successful deployment:

1. Set up monitoring and analytics
2. Configure custom domain (if needed)
3. Set up CI/CD pipeline
4. Enable performance monitoring
5. Configure backup strategies

## Support

For deployment issues, check:
- Firebase Console logs
- Build output logs
- Application error monitoring