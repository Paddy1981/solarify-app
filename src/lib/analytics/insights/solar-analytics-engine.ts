/**
 * Solar Analytics Engine
 * Advanced analytics and insights generation for solar performance data
 */

import { collection, query, where, orderBy, getDocs, Timestamp, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS, EnergyProductionRecord, SolarSystem, WeatherRecord } from '../../../types/firestore-schema';
import { errorTracker } from '../../monitoring/error-tracker';
import { solarDataProcessor, ProcessedSolarData } from '../data-processing/solar-data-processor';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface AnalyticsInsight {
  id: string;
  systemId: string;
  type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  severity: InsightSeverity;
  confidence: number;
  impact: ImpactScore;
  recommendations: Recommendation[];
  metrics: InsightMetrics;
  timestamp: Date;
  validUntil?: Date;
}

export type InsightType = 
  | 'performance_optimization'
  | 'maintenance_alert'
  | 'cost_savings'
  | 'environmental_impact'
  | 'system_health'
  | 'weather_correlation'
  | 'benchmarking'
  | 'trend_analysis';

export type InsightCategory = 
  | 'efficiency'
  | 'production'
  | 'financial'
  | 'environmental'
  | 'maintenance'
  | 'comparison';

export type InsightSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface ImpactScore {
  financial: number; // 0-1 scale
  performance: number; // 0-1 scale  
  environmental: number; // 0-1 scale
  overall: number; // 0-1 scale
}

export interface Recommendation {
  action: string;
  priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  estimatedCost?: number;
  estimatedSavings?: number;
  timeFrame?: string;
  difficulty: 'easy' | 'moderate' | 'complex';
}

export interface InsightMetrics {
  currentValue: number;
  expectedValue?: number;
  deviation?: number;
  trend?: 'improving' | 'stable' | 'declining';
  percentChange?: number;
  comparisonValues?: {
    regional: number;
    peer: number;
    optimal: number;
  };
}

export interface SystemAnalytics {
  systemId: string;
  period: AnalyticsPeriod;
  production: ProductionAnalytics;
  performance: PerformanceAnalytics;
  financial: FinancialAnalytics;
  environmental: EnvironmentalAnalytics;
  health: SystemHealthAnalytics;
  insights: AnalyticsInsight[];
  lastUpdated: Date;
}

export interface ProductionAnalytics {
  totalEnergy: number; // kWh
  averagePower: number; // kW
  peakPower: number; // kW
  productionEfficiency: number; // %
  expectedVsActual: number; // ratio
  dailyProduction: DailyProductionStats[];
  monthlyTrends: MonthlyTrend[];
  seasonalPatterns: SeasonalPattern[];
}

export interface PerformanceAnalytics {
  overallPerformanceRatio: number;
  systemEfficiency: number;
  degradationRate: number; // %/year
  availabilityFactor: number;
  capacityFactor: number;
  specificYield: number; // kWh/kWp
  temperatureImpact: number;
  irradianceCorrelation: number;
  componentPerformance: ComponentPerformance[];
}

export interface FinancialAnalytics {
  energyValue: number; // $
  totalSavings: number; // $
  costPerKwh: number; // $/kWh
  roi: number; // %
  paybackProgress: number; // %
  projectedAnnualSavings: number; // $
  maintenanceCosts: number; // $
  netBenefit: number; // $
}

export interface EnvironmentalAnalytics {
  co2Avoided: number; // kg
  equivalentTrees: number;
  coalAvoided: number; // kg
  gasAvoided: number; // cubic meters
  environmentalValue: number; // $
  carbonFootprintReduction: number; // %
}

export interface SystemHealthAnalytics {
  overallHealth: number; // 0-1 scale
  componentHealth: ComponentHealth[];
  alertsCount: number;
  faultHistory: FaultSummary[];
  maintenanceScore: number;
  reliabilityIndex: number;
}

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'lifetime';

export interface DailyProductionStats {
  date: Date;
  energy: number;
  peakPower: number;
  efficiency: number;
  weatherImpact: number;
}

export interface MonthlyTrend {
  month: Date;
  production: number;
  performance: number;
  efficiency: number;
  compared: {
    previous: number;
    expected: number;
    benchmark: number;
  };
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  averageProduction: number;
  peakProduction: number;
  efficiency: number;
  variability: number;
}

export interface ComponentPerformance {
  component: string;
  efficiency: number;
  degradation: number;
  healthScore: number;
  expectedLife: number;
}

export interface ComponentHealth {
  component: string;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  score: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  issues: string[];
}

export interface FaultSummary {
  type: string;
  frequency: number;
  totalDowntime: number; // hours
  impact: number; // 0-1 scale
  lastOccurrence: Date;
}

// =====================================================
// SOLAR ANALYTICS ENGINE
// =====================================================

export class SolarAnalyticsEngine {
  private cache: Map<string, SystemAnalytics> = new Map();
  private insightHistory: Map<string, AnalyticsInsight[]> = new Map();

  /**
   * Generate comprehensive analytics for a solar system
   */
  public async generateSystemAnalytics(
    systemId: string,
    period: AnalyticsPeriod = 'month',
    options?: {
      includeWeatherData?: boolean;
      includeBenchmarking?: boolean;
      forceRefresh?: boolean;
    }
  ): Promise<SystemAnalytics> {
    try {
      errorTracker.addBreadcrumb('Generating system analytics', 'analytics', {
        systemId,
        period,
        options
      });

      // Check cache unless force refresh
      const cacheKey = `${systemId}_${period}`;
      if (!options?.forceRefresh && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        // Return cached if less than 1 hour old
        if (Date.now() - cached.lastUpdated.getTime() < 3600000) {
          return cached;
        }
      }

      // Fetch system information
      const systemInfo = await this.fetchSystemInfo(systemId);
      if (!systemInfo) {
        throw new Error(`System ${systemId} not found`);
      }

      // Fetch production data for the specified period
      const productionData = await this.fetchProductionData(systemId, period);
      if (productionData.length === 0) {
        throw new Error(`No production data found for system ${systemId}`);
      }

      // Fetch weather data if requested
      let weatherData: WeatherRecord[] = [];
      if (options?.includeWeatherData) {
        weatherData = await this.fetchWeatherData(systemInfo, period);
      }

      // Process and analyze data
      const processedData = await this.processProductionData(
        productionData, systemInfo, weatherData
      );

      // Generate analytics components
      const analytics: SystemAnalytics = {
        systemId,
        period,
        production: await this.generateProductionAnalytics(processedData, systemInfo, period),
        performance: await this.generatePerformanceAnalytics(processedData, systemInfo, period),
        financial: await this.generateFinancialAnalytics(processedData, systemInfo, period),
        environmental: await this.generateEnvironmentalAnalytics(processedData, systemInfo, period),
        health: await this.generateHealthAnalytics(processedData, systemInfo, productionData),
        insights: await this.generateInsights(processedData, systemInfo, period, options),
        lastUpdated: new Date()
      };

      // Cache the results
      this.cache.set(cacheKey, analytics);

      return analytics;

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId, period });
      throw error;
    }
  }

  /**
   * Generate production analytics
   */
  private async generateProductionAnalytics(
    data: ProcessedSolarData[],
    systemInfo: SolarSystem,
    period: AnalyticsPeriod
  ): Promise<ProductionAnalytics> {
    
    // Calculate total energy production
    const totalEnergy = data.reduce((sum, record) => sum + record.production.energy, 0);
    
    // Calculate average power
    const averagePower = data.length > 0 ? 
      data.reduce((sum, record) => sum + record.production.acPower, 0) / data.length : 0;
    
    // Find peak power
    const peakPower = Math.max(...data.map(record => record.production.acPower));
    
    // Calculate production efficiency
    const systemCapacity = systemInfo.configuration.totalCapacity;
    const productionEfficiency = systemCapacity > 0 ? (averagePower / systemCapacity) * 100 : 0;
    
    // Expected vs Actual comparison
    const expectedEnergy = this.calculateExpectedEnergy(systemInfo, period);
    const expectedVsActual = expectedEnergy > 0 ? totalEnergy / expectedEnergy : 1;
    
    // Generate daily production stats
    const dailyProduction = this.generateDailyStats(data);
    
    // Generate monthly trends
    const monthlyTrends = await this.generateMonthlyTrends(systemInfo.id, period);
    
    // Analyze seasonal patterns
    const seasonalPatterns = this.analyzeSeasonalPatterns(data);

    return {
      totalEnergy: Math.round(totalEnergy * 100) / 100,
      averagePower: Math.round(averagePower * 100) / 100,
      peakPower: Math.round(peakPower * 100) / 100,
      productionEfficiency: Math.round(productionEfficiency * 100) / 100,
      expectedVsActual: Math.round(expectedVsActual * 1000) / 1000,
      dailyProduction,
      monthlyTrends,
      seasonalPatterns
    };
  }

  /**
   * Generate performance analytics
   */
  private async generatePerformanceAnalytics(
    data: ProcessedSolarData[],
    systemInfo: SolarSystem,
    period: AnalyticsPeriod
  ): Promise<PerformanceAnalytics> {
    
    // Calculate average performance metrics
    const overallPerformanceRatio = data.length > 0 ?
      data.reduce((sum, record) => sum + record.performance.performanceRatio, 0) / data.length : 0;
    
    const systemEfficiency = data.length > 0 ?
      data.reduce((sum, record) => sum + record.production.efficiency, 0) / data.length : 0;
    
    const capacityFactor = data.length > 0 ?
      data.reduce((sum, record) => sum + record.performance.capacityFactor, 0) / data.length : 0;
    
    const specificYield = data.length > 0 ?
      data.reduce((sum, record) => sum + record.performance.specificYield, 0) / data.length : 0;
    
    // Calculate degradation rate
    const degradationRate = this.calculateDegradationRate(systemInfo, data);
    
    // Calculate availability
    const availabilityFactor = data.filter(r => r.production.acPower > 0).length / data.length;
    
    // Analyze temperature and irradiance impacts
    const temperatureImpact = this.analyzeTemperatureImpact(data);
    const irradianceCorrelation = this.analyzeIrradianceCorrelation(data);
    
    // Component performance analysis
    const componentPerformance = this.analyzeComponentPerformance(systemInfo, data);

    return {
      overallPerformanceRatio: Math.round(overallPerformanceRatio * 1000) / 1000,
      systemEfficiency: Math.round(systemEfficiency * 100) / 100,
      degradationRate: Math.round(degradationRate * 1000) / 1000,
      availabilityFactor: Math.round(availabilityFactor * 1000) / 1000,
      capacityFactor: Math.round(capacityFactor * 1000) / 1000,
      specificYield: Math.round(specificYield * 100) / 100,
      temperatureImpact: Math.round(temperatureImpact * 1000) / 1000,
      irradianceCorrelation: Math.round(irradianceCorrelation * 1000) / 1000,
      componentPerformance
    };
  }

  /**
   * Generate financial analytics
   */
  private async generateFinancialAnalytics(
    data: ProcessedSolarData[],
    systemInfo: SolarSystem,
    period: AnalyticsPeriod
  ): Promise<FinancialAnalytics> {
    
    // Get utility rate information
    const utilityRate = 0.12; // $/kWh - would fetch from utility rates collection
    
    // Calculate total energy value
    const totalEnergy = data.reduce((sum, record) => sum + record.production.energy, 0);
    const energyValue = totalEnergy * utilityRate;
    
    // Calculate savings (assuming offset of grid consumption)
    const totalSavings = energyValue; // Simplified calculation
    
    // Calculate cost per kWh for the system
    const systemCost = 25000; // Would fetch from project data
    const lifetimeEnergy = this.calculateLifetimeEnergy(systemInfo);
    const costPerKwh = lifetimeEnergy > 0 ? systemCost / lifetimeEnergy : 0;
    
    // Calculate ROI
    const annualSavings = this.calculateAnnualSavings(systemInfo, utilityRate);
    const roi = systemCost > 0 ? (annualSavings / systemCost) * 100 : 0;
    
    // Calculate payback progress
    const totalPaid = systemCost; // Simplified
    const paybackProgress = totalSavings > 0 ? Math.min((totalSavings / totalPaid) * 100, 100) : 0;
    
    // Projected annual savings
    const projectedAnnualSavings = annualSavings;
    
    // Maintenance costs (estimated)
    const maintenanceCosts = systemCost * 0.005; // 0.5% of system cost annually
    
    // Net benefit
    const netBenefit = totalSavings - maintenanceCosts;

    return {
      energyValue: Math.round(energyValue * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      costPerKwh: Math.round(costPerKwh * 1000) / 1000,
      roi: Math.round(roi * 100) / 100,
      paybackProgress: Math.round(paybackProgress * 100) / 100,
      projectedAnnualSavings: Math.round(projectedAnnualSavings * 100) / 100,
      maintenanceCosts: Math.round(maintenanceCosts * 100) / 100,
      netBenefit: Math.round(netBenefit * 100) / 100
    };
  }

  /**
   * Generate environmental analytics
   */
  private async generateEnvironmentalAnalytics(
    data: ProcessedSolarData[],
    systemInfo: SolarSystem,
    period: AnalyticsPeriod
  ): Promise<EnvironmentalAnalytics> {
    
    const totalEnergy = data.reduce((sum, record) => sum + record.production.energy, 0);
    
    // CO2 avoided (0.92 lbs CO2 per kWh from grid)
    const co2AvoidedLbs = totalEnergy * 0.92;
    const co2Avoided = co2AvoidedLbs * 0.453592; // Convert to kg
    
    // Equivalent trees (1 tree absorbs ~48 lbs CO2 per year)
    const equivalentTrees = co2AvoidedLbs / 48;
    
    // Coal avoided (1 kWh = ~1.2 lbs coal)
    const coalAvoided = (totalEnergy * 1.2) * 0.453592; // kg
    
    // Natural gas avoided (1 kWh = ~0.6 cubic feet)
    const gasAvoided = totalEnergy * 0.6 * 0.0283168; // cubic meters
    
    // Environmental value ($40 per ton CO2)
    const environmentalValue = (co2Avoided / 1000) * 40;
    
    // Carbon footprint reduction percentage
    const carbonFootprintReduction = this.calculateCarbonFootprintReduction(systemInfo, totalEnergy);

    return {
      co2Avoided: Math.round(co2Avoided * 100) / 100,
      equivalentTrees: Math.round(equivalentTrees * 10) / 10,
      coalAvoided: Math.round(coalAvoided * 100) / 100,
      gasAvoided: Math.round(gasAvoided * 100) / 100,
      environmentalValue: Math.round(environmentalValue * 100) / 100,
      carbonFootprintReduction: Math.round(carbonFootprintReduction * 10) / 10
    };
  }

  /**
   * Generate system health analytics
   */
  private async generateHealthAnalytics(
    data: ProcessedSolarData[],
    systemInfo: SolarSystem,
    rawData: EnergyProductionRecord[]
  ): Promise<SystemHealthAnalytics> {
    
    // Calculate overall health score
    const overallHealth = this.calculateOverallHealthScore(data, systemInfo);
    
    // Analyze component health
    const componentHealth = this.analyzeComponentHealth(systemInfo, data);
    
    // Count alerts
    const alertsCount = data.reduce((count, record) => count + record.anomalies.length, 0);
    
    // Analyze fault history
    const faultHistory = this.analyzeFaultHistory(rawData);
    
    // Calculate maintenance score
    const maintenanceScore = this.calculateMaintenanceScore(systemInfo);
    
    // Calculate reliability index
    const reliabilityIndex = this.calculateReliabilityIndex(data);

    return {
      overallHealth: Math.round(overallHealth * 1000) / 1000,
      componentHealth,
      alertsCount,
      faultHistory,
      maintenanceScore: Math.round(maintenanceScore * 1000) / 1000,
      reliabilityIndex: Math.round(reliabilityIndex * 1000) / 1000
    };
  }

  /**
   * Generate actionable insights
   */
  private async generateInsights(
    data: ProcessedSolarData[],
    systemInfo: SolarSystem,
    period: AnalyticsPeriod,
    options?: any
  ): Promise<AnalyticsInsight[]> {
    
    const insights: AnalyticsInsight[] = [];

    // Performance optimization insights
    const performanceInsights = this.generatePerformanceInsights(data, systemInfo);
    insights.push(...performanceInsights);
    
    // Maintenance insights
    const maintenanceInsights = this.generateMaintenanceInsights(data, systemInfo);
    insights.push(...maintenanceInsights);
    
    // Financial insights
    const financialInsights = this.generateFinancialInsights(data, systemInfo);
    insights.push(...financialInsights);
    
    // Environmental insights
    const environmentalInsights = this.generateEnvironmentalInsights(data, systemInfo);
    insights.push(...environmentalInsights);

    return insights.sort((a, b) => b.impact.overall - a.impact.overall);
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async fetchSystemInfo(systemId: string): Promise<SolarSystem | null> {
    try {
      const systemQuery = query(
        collection(db, COLLECTIONS.SOLAR_SYSTEMS),
        where('id', '==', systemId),
        limit(1)
      );
      
      const snapshot = await getDocs(systemQuery);
      return snapshot.empty ? null : snapshot.docs[0].data() as SolarSystem;
    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      return null;
    }
  }

  private async fetchProductionData(
    systemId: string,
    period: AnalyticsPeriod
  ): Promise<EnergyProductionRecord[]> {
    try {
      const dateRange = this.getDateRange(period);
      
      const productionQuery = query(
        collection(db, COLLECTIONS.ENERGY_PRODUCTION),
        where('systemId', '==', systemId),
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end)),
        orderBy('timestamp', 'asc')
      );
      
      const snapshot = await getDocs(productionQuery);
      return snapshot.docs.map(doc => doc.data() as EnergyProductionRecord);
    } catch (error) {
      errorTracker.captureException(error as Error, { systemId, period });
      return [];
    }
  }

  private async fetchWeatherData(
    systemInfo: SolarSystem,
    period: AnalyticsPeriod
  ): Promise<WeatherRecord[]> {
    try {
      const dateRange = this.getDateRange(period);
      const locationId = `${systemInfo.location.coordinates.latitude}_${systemInfo.location.coordinates.longitude}`;
      
      const weatherQuery = query(
        collection(db, COLLECTIONS.WEATHER_DATA),
        where('locationId', '==', locationId),
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end)),
        orderBy('timestamp', 'asc')
      );
      
      const snapshot = await getDocs(weatherQuery);
      return snapshot.docs.map(doc => doc.data() as WeatherRecord);
    } catch (error) {
      errorTracker.captureException(error as Error, { 
        systemId: systemInfo.id,
        period 
      });
      return [];
    }
  }

  private async processProductionData(
    productionData: EnergyProductionRecord[],
    systemInfo: SolarSystem,
    weatherData: WeatherRecord[]
  ): Promise<ProcessedSolarData[]> {
    const result = await solarDataProcessor.processProductionData(
      productionData,
      systemInfo,
      weatherData
    );
    
    // For this implementation, we'll create ProcessedSolarData from the records
    // In a real implementation, this would be returned from the processor
    return productionData.map(record => this.convertToProcessedData(record, systemInfo));
  }

  private convertToProcessedData(
    record: EnergyProductionRecord,
    systemInfo: SolarSystem
  ): ProcessedSolarData {
    return {
      systemId: record.systemId,
      timestamp: record.timestamp.toDate(),
      interval: record.interval,
      production: {
        dcPower: record.production.dcPower,
        acPower: record.production.acPower,
        energy: record.production.energy,
        voltage: record.production.voltage,
        current: record.production.current,
        frequency: record.production.frequency,
        efficiency: record.performance.efficiency,
        inverterEfficiency: record.performance.efficiency * 0.98,
        systemEfficiency: record.performance.efficiency * 0.95
      },
      performance: {
        performanceRatio: record.performance.performanceRatio,
        specificYield: record.performance.specificYield,
        capacityFactor: record.performance.capacityFactor,
        availabilityFactor: 1.0,
        degradationRate: 0.005,
        temperatureCorrectedPerformance: 1.0,
        irradianceCorrectedPerformance: 1.0,
        expectedVsActual: 1.0,
        benchmarkComparison: 0.85
      },
      environmental: {
        solarIrradiance: record.environmental?.irradiance || 500,
        ambientTemperature: record.environmental?.ambientTemp || 25,
        moduleTemperature: record.environmental?.moduleTemp || 35,
        windSpeed: 2,
        humidity: 50,
        clearSkyIndex: 0.8,
        weatherImpactFactor: 1.0,
        shadingFactor: 0.95
      },
      quality: {
        overall: record.dataQuality.confidence,
        completeness: 0.95,
        accuracy: 0.9,
        consistency: 0.9,
        timeliness: 0.95,
        validity: 0.9,
        gaps: [],
        interpolatedPoints: record.dataQuality.interpolated ? 1 : 0
      },
      anomalies: [],
      predictions: {
        nextHourProduction: record.production.acPower * 0.9,
        nextDayProduction: record.production.energy * 20,
        nextWeekProduction: record.production.energy * 140,
        maintenanceRecommendation: 'No issues detected',
        performanceTrend: 'stable',
        confidenceLevel: 0.8
      }
    };
  }

  // Additional helper methods for calculations...
  private getDateRange(period: AnalyticsPeriod): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'day':
        start.setDate(end.getDate() - 1);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'lifetime':
        start.setFullYear(2000); // Far back enough for lifetime
        break;
    }
    
    return { start, end };
  }

  // Placeholder implementations for various calculation methods
  private calculateExpectedEnergy(systemInfo: SolarSystem, period: AnalyticsPeriod): number {
    const capacity = systemInfo.configuration.totalCapacity;
    const peakSunHours = systemInfo.location.solarResource.peakSunHours;
    const periodDays = this.getPeriodDays(period);
    return capacity * peakSunHours * periodDays * 0.8; // 80% system efficiency
  }

  private getPeriodDays(period: AnalyticsPeriod): number {
    switch (period) {
      case 'day': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      case 'lifetime': return 365 * 25; // 25 year system life
      default: return 30;
    }
  }

  private generateDailyStats(data: ProcessedSolarData[]): DailyProductionStats[] {
    // Group data by day and calculate daily statistics
    const dailyGroups = new Map<string, ProcessedSolarData[]>();
    
    data.forEach(record => {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      if (!dailyGroups.has(dateKey)) {
        dailyGroups.set(dateKey, []);
      }
      dailyGroups.get(dateKey)!.push(record);
    });
    
    return Array.from(dailyGroups.entries()).map(([dateStr, dayData]) => ({
      date: new Date(dateStr),
      energy: dayData.reduce((sum, record) => sum + record.production.energy, 0),
      peakPower: Math.max(...dayData.map(record => record.production.acPower)),
      efficiency: dayData.reduce((sum, record) => sum + record.production.efficiency, 0) / dayData.length,
      weatherImpact: dayData.reduce((sum, record) => sum + record.environmental.weatherImpactFactor, 0) / dayData.length
    }));
  }

  private async generateMonthlyTrends(systemId: string, period: AnalyticsPeriod): Promise<MonthlyTrend[]> {
    // This would fetch and compare monthly data over time
    // For now, return placeholder data
    return [];
  }

  private analyzeSeasonalPatterns(data: ProcessedSolarData[]): SeasonalPattern[] {
    const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
    
    return seasons.map(season => ({
      season,
      averageProduction: this.calculateSeasonalAverage(data, season),
      peakProduction: this.calculateSeasonalPeak(data, season),
      efficiency: this.calculateSeasonalEfficiency(data, season),
      variability: this.calculateSeasonalVariability(data, season)
    }));
  }

  private calculateSeasonalAverage(data: ProcessedSolarData[], season: string): number {
    const seasonalData = this.filterBySeason(data, season);
    return seasonalData.length > 0 ? 
      seasonalData.reduce((sum, record) => sum + record.production.energy, 0) / seasonalData.length : 0;
  }

  private calculateSeasonalPeak(data: ProcessedSolarData[], season: string): number {
    const seasonalData = this.filterBySeason(data, season);
    return seasonalData.length > 0 ? 
      Math.max(...seasonalData.map(record => record.production.acPower)) : 0;
  }

  private calculateSeasonalEfficiency(data: ProcessedSolarData[], season: string): number {
    const seasonalData = this.filterBySeason(data, season);
    return seasonalData.length > 0 ? 
      seasonalData.reduce((sum, record) => sum + record.production.efficiency, 0) / seasonalData.length : 0;
  }

  private calculateSeasonalVariability(data: ProcessedSolarData[], season: string): number {
    const seasonalData = this.filterBySeason(data, season);
    if (seasonalData.length < 2) return 0;
    
    const values = seasonalData.map(record => record.production.energy);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private filterBySeason(data: ProcessedSolarData[], season: string): ProcessedSolarData[] {
    return data.filter(record => {
      const month = record.timestamp.getMonth();
      switch (season) {
        case 'spring': return month >= 2 && month <= 4; // Mar-May
        case 'summer': return month >= 5 && month <= 7; // Jun-Aug
        case 'fall': return month >= 8 && month <= 10; // Sep-Nov
        case 'winter': return month === 11 || month <= 1; // Dec-Feb
        default: return false;
      }
    });
  }

  // Additional calculation methods would be implemented here...
  private calculateDegradationRate(systemInfo: SolarSystem, data: ProcessedSolarData[]): number {
    // Simplified degradation calculation - would use more sophisticated analysis
    const systemAge = this.getSystemAge(systemInfo);
    return systemAge * 0.005; // 0.5% per year typical degradation
  }

  private getSystemAge(systemInfo: SolarSystem): number {
    const installDate = systemInfo.installationDate.toDate();
    const now = new Date();
    return (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }

  private analyzeTemperatureImpact(data: ProcessedSolarData[]): number {
    // Analyze correlation between temperature and performance
    // Simplified implementation
    return -0.004; // -0.4% per degree C typical
  }

  private analyzeIrradianceCorrelation(data: ProcessedSolarData[]): number {
    // Calculate correlation between irradiance and production
    // Simplified implementation
    return 0.85; // High positive correlation typical
  }

  private analyzeComponentPerformance(systemInfo: SolarSystem, data: ProcessedSolarData[]): ComponentPerformance[] {
    return [
      {
        component: 'Solar Panels',
        efficiency: 20.5,
        degradation: 0.5,
        healthScore: 0.9,
        expectedLife: 25
      },
      {
        component: 'Inverters',
        efficiency: 97.5,
        degradation: 0.2,
        healthScore: 0.95,
        expectedLife: 15
      }
    ];
  }

  // More helper methods for financial, environmental, health analytics...
  private calculateLifetimeEnergy(systemInfo: SolarSystem): number {
    const annualEnergy = systemInfo.targets.annual;
    const systemLife = 25; // years
    const degradationRate = 0.005; // per year
    
    let totalEnergy = 0;
    for (let year = 0; year < systemLife; year++) {
      const yearlyEnergy = annualEnergy * Math.pow(1 - degradationRate, year);
      totalEnergy += yearlyEnergy;
    }
    
    return totalEnergy;
  }

  private calculateAnnualSavings(systemInfo: SolarSystem, utilityRate: number): number {
    return systemInfo.targets.annual * utilityRate;
  }

  private calculateCarbonFootprintReduction(systemInfo: SolarSystem, energyProduced: number): number {
    const avgHouseholdEmissions = 16000; // kg CO2 per year
    const co2Avoided = energyProduced * 0.92 * 0.453592; // kg CO2
    return (co2Avoided / avgHouseholdEmissions) * 100;
  }

  private calculateOverallHealthScore(data: ProcessedSolarData[], systemInfo: SolarSystem): number {
    // Composite health score based on multiple factors
    const performanceScore = data.length > 0 ? 
      data.reduce((sum, record) => sum + record.performance.performanceRatio, 0) / data.length : 0;
    
    const qualityScore = data.length > 0 ? 
      data.reduce((sum, record) => sum + record.quality.overall, 0) / data.length : 0;
    
    const anomalyImpact = data.reduce((sum, record) => 
      sum + record.anomalies.filter(a => a.severity === 'critical' || a.severity === 'error').length, 0
    ) / data.length;
    
    return Math.max(0, (performanceScore + qualityScore) / 2 - anomalyImpact * 0.1);
  }

  private analyzeComponentHealth(systemInfo: SolarSystem, data: ProcessedSolarData[]): ComponentHealth[] {
    return [
      {
        component: 'Solar Panels',
        status: 'good',
        score: 0.85,
        lastMaintenance: new Date('2024-06-01'),
        nextMaintenance: new Date('2025-06-01'),
        issues: []
      },
      {
        component: 'Inverters',
        status: 'excellent',
        score: 0.95,
        lastMaintenance: new Date('2024-03-15'),
        nextMaintenance: new Date('2025-03-15'),
        issues: []
      }
    ];
  }

  private analyzeFaultHistory(rawData: EnergyProductionRecord[]): FaultSummary[] {
    // Analyze fault patterns from raw data
    return [];
  }

  private calculateMaintenanceScore(systemInfo: SolarSystem): number {
    // Score based on maintenance history and schedule adherence
    return 0.8;
  }

  private calculateReliabilityIndex(data: ProcessedSolarData[]): number {
    // Calculate system reliability based on uptime and performance consistency
    const uptime = data.filter(record => record.production.acPower > 0).length / data.length;
    const consistency = this.calculatePerformanceConsistency(data);
    return (uptime + consistency) / 2;
  }

  private calculatePerformanceConsistency(data: ProcessedSolarData[]): number {
    if (data.length < 2) return 1;
    
    const performances = data.map(record => record.performance.performanceRatio);
    const mean = performances.reduce((sum, val) => sum + val, 0) / performances.length;
    const variance = performances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / performances.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    return Math.max(0, 1 - coefficientOfVariation);
  }

  // Insight generation methods
  private generatePerformanceInsights(data: ProcessedSolarData[], systemInfo: SolarSystem): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];
    
    const avgPerformance = data.reduce((sum, record) => sum + record.performance.performanceRatio, 0) / data.length;
    
    if (avgPerformance < 0.8) {
      insights.push({
        id: `perf_${systemInfo.id}_${Date.now()}`,
        systemId: systemInfo.id,
        type: 'performance_optimization',
        category: 'efficiency',
        title: 'Below Expected Performance',
        description: `System is operating at ${(avgPerformance * 100).toFixed(1)}% of expected performance. Consider maintenance or inspection.`,
        severity: avgPerformance < 0.7 ? 'high' : 'medium',
        confidence: 0.85,
        impact: {
          financial: 0.7,
          performance: 0.8,
          environmental: 0.6,
          overall: 0.7
        },
        recommendations: [
          {
            action: 'Schedule professional system inspection',
            priority: 'short_term',
            estimatedCost: 300,
            estimatedSavings: 1500,
            timeFrame: '1-2 weeks',
            difficulty: 'easy'
          },
          {
            action: 'Clean solar panels',
            priority: 'immediate',
            estimatedCost: 150,
            estimatedSavings: 800,
            timeFrame: '1-3 days',
            difficulty: 'easy'
          }
        ],
        metrics: {
          currentValue: avgPerformance,
          expectedValue: 0.85,
          deviation: 0.85 - avgPerformance,
          trend: 'declining',
          percentChange: -15
        },
        timestamp: new Date()
      });
    }
    
    return insights;
  }

  private generateMaintenanceInsights(data: ProcessedSolarData[], systemInfo: SolarSystem): AnalyticsInsight[] {
    // Generate maintenance-related insights
    return [];
  }

  private generateFinancialInsights(data: ProcessedSolarData[], systemInfo: SolarSystem): AnalyticsInsight[] {
    // Generate financial insights
    return [];
  }

  private generateEnvironmentalInsights(data: ProcessedSolarData[], systemInfo: SolarSystem): AnalyticsInsight[] {
    // Generate environmental insights
    return [];
  }
}

// Export singleton instance
export const solarAnalyticsEngine = new SolarAnalyticsEngine();