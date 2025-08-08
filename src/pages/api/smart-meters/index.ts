/**
 * Smart Meter API Endpoints
 * 
 * REST API for smart meter integration and real-time monitoring
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { smartMeterIntegration } from '@/lib/solar/smart-meter-integration';
import { errorTracker } from '@/lib/monitoring/error-tracker';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const timestamp = new Date().toISOString();

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetRequest(req, res, timestamp);
      case 'POST':
        return await handlePostRequest(req, res, timestamp);
      case 'PUT':
        return await handlePutRequest(req, res, timestamp);
      case 'DELETE':
        return await handleDeleteRequest(req, res, timestamp);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          timestamp
        });
    }
  } catch (error) {
    errorTracker.captureException(error as Error, {
      endpoint: 'smart-meters',
      method: req.method,
      url: req.url
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      timestamp
    });
  }
}

// GET Request Handlers

async function handleGetRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { action } = req.query;

  switch (action) {
    case 'meters':
      return await handleGetMeters(req, res, timestamp);
    case 'readings':
      return await handleGetReadings(req, res, timestamp);
    case 'monitoring-sessions':
      return await handleGetMonitoringSessions(req, res, timestamp);
    case 'energy-analysis':
      return await handleGetEnergyAnalysis(req, res, timestamp);
    case 'system-status':
      return await handleGetSystemStatus(req, res, timestamp);
    case 'green-button':
      return await handleGetGreenButton(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action parameter',
        timestamp
      });
  }
}

async function handleGetMeters(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { customerId, utilityId, meterType, active } = req.query;

  try {
    let meters;

    if (customerId) {
      meters = smartMeterIntegration.getCustomerMeters(customerId as string);
    } else {
      meters = smartMeterIntegration.getAllActiveMeters();
    }

    // Apply filters
    if (utilityId) {
      meters = meters.filter(meter => meter.utilityId === utilityId);
    }

    if (meterType) {
      meters = meters.filter(meter => meter.meterType === meterType);
    }

    if (active !== undefined) {
      const isActive = active === 'true';
      meters = meters.filter(meter => meter.isActive === isActive);
    }

    return res.status(200).json({
      success: true,
      data: meters,
      message: `Found ${meters.length} meters`,
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve meters',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetReadings(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { 
    meterId, 
    customerId,
    startDate, 
    endDate, 
    limit = '100',
    type = 'recent'
  } = req.query;

  if (!meterId) {
    return res.status(400).json({
      success: false,
      error: 'Meter ID is required',
      timestamp
    });
  }

  try {
    let readings;

    if (type === 'historical' && startDate && endDate) {
      readings = await smartMeterIntegration.getHistoricalReadings(
        meterId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else {
      readings = smartMeterIntegration.getMeterReadings(
        meterId as string,
        parseInt(limit as string)
      );
    }

    return res.status(200).json({
      success: true,
      data: readings,
      message: `Found ${readings.length} readings`,
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve meter readings',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetMonitoringSessions(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { customerId, sessionId, status } = req.query;

  try {
    let sessions;

    if (sessionId) {
      const session = smartMeterIntegration.getMonitoringSession(sessionId as string);
      sessions = session ? [session] : [];
    } else if (customerId) {
      sessions = smartMeterIntegration.getActiveMonitoringSessions(customerId as string);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either customerId or sessionId is required',
        timestamp
      });
    }

    // Filter by status if provided
    if (status) {
      sessions = sessions.filter(session => session.status === status);
    }

    return res.status(200).json({
      success: true,
      data: sessions,
      message: `Found ${sessions.length} monitoring sessions`,
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve monitoring sessions',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetEnergyAnalysis(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { meterIds, startDate, endDate } = req.query;

  if (!meterIds || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'meterIds, startDate, and endDate are required',
      timestamp
    });
  }

  try {
    const meterIdArray = Array.isArray(meterIds) ? meterIds : [meterIds];
    const analysis = await smartMeterIntegration.analyzeEnergyFlow(
      meterIdArray as string[],
      {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      }
    );

    return res.status(200).json({
      success: true,
      data: analysis,
      message: 'Energy analysis completed successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Energy analysis failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetSystemStatus(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  try {
    const status = smartMeterIntegration.getSystemStatus();

    return res.status(200).json({
      success: true,
      data: status,
      message: 'System status retrieved successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve system status',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetGreenButton(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { customerId, utilityId, startDate, endDate } = req.query;

  if (!customerId || !utilityId || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'customerId, utilityId, startDate, and endDate are required',
      timestamp
    });
  }

  try {
    const greenButtonData = await smartMeterIntegration.downloadGreenButtonData(
      customerId as string,
      utilityId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    if (!greenButtonData) {
      return res.status(404).json({
        success: false,
        error: 'Green Button data not available',
        timestamp
      });
    }

    return res.status(200).json({
      success: true,
      data: greenButtonData,
      message: 'Green Button data retrieved successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve Green Button data',
      message: (error as Error).message,
      timestamp
    });
  }
}

// POST Request Handlers

async function handlePostRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { action } = req.body;

  switch (action) {
    case 'register-meter':
      return await handleRegisterMeter(req, res, timestamp);
    case 'collect-readings':
      return await handleCollectReadings(req, res, timestamp);
    case 'start-monitoring':
      return await handleStartMonitoring(req, res, timestamp);
    case 'convert-green-button':
      return await handleConvertGreenButton(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        timestamp
      });
  }
}

async function handleRegisterMeter(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const meterData = req.body;
  
  // Remove action from meter data
  delete meterData.action;

  if (!meterData.customerId || !meterData.utilityId || !meterData.meterSerialNumber) {
    return res.status(400).json({
      success: false,
      error: 'customerId, utilityId, and meterSerialNumber are required',
      timestamp
    });
  }

  try {
    const meterConfig = await smartMeterIntegration.registerMeter(meterData);

    return res.status(201).json({
      success: true,
      data: meterConfig,
      message: 'Meter registered successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to register meter',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleCollectReadings(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { meterIds, meterId } = req.body;

  try {
    let readings;

    if (meterIds && Array.isArray(meterIds)) {
      readings = await smartMeterIntegration.collectMultipleMeterReadings(meterIds);
    } else if (meterId) {
      const reading = await smartMeterIntegration.collectMeterReading(meterId);
      readings = reading ? [reading] : [];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either meterId or meterIds array is required',
        timestamp
      });
    }

    return res.status(200).json({
      success: true,
      data: readings,
      message: `Collected ${readings.length} meter readings`,
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to collect meter readings',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleStartMonitoring(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { customerId, meterIds, configuration } = req.body;

  if (!customerId || !meterIds || !Array.isArray(meterIds) || !configuration) {
    return res.status(400).json({
      success: false,
      error: 'customerId, meterIds array, and configuration are required',
      timestamp
    });
  }

  try {
    const session = await smartMeterIntegration.startRealTimeMonitoring(
      customerId,
      meterIds,
      configuration
    );

    return res.status(201).json({
      success: true,
      data: session,
      message: 'Real-time monitoring session started',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to start monitoring session',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleConvertGreenButton(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { greenButtonData } = req.body;

  if (!greenButtonData) {
    return res.status(400).json({
      success: false,
      error: 'Green Button data is required',
      timestamp
    });
  }

  try {
    const readings = await smartMeterIntegration.convertGreenButtonToReadings(greenButtonData);

    return res.status(200).json({
      success: true,
      data: readings,
      message: `Converted ${readings.length} readings from Green Button data`,
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to convert Green Button data',
      message: (error as Error).message,
      timestamp
    });
  }
}

// PUT Request Handlers

async function handlePutRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { action } = req.body;

  switch (action) {
    case 'update-meter':
      return await handleUpdateMeter(req, res, timestamp);
    case 'stop-monitoring':
      return await handleStopMonitoring(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        timestamp
      });
  }
}

async function handleUpdateMeter(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { meterId, updates } = req.body;

  if (!meterId || !updates) {
    return res.status(400).json({
      success: false,
      error: 'meterId and updates are required',
      timestamp
    });
  }

  try {
    const updatedMeter = await smartMeterIntegration.updateMeterConfiguration(
      meterId,
      updates
    );

    if (!updatedMeter) {
      return res.status(404).json({
        success: false,
        error: 'Meter not found',
        timestamp
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedMeter,
      message: 'Meter configuration updated successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to update meter configuration',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleStopMonitoring(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'sessionId is required',
      timestamp
    });
  }

  try {
    const success = await smartMeterIntegration.stopRealTimeMonitoring(sessionId);

    return res.status(200).json({
      success,
      message: success ? 
        'Monitoring session stopped successfully' : 
        'Failed to stop monitoring session - session not found',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to stop monitoring session',
      message: (error as Error).message,
      timestamp
    });
  }
}

// DELETE Request Handlers

async function handleDeleteRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { action } = req.query;

  switch (action) {
    case 'deactivate-meter':
      return await handleDeactivateMeter(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        timestamp
      });
  }
}

async function handleDeactivateMeter(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { meterId } = req.query;

  if (!meterId) {
    return res.status(400).json({
      success: false,
      error: 'meterId is required',
      timestamp
    });
  }

  try {
    const success = await smartMeterIntegration.updateMeterConfiguration(
      meterId as string,
      { isActive: false }
    );

    return res.status(200).json({
      success: !!success,
      message: success ? 
        'Meter deactivated successfully' : 
        'Failed to deactivate meter - meter not found',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to deactivate meter',
      message: (error as Error).message,
      timestamp
    });
  }
}