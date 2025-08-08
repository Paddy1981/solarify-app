# Solarify Solar Marketplace - Terraform Variables
# Complete variable definitions for comprehensive infrastructure deployment

# ==============================================
# PROJECT CONFIGURATION
# ==============================================

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "Project ID must be 6-30 characters, start with a letter, and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "solarify"
}

variable "terraform_state_bucket" {
  description = "GCS bucket for Terraform state storage"
  type        = string
}

variable "deployment_version" {
  description = "Deployment version for tracking"
  type        = string
  default     = "1.0.0"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "engineering"
}

variable "team" {
  description = "Team responsible for the infrastructure"
  type        = string
  default     = "platform"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "primary_region" {
  description = "Primary GCP region for backup infrastructure"
  type        = string
  default     = "us-central1"
  validation {
    condition = contains([
      "us-central1", "us-east1", "us-east4", "us-west1", "us-west2", "us-west3", "us-west4",
      "europe-west1", "europe-west2", "europe-west3", "europe-west4", "europe-west6",
      "asia-east1", "asia-east2", "asia-northeast1", "asia-northeast2", "asia-south1", "asia-southeast1"
    ], var.primary_region)
    error_message = "Primary region must be a valid GCP region."
  }
}

variable "secondary_region" {
  description = "Secondary GCP region for disaster recovery"
  type        = string
  default     = "us-east1"
  validation {
    condition = contains([
      "us-central1", "us-east1", "us-east4", "us-west1", "us-west2", "us-west3", "us-west4",
      "europe-west1", "europe-west2", "europe-west3", "europe-west4", "europe-west6",
      "asia-east1", "asia-east2", "asia-northeast1", "asia-northeast2", "asia-south1", "asia-southeast1"
    ], var.secondary_region)
    error_message = "Secondary region must be a valid GCP region."
  }
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 90
  validation {
    condition     = var.backup_retention_days >= 7 && var.backup_retention_days <= 2555
    error_message = "Backup retention must be between 7 and 2555 days (7 years)."
  }
}

variable "archive_retention_days" {
  description = "Number of days to retain archive backups"
  type        = number
  default     = 2555 # 7 years
  validation {
    condition     = var.archive_retention_days >= 365 && var.archive_retention_days <= 2555
    error_message = "Archive retention must be between 1 and 7 years."
  }
}

variable "dr_active" {
  description = "Whether disaster recovery is currently active"
  type        = bool
  default     = false
}

variable "enable_cross_region_replication" {
  description = "Enable automatic cross-region backup replication"
  type        = bool
  default     = true
}

variable "enable_backup_encryption" {
  description = "Enable customer-managed encryption for backups"
  type        = bool
  default     = true
}

variable "kms_key_rotation_period" {
  description = "KMS key rotation period in seconds"
  type        = string
  default     = "7776000s" # 90 days
  validation {
    condition     = can(regex("^[0-9]+s$", var.kms_key_rotation_period))
    error_message = "KMS key rotation period must be in seconds format (e.g., '7776000s')."
  }
}

variable "backup_schedules" {
  description = "Cron schedules for different backup types"
  type = object({
    firestore_full        = string
    firestore_incremental = string
    auth_backup           = string
    storage_backup        = string
    solar_data_backup     = string
  })
  default = {
    firestore_full        = "0 2 * * 0"    # Sunday 2 AM
    firestore_incremental = "0 2 * * 1-6"  # Mon-Sat 2 AM
    auth_backup           = "0 3 * * *"     # Daily 3 AM
    storage_backup        = "0 4 * * *"     # Daily 4 AM
    solar_data_backup     = "0 */4 * * *"   # Every 4 hours
  }
}

variable "notification_emails" {
  description = "List of email addresses for backup notifications"
  type        = list(string)
  default     = ["devops@solarify.com", "cto@solarify.com"]
  validation {
    condition = alltrue([
      for email in var.notification_emails : can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", email))
    ])
    error_message = "All notification emails must be valid email addresses."
  }
}

variable "sms_notification_numbers" {
  description = "List of SMS numbers for critical alerts"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for number in var.sms_notification_numbers : can(regex("^\\+[1-9]\\d{1,14}$", number))
    ])
    error_message = "SMS numbers must be in E.164 format (e.g., +1234567890)."
  }
}

variable "pagerduty_service_key" {
  description = "PagerDuty service integration key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
  sensitive   = true
}

variable "backup_service_resources" {
  description = "Resource allocation for backup service"
  type = object({
    cpu_request    = string
    memory_request = string
    cpu_limit      = string
    memory_limit   = string
    max_instances  = number
    min_instances  = number
  })
  default = {
    cpu_request    = "1000m"
    memory_request = "2Gi"
    cpu_limit      = "2000m"
    memory_limit   = "4Gi"
    max_instances  = 10
    min_instances  = 1
  }
}

variable "dr_service_resources" {
  description = "Resource allocation for disaster recovery service"
  type = object({
    cpu_request    = string
    memory_request = string
    cpu_limit      = string
    memory_limit   = string
    max_instances  = number
    min_instances  = number
  })
  default = {
    cpu_request    = "1000m"
    memory_request = "2Gi"
    cpu_limit      = "2000m"
    memory_limit   = "4Gi"
    max_instances  = 5
    min_instances  = 0
  }
}

variable "monitoring_config" {
  description = "Configuration for monitoring and alerting"
  type = object({
    enable_uptime_checks        = bool
    backup_failure_threshold    = number
    storage_capacity_threshold  = number
    rto_threshold_minutes      = number
    rpo_threshold_minutes      = number
  })
  default = {
    enable_uptime_checks        = true
    backup_failure_threshold    = 0
    storage_capacity_threshold  = 0.8
    rto_threshold_minutes      = 240 # 4 hours
    rpo_threshold_minutes      = 60  # 1 hour
  }
}

variable "firestore_collections" {
  description = "Firestore collections to include in backups"
  type = object({
    critical = list(string)
    standard = list(string)
    optional = list(string)
  })
  default = {
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
}

variable "storage_classes" {
  description = "Storage classes for different backup types"
  type = object({
    primary   = string
    secondary = string
    archive   = string
  })
  default = {
    primary   = "STANDARD"
    secondary = "STANDARD"
    archive   = "COLDLINE"
  }
  validation {
    condition = alltrue([
      contains(["STANDARD", "NEARLINE", "COLDLINE", "ARCHIVE"], var.storage_classes.primary),
      contains(["STANDARD", "NEARLINE", "COLDLINE", "ARCHIVE"], var.storage_classes.secondary),
      contains(["STANDARD", "NEARLINE", "COLDLINE", "ARCHIVE"], var.storage_classes.archive)
    ])
    error_message = "Storage classes must be one of: STANDARD, NEARLINE, COLDLINE, ARCHIVE."
  }
}

variable "backup_lifecycle_rules" {
  description = "Lifecycle rules for backup storage"
  type = object({
    nearline_after_days = number
    coldline_after_days = number
    delete_after_days   = number
  })
  default = {
    nearline_after_days = 30
    coldline_after_days = 60
    delete_after_days   = 90
  }
}

variable "compliance_requirements" {
  description = "Compliance requirements configuration"
  type = object({
    enable_audit_logging     = bool
    retention_compliance     = string
    data_residency_regions   = list(string)
    encryption_at_rest       = bool
    encryption_in_transit    = bool
  })
  default = {
    enable_audit_logging     = true
    retention_compliance     = "7_years"
    data_residency_regions   = ["us"]
    encryption_at_rest       = true
    encryption_in_transit    = true
  }
}

variable "disaster_scenarios" {
  description = "Configuration for disaster recovery scenarios"
  type = object({
    enable_auto_failover     = bool
    failover_threshold_minutes = number
    health_check_interval    = string
    recovery_validation      = bool
  })
  default = {
    enable_auto_failover     = true
    failover_threshold_minutes = 15
    health_check_interval    = "5m"
    recovery_validation      = true
  }
}

variable "network_config" {
  description = "Network configuration for backup infrastructure"
  type = object({
    vpc_name               = string
    subnet_name            = string
    enable_private_google_access = bool
    firewall_source_ranges = list(string)
  })
  default = {
    vpc_name               = "solarify-vpc"
    subnet_name            = "solarify-subnet"
    enable_private_google_access = true
    firewall_source_ranges = ["10.0.0.0/8"]
  }
}

variable "cost_optimization" {
  description = "Cost optimization settings"
  type = object({
    enable_preemptible_instances = bool
    enable_committed_use_discount = bool
    storage_cost_optimization     = bool
    backup_compression_enabled    = bool
  })
  default = {
    enable_preemptible_instances = false # Not recommended for backup services
    enable_committed_use_discount = true
    storage_cost_optimization     = true
    backup_compression_enabled    = true
  }
}

variable "testing_config" {
  description = "Configuration for backup testing and validation"
  type = object({
    enable_automated_testing     = bool
    test_schedule               = string
    restore_test_frequency      = string
    validation_test_frequency   = string
  })
  default = {
    enable_automated_testing     = true
    test_schedule               = "0 6 * * 0"     # Weekly on Sunday 6 AM
    restore_test_frequency      = "monthly"
    validation_test_frequency   = "weekly"
  }
}

variable "business_hours" {
  description = "Business hours configuration for maintenance windows"
  type = object({
    timezone     = string
    start_hour   = number
    end_hour     = number
    business_days = list(string)
  })
  default = {
    timezone     = "America/New_York"
    start_hour   = 9
    end_hour     = 17
    business_days = ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
}

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================

variable "application_image" {
  description = "Docker image for the application"
  type        = string
  default     = "gcr.io/solarify/app:latest"
}

variable "application_port" {
  description = "Port the application listens on"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/api/health"
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
}

variable "enable_ssl" {
  description = "Enable SSL/TLS termination"
  type        = bool
  default     = true
}

variable "ssl_certificate_map" {
  description = "Map of domains to SSL certificate names"
  type        = map(string)
  default     = {}
}

# ==============================================
# DATABASE CONFIGURATION
# ==============================================

variable "firestore_database_type" {
  description = "Firestore database type"
  type        = string
  default     = "(default)"
}

variable "firestore_location_id" {
  description = "Firestore location ID"
  type        = string
  default     = "us-central"
}

variable "redis_config" {
  description = "Redis configuration for caching"
  type = object({
    tier           = string
    memory_size_gb = number
    version        = string
    auth_enabled   = bool
    maintenance_window = object({
      day        = string
      start_time = string
    })
  })
  default = {
    tier           = "STANDARD_HA"
    memory_size_gb = 2
    version        = "REDIS_6_X"
    auth_enabled   = true
    maintenance_window = {
      day        = "SUNDAY"
      start_time = "03:00"
    }
  }
}

variable "storage_buckets" {
  description = "Configuration for storage buckets"
  type = map(object({
    name          = string
    location      = string
    storage_class = string
    versioning    = bool
    cors = optional(list(object({
      origin          = list(string)
      method          = list(string)
      response_header = list(string)
      max_age_seconds = number
    })))
    lifecycle_rules = optional(list(object({
      condition = object({
        age = number
      })
      action = object({
        type          = string
        storage_class = string
      })
    })))
  }))
  default = {}
}

# ==============================================
# SECURITY CONFIGURATION
# ==============================================

variable "service_accounts" {
  description = "Service accounts to create"
  type = map(object({
    account_id   = string
    display_name = string
    roles        = list(string)
  }))
  default = {}
}

# ==============================================
# MONITORING CONFIGURATION
# ==============================================

variable "monitoring_config" {
  description = "Monitoring and observability configuration"
  type = object({
    enable_uptime_checks   = bool
    enable_error_reporting = bool
    enable_profiling      = bool
    enable_tracing        = bool
  })
  default = {
    enable_uptime_checks   = true
    enable_error_reporting = true
    enable_profiling      = false
    enable_tracing        = true
  }
}

variable "notification_channels" {
  description = "Notification channels for alerts"
  type = map(object({
    type    = string
    labels  = map(string)
    enabled = bool
  }))
  default = {}
}

variable "alert_thresholds" {
  description = "Alert thresholds for monitoring"
  type = object({
    error_rate_threshold           = number
    latency_threshold_seconds      = number
    cpu_utilization_threshold      = number
    memory_utilization_threshold   = number
    storage_utilization_threshold  = number
    rfq_creation_rate_min         = number
    quote_response_rate_max       = number
    system_uptime_target          = number
  })
  default = {
    error_rate_threshold           = 0.05
    latency_threshold_seconds      = 2.0
    cpu_utilization_threshold      = 0.8
    memory_utilization_threshold   = 0.8
    storage_utilization_threshold  = 0.8
    rfq_creation_rate_min         = 10
    quote_response_rate_max       = 3600
    system_uptime_target          = 0.999
  }
}

variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 90
}

# ==============================================
# CI/CD CONFIGURATION
# ==============================================

variable "source_repository_url" {
  description = "Source repository URL"
  type        = string
  default     = ""
}

variable "branch_pattern" {
  description = "Branch pattern for CI/CD triggers"
  type        = string
  default     = "^(main|develop|release/.*)$"
}

variable "artifact_registry_id" {
  description = "Artifact Registry repository ID"
  type        = string
  default     = "solarify-registry"
}

variable "build_config" {
  description = "Build configuration for CI/CD"
  type = object({
    timeout_seconds = string
    machine_type   = string
    substitutions  = map(string)
    steps         = list(object({
      name = string
      args = list(string)
    }))
  })
  default = {
    timeout_seconds = "1200s"
    machine_type   = "E2_STANDARD_4"
    substitutions  = {}
    steps         = []
  }
}

# ==============================================
# COST MANAGEMENT
# ==============================================

variable "budget_config" {
  description = "Budget configuration for cost management"
  type = object({
    amount        = number
    currency_code = string
    thresholds = list(object({
      threshold_percent = number
      spend_basis      = string
    }))
  })
  default = {
    amount        = 1000.00
    currency_code = "USD"
    thresholds = [
      {
        threshold_percent = 0.8
        spend_basis      = "CURRENT_SPEND"
      }
    ]
  }
}

variable "cost_optimization" {
  description = "Cost optimization settings"
  type = object({
    enable_preemptible_instances  = bool
    enable_committed_use_discount = bool
    enable_sustained_use_discount = bool
    storage_cost_optimization     = bool
    enable_cloud_run_min_instances = bool
    auto_scaling = object({
      target_cpu_utilization    = number
      target_memory_utilization = number
      scale_down_delay          = string
      scale_up_delay           = string
    })
  })
  default = {
    enable_preemptible_instances  = false
    enable_committed_use_discount = true
    enable_sustained_use_discount = true
    storage_cost_optimization     = true
    enable_cloud_run_min_instances = true
    auto_scaling = {
      target_cpu_utilization    = 70
      target_memory_utilization = 80
      scale_down_delay          = "300s"
      scale_up_delay           = "60s"
    }
  }
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "enable_debug_logging" {
  description = "Enable debug logging for troubleshooting"
  type        = bool
  default     = false
}