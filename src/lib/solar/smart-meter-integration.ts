/**
 * Smart Meter Data Integration and Real-Time Monitoring System
 * 
 * Comprehensive system for integrating with smart meters, collecting real-time
 * energy data, and providing monitoring capabilities for solar installations
 */

import { utilityProviderDatabase } from './utility-provider-database';
import { netMeteringEngine } from './net-metering-engine';
import { logger } from '../error-handling/logger';

// Types and Interfaces

export interface SmartMeterReading {
  id: string;
  meterId: string;
  customerId: string;
  timestamp: Date;
  intervalMinutes: number;
  readings: {
    energyDelivered: number; // kWh imported from grid
    energyReceived: number; // kWh exported to grid
    realPowerDelivered: number; // kW imported (instantaneous)
    realPowerReceived: number; // kW exported (instantaneous)
    voltage: number; // Volts
    current: number; // Amps
    powerFactor: number;
    frequency: number; // Hz
  };
  quality: {
    signalStrength: number;
    errorCount: number;
    dataComplete: boolean;
  };
  channels?: { // Multi-channel meters
    [channelId: string]: {
      energyDelivered: number;
      energyReceived: number;
      realPower: number;
    };
  };
}

export interface MeterConfiguration {
  id: string;
  customerId: string;
  utilityId: string;
  meterSerialNumber: string;
  meterType: 'net' | 'production' | 'consumption' | 'bi-directional';
  communicationProtocol: 'AMI' | 'ZigBee' | 'WiFi' | 'Cellular' | 'PLC' | 'RF_Mesh';
  dataFormat: 'Green_Button' | 'ANSI_C12.19' | 'IEC_62056' | 'DLMS_COSEM';
  intervalMinutes: number; // Data collection interval
  timezone: string;
  location: {
    description: string;
    coordinates?: { lat: number; lng: number };
  };
  capabilities: {
    realTimeData: boolean;
    historicalData: boolean;
    demandData: boolean;
    powerQuality: boolean;
    outageDetection: boolean;
    tamperDetection: boolean;
  };
  credentials?: {
    apiKey?: string;
    username?: string;
    password?: string;
    certificate?: string;
  };
  lastSyncTime?: Date;
  isActive: boolean;
}

export interface RealTimeMonitoringSession {
  id: string;
  customerId: string;
  meterIds: string[];
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'stopped' | 'error';
  dataPoints: SmartMeterReading[];
  alerts: MonitoringAlert[];
  configuration: {
    updateInterval: number; // seconds
    alertThresholds: AlertThreshold[];
    dataRetention: number; // days
  };
}

export interface MonitoringAlert {
  id: string;
  sessionId: string;
  type: 'high_usage' | 'power_outage' | 'reverse_power_flow' | 'meter_offline' | 'data_quality' | 'system_fault';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  meterReading?: SmartMeterReading;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertThreshold {
  type: string;
  parameter: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'range';
  value: number | string;
  secondaryValue?: number; // For range conditions
  enabled: boolean;
}

export interface EnergyFlowAnalysis {
  timestamp: Date;
  timeRange: { start: Date; end: Date };
  totalProduction: number;
  totalConsumption: number;
  netExport: number;
  netImport: number;
  selfConsumption: number;
  selfConsumptionRate: number; // %
  exportRate: number; // %
  peakDemand: {
    import: { value: number; timestamp: Date };
    export: { value: number; timestamp: Date };
  };
  averagePowerFactor: number;
  totalHarmonics: number;
  systemEfficiency: number;
  patterns: {
    dailyProfile: { hour: number; avgProduction: number; avgConsumption: number }[];
    weeklyPattern: { day: string; totalProduction: number; totalConsumption: number }[];
    monthlyTrend: { month: string; production: number; consumption: number; netFlow: number }[];
  };
}

export interface GreenButtonData {
  id: string;
  customerId: string;
  utilityId: string;
  downloadUrl?: string;
  xmlContent?: string;
  parsedData: {
    serviceCategory: string;
    readingType: {
      accumulationBehaviour: string;
      commodity: string;
      dataQualifier: string;
      defaultQuality: string;
      flowDirection: string;
      intervalLength: number;
      kind: string;
      phase: string;
      powerOfTenMultiplier: number;
      timeAttribute: string;
      uom: string; // Unit of measure
    };
    intervalBlocks: {
      start: Date;
      duration: number;
      intervalReadings: {
        cost?: number;
        value: number;
        readingQuality?: string;
        timePeriod: { duration: number; start: Date };
      }[];
    }[];
  };
  downloadedAt: Date;
  processedAt?: Date;
}

// Green Button XML Parser Class

class GreenButtonParser {
  parseXML(xmlContent: string): GreenButtonData['parsedData'] {
    // This would implement full Green Button XML parsing
    // For now, returning a basic structure
    return {
      serviceCategory: 'electricity',
      readingType: {
        accumulationBehaviour: 'deltaData',
        commodity: 'electricity',
        dataQualifier: 'normal',
        defaultQuality: 'valid',
        flowDirection: 'forward',
        intervalLength: 3600,
        kind: 'energy',
        phase: 'total',
        powerOfTenMultiplier: 0,
        timeAttribute: 'none',
        uom: 'Wh'
      },
      intervalBlocks: []
    };
  }

  convertToMeterReadings(
    greenButtonData: GreenButtonData, 
    meterConfig: MeterConfiguration
  ): SmartMeterReading[] {
    const readings: SmartMeterReading[] = [];

    greenButtonData.parsedData.intervalBlocks.forEach(block => {
      block.intervalReadings.forEach(reading => {
        const meterReading: SmartMeterReading = {
          id: this.generateId(),
          meterId: meterConfig.id,
          customerId: meterConfig.customerId,
          timestamp: reading.timePeriod.start,
          intervalMinutes: reading.timePeriod.duration / 60,
          readings: {
            energyDelivered: reading.value,
            energyReceived: 0, // Would be calculated from flow direction
            realPowerDelivered: 0,
            realPowerReceived: 0,
            voltage: 240, // Default values - would be from actual data
            current: 0,
            powerFactor: 1.0,
            frequency: 60
          },
          quality: {
            signalStrength: 100,
            errorCount: 0,
            dataComplete: true
          }
        };

        readings.push(meterReading);
      });
    });

    return readings;
  }

  private generateId(): string {
    return `gb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Main Smart Meter Integration Class

class SmartMeterIntegration {
  private meterConfigs: Map<string, MeterConfiguration> = new Map();
  private activeSessions: Map<string, RealTimeMonitoringSession> = new Map();
  private meterReadings: Map<string, SmartMeterReading[]> = new Map();
  private greenButtonParser: GreenButtonParser;

  constructor() {
    this.greenButtonParser = new GreenButtonParser();
    this.initializeIntegrations();
  }

  // Meter Configuration Management

  async registerMeter(config: Omit<MeterConfiguration, 'id'>): Promise<MeterConfiguration> {
    const id = this.generateId();
    const meterConfig: MeterConfiguration = {
      ...config,
      id
    };

    this.meterConfigs.set(id, meterConfig);

    // Initialize readings storage
    this.meterReadings.set(id, []);

    // Test connection
    await this.testMeterConnection(meterConfig);

    return meterConfig;
  }

  async updateMeterConfiguration(
    meterId: string, 
    updates: Partial<MeterConfiguration>
  ): Promise<MeterConfiguration | null> {
    const config = this.meterConfigs.get(meterId);
    if (!config) return null;

    const updatedConfig = { ...config, ...updates };
    this.meterConfigs.set(meterId, updatedConfig);

    return updatedConfig;
  }

  getMeterConfiguration(meterId: string): MeterConfiguration | null {
    return this.meterConfigs.get(meterId) || null;
  }

  getCustomerMeters(customerId: string): MeterConfiguration[] {
    return Array.from(this.meterConfigs.values())
      .filter(config => config.customerId === customerId);
  }

  // Data Collection

  async collectMeterReading(meterId: string): Promise<SmartMeterReading | null> {
    const config = this.meterConfigs.get(meterId);
    if (!config || !config.isActive) return null;

    try {
      const reading = await this.fetchMeterData(config);
      
      // Store reading
      const readings = this.meterReadings.get(meterId) || [];
      readings.push(reading);
      
      // Keep only recent readings (configurable retention)
      const retentionDays = 30;
      const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
      const filteredReadings = readings.filter(r => r.timestamp >= cutoffDate);
      
      this.meterReadings.set(meterId, filteredReadings);

      // Update last sync time
      config.lastSyncTime = new Date();
      this.meterConfigs.set(meterId, config);

      return reading;
    } catch (error) {
      logger.error('Failed to collect meter reading', {
        context: 'solar_system',
        operation: 'collect_meter_reading',
        meterId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  async collectMultipleMeterReadings(meterIds: string[]): Promise<SmartMeterReading[]> {
    const readings: SmartMeterReading[] = [];
    
    const promises = meterIds.map(async (meterId) => {
      const reading = await this.collectMeterReading(meterId);
      if (reading) readings.push(reading);
    });

    await Promise.all(promises);
    return readings;
  }

  async getHistoricalReadings(
    meterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SmartMeterReading[]> {
    const readings = this.meterReadings.get(meterId) || [];
    
    return readings.filter(reading =>
      reading.timestamp >= startDate && reading.timestamp <= endDate
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Real-Time Monitoring

  async startRealTimeMonitoring(
    customerId: string,
    meterIds: string[],
    configuration: RealTimeMonitoringSession['configuration']
  ): Promise<RealTimeMonitoringSession> {
    const sessionId = this.generateId();
    const session: RealTimeMonitoringSession = {
      id: sessionId,
      customerId,
      meterIds,
      startTime: new Date(),
      status: 'active',
      dataPoints: [],
      alerts: [],
      configuration
    };

    this.activeSessions.set(sessionId, session);

    // Start data collection interval
    this.scheduleDataCollection(session);

    return session;
  }

  async stopRealTimeMonitoring(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    session.status = 'stopped';
    session.endTime = new Date();

    return true;
  }

  getActiveMonitoringSessions(customerId: string): RealTimeMonitoringSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => 
        session.customerId === customerId && 
        session.status === 'active'
      );
  }

  getMonitoringSession(sessionId: string): RealTimeMonitoringSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  // Energy Flow Analysis

  async analyzeEnergyFlow(
    meterIds: string[],
    timeRange: { start: Date; end: Date }
  ): Promise<EnergyFlowAnalysis> {
    const allReadings: SmartMeterReading[] = [];

    // Collect readings from all meters
    for (const meterId of meterIds) {
      const readings = await this.getHistoricalReadings(
        meterId,
        timeRange.start,
        timeRange.end
      );
      allReadings.push(...readings);
    }

    // Sort by timestamp
    allReadings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate energy flows
    const totalProduction = allReadings
      .filter(r => this.isProductionMeter(r.meterId))
      .reduce((sum, r) => sum + r.readings.energyReceived, 0);

    const totalConsumption = allReadings
      .filter(r => this.isConsumptionMeter(r.meterId))
      .reduce((sum, r) => sum + r.readings.energyDelivered, 0);

    const netExport = allReadings
      .reduce((sum, r) => sum + r.readings.energyReceived, 0);

    const netImport = allReadings
      .reduce((sum, r) => sum + r.readings.energyDelivered, 0);

    const selfConsumption = Math.max(0, totalProduction - netExport);
    const selfConsumptionRate = totalProduction > 0 ? (selfConsumption / totalProduction) * 100 : 0;
    const exportRate = totalProduction > 0 ? (netExport / totalProduction) * 100 : 0;

    // Find peak demand
    const sortedByImport = [...allReadings].sort((a, b) => b.readings.realPowerDelivered - a.readings.realPowerDelivered);
    const sortedByExport = [...allReadings].sort((a, b) => b.readings.realPowerReceived - a.readings.realPowerReceived);

    const peakDemand = {
      import: {
        value: sortedByImport[0]?.readings.realPowerDelivered || 0,
        timestamp: sortedByImport[0]?.timestamp || new Date()
      },
      export: {
        value: sortedByExport[0]?.readings.realPowerReceived || 0,
        timestamp: sortedByExport[0]?.timestamp || new Date()
      }
    };

    // Calculate patterns
    const patterns = this.calculateEnergyPatterns(allReadings);

    // Calculate system metrics
    const averagePowerFactor = allReadings.length > 0 ?
      allReadings.reduce((sum, r) => sum + r.readings.powerFactor, 0) / allReadings.length : 1.0;

    const systemEfficiency = totalConsumption > 0 ?
      (selfConsumption / totalConsumption) * 100 : 0;

    return {
      timestamp: new Date(),
      timeRange,
      totalProduction,
      totalConsumption,
      netExport,
      netImport,
      selfConsumption,
      selfConsumptionRate,
      exportRate,
      peakDemand,
      averagePowerFactor,
      totalHarmonics: 0, // Would calculate from power quality data
      systemEfficiency,
      patterns
    };
  }

  // Green Button Integration

  async downloadGreenButtonData(
    customerId: string,
    utilityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<GreenButtonData | null> {
    try {
      // This would integrate with actual Green Button API
      const provider = utilityProviderDatabase.getProviderById(utilityId);
      if (!provider?.apiIntegration?.greenButtonUrl) {
        throw new Error('Green Button not supported for this utility');
      }

      // Simulate API call
      const mockXmlContent = this.generateMockGreenButtonXML(startDate, endDate);

      const greenButtonData: GreenButtonData = {
        id: this.generateId(),
        customerId,
        utilityId,
        downloadUrl: `${provider.apiIntegration.greenButtonUrl}/download`,
        xmlContent: mockXmlContent,
        parsedData: this.greenButtonParser.parseXML(mockXmlContent),
        downloadedAt: new Date()
      };

      return greenButtonData;
    } catch (error) {
      logger.error('Green Button download failed', {
        context: 'solar_system',
        operation: 'download_green_button',
        customerId,
        utilityId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  async convertGreenButtonToReadings(
    greenButtonData: GreenButtonData
  ): Promise<SmartMeterReading[]> {
    const meterConfig = Array.from(this.meterConfigs.values())
      .find(config => config.customerId === greenButtonData.customerId);

    if (!meterConfig) {
      throw new Error('No meter configuration found for customer');
    }

    return this.greenButtonParser.convertToMeterReadings(greenButtonData, meterConfig);
  }

  // Alert Management

  private async checkAlertThresholds(
    session: RealTimeMonitoringSession,
    readings: SmartMeterReading[]
  ): Promise<void> {
    for (const reading of readings) {
      for (const threshold of session.configuration.alertThresholds) {
        if (!threshold.enabled) continue;

        const alert = this.evaluateThreshold(reading, threshold);
        if (alert) {
          alert.sessionId = session.id;
          session.alerts.push(alert);
          
          // Send notification
          await this.sendAlert(alert);
        }
      }
    }
  }

  private evaluateThreshold(
    reading: SmartMeterReading,
    threshold: AlertThreshold
  ): MonitoringAlert | null {
    let value: any;
    
    // Get value based on parameter
    switch (threshold.parameter) {
      case 'energyDelivered':
        value = reading.readings.energyDelivered;
        break;
      case 'energyReceived':
        value = reading.readings.energyReceived;
        break;
      case 'realPowerDelivered':
        value = reading.readings.realPowerDelivered;
        break;
      case 'realPowerReceived':
        value = reading.readings.realPowerReceived;
        break;
      default:
        return null;
    }

    // Check condition
    let triggered = false;
    switch (threshold.condition) {
      case 'greater_than':
        triggered = value > threshold.value;
        break;
      case 'less_than':
        triggered = value < threshold.value;
        break;
      case 'equals':
        triggered = value === threshold.value;
        break;
      case 'not_equals':
        triggered = value !== threshold.value;
        break;
      case 'range':
        triggered = threshold.secondaryValue !== undefined &&
                   value >= threshold.value && value <= threshold.secondaryValue;
        break;
    }

    if (triggered) {
      return {
        id: this.generateId(),
        sessionId: '', // Will be set by caller
        type: this.getAlertType(threshold.type),
        severity: 'medium',
        title: `${threshold.parameter} threshold exceeded`,
        message: `${threshold.parameter} value ${value} ${threshold.condition} ${threshold.value}`,
        timestamp: reading.timestamp,
        meterReading: reading,
        resolved: false
      };
    }

    return null;
  }

  private getAlertType(thresholdType: string): MonitoringAlert['type'] {
    switch (thresholdType) {
      case 'high_power': return 'high_usage';
      case 'reverse_flow': return 'reverse_power_flow';
      case 'meter_error': return 'data_quality';
      default: return 'system_fault';
    }
  }

  private async sendAlert(alert: MonitoringAlert): Promise<void> {
    // Implementation would send actual notifications
    logger.warn('Monitoring alert generated', {
      context: 'solar_system',
      operation: 'send_alert',
      alertType: alert.type,
      alertSeverity: alert.severity,
      alertTitle: alert.title,
      alertMessage: alert.message,
      sessionId: alert.sessionId
    });
  }

  // Private Helper Methods

  private async fetchMeterData(config: MeterConfiguration): Promise<SmartMeterReading> {
    // This would implement actual meter communication
    // For now, generating mock data
    return this.generateMockReading(config);
  }

  private generateMockReading(config: MeterConfiguration): SmartMeterReading {
    const now = new Date();
    
    // Generate realistic values based on meter type
    let energyDelivered = 0, energyReceived = 0, realPowerDelivered = 0, realPowerReceived = 0;
    
    if (config.meterType === 'net' || config.meterType === 'bi-directional') {
      // Simulate net metering with solar
      const hour = now.getHours();
      const isDaytime = hour >= 6 && hour <= 18;
      
      if (isDaytime) {
        // Solar production during day
        energyReceived = Math.random() * 5; // kWh export
        realPowerReceived = Math.random() * 8; // kW export
        energyDelivered = Math.random() * 1; // kWh import (minimal)
        realPowerDelivered = Math.random() * 2; // kW import
      } else {
        // No solar at night
        energyDelivered = Math.random() * 3; // kWh import
        realPowerDelivered = Math.random() * 4; // kW import
      }
    }

    return {
      id: this.generateId(),
      meterId: config.id,
      customerId: config.customerId,
      timestamp: now,
      intervalMinutes: config.intervalMinutes,
      readings: {
        energyDelivered,
        energyReceived,
        realPowerDelivered,
        realPowerReceived,
        voltage: 240 + (Math.random() - 0.5) * 10,
        current: (realPowerDelivered + realPowerReceived) / 240,
        powerFactor: 0.95 + Math.random() * 0.05,
        frequency: 60 + (Math.random() - 0.5) * 0.1
      },
      quality: {
        signalStrength: 80 + Math.random() * 20,
        errorCount: Math.floor(Math.random() * 3),
        dataComplete: Math.random() > 0.05
      }
    };
  }

  private async testMeterConnection(config: MeterConfiguration): Promise<boolean> {
    // This would test actual meter connectivity
    logger.info('Testing meter connection', {
      context: 'solar_system',
      operation: 'test_meter_connection',
      meterSerialNumber: config.meterSerialNumber,
      meterType: config.meterType,
      communicationProtocol: config.communicationProtocol
    });
    return true;
  }

  private isProductionMeter(meterId: string): boolean {
    const config = this.meterConfigs.get(meterId);
    return config?.meterType === 'production';
  }

  private isConsumptionMeter(meterId: string): boolean {
    const config = this.meterConfigs.get(meterId);
    return config?.meterType === 'consumption';
  }

  private calculateEnergyPatterns(readings: SmartMeterReading[]) {
    // Calculate daily profile
    const dailyProfile = Array.from({ length: 24 }, (_, hour) => {
      const hourReadings = readings.filter(r => r.timestamp.getHours() === hour);
      const avgProduction = hourReadings.length > 0 ?
        hourReadings.reduce((sum, r) => sum + r.readings.energyReceived, 0) / hourReadings.length : 0;
      const avgConsumption = hourReadings.length > 0 ?
        hourReadings.reduce((sum, r) => sum + r.readings.energyDelivered, 0) / hourReadings.length : 0;
      
      return { hour, avgProduction, avgConsumption };
    });

    // Calculate weekly pattern
    const weeklyPattern = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      .map((day, index) => {
        const dayReadings = readings.filter(r => r.timestamp.getDay() === index);
        const totalProduction = dayReadings.reduce((sum, r) => sum + r.readings.energyReceived, 0);
        const totalConsumption = dayReadings.reduce((sum, r) => sum + r.readings.energyDelivered, 0);
        
        return { day, totalProduction, totalConsumption };
      });

    // Calculate monthly trend (simplified)
    const monthlyTrend = [
      { month: 'Current', production: 0, consumption: 0, netFlow: 0 }
    ];

    return { dailyProfile, weeklyPattern, monthlyTrend };
  }

  private scheduleDataCollection(session: RealTimeMonitoringSession): void {
    const interval = setInterval(async () => {
      if (session.status !== 'active') {
        clearInterval(interval);
        return;
      }

      try {
        const readings = await this.collectMultipleMeterReadings(session.meterIds);
        session.dataPoints.push(...readings);

        // Check alert thresholds
        await this.checkAlertThresholds(session, readings);

        // Limit data points to prevent memory issues
        if (session.dataPoints.length > 1000) {
          session.dataPoints = session.dataPoints.slice(-1000);
        }
      } catch (error) {
        logger.error('Data collection error during monitoring session', {
          context: 'solar_system',
          operation: 'data_collection',
          sessionId: session.id,
          error: error instanceof Error ? error.message : String(error)
        });
        session.status = 'error';
      }
    }, session.configuration.updateInterval * 1000);
  }

  private generateMockGreenButtonXML(startDate: Date, endDate: Date): string {
    // This would generate valid Green Button XML
    return `<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <!-- Mock Green Button XML data -->
    </feed>`;
  }

  private initializeIntegrations(): void {
    // Initialize integrations with utility AMI systems
    logger.info('Smart meter integrations initialized', {
      context: 'solar_system',
      operation: 'initialize_integrations'
    });
  }

  private generateId(): string {
    return `meter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API Methods

  getMeterReadings(meterId: string, limit: number = 100): SmartMeterReading[] {
    const readings = this.meterReadings.get(meterId) || [];
    return readings.slice(-limit).reverse(); // Most recent first
  }

  getAllActiveMeters(): MeterConfiguration[] {
    return Array.from(this.meterConfigs.values()).filter(config => config.isActive);
  }

  getSystemStatus(): {
    totalMeters: number;
    activeMeters: number;
    activeSessions: number;
    totalReadings: number;
  } {
    const totalReadings = Array.from(this.meterReadings.values())
      .reduce((sum, readings) => sum + readings.length, 0);

    return {
      totalMeters: this.meterConfigs.size,
      activeMeters: Array.from(this.meterConfigs.values()).filter(c => c.isActive).length,
      activeSessions: Array.from(this.activeSessions.values()).filter(s => s.status === 'active').length,
      totalReadings
    };
  }
}

// Export singleton instance
export const smartMeterIntegration = new SmartMeterIntegration();