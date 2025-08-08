/**
 * System Analytics API
 * Provides historical and analytical data for solar systems
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { reportingAnalyticsSystem } from '../../../../../lib/monitoring/reporting-analytics-system';
import { errorTracker } from '../../../../../lib/monitoring/error-tracker';

interface AnalyticsApiRequest extends NextApiRequest {
  query: {
    systemId: string;
    startDate?: string;
    endDate?: string;
    metrics?: string; // comma-separated list of metrics
    aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'count';
    interval?: 'hour' | 'day' | 'week' | 'month';
    limit?: string;
    format?: 'json' | 'csv';
  };
}

export default async function handler(
  req: AnalyticsApiRequest,
  res: NextApiResponse
) {
  const { systemId } = req.query;

  if (!systemId) {
    return res.status(400).json({
      error: 'Missing required parameter: systemId',
      code: 'MISSING_SYSTEM_ID'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetAnalytics(req, res);
      case 'POST':
        return handleCreateAnalyticsQuery(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          error: `Method ${req.method} not allowed`,
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    errorTracker.captureException(error as Error, {
      systemId,
      method: req.method,
      endpoint: 'analytics'
    });

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

async function handleGetAnalytics(
  req: AnalyticsApiRequest,
  res: NextApiResponse
) {
  const { 
    systemId, 
    startDate, 
    endDate, 
    metrics = 'energy_production,system_efficiency,performance_ratio',
    aggregation = 'avg',
    interval = 'day',
    limit = '100',
    format = 'json'
  } = req.query;

  // Validate and parse date range
  const dateRange = parseDateRange(startDate, endDate, interval);
  if (!dateRange) {
    return res.status(400).json({
      error: 'Invalid date range parameters',
      code: 'INVALID_DATE_RANGE'
    });
  }

  // Parse metrics
  const metricsArray = metrics.split(',').map(m => m.trim());

  // Create analytics query
  const query = {
    systemId,
    dateRange,
    metrics: metricsArray,
    aggregation: aggregation as any,
    filters: [],
    limit: parseInt(limit) || 100
  };

  try {
    // Execute analytics query
    const result = await reportingAnalyticsSystem.executeAnalyticsQuery(query);

    // Format response based on requested format
    if (format === 'csv') {
      return handleCSVResponse(res, result);
    }

    // Set appropriate cache headers
    const cacheMaxAge = getCacheMaxAge(dateRange);
    res.setHeader('Cache-Control', `public, max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`);

    return res.status(200).json({
      data: result.data,
      summary: result.summary,
      query: {
        systemId,
        dateRange,
        metrics: metricsArray,
        aggregation,
        interval
      },
      metadata: {
        executionTime: result.executionTime,
        dataPoints: result.data.length,
        executedAt: result.executedAt.toISOString(),
        version: '1.0'
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Analytics query failed',
      code: 'QUERY_FAILED',
      details: (error as Error).message
    });
  }
}

async function handleCreateAnalyticsQuery(
  req: AnalyticsApiRequest,
  res: NextApiResponse
) {
  const { systemId } = req.query;
  const queryParams = req.body;

  if (!queryParams || typeof queryParams !== 'object') {
    return res.status(400).json({
      error: 'Invalid request body',
      code: 'INVALID_REQUEST_BODY'
    });
  }

  // Validate required fields
  const { dateRange, metrics } = queryParams;
  if (!dateRange || !metrics || !Array.isArray(metrics)) {
    return res.status(400).json({
      error: 'Missing required fields: dateRange, metrics',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // Create analytics query with request body parameters
  const query = {
    systemId,
    dateRange: {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end)
    },
    metrics,
    aggregation: queryParams.aggregation || 'avg',
    filters: queryParams.filters || [],
    groupBy: queryParams.groupBy,
    orderBy: queryParams.orderBy,
    limit: queryParams.limit || 1000
  };

  try {
    const result = await reportingAnalyticsSystem.executeAnalyticsQuery(query);

    return res.status(200).json({
      data: result.data,
      summary: result.summary,
      query,
      metadata: {
        executionTime: result.executionTime,
        dataPoints: result.data.length,
        executedAt: result.executedAt.toISOString(),
        version: '1.0'
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Analytics query failed',
      code: 'QUERY_FAILED',
      details: (error as Error).message
    });
  }
}

function parseDateRange(
  startDate?: string, 
  endDate?: string, 
  interval?: string
): { start: Date; end: Date } | null {
  const now = new Date();
  let start: Date;
  let end = new Date();

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }
    
    if (start > end) {
      return null;
    }
  } else {
    // Default date ranges based on interval
    switch (interval) {
      case 'hour':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours
        break;
      case 'day':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case 'week':
        start = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks
        break;
      case 'month':
        start = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // 12 months
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  }

  return { start, end };
}

function getCacheMaxAge(dateRange: { start: Date; end: Date }): number {
  const now = new Date();
  const endTime = dateRange.end.getTime();
  
  // If the end date is in the past, cache for longer
  if (endTime < now.getTime() - 24 * 60 * 60 * 1000) { // More than 24 hours old
    return 3600; // 1 hour
  }
  
  // If the end date is recent or current, cache for shorter time
  return 300; // 5 minutes
}

function handleCSVResponse(res: NextApiResponse, result: any): void {
  const csvData = convertToCSV(result.data);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="analytics_${Date.now()}.csv"`);
  
  return res.status(200).send(csvData);
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  // Get all unique keys from all data points
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item.metrics || {}).forEach(key => allKeys.add(key));
  });
  
  const headers = ['timestamp', 'systemId', ...Array.from(allKeys)];
  
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(item => {
      const values = [
        item.timestamp,
        item.systemId,
        ...Array.from(allKeys).map(key => item.metrics[key] || '')
      ];
      return values.join(',');
    })
  ];
  
  return csvRows.join('\n');
}