/**
 * Weather Data Service
 * High-level service for managing weather data requests
 * with fallback strategies and data quality validation
 */

import { WeatherAPIClient, TMYData, SolarIrradianceData, WeatherDataPoint } from './weather-api-client';
import { errorTracker } from '../monitoring/error-tracker';

export interface WeatherServiceConfig {
  primarySource: 'nrel' | 'noaa' | 'openweather';
  fallbackSources: Array<'nrel' | 'noaa' | 'openweather'>;
  apiKeys: {
    nrel?: string;
    noaa?: string;
    openweather?: string;
  };
  cacheSettings: {
    tmyData: number; // days
    historicalData: number; // hours
    forecastData: number; // minutes
    currentWeather: number; // minutes
  };
  qualityThresholds: {
    minimumDataPoints: number;
    maximumGaps: number; // hours
    temperatureRange: { min: number; max: number }; // °C
    irradianceRange: { min: number; max: number }; // W/m²
  };
}

export interface WeatherDataQuality {
  score: number; // 0-1
  issues: string[];
  dataCompleteness: number; // percentage
  gapAnalysis: {
    totalGaps: number;
    largestGap: number; // hours
    averageGapSize: number; // hours
  };
  outlierDetection: {
    temperatureOutliers: number;
    irradianceOutliers: number;
    suspiciousValues: number;
  };
}

export interface EnhancedWeatherData extends SolarIrradianceData {
  quality: WeatherDataQuality;
  source: string;
  processingInfo: {
    gapsFilled: number;
    outliersRemoved: number;
    interpolatedPoints: number;
    qualityFlags: string[];
  };
}

export class WeatherDataService {
  private apiClient: WeatherAPIClient;
  private config: WeatherServiceConfig;

  constructor(config: WeatherServiceConfig) {
    this.config = {
      cacheSettings: {
        tmyData: 30, // 30 days
        historicalData: 24, // 24 hours
        forecastData: 60, // 60 minutes
        currentWeather: 10 // 10 minutes
      },
      qualityThresholds: {
        minimumDataPoints: 8760, // 1 year hourly
        maximumGaps: 24, // 24 hours
        temperatureRange: { min: -50, max: 60 },
        irradianceRange: { min: 0, max: 1500 }
      },
      ...config
    };

    this.apiClient = new WeatherAPIClient({
      nrelApiKey: this.config.apiKeys.nrel,
      noaaApiKey: this.config.apiKeys.noaa,
      openWeatherApiKey: this.config.apiKeys.openweather,
      cacheExpiry: 60,
      retryAttempts: 3,
      timeout: 30000
    });
  }

  /**
   * Get high-quality TMY data with fallback sources
   */
  public async getOptimalTMYData(
    latitude: number,
    longitude: number
  ): Promise<TMYData> {
    try {
      errorTracker.addBreadcrumb('Requesting optimal TMY data', 'weather', {
        latitude,
        longitude
      });

      // Try primary source first
      if (this.config.primarySource === 'nrel' && this.config.apiKeys.nrel) {
        try {
          const tmyData = await this.apiClient.getTMYData(latitude, longitude, {
            names: 'tmy3',
            interval: 'monthly'
          });
          
          // Validate data quality
          if (this.validateTMYData(tmyData)) {
            return tmyData;
          }
        } catch (error) {
          console.warn('Primary NREL TMY source failed:', error);
        }
      }

      // Try fallback sources
      for (const source of this.config.fallbackSources) {
        if (source === 'nrel' && this.config.apiKeys.nrel) {
          try {
            const tmyData = await this.apiClient.getTMYData(latitude, longitude);
            if (this.validateTMYData(tmyData)) {
              return tmyData;
            }
          } catch (error) {
            console.warn(`Fallback ${source} TMY source failed:`, error);
          }
        }
      }

      // If all sources fail, generate synthetic TMY data
      console.warn('All TMY sources failed, generating synthetic data');
      return this.generateSyntheticTMYData(latitude, longitude);

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getOptimalTMYData',
        latitude,
        longitude
      });
      throw error;
    }
  }

  /**
   * Get high-quality historical weather data
   */
  public async getQualityHistoricalData(
    latitude: number,
    longitude: number,
    startYear: number,
    endYear: number
  ): Promise<EnhancedWeatherData> {
    try {
      errorTracker.addBreadcrumb('Requesting quality historical data', 'weather', {
        latitude,
        longitude,
        startYear,
        endYear
      });

      let bestData: SolarIrradianceData | null = null;
      let bestQuality = 0;
      let sourceUsed = '';

      // Try different data sources
      const sources = [this.config.primarySource, ...this.config.fallbackSources];
      
      for (const source of sources) {
        try {
          let data: SolarIrradianceData | null = null;

          if (source === 'nrel' && this.config.apiKeys.nrel) {
            data = await this.apiClient.getHistoricalData(latitude, longitude, startYear, endYear);
          }
          // Add other source implementations here

          if (data) {
            const quality = this.assessDataQuality(data);
            if (quality.score > bestQuality) {
              bestData = data;
              bestQuality = quality.score;
              sourceUsed = source;
            }
          }
        } catch (error) {
          console.warn(`Historical data source ${source} failed:`, error);
        }
      }

      if (!bestData) {
        throw new Error('All historical data sources failed');
      }

      // Process and enhance the data
      const processedData = this.processWeatherData(bestData);
      const finalQuality = this.assessDataQuality(processedData);

      return {
        ...processedData,
        quality: finalQuality,
        source: sourceUsed,
        processingInfo: {
          gapsFilled: 0, // Will be calculated during processing
          outliersRemoved: 0,
          interpolatedPoints: 0,
          qualityFlags: finalQuality.issues
        }
      };

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getQualityHistoricalData',
        latitude,
        longitude,
        startYear,
        endYear
      });
      throw error;
    }
  }

  /**
   * Get weather forecast with quality validation
   */
  public async getQualityForecast(
    latitude: number,
    longitude: number,
    hours: number = 168
  ): Promise<EnhancedWeatherData> {
    try {
      errorTracker.addBreadcrumb('Requesting quality forecast data', 'weather', {
        latitude,
        longitude,
        hours
      });

      // Try NOAA first for US locations
      if (latitude >= 25 && latitude <= 72 && longitude >= -180 && longitude <= -65) {
        try {
          const forecastData = await this.apiClient.getWeatherForecast(latitude, longitude, hours);
          const processedData = this.processWeatherData(forecastData);
          const quality = this.assessDataQuality(processedData);

          return {
            ...processedData,
            quality,
            source: 'noaa',
            processingInfo: {
              gapsFilled: 0,
              outliersRemoved: 0,
              interpolatedPoints: 0,
              qualityFlags: quality.issues
            }
          };
        } catch (error) {
          console.warn('NOAA forecast failed:', error);
        }
      }

      // Fallback to OpenWeatherMap or synthetic data
      throw new Error('Weather forecast not available for this location');

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getQualityForecast',
        latitude,
        longitude,
        hours
      });
      throw error;
    }
  }

  /**
   * Get current weather conditions
   */
  public async getCurrentWeatherConditions(
    latitude: number,
    longitude: number
  ): Promise<WeatherDataPoint> {
    try {
      if (this.config.apiKeys.openweather) {
        return await this.apiClient.getCurrentWeather(latitude, longitude);
      }

      // Fallback to NOAA if available
      const forecast = await this.apiClient.getWeatherForecast(latitude, longitude, 1);
      if (forecast.data.length > 0) {
        return forecast.data[0];
      }

      throw new Error('No current weather data available');

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getCurrentWeatherConditions',
        latitude,
        longitude
      });
      throw error;
    }
  }

  /**
   * Get solar position and timing data
   */
  public async getSolarData(
    latitude: number,
    longitude: number,
    date: Date
  ): Promise<{
    position: any;
    dayLength: number;
    sunrise: string;
    sunset: string;
  }> {
    try {
      if (this.config.apiKeys.nrel) {
        const solarPosition = await this.apiClient.getSolarPosition(latitude, longitude, date);
        return {
          position: solarPosition,
          dayLength: solarPosition.dayLength,
          sunrise: solarPosition.sunriseTime,
          sunset: solarPosition.sunsetTime
        };
      }

      // Fallback to calculated solar position
      return this.calculateSolarPosition(latitude, longitude, date);

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getSolarData',
        latitude,
        longitude,
        date: date.toISOString()
      });
      throw error;
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private validateTMYData(tmyData: TMYData): boolean {
    // Check if all 12 months are present
    if (tmyData.monthlyAverages.length !== 12) {
      return false;
    }

    // Check for reasonable irradiance values
    const annualGHI = tmyData.annualTotals.globalHorizontalIrradiance;
    if (annualGHI < 500 || annualGHI > 3000) { // kWh/m²/year
      return false;
    }

    // Check for complete monthly data
    return tmyData.monthlyAverages.every(month => 
      month.globalHorizontalIrradiance > 0 &&
      month.ambientTemperature > -50 &&
      month.ambientTemperature < 60
    );
  }

  private assessDataQuality(data: SolarIrradianceData): WeatherDataQuality {
    const issues: string[] = [];
    const dataPoints = data.data.length;
    let temperatureOutliers = 0;
    let irradianceOutliers = 0;
    let suspiciousValues = 0;
    let totalGaps = 0;
    let largestGap = 0;
    let currentGap = 0;

    // Check data completeness
    const expectedDataPoints = this.config.qualityThresholds.minimumDataPoints;
    const completeness = Math.min(100, (dataPoints / expectedDataPoints) * 100);

    if (completeness < 95) {
      issues.push(`Low data completeness: ${completeness.toFixed(1)}%`);
    }

    // Analyze data points
    let previousTimestamp: Date | null = null;
    
    for (const point of data.data) {
      const timestamp = new Date(point.timestamp);
      
      // Check for gaps
      if (previousTimestamp) {
        const gapHours = (timestamp.getTime() - previousTimestamp.getTime()) / (1000 * 60 * 60);
        if (gapHours > 1.5) { // More than 1.5 hours gap
          totalGaps++;
          currentGap += gapHours;
          largestGap = Math.max(largestGap, gapHours);
        } else {
          currentGap = 0;
        }
      }
      
      previousTimestamp = timestamp;

      // Check temperature outliers
      const temp = point.ambientTemperature;
      if (temp < this.config.qualityThresholds.temperatureRange.min || 
          temp > this.config.qualityThresholds.temperatureRange.max) {
        temperatureOutliers++;
      }

      // Check irradiance outliers
      const ghi = point.globalHorizontalIrradiance;
      if (ghi < this.config.qualityThresholds.irradianceRange.min || 
          ghi > this.config.qualityThresholds.irradianceRange.max) {
        irradianceOutliers++;
      }

      // Check for suspicious values (e.g., constant values)
      if (ghi === 0 && point.directNormalIrradiance === 0 && point.diffuseHorizontalIrradiance === 0) {
        suspiciousValues++;
      }
    }

    // Check for maximum gap threshold
    if (largestGap > this.config.qualityThresholds.maximumGaps) {
      issues.push(`Large data gap detected: ${largestGap.toFixed(1)} hours`);
    }

    // Calculate quality score
    let score = 1.0;
    score -= (temperatureOutliers / dataPoints) * 0.2;
    score -= (irradianceOutliers / dataPoints) * 0.3;
    score -= (suspiciousValues / dataPoints) * 0.1;
    score -= (totalGaps / dataPoints) * 0.2;
    score = Math.max(0, Math.min(1, score));

    return {
      score,
      issues,
      dataCompleteness: completeness,
      gapAnalysis: {
        totalGaps,
        largestGap,
        averageGapSize: totalGaps > 0 ? (totalGaps * largestGap) / totalGaps : 0
      },
      outlierDetection: {
        temperatureOutliers,
        irradianceOutliers,
        suspiciousValues
      }
    };
  }

  private processWeatherData(data: SolarIrradianceData): SolarIrradianceData {
    // Fill gaps, remove outliers, interpolate missing values
    const processedData = { ...data };
    const processedPoints: WeatherDataPoint[] = [];

    // Simple gap filling with linear interpolation
    for (let i = 0; i < data.data.length; i++) {
      const current = data.data[i];
      processedPoints.push({ ...current });

      // Check for gaps to next point
      if (i < data.data.length - 1) {
        const next = data.data[i + 1];
        const currentTime = new Date(current.timestamp);
        const nextTime = new Date(next.timestamp);
        const gapHours = (nextTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

        // Fill gaps larger than 2 hours
        if (gapHours > 2) {
          const pointsToFill = Math.floor(gapHours) - 1;
          for (let j = 1; j <= pointsToFill; j++) {
            const interpolatedTime = new Date(currentTime.getTime() + (j * 60 * 60 * 1000));
            const ratio = j / (pointsToFill + 1);
            
            processedPoints.push({
              timestamp: interpolatedTime.toISOString(),
              globalHorizontalIrradiance: this.interpolate(current.globalHorizontalIrradiance, next.globalHorizontalIrradiance, ratio),
              directNormalIrradiance: this.interpolate(current.directNormalIrradiance, next.directNormalIrradiance, ratio),
              diffuseHorizontalIrradiance: this.interpolate(current.diffuseHorizontalIrradiance, next.diffuseHorizontalIrradiance, ratio),
              ambientTemperature: this.interpolate(current.ambientTemperature, next.ambientTemperature, ratio),
              relativeHumidity: this.interpolate(current.relativeHumidity, next.relativeHumidity, ratio),
              windSpeed: this.interpolate(current.windSpeed, next.windSpeed, ratio),
              windDirection: this.interpolate(current.windDirection, next.windDirection, ratio),
              pressure: this.interpolate(current.pressure, next.pressure, ratio),
              cloudCover: this.interpolate(current.cloudCover, next.cloudCover, ratio),
              visibility: this.interpolate(current.visibility, next.visibility, ratio),
              dewPoint: this.interpolate(current.dewPoint, next.dewPoint, ratio)
            });
          }
        }
      }
    }

    processedData.data = processedPoints;
    return processedData;
  }

  private interpolate(start: number, end: number, ratio: number): number {
    return start + (end - start) * ratio;
  }

  private generateSyntheticTMYData(latitude: number, longitude: number): TMYData {
    // Generate basic synthetic TMY data based on latitude
    const monthlyAverages = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const seasonalFactor = Math.sin((month - 3) * Math.PI / 6);
      
      // Base values adjusted for latitude
      const baseGHI = 4.5 + Math.cos(latitude * Math.PI / 180) * 2; // kWh/m²/day
      const baseTemp = 15 - Math.abs(latitude) * 0.3; // °C

      return {
        month,
        globalHorizontalIrradiance: Math.max(1, baseGHI + seasonalFactor * 2),
        directNormalIrradiance: Math.max(0.5, baseGHI * 0.8 + seasonalFactor * 1.5),
        diffuseHorizontalIrradiance: Math.max(0.5, baseGHI * 0.3 + seasonalFactor * 0.5),
        ambientTemperature: baseTemp + seasonalFactor * 15,
        windSpeed: 3.0 + Math.random() * 2,
        relativeHumidity: 60 + seasonalFactor * 20
      };
    });

    const annualGHI = monthlyAverages.reduce((sum, month) => sum + month.globalHorizontalIrradiance * 30.4, 0);

    return {
      location: {
        latitude,
        longitude,
        elevation: 100,
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        timezone: 'UTC'
      },
      monthlyAverages,
      annualTotals: {
        globalHorizontalIrradiance: annualGHI,
        directNormalIrradiance: annualGHI * 0.8,
        diffuseHorizontalIrradiance: annualGHI * 0.3
      },
      metadata: {
        dataSource: 'Synthetic (Generated)',
        years: 'N/A',
        version: '1.0',
        lastUpdated: new Date().toISOString()
      }
    };
  }

  private calculateSolarPosition(latitude: number, longitude: number, date: Date): any {
    // Simplified solar position calculation
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    const elevation = Math.max(0, 90 - Math.abs(latitude - declination));
    
    return {
      position: {
        solarZenithAngle: 90 - elevation,
        solarAzimuthAngle: 180,
        solarElevationAngle: elevation
      },
      dayLength: 12, // Simplified
      sunrise: '06:00',
      sunset: '18:00'
    };
  }
}