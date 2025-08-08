/**
 * Weather Correlation Analysis API
 * GET /api/analytics/weather/correlation - Analyze weather impact on solar performance
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { weatherCorrelationEngine } from '../../../../lib/analytics/weather/weather-correlation-engine';
import { errorTracker } from '../../../../lib/monitoring/error-tracker';

interface CorrelationQuery {
  systemId: string;
  startDate?: string;
  endDate?: string;
  weatherSources?: string;
  includeForecasting?: boolean;
  includeRecommendations?: boolean;
  analysisLevel?: 'basic' | 'detailed' | 'comprehensive';
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
    dataPoints: number;
    analysisLevel: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const startTime = Date.now();
  const requestId = `wcorr_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dataPoints: 0,
          analysisLevel: 'none'
        }
      });
    }

    const {
      systemId,
      startDate,
      endDate,
      weatherSources,
      includeForecasting = false,
      includeRecommendations = true,
      analysisLevel = 'detailed'
    } = req.query as Partial<CorrelationQuery>;

    // Validate required parameters
    if (!systemId) {
      return res.status(400).json({
        success: false,
        error: 'System ID is required',
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dataPoints: 0,
          analysisLevel: analysisLevel as string
        }
      });
    }

    // Validate analysis level
    const validLevels = ['basic', 'detailed', 'comprehensive'];
    if (!validLevels.includes(analysisLevel as string)) {
      return res.status(400).json({
        success: false,
        error: `Invalid analysis level. Must be one of: ${validLevels.join(', ')}`,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dataPoints: 0,
          analysisLevel: analysisLevel as string
        }
      });
    }

    // Parse dates
    let period: { start: Date; end: Date } | undefined;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            dataPoints: 0,
            analysisLevel: analysisLevel as string
          }
        });
      }
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          error: 'Start date must be before end date',
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            dataPoints: 0,
            analysisLevel: analysisLevel as string
          }
        });
      }
      
      period = { start, end };
    }

    // Parse weather sources
    const weatherSourcesArray = weatherSources ? weatherSources.split(',').map(s => s.trim()) : undefined;

    // Track API usage
    errorTracker.addBreadcrumb('Weather Correlation API request', 'api', {
      systemId,
      period: period ? `${period.start.toISOString()} - ${period.end.toISOString()}` : 'default',
      weatherSources: weatherSourcesArray?.length || 0,
      includeForecasting: includeForecasting === true || includeForecasting === 'true',
      includeRecommendations: includeRecommendations === true || includeRecommendations === 'true',
      analysisLevel,
      requestId
    });

    // Perform correlation analysis
    const correlationAnalysis = await weatherCorrelationEngine.performCorrelationAnalysis(
      systemId as string,
      {
        period,
        weatherSources: weatherSourcesArray,
        includeForecasting: includeForecasting === true || includeForecasting === 'true',
        forceRefresh: false
      }
    );

    // Format response based on analysis level
    let responseData: any = {
      systemId: correlationAnalysis.systemId,
      analysisLevel: analysisLevel,
      period: {
        start: correlationAnalysis.period.start.toISOString(),
        end: correlationAnalysis.period.end.toISOString()
      },
      generatedAt: correlationAnalysis.generatedAt.toISOString()
    };

    // Always include data quality
    responseData.dataQuality = {
      score: Math.round(
        (correlationAnalysis.dataQuality.weatherDataCompleteness +
         correlationAnalysis.dataQuality.productionDataCompleteness +
         correlationAnalysis.dataQuality.temporalAlignment +
         correlationAnalysis.dataQuality.spatialAccuracy) / 4 * 100
      ),
      details: correlationAnalysis.dataQuality
    };

    // Include correlations based on analysis level
    if (analysisLevel === 'basic') {
      responseData.summary = {
        totalCorrelations: correlationAnalysis.correlations.length,
        strongCorrelations: correlationAnalysis.correlations.filter(c => c.strength === 'strong' || c.strength === 'very_strong').length,
        topWeatherFactors: correlationAnalysis.correlations
          .slice(0, 3)
          .map(c => ({
            parameter: c.weatherParameter,
            correlation: Math.round(c.correlation * 1000) / 1000,
            strength: c.strength,
            impact: c.relationship
          }))
      };
    } else {
      responseData.correlations = correlationAnalysis.correlations.map(c => ({
        weatherParameter: c.weatherParameter,
        performanceMetric: c.performanceMetric,
        correlation: Math.round(c.correlation * 1000) / 1000,
        significance: Math.round(c.significance * 1000) / 1000,
        strength: c.strength,
        relationship: c.relationship,
        confidence: Math.round(c.confidence * 1000) / 1000
      }));

      responseData.impacts = correlationAnalysis.impacts.map(impact => ({
        parameter: impact.parameter,
        averageImpact: Math.round(impact.impact.averageImpact * 1000) / 1000,
        maxPositiveImpact: Math.round(impact.impact.maxPositiveImpact * 1000) / 1000,
        maxNegativeImpact: Math.round(impact.impact.maxNegativeImpact * 1000) / 1000,
        consistencyScore: Math.round(impact.impact.consistencyScore * 1000) / 1000,
        keyThresholds: impact.thresholds.slice(0, 2), // Top 2 thresholds
        seasonalVariation: analysisLevel === 'comprehensive' ? impact.seasonalVariations : undefined
      }));
    }

    // Include predictions if requested and available
    if ((includeForecasting === true || includeForecasting === 'true') && correlationAnalysis.predictions.length > 0) {
      responseData.predictions = correlationAnalysis.predictions.map(pred => ({
        timeHorizon: pred.timeHorizon,
        expectedProduction: Math.round(pred.prediction.expectedProduction * 100) / 100,
        confidence: Math.round(pred.prediction.confidence * 100) / 100,
        range: {
          min: Math.round(pred.prediction.range.min * 100) / 100,
          max: Math.round(pred.prediction.range.max * 100) / 100
        },
        keyDependencies: pred.weatherDependencies
          .sort((a, b) => b.importance - a.importance)
          .slice(0, 3)
          .map(dep => ({
            parameter: dep.parameter,
            importance: Math.round(dep.importance * 100) / 100,
            sensitivity: Math.round(dep.sensitivity * 1000) / 1000
          }))
      }));
    }

    // Include recommendations if requested
    if ((includeRecommendations === true || includeRecommendations === 'true') && correlationAnalysis.recommendations.length > 0) {
      responseData.recommendations = correlationAnalysis.recommendations.map(rec => ({
        type: rec.type,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        urgency: rec.action.urgency,
        effort: rec.action.effort,
        potentialImpact: {
          performanceImprovement: Math.round(rec.impact.performanceImprovement * 10) / 10,
          annualSavings: rec.impact.costSavings
        },
        trigger: analysisLevel === 'comprehensive' ? rec.trigger : undefined
      }));
    }

    // Add insights summary
    if (analysisLevel === 'detailed' || analysisLevel === 'comprehensive') {
      responseData.insights = {
        dominantWeatherFactor: correlationAnalysis.correlations[0]?.weatherParameter || null,
        strongestCorrelation: Math.max(...correlationAnalysis.correlations.map(c => Math.abs(c.correlation))),
        weatherSensitivity: correlationAnalysis.correlations.length > 0 ? 'high' : 'low',
        keyFindings: generateKeyFindings(correlationAnalysis),
        actionableTips: generateActionableTips(correlationAnalysis)
      };
    }

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: responseData,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime,
        dataPoints: correlationAnalysis.dataQuality.dataPointsUsed,
        analysisLevel: analysisLevel as string
      }
    });

  } catch (error) {
    errorTracker.captureException(error as Error, {
      systemId: req.query.systemId,
      requestId,
      query: req.query
    });

    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Weather correlation analysis failed';

    return res.status(500).json({
      success: false,
      error: errorMessage,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime,
        dataPoints: 0,
        analysisLevel: (req.query.analysisLevel as string) || 'unknown'
      }
    });
  }
}

/**
 * Generate key findings from correlation analysis
 */
function generateKeyFindings(analysis: any): string[] {
  const findings: string[] = [];
  
  if (analysis.correlations.length > 0) {
    const topCorrelation = analysis.correlations[0];
    findings.push(
      `${topCorrelation.weatherParameter} shows ${topCorrelation.strength} ${topCorrelation.relationship} correlation with ${topCorrelation.performanceMetric}`
    );
  }

  const strongCorrelations = analysis.correlations.filter(
    (c: any) => c.strength === 'strong' || c.strength === 'very_strong'
  );
  
  if (strongCorrelations.length > 1) {
    findings.push(`${strongCorrelations.length} weather parameters show strong correlation with system performance`);
  }

  if (analysis.impacts.length > 0) {
    const highestImpact = analysis.impacts.reduce(
      (prev: any, current: any) => Math.abs(current.impact.averageImpact) > Math.abs(prev.impact.averageImpact) ? current : prev
    );
    findings.push(`${highestImpact.parameter} has the highest average impact on performance`);
  }

  return findings;
}

/**
 * Generate actionable tips from correlation analysis
 */
function generateActionableTips(analysis: any): string[] {
  const tips: string[] = [];
  
  // Temperature-related tips
  const tempCorr = analysis.correlations.find((c: any) => c.weatherParameter === 'ambient_temperature');
  if (tempCorr && tempCorr.relationship === 'negative' && tempCorr.strength !== 'weak') {
    tips.push('Consider enhanced cooling solutions during hot weather to maintain performance');
  }

  // Irradiance-related tips
  const irrCorr = analysis.correlations.find((c: any) => c.weatherParameter === 'solar_irradiance');
  if (irrCorr && irrCorr.strength === 'strong' || irrCorr && irrCorr.strength === 'very_strong') {
    tips.push('System shows strong response to irradiance changes - optimize panel positioning');
  }

  // Wind-related tips
  const windCorr = analysis.correlations.find((c: any) => c.weatherParameter === 'wind_speed');
  if (windCorr && windCorr.relationship === 'positive') {
    tips.push('Wind provides cooling benefits - ensure adequate ventilation around panels');
  }

  // General recommendations
  if (analysis.dataQuality.weatherDataCompleteness < 0.9) {
    tips.push('Consider installing local weather monitoring for more accurate analysis');
  }

  return tips;
}