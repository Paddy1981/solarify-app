# Monitoring and Observability Module Outputs

# Notification Channels
output "notification_channels" {
  description = "Created notification channels"
  value = {
    for key, channel in google_monitoring_notification_channel.channels : key => {
      name         = channel.name
      display_name = channel.display_name
      type         = channel.type
      enabled      = channel.enabled
    }
  }
}

# Alert Policies
output "alert_policies" {
  description = "Created alert policies"
  value = {
    for key, policy in google_monitoring_alert_policy.alert_policies : key => {
      name         = policy.name
      display_name = policy.display_name
      enabled      = policy.enabled
    }
  }
}

# Uptime Checks
output "uptime_checks" {
  description = "Created uptime check configurations"
  value = [
    for check in google_monitoring_uptime_check_config.uptime_checks : {
      name         = check.name
      display_name = check.display_name
      period       = check.period
      timeout      = check.timeout
    }
  ]
}

# Custom Metrics
output "custom_metrics" {
  description = "Created custom log-based metrics"
  value = {
    for key, metric in google_logging_metric.custom_metrics : key => {
      name   = metric.name
      filter = metric.filter
    }
  }
}

output "error_metrics" {
  description = "Created error tracking metrics"
  value = {
    for key, metric in google_logging_metric.error_metrics : key => {
      name   = metric.name
      filter = metric.filter
    }
  }
}

# Dashboards
output "main_dashboard_url" {
  description = "URL to the main monitoring dashboard"
  value       = "https://console.cloud.google.com/monitoring/dashboards/custom/${google_monitoring_dashboard.main_dashboard.id}?project=${var.project_id}"
}

output "performance_dashboard_url" {
  description = "URL to the performance monitoring dashboard"
  value       = "https://console.cloud.google.com/monitoring/dashboards/custom/${google_monitoring_dashboard.performance_dashboard.id}?project=${var.project_id}"
}

output "dashboards" {
  description = "Created monitoring dashboards"
  value = {
    main_dashboard = {
      id   = google_monitoring_dashboard.main_dashboard.id
      name = "Solarify ${var.environment} Dashboard"
      url  = "https://console.cloud.google.com/monitoring/dashboards/custom/${google_monitoring_dashboard.main_dashboard.id}?project=${var.project_id}"
    }
    performance_dashboard = {
      id   = google_monitoring_dashboard.performance_dashboard.id
      name = "Solarify Performance Dashboard"
      url  = "https://console.cloud.google.com/monitoring/dashboards/custom/${google_monitoring_dashboard.performance_dashboard.id}?project=${var.project_id}"
    }
  }
}

# Service Level Objectives (SLOs)
output "slos" {
  description = "Created Service Level Objectives"
  value = {
    availability_slo = {
      name = google_monitoring_slo.availability_slo.name
      goal = google_monitoring_slo.availability_slo.goal
    }
    latency_slo = {
      name = google_monitoring_slo.latency_slo.name
      goal = google_monitoring_slo.latency_slo.goal
    }
  }
}

output "service_definition" {
  description = "Monitoring service definition"
  value = {
    service_id   = google_monitoring_service.solarify_service.service_id
    display_name = google_monitoring_service.solarify_service.display_name
    name         = google_monitoring_service.solarify_service.name
  }
}

# Log Storage
output "log_buckets" {
  description = "Created log storage buckets"
  value = {
    for key, bucket in google_storage_bucket.logs_buckets : key => {
      name         = bucket.name
      location     = bucket.location
      storage_class = bucket.storage_class
      url          = bucket.url
    }
  }
}

output "log_sinks" {
  description = "Created logging sinks"
  value = {
    app_logs = {
      name        = google_logging_sink.app_logs_sink.name
      destination = google_logging_sink.app_logs_sink.destination
      filter      = google_logging_sink.app_logs_sink.filter
    }
    audit_logs = {
      name        = google_logging_sink.audit_logs_sink.name
      destination = google_logging_sink.audit_logs_sink.destination
      filter      = google_logging_sink.audit_logs_sink.filter
    }
  }
}

# Error Reporting
output "error_reporting_service" {
  description = "Error reporting service configuration"
  value       = var.monitoring_config.enable_error_reporting ? {
    project = var.project_id
    service = "${var.environment_prefix}-app"
    enabled = true
  } : null
}

# Monitoring Configuration Summary
output "monitoring_configuration" {
  description = "Summary of monitoring configuration"
  value = {
    environment = var.environment
    
    features_enabled = {
      uptime_checks   = var.monitoring_config.enable_uptime_checks
      error_reporting = var.monitoring_config.enable_error_reporting
      profiling      = var.monitoring_config.enable_profiling
      tracing        = var.monitoring_config.enable_tracing
    }
    
    alert_thresholds = var.alert_thresholds
    
    notification_channels_count = length(var.notification_channels)
    alert_policies_count       = length(local.alert_policies)
    uptime_checks_count        = var.monitoring_config.enable_uptime_checks ? length(var.uptime_check_urls) : 0
    custom_metrics_count       = length(google_logging_metric.custom_metrics) + length(google_logging_metric.error_metrics)
    
    log_retention_days = var.log_retention_days
    
    slo_targets = {
      availability = google_monitoring_slo.availability_slo.goal
      latency     = google_monitoring_slo.latency_slo.goal
    }
  }
}

# Alert Management URLs
output "monitoring_urls" {
  description = "Important monitoring URLs"
  value = {
    alerting_overview    = "https://console.cloud.google.com/monitoring/alerting?project=${var.project_id}"
    metrics_explorer     = "https://console.cloud.google.com/monitoring/metrics-explorer?project=${var.project_id}"
    logs_explorer       = "https://console.cloud.google.com/logs/query?project=${var.project_id}"
    error_reporting     = "https://console.cloud.google.com/errors?project=${var.project_id}"
    trace_overview      = "https://console.cloud.google.com/traces/overview?project=${var.project_id}"
    profiler           = "https://console.cloud.google.com/profiler?project=${var.project_id}"
    uptime_monitoring  = "https://console.cloud.google.com/monitoring/uptime?project=${var.project_id}"
    service_monitoring = "https://console.cloud.google.com/monitoring/services?project=${var.project_id}"
  }
}

# Operational Information
output "operational_info" {
  description = "Operational information for monitoring"
  value = {
    log_query_examples = {
      application_errors = "resource.type=\"cloud_run_revision\" AND severity>=ERROR"
      high_latency_requests = "resource.type=\"cloud_run_revision\" AND jsonPayload.response_time>2000"
      authentication_events = "resource.type=\"cloud_run_revision\" AND jsonPayload.event_type=\"auth_event\""
      business_events = "resource.type=\"cloud_run_revision\" AND (jsonPayload.event_type=\"rfq_created\" OR jsonPayload.event_type=\"quote_submitted\")"
    }
    
    metric_query_examples = {
      error_rate = "fetch cloud_run_revision | filter (resource.service_name =~ '${var.environment_prefix}-.*') | group_by [], [value_error_rate: rate(metric.run.googleapis.com/request_count)]"
      latency_95th = "fetch cloud_run_revision | filter (resource.service_name =~ '${var.environment_prefix}-.*') | group_by [], [value_latency_95th: percentile(metric.run.googleapis.com/request_latencies, 95)]"
    }
    
    dashboard_filters = {
      environment_filter = "resource.labels.service_name=~\"${var.environment_prefix}-.*\""
      error_filter      = "severity>=ERROR"
      performance_filter = "metric.type=\"run.googleapis.com/request_latencies\""
    }
  }
}

# Monitoring Best Practices
output "monitoring_recommendations" {
  description = "Monitoring best practices and recommendations"
  value = {
    alert_fatigue_prevention = [
      "Review alert thresholds regularly based on actual application behavior",
      "Use alert grouping to reduce notification volume",
      "Implement alert routing based on severity levels",
      "Set up escalation policies for critical alerts"
    ]
    
    slo_management = [
      "Monitor error budget burn rate",
      "Review SLO targets quarterly based on business requirements",
      "Use SLO violations to prioritize reliability work",
      "Implement SLO-based alerting for proactive issue detection"
    ]
    
    cost_optimization = [
      "Use log sampling for high-volume applications",
      "Set appropriate log retention periods",
      "Monitor Cloud Monitoring API usage",
      "Use custom metrics judiciously"
    ]
    
    performance_monitoring = [
      "Enable distributed tracing for complex request flows",
      "Use profiling to identify performance bottlenecks",
      "Monitor both synthetic and real user metrics",
      "Set up performance budgets for key user journeys"
    ]
  }
}