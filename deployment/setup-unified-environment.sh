#!/bin/bash

# =============================================================================
# Unified Environment Setup Script
# =============================================================================
# Single setup process for both Firebase and Google Cloud
# Demonstrates unified authentication and configuration
# =============================================================================

set -euo pipefail

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Default values
readonly DEFAULT_PROJECT_PREFIX="solarify"
readonly DEFAULT_REGION="us-central1"
readonly DEFAULT_ZONE="us-central1-a"

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

prompt_user() {
    local prompt="$1"
    local default="$2"
    local response
    
    if [[ -n "$default" ]]; then
        read -p "$prompt [$default]: " response
        echo "${response:-$default}"
    else
        read -p "$prompt: " response
        echo "$response"
    fi
}

check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    local tools=("node" "npm" "curl" "jq")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log "ERROR" "Missing required tools: ${missing_tools[*]}"
        log "INFO" "Please install the missing tools and run this script again"
        
        case "$(uname -s)" in
            Darwin*)
                log "INFO" "On macOS, you can install missing tools with:"
                log "INFO" "  brew install ${missing_tools[*]}"
                ;;
            Linux*)
                log "INFO" "On Ubuntu/Debian, you can install missing tools with:"
                log "INFO" "  sudo apt-get update && sudo apt-get install -y ${missing_tools[*]}"
                ;;
        esac
        
        exit 1
    fi
    
    # Check Node.js version
    local node_version=$(node -v | sed 's/v//')
    local required_node="18.0.0"
    if ! printf '%s\n%s\n' "$required_node" "$node_version" | sort -V -C; then
        log "ERROR" "Node.js version $node_version is too old. Required: >= $required_node"
        exit 1
    fi
    
    log "INFO" "Prerequisites check passed"
}

install_firebase_cli() {
    log "INFO" "Checking Firebase CLI installation..."
    
    if command -v firebase &> /dev/null; then
        local firebase_version=$(firebase --version | head -n1)
        log "INFO" "Firebase CLI is already installed: $firebase_version"
    else
        log "INFO" "Installing Firebase CLI..."
        npm install -g firebase-tools
        log "INFO" "Firebase CLI installed successfully"
    fi
}

install_google_cloud_cli() {
    log "INFO" "Checking Google Cloud CLI installation..."
    
    if command -v gcloud &> /dev/null; then
        local gcloud_version=$(gcloud version --format="value(Google Cloud SDK)")
        log "INFO" "Google Cloud CLI is already installed: $gcloud_version"
        return 0
    fi
    
    log "INFO" "Google Cloud CLI not found. Installing..."
    
    local os_name=$(uname -s)
    local arch_name=$(uname -m)
    
    case "$os_name" in
        Darwin*)
            if command -v brew &> /dev/null; then
                log "INFO" "Installing Google Cloud CLI via Homebrew..."
                brew install google-cloud-sdk
            else
                log "INFO" "Please install Google Cloud CLI manually from:"
                log "INFO" "https://cloud.google.com/sdk/docs/install-sdk#mac"
                exit 1
            fi
            ;;
        Linux*)
            log "INFO" "Installing Google Cloud CLI for Linux..."
            
            # Download and install
            local download_dir="/tmp/gcloud-install"
            mkdir -p "$download_dir"
            cd "$download_dir"
            
            if [[ "$arch_name" == "x86_64" ]]; then
                curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz
                tar -xf google-cloud-cli-linux-x86_64.tar.gz
            else
                log "ERROR" "Unsupported architecture: $arch_name"
                exit 1
            fi
            
            ./google-cloud-sdk/install.sh --quiet --path-update=true
            
            # Add to PATH for current session
            export PATH="$HOME/google-cloud-sdk/bin:$PATH"
            
            cd - > /dev/null
            rm -rf "$download_dir"
            ;;
        *)
            log "ERROR" "Unsupported operating system: $os_name"
            log "INFO" "Please install Google Cloud CLI manually from:"
            log "INFO" "https://cloud.google.com/sdk/docs/install"
            exit 1
            ;;
    esac
    
    log "INFO" "Google Cloud CLI installed successfully"
}

authenticate_google_cloud() {
    log "INFO" "Setting up Google Cloud authentication..."
    
    # Check if already authenticated
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
        local current_user=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)
        log "INFO" "Already authenticated as: $current_user"
        
        local use_existing=$(prompt_user "Use existing authentication?" "y")
        if [[ "$use_existing" =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    log "INFO" "Please complete authentication in your browser..."
    gcloud auth login
    
    # Set up application default credentials
    log "INFO" "Setting up application default credentials..."
    gcloud auth application-default login
}

setup_google_cloud_project() {
    log "INFO" "Setting up Google Cloud project..."
    
    local project_prefix=$(prompt_user "Enter project prefix" "$DEFAULT_PROJECT_PREFIX")
    local environment=$(prompt_user "Enter environment (staging/production)" "staging")
    local project_id="${project_prefix}-${environment}"
    
    # Check if project exists
    if gcloud projects describe "$project_id" &>/dev/null; then
        log "INFO" "Project $project_id already exists"
        gcloud config set project "$project_id"
    else
        log "INFO" "Creating new Google Cloud project: $project_id"
        
        # Get billing account
        local billing_accounts=$(gcloud billing accounts list --format="value(name,displayName)" 2>/dev/null || echo "")
        
        if [[ -z "$billing_accounts" ]]; then
            log "WARN" "No billing accounts found. You'll need to set up billing manually."
            gcloud projects create "$project_id"
        else
            log "INFO" "Available billing accounts:"
            echo "$billing_accounts" | nl
            
            local billing_account_name=$(echo "$billing_accounts" | head -n1 | cut -f1)
            log "INFO" "Using billing account: $billing_account_name"
            
            gcloud projects create "$project_id"
            gcloud billing projects link "$project_id" --billing-account="$billing_account_name"
        fi
        
        gcloud config set project "$project_id"
    fi
    
    # Set default region and zone
    local region=$(prompt_user "Enter default region" "$DEFAULT_REGION")
    local zone=$(prompt_user "Enter default zone" "$DEFAULT_ZONE")
    
    gcloud config set compute/region "$region"
    gcloud config set compute/zone "$zone"
    
    # Export environment variables
    export PROJECT_ID="$project_id"
    export ENVIRONMENT="$environment"
    export REGION="$region"
    
    log "INFO" "Google Cloud project setup completed"
    log "INFO" "Project ID: $project_id"
    log "INFO" "Environment: $environment"
    log "INFO" "Region: $region"
}

enable_required_apis() {
    log "INFO" "Enabling required Google Cloud APIs..."
    
    local required_apis=(
        "firebase.googleapis.com"
        "firestore.googleapis.com"
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "compute.googleapis.com"
        "artifactregistry.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "iam.googleapis.com"
        "secretmanager.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "storage.googleapis.com"
        "pubsub.googleapis.com"
        "cloudfunctions.googleapis.com"
        "firebaseapphosting.googleapis.com"
    )
    
    for api in "${required_apis[@]}"; do
        log "INFO" "Enabling $api..."
        gcloud services enable "$api"
    done
    
    log "INFO" "Waiting for APIs to be fully enabled..."
    sleep 30
    
    log "INFO" "Required APIs enabled successfully"
}

setup_firebase_project() {
    log "INFO" "Setting up Firebase project..."
    
    # Use the same project ID as Google Cloud
    local project_id="${PROJECT_ID}"
    
    # Check if Firebase project already exists
    if firebase projects:list --format=json | jq -e ".[] | select(.projectId == \"$project_id\")" > /dev/null; then
        log "INFO" "Firebase project $project_id already exists"
    else
        log "INFO" "Adding Firebase to existing Google Cloud project..."
        firebase projects:addfirebase "$project_id"
    fi
    
    # Set the active Firebase project
    firebase use "$project_id"
    
    log "INFO" "Firebase project setup completed"
}

create_terraform_state_bucket() {
    log "INFO" "Setting up Terraform state bucket..."
    
    local bucket_name="${PROJECT_ID}-terraform-state"
    
    # Check if bucket already exists
    if gsutil ls -b "gs://$bucket_name" &>/dev/null; then
        log "INFO" "Terraform state bucket already exists: $bucket_name"
    else
        log "INFO" "Creating Terraform state bucket: $bucket_name"
        gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$bucket_name"
        gsutil versioning set on "gs://$bucket_name"
        
        # Set up lifecycle policy
        cat > /tmp/lifecycle.json << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 90,
          "isLive": false
        }
      }
    ]
  }
}
EOF
        
        gsutil lifecycle set /tmp/lifecycle.json "gs://$bucket_name"
        rm -f /tmp/lifecycle.json
    fi
    
    log "INFO" "Terraform state bucket setup completed"
}

setup_service_accounts() {
    log "INFO" "Setting up service accounts..."
    
    local service_accounts=(
        "firebase-admin:Firebase Admin Service Account:roles/firebase.admin,roles/datastore.user"
        "terraform-runner:Terraform Service Account:roles/editor,roles/storage.admin"
        "app-runner:Application Service Account:roles/run.invoker,roles/datastore.user"
    )
    
    for sa_config in "${service_accounts[@]}"; do
        IFS=':' read -ra SA_PARTS <<< "$sa_config"
        local sa_name="${SA_PARTS[0]}"
        local sa_description="${SA_PARTS[1]}"
        local sa_roles="${SA_PARTS[2]}"
        
        local sa_email="${sa_name}@${PROJECT_ID}.iam.gserviceaccount.com"
        
        # Create service account if it doesn't exist
        if ! gcloud iam service-accounts describe "$sa_email" &>/dev/null; then
            log "INFO" "Creating service account: $sa_name"
            gcloud iam service-accounts create "$sa_name" \
                --description="$sa_description" \
                --display-name="$sa_description"
        else
            log "INFO" "Service account already exists: $sa_name"
        fi
        
        # Assign roles
        IFS=',' read -ra ROLES <<< "$sa_roles"
        for role in "${ROLES[@]}"; do
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$sa_email" \
                --role="$role" \
                --quiet
        done
    done
    
    log "INFO" "Service accounts setup completed"
}

create_environment_file() {
    log "INFO" "Creating environment configuration file..."
    
    local env_file="${PROJECT_ROOT}/.env.local"
    
    cat > "$env_file" << EOF
# Solarify Unified Firebase & Google Cloud Environment Configuration
# Generated on $(date)

# Project Configuration
PROJECT_ID=${PROJECT_ID}
ENVIRONMENT=${ENVIRONMENT}
REGION=${REGION}

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${PROJECT_ID}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${PROJECT_ID}.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://${PROJECT_ID}-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${PROJECT_ID}.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=${PROJECT_ID}
GOOGLE_CLOUD_REGION=${REGION}

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://${PROJECT_ID}.web.app
NEXT_PUBLIC_API_URL=https://${PROJECT_ID}.web.app/api

# External Services (add your API keys)
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Security
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://${PROJECT_ID}.web.app

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn_here
GOOGLE_ANALYTICS_ID=your_ga_id_here
EOF
    
    log "INFO" "Environment file created: $env_file"
    log "WARN" "Please update the API keys and secrets in the environment file"
}

initialize_terraform() {
    log "INFO" "Initializing Terraform configuration..."
    
    local terraform_dir="${PROJECT_ROOT}/infrastructure/terraform"
    
    if [[ ! -d "$terraform_dir" ]]; then
        log "WARN" "Terraform directory not found. Skipping Terraform initialization."
        return 0
    fi
    
    cd "$terraform_dir"
    
    # Create terraform.tfvars file
    cat > terraform.tfvars << EOF
# Solarify Terraform Configuration
# Generated on $(date)

project_id = "${PROJECT_ID}"
environment = "${ENVIRONMENT}"
primary_region = "${REGION}"
project_name = "solarify"

# Terraform state configuration
terraform_state_bucket = "${PROJECT_ID}-terraform-state"

# Network configuration
enable_private_google_access = true
firewall_source_ranges = ["0.0.0.0/0"]

# Application configuration
application_image = "gcr.io/${PROJECT_ID}/solarify:latest"
application_port = 3000
health_check_path = "/api/health"

# Monitoring configuration
monitoring_config = {
  enable_uptime_checks = true
  enable_alerting = true
}

# Cost management
budget_config = {
  amount = 1000
  currency = "USD"
}
EOF
    
    # Initialize Terraform
    terraform init -backend-config="bucket=${PROJECT_ID}-terraform-state"
    
    log "INFO" "Terraform initialization completed"
    
    cd - > /dev/null
}

display_setup_summary() {
    log "INFO" "=== UNIFIED ENVIRONMENT SETUP COMPLETE ==="
    log "INFO" "Project ID: ${PROJECT_ID}"
    log "INFO" "Environment: ${ENVIRONMENT}"
    log "INFO" "Region: ${REGION}"
    log "INFO" ""
    log "INFO" "✅ Google Cloud CLI authenticated and configured"
    log "INFO" "✅ Firebase CLI authenticated and configured"
    log "INFO" "✅ Required APIs enabled"
    log "INFO" "✅ Service accounts created"
    log "INFO" "✅ Terraform state bucket created"
    log "INFO" "✅ Environment configuration file created"
    log "INFO" ""
    log "INFO" "Next Steps:"
    log "INFO" "1. Update API keys in .env.local file"
    log "INFO" "2. Review and customize Terraform configuration"
    log "INFO" "3. Run: ./deployment/unified-deploy.sh --environment ${ENVIRONMENT}"
    log "INFO" ""
    log "INFO" "Firebase Console: https://console.firebase.google.com/project/${PROJECT_ID}"
    log "INFO" "Google Cloud Console: https://console.cloud.google.com/home/dashboard?project=${PROJECT_ID}"
    log "INFO" "=============================================="
}

main() {
    log "INFO" "Starting unified Firebase & Google Cloud environment setup"
    log "INFO" "This script will configure both platforms with a single setup process"
    
    # Check if running in CI/CD environment
    if [[ -n "${CI:-}" ]]; then
        log "INFO" "Running in CI/CD environment - using environment variables"
        PROJECT_ID="${PROJECT_ID:-}"
        ENVIRONMENT="${ENVIRONMENT:-staging}"
        REGION="${REGION:-us-central1}"
        
        if [[ -z "$PROJECT_ID" ]]; then
            log "ERROR" "PROJECT_ID environment variable is required in CI/CD"
            exit 1
        fi
    else
        # Interactive setup
        check_prerequisites
        install_firebase_cli
        install_google_cloud_cli
        authenticate_google_cloud
        setup_google_cloud_project
    fi
    
    # Common setup steps
    enable_required_apis
    setup_firebase_project
    create_terraform_state_bucket
    setup_service_accounts
    create_environment_file
    initialize_terraform
    
    display_setup_summary
    
    log "INFO" "Unified environment setup completed successfully!"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi