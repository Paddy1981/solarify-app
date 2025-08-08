#!/bin/bash
# Solarify Backup and Disaster Recovery Infrastructure Deployment Script
# Comprehensive deployment automation for backup systems

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TERRAFORM_DIR="${ROOT_DIR}/infrastructure/terraform"
LOG_DIR="${ROOT_DIR}/logs"
CONFIG_DIR="${ROOT_DIR}/config"

# Default values
ENVIRONMENT="production"
PROJECT_ID=""
PRIMARY_REGION="us-central1"
SECONDARY_REGION="us-east1"
DRY_RUN="false"
SKIP_VALIDATION="false"
AUTO_APPROVE="false"
DESTROY_MODE="false"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging setup
mkdir -p "${LOG_DIR}"
DEPLOYMENT_LOG="${LOG_DIR}/backup-deployment-$(date +%Y%m%d-%H%M%S).log"

# Function to log messages
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${DEPLOYMENT_LOG}"
}

# Function to log info messages
log_info() {
    log "INFO" "${BLUE}$*${NC}"
}

# Function to log warning messages
log_warn() {
    log "WARN" "${YELLOW}$*${NC}"
}

# Function to log error messages
log_error() {
    log "ERROR" "${RED}$*${NC}"
}

# Function to log success messages
log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Solarify backup and disaster recovery infrastructure using Terraform.

OPTIONS:
    -p, --project-id PROJECT_ID     GCP Project ID (required)
    -e, --environment ENV           Environment (production|staging|development)
    -r, --primary-region REGION     Primary region (default: us-central1)
    -s, --secondary-region REGION   Secondary region (default: us-east1)
    -d, --dry-run                   Perform dry run (terraform plan only)
    --skip-validation               Skip pre-deployment validation
    --auto-approve                  Auto approve terraform apply
    --destroy                       Destroy infrastructure (use with caution)
    -h, --help                      Show this help message

EXAMPLES:
    # Deploy production infrastructure
    $0 -p solarify-prod-12345 -e production

    # Deploy staging with custom regions
    $0 -p solarify-staging -e staging -r us-west1 -s us-east1

    # Dry run deployment
    $0 -p solarify-prod-12345 -e production --dry-run

    # Destroy infrastructure (use with extreme caution)
    $0 -p solarify-prod-12345 -e production --destroy --auto-approve

EOF
}

# Function to validate prerequisites
validate_prerequisites() {
    log_info "Validating deployment prerequisites..."
    
    # Check required tools
    local required_tools=("terraform" "gcloud" "gsutil" "kubectl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
        log_info "✓ $tool is available"
    done
    
    # Check Terraform version
    local tf_version=$(terraform version -json | jq -r '.terraform_version')
    if [[ $(echo "$tf_version 1.0.0" | tr ' ' '\n' | sort -V | head -n1) != "1.0.0" ]]; then
        log_error "Terraform version $tf_version is too old. Required: >= 1.0.0"
        exit 1
    fi
    log_info "✓ Terraform version $tf_version is compatible"
    
    # Check GCP authentication
    if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | grep -q .; then
        log_error "No active GCP authentication found. Please run 'gcloud auth login'"
        exit 1
    fi
    log_info "✓ GCP authentication is active"
    
    # Validate project ID
    if [[ -z "$PROJECT_ID" ]]; then
        log_error "Project ID is required"
        exit 1
    fi
    
    # Check if project exists and is accessible
    if ! gcloud projects describe "$PROJECT_ID" &> /dev/null; then
        log_error "Project $PROJECT_ID does not exist or is not accessible"
        exit 1
    fi
    log_info "✓ Project $PROJECT_ID is accessible"
    
    # Set active project
    gcloud config set project "$PROJECT_ID"
    log_info "✓ Active project set to $PROJECT_ID"
    
    log_success "Prerequisites validation completed"
}

# Function to enable required GCP APIs
enable_gcp_apis() {
    log_info "Enabling required GCP APIs..."
    
    local apis=(
        "compute.googleapis.com"
        "storage.googleapis.com" 
        "cloudresourcemanager.googleapis.com"
        "iam.googleapis.com"
        "cloudkms.googleapis.com"
        "pubsub.googleapis.com"
        "run.googleapis.com"
        "scheduler.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "secretmanager.googleapis.com"
        "dns.googleapis.com"
        "storagetransfer.googleapis.com"
        "firestore.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        log_info "Enabling $api..."
        if gcloud services enable "$api" --project="$PROJECT_ID"; then
            log_info "✓ $api enabled"
        else
            log_error "Failed to enable $api"
            exit 1
        fi
    done
    
    log_success "All required APIs enabled"
}

# Function to setup Terraform backend
setup_terraform_backend() {
    log_info "Setting up Terraform backend..."
    
    local backend_bucket="${PROJECT_ID}-terraform-state"
    
    # Create bucket for Terraform state if it doesn't exist
    if ! gsutil ls "gs://${backend_bucket}" &> /dev/null; then
        log_info "Creating Terraform state bucket: $backend_bucket"
        gsutil mb -p "$PROJECT_ID" -l "$PRIMARY_REGION" "gs://${backend_bucket}"
        
        # Enable versioning
        gsutil versioning set on "gs://${backend_bucket}"
        
        # Set lifecycle policy
        cat > /tmp/lifecycle.json << 'EOF'
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 90, "isLive": false}
    }
  ]
}
EOF
        gsutil lifecycle set /tmp/lifecycle.json "gs://${backend_bucket}"
        rm -f /tmp/lifecycle.json
        
        log_info "✓ Terraform state bucket created and configured"
    else
        log_info "✓ Terraform state bucket already exists"
    fi
    
    # Create backend configuration
    cat > "${TERRAFORM_DIR}/backend.tf" << EOF
terraform {
  backend "gcs" {
    bucket = "${backend_bucket}"
    prefix = "backup-infrastructure"
  }
}
EOF
    
    log_success "Terraform backend configured"
}

# Function to create Terraform variables file
create_terraform_vars() {
    log_info "Creating Terraform variables file..."
    
    local vars_file="${TERRAFORM_DIR}/terraform.tfvars"
    
    # Get notification emails from config or use defaults
    local notification_emails='["devops@solarify.com", "cto@solarify.com"]'
    if [[ -f "${CONFIG_DIR}/notification-emails.json" ]]; then
        notification_emails=$(cat "${CONFIG_DIR}/notification-emails.json")
    fi
    
    # Get SMS numbers from config
    local sms_numbers='[]'
    if [[ -f "${CONFIG_DIR}/sms-numbers.json" ]]; then
        sms_numbers=$(cat "${CONFIG_DIR}/sms-numbers.json")
    fi
    
    # Get PagerDuty key from environment or config
    local pagerduty_key=""
    if [[ -n "${PAGERDUTY_SERVICE_KEY:-}" ]]; then
        pagerduty_key="$PAGERDUTY_SERVICE_KEY"
    elif [[ -f "${CONFIG_DIR}/pagerduty-key.txt" ]]; then
        pagerduty_key=$(cat "${CONFIG_DIR}/pagerduty-key.txt")
    fi
    
    # Get Slack webhook from environment or config
    local slack_webhook=""
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        slack_webhook="$SLACK_WEBHOOK_URL"
    elif [[ -f "${CONFIG_DIR}/slack-webhook.txt" ]]; then
        slack_webhook=$(cat "${CONFIG_DIR}/slack-webhook.txt")
    fi
    
    cat > "$vars_file" << EOF
# Solarify Backup Infrastructure Configuration
# Generated automatically by deployment script

project_id       = "$PROJECT_ID"
environment      = "$ENVIRONMENT"
primary_region   = "$PRIMARY_REGION"
secondary_region = "$SECONDARY_REGION"

# Enable cross-region replication for production
enable_cross_region_replication = $([ "$ENVIRONMENT" = "production" ] && echo "true" || echo "false")

# Backup retention (longer for production)
backup_retention_days = $([ "$ENVIRONMENT" = "production" ] && echo "90" || echo "30")
archive_retention_days = $([ "$ENVIRONMENT" = "production" ] && echo "2555" || echo "365")

# Notification configuration
notification_emails = $notification_emails
sms_notification_numbers = $sms_numbers
pagerduty_service_key = "$pagerduty_key"
slack_webhook_url = "$slack_webhook"

# Resource allocation (more for production)
backup_service_resources = {
  cpu_request    = "$([ "$ENVIRONMENT" = "production" ] && echo "1000m" || echo "500m")"
  memory_request = "$([ "$ENVIRONMENT" = "production" ] && echo "2Gi" || echo "1Gi")"
  cpu_limit      = "$([ "$ENVIRONMENT" = "production" ] && echo "2000m" || echo "1000m")"
  memory_limit   = "$([ "$ENVIRONMENT" = "production" ] && echo "4Gi" || echo "2Gi")"
  max_instances  = $([ "$ENVIRONMENT" = "production" ] && echo "10" || echo "5")
  min_instances  = $([ "$ENVIRONMENT" = "production" ] && echo "1" || echo "0")
}

dr_service_resources = {
  cpu_request    = "1000m"
  memory_request = "2Gi" 
  cpu_limit      = "2000m"
  memory_limit   = "4Gi"
  max_instances  = 5
  min_instances  = 0
}

# Monitoring thresholds
monitoring_config = {
  enable_uptime_checks        = true
  backup_failure_threshold    = 0
  storage_capacity_threshold  = 0.8
  rto_threshold_minutes      = $([ "$ENVIRONMENT" = "production" ] && echo "240" || echo "120")
  rpo_threshold_minutes      = $([ "$ENVIRONMENT" = "production" ] && echo "60" || echo "120")
}

# Firestore collections configuration
firestore_collections = {
  critical = [
    "users",
    "profiles",
    "rfqs", 
    "quotes",
    "solar_systems",
    "energy_production"
  ]
  standard = [
    "products",
    "projects",
    "weather_data",
    "utility_rates",
    "reviews"
  ]
  optional = [
    "notifications",
    "analytics", 
    "user_activity",
    "portfolios"
  ]
}

# Backup schedules (more frequent for production critical data)
backup_schedules = {
  firestore_full        = "0 2 * * 0"      # Sunday 2 AM
  firestore_incremental = "0 2 * * 1-6"    # Mon-Sat 2 AM
  auth_backup           = "0 3 * * *"       # Daily 3 AM
  storage_backup        = "0 4 * * *"       # Daily 4 AM  
  solar_data_backup     = "$([ "$ENVIRONMENT" = "production" ] && echo "0 */4 * * *" || echo "0 */6 * * *")"
}

# Compliance requirements
compliance_requirements = {
  enable_audit_logging     = true
  retention_compliance     = "7_years"
  data_residency_regions   = ["us"]
  encryption_at_rest       = true
  encryption_in_transit    = true
}

# Cost optimization
cost_optimization = {
  enable_preemptible_instances = false
  enable_committed_use_discount = $([ "$ENVIRONMENT" = "production" ] && echo "true" || echo "false")
  storage_cost_optimization     = true
  backup_compression_enabled    = true
}

# Testing configuration
testing_config = {
  enable_automated_testing     = true
  test_schedule               = "0 6 * * 0"  # Sunday 6 AM
  restore_test_frequency      = "$([ "$ENVIRONMENT" = "production" ] && echo "monthly" || echo "quarterly")"
  validation_test_frequency   = "weekly"
}

# Additional tags
additional_tags = {
  deployed_by = "$(whoami)"
  deployed_at = "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  git_commit  = "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}

EOF
    
    log_info "✓ Terraform variables file created: $vars_file"
    log_success "Terraform configuration prepared"
}

# Function to initialize and plan Terraform
terraform_plan() {
    log_info "Initializing and planning Terraform deployment..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    if terraform init -upgrade; then
        log_info "✓ Terraform initialized"
    else
        log_error "Terraform initialization failed"
        exit 1
    fi
    
    # Validate configuration
    log_info "Validating Terraform configuration..."
    if terraform validate; then
        log_info "✓ Terraform configuration is valid"
    else
        log_error "Terraform configuration validation failed"
        exit 1
    fi
    
    # Create plan
    local plan_file="backup-infrastructure-$(date +%Y%m%d-%H%M%S).tfplan"
    log_info "Creating Terraform plan..."
    if terraform plan -out="$plan_file" -var-file="terraform.tfvars"; then
        log_info "✓ Terraform plan created: $plan_file"
        
        # Show plan summary
        terraform show -no-color "$plan_file" | tee -a "${DEPLOYMENT_LOG}"
        
        echo "$plan_file" > .last-plan
    else
        log_error "Terraform planning failed"
        exit 1
    fi
    
    log_success "Terraform planning completed"
}

# Function to apply Terraform configuration
terraform_apply() {
    log_info "Applying Terraform configuration..."
    
    cd "$TERRAFORM_DIR"
    
    local plan_file
    if [[ -f .last-plan ]]; then
        plan_file=$(cat .last-plan)
    else
        log_error "No plan file found. Run planning first."
        exit 1
    fi
    
    if [[ ! -f "$plan_file" ]]; then
        log_error "Plan file $plan_file not found"
        exit 1
    fi
    
    # Apply with or without auto-approve
    local apply_args=("apply")
    if [[ "$AUTO_APPROVE" == "true" ]]; then
        apply_args+=("-auto-approve")
    fi
    apply_args+=("$plan_file")
    
    log_info "Applying Terraform plan: $plan_file"
    if terraform "${apply_args[@]}"; then
        log_success "Terraform apply completed successfully"
        
        # Save outputs
        local outputs_file="${LOG_DIR}/terraform-outputs-$(date +%Y%m%d-%H%M%S).json"
        terraform output -json > "$outputs_file"
        log_info "✓ Terraform outputs saved to: $outputs_file"
        
        # Clean up plan file
        rm -f "$plan_file" .last-plan
        
    else
        log_error "Terraform apply failed"
        exit 1
    fi
}

# Function to destroy infrastructure
terraform_destroy() {
    log_warn "DESTROYING BACKUP INFRASTRUCTURE - THIS IS IRREVERSIBLE!"
    
    if [[ "$AUTO_APPROVE" != "true" ]]; then
        echo
        log_warn "You are about to destroy the backup and disaster recovery infrastructure."
        log_warn "This action is IRREVERSIBLE and will result in:"
        log_warn "- Loss of all backup data"
        log_warn "- Destruction of disaster recovery capabilities" 
        log_warn "- Potential data loss if no other backups exist"
        echo
        read -p "Are you absolutely sure? Type 'DESTROY' to confirm: " confirmation
        
        if [[ "$confirmation" != "DESTROY" ]]; then
            log_info "Destruction cancelled by user"
            exit 0
        fi
    fi
    
    cd "$TERRAFORM_DIR"
    
    log_warn "Proceeding with infrastructure destruction..."
    
    local destroy_args=("destroy" "-var-file=terraform.tfvars")
    if [[ "$AUTO_APPROVE" == "true" ]]; then
        destroy_args+=("-auto-approve")
    fi
    
    if terraform "${destroy_args[@]}"; then
        log_success "Infrastructure destroyed successfully"
    else
        log_error "Infrastructure destruction failed"
        exit 1
    fi
}

# Function to validate deployment
validate_deployment() {
    if [[ "$SKIP_VALIDATION" == "true" ]]; then
        log_info "Skipping deployment validation"
        return 0
    fi
    
    log_info "Validating deployment..."
    
    cd "$TERRAFORM_DIR"
    
    # Get outputs
    local backup_processor_url
    local dr_service_url
    backup_processor_url=$(terraform output -raw cloud_run_services | jq -r '.backup_processor.url')
    dr_service_url=$(terraform output -raw cloud_run_services | jq -r '.disaster_recovery.url')
    
    # Test service endpoints
    if [[ -n "$backup_processor_url" ]]; then
        log_info "Testing backup processor service..."
        if curl -f -s "${backup_processor_url}/health" > /dev/null; then
            log_info "✓ Backup processor service is healthy"
        else
            log_warn "⚠ Backup processor service health check failed"
        fi
    fi
    
    if [[ -n "$dr_service_url" ]]; then
        log_info "Testing disaster recovery service..."
        if curl -f -s "${dr_service_url}/health" > /dev/null; then
            log_info "✓ Disaster recovery service is healthy"
        else
            log_warn "⚠ Disaster recovery service health check failed"
        fi
    fi
    
    # Check bucket accessibility
    local primary_bucket
    primary_bucket=$(terraform output -raw backup_storage | jq -r '.primary.name')
    
    if [[ -n "$primary_bucket" ]]; then
        log_info "Testing primary backup bucket accessibility..."
        if gsutil ls "gs://${primary_bucket}/" > /dev/null 2>&1; then
            log_info "✓ Primary backup bucket is accessible"
        else
            log_warn "⚠ Primary backup bucket accessibility check failed"
        fi
    fi
    
    log_success "Deployment validation completed"
}

# Function to display deployment summary
deployment_summary() {
    log_info "Deployment Summary"
    echo "================================"
    echo "Environment: $ENVIRONMENT"
    echo "Project ID: $PROJECT_ID" 
    echo "Primary Region: $PRIMARY_REGION"
    echo "Secondary Region: $SECONDARY_REGION"
    echo "Deployment Log: $DEPLOYMENT_LOG"
    echo
    
    if [[ "$DESTROY_MODE" == "true" ]]; then
        log_warn "Infrastructure has been DESTROYED"
        return
    fi
    
    cd "$TERRAFORM_DIR"
    
    # Key outputs
    echo "Key Infrastructure Components:"
    echo "- Backup Service Account: $(terraform output -raw backup_service_account | jq -r '.email')"
    echo "- Primary Backup Bucket: $(terraform output -raw backup_storage | jq -r '.primary.name')"
    echo "- Secondary Backup Bucket: $(terraform output -raw backup_storage | jq -r '.secondary.name')"
    echo "- Archive Bucket: $(terraform output -raw backup_storage | jq -r '.archive.name')"
    echo "- Backup Processor URL: $(terraform output -raw cloud_run_services | jq -r '.backup_processor.url')"
    echo "- Disaster Recovery URL: $(terraform output -raw cloud_run_services | jq -r '.disaster_recovery.url')"
    echo
    
    echo "Backup Schedules:"
    terraform output -raw backup_schedules | jq -r 'to_entries[] | "- \(.key): \(.value.schedule)"'
    echo
    
    echo "Monitoring:"
    echo "- Email alerts: $(terraform output -raw backup_configuration_summary | jq -r '.monitoring.backup_failure_threshold')"
    echo "- Storage threshold: $(terraform output -raw backup_configuration_summary | jq -r '.monitoring.storage_capacity_threshold')"
    echo
    
    log_success "Backup and Disaster Recovery infrastructure deployed successfully!"
    
    # Next steps
    echo
    log_info "Next Steps:"
    echo "1. Configure application to use the deployed backup services"
    echo "2. Test backup operations: npm run test:backup"
    echo "3. Test disaster recovery procedures: npm run test:disaster-recovery"
    echo "4. Review and customize notification channels"
    echo "5. Schedule regular backup validation tests"
    echo
    echo "For more information, see the deployment log: $DEPLOYMENT_LOG"
}

# Function to handle errors
error_handler() {
    local line_number=$1
    log_error "Error occurred at line $line_number"
    log_error "Deployment failed. Check the log for details: $DEPLOYMENT_LOG"
    exit 1
}

# Main function
main() {
    # Set error trap
    trap 'error_handler $LINENO' ERR
    
    log_info "Starting Solarify Backup Infrastructure Deployment"
    log_info "Script: $0"
    log_info "Arguments: $*"
    log_info "Timestamp: $(date)"
    log_info "User: $(whoami)"
    log_info "Working Directory: $(pwd)"
    
    # Validate prerequisites
    validate_prerequisites
    
    # Enable required APIs
    enable_gcp_apis
    
    # Setup Terraform backend
    setup_terraform_backend
    
    # Create Terraform variables
    create_terraform_vars
    
    if [[ "$DESTROY_MODE" == "true" ]]; then
        terraform_destroy
    else
        # Plan deployment
        terraform_plan
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "Dry run completed. No changes applied."
            return 0
        fi
        
        # Apply deployment
        terraform_apply
        
        # Validate deployment
        validate_deployment
    fi
    
    # Show summary
    deployment_summary
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--primary-region)
            PRIMARY_REGION="$2"
            shift 2
            ;;
        -s|--secondary-region)
            SECONDARY_REGION="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN="true"
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION="true"
            shift
            ;;
        --auto-approve)
            AUTO_APPROVE="true"
            shift
            ;;
        --destroy)
            DESTROY_MODE="true"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$PROJECT_ID" ]]; then
    log_error "Project ID is required. Use -p or --project-id option."
    usage
    exit 1
fi

# Run main function
main "$@"