import { NextApiRequest, NextApiResponse } from 'next';
import { WeatherDataService } from '../../../lib/weather/weather-data-service';
import { WeatherDataPoint } from '../../../lib/weather/weather-api-client';

interface CurrentWeatherRequest {
  latitude: number;
  longitude: number;
}

interface CurrentWeatherResponse {
  success: boolean;
  data?: WeatherDataPoint & {
    location: {
      latitude: number;
      longitude: number;
    };
    timestamp: string;
  };
  error?: string;
  metadata?: {
    source: string;
    lastUpdated: string;
    dataAge: number; // minutes
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CurrentWeatherResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { latitude, longitude } = req.query;

    // Validate input parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);

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

    // Initialize weather service
    const weatherService = new WeatherDataService({
      primarySource: 'openweather',
      fallbackSources: ['noaa'],
      apiKeys: {
        nrel: process.env.NREL_API_KEY,
        noaa: process.env.NOAA_API_KEY,
        openweather: process.env.OPENWEATHER_API_KEY
      },
      cacheSettings: {
        tmyData: 30,
        historicalData: 24,
        forecastData: 60,
        currentWeather: 10 // 10 minutes cache for current weather
      },
      qualityThresholds: {
        minimumDataPoints: 1,
        maximumGaps: 1,
        temperatureRange: { min: -50, max: 60 },
        irradianceRange: { min: 0, max: 1500 }
      }
    });

    // Get current weather data
    const currentWeather = await weatherService.getCurrentWeatherConditions(lat, lon);
    const now = new Date();
    const weatherTimestamp = new Date(currentWeather.timestamp);
    const dataAge = Math.floor((now.getTime() - weatherTimestamp.getTime()) / (1000 * 60)); // minutes

    // Set cache headers (short cache for current weather)
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200'); // 10 minutes cache

    return res.status(200).json({
      success: true,
      data: {
        ...currentWeather,
        location: {
          latitude: lat,
          longitude: lon
        },
        timestamp: now.toISOString()
      },
      metadata: {
        source: 'openweather',
        lastUpdated: currentWeather.timestamp,
        dataAge: dataAge
      }
    });

  } catch (error) {
    console.error('Current weather API error:', error);
    
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
          error: 'Current weather not available for this location'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve current weather conditions'
    });
  }
}