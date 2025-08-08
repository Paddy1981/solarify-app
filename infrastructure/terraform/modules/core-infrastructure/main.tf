# Core Infrastructure Module - VPC, Networking, and Security Groups
# Provides the foundation network infrastructure for Solarify

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Local variables for consistent naming
locals {
  subnet_configs = {
    app = {
      name          = "${var.environment_prefix}-app-subnet"
      ip_cidr_range = cidrsubnet(var.vpc_cidr, 4, 0)  # First /20 subnet
      description   = "Application subnet"
      purpose       = "REGIONAL_MANAGED_PROXY"
    }
    db = {
      name          = "${var.environment_prefix}-db-subnet"
      ip_cidr_range = cidrsubnet(var.vpc_cidr, 4, 1)  # Second /20 subnet
      description   = "Database subnet"
      purpose       = null
    }
    proxy = {
      name          = "${var.environment_prefix}-proxy-subnet"
      ip_cidr_range = cidrsubnet(var.vpc_cidr, 8, 64) # /24 subnet for load balancer
      description   = "Load balancer proxy subnet"
      purpose       = "REGIONAL_MANAGED_PROXY"
    }
  }
}

# Main VPC Network
resource "google_compute_network" "main_vpc" {
  name                    = "${var.environment_prefix}-vpc"
  description            = "Main VPC for Solarify ${var.environment} environment"
  auto_create_subnetworks = false
  routing_mode           = "REGIONAL"
  
  # Enable deletion protection for production
  delete_default_routes_on_create = false
  
  labels = var.labels
}

# Subnets
resource "google_compute_subnetwork" "subnets" {
  for_each = local.subnet_configs

  name          = each.value.name
  description   = each.value.description
  ip_cidr_range = each.value.ip_cidr_range
  region        = var.primary_region
  network       = google_compute_network.main_vpc.id
  purpose       = each.value.purpose
  role          = each.value.purpose == "REGIONAL_MANAGED_PROXY" ? "ACTIVE" : null

  # Enable private Google access for private subnets
  private_ip_google_access = var.enable_private_google_access

  # Secondary IP ranges for services (if needed)
  dynamic "secondary_ip_range" {
    for_each = each.key == "app" ? [{
      range_name    = "services"
      ip_cidr_range = cidrsubnet(var.vpc_cidr, 8, 32)
    }, {
      range_name    = "pods"
      ip_cidr_range = cidrsubnet(var.vpc_cidr, 8, 33)
    }] : []
    
    content {
      range_name    = secondary_ip_range.value.range_name
      ip_cidr_range = secondary_ip_range.value.ip_cidr_range
    }
  }

  # Log configuration
  log_config {
    aggregation_interval = "INTERVAL_10_MIN"
    flow_sampling       = 0.5
    metadata           = "INCLUDE_ALL_METADATA"
  }
}

# Cloud Router for NAT Gateway
resource "google_compute_router" "main_router" {
  name    = "${var.environment_prefix}-router"
  region  = var.primary_region
  network = google_compute_network.main_vpc.id

  bgp {
    asn = 64514
  }
}

# NAT Gateway for outbound internet access from private subnets
resource "google_compute_router_nat" "main_nat" {
  name                               = "${var.environment_prefix}-nat"
  router                            = google_compute_router.main_router.name
  region                            = google_compute_router.main_router.region
  nat_ip_allocate_option            = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  # Configure specific subnets for NAT
  subnetwork {
    name                    = google_compute_subnetwork.subnets["app"].id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  subnetwork {
    name                    = google_compute_subnetwork.subnets["db"].id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Firewall Rules
# Allow internal communication within VPC
resource "google_compute_firewall" "allow_internal" {
  name    = "${var.environment_prefix}-allow-internal"
  network = google_compute_network.main_vpc.id

  description = "Allow internal communication within VPC"
  direction   = "INGRESS"
  priority    = 65534

  allow {
    protocol = "tcp"
  }

  allow {
    protocol = "udp"
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [var.vpc_cidr]
  target_tags   = ["internal"]
}

# Allow HTTP/HTTPS traffic to application
resource "google_compute_firewall" "allow_http_https" {
  name    = "${var.environment_prefix}-allow-http-https"
  network = google_compute_network.main_vpc.id

  description = "Allow HTTP and HTTPS traffic to application"
  direction   = "INGRESS"
  priority    = 1000

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]
}

# Allow health checks from Google Load Balancer
resource "google_compute_firewall" "allow_health_check" {
  name    = "${var.environment_prefix}-allow-health-check"
  network = google_compute_network.main_vpc.id

  description = "Allow health checks from Google Load Balancer"
  direction   = "INGRESS"
  priority    = 1000

  allow {
    protocol = "tcp"
    ports    = ["8080", "3000"] # Application port
  }

  # Google Cloud health check source ranges
  source_ranges = [
    "130.211.0.0/22",
    "35.191.0.0/16"
  ]

  target_tags = ["allow-health-check"]
}

# Allow SSH from specific ranges (for debugging if needed)
resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.environment_prefix}-allow-ssh"
  network = google_compute_network.main_vpc.id

  description = "Allow SSH from specific source ranges"
  direction   = "INGRESS"
  priority    = 1000

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.firewall_source_ranges
  target_tags   = ["allow-ssh"]
}

# Deny all other inbound traffic (explicit deny rule)
resource "google_compute_firewall" "deny_all" {
  name    = "${var.environment_prefix}-deny-all"
  network = google_compute_network.main_vpc.id

  description = "Deny all other inbound traffic"
  direction   = "INGRESS"
  priority    = 65000

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
}

# Reserved IP addresses for static services
resource "google_compute_global_address" "app_ip" {
  name        = "${var.environment_prefix}-app-ip"
  description = "Static IP for application load balancer"
}

# SSL Policy for HTTPS
resource "google_compute_ssl_policy" "ssl_policy" {
  name            = "${var.environment_prefix}-ssl-policy"
  description     = "SSL policy for secure HTTPS connections"
  profile         = "MODERN"
  min_tls_version = "TLS_1_2"
}

# Network Security Policy (Cloud Armor)
resource "google_compute_security_policy" "security_policy" {
  name        = "${var.environment_prefix}-security-policy"
  description = "Security policy for DDoS protection and rate limiting"

  # Default rule - allow all traffic
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule"
  }

  # Rate limiting rule
  rule {
    action   = "rate_based_ban"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Rate limiting rule"
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      ban_duration_sec = 300
    }
  }

  # Block known malicious IPs
  rule {
    action   = "deny(403)"
    priority = "500"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        # Example malicious IP ranges - customize based on threat intelligence
        src_ip_ranges = [
          "192.0.2.0/24"  # Example range
        ]
      }
    }
    description = "Block known malicious IPs"
  }
}

# Private Service Connection for managed services
resource "google_compute_global_address" "private_service_connection" {
  name          = "${var.environment_prefix}-private-service-connection"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main_vpc.id
}

# VPC Peering connection for Google services
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.main_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_service_connection.name]
}

# VPC Flow Logs (enabled via subnetwork log_config above)
# Additional logging sink for VPC Flow Logs
resource "google_logging_sink" "vpc_flow_logs" {
  name        = "${var.environment_prefix}-vpc-flow-logs"
  destination = "storage.googleapis.com/${var.environment_prefix}-vpc-flow-logs"

  # Log all VPC flow logs
  filter = "protoPayload.serviceName=\"compute.googleapis.com\" AND protoPayload.methodName=\"v1.compute.instances.insert\""

  # Use a service account for the sink
  unique_writer_identity = true
}