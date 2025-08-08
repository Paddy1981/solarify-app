import { NextApiRequest, NextApiResponse } from 'next';
import { WeatherDataService } from '../../../lib/weather/weather-data-service';
import { EnhancedWeatherData } from '../../../lib/weather/weather-data-service';

interface ForecastRequest {
  latitude: number;
  longitude: number;
  hours?: number;
}

interface ForecastResponse {
  success: boolean;
  data?: EnhancedWeatherData;
  error?: string;
  metadata?: {
    source: string;
    quality: number;
    dataPoints: number;
    forecastHours: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ForecastResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { latitude, longitude, hours } = req.query;

    // Validate input parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const forecastHours = hours ? parseInt(hours as string) : 168; // Default 7 days

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude must be valid numbers'
      });
    }

    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return res.status(400).json({
        success: false,
        error: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    if (forecastHours < 1 || forecastHours > 336) { // Max 2 weeks
      return res.status(400).json({
        success: false,
        error: 'Hours must be between 1 and 336 (2 weeks)'
      });
    }

    // Initialize weather service
    const weatherService = new WeatherDataService({
      primarySource: 'noaa',
      fallbackSources: ['openweather'],
      apiKeys: {
        nrel: process.env.NREL_API_KEY,
        noaa: process.env.NOAA_API_KEY,
        openweather: process.env.OPENWEATHER_API_KEY
      },
      cacheSettings: {
        tmyData: 30,
        historicalData: 24,
        forecastData: 60, // 1 hour cache for forecast
        currentWeather: 10
      },
      qualityThresholds: {
        minimumDataPoints: forecastHours,
        maximumGaps: 6, // 6 hours max gap for forecast
        temperatureRange: { min: -50, max: 60 },
        irradianceRange: { min: 0, max: 1500 }
      }
    });

    // Get forecast data
    const forecastData = await weatherService.getQualityForecast(lat, lon, forecastHours);

    // Set cache headers (shorter cache for forecast data)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200'); // 1 hour cache

    return res.status(200).json({
      success: true,
      data: forecastData,
      metadata: {
        source: forecastData.source,
        quality: forecastData.quality.score,
        dataPoints: forecastData.data.length,
        forecastHours: forecastHours
      }
    });

  } catch (error) {
    console.error('Forecast API error:', error);
    
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
          error: 'Weather forecast not available for this location'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve weather forecast'
    });
  }
}