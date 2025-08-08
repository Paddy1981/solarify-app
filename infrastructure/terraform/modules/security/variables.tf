# Security Infrastructure Module Variables

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
  description = "Primary region for security resources"
  type        = string
}

variable "organization_id" {
  description = "Google Cloud Organization ID"
  type        = string
  default     = ""
}

# KMS Configuration
variable "kms_key_rotation_period" {
  description = "KMS key rotation period in seconds"
  type        = string
  default     = "7776000s"  # 90 days
  validation {
    condition     = can(regex("^[0-9]+s$", var.kms_key_rotation_period))
    error_message = "KMS key rotation period must be in seconds format (e.g., '7776000s')."
  }
}

# Service Accounts Configuration
variable "service_accounts" {
  description = "Service accounts to create"
  type = map(object({
    account_id   = string
    display_name = string
    roles        = list(string)
  }))
  default = {}
}

# Application Secrets Configuration
variable "application_secrets" {
  description = "Application secrets to create in Secret Manager"
  type = map(object({
    description   = string
    initial_value = string
  }))
  default = {
    database_url = {
      description   = "Database connection URL"
      initial_value = ""
    }
    api_key = {
      description   = "External API key"
      initial_value = ""
    }
    session_secret = {
      description   = "Session encryption secret"
      initial_value = ""
    }
  }
}

# Database Users Configuration
variable "database_users" {
  description = "Database users for which to generate passwords"
  type = map(object({
    description = string
  }))
  default = {
    app_user = {
      description = "Application database user"
    }
    readonly_user = {
      description = "Read-only database user"
    }
  }
}

# External Service Secrets
variable "external_service_secrets" {
  description = "External service secrets (API keys, tokens, etc.)"
  type = map(object({
    description = string
  }))
  default = {
    weather_api_key = {
      description = "Weather service API key"
    }
    payment_webhook_secret = {
      description = "Payment processor webhook secret"
    }
    email_service_key = {
      description = "Email service API key"
    }
  }
}

# Workload Identity Configuration
variable "enable_workload_identity" {
  description = "Enable Workload Identity for GKE"
  type        = bool
  default     = false
}

variable "kubernetes_namespace" {
  description = "Kubernetes namespace for Workload Identity"
  type        = string
  default     = "default"
}

# Binary Authorization Configuration
variable "enable_binary_authorization" {
  description = "Enable Binary Authorization for container security"
  type        = bool
  default     = false
}

variable "pgp_public_key" {
  description = "PGP public key for Binary Authorization attestor"
  type        = string
  default     = ""
}

# Security Center Configuration
variable "enable_security_center" {
  description = "Enable Security Command Center"
  type        = bool
  default     = false
}

# VPC Service Controls Configuration
variable "enable_vpc_service_controls" {
  description = "Enable VPC Service Controls"
  type        = bool
  default     = false
}

# Security Administrators
variable "security_admins" {
  description = "List of email addresses for security administrators"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for email in var.security_admins : can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", email))
    ])
    error_message = "All security admin emails must be valid email addresses."
  }
}

# Compliance Configuration
variable "compliance_requirements" {
  description = "Compliance requirements configuration"
  type = object({
    enable_audit_logging      = bool
    data_residency_regions    = list(string)
    encryption_at_rest        = bool
    encryption_in_transit     = bool
    key_rotation_frequency    = string
    access_logging            = bool
  })
  default = {
    enable_audit_logging      = true
    data_residency_regions    = ["us"]
    encryption_at_rest        = true
    encryption_in_transit     = true
    key_rotation_frequency    = "90d"
    access_logging            = true
  }
}

# Security Policies
variable "security_policies" {
  description = "Security policy configurations"
  type = object({
    password_policy = object({
      min_length              = number
      require_uppercase       = bool
      require_lowercase       = bool
      require_numbers         = bool
      require_special_chars   = bool
      password_history_length = number
    })
    session_policy = object({
      max_session_duration_hours = number
      idle_timeout_minutes       = number
      require_mfa               = bool
    })
    access_policy = object({
      allowed_ip_ranges         = list(string)
      require_corp_device       = bool
      max_concurrent_sessions   = number
    })
  })
  default = {
    password_policy = {
      min_length              = 12
      require_uppercase       = true
      require_lowercase       = true
      require_numbers         = true
      require_special_chars   = true
      password_history_length = 5
    }
    session_policy = {
      max_session_duration_hours = 8
      idle_timeout_minutes       = 60
      require_mfa               = true
    }
    access_policy = {
      allowed_ip_ranges         = []
      require_corp_device       = false
      max_concurrent_sessions   = 3
    }
  }
}

# Encryption Configuration
variable "encryption_config" {
  description = "Encryption configuration settings"
  type = object({
    enable_envelope_encryption = bool
    key_derivation_function    = string
    encryption_algorithm       = string
    key_size_bits             = number
  })
  default = {
    enable_envelope_encryption = true
    key_derivation_function    = "SCRYPT"
    encryption_algorithm       = "AES_256"
    key_size_bits             = 256
  }
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}