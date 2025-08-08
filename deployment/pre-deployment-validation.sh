#!/bin/bash

# =============================================================================
# Pre-Deployment Validation Script
# =============================================================================
# Comprehensive validation before deploying to Firebase and Google Cloud
# Ensures both platforms are properly configured and accessible
# =============================================================================

set -euo pipefail

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

readonly ENVIRONMENT="${ENVIRONMENT:-staging}"
readonly PROJECT_ID="${PROJECT_ID:-solarify-${ENVIRONMENT}}"
readonly REGION="${REGION:-us-central1}"

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

# Validation functions
validate_gcp_access() {
    log "INFO" "Validating Google Cloud Platform access..."
    
    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
        log "ERROR" "No active Google Cloud authentication found"
        return 1
    fi
    
    # Check project access
    if ! gcloud projects describe "$PROJECT_ID" &>/dev/null; then
        log "ERROR" "Cannot access Google Cloud project: $PROJECT_ID"
        return 1
    fi
    
    # Check required APIs
    local required_apis=(
        "firebase.googleapis.com"
        "firestore.googleapis.com"
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "compute.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
    )
    
    for api in "${required_apis[@]}"; do
        if ! gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
            log "ERROR" "Required API not enabled: $api"
            return 1
        fi
    done
    
    log "INFO" "Google Cloud Platform access validation passed"
}

validate_firebase_access() {
    log "INFO" "Validating Firebase access..."
    
    # Check if Firebase project exists and is accessible
    if ! firebase projects:list --format=json | jq -e ".[] | select(.projectId == \"$PROJECT_ID\")" > /dev/null; then
        log "ERROR" "Firebase project not found or no access: $PROJECT_ID"
        return 1
    fi
    
    # Set and verify Firebase project
    firebase use "$PROJECT_ID"
    
    # Check Firebase services
    local project_info=$(firebase projects:list --format=json | jq ".[] | select(.projectId == \"$PROJECT_ID\")")
    
    if ! echo "$project_info" | jq -e '.resources.realtimeDatabaseInstance' > /dev/null; then
        log "DEBUG" "Realtime Database not enabled (not required for this project)"
    fi
    
    log "INFO" "Firebase access validation passed"
}

validate_terraform_state() {
    log "INFO" "Validating Terraform state access..."
    
    local state_bucket="${PROJECT_ID}-terraform-state"
    
    # Check if state bucket exists
    if ! gsutil ls -b "gs://$state_bucket" &>/dev/null; then
        log "WARN" "Terraform state bucket does not exist: $state_bucket"
        log "INFO" "Creating Terraform state bucket..."
        
        gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$state_bucket"
        gsutil versioning set on "gs://$state_bucket"
    fi
    
    # Test bucket access
    if ! gsutil ls "gs://$state_bucket" &>/dev/null; then
        log "ERROR" "Cannot access Terraform state bucket: $state_bucket"
        return 1
    fi
    
    log "INFO" "Terraform state validation passed"
}

validate_service_accounts() {
    log "INFO" "Validating service accounts..."
    
    local required_sa="firebase-adminsdk"
    
    # Check if required service accounts exist
    local service_accounts=$(gcloud iam service-accounts list --format="value(email)")
    
    if ! echo "$service_accounts" | grep -q "$required_sa"; then
        log "WARN" "Firebase Admin SDK service account not found"
        log "INFO" "This is normal for new Firebase projects - it will be created automatically"
    fi
    
    # Check current user permissions
    local current_user=$(gcloud config get-value account)
    local required_roles=(
        "roles/firebase.admin"
        "roles/cloudbuild.builds.editor"
        "roles/run.admin"
        "roles/storage.admin"
    )
    
    for role in "${required_roles[@]}"; do
        if ! gcloud projects get-iam-policy "$PROJECT_ID" --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:$current_user AND bindings.role:$role" | grep -q "$role"; then
            log "WARN" "User $current_user may not have required role: $role"
        fi
    done
    
    log "INFO" "Service account validation completed"
}

validate_network_connectivity() {
    log "INFO" "Validating network connectivity..."
    
    # Test Google APIs connectivity
    local apis_to_test=(
        "firebase.googleapis.com"
        "firestore.googleapis.com"
        "storage.googleapis.com"
        "cloudbuild.googleapis.com"
    )
    
    for api in "${apis_to_test[@]}"; do
        if ! curl -s --connect-timeout 5 "https://$api" > /dev/null; then
            log "WARN" "Cannot connect to API: $api"
        fi
    done
    
    log "INFO" "Network connectivity validation completed"
}

validate_dependencies() {
    log "INFO" "Validating project dependencies..."
    
    cd "$(dirname "$0")/.."
    
    # Check package.json exists
    if [[ ! -f "package.json" ]]; then
        log "ERROR" "package.json not found"
        return 1
    fi
    
    # Check node_modules
    if [[ ! -d "node_modules" ]]; then
        log "WARN" "node_modules not found - run 'npm ci' first"
        return 1
    fi
    
    # Check Firebase configuration
    if [[ ! -f "firebase.json" ]]; then
        log "ERROR" "firebase.json not found"
        return 1
    fi
    
    # Check Firestore rules and indexes
    if [[ ! -f "firestore.rules" ]]; then
        log "ERROR" "firestore.rules not found"
        return 1
    fi
    
    if [[ ! -f "firestore.indexes.json" ]]; then
        log "ERROR" "firestore.indexes.json not found"
        return 1
    fi
    
    # Check App Hosting configuration
    if [[ ! -f "apphosting.yaml" ]]; then
        log "ERROR" "apphosting.yaml not found"
        return 1
    fi
    
    # Check Terraform configuration
    if [[ ! -d "infrastructure/terraform" ]]; then
        log "ERROR" "Terraform configuration not found"
        return 1
    fi
    
    log "INFO" "Project dependencies validation passed"
}

validate_environment_variables() {
    log "INFO" "Validating environment variables..."
    
    local required_vars=(
        "PROJECT_ID"
        "ENVIRONMENT"
        "REGION"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log "ERROR" "Required environment variable not set: $var"
            return 1
        fi
    done
    
    log "INFO" "Environment variables validation passed"
}

validate_build_artifacts() {
    log "INFO" "Validating build artifacts..."
    
    cd "$(dirname "$0")/.."
    
    # Check if build directory exists (Next.js builds to .next by default)
    if [[ ! -d ".next" ]] && [[ ! -d "out" ]] && [[ ! -d "build" ]]; then
        log "WARN" "No build artifacts found - run 'npm run build' first"
        return 1
    fi
    
    log "INFO" "Build artifacts validation passed"
}

main() {
    log "INFO" "Starting pre-deployment validation for unified Firebase & Google Cloud deployment"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Project ID: $PROJECT_ID"
    log "INFO" "Region: $REGION"
    
    local validation_passed=true
    
    # Run all validations
    validate_environment_variables || validation_passed=false
    validate_dependencies || validation_passed=false
    validate_gcp_access || validation_passed=false
    validate_firebase_access || validation_passed=false
    validate_terraform_state || validation_passed=false
    validate_service_accounts || validation_passed=false
    validate_network_connectivity || validation_passed=false
    validate_build_artifacts || validation_passed=false
    
    if [[ "$validation_passed" == "true" ]]; then
        log "INFO" "All pre-deployment validations passed! ✅"
        log "INFO" "Ready to proceed with unified Firebase & Google Cloud deployment"
        exit 0
    else
        log "ERROR" "Pre-deployment validation failed! ❌"
        log "ERROR" "Please resolve the issues above before deploying"
        exit 1
    fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi