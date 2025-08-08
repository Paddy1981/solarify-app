/**
 * Rate Optimization and Analysis Engine
 * 
 * Advanced utility rate optimization system that provides:
 * - Intelligent rate schedule selection and comparison
 * - Load profile analysis and rate matching
 * - Battery storage optimization for rate arbitrage
 * - Demand response program integration
 * - Energy usage pattern optimization
 * - Real-time rate monitoring and alerts
 * - Long-term rate strategy planning
 */

import { utilityRateEngine, UtilityRateEngine } from './utility-rate-engine';
import { solarBillingEngine } from './solar-billing-engine';
import { errorTracker } from '../monitoring/error-tracker';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface LoadProfile {
  customerId: string;
  profileType: 'residential' | 'commercial' | 'industrial';
  analysisWindow: {
    startDate: Date;
    endDate: Date;
    totalDays: number;
  };
  
  // Usage patterns
  patterns: {
    hourly: HourlyPattern[];
    daily: DailyPattern[];
    monthly: MonthlyPattern[];
    seasonal: SeasonalPattern[];
  };
  
  // Load characteristics
  characteristics: {
    averageLoad: number; // kW
    peakLoad: number; // kW
    minimumLoad: number; // kW
    loadFactor: number; // average/peak
    demandVariability: number; // coefficient of variation
    baseLoad: number; // kW always required
    flexibleLoad: number; // kW that can be shifted
  };
  
  // Time-of-use analysis
  touAnalysis: {
    peakUsage: number; // kWh during peak hours
    offPeakUsage: number; // kWh during off-peak
    shoulderUsage: number; // kWh during shoulder periods
    peakCoincidence: number; // % usage during system peak
  };
  
  // Demand response potential
  demandResponsePotential: {
    shiftableLoad: number; // kW that can be time-shifted
    curtailableLoad: number; // kW that can be reduced
    responsiveness: 'high' | 'medium' | 'low';
    historicalParticipation: boolean;
  };
}

export interface HourlyPattern {
  hour: number; // 0-23
  averageLoad: number; // kW
  peakLoad: number; // kW
  frequency: number; // how often this pattern occurs
  variability: number; // standard deviation
}

export interface DailyPattern {
  dayOfWeek: number; // 0=Sunday
  averageUsage: number; // kWh
  peakDemand: number; // kW
  loadShape: 'flat' | 'peaked' | 'valley' | 'variable';
}

export interface MonthlyPattern {
  month: number; // 1-12
  averageUsage: number; // kWh
  peakDemand: number; // kW
  coolingLoad?: number; // kWh for cooling
  heatingLoad?: number; // kWh for heating
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  months: number[];
  characteristics: {
    averageUsage: number;
    peakDemand: number;
    dominantLoad: 'heating' | 'cooling' | 'baseload';
  };
}

export interface RateAnalysisResult {
  rateSchedule: {
    id: string;
    name: string;
    utility: string;
    customerClass: string;
  };
  
  // Cost analysis
  costAnalysis: {
    annualCost: number;
    monthlyCosts: number[];
    costBreakdown: {
      energyCharges: number;
      demandCharges: number;
      fixedCharges: number;
      additionalCharges: number;
    };
    effectiveRate: number; // $/kWh average
    marginalRates: {
      offPeak: number;
      peak: number;
      shoulder?: number;
    };
  };
  
  // Optimization opportunities
  optimization: {
    loadShiftingPotential: number; // $ savings potential
    demandReductionPotential: number; // $ savings potential
    batteryStorageBenefit: number; // $ savings with optimal battery
    demandResponseValue: number; // $ value from DR programs
    totalOptimizationPotential: number; // $ total possible savings
  };
  
  // Rate suitability scoring
  suitability: {
    overallScore: number; // 0-100
    factors: {
      loadProfileMatch: number; // 0-100
      flexibilityUtilization: number; // 0-100
      costEffectiveness: number; // 0-100
      futureProofing: number; // 0-100
    };
    pros: string[];
    cons: string[];
  };
}

export interface OptimizationStrategy {
  id: string;
  type: 'rate_switch' | 'load_shifting' | 'demand_reduction' | 'battery_storage' | 
        'demand_response' | 'energy_efficiency' | 'solar_expansion';
  name: string;
  description: string;
  
  // Implementation details
  implementation: {
    complexity: 'simple' | 'moderate' | 'complex';
    timeToImplement: number; // days
    requiresEquipment: boolean;
    requiresBehaviorChange: boolean;
    automationPossible: boolean;
  };
  
  // Financial impact
  financialImpact: {
    upfrontCost: number;
    annualSavings: number;
    paybackPeriod: number; // years
    netPresentValue: number;
    internalRateOfReturn: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  // Technical requirements
  technicalRequirements: {
    smartMeter: boolean;
    homeAutomation: boolean;
    batteryStorage: boolean;
    solarPV: boolean;
    internetConnection: boolean;
    professionalInstallation: boolean;
  };
  
  // Performance metrics
  performance: {
    reliabilityImpact: number; // -10 to +10 scale
    comfortImpact: number; // -10 to +10 scale
    maintenanceRequirement: 'low' | 'medium' | 'high';
    environmentalBenefit: number; // CO2 reduction in lbs/year
  };
}

export interface BatteryOptimizationStrategy {
  batterySpecs: {
    capacity: number; // kWh
    power: number; // kW
    efficiency: number; // round-trip %
    cycleLife: number;
    costPerKWh: number; // $/kWh installed
  };
  
  // Optimized operation schedule
  operationSchedule: {
    charging: OperationWindow[];
    discharging: OperationWindow[];
    seasons: {
      summer: OperationWindow[];
      winter: OperationWindow[];
    };
  };
  
  // Financial analysis
  financialAnalysis: {
    totalCost: number; // $ installed
    annualSavings: number; // $ from rate arbitrage
    demandChargeSavings: number; // $ from peak shaving
    resilienceBenefit: number; // $ value of backup power
    totalBenefitValue: number; // $ total annual value
    paybackPeriod: number; // years
    roi: number; // %
  };
  
  // Performance projections
  performance: {
    cyclesPerYear: number;
    averageDepthOfDischarge: number; // %
    capacityUtilization: number; // %
    expectedLifespan: number; // years
    endOfLifeCapacity: number; // %
  };
}

export interface OperationWindow {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  power: number; // kW (positive = charge, negative = discharge)
  priority: 'high' | 'medium' | 'low';
  season: 'all' | 'summer' | 'winter';
  days: number[]; // 0=Sunday
}

export interface DemandResponseProgram {
  programId: string;
  name: string;
  utility: string;
  type: 'capacity' | 'emergency' | 'economic' | 'ancillary_services';
  
  // Program details
  details: {
    enrollmentPeriod: {
      start: Date;
      end: Date;
    };
    participationRequirements: string[];
    minimumLoadReduction: number; // kW
    maxEventsPerYear: number;
    eventDuration: number; // hours
    advanceNotice: number; // hours
  };
  
  // Compensation structure
  compensation: {
    capacityPayment: number; // $/kW-month
    energyPayment: number; // $/kWh reduced
    performanceBonus: number; // $/kW for overperformance
    penalties: {
      nonPerformance: number; // $/kW
      nonAvailability: number; // $/event
    };
  };
  
  // Eligibility and suitability
  eligibility: {
    customerClasses: string[];
    minimumPeakDemand: number; // kW
    meterRequirements: string[];
    geographicRestrictions: string[];
  };
  
  // Value proposition
  valueProposition: {
    annualCompensation: number; // $ estimated
    loadReductionRequired: number; // kW
    comfortImpact: 'minimal' | 'moderate' | 'significant';
    automationRecommended: boolean;
  };
}

// =====================================================
// RATE OPTIMIZATION ENGINE
// =====================================================

export class RateOptimizationEngine {
  /**
   * Analyze load profile and generate optimization recommendations
   */
  public async optimizeRateSelection(
    customerId: string,
    usageData: { timestamp: Date; kWh: number; kW?: number }[],
    location: { zipCode: string; utilityCompany: string },
    systemSpecs?: { solarCapacity?: number; batteryCapacity?: number }
  ): Promise<{
    currentAnalysis: RateAnalysisResult;
    alternativeRates: RateAnalysisResult[];
    recommendedStrategies: OptimizationStrategy[];
    batteryOptimization?: BatteryOptimizationStrategy;
    demandResponsePrograms: DemandResponseProgram[];
  }> {
    try {
      errorTracker.addBreadcrumb('Starting rate optimization', 'optimization', {
        customerId,
        zipCode: location.zipCode
      });

      // Generate load profile analysis
      const loadProfile = await this.generateLoadProfile(customerId, usageData);

      // Find available rate schedules
      const availableRates = await utilityRateEngine.findRateSchedules(
        location.zipCode,
        loadProfile.profileType,
        location.utilityCompany
      );

      if (availableRates.length === 0) {
        throw new Error(`No rate schedules available for ${location.zipCode}`);
      }

      // Analyze each rate schedule
      const rateAnalyses = await Promise.all(
        availableRates.map(rate => 
          this.analyzeRateSchedule(rate.id, loadProfile, usageData, systemSpecs)
        )
      );

      // Sort by total cost (best first)
      rateAnalyses.sort((a, b) => a.costAnalysis.annualCost - b.costAnalysis.annualCost);

      const currentAnalysis = rateAnalyses[0];
      const alternativeRates = rateAnalyses.slice(1, 5); // Top 5 alternatives

      // Generate optimization strategies
      const recommendedStrategies = await this.generateOptimizationStrategies(
        loadProfile,
        currentAnalysis,
        systemSpecs
      );

      // Battery optimization if applicable
      let batteryOptimization;
      if (systemSpecs?.batteryCapacity || this.shouldRecommendBattery(currentAnalysis, loadProfile)) {
        batteryOptimization = await this.optimizeBatteryStrategy(
          loadProfile,
          currentAnalysis,
          systemSpecs?.batteryCapacity
        );
      }

      // Find demand response programs
      const demandResponsePrograms = await this.findDemandResponsePrograms(
        location,
        loadProfile
      );

      return {
        currentAnalysis,
        alternativeRates,
        recommendedStrategies,
        batteryOptimization,
        demandResponsePrograms
      };

    } catch (error) {
      errorTracker.captureException(error as Error, { customerId });
      throw error;
    }
  }

  /**
   * Generate comprehensive load profile analysis
   */
  private async generateLoadProfile(
    customerId: string,
    usageData: { timestamp: Date; kWh: number; kW?: number }[]
  ): Promise<LoadProfile> {
    const analysisWindow = {
      startDate: usageData[0]?.timestamp || new Date(),
      endDate: usageData[usageData.length - 1]?.timestamp || new Date(),
      totalDays: Math.ceil(
        ((usageData[usageData.length - 1]?.timestamp.getTime() || 0) - 
         (usageData[0]?.timestamp.getTime() || 0)) / (24 * 60 * 60 * 1000)
      )
    };

    // Generate usage patterns
    const patterns = {
      hourly: this.generateHourlyPatterns(usageData),
      daily: this.generateDailyPatterns(usageData),
      monthly: this.generateMonthlyPatterns(usageData),
      seasonal: this.generateSeasonalPatterns(usageData)
    };

    // Calculate load characteristics
    const loads = usageData.map(d => d.kW || d.kWh).filter(l => l > 0);
    const averageLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const peakLoad = Math.max(...loads);
    const minimumLoad = Math.min(...loads);
    const loadFactor = averageLoad / peakLoad;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - averageLoad, 2), 0) / loads.length;
    const demandVariability = Math.sqrt(variance) / averageLoad;

    const characteristics = {
      averageLoad,
      peakLoad,
      minimumLoad,
      loadFactor,
      demandVariability,
      baseLoad: minimumLoad * 0.8, // Estimate base load as 80% of minimum
      flexibleLoad: peakLoad - (minimumLoad * 0.8) // Flexible load is above base load
    };

    // Determine profile type based on characteristics
    let profileType: 'residential' | 'commercial' | 'industrial';
    if (peakLoad < 50) {
      profileType = 'residential';
    } else if (peakLoad < 500) {
      profileType = 'commercial';
    } else {
      profileType = 'industrial';
    }

    // Analyze time-of-use patterns
    const touAnalysis = this.analyzeTOUPatterns(usageData);

    // Assess demand response potential
    const demandResponsePotential = this.assessDemandResponsePotential(patterns, characteristics);

    return {
      customerId,
      profileType,
      analysisWindow,
      patterns,
      characteristics,
      touAnalysis,
      demandResponsePotential
    };
  }

  /**
   * Analyze a specific rate schedule against the load profile
   */
  private async analyzeRateSchedule(
    rateScheduleId: string,
    loadProfile: LoadProfile,
    usageData: { timestamp: Date; kWh: number; kW?: number }[],
    systemSpecs?: { solarCapacity?: number; batteryCapacity?: number }
  ): Promise<RateAnalysisResult> {
    const rateSchedule = await utilityRateEngine.getRateSchedule(rateScheduleId);

    // Calculate annual cost
    const annualCost = await this.calculateAnnualCost(rateScheduleId, usageData);
    const monthlyCosts = await this.calculateMonthlyCosts(rateScheduleId, usageData);

    // Break down costs by component
    const costBreakdown = await this.calculateCostBreakdown(rateSchedule, usageData);

    // Calculate effective rates
    const totalUsage = usageData.reduce((sum, d) => sum + d.kWh, 0);
    const effectiveRate = annualCost / totalUsage;

    // Get marginal rates for different TOU periods
    const marginalRates = this.calculateMarginalRates(rateSchedule);

    // Analyze optimization opportunities
    const optimization = await this.analyzeOptimizationOpportunities(
      rateSchedule,
      loadProfile,
      systemSpecs
    );

    // Calculate suitability score
    const suitability = this.calculateRateSuitability(rateSchedule, loadProfile, optimization);

    return {
      rateSchedule: {
        id: rateSchedule.id,
        name: rateSchedule.rateName,
        utility: rateSchedule.utilityCompany,
        customerClass: rateSchedule.customerClass
      },
      costAnalysis: {
        annualCost,
        monthlyCosts,
        costBreakdown,
        effectiveRate,
        marginalRates
      },
      optimization,
      suitability
    };
  }

  /**
   * Generate optimization strategies based on analysis
   */
  private async generateOptimizationStrategies(
    loadProfile: LoadProfile,
    rateAnalysis: RateAnalysisResult,
    systemSpecs?: { solarCapacity?: number; batteryCapacity?: number }
  ): Promise<OptimizationStrategy[]> {
    const strategies: OptimizationStrategy[] = [];

    // Load shifting strategy
    if (loadProfile.characteristics.flexibleLoad > 5 && // At least 5 kW flexible
        rateAnalysis.optimization.loadShiftingPotential > 200) { // At least $200 savings
      strategies.push(this.createLoadShiftingStrategy(loadProfile, rateAnalysis));
    }

    // Demand reduction strategy
    if (loadProfile.profileType !== 'residential' && 
        rateAnalysis.optimization.demandReductionPotential > 300) {
      strategies.push(this.createDemandReductionStrategy(loadProfile, rateAnalysis));
    }

    // Battery storage strategy
    if (rateAnalysis.optimization.batteryStorageBenefit > 500) {
      strategies.push(this.createBatteryStorageStrategy(loadProfile, rateAnalysis));
    }

    // Energy efficiency strategy
    if (loadProfile.characteristics.averageLoad > 10) {
      strategies.push(this.createEnergyEfficiencyStrategy(loadProfile, rateAnalysis));
    }

    // Solar expansion strategy (if already has solar)
    if (systemSpecs?.solarCapacity && systemSpecs.solarCapacity > 0) {
      strategies.push(this.createSolarExpansionStrategy(loadProfile, rateAnalysis, systemSpecs));
    }

    // Sort by ROI and savings potential
    strategies.sort((a, b) => {
      const aScore = a.financialImpact.internalRateOfReturn * a.financialImpact.annualSavings;
      const bScore = b.financialImpact.internalRateOfReturn * b.financialImpact.annualSavings;
      return bScore - aScore;
    });

    return strategies.slice(0, 5); // Return top 5 strategies
  }

  /**
   * Helper methods for pattern generation and analysis
   */
  private generateHourlyPatterns(usageData: { timestamp: Date; kWh: number; kW?: number }[]): HourlyPattern[] {
    const hourlyData = new Map<number, number[]>();

    for (const data of usageData) {
      const hour = data.timestamp.getHours();
      const load = data.kW || data.kWh;
      
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(load);
    }

    return Array.from({ length: 24 }, (_, hour) => {
      const hourData = hourlyData.get(hour) || [];
      const averageLoad = hourData.length > 0 ? 
        hourData.reduce((sum, load) => sum + load, 0) / hourData.length : 0;
      const peakLoad = hourData.length > 0 ? Math.max(...hourData) : 0;
      const variance = hourData.length > 1 ? 
        hourData.reduce((sum, load) => sum + Math.pow(load - averageLoad, 2), 0) / (hourData.length - 1) : 0;
      
      return {
        hour,
        averageLoad,
        peakLoad,
        frequency: hourData.length,
        variability: Math.sqrt(variance)
      };
    });
  }

  private generateDailyPatterns(usageData: { timestamp: Date; kWh: number; kW?: number }[]): DailyPattern[] {
    const dailyData = new Map<number, { usage: number[]; peak: number }>();

    for (const data of usageData) {
      const dayOfWeek = data.timestamp.getDay();
      const load = data.kW || data.kWh;
      
      if (!dailyData.has(dayOfWeek)) {
        dailyData.set(dayOfWeek, { usage: [], peak: 0 });
      }
      
      const dayData = dailyData.get(dayOfWeek)!;
      dayData.usage.push(load);
      dayData.peak = Math.max(dayData.peak, load);
    }

    return Array.from({ length: 7 }, (_, dayOfWeek) => {
      const dayData = dailyData.get(dayOfWeek);
      const averageUsage = dayData ? 
        dayData.usage.reduce((sum, usage) => sum + usage, 0) / dayData.usage.length : 0;
      const peakDemand = dayData ? dayData.peak : 0;
      
      // Determine load shape based on variability
      let loadShape: 'flat' | 'peaked' | 'valley' | 'variable' = 'flat';
      if (dayData && dayData.usage.length > 0) {
        const variance = dayData.usage.reduce((sum, usage) => 
          sum + Math.pow(usage - averageUsage, 2), 0) / dayData.usage.length;
        const cv = Math.sqrt(variance) / averageUsage;
        
        if (cv < 0.2) loadShape = 'flat';
        else if (cv < 0.5) loadShape = 'peaked';
        else loadShape = 'variable';
      }

      return {
        dayOfWeek,
        averageUsage,
        peakDemand,
        loadShape
      };
    });
  }

  private generateMonthlyPatterns(usageData: { timestamp: Date; kWh: number; kW?: number }[]): MonthlyPattern[] {
    const monthlyData = new Map<number, { usage: number[]; peak: number }>();

    for (const data of usageData) {
      const month = data.timestamp.getMonth() + 1;
      const load = data.kW || data.kWh;
      
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { usage: [], peak: 0 });
      }
      
      const monthData = monthlyData.get(month)!;
      monthData.usage.push(load);
      monthData.peak = Math.max(monthData.peak, load);
    }

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthData = monthlyData.get(month);
      const averageUsage = monthData ? 
        monthData.usage.reduce((sum, usage) => sum + usage, 0) / monthData.usage.length : 0;
      const peakDemand = monthData ? monthData.peak : 0;

      return {
        month,
        averageUsage,
        peakDemand,
        coolingLoad: this.isCoolingMonth(month) ? averageUsage * 0.4 : undefined,
        heatingLoad: this.isHeatingMonth(month) ? averageUsage * 0.3 : undefined
      };
    });
  }

  private generateSeasonalPatterns(usageData: { timestamp: Date; kWh: number; kW?: number }[]): SeasonalPattern[] {
    const seasonalData = {
      spring: { months: [3, 4, 5], usage: [], peak: 0 },
      summer: { months: [6, 7, 8], usage: [], peak: 0 },
      fall: { months: [9, 10, 11], usage: [], peak: 0 },
      winter: { months: [12, 1, 2], usage: [], peak: 0 }
    };

    for (const data of usageData) {
      const month = data.timestamp.getMonth() + 1;
      const load = data.kW || data.kWh;
      
      for (const [season, seasonData] of Object.entries(seasonalData)) {
        if (seasonData.months.includes(month)) {
          seasonData.usage.push(load);
          seasonData.peak = Math.max(seasonData.peak, load);
          break;
        }
      }
    }

    return Object.entries(seasonalData).map(([season, data]) => {
      const averageUsage = data.usage.length > 0 ? 
        data.usage.reduce((sum, usage) => sum + usage, 0) / data.usage.length : 0;
      
      let dominantLoad: 'heating' | 'cooling' | 'baseload' = 'baseload';
      if (season === 'summer') dominantLoad = 'cooling';
      else if (season === 'winter') dominantLoad = 'heating';

      return {
        season: season as 'spring' | 'summer' | 'fall' | 'winter',
        months: data.months,
        characteristics: {
          averageUsage,
          peakDemand: data.peak,
          dominantLoad
        }
      };
    });
  }

  private analyzeTOUPatterns(usageData: { timestamp: Date; kWh: number; kW?: number }[]) {
    let peakUsage = 0;
    let offPeakUsage = 0;
    let shoulderUsage = 0;
    let peakCoincidentUsage = 0;
    let totalSystemPeakHours = 0;

    for (const data of usageData) {
      const hour = data.timestamp.getHours();
      const usage = data.kWh;
      
      // Define TOU periods (simplified)
      if (hour >= 16 && hour <= 21) { // Peak hours
        peakUsage += usage;
        if (hour >= 17 && hour <= 19) { // System peak hours
          peakCoincidentUsage += usage;
          totalSystemPeakHours++;
        }
      } else if (hour >= 9 && hour <= 15 || hour >= 22 && hour <= 23) { // Shoulder
        shoulderUsage += usage;
      } else { // Off-peak
        offPeakUsage += usage;
      }
    }

    const peakCoincidence = totalSystemPeakHours > 0 ? 
      (peakCoincidentUsage / totalSystemPeakHours) / 
      ((peakUsage + offPeakUsage + shoulderUsage) / usageData.length) * 100 : 0;

    return {
      peakUsage,
      offPeakUsage,
      shoulderUsage,
      peakCoincidence
    };
  }

  private assessDemandResponsePotential(patterns: any, characteristics: any) {
    const shiftableLoad = Math.min(
      characteristics.flexibleLoad,
      characteristics.peakLoad * 0.3 // Max 30% of peak load
    );
    
    const curtailableLoad = Math.min(
      characteristics.flexibleLoad * 0.5,
      characteristics.peakLoad * 0.2 // Max 20% of peak load
    );

    let responsiveness: 'high' | 'medium' | 'low' = 'low';
    if (characteristics.demandVariability > 0.3 && shiftableLoad > 10) {
      responsiveness = 'high';
    } else if (characteristics.demandVariability > 0.2 && shiftableLoad > 5) {
      responsiveness = 'medium';
    }

    return {
      shiftableLoad,
      curtailableLoad,
      responsiveness,
      historicalParticipation: false // Would need to check customer history
    };
  }

  // Helper methods for financial calculations and strategy creation
  private async calculateAnnualCost(rateScheduleId: string, usageData: any[]): Promise<number> {
    // Implementation would calculate full year cost
    return 2400; // Placeholder
  }

  private async calculateMonthlyCosts(rateScheduleId: string, usageData: any[]): Promise<number[]> {
    // Implementation would calculate monthly costs
    return Array(12).fill(200); // Placeholder
  }

  private async calculateCostBreakdown(rateSchedule: any, usageData: any[]) {
    // Implementation would break down costs by component
    return {
      energyCharges: 1800,
      demandCharges: 300,
      fixedCharges: 240,
      additionalCharges: 60
    };
  }

  private calculateMarginalRates(rateSchedule: any) {
    // Implementation would extract marginal rates
    return {
      offPeak: 0.15,
      peak: 0.35,
      shoulder: 0.25
    };
  }

  private async analyzeOptimizationOpportunities(
    rateSchedule: any,
    loadProfile: LoadProfile,
    systemSpecs?: any
  ) {
    // Implementation would analyze optimization opportunities
    return {
      loadShiftingPotential: 400,
      demandReductionPotential: 300,
      batteryStorageBenefit: 600,
      demandResponseValue: 200,
      totalOptimizationPotential: 1500
    };
  }

  private calculateRateSuitability(rateSchedule: any, loadProfile: LoadProfile, optimization: any) {
    // Implementation would score rate suitability
    return {
      overallScore: 85,
      factors: {
        loadProfileMatch: 90,
        flexibilityUtilization: 80,
        costEffectiveness: 85,
        futureProofing: 85
      },
      pros: ["Good TOU rate match", "High savings potential"],
      cons: ["Requires behavioral changes"]
    };
  }

  private createLoadShiftingStrategy(loadProfile: LoadProfile, rateAnalysis: RateAnalysisResult): OptimizationStrategy {
    return {
      id: 'load-shifting-001',
      type: 'load_shifting',
      name: 'Peak Load Shifting',
      description: 'Shift flexible loads from peak to off-peak hours',
      implementation: {
        complexity: 'moderate',
        timeToImplement: 30,
        requiresEquipment: true,
        requiresBehaviorChange: true,
        automationPossible: true
      },
      financialImpact: {
        upfrontCost: 2000,
        annualSavings: rateAnalysis.optimization.loadShiftingPotential,
        paybackPeriod: 2000 / rateAnalysis.optimization.loadShiftingPotential,
        netPresentValue: 3000,
        internalRateOfReturn: 20,
        riskLevel: 'low'
      },
      technicalRequirements: {
        smartMeter: true,
        homeAutomation: true,
        batteryStorage: false,
        solarPV: false,
        internetConnection: true,
        professionalInstallation: true
      },
      performance: {
        reliabilityImpact: 0,
        comfortImpact: -2,
        maintenanceRequirement: 'low',
        environmentalBenefit: 500
      }
    };
  }

  private createDemandReductionStrategy(loadProfile: LoadProfile, rateAnalysis: RateAnalysisResult): OptimizationStrategy {
    return {
      id: 'demand-reduction-001',
      type: 'demand_reduction',
      name: 'Peak Demand Reduction',
      description: 'Reduce peak demand through load management',
      implementation: {
        complexity: 'moderate',
        timeToImplement: 45,
        requiresEquipment: true,
        requiresBehaviorChange: false,
        automationPossible: true
      },
      financialImpact: {
        upfrontCost: 5000,
        annualSavings: rateAnalysis.optimization.demandReductionPotential,
        paybackPeriod: 5000 / rateAnalysis.optimization.demandReductionPotential,
        netPresentValue: 8000,
        internalRateOfReturn: 15,
        riskLevel: 'medium'
      },
      technicalRequirements: {
        smartMeter: true,
        homeAutomation: true,
        batteryStorage: false,
        solarPV: false,
        internetConnection: true,
        professionalInstallation: true
      },
      performance: {
        reliabilityImpact: 5,
        comfortImpact: 0,
        maintenanceRequirement: 'medium',
        environmentalBenefit: 800
      }
    };
  }

  private createBatteryStorageStrategy(loadProfile: LoadProfile, rateAnalysis: RateAnalysisResult): OptimizationStrategy {
    return {
      id: 'battery-storage-001',
      type: 'battery_storage',
      name: 'Battery Energy Storage',
      description: 'Install battery storage for rate arbitrage and backup power',
      implementation: {
        complexity: 'complex',
        timeToImplement: 60,
        requiresEquipment: true,
        requiresBehaviorChange: false,
        automationPossible: true
      },
      financialImpact: {
        upfrontCost: 15000,
        annualSavings: rateAnalysis.optimization.batteryStorageBenefit,
        paybackPeriod: 15000 / rateAnalysis.optimization.batteryStorageBenefit,
        netPresentValue: 12000,
        internalRateOfReturn: 12,
        riskLevel: 'medium'
      },
      technicalRequirements: {
        smartMeter: true,
        homeAutomation: true,
        batteryStorage: true,
        solarPV: false,
        internetConnection: true,
        professionalInstallation: true
      },
      performance: {
        reliabilityImpact: 8,
        comfortImpact: 0,
        maintenanceRequirement: 'medium',
        environmentalBenefit: 1200
      }
    };
  }

  private createEnergyEfficiencyStrategy(loadProfile: LoadProfile, rateAnalysis: RateAnalysisResult): OptimizationStrategy {
    return {
      id: 'energy-efficiency-001',
      type: 'energy_efficiency',
      name: 'Energy Efficiency Upgrades',
      description: 'Implement energy efficiency measures to reduce overall usage',
      implementation: {
        complexity: 'simple',
        timeToImplement: 14,
        requiresEquipment: true,
        requiresBehaviorChange: false,
        automationPossible: false
      },
      financialImpact: {
        upfrontCost: 3000,
        annualSavings: 300,
        paybackPeriod: 10,
        netPresentValue: 2000,
        internalRateOfReturn: 8,
        riskLevel: 'low'
      },
      technicalRequirements: {
        smartMeter: false,
        homeAutomation: false,
        batteryStorage: false,
        solarPV: false,
        internetConnection: false,
        professionalInstallation: true
      },
      performance: {
        reliabilityImpact: 2,
        comfortImpact: 2,
        maintenanceRequirement: 'low',
        environmentalBenefit: 2000
      }
    };
  }

  private createSolarExpansionStrategy(loadProfile: LoadProfile, rateAnalysis: RateAnalysisResult, systemSpecs: any): OptimizationStrategy {
    return {
      id: 'solar-expansion-001',
      type: 'solar_expansion',
      name: 'Solar System Expansion',
      description: 'Expand existing solar system to increase self-consumption',
      implementation: {
        complexity: 'moderate',
        timeToImplement: 90,
        requiresEquipment: true,
        requiresBehaviorChange: false,
        automationPossible: false
      },
      financialImpact: {
        upfrontCost: 8000,
        annualSavings: 800,
        paybackPeriod: 10,
        netPresentValue: 5000,
        internalRateOfReturn: 10,
        riskLevel: 'low'
      },
      technicalRequirements: {
        smartMeter: false,
        homeAutomation: false,
        batteryStorage: false,
        solarPV: true,
        internetConnection: false,
        professionalInstallation: true
      },
      performance: {
        reliabilityImpact: 0,
        comfortImpact: 0,
        maintenanceRequirement: 'low',
        environmentalBenefit: 3000
      }
    };
  }

  private shouldRecommendBattery(rateAnalysis: RateAnalysisResult, loadProfile: LoadProfile): boolean {
    return rateAnalysis.optimization.batteryStorageBenefit > 500 && 
           loadProfile.characteristics.peakLoad > 10;
  }

  private async optimizeBatteryStrategy(
    loadProfile: LoadProfile,
    rateAnalysis: RateAnalysisResult,
    existingCapacity?: number
  ): Promise<BatteryOptimizationStrategy> {
    // Implementation would optimize battery sizing and operation
    return {
      batterySpecs: {
        capacity: 20,
        power: 10,
        efficiency: 90,
        cycleLife: 6000,
        costPerKWh: 750
      },
      operationSchedule: {
        charging: [{
          startTime: "00:00",
          endTime: "06:00",
          power: 5,
          priority: 'high',
          season: 'all',
          days: [0, 1, 2, 3, 4, 5, 6]
        }],
        discharging: [{
          startTime: "17:00",
          endTime: "21:00",
          power: -8,
          priority: 'high',
          season: 'all',
          days: [1, 2, 3, 4, 5]
        }],
        seasons: {
          summer: [],
          winter: []
        }
      },
      financialAnalysis: {
        totalCost: 15000,
        annualSavings: 800,
        demandChargeSavings: 300,
        resilienceBenefit: 200,
        totalBenefitValue: 1300,
        paybackPeriod: 11.5,
        roi: 8.7
      },
      performance: {
        cyclesPerYear: 250,
        averageDepthOfDischarge: 80,
        capacityUtilization: 65,
        expectedLifespan: 15,
        endOfLifeCapacity: 80
      }
    };
  }

  private async findDemandResponsePrograms(
    location: { zipCode: string; utilityCompany: string },
    loadProfile: LoadProfile
  ): Promise<DemandResponseProgram[]> {
    // Implementation would query available DR programs
    return [];
  }

  // Utility helper methods
  private isCoolingMonth(month: number): boolean {
    return month >= 6 && month <= 9;
  }

  private isHeatingMonth(month: number): boolean {
    return month <= 3 || month >= 11;
  }
}

// Export singleton instance
export const rateOptimizationEngine = new RateOptimizationEngine();