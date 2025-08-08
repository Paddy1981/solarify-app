"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { errorTracker } from '../../lib/monitoring/error-tracker';
import { useErrorTracking } from './ErrorTrackingProvider';

interface PerformanceMonitorProps {
  children: React.ReactNode;
}

export function PerformanceMonitor({ children }: PerformanceMonitorProps) {
  const router = useRouter();
  const { addBreadcrumb } = useErrorTracking();
  const navigationStartTime = useRef<number | null>(null);
  const routeChangeStartTime = useRef<number | null>(null);

  useEffect(() => {
    // Track initial page load performance
    if (typeof window !== 'undefined' && window.performance) {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationTiming) {
        // Track various load metrics
        errorTracker.capturePerformanceMetric(
          'page_load',
          'dns_lookup',
          navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart
        );
        
        errorTracker.capturePerformanceMetric(
          'page_load',
          'tcp_connection',
          navigationTiming.connectEnd - navigationTiming.connectStart
        );
        
        errorTracker.capturePerformanceMetric(
          'page_load',
          'ssl_negotiation',
          navigationTiming.connectEnd - navigationTiming.secureConnectionStart
        );
        
        errorTracker.capturePerformanceMetric(
          'page_load',
          'server_response',
          navigationTiming.responseEnd - navigationTiming.requestStart
        );
        
        errorTracker.capturePerformanceMetric(
          'page_load',
          'dom_processing',
          navigationTiming.domComplete - navigationTiming.domLoading
        );
      }
    }
  }, []);

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      routeChangeStartTime.current = performance.now();
      addBreadcrumb(`Navigation started to: ${url}`, 'navigation');
      errorTracker.setContext('current_route', url);
    };

    const handleRouteChangeComplete = (url: string) => {
      if (routeChangeStartTime.current !== null) {
        const navigationTime = performance.now() - routeChangeStartTime.current;
        
        errorTracker.capturePerformanceMetric(
          'page_load',
          'route_change',
          navigationTime,
          'ms',
          {
            from_route: router.asPath,
            to_route: url,
            navigation_type: 'client_side'
          }
        );
        
        addBreadcrumb(`Navigation completed to: ${url} (${navigationTime.toFixed(2)}ms)`, 'navigation');
        routeChangeStartTime.current = null;
      }
    };

    const handleRouteChangeError = (err: Error, url: string) => {
      errorTracker.captureError(
        `Route change error: ${err.message}`,
        'navigation',
        'high',
        {
          target_url: url,
          current_route: router.asPath,
          error_stack: err.stack
        }
      );
      
      addBreadcrumb(`Navigation error to: ${url}`, 'navigation', { error: err.message });
      routeChangeStartTime.current = null;
    };

    // Subscribe to router events
    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    // Cleanup
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router, addBreadcrumb]);

  // Monitor for slow renders
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          // Track long tasks (> 50ms)
          if (entry.entryType === 'longtask') {
            errorTracker.capturePerformanceMetric(
              'render',
              'long_task',
              entry.duration,
              'ms',
              {
                attribution: (entry as any).attribution?.[0]?.name || 'unknown'
              }
            );
          }
          
          // Track paint metrics
          if (entry.entryType === 'paint') {
            errorTracker.capturePerformanceMetric(
              'render',
              entry.name.replace('-', '_'),
              entry.startTime,
              'ms'
            );
          }
        });
      });
      
      // Observe long tasks and paint events
      try {
        observer.observe({ entryTypes: ['longtask', 'paint'] });
      } catch (e) {
        // Some browsers might not support all entry types
        console.warn('Performance observer failed to start:', e);
      }
      
      return () => observer.disconnect();
    }
  }, []);

  return <>{children}</>;
}

// Hook for component-level performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const mountTime = useRef<number | null>(null);
  const renderCount = useRef<number>(0);
  
  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      if (mountTime.current !== null) {
        const lifetime = performance.now() - mountTime.current;
        
        errorTracker.capturePerformanceMetric(
          'custom',
          `component_lifetime_${componentName}`,
          lifetime,
          'ms',
          {
            component: componentName,
            render_count: renderCount.current.toString()
          }
        );
      }
    };
  }, [componentName]);
  
  // Track render performance
  useEffect(() => {
    renderCount.current += 1;
    
    if (renderCount.current > 1) {
      // This is a re-render, measure it
      const renderStart = performance.now();
      
      // Use setTimeout to measure after render
      setTimeout(() => {
        const renderTime = performance.now() - renderStart;
        
        errorTracker.capturePerformanceMetric(
          'render',
          `component_render_${componentName}`,
          renderTime,
          'ms',
          {
            component: componentName,
            render_number: renderCount.current.toString()
          }
        );
      }, 0);
    }
  });
  
  return {
    measureOperation: (operationName: string, operation: () => void | Promise<void>) => {
      const transaction = errorTracker.startTransaction(`${componentName}.${operationName}`);
      const startTime = performance.now();
      
      try {
        const result = operation();
        
        if (result && typeof result.then === 'function') {
          // Async operation
          return result.then((value) => {
            const duration = performance.now() - startTime;
            errorTracker.capturePerformanceMetric(
              'custom',
              `${componentName}_${operationName}`,
              duration,
              'ms'
            );
            transaction.finish();
            return value;
          }).catch((error) => {
            transaction.finish();
            throw error;
          });
        } else {
          // Sync operation
          const duration = performance.now() - startTime;
          errorTracker.capturePerformanceMetric(
            'custom',
            `${componentName}_${operationName}`,
            duration,
            'ms'
          );
          transaction.finish();
          return result;
        }
      } catch (error) {
        transaction.finish();
        throw error;
      }
    }
  };
}