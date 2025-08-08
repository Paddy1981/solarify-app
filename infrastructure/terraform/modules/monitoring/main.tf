# Monitoring and Observability Module - Comprehensive monitoring for Solarify
# Provides alerting, logging, metrics, and observability infrastructure

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Local variables for monitoring configuration
locals {
  # Notification channel configurations
  notification_channels_config = {
    for key, config in var.notification_channels : key => {
      type    = config.type
      labels  = config.labels
      enabled = config.enabled
    }
  }

  # Alert policy configurations
  alert_policies = {
    # Application performance alerts
    high_error_rate = {
      display_name = "High Error Rate"
      conditions = [{
        display_name = "Error rate above threshold"
        filter       = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=~\"${var.environment_prefix}-.*\""
        threshold    = var.alert_thresholds.error_rate_threshold
        duration     = "300s"
        comparison   = "COMPARISON_GREATER_THAN"
      }]
    }
    
    high_latency = {
      display_name = "High Response Latency"
      conditions = [{
        display_name = "Response latency above threshold"
        filter       = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=~\"${var.environment_prefix}-.*\""
        threshold    = var.alert_thresholds.latency_threshold_seconds
        duration     = "300s"
        comparison   = "COMPARISON_GREATER_THAN"
      }]
    }
    
    low_uptime = {
      display_name = "Low Application Uptime"
      conditions = [{
        display_name = "Uptime below target"
        filter       = "resource.type=\"uptime_url\""
        threshold    = var.alert_thresholds.system_uptime_target
        duration     = "300s"
        comparison   = "COMPARISON_LESS_THAN"
      }]
    }

    # Resource utilization alerts
    high_cpu_usage = {
      display_name = "High CPU Usage"
      conditions = [{
        display_name = "CPU utilization above threshold"
        filter       = "resource.type=\"cloud_run_revision\""
        threshold    = var.alert_thresholds.cpu_utilization_threshold
        duration     = "300s"
        comparison   = "COMPARISON_GREATER_THAN"
      }]
    }

    high_memory_usage = {
      display_name = "High Memory Usage"
      conditions = [{
        display_name = "Memory utilization above threshold"
        filter       = "resource.type=\"cloud_run_revision\""
        threshold    = var.alert_thresholds.memory_utilization_threshold
        duration     = "600s"
        comparison   = "COMPARISON_GREATER_THAN"
      }]
    }

    # Business logic alerts
    low_rfq_creation = {
      display_name = "Low RFQ Creation Rate"
      conditions = [{
        display_name = "RFQ creation below minimum threshold"
        filter       = "resource.type=\"global\" AND metric.type=\"custom.googleapis.com/rfq/creation_rate\""
        threshold    = var.alert_thresholds.rfq_creation_rate_min
        duration     = "3600s"
        comparison   = "COMPARISON_LESS_THAN"
      }]
    }

    slow_quote_response = {
      display_name = "Slow Quote Response Time"
      conditions = [{
        display_name = "Quote response time exceeds threshold"
        filter       = "resource.type=\"global\" AND metric.type=\"custom.googleapis.com/quote/response_time\""
        threshold    = var.alert_thresholds.quote_response_rate_max
        duration     = "600s"
        comparison   = "COMPARISON_GREATER_THAN"
      }]
    }
  }
}

# Notification Channels
resource "google_monitoring_notification_channel" "channels" {
  for_each = local.notification_channels_config

  display_name = title("${each.key} Alert Channel")
  type         = each.value.type
  labels       = each.value.labels
  enabled      = each.value.enabled
  project      = var.project_id

  user_labels = var.labels
}

# Alert Policies
resource "google_monitoring_alert_policy" "alert_policies" {
  for_each = local.alert_policies

  display_name = each.value.display_name
  project      = var.project_id
  enabled      = true

  combiner = "OR"

  dynamic "conditions" {
    for_each = each.value.conditions
    content {
      display_name = conditions.value.display_name

      condition_threshold {
        filter         = conditions.value.filter
        duration       = conditions.value.duration
        comparison     = conditions.value.comparison
        threshold_value = conditions.value.threshold

        aggregations {
          alignment_period   = "300s"
          per_series_aligner = "ALIGN_RATE"
        }
      }
    }
  }

  # Notification channels
  notification_channels = [
    for channel in google_monitoring_notification_channel.channels : channel.name
  ]

  # Documentation
  documentation {
    content   = "Alert triggered for ${each.value.display_name}. Check the application logs and metrics for more details."
    mime_type = "text/markdown"
  }

  user_labels = var.labels
}

# Uptime Checks
resource "google_monitoring_uptime_check_config" "uptime_checks" {
  count = var.monitoring_config.enable_uptime_checks ? length(var.uptime_check_urls) : 0

  display_name = "${var.environment_prefix}-uptime-check-${count.index}"
  timeout      = "10s"
  period       = "60s"
  project      = var.project_id

  http_check {
    path           = "/api/health"
    port           = "443"
    use_ssl        = true
    validate_ssl   = true
    request_method = "GET"
    
    accepted_response_status_codes {
      status_class = "STATUS_CLASS_2XX"
    }
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = replace(var.uptime_check_urls[count.index], "https://", "")
    }
  }

  user_labels = var.labels
}

# Custom Metrics for Business Logic
resource "google_logging_metric" "custom_metrics" {
  for_each = {
    rfq_creation_rate = {
      filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.event_type=\"rfq_created\""
      description = "Rate of RFQ creation"
    }
    quote_response_time = {
      filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.event_type=\"quote_submitted\""
      description = "Time taken to respond to RFQ with quote"
    }
    user_registration_rate = {
      filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.event_type=\"user_registered\""
      description = "Rate of user registration"
    }
    system_performance = {
      filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.event_type=\"system_performance\""
      description = "Solar system performance metrics"
    }
  }

  name   = "${var.environment_prefix}-${each.key}"
  filter = each.value.filter
  project = var.project_id

  metric_descriptor {
    metric_kind = "GAUGE"
    value_type  = "DOUBLE"
    unit        = "1"
    display_name = each.value.description
  }

  value_extractor = "EXTRACT(jsonPayload.value)"

  label_extractors = {
    user_id = "EXTRACT(jsonPayload.user_id)"
    region  = "EXTRACT(resource.labels.location)"
  }
}

# Dashboards
resource "google_monitoring_dashboard" "main_dashboard" {
  dashboard_json = jsonencode({
    displayName = "Solarify ${var.environment} Dashboard"
    mosaicLayout = {
      tiles = [
        # Application Health Tile
        {
          width  = 6
          height = 4
          widget = {
            title = "Application Health"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=~\"${var.environment_prefix}-.*\""
                    }
                  }
                  plotType = "LINE"
                }
              ]
              timeshiftDuration = "0s"
              yAxis = {
                label = "Requests/sec"
                scale = "LINEAR"
              }
            }
          }
        },
        # Error Rate Tile
        {
          width  = 6
          height = 4
          widget = {
            title = "Error Rate"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
                    }
                  }
                  plotType = "LINE"
                }
              ]
            }
          }
        },
        # Business Metrics Tile
        {
          width  = 12
          height = 4
          widget = {
            title = "Business Metrics"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/rfq/creation_rate\""
                    }
                  }
                  plotType = "LINE"
                }
              ]
            }
          }
        },
        # Resource Utilization Tile
        {
          width  = 6
          height = 4
          widget = {
            title = "Resource Utilization"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/cpu/utilizations\""
                    }
                  }
                  plotType = "LINE"
                }
              ]
            }
          }
        },
        # Storage Usage Tile
        {
          width  = 6
          height = 4
          widget = {
            title = "Storage Usage"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"gcs_bucket\" AND metric.type=\"storage.googleapis.com/storage/total_bytes\""
                    }
                  }
                  plotType = "STACKED_AREA"
                }
              ]
            }
          }
        }
      ]
    }
  })
  project = var.project_id
}

# Performance Dashboard
resource "google_monitoring_dashboard" "performance_dashboard" {
  dashboard_json = jsonencode({
    displayName = "Solarify Performance Dashboard"
    mosaicLayout = {
      tiles = [
        {
          width  = 12
          height = 4
          widget = {
            title = "Response Time Distribution"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
                    }
                  }
                  plotType = "LINE"
                }
              ]
            }
          }
        },
        {
          width  = 6
          height = 4
          widget = {
            title = "Database Performance"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"global\" AND metric.type=\"firestore.googleapis.com/api/request_count\""
                    }
                  }
                  plotType = "LINE"
                }
              ]
            }
          }
        },
        {
          width  = 6
          height = 4
          widget = {
            title = "Cache Hit Rate"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"redis_instance\" AND metric.type=\"redis.googleapis.com/stats/cache_hit_ratio\""
                    }
                  }
                  plotType = "LINE"
                }
              ]
            }
          }
        }
      ]
    }
  })
  project = var.project_id
}

# Log-based Metrics for Error Tracking
resource "google_logging_metric" "error_metrics" {
  for_each = {
    application_errors = {
      filter      = "resource.type=\"cloud_run_revision\" AND severity>=ERROR"
      description = "Count of application errors"
    }
    authentication_failures = {
      filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.event_type=\"auth_failure\""
      description = "Authentication failure count"
    }
    payment_failures = {
      filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.event_type=\"payment_failure\""
      description = "Payment processing failure count"
    }
  }

  name   = "${var.environment_prefix}-${each.key}"
  filter = each.value.filter
  project = var.project_id

  metric_descriptor {
    metric_kind = "GAUGE"
    value_type  = "INT64"
    display_name = each.value.description
  }

  label_extractors = {
    error_type = "EXTRACT(jsonPayload.error_type)"
    user_id    = "EXTRACT(jsonPayload.user_id)"
  }
}

# Log Routing and Storage
resource "google_logging_sink" "app_logs_sink" {
  name        = "${var.environment_prefix}-app-logs"
  destination = "storage.googleapis.com/${var.environment_prefix}-app-logs"
  project     = var.project_id

  # Include application logs
  filter = <<-EOT
    resource.type="cloud_run_revision" AND
    resource.labels.service_name=~"${var.environment_prefix}-.*"
  EOT

  unique_writer_identity = true
}

resource "google_logging_sink" "audit_logs_sink" {
  name        = "${var.environment_prefix}-audit-logs"
  destination = "storage.googleapis.com/${var.environment_prefix}-audit-logs"
  project     = var.project_id

  # Include audit logs
  filter = <<-EOT
    protoPayload.serviceName="cloudresourcemanager.googleapis.com" OR
    protoPayload.serviceName="iam.googleapis.com" OR
    protoPayload.serviceName="secretmanager.googleapis.com"
  EOT

  unique_writer_identity = true
}

# Storage buckets for log storage
resource "google_storage_bucket" "logs_buckets" {
  for_each = toset(["app-logs", "audit-logs", "security-logs"])

  name          = "${var.environment_prefix}-${each.key}"
  location      = var.primary_region
  storage_class = "NEARLINE"
  project       = var.project_id

  lifecycle_rule {
    condition {
      age = var.log_retention_days
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  public_access_prevention = "enforced"
  uniform_bucket_level_access = true

  labels = var.labels
}

# Error Reporting
resource "google_error_reporting_service" "error_reporting" {
  count = var.monitoring_config.enable_error_reporting ? 1 : 0

  project = var.project_id
  service = "${var.environment_prefix}-app"
}

# SLOs (Service Level Objectives)
resource "google_monitoring_slo" "availability_slo" {
  service = google_monitoring_service.solarify_service.service_id
  slo_id  = "availability-slo"
  project = var.project_id

  display_name = "99.9% Availability SLO"

  goal                = 0.999
  calendar_period     = "MONTH"
  rolling_period_days = 30

  request_based_sli {
    good_total_ratio {
      total_service_filter = "resource.type=\"cloud_run_revision\""
      good_service_filter  = "resource.type=\"cloud_run_revision\" AND metric.labels.response_code!~\"5.*\""
    }
  }
}

resource "google_monitoring_slo" "latency_slo" {
  service = google_monitoring_service.solarify_service.service_id
  slo_id  = "latency-slo"
  project = var.project_id

  display_name = "95% requests under 2s SLO"

  goal                = 0.95
  calendar_period     = "MONTH"
  rolling_period_days = 30

  request_based_sli {
    distribution_cut {
      distribution_filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
      range {
        max = var.alert_thresholds.latency_threshold_seconds
      }
    }
  }
}

# Service definition for SLOs
resource "google_monitoring_service" "solarify_service" {
  service_id   = "${var.environment_prefix}-service"
  display_name = "Solarify ${var.environment} Service"
  project      = var.project_id

  user_labels = var.labels
}

# Cloud Trace (if enabled)
resource "google_project_service" "trace_api" {
  count = var.monitoring_config.enable_tracing ? 1 : 0

  project = var.project_id
  service = "cloudtrace.googleapis.com"

  disable_on_destroy = false
}

# Cloud Profiler (if enabled)
resource "google_project_service" "profiler_api" {
  count = var.monitoring_config.enable_profiling ? 1 : 0

  project = var.project_id
  service = "cloudprofiler.googleapis.com"

  disable_on_destroy = false
}