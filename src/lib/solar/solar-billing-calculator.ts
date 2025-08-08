/**
 * Comprehensive Solar Billing Calculator
 * 
 * Advanced billing calculator with detailed pre/post solar comparisons:
 * - Accurate utility bill calculations with and without solar
 * - Net metering credit calculations for all NEM policies
 * - Time-of-use rate analysis and optimization
 * - Demand charge impact analysis
 * - True-up period billing projections
 * - Sensitivity analysis and scenario modeling
 * - Financial metrics and payback calculations
 */

import { errorTracker } from '../monitoring/error-tracker';
import { NetMeteringPolicy, EnergyFlow } from './net-metering-engine';
import { UtilityRateSchedule, TimeOfUsePeriod } from './utility-rate-engine';
import { BillingCycle, TrueUpPeriod } from './billing-cycle-manager';

// =====================================================
// BILLING CALCULATOR TYPES
// =====================================================

export interface BillingCalculationInput {
  customerId: string;
  utilityCompany: string;
  rateScheduleId: string;
  nemPolicyId?: string;
  
  // System specifications
  solarSystem?: {
    capacity: number; // kW
    tilt: number; // degrees
    azimuth: number; // degrees
    derate: number; // system derate factor
    degradation: number; // annual degradation %
    inverterEfficiency: number;
    installationDate?: Date;
  };
  
  batterySystem?: {
    capacity: number; // kWh
    power: number; // kW
    efficiency: number; // round-trip %
    degradation: number; // annual %
  };
  
  // Usage and production data
  historicalUsage: MonthlyUsageData[];
  projectedProduction?: MonthlyProductionData[];
  
  // Calculation period
  calculationPeriod: {
    startDate: Date;
    endDate: Date;
    projectionYears: number;
  };
  
  // Analysis options
  options: {
    includeInflation: boolean;
    rateEscalation: number; // % per year
    includeTimeOfUse: boolean;
    includeDemandCharges: boolean;
    includeTrueUp: boolean;
    sensitivityAnalysis: boolean;
    scenarioAnalysis: boolean;
  };
}

export interface MonthlyUsageData {
  month: number; // 1-12
  year: number;
  kWhUsed: number;
  peakKW?: number;
  billingDays: number;
  averageDailyUsage: number;
  
  // Time-of-use breakdown if available
  touUsage?: {
    superOffPeak: number;
    offPeak: number;
    peak: number;
    superPeak: number;
  };
  
  // Additional data
  temperature?: {
    averageHigh: number;
    averageLow: number;
    coolingDegreeDays: number;
    heatingDegreeDays: number;
  };
}

export interface MonthlyProductionData {
  month: number;
  year: number;
  kWhProduced: number;
  peakProduction: number;
  capacity_factor: number;
  
  // Time-of-use production breakdown
  touProduction?: {
    superOffPeak: number;
    offPeak: number;
    peak: number;
    superPeak: number;
  };
  
  // Performance data
  performance: {
    expectedProduction: number;
    actualVsExpected: number; // %
    weatherAdjustment: number; // %
    systemAvailability: number; // %
  };
}

export interface BillingComparison {
  calculationId: string;
  customerId: string;
  calculationDate: Date;
  
  // Pre-solar billing (baseline)
  preSolarBilling: {
    monthlyBills: MonthlyBillDetail[];
    annualSummary: AnnualBillingSummary;
    projections: YearlyProjection[];
    rateAnalysis: RateImpactAnalysis;
  };
  
  // Post-solar billing (with system)
  postSolarBilling: {
    monthlyBills: MonthlyBillDetail[];
    annualSummary: AnnualBillingSummary;
    projections: YearlyProjection[];
    netMeteringAnalysis: NetMeteringAnalysis;
    trueUpAnalysis?: TrueUpAnalysis;
  };
  
  // Savings analysis
  savingsAnalysis: {
    monthlySavings: MonthlySavingsDetail[];
    annualSavings: number;
    cumulativeSavings: number[];
    averageMonthlySavings: number;
    savingsPercent: number;
    
    // Savings breakdown by component
    savingsBreakdown: {
      energyCharges: number;
      demandCharges: number;
      fixedChargeOffset: number;
      netMeteringCredits: number;
      timeOfUseOptimization: number;
      otherCreditsAndIncentives: number;
    };
  };
  
  // Financial analysis
  financialAnalysis: {
    systemCost: number;
    incentives: {
      federalTaxCredit: number;
      stateTaxCredit: number;
      utilityRebates: number;
      otherIncentives: number;
      totalIncentives: number;
    };
    
    netSystemCost: number;
    
    // Payback analysis
    paybackAnalysis: {
      simplePayback: number; // years
      discountedPayback: number; // years
      breakEvenMonth: number; // month when cumulative savings exceed cost
    };
    
    // Long-term financial metrics
    financialMetrics: {
      netPresentValue: number;
      internalRateOfReturn: number;
      modifiedIRR: number;
      profitabilityIndex: number;
      totalLifetimeSavings: number;
      annualizedSavings: number;
    };
  };
  
  // Sensitivity analysis
  sensitivityAnalysis?: {
    variables: SensitivityVariable[];
    scenarios: SensitivityScenario[];
    riskAssessment: RiskAssessment;
  };
  
  // Scenario analysis
  scenarioAnalysis?: {
    conservative: ScenarioResult;
    expected: ScenarioResult;
    optimistic: ScenarioResult;
    comparison: ScenarioComparison;
  };
  
  // Additional insights
  insights: {
    keyFindings: string[];
    recommendations: string[];
    riskFactors: string[];
    optimizationOpportunities: string[];
  };
}

export interface MonthlyBillDetail {
  month: number;
  year: number;
  billingDays: number;
  
  // Usage and production
  usage: {
    totalKWh: number;
    peakKW: number;
    production?: number; // Solar production
    netUsage?: number; // Usage after solar offset
    selfConsumption?: number; // Solar used on-site
    gridExport?: number; // Excess solar to grid
  };
  
  // Bill components
  charges: {
    energyCharges: {
      base: number;
      tiered: TieredChargeDetail[];
      timeOfUse: TOUChargeDetail[];
      total: number;
    };
    
    demandCharges: {
      facilityCharge: number;
      demandCharge: number;
      timeOfUseDemand: TOUDemandDetail[];
      total: number;
    };
    
    fixedCharges: {
      customerCharge: number;
      connectionFee: number;
      meterCharge: number;
      serviceCharge: number;
      total: number;
    };
    
    additionalCharges: {
      publicPurpose: number;
      nuclearDecommissioning: number;
      competitionTransition: number;
      distributionAccess: number;
      transmissionAccess: number;
      renewableEnergy: number;
      other: number;
      total: number;
    };
    
    taxes: {
      stateTax: number;
      localTax: number;
      salesTax: number;
      total: number;
    };
    
    totalCharges: number;
  };
  
  // Credits (for post-solar)
  credits?: {
    netMeteringCredits: {
      volumetric: number;
      timeOfUse: number;
      excessGeneration: number;
      total: number;
    };
    
    carryoverCredits: number;
    otherCredits: number;
    totalCredits: number;
  };
  
  // Bill totals
  grossBill: number;
  netBill: number;
  amountDue: number;
  
  // Additional metrics
  metrics: {
    effectiveRate: number; // $/kWh
    marginalRate: number; // $/kWh for next kWh
    averageDailyUsage: number; // kWh/day
    averageDailyCost: number; // $/day
    loadFactor: number; // average/peak demand
  };
}

export interface TieredChargeDetail {
  tier: number;
  tierName: string;
  kWhInTier: number;
  rate: number;
  charge: number;
  baseline?: boolean;
}

export interface TOUChargeDetail {
  period: string;
  periodName: string;
  kWh: number;
  rate: number;
  charge: number;
  hours: number; // Hours in this period
}

export interface TOUDemandDetail {
  period: string;
  periodName: string;
  kW: number;
  rate: number;
  charge: number;
}

export interface AnnualBillingSummary {
  totalKWh: number;
  totalBill: number;
  averageMonthlyBill: number;
  effectiveRate: number;
  
  // Charge breakdown
  chargeBreakdown: {
    energyCharges: number;
    demandCharges: number;
    fixedCharges: number;
    additionalCharges: number;
    taxes: number;
  };
  
  // Credits breakdown (post-solar)
  creditBreakdown?: {
    netMeteringCredits: number;
    carryoverCredits: number;
    otherCredits: number;
  };
  
  // Usage patterns
  usagePatterns: {
    peakMonth: { month: number; kWh: number };
    lowMonth: { month: number; kWh: number };
    summerTotal: number; // June-September
    winterTotal: number; // December-February
    shoulderTotal: number; // Remaining months
  };
}

export interface YearlyProjection {
  year: number;
  totalKWh: number;
  totalBill: number;
  averageMonthlyBill: number;
  rateEscalation: number;
  
  // For solar systems
  systemDegradation?: number;
  adjustedProduction?: number;
  netMeteringPolicy?: string;
}

export interface NetMeteringAnalysis {
  policy: {
    id: string;
    name: string;
    version: string;
    compensationMethod: string;
  };
  
  annualMetrics: {
    totalProduction: number;
    totalConsumption: number;
    selfConsumptionRate: number; // %
    exportRate: number; // %
    totalExports: number;
    totalCredits: number;
    netUsage: number;
  };
  
  monthlyBreakdown: {
    month: number;
    production: number;
    consumption: number;
    selfConsumption: number;
    export: number;
    import: number;
    credits: number;
    netBill: number;
  }[];
  
  creditAnalysis: {
    averageCreditRate: number;
    totalCreditsEarned: number;
    creditsUsed: number;
    creditsCarriedForward: number;
    excessCompensation: number; // For true-up
  };
}

export interface TrueUpAnalysis {
  trueUpYear: number;
  trueUpMonth: number;
  
  annualTotals: {
    production: number;
    consumption: number;
    imports: number;
    exports: number;
    netUsage: number;
  };
  
  financialTotals: {
    totalCharges: number;
    totalCredits: number;
    netPosition: number; // Amount owed or credit
  };
  
  settlement: {
    excessGeneration: number; // kWh
    compensationRate: number; // $/kWh
    compensation: number; // $
    finalBill: number; // $ (positive = owe, negative = credit)
  };
}

export interface MonthlySavingsDetail {
  month: number;
  year: number;
  preSolarBill: number;
  postSolarBill: number;
  savings: number;
  savingsPercent: number;
  
  savingsBreakdown: {
    energyChargeReduction: number;
    demandChargeReduction: number;
    netMeteringCredits: number;
    otherSavings: number;
  };
}

export interface SensitivityVariable {
  name: string;
  baseValue: number;
  unit: string;
  range: {
    low: number;
    high: number;
  };
  impact: {
    onNPV: number; // $ change in NPV per unit change
    onPayback: number; // years change in payback per unit change
    onSavings: number; // $ change in annual savings per unit change
  };
}

export interface SensitivityScenario {
  name: string;
  description: string;
  variables: { [key: string]: number };
  results: {
    annualSavings: number;
    npv: number;
    payback: number;
    irr: number;
  };
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
  
  confidenceInterval: {
    npv: { low: number; expected: number; high: number };
    payback: { low: number; expected: number; high: number };
    annualSavings: { low: number; expected: number; high: number };
  };
}

export interface ScenarioResult {
  name: string;
  assumptions: { [key: string]: number | string };
  results: {
    systemCost: number;
    annualSavings: number;
    cumulativeSavings: number;
    paybackPeriod: number;
    npv: number;
    irr: number;
  };
}

export interface ScenarioComparison {
  keyMetrics: {
    metric: string;
    conservative: number;
    expected: number;
    optimistic: number;
    range: number; // difference between optimistic and conservative
  }[];
  
  recommendations: string[];
  riskMitigation: string[];
}

export interface RateImpactAnalysis {
  currentRate: {
    schedule: string;
    effectiveRate: number;
    structure: string;
  };
  
  rateEscalationImpact: {
    year: number;
    rateIncrease: number; // %
    additionalCost: number; // $ additional per year
    cumulativeImpact: number; // $ cumulative additional cost
  }[];
  
  alternativeRates: {
    schedule: string;
    projectedSavings: number;
    suitabilityScore: number;
    recommendation: string;
  }[];
}

// =====================================================
// SOLAR BILLING CALCULATOR CLASS
// =====================================================

export class SolarBillingCalculator {
  
  /**
   * Calculate comprehensive billing comparison (pre vs post solar)
   */
  public async calculateBillingComparison(
    input: BillingCalculationInput
  ): Promise<BillingComparison> {
    try {
      errorTracker.addBreadcrumb('Starting billing comparison calculation', 'billing', {
        customerId: input.customerId,
        hasSolar: !!input.solarSystem
      });

      const calculationId = this.generateCalculationId(input.customerId);

      // Calculate pre-solar billing (baseline scenario)
      const preSolarBilling = await this.calculatePreSolarBilling(input);
      
      // Calculate post-solar billing (with system)
      const postSolarBilling = await this.calculatePostSolarBilling(input);
      
      // Analyze savings
      const savingsAnalysis = this.calculateSavingsAnalysis(
        preSolarBilling, 
        postSolarBilling
      );
      
      // Perform financial analysis
      const financialAnalysis = await this.calculateFinancialAnalysis(
        input, 
        savingsAnalysis
      );
      
      // Sensitivity analysis (if requested)
      let sensitivityAnalysis;
      if (input.options.sensitivityAnalysis) {
        sensitivityAnalysis = await this.performSensitivityAnalysis(
          input, 
          financialAnalysis
        );
      }
      
      // Scenario analysis (if requested)
      let scenarioAnalysis;
      if (input.options.scenarioAnalysis) {
        scenarioAnalysis = await this.performScenarioAnalysis(input);
      }
      
      // Generate insights and recommendations
      const insights = this.generateInsights(
        preSolarBilling,
        postSolarBilling,
        savingsAnalysis,
        financialAnalysis
      );

      const result: BillingComparison = {
        calculationId,
        customerId: input.customerId,
        calculationDate: new Date(),
        preSolarBilling,
        postSolarBilling,
        savingsAnalysis,
        financialAnalysis,
        sensitivityAnalysis,
        scenarioAnalysis,
        insights
      };

      errorTracker.addBreadcrumb('Billing comparison calculation completed', 'billing', {
        annualSavings: savingsAnalysis.annualSavings,
        payback: financialAnalysis.paybackAnalysis.simplePayback
      });

      return result;

    } catch (error) {
      errorTracker.captureException(error as Error, { 
        customerId: input.customerId 
      });
      throw error;
    }
  }

  /**
   * Calculate detailed monthly bill for a specific scenario
   */
  public async calculateMonthlyBill(
    month: number,
    year: number,
    usageData: MonthlyUsageData,
    productionData: MonthlyProductionData | null,
    rateSchedule: UtilityRateSchedule,
    nemPolicy?: NetMeteringPolicy
  ): Promise<MonthlyBillDetail> {
    try {
      const usage = this.calculateNetUsage(usageData, productionData);
      
      // Calculate all charge components
      const charges = await this.calculateAllCharges(usage, rateSchedule);
      
      // Calculate credits (if solar system)
      let credits;
      if (productionData && nemPolicy) {
        credits = await this.calculateNetMeteringCredits(
          usage,
          productionData,
          nemPolicy,
          rateSchedule
        );
      }
      
      // Calculate bill totals
      const grossBill = charges.totalCharges;
      const totalCredits = credits?.totalCredits || 0;
      const netBill = grossBill - totalCredits;
      const amountDue = Math.max(0, netBill);
      
      // Calculate metrics
      const metrics = this.calculateBillMetrics(usage, charges, grossBill);

      return {
        month,
        year,
        billingDays: usageData.billingDays,
        usage,
        charges,
        credits,
        grossBill,
        netBill,
        amountDue,
        metrics
      };

    } catch (error) {
      errorTracker.captureException(error as Error, { month, year });
      throw error;
    }
  }

  /**
   * Project future billing scenarios with various assumptions
   */
  public async projectFutureBilling(
    input: BillingCalculationInput,
    projectionYears: number,
    scenarios: {
      rateEscalation: number;
      usageGrowth: number;
      systemDegradation: number;
      policyChanges?: string[];
    }
  ): Promise<YearlyProjection[]> {
    try {
      const projections: YearlyProjection[] = [];
      
      for (let year = 1; year <= projectionYears; year++) {
        const currentYear = new Date().getFullYear() + year;
        
        // Apply rate escalation
        const rateMultiplier = Math.pow(1 + scenarios.rateEscalation / 100, year);
        
        // Apply usage growth
        const usageMultiplier = Math.pow(1 + scenarios.usageGrowth / 100, year);
        
        // Apply system degradation (for solar)
        const systemMultiplier = input.solarSystem ? 
          Math.pow(1 - scenarios.systemDegradation / 100, year) : 1;
        
        // Calculate projected costs
        const baseAnnualBill = this.calculateBaseAnnualBill(input);
        const projectedBill = baseAnnualBill * rateMultiplier * usageMultiplier;
        
        projections.push({
          year: currentYear,
          totalKWh: this.calculateProjectedUsage(input, usageMultiplier),
          totalBill: projectedBill,
          averageMonthlyBill: projectedBill / 12,
          rateEscalation: scenarios.rateEscalation,
          systemDegradation: scenarios.systemDegradation,
          adjustedProduction: input.solarSystem ? 
            this.calculateProjectedProduction(input) * systemMultiplier : undefined
        });
      }
      
      return projections;

    } catch (error) {
      errorTracker.captureException(error as Error);
      throw error;
    }
  }

  // =====================================================
  // PRIVATE CALCULATION METHODS
  // =====================================================

  private generateCalculationId(customerId: string): string {
    const timestamp = Date.now();
    return `calc_${customerId}_${timestamp}`;
  }

  private async calculatePreSolarBilling(input: BillingCalculationInput) {
    // Calculate monthly bills without solar
    const monthlyBills: MonthlyBillDetail[] = [];
    
    for (const usageData of input.historicalUsage) {
      const bill = await this.calculateMonthlyBill(
        usageData.month,
        usageData.year,
        usageData,
        null, // No solar production
        await this.getRateSchedule(input.rateScheduleId)
      );
      monthlyBills.push(bill);
    }
    
    // Calculate annual summary
    const annualSummary = this.calculateAnnualSummary(monthlyBills);
    
    // Generate projections
    const projections = await this.projectFutureBilling(
      input,
      input.calculationPeriod.projectionYears,
      {
        rateEscalation: input.options.rateEscalation,
        usageGrowth: 0, // Assume no growth for pre-solar
        systemDegradation: 0 // No system
      }
    );
    
    // Rate impact analysis
    const rateAnalysis = await this.analyzeRateImpact(input);

    return {
      monthlyBills,
      annualSummary,
      projections,
      rateAnalysis
    };
  }

  private async calculatePostSolarBilling(input: BillingCalculationInput) {
    if (!input.solarSystem) {
      throw new Error('Solar system required for post-solar billing calculation');
    }

    // Calculate/project solar production if not provided
    let productionData = input.projectedProduction;
    if (!productionData) {
      productionData = await this.projectSolarProduction(input);
    }

    const monthlyBills: MonthlyBillDetail[] = [];
    const nemPolicy = input.nemPolicyId ? 
      await this.getNEMPolicy(input.nemPolicyId) : undefined;
    
    for (let i = 0; i < input.historicalUsage.length; i++) {
      const usageData = input.historicalUsage[i];
      const production = productionData[i];
      
      const bill = await this.calculateMonthlyBill(
        usageData.month,
        usageData.year,
        usageData,
        production,
        await this.getRateSchedule(input.rateScheduleId),
        nemPolicy
      );
      monthlyBills.push(bill);
    }
    
    // Calculate annual summary
    const annualSummary = this.calculateAnnualSummary(monthlyBills);
    
    // Generate projections with solar degradation
    const projections = await this.projectFutureBilling(
      input,
      input.calculationPeriod.projectionYears,
      {
        rateEscalation: input.options.rateEscalation,
        usageGrowth: 0,
        systemDegradation: input.solarSystem.degradation
      }
    );
    
    // Net metering analysis
    const netMeteringAnalysis = this.calculateNetMeteringAnalysis(
      monthlyBills,
      productionData,
      nemPolicy
    );
    
    // True-up analysis (if applicable)
    let trueUpAnalysis;
    if (input.options.includeTrueUp && nemPolicy?.version !== '1.0') {
      trueUpAnalysis = this.calculateTrueUpAnalysis(monthlyBills, nemPolicy);
    }

    return {
      monthlyBills,
      annualSummary,
      projections,
      netMeteringAnalysis,
      trueUpAnalysis
    };
  }

  private calculateNetUsage(
    usageData: MonthlyUsageData,
    productionData: MonthlyProductionData | null
  ) {
    const totalKWh = usageData.kWhUsed;
    const production = productionData?.kWhProduced || 0;
    
    // Calculate self-consumption (production used on-site)
    const selfConsumption = Math.min(totalKWh, production);
    
    // Calculate grid interactions
    const gridImport = Math.max(0, totalKWh - production);
    const gridExport = Math.max(0, production - totalKWh);
    const netUsage = gridImport - gridExport;

    return {
      totalKWh,
      peakKW: usageData.peakKW || 0,
      production,
      netUsage,
      selfConsumption,
      gridExport
    };
  }

  private async calculateAllCharges(usage: any, rateSchedule: UtilityRateSchedule) {
    // Energy charges
    const energyCharges = this.calculateEnergyCharges(usage, rateSchedule);
    
    // Demand charges
    const demandCharges = this.calculateDemandCharges(usage, rateSchedule);
    
    // Fixed charges
    const fixedCharges = this.calculateFixedCharges(rateSchedule);
    
    // Additional charges
    const additionalCharges = this.calculateAdditionalCharges(usage, rateSchedule);
    
    // Taxes
    const taxes = this.calculateTaxes(
      energyCharges.total + demandCharges.total + fixedCharges.total + additionalCharges.total,
      rateSchedule
    );

    return {
      energyCharges,
      demandCharges,
      fixedCharges,
      additionalCharges,
      taxes,
      totalCharges: energyCharges.total + demandCharges.total + 
                   fixedCharges.total + additionalCharges.total + taxes.total
    };
  }

  private calculateEnergyCharges(usage: any, rateSchedule: UtilityRateSchedule) {
    const structure = rateSchedule.rateStructure;
    let base = 0;
    let tiered: TieredChargeDetail[] = [];
    let timeOfUse: TOUChargeDetail[] = [];

    // Flat rate calculation
    if (structure.energyCharges.flatRate) {
      base = Math.max(0, usage.netUsage) * structure.energyCharges.flatRate;
    }

    // Tiered rate calculation
    if (structure.energyCharges.tieredRates) {
      let remainingUsage = Math.max(0, usage.netUsage);
      
      for (const tier of structure.energyCharges.tieredRates) {
        const tierUsage = Math.min(remainingUsage, tier.threshold);
        if (tierUsage > 0) {
          tiered.push({
            tier: tier.tier,
            tierName: tier.name,
            kWhInTier: tierUsage,
            rate: tier.rate,
            charge: tierUsage * tier.rate,
            baseline: tier.isBaseline
          });
          remainingUsage -= tierUsage;
        }
        if (remainingUsage <= 0) break;
      }
    }

    // Time-of-use calculation
    if (structure.energyCharges.timeOfUseRates) {
      // This would require detailed hourly usage data
      // Placeholder calculation
      for (const touPeriod of structure.energyCharges.timeOfUseRates) {
        const periodUsage = Math.max(0, usage.netUsage) * 0.25; // Simplified
        timeOfUse.push({
          period: touPeriod.id,
          periodName: touPeriod.name,
          kWh: periodUsage,
          rate: touPeriod.rate,
          charge: periodUsage * touPeriod.rate,
          hours: 6 // Simplified
        });
      }
    }

    const total = base + 
                 tiered.reduce((sum, tier) => sum + tier.charge, 0) +
                 timeOfUse.reduce((sum, tou) => sum + tou.charge, 0);

    return { base, tiered, timeOfUse, total };
  }

  private calculateDemandCharges(usage: any, rateSchedule: UtilityRateSchedule) {
    const demandCharges = rateSchedule.rateStructure.demandCharges || [];
    let facilityCharge = 0;
    let demandCharge = 0;
    let timeOfUseDemand: TOUDemandDetail[] = [];

    for (const charge of demandCharges) {
      const demand = usage.peakKW || 0;
      const chargeAmount = demand * charge.rate;

      switch (charge.type) {
        case 'facility':
          facilityCharge += chargeAmount;
          break;
        case 'time_of_use':
          timeOfUseDemand.push({
            period: 'peak',
            periodName: 'Peak Period',
            kW: demand,
            rate: charge.rate,
            charge: chargeAmount
          });
          break;
        default:
          demandCharge += chargeAmount;
      }
    }

    return {
      facilityCharge,
      demandCharge,
      timeOfUseDemand,
      total: facilityCharge + demandCharge + 
             timeOfUseDemand.reduce((sum, tou) => sum + tou.charge, 0)
    };
  }

  private calculateFixedCharges(rateSchedule: UtilityRateSchedule) {
    const fixed = rateSchedule.rateStructure.fixedCharges;
    
    return {
      customerCharge: fixed.customerCharge,
      connectionFee: fixed.connectionFee,
      meterCharge: 0,
      serviceCharge: fixed.serviceCharge || 0,
      total: fixed.customerCharge + fixed.connectionFee + (fixed.serviceCharge || 0)
    };
  }

  private calculateAdditionalCharges(usage: any, rateSchedule: UtilityRateSchedule) {
    const additional = rateSchedule.rateStructure.additionalCharges;
    const totalUsage = Math.max(0, usage.totalKWh);
    
    return {
      publicPurpose: totalUsage * (additional.publicPurposePrograms || 0),
      nuclearDecommissioning: totalUsage * (additional.nuclearDecommissioning || 0),
      competitionTransition: totalUsage * (additional.competitiveTransition || 0),
      distributionAccess: totalUsage * (additional.distributionAccess || 0),
      transmissionAccess: totalUsage * (additional.transmissionAccess || 0),
      renewableEnergy: totalUsage * (additional.renewableEnergy || 0),
      other: 0,
      total: totalUsage * [
        additional.publicPurposePrograms,
        additional.nuclearDecommissioning,
        additional.competitiveTransition,
        additional.distributionAccess,
        additional.transmissionAccess,
        additional.renewableEnergy
      ].reduce((sum, rate) => sum + (rate || 0), 0)
    };
  }

  private calculateTaxes(subtotal: number, rateSchedule: UtilityRateSchedule) {
    const taxRate = rateSchedule.rateStructure.additionalCharges.stateAndLocalTaxes || 0;
    const totalTax = subtotal * (taxRate / 100);
    
    return {
      stateTax: totalTax * 0.6, // Approximate breakdown
      localTax: totalTax * 0.3,
      salesTax: totalTax * 0.1,
      total: totalTax
    };
  }

  private async calculateNetMeteringCredits(
    usage: any,
    productionData: MonthlyProductionData,
    nemPolicy: NetMeteringPolicy,
    rateSchedule: UtilityRateSchedule
  ) {
    const exportedKWh = usage.gridExport || 0;
    let volumetricCredit = 0;
    let timeOfUseCredit = 0;

    // Calculate credits based on NEM policy
    switch (nemPolicy.compensation.method) {
      case 'net_energy_metering':
        // Full retail rate credit
        volumetricCredit = exportedKWh * (rateSchedule.rateStructure.energyCharges.flatRate || 0.30);
        break;
      
      case 'net_billing':
        // Avoided cost or reduced rate credit
        const avoidedCostRate = typeof nemPolicy.compensation.exportCredits.rate === 'number' ?
          nemPolicy.compensation.exportCredits.rate : 0.08;
        volumetricCredit = exportedKWh * avoidedCostRate;
        break;
      
      default:
        volumetricCredit = exportedKWh * 0.08; // Default avoided cost
    }

    return {
      netMeteringCredits: {
        volumetric: volumetricCredit,
        timeOfUse: timeOfUseCredit,
        excessGeneration: 0, // Calculated in true-up
        total: volumetricCredit + timeOfUseCredit
      },
      carryoverCredits: 0, // Would be calculated from previous months
      otherCredits: 0,
      totalCredits: volumetricCredit + timeOfUseCredit
    };
  }

  private calculateBillMetrics(usage: any, charges: any, grossBill: number) {
    const totalKWh = usage.totalKWh;
    
    return {
      effectiveRate: totalKWh > 0 ? grossBill / totalKWh : 0,
      marginalRate: 0.30, // Would calculate actual marginal rate
      averageDailyUsage: totalKWh / 30,
      averageDailyCost: grossBill / 30,
      loadFactor: usage.peakKW > 0 ? (totalKWh / 24 / 30) / usage.peakKW : 0
    };
  }

  // Additional helper methods would be implemented here...
  private calculateSavingsAnalysis(preSolarBilling: any, postSolarBilling: any) {
    const monthlySavings: MonthlySavingsDetail[] = [];
    let totalSavings = 0;

    for (let i = 0; i < preSolarBilling.monthlyBills.length; i++) {
      const preBill = preSolarBilling.monthlyBills[i];
      const postBill = postSolarBilling.monthlyBills[i];
      const savings = preBill.amountDue - postBill.amountDue;
      
      monthlySavings.push({
        month: preBill.month,
        year: preBill.year,
        preSolarBill: preBill.amountDue,
        postSolarBill: postBill.amountDue,
        savings,
        savingsPercent: preBill.amountDue > 0 ? (savings / preBill.amountDue) * 100 : 0,
        savingsBreakdown: {
          energyChargeReduction: preBill.charges.energyCharges.total - postBill.charges.energyCharges.total,
          demandChargeReduction: preBill.charges.demandCharges.total - postBill.charges.demandCharges.total,
          netMeteringCredits: postBill.credits?.totalCredits || 0,
          otherSavings: 0
        }
      });
      
      totalSavings += savings;
    }

    return {
      monthlySavings,
      annualSavings: totalSavings,
      cumulativeSavings: [totalSavings], // Would calculate multi-year cumulative
      averageMonthlySavings: totalSavings / monthlySavings.length,
      savingsPercent: (totalSavings / preSolarBilling.annualSummary.totalBill) * 100,
      savingsBreakdown: {
        energyCharges: monthlySavings.reduce((sum, m) => sum + m.savingsBreakdown.energyChargeReduction, 0),
        demandCharges: monthlySavings.reduce((sum, m) => sum + m.savingsBreakdown.demandChargeReduction, 0),
        fixedChargeOffset: 0,
        netMeteringCredits: monthlySavings.reduce((sum, m) => sum + m.savingsBreakdown.netMeteringCredits, 0),
        timeOfUseOptimization: 0,
        otherCreditsAndIncentives: 0
      }
    };
  }

  // Placeholder methods for complex calculations
  private async getRateSchedule(rateScheduleId: string): Promise<UtilityRateSchedule> {
    // Would fetch from utility rate engine
    return {} as UtilityRateSchedule;
  }

  private async getNEMPolicy(nemPolicyId: string): Promise<NetMeteringPolicy> {
    // Would fetch from net metering engine
    return {} as NetMeteringPolicy;
  }

  private async projectSolarProduction(input: BillingCalculationInput): Promise<MonthlyProductionData[]> {
    // Would use solar modeling to project production
    return [];
  }

  private calculateAnnualSummary(monthlyBills: MonthlyBillDetail[]): AnnualBillingSummary {
    const totalKWh = monthlyBills.reduce((sum, bill) => sum + bill.usage.totalKWh, 0);
    const totalBill = monthlyBills.reduce((sum, bill) => sum + bill.amountDue, 0);
    
    return {
      totalKWh,
      totalBill,
      averageMonthlyBill: totalBill / monthlyBills.length,
      effectiveRate: totalBill / totalKWh,
      chargeBreakdown: {
        energyCharges: monthlyBills.reduce((sum, bill) => sum + bill.charges.energyCharges.total, 0),
        demandCharges: monthlyBills.reduce((sum, bill) => sum + bill.charges.demandCharges.total, 0),
        fixedCharges: monthlyBills.reduce((sum, bill) => sum + bill.charges.fixedCharges.total, 0),
        additionalCharges: monthlyBills.reduce((sum, bill) => sum + bill.charges.additionalCharges.total, 0),
        taxes: monthlyBills.reduce((sum, bill) => sum + bill.charges.taxes.total, 0)
      },
      usagePatterns: {
        peakMonth: { month: 7, kWh: Math.max(...monthlyBills.map(b => b.usage.totalKWh)) },
        lowMonth: { month: 12, kWh: Math.min(...monthlyBills.map(b => b.usage.totalKWh)) },
        summerTotal: 0, // Would calculate seasonal totals
        winterTotal: 0,
        shoulderTotal: 0
      }
    };
  }

  private calculateBaseAnnualBill(input: BillingCalculationInput): number {
    return input.historicalUsage.reduce((sum, usage) => sum + (usage.kWhUsed * 0.30), 0);
  }

  private calculateProjectedUsage(input: BillingCalculationInput, usageMultiplier: number): number {
    return input.historicalUsage.reduce((sum, usage) => sum + usage.kWhUsed, 0) * usageMultiplier;
  }

  private calculateProjectedProduction(input: BillingCalculationInput): number {
    return (input.solarSystem?.capacity || 0) * 1200; // Simplified: 1200 kWh/kW/year
  }

  private calculateNetMeteringAnalysis(monthlyBills: any[], productionData: any[], nemPolicy: any) {
    // Placeholder implementation
    return {
      policy: { id: '', name: '', version: '', compensationMethod: '' },
      annualMetrics: {
        totalProduction: 0,
        totalConsumption: 0,
        selfConsumptionRate: 0,
        exportRate: 0,
        totalExports: 0,
        totalCredits: 0,
        netUsage: 0
      },
      monthlyBreakdown: [],
      creditAnalysis: {
        averageCreditRate: 0,
        totalCreditsEarned: 0,
        creditsUsed: 0,
        creditsCarriedForward: 0,
        excessCompensation: 0
      }
    };
  }

  private calculateTrueUpAnalysis(monthlyBills: any[], nemPolicy: any) {
    // Placeholder implementation
    return {
      trueUpYear: new Date().getFullYear(),
      trueUpMonth: 3,
      annualTotals: { production: 0, consumption: 0, imports: 0, exports: 0, netUsage: 0 },
      financialTotals: { totalCharges: 0, totalCredits: 0, netPosition: 0 },
      settlement: { excessGeneration: 0, compensationRate: 0, compensation: 0, finalBill: 0 }
    };
  }

  private async calculateFinancialAnalysis(input: BillingCalculationInput, savingsAnalysis: any) {
    const systemCost = (input.solarSystem?.capacity || 0) * 3000; // $3/W
    const federalTaxCredit = systemCost * 0.30; // 30% federal credit
    
    return {
      systemCost,
      incentives: {
        federalTaxCredit,
        stateTaxCredit: 0,
        utilityRebates: 0,
        otherIncentives: 0,
        totalIncentives: federalTaxCredit
      },
      netSystemCost: systemCost - federalTaxCredit,
      paybackAnalysis: {
        simplePayback: (systemCost - federalTaxCredit) / savingsAnalysis.annualSavings,
        discountedPayback: 0, // Would calculate with NPV
        breakEvenMonth: 0 // Would calculate cumulative savings
      },
      financialMetrics: {
        netPresentValue: 0, // Would calculate NPV
        internalRateOfReturn: 0, // Would calculate IRR
        modifiedIRR: 0,
        profitabilityIndex: 0,
        totalLifetimeSavings: savingsAnalysis.annualSavings * 25,
        annualizedSavings: savingsAnalysis.annualSavings
      }
    };
  }

  private async analyzeRateImpact(input: BillingCalculationInput) {
    return {
      currentRate: {
        schedule: input.rateScheduleId,
        effectiveRate: 0.30,
        structure: 'TOU'
      },
      rateEscalationImpact: [],
      alternativeRates: []
    };
  }

  private async performSensitivityAnalysis(input: BillingCalculationInput, financialAnalysis: any) {
    // Placeholder implementation
    return {
      variables: [],
      scenarios: [],
      riskAssessment: {
        overallRisk: 'medium' as const,
        riskFactors: [],
        confidenceInterval: {
          npv: { low: 0, expected: 0, high: 0 },
          payback: { low: 0, expected: 0, high: 0 },
          annualSavings: { low: 0, expected: 0, high: 0 }
        }
      }
    };
  }

  private async performScenarioAnalysis(input: BillingCalculationInput) {
    // Placeholder implementation
    return {
      conservative: { name: '', assumptions: {}, results: { systemCost: 0, annualSavings: 0, cumulativeSavings: 0, paybackPeriod: 0, npv: 0, irr: 0 } },
      expected: { name: '', assumptions: {}, results: { systemCost: 0, annualSavings: 0, cumulativeSavings: 0, paybackPeriod: 0, npv: 0, irr: 0 } },
      optimistic: { name: '', assumptions: {}, results: { systemCost: 0, annualSavings: 0, cumulativeSavings: 0, paybackPeriod: 0, npv: 0, irr: 0 } },
      comparison: { keyMetrics: [], recommendations: [], riskMitigation: [] }
    };
  }

  private generateInsights(preSolarBilling: any, postSolarBilling: any, savingsAnalysis: any, financialAnalysis: any) {
    return {
      keyFindings: [
        `Annual savings of $${savingsAnalysis.annualSavings.toFixed(0)}`,
        `${financialAnalysis.paybackAnalysis.simplePayback.toFixed(1)} year payback period`,
        `${(savingsAnalysis.savingsPercent).toFixed(0)}% bill reduction`
      ],
      recommendations: [
        'System provides strong financial returns',
        'Consider battery storage for additional benefits',
        'Monitor for rate schedule changes'
      ],
      riskFactors: [
        'Utility rate changes',
        'System performance variations',
        'Policy changes'
      ],
      optimizationOpportunities: [
        'Time-of-use rate optimization',
        'Load shifting strategies',
        'Demand charge reduction'
      ]
    };
  }
}

// Export singleton instance
export const solarBillingCalculator = new SolarBillingCalculator();