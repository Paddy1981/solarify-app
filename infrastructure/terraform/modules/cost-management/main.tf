# Cost Management Module - Budget monitoring, alerts, and optimization
# Provides comprehensive cost management and optimization for Solarify

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Local variables for cost management
locals {
  # Budget thresholds with different alert levels
  budget_alert_thresholds = [
    {
      threshold_percent = 0.5   # 50% - Warning
      spend_basis      = "CURRENT_SPEND"
      alert_type      = "warning"
    },
    {
      threshold_percent = 0.8   # 80% - Alert
      spend_basis      = "CURRENT_SPEND" 
      alert_type      = "alert"
    },
    {
      threshold_percent = 0.95  # 95% - Critical
      spend_basis      = "CURRENT_SPEND"
      alert_type      = "critical"
    },
    {
      threshold_percent = 1.0   # 100% - Forecasted overspend
      spend_basis      = "FORECASTED_SPEND"
      alert_type      = "forecast"
    }
  ]

  # Service-specific budgets for better cost tracking
  service_budgets = {
    compute = {
      name = "${var.environment_prefix}-compute-budget"
      amount = var.budget_config.amount * 0.4  # 40% for compute
      services = [
        "services/6F81-5844-456A",  # Cloud Run
        "services/95FF-2EF5-5EA1"   # Cloud Functions
      ]
    }
    storage = {
      name = "${var.environment_prefix}-storage-budget"
      amount = var.budget_config.amount * 0.3  # 30% for storage
      services = [
        "services/95FF-2EF5-5EA1",  # Cloud Storage
        "services/E505-1604-58F8"   # Firestore
      ]
    }
    networking = {
      name = "${var.environment_prefix}-network-budget"
      amount = var.budget_config.amount * 0.2  # 20% for networking
      services = [
        "services/5467-2A17-D0A1",  # Load Balancing
        "services/58CD-8F40-E913"   # Cloud CDN
      ]
    }
    other = {
      name = "${var.environment_prefix}-other-budget"
      amount = var.budget_config.amount * 0.1  # 10% for other services
      services = []  # All other services
    }
  }
}

# Main project budget
resource "google_billing_budget" "project_budget" {
  billing_account = var.billing_account_id
  display_name    = "${var.environment_prefix} Project Budget"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = var.budget_config.currency_code
      units         = tostring(floor(var.budget_config.amount))
    }
  }

  # Multiple threshold rules for different alert levels
  dynamic "threshold_rules" {
    for_each = local.budget_alert_thresholds
    content {
      threshold_percent = threshold_rules.value.threshold_percent
      spend_basis      = threshold_rules.value.spend_basis
    }
  }

  # All updates trigger notifications
  all_updates_rule {
    pubsub_topic = google_pubsub_topic.budget_alerts.id
    
    # Schema version
    schema_version = "1.0"
  }

  labels = var.labels
}

# Service-specific budgets for granular cost tracking
resource "google_billing_budget" "service_budgets" {
  for_each = local.service_budgets

  billing_account = var.billing_account_id
  display_name    = each.value.name

  budget_filter {
    projects = ["projects/${var.project_id}"]
    services = each.value.services
  }

  amount {
    specified_amount {
      currency_code = var.budget_config.currency_code
      units         = tostring(floor(each.value.amount))
    }
  }

  threshold_rules {
    threshold_percent = 0.8
    spend_basis      = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 1.0
    spend_basis      = "FORECASTED_SPEND"
  }

  all_updates_rule {
    pubsub_topic = google_pubsub_topic.budget_alerts.id
    schema_version = "1.0"
  }

  labels = merge(var.labels, {
    service_category = each.key
  })
}

# Pub/Sub topic for budget alerts
resource "google_pubsub_topic" "budget_alerts" {
  name = "${var.environment_prefix}-budget-alerts"

  labels = var.labels
}

# Pub/Sub subscription for budget alert processing
resource "google_pubsub_subscription" "budget_alert_processor" {
  name  = "${var.environment_prefix}-budget-alert-processor"
  topic = google_pubsub_topic.budget_alerts.name

  # Message retention for 7 days
  message_retention_duration = "604800s"

  # Acknowledgment deadline
  ack_deadline_seconds = 300

  # Retry policy
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  # Dead letter policy
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.budget_dead_letter.id
    max_delivery_attempts = 5
  }

  labels = var.labels
}

resource "google_pubsub_topic" "budget_dead_letter" {
  name = "${var.environment_prefix}-budget-dead-letter"

  labels = var.labels
}

# Cloud Function for budget alert processing and cost optimization
resource "google_cloudfunctions2_function" "cost_optimizer" {
  name     = "${var.environment_prefix}-cost-optimizer"
  location = var.primary_region

  build_config {
    runtime     = "python39"
    entry_point = "process_budget_alert"

    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.function_source.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    min_instance_count = 0
    
    available_memory   = "256M"
    timeout_seconds    = 300
    
    environment_variables = {
      PROJECT_ID = var.project_id
      ENVIRONMENT = var.environment
    }
    
    service_account_email = google_service_account.cost_optimizer.email
  }

  event_trigger {
    trigger_region = var.primary_region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.budget_alerts.id
    
    retry_policy = "RETRY_POLICY_RETRY"
  }
}

# Service account for cost optimizer function
resource "google_service_account" "cost_optimizer" {
  account_id   = "${var.environment_prefix}-cost-optimizer"
  display_name = "Cost Optimizer Service Account"
  description  = "Service account for automated cost optimization"
}

# IAM bindings for cost optimizer
resource "google_project_iam_member" "cost_optimizer_roles" {
  for_each = toset([
    "roles/compute.viewer",
    "roles/run.viewer", 
    "roles/storage.admin",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
    "roles/cloudsql.viewer",
    "roles/redis.viewer"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cost_optimizer.email}"
}

# Storage bucket for function source code
resource "google_storage_bucket" "function_source" {
  name          = "${var.environment_prefix}-function-source"
  location      = var.primary_region
  storage_class = "STANDARD"

  uniform_bucket_level_access = true

  labels = var.labels
}

# Function source code
resource "google_storage_bucket_object" "function_source" {
  name   = "cost-optimizer-source.zip"
  bucket = google_storage_bucket.function_source.name
  source = data.archive_file.function_source.output_path
}

# Create function source code archive
data "archive_file" "function_source" {
  type        = "zip"
  output_path = "/tmp/cost-optimizer-source.zip"
  
  source {
    content = templatefile("${path.module}/function_source/main.py.tpl", {
      project_id = var.project_id
    })
    filename = "main.py"
  }
  
  source {
    content = file("${path.module}/function_source/requirements.txt")
    filename = "requirements.txt"
  }
}

# Cost anomaly detection using Cloud Monitoring
resource "google_monitoring_alert_policy" "cost_anomaly_alert" {
  display_name = "Cost Anomaly Detection - ${var.environment}"
  
  conditions {
    display_name = "Unusual cost spike detected"

    condition_threshold {
      filter         = "resource.type=\"billing_account\""
      duration       = "3600s"  # 1 hour
      comparison     = "COMPARISON_GREATER_THAN"
      threshold_value = var.budget_config.amount * 0.1  # 10% of daily budget

      aggregations {
        alignment_period     = "3600s"
        per_series_aligner  = "ALIGN_SUM"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = var.budget_notification_emails

  documentation {
    content = "Unusual cost spike detected. This may indicate a configuration issue or unexpected usage."
  }

  user_labels = var.labels
}

# Resource utilization monitoring for cost optimization
resource "google_monitoring_alert_policy" "low_utilization_alert" {
  display_name = "Low Resource Utilization Alert"
  
  conditions {
    display_name = "Low CPU utilization on expensive resources"

    condition_threshold {
      filter         = "resource.type=\"gce_instance\" OR resource.type=\"cloud_sql_database\""
      duration       = "7200s"  # 2 hours
      comparison     = "COMPARISON_LESS_THAN"
      threshold_value = 0.1  # 10% utilization

      aggregations {
        alignment_period     = "300s"
        per_series_aligner  = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
      }
    }
  }

  notification_channels = var.budget_notification_emails

  documentation {
    content = "Low resource utilization detected. Consider scaling down or right-sizing resources."
  }

  user_labels = var.labels
}

# Scheduled cost reports
resource "google_cloud_scheduler_job" "weekly_cost_report" {
  name         = "${var.environment_prefix}-weekly-cost-report"
  description  = "Weekly cost analysis and optimization report"
  schedule     = "0 9 * * 1"  # Monday 9 AM
  time_zone    = "UTC"
  region       = var.primary_region

  http_target {
    uri         = google_cloudfunctions2_function.cost_optimizer.service_config[0].uri
    http_method = "POST"
    
    headers = {
      "Content-Type" = "application/json"
    }

    body = base64encode(jsonencode({
      report_type = "weekly_summary"
      environment = var.environment
    }))

    oidc_token {
      service_account_email = google_service_account.cost_optimizer.email
    }
  }

  retry_config {
    retry_count = 2
  }
}

# Cost optimization recommendations using Cloud Asset Inventory
resource "google_cloud_asset_project_feed" "cost_optimization_feed" {
  project      = var.project_id
  feed_id      = "${var.environment_prefix}-cost-optimization-feed"
  content_type = "RESOURCE"

  asset_types = [
    "compute.googleapis.com/Instance",
    "run.googleapis.com/Service",
    "redis.googleapis.com/Instance",
    "sqladmin.googleapis.com/Instance",
    "storage.googleapis.com/Bucket"
  ]

  feed_output_config {
    pubsub_destination {
      topic = google_pubsub_topic.asset_changes.id
    }
  }
}

resource "google_pubsub_topic" "asset_changes" {
  name = "${var.environment_prefix}-asset-changes"

  labels = var.labels
}

# BigQuery dataset for cost analysis
resource "google_bigquery_dataset" "cost_analysis" {
  dataset_id    = "${replace(var.environment_prefix, "-", "_")}_cost_analysis"
  friendly_name = "Cost Analysis Dataset"
  description   = "Dataset for cost analysis and optimization"
  location      = "US"

  # Default table expiration (30 days for cost data)
  default_table_expiration_ms = 2592000000  # 30 days

  labels = var.labels
}

# Data export to BigQuery for cost analysis
resource "google_bigquery_data_transfer_config" "billing_export" {
  count = var.cost_optimization.enable_detailed_billing_export ? 1 : 0

  display_name   = "${var.environment_prefix}-billing-export"
  location       = "US"
  data_source_id = "scheduled_query"
  
  destination_dataset_id = google_bigquery_dataset.cost_analysis.dataset_id

  schedule = "every 24 hours"
  
  params = {
    query = templatefile("${path.module}/queries/cost_analysis.sql", {
      project_id = var.project_id
    })
  }
}

# Cost optimization dashboard
resource "google_monitoring_dashboard" "cost_dashboard" {
  dashboard_json = jsonencode({
    displayName = "Cost Management Dashboard - ${var.environment}"
    mosaicLayout = {
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Daily Spend"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"billing_account\""
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
            title = "Service Cost Breakdown"
            pieChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"gcp_billing_account\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          width  = 12
          height = 4
          widget = {
            title = "Budget vs Actual Spend"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"billing.googleapis.com/billing/total_cost\""
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
}