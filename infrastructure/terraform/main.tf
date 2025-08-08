# Solarify Solar Marketplace - Main Terraform Configuration
# Complete Infrastructure as Code for production deployment

terraform {
  required_version = ">= 1.5"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
  }

  backend "gcs" {
    bucket = var.terraform_state_bucket
    prefix = "terraform/state"
  }
}

# Configure Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.primary_region
}

provider "google-beta" {
  project = var.project_id
  region  = var.primary_region
}

# Local values for consistent resource naming and tagging
locals {
  environment_prefix = "${var.project_name}-${var.environment}"
  
  # Common labels applied to all resources
  common_labels = {
    project              = var.project_name
    environment         = var.environment
    application         = "solarify-marketplace"
    managed_by          = "terraform"
    cost_center         = var.cost_center
    team                = var.team
    deployment_version  = var.deployment_version
  }

  # Network configuration
  vpc_cidr = {
    development = "10.10.0.0/16"
    staging     = "10.20.0.0/16"
    production  = "10.30.0.0/16"
  }

  # Compute instance configurations
  instance_configs = {
    development = {
      min_instances = 1
      max_instances = 3
      cpu_request   = "1000m"
      memory_request = "2Gi"
      cpu_limit     = "2000m"
      memory_limit  = "4Gi"
    }
    staging = {
      min_instances = 2
      max_instances = 10
      cpu_request   = "1000m"
      memory_request = "2Gi"
      cpu_limit     = "2000m"
      memory_limit  = "4Gi"
    }
    production = {
      min_instances = 3
      max_instances = 20
      cpu_request   = "2000m"
      memory_request = "4Gi"
      cpu_limit     = "4000m"
      memory_limit  = "8Gi"
    }
  }
}

# Enable required Google Cloud APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "firestore.googleapis.com",
    "firebase.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "cloudkms.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudsql.googleapis.com",
    "redis.googleapis.com",
    "dns.googleapis.com",
    "certificatemanager.googleapis.com",
    "storage.googleapis.com",
    "pubsub.googleapis.com",
    "cloudscheduler.googleapis.com",
    "cloudfunctions.googleapis.com",
    "appengine.googleapis.com",
    "firebaseapphosting.googleapis.com"
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# Wait for APIs to be enabled
resource "time_sleep" "api_enablement_delay" {
  depends_on = [google_project_service.required_apis]
  create_duration = "60s"
}

# Core Infrastructure Module - VPC, Networking, Security
module "core_infrastructure" {
  source = "./modules/core-infrastructure"

  project_id         = var.project_id
  environment        = var.environment
  environment_prefix = local.environment_prefix
  primary_region     = var.primary_region
  secondary_regions  = var.secondary_regions
  
  vpc_cidr           = local.vpc_cidr[var.environment]
  availability_zones = var.availability_zones
  
  # Security configuration
  enable_private_google_access = var.enable_private_google_access
  firewall_source_ranges      = var.firewall_source_ranges
  
  # Labels
  labels = local.common_labels

  depends_on = [time_sleep.api_enablement_delay]
}

# Security Infrastructure Module - IAM, KMS, Secrets
module "security" {
  source = "./modules/security"

  project_id         = var.project_id
  environment        = var.environment
  environment_prefix = local.environment_prefix
  primary_region     = var.primary_region
  
  # KMS configuration
  kms_key_rotation_period = var.kms_key_rotation_period
  
  # Service accounts
  service_accounts = var.service_accounts
  
  # Labels
  labels = local.common_labels

  depends_on = [module.core_infrastructure]
}

# Database Infrastructure Module - Firestore, Caching, Storage
module "database" {
  source = "./modules/database"

  project_id         = var.project_id
  environment        = var.environment
  environment_prefix = local.environment_prefix
  primary_region     = var.primary_region
  
  # Firestore configuration
  firestore_database_type = var.firestore_database_type
  firestore_location_id   = var.firestore_location_id
  
  # Redis configuration
  redis_config = var.redis_config
  
  # Storage configuration
  storage_buckets = var.storage_buckets
  
  # Backup configuration
  enable_backup              = var.enable_backup
  backup_retention_days      = var.backup_retention_days
  enable_cross_region_backup = var.enable_cross_region_backup
  
  # Security keys from security module
  encryption_key_id = module.security.database_encryption_key_id
  
  # Labels
  labels = local.common_labels

  depends_on = [module.security]
}

# Compute Infrastructure Module - Cloud Run, Load Balancers, Auto-scaling
module "compute" {
  source = "./modules/compute"

  project_id         = var.project_id
  environment        = var.environment
  environment_prefix = local.environment_prefix
  primary_region     = var.primary_region
  
  # Network configuration from core infrastructure
  vpc_id              = module.core_infrastructure.vpc_id
  subnet_id          = module.core_infrastructure.app_subnet_id
  
  # Instance configuration
  instance_config = local.instance_configs[var.environment]
  
  # Application configuration
  application_image   = var.application_image
  application_port    = var.application_port
  health_check_path   = var.health_check_path
  
  # Domain and SSL configuration
  domain_name         = var.domain_name
  enable_ssl          = var.enable_ssl
  ssl_certificate_map = var.ssl_certificate_map
  
  # Service account from security module
  service_account_email = module.security.app_service_account_email
  
  # Labels
  labels = local.common_labels

  depends_on = [module.database]
}

# Monitoring and Observability Module
module "monitoring" {
  source = "./modules/monitoring"

  project_id         = var.project_id
  environment        = var.environment
  environment_prefix = local.environment_prefix
  primary_region     = var.primary_region
  
  # Monitoring configuration
  monitoring_config           = var.monitoring_config
  notification_channels      = var.notification_channels
  uptime_check_urls          = [module.compute.application_url]
  
  # Alert thresholds
  alert_thresholds = var.alert_thresholds
  
  # Log retention
  log_retention_days = var.log_retention_days
  
  # Labels
  labels = local.common_labels

  depends_on = [module.compute]
}

# CI/CD Infrastructure Module
module "cicd" {
  source = "./modules/cicd"

  project_id         = var.project_id
  environment        = var.environment
  environment_prefix = local.environment_prefix
  primary_region     = var.primary_region
  
  # Repository configuration
  source_repository_url = var.source_repository_url
  branch_pattern       = var.branch_pattern
  
  # Build configuration
  build_config         = var.build_config
  artifact_registry_id = var.artifact_registry_id
  
  # Deployment targets
  cloud_run_service_name = module.compute.cloud_run_service_name
  
  # Service account from security module
  build_service_account_email = module.security.build_service_account_email
  
  # Labels
  labels = local.common_labels

  depends_on = [module.monitoring]
}

# Backup and Disaster Recovery (Enhanced from existing configuration)
module "backup_disaster_recovery" {
  source = "./modules/backup-dr"

  project_id         = var.project_id
  environment        = var.environment
  environment_prefix = local.environment_prefix
  primary_region     = var.primary_region
  secondary_region   = var.secondary_region
  
  # Backup configuration
  backup_retention_days          = var.backup_retention_days
  enable_cross_region_replication = var.enable_cross_region_replication
  backup_schedules               = var.backup_schedules
  
  # Collections to backup
  firestore_collections = var.firestore_collections
  
  # Encryption keys from security module
  backup_encryption_key_id = module.security.backup_encryption_key_id
  
  # Notification configuration
  notification_emails = var.notification_emails
  
  # Labels
  labels = local.common_labels

  depends_on = [module.cicd]
}

# Cost Management and Optimization
module "cost_management" {
  source = "./modules/cost-management"

  project_id         = var.project_id
  environment        = var.environment
  environment_prefix = local.environment_prefix
  
  # Budget configuration
  budget_config = var.budget_config
  
  # Cost optimization settings
  cost_optimization = var.cost_optimization
  
  # Notification channels for budget alerts
  budget_notification_emails = var.notification_emails
  
  # Labels
  labels = local.common_labels

  depends_on = [module.backup_disaster_recovery]
}