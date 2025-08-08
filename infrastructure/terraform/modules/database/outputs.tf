# Database Infrastructure Module Outputs

# Firestore outputs
output "firestore_database_id" {
  description = "ID of the Firestore database"
  value       = google_firestore_database.database.id
}

output "firestore_database_name" {
  description = "Name of the Firestore database"
  value       = google_firestore_database.database.name
}

output "firebase_project_id" {
  description = "Firebase project ID"
  value       = google_firebase_project.default.project
}

output "firebase_web_app_id" {
  description = "Firebase web app ID"
  value       = google_firebase_web_app.basic.app_id
}

# Redis outputs
output "redis_instance_id" {
  description = "ID of the Redis instance"
  value       = google_redis_instance.cache.id
}

output "redis_instance_host" {
  description = "Host IP address of the Redis instance"
  value       = google_redis_instance.cache.host
}

output "redis_instance_port" {
  description = "Port of the Redis instance"
  value       = google_redis_instance.cache.port
}

output "redis_auth_string" {
  description = "AUTH string for Redis instance"
  value       = google_redis_instance.cache.auth_string
  sensitive   = true
}

output "redis_connection_string" {
  description = "Connection string for Redis instance"
  value       = "redis://:${google_redis_instance.cache.auth_string}@${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
  sensitive   = true
}

# Storage bucket outputs
output "storage_buckets" {
  description = "Details of created storage buckets"
  value = {
    for key, bucket in google_storage_bucket.buckets : key => {
      name         = bucket.name
      id           = bucket.id
      url          = bucket.url
      location     = bucket.location
      storage_class = bucket.storage_class
      self_link    = bucket.self_link
    }
  }
}

output "backup_bucket_name" {
  description = "Name of the backup bucket"
  value       = var.enable_backup ? google_storage_bucket.backup_bucket[0].name : ""
}

output "backup_bucket_url" {
  description = "URL of the backup bucket"
  value       = var.enable_backup ? google_storage_bucket.backup_bucket[0].url : ""
}

output "cross_region_backup_bucket_name" {
  description = "Name of the cross-region backup bucket"
  value       = var.enable_backup && var.enable_cross_region_backup ? google_storage_bucket.cross_region_backup_bucket[0].name : ""
}

# Backup configuration outputs
output "firestore_backup_schedule_name" {
  description = "Name of the Firestore backup schedule"
  value       = var.enable_backup ? google_firestore_backup_schedule.database_backup[0].name : ""
}

output "backup_export_job_name" {
  description = "Name of the backup export job"
  value       = var.enable_backup ? google_cloud_scheduler_job.firestore_export[0].name : ""
}

output "cross_region_transfer_job_name" {
  description = "Name of the cross-region transfer job"
  value       = var.enable_backup && var.enable_cross_region_backup ? google_storage_transfer_job.cross_region_transfer[0].name : ""
}

# Analytics database outputs
output "analytics_db_instance_name" {
  description = "Name of the analytics database instance"
  value       = var.enable_analytics_db ? google_sql_database_instance.analytics_db[0].name : ""
}

output "analytics_db_connection_name" {
  description = "Connection name of the analytics database instance"
  value       = var.enable_analytics_db ? google_sql_database_instance.analytics_db[0].connection_name : ""
}

output "analytics_db_private_ip" {
  description = "Private IP address of the analytics database instance"
  value       = var.enable_analytics_db ? google_sql_database_instance.analytics_db[0].private_ip_address : ""
}

output "analytics_database_name" {
  description = "Name of the analytics database"
  value       = var.enable_analytics_db ? google_sql_database.analytics[0].name : ""
}

output "analytics_user_name" {
  description = "Name of the analytics database user"
  value       = var.enable_analytics_db ? google_sql_user.analytics_user[0].name : ""
}

# BigQuery outputs
output "bigquery_dataset_id" {
  description = "ID of the BigQuery analytics dataset"
  value       = var.enable_bigquery ? google_bigquery_dataset.analytics[0].dataset_id : ""
}

output "bigquery_dataset_location" {
  description = "Location of the BigQuery analytics dataset"
  value       = var.enable_bigquery ? google_bigquery_dataset.analytics[0].location : ""
}

output "bigquery_data_transfer_config_name" {
  description = "Name of the BigQuery data transfer configuration"
  value       = var.enable_bigquery && var.enable_firestore_bigquery_sync ? google_bigquery_data_transfer_config.firestore_export[0].display_name : ""
}

# Database connection information
output "database_connections" {
  description = "Database connection information summary"
  value = {
    firestore = {
      project_id    = var.project_id
      database_id   = google_firestore_database.database.name
      location      = var.firestore_location_id
    }
    redis = {
      host          = google_redis_instance.cache.host
      port          = google_redis_instance.cache.port
      auth_enabled  = var.redis_config.auth_enabled
      connection_name = google_redis_instance.cache.id
    }
    analytics_db = var.enable_analytics_db ? {
      instance_name    = google_sql_database_instance.analytics_db[0].name
      connection_name  = google_sql_database_instance.analytics_db[0].connection_name
      database_name    = google_sql_database.analytics[0].name
      user_name        = google_sql_user.analytics_user[0].name
    } : {}
    bigquery = var.enable_bigquery ? {
      dataset_id = google_bigquery_dataset.analytics[0].dataset_id
      location   = google_bigquery_dataset.analytics[0].location
      project_id = var.project_id
    } : {}
  }
}

# Backup configuration summary
output "backup_configuration" {
  description = "Backup configuration summary"
  value = {
    enabled                = var.enable_backup
    retention_days        = var.backup_retention_days
    cross_region_enabled  = var.enable_cross_region_backup
    primary_bucket        = var.enable_backup ? google_storage_bucket.backup_bucket[0].name : ""
    secondary_bucket      = var.enable_backup && var.enable_cross_region_backup ? google_storage_bucket.cross_region_backup_bucket[0].name : ""
    backup_schedule       = var.enable_backup ? google_firestore_backup_schedule.database_backup[0].name : ""
    export_schedule       = var.enable_backup ? google_cloud_scheduler_job.firestore_export[0].schedule : ""
    collections_included  = var.backup_collections
  }
}

# Storage configuration summary
output "storage_configuration" {
  description = "Storage configuration summary"
  value = {
    buckets_count     = length(google_storage_bucket.buckets)
    bucket_names      = [for bucket in google_storage_bucket.buckets : bucket.name]
    total_buckets     = length(google_storage_bucket.buckets) + (var.enable_backup ? 1 : 0) + (var.enable_backup && var.enable_cross_region_backup ? 1 : 0)
    encryption_enabled = var.encryption_key_id != ""
    lifecycle_enabled  = true
  }
}

# Performance and monitoring endpoints
output "monitoring_endpoints" {
  description = "Database monitoring endpoints"
  value = {
    firestore_metrics    = "https://console.cloud.google.com/firestore/stats?project=${var.project_id}"
    redis_metrics        = "https://console.cloud.google.com/memorystore/redis/instances?project=${var.project_id}"
    storage_metrics      = "https://console.cloud.google.com/storage/browser?project=${var.project_id}"
    analytics_db_metrics = var.enable_analytics_db ? "https://console.cloud.google.com/sql/instances?project=${var.project_id}" : ""
    bigquery_metrics     = var.enable_bigquery ? "https://console.cloud.google.com/bigquery?project=${var.project_id}" : ""
  }
}