/**
 * Solar Billing API Endpoints
 * 
 * Comprehensive REST API for solar billing calculations and analysis
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { solarBillingCalculator } from '@/lib/solar/solar-billing-calculator';
import { billingCycleManager } from '@/lib/solar/billing-cycle-manager';
import { errorTracker } from '@/lib/monitoring/error-tracker';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          timestamp
        });
    }
  } catch (error) {
    errorTracker.captureException(error as Error, {
      endpoint: 'solar-billing',
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
    case 'billing-history':
      return await handleGetBillingHistory(req, res, timestamp);
    case 'true-up':
      return await handleGetTrueUp(req, res, timestamp);
    case 'projections':
      return await handleGetProjections(req, res, timestamp);
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
    case 'calculate-comparison':
      return await handleCalculateComparison(req, res, timestamp);
    case 'calculate-monthly':
      return await handleCalculateMonthly(req, res, timestamp);
    case 'project-billing':
      return await handleProjectBilling(req, res, timestamp);
    case 'process-true-up':
      return await handleProcessTrueUp(req, res, timestamp);
    case 'create-billing-cycle':
      return await handleCreateBillingCycle(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        timestamp
      });
  }
}

// GET endpoint handlers

async function handleGetBillingHistory(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { 
    customerId,
    startDate,
    endDate,
    includeProjections = 'false'
  } = req.query;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID is required',
      timestamp
    });
  }

  try {
    // This would query actual billing history from database
    // For now, returning placeholder structure
    const billingHistory = {
      customerId,
      period: {
        startDate: startDate || '2023-01-01',
        endDate: endDate || new Date().toISOString().split('T')[0]
      },
      monthlyBills: [], // Would contain actual billing cycles
      summary: {
        totalBills: 0,
        totalSavings: 0,
        averageMonthlyBill: 0,
        averageMonthlySavings: 0
      },
      projections: includeProjections === 'true' ? [] : undefined
    };

    return res.status(200).json({
      success: true,
      data: billingHistory,
      message: 'Billing history retrieved successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve billing history',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetTrueUp(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { customerId, trueUpYear } = req.query;

  if (!customerId || !trueUpYear) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID and true-up year are required',
      timestamp
    });
  }

  try {
    // This would query actual true-up data from database
    const trueUpData = {
      customerId,
      trueUpYear: parseInt(trueUpYear as string),
      status: 'pending',
      summary: {
        totalProduction: 0,
        totalConsumption: 0,
        netUsage: 0,
        excessGeneration: 0,
        finalBalance: 0
      },
      monthlyBreakdown: []
    };

    return res.status(200).json({
      success: true,
      data: trueUpData,
      message: 'True-up data retrieved successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve true-up data',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetProjections(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { 
    customerId,
    projectionYears = '10',
    scenarios = 'standard'
  } = req.query;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID is required',
      timestamp
    });
  }

  try {
    // This would generate actual projections
    const projections = {
      customerId,
      projectionYears: parseInt(projectionYears as string),
      scenarios: scenarios === 'all' ? ['conservative', 'expected', 'optimistic'] : ['expected'],
      yearlyProjections: [],
      summary: {
        totalLifetimeSavings: 0,
        averageAnnualSavings: 0,
        paybackPeriod: 0,
        netPresentValue: 0
      }
    };

    return res.status(200).json({
      success: true,
      data: projections,
      message: 'Billing projections generated successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to generate projections',
      message: (error as Error).message,
      timestamp
    });
  }
}

// POST endpoint handlers

async function handleCalculateComparison(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const calculationInput = req.body;

  if (!calculationInput.customerId || !calculationInput.historicalUsage) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID and historical usage data are required',
      timestamp
    });
  }

  try {
    const comparison = await solarBillingCalculator.calculateBillingComparison(calculationInput);

    return res.status(200).json({
      success: true,
      data: comparison,
      message: 'Billing comparison calculated successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Billing comparison calculation failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleCalculateMonthly(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const {
    month,
    year,
    usageData,
    productionData,
    rateSchedule,
    nemPolicy
  } = req.body;

  if (!month || !year || !usageData || !rateSchedule) {
    return res.status(400).json({
      success: false,
      error: 'Month, year, usage data, and rate schedule are required',
      timestamp
    });
  }

  try {
    const monthlyBill = await solarBillingCalculator.calculateMonthlyBill(
      month,
      year,
      usageData,
      productionData,
      rateSchedule,
      nemPolicy
    );

    return res.status(200).json({
      success: true,
      data: monthlyBill,
      message: 'Monthly bill calculated successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Monthly bill calculation failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleProjectBilling(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const {
    calculationInput,
    projectionYears,
    scenarios
  } = req.body;

  if (!calculationInput || !projectionYears || !scenarios) {
    return res.status(400).json({
      success: false,
      error: 'Calculation input, projection years, and scenarios are required',
      timestamp
    });
  }

  try {
    const projections = await solarBillingCalculator.projectFutureBilling(
      calculationInput,
      projectionYears,
      scenarios
    );

    return res.status(200).json({
      success: true,
      data: projections,
      message: 'Future billing projections generated successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Billing projection failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleProcessTrueUp(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const {
    customerId,
    trueUpYear,
    billingCycles,
    nemPolicy
  } = req.body;

  if (!customerId || !trueUpYear || !billingCycles || !nemPolicy) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID, true-up year, billing cycles, and NEM policy are required',
      timestamp
    });
  }

  try {
    const trueUpResult = await billingCycleManager.processAnnualTrueUp(
      customerId,
      trueUpYear,
      billingCycles,
      nemPolicy
    );

    return res.status(200).json({
      success: true,
      data: trueUpResult,
      message: 'True-up processing completed successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'True-up processing failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleCreateBillingCycle(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const {
    customerId,
    utilityCompany,
    rateScheduleId,
    nemPolicyId,
    startDate,
    energyData
  } = req.body;

  if (!customerId || !utilityCompany || !rateScheduleId || !startDate || !energyData) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID, utility company, rate schedule ID, start date, and energy data are required',
      timestamp
    });
  }

  try {
    const billingCycle = await billingCycleManager.createBillingCycle(
      customerId,
      utilityCompany,
      rateScheduleId,
      nemPolicyId,
      new Date(startDate),
      energyData
    );

    return res.status(201).json({
      success: true,
      data: billingCycle,
      message: 'Billing cycle created successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Billing cycle creation failed',
      message: (error as Error).message,
      timestamp
    });
  }
}