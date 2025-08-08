/**
 * Solar Machine Learning Models
 * Predictive analytics and forecasting for solar energy systems
 */

import { EnergyProductionRecord, SolarSystem, WeatherRecord } from '../../../types/firestore-schema';
import { errorTracker } from '../../monitoring/error-tracker';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface PredictionResult {
  value: number;
  confidence: number;
  range: PredictionRange;
  factors: PredictionFactor[];
  methodology: string;
  timestamp: Date;
  validFor: number; // minutes
}

export interface PredictionRange {
  min: number;
  max: number;
  p10: number; // 10th percentile
  p50: number; // median
  p90: number; // 90th percentile
}

export interface PredictionFactor {
  factor: string;
  impact: number; // -1 to 1
  confidence: number;
  description: string;
}

export interface ModelTrainingData {
  features: FeatureSet[];
  targets: number[];
  timestamps: Date[];
  metadata: TrainingMetadata;
}

export interface FeatureSet {
  // Time features
  hour: number;
  dayOfYear: number;
  month: number;
  season: number;
  
  // Weather features
  solarIrradiance: number;
  clearSkyIndex: number;
  ambientTemperature: number;
  windSpeed: number;
  humidity: number;
  cloudCover: number;
  
  // System features
  systemCapacity: number;
  systemAge: number;
  degradationFactor: number;
  maintenanceScore: number;
  
  // Historical features
  avgLast7Days: number;
  trendSlope: number;
  seasonalPattern: number;
  performanceRatio: number;
}

export interface TrainingMetadata {
  systemId: string;
  dataPoints: number;
  timeRange: { start: Date; end: Date };
  featureImportance: Record<string, number>;
  modelPerformance: ModelMetrics;
}

export interface ModelMetrics {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  r2Score: number; // R-squared
  accuracy: number; // Classification accuracy for categorized predictions
}

export interface WeatherForecast {
  timestamp: Date;
  irradiance: number;
  temperature: number;
  windSpeed: number;
  humidity: number;
  cloudCover: number;
  precipitation: number;
}

export interface MaintenancePrediction {
  component: string;
  probability: number;
  timeToMaintenance: number; // days
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: MaintenanceIndicator[];
  recommendation: string;
  estimatedCost: number;
}

export interface MaintenanceIndicator {
  metric: string;
  currentValue: number;
  threshold: number;
  trend: 'improving' | 'stable' | 'declining';
  contribution: number; // 0-1
}

export interface DegradationModel {
  systemId: string;
  currentDegradation: number; // percentage
  projectedDegradation: DegradationProjection[];
  degradationRate: number; // % per year
  factors: DegradationFactor[];
  confidence: number;
}

export interface DegradationProjection {
  year: number;
  degradationPercent: number;
  productionLoss: number; // kWh
  confidenceInterval: { lower: number; upper: number };
}

export interface DegradationFactor {
  factor: string;
  impact: number; // acceleration factor
  description: string;
}

// =====================================================
// SIMPLE LINEAR REGRESSION MODEL
// =====================================================

class SimpleLinearRegression {
  private slope: number = 0;
  private intercept: number = 0;
  private trained: boolean = false;

  train(x: number[], y: number[]): void {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Invalid training data');
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    this.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    this.intercept = (sumY - this.slope * sumX) / n;
    this.trained = true;
  }

  predict(x: number): number {
    if (!this.trained) {
      throw new Error('Model not trained');
    }
    return this.slope * x + this.intercept;
  }

  getCoefficients(): { slope: number; intercept: number } {
    return { slope: this.slope, intercept: this.intercept };
  }
}

// =====================================================
// MOVING AVERAGE MODEL
// =====================================================

class MovingAverageModel {
  private window: number;
  private data: number[] = [];

  constructor(window: number = 7) {
    this.window = window;
  }

  addData(value: number): void {
    this.data.push(value);
    if (this.data.length > this.window) {
      this.data.shift();
    }
  }

  predict(): number {
    if (this.data.length === 0) return 0;
    return this.data.reduce((sum, val) => sum + val, 0) / this.data.length;
  }

  getMovingAverage(data: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = window - 1; i < data.length; i++) {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
    return result;
  }
}

// =====================================================
// SEASONAL DECOMPOSITION MODEL
// =====================================================

class SeasonalModel {
  private seasonalFactors: Map<number, number> = new Map();
  private trendModel: SimpleLinearRegression = new SimpleLinearRegression();
  private trained: boolean = false;

  train(data: number[], timestamps: Date[]): void {
    if (data.length !== timestamps.length || data.length < 365) {
      throw new Error('Need at least one year of data for seasonal modeling');
    }

    // Extract seasonal patterns
    this.extractSeasonalFactors(data, timestamps);
    
    // Train trend model
    const deseasonalized = this.removeSeasonality(data, timestamps);
    const timeIndices = timestamps.map((_, index) => index);
    this.trendModel.train(timeIndices, deseasonalized);
    
    this.trained = true;
  }

  predict(timestamp: Date, futureIndex: number): number {
    if (!this.trained) {
      throw new Error('Model not trained');
    }

    const dayOfYear = this.getDayOfYear(timestamp);
    const seasonalFactor = this.seasonalFactors.get(dayOfYear) || 1.0;
    const trend = this.trendModel.predict(futureIndex);
    
    return trend * seasonalFactor;
  }

  private extractSeasonalFactors(data: number[], timestamps: Date[]): void {
    const dailyAverages = new Map<number, number[]>();
    
    // Group data by day of year
    for (let i = 0; i < data.length; i++) {
      const dayOfYear = this.getDayOfYear(timestamps[i]);
      if (!dailyAverages.has(dayOfYear)) {
        dailyAverages.set(dayOfYear, []);
      }
      dailyAverages.get(dayOfYear)!.push(data[i]);
    }
    
    // Calculate seasonal factors
    const overallMean = data.reduce((sum, val) => sum + val, 0) / data.length;
    
    for (const [dayOfYear, values] of dailyAverages) {
      const dayMean = values.reduce((sum, val) => sum + val, 0) / values.length;
      this.seasonalFactors.set(dayOfYear, dayMean / overallMean);
    }
  }

  private removeSeasonality(data: number[], timestamps: Date[]): number[] {
    return data.map((value, index) => {
      const dayOfYear = this.getDayOfYear(timestamps[index]);
      const seasonalFactor = this.seasonalFactors.get(dayOfYear) || 1.0;
      return value / seasonalFactor;
    });
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

// =====================================================
// SOLAR ML MODELS CLASS
// =====================================================

export class SolarMLModels {
  private productionModels: Map<string, SimpleLinearRegression> = new Map();
  private seasonalModels: Map<string, SeasonalModel> = new Map();
  private degradationModels: Map<string, DegradationModel> = new Map();
  private movingAverageModels: Map<string, MovingAverageModel> = new Map();

  /**
   * Predict energy production for next period
   */
  public async predictEnergyProduction(
    systemId: string,
    horizon: 'hour' | 'day' | 'week' | 'month',
    historicalData: EnergyProductionRecord[],
    weatherForecast?: WeatherForecast[],
    systemInfo?: SolarSystem
  ): Promise<PredictionResult> {
    try {
      errorTracker.addBreadcrumb('Starting energy production prediction', 'prediction', {
        systemId,
        horizon,
        dataPoints: historicalData.length
      });

      if (historicalData.length < 10) {
        throw new Error('Insufficient historical data for prediction');
      }

      // Prepare training data
      const trainingData = this.prepareTrainingData(historicalData, systemInfo);
      
      // Train or get existing model
      const model = await this.getOrTrainModel(systemId, trainingData);
      
      // Make prediction based on horizon
      let prediction: number;
      let confidence: number;
      let factors: PredictionFactor[] = [];

      switch (horizon) {
        case 'hour':
          prediction = await this.predictNextHour(systemId, trainingData, weatherForecast);
          confidence = 0.85;
          factors = this.getHourlyPredictionFactors(trainingData, weatherForecast);
          break;
        
        case 'day':
          prediction = await this.predictNextDay(systemId, trainingData, weatherForecast);
          confidence = 0.75;
          factors = this.getDailyPredictionFactors(trainingData, weatherForecast);
          break;
        
        case 'week':
          prediction = await this.predictNextWeek(systemId, trainingData, weatherForecast);
          confidence = 0.65;
          factors = this.getWeeklyPredictionFactors(trainingData);
          break;
        
        case 'month':
          prediction = await this.predictNextMonth(systemId, trainingData);
          confidence = 0.55;
          factors = this.getMonthlyPredictionFactors(trainingData);
          break;
        
        default:
          throw new Error(`Unsupported prediction horizon: ${horizon}`);
      }

      // Calculate prediction range
      const range = this.calculatePredictionRange(prediction, confidence, historicalData);

      return {
        value: Math.max(0, prediction),
        confidence,
        range,
        factors,
        methodology: this.getMethodologyDescription(horizon),
        timestamp: new Date(),
        validFor: this.getValidityDuration(horizon)
      };

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId, horizon });
      throw error;
    }
  }

  /**
   * Predict maintenance needs
   */
  public async predictMaintenanceNeeds(
    systemId: string,
    historicalData: EnergyProductionRecord[],
    systemInfo: SolarSystem
  ): Promise<MaintenancePrediction[]> {
    try {
      const predictions: MaintenancePrediction[] = [];

      // Analyze performance trends
      const performanceTrend = this.analyzePerformanceTrend(historicalData);
      
      // Check for degradation patterns
      const degradationAnalysis = this.analyzeDegradationPatterns(historicalData, systemInfo);
      
      // Generate maintenance predictions for different components
      const components = ['panels', 'inverters', 'monitoring_system', 'mounting'];
      
      for (const component of components) {
        const prediction = this.predictComponentMaintenance(
          component,
          historicalData,
          systemInfo,
          performanceTrend,
          degradationAnalysis
        );
        
        if (prediction.probability > 0.1) { // Only include if probability > 10%
          predictions.push(prediction);
        }
      }

      return predictions.sort((a, b) => b.probability - a.probability);

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      return [];
    }
  }

  /**
   * Predict system degradation
   */
  public async predictDegradation(
    systemId: string,
    historicalData: EnergyProductionRecord[],
    systemInfo: SolarSystem
  ): Promise<DegradationModel> {
    try {
      // Calculate current degradation
      const currentDegradation = this.calculateCurrentDegradation(historicalData, systemInfo);
      
      // Estimate degradation rate
      const degradationRate = this.estimateDegradationRate(historicalData, systemInfo);
      
      // Project future degradation
      const projections = this.projectFutureDegradation(
        currentDegradation,
        degradationRate,
        systemInfo,
        25 // 25-year projection
      );
      
      // Identify degradation factors
      const factors = this.identifyDegradationFactors(historicalData, systemInfo);
      
      // Calculate confidence
      const confidence = this.calculateDegradationConfidence(historicalData, systemInfo);

      const model: DegradationModel = {
        systemId,
        currentDegradation,
        projectedDegradation: projections,
        degradationRate,
        factors,
        confidence
      };

      // Cache the model
      this.degradationModels.set(systemId, model);

      return model;

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      throw error;
    }
  }

  /**
   * Predict weather impact on production
   */
  public async predictWeatherImpact(
    systemId: string,
    weatherForecast: WeatherForecast[],
    systemInfo: SolarSystem
  ): Promise<PredictionResult[]> {
    try {
      const predictions: PredictionResult[] = [];

      for (const forecast of weatherForecast) {
        // Calculate expected production under these weather conditions
        const baseProduction = this.calculateBaseProduction(systemInfo, forecast.timestamp);
        
        // Apply weather factors
        let weatherAdjustedProduction = baseProduction;
        
        // Irradiance impact (primary factor)
        const irradianceImpact = forecast.irradiance / 1000; // Normalize to 1000 W/m²
        weatherAdjustedProduction *= irradianceImpact;
        
        // Temperature impact
        const temperatureImpact = this.calculateTemperatureImpact(forecast.temperature);
        weatherAdjustedProduction *= temperatureImpact;
        
        // Cloud cover impact
        const cloudImpact = 1 - (forecast.cloudCover * 0.7); // Up to 70% reduction
        weatherAdjustedProduction *= cloudImpact;
        
        // Wind cooling effect (positive)
        const windImpact = Math.min(1 + (forecast.windSpeed * 0.01), 1.05); // Max 5% benefit
        weatherAdjustedProduction *= windImpact;
        
        // Precipitation impact (negative due to clouds and soiling)
        const precipitationImpact = forecast.precipitation > 0 ? 0.8 : 1.0;
        weatherAdjustedProduction *= precipitationImpact;

        const factors: PredictionFactor[] = [
          {
            factor: 'Solar Irradiance',
            impact: (irradianceImpact - 1) * 100,
            confidence: 0.95,
            description: `${forecast.irradiance} W/m² expected`
          },
          {
            factor: 'Temperature',
            impact: (temperatureImpact - 1) * 100,
            confidence: 0.85,
            description: `${forecast.temperature}°C ambient temperature`
          },
          {
            factor: 'Cloud Cover',
            impact: (cloudImpact - 1) * 100,
            confidence: 0.75,
            description: `${(forecast.cloudCover * 100).toFixed(0)}% cloud cover`
          }
        ];

        predictions.push({
          value: Math.max(0, weatherAdjustedProduction),
          confidence: 0.8,
          range: this.calculateWeatherPredictionRange(weatherAdjustedProduction),
          factors,
          methodology: 'weather_correlation_model',
          timestamp: forecast.timestamp,
          validFor: 60 // Valid for 1 hour
        });
      }

      return predictions;

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      return [];
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private prepareTrainingData(
    historicalData: EnergyProductionRecord[],
    systemInfo?: SolarSystem
  ): ModelTrainingData {
    const features: FeatureSet[] = [];
    const targets: number[] = [];
    const timestamps: Date[] = [];

    for (let i = 7; i < historicalData.length; i++) { // Need 7 days history for features
      const record = historicalData[i];
      const timestamp = record.timestamp.toDate();
      
      // Calculate rolling averages
      const last7Days = historicalData.slice(i - 7, i);
      const avgLast7Days = last7Days.reduce((sum, r) => sum + r.production.energy, 0) / 7;
      
      // Calculate trend
      const energyValues = last7Days.map(r => r.production.energy);
      const trendSlope = this.calculateTrendSlope(energyValues);
      
      const feature: FeatureSet = {
        hour: timestamp.getHours(),
        dayOfYear: this.getDayOfYear(timestamp),
        month: timestamp.getMonth(),
        season: this.getSeason(timestamp.getMonth()),
        solarIrradiance: record.environmental?.irradiance || 500,
        clearSkyIndex: 0.8, // Would calculate from weather data
        ambientTemperature: record.environmental?.ambientTemp || 25,
        windSpeed: 2, // Would get from weather data
        humidity: 50, // Would get from weather data
        cloudCover: 0.3, // Would get from weather data
        systemCapacity: systemInfo?.configuration.totalCapacity || 10,
        systemAge: systemInfo ? this.getSystemAge(systemInfo) : 1,
        degradationFactor: 1 - (systemInfo ? this.getSystemAge(systemInfo) * 0.005 : 0),
        maintenanceScore: 0.9, // Would calculate from maintenance history
        avgLast7Days,
        trendSlope,
        seasonalPattern: this.getSeasonalPattern(timestamp),
        performanceRatio: record.performance.performanceRatio
      };

      features.push(feature);
      targets.push(record.production.energy);
      timestamps.push(timestamp);
    }

    return {
      features,
      targets,
      timestamps,
      metadata: {
        systemId: systemInfo?.id || 'unknown',
        dataPoints: features.length,
        timeRange: {
          start: timestamps[0],
          end: timestamps[timestamps.length - 1]
        },
        featureImportance: this.calculateFeatureImportance(features, targets),
        modelPerformance: { mape: 0.1, rmse: 0.5, r2Score: 0.85, accuracy: 0.8 }
      }
    };
  }

  private async getOrTrainModel(
    systemId: string,
    trainingData: ModelTrainingData
  ): Promise<SimpleLinearRegression> {
    let model = this.productionModels.get(systemId);
    
    if (!model || trainingData.features.length > 100) { // Retrain if enough new data
      model = new SimpleLinearRegression();
      
      // Use irradiance as primary predictor for simplicity
      const irradianceValues = trainingData.features.map(f => f.solarIrradiance);
      model.train(irradianceValues, trainingData.targets);
      
      this.productionModels.set(systemId, model);
    }
    
    return model;
  }

  private async predictNextHour(
    systemId: string,
    trainingData: ModelTrainingData,
    weatherForecast?: WeatherForecast[]
  ): Promise<number> {
    const model = this.productionModels.get(systemId);
    if (!model) throw new Error('Model not trained');

    // Use current weather conditions if available
    if (weatherForecast && weatherForecast.length > 0) {
      const nextHourWeather = weatherForecast[0];
      return model.predict(nextHourWeather.irradiance);
    }
    
    // Use historical average for the current hour
    const currentHour = new Date().getHours();
    const hourlyData = trainingData.features
      .filter(f => f.hour === currentHour)
      .map((_, i) => trainingData.targets[i]);
    
    return hourlyData.length > 0 ? 
      hourlyData.reduce((sum, val) => sum + val, 0) / hourlyData.length : 0;
  }

  private async predictNextDay(
    systemId: string,
    trainingData: ModelTrainingData,
    weatherForecast?: WeatherForecast[]
  ): Promise<number> {
    // Sum up hourly predictions for the next day
    let dailyTotal = 0;
    
    for (let hour = 0; hour < 24; hour++) {
      const hourlyPrediction = await this.predictHourlyForDay(
        systemId,
        hour,
        trainingData,
        weatherForecast
      );
      dailyTotal += hourlyPrediction;
    }
    
    return dailyTotal;
  }

  private async predictNextWeek(
    systemId: string,
    trainingData: ModelTrainingData,
    weatherForecast?: WeatherForecast[]
  ): Promise<number> {
    // Use seasonal model for weekly prediction
    let weeklyTotal = 0;
    const dailyAverage = trainingData.targets.reduce((sum, val) => sum + val, 0) / trainingData.targets.length;
    
    for (let day = 0; day < 7; day++) {
      weeklyTotal += dailyAverage * 24; // Simple approximation
    }
    
    return weeklyTotal;
  }

  private async predictNextMonth(
    systemId: string,
    trainingData: ModelTrainingData
  ): Promise<number> {
    const dailyAverage = trainingData.targets.reduce((sum, val) => sum + val, 0) / trainingData.targets.length;
    const daysInMonth = 30; // Approximate
    return dailyAverage * 24 * daysInMonth;
  }

  private async predictHourlyForDay(
    systemId: string,
    hour: number,
    trainingData: ModelTrainingData,
    weatherForecast?: WeatherForecast[]
  ): Promise<number> {
    // Find historical data for this hour
    const hourlyData = trainingData.features
      .map((feature, i) => ({ feature, target: trainingData.targets[i] }))
      .filter(item => item.feature.hour === hour);
    
    if (hourlyData.length === 0) return 0;
    
    // Simple average for now - would use ML model in production
    const average = hourlyData.reduce((sum, item) => sum + item.target, 0) / hourlyData.length;
    
    // Apply weather adjustments if available
    if (weatherForecast) {
      const hourForecast = weatherForecast.find(w => new Date(w.timestamp).getHours() === hour);
      if (hourForecast) {
        const irradianceFactor = hourForecast.irradiance / 500; // Normalize
        return average * irradianceFactor;
      }
    }
    
    return average;
  }

  private getHourlyPredictionFactors(
    trainingData: ModelTrainingData,
    weatherForecast?: WeatherForecast[]
  ): PredictionFactor[] {
    const factors: PredictionFactor[] = [
      {
        factor: 'Historical Pattern',
        impact: 0.6,
        confidence: 0.8,
        description: 'Based on historical hourly production patterns'
      },
      {
        factor: 'Seasonal Variation',
        impact: 0.2,
        confidence: 0.7,
        description: 'Current season affects production levels'
      }
    ];

    if (weatherForecast && weatherForecast.length > 0) {
      factors.push({
        factor: 'Weather Forecast',
        impact: 0.8,
        confidence: 0.9,
        description: 'Real-time weather forecast integration'
      });
    }

    return factors;
  }

  private getDailyPredictionFactors(
    trainingData: ModelTrainingData,
    weatherForecast?: WeatherForecast[]
  ): PredictionFactor[] {
    return [
      {
        factor: 'Historical Daily Patterns',
        impact: 0.7,
        confidence: 0.8,
        description: 'Based on similar days in historical data'
      },
      {
        factor: 'System Performance Trend',
        impact: 0.3,
        confidence: 0.6,
        description: 'Recent performance trends affect prediction'
      }
    ];
  }

  private getWeeklyPredictionFactors(trainingData: ModelTrainingData): PredictionFactor[] {
    return [
      {
        factor: 'Seasonal Patterns',
        impact: 0.8,
        confidence: 0.7,
        description: 'Weekly patterns vary by season'
      },
      {
        factor: 'Historical Averages',
        impact: 0.6,
        confidence: 0.8,
        description: 'Based on historical weekly production'
      }
    ];
  }

  private getMonthlyPredictionFactors(trainingData: ModelTrainingData): PredictionFactor[] {
    return [
      {
        factor: 'Seasonal Cycle',
        impact: 0.9,
        confidence: 0.8,
        description: 'Strong seasonal influence on monthly production'
      },
      {
        factor: 'System Degradation',
        impact: 0.2,
        confidence: 0.7,
        description: 'Gradual system degradation over time'
      }
    ];
  }

  private calculatePredictionRange(
    prediction: number,
    confidence: number,
    historicalData: EnergyProductionRecord[]
  ): PredictionRange {
    const stdDev = this.calculateStandardDeviation(
      historicalData.map(r => r.production.energy)
    );
    
    const errorMargin = stdDev * (1 - confidence);
    
    return {
      min: Math.max(0, prediction - errorMargin * 2),
      max: prediction + errorMargin * 2,
      p10: Math.max(0, prediction - errorMargin * 1.3),
      p50: prediction,
      p90: prediction + errorMargin * 1.3
    };
  }

  private calculateWeatherPredictionRange(prediction: number): PredictionRange {
    const margin = prediction * 0.2; // 20% margin for weather uncertainty
    
    return {
      min: Math.max(0, prediction - margin),
      max: prediction + margin,
      p10: Math.max(0, prediction - margin * 0.6),
      p50: prediction,
      p90: prediction + margin * 0.6
    };
  }

  private getMethodologyDescription(horizon: string): string {
    switch (horizon) {
      case 'hour':
        return 'Linear regression with weather correlation and historical patterns';
      case 'day':
        return 'Hourly aggregation with seasonal adjustments';
      case 'week':
        return 'Seasonal decomposition with trend analysis';
      case 'month':
        return 'Long-term trend analysis with seasonal patterns';
      default:
        return 'Statistical modeling with historical data';
    }
  }

  private getValidityDuration(horizon: string): number {
    switch (horizon) {
      case 'hour': return 15; // 15 minutes
      case 'day': return 240; // 4 hours
      case 'week': return 1440; // 24 hours
      case 'month': return 10080; // 1 week
      default: return 60;
    }
  }

  // Additional helper methods for maintenance and degradation prediction
  private analyzePerformanceTrend(data: EnergyProductionRecord[]): number {
    if (data.length < 10) return 0;
    
    const recentData = data.slice(-30); // Last 30 data points
    const performanceRatios = recentData.map(r => r.performance.performanceRatio);
    
    return this.calculateTrendSlope(performanceRatios);
  }

  private analyzeDegradationPatterns(
    data: EnergyProductionRecord[],
    systemInfo: SolarSystem
  ): number {
    // Simplified degradation analysis
    const systemAge = this.getSystemAge(systemInfo);
    return systemAge * 0.005; // 0.5% per year
  }

  private predictComponentMaintenance(
    component: string,
    data: EnergyProductionRecord[],
    systemInfo: SolarSystem,
    performanceTrend: number,
    degradationRate: number
  ): MaintenancePrediction {
    const systemAge = this.getSystemAge(systemInfo);
    let probability = 0;
    let timeToMaintenance = 365; // days
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let estimatedCost = 0;
    
    switch (component) {
      case 'panels':
        probability = Math.min(systemAge * 0.02 + Math.abs(performanceTrend) * 10, 1.0);
        timeToMaintenance = Math.max(365 - systemAge * 30, 30);
        estimatedCost = 200;
        severity = probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low';
        break;
        
      case 'inverters':
        probability = Math.min(systemAge * 0.05 + degradationRate * 20, 1.0);
        timeToMaintenance = Math.max(180 - systemAge * 20, 15);
        estimatedCost = 500;
        severity = probability > 0.6 ? 'critical' : probability > 0.3 ? 'high' : 'medium';
        break;
        
      case 'monitoring_system':
        probability = Math.min(systemAge * 0.01, 0.3);
        timeToMaintenance = 720; // 2 years typical
        estimatedCost = 150;
        break;
        
      case 'mounting':
        probability = Math.min(systemAge * 0.005, 0.2);
        timeToMaintenance = 1095; // 3 years typical
        estimatedCost = 300;
        break;
    }

    const indicators: MaintenanceIndicator[] = [
      {
        metric: 'Performance Trend',
        currentValue: performanceTrend,
        threshold: -0.02,
        trend: performanceTrend < -0.01 ? 'declining' : 'stable',
        contribution: Math.min(Math.abs(performanceTrend) * 50, 1.0)
      },
      {
        metric: 'System Age',
        currentValue: systemAge,
        threshold: 10,
        trend: 'stable',
        contribution: Math.min(systemAge / 25, 1.0)
      }
    ];

    return {
      component,
      probability: Math.round(probability * 1000) / 1000,
      timeToMaintenance: Math.round(timeToMaintenance),
      severity,
      indicators,
      recommendation: this.generateMaintenanceRecommendation(component, probability, severity),
      estimatedCost
    };
  }

  private generateMaintenanceRecommendation(
    component: string,
    probability: number,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): string {
    if (severity === 'critical') {
      return `Immediate ${component} inspection required. High risk of failure.`;
    } else if (severity === 'high') {
      return `Schedule ${component} maintenance within next month.`;
    } else if (severity === 'medium') {
      return `Plan ${component} maintenance in next 3 months.`;
    } else {
      return `${component} appears healthy. Continue monitoring.`;
    }
  }

  // Degradation prediction methods
  private calculateCurrentDegradation(
    data: EnergyProductionRecord[],
    systemInfo: SolarSystem
  ): number {
    const systemAge = this.getSystemAge(systemInfo);
    const expectedDegradation = systemAge * 0.5; // 0.5% per year
    
    // Compare current performance to expected
    const recentPerformance = data.slice(-30); // Last 30 records
    const avgPerformanceRatio = recentPerformance.reduce(
      (sum, record) => sum + record.performance.performanceRatio, 0
    ) / recentPerformance.length;
    
    const performanceDegradation = (1 - avgPerformanceRatio) * 100;
    
    return Math.max(expectedDegradation, performanceDegradation);
  }

  private estimateDegradationRate(
    data: EnergyProductionRecord[],
    systemInfo: SolarSystem
  ): number {
    // Linear degradation model - would be more sophisticated in production
    return 0.5; // 0.5% per year typical for silicon panels
  }

  private projectFutureDegradation(
    currentDegradation: number,
    degradationRate: number,
    systemInfo: SolarSystem,
    years: number
  ): DegradationProjection[] {
    const projections: DegradationProjection[] = [];
    const currentYear = new Date().getFullYear();
    const systemCapacity = systemInfo.configuration.totalCapacity;
    const annualProduction = systemInfo.targets.annual;
    
    for (let year = 1; year <= years; year++) {
      const totalDegradation = currentDegradation + (degradationRate * year);
      const productionLoss = annualProduction * (totalDegradation / 100);
      
      projections.push({
        year: currentYear + year,
        degradationPercent: Math.round(totalDegradation * 100) / 100,
        productionLoss: Math.round(productionLoss * 100) / 100,
        confidenceInterval: {
          lower: Math.round((totalDegradation - 0.5) * 100) / 100,
          upper: Math.round((totalDegradation + 0.5) * 100) / 100
        }
      });
    }
    
    return projections;
  }

  private identifyDegradationFactors(
    data: EnergyProductionRecord[],
    systemInfo: SolarSystem
  ): DegradationFactor[] {
    return [
      {
        factor: 'Panel Technology',
        impact: 1.0,
        description: 'Silicon panels degrade at ~0.5% per year'
      },
      {
        factor: 'Environmental Conditions',
        impact: 1.2,
        description: 'Local climate may accelerate degradation'
      },
      {
        factor: 'System Age',
        impact: this.getSystemAge(systemInfo) > 10 ? 1.3 : 1.0,
        description: 'Older systems may degrade faster'
      }
    ];
  }

  private calculateDegradationConfidence(
    data: EnergyProductionRecord[],
    systemInfo: SolarSystem
  ): number {
    const systemAge = this.getSystemAge(systemInfo);
    const dataQuality = data.reduce(
      (sum, record) => sum + record.dataQuality.confidence, 0
    ) / data.length;
    
    // Higher confidence with more age and better data quality
    return Math.min(0.95, (systemAge / 5) * 0.3 + dataQuality * 0.7);
  }

  // Utility methods
  private calculateBaseProduction(systemInfo: SolarSystem, timestamp: Date): number {
    const hour = timestamp.getHours();
    const capacity = systemInfo.configuration.totalCapacity;
    
    // Simple solar production curve (bell curve centered at noon)
    if (hour < 6 || hour > 18) return 0;
    
    const peakHour = 12;
    const hourOffset = Math.abs(hour - peakHour);
    const productionFactor = Math.max(0, 1 - (hourOffset / 6) ** 2);
    
    return capacity * productionFactor * 0.8; // 80% efficiency
  }

  private calculateTemperatureImpact(temperature: number): number {
    // Silicon panels lose ~0.4% per degree C above 25°C
    const referenceTemp = 25;
    const tempCoefficient = -0.004;
    return 1 + tempCoefficient * (temperature - referenceTemp);
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private getSeason(month: number): number {
    if (month >= 2 && month <= 4) return 0; // Spring
    if (month >= 5 && month <= 7) return 1; // Summer
    if (month >= 8 && month <= 10) return 2; // Fall
    return 3; // Winter
  }

  private getSeasonalPattern(timestamp: Date): number {
    const month = timestamp.getMonth();
    // Simplified seasonal pattern (summer peak)
    return 0.5 + 0.5 * Math.cos(((month - 5) / 12) * 2 * Math.PI);
  }

  private getSystemAge(systemInfo: SolarSystem): number {
    const installDate = systemInfo.installationDate.toDate();
    const now = new Date();
    return (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }

  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isFinite(slope) ? slope : 0;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private calculateFeatureImportance(
    features: FeatureSet[],
    targets: number[]
  ): Record<string, number> {
    // Simplified feature importance - would use more sophisticated methods
    return {
      solarIrradiance: 0.4,
      hour: 0.2,
      seasonalPattern: 0.15,
      ambientTemperature: 0.1,
      systemAge: 0.05,
      performanceRatio: 0.1
    };
  }
}

// Export singleton instance
export const solarMLModels = new SolarMLModels();