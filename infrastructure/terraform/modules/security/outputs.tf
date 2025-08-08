# Security Infrastructure Module Outputs

# KMS Outputs
output "kms_keyring_id" {
  description = "ID of the KMS key ring"
  value       = google_kms_key_ring.main_keyring.id
}

output "kms_keyring_name" {
  description = "Name of the KMS key ring"
  value       = google_kms_key_ring.main_keyring.name
}

output "database_encryption_key_id" {
  description = "ID of the database encryption key"
  value       = google_kms_crypto_key.database_key.id
}

output "storage_encryption_key_id" {
  description = "ID of the storage encryption key"
  value       = google_kms_crypto_key.storage_key.id
}

output "backup_encryption_key_id" {
  description = "ID of the backup encryption key"
  value       = google_kms_crypto_key.backup_key.id
}

output "application_encryption_key_id" {
  description = "ID of the application encryption key"
  value       = google_kms_crypto_key.application_key.id
}

# Service Account Outputs
output "service_accounts" {
  description = "Details of created service accounts"
  value = {
    for key, sa in google_service_account.service_accounts : key => {
      email      = sa.email
      name       = sa.name
      unique_id  = sa.unique_id
      account_id = sa.account_id
    }
  }
}

output "app_service_account_email" {
  description = "Email of the application service account"
  value       = try(google_service_account.service_accounts["app"].email, "")
}

output "build_service_account_email" {
  description = "Email of the build service account"
  value       = try(google_service_account.service_accounts["build"].email, "")
}

output "backup_service_account_email" {
  description = "Email of the backup service account"
  value       = try(google_service_account.service_accounts["backup"].email, "")
}

# Secret Manager Outputs
output "application_secrets" {
  description = "Application secrets in Secret Manager"
  value = {
    for key, secret in google_secret_manager_secret.app_secrets : key => {
      secret_id = secret.secret_id
      name      = secret.name
    }
  }
}

output "database_secrets" {
  description = "Database password secrets"
  value = {
    for key, secret in google_secret_manager_secret.db_secrets : key => {
      secret_id = secret.secret_id
      name      = secret.name
    }
  }
  sensitive = true
}

output "external_service_secrets" {
  description = "External service secrets"
  value = {
    for key, secret in google_secret_manager_secret.external_secrets : key => {
      secret_id = secret.secret_id
      name      = secret.name
    }
  }
}

output "firebase_config_secret_name" {
  description = "Name of the Firebase configuration secret"
  value       = google_secret_manager_secret.firebase_config.name
}

output "jwt_secret_name" {
  description = "Name of the JWT secret"
  value       = google_secret_manager_secret.jwt_secret.name
}

# Binary Authorization Outputs
output "binary_authorization_policy_name" {
  description = "Name of the Binary Authorization policy"
  value       = var.enable_binary_authorization ? google_binary_authorization_policy.policy[0].id : ""
}

output "binary_authorization_attestor_name" {
  description = "Name of the Binary Authorization attestor"
  value       = var.enable_binary_authorization ? google_binary_authorization_attestor.attestor[0].name : ""
}

# Security Configuration Summary
output "security_configuration" {
  description = "Security configuration summary"
  value = {
    kms_keys_created = length(local.kms_keys)
    service_accounts_created = length(var.service_accounts)
    secrets_created = length(var.application_secrets) + length(var.database_users) + length(var.external_service_secrets) + 2
    
    encryption = {
      keyring_name = google_kms_key_ring.main_keyring.name
      key_rotation_period = var.kms_key_rotation_period
      keys = [
        google_kms_crypto_key.database_key.name,
        google_kms_crypto_key.storage_key.name,
        google_kms_crypto_key.backup_key.name,
        google_kms_crypto_key.application_key.name
      ]
    }
    
    authentication = {
      workload_identity_enabled = var.enable_workload_identity
      binary_authorization_enabled = var.enable_binary_authorization
      audit_logging_enabled = true
    }
    
    access_control = {
      service_accounts = [for sa in google_service_account.service_accounts : sa.email]
      security_center_enabled = var.enable_security_center
      vpc_service_controls_enabled = var.enable_vpc_service_controls
    }
  }
}

# Compliance Information
output "compliance_status" {
  description = "Compliance status and configurations"
  value = {
    audit_logging_enabled = var.compliance_requirements.enable_audit_logging
    encryption_at_rest = var.compliance_requirements.encryption_at_rest
    encryption_in_transit = var.compliance_requirements.encryption_in_transit
    key_rotation_enabled = true
    access_logging_enabled = var.compliance_requirements.access_logging
    data_residency_regions = var.compliance_requirements.data_residency_regions
    
    security_policies = {
      password_policy_enforced = true
      session_management = var.security_policies.session_policy
      access_controls = var.security_policies.access_policy
    }
  }
}

# Security Monitoring
output "security_monitoring" {
  description = "Security monitoring configuration"
  value = {
    security_sink_name = google_logging_sink.security_sink.name
    security_center_enabled = var.enable_security_center
    audit_logs_enabled = true
    
    monitored_services = [
      "iam.googleapis.com",
      "secretmanager.googleapis.com", 
      "cloudkms.googleapis.com",
      "binaryauthorization.googleapis.com"
    ]
    
    alert_policies = {
      unauthorized_access = "Monitor for unauthorized access attempts"
      key_usage = "Monitor KMS key usage patterns"
      secret_access = "Monitor Secret Manager access"
    }
  }
}

# Secret Access Instructions
output "secret_access_instructions" {
  description = "Instructions for accessing secrets"
  value = {
    firebase_config = "gcloud secrets versions access latest --secret=${google_secret_manager_secret.firebase_config.secret_id}"
    jwt_secret = "gcloud secrets versions access latest --secret=${google_secret_manager_secret.jwt_secret.secret_id}"
    
    database_passwords = {
      for key, secret in google_secret_manager_secret.db_secrets : key => 
        "gcloud secrets versions access latest --secret=${secret.secret_id}"
    }
    
    application_secrets = {
      for key, secret in google_secret_manager_secret.app_secrets : key => 
        "gcloud secrets versions access latest --secret=${secret.secret_id}"
    }
  }
  sensitive = true
}

# KMS Key Access Instructions
output "kms_key_access_instructions" {
  description = "Instructions for using KMS keys"
  value = {
    encrypt_command = "gcloud kms encrypt --key=${google_kms_crypto_key.application_key.id} --plaintext-file=- --ciphertext-file=-"
    decrypt_command = "gcloud kms decrypt --key=${google_kms_crypto_key.application_key.id} --ciphertext-file=- --plaintext-file=-"
    
    key_locations = {
      database_key = google_kms_crypto_key.database_key.id
      storage_key = google_kms_crypto_key.storage_key.id
      backup_key = google_kms_crypto_key.backup_key.id
      application_key = google_kms_crypto_key.application_key.id
    }
  }
}

# Security Best Practices
output "security_recommendations" {
  description = "Security best practices and recommendations"
  value = {
    key_rotation = "KMS keys are configured for automatic rotation every ${var.kms_key_rotation_period}"
    secret_rotation = "Regularly rotate secrets in Secret Manager using the provided service accounts"
    access_review = "Regularly review IAM permissions and service account usage"
    monitoring = "Monitor security logs and set up alerts for suspicious activity"
    
    next_steps = [
      "Configure SSL certificates for HTTPS",
      "Set up VPC Service Controls for additional network security",
      "Enable Binary Authorization for container image security",
      "Configure Security Command Center for centralized security management",
      "Implement least-privilege access policies"
    ]
  }
}