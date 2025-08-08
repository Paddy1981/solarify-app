/**
 * Real-Time Monitoring Service
 * Live solar energy production monitoring and system health tracking
 */

import { collection, doc, onSnapshot, updateDoc, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, SolarSystem, EnergyProductionRecord } from '../../types/firestore-schema';
import { errorTracker } from './error-tracker';
import { iotDeviceManager } from './iot-device-manager';
import { solarPerformanceMonitor } from './solar-performance-monitor';
import { EventEmitter } from 'events';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface RealTimeSystem {
  systemId: string;
  status: SystemStatus;
  currentProduction: ProductionData;
  performance: PerformanceData;
  environmental: EnvironmentalData;
  equipment: EquipmentStatus;
  alerts: SystemAlert[];
  predictions: ProductionPrediction;
  lastUpdated: Date;
  dataStreams: DataStream[];
}

export interface SystemStatus {
  operational: 'online' | 'offline' | 'degraded' | 'maintenance';
  health: number; // 0-1 scale
  uptime: number; // percentage
  availability: number; // percentage
  communicationStatus: 'connected' | 'intermittent' | 'disconnected';
  lastCommunication: Date;
  errorCount: number;
  warningCount: number;
}

export interface ProductionData {
  instantaneous: {
    dcPower: number; // kW
    acPower: number; // kW
    efficiency: number; // %
    voltage: number; // V
    current: number; // A
    frequency: number; // Hz
    powerFactor: number;
  };
  cumulative: {
    todayEnergy: number; // kWh
    weekEnergy: number; // kWh
    monthEnergy: number; // kWh
    yearEnergy: number; // kWh
    lifetimeEnergy: number; // kWh
  };
  trends: {
    last15min: number[]; // kW values
    lastHour: number[]; // kW values
    last24Hours: number[]; // kWh hourly values
    last7Days: number[]; // kWh daily values
  };
}

export interface PerformanceData {
  metrics: {
    performanceRatio: number; // 0-1
    specificYield: number; // kWh/kWp
    capacityFactor: number; // 0-1
    systemEfficiency: number; // %
    inverterEfficiency: number; // %
    dcToACRatio: number;
  };
  comparison: {
    expectedVsActual: number; // ratio
    industryBenchmark: number; // ratio
    historicalAverage: number; // ratio
    weatherAdjusted: number; // ratio
  };
  degradation: {
    annualRate: number; // % per year
    cumulativeImpact: number; // %
    projectedLifetime: number; // years
  };
}

export interface EnvironmentalData {
  solar: {
    irradiance: number; // W/m²
    clearSkyIrradiance: number; // W/m²
    clearSkyIndex: number; // 0-1
    peakSunHours: number;
    uvIndex: number;
  };
  weather: {
    temperature: number; // °C
    moduleTemperature: number; // °C
    humidity: number; // %
    pressure: number; // hPa
    windSpeed: number; // m/s
    windDirection: number; // degrees
    precipitation: number; // mm
    cloudCover: number; // %
    visibility: number; // km
  };
  impact: {
    temperatureDerating: number; // %
    shadingLoss: number; // %
    weatherEfficiencyFactor: number; // 0-1
    soilingLoss: number; // %
  };
}

export interface EquipmentStatus {
  inverters: InverterStatus[];
  panels: PanelStatus[];
  optimizers: OptimizerStatus[];
  batteries: BatteryStatus[];
  monitoring: MonitoringStatus;
  grid: GridStatus;
}

export interface InverterStatus {
  id: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'fault' | 'standby';
  power: number; // kW
  efficiency: number; // %
  temperature: number; // °C
  errorCodes: string[];
  lastCommunication: Date;
  firmware: string;
  operatingHours: number;
}

export interface PanelStatus {
  id: string;
  arrayId: string;
  stringId: string;
  power: number; // W
  voltage: number; // V
  current: number; // A
  temperature: number; // °C
  performance: number; // % of nameplate
  degradation: number; // % total
  hotSpots: boolean;
  shadingImpact: number; // %
}

export interface OptimizerStatus {
  id: string;
  panelId: string;
  power: number; // W
  voltage: number; // V
  current: number; // A
  efficiency: number; // %
  status: 'online' | 'offline' | 'fault';
  temperature: number; // °C
  errorCodes: string[];
}

export interface BatteryStatus {
  id: string;
  stateOfCharge: number; // %
  capacity: number; // kWh
  power: number; // kW (+ charging, - discharging)
  voltage: number; // V
  current: number; // A
  temperature: number; // °C
  cycleCount: number;
  health: number; // %
  chargingEfficiency: number; // %
  timeToFull?: number; // minutes
  timeToEmpty?: number; // minutes
}

export interface MonitoringStatus {
  system: string;
  dataLogger: string;
  communicationMethod: string;
  signalStrength: number; // %
  lastUpdate: Date;
  dataQuality: number; // %
  missedReadings: number;
}

export interface GridStatus {
  connected: boolean;
  voltage: number; // V
  frequency: number; // Hz
  powerFactor: number;
  gridExport: number; // kW
  gridImport: number; // kW
  netMetering: boolean;
  utilityAlerts: string[];
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
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  impact: AlertImpact;
}

export type AlertType = 
  | 'production_anomaly'
  | 'equipment_fault'
  | 'communication_loss'
  | 'performance_degradation'
  | 'weather_impact'
  | 'grid_disturbance'
  | 'maintenance_required'
  | 'security_breach';

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type AlertCategory = 
  | 'production'
  | 'performance'
  | 'equipment'
  | 'communication'
  | 'environmental'
  | 'grid'
  | 'security';

export interface AlertImpact {
  productionLoss: number; // kWh/day
  efficiencyImpact: number; // %
  financialImpact: number; // $/day
  urgency: 'immediate' | 'within_hour' | 'within_day' | 'planned';
}

export interface ProductionPrediction {
  nextHour: {
    production: number; // kWh
    confidence: number; // %
    factors: string[];
  };
  nextDay: {
    production: number; // kWh
    peak: number; // kW
    confidence: number; // %
    weatherForecast: WeatherForecast;
  };
  nextWeek: {
    production: number; // kWh
    dailyForecast: number[]; // kWh per day
    confidence: number; // %
  };
}

export interface WeatherForecast {
  temperature: number; // °C
  irradiance: number; // W/m²
  cloudCover: number; // %
  precipitation: number; // %
  windSpeed: number; // m/s
}

export interface DataStream {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  lastUpdate: Date;
}

// =====================================================
// REAL-TIME MONITORING SERVICE CLASS
// =====================================================

export class RealTimeMonitoringService extends EventEmitter {
  private monitoredSystems: Map<string, RealTimeSystem> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private realtimeSubscriptions: Map<string, () => void> = new Map();
  private dataAggregationBuffer: Map<string, any[]> = new Map();
  private weatherCache: Map<string, any> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Start monitoring a solar system
   */
  public async startRealTimeMonitoring(systemId: string): Promise<void> {
    try {
      // Initialize system monitoring
      const system = await this.initializeSystemMonitoring(systemId);
      this.monitoredSystems.set(systemId, system);

      // Set up real-time data subscriptions
      this.setupRealtimeSubscriptions(systemId);

      // Start periodic updates
      this.startPeriodicUpdates(systemId);

      // Initialize data aggregation
      this.initializeDataAggregation(systemId);

      this.emit('monitoring_started', { systemId });
      
      errorTracker.addBreadcrumb('Started real-time monitoring', 'monitoring', { systemId });

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      throw error;
    }
  }

  /**
   * Stop monitoring a solar system
   */
  public async stopRealTimeMonitoring(systemId: string): Promise<void> {
    try {
      // Stop periodic updates
      const interval = this.updateIntervals.get(systemId);
      if (interval) {
        clearInterval(interval);
        this.updateIntervals.delete(systemId);
      }

      // Unsubscribe from real-time data
      const unsubscribe = this.realtimeSubscriptions.get(systemId);
      if (unsubscribe) {
        unsubscribe();
        this.realtimeSubscriptions.delete(systemId);
      }

      // Clean up data structures
      this.monitoredSystems.delete(systemId);
      this.dataAggregationBuffer.delete(systemId);

      this.emit('monitoring_stopped', { systemId });

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      throw error;
    }
  }

  /**
   * Get real-time system data
   */
  public getRealTimeSystem(systemId: string): RealTimeSystem | null {
    return this.monitoredSystems.get(systemId) || null;
  }

  /**
   * Get all monitored systems
   */
  public getMonitoredSystems(): RealTimeSystem[] {
    return Array.from(this.monitoredSystems.values());
  }

  /**
   * Update system data
   */
  public async updateSystemData(systemId: string): Promise<RealTimeSystem | null> {
    try {
      const system = this.monitoredSystems.get(systemId);
      if (!system) return null;

      // Update production data
      const productionData = await this.collectProductionData(systemId);
      if (productionData) {
        system.currentProduction = productionData;
      }

      // Update performance data
      const performanceData = await this.calculatePerformanceData(systemId, productionData);
      if (performanceData) {
        system.performance = performanceData;
      }

      // Update environmental data
      const environmentalData = await this.collectEnvironmentalData(systemId);
      if (environmentalData) {
        system.environmental = environmentalData;
      }

      // Update equipment status
      const equipmentStatus = await this.collectEquipmentStatus(systemId);
      if (equipmentStatus) {
        system.equipment = equipmentStatus;
      }

      // Check for alerts
      const alerts = await this.checkSystemAlerts(systemId, system);
      system.alerts = alerts;

      // Update predictions
      const predictions = await this.generatePredictions(systemId, system);
      system.predictions = predictions;

      // Update system status
      system.status = this.calculateSystemStatus(system);
      system.lastUpdated = new Date();

      // Emit update event
      this.emit('system_updated', { systemId, system });

      return system;

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
    filters?: {
      severity?: AlertSeverity[];
      category?: AlertCategory[];
      acknowledged?: boolean;
    }
  ): SystemAlert[] {
    const system = this.monitoredSystems.get(systemId);
    if (!system) return [];

    let alerts = system.alerts;

    if (filters) {
      if (filters.severity) {
        alerts = alerts.filter(alert => filters.severity!.includes(alert.severity));
      }
      if (filters.category) {
        alerts = alerts.filter(alert => filters.category!.includes(alert.category));
      }
      if (filters.acknowledged !== undefined) {
        alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged);
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get monitoring statistics
   */
  public getMonitoringStatistics(): {
    totalSystems: number;
    onlineSystems: number;
    offlineSystems: number;
    degradedSystems: number;
    totalProduction: number;
    averageEfficiency: number;
    activeAlerts: number;
    criticalAlerts: number;
  } {
    const systems = Array.from(this.monitoredSystems.values());
    
    return {
      totalSystems: systems.length,
      onlineSystems: systems.filter(s => s.status.operational === 'online').length,
      offlineSystems: systems.filter(s => s.status.operational === 'offline').length,
      degradedSystems: systems.filter(s => s.status.operational === 'degraded').length,
      totalProduction: systems.reduce((sum, s) => sum + s.currentProduction.instantaneous.acPower, 0),
      averageEfficiency: systems.reduce((sum, s) => sum + s.performance.metrics.systemEfficiency, 0) / systems.length || 0,
      activeAlerts: systems.reduce((sum, s) => sum + s.alerts.filter(a => !a.resolved).length, 0),
      criticalAlerts: systems.reduce((sum, s) => sum + s.alerts.filter(a => a.severity === 'critical' && !a.resolved).length, 0)
    };
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private setupEventHandlers(): void {
    this.on('monitoring_started', this.handleMonitoringStarted.bind(this));
    this.on('system_updated', this.handleSystemUpdated.bind(this));
    this.on('alert_detected', this.handleAlertDetected.bind(this));
  }

  private async initializeSystemMonitoring(systemId: string): Promise<RealTimeSystem> {
    // Get system information
    const systemInfo = await this.getSystemInfo(systemId);
    if (!systemInfo) {
      throw new Error(`System ${systemId} not found`);
    }

    // Initialize real-time system object
    const realTimeSystem: RealTimeSystem = {
      systemId,
      status: {
        operational: 'online',
        health: 1.0,
        uptime: 100,
        availability: 100,
        communicationStatus: 'connected',
        lastCommunication: new Date(),
        errorCount: 0,
        warningCount: 0
      },
      currentProduction: {
        instantaneous: {
          dcPower: 0,
          acPower: 0,
          efficiency: 0,
          voltage: 0,
          current: 0,
          frequency: 60,
          powerFactor: 1.0
        },
        cumulative: {
          todayEnergy: 0,
          weekEnergy: 0,
          monthEnergy: 0,
          yearEnergy: 0,
          lifetimeEnergy: 0
        },
        trends: {
          last15min: [],
          lastHour: [],
          last24Hours: [],
          last7Days: []
        }
      },
      performance: {
        metrics: {
          performanceRatio: 0,
          specificYield: 0,
          capacityFactor: 0,
          systemEfficiency: 0,
          inverterEfficiency: 0,
          dcToACRatio: 0
        },
        comparison: {
          expectedVsActual: 0,
          industryBenchmark: 0,
          historicalAverage: 0,
          weatherAdjusted: 0
        },
        degradation: {
          annualRate: 0.5,
          cumulativeImpact: 0,
          projectedLifetime: 25
        }
      },
      environmental: {
        solar: {
          irradiance: 0,
          clearSkyIrradiance: 0,
          clearSkyIndex: 0,
          peakSunHours: 0,
          uvIndex: 0
        },
        weather: {
          temperature: 25,
          moduleTemperature: 25,
          humidity: 50,
          pressure: 1013,
          windSpeed: 0,
          windDirection: 0,
          precipitation: 0,
          cloudCover: 0,
          visibility: 10
        },
        impact: {
          temperatureDerating: 0,
          shadingLoss: 0,
          weatherEfficiencyFactor: 1.0,
          soilingLoss: 0
        }
      },
      equipment: {
        inverters: [],
        panels: [],
        optimizers: [],
        batteries: [],
        monitoring: {
          system: 'SolarEdge',
          dataLogger: 'SE1000-ZBGW3',
          communicationMethod: 'Ethernet',
          signalStrength: 100,
          lastUpdate: new Date(),
          dataQuality: 100,
          missedReadings: 0
        },
        grid: {
          connected: true,
          voltage: 240,
          frequency: 60,
          powerFactor: 1.0,
          gridExport: 0,
          gridImport: 0,
          netMetering: true,
          utilityAlerts: []
        }
      },
      alerts: [],
      predictions: {
        nextHour: {
          production: 0,
          confidence: 0,
          factors: []
        },
        nextDay: {
          production: 0,
          peak: 0,
          confidence: 0,
          weatherForecast: {
            temperature: 25,
            irradiance: 800,
            cloudCover: 20,
            precipitation: 0,
            windSpeed: 2
          }
        },
        nextWeek: {
          production: 0,
          dailyForecast: [],
          confidence: 0
        }
      },
      lastUpdated: new Date(),
      dataStreams: []
    };

    return realTimeSystem;
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
        this.handleRealtimeProductionUpdate(systemId, latestData);
      }
    });

    this.realtimeSubscriptions.set(systemId, unsubscribe);
  }

  private startPeriodicUpdates(systemId: string): void {
    const interval = setInterval(async () => {
      try {
        await this.updateSystemData(systemId);
      } catch (error) {
        errorTracker.captureException(error as Error, { systemId });
      }
    }, 30000); // Update every 30 seconds

    this.updateIntervals.set(systemId, interval);
  }

  private initializeDataAggregation(systemId: string): void {
    this.dataAggregationBuffer.set(systemId, []);
  }

  private async collectProductionData(systemId: string): Promise<ProductionData | null> {
    try {
      // Get latest production record
      const latestData = await this.getLatestProductionData(systemId);
      if (!latestData) return null;

      // Get cumulative data
      const cumulativeData = await this.getCumulativeProductionData(systemId);
      
      // Get trend data
      const trendData = await this.getTrendData(systemId);

      return {
        instantaneous: {
          dcPower: latestData.production.dcPower / 1000, // Convert W to kW
          acPower: latestData.production.acPower / 1000, // Convert W to kW
          efficiency: latestData.performance.efficiency,
          voltage: latestData.production.voltage,
          current: latestData.production.current,
          frequency: latestData.production.frequency,
          powerFactor: 0.95 // Calculate from actual data
        },
        cumulative: cumulativeData,
        trends: trendData
      };

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      return null;
    }
  }

  private async calculatePerformanceData(
    systemId: string, 
    productionData: ProductionData | null
  ): Promise<PerformanceData | null> {
    try {
      if (!productionData) return null;

      const systemInfo = await this.getSystemInfo(systemId);
      if (!systemInfo) return null;

      const capacity = systemInfo.configuration.totalCapacity;
      const specificYield = capacity > 0 ? (productionData.cumulative.todayEnergy / capacity) : 0;
      
      return {
        metrics: {
          performanceRatio: productionData.instantaneous.dcPower > 0 ? 
            (productionData.instantaneous.acPower / productionData.instantaneous.dcPower) : 0,
          specificYield,
          capacityFactor: capacity > 0 ? (productionData.instantaneous.acPower / capacity) : 0,
          systemEfficiency: productionData.instantaneous.efficiency,
          inverterEfficiency: productionData.instantaneous.efficiency * 0.98,
          dcToACRatio: productionData.instantaneous.dcPower > 0 ? 
            (productionData.instantaneous.acPower / productionData.instantaneous.dcPower) : 0
        },
        comparison: {
          expectedVsActual: 1.0, // Calculate based on forecast
          industryBenchmark: 0.85, // Industry standard PR
          historicalAverage: 0.82, // Calculate from historical data
          weatherAdjusted: 0.88 // Adjust for current weather
        },
        degradation: {
          annualRate: 0.5,
          cumulativeImpact: 0,
          projectedLifetime: 25
        }
      };

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      return null;
    }
  }

  private async collectEnvironmentalData(systemId: string): Promise<EnvironmentalData | null> {
    try {
      // Get system location
      const systemInfo = await this.getSystemInfo(systemId);
      if (!systemInfo) return null;

      // Get weather data (mock implementation)
      const weatherData = await this.getWeatherData(systemInfo.location.coordinates);
      
      return {
        solar: {
          irradiance: weatherData.solarIrradiance || 0,
          clearSkyIrradiance: weatherData.clearSkyIrradiance || 0,
          clearSkyIndex: weatherData.clearSkyIndex || 0,
          peakSunHours: 6.5,
          uvIndex: 7
        },
        weather: {
          temperature: weatherData.temperature || 25,
          moduleTemperature: (weatherData.temperature || 25) + 15,
          humidity: weatherData.humidity || 50,
          pressure: weatherData.pressure || 1013,
          windSpeed: weatherData.windSpeed || 2,
          windDirection: weatherData.windDirection || 180,
          precipitation: weatherData.precipitation || 0,
          cloudCover: weatherData.cloudCover || 20,
          visibility: 10
        },
        impact: {
          temperatureDerating: this.calculateTemperatureDerating(weatherData.temperature || 25),
          shadingLoss: 2, // From system configuration
          weatherEfficiencyFactor: this.calculateWeatherEfficiencyFactor(weatherData),
          soilingLoss: 3 // Estimate based on location and season
        }
      };

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      return null;
    }
  }

  private async collectEquipmentStatus(systemId: string): Promise<EquipmentStatus | null> {
    try {
      const systemDevices = iotDeviceManager.getSystemDevices(systemId);
      
      const inverters: InverterStatus[] = systemDevices
        .filter(device => device.type === 'inverter')
        .map(device => ({
          id: device.id,
          serialNumber: device.serialNumber,
          status: device.status === 'online' ? 'online' : 'offline',
          power: 0, // Get from latest data
          efficiency: 95,
          temperature: 45,
          errorCodes: [],
          lastCommunication: device.lastCommunication,
          firmware: device.firmware,
          operatingHours: 15000
        }));

      return {
        inverters,
        panels: [],
        optimizers: [],
        batteries: [],
        monitoring: {
          system: 'SolarEdge',
          dataLogger: 'SE1000-ZBGW3',
          communicationMethod: 'Ethernet',
          signalStrength: 100,
          lastUpdate: new Date(),
          dataQuality: 95,
          missedReadings: 0
        },
        grid: {
          connected: true,
          voltage: 240,
          frequency: 60,
          powerFactor: 0.95,
          gridExport: 8.5,
          gridImport: 0,
          netMetering: true,
          utilityAlerts: []
        }
      };

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      return null;
    }
  }

  private async checkSystemAlerts(
    systemId: string, 
    system: RealTimeSystem
  ): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];
    const now = new Date();

    // Check production anomalies
    if (system.currentProduction.instantaneous.acPower < 0.5 && 
        system.environmental.solar.irradiance > 200) {
      alerts.push({
        id: `alert_${now.getTime()}`,
        systemId,
        type: 'production_anomaly',
        severity: 'medium',
        category: 'production',
        title: 'Low Production During High Irradiance',
        message: 'System producing less power than expected for current solar conditions',
        timestamp: now,
        acknowledged: false,
        resolved: false,
        impact: {
          productionLoss: 10,
          efficiencyImpact: 15,
          financialImpact: 2.50,
          urgency: 'within_hour'
        }
      });
    }

    // Check equipment faults
    system.equipment.inverters.forEach(inverter => {
      if (inverter.status === 'fault' || inverter.errorCodes.length > 0) {
        alerts.push({
          id: `alert_${now.getTime()}_${inverter.id}`,
          systemId,
          type: 'equipment_fault',
          severity: 'high',
          category: 'equipment',
          title: 'Inverter Fault Detected',
          message: `Inverter ${inverter.serialNumber} reporting fault condition`,
          component: inverter.id,
          timestamp: now,
          acknowledged: false,
          resolved: false,
          impact: {
            productionLoss: 50,
            efficiencyImpact: 100,
            financialImpact: 12.50,
            urgency: 'immediate'
          }
        });
      }
    });

    // Check communication issues
    if (system.status.communicationStatus === 'disconnected') {
      alerts.push({
        id: `alert_${now.getTime()}_comm`,
        systemId,
        type: 'communication_loss',
        severity: 'high',
        category: 'communication',
        title: 'Communication Lost',
        message: 'Lost communication with monitoring system',
        timestamp: now,
        acknowledged: false,
        resolved: false,
        impact: {
          productionLoss: 0,
          efficiencyImpact: 0,
          financialImpact: 0,
          urgency: 'within_hour'
        }
      });
    }

    return alerts;
  }

  private async generatePredictions(
    systemId: string, 
    system: RealTimeSystem
  ): Promise<ProductionPrediction> {
    // Simple prediction logic - in production, use ML models
    const currentPower = system.currentProduction.instantaneous.acPower;
    const irradiance = system.environmental.solar.irradiance;
    
    return {
      nextHour: {
        production: Math.max(0, currentPower * 0.9), // Slightly declining
        confidence: 85,
        factors: ['Current production trend', 'Weather forecast', 'Historical patterns']
      },
      nextDay: {
        production: 45,
        peak: 9.5,
        confidence: 78,
        weatherForecast: {
          temperature: 28,
          irradiance: 850,
          cloudCover: 15,
          precipitation: 0,
          windSpeed: 3
        }
      },
      nextWeek: {
        production: 280,
        dailyForecast: [45, 42, 38, 35, 41, 46, 48],
        confidence: 65
      }
    };
  }

  private calculateSystemStatus(system: RealTimeSystem): SystemStatus {
    const hasActiveFaults = system.equipment.inverters.some(inv => inv.status === 'fault');
    const hasCriticalAlerts = system.alerts.some(alert => alert.severity === 'critical' && !alert.resolved);
    const isDisconnected = system.status.communicationStatus === 'disconnected';

    let operational: 'online' | 'offline' | 'degraded' | 'maintenance';
    
    if (isDisconnected) {
      operational = 'offline';
    } else if (hasActiveFaults || hasCriticalAlerts) {
      operational = 'degraded';
    } else {
      operational = 'online';
    }

    return {
      ...system.status,
      operational,
      health: operational === 'online' ? 0.95 : operational === 'degraded' ? 0.7 : 0.3,
      errorCount: system.alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
      warningCount: system.alerts.filter(a => a.severity === 'medium').length
    };
  }

  // Helper methods
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

  private async getCumulativeProductionData(systemId: string): Promise<{
    todayEnergy: number;
    weekEnergy: number;
    monthEnergy: number;
    yearEnergy: number;
    lifetimeEnergy: number;
  }> {
    // Simplified implementation - would query aggregated data
    return {
      todayEnergy: 42.5,
      weekEnergy: 285.3,
      monthEnergy: 1247.8,
      yearEnergy: 12850.0,
      lifetimeEnergy: 48392.5
    };
  }

  private async getTrendData(systemId: string): Promise<{
    last15min: number[];
    lastHour: number[];
    last24Hours: number[];
    last7Days: number[];
  }> {
    // Simplified implementation - would query time-series data
    return {
      last15min: [7.2, 7.5, 7.8, 8.1],
      lastHour: [6.5, 6.8, 7.0, 7.2, 7.5, 7.8, 8.1, 8.3],
      last24Hours: [0, 0, 0, 0, 0, 0, 2, 8, 15, 22, 28, 32, 35, 38, 35, 30, 22, 12, 5, 1, 0, 0, 0, 0],
      last7Days: [38, 42, 35, 28, 45, 48, 42]
    };
  }

  private async getWeatherData(coordinates: { latitude: number; longitude: number }): Promise<any> {
    // Mock weather data - integrate with actual weather service
    return {
      temperature: 28,
      solarIrradiance: 850,
      clearSkyIrradiance: 1000,
      clearSkyIndex: 0.85,
      humidity: 45,
      pressure: 1015,
      windSpeed: 3,
      windDirection: 225,
      precipitation: 0,
      cloudCover: 15
    };
  }

  private calculateTemperatureDerating(temperature: number): number {
    // Standard temperature coefficient: -0.4% per °C above 25°C
    const standardTemp = 25;
    const tempCoefficient = 0.004; // per °C
    
    if (temperature <= standardTemp) return 0;
    return (temperature - standardTemp) * tempCoefficient * 100;
  }

  private calculateWeatherEfficiencyFactor(weatherData: any): number {
    const irradianceEffect = Math.min(weatherData.solarIrradiance / 1000, 1);
    const temperatureEffect = Math.max(0, 1 - (Math.max(weatherData.temperature - 25, 0) * 0.004));
    const cloudEffect = Math.max(0, 1 - (weatherData.cloudCover / 100) * 0.8);
    
    return (irradianceEffect + temperatureEffect + cloudEffect) / 3;
  }

  private async handleRealtimeProductionUpdate(
    systemId: string, 
    data: EnergyProductionRecord
  ): Promise<void> {
    try {
      await this.updateSystemData(systemId);
      this.emit('realtime_update', { systemId, data });
    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
    }
  }

  // Event handlers
  private handleMonitoringStarted(event: { systemId: string }): void {
    console.log(`Real-time monitoring started for system: ${event.systemId}`);
  }

  private handleSystemUpdated(event: { systemId: string; system: RealTimeSystem }): void {
    // Additional processing logic
  }

  private handleAlertDetected(event: { systemId: string; alerts: SystemAlert[] }): void {
    // Handle alert notifications
  }
}

// Export singleton instance
export const realTimeMonitoringService = new RealTimeMonitoringService();