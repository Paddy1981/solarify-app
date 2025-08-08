/**
 * Solar System Performance Monitor
 * Comprehensive real-time monitoring system for solar energy systems
 */

import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, Timestamp, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, SolarSystem, EnergyProductionRecord, WeatherRecord } from '../../types/firestore-schema';
import { errorTracker } from './error-tracker';
import { EventEmitter } from 'events';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface MonitoringConfiguration {
  systemId: string;
  enabled: boolean;
  dataCollectionInterval: number; // seconds
  alertThresholds: AlertThresholds;
  weatherCorrelation: boolean;
  predictiveAnalysis: boolean;
  dataRetentionDays: number;
  qualityChecks: DataQualityChecks;
}

export interface AlertThresholds {
  performanceRatioMin: number;
  efficiencyMin: number;
  powerDeviationMax: number; // percentage
  temperatureMax: number; // °C
  voltageDeviationMax: number; // percentage
  communicationTimeoutMinutes: number;
  dataGapHours: number;
}

export interface DataQualityChecks {
  enableOutlierDetection: boolean;
  enableConsistencyChecks: boolean;
  enableCompletenessValidation: boolean;
  enableRangeValidation: boolean;
  confidenceThreshold: number;
}

export interface RealTimeMetrics {
  systemId: string;
  timestamp: Date;
  production: ProductionMetrics;
  performance: PerformanceMetrics;
  environmental: EnvironmentalMetrics;
  system: SystemMetrics;
  quality: DataQualityMetrics;
  alerts: SystemAlert[];
}

export interface ProductionMetrics {
  dcPower: number; // kW
  acPower: number; // kW
  energy: number; // kWh (cumulative for period)
  voltage: number; // V
  current: number; // A
  frequency: number; // Hz
  powerFactor: number;
  efficiency: number; // %
}

export interface PerformanceMetrics {
  performanceRatio: number;
  specificYield: number; // kWh/kWp
  capacityFactor: number;
  availabilityFactor: number;
  systemEfficiency: number; // %
  inverterEfficiency: number; // %
  expectedVsActual: number; // ratio
  degradationRate: number; // %/year
}

export interface EnvironmentalMetrics {
  solarIrradiance: number; // W/m²
  ambientTemperature: number; // °C
  moduleTemperature: number; // °C
  windSpeed: number; // m/s
  humidity: number; // %
  atmosphericPressure: number; // hPa
  cloudCover: number; // %
  weatherImpactFactor: number; // 0-1
}

export interface SystemMetrics {
  inverterStatus: 'online' | 'offline' | 'fault' | 'maintenance';
  communicationStatus: 'connected' | 'disconnected' | 'poor';
  dataCollectionStatus: 'active' | 'delayed' | 'failed';
  systemHealth: number; // 0-1 scale
  maintenanceStatus: 'current' | 'due' | 'overdue';
  componentHealth: ComponentHealth[];
}

export interface ComponentHealth {
  componentId: string;
  componentType: 'inverter' | 'panel' | 'optimizer' | 'meter' | 'sensor';
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number; // 0-1
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  warningsActive: number;
  errorsActive: number;
}

export interface DataQualityMetrics {
  overall: number; // 0-1 scale
  completeness: number; // 0-1 scale
  accuracy: number; // 0-1 scale
  consistency: number; // 0-1 scale
  timeliness: number; // 0-1 scale
  validity: number; // 0-1 scale
  outliers: number;
  gaps: DataGap[];
  interpolatedPoints: number;
}

export interface DataGap {
  start: Date;
  end: Date;
  duration: number; // minutes
  reason: string;
  severity: 'minor' | 'moderate' | 'severe';
}

export interface SystemAlert {
  id: string;
  systemId: string;
  type: AlertType;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  component?: string;
  value?: number;
  threshold?: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actions: AlertAction[];
}

export type AlertType = 
  | 'performance_degradation'
  | 'equipment_fault'
  | 'communication_loss'
  | 'data_quality'
  | 'maintenance_due'
  | 'weather_impact'
  | 'security_breach'
  | 'system_offline';

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type AlertCategory = 
  | 'production'
  | 'performance' 
  | 'equipment'
  | 'communication'
  | 'maintenance'
  | 'security'
  | 'weather';

export interface AlertAction {
  action: string;
  priority: 'immediate' | 'urgent' | 'normal' | 'low';
  assignee?: string;
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface MonitoringEvent {
  type: string;
  data: any;
  timestamp: Date;
}

// =====================================================
// SOLAR PERFORMANCE MONITOR CLASS
// =====================================================

export class SolarPerformanceMonitor extends EventEmitter {
  private monitoringConfigs: Map<string, MonitoringConfiguration> = new Map();
  private activeMonitors: Map<string, NodeJS.Timeout> = new Map();
  private realtimeSubscriptions: Map<string, () => void> = new Map();
  private alertHistory: Map<string, SystemAlert[]> = new Map();
  private performanceCache: Map<string, RealTimeMetrics> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Start monitoring a solar system
   */
  public async startMonitoring(
    systemId: string, 
    config: Partial<MonitoringConfiguration> = {}
  ): Promise<void> {
    try {
      // Validate system exists
      const systemInfo = await this.getSystemInfo(systemId);
      if (!systemInfo) {
        throw new Error(`Solar system ${systemId} not found`);
      }

      // Create monitoring configuration
      const monitoringConfig: MonitoringConfiguration = {
        systemId,
        enabled: true,
        dataCollectionInterval: 30, // 30 seconds
        alertThresholds: {
          performanceRatioMin: 0.75,
          efficiencyMin: 15.0,
          powerDeviationMax: 20.0,
          temperatureMax: 85.0,
          voltageDeviationMax: 10.0,
          communicationTimeoutMinutes: 5,
          dataGapHours: 1
        },
        weatherCorrelation: true,
        predictiveAnalysis: true,
        dataRetentionDays: 365,
        qualityChecks: {
          enableOutlierDetection: true,
          enableConsistencyChecks: true,
          enableCompletenessValidation: true,
          enableRangeValidation: true,
          confidenceThreshold: 0.8
        },
        ...config
      };

      this.monitoringConfigs.set(systemId, monitoringConfig);

      // Start real-time data collection
      await this.startDataCollection(systemId, monitoringConfig);

      // Set up real-time subscriptions
      this.setupRealtimeSubscriptions(systemId);

      // Initialize alert system
      this.initializeAlertSystem(systemId);

      this.emit('monitoring_started', { systemId, config: monitoringConfig });
      
      errorTracker.addBreadcrumb('Started system monitoring', 'monitoring', {
        systemId,
        interval: monitoringConfig.dataCollectionInterval
      });

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      throw error;
    }
  }

  /**
   * Stop monitoring a solar system
   */
  public async stopMonitoring(systemId: string): Promise<void> {
    try {
      // Stop data collection interval
      const intervalId = this.activeMonitors.get(systemId);
      if (intervalId) {
        clearInterval(intervalId);
        this.activeMonitors.delete(systemId);
      }

      // Unsubscribe from real-time updates
      const unsubscribe = this.realtimeSubscriptions.get(systemId);
      if (unsubscribe) {
        unsubscribe();
        this.realtimeSubscriptions.delete(systemId);
      }

      // Remove from active configs
      this.monitoringConfigs.delete(systemId);
      this.performanceCache.delete(systemId);

      this.emit('monitoring_stopped', { systemId });

      errorTracker.addBreadcrumb('Stopped system monitoring', 'monitoring', { systemId });

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      throw error;
    }
  }

  /**
   * Get current real-time metrics for a system
   */
  public async getCurrentMetrics(systemId: string): Promise<RealTimeMetrics | null> {
    try {
      // Return cached data if available and recent
      const cached = this.performanceCache.get(systemId);
      if (cached && Date.now() - cached.timestamp.getTime() < 60000) { // 1 minute
        return cached;
      }

      // Fetch fresh data
      const metrics = await this.collectSystemMetrics(systemId);
      if (metrics) {
        this.performanceCache.set(systemId, metrics);
      }

      return metrics;

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      return null;
    }
  }

  /**
   * Get system alerts
   */
  public getSystemAlerts(
    systemId: string, 
    options: {
      severity?: AlertSeverity[];
      category?: AlertCategory[];
      resolved?: boolean;
      limit?: number;
    } = {}
  ): SystemAlert[] {
    const alerts = this.alertHistory.get(systemId) || [];
    
    return alerts
      .filter(alert => {
        if (options.severity && !options.severity.includes(alert.severity)) return false;
        if (options.category && !options.category.includes(alert.category)) return false;
        if (options.resolved !== undefined && alert.resolved !== options.resolved) return false;
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, options.limit || 100);
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(
    alertId: string, 
    userId: string, 
    notes?: string
  ): Promise<void> {
    try {
      const alert = this.findAlert(alertId);
      if (!alert) {
        throw new Error(`Alert ${alertId} not found`);
      }

      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();

      // Update in database
      await updateDoc(doc(db, COLLECTIONS.SYSTEM_ALERTS, alertId), {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: serverTimestamp(),
        notes: notes || null
      });

      this.emit('alert_acknowledged', { alertId, userId, notes });

    } catch (error) {
      errorTracker.captureException(error as Error, { alertId, userId });
      throw error;
    }
  }

  /**
   * Get monitoring statistics
   */
  public getMonitoringStats(): {
    activeSystems: number;
    totalDataPoints: number;
    alertsActive: number;
    systemsOnline: number;
    systemsOffline: number;
    averagePerformance: number;
  } {
    const activeSystems = this.monitoringConfigs.size;
    const activeAlerts = Array.from(this.alertHistory.values())
      .flat()
      .filter(alert => !alert.resolved && !alert.acknowledged).length;

    const cachedMetrics = Array.from(this.performanceCache.values());
    const systemsOnline = cachedMetrics.filter(m => 
      m.system.inverterStatus === 'online' && 
      m.system.communicationStatus === 'connected'
    ).length;

    const averagePerformance = cachedMetrics.length > 0 
      ? cachedMetrics.reduce((sum, m) => sum + m.performance.performanceRatio, 0) / cachedMetrics.length
      : 0;

    return {
      activeSystems,
      totalDataPoints: cachedMetrics.length,
      alertsActive: activeAlerts,
      systemsOnline,
      systemsOffline: activeSystems - systemsOnline,
      averagePerformance: Math.round(averagePerformance * 1000) / 1000
    };
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private setupEventHandlers(): void {
    this.on('alert_generated', this.handleAlertGenerated.bind(this));
    this.on('metrics_updated', this.handleMetricsUpdated.bind(this));
    this.on('data_quality_issue', this.handleDataQualityIssue.bind(this));
  }

  private async startDataCollection(
    systemId: string, 
    config: MonitoringConfiguration
  ): Promise<void> {
    const collectData = async () => {
      try {
        const metrics = await this.collectSystemMetrics(systemId);
        if (metrics) {
          // Store in cache
          this.performanceCache.set(systemId, metrics);
          
          // Store in database
          await this.storeMetrics(metrics);
          
          // Check for alerts
          await this.checkAlertConditions(metrics, config);
          
          // Emit update event
          this.emit('metrics_updated', { systemId, metrics });
        }
      } catch (error) {
        errorTracker.captureException(error as Error, { systemId });
      }
    };

    // Initial collection
    await collectData();

    // Set up interval
    const intervalId = setInterval(collectData, config.dataCollectionInterval * 1000);
    this.activeMonitors.set(systemId, intervalId);
  }

  private async collectSystemMetrics(systemId: string): Promise<RealTimeMetrics | null> {
    try {
      // Get system information
      const systemInfo = await this.getSystemInfo(systemId);
      if (!systemInfo) return null;

      // Fetch latest production data
      const latestProduction = await this.getLatestProductionData(systemId);
      if (!latestProduction) {
        // Generate offline metrics
        return this.generateOfflineMetrics(systemId);
      }

      // Fetch weather data
      const weatherData = await this.getLatestWeatherData(systemInfo);

      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(latestProduction, systemInfo);
      
      // Assess data quality
      const dataQuality = await this.assessDataQuality(systemId, latestProduction);
      
      // Check system health
      const systemHealth = await this.assessSystemHealth(systemId, latestProduction);
      
      // Get current alerts
      const activeAlerts = this.getSystemAlerts(systemId, { resolved: false, limit: 10 });

      return {
        systemId,
        timestamp: new Date(),
        production: {
          dcPower: latestProduction.production.dcPower,
          acPower: latestProduction.production.acPower,
          energy: latestProduction.production.energy,
          voltage: latestProduction.production.voltage,
          current: latestProduction.production.current,
          frequency: latestProduction.production.frequency,
          powerFactor: 0.95, // Would be calculated from actual data
          efficiency: latestProduction.performance.efficiency
        },
        performance,
        environmental: {
          solarIrradiance: latestProduction.environmental?.irradiance || 0,
          ambientTemperature: latestProduction.environmental?.ambientTemp || 25,
          moduleTemperature: latestProduction.environmental?.moduleTemp || 35,
          windSpeed: weatherData?.windSpeed || 2,
          humidity: weatherData?.humidity || 50,
          atmosphericPressure: weatherData?.pressure || 1013,
          cloudCover: weatherData?.cloudCover || 20,
          weatherImpactFactor: this.calculateWeatherImpact(weatherData, latestProduction)
        },
        system: systemHealth,
        quality: dataQuality,
        alerts: activeAlerts
      };

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      return null;
    }
  }

  private calculatePerformanceMetrics(
    productionData: EnergyProductionRecord,
    systemInfo: SolarSystem
  ): PerformanceMetrics {
    const capacity = systemInfo.configuration.totalCapacity;
    const specificYield = capacity > 0 ? (productionData.production.energy / capacity) : 0;
    
    return {
      performanceRatio: productionData.performance.performanceRatio,
      specificYield,
      capacityFactor: productionData.performance.capacityFactor,
      availabilityFactor: 1.0, // Would be calculated from uptime data
      systemEfficiency: productionData.performance.efficiency,
      inverterEfficiency: productionData.performance.efficiency * 0.98,
      expectedVsActual: 1.0, // Would be calculated against forecast
      degradationRate: 0.005 // Would be calculated from historical data
    };
  }

  private async assessDataQuality(
    systemId: string, 
    latestData: EnergyProductionRecord
  ): Promise<DataQualityMetrics> {
    // Implement comprehensive data quality assessment
    const overall = latestData.dataQuality.confidence;
    
    return {
      overall,
      completeness: 0.95,
      accuracy: 0.9,
      consistency: 0.92,
      timeliness: 0.98,
      validity: 0.94,
      outliers: 0,
      gaps: [],
      interpolatedPoints: latestData.dataQuality.interpolated ? 1 : 0
    };
  }

  private async assessSystemHealth(
    systemId: string, 
    latestData: EnergyProductionRecord
  ): Promise<SystemMetrics> {
    const now = new Date();
    const dataAge = now.getTime() - latestData.timestamp.toDate().getTime();
    const isRecentData = dataAge < 5 * 60 * 1000; // 5 minutes

    return {
      inverterStatus: isRecentData ? 'online' : 'offline',
      communicationStatus: isRecentData ? 'connected' : 'disconnected',
      dataCollectionStatus: isRecentData ? 'active' : 'delayed',
      systemHealth: latestData.performance.performanceRatio * latestData.dataQuality.confidence,
      maintenanceStatus: 'current', // Would be determined from maintenance schedule
      componentHealth: [
        {
          componentId: 'inv_001',
          componentType: 'inverter',
          status: 'good',
          healthScore: 0.9,
          warningsActive: 0,
          errorsActive: 0
        }
      ]
    };
  }

  private calculateWeatherImpact(
    weatherData: WeatherRecord | null,
    productionData: EnergyProductionRecord
  ): number {
    if (!weatherData) return 1.0;
    
    // Simple weather impact calculation
    // In production, this would be more sophisticated
    const irradianceImpact = weatherData.solarIrradiance ? 
      Math.min(weatherData.solarIrradiance / 1000, 1.0) : 1.0;
    
    const temperatureImpact = weatherData.temperature ? 
      Math.max(0, 1 - (Math.max(weatherData.temperature - 25, 0) * 0.004)) : 1.0;
    
    return (irradianceImpact + temperatureImpact) / 2;
  }

  private generateOfflineMetrics(systemId: string): RealTimeMetrics {
    return {
      systemId,
      timestamp: new Date(),
      production: {
        dcPower: 0, acPower: 0, energy: 0, voltage: 0, current: 0,
        frequency: 0, powerFactor: 0, efficiency: 0
      },
      performance: {
        performanceRatio: 0, specificYield: 0, capacityFactor: 0,
        availabilityFactor: 0, systemEfficiency: 0, inverterEfficiency: 0,
        expectedVsActual: 0, degradationRate: 0
      },
      environmental: {
        solarIrradiance: 0, ambientTemperature: 25, moduleTemperature: 25,
        windSpeed: 0, humidity: 50, atmosphericPressure: 1013,
        cloudCover: 100, weatherImpactFactor: 0
      },
      system: {
        inverterStatus: 'offline',
        communicationStatus: 'disconnected',
        dataCollectionStatus: 'failed',
        systemHealth: 0,
        maintenanceStatus: 'current',
        componentHealth: []
      },
      quality: {
        overall: 0, completeness: 0, accuracy: 0, consistency: 0,
        timeliness: 0, validity: 0, outliers: 0, gaps: [], interpolatedPoints: 0
      },
      alerts: []
    };
  }

  private setupRealtimeSubscriptions(systemId: string): void {
    // Subscribe to production data updates
    const productionQuery = query(
      collection(db, COLLECTIONS.ENERGY_PRODUCTION),
      where('systemId', '==', systemId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(productionQuery, (snapshot) => {
      if (!snapshot.empty) {
        const latestData = snapshot.docs[0].data() as EnergyProductionRecord;
        this.handleRealtimeDataUpdate(systemId, latestData);
      }
    });

    this.realtimeSubscriptions.set(systemId, unsubscribe);
  }

  private async handleRealtimeDataUpdate(
    systemId: string, 
    data: EnergyProductionRecord
  ): Promise<void> {
    // Update cached metrics
    const metrics = await this.collectSystemMetrics(systemId);
    if (metrics) {
      this.performanceCache.set(systemId, metrics);
      this.emit('realtime_update', { systemId, metrics });
    }
  }

  private initializeAlertSystem(systemId: string): void {
    if (!this.alertHistory.has(systemId)) {
      this.alertHistory.set(systemId, []);
    }
  }

  private async checkAlertConditions(
    metrics: RealTimeMetrics, 
    config: MonitoringConfiguration
  ): Promise<void> {
    const alerts: SystemAlert[] = [];

    // Performance alerts
    if (metrics.performance.performanceRatio < config.alertThresholds.performanceRatioMin) {
      alerts.push(this.createAlert({
        systemId: metrics.systemId,
        type: 'performance_degradation',
        severity: 'medium',
        category: 'performance',
        title: 'Performance Below Expected',
        message: `Performance ratio (${(metrics.performance.performanceRatio * 100).toFixed(1)}%) is below minimum threshold (${(config.alertThresholds.performanceRatioMin * 100).toFixed(1)}%)`,
        value: metrics.performance.performanceRatio,
        threshold: config.alertThresholds.performanceRatioMin
      }));
    }

    // Temperature alerts
    if (metrics.environmental.moduleTemperature > config.alertThresholds.temperatureMax) {
      alerts.push(this.createAlert({
        systemId: metrics.systemId,
        type: 'equipment_fault',
        severity: 'high',
        category: 'equipment',
        title: 'High Module Temperature',
        message: `Module temperature (${metrics.environmental.moduleTemperature.toFixed(1)}°C) exceeds maximum threshold (${config.alertThresholds.temperatureMax}°C)`,
        value: metrics.environmental.moduleTemperature,
        threshold: config.alertThresholds.temperatureMax
      }));
    }

    // Communication alerts
    if (metrics.system.communicationStatus === 'disconnected') {
      alerts.push(this.createAlert({
        systemId: metrics.systemId,
        type: 'communication_loss',
        severity: 'high',
        category: 'communication',
        title: 'Communication Lost',
        message: 'Lost communication with monitoring system'
      }));
    }

    // Process alerts
    for (const alert of alerts) {
      await this.generateAlert(alert);
    }
  }

  private createAlert(params: {
    systemId: string;
    type: AlertType;
    severity: AlertSeverity;
    category: AlertCategory;
    title: string;
    message: string;
    component?: string;
    value?: number;
    threshold?: number;
  }): SystemAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      actions: []
    };
  }

  private async generateAlert(alert: SystemAlert): Promise<void> {
    try {
      // Store in database
      await addDoc(collection(db, COLLECTIONS.SYSTEM_ALERTS), {
        ...alert,
        timestamp: serverTimestamp()
      });

      // Add to local history
      const systemAlerts = this.alertHistory.get(alert.systemId) || [];
      systemAlerts.push(alert);
      this.alertHistory.set(alert.systemId, systemAlerts);

      // Emit event
      this.emit('alert_generated', alert);

    } catch (error) {
      errorTracker.captureException(error as Error, { alert });
    }
  }

  private async storeMetrics(metrics: RealTimeMetrics): Promise<void> {
    try {
      await addDoc(collection(db, 'system_metrics'), {
        ...metrics,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      errorTracker.captureException(error as Error, { systemId: metrics.systemId });
    }
  }

  private findAlert(alertId: string): SystemAlert | null {
    for (const alerts of this.alertHistory.values()) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) return alert;
    }
    return null;
  }

  // Data fetching helpers
  private async getSystemInfo(systemId: string): Promise<SolarSystem | null> {
    try {
      const systemQuery = query(
        collection(db, COLLECTIONS.SOLAR_SYSTEMS),
        where('id', '==', systemId),
        limit(1)
      );
      
      const snapshot = await getDocs(systemQuery);
      return snapshot.empty ? null : snapshot.docs[0].data() as SolarSystem;
    } catch (error) {
      return null;
    }
  }

  private async getLatestProductionData(systemId: string): Promise<EnergyProductionRecord | null> {
    try {
      const productionQuery = query(
        collection(db, COLLECTIONS.ENERGY_PRODUCTION),
        where('systemId', '==', systemId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(productionQuery);
      return snapshot.empty ? null : snapshot.docs[0].data() as EnergyProductionRecord;
    } catch (error) {
      return null;
    }
  }

  private async getLatestWeatherData(systemInfo: SolarSystem): Promise<WeatherRecord | null> {
    try {
      const locationId = `${systemInfo.location.coordinates.latitude}_${systemInfo.location.coordinates.longitude}`;
      
      const weatherQuery = query(
        collection(db, COLLECTIONS.WEATHER_DATA),
        where('locationId', '==', locationId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(weatherQuery);
      return snapshot.empty ? null : snapshot.docs[0].data() as WeatherRecord;
    } catch (error) {
      return null;
    }
  }

  // Event handlers
  private handleAlertGenerated(alert: SystemAlert): void {
    console.log(`Alert generated for system ${alert.systemId}: ${alert.title}`);
    // Additional alert handling logic
  }

  private handleMetricsUpdated(event: { systemId: string; metrics: RealTimeMetrics }): void {
    console.log(`Metrics updated for system ${event.systemId}`);
    // Additional metrics handling logic
  }

  private handleDataQualityIssue(event: any): void {
    console.log('Data quality issue detected:', event);
    // Handle data quality issues
  }
}

// Export singleton instance
export const solarPerformanceMonitor = new SolarPerformanceMonitor();