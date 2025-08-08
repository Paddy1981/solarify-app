# CI/CD Infrastructure Module - Cloud Build, Artifact Registry, Deployment Pipelines
# Provides comprehensive CI/CD infrastructure for Solarify

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Local variables
locals {
  # Build trigger configurations
  build_triggers = {
    main_branch = {
      name            = "${var.environment_prefix}-main-deploy"
      description     = "Deploy from main branch to ${var.environment}"
      branch_pattern  = "^main$"
      included_files  = ["**"]
      ignored_files   = ["README.md", "docs/**"]
    }
    
    develop_branch = {
      name            = "${var.environment_prefix}-develop-build"
      description     = "Build and test from develop branch"
      branch_pattern  = "^develop$"
      included_files  = ["**"]
      ignored_files   = ["README.md", "docs/**"]
    }
    
    feature_branches = {
      name            = "${var.environment_prefix}-feature-test"
      description     = "Test feature branches"
      branch_pattern  = "^feature/.*$"
      included_files  = ["**"]
      ignored_files   = ["README.md", "docs/**"]
    }
  }
  
  # Container image names
  container_images = {
    app        = "${var.primary_region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.container_registry.repository_id}/solarify-app"
    backup     = "${var.primary_region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.container_registry.repository_id}/solarify-backup"
    worker     = "${var.primary_region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.container_registry.repository_id}/solarify-worker"
  }
}

# Artifact Registry for container images
resource "google_artifact_registry_repository" "container_registry" {
  location      = var.primary_region
  repository_id = var.artifact_registry_id
  description   = "Container registry for ${var.environment} environment"
  format        = "DOCKER"

  # Cleanup policies
  cleanup_policies {
    id     = "delete-old-images"
    action = "DELETE"
    
    condition {
      tag_state  = "UNTAGGED"
      older_than = "2592000s"  # 30 days
    }
  }

  cleanup_policies {
    id     = "keep-recent-versions"
    action = "KEEP"
    
    most_recent_versions {
      keep_count = 10
    }
  }

  labels = var.labels
}

# Source Repository (Cloud Source Repositories)
resource "google_sourcerepo_repository" "source_repo" {
  count = var.create_source_repo ? 1 : 0
  
  name = "${var.environment_prefix}-source"
  
  pubsub_configs {
    topic                 = google_pubsub_topic.build_notifications.id
    message_format        = "JSON"
    service_account_email = var.build_service_account_email
  }
}

# Pub/Sub topic for build notifications
resource "google_pubsub_topic" "build_notifications" {
  name = "${var.environment_prefix}-build-notifications"
  
  labels = var.labels
}

# Cloud Build triggers
resource "google_cloudbuild_trigger" "build_triggers" {
  for_each = local.build_triggers

  name        = each.value.name
  description = each.value.description
  project     = var.project_id

  # GitHub configuration (if using GitHub)
  dynamic "github" {
    for_each = var.source_repository_url != "" && can(regex("github.com", var.source_repository_url)) ? [1] : []
    content {
      owner = split("/", split("github.com/", var.source_repository_url)[1])[0]
      name  = split("/", split("github.com/", var.source_repository_url)[1])[1]
      
      push {
        branch = each.value.branch_pattern
      }
    }
  }

  # Cloud Source Repository configuration
  dynamic "trigger_template" {
    for_each = var.create_source_repo ? [1] : []
    content {
      project_id  = var.project_id
      repo_name   = google_sourcerepo_repository.source_repo[0].name
      branch_name = each.value.branch_pattern
    }
  }

  # Build configuration
  build {
    # Build steps
    step {
      name = "gcr.io/cloud-builders/docker"
      args = [
        "build",
        "-t", "${local.container_images.app}:$COMMIT_SHA",
        "-t", "${local.container_images.app}:latest",
        "--cache-from", "${local.container_images.app}:latest",
        "."
      ]
    }

    step {
      name = "gcr.io/cloud-builders/docker"
      args = ["push", "${local.container_images.app}:$COMMIT_SHA"]
    }

    step {
      name = "gcr.io/cloud-builders/docker"
      args = ["push", "${local.container_images.app}:latest"]
    }

    # Run tests
    step {
      name = "gcr.io/cloud-builders/npm"
      args = ["ci"]
    }

    step {
      name = "gcr.io/cloud-builders/npm"
      args = ["run", "test:ci"]
    }

    step {
      name = "gcr.io/cloud-builders/npm"
      args = ["run", "lint"]
    }

    # Security scanning
    step {
      name = "gcr.io/cloud-builders/gcloud"
      args = [
        "container", "images", "scan",
        "${local.container_images.app}:$COMMIT_SHA",
        "--format=json"
      ]
    }

    # Deploy step (only for main branch and production environment)
    dynamic "step" {
      for_each = each.key == "main_branch" && var.environment == "production" ? [1] : []
      content {
        name = "gcr.io/cloud-builders/gcloud"
        args = [
          "run", "deploy", var.cloud_run_service_name,
          "--image", "${local.container_images.app}:$COMMIT_SHA",
          "--region", var.primary_region,
          "--platform", "managed",
          "--allow-unauthenticated"
        ]
      }
    }

    # Build options
    options {
      machine_type = var.build_config.machine_type
      
      # Use higher CPU for builds
      requested_verify_option = "VERIFIED"
      
      # Logging configuration
      logging = "CLOUD_LOGGING_ONLY"
      
      # Source provenance
      source_provenance_hash = ["SHA256"]
      
      # Worker pool (if using private pools)
      dynamic "worker_pool" {
        for_each = var.private_worker_pool != "" ? [1] : []
        content {
          name = var.private_worker_pool
        }
      }
    }

    # Timeout
    timeout = var.build_config.timeout_seconds

    # Substitutions
    substitutions = merge(var.build_config.substitutions, {
      _SERVICE_NAME = var.cloud_run_service_name
      _REGION      = var.primary_region
      _REGISTRY    = "${var.primary_region}-docker.pkg.dev"
    })

    # Artifacts
    artifacts {
      images = [
        "${local.container_images.app}:$COMMIT_SHA",
        "${local.container_images.app}:latest"
      ]
    }
  }

  # File filters
  included_files = each.value.included_files
  ignored_files  = each.value.ignored_files

  # Service account
  service_account = var.build_service_account_email

  labels = var.labels
}

# Cloud Build configuration for staging deployment
resource "google_cloudbuild_trigger" "staging_deploy" {
  count = var.environment == "staging" ? 1 : 0

  name        = "${var.environment_prefix}-staging-deploy"
  description = "Deploy to staging environment"
  project     = var.project_id

  # Manual trigger for staging deployments
  webhook_config {
    secret = var.webhook_secret
  }

  build {
    # Deploy to staging
    step {
      name = "gcr.io/cloud-builders/gcloud"
      args = [
        "run", "deploy", var.cloud_run_service_name,
        "--image", "${local.container_images.app}:$$TAG_NAME",
        "--region", var.primary_region,
        "--platform", "managed"
      ]
    }

    # Run smoke tests
    step {
      name = "gcr.io/cloud-builders/npm"
      args = ["run", "test:smoke"]
      env = [
        "STAGING_URL=https://${var.cloud_run_service_name}-${random_id.service_suffix.hex}-${var.primary_region}.a.run.app"
      ]
    }

    substitutions = {
      TAG_NAME = "$TAG_NAME"
    }
  }

  service_account = var.build_service_account_email
}

# Random ID for unique service naming
resource "random_id" "service_suffix" {
  byte_length = 4
}

# Cloud Build worker pool (for private builds if needed)
resource "google_cloudbuild_worker_pool" "private_pool" {
  count = var.create_private_worker_pool ? 1 : 0

  name     = "${var.environment_prefix}-private-pool"
  location = var.primary_region
  project  = var.project_id

  worker_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100
    
    no_external_ip = true
  }

  network_config {
    peered_network = var.vpc_id
  }
}

# Cloud Scheduler for regular builds (nightly builds, dependency updates)
resource "google_cloud_scheduler_job" "nightly_build" {
  count = var.enable_nightly_builds ? 1 : 0

  name         = "${var.environment_prefix}-nightly-build"
  description  = "Nightly build and security scan"
  schedule     = "0 2 * * *"  # 2 AM daily
  time_zone    = "UTC"
  region       = var.primary_region

  http_target {
    uri         = "https://cloudbuild.googleapis.com/v1/projects/${var.project_id}/triggers/${google_cloudbuild_trigger.build_triggers["main_branch"].id}:run"
    http_method = "POST"
    
    headers = {
      "Content-Type" = "application/json"
    }

    body = base64encode(jsonencode({
      branchName = "main"
    }))

    oauth_token {
      service_account_email = var.build_service_account_email
      scope                 = "https://www.googleapis.com/auth/cloud-platform"
    }
  }

  retry_config {
    retry_count = 2
  }
}

# Build cache bucket
resource "google_storage_bucket" "build_cache" {
  name          = "${var.environment_prefix}-build-cache"
  location      = var.primary_region
  storage_class = "STANDARD"
  project       = var.project_id

  # Lifecycle management for build cache
  lifecycle_rule {
    condition {
      age = 7  # Keep cache for 7 days
    }
    action {
      type = "Delete"
    }
  }

  # Versioning for build artifacts
  versioning {
    enabled = true
  }

  labels = var.labels
}

# Build logs bucket
resource "google_storage_bucket" "build_logs" {
  name          = "${var.environment_prefix}-build-logs"
  location      = var.primary_region
  storage_class = "NEARLINE"
  project       = var.project_id

  lifecycle_rule {
    condition {
      age = 90  # Keep build logs for 90 days
    }
    action {
      type = "Delete"
    }
  }

  labels = var.labels
}

# Binary Authorization policy for signed images
resource "google_binary_authorization_policy" "build_policy" {
  count = var.enable_binary_authorization ? 1 : 0

  admission_whitelist_patterns {
    name_pattern = "${local.container_images.app}:*"
  }

  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"

    require_attestations_by = [
      google_binary_authorization_attestor.build_attestor[0].name
    ]
  }
}

resource "google_binary_authorization_attestor" "build_attestor" {
  count = var.enable_binary_authorization ? 1 : 0

  name = "${var.environment_prefix}-build-attestor"
  
  attestation_authority_note {
    note_reference = google_container_analysis_note.build_note[0].name
  }
}

resource "google_container_analysis_note" "build_note" {
  count = var.enable_binary_authorization ? 1 : 0

  name = "${var.environment_prefix}-build-attestor-note"
  
  attestation_authority {
    hint {
      human_readable_name = "Build Attestor"
    }
  }
}

# Cloud Build GitHub App (if using GitHub)
resource "google_cloudbuild_github_enterprise_config" "github_config" {
  count = var.github_enterprise_config.create ? 1 : 0

  config_id   = "${var.environment_prefix}-github"
  project     = var.project_id
  host_url    = var.github_enterprise_config.host_url
  app_id      = var.github_enterprise_config.app_id
  private_key = var.github_enterprise_config.private_key
}

# Monitoring for CI/CD pipeline
resource "google_monitoring_alert_policy" "build_failure_alert" {
  display_name = "Build Failure Alert - ${var.environment}"
  project      = var.project_id

  conditions {
    display_name = "Build failures"

    condition_threshold {
      filter         = "resource.type=\"build\" AND metric.type=\"cloudbuild.googleapis.com/build/count\""
      duration       = "300s"
      comparison     = "COMPARISON_GREATER_THAN"
      threshold_value = 0

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = var.notification_channels

  documentation {
    content   = "Build failure detected in ${var.environment} environment. Check Cloud Build logs."
    mime_type = "text/markdown"
  }
}