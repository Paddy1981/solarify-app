import { NextApiRequest, NextApiResponse } from 'next';
import { WeatherDataService } from '../../../lib/weather/weather-data-service';
import { TMYData } from '../../../lib/weather/weather-api-client';

interface TMYRequest {
  latitude: number;
  longitude: number;
}

interface TMYResponse {
  success: boolean;
  data?: TMYData;
  error?: string;
  cached?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TMYResponse>
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
      primarySource: 'nrel',
      fallbackSources: ['nrel'],
      apiKeys: {
        nrel: process.env.NREL_API_KEY,
        openweather: process.env.OPENWEATHER_API_KEY
      },
      cacheSettings: {
        tmyData: 30, // 30 days
        historicalData: 24,
        forecastData: 60,
        currentWeather: 10
      },
      qualityThresholds: {
        minimumDataPoints: 8760,
        maximumGaps: 24,
        temperatureRange: { min: -50, max: 60 },
        irradianceRange: { min: 0, max: 1500 }
      }
    });

    // Get TMY data
    const tmyData = await weatherService.getOptimalTMYData(lat, lon);

    // Set cache headers
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800'); // 1 day cache

    return res.status(200).json({
      success: true,
      data: tmyData
    });

  } catch (error) {
    console.error('TMY API error:', error);
    
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
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve weather data'
    });
  }
}