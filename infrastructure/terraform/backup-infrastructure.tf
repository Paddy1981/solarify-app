# Solarify Backup and Disaster Recovery Infrastructure
# Comprehensive Terraform configuration for backup systems and cross-region DR

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4.0"
    }
  }
}

# Variables
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment (production, staging, development)"
  type        = string
  default     = "production"
}

variable "primary_region" {
  description = "Primary region for backup infrastructure"
  type        = string
  default     = "us-central1"
}

variable "secondary_region" {
  description = "Secondary region for disaster recovery"
  type        = string
  default     = "us-east1"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 90
}

variable "dr_active" {
  description = "Whether disaster recovery is active"
  type        = bool
  default     = false
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region backup replication"
  type        = bool
  default     = true
}

# Locals for consistent naming and tagging
locals {
  name_prefix = "solarify-${var.environment}"
  
  common_labels = {
    project     = "solarify"
    environment = var.environment
    component   = "backup-dr"
    managed_by  = "terraform"
  }

  backup_buckets = {
    primary = {
      name     = "${local.name_prefix}-backups-primary"
      location = var.primary_region
      class    = "STANDARD"
    }
    secondary = {
      name     = "${local.name_prefix}-backups-secondary"
      location = var.secondary_region
      class    = "STANDARD"
    }
    archive = {
      name     = "${local.name_prefix}-backups-archive"
      location = var.primary_region
      class    = "COLDLINE"
    }
  }
}

# KMS Key Ring for Backup Encryption
resource "google_kms_key_ring" "backup_keyring" {
  name     = "${local.name_prefix}-backup-keys"
  location = "global"
  project  = var.project_id

  labels = local.common_labels
}

# Primary Backup Encryption Key
resource "google_kms_crypto_key" "backup_primary_key" {
  name     = "backup-primary"
  key_ring = google_kms_key_ring.backup_keyring.id

  purpose          = "ENCRYPT_DECRYPT"
  rotation_period  = "7776000s" # 90 days

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  labels = local.common_labels
}

# Secondary Backup Encryption Key  
resource "google_kms_crypto_key" "backup_secondary_key" {
  name     = "backup-secondary"
  key_ring = google_kms_key_ring.backup_keyring.id

  purpose          = "ENCRYPT_DECRYPT"
  rotation_period  = "7776000s" # 90 days

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  labels = local.common_labels
}

# Auth Data Encryption Key
resource "google_kms_crypto_key" "auth_data_key" {
  name     = "auth-data"
  key_ring = google_kms_key_ring.backup_keyring.id

  purpose          = "ENCRYPT_DECRYPT"
  rotation_period  = "2592000s" # 30 days (more frequent for sensitive data)

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  labels = local.common_labels
}

# Primary Backup Storage Bucket
resource "google_storage_bucket" "backup_primary" {
  name          = local.backup_buckets.primary.name
  location      = local.backup_buckets.primary.location
  storage_class = local.backup_buckets.primary.class
  project       = var.project_id

  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = true
  }

  # Versioning for backup integrity
  versioning {
    enabled = true
  }

  # Encryption with customer-managed keys
  encryption {
    default_kms_key_name = google_kms_crypto_key.backup_primary_key.id
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
      age = 60
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  # Public access prevention
  public_access_prevention = "enforced"

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  # Logging
  logging {
    log_bucket = google_storage_bucket.audit_logs.name
  }

  labels = local.common_labels
}

# Secondary Backup Storage Bucket (Cross-region)
resource "google_storage_bucket" "backup_secondary" {
  name          = local.backup_buckets.secondary.name
  location      = local.backup_buckets.secondary.location
  storage_class = local.backup_buckets.secondary.class
  project       = var.project_id

  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = true
  }

  # Versioning for backup integrity
  versioning {
    enabled = true
  }

  # Encryption with customer-managed keys
  encryption {
    default_kms_key_name = google_kms_crypto_key.backup_secondary_key.id
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

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  # Logging
  logging {
    log_bucket = google_storage_bucket.audit_logs.name
  }

  labels = local.common_labels
}

# Archive Storage Bucket (Long-term retention)
resource "google_storage_bucket" "backup_archive" {
  name          = local.backup_buckets.archive.name
  location      = local.backup_buckets.archive.location
  storage_class = local.backup_buckets.archive.class
  project       = var.project_id

  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = true
  }

  # Versioning for backup integrity
  versioning {
    enabled = true
  }

  # Encryption with customer-managed keys
  encryption {
    default_kms_key_name = google_kms_crypto_key.backup_primary_key.id
  }

  # Long-term lifecycle management (7 years retention)
  lifecycle_rule {
    condition {
      age = 2555 # 7 years
    }
    action {
      type = "Delete"
    }
  }

  # Public access prevention
  public_access_prevention = "enforced"

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  labels = local.common_labels
}

# Audit Logs Storage Bucket
resource "google_storage_bucket" "audit_logs" {
  name          = "${local.name_prefix}-audit-logs"
  location      = var.primary_region
  storage_class = "STANDARD"
  project       = var.project_id

  # Versioning
  versioning {
    enabled = true
  }

  # Lifecycle management for audit logs
  lifecycle_rule {
    condition {
      age = 2555 # 7 years retention for compliance
    }
    action {
      type = "Delete"
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

  # Public access prevention
  public_access_prevention = "enforced"

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  labels = local.common_labels
}

# Backup Service Account
resource "google_service_account" "backup_service" {
  account_id   = "${local.name_prefix}-backup-service"
  display_name = "Solarify Backup Service Account"
  description  = "Service account for backup and disaster recovery operations"
  project      = var.project_id
}

# Service Account Key
resource "google_service_account_key" "backup_service_key" {
  service_account_id = google_service_account.backup_service.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# IAM Bindings for Backup Service Account
resource "google_project_iam_member" "backup_firestore_admin" {
  project = var.project_id
  role    = "roles/datastore.owner"
  member  = "serviceAccount:${google_service_account.backup_service.email}"
}

resource "google_project_iam_member" "backup_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.backup_service.email}"
}

resource "google_project_iam_member" "backup_kms_admin" {
  project = var.project_id
  role    = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member  = "serviceAccount:${google_service_account.backup_service.email}"
}

resource "google_project_iam_member" "backup_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.backup_service.email}"
}

resource "google_project_iam_member" "backup_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backup_service.email}"
}

# Cloud Scheduler for Backup Automation
resource "google_cloud_scheduler_job" "firestore_full_backup" {
  name        = "${local.name_prefix}-firestore-full-backup"
  description = "Weekly full Firestore backup"
  schedule    = "0 2 * * 0" # Sunday 2 AM UTC
  time_zone   = "UTC"
  project     = var.project_id
  region      = var.primary_region

  pubsub_target {
    topic_name = google_pubsub_topic.backup_trigger.id
    data = base64encode(jsonencode({
      type        = "firestore_backup"
      backup_type = "full"
      collections = ["users", "profiles", "rfqs", "quotes", "solar_systems", "energy_production"]
    }))
  }
}

resource "google_cloud_scheduler_job" "firestore_incremental_backup" {
  name        = "${local.name_prefix}-firestore-incremental-backup"
  description = "Daily incremental Firestore backup"
  schedule    = "0 2 * * 1-6" # Monday-Saturday 2 AM UTC
  time_zone   = "UTC"
  project     = var.project_id
  region      = var.primary_region

  pubsub_target {
    topic_name = google_pubsub_topic.backup_trigger.id
    data = base64encode(jsonencode({
      type        = "firestore_backup"
      backup_type = "incremental"
      collections = ["users", "profiles", "rfqs", "quotes", "solar_systems", "energy_production"]
    }))
  }
}

resource "google_cloud_scheduler_job" "auth_backup" {
  name        = "${local.name_prefix}-auth-backup"
  description = "Daily authentication data backup"
  schedule    = "0 3 * * *" # Daily 3 AM UTC
  time_zone   = "UTC"
  project     = var.project_id
  region      = var.primary_region

  pubsub_target {
    topic_name = google_pubsub_topic.backup_trigger.id
    data = base64encode(jsonencode({
      type        = "auth_backup"
      backup_type = "full"
    }))
  }
}

resource "google_cloud_scheduler_job" "storage_backup" {
  name        = "${local.name_prefix}-storage-backup"
  description = "Daily storage files backup"
  schedule    = "0 4 * * *" # Daily 4 AM UTC
  time_zone   = "UTC"
  project     = var.project_id
  region      = var.primary_region

  pubsub_target {
    topic_name = google_pubsub_topic.backup_trigger.id
    data = base64encode(jsonencode({
      type        = "storage_backup"
      backup_type = "full"
    }))
  }
}

resource "google_cloud_scheduler_job" "solar_data_backup" {
  name        = "${local.name_prefix}-solar-data-backup"
  description = "Critical solar data backup (every 4 hours)"
  schedule    = "0 */4 * * *" # Every 4 hours
  time_zone   = "UTC"
  project     = var.project_id
  region      = var.primary_region

  pubsub_target {
    topic_name = google_pubsub_topic.backup_trigger.id
    data = base64encode(jsonencode({
      type        = "solar_data_backup"
      backup_type = "full"
      collections = ["solar_systems", "energy_production", "weather_data", "utility_rates"]
    }))
  }
}

# Pub/Sub Topics for Backup Orchestration
resource "google_pubsub_topic" "backup_trigger" {
  name    = "${local.name_prefix}-backup-trigger"
  project = var.project_id

  labels = local.common_labels
}

resource "google_pubsub_topic" "backup_status" {
  name    = "${local.name_prefix}-backup-status"
  project = var.project_id

  labels = local.common_labels
}

resource "google_pubsub_topic" "disaster_recovery" {
  name    = "${local.name_prefix}-disaster-recovery"
  project = var.project_id

  labels = local.common_labels
}

# Pub/Sub Subscriptions
resource "google_pubsub_subscription" "backup_processor" {
  name    = "${local.name_prefix}-backup-processor"
  topic   = google_pubsub_topic.backup_trigger.name
  project = var.project_id

  # Message retention for 7 days
  message_retention_duration = "604800s"

  # Acknowledgment deadline
  ack_deadline_seconds = 300

  # Retry policy
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  # Dead letter policy
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.backup_dead_letter.id
    max_delivery_attempts = 5
  }

  labels = local.common_labels
}

resource "google_pubsub_topic" "backup_dead_letter" {
  name    = "${local.name_prefix}-backup-dead-letter"
  project = var.project_id

  labels = local.common_labels
}

# Cloud Run Service for Backup Processing
resource "google_cloud_run_service" "backup_processor" {
  name     = "${local.name_prefix}-backup-processor"
  location = var.primary_region
  project  = var.project_id

  template {
    metadata {
      labels = local.common_labels
      annotations = {
        "autoscaling.knative.dev/maxScale"        = "10"
        "autoscaling.knative.dev/minScale"        = "1"
        "run.googleapis.com/cpu-throttling"       = "false"
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }

    spec {
      service_account_name = google_service_account.backup_service.email
      
      containers {
        image = "gcr.io/${var.project_id}/solarify-backup-processor:latest"

        # Resource limits
        resources {
          limits = {
            cpu    = "2000m"
            memory = "4Gi"
          }
        }

        # Environment variables
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }

        env {
          name  = "BACKUP_BUCKET_PRIMARY"
          value = google_storage_bucket.backup_primary.name
        }

        env {
          name  = "BACKUP_BUCKET_SECONDARY"
          value = google_storage_bucket.backup_secondary.name
        }

        env {
          name  = "BACKUP_BUCKET_ARCHIVE"
          value = google_storage_bucket.backup_archive.name
        }

        env {
          name  = "KMS_KEY_ID"
          value = google_kms_crypto_key.backup_primary_key.id
        }

        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }

        # Health check
        liveness_probe {
          http_get {
            path = "/health"
            port = 8080
          }
          initial_delay_seconds = 30
          period_seconds        = 10
        }
      }

      # Timeout for long-running backup operations
      timeout_seconds = 3600 # 1 hour
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Cloud Run Service for Disaster Recovery
resource "google_cloud_run_service" "disaster_recovery" {
  name     = "${local.name_prefix}-disaster-recovery"
  location = var.dr_active ? var.secondary_region : var.primary_region
  project  = var.project_id

  template {
    metadata {
      labels = local.common_labels
      annotations = {
        "autoscaling.knative.dev/maxScale"        = "5"
        "autoscaling.knative.dev/minScale"        = "0"
        "run.googleapis.com/cpu-throttling"       = "false"
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }

    spec {
      service_account_name = google_service_account.backup_service.email
      
      containers {
        image = "gcr.io/${var.project_id}/solarify-disaster-recovery:latest"

        # Resource limits
        resources {
          limits = {
            cpu    = "2000m"
            memory = "4Gi"
          }
        }

        # Environment variables
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }

        env {
          name  = "PRIMARY_REGION"
          value = var.primary_region
        }

        env {
          name  = "SECONDARY_REGION"
          value = var.secondary_region
        }

        env {
          name  = "DR_ACTIVE"
          value = tostring(var.dr_active)
        }

        env {
          name  = "BACKUP_BUCKET_PRIMARY"
          value = google_storage_bucket.backup_primary.name
        }

        env {
          name  = "BACKUP_BUCKET_SECONDARY"
          value = google_storage_bucket.backup_secondary.name
        }

        # Health check
        liveness_probe {
          http_get {
            path = "/health"
            port = 8080
          }
          initial_delay_seconds = 30
          period_seconds        = 10
        }
      }

      # Timeout for long-running recovery operations
      timeout_seconds = 14400 # 4 hours
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Cloud Monitoring Alerts
resource "google_monitoring_alert_policy" "backup_failure" {
  display_name = "Backup Failure Alert"
  project      = var.project_id

  conditions {
    display_name = "Backup job failure"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_service.backup_processor.name}\""
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0
      duration        = "300s"

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  # Notification channels
  notification_channels = [
    google_monitoring_notification_channel.email_alert.name,
    google_monitoring_notification_channel.sms_alert.name
  ]

  # Alert policy enabled
  enabled = true

  # Documentation
  documentation {
    content   = "Backup job has failed. Please investigate immediately."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "storage_capacity" {
  display_name = "Backup Storage Capacity Alert"
  project      = var.project_id

  conditions {
    display_name = "Storage usage high"

    condition_threshold {
      filter          = "resource.type=\"gcs_bucket\" AND resource.labels.bucket_name=~\"${local.name_prefix}-backups-.*\""
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0.8 # 80% capacity
      duration        = "1800s" # 30 minutes

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  # Notification channels
  notification_channels = [
    google_monitoring_notification_channel.email_alert.name
  ]

  enabled = true

  documentation {
    content   = "Backup storage usage is above 80% capacity. Consider increasing storage or review retention policies."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "disaster_recovery_activated" {
  display_name = "Disaster Recovery Activation Alert"
  project      = var.project_id

  conditions {
    display_name = "DR system activated"

    condition_threshold {
      filter          = "resource.type=\"pubsub_topic\" AND resource.labels.topic_id=\"${google_pubsub_topic.disaster_recovery.name}\""
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0
      duration        = "60s"

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  # Critical notification channels
  notification_channels = [
    google_monitoring_notification_channel.email_alert.name,
    google_monitoring_notification_channel.sms_alert.name,
    google_monitoring_notification_channel.pagerduty_alert.name
  ]

  enabled = true

  documentation {
    content   = "CRITICAL: Disaster recovery system has been activated. All stakeholders must be notified immediately."
    mime_type = "text/markdown"
  }
}

# Notification Channels
resource "google_monitoring_notification_channel" "email_alert" {
  display_name = "Email Alert Channel"
  type         = "email"
  project      = var.project_id

  labels = {
    email_address = "devops@solarify.com"
  }

  enabled = true
}

resource "google_monitoring_notification_channel" "sms_alert" {
  display_name = "SMS Alert Channel"
  type         = "sms"
  project      = var.project_id

  labels = {
    number = "+1-xxx-xxx-xxxx"
  }

  enabled = true
}

resource "google_monitoring_notification_channel" "pagerduty_alert" {
  display_name = "PagerDuty Alert Channel"
  type         = "pagerduty"
  project      = var.project_id

  labels = {
    service_key = "YOUR_PAGERDUTY_SERVICE_KEY"
  }

  enabled = true
}

# Cross-region Transfer Service (if enabled)
resource "google_storage_transfer_job" "cross_region_backup" {
  count = var.enable_cross_region_replication ? 1 : 0

  description = "Cross-region backup replication"
  project     = var.project_id

  transfer_spec {
    gcs_data_source {
      bucket_name = google_storage_bucket.backup_primary.name
    }

    gcs_data_sink {
      bucket_name = google_storage_bucket.backup_secondary.name
    }

    transfer_options {
      delete_objects_unique_in_sink = false
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
      hours   = 6
      minutes = 0
      seconds = 0
      nanos   = 0
    }

    repeat_interval = "86400s" # Daily
  }

  status = "ENABLED"
}

# DNS configuration for failover (conditional)
resource "google_dns_managed_zone" "solarify_zone" {
  name        = "${local.name_prefix}-dns-zone"
  dns_name    = "solarify.com."
  description = "Solarify DNS zone for disaster recovery failover"
  project     = var.project_id

  labels = local.common_labels
}

resource "google_dns_record_set" "app_record" {
  name         = "app.${google_dns_managed_zone.solarify_zone.dns_name}"
  managed_zone = google_dns_managed_zone.solarify_zone.name
  type         = "A"
  ttl          = var.dr_active ? 60 : 300 # Lower TTL during DR
  project      = var.project_id

  # Route to DR region if active, otherwise primary
  rrdatas = [
    var.dr_active ? "34.74.0.0" : "35.232.0.0" # Replace with actual IPs
  ]
}

# Secret Manager for storing sensitive configuration
resource "google_secret_manager_secret" "backup_config" {
  secret_id = "${local.name_prefix}-backup-config"
  project   = var.project_id

  replication {
    automatic = true
  }

  labels = local.common_labels
}

resource "google_secret_manager_secret_version" "backup_config_version" {
  secret = google_secret_manager_secret.backup_config.id

  secret_data = jsonencode({
    backup_service_account = google_service_account.backup_service.email
    kms_key_id            = google_kms_crypto_key.backup_primary_key.id
    primary_bucket        = google_storage_bucket.backup_primary.name
    secondary_bucket      = google_storage_bucket.backup_secondary.name
    archive_bucket        = google_storage_bucket.backup_archive.name
  })
}

# Outputs
output "backup_service_account_email" {
  description = "Email of the backup service account"
  value       = google_service_account.backup_service.email
}

output "primary_backup_bucket" {
  description = "Name of the primary backup bucket"
  value       = google_storage_bucket.backup_primary.name
}

output "secondary_backup_bucket" {
  description = "Name of the secondary backup bucket"
  value       = google_storage_bucket.backup_secondary.name
}

output "archive_backup_bucket" {
  description = "Name of the archive backup bucket"
  value       = google_storage_bucket.backup_archive.name
}

output "backup_kms_key_id" {
  description = "ID of the primary backup encryption key"
  value       = google_kms_crypto_key.backup_primary_key.id
}

output "backup_processor_url" {
  description = "URL of the backup processor service"
  value       = google_cloud_run_service.backup_processor.status[0].url
}

output "disaster_recovery_url" {
  description = "URL of the disaster recovery service"
  value       = google_cloud_run_service.disaster_recovery.status[0].url
}