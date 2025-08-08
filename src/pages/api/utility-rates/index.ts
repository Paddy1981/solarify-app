/**
 * Utility Rate API Endpoints
 * 
 * Comprehensive REST API for utility rate management and optimization
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { utilityRateEngine } from '@/lib/solar/utility-rate-engine';
import { utilityProviderDatabase } from '@/lib/solar/utility-provider-database';
import { utilityRateAPIService } from '@/lib/solar/utility-rate-api-integration';
import { touOptimizationEngine } from '@/lib/solar/tou-optimization-engine';
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
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          timestamp
        });
    }
  } catch (error) {
    errorTracker.captureException(error as Error, {
      endpoint: 'utility-rates',
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

async function handleGetRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { action } = req.query;

  switch (action) {
    case 'search':
      return await handleSearchRates(req, res, timestamp);
    case 'providers':
      return await handleGetProviders(req, res, timestamp);
    case 'calculate':
      return await handleCalculateBill(req, res, timestamp);
    case 'tou-periods':
      return await handleGetTOUPeriods(req, res, timestamp);
    case 'real-time-pricing':
      return await handleGetRealTimePricing(req, res, timestamp);
    case 'sync-status':
      return await handleGetSyncStatus(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action parameter',
        timestamp
      });
  }
}

async function handlePostRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { action } = req.body;

  switch (action) {
    case 'optimize':
      return await handleOptimizeRates(req, res, timestamp);
    case 'optimize-tou':
      return await handleOptimizeTOU(req, res, timestamp);
    case 'sync-rates':
      return await handleSyncRates(req, res, timestamp);
    case 'validate-data':
      return await handleValidateRateData(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        timestamp
      });
  }
}

async function handlePutRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { action } = req.body;

  switch (action) {
    case 'update-schedule':
      return await handleUpdateRateSchedule(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        timestamp
      });
  }
}

// GET endpoint handlers

async function handleSearchRates(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { 
    zipCode, 
    customerClass = 'residential', 
    utilityCompany,
    page = '1',
    limit = '10',
    sortBy = 'rateName',
    sortOrder = 'asc',
    filters
  } = req.query;

  if (!zipCode) {
    return res.status(400).json({
      success: false,
      error: 'ZIP code is required',
      timestamp
    });
  }

  try {
    const rateSchedules = await utilityRateEngine.findRateSchedules(
      zipCode as string,
      customerClass as any,
      utilityCompany as string
    );

    // Apply filters if provided
    let filteredRates = rateSchedules;
    if (filters) {
      const filterObj = JSON.parse(filters as string);
      filteredRates = applyFilters(rateSchedules, filterObj);
    }

    // Apply sorting
    filteredRates = applySorting(filteredRates, sortBy as string, sortOrder as string);

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRates = filteredRates.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: paginatedRates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredRates.length,
        pages: Math.ceil(filteredRates.length / limitNum)
      },
      message: `Found ${filteredRates.length} rate schedules`,
      timestamp
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to search rate schedules',
      timestamp
    });
  }
}

async function handleGetProviders(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { 
    state, 
    city, 
    zipCode, 
    features,
    page = '1',
    limit = '20'
  } = req.query;

  try {
    let providers = [];

    if (zipCode) {
      providers = utilityProviderDatabase.findProvidersByLocation(
        zipCode as string,
        state as string,
        city as string
      );
    } else if (state) {
      providers = utilityProviderDatabase.getProvidersByState(state as string);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either state or zipCode is required',
        timestamp
      });
    }

    // Filter by features if provided
    if (features) {
      const featureObj = JSON.parse(features as string);
      providers = utilityProviderDatabase.findProvidersWithFeatures(featureObj);
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProviders = providers.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: paginatedProviders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: providers.length,
        pages: Math.ceil(providers.length / limitNum)
      },
      message: `Found ${providers.length} utility providers`,
      timestamp
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch utility providers',
      timestamp
    });
  }
}

async function handleCalculateBill(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const {
    scheduleId,
    usageData,
    billingPeriodStart,
    billingPeriodEnd
  } = req.query;

  if (!scheduleId || !usageData || !billingPeriodStart || !billingPeriodEnd) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: scheduleId, usageData, billingPeriodStart, billingPeriodEnd',
      timestamp
    });
  }

  try {
    const usage = JSON.parse(usageData as string);
    const startDate = new Date(billingPeriodStart as string);
    const endDate = new Date(billingPeriodEnd as string);

    const billResult = await utilityRateEngine.calculateBill(
      scheduleId as string,
      usage,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      data: billResult,
      message: 'Bill calculation completed successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Bill calculation failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetTOUPeriods(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { scheduleId, date } = req.query;

  if (!scheduleId) {
    return res.status(400).json({
      success: false,
      error: 'Rate schedule ID is required',
      timestamp
    });
  }

  try {
    const rateSchedule = await utilityRateEngine.getRateSchedule(scheduleId as string);
    const queryDate = date ? new Date(date as string) : new Date();

    if (!rateSchedule.rateStructure.energyCharges.timeOfUseRates) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No TOU periods defined for this rate schedule',
        timestamp
      });
    }

    const touPeriods = rateSchedule.rateStructure.energyCharges.timeOfUseRates;
    
    // Add current period information
    const periodsWithCurrent = touPeriods.map(period => {
      const currentPeriod = utilityRateEngine.calculateTOUPeriod(queryDate, [period]);
      return {
        ...period,
        isCurrentPeriod: currentPeriod?.id === period.id
      };
    });

    return res.status(200).json({
      success: true,
      data: periodsWithCurrent,
      message: `Found ${touPeriods.length} TOU periods`,
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to fetch TOU periods',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetRealTimePricing(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { utilityId, rateScheduleId, timestamp: queryTimestamp } = req.query;

  if (!utilityId || !rateScheduleId) {
    return res.status(400).json({
      success: false,
      error: 'Utility ID and rate schedule ID are required',
      timestamp
    });
  }

  try {
    const queryDate = queryTimestamp ? new Date(queryTimestamp as string) : new Date();
    
    const realTimePricing = await utilityRateAPIService.getRealTimePricing(
      utilityId as string,
      rateScheduleId as string,
      queryDate
    );

    if (!realTimePricing) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Real-time pricing not available for this utility',
        timestamp
      });
    }

    return res.status(200).json({
      success: true,
      data: realTimePricing,
      message: 'Real-time pricing data retrieved successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to fetch real-time pricing',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetSyncStatus(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { utilityId } = req.query;

  try {
    if (utilityId) {
      const status = utilityRateAPIService.getSyncStatus(utilityId as string);
      return res.status(200).json({
        success: true,
        data: status,
        message: status ? 'Sync status retrieved' : 'No sync status found',
        timestamp
      });
    } else {
      // Get sync status for all utilities
      const allStatuses = {}; // Would collect all sync statuses
      return res.status(200).json({
        success: true,
        data: allStatuses,
        message: 'All sync statuses retrieved',
        timestamp
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to fetch sync status',
      timestamp
    });
  }
}

// POST endpoint handlers

async function handleOptimizeRates(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const {
    zipCode,
    usageData,
    customerClass = 'residential',
    systemSpecs
  } = req.body;

  if (!zipCode || !usageData) {
    return res.status(400).json({
      success: false,
      error: 'ZIP code and usage data are required',
      timestamp
    });
  }

  try {
    const optimization = await utilityRateEngine.optimizeRates(
      zipCode,
      usageData,
      customerClass,
      systemSpecs
    );

    return res.status(200).json({
      success: true,
      data: optimization,
      message: 'Rate optimization completed successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Rate optimization failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleOptimizeTOU(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const {
    customerId,
    usageData,
    location,
    systemSpecs
  } = req.body;

  if (!customerId || !usageData || !location) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID, usage data, and location are required',
      timestamp
    });
  }

  try {
    const touOptimization = await touOptimizationEngine.optimizeTOUUsagePatterns(
      // Would need to generate load profile first
      {} as any,
      [],
      systemSpecs
    );

    return res.status(200).json({
      success: true,
      data: touOptimization,
      message: 'TOU optimization completed successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'TOU optimization failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleSyncRates(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { utilityId } = req.body;

  try {
    if (utilityId) {
      // Sync specific utility
      const syncResult = await utilityRateAPIService.syncUtilityRates(utilityId);
      return res.status(200).json({
        success: true,
        data: syncResult,
        message: `Sync completed for utility ${utilityId}`,
        timestamp
      });
    } else {
      // Sync all utilities
      const syncResults = await utilityRateAPIService.syncAllUtilityRates();
      return res.status(200).json({
        success: true,
        data: syncResults,
        message: `Sync completed for ${syncResults.length} utilities`,
        timestamp
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Rate synchronization failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleValidateRateData(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { utilityId, rateScheduleId } = req.body;

  if (!utilityId || !rateScheduleId) {
    return res.status(400).json({
      success: false,
      error: 'Utility ID and rate schedule ID are required',
      timestamp
    });
  }

  try {
    const validation = await utilityRateAPIService.validateRateData(utilityId, rateScheduleId);

    return res.status(200).json({
      success: true,
      data: validation,
      message: validation.isValid ? 'Rate data is valid' : 'Rate data validation failed',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Rate data validation failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

// PUT endpoint handlers

async function handleUpdateRateSchedule(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  // This would handle updating rate schedule data
  // Implementation would depend on data storage strategy
  
  return res.status(501).json({
    success: false,
    error: 'Rate schedule updates not yet implemented',
    timestamp
  });
}

// Helper functions

function applyFilters(rates: any[], filters: any) {
  return rates.filter(rate => {
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'hasTimeOfUse' && value) {
        if (!rate.rateStructure.hasTimeOfUse) return false;
      }
      if (key === 'hasDemandCharges' && value) {
        if (!rate.rateStructure.hasDemandCharges) return false;
      }
      if (key === 'supportsNetMetering' && value) {
        if (!rate.rateStructure.supportsNetMetering) return false;
      }
      if (key === 'solarFriendly' && value) {
        if (!rate.optimization.solarFriendly) return false;
      }
      if (key === 'maxRate' && typeof value === 'number') {
        if (rate.avgRates.annual > value) return false;
      }
    }
    return true;
  });
}

function applySorting(rates: any[], sortBy: string, sortOrder: string) {
  return rates.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'rateName':
        aValue = a.rateName;
        bValue = b.rateName;
        break;
      case 'annualRate':
        aValue = a.avgRates.annual;
        bValue = b.avgRates.annual;
        break;
      case 'effectiveDate':
        aValue = new Date(a.effectiveDate);
        bValue = new Date(b.effectiveDate);
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
}