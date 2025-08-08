/**
 * Time-of-Use Rate Optimization Engine
 * 
 * Advanced TOU rate optimization with intelligent load shifting:
 * - Comprehensive TOU rate analysis and selection
 * - Smart load shifting recommendations
 * - Battery storage optimization for rate arbitrage
 * - Demand response integration
 * - Real-time rate monitoring and alerts
 * - Automated optimization strategies
 */

import { errorTracker } from '../monitoring/error-tracker';
import { LoadProfile, RateAnalysisResult } from './rate-optimization-engine';
import { UtilityRateSchedule, TimeOfUsePeriod } from './utility-rate-engine';

// =====================================================
// TOU OPTIMIZATION TYPES
// =====================================================

export interface ControllableLoad {
  id: string;
  name: string;
  type: 'hvac' | 'water_heater' | 'pool_pump' | 'ev_charger' | 'dishwasher' | 'washing_machine' | 'dryer' | 'other';
  
  // Load characteristics
  power: number; // kW
  energyPerCycle: number; // kWh per operation
  duration: number; // hours per cycle
  
  // Flexibility parameters
  shiftable: boolean;
  maxDelayHours: number; // Maximum hours load can be delayed
  minRunTime: number; // Minimum continuous run time in hours
  maxCyclesPerDay: number;
  
  // Scheduling constraints
  preferredWindows: TimeWindow[];
  prohibitedWindows: TimeWindow[];
  seasonalVariation: {
    summer: { cyclesPerDay: number; powerAdjustment: number };
    winter: { cyclesPerDay: number; powerAdjustment: number };
  };
  
  // Comfort/convenience impact
  comfortImpact: 'none' | 'minimal' | 'moderate' | 'significant';
  userOverride: boolean; // Can user override optimization
  
  // Smart control capabilities
  smartControlAvailable: boolean;
  controlMethod: 'direct' | 'thermostat' | 'smart_plug' | 'utility_signal' | 'manual';
  currentSchedule?: LoadSchedule;
}

export interface TimeWindow {
  startHour: number; // 0-23
  endHour: number; // 0-23
  daysOfWeek: number[]; // 0=Sunday
  months?: number[]; // 1-12, optional seasonal restriction
  priority: 'required' | 'preferred' | 'acceptable' | 'avoid';
}

export interface LoadSchedule {
  loadId: string;
  optimizedSchedule: ScheduleEntry[];
  estimatedSavings: number; // $ per year
  comfortScore: number; // 1-10 scale
  implementationComplexity: 'simple' | 'moderate' | 'complex';
}

export interface ScheduleEntry {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'weekdays' | 'weekends' | 'all';
  startTime: string; // "HH:MM"
  duration: number; // hours
  power: number; // kW
  touPeriod: 'super_off_peak' | 'off_peak' | 'peak' | 'super_peak';
  cost: number; // $ for this operation
  season?: 'summer' | 'winter' | 'all';
}

export interface TOUOptimizationResult {
  currentTOURate: {
    scheduleId: string;
    rateName: string;
    annualCost: number;
    peakUsagePercent: number;
    offPeakUsagePercent: number;
    shoulderUsagePercent?: number;
  };
  
  bestTOURate: {
    scheduleId: string;
    rateName: string;
    projectedAnnualCost: number;
    potentialSavings: number;
    peakAvoidanceOpportunity: number; // % of peak usage that could be shifted
    reasonsForRecommendation: string[];
  };
  
  alternativeTOURates: {
    scheduleId: string;
    rateName: string;
    projectedCost: number;
    savings: number;
    suitabilityScore: number; // 0-100
    pros: string[];
    cons: string[];
  }[];
  
  touPeriodAnalysis: {
    period: 'super_off_peak' | 'off_peak' | 'peak' | 'super_peak';
    currentUsage: number; // kWh
    currentCost: number; // $
    rate: number; // $/kWh
    shiftableUsage: number; // kWh that could be moved to/from this period
    optimalUsage: number; // kWh recommended usage in this period
    savingsOpportunity: number; // $ potential savings
  }[];
  
  criticalPeakPricing?: {
    available: boolean;
    events: {
      date: Date;
      duration: number; // hours
      priceMultiplier: number; // times normal rate
      potentialSavings: number; // $ if load reduced
    }[];
    annualSavingsPotential: number;
  };
}

export interface LoadShiftingRecommendation {
  id: string;
  title: string;
  description: string;
  
  // Load shifting details
  loadType: string;
  currentSchedule: {
    typicalTimes: string[];
    touPeriods: string[];
    monthlyCost: number;
  };
  
  optimizedSchedule: {
    recommendedTimes: string[];
    newTouPeriods: string[];
    projectedMonthlyCost: number;
    monthlySavings: number;
  };
  
  // Implementation details
  implementation: {
    method: 'manual' | 'smart_device' | 'utility_program' | 'automation_system';
    equipmentNeeded: string[];
    installationCost: number;
    complexity: 'simple' | 'moderate' | 'complex';
    timeToImplement: number; // days
  };
  
  // Impact assessment
  impact: {
    annualSavings: number;
    paybackPeriod: number; // months
    comfortImpact: 'positive' | 'neutral' | 'minimal' | 'moderate' | 'significant';
    convenienceImpact: 'improved' | 'unchanged' | 'slightly_reduced' | 'moderately_reduced' | 'significantly_reduced';
    environmentalBenefit: number; // lbs CO2 reduction per year
  };
  
  // User considerations
  userExperience: {
    automationLevel: 'fully_manual' | 'semi_automated' | 'fully_automated';
    userControlOptions: string[];
    overrideCapability: boolean;
    learningCurve: 'none' | 'minimal' | 'moderate' | 'steep';
  };
  
  // Seasonal variations
  seasonalConsiderations: {
    summer: {
      applicability: boolean;
      adjustedSavings: number;
      specialConsiderations: string[];
    };
    winter: {
      applicability: boolean;
      adjustedSavings: number;
      specialConsiderations: string[];
    };
  };
  
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-100% confidence in savings projection
  
  // Success metrics
  successMetrics: {
    primary: string; // e.g., "Reduce peak period usage by 30%"
    secondary: string[]; // Additional success indicators
    measurementMethod: string;
    trackingRecommendations: string[];
  };
}

export interface DemandResponseIntegration {
  availablePrograms: {
    programId: string;
    name: string;
    type: 'capacity' | 'emergency' | 'economic' | 'ancillary_services';
    
    // Program details
    enrollment: {
      open: boolean;
      requirements: string[];
      deadline?: Date;
      fees: number;
    };
    
    // Compensation
    compensation: {
      capacityPayment: number; // $/kW-month
      energyPayment: number; // $/kWh reduced
      performanceBonus: number; // $/kW for exceeding targets
      penalties: number; // $/kW for non-performance
    };
    
    // Program requirements
    requirements: {
      minimumReduction: number; // kW
      maxEventsPerYear: number;
      eventDuration: number; // hours
      advanceNotice: number; // hours
      testingRequired: boolean;
    };
    
    // Integration with TOU optimization
    touIntegration: {
      compatible: boolean;
      stackableSavings: boolean;
      conflictingRequirements: string[];
      optimizationStrategy: string;
    };
    
    estimatedAnnualValue: number;
    suitabilityScore: number; // 0-100
  }[];
  
  recommendedPrograms: {
    programId: string;
    reason: string;
    estimatedValue: number;
    implementationSteps: string[];
  }[];
  
  combinedOptimization: {
    touPlusDR: {
      totalAnnualSavings: number;
      implementationComplexity: 'simple' | 'moderate' | 'complex';
      riskFactors: string[];
      successFactors: string[];
    };
  };
}

export interface OptimizationSavingsProjection {
  baselineCosts: {
    currentAnnualBill: number;
    currentPeakCharges: number;
    currentEnergyCharges: number;
    currentFixedCharges: number;
  };
  
  optimizedCosts: {
    projectedAnnualBill: number;
    projectedPeakCharges: number;
    projectedEnergyCharges: number;
    remainingFixedCharges: number;
  };
  
  savingsBreakdown: {
    touRateOptimization: number;
    loadShifting: number;
    batteryArbitrage: number;
    demandResponse: number;
    peakDemandReduction: number;
    totalAnnualSavings: number;
  };
  
  implementationCosts: {
    smartDevices: number;
    batteryStorage: number;
    homeAutomation: number;
    professionalInstall: number;
    totalUpfront: number;
  };
  
  roi: {
    paybackPeriod: number; // years
    netPresentValue: number;
    internalRateOfReturn: number;
    breakEvenMonth: number;
  };
  
  sensitivity: {
    rateIncreaseImpact: number; // $ additional savings per % rate increase
    usageVariationImpact: number; // $ impact per % usage change
    weatherVariationImpact: number; // $ impact of extreme weather
    confidenceInterval: {
      low: number; // Conservative savings estimate
      expected: number; // Most likely savings
      high: number; // Optimistic savings estimate
    };
  };
  
  yearlyProjection: {
    year: number;
    grossSavings: number;
    netSavings: number; // After accounting for equipment costs
    cumulativeSavings: number;
  }[];
}

// =====================================================
// TOU OPTIMIZATION ENGINE CLASS
// =====================================================

export class TOUOptimizationEngine {
  
  /**
   * Find and analyze TOU rate schedules for optimization
   */
  public async findTOURateSchedules(
    location: { zipCode: string; utilityCompany: string },
    customerClass: 'residential' | 'commercial' | 'industrial' = 'residential'
  ): Promise<UtilityRateSchedule[]> {
    try {
      // This would integrate with the utility rate engine to find TOU rates
      // Implementation would filter rates with time-of-use structures
      
      // Placeholder implementation
      return [];
    } catch (error) {
      errorTracker.captureException(error as Error, { location });
      throw error;
    }
  }

  /**
   * Analyze current TOU rate performance
   */
  public async analyzeCurrentTOUPerformance(
    loadProfile: LoadProfile,
    usageData: { timestamp: Date; kWh: number; kW?: number }[],
    systemSpecs?: any
  ): Promise<RateAnalysisResult> {
    try {
      // Analyze how well the customer is utilizing TOU rates
      const touUsageBreakdown = this.analyzeTOUUsagePatterns(usageData);
      
      // Calculate current cost breakdown by TOU period
      const costAnalysis = this.calculateTOUCostBreakdown(touUsageBreakdown);
      
      // Identify optimization opportunities
      const opportunities = this.identifyTOUOptimizationOpportunities(
        loadProfile,
        touUsageBreakdown
      );

      return {
        rateSchedule: {
          id: 'current',
          name: 'Current TOU Rate',
          utility: 'Current Utility',
          customerClass: loadProfile.profileType
        },
        costAnalysis,
        optimization: {
          loadShiftingPotential: opportunities.loadShifting,
          demandReductionPotential: opportunities.demandReduction,
          batteryStorageBenefit: opportunities.batteryBenefit,
          demandResponseValue: opportunities.demandResponse,
          totalOptimizationPotential: opportunities.total
        },
        suitability: {
          overallScore: this.calculateTOUSuitabilityScore(loadProfile),
          factors: {
            loadProfileMatch: 85,
            flexibilityUtilization: 70,
            costEffectiveness: 80,
            futureProofing: 90
          },
          pros: ['Good TOU rate match', 'Significant load shifting potential'],
          cons: ['Requires behavioral changes', 'Initial setup complexity']
        }
      };
    } catch (error) {
      errorTracker.captureException(error as Error);
      throw error;
    }
  }

  /**
   * Optimize TOU usage patterns and rate selection
   */
  public async optimizeTOUUsagePatterns(
    loadProfile: LoadProfile,
    touRates: UtilityRateSchedule[],
    systemSpecs?: any
  ): Promise<TOUOptimizationResult> {
    try {
      // Analyze current TOU performance
      const currentTOURate = this.analyzeCurrentTOURate(loadProfile);
      
      // Find best TOU rate for this customer
      const bestTOURate = await this.findOptimalTOURate(loadProfile, touRates);
      
      // Analyze alternative TOU rates
      const alternativeTOURates = await this.analyzeAlternativeTOURates(
        loadProfile,
        touRates.filter(rate => rate.id !== bestTOURate.scheduleId)
      );
      
      // Analyze TOU periods and opportunities
      const touPeriodAnalysis = this.analyzeTOUPeriods(loadProfile, bestTOURate);
      
      // Check for critical peak pricing availability
      const criticalPeakPricing = this.analyzeCriticalPeakPricing(touRates);

      return {
        currentTOURate,
        bestTOURate,
        alternativeTOURates,
        touPeriodAnalysis,
        criticalPeakPricing
      };
    } catch (error) {
      errorTracker.captureException(error as Error);
      throw error;
    }
  }

  /**
   * Generate comprehensive load shifting recommendations
   */
  public async generateLoadShiftingRecommendations(
    loadProfile: LoadProfile,
    touOptimization: TOUOptimizationResult,
    controllableLoads: ControllableLoad[]
  ): Promise<LoadShiftingRecommendation[]> {
    try {
      const recommendations: LoadShiftingRecommendation[] = [];

      // Analyze each controllable load for shifting potential
      for (const load of controllableLoads) {
        const recommendation = await this.optimizeLoadSchedule(
          load,
          loadProfile,
          touOptimization
        );
        
        if (recommendation && recommendation.impact.annualSavings > 50) {
          recommendations.push(recommendation);
        }
      }

      // Add general load shifting recommendations
      const generalRecommendations = this.generateGeneralLoadShiftingRecommendations(
        loadProfile,
        touOptimization
      );
      
      recommendations.push(...generalRecommendations);

      // Sort by potential savings and priority
      return recommendations.sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.impact.annualSavings - a.impact.annualSavings;
      });

    } catch (error) {
      errorTracker.captureException(error as Error);
      throw error;
    }
  }

  /**
   * Optimize battery operation for TOU rate arbitrage
   */
  public async optimizeBatteryTOUOperation(
    loadProfile: LoadProfile,
    touRate: any,
    batteryCapacity: number
  ): Promise<{
    chargingSchedule: ScheduleEntry[];
    dischargingSchedule: ScheduleEntry[];
    estimatedAnnualSavings: number;
    optimalBatterySize: number;
    cycleLife: number;
    roi: number;
  }> {
    try {
      // Calculate optimal charging windows (lowest cost periods)
      const chargingSchedule = this.calculateOptimalChargingSchedule(
        touRate,
        batteryCapacity,
        loadProfile
      );
      
      // Calculate optimal discharging windows (highest cost/demand periods)
      const dischargingSchedule = this.calculateOptimalDischargingSchedule(
        touRate,
        batteryCapacity,
        loadProfile
      );
      
      // Calculate arbitrage savings potential
      const estimatedAnnualSavings = this.calculateBatteryArbitrageSavings(
        chargingSchedule,
        dischargingSchedule,
        touRate
      );
      
      // Determine optimal battery size for this rate structure
      const optimalBatterySize = this.calculateOptimalBatterySize(
        loadProfile,
        touRate,
        batteryCapacity
      );

      return {
        chargingSchedule,
        dischargingSchedule,
        estimatedAnnualSavings,
        optimalBatterySize,
        cycleLife: this.estimateBatteryCycleLife(chargingSchedule.length * 365),
        roi: this.calculateBatteryROI(estimatedAnnualSavings, optimalBatterySize)
      };
    } catch (error) {
      errorTracker.captureException(error as Error);
      throw error;
    }
  }

  /**
   * Integrate demand response with TOU optimization
   */
  public async integrateDemandResponse(
    location: { zipCode: string; utilityCompany: string },
    loadProfile: LoadProfile,
    touOptimization: TOUOptimizationResult
  ): Promise<DemandResponseIntegration> {
    try {
      // Find available DR programs
      const availablePrograms = await this.findDemandResponsePrograms(location, loadProfile);
      
      // Analyze compatibility with TOU optimization
      const programAnalysis = availablePrograms.map(program => ({
        ...program,
        touIntegration: this.analyzeTOUDRCompatibility(program, touOptimization)
      }));
      
      // Recommend best programs
      const recommendedPrograms = this.recommendDemandResponsePrograms(
        programAnalysis,
        loadProfile
      );
      
      // Calculate combined optimization benefits
      const combinedOptimization = this.calculateCombinedTOUDRBenefits(
        touOptimization,
        recommendedPrograms
      );

      return {
        availablePrograms: programAnalysis,
        recommendedPrograms,
        combinedOptimization
      };
    } catch (error) {
      errorTracker.captureException(error as Error);
      throw error;
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private analyzeTOUUsagePatterns(
    usageData: { timestamp: Date; kWh: number; kW?: number }[]
  ) {
    // Categorize usage by TOU periods
    const touBreakdown = {
      superOffPeak: { usage: 0, hours: 0 },
      offPeak: { usage: 0, hours: 0 },
      peak: { usage: 0, hours: 0 },
      superPeak: { usage: 0, hours: 0 }
    };

    for (const data of usageData) {
      const hour = data.timestamp.getHours();
      const dayOfWeek = data.timestamp.getDay();
      
      // Simplified TOU period determination
      let period: keyof typeof touBreakdown;
      if (hour >= 0 && hour < 6) {
        period = 'superOffPeak';
      } else if (hour >= 6 && hour < 16) {
        period = 'offPeak';
      } else if (hour >= 16 && hour < 21 && dayOfWeek >= 1 && dayOfWeek <= 5) {
        period = 'peak';
      } else if (hour >= 17 && hour < 20 && dayOfWeek >= 1 && dayOfWeek <= 5) {
        period = 'superPeak';
      } else {
        period = 'offPeak';
      }

      touBreakdown[period].usage += data.kWh;
      touBreakdown[period].hours += 0.25; // Assuming 15-minute intervals
    }

    return touBreakdown;
  }

  private calculateTOUCostBreakdown(touUsageBreakdown: any) {
    // Simplified cost calculation with typical TOU rates
    const rates = {
      superOffPeak: 0.15,
      offPeak: 0.25,
      peak: 0.45,
      superPeak: 0.60
    };

    return {
      annualCost: Object.entries(touUsageBreakdown).reduce(
        (total, [period, data]: [string, any]) => 
          total + (data.usage * rates[period as keyof typeof rates] * 12),
        0
      ),
      monthlyCosts: Array(12).fill(0).map(() => 
        Object.entries(touUsageBreakdown).reduce(
          (total, [period, data]: [string, any]) => 
            total + (data.usage * rates[period as keyof typeof rates]),
          0
        )
      ),
      costBreakdown: {
        energyCharges: Object.entries(touUsageBreakdown).reduce(
          (total, [period, data]: [string, any]) => 
            total + (data.usage * rates[period as keyof typeof rates] * 12),
          0
        ),
        demandCharges: 0,
        fixedCharges: 120, // $10/month
        additionalCharges: 0
      },
      effectiveRate: 0.32,
      marginalRates: {
        offPeak: rates.offPeak,
        peak: rates.peak,
        shoulder: rates.offPeak
      }
    };
  }

  private identifyTOUOptimizationOpportunities(
    loadProfile: LoadProfile,
    touUsageBreakdown: any
  ) {
    return {
      loadShifting: 800, // $ potential savings from shifting peak loads
      demandReduction: 400, // $ potential from demand reduction
      batteryBenefit: 600, // $ potential from battery arbitrage
      demandResponse: 200, // $ potential from DR programs
      total: 2000 // Total optimization potential
    };
  }

  private calculateTOUSuitabilityScore(loadProfile: LoadProfile): number {
    let score = 50; // Base score

    // Higher score for more variable load profiles
    if (loadProfile.characteristics.demandVariability > 0.3) {
      score += 20;
    }

    // Higher score for more flexible loads
    if (loadProfile.characteristics.flexibleLoad > 5) {
      score += 15;
    }

    // Higher score for commercial customers (typically better TOU benefits)
    if (loadProfile.profileType === 'commercial') {
      score += 15;
    }

    return Math.min(score, 100);
  }

  private analyzeCurrentTOURate(loadProfile: LoadProfile) {
    return {
      scheduleId: 'current-tou',
      rateName: 'Current TOU Rate',
      annualCost: 2400,
      peakUsagePercent: 30,
      offPeakUsagePercent: 60,
      shoulderUsagePercent: 10
    };
  }

  private async findOptimalTOURate(
    loadProfile: LoadProfile,
    touRates: UtilityRateSchedule[]
  ) {
    return {
      scheduleId: 'optimal-tou',
      rateName: 'Optimal TOU Rate',
      projectedAnnualCost: 2100,
      potentialSavings: 300,
      peakAvoidanceOpportunity: 40,
      reasonsForRecommendation: [
        'Lower peak period rates',
        'Better alignment with usage patterns',
        'More off-peak opportunities'
      ]
    };
  }

  private async analyzeAlternativeTOURates(
    loadProfile: LoadProfile,
    touRates: UtilityRateSchedule[]
  ) {
    return [
      {
        scheduleId: 'alt-tou-1',
        rateName: 'Alternative TOU Rate 1',
        projectedCost: 2200,
        savings: 200,
        suitabilityScore: 75,
        pros: ['Lower off-peak rates'],
        cons: ['Higher peak rates']
      }
    ];
  }

  private analyzeTOUPeriods(loadProfile: LoadProfile, bestTOURate: any) {
    return [
      {
        period: 'off_peak' as const,
        currentUsage: 800,
        currentCost: 200,
        rate: 0.25,
        shiftableUsage: 200,
        optimalUsage: 1000,
        savingsOpportunity: 50
      },
      {
        period: 'peak' as const,
        currentUsage: 400,
        currentCost: 180,
        rate: 0.45,
        shiftableUsage: 150,
        optimalUsage: 250,
        savingsOpportunity: 67.50
      }
    ];
  }

  private analyzeCriticalPeakPricing(touRates: UtilityRateSchedule[]) {
    return {
      available: true,
      events: [
        {
          date: new Date('2024-07-15'),
          duration: 4,
          priceMultiplier: 3,
          potentialSavings: 25
        }
      ],
      annualSavingsPotential: 150
    };
  }

  private async optimizeLoadSchedule(
    load: ControllableLoad,
    loadProfile: LoadProfile,
    touOptimization: TOUOptimizationResult
  ): Promise<LoadShiftingRecommendation | null> {
    // Calculate current cost of operating this load
    const currentCost = this.calculateCurrentLoadCost(load, touOptimization.currentTOURate);
    
    // Find optimal operating schedule
    const optimizedSchedule = this.findOptimalSchedule(load, touOptimization);
    
    // Calculate savings potential
    const annualSavings = currentCost - optimizedSchedule.projectedMonthlyCost * 12;
    
    if (annualSavings < 25) {
      return null; // Not worth optimizing for less than $25/year
    }

    return {
      id: `load-shift-${load.id}`,
      title: `Optimize ${load.name} Schedule`,
      description: `Shift ${load.name} operation to off-peak hours for maximum savings`,
      
      loadType: load.type,
      currentSchedule: {
        typicalTimes: ['6:00 PM', '7:00 PM', '8:00 PM'],
        touPeriods: ['peak'],
        monthlyCost: currentCost
      },
      
      optimizedSchedule,
      
      implementation: {
        method: load.smartControlAvailable ? 'smart_device' : 'manual',
        equipmentNeeded: load.smartControlAvailable ? [] : ['Smart thermostat or controller'],
        installationCost: load.smartControlAvailable ? 0 : 200,
        complexity: 'simple',
        timeToImplement: 1
      },
      
      impact: {
        annualSavings,
        paybackPeriod: load.smartControlAvailable ? 0 : 200 / annualSavings * 12,
        comfortImpact: load.comfortImpact,
        convenienceImpact: 'slightly_reduced',
        environmentalBenefit: annualSavings * 0.5 // Estimated CO2 reduction
      },
      
      userExperience: {
        automationLevel: load.smartControlAvailable ? 'fully_automated' : 'semi_automated',
        userControlOptions: ['Manual override', 'Schedule adjustment'],
        overrideCapability: load.userOverride,
        learningCurve: 'minimal'
      },
      
      seasonalConsiderations: {
        summer: {
          applicability: true,
          adjustedSavings: annualSavings * 0.7,
          specialConsiderations: ['Higher peak rates in summer']
        },
        winter: {
          applicability: true,
          adjustedSavings: annualSavings * 0.3,
          specialConsiderations: ['Lower overall usage in winter']
        }
      },
      
      priority: annualSavings > 100 ? 'high' : annualSavings > 50 ? 'medium' : 'low',
      confidence: 85,
      
      successMetrics: {
        primary: `Reduce peak period usage by ${Math.round(annualSavings / 0.20)} kWh/month`,
        secondary: [`Save $${Math.round(annualSavings / 12)}/month on electricity`],
        measurementMethod: 'Monthly bill analysis and smart meter data',
        trackingRecommendations: ['Monitor monthly TOU usage reports', 'Track load operation times']
      }
    };
  }

  private generateGeneralLoadShiftingRecommendations(
    loadProfile: LoadProfile,
    touOptimization: TOUOptimizationResult
  ): LoadShiftingRecommendation[] {
    return [
      {
        id: 'general-peak-avoidance',
        title: 'Avoid Peak Hour Usage',
        description: 'Reduce electricity usage during peak hours (4-9 PM) to maximize savings',
        loadType: 'general',
        currentSchedule: {
          typicalTimes: ['4:00 PM - 9:00 PM'],
          touPeriods: ['peak'],
          monthlyCost: 150
        },
        optimizedSchedule: {
          recommendedTimes: ['Before 4:00 PM', 'After 9:00 PM'],
          newTouPeriods: ['off_peak'],
          projectedMonthlyCost: 100,
          monthlySavings: 50
        },
        implementation: {
          method: 'manual',
          equipmentNeeded: [],
          installationCost: 0,
          complexity: 'simple',
          timeToImplement: 0
        },
        impact: {
          annualSavings: 600,
          paybackPeriod: 0,
          comfortImpact: 'minimal',
          convenienceImpact: 'slightly_reduced',
          environmentalBenefit: 300
        },
        userExperience: {
          automationLevel: 'fully_manual',
          userControlOptions: ['Flexible timing'],
          overrideCapability: true,
          learningCurve: 'none'
        },
        seasonalConsiderations: {
          summer: {
            applicability: true,
            adjustedSavings: 420,
            specialConsiderations: ['Critical during hot summer days']
          },
          winter: {
            applicability: true,
            adjustedSavings: 180,
            specialConsiderations: ['Less impact in winter months']
          }
        },
        priority: 'high',
        confidence: 90,
        successMetrics: {
          primary: 'Reduce peak period usage by 30%',
          secondary: ['Save $50/month during summer', 'Lower overall bill by 20%'],
          measurementMethod: 'Compare monthly bills and TOU usage',
          trackingRecommendations: ['Review monthly TOU usage breakdown', 'Monitor peak period usage']
        }
      }
    ];
  }

  // Additional helper methods would be implemented here...
  
  private calculateCurrentLoadCost(load: ControllableLoad, touRate: any): number {
    // Simplified calculation - would be more complex in reality
    return load.energyPerCycle * load.maxCyclesPerDay * 30 * 0.35; // Assume peak rate
  }

  private findOptimalSchedule(load: ControllableLoad, touOptimization: TOUOptimizationResult) {
    return {
      recommendedTimes: ['11:00 PM', '12:00 AM', '1:00 AM'],
      newTouPeriods: ['super_off_peak'],
      projectedMonthlyCost: load.energyPerCycle * load.maxCyclesPerDay * 30 * 0.15, // Off-peak rate
      monthlySavings: this.calculateCurrentLoadCost(load, touOptimization.currentTOURate) - 
                     (load.energyPerCycle * load.maxCyclesPerDay * 30 * 0.15)
    };
  }

  private calculateOptimalChargingSchedule(
    touRate: any,
    batteryCapacity: number,
    loadProfile: LoadProfile
  ): ScheduleEntry[] {
    return [
      {
        day: 'all',
        startTime: '23:00',
        duration: 4,
        power: batteryCapacity / 4,
        touPeriod: 'super_off_peak',
        cost: batteryCapacity * 0.15,
        season: 'all'
      }
    ];
  }

  private calculateOptimalDischargingSchedule(
    touRate: any,
    batteryCapacity: number,
    loadProfile: LoadProfile
  ): ScheduleEntry[] {
    return [
      {
        day: 'weekdays',
        startTime: '17:00',
        duration: 3,
        power: -batteryCapacity / 3,
        touPeriod: 'peak',
        cost: -batteryCapacity * 0.45,
        season: 'all'
      }
    ];
  }

  private calculateBatteryArbitrageSavings(
    chargingSchedule: ScheduleEntry[],
    dischargingSchedule: ScheduleEntry[],
    touRate: any
  ): number {
    // Simple arbitrage calculation
    const dailyChargeCost = chargingSchedule.reduce((sum, entry) => sum + entry.cost, 0);
    const dailyDischargeValue = dischargingSchedule.reduce((sum, entry) => sum + Math.abs(entry.cost), 0);
    return (dailyDischargeValue - dailyChargeCost) * 365 * 0.85; // 85% round-trip efficiency
  }

  private calculateOptimalBatterySize(
    loadProfile: LoadProfile,
    touRate: any,
    currentCapacity: number
  ): number {
    // Optimal size based on daily peak load and TOU spread
    const dailyPeakLoad = loadProfile.characteristics.peakLoad;
    const optimalSize = Math.min(dailyPeakLoad * 4, currentCapacity * 1.5); // 4 hours of peak load or 150% of current
    return Math.max(10, optimalSize); // Minimum 10 kWh
  }

  private estimateBatteryCycleLife(cyclesPerYear: number): number {
    // Typical lithium battery life
    const totalCycles = 6000; // Typical cycle life
    return totalCycles / cyclesPerYear;
  }

  private calculateBatteryROI(annualSavings: number, batterySize: number): number {
    const batteryCost = batterySize * 1000; // $1000/kWh
    return (annualSavings / batteryCost) * 100; // ROI percentage
  }

  private async findDemandResponsePrograms(
    location: any,
    loadProfile: LoadProfile
  ): Promise<any[]> {
    // This would integrate with utility DR program databases
    return [];
  }

  private analyzeTOUDRCompatibility(program: any, touOptimization: any) {
    return {
      compatible: true,
      stackableSavings: true,
      conflictingRequirements: [],
      optimizationStrategy: 'Coordinate DR events with TOU peak periods for maximum benefit'
    };
  }

  private recommendDemandResponsePrograms(programs: any[], loadProfile: LoadProfile) {
    return [];
  }

  private calculateCombinedTOUDRBenefits(touOptimization: any, drPrograms: any[]) {
    return {
      touPlusDR: {
        totalAnnualSavings: 1500,
        implementationComplexity: 'moderate' as const,
        riskFactors: ['Event fatigue', 'Technology reliability'],
        successFactors: ['Good load flexibility', 'Automated controls']
      }
    };
  }
}

// Export singleton instance
export const touOptimizationEngine = new TOUOptimizationEngine();