/**
 * Net Metering API Endpoints
 * 
 * Comprehensive REST API for net metering calculations and management
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { netMeteringEngine } from '@/lib/solar/net-metering-engine';
import { utilityRateEngine } from '@/lib/solar/utility-rate-engine';
import { rateOptimizationEngine } from '@/lib/solar/rate-optimization-engine';
import { solarBillingCalculator } from '@/lib/solar/solar-billing-calculator';
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
      endpoint: 'net-metering',
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
    case 'policies':
      return await handleGetPolicies(req, res, timestamp);
    case 'eligibility':
      return await handleCheckEligibility(req, res, timestamp);
    case 'rates':
      return await handleGetRates(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
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
    case 'calculate':
      return await handleCalculateNEM(req, res, timestamp);
    case 'optimize':
      return await handleOptimizeRates(req, res, timestamp);
    case 'compare':
      return await handleCompareBilling(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        timestamp
      });
  }
}

async function handleGetPolicies(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { state, utility, customerClass } = req.query;

  if (!state) {
    return res.status(400).json({
      success: false,
      error: 'State parameter is required',
      timestamp
    });
  }

  const policies = netMeteringEngine.getAvailablePolicies(
    state as string,
    utility as string,
    customerClass as any,
    undefined
  );

  return res.status(200).json({
    success: true,
    data: policies,
    message: `Found ${Object.keys(policies).reduce((count, key) => count + policies[key as keyof typeof policies].length, 0)} policies`,
    timestamp
  });
}

async function handleCheckEligibility(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { 
    policyId, 
    systemCapacity, 
    customerClass, 
    installationDate, 
    annualLoad 
  } = req.query;

  if (!policyId || !systemCapacity || !customerClass) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: policyId, systemCapacity, customerClass',
      timestamp
    });
  }

  const policy = netMeteringEngine.NEM_POLICIES[policyId as string];
  if (!policy) {
    return res.status(404).json({
      success: false,
      error: 'Policy not found',
      timestamp
    });
  }

  // Check grandfathering eligibility
  const grandfatheringEligibility = netMeteringEngine.checkGrandfatheringEligibility(
    policy,
    {
      installationDate: installationDate ? new Date(installationDate as string) : new Date(),
      ptoDate: installationDate ? new Date(installationDate as string) : new Date()
    }
  );

  // Check system size eligibility
  const sizeEligibility = netMeteringEngine.checkSystemSizeEligibility(
    policy,
    {
      acCapacity: parseFloat(systemCapacity as string),
      customerClass: customerClass as any,
      annualLoad: annualLoad ? parseFloat(annualLoad as string) : undefined
    }
  );

  return res.status(200).json({
    success: true,
    data: {
      policy: {
        id: policy.id,
        name: policy.name,
        version: policy.version
      },
      grandfatheringEligibility,
      sizeEligibility,
      eligible: grandfatheringEligibility.eligible && sizeEligibility.eligible
    },
    timestamp
  });
}

async function handleGetRates(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { zipCode, customerClass, utilityCompany } = req.query;

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
      customerClass as any || 'residential',
      utilityCompany as string
    );

    return res.status(200).json({
      success: true,
      data: rateSchedules,
      message: `Found ${rateSchedules.length} rate schedules`,
      timestamp
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch rate schedules',
      timestamp
    });
  }
}

async function handleCalculateNEM(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const {
    policyId,
    energyData,
    utilityRateData,
    options = {}
  } = req.body;

  if (!policyId || !energyData) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: policyId, energyData',
      timestamp
    });
  }

  try {
    const result = await netMeteringEngine.calculateNETMeteringBilling(
      policyId,
      energyData,
      utilityRateData,
      options
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'NEM calculation completed successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Calculation failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleOptimizeRates(
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
      error: 'Missing required parameters: customerId, usageData, location',
      timestamp
    });
  }

  try {
    const optimization = await rateOptimizationEngine.optimizeRateSelection(
      customerId,
      usageData,
      location,
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
      error: 'Optimization failed',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleCompareBilling(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const calculationInput = req.body;

  if (!calculationInput.customerId || !calculationInput.historicalUsage) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: customerId, historicalUsage',
      timestamp
    });
  }

  try {
    const comparison = await solarBillingCalculator.calculateBillingComparison(calculationInput);

    return res.status(200).json({
      success: true,
      data: comparison,
      message: 'Billing comparison completed successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Billing comparison failed',
      message: (error as Error).message,
      timestamp
    });
  }
}