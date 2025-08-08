/**
 * Solar System Performance Analytics API
 * GET /api/analytics/systems/[systemId]/performance
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { solarAnalyticsEngine, AnalyticsPeriod } from '../../../../../lib/analytics/insights/solar-analytics-engine';
import { errorTracker } from '../../../../../lib/monitoring/error-tracker';

interface PerformanceQuery {
  period?: AnalyticsPeriod;
  includeWeather?: boolean;
  includeBenchmarking?: boolean;
  metrics?: string[]; // Specific metrics to include
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const startTime = Date.now();
  const requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      });
    }

    const { systemId } = req.query;
    
    if (!systemId || typeof systemId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'System ID is required',
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      });
    }

    // Parse query parameters
    const {
      period = 'month',
      includeWeather = false,
      includeBenchmarking = false,
      metrics
    } = req.query as Partial<PerformanceQuery>;

    // Validate period
    const validPeriods: AnalyticsPeriod[] = ['day', 'week', 'month', 'quarter', 'year', 'lifetime'];
    if (!validPeriods.includes(period as AnalyticsPeriod)) {
      return res.status(400).json({
        success: false,
        error: `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      });
    }

    // Track API usage
    errorTracker.addBreadcrumb('Analytics API request', 'api', {
      systemId,
      period,
      includeWeather,
      includeBenchmarking,
      requestId
    });

    // Generate analytics
    const analytics = await solarAnalyticsEngine.generateSystemAnalytics(
      systemId,
      period as AnalyticsPeriod,
      {
        includeWeatherData: includeWeather === true || includeWeather === 'true',
        includeBenchmarking: includeBenchmarking === true || includeBenchmarking === 'true',
        forceRefresh: false
      }
    );

    // Filter metrics if specific ones requested
    let responseData = analytics;
    if (metrics && typeof metrics === 'string') {
      const requestedMetrics = metrics.split(',').map(m => m.trim());
      responseData = filterAnalyticsByMetrics(analytics, requestedMetrics);
    }

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: responseData,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime
      }
    });

  } catch (error) {
    errorTracker.captureException(error as Error, {
      systemId: req.query.systemId,
      requestId,
      query: req.query
    });

    const processingTime = Date.now() - startTime;

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime
      }
    });
  }
}

/**
 * Filter analytics data to include only requested metrics
 */
function filterAnalyticsByMetrics(analytics: any, requestedMetrics: string[]): any {
  const filtered: any = {
    systemId: analytics.systemId,
    period: analytics.period,
    lastUpdated: analytics.lastUpdated
  };

  // Map of metric names to analytics properties
  const metricMap: Record<string, string> = {
    'production': 'production',
    'performance': 'performance',
    'financial': 'financial',
    'environmental': 'environmental',
    'health': 'health',
    'insights': 'insights'
  };

  for (const metric of requestedMetrics) {
    const analyticsProperty = metricMap[metric.toLowerCase()];
    if (analyticsProperty && analytics[analyticsProperty]) {
      filtered[analyticsProperty] = analytics[analyticsProperty];
    }
  }

  return filtered;
}