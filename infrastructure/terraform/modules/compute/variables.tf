# Compute Infrastructure Module Variables

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
  description = "Primary region for compute resources"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC network"
  type        = string
}

variable "subnet_id" {
  description = "ID of the application subnet"
  type        = string
}

variable "instance_config" {
  description = "Configuration for compute instances"
  type = object({
    min_instances  = number
    max_instances  = number
    cpu_request    = string
    memory_request = string
    cpu_limit      = string
    memory_limit   = string
  })
}

variable "application_image" {
  description = "Docker image for the application"
  type        = string
}

variable "application_port" {
  description = "Port the application listens on"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/api/health"
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = ""
}

variable "enable_ssl" {
  description = "Enable SSL/TLS termination"
  type        = bool
  default     = true
}

variable "ssl_certificate_map" {
  description = "Map of domains to SSL certificate names"
  type        = map(string)
  default     = {}
}

variable "ssl_policy_name" {
  description = "Name of the SSL policy"
  type        = string
  default     = ""
}

variable "security_policy_name" {
  description = "Name of the security policy"
  type        = string
  default     = ""
}

variable "static_ip_address" {
  description = "Static IP address for load balancer"
  type        = string
  default     = ""
}

variable "service_account_email" {
  description = "Service account email for Cloud Run"
  type        = string
}

variable "enable_public_access" {
  description = "Enable public access to Cloud Run service"
  type        = bool
  default     = true
}

variable "enable_cdn" {
  description = "Enable Cloud CDN"
  type        = bool
  default     = true
}

variable "enable_scheduled_tasks" {
  description = "Enable Cloud Scheduler for periodic tasks"
  type        = bool
  default     = true
}

variable "enable_eventarc" {
  description = "Enable Eventarc triggers"
  type        = bool
  default     = false
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}