export interface NotificationChannel {
  type: 'slack' | 'email' | 'sms' | 'webhook';
  config: {
    url?: string;
    channel?: string;
    recipients?: string[];
    webhookUrl?: string;
  };
  enabled: boolean;
}

export interface AlertThreshold {
  id: string;
  name: string;
  description: string;
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  timeWindow: number; // minutes
  severity: 'info' | 'warning' | 'critical';
  channels: string[];
  enabled: boolean;
  environment?: string[];
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThreshold[] = [
  // Error Rate Thresholds
  {
    id: 'critical_error_rate',
    name: 'Critical Error Rate',
    description: 'Triggers when critical errors exceed threshold',
    metric: 'error_rate_critical',
    operator: '>',
    value: 5,
    timeWindow: 5,
    severity: 'critical',
    channels: ['slack_critical', 'email_alerts'],
    enabled: true,
    environment: ['production']
  },
  {
    id: 'high_error_rate',
    name: 'High Error Rate',
    description: 'Triggers when total error rate is high',
    metric: 'error_rate_total',
    operator: '>',
    value: 20,
    timeWindow: 10,
    severity: 'warning',
    channels: ['slack_alerts'],
    enabled: true
  },
  
  // Performance Thresholds
  {
    id: 'page_load_slow',
    name: 'Slow Page Load Times',
    description: 'Average page load time exceeds threshold',
    metric: 'avg_page_load_time',
    operator: '>',
    value: 5000, // 5 seconds
    timeWindow: 15,
    severity: 'warning',
    channels: ['slack_performance'],
    enabled: true
  },
  {
    id: 'page_load_critical',
    name: 'Critical Page Load Times',
    description: 'Average page load time critically slow',
    metric: 'avg_page_load_time',
    operator: '>',
    value: 10000, // 10 seconds
    timeWindow: 10,
    severity: 'critical',
    channels: ['slack_critical', 'email_alerts'],
    enabled: true
  },
  {
    id: 'api_response_slow',
    name: 'Slow API Response Times',
    description: 'API response times exceeding threshold',
    metric: 'avg_api_response_time',
    operator: '>',
    value: 2000, // 2 seconds
    timeWindow: 10,
    severity: 'warning',
    channels: ['slack_performance'],
    enabled: true
  },
  {
    id: 'api_response_critical',
    name: 'Critical API Response Times',
    description: 'API response times critically slow',
    metric: 'avg_api_response_time',
    operator: '>',
    value: 5000, // 5 seconds
    timeWindow: 5,
    severity: 'critical',
    channels: ['slack_critical', 'email_alerts'],
    enabled: true
  },
  
  // Core Web Vitals
  {
    id: 'lcp_poor',
    name: 'Poor Largest Contentful Paint',
    description: 'LCP exceeds good performance threshold',
    metric: 'avg_lcp',
    operator: '>',
    value: 4000, // 4 seconds
    timeWindow: 30,
    severity: 'warning',
    channels: ['slack_performance'],
    enabled: true
  },
  {
    id: 'fid_poor',
    name: 'Poor First Input Delay',
    description: 'FID exceeds good performance threshold',
    metric: 'avg_fid',
    operator: '>',
    value: 300, // 300ms
    timeWindow: 30,
    severity: 'warning',
    channels: ['slack_performance'],
    enabled: true
  },
  {
    id: 'cls_poor',
    name: 'Poor Cumulative Layout Shift',
    description: 'CLS exceeds good performance threshold',
    metric: 'avg_cls',
    operator: '>',
    value: 0.25,
    timeWindow: 30,
    severity: 'warning',
    channels: ['slack_performance'],
    enabled: true
  },
  
  // System Health
  {
    id: 'health_check_failing',
    name: 'Health Check Failures',
    description: 'Application health checks failing',
    metric: 'health_check_failures',
    operator: '>',
    value: 3,
    timeWindow: 5,
    severity: 'critical',
    channels: ['slack_critical', 'email_alerts', 'sms_critical'],
    enabled: true
  },
  {
    id: 'database_connection_errors',
    name: 'Database Connection Errors',
    description: 'Database connection failures detected',
    metric: 'database_errors',
    operator: '>',
    value: 1,
    timeWindow: 5,
    severity: 'critical',
    channels: ['slack_critical', 'email_alerts'],
    enabled: true
  },
  
  // Security Alerts
  {
    id: 'auth_failures',
    name: 'Authentication Failures',
    description: 'High rate of authentication failures',
    metric: 'auth_failure_rate',
    operator: '>',
    value: 50,
    timeWindow: 10,
    severity: 'warning',
    channels: ['slack_security'],
    enabled: true
  },
  {
    id: 'suspicious_activity',
    name: 'Suspicious Activity Detected',
    description: 'Potential security threats detected',
    metric: 'security_violations',
    operator: '>',
    value: 10,
    timeWindow: 5,
    severity: 'critical',
    channels: ['slack_security', 'email_security'],
    enabled: true
  }
];

export const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannel[] = [
  {
    type: 'slack',
    config: {
      url: process.env.SLACK_WEBHOOK_CRITICAL,
      channel: '#critical-alerts'
    },
    enabled: true
  },
  {
    type: 'slack',
    config: {
      url: process.env.SLACK_WEBHOOK_ALERTS,
      channel: '#alerts'
    },
    enabled: true
  },
  {
    type: 'slack',
    config: {
      url: process.env.SLACK_WEBHOOK_PERFORMANCE,
      channel: '#performance'
    },
    enabled: true
  },
  {
    type: 'slack',
    config: {
      url: process.env.SLACK_WEBHOOK_SECURITY,
      channel: '#security-alerts'
    },
    enabled: true
  },
  {
    type: 'email',
    config: {
      recipients: [
        'alerts@solarify.com',
        'devops@solarify.com'
      ]
    },
    enabled: true
  },
  {
    type: 'email',
    config: {
      recipients: [
        'security@solarify.com',
        'admin@solarify.com'
      ]
    },
    enabled: true
  }
];

// Alert escalation rules
export interface EscalationRule {
  id: string;
  thresholdId: string;
  escalateAfter: number; // minutes
  escalateToChannels: string[];
  maxEscalations: number;
}

export const DEFAULT_ESCALATION_RULES: EscalationRule[] = [
  {
    id: 'critical_error_escalation',
    thresholdId: 'critical_error_rate',
    escalateAfter: 15,
    escalateToChannels: ['sms_critical', 'email_critical'],
    maxEscalations: 3
  },
  {
    id: 'health_check_escalation',
    thresholdId: 'health_check_failing',
    escalateAfter: 10,
    escalateToChannels: ['sms_critical'],
    maxEscalations: 2
  }
];

// Maintenance windows configuration
export interface MaintenanceWindow {
  id: string;
  name: string;
  startTime: string; // ISO string or cron pattern
  endTime: string;
  suppressAlerts: string[]; // threshold IDs to suppress
  recurring: boolean;
  enabled: boolean;
}

export const DEFAULT_MAINTENANCE_WINDOWS: MaintenanceWindow[] = [
  {
    id: 'weekly_maintenance',
    name: 'Weekly Maintenance Window',
    startTime: '2024-01-15T02:00:00Z', // Sunday 2 AM UTC
    endTime: '2024-01-15T04:00:00Z',   // Sunday 4 AM UTC
    suppressAlerts: ['page_load_slow', 'api_response_slow'],
    recurring: true,
    enabled: true
  }
];