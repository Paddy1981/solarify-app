/**
 * Weather API Client
 * Integrates with NREL, NOAA, and other weather data providers
 * for solar irradiance and meteorological data
 */

import { errorTracker } from '../monitoring/error-tracker';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface WeatherDataPoint {
  timestamp: string;
  globalHorizontalIrradiance: number; // W/m²
  directNormalIrradiance: number; // W/m²
  diffuseHorizontalIrradiance: number; // W/m²
  ambientTemperature: number; // °C
  relativeHumidity: number; // %
  windSpeed: number; // m/s
  windDirection: number; // degrees
  pressure: number; // hPa
  cloudCover: number; // %
  visibility: number; // km
  dewPoint: number; // °C
}

export interface SolarIrradianceData {
  location: {
    latitude: number;
    longitude: number;
    elevation: number; // meters
    timezone: string;
  };
  data: WeatherDataPoint[];
  metadata: {
    source: string;
    dataType: 'historical' | 'forecast' | 'typical';
    resolution: 'hourly' | 'daily' | 'monthly';
    startDate: string;
    endDate: string;
    quality: number; // 0-1 quality score
  };
}

export interface TMYData {
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
    city: string;
    state: string;
    country: string;
    timezone: string;
  };
  monthlyAverages: {
    month: number;
    globalHorizontalIrradiance: number; // kWh/m²/day
    directNormalIrradiance: number; // kWh/m²/day
    diffuseHorizontalIrradiance: number; // kWh/m²/day
    ambientTemperature: number; // °C
    windSpeed: number; // m/s
    relativeHumidity: number; // %
  }[];
  annualTotals: {
    globalHorizontalIrradiance: number; // kWh/m²/year
    directNormalIrradiance: number; // kWh/m²/year
    diffuseHorizontalIrradiance: number; // kWh/m²/year
  };
  metadata: {
    dataSource: string;
    years: string;
    version: string;
    lastUpdated: string;
  };
}

export interface WeatherAPIConfig {
  nrelApiKey?: string;
  noaaApiKey?: string;
  openWeatherApiKey?: string;
  cacheExpiry: number; // minutes
  retryAttempts: number;
  timeout: number; // milliseconds
}

// =====================================================
// WEATHER API CLIENT CLASS
// =====================================================

export class WeatherAPIClient {
  private config: WeatherAPIConfig;
  private cache = new Map<string, { data: any; expires: number }>();

  constructor(config: WeatherAPIConfig) {
    this.config = {
      cacheExpiry: 60, // 1 hour default
      retryAttempts: 3,
      timeout: 30000, // 30 seconds
      ...config
    };
  }

  /**
   * Get Typical Meteorological Year (TMY) data from NREL
   */
  public async getTMYData(
    latitude: number,
    longitude: number,
    options: {
      attributes?: string[];
      names?: 'tmy2' | 'tmy3' | 'intl';
      interval?: 'hourly' | 'monthly';
    } = {}
  ): Promise<TMYData> {
    try {
      const cacheKey = `tmy_${latitude}_${longitude}_${JSON.stringify(options)}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      if (!this.config.nrelApiKey) {
        throw new Error('NREL API key is required for TMY data');
      }

      const params = new URLSearchParams({
        api_key: this.config.nrelApiKey,
        lat: latitude.toString(),
        lon: longitude.toString(),
        attributes: options.attributes?.join(',') || 'ghi,dni,dhi,temp_air,wind_speed,relative_humidity',
        names: options.names || 'tmy3',
        interval: options.interval || 'monthly',
        format: 'json'
      });

      const url = `https://developer.nrel.gov/api/nsrdb/v2/solar/psm3-tmy-download?${params}`;
      
      errorTracker.addBreadcrumb('Fetching TMY data from NREL', 'api', {
        latitude,
        longitude,
        source: 'nrel'
      });

      const response = await this.fetchWithRetry(url);
      const rawData = await response.json();

      if (rawData.errors && rawData.errors.length > 0) {
        throw new Error(`NREL API error: ${rawData.errors[0]}`);
      }

      const tmyData = this.parseNRELTMYData(rawData, latitude, longitude);
      this.setCachedData(cacheKey, tmyData);

      return tmyData;

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getTMYData',
        latitude,
        longitude,
        options
      });
      throw error;
    }
  }

  /**
   * Get historical weather data from NREL NSRDB
   */
  public async getHistoricalData(
    latitude: number,
    longitude: number,
    startYear: number,
    endYear: number,
    options: {
      attributes?: string[];
      interval?: 'hourly' | 'daily' | 'monthly';
    } = {}
  ): Promise<SolarIrradianceData> {
    try {
      const cacheKey = `historical_${latitude}_${longitude}_${startYear}_${endYear}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      if (!this.config.nrelApiKey) {
        throw new Error('NREL API key is required for historical data');
      }

      const params = new URLSearchParams({
        api_key: this.config.nrelApiKey,
        lat: latitude.toString(),
        lon: longitude.toString(),
        years: Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).join(','),
        attributes: options.attributes?.join(',') || 'ghi,dni,dhi,temp_air,wind_speed,relative_humidity',
        interval: options.interval || 'hourly',
        format: 'json'
      });

      const url = `https://developer.nrel.gov/api/nsrdb/v2/solar/psm3-download?${params}`;
      
      errorTracker.addBreadcrumb('Fetching historical data from NREL', 'api', {
        latitude,
        longitude,
        startYear,
        endYear,
        source: 'nrel'
      });

      const response = await this.fetchWithRetry(url);
      const rawData = await response.json();

      if (rawData.errors && rawData.errors.length > 0) {
        throw new Error(`NREL API error: ${rawData.errors[0]}`);
      }

      const historicalData = this.parseNRELHistoricalData(rawData, latitude, longitude);
      this.setCachedData(cacheKey, historicalData);

      return historicalData;

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getHistoricalData',
        latitude,
        longitude,
        startYear,
        endYear
      });
      throw error;
    }
  }

  /**
   * Get weather forecast data from NOAA
   */
  public async getWeatherForecast(
    latitude: number,
    longitude: number,
    hours: number = 168 // 7 days default
  ): Promise<SolarIrradianceData> {
    try {
      const cacheKey = `forecast_${latitude}_${longitude}_${hours}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // NOAA doesn't require API key for basic forecast data
      const gridResponse = await this.fetchWithRetry(
        `https://api.weather.gov/points/${latitude},${longitude}`
      );
      const gridData = await gridResponse.json();

      if (!gridData.properties?.forecastHourly) {
        throw new Error('Unable to get NOAA forecast grid data');
      }

      errorTracker.addBreadcrumb('Fetching forecast from NOAA', 'api', {
        latitude,
        longitude,
        hours,
        source: 'noaa'
      });

      const forecastResponse = await this.fetchWithRetry(gridData.properties.forecastHourly);
      const forecastData = await forecastResponse.json();

      const weatherData = this.parseNOAAForecastData(forecastData, latitude, longitude);
      this.setCachedData(cacheKey, weatherData);

      return weatherData;

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getWeatherForecast',
        latitude,
        longitude,
        hours
      });
      throw error;
    }
  }

  /**
   * Get current weather conditions from OpenWeatherMap
   */
  public async getCurrentWeather(
    latitude: number,
    longitude: number
  ): Promise<WeatherDataPoint> {
    try {
      const cacheKey = `current_${latitude}_${longitude}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      if (!this.config.openWeatherApiKey) {
        throw new Error('OpenWeatherMap API key is required for current weather');
      }

      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        appid: this.config.openWeatherApiKey,
        units: 'metric'
      });

      const url = `https://api.openweathermap.org/data/2.5/weather?${params}`;
      
      errorTracker.addBreadcrumb('Fetching current weather from OpenWeatherMap', 'api', {
        latitude,
        longitude,
        source: 'openweather'
      });

      const response = await this.fetchWithRetry(url);
      const weatherData = await response.json();

      if (weatherData.cod !== 200) {
        throw new Error(`OpenWeatherMap API error: ${weatherData.message}`);
      }

      const currentWeather = this.parseOpenWeatherData(weatherData);
      this.setCachedData(cacheKey, currentWeather, 10); // Cache for 10 minutes

      return currentWeather;

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getCurrentWeather',
        latitude,
        longitude
      });
      throw error;
    }
  }

  /**
   * Get solar position data for a specific location and time
   */
  public async getSolarPosition(
    latitude: number,
    longitude: number,
    datetime: Date,
    timezone?: string
  ): Promise<{
    solarZenithAngle: number;
    solarAzimuthAngle: number;
    solarElevationAngle: number;
    sunriseTime: string;
    sunsetTime: string;
    dayLength: number; // hours
  }> {
    try {
      if (!this.config.nrelApiKey) {
        throw new Error('NREL API key is required for solar position data');
      }

      const params = new URLSearchParams({
        api_key: this.config.nrelApiKey,
        lat: latitude.toString(),
        lon: longitude.toString(),
        year: datetime.getFullYear().toString(),
        month: (datetime.getMonth() + 1).toString(),
        day: datetime.getDate().toString(),
        hour: datetime.getHours().toString(),
        minute: datetime.getMinutes().toString(),
        second: datetime.getSeconds().toString(),
        tz: timezone || 'UTC',
        format: 'json'
      });

      const url = `https://developer.nrel.gov/api/solar/solar_resource/v1.json?${params}`;
      
      const response = await this.fetchWithRetry(url);
      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        throw new Error(`NREL Solar Position API error: ${data.errors[0]}`);
      }

      return {
        solarZenithAngle: data.outputs.zenith,
        solarAzimuthAngle: data.outputs.azimuth,
        solarElevationAngle: 90 - data.outputs.zenith,
        sunriseTime: data.outputs.sunrise,
        sunsetTime: data.outputs.sunset,
        dayLength: data.outputs.day_length
      };

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getSolarPosition',
        latitude,
        longitude,
        datetime: datetime.toISOString()
      });
      throw error;
    }
  }

  /**
   * Get satellite-derived irradiance data
   */
  public async getSatelliteIrradiance(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): Promise<SolarIrradianceData> {
    try {
      const cacheKey = `satellite_${latitude}_${longitude}_${startDate.toISOString()}_${endDate.toISOString()}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      if (!this.config.nrelApiKey) {
        throw new Error('NREL API key is required for satellite irradiance data');
      }

      const params = new URLSearchParams({
        api_key: this.config.nrelApiKey,
        lat: latitude.toString(),
        lon: longitude.toString(),
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        attributes: 'ghi,dni,dhi,clearsky_ghi,clearsky_dni,clearsky_dhi',
        format: 'json'
      });

      const url = `https://developer.nrel.gov/api/nsrdb/v2/solar/himawari-download?${params}`;
      
      errorTracker.addBreadcrumb('Fetching satellite irradiance from NREL', 'api', {
        latitude,
        longitude,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        source: 'nrel_satellite'
      });

      const response = await this.fetchWithRetry(url);
      const rawData = await response.json();

      if (rawData.errors && rawData.errors.length > 0) {
        throw new Error(`NREL Satellite API error: ${rawData.errors[0]}`);
      }

      const satelliteData = this.parseNRELSatelliteData(rawData, latitude, longitude);
      this.setCachedData(cacheKey, satelliteData);

      return satelliteData;

    } catch (error) {
      errorTracker.captureException(error as Error, {
        method: 'getSatelliteIrradiance',
        latitude,
        longitude,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      throw error;
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async fetchWithRetry(url: string, attempt: number = 1): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Solarify/1.0 Solar Calculation Platform',
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw error;
    }
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: any, customExpiryMinutes?: number): void {
    const expiryMinutes = customExpiryMinutes || this.config.cacheExpiry;
    const expires = Date.now() + (expiryMinutes * 60 * 1000);
    this.cache.set(key, { data, expires });
  }

  private parseNRELTMYData(rawData: any, latitude: number, longitude: number): TMYData {
    // Parse NREL TMY data format
    const metadata = rawData.metadata || {};
    const outputs = rawData.outputs || {};

    const monthlyAverages = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      globalHorizontalIrradiance: outputs.avg_ghi?.[i] || 0,
      directNormalIrradiance: outputs.avg_dni?.[i] || 0,
      diffuseHorizontalIrradiance: outputs.avg_dhi?.[i] || 0,
      ambientTemperature: outputs.avg_temp_air?.[i] || 0,
      windSpeed: outputs.avg_wind_speed?.[i] || 0,
      relativeHumidity: outputs.avg_relative_humidity?.[i] || 0
    }));

    return {
      location: {
        latitude,
        longitude,
        elevation: metadata.elevation || 0,
        city: metadata.city || '',
        state: metadata.state || '',
        country: metadata.country || '',
        timezone: metadata.timezone || 'UTC'
      },
      monthlyAverages,
      annualTotals: {
        globalHorizontalIrradiance: outputs.annual_ghi || 0,
        directNormalIrradiance: outputs.annual_dni || 0,
        diffuseHorizontalIrradiance: outputs.annual_dhi || 0
      },
      metadata: {
        dataSource: 'NREL NSRDB',
        years: metadata.years || '',
        version: metadata.version || '',
        lastUpdated: new Date().toISOString()
      }
    };
  }

  private parseNRELHistoricalData(rawData: any, latitude: number, longitude: number): SolarIrradianceData {
    // Parse NREL historical data format
    const metadata = rawData.metadata || {};
    const timeSeries = rawData.data || [];

    const data: WeatherDataPoint[] = timeSeries.map((point: any) => ({
      timestamp: point.timestamp,
      globalHorizontalIrradiance: point.ghi || 0,
      directNormalIrradiance: point.dni || 0,
      diffuseHorizontalIrradiance: point.dhi || 0,
      ambientTemperature: point.temp_air || 0,
      relativeHumidity: point.relative_humidity || 0,
      windSpeed: point.wind_speed || 0,
      windDirection: point.wind_direction || 0,
      pressure: point.pressure || 1013.25,
      cloudCover: point.cloud_type || 0,
      visibility: point.visibility || 10,
      dewPoint: point.dew_point || 0
    }));

    return {
      location: {
        latitude,
        longitude,
        elevation: metadata.elevation || 0,
        timezone: metadata.timezone || 'UTC'
      },
      data,
      metadata: {
        source: 'NREL NSRDB',
        dataType: 'historical',
        resolution: 'hourly',
        startDate: metadata.start_date || '',
        endDate: metadata.end_date || '',
        quality: metadata.quality || 0.95
      }
    };
  }

  private parseNOAAForecastData(rawData: any, latitude: number, longitude: number): SolarIrradianceData {
    // Parse NOAA forecast data format
    const properties = rawData.properties || {};
    const periods = properties.periods || [];

    const data: WeatherDataPoint[] = periods.map((period: any) => ({
      timestamp: period.startTime,
      globalHorizontalIrradiance: this.estimateGHIFromCloudCover(period.probabilityOfPrecipitation?.value || 0),
      directNormalIrradiance: this.estimateDNIFromCloudCover(period.probabilityOfPrecipitation?.value || 0),
      diffuseHorizontalIrradiance: this.estimateDHIFromCloudCover(period.probabilityOfPrecipitation?.value || 0),
      ambientTemperature: this.fahrenheitToCelsius(period.temperature),
      relativeHumidity: period.relativeHumidity?.value || 50,
      windSpeed: this.mphToMs(period.windSpeed?.replace(/\D/g, '') || '0'),
      windDirection: this.windDirectionToDegrees(period.windDirection),
      pressure: 1013.25, // Standard pressure (NOAA doesn't provide)
      cloudCover: period.probabilityOfPrecipitation?.value || 0,
      visibility: 10, // Default visibility
      dewPoint: this.calculateDewPoint(this.fahrenheitToCelsius(period.temperature), period.relativeHumidity?.value || 50)
    }));

    return {
      location: {
        latitude,
        longitude,
        elevation: 0, // NOAA doesn't provide elevation in forecast
        timezone: 'UTC'
      },
      data,
      metadata: {
        source: 'NOAA',
        dataType: 'forecast',
        resolution: 'hourly',
        startDate: data[0]?.timestamp || '',
        endDate: data[data.length - 1]?.timestamp || '',
        quality: 0.8 // Forecast data quality estimate
      }
    };
  }

  private parseNRELSatelliteData(rawData: any, latitude: number, longitude: number): SolarIrradianceData {
    // Parse NREL satellite data format
    const metadata = rawData.metadata || {};
    const timeSeries = rawData.data || [];

    const data: WeatherDataPoint[] = timeSeries.map((point: any) => ({
      timestamp: point.timestamp,
      globalHorizontalIrradiance: point.ghi || 0,
      directNormalIrradiance: point.dni || 0,
      diffuseHorizontalIrradiance: point.dhi || 0,
      ambientTemperature: point.temp_air || 20, // Default if not available
      relativeHumidity: point.relative_humidity || 50,
      windSpeed: point.wind_speed || 3,
      windDirection: point.wind_direction || 180,
      pressure: 1013.25,
      cloudCover: Math.max(0, Math.min(100, 100 - (point.clearsky_ghi > 0 ? (point.ghi / point.clearsky_ghi) * 100 : 0))),
      visibility: 10,
      dewPoint: 10
    }));

    return {
      location: {
        latitude,
        longitude,
        elevation: metadata.elevation || 0,
        timezone: metadata.timezone || 'UTC'
      },
      data,
      metadata: {
        source: 'NREL Satellite',
        dataType: 'historical',
        resolution: 'hourly',
        startDate: metadata.start_date || '',
        endDate: metadata.end_date || '',
        quality: metadata.quality || 0.9
      }
    };
  }

  private parseOpenWeatherData(weatherData: any): WeatherDataPoint {
    return {
      timestamp: new Date(weatherData.dt * 1000).toISOString(),
      globalHorizontalIrradiance: this.estimateGHIFromCloudCover(weatherData.clouds?.all || 0),
      directNormalIrradiance: this.estimateDNIFromCloudCover(weatherData.clouds?.all || 0),
      diffuseHorizontalIrradiance: this.estimateDHIFromCloudCover(weatherData.clouds?.all || 0),
      ambientTemperature: weatherData.main?.temp || 20,
      relativeHumidity: weatherData.main?.humidity || 50,
      windSpeed: weatherData.wind?.speed || 0,
      windDirection: weatherData.wind?.deg || 0,
      pressure: weatherData.main?.pressure || 1013.25,
      cloudCover: weatherData.clouds?.all || 0,
      visibility: (weatherData.visibility || 10000) / 1000, // Convert to km
      dewPoint: this.calculateDewPoint(weatherData.main?.temp || 20, weatherData.main?.humidity || 50)
    };
  }

  // Utility conversion methods
  private fahrenheitToCelsius(fahrenheit: number): number {
    return (fahrenheit - 32) * 5 / 9;
  }

  private mphToMs(mph: string): number {
    return parseFloat(mph) * 0.44704;
  }

  private windDirectionToDegrees(direction: string): number {
    const directions: { [key: string]: number } = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    return directions[direction] || 0;
  }

  private calculateDewPoint(temperature: number, humidity: number): number {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
    return (b * alpha) / (a - alpha);
  }

  private estimateGHIFromCloudCover(cloudCover: number): number {
    // Simplified GHI estimation based on cloud cover
    const clearSkyGHI = 1000; // W/m² clear sky GHI
    const cloudFactor = 1 - (cloudCover / 100) * 0.8; // 80% reduction at 100% cloud cover
    return clearSkyGHI * Math.max(0.1, cloudFactor);
  }

  private estimateDNIFromCloudCover(cloudCover: number): number {
    // Simplified DNI estimation based on cloud cover
    const clearSkyDNI = 900; // W/m² clear sky DNI
    const cloudFactor = 1 - (cloudCover / 100) * 0.9; // 90% reduction at 100% cloud cover
    return clearSkyDNI * Math.max(0.05, cloudFactor);
  }

  private estimateDHIFromCloudCover(cloudCover: number): number {
    // Simplified DHI estimation based on cloud cover
    const baseDHI = 100; // W/m² base diffuse
    const cloudContribution = (cloudCover / 100) * 200; // Additional diffuse from clouds
    return baseDHI + cloudContribution;
  }
}