/**
 * Real-time System Data API
 * Provides real-time solar system monitoring data
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { realTimeMonitoringService } from '../../../../../lib/monitoring/real-time-monitoring-service';
import { errorTracker } from '../../../../../lib/monitoring/error-tracker';

interface RealTimeApiRequest extends NextApiRequest {
  query: {
    systemId: string;
    include?: string; // comma-separated list of sections to include
    exclude?: string; // comma-separated list of sections to exclude
    format?: 'json' | 'compact';
  };
}

export default async function handler(
  req: RealTimeApiRequest,
  res: NextApiResponse
) {
  const { systemId, include, exclude, format } = req.query;

  if (!systemId) {
    return res.status(400).json({
      error: 'Missing required parameter: systemId',
      code: 'MISSING_SYSTEM_ID'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetRealTimeData(req, res);
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({
          error: `Method ${req.method} not allowed`,
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    errorTracker.captureException(error as Error, {
      systemId,
      method: req.method,
      endpoint: 'real-time'
    });

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

async function handleGetRealTimeData(
  req: RealTimeApiRequest,
  res: NextApiResponse
) {
  const { systemId, include, exclude, format } = req.query;

  // Get real-time system data
  const realTimeSystem = realTimeMonitoringService.getRealTimeSystem(systemId);

  if (!realTimeSystem) {
    return res.status(404).json({
      error: 'System not found or not monitored',
      code: 'SYSTEM_NOT_FOUND',
      systemId
    });
  }

  // Process include/exclude filters
  let responseData = realTimeSystem;

  if (include || exclude) {
    responseData = filterResponseData(realTimeSystem, include, exclude);
  }

  // Format response based on requested format
  if (format === 'compact') {
    responseData = compactFormat(responseData);
  }

  // Set cache headers for real-time data (short cache)
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
  res.setHeader('Last-Modified', realTimeSystem.lastUpdated.toUTCString());

  // Add metadata
  const response = {
    data: responseData,
    metadata: {
      systemId,
      timestamp: new Date().toISOString(),
      dataAge: Date.now() - realTimeSystem.lastUpdated.getTime(),
      status: realTimeSystem.status.operational,
      version: '1.0'
    }
  };

  return res.status(200).json(response);
}

function filterResponseData(data: any, include?: string, exclude?: string): any {
  const includeFields = include?.split(',').map(f => f.trim()) || [];
  const excludeFields = exclude?.split(',').map(f => f.trim()) || [];

  if (includeFields.length === 0 && excludeFields.length === 0) {
    return data;
  }

  const filtered: any = {};

  // If include is specified, only include those fields
  if (includeFields.length > 0) {
    includeFields.forEach(field => {
      if (data[field] !== undefined) {
        filtered[field] = data[field];
      }
    });
    return filtered;
  }

  // If only exclude is specified, include all except excluded fields
  Object.keys(data).forEach(key => {
    if (!excludeFields.includes(key)) {
      filtered[key] = data[key];
    }
  });

  return filtered;
}

function compactFormat(data: any): any {
  return {
    id: data.systemId,
    status: data.status.operational,
    health: Math.round(data.status.health * 100),
    power: Math.round(data.currentProduction.instantaneous.acPower * 10) / 10,
    energy: Math.round(data.currentProduction.cumulative.todayEnergy * 10) / 10,
    efficiency: Math.round(data.performance.metrics.systemEfficiency * 10) / 10,
    pr: Math.round(data.performance.metrics.performanceRatio * 1000) / 1000,
    temp: Math.round(data.environmental.weather.moduleTemperature),
    irr: Math.round(data.environmental.solar.irradiance),
    alerts: data.alerts.length,
    updated: data.lastUpdated.getTime()
  };
}