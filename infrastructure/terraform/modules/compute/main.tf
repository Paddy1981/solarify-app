# Compute Infrastructure Module - Cloud Run, Load Balancers, Auto-scaling
# Provides scalable compute resources for the Solarify application

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
  service_name = "${var.environment_prefix}-app"
  
  # Cloud Run configuration
  cloud_run_config = {
    cpu_limit      = var.instance_config.cpu_limit
    memory_limit   = var.instance_config.memory_limit
    min_instances  = var.instance_config.min_instances
    max_instances  = var.instance_config.max_instances
  }
  
  # Environment variables for the application
  env_vars = {
    NODE_ENV              = var.environment
    PORT                  = tostring(var.application_port)
    GOOGLE_CLOUD_PROJECT  = var.project_id
    FIREBASE_PROJECT_ID   = var.project_id
    # Add more environment variables as needed
  }
}

# Artifact Registry Repository for container images
resource "google_artifact_registry_repository" "container_registry" {
  location      = var.primary_region
  repository_id = "${var.environment_prefix}-registry"
  description   = "Container registry for ${var.environment} environment"
  format        = "DOCKER"

  labels = var.labels
}

# Cloud Run Service
resource "google_cloud_run_v2_service" "app_service" {
  name     = local.service_name
  location = var.primary_region

  # Deletion protection for production
  deletion_protection = var.environment == "production" ? true : false

  template {
    # Service account
    service_account = var.service_account_email
    
    # Execution environment
    execution_environment = "EXECUTION_ENVIRONMENT_GEN2"
    
    # Timeout
    timeout = "300s"
    
    # Scaling configuration
    scaling {
      min_instance_count = local.cloud_run_config.min_instances
      max_instance_count = local.cloud_run_config.max_instances
    }

    # VPC configuration
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }

    # Container configuration
    containers {
      image = var.application_image
      
      # Resource limits
      resources {
        limits = {
          cpu    = local.cloud_run_config.cpu_limit
          memory = local.cloud_run_config.memory_limit
        }
        
        cpu_idle = true
        startup_cpu_boost = true
      }

      # Port configuration
      ports {
        name           = "http1"
        container_port = var.application_port
      }

      # Environment variables
      dynamic "env" {
        for_each = local.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      # Health checks
      liveness_probe {
        http_get {
          path = var.health_check_path
          port = var.application_port
          
          http_headers {
            name  = "User-Agent"
            value = "GoogleHC/1.0"
          }
        }
        initial_delay_seconds = 30
        timeout_seconds      = 5
        period_seconds       = 30
        failure_threshold    = 3
      }

      startup_probe {
        http_get {
          path = var.health_check_path
          port = var.application_port
        }
        initial_delay_seconds = 10
        timeout_seconds      = 5
        period_seconds       = 10
        failure_threshold    = 6
      }
    }
    
    # Annotations for additional configuration
    annotations = {
      "autoscaling.knative.dev/maxScale"         = tostring(local.cloud_run_config.max_instances)
      "autoscaling.knative.dev/minScale"         = tostring(local.cloud_run_config.min_instances)
      "run.googleapis.com/cpu-throttling"        = "false"
      "run.googleapis.com/execution-environment" = "gen2"
      "run.googleapis.com/vpc-access-egress"     = "all-traffic"
    }

    labels = var.labels
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  labels = var.labels
}

# VPC Connector for Cloud Run to access VPC resources
resource "google_vpc_access_connector" "connector" {
  name          = "${var.environment_prefix}-vpc-connector"
  region        = var.primary_region
  network       = var.vpc_id
  ip_cidr_range = "10.8.0.0/28"  # Small range for connector
  
  min_instances = 2
  max_instances = 10
  
  # Machine type
  machine_type = var.environment == "production" ? "e2-standard-4" : "e2-micro"
}

# IAM policy to allow public access (if needed)
resource "google_cloud_run_v2_service_iam_binding" "public_access" {
  count = var.enable_public_access ? 1 : 0
  
  location = google_cloud_run_v2_service.app_service.location
  name     = google_cloud_run_v2_service.app_service.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}

# Load Balancer Components
# Backend service for Cloud Run
resource "google_compute_region_network_endpoint_group" "cloudrun_neg" {
  name         = "${var.environment_prefix}-cloudrun-neg"
  network_endpoint_type = "SERVERLESS"
  region       = var.primary_region

  cloud_run {
    service = google_cloud_run_v2_service.app_service.name
  }
}

# Backend service
resource "google_compute_backend_service" "app_backend" {
  name                    = "${var.environment_prefix}-backend-service"
  description            = "Backend service for ${var.environment} application"
  protocol               = "HTTP"
  port_name              = "http"
  timeout_sec            = 30
  enable_cdn             = var.enable_cdn
  
  # Health check
  health_checks = [google_compute_health_check.app_health_check.id]
  
  # Backend configuration
  backend {
    group = google_compute_region_network_endpoint_group.cloudrun_neg.id
  }
  
  # Log configuration
  log_config {
    enable      = true
    sample_rate = 1.0
  }

  # Enhanced CDN configuration for global performance
  dynamic "cdn_policy" {
    for_each = var.enable_cdn ? [1] : []
    content {
      cache_mode                   = "CACHE_ALL_STATIC"
      default_ttl                  = 3600    # 1 hour
      max_ttl                      = 86400   # 24 hours
      client_ttl                   = 3600    # Client cache TTL
      negative_caching             = true
      negative_caching_policy {
        code = 404
        ttl  = 300  # 5 minutes for 404s
      }
      negative_caching_policy {
        code = 500
        ttl  = 60   # 1 minute for 500s
      }
      
      cache_key_policy {
        include_host           = true
        include_protocol       = true
        include_query_string   = false
        include_http_headers   = ["Accept-Encoding", "Accept-Language"]
        query_string_whitelist = ["v", "version", "lang"]
      }
      
      # Compression for better performance
      compression_mode = "AUTOMATIC"
      
      # Enable serving stale content while revalidating
      serve_while_stale = 86400  # 24 hours
      
      # Bypass cache for authenticated requests
      bypass_cache_on_request_headers = ["Authorization", "Cookie"]
    }
  }

  # Security policy
  security_policy = var.security_policy_name
}

# Health check for the backend service
resource "google_compute_health_check" "app_health_check" {
  name               = "${var.environment_prefix}-health-check"
  description        = "Health check for application"
  timeout_sec        = 5
  check_interval_sec = 30

  http_health_check {
    port         = var.application_port
    request_path = var.health_check_path
  }
}

# URL Map for routing
resource "google_compute_url_map" "app_url_map" {
  name        = "${var.environment_prefix}-url-map"
  description = "URL map for ${var.environment} application"
  
  default_service = google_compute_backend_service.app_backend.id

  # Host rules for different domains
  dynamic "host_rule" {
    for_each = var.domain_name != "" ? [1] : []
    content {
      hosts        = [var.domain_name]
      path_matcher = "allpaths"
    }
  }

  # Path matchers
  dynamic "path_matcher" {
    for_each = var.domain_name != "" ? [1] : []
    content {
      name            = "allpaths"
      default_service = google_compute_backend_service.app_backend.id
    }
  }
}

# SSL Certificate (if SSL is enabled)
resource "google_compute_managed_ssl_certificate" "app_ssl_cert" {
  count = var.enable_ssl && var.domain_name != "" ? 1 : 0
  
  name = "${var.environment_prefix}-ssl-cert"
  
  managed {
    domains = [var.domain_name]
  }
}

# HTTPS Proxy with HTTP/3 (QUIC) support
resource "google_compute_target_https_proxy" "https_proxy" {
  count = var.enable_ssl ? 1 : 0
  
  name    = "${var.environment_prefix}-https-proxy"
  url_map = google_compute_url_map.app_url_map.id
  
  ssl_certificates = var.domain_name != "" ? [
    google_compute_managed_ssl_certificate.app_ssl_cert[0].id
  ] : []
  
  ssl_policy = var.ssl_policy_name
  
  # Enable HTTP/3 (QUIC) for better performance
  quic_override = "ENABLE"
  
  # Enable HTTP/2 for better performance
  http_keep_alive_timeout_sec = 600
}

# HTTP Proxy
resource "google_compute_target_http_proxy" "http_proxy" {
  name    = "${var.environment_prefix}-http-proxy"
  url_map = google_compute_url_map.app_url_map.id
}

# Global Static IP Address for CDN and Load Balancer
resource "google_compute_global_address" "app_ip" {
  name         = "${var.environment_prefix}-global-ip"
  ip_version   = "IPV4"
  address_type = "EXTERNAL"
  
  labels = var.labels
}

# Global Forwarding Rules
resource "google_compute_global_forwarding_rule" "https_forwarding_rule" {
  count = var.enable_ssl ? 1 : 0
  
  name       = "${var.environment_prefix}-https-forwarding-rule"
  target     = google_compute_target_https_proxy.https_proxy[0].id
  port_range = "443"
  ip_address = google_compute_global_address.app_ip.address
  
  labels = var.labels
}

resource "google_compute_global_forwarding_rule" "http_forwarding_rule" {
  name       = "${var.environment_prefix}-http-forwarding-rule"
  target     = google_compute_target_http_proxy.http_proxy.id
  port_range = "80"
  ip_address = google_compute_global_address.app_ip.address
  
  labels = var.labels
}

# Cloud Scheduler for periodic tasks (if needed)
resource "google_cloud_scheduler_job" "periodic_tasks" {
  count = var.enable_scheduled_tasks ? 1 : 0
  
  name        = "${var.environment_prefix}-periodic-tasks"
  description = "Periodic maintenance tasks"
  schedule    = "0 */6 * * *"  # Every 6 hours
  time_zone   = "UTC"
  region      = var.primary_region

  http_target {
    uri = "${google_cloud_run_v2_service.app_service.uri}/api/tasks/periodic"
    http_method = "POST"
    
    headers = {
      "Content-Type" = "application/json"
    }

    oidc_token {
      service_account_email = var.service_account_email
      audience             = google_cloud_run_v2_service.app_service.uri
    }
  }

  retry_config {
    retry_count = 3
  }
}

# Eventarc Trigger for Firestore events (if needed)
resource "google_eventarc_trigger" "firestore_trigger" {
  count = var.enable_eventarc ? 1 : 0
  
  name     = "${var.environment_prefix}-firestore-trigger"
  location = var.primary_region

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.firestore.document.v1.written"
  }

  matching_criteria {
    attribute = "database"
    value     = "(default)"
  }

  destination {
    cloud_run_service {
      service = google_cloud_run_v2_service.app_service.name
      region  = var.primary_region
    }
  }

  service_account = var.service_account_email
}

# Logging configuration
resource "google_logging_sink" "app_logs" {
  name        = "${var.environment_prefix}-app-logs"
  destination = "storage.googleapis.com/${var.environment_prefix}-app-logs"

  # Log all application logs
  filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_v2_service.app_service.name}\""

  # Create a service account for the sink
  unique_writer_identity = true
}