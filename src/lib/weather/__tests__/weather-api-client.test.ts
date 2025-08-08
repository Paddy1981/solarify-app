import { WeatherAPIClient } from '../weather-api-client';

// Mock fetch for testing
global.fetch = jest.fn();

describe('WeatherAPIClient', () => {
  let weatherClient: WeatherAPIClient;

  beforeEach(() => {
    weatherClient = new WeatherAPIClient({
      nrelApiKey: 'test-nrel-key',
      noaaApiKey: 'test-noaa-key',
      openWeatherApiKey: 'test-openweather-key',
      cacheExpiry: 1, // 1 minute for testing
      retryAttempts: 2,
      timeout: 5000
    });

    // Clear fetch mock
    (fetch as jest.Mock).mockClear();
  });

  describe('getTMYData', () => {
    it('should fetch TMY data successfully', async () => {
      const mockResponse = {
        metadata: {
          elevation: 100,
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
          timezone: 'PST'
        },
        outputs: {
          avg_ghi: Array.from({ length: 12 }, (_, i) => 4 + Math.sin(i * Math.PI / 6)),
          avg_dni: Array.from({ length: 12 }, (_, i) => 5 + Math.sin(i * Math.PI / 6)),
          avg_dhi: Array.from({ length: 12 }, (_, i) => 2 + Math.sin(i * Math.PI / 6) * 0.5),
          avg_temp_air: Array.from({ length: 12 }, (_, i) => 15 + Math.sin(i * Math.PI / 6) * 10),
          avg_wind_speed: Array.from({ length: 12 }, () => 3.5),
          avg_relative_humidity: Array.from({ length: 12 }, () => 65),
          annual_ghi: 1650,
          annual_dni: 1800,
          annual_dhi: 550
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await weatherClient.getTMYData(37.7749, -122.4194);

      expect(result).toBeDefined();
      expect(result.location.latitude).toBe(37.7749);
      expect(result.location.longitude).toBe(-122.4194);
      expect(result.monthlyAverages).toHaveLength(12);
      expect(result.annualTotals.globalHorizontalIrradiance).toBe(1650);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when NREL API key is missing', async () => {
      const clientWithoutKey = new WeatherAPIClient({
        cacheExpiry: 60,
        retryAttempts: 3,
        timeout: 30000
      });

      await expect(
        clientWithoutKey.getTMYData(37.7749, -122.4194)
      ).rejects.toThrow('NREL API key is required for TMY data');
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: ['Invalid location coordinates']
        })
      });

      await expect(
        weatherClient.getTMYData(37.7749, -122.4194)
      ).rejects.toThrow('NREL API error: Invalid location coordinates');
    });

    it('should use cache for repeated requests', async () => {
      const mockResponse = {
        metadata: { elevation: 100 },
        outputs: {
          avg_ghi: [4, 5, 6, 5, 4, 3, 3, 4, 5, 6, 5, 4],
          annual_ghi: 1650
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // First request
      await weatherClient.getTMYData(37.7749, -122.4194);
      
      // Second request (should use cache)
      await weatherClient.getTMYData(37.7749, -122.4194);

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentWeather', () => {
    it('should fetch current weather successfully', async () => {
      const mockResponse = {
        cod: 200,
        main: {
          temp: 22.5,
          humidity: 65,
          pressure: 1013.25
        },
        wind: {
          speed: 3.2,
          deg: 180
        },
        clouds: {
          all: 20
        },
        visibility: 10000,
        dt: Date.now() / 1000
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await weatherClient.getCurrentWeather(37.7749, -122.4194);

      expect(result).toBeDefined();
      expect(result.ambientTemperature).toBe(22.5);
      expect(result.relativeHumidity).toBe(65);
      expect(result.windSpeed).toBe(3.2);
      expect(result.cloudCover).toBe(20);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when OpenWeatherMap API key is missing', async () => {
      const clientWithoutKey = new WeatherAPIClient({
        nrelApiKey: 'test-key',
        cacheExpiry: 60,
        retryAttempts: 3,
        timeout: 30000
      });

      await expect(
        clientWithoutKey.getCurrentWeather(37.7749, -122.4194)
      ).rejects.toThrow('OpenWeatherMap API key is required for current weather');
    });

    it('should handle OpenWeatherMap API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cod: 401,
          message: 'Invalid API key'
        })
      });

      await expect(
        weatherClient.getCurrentWeather(37.7749, -122.4194)
      ).rejects.toThrow('OpenWeatherMap API error: Invalid API key');
    });
  });

  describe('getWeatherForecast', () => {
    it('should fetch NOAA forecast successfully', async () => {
      // Mock NOAA grid points response
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            properties: {
              forecastHourly: 'https://api.weather.gov/gridpoints/forecast'
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            properties: {
              periods: [
                {
                  startTime: '2024-01-15T12:00:00Z',
                  temperature: 68,
                  relativeHumidity: { value: 60 },
                  windSpeed: '10 mph',
                  windDirection: 'SW',
                  probabilityOfPrecipitation: { value: 20 }
                }
              ]
            }
          })
        });

      const result = await weatherClient.getWeatherForecast(37.7749, -122.4194, 24);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].timestamp).toBe('2024-01-15T12:00:00Z');
      expect(result.metadata.source).toBe('NOAA');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle NOAA API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          properties: {} // Missing forecastHourly
        })
      });

      await expect(
        weatherClient.getWeatherForecast(37.7749, -122.4194)
      ).rejects.toThrow('Unable to get NOAA forecast grid data');
    });
  });

  describe('getSolarPosition', () => {
    it('should calculate solar position successfully', async () => {
      const mockResponse = {
        outputs: {
          zenith: 30.5,
          azimuth: 180.2,
          sunrise: '06:30',
          sunset: '18:45',
          day_length: 12.25
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await weatherClient.getSolarPosition(
        37.7749, 
        -122.4194, 
        new Date('2024-06-21T12:00:00Z')
      );

      expect(result).toBeDefined();
      expect(result.solarZenithAngle).toBe(30.5);
      expect(result.solarAzimuthAngle).toBe(180.2);
      expect(result.solarElevationAngle).toBe(59.5); // 90 - zenith
      expect(result.dayLength).toBe(12.25);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling and retries', () => {
    it('should retry failed requests', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ outputs: { annual_ghi: 1650 } })
        });

      const result = await weatherClient.getTMYData(37.7749, -122.4194);

      expect(result).toBeDefined();
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after maximum retry attempts', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(
        weatherClient.getTMYData(37.7749, -122.4194)
      ).rejects.toThrow('Network error');

      expect(fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry (retryAttempts = 2)
    });

    it('should handle HTTP error responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(
        weatherClient.getTMYData(37.7749, -122.4194)
      ).rejects.toThrow('HTTP 404: Not Found');
    });
  });

  describe('utility methods', () => {
    it('should estimate irradiance from cloud cover correctly', async () => {
      const mockResponse = {
        cod: 200,
        main: { temp: 20, humidity: 50, pressure: 1013 },
        wind: { speed: 2, deg: 180 },
        clouds: { all: 50 }, // 50% cloud cover
        visibility: 10000,
        dt: Date.now() / 1000
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await weatherClient.getCurrentWeather(37.7749, -122.4194);

      // With 50% cloud cover, should have reduced GHI
      expect(result.globalHorizontalIrradiance).toBeLessThan(1000);
      expect(result.globalHorizontalIrradiance).toBeGreaterThan(0);
      
      // DNI should be more affected by clouds than GHI
      expect(result.directNormalIrradiance).toBeLessThan(result.globalHorizontalIrradiance);
    });

    it('should calculate dew point correctly', async () => {
      const mockResponse = {
        cod: 200,
        main: { temp: 25, humidity: 70, pressure: 1013 },
        wind: { speed: 2, deg: 180 },
        clouds: { all: 0 },
        visibility: 10000,
        dt: Date.now() / 1000
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await weatherClient.getCurrentWeather(37.7749, -122.4194);

      // Dew point should be reasonable for 25°C and 70% humidity
      expect(result.dewPoint).toBeGreaterThan(15);
      expect(result.dewPoint).toBeLessThan(25);
    });
  });

  describe('data validation', () => {
    it('should validate TMY data structure', async () => {
      const invalidResponse = {
        metadata: {},
        outputs: {
          avg_ghi: [1, 2, 3], // Only 3 months instead of 12
          annual_ghi: 1650
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse
      });

      const result = await weatherClient.getTMYData(37.7749, -122.4194);

      // Should still return data but with proper defaults for missing months
      expect(result.monthlyAverages).toHaveLength(12);
    });

    it('should handle missing weather data gracefully', async () => {
      const incompleteResponse = {
        cod: 200,
        main: { temp: 20 }, // Missing humidity, pressure
        wind: {}, // Missing speed, direction
        clouds: {},
        dt: Date.now() / 1000
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteResponse
      });

      const result = await weatherClient.getCurrentWeather(37.7749, -122.4194);

      // Should have default values for missing data
      expect(result.relativeHumidity).toBe(50); // Default
      expect(result.windSpeed).toBe(0); // Default
      expect(result.pressure).toBe(1013.25); // Default
    });
  });
});