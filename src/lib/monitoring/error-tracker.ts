/**
 * Comprehensive Error Tracking and Monitoring System
 * Provides real-time error tracking, performance monitoring, and alerting
 */

import { User } from 'firebase/auth';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface ErrorContext {
  userId?: string;
  userRole?: 'homeowner' | 'installer' | 'supplier' | 'admin';
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: number;
  buildVersion: string;
  environment: 'development' | 'staging' | 'production';
}

export interface ErrorEvent {
  id: string;
  type: 'javascript' | 'api' | 'network' | 'validation' | 'auth' | 'database';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context: ErrorContext;
  metadata: Record<string, any>;
  fingerprint: string; // For grouping similar errors
  resolved: boolean;
  occurrenceCount: number;
  firstSeen: number;
  lastSeen: number;
}

export interface PerformanceMetric {
  id: string;
  type: 'page_load' | 'api_response' | 'render' | 'interaction' | 'custom';
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  context: ErrorContext;
  timestamp: number;
  tags: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'error_rate' | 'performance' | 'custom';
  condition: {
    metric: string;
    operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
    threshold: number;
    timeWindow: number; // minutes
  };
  severity: 'info' | 'warning' | 'critical';
  channels: ('email' | 'slack' | 'sms' | 'webhook')[];
  enabled: boolean;
  metadata: Record<string, any>;
}

// =====================================================
// ERROR TRACKER CLASS
// =====================================================

export class ErrorTracker {
  private static instance: ErrorTracker;
  private sessionId: string;
  private context: Partial<ErrorContext>;
  private errorQueue: ErrorEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.context = this.buildBaseContext();
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
    this.startFlushTimer();
    this.setupNetworkMonitoring();
  }

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  // =====================================================
  // PUBLIC API
  // =====================================================

  public setUser(user: User | null): void {
    if (user) {
      this.context.userId = user.uid;
      // Note: userRole would be fetched from user profile
    } else {
      this.context.userId = undefined;
      this.context.userRole = undefined;
    }
  }

  public captureError(
    error: Error | string, 
    type: ErrorEvent['type'] = 'javascript',
    severity: ErrorEvent['severity'] = 'medium',
    metadata: Record<string, any> = {}
  ): string {
    const errorEvent = this.createErrorEvent(error, type, severity, metadata);
    this.errorQueue.push(errorEvent);
    
    // Send critical errors immediately
    if (severity === 'critical') {
      this.flushErrors();
    }

    return errorEvent.id;
  }

  public captureException(error: Error, metadata: Record<string, any> = {}): string {
    return this.captureError(error, 'javascript', 'high', {
      ...metadata,
      stack: error.stack,
      name: error.name
    });
  }

  public captureAPIError(
    url: string, 
    method: string, 
    status: number, 
    responseText?: string
  ): string {
    return this.captureError(
      `API Error: ${method} ${url} - ${status}`,
      'api',
      status >= 500 ? 'high' : 'medium',
      {
        url,
        method,
        status,
        responseText: responseText?.substring(0, 1000) // Limit response text
      }
    );
  }

  public capturePerformanceMetric(
    type: PerformanceMetric['type'],
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    tags: Record<string, string> = {}
  ): void {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      type,
      name,
      value,
      unit,
      context: this.buildFullContext(),
      timestamp: Date.now(),
      tags
    };

    this.performanceQueue.push(metric);
  }

  public startTransaction(name: string): Transaction {
    return new Transaction(name, this);
  }

  public addBreadcrumb(message: string, category: string = 'navigation', data?: any): void {
    // Store breadcrumbs for error context
    const breadcrumb = {
      message,
      category,
      timestamp: Date.now(),
      data
    };

    if (!this.context.metadata) this.context.metadata = {};
    if (!this.context.metadata.breadcrumbs) this.context.metadata.breadcrumbs = [];
    
    this.context.metadata.breadcrumbs.push(breadcrumb);
    
    // Keep only last 50 breadcrumbs
    if (this.context.metadata.breadcrumbs.length > 50) {
      this.context.metadata.breadcrumbs.shift();
    }
  }

  public setTag(key: string, value: string): void {
    if (!this.context.metadata) this.context.metadata = {};
    if (!this.context.metadata.tags) this.context.metadata.tags = {};
    this.context.metadata.tags[key] = value;
  }

  public setContext(key: string, value: any): void {
    if (!this.context.metadata) this.context.metadata = {};
    this.context.metadata[key] = value;
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildBaseContext(): Partial<ErrorContext> {
    return {
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      buildVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: (process.env.NODE_ENV as any) || 'development',
      metadata: {}
    };
  }

  private buildFullContext(): ErrorContext {
    return {
      ...this.buildBaseContext(),
      ...this.context
    } as ErrorContext;
  }

  private createErrorEvent(
    error: Error | string,
    type: ErrorEvent['type'],
    severity: ErrorEvent['severity'],
    metadata: Record<string, any>
  ): ErrorEvent {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    const fingerprint = this.generateFingerprint(message, stack);

    return {
      id: this.generateId(),
      type,
      severity,
      message,
      stack,
      context: this.buildFullContext(),
      metadata,
      fingerprint,
      resolved: false,
      occurrenceCount: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now()
    };
  }

  private generateFingerprint(message: string, stack?: string): string {
    // Create a fingerprint for grouping similar errors
    const key = stack ? 
      stack.split('\n').slice(0, 3).join('') : // Use first 3 stack frames
      message;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(
        event.error || event.message,
        'javascript',
        'high',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason,
        'javascript',
        'high',
        {
          type: 'unhandled_promise_rejection'
        }
      );
    });
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Core Web Vitals
    this.observeWebVitals();

    // Navigation timing
    this.observeNavigationTiming();

    // Resource timing  
    this.observeResourceTiming();
  }

  private observeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.capturePerformanceMetric(
        'page_load',
        'largest_contentful_paint',
        lastEntry.startTime,
        'ms',
        { type: 'core_web_vital' }
      );
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.capturePerformanceMetric(
          'interaction',
          'first_input_delay',
          (entry as any).processingStart - entry.startTime,
          'ms',
          { type: 'core_web_vital' }
        );
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      
      this.capturePerformanceMetric(
        'render',
        'cumulative_layout_shift',
        clsValue,
        'count',
        { type: 'core_web_vital' }
      );
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private observeNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.capturePerformanceMetric('page_load', 'dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.capturePerformanceMetric('page_load', 'load_complete', navigation.loadEventEnd - navigation.loadEventStart);
          this.capturePerformanceMetric('page_load', 'total_load_time', navigation.loadEventEnd - navigation.fetchStart);
        }
      }, 0);
    });
  }

  private observeResourceTiming(): void {
    if (typeof window === 'undefined') return;

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const resource = entry as PerformanceResourceTiming;
        
        // Track slow resources
        const loadTime = resource.responseEnd - resource.requestStart;
        if (loadTime > 1000) { // Resources taking more than 1 second
          this.capturePerformanceMetric(
            'page_load',
            'slow_resource',
            loadTime,
            'ms',
            {
              resource_name: resource.name,
              resource_type: resource.initiatorType
            }
          );
        }
      });
    }).observe({ entryTypes: ['resource'] });
  }

  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.addBreadcrumb('Network connection restored', 'network');
      this.flushQueues(); // Flush any queued data
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.addBreadcrumb('Network connection lost', 'network');
    });
  }

  private startFlushTimer(): void {
    // Flush queues every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushQueues();
    }, 30000);
  }

  private async flushQueues(): Promise<void> {
    if (!this.isOnline) return;

    await Promise.all([
      this.flushErrors(),
      this.flushPerformanceMetrics()
    ]);
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await this.sendToEndpoint('/api/monitoring/errors', { errors });
    } catch (error) {
      // Re-queue errors if sending fails
      this.errorQueue.unshift(...errors);
      console.error('Failed to send error data:', error);
    }
  }

  private async flushPerformanceMetrics(): Promise<void> {
    if (this.performanceQueue.length === 0) return;

    const metrics = [...this.performanceQueue];
    this.performanceQueue = [];

    try {
      await this.sendToEndpoint('/api/monitoring/performance', { metrics });
    } catch (error) {
      // Re-queue metrics if sending fails
      this.performanceQueue.unshift(...metrics);
      console.error('Failed to send performance data:', error);
    }
  }

  private async sendToEndpoint(endpoint: string, data: any): Promise<void> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }
}

// =====================================================
// TRANSACTION CLASS
// =====================================================

export class Transaction {
  private startTime: number;
  private endTime?: number;
  private name: string;
  private errorTracker: ErrorTracker;
  private spans: Array<{ name: string; startTime: number; endTime?: number }> = [];

  constructor(name: string, errorTracker: ErrorTracker) {
    this.name = name;
    this.errorTracker = errorTracker;
    this.startTime = performance.now();
  }

  public startSpan(name: string): void {
    this.spans.push({
      name,
      startTime: performance.now()
    });
  }

  public finishSpan(name: string): void {
    const span = this.spans.find(s => s.name === name && !s.endTime);
    if (span) {
      span.endTime = performance.now();
    }
  }

  public finish(): void {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;

    this.errorTracker.capturePerformanceMetric(
      'custom',
      this.name,
      duration,
      'ms',
      {
        transaction_type: 'custom',
        span_count: this.spans.length.toString()
      }
    );

    // Also capture span durations
    this.spans.forEach(span => {
      if (span.endTime) {
        this.errorTracker.capturePerformanceMetric(
          'custom',
          `${this.name}.${span.name}`,
          span.endTime - span.startTime,
          'ms',
          { span_type: 'custom' }
        );
      }
    });
  }
}

// =====================================================
// ALERT MANAGER
// =====================================================

export class AlertManager {
  private static instance: AlertManager;
  private rules: AlertRule[] = [];
  private metricBuffer: Map<string, PerformanceMetric[]> = new Map();

  private constructor() {
    this.loadDefaultRules();
    this.startMetricEvaluation();
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  private loadDefaultRules(): void {
    this.rules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        type: 'error_rate',
        condition: {
          metric: 'error_count',
          operator: '>',
          threshold: 10,
          timeWindow: 5
        },
        severity: 'critical',
        channels: ['slack', 'email'],
        enabled: true,
        metadata: {}
      },
      {
        id: 'slow_page_load',
        name: 'Slow Page Load Times',
        type: 'performance',
        condition: {
          metric: 'page_load_time',
          operator: '>',
          threshold: 3000,
          timeWindow: 10
        },
        severity: 'warning',
        channels: ['slack'],
        enabled: true,
        metadata: {}
      },
      {
        id: 'high_api_latency',
        name: 'High API Response Times',
        type: 'performance',
        condition: {
          metric: 'api_response_time',
          operator: '>',
          threshold: 2000,
          timeWindow: 5
        },
        severity: 'warning',
        channels: ['slack'],
        enabled: true,
        metadata: {}
      }
    ];
  }

  private startMetricEvaluation(): void {
    // Evaluate alert rules every minute
    setInterval(() => {
      this.evaluateRules();
    }, 60000);
  }

  private evaluateRules(): void {
    this.rules.forEach(rule => {
      if (rule.enabled) {
        this.evaluateRule(rule);
      }
    });
  }

  private evaluateRule(rule: AlertRule): void {
    // This would typically evaluate metrics against the rule conditions
    // For now, we'll implement a basic structure
    console.log(`Evaluating rule: ${rule.name}`);
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function withErrorTracking<T extends (...args: any[]) => any>(
  fn: T,
  errorType: ErrorEvent['type'] = 'javascript'
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result && typeof result.catch === 'function') {
        return result.catch((error: Error) => {
          ErrorTracker.getInstance().captureException(error);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      ErrorTracker.getInstance().captureException(error as Error);
      throw error;
    }
  }) as T;
}

export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const transaction = ErrorTracker.getInstance().startTransaction(name);
    const startTime = performance.now();
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.then((value: any) => {
          const endTime = performance.now();
          ErrorTracker.getInstance().capturePerformanceMetric(
            'custom',
            name,
            endTime - startTime
          );
          transaction.finish();
          return value;
        }).catch((error: any) => {
          transaction.finish();
          throw error;
        });
      }
      
      const endTime = performance.now();
      ErrorTracker.getInstance().capturePerformanceMetric(
        'custom',
        name,
        endTime - startTime
      );
      transaction.finish();
      return result;
    } catch (error) {
      transaction.finish();
      throw error;
    }
  }) as T;
}

// Global instance
export const errorTracker = ErrorTracker.getInstance();
export const alertManager = AlertManager.getInstance();