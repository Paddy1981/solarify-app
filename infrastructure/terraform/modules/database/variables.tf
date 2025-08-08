# Database Infrastructure Module Variables

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
}

variable "environment_prefix" {
  description = "Environment prefix for resource naming"
  type        = string
}

variable "primary_region" {
  description = "Primary region for database resources"
  type        = string
}

variable "secondary_region" {
  description = "Secondary region for cross-region backups"
  type        = string
  default     = ""
}

variable "vpc_id" {
  description = "ID of the VPC network"
  type        = string
}

# Firestore configuration
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

# Redis configuration
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
}

# Storage buckets configuration
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

# Backup configuration
variable "enable_backup" {
  description = "Enable database backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 90
}

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup replication"
  type        = bool
  default     = true
}

variable "backup_collections" {
  description = "Firestore collections to include in backups"
  type        = list(string)
  default = [
    "users",
    "profiles",
    "rfqs",
    "quotes",
    "solar_systems",
    "energy_production",
    "products",
    "projects"
  ]
}

variable "backup_service_account_email" {
  description = "Service account email for backup operations"
  type        = string
  default     = ""
}

# Analytics database configuration
variable "enable_analytics_db" {
  description = "Enable Cloud SQL PostgreSQL for analytics"
  type        = bool
  default     = false
}

variable "analytics_db_tier" {
  description = "Cloud SQL instance tier for analytics"
  type        = string
  default     = "db-g1-small"
}

variable "analytics_db_disk_size" {
  description = "Disk size for analytics database in GB"
  type        = number
  default     = 100
}

variable "analytics_db_password" {
  description = "Password for analytics database user"
  type        = string
  default     = ""
  sensitive   = true
}

# BigQuery configuration
variable "enable_bigquery" {
  description = "Enable BigQuery for analytics"
  type        = bool
  default     = true
}

variable "bigquery_location" {
  description = "BigQuery dataset location"
  type        = string
  default     = "US"
}

variable "enable_firestore_bigquery_sync" {
  description = "Enable automatic Firestore to BigQuery sync"
  type        = bool
  default     = false
}

variable "analytics_admin_email" {
  description = "Email address for BigQuery dataset admin"
  type        = string
  default     = ""
}

variable "organization_domain" {
  description = "Organization domain for BigQuery access"
  type        = string
  default     = ""
}

# Encryption
variable "encryption_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}