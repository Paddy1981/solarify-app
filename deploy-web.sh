#!/bin/bash

# =============================================================================
# Simplified Solarify Web Application Deployment Script
# =============================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${ENVIRONMENT:-staging}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking deployment prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error_exit "Node.js is not installed. Please install Node.js 18 or higher."
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error_exit "npm is not installed. Please install npm."
    fi
    
    log "INFO" "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    log "INFO" "Installing dependencies..."
    cd "$PROJECT_ROOT"
    
    # Try npm install with different strategies
    if [ -f "package-lock.json" ]; then
        log "INFO" "Found package-lock.json, using npm ci..."
        npm ci || {
            log "WARN" "npm ci failed, trying npm install..."
            npm install || error_exit "Failed to install dependencies"
        }
    else
        log "INFO" "Using npm install..."
        npm install || error_exit "Failed to install dependencies"
    fi
    
    log "INFO" "Dependencies installed successfully"
}

# Build application
build_application() {
    log "INFO" "Building application for production..."
    cd "$PROJECT_ROOT"
    
    # Set environment variables for build
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    # Build the application
    npm run build || error_exit "Build failed"
    
    # Verify build output
    if [ ! -d "out" ]; then
        error_exit "Build output directory 'out' not found"
    fi
    
    log "INFO" "Application built successfully"
}

# Deploy to Firebase (if CLI available)
deploy_to_firebase() {
    log "INFO" "Attempting Firebase deployment..."
    
    if command -v firebase &> /dev/null; then
        log "INFO" "Firebase CLI found, deploying..."
        
        # Check if user is authenticated
        if ! firebase projects:list &> /dev/null; then
            log "WARN" "Firebase authentication required. Please run 'firebase login'"
            return 1
        fi
        
        # Deploy based on environment
        if [ "$ENVIRONMENT" = "production" ]; then
            firebase deploy --only hosting --project production
        else
            firebase deploy --only hosting --project staging
        fi
        
        log "INFO" "Firebase deployment completed"
        return 0
    else
        log "WARN" "Firebase CLI not found. Please install Firebase CLI to deploy:"
        log "INFO" "npm install -g firebase-tools"
        return 1
    fi
}

# Create deployment package
create_deployment_package() {
    log "INFO" "Creating deployment package..."
    cd "$PROJECT_ROOT"
    
    # Create deployment directory
    local deploy_dir="deploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$deploy_dir"
    
    # Copy built application
    cp -r out/* "$deploy_dir/"
    
    # Copy Firebase configuration
    cp firebase.json "$deploy_dir/"
    cp firestore.rules "$deploy_dir/" 2>/dev/null || true
    cp firestore.indexes.json "$deploy_dir/" 2>/dev/null || true
    cp storage.rules "$deploy_dir/" 2>/dev/null || true
    
    # Create deployment instructions
    cat > "$deploy_dir/DEPLOY_INSTRUCTIONS.md" << 'EOF'
# Manual Deployment Instructions

This package contains the built Solarify web application ready for deployment.

## Deploy to Firebase Hosting

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Navigate to this directory and deploy:
   ```bash
   cd $(pwd)
   firebase deploy --only hosting
   ```

## Deploy to Other Hosting Services

The `out/` directory contains static files that can be deployed to any static hosting service:
- Netlify: Drag and drop the `out` folder
- Vercel: Use `vercel --prod` in this directory  
- GitHub Pages: Copy contents to your gh-pages branch
- AWS S3: Upload contents to S3 bucket with static hosting

## Files Included

- Built application files (in root directory)
- Firebase configuration files
- Firestore rules and indexes
EOF
    
    # Create archive
    tar -czf "${deploy_dir}.tar.gz" "$deploy_dir"
    
    log "INFO" "Deployment package created: ${deploy_dir}.tar.gz"
    log "INFO" "Manual deployment instructions included"
    
    return 0
}

# Main deployment function
main() {
    log "INFO" "Starting Solarify web application deployment"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Project root: $PROJECT_ROOT"
    
    # Run deployment steps
    check_prerequisites
    install_dependencies
    build_application
    
    # Try Firebase deployment first, fallback to package creation
    if ! deploy_to_firebase; then
        log "INFO" "Firebase deployment not available, creating deployment package instead"
        create_deployment_package
    fi
    
    log "INFO" "Deployment process completed successfully!"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --help)
                cat << EOF
Simplified Solarify Web Deployment Script

Usage: $0 [options]

Options:
    --environment    Deployment environment (staging|production)
    --help          Show this help message

Examples:
    # Deploy to staging
    $0 --environment staging

    # Deploy to production
    ENVIRONMENT=production $0
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