# Compute Infrastructure Module Outputs

output "cloud_run_service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.app_service.name
}

output "cloud_run_service_id" {
  description = "ID of the Cloud Run service"
  value       = google_cloud_run_v2_service.app_service.id
}

output "cloud_run_service_uri" {
  description = "URI of the Cloud Run service"
  value       = google_cloud_run_v2_service.app_service.uri
}

output "application_url" {
  description = "Public URL of the application"
  value       = var.domain_name != "" && var.enable_ssl ? "https://${var.domain_name}" : google_cloud_run_v2_service.app_service.uri
}

output "load_balancer_ip" {
  description = "IP address of the load balancer"
  value       = google_compute_global_address.app_ip.address
}

output "vpc_connector_name" {
  description = "Name of the VPC connector"
  value       = google_vpc_access_connector.connector.name
}

output "vpc_connector_id" {
  description = "ID of the VPC connector"
  value       = google_vpc_access_connector.connector.id
}

output "backend_service_name" {
  description = "Name of the backend service"
  value       = google_compute_backend_service.app_backend.name
}

output "health_check_name" {
  description = "Name of the health check"
  value       = google_compute_health_check.app_health_check.name
}

output "url_map_name" {
  description = "Name of the URL map"
  value       = google_compute_url_map.app_url_map.name
}

output "ssl_certificate_names" {
  description = "Names of SSL certificates"
  value       = var.enable_ssl && var.domain_name != "" ? [google_compute_managed_ssl_certificate.app_ssl_cert[0].name] : []
}

output "https_proxy_name" {
  description = "Name of the HTTPS proxy"
  value       = var.enable_ssl ? google_compute_target_https_proxy.https_proxy[0].name : ""
}

output "http_proxy_name" {
  description = "Name of the HTTP proxy"
  value       = google_compute_target_http_proxy.http_proxy.name
}

output "forwarding_rules" {
  description = "Names of forwarding rules"
  value = {
    http  = google_compute_global_forwarding_rule.http_forwarding_rule.name
    https = var.enable_ssl ? google_compute_global_forwarding_rule.https_forwarding_rule[0].name : ""
  }
}

output "artifact_registry_repository" {
  description = "Details of the Artifact Registry repository"
  value = {
    name     = google_artifact_registry_repository.container_registry.name
    id       = google_artifact_registry_repository.container_registry.id
    location = google_artifact_registry_repository.container_registry.location
  }
}

output "scheduled_job_names" {
  description = "Names of scheduled jobs"
  value       = var.enable_scheduled_tasks ? [google_cloud_scheduler_job.periodic_tasks[0].name] : []
}

output "eventarc_trigger_names" {
  description = "Names of Eventarc triggers"
  value       = var.enable_eventarc ? [google_eventarc_trigger.firestore_trigger[0].name] : []
}

output "service_configuration" {
  description = "Configuration summary of the Cloud Run service"
  value = {
    name               = google_cloud_run_v2_service.app_service.name
    location          = google_cloud_run_v2_service.app_service.location
    uri               = google_cloud_run_v2_service.app_service.uri
    service_account   = var.service_account_email
    min_instances     = var.instance_config.min_instances
    max_instances     = var.instance_config.max_instances
    cpu_limit         = var.instance_config.cpu_limit
    memory_limit      = var.instance_config.memory_limit
    public_access     = var.enable_public_access
    vpc_connector     = google_vpc_access_connector.connector.name
  }
}

output "load_balancer_configuration" {
  description = "Load balancer configuration summary"
  value = {
    backend_service    = google_compute_backend_service.app_backend.name
    health_check       = google_compute_health_check.app_health_check.name
    url_map           = google_compute_url_map.app_url_map.name
    cdn_enabled       = var.enable_cdn
    ssl_enabled       = var.enable_ssl
    global_ip_address = google_compute_global_address.app_ip.address
    domain_name       = var.domain_name
    http3_enabled     = var.enable_ssl
    quic_enabled      = var.enable_ssl
  }
}

output "scaling_configuration" {
  description = "Auto-scaling configuration"
  value = {
    min_instances = var.instance_config.min_instances
    max_instances = var.instance_config.max_instances
    cpu_limit     = var.instance_config.cpu_limit
    memory_limit  = var.instance_config.memory_limit
  }
}

output "network_endpoint_group" {
  description = "Network endpoint group details"
  value = {
    name = google_compute_region_network_endpoint_group.cloudrun_neg.name
    id   = google_compute_region_network_endpoint_group.cloudrun_neg.id
  }
}

output "logging_sink_name" {
  description = "Name of the application logging sink"
  value       = google_logging_sink.app_logs.name
}