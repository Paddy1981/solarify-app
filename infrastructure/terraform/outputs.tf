# Terraform Outputs for Solarify Backup and Disaster Recovery
# Comprehensive output definitions for infrastructure components

# Service Account Information
output "backup_service_account" {
  description = "Backup service account details"
  value = {
    email      = google_service_account.backup_service.email
    unique_id  = google_service_account.backup_service.unique_id
    name       = google_service_account.backup_service.name
    key_id     = google_service_account_key.backup_service_key.id
  }
}

# Storage Bucket Information
output "backup_storage" {
  description = "Backup storage bucket details"
  value = {
    primary = {
      name         = google_storage_bucket.backup_primary.name
      url          = google_storage_bucket.backup_primary.url
      location     = google_storage_bucket.backup_primary.location
      storage_class = google_storage_bucket.backup_primary.storage_class
    }
    secondary = {
      name         = google_storage_bucket.backup_secondary.name
      url          = google_storage_bucket.backup_secondary.url
      location     = google_storage_bucket.backup_secondary.location
      storage_class = google_storage_bucket.backup_secondary.storage_class
    }
    archive = {
      name         = google_storage_bucket.backup_archive.name
      url          = google_storage_bucket.backup_archive.url
      location     = google_storage_bucket.backup_archive.location
      storage_class = google_storage_bucket.backup_archive.storage_class
    }
    audit_logs = {
      name         = google_storage_bucket.audit_logs.name
      url          = google_storage_bucket.audit_logs.url
      location     = google_storage_bucket.audit_logs.location
    }
  }
}

# Encryption Key Information
output "encryption_keys" {
  description = "Encryption key details"
  value = {
    key_ring_id = google_kms_key_ring.backup_keyring.id
    primary_key = {
      id               = google_kms_crypto_key.backup_primary_key.id
      name             = google_kms_crypto_key.backup_primary_key.name
      rotation_period  = google_kms_crypto_key.backup_primary_key.rotation_period
    }
    secondary_key = {
      id               = google_kms_crypto_key.backup_secondary_key.id
      name             = google_kms_crypto_key.backup_secondary_key.name
      rotation_period  = google_kms_crypto_key.backup_secondary_key.rotation_period
    }
    auth_data_key = {
      id               = google_kms_crypto_key.auth_data_key.id
      name             = google_kms_crypto_key.auth_data_key.name
      rotation_period  = google_kms_crypto_key.auth_data_key.rotation_period
    }
  }
}

# Cloud Run Services
output "cloud_run_services" {
  description = "Cloud Run service details"
  value = {
    backup_processor = {
      name     = google_cloud_run_service.backup_processor.name
      url      = google_cloud_run_service.backup_processor.status[0].url
      location = google_cloud_run_service.backup_processor.location
    }
    disaster_recovery = {
      name     = google_cloud_run_service.disaster_recovery.name
      url      = google_cloud_run_service.disaster_recovery.status[0].url
      location = google_cloud_run_service.disaster_recovery.location
    }
  }
}

# Pub/Sub Topics and Subscriptions
output "pubsub_resources" {
  description = "Pub/Sub resources for backup orchestration"
  value = {
    topics = {
      backup_trigger     = google_pubsub_topic.backup_trigger.name
      backup_status      = google_pubsub_topic.backup_status.name
      disaster_recovery  = google_pubsub_topic.disaster_recovery.name
      dead_letter       = google_pubsub_topic.backup_dead_letter.name
    }
    subscriptions = {
      backup_processor = google_pubsub_subscription.backup_processor.name
    }
  }
}

# Scheduled Jobs
output "backup_schedules" {
  description = "Backup schedule configurations"
  value = {
    firestore_full = {
      name     = google_cloud_scheduler_job.firestore_full_backup.name
      schedule = google_cloud_scheduler_job.firestore_full_backup.schedule
    }
    firestore_incremental = {
      name     = google_cloud_scheduler_job.firestore_incremental_backup.name
      schedule = google_cloud_scheduler_job.firestore_incremental_backup.schedule
    }
    auth_backup = {
      name     = google_cloud_scheduler_job.auth_backup.name
      schedule = google_cloud_scheduler_job.auth_backup.schedule
    }
    storage_backup = {
      name     = google_cloud_scheduler_job.storage_backup.name
      schedule = google_cloud_scheduler_job.storage_backup.schedule
    }
    solar_data_backup = {
      name     = google_cloud_scheduler_job.solar_data_backup.name
      schedule = google_cloud_scheduler_job.solar_data_backup.schedule
    }
  }
}

# Monitoring and Alerting
output "monitoring_resources" {
  description = "Monitoring and alerting resources"
  value = {
    alert_policies = {
      backup_failure = {
        name         = google_monitoring_alert_policy.backup_failure.display_name
        enabled      = google_monitoring_alert_policy.backup_failure.enabled
      }
      storage_capacity = {
        name         = google_monitoring_alert_policy.storage_capacity.display_name
        enabled      = google_monitoring_alert_policy.storage_capacity.enabled
      }
      disaster_recovery = {
        name         = google_monitoring_alert_policy.disaster_recovery_activated.display_name
        enabled      = google_monitoring_alert_policy.disaster_recovery_activated.enabled
      }
    }
    notification_channels = {
      email     = google_monitoring_notification_channel.email_alert.name
      sms       = google_monitoring_notification_channel.sms_alert.name
      pagerduty = google_monitoring_notification_channel.pagerduty_alert.name
    }
  }
}

# DNS Configuration
output "dns_configuration" {
  description = "DNS configuration for failover"
  value = {
    managed_zone = {
      name     = google_dns_managed_zone.solarify_zone.name
      dns_name = google_dns_managed_zone.solarify_zone.dns_name
    }
    app_record = {
      name    = google_dns_record_set.app_record.name
      type    = google_dns_record_set.app_record.type
      ttl     = google_dns_record_set.app_record.ttl
      rrdatas = google_dns_record_set.app_record.rrdatas
    }
  }
}

# Transfer Job (if enabled)
output "transfer_job" {
  description = "Cross-region transfer job details"
  value = var.enable_cross_region_replication ? {
    name        = google_storage_transfer_job.cross_region_backup[0].description
    status      = google_storage_transfer_job.cross_region_backup[0].status
    source      = google_storage_transfer_job.cross_region_backup[0].transfer_spec[0].gcs_data_source[0].bucket_name
    destination = google_storage_transfer_job.cross_region_backup[0].transfer_spec[0].gcs_data_sink[0].bucket_name
  } : null
}

# Secret Manager
output "secret_manager" {
  description = "Secret Manager resources"
  value = {
    backup_config = {
      secret_id = google_secret_manager_secret.backup_config.secret_id
      name      = google_secret_manager_secret.backup_config.name
    }
  }
  sensitive = true
}

# Configuration Summary
output "backup_configuration_summary" {
  description = "Summary of backup and DR configuration"
  value = {
    environment                = var.environment
    primary_region            = var.primary_region
    secondary_region          = var.secondary_region
    backup_retention_days     = var.backup_retention_days
    dr_active                 = var.dr_active
    cross_region_replication  = var.enable_cross_region_replication
    encryption_enabled        = var.enable_backup_encryption
    
    # Backup schedules summary
    schedules = {
      firestore_full        = var.backup_schedules.firestore_full
      firestore_incremental = var.backup_schedules.firestore_incremental
      auth_backup           = var.backup_schedules.auth_backup
      storage_backup        = var.backup_schedules.storage_backup
      solar_data_backup     = var.backup_schedules.solar_data_backup
    }
    
    # Collections configuration
    firestore_collections = var.firestore_collections
    
    # Monitoring thresholds
    monitoring = {
      backup_failure_threshold   = var.monitoring_config.backup_failure_threshold
      storage_capacity_threshold = var.monitoring_config.storage_capacity_threshold
      rto_threshold_minutes     = var.monitoring_config.rto_threshold_minutes
      rpo_threshold_minutes     = var.monitoring_config.rpo_threshold_minutes
    }
  }
}

# Infrastructure Endpoints
output "infrastructure_endpoints" {
  description = "Key infrastructure endpoints for applications"
  value = {
    backup_processor_endpoint    = google_cloud_run_service.backup_processor.status[0].url
    disaster_recovery_endpoint   = google_cloud_run_service.disaster_recovery.status[0].url
    
    # Pub/Sub endpoints
    backup_trigger_topic        = "projects/${var.project_id}/topics/${google_pubsub_topic.backup_trigger.name}"
    backup_status_topic         = "projects/${var.project_id}/topics/${google_pubsub_topic.backup_status.name}"
    disaster_recovery_topic     = "projects/${var.project_id}/topics/${google_pubsub_topic.disaster_recovery.name}"
    
    # Storage endpoints
    primary_backup_bucket_url   = google_storage_bucket.backup_primary.url
    secondary_backup_bucket_url = google_storage_bucket.backup_secondary.url
    archive_backup_bucket_url   = google_storage_bucket.backup_archive.url
  }
}

# Security Information
output "security_configuration" {
  description = "Security configuration details"
  value = {
    service_account_email = google_service_account.backup_service.email
    kms_key_ring         = google_kms_key_ring.backup_keyring.id
    encryption_keys = {
      primary   = google_kms_crypto_key.backup_primary_key.name
      secondary = google_kms_crypto_key.backup_secondary_key.name
      auth_data = google_kms_crypto_key.auth_data_key.name
    }
    
    # IAM roles assigned
    iam_roles = [
      "roles/datastore.owner",
      "roles/storage.admin", 
      "roles/cloudkms.cryptoKeyEncrypterDecrypter",
      "roles/monitoring.metricWriter",
      "roles/logging.logWriter"
    ]
    
    # Security features
    features = {
      customer_managed_encryption = var.enable_backup_encryption
      cross_region_replication   = var.enable_cross_region_replication
      audit_logging              = var.compliance_requirements.enable_audit_logging
      public_access_prevention   = true
      uniform_bucket_access      = true
      versioning_enabled         = true
    }
  }
}

# Cost Estimation Information
output "cost_optimization_features" {
  description = "Cost optimization features enabled"
  value = {
    storage_lifecycle_rules = {
      nearline_after_days = var.backup_lifecycle_rules.nearline_after_days
      coldline_after_days = var.backup_lifecycle_rules.coldline_after_days
      delete_after_days   = var.backup_lifecycle_rules.delete_after_days
    }
    
    storage_classes = var.storage_classes
    
    cost_optimization = {
      committed_use_discount     = var.cost_optimization.enable_committed_use_discount
      storage_cost_optimization  = var.cost_optimization.storage_cost_optimization
      backup_compression_enabled = var.cost_optimization.backup_compression_enabled
    }
    
    # Estimated monthly costs (placeholder - actual costs depend on usage)
    estimated_costs = {
      storage_primary   = "Depends on backup size and frequency"
      storage_secondary = "Depends on cross-region replication"
      storage_archive   = "Lower cost for long-term retention"
      cloud_run        = "Pay per use - depends on backup operations"
      kms_operations   = "Pay per encryption/decryption operation"
      data_transfer    = "Depends on cross-region transfer volume"
    }
  }
}

# Disaster Recovery Information
output "disaster_recovery_configuration" {
  description = "Disaster recovery configuration details"
  value = {
    dr_active                    = var.dr_active
    primary_region              = var.primary_region
    secondary_region            = var.secondary_region
    
    failover_configuration = {
      auto_failover_enabled      = var.disaster_scenarios.enable_auto_failover
      failover_threshold_minutes = var.disaster_scenarios.failover_threshold_minutes
      health_check_interval      = var.disaster_scenarios.health_check_interval
      recovery_validation        = var.disaster_scenarios.recovery_validation
    }
    
    dns_configuration = {
      zone_name = google_dns_managed_zone.solarify_zone.name
      app_record_ttl = google_dns_record_set.app_record.ttl
    }
    
    rto_rpo_targets = {
      rto_hours = var.monitoring_config.rto_threshold_minutes / 60
      rpo_hours = var.monitoring_config.rpo_threshold_minutes / 60
    }
  }
}

# Compliance and Audit Information
output "compliance_configuration" {
  description = "Compliance and audit configuration"
  value = {
    audit_logging_enabled    = var.compliance_requirements.enable_audit_logging
    retention_compliance     = var.compliance_requirements.retention_compliance
    data_residency_regions   = var.compliance_requirements.data_residency_regions
    encryption_at_rest       = var.compliance_requirements.encryption_at_rest
    encryption_in_transit    = var.compliance_requirements.encryption_in_transit
    
    audit_resources = {
      audit_logs_bucket = google_storage_bucket.audit_logs.name
      secret_manager    = google_secret_manager_secret.backup_config.name
    }
    
    retention_policies = {
      backup_retention_days  = var.backup_retention_days
      archive_retention_days = var.archive_retention_days
      audit_log_retention    = "7 years"
    }
  }
}

# Testing and Validation Configuration
output "testing_configuration" {
  description = "Testing and validation configuration"
  value = {
    automated_testing_enabled  = var.testing_config.enable_automated_testing
    test_schedule             = var.testing_config.test_schedule
    restore_test_frequency    = var.testing_config.restore_test_frequency
    validation_test_frequency = var.testing_config.validation_test_frequency
    
    # Test environments (would be created by separate Terraform modules)
    test_environments = {
      backup_validation  = "Isolated environment for backup validation"
      restore_testing    = "Isolated environment for restore testing"
      dr_simulation     = "Environment for disaster recovery simulation"
    }
  }
}