#!/bin/bash

# =============================================================================
# Solarify Unified Firebase & Google Cloud Deployment Script
# =============================================================================
# This script demonstrates how Firebase and Google Cloud are one unified platform
# No separate deployment agents needed - one script manages everything
# =============================================================================

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_FILE="${PROJECT_ROOT}/deployment/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Environment variables with defaults
readonly ENVIRONMENT="${ENVIRONMENT:-staging}"
readonly PROJECT_ID="${PROJECT_ID:-solarify-${ENVIRONMENT}}"
readonly REGION="${REGION:-us-central1}"
readonly TERRAFORM_STATE_BUCKET="${TERRAFORM_STATE_BUCKET:-${PROJECT_ID}-terraform-state}"

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
    
    echo "[${level}] ${timestamp} - $message" >> "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log "ERROR" "Deployment failed with exit code $exit_code"
        log "INFO" "Check logs at: $LOG_FILE"
    fi
    exit $exit_code
}

trap cleanup EXIT

# Validation functions
validate_prerequisites() {
    log "INFO" "Validating deployment prerequisites..."
    
    # Check required tools
    local tools=("node" "npm" "firebase" "gcloud" "terraform")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "Required tool '$tool' is not installed"
        fi
    done
    
    # Check Node.js version
    local node_version=$(node -v | sed 's/v//')
    local required_node="18.0.0"
    if ! printf '%s\n%s\n' "$required_node" "$node_version" | sort -V -C; then
        error_exit "Node.js version $node_version is too old. Required: >= $required_node"
    fi
    
    # Validate environment variables
    if [[ -z "${PROJECT_ID:-}" ]]; then
        error_exit "PROJECT_ID environment variable is required"
    fi
    
    log "INFO" "Prerequisites validation completed successfully"
}

authenticate_services() {
    log "INFO" "Authenticating with Google Cloud and Firebase..."
    
    # Check if already authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
        log "INFO" "No active gcloud authentication found. Please run: gcloud auth login"
        exit 1
    fi
    
    # Set the project
    gcloud config set project "$PROJECT_ID"
    
    # Firebase authentication (uses same Google Cloud credentials)
    if ! firebase projects:list --format=json | jq -e ".[] | select(.projectId == \"$PROJECT_ID\")" > /dev/null; then
        error_exit "Firebase project $PROJECT_ID not found or no access"
    fi
    
    # Set Firebase project
    firebase use "$PROJECT_ID"
    
    log "INFO" "Authentication completed successfully"
}

prepare_deployment() {
    log "INFO" "Preparing application for deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "INFO" "Installing Node.js dependencies..."
    npm ci --production=false
    
    # Run quality checks
    log "INFO" "Running pre-deployment quality checks..."
    npm run lint
    npm run typecheck
    
    # Run tests
    log "INFO" "Running test suite..."
    npm run test:ci
    
    # Build application
    log "INFO" "Building application for production..."
    npm run build
    
    log "INFO" "Application preparation completed successfully"
}

deploy_infrastructure() {
    log "INFO" "Deploying Google Cloud infrastructure with Terraform..."
    
    cd "${PROJECT_ROOT}/infrastructure/terraform"
    
    # Initialize Terraform
    terraform init -backend-config="bucket=${TERRAFORM_STATE_BUCKET}"
    
    # Select or create workspace
    terraform workspace select "$ENVIRONMENT" || terraform workspace new "$ENVIRONMENT"
    
    # Plan deployment
    log "INFO" "Planning infrastructure changes..."
    terraform plan \
        -var="project_id=${PROJECT_ID}" \
        -var="environment=${ENVIRONMENT}" \
        -var="primary_region=${REGION}" \
        -out="terraform.plan"
    
    # Apply changes
    log "INFO" "Applying infrastructure changes..."
    terraform apply "terraform.plan"
    
    log "INFO" "Infrastructure deployment completed successfully"
}

deploy_firebase_services() {
    log "INFO" "Deploying Firebase services..."
    
    cd "$PROJECT_ROOT"
    
    # Deploy Firestore rules and indexes
    log "INFO" "Deploying Firestore configuration..."
    firebase deploy --only firestore
    
    # Deploy Firebase Functions (if any)
    if [ -d "functions" ]; then
        log "INFO" "Deploying Firebase Functions..."
        firebase deploy --only functions
    fi
    
    # Deploy Firebase App Hosting
    log "INFO" "Deploying to Firebase App Hosting..."
    firebase apphosting:deploy
    
    log "INFO" "Firebase services deployment completed successfully"
}

run_post_deployment_validation() {
    log "INFO" "Running post-deployment validation..."
    
    cd "$PROJECT_ROOT"
    
    # Health checks
    log "INFO" "Running health checks..."
    npm run health-check
    
    # Performance validation
    log "INFO" "Running performance validation..."
    npm run performance-check
    
    # Smoke tests
    log "INFO" "Running smoke tests..."
    npm run test:smoke
    
    log "INFO" "Post-deployment validation completed successfully"
}

setup_monitoring() {
    log "INFO" "Configuring monitoring and alerting..."
    
    # Deploy monitoring infrastructure
    cd "${PROJECT_ROOT}/infrastructure/terraform"
    terraform apply -target=module.monitoring -auto-approve
    
    log "INFO" "Monitoring setup completed successfully"
}

rollback_deployment() {
    log "WARN" "Initiating rollback procedure..."
    
    # Get previous deployment
    local previous_version=$(firebase hosting:clone --format=json | jq -r '.[1].version')
    
    if [[ -n "$previous_version" ]]; then
        log "INFO" "Rolling back to version: $previous_version"
        firebase hosting:channel:deploy "$previous_version" --live
        log "INFO" "Rollback completed successfully"
    else
        log "ERROR" "No previous version found for rollback"
        exit 1
    fi
}

main() {
    log "INFO" "Starting unified Firebase & Google Cloud deployment for Solarify"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Project ID: $PROJECT_ID"
    log "INFO" "Region: $REGION"
    log "INFO" "Log file: $LOG_FILE"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Deployment steps
    validate_prerequisites
    authenticate_services
    prepare_deployment
    
    # Deploy infrastructure and services together (unified approach)
    deploy_infrastructure
    deploy_firebase_services
    
    # Validation and monitoring
    run_post_deployment_validation
    setup_monitoring
    
    log "INFO" "Unified deployment completed successfully!"
    log "INFO" "Application URL: https://${PROJECT_ID}.web.app"
    log "INFO" "Logs available at: $LOG_FILE"
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
            --project-id)
                PROJECT_ID="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --rollback)
                rollback_deployment
                exit 0
                ;;
            --help)
                cat << EOF
Unified Firebase & Google Cloud Deployment Script

Usage: $0 [options]

Options:
    --environment    Deployment environment (staging|production)
    --project-id     Google Cloud Project ID
    --region        Primary deployment region
    --rollback      Rollback to previous deployment
    --help          Show this help message

Environment Variables:
    PROJECT_ID              Google Cloud Project ID
    ENVIRONMENT            Deployment environment
    REGION                Primary deployment region
    TERRAFORM_STATE_BUCKET Terraform state bucket

Examples:
    # Deploy to staging
    $0 --environment staging --project-id solarify-staging

    # Deploy to production
    ENVIRONMENT=production PROJECT_ID=solarify-prod $0

    # Rollback deployment
    $0 --project-id solarify-prod --rollback
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