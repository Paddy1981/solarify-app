# Database Infrastructure Module - Firestore, Redis, Storage
# Provides data storage and caching infrastructure for Solarify

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

# Local variables
locals {
  storage_buckets_config = {
    for key, config in var.storage_buckets : key => merge(config, {
      full_name = "${config.name}-${var.environment}"
    })
  }
}

# Firestore Database (using Firebase project)
resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = var.firestore_database_type
  location_id = var.firestore_location_id
  type        = "FIRESTORE_NATIVE"

  # Concurrency control
  concurrency_mode = "OPTIMISTIC"
  
  # Point-in-time recovery
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_ENABLED"
  
  # Delete protection for production
  delete_protection_state = var.environment == "production" ? "DELETE_PROTECTION_ENABLED" : "DELETE_PROTECTION_DISABLED"
  
  # Deletion policy
  deletion_policy = "ABANDON"  # Don't delete the database when destroying Terraform

  labels = var.labels
}

# Firebase project configuration (if not already configured)
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
  
  # Wait for services to be enabled
  depends_on = [
    google_firestore_database.database
  ]
}

# Firebase app configuration
resource "google_firebase_web_app" "basic" {
  provider     = google-beta
  project      = var.project_id
  display_name = "Solarify Web App"
  
  # Deletion policy
  deletion_policy = "ABANDON"
  
  depends_on = [google_firebase_project.default]
}

# Redis instance for caching
resource "google_redis_instance" "cache" {
  name           = "${var.environment_prefix}-redis-cache"
  tier           = var.redis_config.tier
  memory_size_gb = var.redis_config.memory_size_gb
  region         = var.primary_region
  
  # Location and network configuration
  location_id             = "${var.primary_region}-a"
  alternative_location_id = "${var.primary_region}-b"
  
  # Redis configuration
  redis_version     = var.redis_config.version
  display_name     = "Solarify Redis Cache - ${var.environment}"
  
  # Network configuration
  authorized_network = var.vpc_id
  connect_mode      = "PRIVATE_SERVICE_ACCESS"
  
  # Authentication
  auth_enabled = var.redis_config.auth_enabled
  
  # Maintenance window
  maintenance_policy {
    weekly_maintenance_window {
      day = var.redis_config.maintenance_window.day
      start_time {
        hours   = tonumber(split(":", var.redis_config.maintenance_window.start_time)[0])
        minutes = tonumber(split(":", var.redis_config.maintenance_window.start_time)[1])
      }
    }
  }
  
  # Configuration overrides for performance
  redis_configs = {
    maxmemory-policy = "allkeys-lru"
    notify-keyspace-events = "Ex"
    timeout = "300"
  }

  labels = var.labels
}

# Storage buckets
resource "google_storage_bucket" "buckets" {
  for_each = local.storage_buckets_config

  name          = each.value.full_name
  location      = each.value.location
  storage_class = each.value.storage_class
  project       = var.project_id

  # Versioning
  versioning {
    enabled = each.value.versioning
  }

  # Encryption
  encryption {
    default_kms_key_name = var.encryption_key_id
  }

  # Public access prevention
  public_access_prevention = "enforced"

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  # CORS configuration (if specified)
  dynamic "cors" {
    for_each = each.value.cors != null ? each.value.cors : []
    content {
      origin          = cors.value.origin
      method          = cors.value.method
      response_header = cors.value.response_header
      max_age_seconds = cors.value.max_age_seconds
    }
  }

  # Lifecycle rules (if specified)
  dynamic "lifecycle_rule" {
    for_each = each.value.lifecycle_rules != null ? each.value.lifecycle_rules : []
    content {
      condition {
        age = lifecycle_rule.value.condition.age
      }
      action {
        type          = lifecycle_rule.value.action.type
        storage_class = lifecycle_rule.value.action.storage_class
      }
    }
  }

  # Default lifecycle rule for cost optimization
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  labels = var.labels
}

# Backup storage bucket
resource "google_storage_bucket" "backup_bucket" {
  count = var.enable_backup ? 1 : 0

  name          = "${var.environment_prefix}-database-backups"
  location      = var.primary_region
  storage_class = "STANDARD"
  project       = var.project_id

  # Versioning for backup integrity
  versioning {
    enabled = true
  }

  # Encryption
  encryption {
    default_kms_key_name = var.encryption_key_id
  }

  # Lifecycle management for backups
  lifecycle_rule {
    condition {
      age = var.backup_retention_days
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  # Public access prevention
  public_access_prevention = "enforced"
  uniform_bucket_level_access = true

  labels = var.labels
}

# Cross-region backup bucket (if enabled)
resource "google_storage_bucket" "cross_region_backup_bucket" {
  count = var.enable_backup && var.enable_cross_region_backup ? 1 : 0

  name          = "${var.environment_prefix}-database-backups-dr"
  location      = var.secondary_region
  storage_class = "STANDARD"
  project       = var.project_id

  # Versioning for backup integrity
  versioning {
    enabled = true
  }

  # Encryption
  encryption {
    default_kms_key_name = var.encryption_key_id
  }

  # Lifecycle management
  lifecycle_rule {
    condition {
      age = var.backup_retention_days
    }
    action {
      type = "Delete"
    }
  }

  # Public access prevention
  public_access_prevention = "enforced"
  uniform_bucket_level_access = true

  labels = var.labels
}

# Firestore backup configuration
resource "google_firestore_backup_schedule" "database_backup" {
  count = var.enable_backup ? 1 : 0

  project  = var.project_id
  database = google_firestore_database.database.name

  # Daily backups at 2 AM
  retention = "${var.backup_retention_days * 24}h"
  
  daily_recurrence {}
}

# Cloud Scheduler job for custom backup operations
resource "google_cloud_scheduler_job" "firestore_export" {
  count = var.enable_backup ? 1 : 0

  name         = "${var.environment_prefix}-firestore-export"
  description  = "Export Firestore data for backup"
  schedule     = "0 3 * * *"  # Daily at 3 AM
  time_zone    = "UTC"
  region       = var.primary_region

  http_target {
    uri         = "https://firestore.googleapis.com/v1/projects/${var.project_id}/databases/(default):exportDocuments"
    http_method = "POST"
    
    headers = {
      "Content-Type" = "application/json"
    }

    body = base64encode(jsonencode({
      outputUriPrefix = "gs://${google_storage_bucket.backup_bucket[0].name}/firestore-exports/"
      collectionIds   = var.backup_collections
    }))

    oauth_token {
      service_account_email = var.backup_service_account_email
      scope                = "https://www.googleapis.com/auth/datastore"
    }
  }

  retry_config {
    retry_count = 3
  }
}

# Transfer job for cross-region replication (if enabled)
resource "google_storage_transfer_job" "cross_region_transfer" {
  count = var.enable_backup && var.enable_cross_region_backup ? 1 : 0

  description = "Cross-region backup replication"
  project     = var.project_id

  transfer_spec {
    gcs_data_source {
      bucket_name = google_storage_bucket.backup_bucket[0].name
    }

    gcs_data_sink {
      bucket_name = google_storage_bucket.cross_region_backup_bucket[0].name
    }

    transfer_options {
      delete_objects_unique_in_sink               = false
      overwrite_objects_already_existing_in_sink = true
    }
  }

  schedule {
    schedule_start_date {
      year  = 2024
      month = 1
      day   = 1
    }

    start_time_of_day {
      hours   = 4
      minutes = 0
      seconds = 0
      nanos   = 0
    }

    repeat_interval = "86400s" # Daily
  }

  status = "ENABLED"
}

# Cloud SQL PostgreSQL instance (for analytics workloads if needed)
resource "google_sql_database_instance" "analytics_db" {
  count = var.enable_analytics_db ? 1 : 0

  name             = "${var.environment_prefix}-analytics-db"
  database_version = "POSTGRES_15"
  region          = var.primary_region
  project         = var.project_id

  # Deletion protection
  deletion_protection = var.environment == "production" ? true : false

  settings {
    tier              = var.analytics_db_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = var.analytics_db_disk_size
    disk_autoresize   = true

    # Backup configuration
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      location                       = var.primary_region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    # Database flags for performance
    database_flags {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements"
    }

    database_flags {
      name  = "log_statement"
      value = "all"
    }

    # IP configuration
    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = var.vpc_id
      enable_private_path_for_google_cloud_services = true
      require_ssl                                   = true
    }

    # Maintenance window
    maintenance_window {
      day         = 7  # Sunday
      hour        = 3  # 3 AM
      update_track = "stable"
    }
  }

  labels = var.labels
}

# Analytics database
resource "google_sql_database" "analytics" {
  count = var.enable_analytics_db ? 1 : 0

  name     = "solarify_analytics"
  instance = google_sql_database_instance.analytics_db[0].name
  project  = var.project_id
}

# Analytics database user
resource "google_sql_user" "analytics_user" {
  count = var.enable_analytics_db ? 1 : 0

  name     = "analytics_user"
  instance = google_sql_database_instance.analytics_db[0].name
  password = var.analytics_db_password
  project  = var.project_id
}

# BigQuery dataset for analytics
resource "google_bigquery_dataset" "analytics" {
  count = var.enable_bigquery ? 1 : 0

  dataset_id    = "${replace(var.environment_prefix, "-", "_")}_analytics"
  friendly_name = "Solarify Analytics Dataset - ${var.environment}"
  description   = "Analytics dataset for Solarify application"
  location      = var.bigquery_location
  project       = var.project_id

  # Access control
  access {
    role          = "OWNER"
    user_by_email = var.analytics_admin_email
  }

  access {
    role   = "READER"
    domain = var.organization_domain
  }

  # Default table expiration (90 days)
  default_table_expiration_ms = 7776000000  # 90 days in milliseconds

  labels = var.labels
}

# BigQuery scheduled query for data pipeline (if enabled)
resource "google_bigquery_data_transfer_config" "firestore_export" {
  count = var.enable_bigquery && var.enable_firestore_bigquery_sync ? 1 : 0

  display_name   = "${var.environment_prefix}-firestore-export"
  location       = var.bigquery_location
  data_source_id = "scheduled_query"
  
  destination_dataset_id = google_bigquery_dataset.analytics[0].dataset_id

  schedule = "every 24 hours"
  
  params = {
    query = templatefile("${path.module}/queries/firestore_export.sql", {
      project_id = var.project_id
      dataset_id = google_bigquery_dataset.analytics[0].dataset_id
    })
  }
}