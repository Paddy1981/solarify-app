import { NextApiRequest, NextApiResponse } from 'next';
import { WeatherDataService } from '../../../lib/weather/weather-data-service';
import { EnhancedWeatherData } from '../../../lib/weather/weather-data-service';

interface HistoricalWeatherRequest {
  latitude: number;
  longitude: number;
  startYear: number;
  endYear: number;
}

interface HistoricalWeatherResponse {
  success: boolean;
  data?: EnhancedWeatherData;
  error?: string;
  metadata?: {
    source: string;
    quality: number;
    dataPoints: number;
    years: string;
    completeness: number;
    processingInfo: {
      gapsFilled: number;
      outliersRemoved: number;
      interpolatedPoints: number;
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoricalWeatherResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { latitude, longitude, startYear, endYear } = req.query;

    // Validate input parameters
    if (!latitude || !longitude || !startYear || !endYear) {
      return res.status(400).json({
        success: false,
        error: 'Latitude, longitude, startYear, and endYear are required'
      });
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const start = parseInt(startYear as string);
    const end = parseInt(endYear as string);

    if (isNaN(lat) || isNaN(lon) || isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        error: 'All parameters must be valid numbers'
      });
    }

    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return res.status(400).json({
        success: false,
        error: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    const currentYear = new Date().getFullYear();
    if (start < 1998 || end > currentYear || start > end) {
      return res.status(400).json({
        success: false,
        error: `Years must be between 1998 and ${currentYear}, with startYear <= endYear`
      });
    }

    if (end - start > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 years of data can be requested at once'
      });
    }

    // Initialize weather service
    const weatherService = new WeatherDataService({
      primarySource: 'nrel',
      fallbackSources: ['nrel'],
      apiKeys: {
        nrel: process.env.NREL_API_KEY,
        openweather: process.env.OPENWEATHER_API_KEY
      },
      cacheSettings: {
        tmyData: 30,
        historicalData: 24, // 24 hours cache for historical data
        forecastData: 60,
        currentWeather: 10
      },
      qualityThresholds: {
        minimumDataPoints: (end - start + 1) * 8760, // Expected hourly data points
        maximumGaps: 24,
        temperatureRange: { min: -50, max: 60 },
        irradianceRange: { min: 0, max: 1500 }
      }
    });

    // Get historical weather data
    const historicalData = await weatherService.getQualityHistoricalData(lat, lon, start, end);

    // Set cache headers (longer cache for historical data)
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800'); // 1 day cache

    return res.status(200).json({
      success: true,
      data: historicalData,
      metadata: {
        source: historicalData.source,
        quality: historicalData.quality.score,
        dataPoints: historicalData.data.length,
        years: `${start}-${end}`,
        completeness: historicalData.quality.dataCompleteness,
        processingInfo: {
          gapsFilled: historicalData.processingInfo.gapsFilled,
          outliersRemoved: historicalData.processingInfo.outliersRemoved,
          interpolatedPoints: historicalData.processingInfo.interpolatedPoints
        }
      }
    });

  } catch (error) {
    console.error('Historical weather API error:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(401).json({
          success: false,
          error: 'Weather service authentication failed'
        });
      }
      
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        });
      }

      if (error.message.includes('not available')) {
        return res.status(404).json({
          success: false,
          error: 'Historical weather data not available for this location/time period'
        });
      }

      if (error.message.includes('failed')) {
        return res.status(503).json({
          success: false,
          error: 'Weather data sources temporarily unavailable'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve historical weather data'
    });
  }
}