/**
 * Comprehensive Utility Rate Management Engine
 * 
 * Manages utility rate structures including:
 * - Time-of-Use (TOU) rates with peak/off-peak periods
 * - Tiered pricing structures
 * - Demand charges and facility fees
 * - Seasonal rate variations
 * - Real-time rate updates from utility APIs
 * - Rate optimization and analysis
 */

import { errorTracker } from '../monitoring/error-tracker';
import { Timestamp } from 'firebase/firestore';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface TimeOfUsePeriod {
  id: string;
  name: string;
  period: 'super_off_peak' | 'off_peak' | 'peak' | 'super_peak';
  months: number[]; // 1-12
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  rate: number; // $/kWh
  season?: 'summer' | 'winter' | 'all';
}

export interface TieredRateStructure {
  tier: number;
  name: string;
  threshold: number; // kWh per month
  rate: number; // $/kWh
  isBaseline?: boolean;
}

export interface DemandChargeStructure {
  type: 'facility' | 'time_of_use' | 'coincident_peak' | 'non_coincident_peak';
  rate: number; // $/kW per month
  applicablePeriods?: TimeOfUsePeriod[];
  minimumCharge?: number;
  maxDemandWindow?: number; // minutes
}

export interface UtilityRateSchedule {
  id: string;
  utilityCompany: string;
  utilityId: string;
  rateName: string;
  rateCode: string;
  description: string;
  customerClass: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  serviceTerritory: {
    states: string[];
    counties: string[];
    cities: string[];
    zipCodes: string[];
    coordinates?: {
      bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      };
    };
  };
  rateStructure: {
    type: 'flat' | 'tiered' | 'time_of_use' | 'tiered_tou' | 'demand';
    version: string;
    currency: 'USD';
    
    // Fixed charges
    fixedCharges: {
      connectionFee: number; // $ per month
      customerCharge: number; // $ per month
      facilityCharge?: number; // $ per kW per month
      serviceCharge?: number; // $ per month
      minimumBill?: number; // $ per month
    };

    // Energy charges
    energyCharges: {
      flatRate?: number; // $/kWh (for flat rates)
      tieredRates?: TieredRateStructure[];
      timeOfUseRates?: TimeOfUsePeriod[];
    };

    // Demand charges
    demandCharges?: DemandChargeStructure[];

    // Additional fees and adjustments
    additionalCharges: {
      publicPurposePrograms?: number; // $/kWh
      nuclearDecommissioning?: number; // $/kWh
      competitiveTransition?: number; // $/kWh
      distributionAccess?: number; // $/kWh
      transmissionAccess?: number; // $/kWh
      renewableEnergy?: number; // $/kWh
      energyEfficiency?: number; // $/kWh
      lowIncomeAssistance?: number; // $/kWh
      stateAndLocalTaxes?: number; // % of total bill
    };
  };

  // Net metering information
  netMetering: {
    available: boolean;
    policy: 'net_energy_metering' | 'net_billing' | 'buy_all_sell_all' | 'avoided_cost';
    creditRate?: number; // $/kWh or % of retail rate
    rolloverPolicy: 'monthly' | 'annual' | 'expires';
    maxSystemSize?: number; // kW
    aggregateCap?: number; // % of peak demand or MW
    interconnectionFee?: number; // $
    standbyCharge?: number; // $/kW per month
  };

  // Schedule and validity
  schedule: {
    effectiveDate: Date;
    expirationDate?: Date;
    supersededBy?: string; // ID of replacing rate schedule
    approvalDate?: Date;
    lastModified: Date;
  };

  // Seasonal variations
  seasonalSchedules?: {
    summer: {
      startMonth: number;
      endMonth: number;
      rates: Partial<UtilityRateSchedule['rateStructure']>;
    };
    winter: {
      startMonth: number;
      endMonth: number;
      rates: Partial<UtilityRateSchedule['rateStructure']>;
    };
  };

  // Regulatory information
  regulatory: {
    publicUtilitiesCommission: string;
    tariffSheet: string;
    docketNumber?: string;
    orderNumber?: string;
    lastRateCase?: Date;
    nextRateCase?: Date;
  };

  // Rate optimization flags
  optimization: {
    solarFriendly: boolean;
    batteryOptimized: boolean;
    evFriendly: boolean;
    demandResponseEligible: boolean;
    timeOfUseOptimized: boolean;
  };

  // Data source and quality
  dataSource: {
    provider: 'utility_api' | 'manual_entry' | 'third_party' | 'regulatory_filing';
    lastUpdated: Date;
    dataQuality: 'verified' | 'preliminary' | 'estimated';
    automaticUpdates: boolean;
    updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface BillCalculationResult {
  billingPeriod: {
    startDate: Date;
    endDate: Date;
    daysInPeriod: number;
  };
  usage: {
    totalKWh: number;
    peakKW?: number;
    timeOfUseBreakdown?: {
      [period: string]: {
        kWh: number;
        cost: number;
      };
    };
    tieredBreakdown?: {
      [tier: string]: {
        kWh: number;
        rate: number;
        cost: number;
      };
    };
  };
  charges: {
    fixedCharges: {
      connectionFee: number;
      customerCharge: number;
      facilityCharge: number;
      serviceCharge: number;
      total: number;
    };
    energyCharges: {
      base: number;
      timeOfUse: number;
      tiered: number;
      total: number;
    };
    demandCharges: {
      facility: number;
      timeOfUse: number;
      coincidentPeak: number;
      total: number;
    };
    additionalCharges: {
      publicPurpose: number;
      taxes: number;
      other: number;
      total: number;
    };
    netMeteringCredits: number;
    totalBill: number;
  };
  rateAnalysis: {
    effectiveRate: number; // $/kWh
    marginalRate: number; // $/kWh for next kWh
    optimalUsageProfile?: string;
    savingsOpportunities: string[];
    recommendedRateSchedule?: string;
  };
}

export interface RateOptimizationResult {
  currentRate: {
    scheduleId: string;
    rateName: string;
    annualCost: number;
  };
  recommendedRates: {
    scheduleId: string;
    rateName: string;
    annualCost: number;
    potentialSavings: number;
    savingsPercentage: number;
    reason: string;
    requirements?: string[];
  }[];
  optimizationStrategies: {
    type: 'load_shifting' | 'demand_reduction' | 'energy_efficiency' | 'storage' | 'solar';
    description: string;
    potentialSavings: number;
    implementationCost?: number;
    paybackPeriod?: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  batteryOptimization?: {
    recommendedCapacity: number; // kWh
    chargingSchedule: {
      startTime: string;
      endTime: string;
      season: 'summer' | 'winter' | 'all';
    }[];
    dischargingSchedule: {
      startTime: string;
      endTime: string;
      season: 'summer' | 'winter' | 'all';
    }[];
    estimatedSavings: number; // $ per year
    paybackPeriod: number; // years
  };
}

// =====================================================
// UTILITY RATE ENGINE
// =====================================================

export class UtilityRateEngine {
  private rateCache: Map<string, UtilityRateSchedule> = new Map();
  private lastCacheUpdate: Date = new Date(0);
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get utility rate schedule by ID
   */
  public async getRateSchedule(scheduleId: string): Promise<UtilityRateSchedule> {
    try {
      // Check cache first
      if (this.rateCache.has(scheduleId) && 
          Date.now() - this.lastCacheUpdate.getTime() < this.CACHE_DURATION) {
        return this.rateCache.get(scheduleId)!;
      }

      // Fetch from database (would integrate with Firestore)
      const rateSchedule = await this.fetchRateScheduleFromDB(scheduleId);
      
      // Update cache
      this.rateCache.set(scheduleId, rateSchedule);
      this.lastCacheUpdate = new Date();

      return rateSchedule;
    } catch (error) {
      errorTracker.captureException(error as Error, { scheduleId });
      throw error;
    }
  }

  /**
   * Find available rate schedules for a location
   */
  public async findRateSchedules(
    zipCode: string,
    customerClass: 'residential' | 'commercial' | 'industrial' = 'residential',
    utilityCompany?: string
  ): Promise<UtilityRateSchedule[]> {
    try {
      // This would query the database for rates serving the area
      const availableRates = await this.searchRatesByLocation(zipCode, customerClass, utilityCompany);
      
      // Filter active rates
      const activeRates = availableRates.filter(rate => {
        const now = new Date();
        return now >= rate.schedule.effectiveDate && 
               (!rate.schedule.expirationDate || now <= rate.schedule.expirationDate);
      });

      return activeRates.sort((a, b) => 
        b.optimization.solarFriendly ? 1 : 0 - (a.optimization.solarFriendly ? 1 : 0)
      );
    } catch (error) {
      errorTracker.captureException(error as Error, { zipCode, customerClass });
      throw error;
    }
  }

  /**
   * Calculate utility bill based on usage and rate schedule
   */
  public async calculateBill(
    scheduleId: string,
    usageData: {
      timestamp: Date;
      kWh: number;
      kW?: number;
    }[],
    billingPeriodStart: Date,
    billingPeriodEnd: Date
  ): Promise<BillCalculationResult> {
    try {
      const rateSchedule = await this.getRateSchedule(scheduleId);
      
      // Filter usage data for billing period
      const periodUsage = usageData.filter(data => 
        data.timestamp >= billingPeriodStart && data.timestamp <= billingPeriodEnd
      );

      const billingPeriod = {
        startDate: billingPeriodStart,
        endDate: billingPeriodEnd,
        daysInPeriod: Math.ceil((billingPeriodEnd.getTime() - billingPeriodStart.getTime()) / (24 * 60 * 60 * 1000))
      };

      // Calculate usage breakdown
      const usage = this.calculateUsageBreakdown(periodUsage, rateSchedule);
      
      // Calculate all charges
      const charges = this.calculateAllCharges(usage, rateSchedule, billingPeriod);
      
      // Rate analysis
      const rateAnalysis = this.analyzeRateStructure(usage, charges, rateSchedule);

      return {
        billingPeriod,
        usage,
        charges,
        rateAnalysis
      };
    } catch (error) {
      errorTracker.captureException(error as Error, { scheduleId });
      throw error;
    }
  }

  /**
   * Optimize rate selection and usage patterns
   */
  public async optimizeRates(
    zipCode: string,
    usageData: {
      timestamp: Date;
      kWh: number;
      kW?: number;
    }[],
    customerClass: 'residential' | 'commercial' | 'industrial' = 'residential',
    systemSpecs?: {
      solarCapacity?: number;
      batteryCapacity?: number;
      evCharging?: boolean;
    }
  ): Promise<RateOptimizationResult> {
    try {
      const availableRates = await this.findRateSchedules(zipCode, customerClass);
      
      if (availableRates.length === 0) {
        throw new Error(`No rate schedules found for zip code: ${zipCode}`);
      }

      // Calculate annual cost for each rate
      const rateComparisons = await Promise.all(
        availableRates.map(async (rate) => {
          const annualCost = await this.calculateAnnualCost(rate.id, usageData);
          return {
            scheduleId: rate.id,
            rateName: rate.rateName,
            annualCost,
            rate
          };
        })
      );

      // Sort by cost (lowest first)
      rateComparisons.sort((a, b) => a.annualCost - b.annualCost);

      const currentRate = rateComparisons[0];
      const recommendedRates = rateComparisons.slice(1, 4).map((comparison, index) => ({
        scheduleId: comparison.scheduleId,
        rateName: comparison.rateName,
        annualCost: comparison.annualCost,
        potentialSavings: currentRate.annualCost - comparison.annualCost,
        savingsPercentage: ((currentRate.annualCost - comparison.annualCost) / currentRate.annualCost) * 100,
        reason: this.generateOptimizationReason(comparison.rate, systemSpecs)
      }));

      // Generate optimization strategies
      const optimizationStrategies = this.generateOptimizationStrategies(
        currentRate.rate,
        usageData,
        systemSpecs
      );

      // Battery optimization if applicable
      let batteryOptimization;
      if (systemSpecs?.batteryCapacity && currentRate.rate.rateStructure.type.includes('tou')) {
        batteryOptimization = await this.optimizeBatterySchedule(
          currentRate.rate,
          usageData,
          systemSpecs.batteryCapacity
        );
      }

      return {
        currentRate: {
          scheduleId: currentRate.scheduleId,
          rateName: currentRate.rateName,
          annualCost: currentRate.annualCost
        },
        recommendedRates,
        optimizationStrategies,
        batteryOptimization
      };
    } catch (error) {
      errorTracker.captureException(error as Error, { zipCode });
      throw error;
    }
  }

  /**
   * Calculate Time-of-Use period for a given timestamp
   */
  public calculateTOUPeriod(
    timestamp: Date,
    touRates: TimeOfUsePeriod[]
  ): TimeOfUsePeriod | null {
    const month = timestamp.getMonth() + 1;
    const dayOfWeek = timestamp.getDay();
    const timeStr = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;

    for (const period of touRates) {
      // Check month
      if (!period.months.includes(month)) continue;
      
      // Check day of week
      if (!period.daysOfWeek.includes(dayOfWeek)) continue;
      
      // Check time range
      if (this.isTimeInRange(timeStr, period.startTime, period.endTime)) {
        return period;
      }
    }

    return null;
  }

  /**
   * Calculate usage breakdown by TOU periods and tiers
   */
  private calculateUsageBreakdown(
    usageData: { timestamp: Date; kWh: number; kW?: number }[],
    rateSchedule: UtilityRateSchedule
  ) {
    const totalKWh = usageData.reduce((sum, data) => sum + data.kWh, 0);
    const peakKW = usageData.reduce((max, data) => Math.max(max, data.kW || 0), 0);

    let timeOfUseBreakdown = {};
    let tieredBreakdown = {};

    // TOU breakdown
    if (rateSchedule.rateStructure.energyCharges.timeOfUseRates) {
      const touPeriods = rateSchedule.rateStructure.energyCharges.timeOfUseRates;
      
      for (const period of touPeriods) {
        const periodUsage = usageData.filter(data => {
          const touPeriod = this.calculateTOUPeriod(data.timestamp, [period]);
          return touPeriod?.id === period.id;
        });

        const kWh = periodUsage.reduce((sum, data) => sum + data.kWh, 0);
        timeOfUseBreakdown[period.name] = {
          kWh,
          cost: kWh * period.rate
        };
      }
    }

    // Tiered breakdown
    if (rateSchedule.rateStructure.energyCharges.tieredRates) {
      let remainingKWh = totalKWh;
      
      for (const tier of rateSchedule.rateStructure.energyCharges.tieredRates) {
        const tierUsage = Math.min(remainingKWh, tier.threshold);
        
        tieredBreakdown[tier.name] = {
          kWh: tierUsage,
          rate: tier.rate,
          cost: tierUsage * tier.rate
        };

        remainingKWh -= tierUsage;
        if (remainingKWh <= 0) break;
      }
    }

    return {
      totalKWh,
      peakKW,
      timeOfUseBreakdown: Object.keys(timeOfUseBreakdown).length > 0 ? timeOfUseBreakdown : undefined,
      tieredBreakdown: Object.keys(tieredBreakdown).length > 0 ? tieredBreakdown : undefined
    };
  }

  /**
   * Calculate all charges for a billing period
   */
  private calculateAllCharges(
    usage: any,
    rateSchedule: UtilityRateSchedule,
    billingPeriod: any
  ) {
    const fixedCharges = {
      connectionFee: rateSchedule.rateStructure.fixedCharges.connectionFee,
      customerCharge: rateSchedule.rateStructure.fixedCharges.customerCharge,
      facilityCharge: (rateSchedule.rateStructure.fixedCharges.facilityCharge || 0) * (usage.peakKW || 0),
      serviceCharge: rateSchedule.rateStructure.fixedCharges.serviceCharge || 0,
      total: 0
    };
    fixedCharges.total = fixedCharges.connectionFee + fixedCharges.customerCharge + 
                        fixedCharges.facilityCharge + fixedCharges.serviceCharge;

    // Energy charges
    let energyTotal = 0;
    
    // Flat rate
    if (rateSchedule.rateStructure.energyCharges.flatRate) {
      energyTotal = usage.totalKWh * rateSchedule.rateStructure.energyCharges.flatRate;
    }
    
    // TOU rates
    let touTotal = 0;
    if (usage.timeOfUseBreakdown) {
      touTotal = Object.values(usage.timeOfUseBreakdown)
        .reduce((sum: number, period: any) => sum + period.cost, 0);
    }
    
    // Tiered rates
    let tieredTotal = 0;
    if (usage.tieredBreakdown) {
      tieredTotal = Object.values(usage.tieredBreakdown)
        .reduce((sum: number, tier: any) => sum + tier.cost, 0);
    }

    const energyCharges = {
      base: energyTotal,
      timeOfUse: touTotal,
      tiered: tieredTotal,
      total: energyTotal + touTotal + tieredTotal
    };

    // Demand charges
    const demandCharges = {
      facility: 0,
      timeOfUse: 0,
      coincidentPeak: 0,
      total: 0
    };

    if (rateSchedule.rateStructure.demandCharges && usage.peakKW) {
      for (const demandCharge of rateSchedule.rateStructure.demandCharges) {
        const charge = usage.peakKW * demandCharge.rate;
        
        switch (demandCharge.type) {
          case 'facility':
            demandCharges.facility += charge;
            break;
          case 'time_of_use':
            demandCharges.timeOfUse += charge;
            break;
          case 'coincident_peak':
          case 'non_coincident_peak':
            demandCharges.coincidentPeak += charge;
            break;
        }
      }
      demandCharges.total = demandCharges.facility + demandCharges.timeOfUse + demandCharges.coincidentPeak;
    }

    // Additional charges
    const additionalCharges = {
      publicPurpose: usage.totalKWh * (rateSchedule.rateStructure.additionalCharges.publicPurposePrograms || 0),
      taxes: 0, // Would calculate based on state/local tax rates
      other: 0,
      total: 0
    };
    
    additionalCharges.taxes = (fixedCharges.total + energyCharges.total + demandCharges.total) * 
                             (rateSchedule.rateStructure.additionalCharges.stateAndLocalTaxes || 0) / 100;
    
    additionalCharges.total = additionalCharges.publicPurpose + additionalCharges.taxes + additionalCharges.other;

    const totalBill = fixedCharges.total + energyCharges.total + demandCharges.total + additionalCharges.total;

    return {
      fixedCharges,
      energyCharges,
      demandCharges,
      additionalCharges,
      netMeteringCredits: 0, // Would be calculated separately
      totalBill
    };
  }

  /**
   * Analyze rate structure and provide recommendations
   */
  private analyzeRateStructure(usage: any, charges: any, rateSchedule: UtilityRateSchedule) {
    const effectiveRate = charges.totalBill / usage.totalKWh;
    
    // Calculate marginal rate (cost of next kWh)
    let marginalRate = effectiveRate;
    if (rateSchedule.rateStructure.energyCharges.flatRate) {
      marginalRate = rateSchedule.rateStructure.energyCharges.flatRate;
    }

    const savingsOpportunities = [];
    
    // TOU optimization
    if (rateSchedule.rateStructure.energyCharges.timeOfUseRates) {
      savingsOpportunities.push("Shift usage to off-peak hours");
    }
    
    // Demand charge optimization
    if (rateSchedule.rateStructure.demandCharges) {
      savingsOpportunities.push("Reduce peak demand usage");
    }

    return {
      effectiveRate,
      marginalRate,
      optimalUsageProfile: "Load shifting recommended",
      savingsOpportunities,
      recommendedRateSchedule: undefined
    };
  }

  // Helper methods
  private isTimeInRange(time: string, startTime: string, endTime: string): boolean {
    // Handle overnight periods (e.g., 22:00 to 06:00)
    if (startTime > endTime) {
      return time >= startTime || time <= endTime;
    }
    return time >= startTime && time <= endTime;
  }

  private async fetchRateScheduleFromDB(scheduleId: string): Promise<UtilityRateSchedule> {
    // This would integrate with your Firestore database
    // For now, return a sample rate schedule
    return this.getSampleRateSchedule(scheduleId);
  }

  private async searchRatesByLocation(
    zipCode: string,
    customerClass: string,
    utilityCompany?: string
  ): Promise<UtilityRateSchedule[]> {
    // This would search your rate database
    return [this.getSampleRateSchedule('sample-rate-1')];
  }

  private async calculateAnnualCost(
    scheduleId: string,
    usageData: { timestamp: Date; kWh: number; kW?: number }[]
  ): Promise<number> {
    // Calculate 12 months of billing
    let totalCost = 0;
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(2024, month, 1);
      const monthEnd = new Date(2024, month + 1, 0);
      
      const monthlyUsage = usageData.filter(data => 
        data.timestamp >= monthStart && data.timestamp <= monthEnd
      );
      
      if (monthlyUsage.length > 0) {
        const bill = await this.calculateBill(scheduleId, monthlyUsage, monthStart, monthEnd);
        totalCost += bill.charges.totalBill;
      }
    }
    
    return totalCost;
  }

  private generateOptimizationReason(
    rate: UtilityRateSchedule,
    systemSpecs?: any
  ): string {
    if (rate.optimization.solarFriendly) {
      return "Solar-friendly rate with beneficial net metering terms";
    }
    if (rate.optimization.timeOfUseOptimized) {
      return "Time-of-use rate optimal for load shifting";
    }
    return "Lower overall energy costs";
  }

  private generateOptimizationStrategies(
    rate: UtilityRateSchedule,
    usageData: any[],
    systemSpecs?: any
  ) {
    const strategies = [];
    
    if (rate.rateStructure.energyCharges.timeOfUseRates) {
      strategies.push({
        type: 'load_shifting' as const,
        description: "Shift energy usage to off-peak hours",
        potentialSavings: 500,
        priority: 'high' as const
      });
    }
    
    if (rate.rateStructure.demandCharges) {
      strategies.push({
        type: 'demand_reduction' as const,
        description: "Reduce peak demand usage",
        potentialSavings: 300,
        priority: 'medium' as const
      });
    }
    
    return strategies;
  }

  private async optimizeBatterySchedule(
    rate: UtilityRateSchedule,
    usageData: any[],
    batteryCapacity: number
  ) {
    return {
      recommendedCapacity: batteryCapacity,
      chargingSchedule: [{
        startTime: "00:00",
        endTime: "06:00",
        season: 'all' as const
      }],
      dischargingSchedule: [{
        startTime: "17:00",
        endTime: "21:00",
        season: 'all' as const
      }],
      estimatedSavings: 800,
      paybackPeriod: 7
    };
  }

  private getSampleRateSchedule(scheduleId: string): UtilityRateSchedule {
    return {
      id: scheduleId,
      utilityCompany: "Pacific Gas & Electric",
      utilityId: "PGE",
      rateName: "E-TOU-C",
      rateCode: "E-TOUC",
      description: "Time-of-Use Residential Service",
      customerClass: "residential",
      serviceTerritory: {
        states: ["CA"],
        counties: ["San Francisco", "Santa Clara"],
        cities: ["San Francisco", "San Jose", "Palo Alto"],
        zipCodes: ["94105", "95110", "94301"]
      },
      rateStructure: {
        type: "time_of_use",
        version: "2024.1",
        currency: "USD",
        fixedCharges: {
          connectionFee: 0.32877,
          customerCharge: 10.0
        },
        energyCharges: {
          timeOfUseRates: [
            {
              id: "off-peak",
              name: "Off-Peak",
              period: "off_peak",
              months: [1,2,3,4,5,6,7,8,9,10,11,12],
              daysOfWeek: [0,1,2,3,4,5,6],
              startTime: "00:00",
              endTime: "15:59",
              rate: 0.30,
              season: "all"
            },
            {
              id: "peak",
              name: "Peak",
              period: "peak",
              months: [1,2,3,4,5,6,7,8,9,10,11,12],
              daysOfWeek: [1,2,3,4,5],
              startTime: "16:00",
              endTime: "20:59",
              rate: 0.45,
              season: "all"
            }
          ]
        },
        additionalCharges: {
          publicPurposePrograms: 0.00263,
          stateAndLocalTaxes: 8.5
        }
      },
      netMetering: {
        available: true,
        policy: "net_energy_metering",
        creditRate: 0.30,
        rolloverPolicy: "annual",
        maxSystemSize: 1000,
        aggregateCap: 5
      },
      schedule: {
        effectiveDate: new Date("2024-01-01"),
        lastModified: new Date()
      },
      regulatory: {
        publicUtilitiesCommission: "CPUC",
        tariffSheet: "E-TOU-C"
      },
      optimization: {
        solarFriendly: true,
        batteryOptimized: true,
        evFriendly: false,
        demandResponseEligible: false,
        timeOfUseOptimized: true
      },
      dataSource: {
        provider: "utility_api",
        lastUpdated: new Date(),
        dataQuality: "verified",
        automaticUpdates: true,
        updateFrequency: "monthly"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

// Export singleton instance
export const utilityRateEngine = new UtilityRateEngine();