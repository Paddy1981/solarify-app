/**
 * Advanced Anomaly Detection Service for Solar Systems
 * Uses multiple detection algorithms to identify performance issues
 */

import { EnergyProductionRecord, SolarSystem, WeatherRecord } from '../../../types/firestore-schema';
import { errorTracker } from '../../monitoring/error-tracker';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface AnomalyResult {
  isAnomaly: boolean;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  confidence: number;
  description: string;
  affectedComponents: string[];
  possibleCauses: string[];
  recommendedActions: string[];
  detectionMethod: DetectionMethod;
  metrics: AnomalyMetrics;
}

export type AnomalyType = 
  | 'performance_drop'
  | 'equipment_fault' 
  | 'environmental_anomaly'
  | 'data_anomaly'
  | 'degradation_anomaly'
  | 'shading_anomaly'
  | 'inverter_anomaly'
  | 'communication_anomaly';

export type AnomalySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type DetectionMethod = 
  | 'statistical_outlier'
  | 'threshold_analysis' 
  | 'trend_analysis'
  | 'pattern_recognition'
  | 'comparative_analysis'
  | 'physics_based'
  | 'machine_learning';

export interface AnomalyMetrics {
  deviationFromNormal: number;
  statisticalSignificance: number;
  impactScore: number;
  persistenceDuration: number; // minutes
  affectedCapacity: number; // percentage
}

export interface DetectionConfig {
  enabledMethods: DetectionMethod[];
  thresholds: ThresholdConfig;
  historicalWindow: number; // days for baseline calculation
  minimumDataPoints: number;
  suppressDuplicates: boolean;
  confidenceThreshold: number;
}

export interface ThresholdConfig {
  performanceRatio: { min: number; max: number };
  powerDeviation: number; // percentage
  efficiencyDrop: number; // percentage
  temperatureAnomaly: number; // degrees C
  irradianceDeviation: number; // percentage
  voltageRange: { min: number; max: number };
  frequencyRange: { min: number; max: number };
}

export interface HistoricalBaseline {
  systemId: string;
  period: 'hourly' | 'daily' | 'monthly';
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    percentiles: {
      p25: number;
      p75: number;
      p95: number;
      p99: number;
    };
  };
  seasonalPatterns: SeasonalPattern[];
  lastUpdated: Date;
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  hourlyProfiles: number[]; // 24 values for each hour
  expectedPerformance: number;
}

// =====================================================
// ADVANCED ANOMALY DETECTOR
// =====================================================

export class AdvancedAnomalyDetector {
  private config: DetectionConfig;
  private baselines: Map<string, HistoricalBaseline> = new Map();
  private recentAnomalies: Map<string, AnomalyResult[]> = new Map();

  constructor(config?: Partial<DetectionConfig>) {
    this.config = {
      enabledMethods: [
        'statistical_outlier',
        'threshold_analysis',
        'trend_analysis',
        'comparative_analysis',
        'physics_based'
      ],
      thresholds: this.getDefaultThresholds(),
      historicalWindow: 30,
      minimumDataPoints: 100,
      suppressDuplicates: true,
      confidenceThreshold: 0.7,
      ...config
    };
  }

  /**
   * Detect anomalies in solar production data
   */
  public async detectAnomalies(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem,
    historicalData?: EnergyProductionRecord[],
    weatherData?: WeatherRecord[]
  ): Promise<AnomalyResult[]> {
    try {
      const anomalies: AnomalyResult[] = [];

      errorTracker.addBreadcrumb('Starting anomaly detection', 'anomaly_detection', {
        systemId: systemInfo.id,
        enabledMethods: this.config.enabledMethods.length
      });

      // Get or create baseline for this system
      await this.ensureBaseline(systemInfo.id, historicalData);

      // Apply each enabled detection method
      for (const method of this.config.enabledMethods) {
        const methodAnomalies = await this.applyDetectionMethod(
          method, record, systemInfo, historicalData, weatherData
        );
        anomalies.push(...methodAnomalies);
      }

      // Filter and deduplicate anomalies
      const filteredAnomalies = this.filterAnomalies(anomalies);

      // Cache recent anomalies for suppression
      if (this.config.suppressDuplicates) {
        this.cacheAnomalies(systemInfo.id, filteredAnomalies);
      }

      return filteredAnomalies;

    } catch (error) {
      errorTracker.captureException(error as Error, {
        systemId: systemInfo.id,
        recordTimestamp: record.timestamp.toDate().toISOString()
      });
      return [];
    }
  }

  /**
   * Apply specific detection method
   */
  private async applyDetectionMethod(
    method: DetectionMethod,
    record: EnergyProductionRecord,
    systemInfo: SolarSystem,
    historicalData?: EnergyProductionRecord[],
    weatherData?: WeatherRecord[]
  ): Promise<AnomalyResult[]> {
    
    switch (method) {
      case 'statistical_outlier':
        return this.detectStatisticalOutliers(record, systemInfo, historicalData);
      
      case 'threshold_analysis':
        return this.detectThresholdViolations(record, systemInfo);
      
      case 'trend_analysis':
        return this.detectTrendAnomalies(record, systemInfo, historicalData);
      
      case 'comparative_analysis':
        return this.detectComparativeAnomalies(record, systemInfo, weatherData);
      
      case 'physics_based':
        return this.detectPhysicsBasedAnomalies(record, systemInfo, weatherData);
      
      case 'pattern_recognition':
        return this.detectPatternAnomalies(record, systemInfo, historicalData);
      
      default:
        return [];
    }
  }

  /**
   * Detect statistical outliers using Z-score and IQR methods
   */
  private detectStatisticalOutliers(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem,
    historicalData?: EnergyProductionRecord[]
  ): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const baseline = this.baselines.get(systemInfo.id);
    
    if (!baseline || !historicalData || historicalData.length < this.config.minimumDataPoints) {
      return anomalies;
    }

    // Z-score analysis for key metrics
    const metrics = [
      { key: 'production.acPower', name: 'AC Power' },
      { key: 'performance.performanceRatio', name: 'Performance Ratio' },
      { key: 'performance.efficiency', name: 'System Efficiency' }
    ];

    for (const metric of metrics) {
      const currentValue = this.getNestedValue(record, metric.key);
      if (currentValue === null || currentValue === undefined) continue;

      const zScore = this.calculateZScore(currentValue, baseline.statistics);
      const isOutlier = Math.abs(zScore) > 2.5; // 99% confidence interval

      if (isOutlier) {
        const severity = this.determineSeverity(Math.abs(zScore), 'statistical');
        
        anomalies.push({
          isAnomaly: true,
          anomalyType: 'performance_drop',
          severity,
          confidence: Math.min(Math.abs(zScore) / 3, 1.0),
          description: `${metric.name} is a statistical outlier (Z-score: ${zScore.toFixed(2)})`,
          affectedComponents: ['system'],
          possibleCauses: [
            'Equipment degradation',
            'Shading or soiling',
            'Environmental conditions',
            'Sensor malfunction'
          ],
          recommendedActions: [
            'Inspect system components',
            'Check for shading or debris',
            'Verify sensor calibration'
          ],
          detectionMethod: 'statistical_outlier',
          metrics: {
            deviationFromNormal: Math.abs(zScore),
            statisticalSignificance: this.calculatePValue(zScore),
            impactScore: this.calculateImpactScore(currentValue, baseline.statistics.mean),
            persistenceDuration: 0, // Would track over time
            affectedCapacity: 100
          }
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect threshold violations
   */
  private detectThresholdViolations(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem
  ): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const thresholds = this.config.thresholds;
    const production = record.production;
    const performance = record.performance;

    // Performance ratio threshold
    if (performance.performanceRatio < thresholds.performanceRatio.min) {
      anomalies.push({
        isAnomaly: true,
        anomalyType: 'performance_drop',
        severity: this.determineSeverity(
          (thresholds.performanceRatio.min - performance.performanceRatio) / thresholds.performanceRatio.min,
          'threshold'
        ),
        confidence: 0.9,
        description: `Performance ratio below minimum threshold: ${performance.performanceRatio.toFixed(3)}`,
        affectedComponents: ['system'],
        possibleCauses: ['System degradation', 'Shading', 'Soiling', 'Equipment fault'],
        recommendedActions: ['Inspect panels', 'Check for shading', 'Clean panels if needed'],
        detectionMethod: 'threshold_analysis',
        metrics: {
          deviationFromNormal: thresholds.performanceRatio.min - performance.performanceRatio,
          statisticalSignificance: 1.0,
          impactScore: 0.8,
          persistenceDuration: 0,
          affectedCapacity: 100
        }
      });
    }

    // Voltage range check
    if (production.voltage < thresholds.voltageRange.min || 
        production.voltage > thresholds.voltageRange.max) {
      anomalies.push({
        isAnomaly: true,
        anomalyType: 'equipment_fault',
        severity: 'high',
        confidence: 0.95,
        description: `Voltage outside normal range: ${production.voltage}V`,
        affectedComponents: ['inverter', 'electrical_system'],
        possibleCauses: ['Inverter malfunction', 'Electrical connection issues', 'Grid issues'],
        recommendedActions: ['Check inverter status', 'Inspect electrical connections', 'Contact electrician'],
        detectionMethod: 'threshold_analysis',
        metrics: {
          deviationFromNormal: Math.max(
            Math.abs(production.voltage - thresholds.voltageRange.min),
            Math.abs(production.voltage - thresholds.voltageRange.max)
          ),
          statisticalSignificance: 1.0,
          impactScore: 0.9,
          persistenceDuration: 0,
          affectedCapacity: 100
        }
      });
    }

    // Frequency range check
    if (production.frequency < thresholds.frequencyRange.min || 
        production.frequency > thresholds.frequencyRange.max) {
      anomalies.push({
        isAnomaly: true,
        anomalyType: 'equipment_fault',
        severity: 'critical',
        confidence: 0.98,
        description: `Frequency outside acceptable range: ${production.frequency}Hz`,
        affectedComponents: ['inverter', 'grid_connection'],
        possibleCauses: ['Grid instability', 'Inverter malfunction', 'Anti-islanding activation'],
        recommendedActions: ['Contact utility company', 'Check inverter logs', 'Immediate inspection required'],
        detectionMethod: 'threshold_analysis',
        metrics: {
          deviationFromNormal: Math.max(
            Math.abs(production.frequency - thresholds.frequencyRange.min),
            Math.abs(production.frequency - thresholds.frequencyRange.max)
          ),
          statisticalSignificance: 1.0,
          impactScore: 1.0,
          persistenceDuration: 0,
          affectedCapacity: 100
        }
      });
    }

    return anomalies;
  }

  /**
   * Detect trend anomalies over time
   */
  private detectTrendAnomalies(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem,
    historicalData?: EnergyProductionRecord[]
  ): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    
    if (!historicalData || historicalData.length < 10) {
      return anomalies;
    }

    // Get recent data for trend analysis
    const recentData = historicalData.slice(-10);
    const performanceRatios = recentData.map(r => r.performance.performanceRatio);
    
    // Calculate trend slope
    const trend = this.calculateTrend(performanceRatios);
    
    // Significant declining trend
    if (trend.slope < -0.01) { // More than 1% decline per data point
      anomalies.push({
        isAnomaly: true,
        anomalyType: 'degradation_anomaly',
        severity: this.determineSeverity(Math.abs(trend.slope) * 100, 'trend'),
        confidence: Math.min(trend.rSquared, 0.95),
        description: `Declining performance trend detected: ${(trend.slope * 100).toFixed(2)}% per measurement`,
        affectedComponents: ['system'],
        possibleCauses: ['Panel degradation', 'Accumulating soiling', 'Component aging'],
        recommendedActions: ['Schedule maintenance inspection', 'Check for soiling', 'Monitor closely'],
        detectionMethod: 'trend_analysis',
        metrics: {
          deviationFromNormal: Math.abs(trend.slope),
          statisticalSignificance: trend.rSquared,
          impactScore: Math.min(Math.abs(trend.slope) * 10, 1.0),
          persistenceDuration: recentData.length * 15, // Assume 15min intervals
          affectedCapacity: 100
        }
      });
    }

    return anomalies;
  }

  /**
   * Detect comparative anomalies using expected vs actual performance
   */
  private detectComparativeAnomalies(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem,
    weatherData?: WeatherRecord[]
  ): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    
    // Calculate expected performance based on weather conditions
    const expectedPerformance = this.calculateExpectedPerformance(
      systemInfo, record, weatherData
    );
    
    if (expectedPerformance === null) return anomalies;
    
    const actualPerformance = record.production.acPower;
    const deviation = (expectedPerformance - actualPerformance) / expectedPerformance;
    
    // Significant underperformance
    if (deviation > 0.2) { // 20% below expected
      anomalies.push({
        isAnomaly: true,
        anomalyType: 'performance_drop',
        severity: this.determineSeverity(deviation, 'comparative'),
        confidence: 0.8,
        description: `System underperforming: ${(deviation * 100).toFixed(1)}% below expected`,
        affectedComponents: ['system'],
        possibleCauses: ['Shading', 'Soiling', 'Equipment issues', 'Weather conditions'],
        recommendedActions: ['Visual inspection', 'Check for obstructions', 'Verify weather data'],
        detectionMethod: 'comparative_analysis',
        metrics: {
          deviationFromNormal: deviation,
          statisticalSignificance: 0.8,
          impactScore: deviation,
          persistenceDuration: 0,
          affectedCapacity: 100
        }
      });
    }

    return anomalies;
  }

  /**
   * Detect physics-based anomalies
   */
  private detectPhysicsBasedAnomalies(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem,
    weatherData?: WeatherRecord[]
  ): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const production = record.production;

    // Physics violation: AC power > DC power
    if (production.acPower > production.dcPower * 1.05) { // 5% tolerance for measurement error
      anomalies.push({
        isAnomaly: true,
        anomalyType: 'data_anomaly',
        severity: 'medium',
        confidence: 0.95,
        description: 'AC power exceeds DC power - physics violation',
        affectedComponents: ['monitoring_system'],
        possibleCauses: ['Measurement error', 'Sensor calibration issue', 'Data corruption'],
        recommendedActions: ['Verify sensor calibration', 'Check monitoring system', 'Validate measurements'],
        detectionMethod: 'physics_based',
        metrics: {
          deviationFromNormal: (production.acPower - production.dcPower) / production.dcPower,
          statisticalSignificance: 1.0,
          impactScore: 0.3,
          persistenceDuration: 0,
          affectedCapacity: 0
        }
      });
    }

    // Impossible efficiency
    if (record.performance.efficiency > 25) { // Theoretical max for silicon
      anomalies.push({
        isAnomaly: true,
        anomalyType: 'data_anomaly',
        severity: 'medium',
        confidence: 0.9,
        description: `Efficiency exceeds physical limits: ${record.performance.efficiency}%`,
        affectedComponents: ['monitoring_system'],
        possibleCauses: ['Calculation error', 'Sensor malfunction', 'Data processing issue'],
        recommendedActions: ['Recalibrate sensors', 'Verify calculations', 'Check data processing'],
        detectionMethod: 'physics_based',
        metrics: {
          deviationFromNormal: record.performance.efficiency - 25,
          statisticalSignificance: 1.0,
          impactScore: 0.4,
          persistenceDuration: 0,
          affectedCapacity: 0
        }
      });
    }

    return anomalies;
  }

  /**
   * Detect pattern anomalies (placeholder for advanced ML models)
   */
  private detectPatternAnomalies(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem,
    historicalData?: EnergyProductionRecord[]
  ): AnomalyResult[] {
    // This would implement ML-based pattern recognition
    // For now, return empty array as placeholder
    return [];
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async ensureBaseline(
    systemId: string, 
    historicalData?: EnergyProductionRecord[]
  ): Promise<void> {
    if (this.baselines.has(systemId)) return;
    
    if (historicalData && historicalData.length >= this.config.minimumDataPoints) {
      const baseline = this.calculateBaseline(systemId, historicalData);
      this.baselines.set(systemId, baseline);
    }
  }

  private calculateBaseline(
    systemId: string, 
    historicalData: EnergyProductionRecord[]
  ): HistoricalBaseline {
    const performanceRatios = historicalData.map(r => r.performance.performanceRatio);
    
    const statistics = {
      mean: this.calculateMean(performanceRatios),
      median: this.calculateMedian(performanceRatios),
      stdDev: this.calculateStandardDeviation(performanceRatios),
      min: Math.min(...performanceRatios),
      max: Math.max(...performanceRatios),
      percentiles: {
        p25: this.calculatePercentile(performanceRatios, 0.25),
        p75: this.calculatePercentile(performanceRatios, 0.75),
        p95: this.calculatePercentile(performanceRatios, 0.95),
        p99: this.calculatePercentile(performanceRatios, 0.99)
      }
    };

    return {
      systemId,
      period: 'daily',
      statistics,
      seasonalPatterns: [], // Would be calculated from longer historical data
      lastUpdated: new Date()
    };
  }

  private calculateZScore(value: number, stats: any): number {
    return (value - stats.mean) / stats.stdDev;
  }

  private calculateTrend(values: number[]): { slope: number; rSquared: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (values[i] - yMean);
      denominator += (x[i] - xMean) ** 2;
    }
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    
    // Calculate R-squared
    const predicted = x.map(xi => yMean + slope * (xi - xMean));
    const ssRes = values.reduce((sum, yi, i) => sum + (yi - predicted[i]) ** 2, 0);
    const ssTot = values.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
    const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    
    return { slope, rSquared };
  }

  private calculateExpectedPerformance(
    systemInfo: SolarSystem,
    record: EnergyProductionRecord,
    weatherData?: WeatherRecord[]
  ): number | null {
    if (!weatherData || weatherData.length === 0) return null;
    
    // Find matching weather data
    const weather = weatherData.find(w => 
      Math.abs(w.timestamp.toDate().getTime() - record.timestamp.toDate().getTime()) < 30 * 60 * 1000
    );
    
    if (!weather) return null;
    
    const irradiance = weather.irradiance.ghi;
    const systemCapacity = systemInfo.configuration.totalCapacity;
    
    // Simplified expected performance calculation
    return systemCapacity * (irradiance / 1000) * 0.8; // 80% system efficiency
  }

  private determineSeverity(deviation: number, context: string): AnomalySeverity {
    switch (context) {
      case 'statistical':
        if (deviation > 3) return 'critical';
        if (deviation > 2.5) return 'high';
        if (deviation > 2) return 'medium';
        if (deviation > 1.5) return 'low';
        return 'info';
      
      case 'threshold':
        if (deviation > 0.3) return 'critical';
        if (deviation > 0.2) return 'high';
        if (deviation > 0.1) return 'medium';
        return 'low';
      
      case 'trend':
        if (deviation > 5) return 'critical';
        if (deviation > 3) return 'high';
        if (deviation > 2) return 'medium';
        return 'low';
      
      case 'comparative':
        if (deviation > 0.4) return 'critical';
        if (deviation > 0.3) return 'high';
        if (deviation > 0.2) return 'medium';
        return 'low';
      
      default:
        return 'medium';
    }
  }

  private calculatePValue(zScore: number): number {
    // Simplified p-value calculation for normal distribution
    const absZ = Math.abs(zScore);
    if (absZ > 3) return 0.001;
    if (absZ > 2.5) return 0.01;
    if (absZ > 2) return 0.05;
    if (absZ > 1.5) return 0.1;
    return 0.2;
  }

  private calculateImpactScore(actual: number, expected: number): number {
    return Math.min(Math.abs(actual - expected) / expected, 1.0);
  }

  private filterAnomalies(anomalies: AnomalyResult[]): AnomalyResult[] {
    return anomalies
      .filter(a => a.confidence >= this.config.confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private cacheAnomalies(systemId: string, anomalies: AnomalyResult[]): void {
    const existing = this.recentAnomalies.get(systemId) || [];
    this.recentAnomalies.set(systemId, [...existing, ...anomalies].slice(-50)); // Keep last 50
  }

  // Statistical helper methods
  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(this.calculateMean(squaredDiffs));
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = percentile * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getDefaultThresholds(): ThresholdConfig {
    return {
      performanceRatio: { min: 0.6, max: 1.2 },
      powerDeviation: 30, // 30%
      efficiencyDrop: 20, // 20%
      temperatureAnomaly: 15, // 15°C
      irradianceDeviation: 50, // 50%
      voltageRange: { min: 100, max: 800 },
      frequencyRange: { min: 49, max: 61 }
    };
  }
}

// Export singleton instance
export const anomalyDetector = new AdvancedAnomalyDetector();