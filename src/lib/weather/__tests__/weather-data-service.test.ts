import { WeatherDataService } from '../weather-data-service';
import { WeatherAPIClient } from '../weather-api-client';

// Mock the WeatherAPIClient
jest.mock('../weather-api-client');

describe('WeatherDataService', () => {
  let weatherService: WeatherDataService;
  let mockApiClient: jest.Mocked<WeatherAPIClient>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    weatherService = new WeatherDataService({
      primarySource: 'nrel',
      fallbackSources: ['nrel'],
      apiKeys: {
        nrel: 'test-nrel-key',
        noaa: 'test-noaa-key',
        openweather: 'test-openweather-key'
      },
      cacheSettings: {
        tmyData: 1, // Short cache for testing
        historicalData: 1,
        forecastData: 1,
        currentWeather: 1
      },
      qualityThresholds: {
        minimumDataPoints: 100,
        maximumGaps: 2,
        temperatureRange: { min: -40, max: 50 },
        irradianceRange: { min: 0, max: 1400 }
      }
    });

    // Get the mocked constructor
    mockApiClient = new WeatherAPIClient({}) as jest.Mocked<WeatherAPIClient>;
    (WeatherAPIClient as jest.Mock).mockImplementation(() => mockApiClient);
  });

  describe('getOptimalTMYData', () => {
    it('should return TMY data from primary source when available', async () => {
      const mockTMYData = {
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          elevation: 100,
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
          timezone: 'PST'
        },
        monthlyAverages: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          globalHorizontalIrradiance: 4.5 + Math.sin(i * Math.PI / 6) * 1.5,
          directNormalIrradiance: 5.0 + Math.sin(i * Math.PI / 6) * 1.5,
          diffuseHorizontalIrradiance: 2.0 + Math.sin(i * Math.PI / 6) * 0.5,
          ambientTemperature: 15 + Math.sin(i * Math.PI / 6) * 10,
          windSpeed: 3.5,
          relativeHumidity: 65
        })),
        annualTotals: {
          globalHorizontalIrradiance: 1650,
          directNormalIrradiance: 1800,
          diffuseHorizontalIrradiance: 550
        },
        metadata: {
          dataSource: 'NREL NSRDB',
          years: '1998-2020',
          version: 'TMY3',
          lastUpdated: '2024-01-01'
        }
      };

      mockApiClient.getTMYData.mockResolvedValueOnce(mockTMYData);

      const result = await weatherService.getOptimalTMYData(37.7749, -122.4194);

      expect(result).toEqual(mockTMYData);
      expect(mockApiClient.getTMYData).toHaveBeenCalledWith(37.7749, -122.4194, {
        names: 'tmy3',
        interval: 'monthly'
      });
    });

    it('should generate synthetic data when all sources fail', async () => {
      mockApiClient.getTMYData.mockRejectedValue(new Error('API failed'));

      const result = await weatherService.getOptimalTMYData(37.7749, -122.4194);

      expect(result).toBeDefined();
      expect(result.location.latitude).toBe(37.7749);
      expect(result.location.longitude).toBe(-122.4194);
      expect(result.monthlyAverages).toHaveLength(12);
      expect(result.metadata.dataSource).toBe('Synthetic (Generated)');
    });

    it('should validate TMY data quality', async () => {
      const invalidTMYData = {
        location: { latitude: 37.7749, longitude: -122.4194, elevation: 0, city: '', state: '', country: '', timezone: '' },
        monthlyAverages: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          globalHorizontalIrradiance: 0, // Invalid - too low
          directNormalIrradiance: 0,
          diffuseHorizontalIrradiance: 0,
          ambientTemperature: 15,
          windSpeed: 3.5,
          relativeHumidity: 65
        })),
        annualTotals: {
          globalHorizontalIrradiance: 100, // Invalid - too low
          directNormalIrradiance: 100,
          diffuseHorizontalIrradiance: 50
        },
        metadata: { dataSource: 'NREL NSRDB', years: '', version: '', lastUpdated: '' }
      };

      mockApiClient.getTMYData.mockResolvedValueOnce(invalidTMYData);

      const result = await weatherService.getOptimalTMYData(37.7749, -122.4194);

      // Should fall back to synthetic data due to invalid source data
      expect(result.metadata.dataSource).toBe('Synthetic (Generated)');
    });
  });

  describe('getQualityHistoricalData', () => {
    it('should return enhanced historical data with quality assessment', async () => {
      const mockHistoricalData = {
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          elevation: 100,
          timezone: 'PST'
        },
        data: Array.from({ length: 8760 }, (_, i) => ({
          timestamp: new Date(2023, 0, 1, i % 24).toISOString(),
          globalHorizontalIrradiance: 500 + Math.random() * 400,
          directNormalIrradiance: 600 + Math.random() * 300,
          diffuseHorizontalIrradiance: 200 + Math.random() * 100,
          ambientTemperature: 15 + Math.random() * 20,
          relativeHumidity: 50 + Math.random() * 30,
          windSpeed: 2 + Math.random() * 4,
          windDirection: Math.random() * 360,
          pressure: 1013 + Math.random() * 20,
          cloudCover: Math.random() * 100,
          visibility: 8 + Math.random() * 2,
          dewPoint: 10 + Math.random() * 10
        })),
        metadata: {
          source: 'NREL NSRDB',
          dataType: 'historical' as const,
          resolution: 'hourly' as const,
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          quality: 0.95
        }
      };

      mockApiClient.getHistoricalData.mockResolvedValueOnce(mockHistoricalData);

      const result = await weatherService.getQualityHistoricalData(37.7749, -122.4194, 2023, 2023);

      expect(result).toBeDefined();
      expect(result.quality).toBeDefined();
      expect(result.quality.score).toBeGreaterThan(0);
      expect(result.quality.score).toBeLessThanOrEqual(1);
      expect(result.processingInfo).toBeDefined();
      expect(result.source).toBe('nrel');
    });

    it('should assess data quality correctly', async () => {
      const mockDataWithIssues = {
        location: { latitude: 37.7749, longitude: -122.4194, elevation: 100, timezone: 'PST' },
        data: [
          // Good data point
          {
            timestamp: '2023-01-01T12:00:00Z',
            globalHorizontalIrradiance: 800,
            directNormalIrradiance: 700,
            diffuseHorizontalIrradiance: 200,
            ambientTemperature: 25,
            relativeHumidity: 60,
            windSpeed: 3,
            windDirection: 180,
            pressure: 1013,
            cloudCover: 20,
            visibility: 10,
            dewPoint: 15
          },
          // Outlier temperature
          {
            timestamp: '2023-01-01T13:00:00Z',
            globalHorizontalIrradiance: 800,
            directNormalIrradiance: 700,
            diffuseHorizontalIrradiance: 200,
            ambientTemperature: 80, // Outlier
            relativeHumidity: 60,
            windSpeed: 3,
            windDirection: 180,
            pressure: 1013,
            cloudCover: 20,
            visibility: 10,
            dewPoint: 15
          },
          // Suspicious values (all zeros)
          {
            timestamp: '2023-01-01T14:00:00Z',
            globalHorizontalIrradiance: 0,
            directNormalIrradiance: 0,
            diffuseHorizontalIrradiance: 0,
            ambientTemperature: 25,
            relativeHumidity: 60,
            windSpeed: 3,
            windDirection: 180,
            pressure: 1013,
            cloudCover: 20,
            visibility: 10,
            dewPoint: 15
          }
        ],
        metadata: {
          source: 'NREL NSRDB',
          dataType: 'historical' as const,
          resolution: 'hourly' as const,
          startDate: '2023-01-01',
          endDate: '2023-01-01',
          quality: 0.95
        }
      };

      mockApiClient.getHistoricalData.mockResolvedValueOnce(mockDataWithIssues);

      const result = await weatherService.getQualityHistoricalData(37.7749, -122.4194, 2023, 2023);

      expect(result.quality.outlierDetection.temperatureOutliers).toBeGreaterThan(0);
      expect(result.quality.outlierDetection.suspiciousValues).toBeGreaterThan(0);
      expect(result.quality.score).toBeLessThan(1); // Should be penalized for outliers
    });

    it('should handle gaps in data', async () => {
      const mockDataWithGaps = {
        location: { latitude: 37.7749, longitude: -122.4194, elevation: 100, timezone: 'PST' },
        data: [
          {
            timestamp: '2023-01-01T12:00:00Z',
            globalHorizontalIrradiance: 800,
            directNormalIrradiance: 700,
            diffuseHorizontalIrradiance: 200,
            ambientTemperature: 25,
            relativeHumidity: 60,
            windSpeed: 3,
            windDirection: 180,
            pressure: 1013,
            cloudCover: 20,
            visibility: 10,
            dewPoint: 15
          },
          // 3-hour gap
          {
            timestamp: '2023-01-01T15:00:00Z', // 3 hours later
            globalHorizontalIrradiance: 600,
            directNormalIrradiance: 500,
            diffuseHorizontalIrradiance: 180,
            ambientTemperature: 23,
            relativeHumidity: 65,
            windSpeed: 2,
            windDirection: 170,
            pressure: 1015,
            cloudCover: 30,
            visibility: 9,
            dewPoint: 14
          }
        ],
        metadata: {
          source: 'NREL NSRDB',
          dataType: 'historical' as const,
          resolution: 'hourly' as const,
          startDate: '2023-01-01',
          endDate: '2023-01-01',
          quality: 0.95
        }
      };

      mockApiClient.getHistoricalData.mockResolvedValueOnce(mockDataWithGaps);

      const result = await weatherService.getQualityHistoricalData(37.7749, -122.4194, 2023, 2023);

      // Should fill the gap with interpolated data
      expect(result.data.length).toBeGreaterThan(2); // Original + interpolated points
      expect(result.quality.gapAnalysis.totalGaps).toBeGreaterThan(0);
    });
  });

  describe('getQualityForecast', () => {
    it('should return forecast data for US locations', async () => {
      const mockForecastData = {
        location: { latitude: 37.7749, longitude: -122.4194, elevation: 100, timezone: 'PST' },
        data: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
          globalHorizontalIrradiance: 400 + Math.random() * 200,
          directNormalIrradiance: 500 + Math.random() * 200,
          diffuseHorizontalIrradiance: 150 + Math.random() * 100,
          ambientTemperature: 15 + Math.random() * 10,
          relativeHumidity: 50 + Math.random() * 30,
          windSpeed: 2 + Math.random() * 4,
          windDirection: Math.random() * 360,
          pressure: 1013 + Math.random() * 10,
          cloudCover: Math.random() * 60,
          visibility: 8 + Math.random() * 2,
          dewPoint: 10 + Math.random() * 5
        })),
        metadata: {
          source: 'NOAA',
          dataType: 'forecast' as const,
          resolution: 'hourly' as const,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          quality: 0.8
        }
      };

      mockApiClient.getWeatherForecast.mockResolvedValueOnce(mockForecastData);

      const result = await weatherService.getQualityForecast(37.7749, -122.4194, 24);

      expect(result).toBeDefined();
      expect(result.source).toBe('noaa');
      expect(result.data).toHaveLength(24);
      expect(result.quality).toBeDefined();
    });

    it('should throw error for non-US locations', async () => {
      // Test coordinates outside US (London, UK)
      await expect(
        weatherService.getQualityForecast(51.5074, -0.1278, 24)
      ).rejects.toThrow('Weather forecast not available for this location');
    });
  });

  describe('getCurrentWeatherConditions', () => {
    it('should return current weather from OpenWeatherMap', async () => {
      const mockCurrentWeather = {
        timestamp: new Date().toISOString(),
        globalHorizontalIrradiance: 750,
        directNormalIrradiance: 650,
        diffuseHorizontalIrradiance: 200,
        ambientTemperature: 22,
        relativeHumidity: 65,
        windSpeed: 3.2,
        windDirection: 180,
        pressure: 1013,
        cloudCover: 25,
        visibility: 10,
        dewPoint: 16
      };

      mockApiClient.getCurrentWeather.mockResolvedValueOnce(mockCurrentWeather);

      const result = await weatherService.getCurrentWeatherConditions(37.7749, -122.4194);

      expect(result).toEqual(mockCurrentWeather);
      expect(mockApiClient.getCurrentWeather).toHaveBeenCalledWith(37.7749, -122.4194);
    });

    it('should fallback to NOAA forecast for current conditions', async () => {
      const mockForecastData = {
        location: { latitude: 37.7749, longitude: -122.4194, elevation: 100, timezone: 'PST' },
        data: [{
          timestamp: new Date().toISOString(),
          globalHorizontalIrradiance: 700,
          directNormalIrradiance: 600,
          diffuseHorizontalIrradiance: 180,
          ambientTemperature: 20,
          relativeHumidity: 70,
          windSpeed: 2.5,
          windDirection: 170,
          pressure: 1015,
          cloudCover: 30,
          visibility: 9,
          dewPoint: 14
        }],
        metadata: {
          source: 'NOAA',
          dataType: 'forecast' as const,
          resolution: 'hourly' as const,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          quality: 0.8
        }
      };

      mockApiClient.getCurrentWeather.mockRejectedValueOnce(new Error('OpenWeatherMap failed'));
      mockApiClient.getWeatherForecast.mockResolvedValueOnce(mockForecastData);

      const result = await weatherService.getCurrentWeatherConditions(37.7749, -122.4194);

      expect(result).toEqual(mockForecastData.data[0]);
    });
  });

  describe('data processing and validation', () => {
    it('should interpolate missing data points correctly', async () => {
      const mockDataWithGaps = {
        location: { latitude: 37.7749, longitude: -122.4194, elevation: 100, timezone: 'PST' },
        data: [
          {
            timestamp: '2023-01-01T12:00:00Z',
            globalHorizontalIrradiance: 800,
            directNormalIrradiance: 700,
            diffuseHorizontalIrradiance: 200,
            ambientTemperature: 20,
            relativeHumidity: 60,
            windSpeed: 3,
            windDirection: 180,
            pressure: 1013,
            cloudCover: 20,
            visibility: 10,
            dewPoint: 15
          },
          {
            timestamp: '2023-01-01T15:00:00Z', // 3-hour gap
            globalHorizontalIrradiance: 600,
            directNormalIrradiance: 500,
            diffuseHorizontalIrradiance: 150,
            ambientTemperature: 25,
            relativeHumidity: 55,
            windSpeed: 4,
            windDirection: 170,
            pressure: 1015,
            cloudCover: 30,
            visibility: 9,
            dewPoint: 18
          }
        ],
        metadata: {
          source: 'NREL NSRDB',
          dataType: 'historical' as const,
          resolution: 'hourly' as const,
          startDate: '2023-01-01',
          endDate: '2023-01-01',
          quality: 0.95
        }
      };

      mockApiClient.getHistoricalData.mockResolvedValueOnce(mockDataWithGaps);

      const result = await weatherService.getQualityHistoricalData(37.7749, -122.4194, 2023, 2023);

      // Should have filled the 3-hour gap with 2 interpolated points
      expect(result.data.length).toBe(4); // Original 2 + 2 interpolated

      // Check that interpolated values are between the original values
      const interpolated1 = result.data[1];
      const interpolated2 = result.data[2];

      expect(interpolated1.ambientTemperature).toBeGreaterThan(20);
      expect(interpolated1.ambientTemperature).toBeLessThan(25);
      expect(interpolated2.ambientTemperature).toBeGreaterThan(20);
      expect(interpolated2.ambientTemperature).toBeLessThan(25);
    });

    it('should generate synthetic data with reasonable values', async () => {
      mockApiClient.getTMYData.mockRejectedValue(new Error('All sources failed'));

      const result = await weatherService.getOptimalTMYData(60, -100); // High latitude location

      expect(result.monthlyAverages).toHaveLength(12);
      
      // Check seasonal variation
      const summer = result.monthlyAverages[5]; // June
      const winter = result.monthlyAverages[11]; // December
      
      expect(summer.globalHorizontalIrradiance).toBeGreaterThan(winter.globalHorizontalIrradiance);
      expect(summer.ambientTemperature).toBeGreaterThan(winter.ambientTemperature);

      // Check reasonable ranges
      result.monthlyAverages.forEach(month => {
        expect(month.globalHorizontalIrradiance).toBeGreaterThan(0);
        expect(month.globalHorizontalIrradiance).toBeLessThan(10); // kWh/m²/day
        expect(month.ambientTemperature).toBeGreaterThan(-50);
        expect(month.ambientTemperature).toBeLessThan(50);
      });
    });
  });
});