#!/bin/bash

# =============================================================================
# Solarify Mobile Apps Deployment Script
# =============================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$PROJECT_ROOT"
BUILD_TYPE="${BUILD_TYPE:-release}"
PLATFORM="${PLATFORM:-both}"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        INFO)  echo -e "${GREEN}[INFO]${NC}  ${timestamp} - $message" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC}  ${timestamp} - $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} ${timestamp} - $message" ;;
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message" ;;
    esac
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Check prerequisites for mobile development
check_mobile_prerequisites() {
    log "INFO" "Checking mobile development prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error_exit "Node.js is not installed"
    fi
    
    # Check React Native CLI
    if ! command -v npx &> /dev/null; then
        log "WARN" "npx not available, some commands may fail"
    fi
    
    # Platform-specific checks
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        if [[ "$OSTYPE" != "darwin"* ]]; then
            log "WARN" "iOS development requires macOS"
        elif ! command -v xcodebuild &> /dev/null; then
            log "WARN" "Xcode command line tools not found - iOS builds may fail"
        fi
    fi
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        if [ -z "$ANDROID_HOME" ]; then
            log "WARN" "ANDROID_HOME not set - Android builds may fail"
        fi
    fi
    
    log "INFO" "Prerequisites check completed"
}

# Setup Firebase configuration
setup_firebase_config() {
    log "INFO" "Setting up Firebase configuration for mobile apps..."
    
    # Check for Firebase config files
    local ios_config="$MOBILE_ROOT/SolarifyMobile/ios/SolarifyMobile/GoogleService-Info.plist"
    local android_config="$MOBILE_ROOT/SolarifyMobile/android/app/google-services.json"
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        if [ ! -f "$ios_config" ]; then
            log "WARN" "iOS Firebase configuration not found at: $ios_config"
            log "INFO" "Please download GoogleService-Info.plist from Firebase Console"
        else
            log "INFO" "iOS Firebase configuration found"
        fi
    fi
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        if [ ! -f "$android_config" ]; then
            log "WARN" "Android Firebase configuration not found at: $android_config"
            log "INFO" "Please download google-services.json from Firebase Console"
        else
            log "INFO" "Android Firebase configuration found"
        fi
    fi
}

# Install mobile dependencies
install_mobile_dependencies() {
    log "INFO" "Installing mobile app dependencies..."
    
    cd "$MOBILE_ROOT"
    
    # Install shared packages dependencies
    if [ -d "shared-packages/solarify-core" ]; then
        log "INFO" "Installing shared-packages dependencies..."
        cd "shared-packages/solarify-core"
        npm install || log "WARN" "Failed to install shared-packages dependencies"
        cd "$MOBILE_ROOT"
    fi
    
    if [ -d "shared-packages/solarify-services" ]; then
        cd "shared-packages/solarify-services"
        npm install || log "WARN" "Failed to install services dependencies"
        cd "$MOBILE_ROOT"
    fi
    
    # Install main mobile app dependencies
    if [ -d "SolarifyMobile" ]; then
        log "INFO" "Installing SolarifyMobile dependencies..."
        cd "SolarifyMobile"
        npm install || error_exit "Failed to install SolarifyMobile dependencies"
        
        # iOS specific setup
        if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]] && [[ "$OSTYPE" == "darwin"* ]]; then
            log "INFO" "Installing iOS dependencies..."
            cd ios && pod install --repo-update && cd ..
        fi
        
        cd "$MOBILE_ROOT"
    fi
    
    log "INFO" "Mobile dependencies installed successfully"
}

# Build Android APK
build_android() {
    log "INFO" "Building Android APK..."
    
    cd "$MOBILE_ROOT/SolarifyMobile"
    
    # Clean previous build
    cd android && ./gradlew clean && cd ..
    
    # Build APK
    if [ "$BUILD_TYPE" = "release" ]; then
        log "INFO" "Building release APK..."
        cd android && ./gradlew assembleRelease && cd ..
    else
        log "INFO" "Building debug APK..."
        cd android && ./gradlew assembleDebug && cd ..
    fi
    
    # Check if APK was created
    local apk_path
    if [ "$BUILD_TYPE" = "release" ]; then
        apk_path="android/app/build/outputs/apk/release/app-release.apk"
    else
        apk_path="android/app/build/outputs/apk/debug/app-debug.apk"
    fi
    
    if [ -f "$apk_path" ]; then
        log "INFO" "Android APK built successfully: $apk_path"
    else
        error_exit "Android APK build failed"
    fi
}

# Build iOS IPA
build_ios() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log "WARN" "iOS build skipped - requires macOS"
        return 0
    fi
    
    log "INFO" "Building iOS IPA..."
    
    cd "$MOBILE_ROOT/SolarifyMobile"
    
    # Build iOS app
    if [ "$BUILD_TYPE" = "release" ]; then
        log "INFO" "Building release iOS app..."
        npx react-native build-ios --configuration=Release
    else
        log "INFO" "Building debug iOS app..."
        npx react-native build-ios --configuration=Debug
    fi
    
    log "INFO" "iOS build completed"
}

# Create deployment packages
create_mobile_packages() {
    log "INFO" "Creating mobile deployment packages..."
    
    local deploy_dir="mobile-deploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$deploy_dir"
    
    # Android package
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        local apk_path
        if [ "$BUILD_TYPE" = "release" ]; then
            apk_path="$MOBILE_ROOT/SolarifyMobile/android/app/build/outputs/apk/release/app-release.apk"
        else
            apk_path="$MOBILE_ROOT/SolarifyMobile/android/app/build/outputs/apk/debug/app-debug.apk"
        fi
        
        if [ -f "$apk_path" ]; then
            cp "$apk_path" "$deploy_dir/solarify-android-${BUILD_TYPE}.apk"
            log "INFO" "Android APK copied to deployment package"
        fi
    fi
    
    # iOS package (if available)
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]] && [[ "$OSTYPE" == "darwin"* ]]; then
        local ipa_path="$MOBILE_ROOT/SolarifyMobile/ios/build/SolarifyMobile.ipa"
        if [ -f "$ipa_path" ]; then
            cp "$ipa_path" "$deploy_dir/solarify-ios-${BUILD_TYPE}.ipa"
            log "INFO" "iOS IPA copied to deployment package"
        fi
    fi
    
    # Create deployment instructions
    cat > "$deploy_dir/MOBILE_DEPLOY_INSTRUCTIONS.md" << EOF
# Mobile App Deployment Instructions

This package contains the built Solarify mobile applications.

## Android Deployment

### Google Play Store
1. Sign the APK with your release key
2. Upload to Google Play Console
3. Follow Play Store review process

### Manual Installation (Testing)
1. Enable "Install from Unknown Sources" on Android device
2. Transfer APK to device
3. Install the APK file

## iOS Deployment

### App Store
1. Use Xcode to archive the app
2. Upload to App Store Connect
3. Follow App Store review process

### TestFlight (Beta Testing)
1. Upload IPA to App Store Connect
2. Add beta testers
3. Distribute via TestFlight

## Firebase Integration

Ensure Firebase configuration files are properly set up:
- iOS: GoogleService-Info.plist
- Android: google-services.json

## Support

For deployment issues, check:
- Build logs
- Firebase Console
- App Store Connect / Google Play Console
EOF
    
    # Create archive
    tar -czf "${deploy_dir}.tar.gz" "$deploy_dir"
    
    log "INFO" "Mobile deployment package created: ${deploy_dir}.tar.gz"
    
    return 0
}

# Deploy using Fastlane (if available)
deploy_with_fastlane() {
    if command -v fastlane &> /dev/null; then
        log "INFO" "Fastlane found, attempting automated deployment..."
        
        cd "$MOBILE_ROOT"
        
        if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
            if [ -f "fastlane/Fastfile" ]; then
                log "INFO" "Deploying Android app with Fastlane..."
                fastlane android release || log "WARN" "Fastlane Android deployment failed"
            fi
        fi
        
        if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]] && [[ "$OSTYPE" == "darwin"* ]]; then
            if [ -f "fastlane/Fastfile" ]; then
                log "INFO" "Deploying iOS app with Fastlane..."
                fastlane ios release || log "WARN" "Fastlane iOS deployment failed"
            fi
        fi
        
        return 0
    else
        log "INFO" "Fastlane not available, skipping automated deployment"
        return 1
    fi
}

# Main deployment function
main() {
    log "INFO" "Starting Solarify mobile apps deployment"
    log "INFO" "Platform: $PLATFORM"
    log "INFO" "Build type: $BUILD_TYPE"
    log "INFO" "Mobile root: $MOBILE_ROOT"
    
    # Run deployment steps
    check_mobile_prerequisites
    setup_firebase_config
    install_mobile_dependencies
    
    # Build apps based on platform
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        build_android
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        build_ios
    fi
    
    # Try automated deployment, fallback to package creation
    if ! deploy_with_fastlane; then
        log "INFO" "Automated deployment not available, creating deployment packages"
        create_mobile_packages
    fi
    
    log "INFO" "Mobile deployment process completed successfully!"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                PLATFORM="$2"
                shift 2
                ;;
            --build-type)
                BUILD_TYPE="$2"
                shift 2
                ;;
            --help)
                cat << EOF
Solarify Mobile Apps Deployment Script

Usage: $0 [options]

Options:
    --platform      Target platform (android|ios|both)
    --build-type    Build type (debug|release)
    --help          Show this help message

Examples:
    # Build both platforms in release mode
    $0 --platform both --build-type release

    # Build Android only in debug mode
    $0 --platform android --build-type debug
EOF
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1. Use --help for usage information."
                ;;
        esac
    done
    
    main "$@"
fi