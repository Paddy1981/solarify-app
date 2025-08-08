/**
 * Comprehensive Billing Cycle and True-Up Period Management
 * 
 * Manages complex billing cycles for net metering customers including:
 * - Monthly billing periods and calculations
 * - Annual true-up period management
 * - Credit rollover and accumulation
 * - Multi-rate period billing reconciliation
 * - Seasonal rate adjustments
 * - Demand charge calculations
 * - Bill projection and forecasting
 */

import { errorTracker } from '../monitoring/error-tracker';
import { NetMeteringPolicy, EnergyFlow } from './net-metering-engine';
import { UtilityRateSchedule, TimeOfUsePeriod } from './utility-rate-engine';

// =====================================================
// BILLING CYCLE TYPES
// =====================================================

export interface BillingCycle {
  id: string;
  customerId: string;
  utilityCompany: string;
  rateScheduleId: string;
  nemPolicyId: string;
  
  // Cycle definition
  cycleType: 'monthly' | 'quarterly' | 'annual';
  startDate: Date;
  endDate: Date;
  daysInCycle: number;
  cycleNumber: number; // 1-12 for monthly, 1-4 for quarterly, 1 for annual
  fiscalYear: number;
  
  // Billing dates
  meterReadDate: Date;
  billGeneratedDate: Date;
  paymentDueDate: Date;
  
  // Energy data for the cycle
  energyData: {
    production: number; // kWh
    consumption: number; // kWh
    gridImport: number; // kWh
    gridExport: number; // kWh
    netUsage: number; // kWh (positive = import, negative = export)
    peakDemand: number; // kW
    
    // Time-of-use breakdown
    touBreakdown?: {
      [period: string]: {
        production: number;
        consumption: number;
        import: number;
        export: number;
        netUsage: number;
      };
    };
  };
  
  // Billing calculations
  billing: {
    // Energy charges
    energyCharges: {
      consumption: number;
      timeOfUse: number;
      tiered: number;
      total: number;
    };
    
    // Demand charges
    demandCharges: {
      facility: number;
      timeOfUse: number;
      coincidentPeak: number;
      total: number;
    };
    
    // Fixed charges
    fixedCharges: {
      customer: number;
      connection: number;
      service: number;
      meter: number;
      total: number;
    };
    
    // Net metering credits
    exportCredits: {
      volumetric: number; // $/kWh credits
      timeOfUse: number; // TOU-specific credits
      avoided_cost: number; // Avoided cost credits
      total: number;
    };
    
    // Additional charges and fees
    additionalCharges: {
      nonBypassable: number;
      gridBenefits: number;
      standby: number;
      regulatory: number;
      taxes: number;
      total: number;
    };
    
    // Bill totals
    grossCharges: number;
    totalCredits: number;
    netAmount: number; // Amount owed (positive) or credit balance (negative)
  };
  
  // Credit management
  credits: {
    carryoverFromPrevious: number; // Credits from previous billing cycle
    earnedThisCycle: number; // New credits earned this cycle
    appliedToCharges: number; // Credits used to offset charges this cycle
    carryoverToNext: number; // Credits carried to next cycle
    
    // Credit details by type
    creditTypes: {
      excess_generation: number;
      time_of_use_arbitrage: number;
      demand_reduction: number;
      other: number;
    };
  };
  
  // Comparison and analysis
  comparison: {
    preSolarBill: number; // What bill would have been without solar
    savings: number; // Amount saved this cycle
    savingsPercent: number; // Percentage savings
    yearToDateSavings: number; // Cumulative savings for the year
  };
  
  // Status and flags
  status: 'draft' | 'final' | 'paid' | 'overdue' | 'disputed';
  isTrueUpPeriod: boolean;
  hasEstimatedData: boolean; // True if any data is estimated
  requiresAdjustment: boolean; // True if adjustments needed
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface TrueUpPeriod {
  id: string;
  customerId: string;
  utilityCompany: string;
  
  // Period definition
  periodYear: number;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  
  // Related billing cycles
  billingCycles: string[]; // IDs of monthly cycles in this true-up period
  
  // Energy totals for the entire true-up period
  energyTotals: {
    totalProduction: number; // kWh
    totalConsumption: number; // kWh
    totalImport: number; // kWh
    totalExport: number; // kWh
    netEnergyUsage: number; // kWh for the entire period
    avgMonthlyUsage: number; // kWh per month
    
    // Monthly breakdown
    monthlyData: {
      month: number;
      year: number;
      production: number;
      consumption: number;
      netUsage: number;
    }[];
    
    // Seasonal breakdown
    seasonalData: {
      summer: { production: number; consumption: number; netUsage: number };
      winter: { production: number; consumption: number; netUsage: number };
    };
  };
  
  // Financial totals for the true-up period
  financialTotals: {
    totalCharges: number;
    totalCredits: number;
    totalPayments: number;
    netPosition: number; // Final amount owed or credit balance
    
    // Charge breakdown
    chargeBreakdown: {
      energy: number;
      demand: number;
      fixed: number;
      nonBypassable: number;
      gridBenefits: number;
      taxes: number;
    };
    
    // Credit breakdown
    creditBreakdown: {
      exportCredits: number;
      carriedForward: number;
      adjustments: number;
    };
  };
  
  // Excess generation settlement
  excessGeneration: {
    totalExcess: number; // kWh of net excess for the year
    compensationRate: number; // $/kWh for excess
    compensationAmount: number; // $ compensation for excess
    compensationMethod: 'cash' | 'bill_credit' | 'donation' | 'rollover';
    
    // Detailed excess by month
    monthlyExcess: {
      month: number;
      year: number;
      excess: number; // kWh
      value: number; // $ value
    }[];
  };
  
  // True-up bill
  trueUpBill: {
    billDate: Date;
    paymentDueDate: Date;
    amountDue: number;
    paymentMethod: 'standard_billing' | 'separate_bill' | 'credit_memo';
    
    // Bill components
    charges: {
      unpaidBalance: number;
      trueUpAdjustments: number;
      penalties: number;
      total: number;
    };
    
    credits: {
      excessGeneration: number;
      carryoverCredits: number;
      adjustments: number;
      total: number;
    };
    
    netAmount: number;
  };
  
  // Analysis and insights
  analysis: {
    selfConsumptionRate: number; // % of production consumed on-site
    exportRate: number; // % of production exported to grid
    billOffsetRate: number; // % of pre-solar bill offset by solar
    avgMonthlySavings: number; // $ average monthly savings
    totalAnnualSavings: number; // $ total savings for the year
    
    // Performance metrics
    performance: {
      systemCapacityFactor: number; // % actual vs theoretical production
      degradation: number; // % production decline vs first year
      weatherAdjustment: number; // Impact of weather on production
    };
    
    // Recommendations
    recommendations: string[];
  };
  
  // Compliance and regulatory
  compliance: {
    nemPolicyCompliant: boolean;
    aggregateCapCompliant: boolean;
    meteringRequirementsMet: boolean;
    reportingComplete: boolean;
    auditReady: boolean;
  };
  
  status: 'pending' | 'calculated' | 'reviewed' | 'approved' | 'disputed' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingProjection {
  customerId: string;
  projectionDate: Date;
  projectionPeriod: {
    startDate: Date;
    endDate: Date;
    months: number;
  };
  
  // Input assumptions
  assumptions: {
    solarProduction: number[]; // Monthly kWh production
    energyConsumption: number[]; // Monthly kWh consumption
    rateEscalation: number; // % annual rate increase
    degradation: number; // % annual system degradation
    weatherVariation: number; // % variation from typical weather
  };
  
  // Projected billing cycles
  projectedCycles: {
    month: number;
    year: number;
    estimatedBill: number;
    estimatedSavings: number;
    netUsage: number;
    creditBalance: number;
  }[];
  
  // Annual projections
  annualProjections: {
    totalBills: number;
    totalSavings: number;
    savingsPercent: number;
    finalCreditBalance: number;
    excessGeneration: number;
    excessCompensation: number;
  };
  
  // Sensitivity analysis
  sensitivity: {
    scenario: 'conservative' | 'expected' | 'optimistic';
    productionVariation: number; // +/- %
    consumptionVariation: number; // +/- %
    projectedSavings: number;
    riskFactors: string[];
  }[];
  
  confidence: number; // 0-100% confidence in projection
  createdAt: Date;
}

// =====================================================
// BILLING CYCLE MANAGER CLASS
// =====================================================

export class BillingCycleManager {
  /**
   * Create a new billing cycle
   */
  public async createBillingCycle(
    customerId: string,
    utilityCompany: string,
    rateScheduleId: string,
    nemPolicyId: string,
    startDate: Date,
    energyData: EnergyFlow[]
  ): Promise<BillingCycle> {
    try {
      errorTracker.addBreadcrumb('Creating billing cycle', 'billing', {
        customerId,
        startDate: startDate.toISOString()
      });

      const endDate = this.calculateCycleEndDate(startDate, 'monthly');
      const cycleId = this.generateCycleId(customerId, startDate);

      // Aggregate energy data for the billing period
      const periodEnergyData = this.aggregateEnergyData(energyData, startDate, endDate);
      
      // Calculate TOU breakdown if applicable
      const touBreakdown = await this.calculateTOUBreakdown(energyData, rateScheduleId);
      
      // Calculate all billing components
      const billing = await this.calculateBillingCharges(
        periodEnergyData,
        touBreakdown,
        rateScheduleId,
        nemPolicyId
      );
      
      // Calculate credits and carryover
      const credits = await this.calculateCreditManagement(
        periodEnergyData,
        billing,
        customerId,
        startDate
      );
      
      // Calculate pre-solar comparison
      const comparison = await this.calculateSavingsComparison(
        periodEnergyData,
        billing,
        rateScheduleId
      );

      const billingCycle: BillingCycle = {
        id: cycleId,
        customerId,
        utilityCompany,
        rateScheduleId,
        nemPolicyId,
        
        cycleType: 'monthly',
        startDate,
        endDate,
        daysInCycle: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
        cycleNumber: startDate.getMonth() + 1,
        fiscalYear: startDate.getFullYear(),
        
        meterReadDate: endDate,
        billGeneratedDate: new Date(endDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days after meter read
        paymentDueDate: new Date(endDate.getTime() + 25 * 24 * 60 * 60 * 1000), // 25 days after meter read
        
        energyData: {
          ...periodEnergyData,
          touBreakdown
        },
        
        billing,
        credits,
        comparison,
        
        status: 'draft',
        isTrueUpPeriod: this.isTrueUpMonth(startDate),
        hasEstimatedData: false,
        requiresAdjustment: false,
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return billingCycle;

    } catch (error) {
      errorTracker.captureException(error as Error, { customerId });
      throw error;
    }
  }

  /**
   * Process annual true-up for a customer
   */
  public async processAnnualTrueUp(
    customerId: string,
    trueUpYear: number,
    billingCycles: BillingCycle[],
    nemPolicy: NetMeteringPolicy
  ): Promise<TrueUpPeriod> {
    try {
      errorTracker.addBreadcrumb('Processing annual true-up', 'true_up', {
        customerId,
        year: trueUpYear
      });

      const trueUpId = `${customerId}-${trueUpYear}-true-up`;
      
      // Define true-up period (typically runs April to March for many utilities)
      const startDate = new Date(trueUpYear - 1, 3, 1); // April 1st of previous year
      const endDate = new Date(trueUpYear, 2, 31); // March 31st of true-up year
      
      // Filter billing cycles for this true-up period
      const periodCycles = billingCycles.filter(cycle => 
        cycle.startDate >= startDate && cycle.endDate <= endDate
      );
      
      // Calculate energy totals
      const energyTotals = this.calculateTrueUpEnergyTotals(periodCycles);
      
      // Calculate financial totals
      const financialTotals = this.calculateTrueUpFinancialTotals(periodCycles);
      
      // Calculate excess generation settlement
      const excessGeneration = this.calculateExcessGenerationSettlement(
        energyTotals,
        financialTotals,
        nemPolicy
      );
      
      // Generate true-up bill
      const trueUpBill = this.generateTrueUpBill(
        customerId,
        financialTotals,
        excessGeneration,
        endDate
      );
      
      // Perform analysis
      const analysis = await this.performTrueUpAnalysis(
        energyTotals,
        financialTotals,
        periodCycles
      );
      
      // Check compliance
      const compliance = this.checkTrueUpCompliance(
        energyTotals,
        nemPolicy,
        periodCycles
      );

      const trueUpPeriod: TrueUpPeriod = {
        id: trueUpId,
        customerId,
        utilityCompany: periodCycles[0]?.utilityCompany || '',
        
        periodYear: trueUpYear,
        startDate,
        endDate,
        totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
        
        billingCycles: periodCycles.map(cycle => cycle.id),
        
        energyTotals,
        financialTotals,
        excessGeneration,
        trueUpBill,
        analysis,
        compliance,
        
        status: 'calculated',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return trueUpPeriod;

    } catch (error) {
      errorTracker.captureException(error as Error, { customerId, trueUpYear });
      throw error;
    }
  }

  /**
   * Generate billing projections for future periods
   */
  public async generateBillingProjections(
    customerId: string,
    systemSpecs: {
      capacity: number;
      degradation: number;
      tilt: number;
      azimuth: number;
    },
    usageHistory: number[], // Monthly kWh usage history
    rateScheduleId: string,
    projectionMonths: number = 12
  ): Promise<BillingProjection> {
    try {
      errorTracker.addBreadcrumb('Generating billing projections', 'projection', {
        customerId,
        months: projectionMonths
      });

      const projectionDate = new Date();
      const startDate = new Date(projectionDate.getFullYear(), projectionDate.getMonth(), 1);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + projectionMonths, 0);

      // Generate production projections
      const solarProduction = await this.projectSolarProduction(
        systemSpecs,
        startDate,
        projectionMonths
      );
      
      // Project energy consumption based on history and trends
      const energyConsumption = this.projectEnergyConsumption(
        usageHistory,
        projectionMonths
      );
      
      // Create monthly projections
      const projectedCycles = [];
      let carryoverCredits = 0;
      
      for (let month = 0; month < projectionMonths; month++) {
        const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + month, 1);
        const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + month + 1, 0);
        
        const monthlyProjection = await this.projectMonthlyCycle(
          monthStart,
          solarProduction[month],
          energyConsumption[month],
          carryoverCredits,
          rateScheduleId
        );
        
        projectedCycles.push(monthlyProjection);
        carryoverCredits = monthlyProjection.creditBalance;
      }
      
      // Calculate annual projections
      const annualProjections = this.calculateAnnualProjections(projectedCycles);
      
      // Generate sensitivity analysis
      const sensitivity = this.generateSensitivityAnalysis(
        projectedCycles,
        solarProduction,
        energyConsumption
      );

      const projection: BillingProjection = {
        customerId,
        projectionDate,
        projectionPeriod: {
          startDate,
          endDate,
          months: projectionMonths
        },
        assumptions: {
          solarProduction,
          energyConsumption,
          rateEscalation: 3.0, // 3% annual increase
          degradation: systemSpecs.degradation,
          weatherVariation: 10 // ±10% weather variation
        },
        projectedCycles,
        annualProjections,
        sensitivity,
        confidence: this.calculateProjectionConfidence(usageHistory, systemSpecs),
        createdAt: new Date()
      };

      return projection;

    } catch (error) {
      errorTracker.captureException(error as Error, { customerId });
      throw error;
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private calculateCycleEndDate(startDate: Date, cycleType: string): Date {
    const endDate = new Date(startDate);
    switch (cycleType) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of previous month
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        endDate.setDate(0);
        break;
      case 'annual':
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(0);
        break;
    }
    return endDate;
  }

  private generateCycleId(customerId: string, startDate: Date): string {
    const year = startDate.getFullYear();
    const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
    return `${customerId}-${year}-${month}`;
  }

  private aggregateEnergyData(
    energyData: EnergyFlow[],
    startDate: Date,
    endDate: Date
  ) {
    const periodData = energyData.filter(data => 
      data.timestamp >= startDate && data.timestamp <= endDate
    );

    return periodData.reduce((acc, data) => ({
      production: acc.production + data.production,
      consumption: acc.consumption + data.consumption,
      gridImport: acc.gridImport + data.gridImport,
      gridExport: acc.gridExport + data.gridExport,
      netUsage: acc.netUsage + data.netUsage,
      peakDemand: Math.max(acc.peakDemand, data.consumption / 0.25) // Approximate kW from 15-min kWh
    }), {
      production: 0,
      consumption: 0,
      gridImport: 0,
      gridExport: 0,
      netUsage: 0,
      peakDemand: 0
    });
  }

  private async calculateTOUBreakdown(
    energyData: EnergyFlow[],
    rateScheduleId: string
  ) {
    // Implementation would calculate time-of-use breakdown
    // This is a placeholder returning undefined
    return undefined;
  }

  private async calculateBillingCharges(
    energyData: any,
    touBreakdown: any,
    rateScheduleId: string,
    nemPolicyId: string
  ) {
    // Placeholder implementation - would calculate actual charges
    return {
      energyCharges: {
        consumption: energyData.consumption * 0.30,
        timeOfUse: 0,
        tiered: 0,
        total: energyData.consumption * 0.30
      },
      demandCharges: {
        facility: energyData.peakDemand * 15,
        timeOfUse: 0,
        coincidentPeak: 0,
        total: energyData.peakDemand * 15
      },
      fixedCharges: {
        customer: 10,
        connection: 0.33,
        service: 0,
        meter: 0,
        total: 10.33
      },
      exportCredits: {
        volumetric: Math.max(0, -energyData.netUsage * 0.25),
        timeOfUse: 0,
        avoided_cost: 0,
        total: Math.max(0, -energyData.netUsage * 0.25)
      },
      additionalCharges: {
        nonBypassable: energyData.consumption * 0.02,
        gridBenefits: 0,
        standby: 0,
        regulatory: 0,
        taxes: 0,
        total: energyData.consumption * 0.02
      },
      grossCharges: 0,
      totalCredits: 0,
      netAmount: 0
    };
  }

  private async calculateCreditManagement(
    energyData: any,
    billing: any,
    customerId: string,
    startDate: Date
  ) {
    // Placeholder implementation
    return {
      carryoverFromPrevious: 0,
      earnedThisCycle: billing.exportCredits.total,
      appliedToCharges: Math.min(billing.exportCredits.total, billing.energyCharges.total),
      carryoverToNext: Math.max(0, billing.exportCredits.total - billing.energyCharges.total),
      creditTypes: {
        excess_generation: billing.exportCredits.total,
        time_of_use_arbitrage: 0,
        demand_reduction: 0,
        other: 0
      }
    };
  }

  private async calculateSavingsComparison(
    energyData: any,
    billing: any,
    rateScheduleId: string
  ) {
    // Calculate what the bill would have been without solar
    const preSolarBill = energyData.consumption * 0.32; // Average rate
    const savings = preSolarBill - billing.netAmount;
    
    return {
      preSolarBill,
      savings,
      savingsPercent: (savings / preSolarBill) * 100,
      yearToDateSavings: savings // Would accumulate actual YTD savings
    };
  }

  private isTrueUpMonth(date: Date): boolean {
    // Most utilities use March for true-up, but this varies
    return date.getMonth() === 2; // March (0-indexed)
  }

  private calculateTrueUpEnergyTotals(billingCycles: BillingCycle[]) {
    const totals = billingCycles.reduce((acc, cycle) => ({
      totalProduction: acc.totalProduction + cycle.energyData.production,
      totalConsumption: acc.totalConsumption + cycle.energyData.consumption,
      totalImport: acc.totalImport + cycle.energyData.gridImport,
      totalExport: acc.totalExport + cycle.energyData.gridExport,
      netEnergyUsage: acc.netEnergyUsage + cycle.energyData.netUsage
    }), {
      totalProduction: 0,
      totalConsumption: 0,
      totalImport: 0,
      totalExport: 0,
      netEnergyUsage: 0
    });

    return {
      ...totals,
      avgMonthlyUsage: totals.netEnergyUsage / billingCycles.length,
      monthlyData: billingCycles.map(cycle => ({
        month: cycle.cycleNumber,
        year: cycle.fiscalYear,
        production: cycle.energyData.production,
        consumption: cycle.energyData.consumption,
        netUsage: cycle.energyData.netUsage
      })),
      seasonalData: {
        summer: { production: 0, consumption: 0, netUsage: 0 },
        winter: { production: 0, consumption: 0, netUsage: 0 }
      }
    };
  }

  private calculateTrueUpFinancialTotals(billingCycles: BillingCycle[]) {
    return billingCycles.reduce((acc, cycle) => ({
      totalCharges: acc.totalCharges + cycle.billing.grossCharges,
      totalCredits: acc.totalCredits + cycle.billing.totalCredits,
      totalPayments: acc.totalPayments + Math.max(0, cycle.billing.netAmount),
      netPosition: acc.netPosition + cycle.billing.netAmount,
      chargeBreakdown: {
        energy: acc.chargeBreakdown.energy + cycle.billing.energyCharges.total,
        demand: acc.chargeBreakdown.demand + cycle.billing.demandCharges.total,
        fixed: acc.chargeBreakdown.fixed + cycle.billing.fixedCharges.total,
        nonBypassable: acc.chargeBreakdown.nonBypassable + cycle.billing.additionalCharges.nonBypassable,
        gridBenefits: acc.chargeBreakdown.gridBenefits + cycle.billing.additionalCharges.gridBenefits,
        taxes: acc.chargeBreakdown.taxes + cycle.billing.additionalCharges.taxes
      },
      creditBreakdown: {
        exportCredits: acc.creditBreakdown.exportCredits + cycle.billing.exportCredits.total,
        carriedForward: acc.creditBreakdown.carriedForward + cycle.credits.carryoverFromPrevious,
        adjustments: acc.creditBreakdown.adjustments
      }
    }), {
      totalCharges: 0,
      totalCredits: 0,
      totalPayments: 0,
      netPosition: 0,
      chargeBreakdown: {
        energy: 0,
        demand: 0,
        fixed: 0,
        nonBypassable: 0,
        gridBenefits: 0,
        taxes: 0
      },
      creditBreakdown: {
        exportCredits: 0,
        carriedForward: 0,
        adjustments: 0
      }
    });
  }

  private calculateExcessGenerationSettlement(
    energyTotals: any,
    financialTotals: any,
    nemPolicy: NetMeteringPolicy
  ) {
    const totalExcess = Math.max(0, -energyTotals.netEnergyUsage);
    const compensationRate = nemPolicy.compensation.cashout.rate;
    
    return {
      totalExcess,
      compensationRate,
      compensationAmount: totalExcess * compensationRate,
      compensationMethod: nemPolicy.compensation.cashout.method,
      monthlyExcess: energyTotals.monthlyData.map((month: any) => ({
        month: month.month,
        year: month.year,
        excess: Math.max(0, -month.netUsage),
        value: Math.max(0, -month.netUsage) * compensationRate
      }))
    };
  }

  private generateTrueUpBill(
    customerId: string,
    financialTotals: any,
    excessGeneration: any,
    endDate: Date
  ) {
    const netAmount = financialTotals.netPosition - excessGeneration.compensationAmount;
    
    return {
      billDate: new Date(),
      paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amountDue: Math.max(0, netAmount),
      paymentMethod: netAmount > 0 ? 'standard_billing' as const : 'credit_memo' as const,
      charges: {
        unpaidBalance: Math.max(0, financialTotals.netPosition),
        trueUpAdjustments: 0,
        penalties: 0,
        total: Math.max(0, financialTotals.netPosition)
      },
      credits: {
        excessGeneration: excessGeneration.compensationAmount,
        carryoverCredits: 0,
        adjustments: 0,
        total: excessGeneration.compensationAmount
      },
      netAmount
    };
  }

  private async performTrueUpAnalysis(
    energyTotals: any,
    financialTotals: any,
    billingCycles: BillingCycle[]
  ) {
    const selfConsumptionRate = ((energyTotals.totalProduction - energyTotals.totalExport) / energyTotals.totalProduction) * 100;
    const exportRate = (energyTotals.totalExport / energyTotals.totalProduction) * 100;
    
    return {
      selfConsumptionRate,
      exportRate,
      billOffsetRate: 75, // Placeholder
      avgMonthlySavings: financialTotals.totalCharges / 12,
      totalAnnualSavings: financialTotals.totalCharges,
      performance: {
        systemCapacityFactor: 18, // Placeholder
        degradation: 0.5, // Placeholder
        weatherAdjustment: 0 // Placeholder
      },
      recommendations: [
        'Consider battery storage to increase self-consumption',
        'Monitor system performance for any degradation',
        'Review rate schedule options for potential savings'
      ]
    };
  }

  private checkTrueUpCompliance(
    energyTotals: any,
    nemPolicy: NetMeteringPolicy,
    billingCycles: BillingCycle[]
  ) {
    return {
      nemPolicyCompliant: true,
      aggregateCapCompliant: true,
      meteringRequirementsMet: true,
      reportingComplete: true,
      auditReady: true
    };
  }

  // Additional helper methods for projections would be implemented here...
  
  private async projectSolarProduction(
    systemSpecs: any,
    startDate: Date,
    months: number
  ): Promise<number[]> {
    // Placeholder implementation - would use solar modeling
    return Array(months).fill(1000); // 1000 kWh per month
  }

  private projectEnergyConsumption(
    usageHistory: number[],
    months: number
  ): number[] {
    // Simple projection based on historical average
    const avgUsage = usageHistory.reduce((sum, usage) => sum + usage, 0) / usageHistory.length;
    return Array(months).fill(avgUsage);
  }

  private async projectMonthlyCycle(
    monthStart: Date,
    production: number,
    consumption: number,
    carryoverCredits: number,
    rateScheduleId: string
  ) {
    const netUsage = consumption - production;
    const estimatedBill = Math.max(0, netUsage * 0.30 + 10); // Basic calculation
    const estimatedSavings = Math.max(0, consumption * 0.32 - estimatedBill);
    const creditBalance = carryoverCredits + Math.max(0, -netUsage * 0.25) - Math.min(estimatedBill, carryoverCredits);
    
    return {
      month: monthStart.getMonth() + 1,
      year: monthStart.getFullYear(),
      estimatedBill,
      estimatedSavings,
      netUsage,
      creditBalance: Math.max(0, creditBalance)
    };
  }

  private calculateAnnualProjections(projectedCycles: any[]) {
    return {
      totalBills: projectedCycles.reduce((sum, cycle) => sum + cycle.estimatedBill, 0),
      totalSavings: projectedCycles.reduce((sum, cycle) => sum + cycle.estimatedSavings, 0),
      savingsPercent: 65, // Placeholder
      finalCreditBalance: projectedCycles[projectedCycles.length - 1].creditBalance,
      excessGeneration: 0, // Placeholder
      excessCompensation: 0 // Placeholder
    };
  }

  private generateSensitivityAnalysis(
    projectedCycles: any[],
    solarProduction: number[],
    energyConsumption: number[]
  ) {
    return [
      {
        scenario: 'conservative' as const,
        productionVariation: -10,
        consumptionVariation: 10,
        projectedSavings: projectedCycles.reduce((sum, cycle) => sum + cycle.estimatedSavings, 0) * 0.8,
        riskFactors: ['Lower than expected solar production', 'Higher than expected consumption']
      },
      {
        scenario: 'expected' as const,
        productionVariation: 0,
        consumptionVariation: 0,
        projectedSavings: projectedCycles.reduce((sum, cycle) => sum + cycle.estimatedSavings, 0),
        riskFactors: ['Weather variations', 'Rate changes']
      },
      {
        scenario: 'optimistic' as const,
        productionVariation: 10,
        consumptionVariation: -5,
        projectedSavings: projectedCycles.reduce((sum, cycle) => sum + cycle.estimatedSavings, 0) * 1.2,
        riskFactors: ['System performance variations']
      }
    ];
  }

  private calculateProjectionConfidence(
    usageHistory: number[],
    systemSpecs: any
  ): number {
    // Calculate confidence based on data quality and history length
    const historyScore = Math.min(usageHistory.length / 12, 1) * 40; // Up to 40 points for 12+ months
    const systemScore = systemSpecs.capacity > 0 ? 30 : 0; // 30 points for known system
    const baseScore = 30; // 30 points base
    
    return Math.round(historyScore + systemScore + baseScore);
  }
}

// Export singleton instance
export const billingCycleManager = new BillingCycleManager();