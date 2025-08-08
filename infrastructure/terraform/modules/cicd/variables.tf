# CI/CD Infrastructure Module Variables

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
  description = "Primary region for CI/CD resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for private worker pools"
  type        = string
  default     = ""
}

# Repository Configuration
variable "source_repository_url" {
  description = "Source repository URL"
  type        = string
}

variable "branch_pattern" {
  description = "Branch pattern for CI/CD triggers"
  type        = string
  default     = "^(main|develop|release/.*)$"
}

variable "create_source_repo" {
  description = "Create a Cloud Source Repository"
  type        = bool
  default     = false
}

# Artifact Registry Configuration
variable "artifact_registry_id" {
  description = "Artifact Registry repository ID"
  type        = string
  default     = "solarify-registry"
}

# Build Configuration
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
    timeout_seconds = "1800s"  # 30 minutes
    machine_type   = "E2_STANDARD_4"
    substitutions  = {}
    steps         = []
  }
}

# Deployment Configuration
variable "cloud_run_service_name" {
  description = "Cloud Run service name for deployment"
  type        = string
}

variable "build_service_account_email" {
  description = "Service account email for Cloud Build"
  type        = string
}

# Security Configuration
variable "enable_binary_authorization" {
  description = "Enable Binary Authorization for container security"
  type        = bool
  default     = true
}

variable "webhook_secret" {
  description = "Webhook secret for manual triggers"
  type        = string
  default     = ""
  sensitive   = true
}

# Worker Pool Configuration
variable "create_private_worker_pool" {
  description = "Create a private Cloud Build worker pool"
  type        = bool
  default     = false
}

variable "private_worker_pool" {
  description = "Private worker pool name (if using existing pool)"
  type        = string
  default     = ""
}

# Scheduling Configuration
variable "enable_nightly_builds" {
  description = "Enable nightly builds"
  type        = bool
  default     = false
}

# GitHub Enterprise Configuration
variable "github_enterprise_config" {
  description = "GitHub Enterprise configuration"
  type = object({
    create      = bool
    host_url    = string
    app_id      = string
    private_key = string
  })
  default = {
    create      = false
    host_url    = ""
    app_id      = ""
    private_key = ""
  }
  sensitive = true
}

# Notification Configuration
variable "notification_channels" {
  description = "Notification channels for build alerts"
  type        = list(string)
  default     = []
}

# Testing Configuration
variable "test_config" {
  description = "Testing configuration for CI/CD pipeline"
  type = object({
    enable_unit_tests        = bool
    enable_integration_tests = bool
    enable_e2e_tests        = bool
    enable_security_scan    = bool
    enable_performance_test = bool
    test_timeout_seconds    = string
    parallel_test_execution = bool
  })
  default = {
    enable_unit_tests        = true
    enable_integration_tests = true
    enable_e2e_tests        = false
    enable_security_scan    = true
    enable_performance_test = false
    test_timeout_seconds    = "600s"
    parallel_test_execution = true
  }
}

# Deployment Strategy Configuration
variable "deployment_strategy" {
  description = "Deployment strategy configuration"
  type = object({
    strategy_type           = string  # "rolling", "blue_green", "canary"
    rollout_percentage     = number
    health_check_timeout   = string
    rollback_on_failure    = bool
    approval_required      = bool
  })
  default = {
    strategy_type           = "rolling"
    rollout_percentage     = 100
    health_check_timeout   = "300s"
    rollback_on_failure    = true
    approval_required      = false
  }
}

# Quality Gates Configuration
variable "quality_gates" {
  description = "Quality gates that must pass before deployment"
  type = object({
    minimum_test_coverage   = number
    max_code_complexity    = number
    security_scan_required = bool
    performance_threshold  = number
    manual_approval_envs   = list(string)
  })
  default = {
    minimum_test_coverage   = 80
    max_code_complexity    = 10
    security_scan_required = true
    performance_threshold  = 2000  # milliseconds
    manual_approval_envs   = ["production"]
  }
}

# Build Cache Configuration
variable "build_cache_config" {
  description = "Build cache configuration"
  type = object({
    enable_cache          = bool
    cache_bucket_location = string
    cache_retention_days  = number
    cache_key_strategy   = string  # "commit", "branch", "global"
  })
  default = {
    enable_cache          = true
    cache_bucket_location = "US"
    cache_retention_days  = 7
    cache_key_strategy   = "branch"
  }
}

# Environment Promotion Configuration
variable "promotion_config" {
  description = "Environment promotion configuration"
  type = object({
    enable_auto_promotion = bool
    source_environment   = string
    target_environment   = string
    promotion_criteria   = list(string)
    notification_channels = list(string)
  })
  default = {
    enable_auto_promotion = false
    source_environment   = "staging"
    target_environment   = "production"
    promotion_criteria   = ["tests_passed", "security_approved", "performance_validated"]
    notification_channels = []
  }
}

variable "labels" {
  description = "Labels to apply to CI/CD resources"
  type        = map(string)
  default     = {}
}