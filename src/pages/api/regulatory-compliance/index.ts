/**
 * Regulatory Compliance API Endpoints
 * 
 * REST API for regulatory compliance tracking and policy notifications
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { regulatoryComplianceTracker } from '@/lib/solar/regulatory-compliance-tracker';
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
      endpoint: 'regulatory-compliance',
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
    case 'policies':
      return await handleGetPolicies(req, res, timestamp);
    case 'alerts':
      return await handleGetAlerts(req, res, timestamp);
    case 'interconnection-requirements':
      return await handleGetInterconnectionRequirements(req, res, timestamp);
    case 'rate-cases':
      return await handleGetRateCases(req, res, timestamp);
    case 'subscription':
      return await handleGetSubscription(req, res, timestamp);
    case 'compliance-check':
      return await handleComplianceCheck(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action parameter',
        timestamp
      });
  }
}

async function handleGetPolicies(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const {
    state,
    utility,
    category,
    status,
    type,
    page = '1',
    limit = '10'
  } = req.query;

  try {
    let policies = regulatoryComplianceTracker.getAllPolicies();

    // Apply filters
    if (state || utility) {
      policies = regulatoryComplianceTracker.getPoliciesByJurisdiction(
        state as string,
        utility as string
      );
    }

    if (category) {
      policies = policies.filter(p => p.category === category);
    }

    if (status) {
      policies = policies.filter(p => p.status === status);
    }

    if (type) {
      policies = policies.filter(p => p.type === type);
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedPolicies = policies.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: paginatedPolicies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: policies.length,
        pages: Math.ceil(policies.length / limitNum)
      },
      message: `Found ${policies.length} policies`,
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve policies',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetAlerts(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const {
    customerId,
    severity,
    type,
    resolved = 'false',
    page = '1',
    limit = '20'
  } = req.query;

  try {
    let alerts = regulatoryComplianceTracker.getActiveAlerts(customerId as string);

    // Apply filters
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }

    if (resolved === 'true') {
      // Include resolved alerts
      alerts = alerts.concat(
        regulatoryComplianceTracker.getActiveAlerts().filter(alert => alert.resolvedAt)
      );
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedAlerts = alerts.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: paginatedAlerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: alerts.length,
        pages: Math.ceil(alerts.length / limitNum)
      },
      message: `Found ${alerts.length} alerts`,
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve alerts',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetInterconnectionRequirements(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { utilityId } = req.query;

  if (!utilityId) {
    return res.status(400).json({
      success: false,
      error: 'Utility ID is required',
      timestamp
    });
  }

  try {
    const requirements = regulatoryComplianceTracker.getInterconnectionRequirements(
      utilityId as string
    );

    if (!requirements) {
      return res.status(404).json({
        success: false,
        error: 'Interconnection requirements not found for utility',
        timestamp
      });
    }

    return res.status(200).json({
      success: true,
      data: requirements,
      message: 'Interconnection requirements retrieved successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve interconnection requirements',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetRateCases(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { utilityId, status, page = '1', limit = '10' } = req.query;

  try {
    let rateCases = regulatoryComplianceTracker.getActiveRateCases(utilityId as string);

    if (status) {
      rateCases = rateCases.filter(rateCase => rateCase.status === status);
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRateCases = rateCases.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: paginatedRateCases,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: rateCases.length,
        pages: Math.ceil(rateCases.length / limitNum)
      },
      message: `Found ${rateCases.length} rate cases`,
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve rate cases',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleGetSubscription(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { customerId } = req.query;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID is required',
      timestamp
    });
  }

  try {
    const subscription = regulatoryComplianceTracker.getCustomerSubscription(
      customerId as string
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found for customer',
        timestamp
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
      message: 'Subscription retrieved successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve subscription',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleComplianceCheck(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { utilityId, systemCapacity, equipmentList } = req.query;

  if (!utilityId || !systemCapacity) {
    return res.status(400).json({
      success: false,
      error: 'Utility ID and system capacity are required',
      timestamp
    });
  }

  try {
    const equipment = equipmentList ? JSON.parse(equipmentList as string) : [];
    const compliance = await regulatoryComplianceTracker.validateSystemCompliance(
      utilityId as string,
      {
        capacity: parseFloat(systemCapacity as string),
        equipment
      }
    );

    return res.status(200).json({
      success: true,
      data: compliance,
      message: compliance.compliant ? 
        'System is compliant with current requirements' : 
        'System has compliance violations',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Compliance check failed',
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
    case 'track-policy':
      return await handleTrackPolicy(req, res, timestamp);
    case 'track-rate-case':
      return await handleTrackRateCase(req, res, timestamp);
    case 'subscribe':
      return await handleSubscribe(req, res, timestamp);
    case 'check-grandfathering-expiry':
      return await handleCheckGrandfatheringExpiry(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        timestamp
      });
  }
}

async function handleTrackPolicy(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const policyData = req.body;

  // Remove action from policy data
  delete policyData.action;

  if (!policyData.title || !policyData.jurisdiction || !policyData.type) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: title, jurisdiction, type',
      timestamp
    });
  }

  try {
    // Convert string dates to Date objects
    if (policyData.effectiveDate) {
      policyData.effectiveDate = new Date(policyData.effectiveDate);
    }
    if (policyData.expirationDate) {
      policyData.expirationDate = new Date(policyData.expirationDate);
    }

    const policy = await regulatoryComplianceTracker.trackRegulatoryPolicy(policyData);

    return res.status(201).json({
      success: true,
      data: policy,
      message: 'Policy tracking created successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to track policy',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleTrackRateCase(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const rateCaseData = req.body;

  // Remove action from rate case data
  delete rateCaseData.action;

  if (!rateCaseData.utilityId || !rateCaseData.caseNumber || !rateCaseData.type) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: utilityId, caseNumber, type',
      timestamp
    });
  }

  try {
    // Convert string dates to Date objects
    if (rateCaseData.filingDate) {
      rateCaseData.filingDate = new Date(rateCaseData.filingDate);
    }
    if (rateCaseData.proposedEffectiveDate) {
      rateCaseData.proposedEffectiveDate = new Date(rateCaseData.proposedEffectiveDate);
    }
    if (rateCaseData.actualEffectiveDate) {
      rateCaseData.actualEffectiveDate = new Date(rateCaseData.actualEffectiveDate);
    }

    const rateCase = await regulatoryComplianceTracker.trackRateCase(rateCaseData);

    return res.status(201).json({
      success: true,
      data: rateCase,
      message: 'Rate case tracking created successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to track rate case',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleSubscribe(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const subscriptionData = req.body;

  // Remove action from subscription data
  delete subscriptionData.action;

  if (!subscriptionData.customerId || !subscriptionData.subscriptionTypes) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: customerId, subscriptionTypes',
      timestamp
    });
  }

  try {
    const success = await regulatoryComplianceTracker.subscribeToUpdates(subscriptionData);

    return res.status(200).json({
      success,
      message: success ? 
        'Subscription created successfully' : 
        'Failed to create subscription',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to create subscription',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleCheckGrandfatheringExpiry(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  try {
    const alerts = await regulatoryComplianceTracker.checkGrandfatheringExpiry();

    return res.status(200).json({
      success: true,
      data: alerts,
      message: `Found ${alerts.length} grandfathering expiry alerts`,
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to check grandfathering expiry',
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
    case 'update-policy':
      return await handleUpdatePolicy(req, res, timestamp);
    case 'update-rate-case':
      return await handleUpdateRateCase(req, res, timestamp);
    case 'update-subscription':
      return await handleUpdateSubscription(req, res, timestamp);
    case 'update-interconnection-requirements':
      return await handleUpdateInterconnectionRequirements(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        timestamp
      });
  }
}

async function handleUpdatePolicy(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { policyId, updates } = req.body;

  if (!policyId || !updates) {
    return res.status(400).json({
      success: false,
      error: 'Policy ID and updates are required',
      timestamp
    });
  }

  try {
    // Convert string dates to Date objects
    if (updates.effectiveDate) {
      updates.effectiveDate = new Date(updates.effectiveDate);
    }
    if (updates.expirationDate) {
      updates.expirationDate = new Date(updates.expirationDate);
    }

    const updatedPolicy = await regulatoryComplianceTracker.updateRegulatoryPolicy(
      policyId,
      updates
    );

    if (!updatedPolicy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found',
        timestamp
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedPolicy,
      message: 'Policy updated successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to update policy',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleUpdateRateCase(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { rateCaseId, updates } = req.body;

  if (!rateCaseId || !updates) {
    return res.status(400).json({
      success: false,
      error: 'Rate case ID and updates are required',
      timestamp
    });
  }

  try {
    // Convert string dates to Date objects
    if (updates.proposedEffectiveDate) {
      updates.proposedEffectiveDate = new Date(updates.proposedEffectiveDate);
    }
    if (updates.actualEffectiveDate) {
      updates.actualEffectiveDate = new Date(updates.actualEffectiveDate);
    }

    const updatedRateCase = await regulatoryComplianceTracker.updateRateCase(
      rateCaseId,
      updates
    );

    if (!updatedRateCase) {
      return res.status(404).json({
        success: false,
        error: 'Rate case not found',
        timestamp
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedRateCase,
      message: 'Rate case updated successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to update rate case',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleUpdateSubscription(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const subscriptionData = req.body;

  // Remove action from subscription data
  delete subscriptionData.action;

  if (!subscriptionData.customerId) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID is required',
      timestamp
    });
  }

  try {
    const success = await regulatoryComplianceTracker.subscribeToUpdates(subscriptionData);

    return res.status(200).json({
      success,
      message: success ? 
        'Subscription updated successfully' : 
        'Failed to update subscription',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to update subscription',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleUpdateInterconnectionRequirements(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { utilityId, requirements } = req.body;

  if (!utilityId || !requirements) {
    return res.status(400).json({
      success: false,
      error: 'Utility ID and requirements are required',
      timestamp
    });
  }

  try {
    const updatedRequirements = await regulatoryComplianceTracker.updateInterconnectionRequirements(
      utilityId,
      requirements
    );

    return res.status(200).json({
      success: true,
      data: updatedRequirements,
      message: 'Interconnection requirements updated successfully',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to update interconnection requirements',
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
    case 'unsubscribe':
      return await handleUnsubscribe(req, res, timestamp);
    case 'resolve-alert':
      return await handleResolveAlert(req, res, timestamp);
    case 'expire-policy':
      return await handleExpirePolicy(req, res, timestamp);
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        timestamp
      });
  }
}

async function handleUnsubscribe(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { customerId } = req.query;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID is required',
      timestamp
    });
  }

  try {
    const success = await regulatoryComplianceTracker.unsubscribeFromUpdates(
      customerId as string
    );

    return res.status(200).json({
      success,
      message: success ? 
        'Successfully unsubscribed from updates' : 
        'Failed to unsubscribe',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to unsubscribe',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleResolveAlert(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { alertId } = req.query;

  if (!alertId) {
    return res.status(400).json({
      success: false,
      error: 'Alert ID is required',
      timestamp
    });
  }

  try {
    const success = regulatoryComplianceTracker.resolveAlert(alertId as string);

    return res.status(200).json({
      success,
      message: success ? 
        'Alert resolved successfully' : 
        'Failed to resolve alert - alert not found',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to resolve alert',
      message: (error as Error).message,
      timestamp
    });
  }
}

async function handleExpirePolicy(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  timestamp: string
) {
  const { policyId, reason } = req.query;

  if (!policyId || !reason) {
    return res.status(400).json({
      success: false,
      error: 'Policy ID and reason are required',
      timestamp
    });
  }

  try {
    const success = await regulatoryComplianceTracker.expirePolicy(
      policyId as string,
      reason as string
    );

    return res.status(200).json({
      success,
      message: success ? 
        'Policy expired successfully' : 
        'Failed to expire policy - policy not found',
      timestamp
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to expire policy',
      message: (error as Error).message,
      timestamp
    });
  }
}