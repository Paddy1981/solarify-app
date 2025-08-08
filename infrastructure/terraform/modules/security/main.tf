# Security Infrastructure Module - IAM, KMS, Secrets Management
# Provides comprehensive security infrastructure for Solarify

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Local variables
locals {
  # KMS key names
  kms_keys = {
    database     = "${var.environment_prefix}-database-key"
    storage      = "${var.environment_prefix}-storage-key"
    backup       = "${var.environment_prefix}-backup-key"
    application  = "${var.environment_prefix}-application-key"
  }

  # Common IAM roles for different service types
  common_roles = {
    app_roles = [
      "roles/firestore.user",
      "roles/storage.objectViewer",
      "roles/secretmanager.secretAccessor",
      "roles/monitoring.metricWriter",
      "roles/logging.logWriter",
      "roles/cloudtrace.agent"
    ]
    build_roles = [
      "roles/cloudbuild.builds.builder",
      "roles/run.developer",
      "roles/storage.admin",
      "roles/artifactregistry.writer",
      "roles/secretmanager.secretAccessor"
    ]
    backup_roles = [
      "roles/datastore.owner",
      "roles/storage.admin",
      "roles/cloudkms.cryptoKeyEncrypterDecrypter",
      "roles/monitoring.metricWriter",
      "roles/logging.logWriter"
    ]
  }
}

# KMS Key Ring for encryption keys
resource "google_kms_key_ring" "main_keyring" {
  name     = "${var.environment_prefix}-keyring"
  location = "global"
  project  = var.project_id

  # Prevent destruction of keyring
  lifecycle {
    prevent_destroy = true
  }
}

# Database encryption key
resource "google_kms_crypto_key" "database_key" {
  name     = local.kms_keys.database
  key_ring = google_kms_key_ring.main_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  # Key rotation
  rotation_period = var.kms_key_rotation_period

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  labels = var.labels

  lifecycle {
    prevent_destroy = true
  }
}

# Storage encryption key
resource "google_kms_crypto_key" "storage_key" {
  name     = local.kms_keys.storage
  key_ring = google_kms_key_ring.main_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  rotation_period = var.kms_key_rotation_period

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  labels = var.labels

  lifecycle {
    prevent_destroy = true
  }
}

# Backup encryption key
resource "google_kms_crypto_key" "backup_key" {
  name     = local.kms_keys.backup
  key_ring = google_kms_key_ring.main_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  # More frequent rotation for backup key
  rotation_period = "2592000s"  # 30 days

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  labels = var.labels

  lifecycle {
    prevent_destroy = true
  }
}

# Application secrets encryption key
resource "google_kms_crypto_key" "application_key" {
  name     = local.kms_keys.application
  key_ring = google_kms_key_ring.main_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  rotation_period = var.kms_key_rotation_period

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  labels = var.labels

  lifecycle {
    prevent_destroy = true
  }
}

# Service Accounts
resource "google_service_account" "service_accounts" {
  for_each = var.service_accounts

  account_id   = each.value.account_id
  display_name = each.value.display_name
  description  = "Service account for ${each.key} - ${var.environment}"
  project      = var.project_id
}

# IAM bindings for service accounts
resource "google_project_iam_member" "service_account_roles" {
  for_each = {
    for pair in flatten([
      for sa_key, sa_config in var.service_accounts : [
        for role in sa_config.roles : {
          sa_key = sa_key
          role   = role
          member = "serviceAccount:${google_service_account.service_accounts[sa_key].email}"
        }
      ]
    ]) : "${pair.sa_key}-${pair.role}" => pair
  }

  project = var.project_id
  role    = each.value.role
  member  = each.value.member
}

# KMS permissions for service accounts
resource "google_kms_crypto_key_iam_member" "service_account_kms" {
  for_each = {
    for pair in flatten([
      for sa_key, sa in google_service_account.service_accounts : [
        for key_name, key_id in {
          database    = google_kms_crypto_key.database_key.id
          storage     = google_kms_crypto_key.storage_key.id
          backup      = google_kms_crypto_key.backup_key.id
          application = google_kms_crypto_key.application_key.id
        } : {
          sa_key   = sa_key
          key_name = key_name
          key_id   = key_id
          member   = "serviceAccount:${sa.email}"
        }
      ]
    ]) : "${pair.sa_key}-${pair.key_name}" => pair
  }

  crypto_key_id = each.value.key_id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = each.value.member
}

# Secret Manager secrets
resource "google_secret_manager_secret" "app_secrets" {
  for_each = var.application_secrets

  secret_id = "${var.environment_prefix}-${each.key}"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = merge(var.labels, {
    secret_type = "application"
  })
}

# Secret versions (initial empty versions)
resource "google_secret_manager_secret_version" "app_secret_versions" {
  for_each = var.application_secrets

  secret = google_secret_manager_secret.app_secrets[each.key].id
  secret_data = each.value.initial_value != "" ? each.value.initial_value : "PLACEHOLDER_VALUE"

  lifecycle {
    ignore_changes = [secret_data]
  }
}

# Database connection secrets
resource "random_password" "db_passwords" {
  for_each = var.database_users

  length  = 32
  special = true
}

resource "google_secret_manager_secret" "db_secrets" {
  for_each = var.database_users

  secret_id = "${var.environment_prefix}-db-${each.key}-password"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = merge(var.labels, {
    secret_type = "database"
  })
}

resource "google_secret_manager_secret_version" "db_secret_versions" {
  for_each = var.database_users

  secret      = google_secret_manager_secret.db_secrets[each.key].id
  secret_data = random_password.db_passwords[each.key].result
}

# API keys and external service secrets
resource "google_secret_manager_secret" "external_secrets" {
  for_each = var.external_service_secrets

  secret_id = "${var.environment_prefix}-${each.key}"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = merge(var.labels, {
    secret_type = "external_service"
  })
}

# Firebase configuration secret
resource "google_secret_manager_secret" "firebase_config" {
  secret_id = "${var.environment_prefix}-firebase-config"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = merge(var.labels, {
    secret_type = "firebase"
  })
}

# JWT signing keys for application
resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${var.environment_prefix}-jwt-secret"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = merge(var.labels, {
    secret_type = "application"
  })
}

resource "google_secret_manager_secret_version" "jwt_secret_version" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

# IAM conditions for Secret Manager access
resource "google_secret_manager_secret_iam_member" "app_secret_access" {
  for_each = var.application_secrets

  project   = var.project_id
  secret_id = google_secret_manager_secret.app_secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.service_accounts["app"].email}"

  condition {
    title       = "Application access only"
    description = "Allow access only from the application service account"
    expression  = "request.auth.claims.email == '${google_service_account.service_accounts["app"].email}'"
  }
}

# Workload Identity binding (for GKE if needed)
resource "google_service_account_iam_member" "workload_identity" {
  for_each = var.enable_workload_identity ? var.service_accounts : {}

  service_account_id = google_service_account.service_accounts[each.key].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.kubernetes_namespace}/${each.value.account_id}]"
}

# Binary Authorization policy (for container security)
resource "google_binary_authorization_policy" "policy" {
  count = var.enable_binary_authorization ? 1 : 0

  admission_whitelist_patterns {
    name_pattern = "gcr.io/${var.project_id}/*"
  }

  admission_whitelist_patterns {
    name_pattern = "us-docker.pkg.dev/${var.project_id}/*"
  }

  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"

    require_attestations_by = [
      google_binary_authorization_attestor.attestor[0].name
    ]
  }

  cluster_admission_rules {
    cluster = "projects/${var.project_id}/locations/${var.primary_region}/clusters/*"
    
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"

    require_attestations_by = [
      google_binary_authorization_attestor.attestor[0].name
    ]
  }
}

# Binary Authorization attestor
resource "google_binary_authorization_attestor" "attestor" {
  count = var.enable_binary_authorization ? 1 : 0

  name = "${var.environment_prefix}-attestor"
  
  attestation_authority_note {
    note_reference = google_container_analysis_note.note[0].name
    
    public_keys {
      ascii_armored_pgp_public_key = var.pgp_public_key
    }
  }
}

# Container Analysis note for attestor
resource "google_container_analysis_note" "note" {
  count = var.enable_binary_authorization ? 1 : 0

  name = "${var.environment_prefix}-attestor-note"
  
  attestation_authority {
    hint {
      human_readable_name = "Solarify Attestor"
    }
  }
}

# Security Command Center findings (if enabled)
resource "google_security_center_source" "solarify_source" {
  count = var.enable_security_center ? 1 : 0

  display_name = "Solarify Security Source"
  organization = var.organization_id
  description  = "Security findings for Solarify application"
}

# VPC Service Controls (if enabled)
resource "google_access_context_manager_access_policy" "access_policy" {
  count = var.enable_vpc_service_controls ? 1 : 0

  parent = "organizations/${var.organization_id}"
  title  = "Solarify Access Policy"
}

resource "google_access_context_manager_service_perimeter" "service_perimeter" {
  count = var.enable_vpc_service_controls ? 1 : 0

  parent = "accessPolicies/${google_access_context_manager_access_policy.access_policy[0].name}"
  name   = "accessPolicies/${google_access_context_manager_access_policy.access_policy[0].name}/servicePerimeters/${var.environment_prefix}_perimeter"
  title  = "Solarify Service Perimeter"

  status {
    restricted_services = [
      "firestore.googleapis.com",
      "storage.googleapis.com",
      "secretmanager.googleapis.com"
    ]

    resources = [
      "projects/${var.project_id}"
    ]

    access_levels = []
  }
}

# IAM Audit Configuration
resource "google_project_iam_audit_config" "audit_config" {
  project = var.project_id
  service = "allServices"

  audit_log_config {
    log_type = "ADMIN_READ"
  }

  audit_log_config {
    log_type = "DATA_READ"
  }

  audit_log_config {
    log_type = "DATA_WRITE"
  }
}

# Organization-level IAM policies (if managing organization)
resource "google_organization_iam_member" "security_admin" {
  count = var.organization_id != "" ? length(var.security_admins) : 0

  org_id = var.organization_id
  role   = "roles/iam.securityAdmin"
  member = "user:${var.security_admins[count.index]}"
}

# Log sink for security events
resource "google_logging_sink" "security_sink" {
  name        = "${var.environment_prefix}-security-sink"
  destination = "storage.googleapis.com/${var.environment_prefix}-security-logs"

  # Filter for security-related events
  filter = <<-EOT
    (protoPayload.serviceName="iam.googleapis.com" OR 
     protoPayload.serviceName="secretmanager.googleapis.com" OR
     protoPayload.serviceName="cloudkms.googleapis.com" OR
     protoPayload.serviceName="binaryauthorization.googleapis.com") AND
    (protoPayload.authenticationInfo.principalEmail!="${google_service_account.service_accounts["app"].email}" AND
     protoPayload.authenticationInfo.principalEmail!="${google_service_account.service_accounts["build"].email}")
  EOT

  unique_writer_identity = true
}