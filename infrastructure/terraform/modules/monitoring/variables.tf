# Monitoring and Observability Module Variables

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
  description = "Primary region for monitoring resources"
  type        = string
}

# Monitoring Configuration
variable "monitoring_config" {
  description = "Monitoring and observability configuration"
  type = object({
    enable_uptime_checks   = bool
    enable_error_reporting = bool
    enable_profiling      = bool
    enable_tracing        = bool
  })
  default = {
    enable_uptime_checks   = true
    enable_error_reporting = true
    enable_profiling      = false
    enable_tracing        = true
  }
}

# Notification Channels
variable "notification_channels" {
  description = "Notification channels for alerts"
  type = map(object({
    type    = string
    labels  = map(string)
    enabled = bool
  }))
  
  validation {
    condition = alltrue([
      for channel in var.notification_channels : 
      contains(["email", "sms", "slack", "pagerduty", "webhook"], channel.type)
    ])
    error_message = "Notification channel type must be one of: email, sms, slack, pagerduty, webhook."
  }
}

# Uptime Check URLs
variable "uptime_check_urls" {
  description = "URLs to monitor for uptime"
  type        = list(string)
  default     = []
}

# Alert Thresholds
variable "alert_thresholds" {
  description = "Alert thresholds for monitoring"
  type = object({
    error_rate_threshold           = number
    latency_threshold_seconds      = number
    cpu_utilization_threshold      = number
    memory_utilization_threshold   = number
    storage_utilization_threshold  = number
    rfq_creation_rate_min         = number
    quote_response_rate_max       = number
    system_uptime_target          = number
  })
  
  validation {
    condition = (
      var.alert_thresholds.error_rate_threshold >= 0 &&
      var.alert_thresholds.error_rate_threshold <= 1 &&
      var.alert_thresholds.system_uptime_target >= 0 &&
      var.alert_thresholds.system_uptime_target <= 1
    )
    error_message = "Error rate and uptime thresholds must be between 0 and 1."
  }
}

# Log Retention
variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 90
  
  validation {
    condition     = var.log_retention_days >= 1 && var.log_retention_days <= 3653
    error_message = "Log retention must be between 1 and 3653 days (10 years)."
  }
}

# SLO Configuration
variable "slo_config" {
  description = "Service Level Objectives configuration"
  type = object({
    availability_target      = number
    latency_target_seconds  = number
    latency_percentile      = number
    error_budget_policy     = string
    measurement_window_days = number
  })
  default = {
    availability_target      = 0.999  # 99.9%
    latency_target_seconds  = 2.0
    latency_percentile      = 0.95    # 95th percentile
    error_budget_policy     = "BURN_RATE"
    measurement_window_days = 30
  }
}

# Custom Metrics Configuration
variable "custom_metrics" {
  description = "Custom business metrics to create"
  type = map(object({
    description    = string
    log_filter     = string
    metric_kind    = string
    value_type     = string
    unit          = string
    value_extractor = string
    label_extractors = map(string)
  }))
  default = {}
}

# Dashboard Configuration
variable "dashboard_config" {
  description = "Dashboard configuration settings"
  type = object({
    create_main_dashboard        = bool
    create_performance_dashboard = bool
    create_business_dashboard    = bool
    create_security_dashboard    = bool
    dashboard_sharing           = string
  })
  default = {
    create_main_dashboard        = true
    create_performance_dashboard = true
    create_business_dashboard    = true
    create_security_dashboard    = true
    dashboard_sharing           = "PRIVATE"
  }
}

# Alerting Configuration
variable "alerting_config" {
  description = "Alerting configuration settings"
  type = object({
    enable_alert_policies        = bool
    alert_policy_enabled         = bool
    notification_rate_limit      = string
    alert_strategy              = string
    auto_close_duration         = string
  })
  default = {
    enable_alert_policies        = true
    alert_policy_enabled         = true
    notification_rate_limit      = "3600s"  # 1 hour
    alert_strategy              = "NOTIFICATION_CHANNEL"
    auto_close_duration         = "86400s"  # 24 hours
  }
}

# Log Export Configuration
variable "log_export_config" {
  description = "Log export and storage configuration"
  type = object({
    export_application_logs = bool
    export_audit_logs      = bool
    export_security_logs   = bool
    log_storage_class      = string
    create_log_buckets     = bool
    log_bucket_location    = string
  })
  default = {
    export_application_logs = true
    export_audit_logs      = true
    export_security_logs   = true
    log_storage_class      = "NEARLINE"
    create_log_buckets     = true
    log_bucket_location    = "US"
  }
}

# Performance Monitoring
variable "performance_monitoring" {
  description = "Performance monitoring configuration"
  type = object({
    enable_apm              = bool
    enable_real_user_monitoring = bool
    sample_rate             = number
    trace_sampling_rate     = number
    profiling_enabled       = bool
  })
  default = {
    enable_apm              = true
    enable_real_user_monitoring = true
    sample_rate             = 0.1   # 10% sampling
    trace_sampling_rate     = 0.1   # 10% trace sampling
    profiling_enabled       = false
  }
}

# Business Metrics
variable "business_metrics" {
  description = "Business-specific metrics configuration"
  type = object({
    track_user_activity     = bool
    track_rfq_metrics      = bool
    track_quote_metrics    = bool
    track_system_metrics   = bool
    track_revenue_metrics  = bool
  })
  default = {
    track_user_activity     = true
    track_rfq_metrics      = true
    track_quote_metrics    = true
    track_system_metrics   = true
    track_revenue_metrics  = false  # Enable when payment integration is ready
  }
}

# Security Monitoring
variable "security_monitoring" {
  description = "Security monitoring configuration"
  type = object({
    monitor_auth_events        = bool
    monitor_api_abuse         = bool
    monitor_data_access       = bool
    security_alert_threshold  = number
    anomaly_detection_enabled = bool
  })
  default = {
    monitor_auth_events        = true
    monitor_api_abuse         = true
    monitor_data_access       = true
    security_alert_threshold  = 5    # Number of security events before alert
    anomaly_detection_enabled = true
  }
}

# Compliance and Audit
variable "compliance_monitoring" {
  description = "Compliance and audit monitoring configuration"
  type = object({
    enable_compliance_dashboard = bool
    gdpr_monitoring_enabled    = bool
    audit_log_retention_years  = number
    compliance_alerts_enabled = bool
  })
  default = {
    enable_compliance_dashboard = true
    gdpr_monitoring_enabled    = true
    audit_log_retention_years  = 7
    compliance_alerts_enabled = true
  }
}

variable "labels" {
  description = "Labels to apply to monitoring resources"
  type        = map(string)
  default     = {}
}