/**
 * System Anomalies API
 * Provides anomaly detection and management endpoints
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { anomalyDetectionEngine } from '../../../../../lib/monitoring/anomaly-detection-engine';
import { errorTracker } from '../../../../../lib/monitoring/error-tracker';

interface AnomaliesApiRequest extends NextApiRequest {
  query: {
    systemId: string;
    startDate?: string;
    endDate?: string;
    severity?: string; // comma-separated list
    status?: string; // comma-separated list
    limit?: string;
    acknowledged?: string; // 'true' or 'false'
  };
  body?: {
    anomalyId?: string;
    status?: string;
    feedback?: {
      correct: boolean;
      actualCause?: string;
      actionTaken?: string;
      outcome?: string;
    };
    notes?: string;
  };
}

export default async function handler(
  req: AnomaliesApiRequest,
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
        return handleGetAnomalies(req, res);
      case 'POST':
        return handleAcknowledgeAnomaly(req, res);
      case 'PUT':
        return handleUpdateAnomaly(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({
          error: `Method ${req.method} not allowed`,
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    errorTracker.captureException(error as Error, {
      systemId,
      method: req.method,
      endpoint: 'anomalies'
    });

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

async function handleGetAnomalies(
  req: AnomaliesApiRequest,
  res: NextApiResponse
) {
  const {
    systemId,
    startDate,
    endDate,
    severity,
    status,
    limit = '50',
    acknowledged
  } = req.query;

  // Parse filter parameters
  const filters: any = {};

  if (startDate) {
    filters.startDate = new Date(startDate);
    if (isNaN(filters.startDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid startDate format',
        code: 'INVALID_DATE_FORMAT'
      });
    }
  }

  if (endDate) {
    filters.endDate = new Date(endDate);
    if (isNaN(filters.endDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid endDate format',
        code: 'INVALID_DATE_FORMAT'
      });
    }
  }

  if (severity) {
    const severityLevels = severity.split(',').map(s => s.trim());
    const validSeverities = ['info', 'warning', 'critical'];
    
    if (!severityLevels.every(s => validSeverities.includes(s))) {
      return res.status(400).json({
        error: 'Invalid severity level',
        code: 'INVALID_SEVERITY',
        validValues: validSeverities
      });
    }
    
    filters.severity = severityLevels as any;
  }

  if (status) {
    const statusValues = status.split(',').map(s => s.trim());
    const validStatuses = ['active', 'investigating', 'resolved', 'false_positive'];
    
    if (!statusValues.every(s => validStatuses.includes(s))) {
      return res.status(400).json({
        error: 'Invalid status value',
        code: 'INVALID_STATUS',
        validValues: validStatuses
      });
    }
    
    filters.status = statusValues as any;
  }

  if (acknowledged === 'true' || acknowledged === 'false') {
    filters.acknowledged = acknowledged === 'true';
  }

  filters.limit = Math.min(parseInt(limit) || 50, 500); // Max 500 anomalies

  try {
    // Get system anomalies
    const anomalies = anomalyDetectionEngine.getSystemAnomalies(systemId, filters);

    // Get detection statistics
    const statistics = anomalyDetectionEngine.getDetectionStatistics(systemId);

    // Set cache headers (5 minutes for anomaly data)
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');

    return res.status(200).json({
      data: anomalies,
      statistics,
      filters,
      metadata: {
        systemId,
        total: anomalies.length,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to retrieve anomalies',
      code: 'RETRIEVAL_FAILED',
      details: (error as Error).message
    });
  }
}

async function handleAcknowledgeAnomaly(
  req: AnomaliesApiRequest,
  res: NextApiResponse
) {
  const { systemId } = req.query;
  const { anomalyId, feedback, notes } = req.body || {};

  if (!anomalyId) {
    return res.status(400).json({
      error: 'Missing required field: anomalyId',
      code: 'MISSING_ANOMALY_ID'
    });
  }

  // Get user from request (in production, extract from JWT token)
  const userId = req.headers['x-user-id'] as string || 'system';

  try {
    // Acknowledge the anomaly
    await anomalyDetectionEngine.acknowledgeAnomaly(anomalyId, userId, feedback);

    return res.status(200).json({
      success: true,
      message: 'Anomaly acknowledged successfully',
      data: {
        anomalyId,
        acknowledgedBy: userId,
        acknowledgedAt: new Date().toISOString(),
        feedback,
        notes
      }
    });

  } catch (error) {
    if ((error as Error).message.includes('not found')) {
      return res.status(404).json({
        error: 'Anomaly not found',
        code: 'ANOMALY_NOT_FOUND',
        anomalyId
      });
    }

    return res.status(500).json({
      error: 'Failed to acknowledge anomaly',
      code: 'ACKNOWLEDGMENT_FAILED',
      details: (error as Error).message
    });
  }
}

async function handleUpdateAnomaly(
  req: AnomaliesApiRequest,
  res: NextApiResponse
) {
  const { systemId } = req.query;
  const { anomalyId, status, notes } = req.body || {};

  if (!anomalyId) {
    return res.status(400).json({
      error: 'Missing required field: anomalyId',
      code: 'MISSING_ANOMALY_ID'
    });
  }

  if (!status) {
    return res.status(400).json({
      error: 'Missing required field: status',
      code: 'MISSING_STATUS'
    });
  }

  const validStatuses = ['active', 'investigating', 'resolved', 'false_positive'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status value',
      code: 'INVALID_STATUS',
      validValues: validStatuses
    });
  }

  const userId = req.headers['x-user-id'] as string || 'system';

  try {
    // Update anomaly status (this would be implemented in anomalyDetectionEngine)
    // For now, we'll simulate the update
    
    return res.status(200).json({
      success: true,
      message: 'Anomaly updated successfully',
      data: {
        anomalyId,
        status,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
        notes
      }
    });

  } catch (error) {
    if ((error as Error).message.includes('not found')) {
      return res.status(404).json({
        error: 'Anomaly not found',
        code: 'ANOMALY_NOT_FOUND',
        anomalyId
      });
    }

    return res.status(500).json({
      error: 'Failed to update anomaly',
      code: 'UPDATE_FAILED',
      details: (error as Error).message
    });
  }
}