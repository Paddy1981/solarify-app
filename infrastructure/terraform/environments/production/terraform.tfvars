# Solarify Production Environment Configuration

# ==============================================
# PROJECT CONFIGURATION
# ==============================================
project_id               = "solarify-marketplace-prod"
project_name            = "solarify"
environment             = "production"
deployment_version      = "1.0.0"
cost_center            = "engineering"
team                   = "platform"

# ==============================================
# TERRAFORM STATE CONFIGURATION
# ==============================================
terraform_state_bucket = "solarify-terraform-state-prod"

# ==============================================
# REGIONAL CONFIGURATION
# ==============================================
primary_region    = "us-central1"
secondary_region  = "us-east1"
secondary_regions = ["us-east1", "us-west1"]
availability_zones = ["us-central1-a", "us-central1-b", "us-central1-c"]

# ==============================================
# NETWORK CONFIGURATION
# ==============================================
enable_private_google_access = true
firewall_source_ranges       = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]

# ==============================================
# SECURITY CONFIGURATION
# ==============================================
kms_key_rotation_period = "7776000s" # 90 days - standard rotation

# Service accounts - comprehensive for production
service_accounts = {
  app = {
    account_id   = "solarify-app-prod"
    display_name = "Solarify Production App Service Account"
    roles = [
      "roles/firestore.user",
      "roles/storage.objectViewer",
      "roles/secretmanager.secretAccessor",
      "roles/monitoring.metricWriter",
      "roles/logging.logWriter",
      "roles/cloudtrace.agent"
    ]
  }
  build = {
    account_id   = "solarify-build-prod"
    display_name = "Solarify Production Build Service Account"
    roles = [
      "roles/cloudbuild.builds.editor",
      "roles/run.developer",
      "roles/storage.admin",
      "roles/artifactregistry.writer"
    ]
  }
  monitoring = {
    account_id   = "solarify-monitoring-prod"
    display_name = "Solarify Production Monitoring Service Account"
    roles = [
      "roles/monitoring.editor",
      "roles/logging.logWriter",
      "roles/errorreporting.writer"
    ]
  }
  backup = {
    account_id   = "solarify-backup-prod"
    display_name = "Solarify Production Backup Service Account"
    roles = [
      "roles/datastore.owner",
      "roles/storage.admin",
      "roles/cloudkms.cryptoKeyEncrypterDecrypter"
    ]
  }
}

# ==============================================
# DATABASE CONFIGURATION
# ==============================================
firestore_database_type = "(default)"
firestore_location_id   = "us-central"

# Redis configuration - high availability for production
redis_config = {
  tier           = "STANDARD_HA"
  memory_size_gb = 4
  version        = "REDIS_6_X"
  auth_enabled   = true
  
  maintenance_window = {
    day          = "SUNDAY"
    start_time   = "03:00"
  }
}

# Storage buckets - production configuration
storage_buckets = {
  app_assets = {
    name          = "solarify-app-assets-prod"
    location      = "US"
    storage_class = "STANDARD"
    versioning    = true
    cors = [{
      origin          = ["https://solarify.com", "https://app.solarify.com"]
      method          = ["GET", "POST", "PUT", "DELETE"]
      response_header = ["*"]
      max_age_seconds = 3600
    }]
  }
  user_uploads = {
    name          = "solarify-user-uploads-prod"
    location      = "US"
    storage_class = "STANDARD"
    versioning    = true
    lifecycle_rules = [{
      condition = {
        age = 90
      }
      action = {
        type          = "SetStorageClass"
        storage_class = "NEARLINE"
      }
    }]
  }
  static_content = {
    name          = "solarify-static-content-prod"
    location      = "US"
    storage_class = "STANDARD"
    versioning    = true
    cors = [{
      origin          = ["https://solarify.com"]
      method          = ["GET"]
      response_header = ["Content-Type", "Cache-Control"]
      max_age_seconds = 86400  # 24 hours
    }]
  }
}

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
application_image     = "gcr.io/solarify-marketplace-prod/solarify-app:latest"
application_port      = 3000
health_check_path     = "/api/health"

# Domain and SSL configuration
domain_name = "solarify.com"
enable_ssl  = true
ssl_certificate_map = {
  "solarify.com"     = "solarify-com-cert"
  "app.solarify.com" = "app-solarify-com-cert"
  "api.solarify.com" = "api-solarify-com-cert"
}

# ==============================================
# MONITORING CONFIGURATION
# ==============================================
monitoring_config = {
  enable_uptime_checks   = true
  enable_error_reporting = true
  enable_profiling      = true   # Enable for production optimization
  enable_tracing        = true   # Enable for production debugging
}

# Notification channels - comprehensive alerting
notification_channels = {
  email = {
    type    = "email"
    labels  = {
      email_address = "alerts@solarify.com"
    }
    enabled = true
  }
  slack = {
    type    = "slack"
    labels  = {
      channel_name = "#production-alerts"
      url         = "https://hooks.slack.com/services/YOUR/PROD/WEBHOOK"
    }
    enabled = true
  }
  pagerduty = {
    type    = "pagerduty"
    labels  = {
      service_key = "YOUR_PAGERDUTY_PRODUCTION_SERVICE_KEY"
    }
    enabled = true
  }
  sms = {
    type    = "sms"
    labels  = {
      number = "+1-xxx-xxx-xxxx"
    }
    enabled = true
  }
}

# Strict alert thresholds for production
alert_thresholds = {
  error_rate_threshold       = 0.01  # 1% - very strict
  latency_threshold_seconds  = 2.0   # 2 seconds
  cpu_utilization_threshold  = 0.7   # 70%
  memory_utilization_threshold = 0.8 # 80%
  storage_utilization_threshold = 0.8 # 80%
  
  # Business metrics - production expectations
  rfq_creation_rate_min      = 10    # Minimum 10 RFQs per hour
  quote_response_rate_max    = 3600  # Maximum 1 hour for quote response
  system_uptime_target       = 0.999 # 99.9% uptime target
}

# Log retention - compliance requirements
log_retention_days = 365  # 1 year for production

# ==============================================
# CI/CD CONFIGURATION
# ==============================================
source_repository_url = "https://github.com/solarify/solarify-marketplace"
branch_pattern       = "^main$"  # Only main branch for production
artifact_registry_id = "solarify-registry-prod"

build_config = {
  timeout_seconds = "1800s"  # 30 minutes
  machine_type   = "E2_STANDARD_4"  # Robust build machine
  
  substitutions = {
    _DEPLOY_REGION = "us-central1"
    _SERVICE_NAME  = "solarify-app-prod"
    _ENV          = "production"
  }
  
  steps = [
    {
      name = "gcr.io/cloud-builders/docker"
      args = ["build", "-t", "$PROJECT_ID/solarify-app:$COMMIT_SHA", "."]
    },
    {
      name = "gcr.io/cloud-builders/docker"
      args = ["push", "$PROJECT_ID/solarify-app:$COMMIT_SHA"]
    },
    {
      name = "gcr.io/cloud-builders/gcloud"
      args = [
        "run", "deploy", "solarify-app-prod",
        "--image", "$PROJECT_ID/solarify-app:$COMMIT_SHA",
        "--region", "us-central1",
        "--platform", "managed"
      ]
    }
  ]
}

# ==============================================
# BACKUP AND DISASTER RECOVERY
# ==============================================
enable_backup               = true
backup_retention_days       = 365  # 1 year retention
enable_cross_region_backup  = true # Essential for production

backup_schedules = {
  firestore_full        = "0 2 * * 0"    # Weekly full backup
  firestore_incremental = "0 2 * * 1-6"  # Daily incremental
  auth_backup           = "0 3 * * *"     # Daily auth backup
  storage_backup        = "0 4 * * *"     # Daily storage backup
  solar_data_backup     = "0 */4 * * *"   # Every 4 hours - critical data
}

# Comprehensive collections backup
firestore_collections = {
  critical = [
    "users",
    "profiles",
    "rfqs", 
    "quotes",
    "solar_systems",
    "energy_production",
    "projects",
    "orders"
  ]
  standard = [
    "products",
    "weather_data",
    "utility_rates",
    "reviews",
    "notifications"
  ]
  optional = [
    "analytics",
    "user_activity",
    "portfolios",
    "audit_logs"
  ]
}

notification_emails = [
  "devops@solarify.com",
  "cto@solarify.com",
  "engineering-lead@solarify.com",
  "sre-team@solarify.com"
]

# ==============================================
# COST MANAGEMENT
# ==============================================
budget_config = {
  amount         = 10000.00  # Higher budget for production
  currency_code  = "USD"
  
  thresholds = [
    {
      threshold_percent = 0.5  # 50%
      spend_basis      = "CURRENT_SPEND"
    },
    {
      threshold_percent = 0.75 # 75%
      spend_basis      = "CURRENT_SPEND"
    },
    {
      threshold_percent = 0.9  # 90%
      spend_basis      = "CURRENT_SPEND"
    },
    {
      threshold_percent = 1.0  # 100% - forecasted
      spend_basis      = "FORECASTED_SPEND"
    },
    {
      threshold_percent = 1.2  # 120% - over budget
      spend_basis      = "FORECASTED_SPEND"
    }
  ]
}

cost_optimization = {
  enable_preemptible_instances  = false  # Not recommended for production
  enable_committed_use_discount = true   # Cost-effective for stable workloads
  enable_sustained_use_discount = true
  storage_cost_optimization     = true
  enable_cloud_run_min_instances = true  # Maintain minimum for availability
  
  auto_scaling = {
    target_cpu_utilization    = 70  # Conservative for production
    target_memory_utilization = 75
    scale_down_delay          = "600s"  # Slower scale down for stability
    scale_up_delay           = "60s"   # Fast scale up for demand
  }
}

# ==============================================
# ADDITIONAL PRODUCTION CONFIGURATIONS
# ==============================================

# Enable additional security features
enable_binary_authorization = true
enable_vpc_service_controls = true
enable_security_center     = true

# Performance and reliability
enable_cdn = true
enable_health_checks = true
enable_load_balancing = true

# Compliance and audit
enable_audit_logging = true
enable_access_transparency = true
enable_data_loss_prevention = true

# Disaster recovery
enable_multi_region_deployment = true
enable_automated_failover = true
rto_target_minutes = 15  # Recovery Time Objective
rpo_target_minutes = 5   # Recovery Point Objective