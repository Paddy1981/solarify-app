/**
 * Equipment Performance Analytics API Endpoint
 * Real-time performance monitoring and analytics
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { 
  PerformanceAnalyticsEngine, 
  PerformanceMetrics,
  PerformanceAnalysis,
  AlertSystem
} from '@/lib/solar/equipment-performance-analytics';
import { z } from 'zod';

// Validation schemas
const performanceDataSchema = z.object({
  equipmentId: z.string(),
  equipmentType: z.enum(['panel', 'inverter', 'battery', 'system']),
  timestamp: z.string().transform(str => new Date(str)),
  realtime: z.object({
    power: z.number(),
    voltage: z.number(),
    current: z.number(),
    temperature: z.number(),
    efficiency: z.number().min(0).max(100),
    status: z.enum(['normal', 'warning', 'fault', 'offline'])
  }),
  environmental: z.object({
    irradiance: z.number().min(0),
    ambientTemperature: z.number(),
    windSpeed: z.number().min(0),
    humidity: z.number().min(0).max(100),
    precipitation: z.boolean()
  }),
  calculated: z.object({
    energyProduced: z.number(),
    performanceRatio: z.number().min(0).max(100),
    capacityUtilization: z.number().min(0).max(100),
    degradationRate: z.number(),
    availability: z.number().min(0).max(100)
  }),
  quality: z.object({
    dataCompleteness: z.number().min(0).max(100),
    measurementAccuracy: z.number().min(0).max(100),
    signalQuality: z.number().min(0).max(100),
    lastCalibration: z.string().transform(str => new Date(str))
  })
});

const analyticsQuerySchema = z.object({
  equipmentId: z.string().optional(),
  equipmentIds: z.array(z.string()).optional(),
  timeframe: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  analysisType: z.enum(['performance', 'reliability', 'comparison', 'prediction', 'benchmarking']).default('performance'),
  includeAlerts: z.boolean().default(false),
  includeRecommendations: z.boolean().default(false)
});

// Initialize performance analytics engine
const performanceEngine = new PerformanceAnalyticsEngine();
const alertSystem = new AlertSystem();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await handleGetPerformance(req, res);
    case 'POST':
      return await handleRecordPerformance(req, res);
    case 'PUT':
      return await handleUpdateAlertSettings(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Get performance analytics
 */
async function handleGetPerformance(req: NextApiRequest, res: NextApiResponse) {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const { equipmentId, equipmentIds, timeframe, analysisType, includeAlerts, includeRecommendations } = query;

    let result: any = {};

    switch (analysisType) {
      case 'performance':
        if (equipmentId) {
          result = await performanceEngine.analyzePerformance(equipmentId, timeframe);
        } else {
          return res.status(400).json({
            success: false,
            error: 'equipmentId required for performance analysis'
          });
        }
        break;

      case 'reliability':
        if (equipmentId) {
          result = await performanceEngine.generateReliabilityReport(equipmentId);
        } else {
          return res.status(400).json({
            success: false,
            error: 'equipmentId required for reliability analysis'
          });
        }
        break;

      case 'comparison':
        if (equipmentIds && equipmentIds.length > 1) {
          result = await performanceEngine.compareFleetPerformance(equipmentIds);
        } else {
          return res.status(400).json({
            success: false,
            error: 'Multiple equipmentIds required for comparison analysis'
          });
        }
        break;

      case 'prediction':
        if (equipmentId) {
          result = await performanceEngine.predictMaintenanceNeeds(equipmentId);
        } else {
          return res.status(400).json({
            success: false,
            error: 'equipmentId required for prediction analysis'
          });
        }
        break;

      case 'benchmarking':
        if (equipmentId) {
          // Get equipment details first
          const analysis = await performanceEngine.analyzePerformance(equipmentId, timeframe);
          result = await performanceEngine.getMarketBenchmarks('Unknown', 'Unknown', 'panel'); // Would get actual values
        } else {
          return res.status(400).json({
            success: false,
            error: 'equipmentId required for benchmarking analysis'
          });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid analysis type'
        });
    }

    // Include alerts if requested
    if (includeAlerts) {
      const alerts = alertSystem.getActiveAlerts(equipmentId);
      result.alerts = alerts;
    }

    // Include real-time dashboard if multiple equipment requested
    if (equipmentIds && equipmentIds.length > 0) {
      const dashboard = await performanceEngine.getRealTimePerformance(equipmentIds);
      result.dashboard = dashboard;
    }

    res.status(200).json({
      success: true,
      data: result,
      metadata: {
        analysisType,
        timeframe,
        generatedAt: new Date().toISOString(),
        dataPoints: result.summary?.totalEnergyProduced ? 'available' : 'limited'
      }
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Record performance data
 */
async function handleRecordPerformance(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Handle single or batch performance data
    const isBatch = Array.isArray(req.body);
    const performanceData = isBatch ? req.body : [req.body];

    const results = [];
    const alerts = [];

    for (const data of performanceData) {
      try {
        // Validate performance data
        const validatedData = performanceDataSchema.parse(data) as PerformanceMetrics;
        
        // Record the data
        await performanceEngine.recordPerformanceData(validatedData);
        
        // Check for alerts
        const dataAlerts = alertSystem.checkAlertConditions(validatedData);
        alerts.push(...dataAlerts);
        
        results.push({
          equipmentId: validatedData.equipmentId,
          status: 'recorded',
          timestamp: validatedData.timestamp,
          alertsGenerated: dataAlerts.length
        });

      } catch (error) {
        results.push({
          equipmentId: data.equipmentId || 'unknown',
          status: 'error',
          error: error instanceof Error ? error.message : 'Validation failed'
        });
      }
    }

    // Calculate success rate
    const successCount = results.filter(r => r.status === 'recorded').length;
    const successRate = (successCount / results.length) * 100;

    res.status(200).json({
      success: successRate > 0,
      data: {
        processed: results.length,
        successful: successCount,
        failed: results.length - successCount,
        successRate: Math.round(successRate * 100) / 100,
        results,
        alerts: alerts.length > 0 ? alerts : undefined
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Performance recording error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update alert settings
 */
async function handleUpdateAlertSettings(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { equipmentId, thresholds, alertId, action } = req.body;

    if (alertId && action) {
      // Handle alert actions (acknowledge, resolve)
      let result = false;
      
      switch (action) {
        case 'acknowledge':
          result = alertSystem.acknowledgeAlert(alertId);
          break;
        case 'resolve':
          result = alertSystem.resolveAlert(alertId);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid alert action. Use "acknowledge" or "resolve"'
          });
      }

      return res.status(200).json({
        success: result,
        data: {
          alertId,
          action,
          completed: result
        }
      });
    }

    if (equipmentId && thresholds) {
      // Update alert thresholds
      const thresholdSchema = z.object({
        minEfficiency: z.number().min(0).max(100),
        minPerformanceRatio: z.number().min(0).max(100),
        maxTemperature: z.number(),
        minAvailability: z.number().min(0).max(100)
      });

      const validatedThresholds = thresholdSchema.parse(thresholds);
      alertSystem.setAlertThresholds(equipmentId, validatedThresholds);

      return res.status(200).json({
        success: true,
        data: {
          equipmentId,
          thresholds: validatedThresholds,
          message: 'Alert thresholds updated successfully'
        }
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Either alertId with action, or equipmentId with thresholds required'
    });

  } catch (error) {
    console.error('Alert settings error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid threshold data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Additional endpoints for specific analytics features

/**
 * Get trending equipment performance
 */
export async function getTrendingPerformance(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, timeframe = 'week' } = req.query;

    const trending = await performanceEngine.getTrendingEquipment(
      category as any,
      timeframe as any
    );

    res.status(200).json({
      success: true,
      data: trending,
      metadata: {
        category,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Trending performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Generate performance report
 */
export async function generatePerformanceReport(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      equipmentIds, 
      reportType = 'comprehensive',
      format = 'json',
      timeframe = 'month'
    } = req.body;

    if (!equipmentIds || equipmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'equipmentIds required for report generation'
      });
    }

    const reportData = {
      summary: {},
      detailed: [],
      recommendations: [],
      alerts: []
    };

    // Generate data for each equipment
    for (const equipmentId of equipmentIds) {
      const analysis = await performanceEngine.analyzePerformance(equipmentId, timeframe as any);
      const reliability = await performanceEngine.generateReliabilityReport(equipmentId);
      const predictions = await performanceEngine.predictMaintenanceNeeds(equipmentId);
      
      reportData.detailed.push({
        equipmentId,
        analysis,
        reliability,
        predictions
      });
    }

    // Generate fleet comparison if multiple equipment
    if (equipmentIds.length > 1) {
      reportData.summary = await performanceEngine.compareFleetPerformance(equipmentIds);
    }

    // Get active alerts
    reportData.alerts = alertSystem.getActiveAlerts();

    // Format response based on requested format
    if (format === 'pdf') {
      // In a real implementation, would generate PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="performance-report.pdf"');
      // return PDF buffer
      res.status(200).send(Buffer.from('PDF report placeholder'));
    } else {
      res.status(200).json({
        success: true,
        data: reportData,
        metadata: {
          reportType,
          timeframe,
          equipmentCount: equipmentIds.length,
          generatedAt: new Date().toISOString(),
          format
        }
      });
    }

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}