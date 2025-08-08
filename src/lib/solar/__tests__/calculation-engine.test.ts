import { SolarCalculationEngine, SolarSystemSpecs, Location, WeatherData } from '../calculation-engine';

describe('SolarCalculationEngine', () => {
  let calculator: SolarCalculationEngine;
  let mockLocation: Location;
  let mockSystemSpecs: SolarSystemSpecs;
  let mockWeatherData: WeatherData[];

  beforeEach(() => {
    calculator = new SolarCalculationEngine();
    
    mockLocation = {
      latitude: 37.7749,
      longitude: -122.4194,
      elevation: 50
    };

    mockSystemSpecs = {
      dcCapacity: 10.0, // 10kW system
      moduleEfficiency: 20.0,
      inverterEfficiency: 96.0,
      systemLosses: 14.0,
      tiltAngle: 30,
      azimuthAngle: 180,
      moduleType: 'monocrystalline',
      trackingType: 'fixed',
      inverterType: 'string'
    };

    mockWeatherData = Array.from({ length: 12 }, (_, month) => ({
      month: month + 1,
      globalHorizontalIrradiance: 5.0 + Math.sin((month - 3) * Math.PI / 6) * 1.5,
      directNormalIrradiance: 6.0,
      diffuseHorizontalIrradiance: 2.0,
      ambientTemperature: 20 + 10 * Math.sin((month - 3) * Math.PI / 6),
      windSpeed: 3.0,
      relativeHumidity: 60
    }));
  });

  describe('calculateSolarProduction', () => {
    it('should calculate solar production for valid inputs', async () => {
      const result = await calculator.calculateSolarProduction(
        mockLocation,
        mockSystemSpecs,
        mockWeatherData,
        { includeFinancialAnalysis: true }
      );

      expect(result).toBeDefined();
      expect(result.annualProduction).toBeGreaterThan(0);
      expect(result.monthlyProduction).toHaveLength(12);
      expect(result.capacityFactor).toBeGreaterThan(0);
      expect(result.capacityFactor).toBeLessThan(100);
      expect(result.specificYield).toBeGreaterThan(0);
      expect(result.performanceRatio).toBeGreaterThan(0);
      expect(result.performanceRatio).toBeLessThan(2);
      expect(result.co2Savings).toBeGreaterThan(0);
    });

    it('should include financial analysis when requested', async () => {
      const result = await calculator.calculateSolarProduction(
        mockLocation,
        mockSystemSpecs,
        mockWeatherData,
        { 
          includeFinancialAnalysis: true,
          electricityRate: 0.15,
          systemLifetime: 25
        }
      );

      expect(result.financialAnalysis).toBeDefined();
      expect(result.financialAnalysis.systemCost).toBeGreaterThan(0);
      expect(result.financialAnalysis.annualSavings).toBeGreaterThan(0);
      expect(result.financialAnalysis.paybackPeriod).toBeGreaterThan(0);
      expect(result.financialAnalysis.npv).toBeDefined();
      expect(result.financialAnalysis.lcoe).toBeGreaterThan(0);
    });

    it('should return consistent monthly production totals', async () => {
      const result = await calculator.calculateSolarProduction(
        mockLocation,
        mockSystemSpecs,
        mockWeatherData
      );

      const monthlyTotal = result.monthlyProduction.reduce(
        (sum, month) => sum + month.production, 
        0
      );

      expect(Math.abs(monthlyTotal - result.annualProduction)).toBeLessThan(1); // Within 1 kWh
    });

    it('should calculate system efficiency breakdown', async () => {
      const result = await calculator.calculateSolarProduction(
        mockLocation,
        mockSystemSpecs,
        mockWeatherData
      );

      expect(result.systemEfficiency).toBeDefined();
      expect(result.systemEfficiency.moduleEfficiency).toBe(mockSystemSpecs.moduleEfficiency);
      expect(result.systemEfficiency.inverterEfficiency).toBe(mockSystemSpecs.inverterEfficiency);
      expect(result.systemEfficiency.overallEfficiency).toBeGreaterThan(0);
      expect(result.systemEfficiency.overallEfficiency).toBeLessThan(mockSystemSpecs.moduleEfficiency);
    });
  });

  describe('input validation', () => {
    it('should throw error for invalid latitude', async () => {
      const invalidLocation = { ...mockLocation, latitude: 95 };
      
      await expect(
        calculator.calculateSolarProduction(invalidLocation, mockSystemSpecs, mockWeatherData)
      ).rejects.toThrow('Invalid latitude');
    });

    it('should throw error for invalid longitude', async () => {
      const invalidLocation = { ...mockLocation, longitude: 185 };
      
      await expect(
        calculator.calculateSolarProduction(invalidLocation, mockSystemSpecs, mockWeatherData)
      ).rejects.toThrow('Invalid longitude');
    });

    it('should throw error for zero DC capacity', async () => {
      const invalidSpecs = { ...mockSystemSpecs, dcCapacity: 0 };
      
      await expect(
        calculator.calculateSolarProduction(mockLocation, invalidSpecs, mockWeatherData)
      ).rejects.toThrow('DC capacity must be greater than 0');
    });

    it('should throw error for invalid module efficiency', async () => {
      const invalidSpecs = { ...mockSystemSpecs, moduleEfficiency: 55 };
      
      await expect(
        calculator.calculateSolarProduction(mockLocation, invalidSpecs, mockWeatherData)
      ).rejects.toThrow('Module efficiency must be between 0 and 50%');
    });

    it('should throw error for incomplete weather data', async () => {
      const incompleteWeatherData = mockWeatherData.slice(0, 6); // Only 6 months
      
      await expect(
        calculator.calculateSolarProduction(mockLocation, mockSystemSpecs, incompleteWeatherData)
      ).rejects.toThrow('Weather data must contain exactly 12 months');
    });

    it('should throw error for invalid weather data values', async () => {
      const invalidWeatherData = [...mockWeatherData];
      invalidWeatherData[0].globalHorizontalIrradiance = -1; // Invalid negative value
      
      await expect(
        calculator.calculateSolarProduction(mockLocation, mockSystemSpecs, invalidWeatherData)
      ).rejects.toThrow('Invalid GHI for month 1');
    });
  });

  describe('performance calculations', () => {
    it('should calculate higher production for better orientation', async () => {
      const optimalSpecs = { ...mockSystemSpecs, tiltAngle: 30, azimuthAngle: 180 };
      const suboptimalSpecs = { ...mockSystemSpecs, tiltAngle: 0, azimuthAngle: 90 };

      const optimalResult = await calculator.calculateSolarProduction(
        mockLocation, optimalSpecs, mockWeatherData
      );
      const suboptimalResult = await calculator.calculateSolarProduction(
        mockLocation, suboptimalSpecs, mockWeatherData
      );

      expect(optimalResult.annualProduction).toBeGreaterThan(suboptimalResult.annualProduction);
    });

    it('should calculate higher production for more efficient panels', async () => {
      const highEffSpecs = { ...mockSystemSpecs, moduleEfficiency: 22.0 };
      const lowEffSpecs = { ...mockSystemSpecs, moduleEfficiency: 17.0 };

      const highEffResult = await calculator.calculateSolarProduction(
        mockLocation, highEffSpecs, mockWeatherData
      );
      const lowEffResult = await calculator.calculateSolarProduction(
        mockLocation, lowEffSpecs, mockWeatherData
      );

      expect(highEffResult.annualProduction).toBeGreaterThan(lowEffResult.annualProduction);
    });

    it('should calculate reasonable capacity factors', async () => {
      const result = await calculator.calculateSolarProduction(
        mockLocation,
        mockSystemSpecs,
        mockWeatherData
      );

      // Capacity factor should be realistic (10-30% for most locations)
      expect(result.capacityFactor).toBeGreaterThanOrEqual(10);
      expect(result.capacityFactor).toBeLessThanOrEqual(35);
    });

    it('should calculate reasonable specific yield', async () => {
      const result = await calculator.calculateSolarProduction(
        mockLocation,
        mockSystemSpecs,
        mockWeatherData
      );

      // Specific yield should be realistic (800-2000 kWh/kW/year)
      expect(result.specificYield).toBeGreaterThanOrEqual(800);
      expect(result.specificYield).toBeLessThanOrEqual(2500);
    });
  });

  describe('temperature effects', () => {
    it('should show lower production in higher temperature conditions', async () => {
      const coolWeatherData = mockWeatherData.map(month => ({
        ...month,
        ambientTemperature: 15 // Cool conditions
      }));

      const hotWeatherData = mockWeatherData.map(month => ({
        ...month,
        ambientTemperature: 35 // Hot conditions
      }));

      const coolResult = await calculator.calculateSolarProduction(
        mockLocation, mockSystemSpecs, coolWeatherData
      );
      const hotResult = await calculator.calculateSolarProduction(
        mockLocation, mockSystemSpecs, hotWeatherData
      );

      expect(coolResult.annualProduction).toBeGreaterThan(hotResult.annualProduction);
    });
  });

  describe('system losses', () => {
    it('should show lower production with higher system losses', async () => {
      const lowLossSpecs = { ...mockSystemSpecs, systemLosses: 10 };
      const highLossSpecs = { ...mockSystemSpecs, systemLosses: 20 };

      const lowLossResult = await calculator.calculateSolarProduction(
        mockLocation, lowLossSpecs, mockWeatherData
      );
      const highLossResult = await calculator.calculateSolarProduction(
        mockLocation, highLossSpecs, mockWeatherData
      );

      expect(lowLossResult.annualProduction).toBeGreaterThan(highLossResult.annualProduction);
    });
  });
});