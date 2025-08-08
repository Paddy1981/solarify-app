/**
 * Solar Data Ingestion Service
 * Real-time solar energy production data ingestion and processing
 * Handles multiple data sources with quality validation and error handling
 */

import { collection, doc, addDoc, updateDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { errorTracker } from '../../monitoring/error-tracker';
import { COLLECTIONS } from '../../../types/firestore-schema';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface SolarDataSource {
  id: string;
  systemId: string;
  sourceType: 'inverter' | 'monitoring_system' | 'utility_meter' | 'iot_sensor';
  manufacturer: string;
  model: string;
  apiEndpoint?: string;
  apiKey?: string;
  connectionType: 'http' | 'mqtt' | 'modbus' | 'rs485' | 'ethernet';
  dataFormat: 'json' | 'xml' | 'csv' | 'binary';
  pollingInterval: number; // seconds
  lastDataReceived?: Timestamp;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  configuration: Record<string, any>;
}

export interface RealTimeProductionData {
  systemId: string;
  timestamp: Date;
  dcPower: number; // kW
  acPower: number; // kW
  voltage: number; // V
  current: number; // A
  frequency: number; // Hz
  energy: number; // kWh for interval
  efficiency: number; // %
  temperature?: number; // °C
  irradiance?: number; // W/m²
  stringData?: StringLevelData[];
  panelData?: PanelLevelData[];
  alerts?: SystemAlert[];
  dataQuality: DataQualityMetrics;
}

export interface StringLevelData {
  stringId: string;
  dcPower: number;
  dcVoltage: number;
  dcCurrent: number;
  temperature?: number;
  status: 'normal' | 'reduced' | 'offline' | 'fault';
}

export interface PanelLevelData {
  panelId: string;
  serialNumber: string;
  power: number;
  voltage: number;
  current: number;
  temperature?: number;
  status: 'normal' | 'reduced' | 'offline' | 'fault';
  faults?: string[];
}

export interface SystemAlert {
  alertId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  code?: string;
  component?: string;
  firstOccurred: Date;
  lastOccurred: Date;
  count: number;
  acknowledged: boolean;
}

export interface DataQualityMetrics {
  source: 'inverter' | 'monitoring_system' | 'utility_meter' | 'estimated';
  confidence: number; // 0-1
  gaps: boolean;
  interpolated: boolean;
  validated: boolean;
  checksum?: string;
}

export interface IngestionResult {
  success: boolean;
  recordsProcessed: number;
  recordsStored: number;
  recordsRejected: number;
  processingTime: number;
  errors: string[];
  warnings: string[];
}

export interface IngestionConfig {
  batchSize: number;
  maxRetries: number;
  timeoutMs: number;
  validationRules: ValidationRule[];
  qualityThresholds: QualityThresholds;
  aggregationRules: AggregationRule[];
}

export interface ValidationRule {
  field: string;
  type: 'range' | 'required' | 'format' | 'custom';
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: (value: any) => boolean;
  errorMessage: string;
}

export interface QualityThresholds {
  minConfidence: number;
  maxGapDuration: number; // minutes
  temperatureRange: { min: number; max: number };
  powerRange: { min: number; max: number };
  voltageRange: { min: number; max: number };
  frequencyRange: { min: number; max: number };
}

export interface AggregationRule {
  interval: '1min' | '5min' | '15min' | '1hour' | '1day';
  method: 'average' | 'sum' | 'min' | 'max' | 'last';
  fields: string[];
  enabled: boolean;
}

// =====================================================
// SOLAR DATA INGESTION SERVICE
// =====================================================

export class SolarDataIngestionService {
  private config: IngestionConfig;
  private activeSources: Map<string, SolarDataSource> = new Map();
  private ingestionQueues: Map<string, RealTimeProductionData[]> = new Map();
  private processingStatus: Map<string, boolean> = new Map();

  constructor(config?: Partial<IngestionConfig>) {
    this.config = {
      batchSize: 100,
      maxRetries: 3,
      timeoutMs: 30000,
      validationRules: this.getDefaultValidationRules(),
      qualityThresholds: this.getDefaultQualityThresholds(),
      aggregationRules: this.getDefaultAggregationRules(),
      ...config
    };
  }

  /**
   * Initialize data sources for a solar system
   */
  public async initializeDataSources(systemId: string): Promise<void> {
    try {
      errorTracker.addBreadcrumb('Initializing data sources', 'ingestion', { systemId });

      // Get system configuration from Firestore
      const systemQuery = query(
        collection(db, COLLECTIONS.SOLAR_SYSTEMS),
        where('id', '==', systemId),
        limit(1)
      );

      const systemDocs = await getDocs(systemQuery);
      if (systemDocs.empty) {
        throw new Error(`Solar system ${systemId} not found`);
      }

      const systemData = systemDocs.docs[0].data();
      const monitoring = systemData.configuration?.monitoring;

      if (!monitoring) {
        throw new Error(`No monitoring configuration found for system ${systemId}`);
      }

      // Create data source configuration
      const dataSource: SolarDataSource = {
        id: `${systemId}_primary`,
        systemId,
        sourceType: 'monitoring_system',
        manufacturer: monitoring.system,
        model: monitoring.serialNumber,
        connectionType: monitoring.communicationType || 'ethernet',
        dataFormat: 'json',
        pollingInterval: 60, // 1 minute default
        status: 'active',
        configuration: {
          monitoringLevel: monitoring.monitoringLevel,
          communicationType: monitoring.communicationType
        }
      };

      this.activeSources.set(systemId, dataSource);
      this.ingestionQueues.set(systemId, []);
      this.processingStatus.set(systemId, false);

      // Start data collection for this source
      this.startDataCollection(systemId);

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      throw error;
    }
  }

  /**
   * Ingest real-time production data
   */
  public async ingestProductionData(
    systemId: string,
    data: RealTimeProductionData[]
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsStored = 0;
    let recordsRejected = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      errorTracker.addBreadcrumb('Starting data ingestion', 'ingestion', {
        systemId,
        recordCount: data.length
      });

      // Validate system exists
      if (!this.activeSources.has(systemId)) {
        throw new Error(`System ${systemId} not initialized for data ingestion`);
      }

      // Process data in batches
      const batches = this.createBatches(data, this.config.batchSize);

      for (const batch of batches) {
        const batchResult = await this.processBatch(systemId, batch);
        
        recordsProcessed += batchResult.recordsProcessed;
        recordsStored += batchResult.recordsStored;
        recordsRejected += batchResult.recordsRejected;
        errors.push(...batchResult.errors);
        warnings.push(...batchResult.warnings);
      }

      // Update last data received timestamp
      const source = this.activeSources.get(systemId);
      if (source) {
        source.lastDataReceived = Timestamp.now();
        await this.updateDataSourceStatus(systemId, source);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: errors.length === 0,
        recordsProcessed,
        recordsStored,
        recordsRejected,
        processingTime,
        errors,
        warnings
      };

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId, recordCount: data.length });
      return {
        success: false,
        recordsProcessed,
        recordsStored,
        recordsRejected,
        processingTime: Date.now() - startTime,
        errors: [...errors, (error as Error).message],
        warnings
      };
    }
  }

  /**
   * Process single batch of production data
   */
  private async processBatch(
    systemId: string,
    batch: RealTimeProductionData[]
  ): Promise<IngestionResult> {
    let recordsProcessed = 0;
    let recordsStored = 0;
    let recordsRejected = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate and clean data
      const validatedBatch = batch.map(record => {
        recordsProcessed++;
        
        const validation = this.validateProductionData(record);
        if (!validation.isValid) {
          recordsRejected++;
          errors.push(`Record rejected: ${validation.errors.join(', ')}`);
          return null;
        }

        if (validation.warnings.length > 0) {
          warnings.push(...validation.warnings);
        }

        return this.enrichProductionData(record);
      }).filter(Boolean) as RealTimeProductionData[];

      // Store valid records
      for (const record of validatedBatch) {
        try {
          await this.storeProductionRecord(systemId, record);
          recordsStored++;
        } catch (error) {
          recordsRejected++;
          errors.push(`Storage failed: ${(error as Error).message}`);
        }
      }

      // Create aggregated records
      await this.createAggregatedRecords(systemId, validatedBatch);

      return {
        success: errors.length === 0,
        recordsProcessed,
        recordsStored,
        recordsRejected,
        processingTime: 0,
        errors,
        warnings
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate production data record
   */
  private validateProductionData(data: RealTimeProductionData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Apply validation rules
    for (const rule of this.config.validationRules) {
      const value = this.getNestedValue(data, rule.field);
      
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null) {
            errors.push(`${rule.field} is required`);
          }
          break;
          
        case 'range':
          if (typeof value === 'number') {
            if (rule.min !== undefined && value < rule.min) {
              errors.push(`${rule.field} below minimum: ${value} < ${rule.min}`);
            }
            if (rule.max !== undefined && value > rule.max) {
              errors.push(`${rule.field} above maximum: ${value} > ${rule.max}`);
            }
          }
          break;
          
        case 'format':
          if (rule.pattern && typeof value === 'string') {
            const regex = new RegExp(rule.pattern);
            if (!regex.test(value)) {
              errors.push(`${rule.field} format invalid: ${value}`);
            }
          }
          break;
          
        case 'custom':
          if (rule.customValidator && !rule.customValidator(value)) {
            errors.push(rule.errorMessage || `${rule.field} validation failed`);
          }
          break;
      }
    }

    // Quality threshold checks
    const thresholds = this.config.qualityThresholds;
    
    if (data.dataQuality.confidence < thresholds.minConfidence) {
      warnings.push(`Low data confidence: ${data.dataQuality.confidence}`);
    }

    if (data.temperature !== undefined) {
      if (data.temperature < thresholds.temperatureRange.min || 
          data.temperature > thresholds.temperatureRange.max) {
        warnings.push(`Temperature out of expected range: ${data.temperature}°C`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Enrich production data with calculated metrics
   */
  private enrichProductionData(data: RealTimeProductionData): RealTimeProductionData {
    const enriched = { ...data };

    // Calculate efficiency if not provided
    if (!enriched.efficiency && enriched.dcPower > 0 && enriched.acPower > 0) {
      enriched.efficiency = (enriched.acPower / enriched.dcPower) * 100;
    }

    // Add performance ratio if irradiance is available
    if (enriched.irradiance && enriched.irradiance > 0) {
      const expectedPower = (enriched.irradiance / 1000) * enriched.dcPower;
      if (expectedPower > 0) {
        enriched.dataQuality = {
          ...enriched.dataQuality,
          performanceRatio: enriched.acPower / expectedPower
        } as any;
      }
    }

    // Mark as validated
    enriched.dataQuality.validated = true;

    return enriched;
  }

  /**
   * Store production record in Firestore
   */
  private async storeProductionRecord(
    systemId: string,
    data: RealTimeProductionData
  ): Promise<void> {
    try {
      const record = {
        systemId: data.systemId,
        timestamp: Timestamp.fromDate(data.timestamp),
        interval: '1min' as const,
        production: {
          dcPower: data.dcPower,
          acPower: data.acPower,
          energy: data.energy,
          voltage: data.voltage,
          current: data.current,
          frequency: data.frequency
        },
        environmental: data.irradiance ? {
          irradiance: data.irradiance,
          ambientTemp: data.temperature,
        } : undefined,
        performance: {
          efficiency: data.efficiency,
          performanceRatio: (data.dataQuality as any).performanceRatio || 0,
          specificYield: data.energy / (data.dcPower || 1),
          capacityFactor: data.acPower / (data.dcPower || 1) * 100
        },
        status: {
          operationalStatus: 'normal' as const,
          faults: [],
          alerts: data.alerts?.map(alert => alert.message) || []
        },
        stringData: data.stringData,
        panelData: data.panelData,
        dataQuality: data.dataQuality,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, COLLECTIONS.ENERGY_PRODUCTION), record);

    } catch (error) {
      throw new Error(`Failed to store production record: ${(error as Error).message}`);
    }
  }

  /**
   * Create aggregated records for different time intervals
   */
  private async createAggregatedRecords(
    systemId: string,
    records: RealTimeProductionData[]
  ): Promise<void> {
    try {
      for (const rule of this.config.aggregationRules) {
        if (!rule.enabled) continue;

        const aggregated = this.aggregateRecords(records, rule);
        if (aggregated.length > 0) {
          await this.storeAggregatedRecords(systemId, aggregated, rule.interval);
        }
      }
    } catch (error) {
      errorTracker.captureException(error as Error, { systemId, recordCount: records.length });
    }
  }

  /**
   * Aggregate records based on rule
   */
  private aggregateRecords(
    records: RealTimeProductionData[],
    rule: AggregationRule
  ): any[] {
    // Group records by time interval
    const groups = new Map<string, RealTimeProductionData[]>();

    for (const record of records) {
      const timeKey = this.getTimeKey(record.timestamp, rule.interval);
      if (!groups.has(timeKey)) {
        groups.set(timeKey, []);
      }
      groups.get(timeKey)!.push(record);
    }

    // Aggregate each group
    const aggregated = [];
    for (const [timeKey, groupRecords] of groups) {
      const aggregateRecord = this.aggregateGroup(groupRecords, rule);
      aggregateRecord.timeKey = timeKey;
      aggregated.push(aggregateRecord);
    }

    return aggregated;
  }

  /**
   * Aggregate a group of records
   */
  private aggregateGroup(records: RealTimeProductionData[], rule: AggregationRule): any {
    const aggregated: any = {
      timestamp: records[0].timestamp,
      recordCount: records.length
    };

    for (const field of rule.fields) {
      const values = records.map(record => this.getNestedValue(record, field))
                           .filter(value => value !== undefined && value !== null);

      if (values.length === 0) continue;

      switch (rule.method) {
        case 'average':
          aggregated[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'sum':
          aggregated[field] = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'min':
          aggregated[field] = Math.min(...values);
          break;
        case 'max':
          aggregated[field] = Math.max(...values);
          break;
        case 'last':
          aggregated[field] = values[values.length - 1];
          break;
      }
    }

    return aggregated;
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private startDataCollection(systemId: string): void {
    // Implementation for starting real-time data collection
    // This would integrate with actual monitoring systems
  }

  private async updateDataSourceStatus(systemId: string, source: SolarDataSource): Promise<void> {
    // Update data source status in database
  }

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getTimeKey(timestamp: Date, interval: string): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();

    switch (interval) {
      case '1min':
        return `${year}-${month}-${day}-${hour}-${minute}`;
      case '5min':
        return `${year}-${month}-${day}-${hour}-${Math.floor(minute / 5) * 5}`;
      case '15min':
        return `${year}-${month}-${day}-${hour}-${Math.floor(minute / 15) * 15}`;
      case '1hour':
        return `${year}-${month}-${day}-${hour}`;
      case '1day':
        return `${year}-${month}-${day}`;
      default:
        return timestamp.toISOString();
    }
  }

  private async storeAggregatedRecords(
    systemId: string,
    records: any[],
    interval: string
  ): Promise<void> {
    // Store aggregated records in appropriate collection
  }

  // =====================================================
  // DEFAULT CONFIGURATIONS
  // =====================================================

  private getDefaultValidationRules(): ValidationRule[] {
    return [
      {
        field: 'systemId',
        type: 'required',
        errorMessage: 'System ID is required'
      },
      {
        field: 'timestamp',
        type: 'required',
        errorMessage: 'Timestamp is required'
      },
      {
        field: 'dcPower',
        type: 'range',
        min: 0,
        max: 1000,
        errorMessage: 'DC power out of range'
      },
      {
        field: 'acPower',
        type: 'range',
        min: 0,
        max: 1000,
        errorMessage: 'AC power out of range'
      },
      {
        field: 'voltage',
        type: 'range',
        min: 0,
        max: 1000,
        errorMessage: 'Voltage out of range'
      },
      {
        field: 'frequency',
        type: 'range',
        min: 45,
        max: 65,
        errorMessage: 'Frequency out of range'
      }
    ];
  }

  private getDefaultQualityThresholds(): QualityThresholds {
    return {
      minConfidence: 0.8,
      maxGapDuration: 15, // 15 minutes
      temperatureRange: { min: -30, max: 80 },
      powerRange: { min: 0, max: 1000 },
      voltageRange: { min: 0, max: 1000 },
      frequencyRange: { min: 45, max: 65 }
    };
  }

  private getDefaultAggregationRules(): AggregationRule[] {
    return [
      {
        interval: '15min',
        method: 'average',
        fields: ['dcPower', 'acPower', 'voltage', 'current', 'efficiency'],
        enabled: true
      },
      {
        interval: '1hour',
        method: 'average',
        fields: ['dcPower', 'acPower', 'voltage', 'current', 'efficiency'],
        enabled: true
      },
      {
        interval: '1hour',
        method: 'sum',
        fields: ['energy'],
        enabled: true
      },
      {
        interval: '1day',
        method: 'sum',
        fields: ['energy'],
        enabled: true
      }
    ];
  }
}

// Export singleton instance
export const solarDataIngestionService = new SolarDataIngestionService();