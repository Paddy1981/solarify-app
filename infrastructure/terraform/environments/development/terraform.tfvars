# Solarify Development Environment Configuration

# ==============================================
# PROJECT CONFIGURATION
# ==============================================
project_id               = "solarify-marketplace-dev"
project_name            = "solarify"
environment             = "development"
deployment_version      = "dev-1.0.0"
cost_center            = "engineering"
team                   = "platform"

# ==============================================
# TERRAFORM STATE CONFIGURATION
# ==============================================
terraform_state_bucket = "solarify-terraform-state-dev"

# ==============================================
# REGIONAL CONFIGURATION
# ==============================================
primary_region    = "us-central1"
secondary_region  = "us-east1"
secondary_regions = ["us-east1"]
availability_zones = ["us-central1-a", "us-central1-b"]

# ==============================================
# NETWORK CONFIGURATION
# ==============================================
enable_private_google_access = true
firewall_source_ranges       = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]

# ==============================================
# SECURITY CONFIGURATION
# ==============================================
kms_key_rotation_period = "2592000s" # 30 days (more frequent for dev)

# Service accounts - minimal for development
service_accounts = {
  app = {
    account_id   = "solarify-app-dev"
    display_name = "Solarify Development App Service Account"
    roles = [
      "roles/firestore.user",
      "roles/storage.objectViewer",
      "roles/secretmanager.secretAccessor"
    ]
  }
  build = {
    account_id   = "solarify-build-dev"
    display_name = "Solarify Development Build Service Account"
    roles = [
      "roles/cloudbuild.builds.editor",
      "roles/run.developer",
      "roles/storage.admin"
    ]
  }
}

# ==============================================
# DATABASE CONFIGURATION
# ==============================================
firestore_database_type = "(default)"
firestore_location_id   = "us-central"

# Redis configuration - smaller instance for dev
redis_config = {
  tier           = "BASIC"
  memory_size_gb = 1
  version        = "REDIS_6_X"
  auth_enabled   = true
  
  maintenance_window = {
    day          = "SUNDAY"
    start_time   = "03:00"
  }
}

# Storage buckets - development specific
storage_buckets = {
  app_assets = {
    name          = "solarify-app-assets-dev"
    location      = "US"
    storage_class = "STANDARD"
    versioning    = false  # Disable versioning for dev
    cors = [{
      origin          = ["http://localhost:3000", "https://dev.solarify.com"]
      method          = ["GET", "POST", "PUT", "DELETE"]
      response_header = ["*"]
      max_age_seconds = 3600
    }]
  }
  user_uploads = {
    name          = "solarify-user-uploads-dev"
    location      = "US" 
    storage_class = "STANDARD"
    versioning    = false
    lifecycle_rules = [{
      condition = {
        age = 30  # Shorter retention for dev
      }
      action = {
        type          = "Delete"
        storage_class = "STANDARD"
      }
    }]
  }
}

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
application_image     = "gcr.io/solarify-marketplace-dev/solarify-app:latest"
application_port      = 3000
health_check_path     = "/api/health"

# Domain and SSL configuration
domain_name = "dev.solarify.com"
enable_ssl  = true
ssl_certificate_map = {
  "dev.solarify.com" = "dev-solarify-com-cert"
}

# ==============================================
# MONITORING CONFIGURATION
# ==============================================
monitoring_config = {
  enable_uptime_checks   = true
  enable_error_reporting = true
  enable_profiling      = false  # Disable for dev to save costs
  enable_tracing        = false  # Disable for dev
}

# Notification channels - development team only
notification_channels = {
  email = {
    type    = "email"
    labels  = {
      email_address = "dev-alerts@solarify.com"
    }
    enabled = true
  }
  slack = {
    type    = "slack"
    labels  = {
      channel_name = "#dev-alerts"
      url         = "https://hooks.slack.com/services/DEV/SLACK/WEBHOOK"
    }
    enabled = true
  }
}

# Relaxed alert thresholds for development
alert_thresholds = {
  error_rate_threshold       = 0.1   # 10% - more lenient
  latency_threshold_seconds  = 5.0   # Higher threshold
  cpu_utilization_threshold  = 0.9   # 90%
  memory_utilization_threshold = 0.9 # 90%
  storage_utilization_threshold = 0.9 # 90%
  
  # Business metrics - lower expectations for dev
  rfq_creation_rate_min      = 1     # Minimum RFQs per hour
  quote_response_rate_max    = 7200  # Maximum seconds for quote response
  system_uptime_target       = 0.95  # 95% uptime target
}

# Log retention - shorter for development
log_retention_days = 30

# ==============================================
# CI/CD CONFIGURATION
# ==============================================
source_repository_url = "https://github.com/solarify/solarify-marketplace"
branch_pattern       = "^(develop|feature/.*)$"  # Dev and feature branches
artifact_registry_id = "solarify-registry-dev"

build_config = {
  timeout_seconds = "900s"  # 15 minutes - shorter for dev
  machine_type   = "E2_STANDARD_2"  # Smaller machine for dev
  
  substitutions = {
    _DEPLOY_REGION = "us-central1"
    _SERVICE_NAME  = "solarify-app-dev"
    _ENV          = "development"
  }
  
  steps = [
    {
      name = "gcr.io/cloud-builders/docker"
      args = ["build", "-t", "$PROJECT_ID/solarify-app:$COMMIT_SHA", "."]
    },
    {
      name = "gcr.io/cloud-builders/docker"
      args = ["push", "$PROJECT_ID/solarify-app:$COMMIT_SHA"]
    }
  ]
}

# ==============================================
# BACKUP AND DISASTER RECOVERY
# ==============================================
enable_backup               = true
backup_retention_days       = 7   # Shorter retention for dev
enable_cross_region_backup  = false  # Disable for cost savings

backup_schedules = {
  firestore_full        = "0 2 * * 0"    # Weekly instead of daily
  firestore_incremental = "0 2 * * 3"    # Mid-week backup
  auth_backup           = "0 3 * * 0"     # Weekly
  storage_backup        = "0 4 * * 0"     # Weekly
  solar_data_backup     = "0 */12 * * *"  # Every 12 hours
}

# Minimal collections for development
firestore_collections = {
  critical = [
    "users",
    "profiles", 
    "rfqs",
    "quotes",
    "solar_systems"
  ]
  standard = [
    "products"
  ]
  optional = []
}

notification_emails = [
  "dev-team@solarify.com"
]

# ==============================================
# COST MANAGEMENT
# ==============================================
budget_config = {
  amount         = 500.00  # Lower budget for development
  currency_code  = "USD"
  
  thresholds = [
    {
      threshold_percent = 0.7  # 70% - earlier warning
      spend_basis      = "CURRENT_SPEND"
    },
    {
      threshold_percent = 0.9  # 90% - final warning
      spend_basis      = "CURRENT_SPEND" 
    },
    {
      threshold_percent = 1.0  # 100% - forecasted overspend
      spend_basis      = "FORECASTED_SPEND"
    }
  ]
}

cost_optimization = {
  enable_preemptible_instances  = true   # Enable for dev cost savings
  enable_committed_use_discount = false  # Not cost-effective for dev
  enable_sustained_use_discount = true
  storage_cost_optimization     = true
  enable_cloud_run_min_instances = false # Allow scaling to zero
  
  auto_scaling = {
    target_cpu_utilization    = 80  # More aggressive scaling
    target_memory_utilization = 85
    scale_down_delay          = "180s"  # Faster scale down
    scale_up_delay           = "30s"   # Faster scale up
  }
}