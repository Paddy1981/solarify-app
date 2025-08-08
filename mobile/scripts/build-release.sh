#!/bin/bash

# =============================================================================
# Mobile App Release Build Script
# =============================================================================
# Builds production-ready APK and IPA files for app store deployment
# =============================================================================

set -e

# Configuration
APP_NAME="SolarifyMobile"
VERSION_FILE="../package.json"
BUILD_DIR="../build"
ANDROID_BUILD_DIR="../android/app/build/outputs"
IOS_BUILD_DIR="../ios/build/Build/Products"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --platform PLATFORM    Platform to build (ios|android|both) [default: both]"
    echo "  -e, --environment ENV       Environment (development|staging|production) [default: production]"
    echo "  -c, --clean                 Clean build directories before building"
    echo "  -s, --skip-tests            Skip running tests before building"
    echo "  -u, --upload                Upload to app stores after building"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --platform android --environment production"
    echo "  $0 --platform ios --clean --upload"
    echo "  $0 --platform both --environment staging"
}

# Default values
PLATFORM="both"
ENVIRONMENT="production"
CLEAN_BUILD=false
SKIP_TESTS=false
UPLOAD_TO_STORES=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -u|--upload)
            UPLOAD_TO_STORES=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate platform
if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" && "$PLATFORM" != "both" ]]; then
    log_error "Invalid platform: $PLATFORM. Must be 'ios', 'android', or 'both'"
    exit 1
fi

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be 'development', 'staging', or 'production'"
    exit 1
fi

log_info "Starting $ENVIRONMENT build for $PLATFORM platform(s)"

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Check if we're in a React Native project
if [[ ! -f "package.json" ]] || ! grep -q "react-native" package.json; then
    log_error "Not in a React Native project directory"
    exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
BUILD_NUMBER=$(date +%Y%m%d%H%M)

log_info "Building version $VERSION (build $BUILD_NUMBER)"

# Create build directory
mkdir -p "$BUILD_DIR"

# Clean build directories if requested
if [[ "$CLEAN_BUILD" == true ]]; then
    log_info "Cleaning build directories..."
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        cd android
        ./gradlew clean
        cd ..
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        if command -v xcodebuild &> /dev/null; then
            cd ios
            xcodebuild clean -workspace ${APP_NAME}.xcworkspace -scheme ${APP_NAME}
            cd ..
        fi
    fi
fi

# Install dependencies
log_info "Installing dependencies..."
npm ci --production=false

# Run tests (unless skipped)
if [[ "$SKIP_TESTS" != true ]]; then
    log_info "Running tests..."
    npm test -- --watchAll=false --coverage=false
fi

# Set environment variables
export NODE_ENV=$ENVIRONMENT
export ENVIRONMENT=$ENVIRONMENT

if [[ "$ENVIRONMENT" == "production" ]]; then
    export SENTRY_DISABLE_AUTO_UPLOAD=true
fi

# Build for Android
build_android() {
    log_info "Building Android APK..."
    
    cd android
    
    # Update version in build.gradle
    sed -i.bak "s/versionName \".*\"/versionName \"$VERSION\"/" app/build.gradle
    sed -i.bak "s/versionCode [0-9]*/versionCode $BUILD_NUMBER/" app/build.gradle
    
    # Build release APK
    if [[ "$ENVIRONMENT" == "production" ]]; then
        ./gradlew assembleRelease
        BUILT_APK="$ANDROID_BUILD_DIR/apk/release/app-release.apk"
    else
        ./gradlew assembleDebug
        BUILT_APK="$ANDROID_BUILD_DIR/apk/debug/app-debug.apk"
    fi
    
    # Build AAB for Play Store (production only)
    if [[ "$ENVIRONMENT" == "production" ]]; then
        ./gradlew bundleRelease
        BUILT_AAB="$ANDROID_BUILD_DIR/bundle/release/app-release.aab"
    fi
    
    cd ..
    
    # Copy builds to build directory
    if [[ -f "$BUILT_APK" ]]; then
        cp "$BUILT_APK" "$BUILD_DIR/${APP_NAME}-v${VERSION}-${ENVIRONMENT}.apk"
        log_info "Android APK built successfully: $BUILD_DIR/${APP_NAME}-v${VERSION}-${ENVIRONMENT}.apk"
    else
        log_error "Android APK build failed"
        return 1
    fi
    
    if [[ -f "$BUILT_AAB" ]]; then
        cp "$BUILT_AAB" "$BUILD_DIR/${APP_NAME}-v${VERSION}-${ENVIRONMENT}.aab"
        log_info "Android AAB built successfully: $BUILD_DIR/${APP_NAME}-v${VERSION}-${ENVIRONMENT}.aab"
    fi
}

# Build for iOS
build_ios() {
    log_info "Building iOS IPA..."
    
    if ! command -v xcodebuild &> /dev/null; then
        log_error "xcodebuild not found. Make sure Xcode is installed."
        return 1
    fi
    
    cd ios
    
    # Update version in Info.plist
    /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" ${APP_NAME}/Info.plist
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" ${APP_NAME}/Info.plist
    
    # Install pods
    if command -v pod &> /dev/null; then
        log_info "Installing CocoaPods dependencies..."
        pod install
    else
        log_warn "CocoaPods not found. You may need to install pods manually."
    fi
    
    # Build configuration
    if [[ "$ENVIRONMENT" == "production" ]]; then
        CONFIGURATION="Release"
        EXPORT_METHOD="app-store"
    else
        CONFIGURATION="Debug"
        EXPORT_METHOD="development"
    fi
    
    # Build archive
    log_info "Creating iOS archive..."
    xcodebuild -workspace ${APP_NAME}.xcworkspace \
               -scheme ${APP_NAME} \
               -configuration $CONFIGURATION \
               -destination generic/platform=iOS \
               -archivePath "$IOS_BUILD_DIR/${APP_NAME}.xcarchive" \
               archive
    
    # Export IPA
    if [[ -d "$IOS_BUILD_DIR/${APP_NAME}.xcarchive" ]]; then
        log_info "Exporting IPA..."
        
        # Create export options plist
        cat > /tmp/ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>$EXPORT_METHOD</string>
    <key>teamID</key>
    <string>TEAM_ID_PLACEHOLDER</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF
        
        xcodebuild -exportArchive \
                   -archivePath "$IOS_BUILD_DIR/${APP_NAME}.xcarchive" \
                   -exportPath "$IOS_BUILD_DIR/Export" \
                   -exportOptionsPlist /tmp/ExportOptions.plist
        
        # Copy IPA to build directory
        BUILT_IPA="$IOS_BUILD_DIR/Export/${APP_NAME}.ipa"
        if [[ -f "$BUILT_IPA" ]]; then
            cp "$BUILT_IPA" "$BUILD_DIR/${APP_NAME}-v${VERSION}-${ENVIRONMENT}.ipa"
            log_info "iOS IPA built successfully: $BUILD_DIR/${APP_NAME}-v${VERSION}-${ENVIRONMENT}.ipa"
        else
            log_error "iOS IPA export failed"
            return 1
        fi
    else
        log_error "iOS archive creation failed"
        return 1
    fi
    
    cd ..
}

# Upload to app stores
upload_to_stores() {
    if [[ "$UPLOAD_TO_STORES" != true ]]; then
        return 0
    fi
    
    log_info "Uploading to app stores..."
    
    # Upload to Google Play (Android)
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]] && [[ -f "$BUILD_DIR/${APP_NAME}-v${VERSION}-${ENVIRONMENT}.aab" ]]; then
        if command -v fastlane &> /dev/null; then
            log_info "Uploading Android AAB to Google Play..."
            cd android
            fastlane android production
            cd ..
        else
            log_warn "Fastlane not found. Please upload AAB manually to Google Play Console."
        fi
    fi
    
    # Upload to App Store (iOS)
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]] && [[ -f "$BUILD_DIR/${APP_NAME}-v${VERSION}-${ENVIRONMENT}.ipa" ]]; then
        if command -v altool &> /dev/null; then
            log_info "Uploading iOS IPA to App Store..."
            xcrun altool --upload-app \
                         --type ios \
                         --file "$BUILD_DIR/${APP_NAME}-v${VERSION}-${ENVIRONMENT}.ipa" \
                         --username "$APPLE_ID_USERNAME" \
                         --password "$APPLE_ID_PASSWORD"
        else
            log_warn "altool not found. Please upload IPA manually to App Store Connect."
        fi
    fi
}

# Generate build metadata
generate_metadata() {
    log_info "Generating build metadata..."
    
    cat > "$BUILD_DIR/build-metadata.json" << EOF
{
  "app_name": "$APP_NAME",
  "version": "$VERSION",
  "build_number": "$BUILD_NUMBER",
  "environment": "$ENVIRONMENT",
  "platform": "$PLATFORM",
  "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "node_version": "$(node --version)",
  "npm_version": "$(npm --version)",
  "react_native_version": "$(npx react-native --version | head -1 | cut -d' ' -f3)"
}
EOF
    
    log_info "Build metadata saved to $BUILD_DIR/build-metadata.json"
}

# Main execution
main() {
    local build_success=true
    
    # Build for requested platforms
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        if ! build_android; then
            build_success=false
        fi
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        if ! build_ios; then
            build_success=false
        fi
    fi
    
    # Generate metadata
    generate_metadata
    
    # Upload if requested and builds succeeded
    if [[ "$build_success" == true ]]; then
        upload_to_stores
    else
        log_error "Build failed. Skipping upload."
        exit 1
    fi
    
    if [[ "$build_success" == true ]]; then
        log_info "Build completed successfully!"
        log_info "Build artifacts are available in: $BUILD_DIR"
        
        # List built files
        echo ""
        echo "Built files:"
        ls -la "$BUILD_DIR" | grep -E "\.(apk|aab|ipa)$" || echo "No build artifacts found"
    else
        log_error "Build completed with errors."
        exit 1
    fi
}

# Trap to ensure cleanup on exit
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/ExportOptions.plist
}

trap cleanup EXIT

# Run main function
main

log_info "Build script completed."