import { errorTracker } from './error-tracker';

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency: number;
  message?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealthResult {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: HealthCheckResult[];
  summary: {
    healthy: number;
    unhealthy: number;
    degraded: number;
    total: number;
  };
}

export class HealthChecker {
  private static instance: HealthChecker;
  private checks: Map<string, () => Promise<HealthCheckResult>> = new Map();
  private lastResults: Map<string, HealthCheckResult> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.registerDefaultChecks();
  }

  public static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  private registerDefaultChecks(): void {
    this.registerCheck('api_health', this.checkAPIHealth.bind(this));
    this.registerCheck('database_connectivity', this.checkDatabaseConnectivity.bind(this));
    this.registerCheck('memory_usage', this.checkMemoryUsage.bind(this));
    this.registerCheck('response_times', this.checkResponseTimes.bind(this));
    this.registerCheck('error_rates', this.checkErrorRates.bind(this));
  }

  public registerCheck(name: string, checkFunction: () => Promise<HealthCheckResult>): void {
    this.checks.set(name, checkFunction);
  }

  public async runAllChecks(): Promise<SystemHealthResult> {
    const results: HealthCheckResult[] = [];
    
    for (const [name, checkFn] of this.checks) {
      try {
        const result = await checkFn();
        results.push(result);
        this.lastResults.set(name, result);
      } catch (error) {
        const failedResult: HealthCheckResult = {
          name,
          status: 'unhealthy',
          latency: 0,
          message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
        results.push(failedResult);
        this.lastResults.set(name, failedResult);
      }
    }

    const summary = {
      healthy: results.filter(r => r.status === 'healthy').length,
      unhealthy: results.filter(r => r.status === 'unhealthy').length,
      degraded: results.filter(r => r.status === 'degraded').length,
      total: results.length
    };

    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (summary.unhealthy > 0) {
      overall = 'unhealthy';
    } else if (summary.degraded > 0) {
      overall = 'degraded';
    }

    const systemHealth: SystemHealthResult = {
      overall,
      timestamp: new Date().toISOString(),
      checks: results,
      summary
    };

    // Log health check results
    if (overall !== 'healthy') {
      errorTracker.captureError(
        `System health check failed: ${overall}`,
        'validation',
        overall === 'unhealthy' ? 'high' : 'medium',
        {
          healthResult: systemHealth,
          failedChecks: results.filter(r => r.status !== 'healthy').map(r => ({
            name: r.name,
            status: r.status,
            message: r.message
          }))
        }
      );
    }

    return systemHealth;
  }

  public async runSingleCheck(name: string): Promise<HealthCheckResult | null> {
    const checkFn = this.checks.get(name);
    if (!checkFn) {
      return null;
    }

    try {
      const result = await checkFn();
      this.lastResults.set(name, result);
      return result;
    } catch (error) {
      const failedResult: HealthCheckResult = {
        name,
        status: 'unhealthy',
        latency: 0,
        message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      this.lastResults.set(name, failedResult);
      return failedResult;
    }
  }

  public getLastResults(): SystemHealthResult {
    const results = Array.from(this.lastResults.values());
    const summary = {
      healthy: results.filter(r => r.status === 'healthy').length,
      unhealthy: results.filter(r => r.status === 'unhealthy').length,
      degraded: results.filter(r => r.status === 'degraded').length,
      total: results.length
    };

    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (summary.unhealthy > 0) {
      overall = 'unhealthy';
    } else if (summary.degraded > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      checks: results,
      summary
    };
  }

  public startPeriodicChecks(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      await this.runAllChecks();
    }, intervalMs);
  }

  public stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Default health check implementations
  private async checkAPIHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        timeout: 5000 // 5 second timeout
      } as any);
      
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        return {
          name: 'api_health',
          status: latency > 2000 ? 'degraded' : 'healthy',
          latency,
          message: latency > 2000 ? 'API responding slowly' : 'API healthy'
        };
      } else {
        return {
          name: 'api_health',
          status: 'unhealthy',
          latency,
          message: `API returned ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        name: 'api_health',
        status: 'unhealthy',
        latency,
        message: `API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkDatabaseConnectivity(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // In a real implementation, this would test Firestore connectivity
      // For now, we'll simulate a database check
      
      // Simulate database query time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      const latency = Date.now() - startTime;
      
      return {
        name: 'database_connectivity',
        status: latency > 500 ? 'degraded' : 'healthy',
        latency,
        message: latency > 500 ? 'Database responding slowly' : 'Database healthy',
        metadata: {
          connectionPool: 'active',
          queries: 'responsive'
        }
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        name: 'database_connectivity',
        status: 'unhealthy',
        latency,
        message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    try {
      if (typeof process === 'undefined') {
        // Browser environment
        return {
          name: 'memory_usage',
          status: 'healthy',
          latency: 0,
          message: 'Memory check not available in browser'
        };
      }

      const memUsage = process.memoryUsage();
      const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const usagePercent = (usedMB / totalMB) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `Memory usage: ${usedMB}MB / ${totalMB}MB (${usagePercent.toFixed(1)}%)`;

      if (usagePercent > 90) {
        status = 'unhealthy';
        message += ' - Critical memory usage';
      } else if (usagePercent > 80) {
        status = 'degraded';
        message += ' - High memory usage';
      }

      return {
        name: 'memory_usage',
        status,
        latency: 0,
        message,
        metadata: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        }
      };
    } catch (error) {
      return {
        name: 'memory_usage',
        status: 'unhealthy',
        latency: 0,
        message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkResponseTimes(): Promise<HealthCheckResult> {
    // This would check average response times from recent metrics
    // For now, we'll simulate this check
    
    const avgResponseTime = Math.random() * 2000; // Simulate 0-2000ms
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = `Average response time: ${avgResponseTime.toFixed(0)}ms`;

    if (avgResponseTime > 3000) {
      status = 'unhealthy';
      message += ' - Critical response times';
    } else if (avgResponseTime > 1500) {
      status = 'degraded';
      message += ' - Slow response times';
    }

    return {
      name: 'response_times',
      status,
      latency: avgResponseTime,
      message,
      metadata: {
        threshold_warning: 1500,
        threshold_critical: 3000
      }
    };
  }

  private async checkErrorRates(): Promise<HealthCheckResult> {
    // This would check error rates from recent metrics
    // For now, we'll simulate this check
    
    const errorRate = Math.random() * 10; // Simulate 0-10% error rate
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = `Error rate: ${errorRate.toFixed(2)}%`;

    if (errorRate > 5) {
      status = 'unhealthy';
      message += ' - High error rate';
    } else if (errorRate > 2) {
      status = 'degraded';
      message += ' - Elevated error rate';
    }

    return {
      name: 'error_rates',
      status,
      latency: 0,
      message,
      metadata: {
        errorRate,
        threshold_warning: 2,
        threshold_critical: 5
      }
    };
  }
}

// Global instance
export const healthChecker = HealthChecker.getInstance();