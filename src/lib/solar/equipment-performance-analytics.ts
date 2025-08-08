/**
 * Equipment Performance Analytics Engine
 * Real-time performance tracking, analysis, and optimization
 */

// =====================================================
// PERFORMANCE DATA INTERFACES
// =====================================================

export interface PerformanceMetrics {
  equipmentId: string;
  equipmentType: 'panel' | 'inverter' | 'battery' | 'system';
  timestamp: Date;
  
  // Real-time performance data
  realtime: {
    power: number; // W or kW
    voltage: number; // V
    current: number; // A
    temperature: number; // °C
    efficiency: number; // %
    status: 'normal' | 'warning' | 'fault' | 'offline';
  };
  
  // Environmental conditions
  environmental: {
    irradiance: number; // W/m²
    ambientTemperature: number; // °C
    windSpeed: number; // m/s
    humidity: number; // %
    precipitation: boolean;
  };
  
  // Calculated metrics
  calculated: {
    energyProduced: number; // kWh
    performanceRatio: number; // %
    capacityUtilization: number; // %
    degradationRate: number; // %/year
    availability: number; // %
  };
  
  // Quality metrics
  quality: {
    dataCompleteness: number; // %
    measurementAccuracy: number; // %
    signalQuality: number; // %
    lastCalibration: Date;
  };
}

export interface PerformanceAnalysis {
  equipmentId: string;
  analysisDate: Date;
  timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year';
  
  // Performance summary
  summary: {
    totalEnergyProduced: number; // kWh
    averageEfficiency: number; // %
    peakPower: number; // kW
    uptime: number; // %
    performanceRatio: number; // %
  };
  
  // Trend analysis
  trends: {
    energyProductionTrend: 'increasing' | 'stable' | 'decreasing';
    efficiencyTrend: 'improving' | 'stable' | 'declining';
    degradationRate: number; // %/year
    seasonalVariation: number; // % variation
  };
  
  // Comparative analysis
  benchmarking: {
    expectedPerformance: number; // kWh
    actualPerformance: number; // kWh
    performanceIndex: number; // % (100% = meeting expectations)
    peerComparison: {
      percentile: number; // 0-100
      similarSystems: number; // count
      ranking: 'top_10' | 'above_average' | 'average' | 'below_average' | 'bottom_10';
    };
  };
  
  // Issue identification
  issues: {
    type: 'degradation' | 'shading' | 'soiling' | 'fault' | 'maintenance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: {
      energyLoss: number; // kWh
      financialImpact: number; // USD
      expectedDuration: number; // days
    };
    recommendation: string;
  }[];
  
  // Optimization opportunities
  optimizations: {
    type: 'cleaning' | 'maintenance' | 'reconfiguration' | 'upgrade';
    description: string;
    estimatedGain: {
      energyIncrease: number; // kWh/year
      efficiencyImprovement: number; // %
      costSavings: number; // USD/year
    };
    implementationCost: number; // USD
    paybackPeriod: number; // months
  }[];
}

export interface EquipmentReliabilityData {
  equipmentId: string;
  manufacturer: string;
  model: string;
  installDate: Date;
  
  // Reliability metrics
  reliability: {
    mtbf: number; // Mean Time Between Failures (hours)
    mttr: number; // Mean Time To Repair (hours)
    availability: number; // %
    failureRate: number; // failures per year
    expectedLifespan: number; // years
  };
  
  // Failure history
  failures: {
    date: Date;
    type: 'electrical' | 'mechanical' | 'software' | 'environmental';
    severity: 'minor' | 'major' | 'critical';
    downtime: number; // hours
    rootCause: string;
    resolution: string;
    cost: number; // USD
  }[];
  
  // Maintenance history
  maintenance: {
    date: Date;
    type: 'preventive' | 'corrective' | 'emergency';
    description: string;
    cost: number; // USD
    performanceImpact: number; // % improvement
  }[];
  
  // Warranty and service
  warranty: {
    active: boolean;
    expirationDate: Date;
    claimsSubmitted: number;
    claimsApproved: number;
    totalClaimValue: number; // USD
  };
}

export interface MarketPerformanceData {
  manufacturer: string;
  model: string;
  equipmentType: 'panel' | 'inverter' | 'battery';
  
  // Market statistics
  marketData: {
    totalInstalled: number; // units
    averageAge: number; // years
    geographicDistribution: { region: string; count: number }[];
    installationTrend: { year: number; installations: number }[];
  };
  
  // Performance statistics
  performance: {
    averageEfficiency: number; // %
    performanceRatio: number; // %
    degradationRate: number; // %/year
    reliabilityRating: number; // 1-10
    customerSatisfaction: number; // 1-10
  };
  
  // Comparative rankings
  rankings: {
    efficiencyRank: number;
    reliabilityRank: number;
    valueRank: number;
    overallRank: number;
    totalModelsInCategory: number;
  };
}

// =====================================================
// PERFORMANCE ANALYTICS ENGINE
// =====================================================

export class PerformanceAnalyticsEngine {
  private performanceData: Map<string, PerformanceMetrics[]> = new Map();
  private analysisCache: Map<string, PerformanceAnalysis> = new Map();
  private reliabilityDatabase: Map<string, EquipmentReliabilityData> = new Map();
  
  /**
   * Record real-time performance data
   */
  async recordPerformanceData(data: PerformanceMetrics): Promise<void> {
    const equipmentId = data.equipmentId;
    
    if (!this.performanceData.has(equipmentId)) {
      this.performanceData.set(equipmentId, []);
    }
    
    const equipmentData = this.performanceData.get(equipmentId)!;
    equipmentData.push(data);
    
    // Keep only last 365 days of data in memory
    const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const filteredData = equipmentData.filter(d => d.timestamp > cutoffDate);
    this.performanceData.set(equipmentId, filteredData);
    
    // Trigger real-time analysis if needed
    await this.checkForAnomalies(data);
  }
  
  /**
   * Analyze equipment performance over specified timeframe
   */
  async analyzePerformance(
    equipmentId: string,
    timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): Promise<PerformanceAnalysis> {
    const cacheKey = `${equipmentId}_${timeframe}`;
    const cached = this.analysisCache.get(cacheKey);
    
    // Return cached result if recent
    if (cached && this.isCacheValid(cached.analysisDate)) {
      return cached;
    }
    
    const performanceData = this.performanceData.get(equipmentId) || [];
    const timeframeData = this.filterDataByTimeframe(performanceData, timeframe);
    
    if (timeframeData.length === 0) {
      throw new Error('No performance data available for analysis');
    }
    
    const analysis: PerformanceAnalysis = {
      equipmentId,
      analysisDate: new Date(),
      timeframe,
      summary: this.calculateSummaryMetrics(timeframeData),
      trends: await this.analyzeTrends(timeframeData, timeframe),
      benchmarking: await this.performBenchmarking(equipmentId, timeframeData),
      issues: await this.identifyIssues(timeframeData),
      optimizations: await this.identifyOptimizations(equipmentId, timeframeData)
    };
    
    // Cache the analysis
    this.analysisCache.set(cacheKey, analysis);
    
    return analysis;
  }
  
  /**
   * Get real-time performance dashboard
   */
  async getRealTimePerformance(equipmentIds: string[]): Promise<{
    current: PerformanceMetrics[];
    alerts: PerformanceAlert[];
    summary: {
      totalPower: number;
      averageEfficiency: number;
      systemStatus: 'normal' | 'warning' | 'fault';
      onlineCount: number;
      totalCount: number;
    };
  }> {
    const currentData = [];
    const alerts = [];
    let totalPower = 0;
    let totalEfficiency = 0;
    let onlineCount = 0;
    let hasWarnings = false;
    let hasFaults = false;
    
    for (const equipmentId of equipmentIds) {
      const equipmentData = this.performanceData.get(equipmentId);
      if (equipmentData && equipmentData.length > 0) {
        // Get latest data point
        const latest = equipmentData[equipmentData.length - 1];
        currentData.push(latest);
        
        if (latest.realtime.status === 'normal' || latest.realtime.status === 'warning') {
          onlineCount++;
          totalPower += latest.realtime.power;
          totalEfficiency += latest.realtime.efficiency;
        }
        
        if (latest.realtime.status === 'warning') hasWarnings = true;
        if (latest.realtime.status === 'fault') hasFaults = true;
        
        // Check for alerts
        const equipmentAlerts = await this.checkForAlerts(latest);
        alerts.push(...equipmentAlerts);
      }
    }
    
    const systemStatus = hasFaults ? 'fault' : hasWarnings ? 'warning' : 'normal';
    const averageEfficiency = onlineCount > 0 ? totalEfficiency / onlineCount : 0;
    
    return {
      current: currentData,
      alerts,
      summary: {
        totalPower: Math.round(totalPower * 100) / 100,
        averageEfficiency: Math.round(averageEfficiency * 100) / 100,
        systemStatus,
        onlineCount,
        totalCount: equipmentIds.length
      }
    };
  }
  
  /**
   * Generate equipment reliability report
   */
  async generateReliabilityReport(equipmentId: string): Promise<EquipmentReliabilityData> {
    let reliabilityData = this.reliabilityDatabase.get(equipmentId);
    
    if (!reliabilityData) {
      // Initialize reliability tracking for new equipment
      reliabilityData = await this.initializeReliabilityTracking(equipmentId);
      this.reliabilityDatabase.set(equipmentId, reliabilityData);
    }
    
    // Update reliability metrics
    reliabilityData = await this.updateReliabilityMetrics(reliabilityData);
    
    return reliabilityData;
  }
  
  /**
   * Compare equipment performance across fleet
   */
  async compareFleetPerformance(equipmentIds: string[]): Promise<{
    comparison: {
      equipmentId: string;
      performanceRatio: number;
      efficiency: number;
      availability: number;
      ranking: number;
    }[];
    insights: string[];
    recommendations: string[];
  }> {
    const comparison = [];
    
    for (const equipmentId of equipmentIds) {
      const analysis = await this.analyzePerformance(equipmentId, 'month');
      comparison.push({
        equipmentId,
        performanceRatio: analysis.summary.performanceRatio,
        efficiency: analysis.summary.averageEfficiency,
        availability: analysis.summary.uptime,
        ranking: 0 // Will be calculated after sorting
      });
    }
    
    // Sort by performance ratio and assign rankings
    comparison.sort((a, b) => b.performanceRatio - a.performanceRatio);
    comparison.forEach((item, index) => item.ranking = index + 1);
    
    // Generate insights
    const insights = this.generateFleetInsights(comparison);
    const recommendations = this.generateFleetRecommendations(comparison);
    
    return {
      comparison,
      insights,
      recommendations
    };
  }
  
  /**
   * Predict equipment maintenance needs
   */
  async predictMaintenanceNeeds(equipmentId: string): Promise<{
    predictions: {
      type: 'cleaning' | 'inspection' | 'component_replacement' | 'calibration';
      urgency: 'low' | 'medium' | 'high';
      timeframe: string;
      confidence: number; // %
      reason: string;
      estimatedCost: number;
    }[];
    schedule: {
      date: Date;
      task: string;
      type: 'preventive' | 'corrective';
      priority: number;
    }[];
  }> {
    const performanceData = this.performanceData.get(equipmentId) || [];
    const reliabilityData = await this.generateReliabilityReport(equipmentId);
    
    const predictions = [];
    const schedule = [];
    
    // Analyze recent performance trends
    const recentData = performanceData.slice(-30); // Last 30 data points
    
    // Predict cleaning needs based on efficiency decline
    const efficiencyTrend = this.calculateEfficiencyTrend(recentData);
    if (efficiencyTrend < -2) { // >2% efficiency decline
      predictions.push({
        type: 'cleaning',
        urgency: 'medium',
        timeframe: '1-2 weeks',
        confidence: 75,
        reason: 'Efficiency decline suggests soiling accumulation',
        estimatedCost: 200
      });
      
      schedule.push({
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        task: 'Panel cleaning and inspection',
        type: 'preventive',
        priority: 2
      });
    }
    
    // Predict component replacement based on age and failure history
    const equipmentAge = this.calculateEquipmentAge(reliabilityData.installDate);
    if (equipmentAge > 10 && reliabilityData.failures.length > 2) {
      predictions.push({
        type: 'component_replacement',
        urgency: 'high',
        timeframe: '1-3 months',
        confidence: 85,
        reason: 'Age and failure history indicate potential component wear',
        estimatedCost: 1500
      });
    }
    
    // Regular inspection schedule
    const lastInspection = reliabilityData.maintenance
      .filter(m => m.type === 'preventive')
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    
    if (!lastInspection || this.daysSince(lastInspection.date) > 180) {
      schedule.push({
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
        task: 'Comprehensive system inspection',
        type: 'preventive',
        priority: 1
      });
    }
    
    // Sort schedule by priority and date
    schedule.sort((a, b) => b.priority - a.priority || a.date.getTime() - b.date.getTime());
    
    return {
      predictions,
      schedule
    };
  }
  
  /**
   * Get market performance benchmarks
   */
  async getMarketBenchmarks(
    manufacturer: string,
    model: string,
    equipmentType: 'panel' | 'inverter' | 'battery'
  ): Promise<MarketPerformanceData> {
    // In a real implementation, this would fetch data from market databases
    // For now, returning mock data structure
    
    return {
      manufacturer,
      model,
      equipmentType,
      marketData: {
        totalInstalled: 50000,
        averageAge: 3.5,
        geographicDistribution: [
          { region: 'California', count: 15000 },
          { region: 'Texas', count: 8000 },
          { region: 'Florida', count: 6000 }
        ],
        installationTrend: [
          { year: 2020, installations: 8000 },
          { year: 2021, installations: 12000 },
          { year: 2022, installations: 15000 },
          { year: 2023, installations: 15000 }
        ]
      },
      performance: {
        averageEfficiency: 19.8,
        performanceRatio: 84.2,
        degradationRate: 0.45,
        reliabilityRating: 8.7,
        customerSatisfaction: 8.9
      },
      rankings: {
        efficiencyRank: 12,
        reliabilityRank: 8,
        valueRank: 5,
        overallRank: 7,
        totalModelsInCategory: 45
      }
    };
  }
  
  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================
  
  private async checkForAnomalies(data: PerformanceMetrics): Promise<void> {
    // Real-time anomaly detection logic
    // Would implement ML-based anomaly detection
  }
  
  private isCacheValid(analysisDate: Date, maxAge: number = 3600000): boolean {
    // Cache is valid for 1 hour
    return Date.now() - analysisDate.getTime() < maxAge;
  }
  
  private filterDataByTimeframe(
    data: PerformanceMetrics[],
    timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): PerformanceMetrics[] {
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeframe) {
      case 'day':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return data.filter(d => d.timestamp > cutoffDate);
  }
  
  private calculateSummaryMetrics(data: PerformanceMetrics[]): any {
    const totalEnergy = data.reduce((sum, d) => sum + d.calculated.energyProduced, 0);
    const avgEfficiency = data.reduce((sum, d) => sum + d.realtime.efficiency, 0) / data.length;
    const peakPower = Math.max(...data.map(d => d.realtime.power));
    const uptime = data.filter(d => d.realtime.status !== 'offline').length / data.length * 100;
    const avgPerformanceRatio = data.reduce((sum, d) => sum + d.calculated.performanceRatio, 0) / data.length;
    
    return {
      totalEnergyProduced: Math.round(totalEnergy * 100) / 100,
      averageEfficiency: Math.round(avgEfficiency * 100) / 100,
      peakPower: Math.round(peakPower * 100) / 100,
      uptime: Math.round(uptime * 100) / 100,
      performanceRatio: Math.round(avgPerformanceRatio * 100) / 100
    };
  }
  
  private async analyzeTrends(data: PerformanceMetrics[], timeframe: string): Promise<any> {
    // Implement trend analysis algorithms
    return {
      energyProductionTrend: 'stable',
      efficiencyTrend: 'stable',
      degradationRate: 0.5,
      seasonalVariation: 15
    };
  }
  
  private async performBenchmarking(equipmentId: string, data: PerformanceMetrics[]): Promise<any> {
    // Implement benchmarking against expected performance and peer comparison
    return {
      expectedPerformance: 1000,
      actualPerformance: 950,
      performanceIndex: 95,
      peerComparison: {
        percentile: 75,
        similarSystems: 150,
        ranking: 'above_average'
      }
    };
  }
  
  private async identifyIssues(data: PerformanceMetrics[]): Promise<any[]> {
    // Implement issue identification algorithms
    return [];
  }
  
  private async identifyOptimizations(equipmentId: string, data: PerformanceMetrics[]): Promise<any[]> {
    // Implement optimization identification
    return [];
  }
  
  private async checkForAlerts(data: PerformanceMetrics): Promise<PerformanceAlert[]> {
    // Implement alert checking logic
    return [];
  }
  
  private async initializeReliabilityTracking(equipmentId: string): Promise<EquipmentReliabilityData> {
    // Initialize reliability tracking for new equipment
    return {
      equipmentId,
      manufacturer: 'Unknown',
      model: 'Unknown',
      installDate: new Date(),
      reliability: {
        mtbf: 8760, // 1 year in hours
        mttr: 4,
        availability: 99.9,
        failureRate: 0.1,
        expectedLifespan: 25
      },
      failures: [],
      maintenance: [],
      warranty: {
        active: true,
        expirationDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
        claimsSubmitted: 0,
        claimsApproved: 0,
        totalClaimValue: 0
      }
    };
  }
  
  private async updateReliabilityMetrics(data: EquipmentReliabilityData): Promise<EquipmentReliabilityData> {
    // Update reliability metrics based on recent data
    return data;
  }
  
  private generateFleetInsights(comparison: any[]): string[] {
    const insights = [];
    
    // Performance spread analysis
    const performances = comparison.map(c => c.performanceRatio);
    const avgPerformance = performances.reduce((sum, p) => sum + p, 0) / performances.length;
    const minPerformance = Math.min(...performances);
    const maxPerformance = Math.max(...performances);
    
    insights.push(`Fleet average performance ratio: ${avgPerformance.toFixed(1)}%`);
    insights.push(`Performance spread: ${(maxPerformance - minPerformance).toFixed(1)}%`);
    
    // Identify underperformers
    const underperformers = comparison.filter(c => c.performanceRatio < avgPerformance * 0.9);
    if (underperformers.length > 0) {
      insights.push(`${underperformers.length} systems performing below 90% of fleet average`);
    }
    
    return insights;
  }
  
  private generateFleetRecommendations(comparison: any[]): string[] {
    const recommendations = [];
    
    // Identify systems needing attention
    const lowPerformers = comparison.filter(c => c.ranking > comparison.length * 0.8);
    if (lowPerformers.length > 0) {
      recommendations.push('Focus maintenance efforts on bottom 20% performing systems');
    }
    
    // Availability recommendations
    const lowAvailability = comparison.filter(c => c.availability < 95);
    if (lowAvailability.length > 0) {
      recommendations.push('Investigate connectivity issues for systems with <95% availability');
    }
    
    return recommendations;
  }
  
  private calculateEfficiencyTrend(data: PerformanceMetrics[]): number {
    if (data.length < 2) return 0;
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.realtime.efficiency, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.realtime.efficiency, 0) / secondHalf.length;
    
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }
  
  private calculateEquipmentAge(installDate: Date): number {
    return (Date.now() - installDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
  }
  
  private daysSince(date: Date): number {
    return (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000);
  }
}

// =====================================================
// ALERT SYSTEM
// =====================================================

export interface PerformanceAlert {
  id: string;
  equipmentId: string;
  type: 'performance' | 'fault' | 'maintenance' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  
  // Alert details
  details: {
    currentValue: number;
    thresholdValue: number;
    unit: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  
  // Recommended actions
  actions: string[];
  
  // Impact assessment
  impact: {
    energyLoss: number; // kWh/day
    financialImpact: number; // USD/day
    systemAvailability: number; // %
  };
}

export class AlertSystem {
  private alerts: Map<string, PerformanceAlert> = new Map();
  private alertThresholds: Map<string, any> = new Map();
  
  /**
   * Configure alert thresholds
   */
  setAlertThresholds(equipmentId: string, thresholds: {
    minEfficiency: number;
    minPerformanceRatio: number;
    maxTemperature: number;
    minAvailability: number;
  }): void {
    this.alertThresholds.set(equipmentId, thresholds);
  }
  
  /**
   * Check for alert conditions
   */
  checkAlertConditions(data: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const thresholds = this.alertThresholds.get(data.equipmentId);
    
    if (!thresholds) return alerts;
    
    // Check efficiency threshold
    if (data.realtime.efficiency < thresholds.minEfficiency) {
      alerts.push({
        id: `eff-${data.equipmentId}-${Date.now()}`,
        equipmentId: data.equipmentId,
        type: 'performance',
        severity: 'medium',
        title: 'Low Efficiency Alert',
        description: 'Equipment efficiency below threshold',
        timestamp: new Date(),
        acknowledged: false,
        details: {
          currentValue: data.realtime.efficiency,
          thresholdValue: thresholds.minEfficiency,
          unit: '%',
          trend: 'decreasing'
        },
        actions: [
          'Check for shading or soiling',
          'Inspect connections',
          'Schedule maintenance'
        ],
        impact: {
          energyLoss: 10,
          financialImpact: 5,
          systemAvailability: 100
        }
      });
    }
    
    // Check temperature threshold
    if (data.realtime.temperature > thresholds.maxTemperature) {
      alerts.push({
        id: `temp-${data.equipmentId}-${Date.now()}`,
        equipmentId: data.equipmentId,
        type: 'environmental',
        severity: 'high',
        title: 'High Temperature Alert',
        description: 'Equipment temperature exceeds safe operating range',
        timestamp: new Date(),
        acknowledged: false,
        details: {
          currentValue: data.realtime.temperature,
          thresholdValue: thresholds.maxTemperature,
          unit: '°C',
          trend: 'increasing'
        },
        actions: [
          'Check ventilation',
          'Inspect cooling systems',
          'Monitor for thermal damage'
        ],
        impact: {
          energyLoss: 5,
          financialImpact: 2.5,
          systemAvailability: 95
        }
      });
    }
    
    return alerts;
  }
  
  /**
   * Get active alerts
   */
  getActiveAlerts(equipmentId?: string): PerformanceAlert[] {
    const allAlerts = Array.from(this.alerts.values());
    
    if (equipmentId) {
      return allAlerts.filter(alert => 
        alert.equipmentId === equipmentId && !alert.resolvedAt
      );
    }
    
    return allAlerts.filter(alert => !alert.resolvedAt);
  }
  
  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }
  
  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }
}