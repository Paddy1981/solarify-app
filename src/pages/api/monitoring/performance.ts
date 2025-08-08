import { NextApiRequest, NextApiResponse } from 'next';
import { PerformanceMetric } from '../../../lib/monitoring/error-tracker';
import { logger } from '../../../lib/error-handling/logger';

interface PerformanceBatchRequest {
  metrics: PerformanceMetric[];
}

interface PerformanceResponse {
  success: boolean;
  processed: number;
  errors?: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PerformanceResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      processed: 0,
      errors: ['Method not allowed']
    });
  }

  try {
    const { metrics }: PerformanceBatchRequest = req.body;

    if (!metrics || !Array.isArray(metrics)) {
      return res.status(400).json({
        success: false,
        processed: 0,
        errors: ['Invalid request body - metrics array required']
      });
    }

    // Process each performance metric
    const processedErrors: string[] = [];
    let successCount = 0;

    for (const metric of metrics) {
      try {
        // Validate metric structure
        if (!metric.id || !metric.type || !metric.name || metric.value === undefined) {
          processedErrors.push(`Invalid metric structure for ID: ${metric.id || 'unknown'}`);
          continue;
        }

        // Store metric in database
        await storePerformanceMetric(metric);
        
        // Check if this metric triggers performance alerts
        await checkPerformanceThresholds(metric);
        
        successCount++;
      } catch (err) {
        processedErrors.push(`Failed to process metric ${metric.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return res.status(200).json({
      success: successCount > 0,
      processed: successCount,
      errors: processedErrors.length > 0 ? processedErrors : undefined
    });

  } catch (error) {
    logger.error('Error processing performance batch', { 
      error: error instanceof Error ? error.message : String(error),
      context: 'performance_monitoring'
    });
    return res.status(500).json({
      success: false,
      processed: 0,
      errors: ['Internal server error']
    });
  }
}

async function storePerformanceMetric(metric: PerformanceMetric): Promise<void> {
  // In a real implementation, this would store to Firestore or time-series database
  logger.info('Storing performance metric', {
    id: metric.id,
    type: metric.type,
    name: metric.name,
    value: metric.value,
    unit: metric.unit,
    timestamp: metric.timestamp,
    userId: metric.context.userId,
    environment: metric.context.environment,
    tags: metric.tags,
    context: 'performance_storage'
  });

  // TODO: Implement time-series database storage (e.g., InfluxDB, Firestore)
  // const db = getFirestore();
  // await addDoc(collection(db, 'performance_metrics'), {
  //   ...metric,
  //   storedAt: new Date()
  // });
}

async function checkPerformanceThresholds(metric: PerformanceMetric): Promise<void> {
  const thresholds = getPerformanceThresholds();
  
  for (const threshold of thresholds) {
    if (matchesThreshold(metric, threshold)) {
      const isViolated = evaluateThreshold(metric.value, threshold);
      
      if (isViolated) {
        await triggerPerformanceAlert(metric, threshold);
      }
    }
  }
}

interface PerformanceThreshold {
  name: string;
  metricType: string;
  metricName?: string;
  operator: '>' | '<' | '>=' | '<=';
  value: number;
  severity: 'info' | 'warning' | 'critical';
  description: string;
}

function getPerformanceThresholds(): PerformanceThreshold[] {
  return [
    {
      name: 'Slow Page Load',
      metricType: 'page_load',
      metricName: 'total_load_time',
      operator: '>',
      value: 5000, // 5 seconds
      severity: 'warning',
      description: 'Page load time exceeds 5 seconds'
    },
    {
      name: 'Critical Page Load',
      metricType: 'page_load',
      metricName: 'total_load_time',
      operator: '>',
      value: 10000, // 10 seconds
      severity: 'critical',
      description: 'Page load time exceeds 10 seconds'
    },
    {
      name: 'Poor LCP',
      metricType: 'page_load',
      metricName: 'largest_contentful_paint',
      operator: '>',
      value: 4000, // 4 seconds
      severity: 'warning',
      description: 'Largest Contentful Paint exceeds 4 seconds'
    },
    {
      name: 'High FID',
      metricType: 'interaction',
      metricName: 'first_input_delay',
      operator: '>',
      value: 300, // 300ms
      severity: 'warning',
      description: 'First Input Delay exceeds 300ms'
    },
    {
      name: 'Poor CLS',
      metricType: 'render',
      metricName: 'cumulative_layout_shift',
      operator: '>',
      value: 0.25,
      severity: 'warning',
      description: 'Cumulative Layout Shift exceeds 0.25'
    },
    {
      name: 'Slow API Response',
      metricType: 'api_response',
      operator: '>',
      value: 2000, // 2 seconds
      severity: 'warning',
      description: 'API response time exceeds 2 seconds'
    },
    {
      name: 'Critical API Response',
      metricType: 'api_response',
      operator: '>',
      value: 5000, // 5 seconds
      severity: 'critical',
      description: 'API response time exceeds 5 seconds'
    }
  ];
}

function matchesThreshold(metric: PerformanceMetric, threshold: PerformanceThreshold): boolean {
  if (metric.type !== threshold.metricType) {
    return false;
  }
  
  if (threshold.metricName && metric.name !== threshold.metricName) {
    return false;
  }
  
  return true;
}

function evaluateThreshold(value: number, threshold: PerformanceThreshold): boolean {
  switch (threshold.operator) {
    case '>':
      return value > threshold.value;
    case '<':
      return value < threshold.value;
    case '>=':
      return value >= threshold.value;
    case '<=':
      return value <= threshold.value;
    default:
      return false;
  }
}

async function triggerPerformanceAlert(
  metric: PerformanceMetric, 
  threshold: PerformanceThreshold
): Promise<void> {
  const alertData = {
    type: 'performance_threshold_exceeded',
    title: `Performance Alert: ${threshold.name}`,
    description: threshold.description,
    metric: {
      name: metric.name,
      type: metric.type,
      value: metric.value,
      unit: metric.unit,
      threshold: threshold.value,
      operator: threshold.operator
    },
    severity: threshold.severity,
    environment: metric.context.environment,
    url: metric.context.url,
    userId: metric.context.userId,
    timestamp: new Date(metric.timestamp).toISOString()
  };

  await sendPerformanceAlert(alertData);
}

async function sendPerformanceAlert(alertData: any): Promise<void> {
  try {
    logger.info('Sending performance alert', { 
      alertData,
      context: 'performance_alert'
    });
    
    // Send to notification channels based on severity
    if (alertData.severity === 'critical') {
      // Send to all channels for critical issues
      await Promise.all([
        sendSlackAlert(alertData),
        sendEmailAlert(alertData)
      ]);
    } else if (alertData.severity === 'warning') {
      // Send to Slack for warnings
      await sendSlackAlert(alertData);
    }
    
  } catch (error) {
    logger.error('Failed to send performance alert', { 
      error: error instanceof Error ? error.message : String(error),
      context: 'performance_alert'
    });
  }
}

async function sendSlackAlert(alertData: any): Promise<void> {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  const color = alertData.severity === 'critical' ? '#ff0000' : 
                alertData.severity === 'warning' ? '#ffaa00' : '#00ff00';

  const slackPayload = {
    text: `⚡ ${alertData.title}`,
    attachments: [
      {
        color: color,
        fields: [
          {
            title: 'Metric',
            value: `${alertData.metric.name}: ${alertData.metric.value}${alertData.metric.unit}`,
            short: true
          },
          {
            title: 'Threshold',
            value: `${alertData.metric.operator} ${alertData.metric.threshold}${alertData.metric.unit}`,
            short: true
          },
          {
            title: 'Environment',
            value: alertData.environment,
            short: true
          },
          {
            title: 'Severity',
            value: alertData.severity.toUpperCase(),
            short: true
          },
          {
            title: 'URL',
            value: alertData.url || 'N/A',
            short: false
          }
        ],
        footer: 'Solarify Performance Monitor',
        ts: Math.floor(new Date(alertData.timestamp).getTime() / 1000)
      }
    ]
  };

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(slackPayload)
  });
}

async function sendEmailAlert(alertData: any): Promise<void> {
  // TODO: Implement email alerting
  // This would integrate with services like SendGrid, AWS SES, etc.
  logger.info('Email alert would be sent', { 
    title: alertData.title,
    context: 'email_alert'
  });
}