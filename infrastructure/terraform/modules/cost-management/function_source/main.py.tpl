import base64
import json
import logging
from typing import Dict, Any
from google.cloud import monitoring_v3
from google.cloud import compute_v1
from google.cloud import run_v1
from google.cloud import storage
import functions_framework

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ID = "${project_id}"

@functions_framework.cloud_event
def process_budget_alert(cloud_event):
    """Process budget alerts and trigger cost optimization actions."""
    
    try:
        # Decode the Pub/Sub message
        pubsub_message = base64.b64decode(cloud_event.data["message"]["data"]).decode()
        budget_data = json.loads(pubsub_message)
        
        logger.info(f"Received budget alert: {budget_data}")
        
        # Extract budget information
        budget_display_name = budget_data.get("budgetDisplayName", "")
        alert_threshold = budget_data.get("alertThresholdExceeded", {})
        threshold_percent = alert_threshold.get("thresholdPercent", 0)
        
        # Determine action based on threshold
        if threshold_percent >= 0.95:
            logger.warning(f"Critical budget threshold reached: {threshold_percent}%")
            trigger_emergency_cost_optimization(budget_data)
        elif threshold_percent >= 0.8:
            logger.warning(f"High budget threshold reached: {threshold_percent}%")
            trigger_proactive_optimization(budget_data)
        elif threshold_percent >= 0.5:
            logger.info(f"Budget warning threshold reached: {threshold_percent}%")
            trigger_cost_analysis(budget_data)
        
        # Send notification
        send_cost_alert_notification(budget_data, threshold_percent)
        
        return {"status": "success", "action": "budget_alert_processed"}
        
    except Exception as e:
        logger.error(f"Error processing budget alert: {str(e)}")
        return {"status": "error", "message": str(e)}

def trigger_emergency_cost_optimization(budget_data: Dict[str, Any]):
    """Trigger emergency cost optimization measures."""
    logger.info("Triggering emergency cost optimization")
    
    # 1. Scale down non-critical Cloud Run services
    scale_down_cloud_run_services()
    
    # 2. Delete temporary storage buckets and old files
    cleanup_storage_resources()
    
    # 3. Stop non-production compute instances
    stop_non_production_instances()
    
    # 4. Reduce Redis memory if possible
    optimize_redis_instances()

def trigger_proactive_optimization(budget_data: Dict[str, Any]):
    """Trigger proactive cost optimization measures."""
    logger.info("Triggering proactive cost optimization")
    
    # 1. Analyze resource utilization
    analyze_resource_utilization()
    
    # 2. Right-size over-provisioned resources
    right_size_resources()
    
    # 3. Enable cost-saving features
    enable_cost_optimizations()

def trigger_cost_analysis(budget_data: Dict[str, Any]):
    """Perform cost analysis and generate recommendations."""
    logger.info("Performing cost analysis")
    
    # Generate cost breakdown report
    cost_breakdown = generate_cost_breakdown()
    
    # Identify optimization opportunities
    opportunities = identify_optimization_opportunities()
    
    # Log recommendations
    logger.info(f"Cost breakdown: {cost_breakdown}")
    logger.info(f"Optimization opportunities: {opportunities}")

def scale_down_cloud_run_services():
    """Scale down Cloud Run services to minimum instances."""
    try:
        # This is a placeholder for actual Cloud Run scaling logic
        logger.info("Scaling down Cloud Run services")
        
        # In a real implementation, you would:
        # 1. List all Cloud Run services
        # 2. Check their current scaling configuration
        # 3. Reduce min instances for non-critical services
        # 4. Set lower CPU and memory limits where appropriate
        
    except Exception as e:
        logger.error(f"Error scaling down Cloud Run services: {str(e)}")

def cleanup_storage_resources():
    """Clean up temporary and old storage resources."""
    try:
        client = storage.Client(project=PROJECT_ID)
        logger.info("Cleaning up storage resources")
        
        # List all buckets
        buckets = client.list_buckets()
        
        for bucket in buckets:
            # Skip critical buckets
            if any(keyword in bucket.name.lower() for keyword in ['backup', 'production', 'critical']):
                continue
                
            # Clean up old files in temporary buckets
            if 'temp' in bucket.name.lower() or 'cache' in bucket.name.lower():
                cleanup_old_files_in_bucket(bucket)
                
    except Exception as e:
        logger.error(f"Error cleaning up storage: {str(e)}")

def cleanup_old_files_in_bucket(bucket):
    """Clean up files older than 7 days in a bucket."""
    from datetime import datetime, timedelta
    
    cutoff_date = datetime.now() - timedelta(days=7)
    deleted_count = 0
    
    for blob in bucket.list_blobs():
        if blob.time_created < cutoff_date:
            blob.delete()
            deleted_count += 1
            
    logger.info(f"Deleted {deleted_count} old files from bucket {bucket.name}")

def stop_non_production_instances():
    """Stop non-production compute instances."""
    try:
        logger.info("Stopping non-production compute instances")
        
        # This would implement actual instance management
        # For safety, this is just a placeholder
        
    except Exception as e:
        logger.error(f"Error stopping instances: {str(e)}")

def optimize_redis_instances():
    """Optimize Redis instances for cost."""
    try:
        logger.info("Optimizing Redis instances")
        
        # This would implement Redis optimization logic
        # Such as reducing memory size for development instances
        
    except Exception as e:
        logger.error(f"Error optimizing Redis: {str(e)}")

def analyze_resource_utilization():
    """Analyze current resource utilization."""
    try:
        client = monitoring_v3.MetricServiceClient()
        project_name = f"projects/{PROJECT_ID}"
        
        # Query CPU utilization metrics
        interval = monitoring_v3.TimeInterval()
        now = time.time()
        seconds = int(now)
        interval.end_time = {"seconds": seconds}
        interval.start_time = {"seconds": (seconds - 3600)}  # Last hour
        
        results = client.list_time_series(
            request={
                "name": project_name,
                "filter": 'metric.type="compute.googleapis.com/instance/cpu/utilization"',
                "interval": interval,
                "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL,
            }
        )
        
        logger.info(f"Found {len(list(results))} time series for analysis")
        
    except Exception as e:
        logger.error(f"Error analyzing utilization: {str(e)}")

def right_size_resources():
    """Right-size over-provisioned resources."""
    logger.info("Right-sizing resources based on utilization")
    
    # This would implement actual right-sizing logic
    # Based on historical usage patterns

def enable_cost_optimizations():
    """Enable various cost optimization features."""
    logger.info("Enabling cost optimizations")
    
    # Enable sustained use discounts
    # Configure preemptible instances where appropriate
    # Enable committed use discounts

def generate_cost_breakdown():
    """Generate a cost breakdown by service."""
    try:
        # This would implement actual cost analysis using Billing API
        return {
            "compute": "40%",
            "storage": "30%", 
            "networking": "20%",
            "other": "10%"
        }
    except Exception as e:
        logger.error(f"Error generating cost breakdown: {str(e)}")
        return {}

def identify_optimization_opportunities():
    """Identify specific cost optimization opportunities."""
    opportunities = []
    
    # Check for unused resources
    opportunities.append("Consider deleting unused storage buckets")
    
    # Check for over-provisioned resources
    opportunities.append("Right-size Cloud Run services based on usage")
    
    # Check for scheduling opportunities
    opportunities.append("Schedule non-critical workloads during off-peak hours")
    
    return opportunities

def send_cost_alert_notification(budget_data: Dict[str, Any], threshold_percent: float):
    """Send cost alert notification."""
    try:
        logger.info(f"Sending cost alert notification for {threshold_percent}% threshold")
        
        # In a real implementation, this would send notifications via:
        # - Email
        # - Slack
        # - PagerDuty (for critical alerts)
        # - SMS (for emergency thresholds)
        
        message = f"""
        COST ALERT: {budget_data.get('budgetDisplayName', 'Unknown Budget')}
        
        Threshold: {threshold_percent}%
        Current Spend: {budget_data.get('costAmount', 'N/A')}
        Budget Amount: {budget_data.get('budgetAmount', 'N/A')}
        
        Automated optimization actions have been triggered.
        """
        
        logger.info(f"Notification message: {message}")
        
    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}")

# For testing and manual execution
def weekly_cost_report(request):
    """Generate weekly cost report."""
    try:
        logger.info("Generating weekly cost report")
        
        # Generate comprehensive cost analysis
        cost_breakdown = generate_cost_breakdown()
        optimization_opportunities = identify_optimization_opportunities()
        
        report = {
            "report_type": "weekly_summary",
            "generated_at": datetime.now().isoformat(),
            "cost_breakdown": cost_breakdown,
            "optimization_opportunities": optimization_opportunities,
            "recommendations": [
                "Review and optimize Cloud Run configurations",
                "Clean up unused storage resources",
                "Consider committed use discounts for stable workloads",
                "Implement automated scaling policies"
            ]
        }
        
        logger.info(f"Weekly cost report: {report}")
        return {"status": "success", "report": report}
        
    except Exception as e:
        logger.error(f"Error generating weekly report: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    # For local testing
    import time
    from datetime import datetime
    
    # Test budget alert processing
    test_budget_data = {
        "budgetDisplayName": "Test Budget",
        "alertThresholdExceeded": {"thresholdPercent": 0.85},
        "costAmount": 850,
        "budgetAmount": 1000
    }
    
    # Mock cloud event
    class MockCloudEvent:
        def __init__(self, data):
            self.data = data
    
    mock_event = MockCloudEvent({
        "message": {
            "data": base64.b64encode(json.dumps(test_budget_data).encode()).decode()
        }
    })
    
    result = process_budget_alert(mock_event)
    print(f"Test result: {result}")