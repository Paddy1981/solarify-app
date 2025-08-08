# Core Infrastructure Module Outputs

output "vpc_id" {
  description = "ID of the VPC network"
  value       = google_compute_network.main_vpc.id
}

output "vpc_name" {
  description = "Name of the VPC network"
  value       = google_compute_network.main_vpc.name
}

output "vpc_self_link" {
  description = "Self link of the VPC network"
  value       = google_compute_network.main_vpc.self_link
}

output "app_subnet_id" {
  description = "ID of the application subnet"
  value       = google_compute_subnetwork.subnets["app"].id
}

output "app_subnet_name" {
  description = "Name of the application subnet"
  value       = google_compute_subnetwork.subnets["app"].name
}

output "app_subnet_cidr" {
  description = "CIDR range of the application subnet"
  value       = google_compute_subnetwork.subnets["app"].ip_cidr_range
}

output "db_subnet_id" {
  description = "ID of the database subnet"
  value       = google_compute_subnetwork.subnets["db"].id
}

output "db_subnet_name" {
  description = "Name of the database subnet"
  value       = google_compute_subnetwork.subnets["db"].name
}

output "db_subnet_cidr" {
  description = "CIDR range of the database subnet"
  value       = google_compute_subnetwork.subnets["db"].ip_cidr_range
}

output "proxy_subnet_id" {
  description = "ID of the proxy subnet"
  value       = google_compute_subnetwork.subnets["proxy"].id
}

output "proxy_subnet_name" {
  description = "Name of the proxy subnet"
  value       = google_compute_subnetwork.subnets["proxy"].name
}

output "router_name" {
  description = "Name of the Cloud Router"
  value       = google_compute_router.main_router.name
}

output "nat_name" {
  description = "Name of the NAT Gateway"
  value       = google_compute_router_nat.main_nat.name
}

output "static_ip_address" {
  description = "Static IP address for load balancer"
  value       = google_compute_global_address.app_ip.address
}

output "static_ip_name" {
  description = "Name of the static IP address"
  value       = google_compute_global_address.app_ip.name
}

output "ssl_policy_name" {
  description = "Name of the SSL policy"
  value       = google_compute_ssl_policy.ssl_policy.name
}

output "security_policy_name" {
  description = "Name of the security policy"
  value       = google_compute_security_policy.security_policy.name
}

output "private_service_connection_name" {
  description = "Name of the private service connection"
  value       = google_compute_global_address.private_service_connection.name
}

output "firewall_rules" {
  description = "Created firewall rules"
  value = {
    allow_internal     = google_compute_firewall.allow_internal.name
    allow_http_https   = google_compute_firewall.allow_http_https.name
    allow_health_check = google_compute_firewall.allow_health_check.name
    allow_ssh         = google_compute_firewall.allow_ssh.name
    deny_all          = google_compute_firewall.deny_all.name
  }
}

output "subnet_details" {
  description = "Details of all created subnets"
  value = {
    for key, subnet in google_compute_subnetwork.subnets : key => {
      id            = subnet.id
      name          = subnet.name
      cidr_range    = subnet.ip_cidr_range
      region        = subnet.region
      purpose       = subnet.purpose
      role          = subnet.role
    }
  }
}

output "network_tags" {
  description = "Recommended network tags for compute instances"
  value = {
    web_server        = "web-server"
    internal         = "internal"
    allow_health_check = "allow-health-check"
    allow_ssh        = "allow-ssh"
  }
}