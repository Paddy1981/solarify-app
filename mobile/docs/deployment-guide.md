# Mobile App Deployment Guide

This guide covers the complete deployment process for the Solarify mobile app on both iOS App Store and Google Play Store.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build Process](#build-process)
- [Deployment Environments](#deployment-environments)
- [iOS Deployment](#ios-deployment)
- [Android Deployment](#android-deployment)
- [Automated CI/CD](#automated-cicd)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Development Environment

- **Node.js**: 18.x or higher
- **React Native CLI**: Latest version
- **iOS Development** (macOS only):
  - Xcode 14.3 or higher
  - Apple Developer Account ($99/year)
  - iOS Simulator
- **Android Development**:
  - Android Studio with SDK tools
  - Java Development Kit (JDK) 11
  - Android emulator or physical device

### Required Accounts

- **Apple Developer Account**: For iOS app distribution
- **Google Play Console Account**: For Android app distribution ($25 one-time fee)
- **Firebase Account**: For push notifications and app distribution
- **GitHub Account**: For CI/CD automation

### Environment Variables

Create a `.env` file in the mobile directory with the following variables:

```bash
# App Configuration
APP_NAME=SolarifyMobile
BUNDLE_ID_IOS=com.solarify.mobile
PACKAGE_NAME_ANDROID=com.solarify.mobile

# Apple Developer
APPLE_ID_USERNAME=developer@solarify.com
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_ID_PASSWORD=app-specific-password

# Google Play
GOOGLE_PLAY_JSON_KEY_FILE=path/to/service-account.json

# Android Signing
ANDROID_KEYSTORE_FILE=path/to/keystore.jks
ANDROID_KEYSTORE_PASSWORD=keystore-password
ANDROID_KEY_ALIAS=key-alias
ANDROID_KEY_PASSWORD=key-password

# Firebase
FIREBASE_CLI_TOKEN=firebase-cli-token
FIREBASE_IOS_APP_ID=ios-app-id
FIREBASE_ANDROID_APP_ID=android-app-id

# Notifications (optional)
SLACK_WEBHOOK_URL=slack-webhook-for-notifications
```

## Build Process

### Manual Build

#### Using Build Script

```bash
# Build for both platforms (production)
./scripts/build-release.sh --platform both --environment production

# Build for Android only (staging)
./scripts/build-release.sh --platform android --environment staging

# Build with clean and upload
./scripts/build-release.sh --platform both --environment production --clean --upload
```

#### Using Fastlane

```bash
# Install Fastlane
gem install fastlane

# iOS builds
fastlane ios development
fastlane ios staging
fastlane ios production

# Android builds  
fastlane android development
fastlane android staging
fastlane android production

# Both platforms
fastlane staging_all
fastlane production_all
```

### Build Outputs

Builds are generated in the `build/` directory:

- **Android APK**: `SolarifyMobile-v1.0.0-production.apk`
- **Android AAB**: `SolarifyMobile-v1.0.0-production.aab` (for Play Store)
- **iOS IPA**: `SolarifyMobile-v1.0.0-production.ipa`
- **Build Metadata**: `build-metadata.json`

## Deployment Environments

### Development
- **Purpose**: Local development and testing
- **Build Type**: Debug builds with development certificates
- **Distribution**: Direct installation or emulator

### Staging
- **Purpose**: QA testing and stakeholder review
- **Build Type**: Release builds with ad-hoc distribution
- **Distribution**: Firebase App Distribution to internal testers

### Production
- **Purpose**: Public release
- **Build Type**: Store-optimized release builds
- **Distribution**: App Store and Google Play Store

## iOS Deployment

### Initial Setup

1. **Apple Developer Account Setup**
   ```bash
   # Setup certificates and provisioning profiles
   fastlane setup_ios_certificates
   ```

2. **App Store Connect Configuration**
   - Create app record in App Store Connect
   - Configure app information, pricing, and availability
   - Set up App Store screenshots and metadata

### Deployment Process

#### Staging (TestFlight)
```bash
# Build and upload to TestFlight
fastlane ios staging

# Or manually
xcodebuild -workspace SolarifyMobile.xcworkspace \
           -scheme SolarifyMobile \
           -configuration Release \
           -destination generic/platform=iOS \
           -archivePath build/SolarifyMobile.xcarchive \
           archive

# Upload to TestFlight
xcrun altool --upload-app \
             --type ios \
             --file build/SolarifyMobile.ipa \
             --username $APPLE_ID_USERNAME \
             --password $APPLE_ID_PASSWORD
```

#### Production (App Store)
```bash
# Build and submit for review
fastlane ios production

# Monitor status
fastlane deliver --skip_binary_upload --skip_screenshots
```

### iOS-Specific Files

- **Info.plist**: App configuration and permissions
- **Provisioning Profiles**: Code signing certificates
- **Assets**: App icons and launch screens
- **Entitlements**: App capabilities (push notifications, etc.)

## Android Deployment

### Initial Setup

1. **Generate Release Keystore**
   ```bash
   keytool -genkey -v -keystore release-keystore.jks \
           -keyalg RSA -keysize 2048 -validity 10000 \
           -alias solarify-key
   ```

2. **Google Play Console Setup**
   - Create app in Google Play Console
   - Set up app signing key
   - Configure store listing and content ratings

### Deployment Process

#### Staging (Internal Testing)
```bash
# Build and upload to internal testing
fastlane android staging

# Or manually upload APK to Firebase App Distribution
firebase appdistribution:distribute android/app/build/outputs/apk/release/app-release.apk \
  --app $FIREBASE_ANDROID_APP_ID \
  --groups "internal-testers"
```

#### Production (Google Play)
```bash
# Build and upload to Play Store
fastlane android production

# Or manually upload AAB
fastlane android internal  # Internal testing track
fastlane android alpha     # Alpha testing track
# Then promote through Play Console UI
```

### Android-Specific Files

- **build.gradle**: Build configuration and signing
- **AndroidManifest.xml**: App permissions and components
- **Keystore**: Release signing certificate
- **Assets**: Adaptive icons and resources

## Automated CI/CD

### GitHub Actions Workflow

The project includes a comprehensive CI/CD pipeline that:

1. **Runs on**:
   - Push to `main` (staging deployment)
   - Push to `develop` (development deployment)
   - Release creation (production deployment)
   - Manual workflow dispatch

2. **Stages**:
   - **Setup & Test**: Code quality, tests, and security checks
   - **Build**: Platform-specific builds (iOS/Android)
   - **Deploy**: Upload to stores or distribution platforms
   - **Notify**: Slack notifications and deployment summaries

### Triggering Deployments

#### Automatic Deployments
```bash
# Staging deployment
git push origin main

# Development deployment  
git push origin develop

# Production deployment
gh release create v1.0.0 --title "Version 1.0.0" --notes "Release notes"
```

#### Manual Deployments
```bash
# Using GitHub CLI
gh workflow run mobile-deployment.yml \
   -f environment=production \
   -f platform=both

# Or through GitHub web interface
```

### Required Secrets

Configure these secrets in GitHub repository settings:

```
# iOS
APPLE_ID_USERNAME
APPLE_ID_PASSWORD
APPLE_TEAM_ID
MATCH_PASSWORD
MATCH_GIT_URL
MATCH_GIT_BASIC_AUTHORIZATION

# Android
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
GOOGLE_PLAY_JSON_KEY_FILE

# Firebase
FIREBASE_CLI_TOKEN
FIREBASE_IOS_APP_ID
FIREBASE_ANDROID_APP_ID

# Notifications
SLACK_WEBHOOK_URL
```

## Version Management

### Semantic Versioning

The app follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes or major feature releases
- **MINOR**: New features and enhancements
- **PATCH**: Bug fixes and small improvements

### Build Numbers

Build numbers are automatically generated:

- **iOS**: Incremented automatically by Fastlane
- **Android**: Based on timestamp or git commit count

### Release Process

1. **Update version in package.json**
   ```json
   {
     "version": "1.2.0"
   }
   ```

2. **Create release branch**
   ```bash
   git checkout -b release/v1.2.0
   git commit -am "Bump version to 1.2.0"
   git push origin release/v1.2.0
   ```

3. **Merge to main and create release**
   ```bash
   git checkout main
   git merge release/v1.2.0
   git tag v1.2.0
   git push origin main --tags
   ```

## Store Review Process

### iOS App Store Review

- **Review Time**: 1-3 days typically
- **Review Guidelines**: Follow [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **Common Rejections**: Missing features, UI/UX issues, metadata problems
- **Appeals Process**: Available through App Store Connect

### Google Play Review

- **Review Time**: Few hours to 1 day typically
- **Review Guidelines**: Follow [Google Play Developer Policy](https://support.google.com/googleplay/android-developer/answer/4430948)
- **Testing**: Use internal testing track before production
- **Rollout**: Gradual rollout recommended (10% → 50% → 100%)

## Monitoring and Analytics

### Crash Reporting

- **iOS**: Xcode Organizer, TestFlight crash reports
- **Android**: Google Play Console crash reports
- **Third-party**: Consider Firebase Crashlytics or Sentry

### Performance Monitoring

- **Firebase Performance**: Monitor app performance metrics
- **App Store Analytics**: User engagement and retention
- **Google Play Console**: Performance metrics and user feedback

### User Feedback

- **In-App**: Implement feedback mechanism
- **Store Reviews**: Monitor and respond to user reviews
- **Support**: Dedicated support email (support@solarify.com)

## Troubleshooting

### Common iOS Issues

1. **Code Signing Issues**
   ```bash
   # Clear derived data
   rm -rf ~/Library/Developer/Xcode/DerivedData
   
   # Refresh certificates
   fastlane match nuke development
   fastlane match nuke appstore
   fastlane setup_ios_certificates
   ```

2. **Build Failures**
   ```bash
   # Clean build
   cd ios && xcodebuild clean
   pod deintegrate && pod install
   ```

3. **Archive Upload Issues**
   ```bash
   # Validate before upload
   xcrun altool --validate-app --type ios --file build/SolarifyMobile.ipa
   ```

### Common Android Issues

1. **Keystore Problems**
   ```bash
   # Verify keystore
   keytool -list -v -keystore release-keystore.jks
   ```

2. **Build Failures**
   ```bash
   # Clean build
   cd android && ./gradlew clean
   ```

3. **Play Store Upload Issues**
   ```bash
   # Validate AAB
   bundletool validate --bundle=app-release.aab
   ```

### General Debugging

1. **Enable verbose logging**
   ```bash
   # iOS
   xcodebuild -workspace ... -verbose
   
   # Android  
   ./gradlew assembleRelease --info
   ```

2. **Check environment variables**
   ```bash
   # Verify all required variables are set
   printenv | grep -E "(APPLE|ANDROID|FIREBASE)"
   ```

3. **Network issues**
   ```bash
   # Test connectivity to stores
   curl -I https://itunesconnect.apple.com
   curl -I https://play.google.com
   ```

## Best Practices

### Security

- **Never commit credentials** to version control
- **Use encrypted secrets** in CI/CD
- **Rotate keys regularly** (annual recommended)
- **Enable two-factor authentication** on all accounts

### Testing

- **Test on real devices** before release
- **Use staged rollout** for production releases  
- **Monitor crash reports** immediately after release
- **Have rollback plan** ready

### Maintenance

- **Update dependencies regularly** (monthly)
- **Monitor security advisories**
- **Test on latest OS versions**
- **Maintain deployment documentation**

## Support and Resources

### Documentation
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Fastlane Documentation](https://docs.fastlane.tools/)
- [iOS Developer Documentation](https://developer.apple.com/documentation/)
- [Android Developer Documentation](https://developer.android.com/docs)

### Community
- [React Native Community](https://github.com/react-native-community)
- [Fastlane Community](https://github.com/fastlane/fastlane)

### Support Contacts
- **Technical Issues**: dev-team@solarify.com
- **Store Issues**: publishing@solarify.com
- **Emergency**: Create GitHub issue with `urgent` label

---

For questions or issues with this deployment guide, please contact the development team or create an issue in the project repository.