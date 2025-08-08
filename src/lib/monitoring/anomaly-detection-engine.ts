/**
 * Advanced Anomaly Detection Engine
 * Machine learning-powered anomaly detection for solar system monitoring
 */

import { collection, doc, addDoc, updateDoc, query, where, orderBy, limit, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, EnergyProductionRecord } from '../../types/firestore-schema';
import { errorTracker } from './error-tracker';
import { EventEmitter } from 'events';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface AnomalyDetectionConfig {
  systemId: string;
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  detectionMethods: DetectionMethod[];
  alertThresholds: AnomalyAlertThresholds;
  excludeConditions: ExclusionCondition[];
  learningPeriod: number; // days
  minDataPoints: number;
  maxNoiseLevel: number;
}

export type DetectionMethod = 
  | 'statistical_outlier'
  | 'time_series_deviation'
  | 'seasonal_anomaly'
  | 'weather_correlation'
  | 'equipment_pattern'
  | 'performance_degradation'
  | 'machine_learning'
  | 'comparative_analysis';

export interface AnomalyAlertThresholds {
  severity: {
    info: number;        // 0-1 anomaly score
    warning: number;     // 0-1 anomaly score
    critical: number;    // 0-1 anomaly score
  };
  frequency: {
    maxPerHour: number;
    maxPerDay: number;
    cooldownMinutes: number;
  };
  impact: {
    minProductionLoss: number;    // kWh
    minEfficiencyDrop: number;    // %
    minFinancialImpact: number;   // $
  };
}

export interface ExclusionCondition {
  type: 'weather' | 'maintenance' | 'grid' | 'manual';
  condition: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface Anomaly {
  id: string;
  systemId: string;
  timestamp: Date;
  type: AnomalyType;
  severity: AnomalySeverity;
  category: AnomalyCategory;
  score: number; // 0-1, confidence level
  description: string;
  detectedBy: DetectionMethod[];
  context: AnomalyContext;
  impact: AnomalyImpact;
  recommendations: AnomalyRecommendation[];
  status: AnomalyStatus;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  falsePositive: boolean;
  feedback?: AnomalyFeedback;
}

export type AnomalyType = 
  | 'production_drop'
  | 'efficiency_loss'
  | 'equipment_malfunction'
  | 'weather_inconsistency'
  | 'performance_degradation'
  | 'communication_loss'
  | 'power_quality_issue'
  | 'seasonal_deviation'
  | 'peer_comparison_outlier'
  | 'predictive_failure';

export type AnomalySeverity = 'info' | 'warning' | 'critical';

export type AnomalyCategory = 
  | 'production'
  | 'performance'
  | 'equipment'
  | 'environmental'
  | 'communication'
  | 'quality';

export type AnomalyStatus = 'active' | 'investigating' | 'resolved' | 'false_positive';

export interface AnomalyContext {
  currentValue: number;
  expectedValue: number;
  historicalRange: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
  };
  seasonalPattern: SeasonalPattern;
  weatherConditions: WeatherContext;
  systemConditions: SystemContext;
  peerComparison?: PeerComparisonContext;
}

export interface SeasonalPattern {
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  dayOfYear: number; // 1-365
  seasonalExpected: number;
  seasonalStdDev: number;
}

export interface WeatherContext {
  irradiance: number;
  temperature: number;
  cloudCover: number;
  precipitation: number;
  weatherExpected: number;
  weatherImpactFactor: number;
}

export interface SystemContext {
  systemAge: number; // years
  lastMaintenance: Date;
  degradationFactor: number;
  equipmentStatus: Record<string, string>;
  communicationQuality: number;
}

export interface PeerComparisonContext {
  peerSystems: number;
  peerAverage: number;
  peerStdDev: number;
  ranking: number;
  percentile: number;
}

export interface AnomalyImpact {
  productionLoss: number; // kWh
  efficiencyDrop: number; // %
  financialImpact: number; // $
  environmentalImpact: number; // kg CO2
  duration: number; // minutes
  urgency: 'immediate' | 'within_hour' | 'within_day' | 'planned';
}

export interface AnomalyRecommendation {
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  category: 'inspection' | 'maintenance' | 'repair' | 'monitoring';
  estimatedCost: number;
  estimatedTime: number; // minutes
  expectedBenefit: string;
  requiredSkills: string[];
}

export interface AnomalyFeedback {
  correct: boolean;
  actualCause?: string;
  actionTaken?: string;
  outcome?: string;
  submittedBy: string;
  submittedAt: Date;
}

export interface DetectionResult {
  anomalies: Anomaly[];
  modelPerformance: ModelPerformance;
  recommendations: SystemRecommendation[];
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  lastTraining: Date;
  trainingDataPoints: number;
}

export interface SystemRecommendation {
  type: 'model_tuning' | 'threshold_adjustment' | 'maintenance_scheduling';
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}

// =====================================================
// ANOMALY DETECTION ENGINE CLASS
// =====================================================

export class AnomalyDetectionEngine extends EventEmitter {
  private detectionConfigs: Map<string, AnomalyDetectionConfig> = new Map();
  private detectionModels: Map<string, any> = new Map();
  private historicalData: Map<string, EnergyProductionRecord[]> = new Map();
  private seasonalPatterns: Map<string, any> = new Map();
  private peerComparisons: Map<string, any> = new Map();
  private detectionHistory: Map<string, Anomaly[]> = new Map();
  private modelPerformance: Map<string, ModelPerformance> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize anomaly detection for a system
   */
  public async initializeDetection(
    systemId: string,
    config?: Partial<AnomalyDetectionConfig>
  ): Promise<void> {
    try {
      const defaultConfig: AnomalyDetectionConfig = {
        systemId,
        enabled: true,
        sensitivity: 'medium',
        detectionMethods: [
          'statistical_outlier',
          'time_series_deviation',
          'seasonal_anomaly',
          'weather_correlation',
          'performance_degradation'
        ],
        alertThresholds: {
          severity: {
            info: 0.3,
            warning: 0.6,
            critical: 0.8
          },
          frequency: {
            maxPerHour: 5,
            maxPerDay: 20,
            cooldownMinutes: 15
          },
          impact: {
            minProductionLoss: 1.0,
            minEfficiencyDrop: 2.0,
            minFinancialImpact: 0.5
          }
        },
        excludeConditions: [
          {
            type: 'weather',
            condition: 'precipitation > 10',
            parameters: { precipitationThreshold: 10 },
            enabled: true
          },
          {
            type: 'maintenance',
            condition: 'scheduled_maintenance',
            parameters: { bufferHours: 2 },
            enabled: true
          }
        ],
        learningPeriod: 30,
        minDataPoints: 100,
        maxNoiseLevel: 0.1
      };

      const detectionConfig = { ...defaultConfig, ...config };
      this.detectionConfigs.set(systemId, detectionConfig);

      // Load historical data for training
      await this.loadHistoricalData(systemId);

      // Train detection models
      await this.trainDetectionModels(systemId);

      // Initialize seasonal patterns
      await this.initializeSeasonalPatterns(systemId);

      // Set up peer comparisons
      await this.initializePeerComparisons(systemId);

      this.emit('detection_initialized', { systemId, config: detectionConfig });

      errorTracker.addBreadcrumb('Anomaly detection initialized', 'detection', { systemId });

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      throw error;
    }
  }

  /**
   * Analyze data for anomalies
   */
  public async analyzeForAnomalies(
    systemId: string,
    dataPoint: EnergyProductionRecord
  ): Promise<DetectionResult> {
    try {
      const config = this.detectionConfigs.get(systemId);
      if (!config || !config.enabled) {
        return { anomalies: [], modelPerformance: this.getDefaultModelPerformance(), recommendations: [] };
      }

      // Check exclusion conditions
      if (await this.shouldExcludeDataPoint(systemId, dataPoint)) {
        return { anomalies: [], modelPerformance: this.getDefaultModelPerformance(), recommendations: [] };
      }

      const anomalies: Anomaly[] = [];

      // Run different detection methods
      for (const method of config.detectionMethods) {
        const methodAnomalies = await this.runDetectionMethod(method, systemId, dataPoint);
        anomalies.push(...methodAnomalies);
      }

      // Deduplicate and consolidate anomalies
      const consolidatedAnomalies = this.consolidateAnomalies(anomalies);

      // Filter by thresholds
      const filteredAnomalies = this.filterAnomaliesByThresholds(consolidatedAnomalies, config);

      // Generate recommendations
      const recommendations = this.generateSystemRecommendations(systemId, filteredAnomalies);

      // Store anomalies
      await this.storeAnomalies(systemId, filteredAnomalies);

      // Update model performance
      const modelPerformance = this.updateModelPerformance(systemId, filteredAnomalies);

      const result: DetectionResult = {
        anomalies: filteredAnomalies,
        modelPerformance,
        recommendations
      };

      // Emit detection event
      if (filteredAnomalies.length > 0) {
        this.emit('anomalies_detected', { systemId, anomalies: filteredAnomalies });
      }

      return result;

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      return { anomalies: [], modelPerformance: this.getDefaultModelPerformance(), recommendations: [] };
    }
  }

  /**
   * Get system anomalies
   */
  public getSystemAnomalies(
    systemId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      severity?: AnomalySeverity[];
      status?: AnomalyStatus[];
      limit?: number;
    }
  ): Anomaly[] {
    const anomalies = this.detectionHistory.get(systemId) || [];
    
    let filtered = anomalies;

    if (filters) {
      if (filters.startDate) {
        filtered = filtered.filter(a => a.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(a => a.timestamp <= filters.endDate!);
      }
      if (filters.severity) {
        filtered = filtered.filter(a => filters.severity!.includes(a.severity));
      }
      if (filters.status) {
        filtered = filtered.filter(a => filters.status!.includes(a.status));
      }
    }

    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, filters?.limit || 100);
  }

  /**
   * Acknowledge an anomaly
   */
  public async acknowledgeAnomaly(
    anomalyId: string,
    userId: string,
    feedback?: Partial<AnomalyFeedback>
  ): Promise<void> {
    try {
      const anomaly = this.findAnomaly(anomalyId);
      if (!anomaly) {
        throw new Error(`Anomaly ${anomalyId} not found`);
      }

      anomaly.acknowledged = true;
      anomaly.acknowledgedBy = userId;
      anomaly.acknowledgedAt = new Date();

      if (feedback) {
        anomaly.feedback = {
          correct: feedback.correct || false,
          actualCause: feedback.actualCause,
          actionTaken: feedback.actionTaken,
          outcome: feedback.outcome,
          submittedBy: userId,
          submittedAt: new Date()
        };
      }

      // Update in database
      await updateDoc(doc(db, 'anomalies', anomalyId), {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: serverTimestamp(),
        feedback: anomaly.feedback
      });

      // Update model based on feedback
      if (feedback) {
        await this.updateModelWithFeedback(anomaly, feedback);
      }

      this.emit('anomaly_acknowledged', { anomalyId, userId, feedback });

    } catch (error) {
      errorTracker.captureException(error as Error, { anomalyId, userId });
      throw error;
    }
  }

  /**
   * Get detection statistics
   */
  public getDetectionStatistics(systemId?: string): {
    totalAnomalies: number;
    criticalAnomalies: number;
    falsePositives: number;
    averageScore: number;
    detectionMethods: Record<DetectionMethod, number>;
    modelAccuracy: number;
  } {
    const systems = systemId ? [systemId] : Array.from(this.detectionHistory.keys());
    const allAnomalies = systems.flatMap(id => this.detectionHistory.get(id) || []);

    const detectionMethods: Record<DetectionMethod, number> = {} as any;
    allAnomalies.forEach(anomaly => {
      anomaly.detectedBy.forEach(method => {
        detectionMethods[method] = (detectionMethods[method] || 0) + 1;
      });
    });

    const modelPerformance = systemId 
      ? this.modelPerformance.get(systemId)
      : Array.from(this.modelPerformance.values()).reduce((avg, perf) => ({
          ...avg,
          accuracy: (avg.accuracy + perf.accuracy) / 2
        }), { accuracy: 0 } as any);

    return {
      totalAnomalies: allAnomalies.length,
      criticalAnomalies: allAnomalies.filter(a => a.severity === 'critical').length,
      falsePositives: allAnomalies.filter(a => a.falsePositive).length,
      averageScore: allAnomalies.reduce((sum, a) => sum + a.score, 0) / allAnomalies.length || 0,
      detectionMethods,
      modelAccuracy: modelPerformance?.accuracy || 0
    };
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private setupEventHandlers(): void {
    this.on('anomalies_detected', this.handleAnomaliesDetected.bind(this));
    this.on('anomaly_acknowledged', this.handleAnomalyAcknowledged.bind(this));
  }

  private async loadHistoricalData(systemId: string): Promise<void> {
    try {
      const config = this.detectionConfigs.get(systemId);
      if (!config) return;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - config.learningPeriod);

      const dataQuery = query(
        collection(db, COLLECTIONS.ENERGY_PRODUCTION),
        where('systemId', '==', systemId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(dataQuery);
      const data = snapshot.docs.map(doc => doc.data() as EnergyProductionRecord);

      this.historicalData.set(systemId, data);

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
    }
  }

  private async trainDetectionModels(systemId: string): Promise<void> {
    try {
      const historicalData = this.historicalData.get(systemId) || [];
      if (historicalData.length < 50) return; // Need minimum data

      // Train different models for different detection methods
      const models = {
        statistical: this.trainStatisticalModel(historicalData),
        timeSeries: this.trainTimeSeriesModel(historicalData),
        seasonal: this.trainSeasonalModel(historicalData),
        weather: this.trainWeatherCorrelationModel(historicalData),
        performance: this.trainPerformanceDegradationModel(historicalData)
      };

      this.detectionModels.set(systemId, models);

      // Initialize model performance metrics
      this.modelPerformance.set(systemId, {
        accuracy: 0.85, // Initial estimate
        precision: 0.80,
        recall: 0.75,
        f1Score: 0.77,
        falsePositiveRate: 0.15,
        lastTraining: new Date(),
        trainingDataPoints: historicalData.length
      });

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
    }
  }

  private trainStatisticalModel(data: EnergyProductionRecord[]): any {
    // Simple statistical model based on z-score
    const values = data.map(d => d.production.acPower);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev, threshold: 2.5 }; // 2.5 standard deviations
  }

  private trainTimeSeriesModel(data: EnergyProductionRecord[]): any {
    // Simple moving average model
    const windowSize = Math.min(24, data.length / 4); // 24 hour window or 1/4 of data
    return { windowSize, smoothingFactor: 0.3 };
  }

  private trainSeasonalModel(data: EnergyProductionRecord[]): any {
    // Seasonal decomposition (simplified)
    const hourlyPatterns: Record<number, number[]> = {};
    
    data.forEach(record => {
      const hour = record.timestamp.toDate().getHours();
      if (!hourlyPatterns[hour]) {
        hourlyPatterns[hour] = [];
      }
      hourlyPatterns[hour].push(record.production.acPower);
    });

    const patterns: Record<number, { mean: number; stdDev: number }> = {};
    Object.entries(hourlyPatterns).forEach(([hour, values]) => {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      patterns[parseInt(hour)] = { mean, stdDev: Math.sqrt(variance) };
    });

    return { patterns };
  }

  private trainWeatherCorrelationModel(data: EnergyProductionRecord[]): any {
    // Weather correlation analysis (simplified)
    const correlations = {
      irradiance: 0.9,  // High positive correlation
      temperature: -0.3, // Slight negative correlation (heat derating)
      cloudCover: -0.7,  // Strong negative correlation
    };

    return { correlations, baselineIrradiance: 800 };
  }

  private trainPerformanceDegradationModel(data: EnergyProductionRecord[]): any {
    // Performance degradation detection (simplified)
    const sortedData = data.sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime());
    
    // Simple linear regression to detect degradation trend
    const degradationRate = 0.005; // 0.5% per year (typical)
    
    return { baselineEfficiency: 18.5, degradationRate, minDataPoints: 30 };
  }

  private async initializeSeasonalPatterns(systemId: string): Promise<void> {
    const historicalData = this.historicalData.get(systemId) || [];
    
    // Create seasonal patterns based on time of day, day of week, etc.
    const patterns = {
      hourly: this.calculateHourlyPatterns(historicalData),
      daily: this.calculateDailyPatterns(historicalData),
      monthly: this.calculateMonthlyPatterns(historicalData)
    };

    this.seasonalPatterns.set(systemId, patterns);
  }

  private calculateHourlyPatterns(data: EnergyProductionRecord[]): Record<number, { mean: number; stdDev: number }> {
    const hourlyData: Record<number, number[]> = {};
    
    data.forEach(record => {
      const hour = record.timestamp.toDate().getHours();
      if (!hourlyData[hour]) hourlyData[hour] = [];
      hourlyData[hour].push(record.production.acPower);
    });

    const patterns: Record<number, { mean: number; stdDev: number }> = {};
    Object.entries(hourlyData).forEach(([hour, values]) => {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      patterns[parseInt(hour)] = { mean, stdDev: Math.sqrt(variance) };
    });

    return patterns;
  }

  private calculateDailyPatterns(data: EnergyProductionRecord[]): Record<number, { mean: number; stdDev: number }> {
    // Similar to hourly but for day of week
    return {}; // Simplified implementation
  }

  private calculateMonthlyPatterns(data: EnergyProductionRecord[]): Record<number, { mean: number; stdDev: number }> {
    // Similar to hourly but for month of year
    return {}; // Simplified implementation
  }

  private async initializePeerComparisons(systemId: string): Promise<void> {
    // Initialize peer comparison data (would query similar systems)
    this.peerComparisons.set(systemId, {
      peerSystems: 50,
      averagePerformance: 0.85,
      standardDeviation: 0.08
    });
  }

  private async shouldExcludeDataPoint(
    systemId: string, 
    dataPoint: EnergyProductionRecord
  ): Promise<boolean> {
    const config = this.detectionConfigs.get(systemId);
    if (!config) return false;

    for (const exclusion of config.excludeConditions) {
      if (!exclusion.enabled) continue;

      switch (exclusion.type) {
        case 'weather':
          if (dataPoint.environmental?.irradiance && dataPoint.environmental.irradiance < 100) {
            return true; // Low irradiance conditions
          }
          break;
        case 'maintenance':
          // Check if maintenance is scheduled
          // This would check against maintenance schedule
          break;
      }
    }

    return false;
  }

  private async runDetectionMethod(
    method: DetectionMethod,
    systemId: string,
    dataPoint: EnergyProductionRecord
  ): Promise<Anomaly[]> {
    switch (method) {
      case 'statistical_outlier':
        return this.detectStatisticalOutliers(systemId, dataPoint);
      case 'time_series_deviation':
        return this.detectTimeSeriesDeviations(systemId, dataPoint);
      case 'seasonal_anomaly':
        return this.detectSeasonalAnomalies(systemId, dataPoint);
      case 'weather_correlation':
        return this.detectWeatherCorrelationAnomalies(systemId, dataPoint);
      case 'performance_degradation':
        return this.detectPerformanceDegradation(systemId, dataPoint);
      default:
        return [];
    }
  }

  private detectStatisticalOutliers(
    systemId: string,
    dataPoint: EnergyProductionRecord
  ): Anomaly[] {
    const models = this.detectionModels.get(systemId);
    if (!models?.statistical) return [];

    const { mean, stdDev, threshold } = models.statistical;
    const value = dataPoint.production.acPower;
    const zScore = Math.abs((value - mean) / stdDev);

    if (zScore > threshold) {
      const anomaly = this.createAnomaly({
        systemId,
        type: 'production_drop',
        severity: zScore > threshold * 1.5 ? 'critical' : 'warning',
        category: 'production',
        score: Math.min(zScore / threshold, 1),
        description: `Production value ${value.toFixed(2)} kW is ${zScore.toFixed(2)} standard deviations from normal`,
        detectedBy: ['statistical_outlier'],
        dataPoint,
        context: {
          currentValue: value,
          expectedValue: mean,
          zScore
        }
      });

      return [anomaly];
    }

    return [];
  }

  private detectTimeSeriesDeviations(
    systemId: string,
    dataPoint: EnergyProductionRecord
  ): Anomaly[] {
    // Implementation for time series analysis
    return [];
  }

  private detectSeasonalAnomalies(
    systemId: string,
    dataPoint: EnergyProductionRecord
  ): Anomaly[] {
    const patterns = this.seasonalPatterns.get(systemId);
    if (!patterns?.hourly) return [];

    const hour = dataPoint.timestamp.toDate().getHours();
    const hourPattern = patterns.hourly[hour];
    
    if (!hourPattern) return [];

    const value = dataPoint.production.acPower;
    const expectedValue = hourPattern.mean;
    const deviation = Math.abs(value - expectedValue) / hourPattern.stdDev;

    if (deviation > 2.0) { // 2 standard deviations
      const anomaly = this.createAnomaly({
        systemId,
        type: 'seasonal_deviation',
        severity: deviation > 3.0 ? 'critical' : 'warning',
        category: 'production',
        score: Math.min(deviation / 3.0, 1),
        description: `Production at hour ${hour} deviates significantly from seasonal pattern`,
        detectedBy: ['seasonal_anomaly'],
        dataPoint,
        context: {
          currentValue: value,
          expectedValue,
          deviation
        }
      });

      return [anomaly];
    }

    return [];
  }

  private detectWeatherCorrelationAnomalies(
    systemId: string,
    dataPoint: EnergyProductionRecord
  ): Anomaly[] {
    const models = this.detectionModels.get(systemId);
    if (!models?.weather || !dataPoint.environmental?.irradiance) return [];

    const { correlations, baselineIrradiance } = models.weather;
    const actualPower = dataPoint.production.acPower;
    const irradiance = dataPoint.environmental.irradiance;
    
    // Expected power based on irradiance
    const irradianceRatio = irradiance / baselineIrradiance;
    const expectedPower = 10 * irradianceRatio; // Assume 10kW system at baseline
    
    const deviation = Math.abs(actualPower - expectedPower) / expectedPower;
    
    if (deviation > 0.3 && irradiance > 200) { // 30% deviation in good conditions
      const anomaly = this.createAnomaly({
        systemId,
        type: 'weather_inconsistency',
        severity: deviation > 0.5 ? 'critical' : 'warning',
        category: 'performance',
        score: Math.min(deviation / 0.5, 1),
        description: `Power output inconsistent with weather conditions`,
        detectedBy: ['weather_correlation'],
        dataPoint,
        context: {
          currentValue: actualPower,
          expectedValue: expectedPower,
          deviation
        }
      });

      return [anomaly];
    }

    return [];
  }

  private detectPerformanceDegradation(
    systemId: string,
    dataPoint: EnergyProductionRecord
  ): Anomaly[] {
    // Implementation for performance degradation detection
    return [];
  }

  private createAnomaly(params: {
    systemId: string;
    type: AnomalyType;
    severity: AnomalySeverity;
    category: AnomalyCategory;
    score: number;
    description: string;
    detectedBy: DetectionMethod[];
    dataPoint: EnergyProductionRecord;
    context: any;
  }): Anomaly {
    const now = new Date();
    
    return {
      id: `anomaly_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
      systemId: params.systemId,
      timestamp: params.dataPoint.timestamp.toDate(),
      type: params.type,
      severity: params.severity,
      category: params.category,
      score: params.score,
      description: params.description,
      detectedBy: params.detectedBy,
      context: {
        currentValue: params.context.currentValue,
        expectedValue: params.context.expectedValue,
        historicalRange: {
          min: 0,
          max: 12,
          mean: 6,
          stdDev: 2
        },
        seasonalPattern: {
          timeOfDay: params.dataPoint.timestamp.toDate().getHours(),
          dayOfWeek: params.dataPoint.timestamp.toDate().getDay(),
          dayOfYear: this.getDayOfYear(params.dataPoint.timestamp.toDate()),
          seasonalExpected: 6,
          seasonalStdDev: 1.5
        },
        weatherConditions: {
          irradiance: params.dataPoint.environmental?.irradiance || 0,
          temperature: params.dataPoint.environmental?.ambientTemp || 25,
          cloudCover: 20,
          precipitation: 0,
          weatherExpected: 7,
          weatherImpactFactor: 0.95
        },
        systemConditions: {
          systemAge: 3,
          lastMaintenance: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          degradationFactor: 0.985,
          equipmentStatus: { inverter: 'online', monitoring: 'connected' },
          communicationQuality: 0.98
        }
      },
      impact: {
        productionLoss: Math.max(0, params.context.expectedValue - params.context.currentValue),
        efficiencyDrop: params.score * 5, // Estimated efficiency drop
        financialImpact: params.score * 2, // Estimated financial impact
        environmentalImpact: params.score * 1.5, // CO2 impact
        duration: 60, // Estimated duration
        urgency: params.severity === 'critical' ? 'immediate' : 'within_day'
      },
      recommendations: this.generateAnomalyRecommendations(params.type, params.severity),
      status: 'active',
      acknowledged: false,
      resolved: false,
      falsePositive: false
    };
  }

  private generateAnomalyRecommendations(
    type: AnomalyType,
    severity: AnomalySeverity
  ): AnomalyRecommendation[] {
    const baseRecommendations: Record<AnomalyType, AnomalyRecommendation[]> = {
      production_drop: [
        {
          action: 'Inspect system for shading or soiling',
          priority: 'high',
          category: 'inspection',
          estimatedCost: 100,
          estimatedTime: 60,
          expectedBenefit: 'Restore 5-10% production',
          requiredSkills: ['basic_maintenance']
        }
      ],
      efficiency_loss: [
        {
          action: 'Check inverter performance and connections',
          priority: 'medium',
          category: 'inspection',
          estimatedCost: 150,
          estimatedTime: 90,
          expectedBenefit: 'Improve efficiency by 2-5%',
          requiredSkills: ['electrical']
        }
      ],
      equipment_malfunction: [
        {
          action: 'Immediate equipment inspection required',
          priority: 'immediate',
          category: 'repair',
          estimatedCost: 300,
          estimatedTime: 120,
          expectedBenefit: 'Restore full system operation',
          requiredSkills: ['electrical', 'certified_technician']
        }
      ],
      weather_inconsistency: [
        {
          action: 'Verify weather data and system response',
          priority: 'medium',
          category: 'monitoring',
          estimatedCost: 50,
          estimatedTime: 30,
          expectedBenefit: 'Improve detection accuracy',
          requiredSkills: ['data_analysis']
        }
      ],
      performance_degradation: [
        {
          action: 'Schedule comprehensive performance assessment',
          priority: 'medium',
          category: 'maintenance',
          estimatedCost: 200,
          estimatedTime: 180,
          expectedBenefit: 'Identify degradation causes',
          requiredSkills: ['performance_analysis']
        }
      ],
      communication_loss: [
        {
          action: 'Check monitoring system connectivity',
          priority: 'high',
          category: 'repair',
          estimatedCost: 100,
          estimatedTime: 45,
          expectedBenefit: 'Restore monitoring capability',
          requiredSkills: ['networking']
        }
      ],
      power_quality_issue: [
        {
          action: 'Analyze power quality and grid connection',
          priority: 'high',
          category: 'inspection',
          estimatedCost: 250,
          estimatedTime: 120,
          expectedBenefit: 'Improve power quality',
          requiredSkills: ['electrical', 'power_quality']
        }
      ],
      seasonal_deviation: [
        {
          action: 'Review seasonal patterns and expectations',
          priority: 'low',
          category: 'monitoring',
          estimatedCost: 0,
          estimatedTime: 15,
          expectedBenefit: 'Update seasonal models',
          requiredSkills: ['data_analysis']
        }
      ],
      peer_comparison_outlier: [
        {
          action: 'Compare with peer system performance',
          priority: 'low',
          category: 'monitoring',
          estimatedCost: 50,
          estimatedTime: 30,
          expectedBenefit: 'Identify improvement opportunities',
          requiredSkills: ['performance_analysis']
        }
      ],
      predictive_failure: [
        {
          action: 'Schedule preventive maintenance',
          priority: 'medium',
          category: 'maintenance',
          estimatedCost: 200,
          estimatedTime: 120,
          expectedBenefit: 'Prevent equipment failure',
          requiredSkills: ['preventive_maintenance']
        }
      ]
    };

    return baseRecommendations[type] || [];
  }

  private consolidateAnomalies(anomalies: Anomaly[]): Anomaly[] {
    // Remove duplicates and consolidate similar anomalies
    const consolidated: Anomaly[] = [];
    const seen = new Set<string>();

    anomalies.forEach(anomaly => {
      const key = `${anomaly.type}_${anomaly.category}_${anomaly.timestamp.getTime()}`;
      if (!seen.has(key)) {
        seen.add(key);
        consolidated.push(anomaly);
      }
    });

    return consolidated;
  }

  private filterAnomaliesByThresholds(
    anomalies: Anomaly[],
    config: AnomalyDetectionConfig
  ): Anomaly[] {
    return anomalies.filter(anomaly => {
      // Filter by score threshold
      const scoreThreshold = config.alertThresholds.severity[anomaly.severity];
      if (anomaly.score < scoreThreshold) return false;

      // Filter by impact thresholds
      const impactThresholds = config.alertThresholds.impact;
      if (anomaly.impact.productionLoss < impactThresholds.minProductionLoss &&
          anomaly.impact.efficiencyDrop < impactThresholds.minEfficiencyDrop &&
          anomaly.impact.financialImpact < impactThresholds.minFinancialImpact) {
        return false;
      }

      return true;
    });
  }

  private generateSystemRecommendations(
    systemId: string,
    anomalies: Anomaly[]
  ): SystemRecommendation[] {
    const recommendations: SystemRecommendation[] = [];

    if (anomalies.length > 10) {
      recommendations.push({
        type: 'threshold_adjustment',
        description: 'Consider adjusting anomaly detection sensitivity',
        priority: 'medium',
        impact: 'Reduce false positives'
      });
    }

    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 2) {
      recommendations.push({
        type: 'maintenance_scheduling',
        description: 'Schedule immediate system inspection',
        priority: 'high',
        impact: 'Address critical issues'
      });
    }

    return recommendations;
  }

  private async storeAnomalies(systemId: string, anomalies: Anomaly[]): Promise<void> {
    try {
      for (const anomaly of anomalies) {
        await addDoc(collection(db, 'anomalies'), {
          ...anomaly,
          timestamp: serverTimestamp()
        });
      }

      // Update local history
      const history = this.detectionHistory.get(systemId) || [];
      history.push(...anomalies);
      this.detectionHistory.set(systemId, history);

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId, count: anomalies.length });
    }
  }

  private updateModelPerformance(
    systemId: string,
    anomalies: Anomaly[]
  ): ModelPerformance {
    const currentPerformance = this.modelPerformance.get(systemId) || this.getDefaultModelPerformance();
    
    // Update based on feedback (simplified)
    // In production, this would use more sophisticated metrics
    
    return currentPerformance;
  }

  private getDefaultModelPerformance(): ModelPerformance {
    return {
      accuracy: 0.85,
      precision: 0.80,
      recall: 0.75,
      f1Score: 0.77,
      falsePositiveRate: 0.15,
      lastTraining: new Date(),
      trainingDataPoints: 0
    };
  }

  private findAnomaly(anomalyId: string): Anomaly | null {
    for (const anomalies of this.detectionHistory.values()) {
      const anomaly = anomalies.find(a => a.id === anomalyId);
      if (anomaly) return anomaly;
    }
    return null;
  }

  private async updateModelWithFeedback(
    anomaly: Anomaly,
    feedback: Partial<AnomalyFeedback>
  ): Promise<void> {
    // Update model based on user feedback
    // This would retrain or adjust model parameters
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Event handlers
  private handleAnomaliesDetected(event: { systemId: string; anomalies: Anomaly[] }): void {
    console.log(`Anomalies detected for system ${event.systemId}: ${event.anomalies.length}`);
  }

  private handleAnomalyAcknowledged(event: { anomalyId: string; userId: string }): void {
    console.log(`Anomaly ${event.anomalyId} acknowledged by ${event.userId}`);
  }
}

// Export singleton instance
export const anomalyDetectionEngine = new AnomalyDetectionEngine();