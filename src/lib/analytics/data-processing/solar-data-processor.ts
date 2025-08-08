/**
 * Solar Data Processing Service
 * Advanced data processing, validation, and transformation for solar performance analytics
 */

import { Timestamp } from 'firebase/firestore';
import { EnergyProductionRecord, WeatherRecord, SolarSystem } from '../../../types/firestore-schema';
import { errorTracker } from '../../monitoring/error-tracker';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface ProcessedSolarData {
  systemId: string;
  timestamp: Date;
  interval: string;
  production: ProductionMetrics;
  performance: PerformanceMetrics;
  environmental: EnvironmentalMetrics;
  quality: DataQualityScore;
  anomalies: AnomalyDetection[];
  predictions: PredictionMetrics;
}

export interface ProductionMetrics {
  dcPower: number;
  acPower: number;
  energy: number;
  voltage: number;
  current: number;
  frequency: number;
  efficiency: number;
  inverterEfficiency: number;
  systemEfficiency: number;
}

export interface PerformanceMetrics {
  performanceRatio: number;
  specificYield: number;
  capacityFactor: number;
  availabilityFactor: number;
  degradationRate: number;
  temperatureCorrectedPerformance: number;
  irradianceCorrectedPerformance: number;
  expectedVsActual: number;
  benchmarkComparison: number;
}

export interface EnvironmentalMetrics {
  solarIrradiance: number;
  ambientTemperature: number;
  moduleTemperature: number;
  windSpeed: number;
  humidity: number;
  clearSkyIndex: number;
  weatherImpactFactor: number;
  shadingFactor: number;
}

export interface DataQualityScore {
  overall: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  validity: number;
  gaps: GapAnalysis[];
  interpolatedPoints: number;
}

export interface GapAnalysis {
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  type: 'missing' | 'invalid' | 'outlier';
  fillMethod: 'interpolation' | 'prediction' | 'null';
}

export interface AnomalyDetection {
  type: 'performance' | 'equipment' | 'environmental' | 'data';
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  confidence: number;
  affectedComponents: string[];
  suggestedActions: string[];
  detectionMethod: string;
}

export interface PredictionMetrics {
  nextHourProduction: number;
  nextDayProduction: number;
  nextWeekProduction: number;
  maintenanceRecommendation: string;
  performanceTrend: 'improving' | 'stable' | 'declining';
  confidenceLevel: number;
}

export interface ProcessingConfig {
  enableAnomalyDetection: boolean;
  enablePredictions: boolean;
  qualityThresholds: {
    minDataPoints: number;
    maxGapDuration: number; // minutes
    minConfidence: number;
    performanceTolerances: {
      efficiency: { min: number; max: number };
      performanceRatio: { min: number; max: number };
      temperature: { min: number; max: number };
    };
  };
  aggregationRules: AggregationConfig[];
}

export interface AggregationConfig {
  interval: '15min' | '1hour' | '1day' | '1week' | '1month';
  method: 'average' | 'sum' | 'min' | 'max' | 'weighted_average';
  fields: string[];
  enabled: boolean;
}

export interface ProcessingResult {
  success: boolean;
  recordsProcessed: number;
  recordsEnriched: number;
  anomaliesDetected: number;
  qualityScore: number;
  processingTime: number;
  errors: string[];
  warnings: string[];
}

// =====================================================
// SOLAR DATA PROCESSOR CLASS
// =====================================================

export class SolarDataProcessor {
  private config: ProcessingConfig;
  private systemCache: Map<string, SolarSystem> = new Map();
  private weatherCache: Map<string, WeatherRecord[]> = new Map();
  private historicalBaselines: Map<string, any> = new Map();

  constructor(config?: Partial<ProcessingConfig>) {
    this.config = {
      enableAnomalyDetection: true,
      enablePredictions: true,
      qualityThresholds: {
        minDataPoints: 10,
        maxGapDuration: 30,
        minConfidence: 0.8,
        performanceTolerances: {
          efficiency: { min: 0.12, max: 0.25 },
          performanceRatio: { min: 0.6, max: 1.2 },
          temperature: { min: -20, max: 80 }
        }
      },
      aggregationRules: this.getDefaultAggregationRules(),
      ...config
    };
  }

  /**
   * Process raw solar production data with advanced analytics
   */
  public async processProductionData(
    records: EnergyProductionRecord[],
    systemInfo: SolarSystem,
    weatherData?: WeatherRecord[]
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsEnriched = 0;
    let anomaliesDetected = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      errorTracker.addBreadcrumb('Starting solar data processing', 'processing', {
        systemId: systemInfo.id,
        recordCount: records.length,
        hasWeatherData: !!weatherData
      });

      // Cache system info and weather data
      this.systemCache.set(systemInfo.id, systemInfo);
      if (weatherData && weatherData.length > 0) {
        this.weatherCache.set(systemInfo.id, weatherData);
      }

      // Sort records by timestamp
      const sortedRecords = records.sort((a, b) => 
        a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime()
      );

      // Process each record with enrichment
      const processedRecords: ProcessedSolarData[] = [];
      
      for (const record of sortedRecords) {
        try {
          const processedData = await this.processRecord(record, systemInfo, weatherData);
          processedRecords.push(processedData);
          recordsProcessed++;
          recordsEnriched++;

          // Count anomalies
          anomaliesDetected += processedData.anomalies.length;

        } catch (error) {
          recordsProcessed++;
          errors.push(`Record processing failed: ${(error as Error).message}`);
        }
      }

      // Perform batch operations
      await this.performBatchAnalysis(processedRecords, systemInfo);
      
      // Calculate overall quality score
      const qualityScore = this.calculateOverallQuality(processedRecords);

      const processingTime = Date.now() - startTime;

      return {
        success: errors.length === 0,
        recordsProcessed,
        recordsEnriched,
        anomaliesDetected,
        qualityScore,
        processingTime,
        errors,
        warnings
      };

    } catch (error) {
      errorTracker.captureException(error as Error, {
        systemId: systemInfo.id,
        recordCount: records.length
      });

      return {
        success: false,
        recordsProcessed,
        recordsEnriched,
        anomaliesDetected,
        qualityScore: 0,
        processingTime: Date.now() - startTime,
        errors: [...errors, (error as Error).message],
        warnings
      };
    }
  }

  /**
   * Process individual production record with enrichment
   */
  private async processRecord(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem,
    weatherData?: WeatherRecord[]
  ): Promise<ProcessedSolarData> {
    
    // Extract basic production metrics
    const production = this.extractProductionMetrics(record);
    
    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(record, systemInfo);
    
    // Enrich with environmental data
    const environmental = this.enrichWithEnvironmentalData(record, weatherData);
    
    // Assess data quality
    const quality = this.assessDataQuality(record, systemInfo);
    
    // Detect anomalies
    const anomalies = this.config.enableAnomalyDetection 
      ? this.detectAnomalies(record, systemInfo, environmental)
      : [];
    
    // Generate predictions
    const predictions = this.config.enablePredictions
      ? this.generatePredictions(record, systemInfo, weatherData)
      : this.getDefaultPredictions();

    return {
      systemId: record.systemId,
      timestamp: record.timestamp.toDate(),
      interval: record.interval,
      production,
      performance,
      environmental,
      quality,
      anomalies,
      predictions
    };
  }

  /**
   * Extract and calculate production metrics
   */
  private extractProductionMetrics(record: EnergyProductionRecord): ProductionMetrics {
    const production = record.production;
    
    // Calculate efficiencies
    const efficiency = production.dcPower > 0 ? (production.acPower / production.dcPower) : 0;
    const inverterEfficiency = production.dcPower > 0 ? (production.acPower / production.dcPower) * 0.98 : 0;
    const systemEfficiency = efficiency * 0.95; // Account for system losses

    return {
      dcPower: production.dcPower,
      acPower: production.acPower,
      energy: production.energy,
      voltage: production.voltage,
      current: production.current,
      frequency: production.frequency,
      efficiency: Math.round(efficiency * 10000) / 100, // Percentage with 2 decimals
      inverterEfficiency: Math.round(inverterEfficiency * 10000) / 100,
      systemEfficiency: Math.round(systemEfficiency * 10000) / 100
    };
  }

  /**
   * Calculate advanced performance metrics
   */
  private calculatePerformanceMetrics(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem
  ): PerformanceMetrics {
    const production = record.production;
    const systemCapacity = systemInfo.configuration.totalCapacity; // kW
    const performance = record.performance;

    // Performance Ratio (PR) - actual vs theoretical energy yield
    const performanceRatio = performance.performanceRatio;

    // Specific Yield - energy per installed kW
    const specificYield = systemCapacity > 0 ? (production.energy / systemCapacity) : 0;

    // Capacity Factor - actual vs nameplate capacity
    const capacityFactor = systemCapacity > 0 ? (production.acPower / systemCapacity) : 0;

    // Availability Factor (assume 100% if system is online)
    const availabilityFactor = record.status.operationalStatus === 'normal' ? 1.0 : 0.8;

    // Simple degradation estimate (0.5% per year)
    const systemAge = this.calculateSystemAge(systemInfo);
    const degradationRate = systemAge * 0.005;

    // Temperature corrected performance
    const tempCorrectedPerf = this.calculateTemperatureCorrectedPerformance(
      record, systemInfo
    );

    // Irradiance corrected performance
    const irradianceCorrectedPerf = this.calculateIrradianceCorrectedPerformance(
      record, systemInfo
    );

    // Expected vs Actual comparison
    const expectedProduction = this.calculateExpectedProduction(systemInfo, record);
    const expectedVsActual = expectedProduction > 0 ? 
      (production.energy / expectedProduction) : 1.0;

    // Benchmark comparison (compared to similar systems)
    const benchmarkComparison = this.getBenchmarkComparison(record, systemInfo);

    return {
      performanceRatio: Math.round(performanceRatio * 1000) / 1000,
      specificYield: Math.round(specificYield * 1000) / 1000,
      capacityFactor: Math.round(capacityFactor * 1000) / 1000,
      availabilityFactor,
      degradationRate: Math.round(degradationRate * 1000) / 1000,
      temperatureCorrectedPerformance: tempCorrectedPerf,
      irradianceCorrectedPerformance: irradianceCorrectedPerf,
      expectedVsActual: Math.round(expectedVsActual * 1000) / 1000,
      benchmarkComparison
    };
  }

  /**
   * Enrich data with environmental metrics
   */
  private enrichWithEnvironmentalData(
    record: EnergyProductionRecord,
    weatherData?: WeatherRecord[]
  ): EnvironmentalMetrics {
    const environmental = record.environmental;
    
    // Find matching weather record
    const matchingWeather = this.findMatchingWeatherData(
      record.timestamp.toDate(), 
      weatherData || []
    );

    const solarIrradiance = matchingWeather?.irradiance.ghi || environmental?.irradiance || 0;
    const ambientTemp = matchingWeather?.weather.temperature || environmental?.ambientTemp || 25;
    const moduleTemp = environmental?.moduleTemp || (ambientTemp + 25); // Estimate if not available
    const windSpeed = matchingWeather?.weather.windSpeed || 2;
    const humidity = matchingWeather?.weather.humidity || 50;
    
    // Clear sky index
    const clearSkyIndex = matchingWeather ? 
      (solarIrradiance / Math.max(matchingWeather.irradiance.clearSkyGHI, 1)) : 1;

    // Weather impact factor
    const weatherImpactFactor = this.calculateWeatherImpact(
      solarIrradiance, ambientTemp, windSpeed, humidity
    );

    // Shading factor (simplified)
    const shadingFactor = 0.95; // Assume 5% shading losses

    return {
      solarIrradiance: Math.round(solarIrradiance * 10) / 10,
      ambientTemperature: Math.round(ambientTemp * 10) / 10,
      moduleTemperature: Math.round(moduleTemp * 10) / 10,
      windSpeed: Math.round(windSpeed * 10) / 10,
      humidity: Math.round(humidity * 10) / 10,
      clearSkyIndex: Math.round(clearSkyIndex * 1000) / 1000,
      weatherImpactFactor: Math.round(weatherImpactFactor * 1000) / 1000,
      shadingFactor
    };
  }

  /**
   * Assess data quality with comprehensive scoring
   */
  private assessDataQuality(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem
  ): DataQualityScore {
    const dataQuality = record.dataQuality;
    
    // Completeness score
    const requiredFields = ['dcPower', 'acPower', 'energy', 'voltage', 'current'];
    const completeness = this.calculateCompleteness(record, requiredFields);

    // Accuracy score based on physical constraints
    const accuracy = this.calculateAccuracy(record, systemInfo);

    // Consistency score
    const consistency = this.calculateConsistency(record);

    // Timeliness score
    const timeliness = this.calculateTimeliness(record);

    // Validity score
    const validity = this.calculateValidity(record, systemInfo);

    // Overall quality score (weighted average)
    const overall = (completeness * 0.25) + (accuracy * 0.25) + 
                   (consistency * 0.2) + (timeliness * 0.15) + (validity * 0.15);

    return {
      overall: Math.round(overall * 1000) / 1000,
      completeness: Math.round(completeness * 1000) / 1000,
      accuracy: Math.round(accuracy * 1000) / 1000,
      consistency: Math.round(consistency * 1000) / 1000,
      timeliness: Math.round(timeliness * 1000) / 1000,
      validity: Math.round(validity * 1000) / 1000,
      gaps: [], // Would be populated by gap analysis
      interpolatedPoints: dataQuality.interpolated ? 1 : 0
    };
  }

  /**
   * Detect anomalies in solar performance data
   */
  private detectAnomalies(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem,
    environmental: EnvironmentalMetrics
  ): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    // Performance anomalies
    if (record.performance.performanceRatio < 0.6) {
      anomalies.push({
        type: 'performance',
        severity: 'warning',
        description: `Low performance ratio: ${record.performance.performanceRatio}`,
        confidence: 0.85,
        affectedComponents: ['system'],
        suggestedActions: ['Check for shading', 'Inspect panels', 'Verify inverter operation'],
        detectionMethod: 'threshold_analysis'
      });
    }

    // Equipment anomalies
    if (record.production.dcPower > 0 && record.production.acPower === 0) {
      anomalies.push({
        type: 'equipment',
        severity: 'error',
        description: 'Inverter failure detected - DC power present but no AC output',
        confidence: 0.95,
        affectedComponents: ['inverter'],
        suggestedActions: ['Check inverter status', 'Verify AC connections', 'Contact technician'],
        detectionMethod: 'logic_analysis'
      });
    }

    // Environmental anomalies
    if (environmental.solarIrradiance > 1200) {
      anomalies.push({
        type: 'environmental',
        severity: 'info',
        description: `High irradiance detected: ${environmental.solarIrradiance} W/m²`,
        confidence: 0.7,
        affectedComponents: ['sensors'],
        suggestedActions: ['Verify sensor calibration'],
        detectionMethod: 'threshold_analysis'
      });
    }

    // Data anomalies
    if (record.dataQuality.confidence < this.config.qualityThresholds.minConfidence) {
      anomalies.push({
        type: 'data',
        severity: 'warning',
        description: `Low data quality confidence: ${record.dataQuality.confidence}`,
        confidence: 0.9,
        affectedComponents: ['monitoring_system'],
        suggestedActions: ['Check communication links', 'Verify sensor connections'],
        detectionMethod: 'quality_analysis'
      });
    }

    return anomalies;
  }

  /**
   * Generate predictions for system performance
   */
  private generatePredictions(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem,
    weatherData?: WeatherRecord[]
  ): PredictionMetrics {
    // Simple prediction model - in production, this would use ML models
    const currentProduction = record.production.acPower;
    const historicalAverage = this.getHistoricalAverage(systemInfo.id);
    
    // Next hour prediction based on current conditions
    const nextHourProduction = currentProduction * 0.95; // Slight decline assumption

    // Next day prediction
    const nextDayProduction = historicalAverage * 24 * 0.85; // Daily estimate

    // Next week prediction
    const nextWeekProduction = nextDayProduction * 7 * 0.9;

    // Maintenance recommendation
    const maintenanceRecommendation = this.generateMaintenanceRecommendation(record, systemInfo);

    // Performance trend analysis
    const performanceTrend = this.analyzePerformanceTrend(record, systemInfo);

    return {
      nextHourProduction: Math.round(nextHourProduction * 100) / 100,
      nextDayProduction: Math.round(nextDayProduction * 100) / 100,
      nextWeekProduction: Math.round(nextWeekProduction * 100) / 100,
      maintenanceRecommendation,
      performanceTrend,
      confidenceLevel: 0.75
    };
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private calculateSystemAge(systemInfo: SolarSystem): number {
    const installDate = systemInfo.installationDate.toDate();
    const now = new Date();
    return (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }

  private calculateTemperatureCorrectedPerformance(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem
  ): number {
    // Temperature coefficient for typical silicon panels (-0.4%/°C)
    const tempCoeff = -0.004;
    const referenceTemp = 25; // °C
    const actualTemp = record.environmental?.moduleTemp || 25;
    
    const tempCorrection = 1 + (tempCoeff * (actualTemp - referenceTemp));
    return Math.round(tempCorrection * 1000) / 1000;
  }

  private calculateIrradianceCorrectedPerformance(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem
  ): number {
    const actualIrradiance = record.environmental?.irradiance || 1000;
    const standardIrradiance = 1000; // W/m²
    
    const irradianceRatio = actualIrradiance / standardIrradiance;
    return Math.round(irradianceRatio * 1000) / 1000;
  }

  private calculateExpectedProduction(
    systemInfo: SolarSystem,
    record: EnergyProductionRecord
  ): number {
    // Simplified expected production calculation
    const systemCapacity = systemInfo.configuration.totalCapacity;
    const irradiance = record.environmental?.irradiance || 1000;
    const expectedPower = systemCapacity * (irradiance / 1000) * 0.8; // Derating factor
    
    // Convert to energy for the interval
    const intervalHours = this.getIntervalHours(record.interval);
    return expectedPower * intervalHours;
  }

  private getBenchmarkComparison(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem
  ): number {
    // Simplified benchmark - would use real benchmark data in production
    return 0.85; // Assume system performs at 85% of benchmark
  }

  private findMatchingWeatherData(
    timestamp: Date,
    weatherData: WeatherRecord[]
  ): WeatherRecord | undefined {
    // Find weather record closest to the timestamp
    return weatherData.find(weather => {
      const weatherTime = weather.timestamp.toDate().getTime();
      const recordTime = timestamp.getTime();
      const timeDiff = Math.abs(weatherTime - recordTime);
      return timeDiff < (30 * 60 * 1000); // Within 30 minutes
    });
  }

  private calculateWeatherImpact(
    irradiance: number,
    temperature: number,
    windSpeed: number,
    humidity: number
  ): number {
    // Simplified weather impact model
    let impact = 1.0;
    
    // Irradiance impact
    if (irradiance < 200) impact *= 0.7;
    else if (irradiance < 500) impact *= 0.85;
    
    // Temperature impact (performance decreases with high temp)
    if (temperature > 35) impact *= 0.95;
    else if (temperature > 45) impact *= 0.9;
    
    // Wind cooling effect
    if (windSpeed > 3) impact *= 1.02;
    
    return Math.round(impact * 1000) / 1000;
  }

  private calculateCompleteness(record: EnergyProductionRecord, requiredFields: string[]): number {
    let completedFields = 0;
    for (const field of requiredFields) {
      const value = this.getNestedValue(record, `production.${field}`);
      if (value !== null && value !== undefined) {
        completedFields++;
      }
    }
    return completedFields / requiredFields.length;
  }

  private calculateAccuracy(record: EnergyProductionRecord, systemInfo: SolarSystem): number {
    let score = 1.0;
    const production = record.production;
    const thresholds = this.config.qualityThresholds.performanceTolerances;
    
    // Check if values are within reasonable bounds
    if (production.dcPower < 0 || production.dcPower > systemInfo.configuration.totalCapacity * 1.2) {
      score -= 0.3;
    }
    
    if (production.acPower < 0 || production.acPower > production.dcPower) {
      score -= 0.3;
    }
    
    if (production.voltage < 0 || production.voltage > 1000) {
      score -= 0.2;
    }
    
    return Math.max(0, score);
  }

  private calculateConsistency(record: EnergyProductionRecord): number {
    // Check for internal consistency of data
    const production = record.production;
    let score = 1.0;
    
    // Power consistency check
    if (production.dcPower > 0 && production.acPower === 0) {
      score -= 0.5; // Major inconsistency
    }
    
    // Voltage-current relationship check
    if (production.voltage > 0 && production.current > 0) {
      const calculatedPower = production.voltage * production.current / 1000;
      const actualPower = production.dcPower;
      const powerDiff = Math.abs(calculatedPower - actualPower) / Math.max(actualPower, 1);
      if (powerDiff > 0.1) score -= 0.2; // 10% tolerance
    }
    
    return Math.max(0, score);
  }

  private calculateTimeliness(record: EnergyProductionRecord): number {
    // Check how recent the data is
    const now = new Date();
    const recordTime = record.timestamp.toDate();
    const ageMinutes = (now.getTime() - recordTime.getTime()) / (1000 * 60);
    
    if (ageMinutes <= 5) return 1.0;
    if (ageMinutes <= 15) return 0.8;
    if (ageMinutes <= 60) return 0.6;
    if (ageMinutes <= 240) return 0.4; // 4 hours
    return 0.2;
  }

  private calculateValidity(record: EnergyProductionRecord, systemInfo: SolarSystem): number {
    // Validate against system specifications and physical constraints
    let score = 1.0;
    const production = record.production;
    
    // Check against system capacity
    if (production.dcPower > systemInfo.configuration.totalCapacity * 1.1) {
      score -= 0.3;
    }
    
    // Check frequency validity (50-60 Hz typical)
    if (production.frequency < 45 || production.frequency > 65) {
      score -= 0.2;
    }
    
    return Math.max(0, score);
  }

  private getHistoricalAverage(systemId: string): number {
    // Would fetch from historical data - simplified for now
    return 5.0; // kW average
  }

  private generateMaintenanceRecommendation(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem
  ): string {
    const performance = record.performance.performanceRatio;
    const systemAge = this.calculateSystemAge(systemInfo);
    
    if (performance < 0.7) {
      return 'Immediate inspection recommended - Low performance detected';
    } else if (systemAge > 5) {
      return 'Annual maintenance due - System over 5 years old';
    } else if (performance < 0.8) {
      return 'Performance monitoring - Consider panel cleaning';
    }
    
    return 'System performing well - No immediate action required';
  }

  private analyzePerformanceTrend(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem
  ): 'improving' | 'stable' | 'declining' {
    // Simplified trend analysis - would use historical data in production
    const performance = record.performance.performanceRatio;
    
    if (performance > 0.85) return 'stable';
    if (performance < 0.75) return 'declining';
    return 'stable';
  }

  private async performBatchAnalysis(
    processedRecords: ProcessedSolarData[],
    systemInfo: SolarSystem
  ): Promise<void> {
    // Perform any batch-level analysis here
    // Such as trend analysis, comparative analysis, etc.
  }

  private calculateOverallQuality(processedRecords: ProcessedSolarData[]): number {
    if (processedRecords.length === 0) return 0;
    
    const totalQuality = processedRecords.reduce((sum, record) => sum + record.quality.overall, 0);
    return Math.round((totalQuality / processedRecords.length) * 1000) / 1000;
  }

  private getDefaultPredictions(): PredictionMetrics {
    return {
      nextHourProduction: 0,
      nextDayProduction: 0,
      nextWeekProduction: 0,
      maintenanceRecommendation: 'No predictions available',
      performanceTrend: 'stable',
      confidenceLevel: 0
    };
  }

  private getIntervalHours(interval: string): number {
    switch (interval) {
      case '15min': return 0.25;
      case '1hour': return 1;
      case '1day': return 24;
      default: return 1;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getDefaultAggregationRules(): AggregationConfig[] {
    return [
      {
        interval: '1hour',
        method: 'average',
        fields: ['production.dcPower', 'production.acPower', 'performance.performanceRatio'],
        enabled: true
      },
      {
        interval: '1day',
        method: 'sum',
        fields: ['production.energy'],
        enabled: true
      }
    ];
  }
}

// Export singleton instance
export const solarDataProcessor = new SolarDataProcessor();