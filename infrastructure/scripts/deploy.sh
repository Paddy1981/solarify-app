#!/bin/bash

# Solarify Infrastructure Deployment Script
# Comprehensive deployment automation for all environments

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Solarify Infrastructure Deployment Script

Usage: $0 [OPTIONS] ENVIRONMENT ACTION

ENVIRONMENTS:
    development     Deploy to development environment
    staging         Deploy to staging environment  
    production      Deploy to production environment

ACTIONS:
    plan           Generate and show Terraform execution plan
    apply          Apply Terraform configuration
    destroy        Destroy infrastructure (use with caution)
    validate       Validate Terraform configuration
    init           Initialize Terraform backend
    upgrade        Upgrade provider versions
    import         Import existing resources
    output         Show Terraform outputs

OPTIONS:
    -h, --help              Show this help message
    -v, --verbose           Enable verbose output
    -f, --force             Force action without confirmation
    --var-file FILE         Use custom variable file
    --target RESOURCE       Target specific resource
    --auto-approve          Auto-approve Terraform actions
    --backend-config FILE   Use custom backend configuration
    --parallelism N         Terraform parallelism (default: 10)
    --dry-run              Show what would be done without executing

EXAMPLES:
    $0 development plan
    $0 production apply --auto-approve
    $0 staging destroy --force
    $0 development validate
    $0 production output

EOF
}

# Default values
ENVIRONMENT=""
ACTION=""
VERBOSE=false
FORCE=false
AUTO_APPROVE=false
DRY_RUN=false
VAR_FILE=""
TARGET=""
BACKEND_CONFIG=""
PARALLELISM=10

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            --auto-approve)
                AUTO_APPROVE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --var-file)
                VAR_FILE="$2"
                shift 2
                ;;
            --target)
                TARGET="$2"
                shift 2
                ;;
            --backend-config)
                BACKEND_CONFIG="$2"
                shift 2
                ;;
            --parallelism)
                PARALLELISM="$2"
                shift 2
                ;;
            development|staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            plan|apply|destroy|validate|init|upgrade|import|output)
                ACTION="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment is required"
        show_help
        exit 1
    fi

    if [[ -z "$ACTION" ]]; then
        log_error "Action is required"
        show_help
        exit 1
    fi
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if required tools are installed
    local required_tools=("terraform" "gcloud" "jq" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is required but not installed"
            exit 1
        fi
    done

    # Check Terraform version
    local tf_version
    tf_version=$(terraform version -json | jq -r '.terraform_version')
    log_info "Using Terraform version: $tf_version"

    # Check if we're authenticated with gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        log_error "Please authenticate with gcloud: gcloud auth login"
        exit 1
    fi

    # Check if variable file exists
    local var_file_path
    if [[ -n "$VAR_FILE" ]]; then
        var_file_path="$VAR_FILE"
    else
        var_file_path="$TERRAFORM_DIR/environments/$ENVIRONMENT/terraform.tfvars"
    fi

    if [[ ! -f "$var_file_path" ]]; then
        log_error "Variable file not found: $var_file_path"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Initialize Terraform
terraform_init() {
    log_info "Initializing Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    local init_args=()
    
    if [[ -n "$BACKEND_CONFIG" ]]; then
        init_args+=("-backend-config=$BACKEND_CONFIG")
    else
        # Use environment-specific backend configuration
        local backend_config_file="$TERRAFORM_DIR/environments/$ENVIRONMENT/backend.hcl"
        if [[ -f "$backend_config_file" ]]; then
            init_args+=("-backend-config=$backend_config_file")
        fi
    fi
    
    if [[ "$VERBOSE" == true ]]; then
        init_args+=("-no-color")
    fi
    
    terraform init "${init_args[@]}"
    
    log_success "Terraform initialized"
}

# Validate Terraform configuration
terraform_validate() {
    log_info "Validating Terraform configuration..."
    
    cd "$TERRAFORM_DIR"
    terraform validate
    
    # Run additional validation checks
    log_info "Running additional validation checks..."
    
    # Check for security issues using tfsec if available
    if command -v tfsec &> /dev/null; then
        log_info "Running security scan with tfsec..."
        tfsec . || log_warning "Security issues detected"
    fi
    
    # Check for best practices using terrascan if available
    if command -v terrascan &> /dev/null; then
        log_info "Running best practices scan with terrascan..."
        terrascan scan -t terraform || log_warning "Best practice violations detected"
    fi
    
    log_success "Terraform configuration validated"
}

# Generate Terraform plan
terraform_plan() {
    log_info "Generating Terraform plan for $ENVIRONMENT environment..."
    
    cd "$TERRAFORM_DIR"
    
    local plan_args=()
    local var_file_path
    
    # Set variable file
    if [[ -n "$VAR_FILE" ]]; then
        var_file_path="$VAR_FILE"
    else
        var_file_path="environments/$ENVIRONMENT/terraform.tfvars"
    fi
    
    plan_args+=("-var-file=$var_file_path")
    plan_args+=("-parallelism=$PARALLELISM")
    
    # Add target if specified
    if [[ -n "$TARGET" ]]; then
        plan_args+=("-target=$TARGET")
    fi
    
    # Generate plan file
    local plan_file="$TERRAFORM_DIR/.terraform/plans/$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).tfplan"
    mkdir -p "$(dirname "$plan_file")"
    
    plan_args+=("-out=$plan_file")
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would execute: terraform plan ${plan_args[*]}"
        return 0
    fi
    
    terraform plan "${plan_args[@]}"
    
    log_success "Terraform plan generated: $plan_file"
    
    # Show plan summary
    log_info "Plan summary:"
    terraform show -json "$plan_file" | jq -r '
        .resource_changes[] | 
        select(.change.actions[] != "no-op") | 
        "\(.change.actions[0]): \(.address)"
    ' | sort | uniq -c
}

# Apply Terraform configuration
terraform_apply() {
    log_info "Applying Terraform configuration for $ENVIRONMENT environment..."
    
    cd "$TERRAFORM_DIR"
    
    # Safety check for production
    if [[ "$ENVIRONMENT" == "production" && "$FORCE" != true ]]; then
        log_warning "You are about to deploy to PRODUCTION environment!"
        read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    local apply_args=()
    local var_file_path
    
    # Set variable file
    if [[ -n "$VAR_FILE" ]]; then
        var_file_path="$VAR_FILE"
    else
        var_file_path="environments/$ENVIRONMENT/terraform.tfvars"
    fi
    
    apply_args+=("-var-file=$var_file_path")
    apply_args+=("-parallelism=$PARALLELISM")
    
    # Add target if specified
    if [[ -n "$TARGET" ]]; then
        apply_args+=("-target=$TARGET")
    fi
    
    # Auto-approve if specified
    if [[ "$AUTO_APPROVE" == true ]]; then
        apply_args+=("-auto-approve")
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would execute: terraform apply ${apply_args[*]}"
        return 0
    fi
    
    # Create deployment log
    local deploy_log="$TERRAFORM_DIR/logs/deploy-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).log"
    mkdir -p "$(dirname "$deploy_log")"
    
    # Apply with logging
    terraform apply "${apply_args[@]}" 2>&1 | tee "$deploy_log"
    
    local exit_code=${PIPESTATUS[0]}
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "Terraform apply completed successfully"
        
        # Run post-deployment checks
        run_post_deployment_checks
        
        # Send deployment notification
        send_deployment_notification "success"
    else
        log_error "Terraform apply failed with exit code $exit_code"
        send_deployment_notification "failure"
        exit $exit_code
    fi
}

# Destroy infrastructure
terraform_destroy() {
    log_warning "WARNING: This will destroy infrastructure in $ENVIRONMENT environment!"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_error "Production destruction requires manual intervention"
        log_error "Please contact the DevOps team"
        exit 1
    fi
    
    if [[ "$FORCE" != true ]]; then
        read -p "Type 'destroy' to confirm infrastructure destruction: " confirm
        if [[ "$confirm" != "destroy" ]]; then
            log_info "Destruction cancelled"
            exit 0
        fi
    fi
    
    cd "$TERRAFORM_DIR"
    
    local destroy_args=()
    local var_file_path
    
    if [[ -n "$VAR_FILE" ]]; then
        var_file_path="$VAR_FILE"
    else
        var_file_path="environments/$ENVIRONMENT/terraform.tfvars"
    fi
    
    destroy_args+=("-var-file=$var_file_path")
    
    if [[ "$AUTO_APPROVE" == true ]]; then
        destroy_args+=("-auto-approve")
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would execute: terraform destroy ${destroy_args[*]}"
        return 0
    fi
    
    terraform destroy "${destroy_args[@]}"
    
    log_success "Infrastructure destroyed"
}

# Show Terraform outputs
terraform_output() {
    log_info "Showing Terraform outputs for $ENVIRONMENT environment..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize if needed
    if [[ ! -d ".terraform" ]]; then
        terraform_init
    fi
    
    terraform output -json | jq '.'
}

# Run post-deployment checks
run_post_deployment_checks() {
    log_info "Running post-deployment checks..."
    
    # Health check
    local health_check_url
    health_check_url=$(terraform output -raw application_url 2>/dev/null || echo "")
    
    if [[ -n "$health_check_url" ]]; then
        log_info "Checking application health: $health_check_url/api/health"
        
        local retry_count=0
        local max_retries=10
        
        while [[ $retry_count -lt $max_retries ]]; do
            if curl -sf "$health_check_url/api/health" > /dev/null; then
                log_success "Application health check passed"
                break
            else
                log_warning "Health check attempt $((retry_count + 1)) failed, retrying..."
                sleep 30
                ((retry_count++))
            fi
        done
        
        if [[ $retry_count -eq $max_retries ]]; then
            log_error "Application health check failed after $max_retries attempts"
            return 1
        fi
    fi
    
    # Run smoke tests if available
    if [[ -f "$PROJECT_ROOT/scripts/smoke-tests.js" ]]; then
        log_info "Running smoke tests..."
        node "$PROJECT_ROOT/scripts/smoke-tests.js" || log_warning "Some smoke tests failed"
    fi
    
    log_success "Post-deployment checks completed"
}

# Send deployment notification
send_deployment_notification() {
    local status="$1"
    local webhook_url="${SLACK_WEBHOOK_URL:-}"
    
    if [[ -z "$webhook_url" ]]; then
        log_info "No webhook URL configured, skipping notification"
        return 0
    fi
    
    local color
    local message
    
    if [[ "$status" == "success" ]]; then
        color="good"
        message="✅ Deployment to $ENVIRONMENT environment completed successfully"
    else
        color="danger"
        message="❌ Deployment to $ENVIRONMENT environment failed"
    fi
    
    local payload
    payload=$(jq -n \
        --arg text "$message" \
        --arg color "$color" \
        --arg env "$ENVIRONMENT" \
        --arg user "$(whoami)" \
        '{
            text: $text,
            attachments: [{
                color: $color,
                fields: [
                    {
                        title: "Environment",
                        value: $env,
                        short: true
                    },
                    {
                        title: "Deployed by",
                        value: $user,
                        short: true
                    },
                    {
                        title: "Timestamp",
                        value: (now | strftime("%Y-%m-%d %H:%M:%S UTC")),
                        short: true
                    }
                ]
            }]
        }')
    
    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$webhook_url" > /dev/null || log_warning "Failed to send notification"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add any cleanup logic here
}

# Main execution
main() {
    trap cleanup EXIT
    
    parse_arguments "$@"
    validate_environment
    check_prerequisites
    
    case $ACTION in
        init)
            terraform_init
            ;;
        validate)
            terraform_init
            terraform_validate
            ;;
        plan)
            terraform_init
            terraform_validate
            terraform_plan
            ;;
        apply)
            terraform_init
            terraform_validate
            terraform_plan
            terraform_apply
            ;;
        destroy)
            terraform_init
            terraform_destroy
            ;;
        output)
            terraform_output
            ;;
        *)
            log_error "Unknown action: $ACTION"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"