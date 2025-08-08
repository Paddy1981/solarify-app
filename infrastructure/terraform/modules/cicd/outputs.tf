# CI/CD Infrastructure Module Outputs

# Artifact Registry
output "artifact_registry" {
  description = "Artifact Registry repository details"
  value = {
    repository_id = google_artifact_registry_repository.container_registry.repository_id
    name         = google_artifact_registry_repository.container_registry.name
    location     = google_artifact_registry_repository.container_registry.location
    format       = google_artifact_registry_repository.container_registry.format
  }
}

# Container Images
output "container_images" {
  description = "Container image URLs"
  value = local.container_images
}

# Source Repository
output "source_repository" {
  description = "Cloud Source Repository details"
  value = var.create_source_repo ? {
    name = google_sourcerepo_repository.source_repo[0].name
    url  = google_sourcerepo_repository.source_repo[0].url
  } : null
}

# Build Triggers
output "build_triggers" {
  description = "Cloud Build trigger details"
  value = {
    for key, trigger in google_cloudbuild_trigger.build_triggers : key => {
      id          = trigger.id
      name        = trigger.name
      description = trigger.description
    }
  }
}

output "staging_deploy_trigger" {
  description = "Staging deployment trigger details"
  value = var.environment == "staging" ? {
    id   = google_cloudbuild_trigger.staging_deploy[0].id
    name = google_cloudbuild_trigger.staging_deploy[0].name
  } : null
}

# Pub/Sub Topics
output "build_notifications_topic" {
  description = "Build notifications Pub/Sub topic"
  value = {
    name = google_pubsub_topic.build_notifications.name
    id   = google_pubsub_topic.build_notifications.id
  }
}

# Worker Pool
output "private_worker_pool" {
  description = "Private Cloud Build worker pool details"
  value = var.create_private_worker_pool ? {
    name     = google_cloudbuild_worker_pool.private_pool[0].name
    location = google_cloudbuild_worker_pool.private_pool[0].location
  } : null
}

# Scheduled Jobs
output "nightly_build_job" {
  description = "Nightly build scheduled job details"
  value = var.enable_nightly_builds ? {
    name     = google_cloud_scheduler_job.nightly_build[0].name
    schedule = google_cloud_scheduler_job.nightly_build[0].schedule
  } : null
}

# Storage Buckets
output "build_cache_bucket" {
  description = "Build cache storage bucket"
  value = {
    name     = google_storage_bucket.build_cache.name
    url      = google_storage_bucket.build_cache.url
    location = google_storage_bucket.build_cache.location
  }
}

output "build_logs_bucket" {
  description = "Build logs storage bucket"
  value = {
    name     = google_storage_bucket.build_logs.name
    url      = google_storage_bucket.build_logs.url
    location = google_storage_bucket.build_logs.location
  }
}

# Binary Authorization
output "binary_authorization_policy" {
  description = "Binary Authorization policy details"
  value = var.enable_binary_authorization ? {
    name = google_binary_authorization_policy.build_policy[0].id
  } : null
}

output "build_attestor" {
  description = "Build attestor details"
  value = var.enable_binary_authorization ? {
    name = google_binary_authorization_attestor.build_attestor[0].name
  } : null
}

# GitHub Enterprise Configuration
output "github_enterprise_config" {
  description = "GitHub Enterprise configuration details"
  value = var.github_enterprise_config.create ? {
    config_id = google_cloudbuild_github_enterprise_config.github_config[0].config_id
    host_url  = var.github_enterprise_config.host_url
  } : null
  sensitive = true
}

# CI/CD Configuration Summary
output "cicd_configuration" {
  description = "CI/CD configuration summary"
  value = {
    environment = var.environment
    
    repository = {
      source_url        = var.source_repository_url
      create_source_repo = var.create_source_repo
      branch_pattern    = var.branch_pattern
    }
    
    build_configuration = {
      machine_type      = var.build_config.machine_type
      timeout_seconds   = var.build_config.timeout_seconds
      registry_location = var.primary_region
    }
    
    features_enabled = {
      binary_authorization  = var.enable_binary_authorization
      private_worker_pool  = var.create_private_worker_pool
      nightly_builds      = var.enable_nightly_builds
      github_enterprise   = var.github_enterprise_config.create
    }
    
    triggers_created = length(local.build_triggers) + (var.environment == "staging" ? 1 : 0)
    
    deployment_target = {
      service_name = var.cloud_run_service_name
      region      = var.primary_region
    }
  }
}

# Build Commands and URLs
output "build_management" {
  description = "Build management commands and URLs"
  value = {
    cloud_build_console = "https://console.cloud.google.com/cloud-build/builds?project=${var.project_id}"
    artifact_registry_console = "https://console.cloud.google.com/artifacts/docker/${var.project_id}/${var.primary_region}/${var.artifact_registry_id}?project=${var.project_id}"
    
    manual_trigger_commands = {
      for key, trigger in google_cloudbuild_trigger.build_triggers : key => 
        "gcloud builds triggers run ${trigger.name} --branch=${split("^", split("$", local.build_triggers[key].branch_pattern)[0])[0] == "main" ? "main" : "develop"}"
    }
    
    image_pull_commands = {
      for name, image in local.container_images : name => 
        "docker pull ${image}:latest"
    }
    
    build_logs_command = "gcloud logging read 'resource.type=build' --limit=50 --format=json"
  }
}

# Security and Compliance
output "security_configuration" {
  description = "Security configuration for CI/CD"
  value = {
    binary_authorization_enabled = var.enable_binary_authorization
    private_worker_pool_enabled = var.create_private_worker_pool
    
    container_security = {
      vulnerability_scanning = true
      image_signing         = var.enable_binary_authorization
      base_image_validation = true
    }
    
    build_security = {
      isolated_builds      = var.create_private_worker_pool
      secrets_management   = true
      audit_logging       = true
      source_provenance   = true
    }
    
    compliance_features = {
      build_attestation    = var.enable_binary_authorization
      audit_trail         = true
      access_controls     = true
      encryption_at_rest  = true
    }
  }
}

# Performance Metrics
output "performance_configuration" {
  description = "Performance configuration and recommendations"
  value = {
    build_optimization = {
      cache_enabled        = var.build_cache_config.enable_cache
      parallel_builds     = var.test_config.parallel_test_execution
      machine_type        = var.build_config.machine_type
      timeout_configured  = var.build_config.timeout_seconds
    }
    
    deployment_strategy = {
      strategy_type       = var.deployment_strategy.strategy_type
      rollout_percentage  = var.deployment_strategy.rollout_percentage
      health_check_timeout = var.deployment_strategy.health_check_timeout
    }
    
    quality_gates = var.quality_gates
    
    recommendations = [
      "Use build caching to improve build performance",
      "Enable parallel test execution for faster feedback",
      "Configure appropriate build timeouts",
      "Use private worker pools for sensitive builds",
      "Implement progressive deployment strategies",
      "Monitor build performance and optimize bottlenecks"
    ]
  }
}

# Troubleshooting Information
output "troubleshooting_info" {
  description = "Troubleshooting information for CI/CD pipeline"
  value = {
    common_issues = {
      build_failures = {
        description = "Build fails due to test failures or compilation errors"
        troubleshooting = [
          "Check build logs in Cloud Build console",
          "Verify all dependencies are available",
          "Check for environment-specific configuration issues",
          "Review test failures and fix failing tests"
        ]
      }
      
      deployment_failures = {
        description = "Deployment fails to Cloud Run"
        troubleshooting = [
          "Verify service account permissions",
          "Check Cloud Run service configuration",
          "Validate container image exists in registry",
          "Review deployment logs for specific errors"
        ]
      }
      
      permission_issues = {
        description = "Permission denied errors during build or deployment"
        troubleshooting = [
          "Verify build service account has required roles",
          "Check IAM bindings for Cloud Build",
          "Ensure Artifact Registry permissions are correct",
          "Review Cloud Run deployment permissions"
        ]
      }
    }
    
    log_queries = {
      build_failures = "resource.type=\"build\" AND severity>=ERROR",
      slow_builds = "resource.type=\"build\" AND jsonPayload.timing.total>1800",
      deployment_issues = "resource.type=\"cloud_run_revision\" AND severity>=WARNING"
    }
    
    monitoring_dashboards = [
      "Cloud Build build history and performance",
      "Artifact Registry usage and storage metrics",
      "Cloud Run deployment success rates"
    ]
  }
}