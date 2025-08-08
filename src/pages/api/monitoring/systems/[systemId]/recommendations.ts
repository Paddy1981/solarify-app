/**
 * System Recommendations API
 * Provides optimization recommendations and management endpoints
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { performanceOptimizationEngine } from '../../../../../lib/monitoring/performance-optimization-engine';
import { errorTracker } from '../../../../../lib/monitoring/error-tracker';

interface RecommendationsApiRequest extends NextApiRequest {
  query: {
    systemId: string;
    category?: string; // comma-separated list
    priority?: string; // comma-separated list
    status?: string; // comma-separated list
    maxCost?: string;
    limit?: string;
  };
  body?: {
    recommendationId?: string;
    status?: string;
    notes?: string;
    implementationDate?: string;
  };
}

export default async function handler(
  req: RecommendationsApiRequest,
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
        return handleGetRecommendations(req, res);
      case 'PUT':
        return handleUpdateRecommendation(req, res);
      case 'POST':
        return handleRunOptimizationAnalysis(req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'POST']);
        return res.status(405).json({
          error: `Method ${req.method} not allowed`,
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    errorTracker.captureException(error as Error, {
      systemId,
      method: req.method,
      endpoint: 'recommendations'
    });

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

async function handleGetRecommendations(
  req: RecommendationsApiRequest,
  res: NextApiResponse
) {
  const {
    systemId,
    category,
    priority,
    status,
    maxCost,
    limit = '50'
  } = req.query;

  // Parse filter parameters
  const filters: any = {};

  if (category) {
    const categories = category.split(',').map(c => c.trim());
    const validCategories = [
      'equipment_upgrade',
      'maintenance_optimization',
      'operational_adjustment',
      'monitoring_enhancement',
      'system_expansion',
      'energy_management',
      'cost_reduction',
      'safety_improvement'
    ];
    
    if (!categories.every(c => validCategories.includes(c))) {
      return res.status(400).json({
        error: 'Invalid category value',
        code: 'INVALID_CATEGORY',
        validValues: validCategories
      });
    }
    
    filters.category = categories as any;
  }

  if (priority) {
    const priorities = priority.split(',').map(p => p.trim());
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    
    if (!priorities.every(p => validPriorities.includes(p))) {
      return res.status(400).json({
        error: 'Invalid priority value',
        code: 'INVALID_PRIORITY',
        validValues: validPriorities
      });
    }
    
    filters.priority = priorities as any;
  }

  if (status) {
    const statusValues = status.split(',').map(s => s.trim());
    const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'rejected', 'deferred'];
    
    if (!statusValues.every(s => validStatuses.includes(s))) {
      return res.status(400).json({
        error: 'Invalid status value',
        code: 'INVALID_STATUS',
        validValues: validStatuses
      });
    }
    
    filters.status = statusValues as any;
  }

  if (maxCost) {
    const maxCostValue = parseFloat(maxCost);
    if (isNaN(maxCostValue) || maxCostValue < 0) {
      return res.status(400).json({
        error: 'Invalid maxCost value',
        code: 'INVALID_MAX_COST'
      });
    }
    filters.maxCost = maxCostValue;
  }

  try {
    // Get optimization recommendations
    const recommendations = performanceOptimizationEngine.getOptimizationRecommendations(
      systemId,
      filters
    );

    // Get optimization statistics
    const statistics = performanceOptimizationEngine.getOptimizationStatistics(systemId);

    // Limit results
    const limitValue = Math.min(parseInt(limit) || 50, 200); // Max 200 recommendations
    const limitedRecommendations = recommendations.slice(0, limitValue);

    // Set cache headers (10 minutes for recommendations)
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');

    return res.status(200).json({
      data: limitedRecommendations,
      statistics,
      filters,
      metadata: {
        systemId,
        total: recommendations.length,
        returned: limitedRecommendations.length,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to retrieve recommendations',
      code: 'RETRIEVAL_FAILED',
      details: (error as Error).message
    });
  }
}

async function handleUpdateRecommendation(
  req: RecommendationsApiRequest,
  res: NextApiResponse
) {
  const { systemId } = req.query;
  const { recommendationId, status, notes, implementationDate } = req.body || {};

  if (!recommendationId) {
    return res.status(400).json({
      error: 'Missing required field: recommendationId',
      code: 'MISSING_RECOMMENDATION_ID'
    });
  }

  if (!status) {
    return res.status(400).json({
      error: 'Missing required field: status',
      code: 'MISSING_STATUS'
    });
  }

  const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'rejected', 'deferred'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status value',
      code: 'INVALID_STATUS',
      validValues: validStatuses
    });
  }

  // Validate implementation date if provided
  let parsedImplementationDate: Date | undefined;
  if (implementationDate) {
    parsedImplementationDate = new Date(implementationDate);
    if (isNaN(parsedImplementationDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid implementationDate format',
        code: 'INVALID_DATE_FORMAT'
      });
    }
  }

  try {
    // Update recommendation status
    await performanceOptimizationEngine.updateRecommendationStatus(
      recommendationId,
      status as any,
      notes
    );

    return res.status(200).json({
      success: true,
      message: 'Recommendation updated successfully',
      data: {
        recommendationId,
        status,
        notes,
        implementationDate: parsedImplementationDate?.toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    if ((error as Error).message.includes('not found')) {
      return res.status(404).json({
        error: 'Recommendation not found',
        code: 'RECOMMENDATION_NOT_FOUND',
        recommendationId
      });
    }

    return res.status(500).json({
      error: 'Failed to update recommendation',
      code: 'UPDATE_FAILED',
      details: (error as Error).message
    });
  }
}

async function handleRunOptimizationAnalysis(
  req: RecommendationsApiRequest,
  res: NextApiResponse
) {
  const { systemId } = req.query;
  const { force = false } = req.body || {};

  try {
    // Run optimization analysis
    const result = await performanceOptimizationEngine.runOptimizationAnalysis(systemId);

    return res.status(200).json({
      success: true,
      message: 'Optimization analysis completed',
      data: {
        systemId,
        analysisTimestamp: result.timestamp.toISOString(),
        recommendationsGenerated: result.recommendations.length,
        projectedImpact: {
          energyIncrease: result.projectedImpact.shortTerm.energyIncrease,
          costSavings: result.projectedImpact.shortTerm.costSavings,
          efficiencyGain: result.projectedImpact.shortTerm.efficiencyGain
        },
        confidence: result.confidence,
        implementationPlan: {
          totalPhases: result.implementationPlan.phases.length,
          totalDuration: result.implementationPlan.totalDuration,
          totalCost: result.implementationPlan.totalCost
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Optimization analysis failed',
      code: 'ANALYSIS_FAILED',
      details: (error as Error).message
    });
  }
}