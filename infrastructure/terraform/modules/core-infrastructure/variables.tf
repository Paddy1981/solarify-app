# Core Infrastructure Module Variables

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
  description = "Primary region for resources"
  type        = string
}

variable "secondary_regions" {
  description = "Secondary regions for multi-region setup"
  type        = list(string)
  default     = []
}

variable "vpc_cidr" {
  description = "CIDR range for the VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "enable_private_google_access" {
  description = "Enable private Google access for subnets"
  type        = bool
  default     = true
}

variable "firewall_source_ranges" {
  description = "Source IP ranges for firewall rules"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}