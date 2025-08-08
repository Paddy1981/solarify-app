"use client";

import React from 'react';

export interface PerformanceMetrics {
  // Loading metrics
  loadingStartTime: number;
  loadingEndTime?: number;
  loadingDuration?: number;
  
  // User interaction metrics
  timeToInteractive?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  
  // Custom metrics
  componentMountTime?: number;
  dataFetchTime?: number;
  renderTime?: number;
  
  // User experience metrics
  perceivedLoadingTime?: number;
  userEngagement?: boolean;
  bounceRate?: boolean;
  
  // Error metrics
  errorCount: number;
  retryCount: number;
  successRate: number;
}

export interface PerformanceBudget {
  maxLoadingTime: number; // ms
  maxRetryAttempts: number;
  targetSuccessRate: number; // percentage
  maxErrorRate: number; // percentage
}

interface PerformanceContext {
  metrics: Record<string, PerformanceMetrics>;
  budgets: Record<string, PerformanceBudget>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: number;
    component: string;
  }>;
  
  // Actions
  startTracking: (componentId: string, budget?: PerformanceBudget) => void;
  endTracking: (componentId: string) => void;
  recordMetric: (componentId: string, metric: Partial<PerformanceMetrics>) => void;
  getMetrics: (componentId: string) => PerformanceMetrics | null;
  getBudgetStatus: (componentId: string) => 'within_budget' | 'warning' | 'exceeded';
  clearMetrics: (componentId: string) => void;
  exportMetrics: () => Record<string, PerformanceMetrics>;
}

const defaultBudget: PerformanceBudget = {
  maxLoadingTime: 2000,
  maxRetryAttempts: 3,
  targetSuccessRate: 95,
  maxErrorRate: 5,
};

const defaultMetrics: PerformanceMetrics = {
  loadingStartTime: 0,
  errorCount: 0,
  retryCount: 0,
  successRate: 100,
};

const PerformanceMonitoringContext = React.createContext<PerformanceContext | null>(null);

export function PerformanceMonitoringProvider({ 
  children,
  globalBudget = defaultBudget,
}: { 
  children: React.ReactNode;
  globalBudget?: PerformanceBudget;
}) {
  const [metrics, setMetrics] = React.useState<Record<string, PerformanceMetrics>>({});
  const [budgets, setBudgets] = React.useState<Record<string, PerformanceBudget>>({});
  const [alerts, setAlerts] = React.useState<PerformanceContext['alerts']>([]);

  const addAlert = React.useCallback((
    componentId: string, 
    type: 'warning' | 'error' | 'info', 
    message: string
  ) => {
    const alert = {
      id: `${componentId}-${Date.now()}`,
      type,
      message,
      timestamp: Date.now(),
      component: componentId,
    };
    
    setAlerts(prev => [alert, ...prev.slice(0, 99)]); // Keep last 100 alerts
    
    // Auto-remove info alerts after 5 seconds
    if (type === 'info') {
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 5000);
    }
  }, []);

  const startTracking = React.useCallback((componentId: string, budget?: PerformanceBudget) => {
    const startTime = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      [componentId]: {
        ...defaultMetrics,
        loadingStartTime: startTime,
        componentMountTime: startTime,
      },
    }));

    setBudgets(prev => ({
      ...prev,
      [componentId]: budget || globalBudget,
    }));

    // Check for Web Vitals if available
    if ('web-vital' in window) {
      // Record First Contentful Paint
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            recordMetric(componentId, { firstContentfulPaint: entry.startTime });
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    }
  }, [globalBudget]);

  const endTracking = React.useCallback((componentId: string) => {
    const endTime = performance.now();
    
    setMetrics(prev => {
      const current = prev[componentId];
      if (!current) return prev;

      const loadingDuration = endTime - current.loadingStartTime;
      const updatedMetrics = {
        ...current,
        loadingEndTime: endTime,
        loadingDuration,
        perceivedLoadingTime: loadingDuration,
      };

      // Check budget compliance
      const budget = budgets[componentId];
      if (budget) {
        if (loadingDuration > budget.maxLoadingTime) {
          addAlert(
            componentId, 
            'warning', 
            `Loading time ${loadingDuration.toFixed(0)}ms exceeds budget of ${budget.maxLoadingTime}ms`
          );
        }

        if (current.errorCount > 0) {
          const errorRate = (current.errorCount / (current.errorCount + 1)) * 100;
          if (errorRate > budget.maxErrorRate) {
            addAlert(
              componentId, 
              'error', 
              `Error rate ${errorRate.toFixed(1)}% exceeds budget of ${budget.maxErrorRate}%`
            );
          }
        }
      }

      return {
        ...prev,
        [componentId]: updatedMetrics,
      };
    });
  }, [budgets, addAlert]);

  const recordMetric = React.useCallback((componentId: string, metric: Partial<PerformanceMetrics>) => {
    setMetrics(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId] || defaultMetrics,
        ...metric,
      },
    }));
  }, []);

  const getMetrics = React.useCallback((componentId: string) => {
    return metrics[componentId] || null;
  }, [metrics]);

  const getBudgetStatus = React.useCallback((componentId: string) => {
    const componentMetrics = metrics[componentId];
    const budget = budgets[componentId];
    
    if (!componentMetrics || !budget) return 'within_budget';

    const issues = [];
    
    if (componentMetrics.loadingDuration && componentMetrics.loadingDuration > budget.maxLoadingTime) {
      issues.push('loading_time');
    }
    
    if (componentMetrics.retryCount > budget.maxRetryAttempts) {
      issues.push('retry_count');
    }
    
    if (componentMetrics.successRate < budget.targetSuccessRate) {
      issues.push('success_rate');
    }

    const errorRate = componentMetrics.errorCount > 0 
      ? (componentMetrics.errorCount / (componentMetrics.errorCount + 1)) * 100 
      : 0;
    
    if (errorRate > budget.maxErrorRate) {
      issues.push('error_rate');
    }

    if (issues.length === 0) return 'within_budget';
    if (issues.some(issue => ['loading_time', 'error_rate'].includes(issue))) return 'exceeded';
    return 'warning';
  }, [metrics, budgets]);

  const clearMetrics = React.useCallback((componentId: string) => {
    setMetrics(prev => {
      const newMetrics = { ...prev };
      delete newMetrics[componentId];
      return newMetrics;
    });
    
    setBudgets(prev => {
      const newBudgets = { ...prev };
      delete newBudgets[componentId];
      return newBudgets;
    });
  }, []);

  const exportMetrics = React.useCallback(() => {
    return { ...metrics };
  }, [metrics]);

  const value: PerformanceContext = {
    metrics,
    budgets,
    alerts,
    startTracking,
    endTracking,
    recordMetric,
    getMetrics,
    getBudgetStatus,
    clearMetrics,
    exportMetrics,
  };

  return (
    <PerformanceMonitoringContext.Provider value={value}>
      {children}
    </PerformanceMonitoringContext.Provider>
  );
}

export function usePerformanceMonitoring() {
  const context = React.useContext(PerformanceMonitoringContext);
  if (!context) {
    throw new Error('usePerformanceMonitoring must be used within a PerformanceMonitoringProvider');
  }
  return context;
}

// Hook for component-level performance tracking
export function useComponentPerformance(
  componentId: string, 
  budget?: PerformanceBudget
) {
  const {
    startTracking,
    endTracking,
    recordMetric,
    getMetrics,
    getBudgetStatus,
    clearMetrics,
  } = usePerformanceMonitoring();

  const [isTracking, setIsTracking] = React.useState(false);
  const [startTime] = React.useState(performance.now());

  // Auto-start tracking when component mounts
  React.useEffect(() => {
    startTracking(componentId, budget);
    setIsTracking(true);

    return () => {
      if (isTracking) {
        endTracking(componentId);
      }
    };
  }, [componentId, budget, startTracking, endTracking, isTracking]);

  // Track component render time
  React.useEffect(() => {
    const renderTime = performance.now() - startTime;
    recordMetric(componentId, { renderTime });
  }, [componentId, recordMetric, startTime]);

  const recordLoadingStart = React.useCallback(() => {
    recordMetric(componentId, { loadingStartTime: performance.now() });
  }, [componentId, recordMetric]);

  const recordLoadingEnd = React.useCallback(() => {
    const endTime = performance.now();
    const metrics = getMetrics(componentId);
    if (metrics) {
      const loadingDuration = endTime - metrics.loadingStartTime;
      recordMetric(componentId, { 
        loadingEndTime: endTime,
        loadingDuration,
        perceivedLoadingTime: loadingDuration,
      });
    }
  }, [componentId, recordMetric, getMetrics]);

  const recordError = React.useCallback(() => {
    const metrics = getMetrics(componentId);
    if (metrics) {
      recordMetric(componentId, { 
        errorCount: metrics.errorCount + 1,
        successRate: Math.max(0, metrics.successRate - 5), // Decrease success rate
      });
    }
  }, [componentId, recordMetric, getMetrics]);

  const recordRetry = React.useCallback(() => {
    const metrics = getMetrics(componentId);
    if (metrics) {
      recordMetric(componentId, { 
        retryCount: metrics.retryCount + 1,
      });
    }
  }, [componentId, recordMetric, getMetrics]);

  const recordSuccess = React.useCallback(() => {
    const metrics = getMetrics(componentId);
    if (metrics) {
      recordMetric(componentId, { 
        successRate: Math.min(100, metrics.successRate + 1),
      });
    }
  }, [componentId, recordMetric, getMetrics]);

  return {
    metrics: getMetrics(componentId),
    budgetStatus: getBudgetStatus(componentId),
    recordLoadingStart,
    recordLoadingEnd,
    recordError,
    recordRetry,
    recordSuccess,
    recordCustomMetric: (metric: Partial<PerformanceMetrics>) => recordMetric(componentId, metric),
    clearMetrics: () => clearMetrics(componentId),
  };
}

// Hook for async operation performance tracking
export function useAsyncPerformance(operationId: string) {
  const { recordMetric, getMetrics } = usePerformanceMonitoring();

  const trackAsyncOperation = React.useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    recordMetric(operationId, { 
      loadingStartTime: startTime,
      dataFetchTime: startTime,
    });

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      recordMetric(operationId, {
        loadingEndTime: endTime,
        loadingDuration: duration,
        dataFetchTime: duration,
        successRate: 100,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const metrics = getMetrics(operationId);
      
      recordMetric(operationId, {
        loadingEndTime: endTime,
        loadingDuration: duration,
        errorCount: (metrics?.errorCount || 0) + 1,
        successRate: Math.max(0, (metrics?.successRate || 100) - 10),
      });

      throw error;
    }
  }, [operationId, recordMetric, getMetrics]);

  return {
    trackAsyncOperation,
    metrics: getMetrics(operationId),
  };
}

// Performance monitoring dashboard hook
export function usePerformanceDashboard() {
  const { 
    metrics, 
    budgets, 
    alerts, 
    exportMetrics,
  } = usePerformanceMonitoring();

  const getOverallStats = React.useCallback(() => {
    const allMetrics = Object.values(metrics);
    
    if (allMetrics.length === 0) {
      return {
        avgLoadingTime: 0,
        totalErrors: 0,
        avgSuccessRate: 100,
        totalComponents: 0,
      };
    }

    const avgLoadingTime = allMetrics.reduce((sum, m) => 
      sum + (m.loadingDuration || 0), 0) / allMetrics.length;
    
    const totalErrors = allMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    
    const avgSuccessRate = allMetrics.reduce((sum, m) => 
      sum + m.successRate, 0) / allMetrics.length;

    return {
      avgLoadingTime,
      totalErrors,
      avgSuccessRate,
      totalComponents: allMetrics.length,
    };
  }, [metrics]);

  const getWorstPerformers = React.useCallback((limit = 5) => {
    return Object.entries(metrics)
      .map(([id, metric]) => ({
        id,
        metric,
        score: calculatePerformanceScore(metric, budgets[id]),
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, limit);
  }, [metrics, budgets]);

  const generateReport = React.useCallback(() => {
    const timestamp = new Date().toISOString();
    const overallStats = getOverallStats();
    const worstPerformers = getWorstPerformers();
    
    return {
      timestamp,
      overallStats,
      worstPerformers,
      alerts: alerts.slice(0, 20), // Last 20 alerts
      metrics: exportMetrics(),
      summary: {
        componentsWithIssues: Object.entries(metrics).filter(([id]) => 
          getBudgetStatus(id) !== 'within_budget'
        ).length,
        avgPerformanceScore: worstPerformers.reduce((sum, p) => sum + p.score, 0) / worstPerformers.length,
      },
    };
  }, [getOverallStats, getWorstPerformers, alerts, exportMetrics, metrics]);

  return {
    overallStats: getOverallStats(),
    worstPerformers: getWorstPerformers(),
    alerts,
    generateReport,
  };
}

// Utility function to calculate performance score
function calculatePerformanceScore(metric: PerformanceMetrics, budget?: PerformanceBudget): number {
  if (!budget) return 100;

  let score = 100;

  // Loading time penalty
  if (metric.loadingDuration) {
    const timeRatio = metric.loadingDuration / budget.maxLoadingTime;
    if (timeRatio > 1) {
      score -= Math.min(30, (timeRatio - 1) * 30);
    }
  }

  // Error penalty
  if (metric.errorCount > 0) {
    score -= Math.min(25, metric.errorCount * 5);
  }

  // Retry penalty
  if (metric.retryCount > budget.maxRetryAttempts) {
    score -= Math.min(15, (metric.retryCount - budget.maxRetryAttempts) * 5);
  }

  // Success rate bonus/penalty
  const successDiff = metric.successRate - budget.targetSuccessRate;
  score += successDiff * 0.1;

  return Math.max(0, Math.min(100, score));
}

function getBudgetStatus(id: string): "within_budget" | "warning" | "exceeded" {
  // This should be implemented based on your actual budget checking logic
  // For now, returning a default value
  return "within_budget";
}