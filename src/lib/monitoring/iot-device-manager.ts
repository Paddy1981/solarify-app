/**
 * IoT Device Manager
 * Comprehensive device integration and data collection system for solar monitoring
 */

import { collection, doc, onSnapshot, updateDoc, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../../types/firestore-schema';
import { errorTracker } from './error-tracker';
import { EventEmitter } from 'events';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface IoTDevice {
  id: string;
  systemId: string;
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  firmware: string;
  location: {
    latitude: number;
    longitude: number;
    description: string;
  };
  configuration: DeviceConfiguration;
  status: DeviceStatus;
  lastCommunication: Date;
  communicationProtocol: CommunicationProtocol;
  dataStreams: DataStream[];
  calibration: CalibrationData;
  maintenance: MaintenanceInfo;
  createdAt: Date;
  updatedAt: Date;
}

export type DeviceType = 
  | 'inverter'
  | 'power_meter'
  | 'weather_station'
  | 'irradiance_sensor'
  | 'temperature_sensor'
  | 'string_monitor'
  | 'panel_optimizer'
  | 'battery_monitor'
  | 'grid_tie_meter'
  | 'consumption_meter'
  | 'monitoring_gateway'
  | 'data_logger';

export interface DeviceConfiguration {
  samplingRate: number; // seconds
  dataRetention: number; // days
  alarmThresholds: Record<string, AlarmThreshold>;
  communicationSettings: CommunicationSettings;
  calibrationParameters: Record<string, number>;
  operationalLimits: OperationalLimits;
}

export interface AlarmThreshold {
  metric: string;
  minValue?: number;
  maxValue?: number;
  warningLevel: number;
  criticalLevel: number;
  enabled: boolean;
}

export interface CommunicationSettings {
  ip?: string;
  port?: number;
  protocol: CommunicationProtocol;
  encryption: boolean;
  authRequired: boolean;
  pollInterval: number;
  timeout: number;
  retryAttempts: number;
}

export type CommunicationProtocol = 
  | 'modbus_tcp'
  | 'modbus_rtu'
  | 'sunspec'
  | 'solarlog'
  | 'fronius'
  | 'sma'
  | 'enphase'
  | 'solaredge'
  | 'mqtt'
  | 'http_api'
  | 'websocket'
  | 'snmp';

export interface OperationalLimits {
  temperatureMin: number;
  temperatureMax: number;
  humidityMax: number;
  voltageMin: number;
  voltageMax: number;
  currentMax: number;
  powerMax: number;
}

export type DeviceStatus = 
  | 'online'
  | 'offline'
  | 'error'
  | 'maintenance'
  | 'commissioning'
  | 'decommissioned'
  | 'unknown';

export interface DataStream {
  name: string;
  unit: string;
  type: 'measurement' | 'status' | 'alarm';
  frequency: number; // Hz
  precision: number;
  range: {
    min: number;
    max: number;
  };
  lastValue?: number;
  lastTimestamp?: Date;
}

export interface CalibrationData {
  lastCalibrated: Date;
  nextCalibration: Date;
  calibrationFactor: number;
  offset: number;
  accuracy: number; // %
  certified: boolean;
  calibratedBy: string;
}

export interface MaintenanceInfo {
  lastMaintenance: Date;
  nextMaintenance: Date;
  maintenanceInterval: number; // days
  warrantyExpiry: Date;
  serviceProvider: string;
  maintenanceHistory: MaintenanceRecord[];
}

export interface MaintenanceRecord {
  date: Date;
  type: 'preventive' | 'corrective' | 'calibration';
  description: string;
  performedBy: string;
  partsReplaced: string[];
  cost: number;
  downtime: number; // hours
}

export interface DeviceDataPoint {
  deviceId: string;
  timestamp: Date;
  measurements: Record<string, number>;
  status: Record<string, string>;
  alarms: Alarm[];
  quality: DataQuality;
}

export interface Alarm {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface DataQuality {
  overall: number; // 0-1
  completeness: number;
  accuracy: number;
  timeliness: number;
  consistency: number;
  outliers: number;
  interpolated: boolean;
}

export interface ThirdPartyAPIConfig {
  provider: string;
  apiKey: string;
  endpoint: string;
  rateLimit: number;
  authType: 'api_key' | 'oauth' | 'basic' | 'token';
  refreshToken?: string;
  lastSync?: Date;
  syncInterval: number; // minutes
}

// =====================================================
// IOT DEVICE MANAGER CLASS
// =====================================================

export class IoTDeviceManager extends EventEmitter {
  private devices: Map<string, IoTDevice> = new Map();
  private deviceConnections: Map<string, any> = new Map();
  private dataStreamSubscriptions: Map<string, () => void> = new Map();
  private dataBuffer: Map<string, DeviceDataPoint[]> = new Map();
  private apiConfigs: Map<string, ThirdPartyAPIConfig> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize device manager and load device configurations
   */
  public async initialize(): Promise<void> {
    try {
      await this.loadDeviceConfigurations();
      await this.loadAPIConfigurations();
      await this.establishDeviceConnections();
      
      this.emit('initialized');
      errorTracker.addBreadcrumb('IoT Device Manager initialized', 'info');
    } catch (error) {
      errorTracker.captureException(error as Error);
      throw error;
    }
  }

  /**
   * Register a new IoT device
   */
  public async registerDevice(deviceConfig: Partial<IoTDevice>): Promise<string> {
    try {
      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const device: IoTDevice = {
        id: deviceId,
        systemId: deviceConfig.systemId!,
        type: deviceConfig.type!,
        brand: deviceConfig.brand!,
        model: deviceConfig.model!,
        serialNumber: deviceConfig.serialNumber!,
        firmware: deviceConfig.firmware!,
        location: deviceConfig.location!,
        configuration: deviceConfig.configuration || this.getDefaultConfiguration(deviceConfig.type!),
        status: 'commissioning',
        lastCommunication: new Date(),
        communicationProtocol: deviceConfig.communicationProtocol!,
        dataStreams: deviceConfig.dataStreams || this.getDefaultDataStreams(deviceConfig.type!),
        calibration: deviceConfig.calibration || this.getDefaultCalibration(),
        maintenance: deviceConfig.maintenance || this.getDefaultMaintenance(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in Firestore
      await addDoc(collection(db, 'iot_devices'), {
        ...device,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Store locally
      this.devices.set(deviceId, device);

      // Establish connection
      await this.connectDevice(deviceId);

      this.emit('device_registered', { deviceId, device });
      
      return deviceId;
    } catch (error) {
      errorTracker.captureException(error as Error, { deviceConfig });
      throw error;
    }
  }

  /**
   * Connect to a device and start data collection
   */
  public async connectDevice(deviceId: string): Promise<void> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      let connection;

      switch (device.communicationProtocol) {
        case 'modbus_tcp':
          connection = await this.createModbusTCPConnection(device);
          break;
        case 'http_api':
          connection = await this.createHTTPAPIConnection(device);
          break;
        case 'mqtt':
          connection = await this.createMQTTConnection(device);
          break;
        case 'sunspec':
          connection = await this.createSunSpecConnection(device);
          break;
        default:
          connection = await this.createGenericConnection(device);
      }

      this.deviceConnections.set(deviceId, connection);

      // Start data polling
      await this.startDataCollection(deviceId);

      // Update device status
      await this.updateDeviceStatus(deviceId, 'online');

      this.emit('device_connected', { deviceId });

    } catch (error) {
      await this.updateDeviceStatus(deviceId, 'error');
      errorTracker.captureException(error as Error, { deviceId });
      throw error;
    }
  }

  /**
   * Disconnect from a device
   */
  public async disconnectDevice(deviceId: string): Promise<void> {
    try {
      // Stop data collection
      this.stopDataCollection(deviceId);

      // Close connection
      const connection = this.deviceConnections.get(deviceId);
      if (connection && connection.disconnect) {
        await connection.disconnect();
      }

      this.deviceConnections.delete(deviceId);
      
      // Update status
      await this.updateDeviceStatus(deviceId, 'offline');

      this.emit('device_disconnected', { deviceId });

    } catch (error) {
      errorTracker.captureException(error as Error, { deviceId });
      throw error;
    }
  }

  /**
   * Start data collection from all devices
   */
  public async startDataCollection(deviceId?: string): Promise<void> {
    const deviceIds = deviceId ? [deviceId] : Array.from(this.devices.keys());

    for (const id of deviceIds) {
      const device = this.devices.get(id);
      if (!device) continue;

      const pollInterval = setInterval(async () => {
        try {
          await this.collectDeviceData(id);
        } catch (error) {
          errorTracker.captureException(error as Error, { deviceId: id });
        }
      }, device.configuration.samplingRate * 1000);

      this.pollingIntervals.set(id, pollInterval);
    }
  }

  /**
   * Stop data collection from a device
   */
  public stopDataCollection(deviceId: string): void {
    const interval = this.pollingIntervals.get(deviceId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(deviceId);
    }
  }

  /**
   * Collect data from a specific device
   */
  public async collectDeviceData(deviceId: string): Promise<DeviceDataPoint | null> {
    try {
      const device = this.devices.get(deviceId);
      const connection = this.deviceConnections.get(deviceId);

      if (!device || !connection) {
        return null;
      }

      let rawData;

      switch (device.communicationProtocol) {
        case 'modbus_tcp':
          rawData = await this.readModbusData(connection, device);
          break;
        case 'http_api':
          rawData = await this.readHTTPAPIData(connection, device);
          break;
        case 'mqtt':
          rawData = await this.readMQTTData(connection, device);
          break;
        default:
          rawData = await this.readGenericData(connection, device);
      }

      const processedData = this.processRawData(rawData, device);
      const dataPoint: DeviceDataPoint = {
        deviceId,
        timestamp: new Date(),
        measurements: processedData.measurements,
        status: processedData.status,
        alarms: processedData.alarms,
        quality: this.assessDataQuality(processedData, device)
      };

      // Buffer data
      this.bufferDataPoint(deviceId, dataPoint);

      // Store in database
      await this.storeDataPoint(dataPoint);

      // Check for alarms
      await this.checkAlarmConditions(device, dataPoint);

      // Update device last communication
      await this.updateLastCommunication(deviceId);

      this.emit('data_collected', { deviceId, dataPoint });

      return dataPoint;

    } catch (error) {
      errorTracker.captureException(error as Error, { deviceId });
      return null;
    }
  }

  /**
   * Get device information
   */
  public getDevice(deviceId: string): IoTDevice | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Get all devices for a system
   */
  public getSystemDevices(systemId: string): IoTDevice[] {
    return Array.from(this.devices.values()).filter(device => device.systemId === systemId);
  }

  /**
   * Get device status summary
   */
  public getDeviceStatusSummary(): {
    total: number;
    online: number;
    offline: number;
    error: number;
    maintenance: number;
  } {
    const devices = Array.from(this.devices.values());
    
    return {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      error: devices.filter(d => d.status === 'error').length,
      maintenance: devices.filter(d => d.status === 'maintenance').length
    };
  }

  /**
   * Configure third-party API integration
   */
  public async configureThirdPartyAPI(config: ThirdPartyAPIConfig): Promise<void> {
    try {
      this.apiConfigs.set(config.provider, config);
      
      // Start sync if configured
      if (config.syncInterval > 0) {
        setInterval(async () => {
          await this.syncThirdPartyData(config.provider);
        }, config.syncInterval * 60 * 1000);
      }

      this.emit('api_configured', { provider: config.provider });

    } catch (error) {
      errorTracker.captureException(error as Error, { provider: config.provider });
      throw error;
    }
  }

  /**
   * Sync data from third-party APIs
   */
  public async syncThirdPartyData(provider: string): Promise<void> {
    try {
      const config = this.apiConfigs.get(provider);
      if (!config) {
        throw new Error(`API config not found for provider: ${provider}`);
      }

      let data;

      switch (provider) {
        case 'fronius':
          data = await this.syncFroniusData(config);
          break;
        case 'sma':
          data = await this.syncSMAData(config);
          break;
        case 'enphase':
          data = await this.syncEnphaseData(config);
          break;
        case 'solaredge':
          data = await this.syncSolarEdgeData(config);
          break;
        default:
          data = await this.syncGenericAPIData(config);
      }

      // Process and store the synced data
      await this.processThirdPartyData(provider, data);

      // Update last sync time
      config.lastSync = new Date();

      this.emit('data_synced', { provider, recordCount: data.length });

    } catch (error) {
      errorTracker.captureException(error as Error, { provider });
      throw error;
    }
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private setupEventHandlers(): void {
    this.on('device_registered', this.handleDeviceRegistered.bind(this));
    this.on('device_connected', this.handleDeviceConnected.bind(this));
    this.on('data_collected', this.handleDataCollected.bind(this));
  }

  private async loadDeviceConfigurations(): Promise<void> {
    try {
      const devicesQuery = query(collection(db, 'iot_devices'));
      const snapshot = await getDocs(devicesQuery);
      
      snapshot.forEach(doc => {
        const device = { id: doc.id, ...doc.data() } as IoTDevice;
        this.devices.set(device.id, device);
      });

    } catch (error) {
      errorTracker.captureException(error as Error);
      throw error;
    }
  }

  private async loadAPIConfigurations(): Promise<void> {
    try {
      const configsQuery = query(collection(db, 'api_configurations'));
      const snapshot = await getDocs(configsQuery);
      
      snapshot.forEach(doc => {
        const config = doc.data() as ThirdPartyAPIConfig;
        this.apiConfigs.set(config.provider, config);
      });

    } catch (error) {
      errorTracker.captureException(error as Error);
    }
  }

  private async establishDeviceConnections(): Promise<void> {
    const connectionPromises = Array.from(this.devices.keys()).map(deviceId =>
      this.connectDevice(deviceId).catch(error => {
        errorTracker.captureException(error as Error, { deviceId });
      })
    );

    await Promise.allSettled(connectionPromises);
  }

  private getDefaultConfiguration(deviceType: DeviceType): DeviceConfiguration {
    return {
      samplingRate: 30,
      dataRetention: 365,
      alarmThresholds: this.getDefaultAlarmThresholds(deviceType),
      communicationSettings: {
        protocol: 'http_api',
        encryption: true,
        authRequired: true,
        pollInterval: 30,
        timeout: 10,
        retryAttempts: 3
      },
      calibrationParameters: {},
      operationalLimits: {
        temperatureMin: -40,
        temperatureMax: 85,
        humidityMax: 95,
        voltageMin: 0,
        voltageMax: 1000,
        currentMax: 100,
        powerMax: 50000
      }
    };
  }

  private getDefaultAlarmThresholds(deviceType: DeviceType): Record<string, AlarmThreshold> {
    const common = {
      temperature: {
        metric: 'temperature',
        maxValue: 80,
        warningLevel: 70,
        criticalLevel: 85,
        enabled: true
      }
    };

    switch (deviceType) {
      case 'inverter':
        return {
          ...common,
          efficiency: {
            metric: 'efficiency',
            minValue: 0.9,
            warningLevel: 0.85,
            criticalLevel: 0.8,
            enabled: true
          },
          power: {
            metric: 'power',
            maxValue: 10000,
            warningLevel: 9500,
            criticalLevel: 10500,
            enabled: true
          }
        };
      default:
        return common;
    }
  }

  private getDefaultDataStreams(deviceType: DeviceType): DataStream[] {
    const common = [
      {
        name: 'timestamp',
        unit: 'datetime',
        type: 'measurement' as const,
        frequency: 1,
        precision: 0,
        range: { min: 0, max: Number.MAX_SAFE_INTEGER }
      }
    ];

    switch (deviceType) {
      case 'inverter':
        return [
          ...common,
          {
            name: 'ac_power',
            unit: 'W',
            type: 'measurement' as const,
            frequency: 1,
            precision: 2,
            range: { min: 0, max: 50000 }
          },
          {
            name: 'dc_power',
            unit: 'W',
            type: 'measurement' as const,
            frequency: 1,
            precision: 2,
            range: { min: 0, max: 50000 }
          },
          {
            name: 'efficiency',
            unit: '%',
            type: 'measurement' as const,
            frequency: 1,
            precision: 3,
            range: { min: 0, max: 100 }
          }
        ];
      default:
        return common;
    }
  }

  private getDefaultCalibration(): CalibrationData {
    return {
      lastCalibrated: new Date(),
      nextCalibration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      calibrationFactor: 1.0,
      offset: 0.0,
      accuracy: 99.5,
      certified: false,
      calibratedBy: 'factory'
    };
  }

  private getDefaultMaintenance(): MaintenanceInfo {
    return {
      lastMaintenance: new Date(),
      nextMaintenance: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      maintenanceInterval: 180,
      warrantyExpiry: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
      serviceProvider: 'manufacturer',
      maintenanceHistory: []
    };
  }

  // Connection methods (simplified implementations)
  private async createModbusTCPConnection(device: IoTDevice): Promise<any> {
    return { type: 'modbus_tcp', deviceId: device.id, connected: true };
  }

  private async createHTTPAPIConnection(device: IoTDevice): Promise<any> {
    return { type: 'http_api', deviceId: device.id, connected: true };
  }

  private async createMQTTConnection(device: IoTDevice): Promise<any> {
    return { type: 'mqtt', deviceId: device.id, connected: true };
  }

  private async createSunSpecConnection(device: IoTDevice): Promise<any> {
    return { type: 'sunspec', deviceId: device.id, connected: true };
  }

  private async createGenericConnection(device: IoTDevice): Promise<any> {
    return { type: 'generic', deviceId: device.id, connected: true };
  }

  // Data reading methods (simplified implementations)
  private async readModbusData(connection: any, device: IoTDevice): Promise<any> {
    return this.generateMockData(device);
  }

  private async readHTTPAPIData(connection: any, device: IoTDevice): Promise<any> {
    return this.generateMockData(device);
  }

  private async readMQTTData(connection: any, device: IoTDevice): Promise<any> {
    return this.generateMockData(device);
  }

  private async readGenericData(connection: any, device: IoTDevice): Promise<any> {
    return this.generateMockData(device);
  }

  private generateMockData(device: IoTDevice): any {
    const data: any = { timestamp: new Date() };
    
    device.dataStreams.forEach(stream => {
      if (stream.name !== 'timestamp') {
        const range = stream.range.max - stream.range.min;
        const value = stream.range.min + Math.random() * range;
        data[stream.name] = Math.round(value * Math.pow(10, stream.precision)) / Math.pow(10, stream.precision);
      }
    });

    return data;
  }

  private processRawData(rawData: any, device: IoTDevice): {
    measurements: Record<string, number>;
    status: Record<string, string>;
    alarms: Alarm[];
  } {
    const measurements: Record<string, number> = {};
    const status: Record<string, string> = {};
    const alarms: Alarm[] = [];

    // Process measurements
    device.dataStreams.forEach(stream => {
      if (rawData[stream.name] !== undefined && stream.type === 'measurement') {
        measurements[stream.name] = rawData[stream.name];
      }
    });

    // Generate status
    status.operational = 'normal';
    status.communication = 'good';

    return { measurements, status, alarms };
  }

  private assessDataQuality(processedData: any, device: IoTDevice): DataQuality {
    return {
      overall: 0.95,
      completeness: 0.98,
      accuracy: 0.97,
      timeliness: 0.99,
      consistency: 0.94,
      outliers: 0,
      interpolated: false
    };
  }

  private bufferDataPoint(deviceId: string, dataPoint: DeviceDataPoint): void {
    if (!this.dataBuffer.has(deviceId)) {
      this.dataBuffer.set(deviceId, []);
    }
    
    const buffer = this.dataBuffer.get(deviceId)!;
    buffer.push(dataPoint);
    
    // Keep only last 1000 points in buffer
    if (buffer.length > 1000) {
      buffer.shift();
    }
  }

  private async storeDataPoint(dataPoint: DeviceDataPoint): Promise<void> {
    try {
      await addDoc(collection(db, 'device_data'), {
        ...dataPoint,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      errorTracker.captureException(error as Error, { deviceId: dataPoint.deviceId });
    }
  }

  private async checkAlarmConditions(device: IoTDevice, dataPoint: DeviceDataPoint): Promise<void> {
    // Implement alarm checking logic
    const alarms: Alarm[] = [];
    
    Object.entries(device.configuration.alarmThresholds).forEach(([metric, threshold]) => {
      if (!threshold.enabled) return;
      
      const value = dataPoint.measurements[metric];
      if (value === undefined) return;
      
      let severity: 'info' | 'warning' | 'critical' | null = null;
      
      if (threshold.maxValue && value > threshold.maxValue) {
        severity = value > threshold.criticalLevel ? 'critical' : 'warning';
      }
      
      if (threshold.minValue && value < threshold.minValue) {
        severity = value < threshold.criticalLevel ? 'critical' : 'warning';
      }
      
      if (severity) {
        alarms.push({
          id: `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: metric,
          severity,
          message: `${metric} ${severity === 'critical' ? 'critically' : ''} ${threshold.maxValue && value > threshold.maxValue ? 'exceeded' : 'below'} threshold`,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });
    
    if (alarms.length > 0) {
      this.emit('alarms_detected', { deviceId: device.id, alarms });
    }
  }

  private async updateDeviceStatus(deviceId: string, status: DeviceStatus): Promise<void> {
    try {
      const device = this.devices.get(deviceId);
      if (device) {
        device.status = status;
        device.updatedAt = new Date();
        
        await updateDoc(doc(db, 'iot_devices', deviceId), {
          status,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      errorTracker.captureException(error as Error, { deviceId, status });
    }
  }

  private async updateLastCommunication(deviceId: string): Promise<void> {
    try {
      const device = this.devices.get(deviceId);
      if (device) {
        device.lastCommunication = new Date();
        
        await updateDoc(doc(db, 'iot_devices', deviceId), {
          lastCommunication: serverTimestamp()
        });
      }
    } catch (error) {
      errorTracker.captureException(error as Error, { deviceId });
    }
  }

  // Third-party API sync methods (simplified implementations)
  private async syncFroniusData(config: ThirdPartyAPIConfig): Promise<any[]> {
    return [];
  }

  private async syncSMAData(config: ThirdPartyAPIConfig): Promise<any[]> {
    return [];
  }

  private async syncEnphaseData(config: ThirdPartyAPIConfig): Promise<any[]> {
    return [];
  }

  private async syncSolarEdgeData(config: ThirdPartyAPIConfig): Promise<any[]> {
    return [];
  }

  private async syncGenericAPIData(config: ThirdPartyAPIConfig): Promise<any[]> {
    return [];
  }

  private async processThirdPartyData(provider: string, data: any[]): Promise<void> {
    // Process and store third-party data
    for (const record of data) {
      try {
        await addDoc(collection(db, 'third_party_data'), {
          provider,
          data: record,
          syncedAt: serverTimestamp()
        });
      } catch (error) {
        errorTracker.captureException(error as Error, { provider, record });
      }
    }
  }

  // Event handlers
  private handleDeviceRegistered(event: any): void {
    console.log(`Device registered: ${event.deviceId}`);
  }

  private handleDeviceConnected(event: any): void {
    console.log(`Device connected: ${event.deviceId}`);
  }

  private handleDataCollected(event: any): void {
    // Additional data processing logic
  }
}

// Export singleton instance
export const iotDeviceManager = new IoTDeviceManager();