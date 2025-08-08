/**
 * Solar System Predictions API
 * GET /api/analytics/systems/[systemId]/predictions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { solarMLModels } from '../../../../../lib/analytics/predictive/solar-ml-models';
import { collection, query, where, orderBy, getDocs, Timestamp, limit } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import { COLLECTIONS, EnergyProductionRecord, SolarSystem } from '../../../../../types/firestore-schema';
import { errorTracker } from '../../../../../lib/monitoring/error-tracker';

interface PredictionQuery {
  horizon?: 'hour' | 'day' | 'week' | 'month';
  includeWeather?: boolean;
  includeMaintenance?: boolean;
  includeDegradation?: boolean;
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
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const startTime = Date.now();
  const requestId = `pred_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

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
          dataPoints: 0
        }
      });
    }

    const { systemId } = req.query;
    
    if (!systemId || typeof systemId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'System ID is required',
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dataPoints: 0
        }
      });
    }

    // Parse query parameters
    const {
      horizon = 'day',
      includeWeather = false,
      includeMaintenance = false,
      includeDegradation = false
    } = req.query as Partial<PredictionQuery>;

    // Validate horizon
    const validHorizons = ['hour', 'day', 'week', 'month'];
    if (!validHorizons.includes(horizon)) {
      return res.status(400).json({
        success: false,
        error: `Invalid horizon. Must be one of: ${validHorizons.join(', ')}`,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dataPoints: 0
        }
      });
    }

    // Track API usage
    errorTracker.addBreadcrumb('Predictions API request', 'api', {
      systemId,
      horizon,
      includeWeather,
      includeMaintenance,
      includeDegradation,
      requestId
    });

    // Fetch system information
    const systemInfo = await fetchSystemInfo(systemId);
    if (!systemInfo) {
      return res.status(404).json({
        success: false,
        error: 'System not found',
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dataPoints: 0
        }
      });
    }

    // Fetch historical production data
    const historicalData = await fetchHistoricalData(systemId);
    
    if (historicalData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient historical data for predictions',
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dataPoints: 0
        }
      });
    }

    // Prepare response data
    const responseData: any = {
      systemId,
      predictionHorizon: horizon,
      predictions: {},
      confidence: {}
    };

    // Generate energy production prediction
    const weatherForecast = includeWeather === true || includeWeather === 'true' 
      ? await fetchWeatherForecast(systemInfo) 
      : undefined;

    const productionPrediction = await solarMLModels.predictEnergyProduction(
      systemId,
      horizon as any,
      historicalData,
      weatherForecast,
      systemInfo
    );

    responseData.predictions.energyProduction = {
      value: productionPrediction.value,
      unit: horizon === 'hour' ? 'kW' : 'kWh',
      confidence: productionPrediction.confidence,
      range: productionPrediction.range,
      factors: productionPrediction.factors,
      methodology: productionPrediction.methodology,
      validFor: productionPrediction.validFor
    };

    // Include maintenance predictions if requested
    if (includeMaintenance === true || includeMaintenance === 'true') {
      try {
        const maintenancePredictions = await solarMLModels.predictMaintenanceNeeds(
          systemId,
          historicalData,
          systemInfo
        );

        responseData.predictions.maintenance = maintenancePredictions.map(pred => ({
          component: pred.component,
          probability: pred.probability,
          timeToMaintenance: pred.timeToMaintenance,
          severity: pred.severity,
          recommendation: pred.recommendation,
          estimatedCost: pred.estimatedCost,
          indicators: pred.indicators.map(ind => ({
            metric: ind.metric,
            status: ind.trend,
            contribution: ind.contribution
          }))
        }));
      } catch (error) {
        console.warn('Failed to generate maintenance predictions:', error);
        responseData.predictions.maintenance = [];
      }
    }

    // Include degradation predictions if requested
    if (includeDegradation === true || includeDegradation === 'true') {
      try {
        const degradationModel = await solarMLModels.predictDegradation(
          systemId,
          historicalData,
          systemInfo
        );

        responseData.predictions.degradation = {
          currentDegradation: degradationModel.currentDegradation,
          degradationRate: degradationModel.degradationRate,
          projections: degradationModel.projectedDegradation.slice(0, 5), // Next 5 years
          factors: degradationModel.factors,
          confidence: degradationModel.confidence
        };
      } catch (error) {
        console.warn('Failed to generate degradation predictions:', error);
        responseData.predictions.degradation = null;
      }
    }

    // Weather impact predictions if weather data included
    if (weatherForecast && weatherForecast.length > 0) {
      try {
        const weatherImpactPredictions = await solarMLModels.predictWeatherImpact(
          systemId,
          weatherForecast,
          systemInfo
        );

        responseData.predictions.weatherImpact = weatherImpactPredictions.map(pred => ({
          timestamp: pred.timestamp,
          expectedProduction: pred.value,
          confidence: pred.confidence,
          weatherFactors: pred.factors
        }));
      } catch (error) {
        console.warn('Failed to generate weather impact predictions:', error);
        responseData.predictions.weatherImpact = [];
      }
    }

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: responseData,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime,
        dataPoints: historicalData.length
      }
    });

  } catch (error) {
    errorTracker.captureException(error as Error, {
      systemId: req.query.systemId,
      requestId,
      query: req.query
    });

    const processingTime = Date.now() - startTime;

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime,
        dataPoints: 0
      }
    });
  }
}

/**
 * Fetch system information from Firestore
 */
async function fetchSystemInfo(systemId: string): Promise<SolarSystem | null> {
  try {
    const systemQuery = query(
      collection(db, COLLECTIONS.SOLAR_SYSTEMS),
      where('id', '==', systemId),
      limit(1)
    );
    
    const snapshot = await getDocs(systemQuery);
    if (snapshot.empty) {
      return null;
    }
    
    return snapshot.docs[0].data() as SolarSystem;
  } catch (error) {
    console.error('Failed to fetch system info:', error);
    return null;
  }
}

/**
 * Fetch historical production data
 */
async function fetchHistoricalData(systemId: string): Promise<EnergyProductionRecord[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const productionQuery = query(
      collection(db, COLLECTIONS.ENERGY_PRODUCTION),
      where('systemId', '==', systemId),
      where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('timestamp', 'desc'),
      limit(1000) // Limit for performance
    );
    
    const snapshot = await getDocs(productionQuery);
    return snapshot.docs.map(doc => doc.data() as EnergyProductionRecord);
  } catch (error) {
    console.error('Failed to fetch historical data:', error);
    return [];
  }
}

/**
 * Fetch weather forecast (mock implementation)
 */
async function fetchWeatherForecast(systemInfo: SolarSystem): Promise<any[] | undefined> {
  try {
    // In a real implementation, this would fetch from a weather API
    // For now, return mock forecast data
    const forecast = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) { // Next 24 hours
      const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = timestamp.getHours();
      
      // Simple solar irradiance model
      let irradiance = 0;
      if (hour >= 6 && hour <= 18) {
        const solarAngle = Math.sin(((hour - 6) / 12) * Math.PI);
        irradiance = Math.max(0, solarAngle * 1000 * (0.7 + Math.random() * 0.3));
      }
      
      forecast.push({
        timestamp,
        irradiance,
        temperature: 20 + Math.random() * 15 + Math.sin(((hour - 6) / 12) * Math.PI) * 10,
        windSpeed: 2 + Math.random() * 3,
        humidity: 40 + Math.random() * 30,
        cloudCover: Math.random() * 0.3,
        precipitation: Math.random() > 0.8 ? Math.random() * 5 : 0
      });
    }
    
    return forecast;
  } catch (error) {
    console.error('Failed to fetch weather forecast:', error);
    return undefined;
  }
}