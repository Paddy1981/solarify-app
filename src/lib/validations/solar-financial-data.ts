/**
 * Solar Financial Data Validation Layer
 * 
 * Comprehensive validation for solar financial calculations including costs,
 * ROI analysis, incentive calculations, utility rates, and financing terms.
 * 
 * Based on:
 * - Federal Investment Tax Credit (ITC) regulations
 * - MACRS depreciation schedules
 * - State and local incentive programs
 * - Utility net metering policies
 * - Financial modeling best practices
 */

import { z } from 'zod';

// =====================================================
// FINANCIAL CONSTANTS AND STANDARDS
// =====================================================

// Federal tax incentives
export const FEDERAL_INCENTIVES = {
  itc: {
    2024: 30, // % Investment Tax Credit
    2025: 30,
    2026: 30,
    2027: 26,
    2028: 22,
    2029: 10, // Commercial only
    2030: 0   // Residential expires
  },
  macrs: {
    schedule: [20, 32, 19.2, 11.52, 11.52, 5.76], // % per year
    bonusDepreciation: 80 // % in first year (2024)
  }
} as const;

// Financing parameters
export const FINANCING_LIMITS = {
  loan: {
    minAmount: 5000, // $
    maxAmount: 500000, // $
    minTerm: 5, // years
    maxTerm: 25, // years
    minRate: 2.0, // % APR
    maxRate: 15.0, // % APR
    maxDebtToIncome: 43 // %
  },
  lease: {
    minAmount: 10000, // $
    maxAmount: 200000, // $
    minTerm: 10, // years
    maxTerm: 25, // years
    escalator: { min: 0, max: 5 }, // % annual
    buyoutPercent: { min: 10, max: 30 } // % of system value
  },
  ppa: {
    minRate: 0.05, // $/kWh
    maxRate: 0.25, // $/kWh
    minTerm: 10, // years
    maxTerm: 25, // years
    escalator: { min: 0, max: 5 } // % annual
  }
} as const;

// Cost validation ranges
export const COST_RANGES = {
  residential: {
    pricePerWatt: { min: 2.0, max: 6.0 }, // $/W
    softCosts: { min: 0.5, max: 2.0 }, // $/W
    hardwareCosts: { min: 1.0, max: 3.0 } // $/W
  },
  commercial: {
    pricePerWatt: { min: 1.5, max: 4.0 }, // $/W
    softCosts: { min: 0.3, max: 1.5 }, // $/W
    hardwareCosts: { min: 0.8, max: 2.0 } // $/W
  },
  utility: {
    pricePerWatt: { min: 0.8, max: 2.5 }, // $/W
    softCosts: { min: 0.1, max: 0.8 }, // $/W
    hardwareCosts: { min: 0.5, max: 1.2 } // $/W
  }
} as const;

// =====================================================
// SYSTEM COST VALIDATION
// =====================================================

// Detailed cost breakdown validation
export const systemCostSchema = z.object({
  // System identification
  systemSize: z.number().min(1).max(2000), // kW
  systemType: z.enum(['residential', 'commercial', 'utility']),
  
  // Equipment costs
  equipmentCosts: z.object({
    panels: z.object({
      quantity: z.number().int().min(1).max(10000),
      unitCost: z.number().min(100).max(1000), // $ per panel
      totalCost: z.number().min(1000).max(5000000), // $
      pricePerWatt: z.number().min(0.3).max(2.0) // $/W
    }),
    inverters: z.object({
      quantity: z.number().int().min(1).max(1000),
      unitCost: z.number().min(500).max(50000), // $ per inverter
      totalCost: z.number().min(500).max(10000000), // $
      pricePerWatt: z.number().min(0.1).max(1.0) // $/W
    }),
    mounting: z.object({
      totalCost: z.number().min(500).max(1000000), // $
      pricePerWatt: z.number().min(0.1).max(0.8) // $/W
    }),
    electrical: z.object({
      totalCost: z.number().min(200).max(500000), // $
      pricePerWatt: z.number().min(0.05).max(0.5) // $/W
    }),
    monitoring: z.object({
      totalCost: z.number().min(100).max(50000), // $
      pricePerWatt: z.number().min(0.02).max(0.3) // $/W
    }),
    other: z.object({
      totalCost: z.number().min(0).max(200000), // $
      description: z.string().max(200).optional()
    })
  }),
  
  // Installation costs (soft costs)
  installationCosts: z.object({
    labor: z.object({
      totalCost: z.number().min(500).max(1000000), // $
      pricePerWatt: z.number().min(0.2).max(1.5), // $/W
      hoursEstimated: z.number().min(10).max(2000), // hours
      hourlyRate: z.number().min(50).max(200) // $/hour
    }),
    permits: z.object({
      totalCost: z.number().min(100).max(50000), // $
      breakdown: z.array(z.object({
        type: z.enum(['building', 'electrical', 'utility', 'fire', 'other']),
        cost: z.number().min(0).max(10000),
        authority: z.string().max(100)
      })).default([])
    }),
    inspection: z.object({
      totalCost: z.number().min(100).max(10000), // $
      count: z.number().int().min(1).max(10)
    }),
    interconnection: z.object({
      totalCost: z.number().min(0).max(25000), // $
      utilityFees: z.number().min(0).max(15000), // $
      engineeringFees: z.number().min(0).max(10000) // $
    }),
    sales: z.object({
      totalCost: z.number().min(0).max(200000), // $
      commission: z.number().min(0).max(25), // % of system cost
      marketing: z.number().min(0).max(50000) // $
    }),
    overhead: z.object({
      totalCost: z.number().min(100).max(300000), // $
      percentage: z.number().min(5).max(25), // % of direct costs
      profit: z.number().min(0).max(20) // % profit margin
    })
  }),
  
  // Total cost summary
  costSummary: z.object({
    totalEquipmentCost: z.number().min(1000).max(10000000), // $
    totalSoftCost: z.number().min(500).max(5000000), // $
    totalSystemCost: z.number().min(2000).max(15000000), // $
    pricePerWatt: z.number().min(1.0).max(8.0), // $/W
    costBreakdown: z.object({
      equipment: z.number().min(40).max(80), // % of total
      installation: z.number().min(20).max(60) // % of total
    })
  }),
  
  // Cost validation flags
  validation: z.object({
    costReasonable: z.boolean(),
    marketComparable: z.boolean(),
    itemizedComplete: z.boolean(),
    calculationsVerified: z.boolean()
  })
})
.refine((cost) => {
  // Validate total equipment cost calculation
  const calculatedEquipment = cost.equipmentCosts.panels.totalCost +
    cost.equipmentCosts.inverters.totalCost +
    cost.equipmentCosts.mounting.totalCost +
    cost.equipmentCosts.electrical.totalCost +
    cost.equipmentCosts.monitoring.totalCost +
    cost.equipmentCosts.other.totalCost;
  
  return Math.abs(calculatedEquipment - cost.costSummary.totalEquipmentCost) < 100;
}, {
  message: 'Total equipment cost does not match sum of individual components'
})
.refine((cost) => {
  // Validate price per watt within market range
  const marketRange = COST_RANGES[cost.systemType].pricePerWatt;
  return cost.costSummary.pricePerWatt >= marketRange.min && 
         cost.costSummary.pricePerWatt <= marketRange.max;
}, {
  message: 'Price per watt is outside typical market range for this system type'
})
.refine((cost) => {
  // Validate total system cost calculation
  const calculatedTotal = cost.costSummary.totalEquipmentCost + cost.costSummary.totalSoftCost;
  return Math.abs(calculatedTotal - cost.costSummary.totalSystemCost) < 100;
}, {
  message: 'Total system cost does not match equipment plus soft costs'
});

// =====================================================
// INCENTIVE VALIDATION
// =====================================================

// Federal incentive validation
export const federalIncentiveSchema = z.object({
  // Tax year and eligibility
  taxYear: z.number().int().min(2024).max(2035),
  eligibleForITC: z.boolean(),
  
  // Investment Tax Credit
  itc: z.object({
    percentage: z.number().min(0).max(30), // %
    eligibleCosts: z.number().min(0).max(15000000), // $
    creditAmount: z.number().min(0).max(4500000), // $
    limitations: z.object({
      taxLiability: z.number().min(0).max(10000000), // $
      carryforward: z.boolean().default(true),
      carryforwardYears: z.number().int().min(0).max(20)
    })
  }),
  
  // MACRS depreciation (commercial only)
  macrs: z.object({
    eligible: z.boolean(),
    depreciationBasis: z.number().min(0).max(15000000), // $
    bonusDepreciation: z.object({
      percentage: z.number().min(0).max(100), // %
      firstYearAmount: z.number().min(0).max(15000000) // $
    }),
    fiveYearSchedule: z.array(z.number().min(0).max(100)).length(6) // % per year
  }).optional(),
  
  // Other federal programs
  otherPrograms: z.array(z.object({
    programName: z.string().max(100),
    amount: z.number().min(0).max(1000000), // $
    type: z.enum(['grant', 'rebate', 'loan_guarantee', 'tax_deduction'])
  })).default([])
})
.refine((fed) => {
  // Validate ITC percentage for tax year
  const expectedITC = FEDERAL_INCENTIVES.itc[fed.taxYear as keyof typeof FEDERAL_INCENTIVES.itc] || 0;
  return fed.itc.percentage === expectedITC;
}, {
  message: 'ITC percentage does not match federal schedule for tax year'
})
.refine((fed) => {
  // Validate ITC amount calculation
  const calculatedCredit = fed.itc.eligibleCosts * (fed.itc.percentage / 100);
  return Math.abs(calculatedCredit - fed.itc.creditAmount) < 100;
}, {
  message: 'ITC credit amount does not match calculated value'
});

// State and local incentive validation
export const stateLocalIncentiveSchema = z.object({
  // Location
  state: z.string().length(2), // State abbreviation
  utility: z.string().max(100),
  municipality: z.string().max(100).optional(),
  
  // State incentives
  stateIncentives: z.array(z.object({
    programName: z.string().max(100),
    type: z.enum(['tax_credit', 'rebate', 'performance_payment', 'grant', 'loan']),
    amount: z.number().min(0).max(1000000), // $
    unit: z.enum(['lump_sum', 'per_watt', 'per_kwh', 'percentage']),
    cap: z.number().min(0).max(1000000).optional(), // $ maximum
    duration: z.number().int().min(1).max(30).optional(), // years
    eligibility: z.object({
      residentialEligible: z.boolean(),
      commercialEligible: z.boolean(),
      incomeRestrictions: z.boolean().default(false),
      systemSizeMin: z.number().min(0).max(100).optional(), // kW
      systemSizeMax: z.number().min(0).max(10000).optional() // kW
    })
  })).default([]),
  
  // Utility incentives
  utilityIncentives: z.array(z.object({
    programName: z.string().max(100),
    type: z.enum(['rebate', 'performance_payment', 'net_metering', 'feed_in_tariff']),
    amount: z.number().min(0).max(100000), // $
    rate: z.number().min(0).max(0.50).optional(), // $/kWh for performance payments
    duration: z.number().int().min(1).max(30).optional(), // years
    conditions: z.array(z.string()).default([])
  })).default([]),
  
  // Local incentives
  localIncentives: z.array(z.object({
    authority: z.string().max(100), // City, county, etc.
    programName: z.string().max(100),
    type: z.enum(['property_tax_exemption', 'sales_tax_exemption', 'rebate', 'grant']),
    value: z.number().min(0).max(100000), // $
    duration: z.number().int().min(1).max(30).optional() // years
  })).default([]),
  
  // Total incentive summary
  incentiveSummary: z.object({
    totalStateIncentives: z.number().min(0).max(2000000), // $
    totalUtilityIncentives: z.number().min(0).max(500000), // $
    totalLocalIncentives: z.number().min(0).max(200000), // $
    grandTotalIncentives: z.number().min(0).max(2500000) // $
  })
});

// =====================================================
// UTILITY RATE VALIDATION
// =====================================================

// Utility rate structure validation
export const utilityRateSchema = z.object({
  // Utility information
  utilityProvider: z.string().min(1).max(100),
  serviceTerritory: z.string().max(100),
  rateSchedule: z.string().max(50),
  effectiveDate: z.date(),
  
  // Rate structure
  rateStructure: z.object({
    type: z.enum(['flat', 'tiered', 'time_of_use', 'demand', 'real_time']),
    customerClass: z.enum(['residential', 'commercial', 'industrial']),
    voltageLevel: z.enum(['low', 'medium', 'high']).optional()
  }),
  
  // Energy charges
  energyCharges: z.object({
    // Flat rate
    flatRate: z.number().min(0.01).max(1.0).optional(), // $/kWh
    
    // Tiered rates
    tieredRates: z.array(z.object({
      tier: z.number().int().min(1).max(10),
      threshold: z.number().min(0).max(10000), // kWh
      rate: z.number().min(0.01).max(1.0) // $/kWh
    })).optional(),
    
    // Time-of-use rates
    touRates: z.object({
      onPeak: z.object({
        rate: z.number().min(0.05).max(1.0), // $/kWh
        hours: z.array(z.number().int().min(0).max(23)), // Hours of day
        months: z.array(z.number().int().min(1).max(12)) // Months of year
      }),
      offPeak: z.object({
        rate: z.number().min(0.01).max(0.5), // $/kWh
        hours: z.array(z.number().int().min(0).max(23)),
        months: z.array(z.number().int().min(1).max(12))
      }),
      shoulderPeak: z.object({
        rate: z.number().min(0.03).max(0.75), // $/kWh
        hours: z.array(z.number().int().min(0).max(23)),
        months: z.array(z.number().int().min(1).max(12))
      }).optional()
    }).optional()
  }),
  
  // Demand charges (commercial/industrial)
  demandCharges: z.object({
    applicable: z.boolean(),
    flatDemandCharge: z.number().min(0).max(50).optional(), // $/kW
    seasonalDemandCharges: z.array(z.object({
      season: z.enum(['summer', 'winter']),
      rate: z.number().min(0).max(50), // $/kW
      months: z.array(z.number().int().min(1).max(12))
    })).optional(),
    demandWindow: z.number().int().min(15).max(60).optional() // minutes
  }).optional(),
  
  // Fixed charges
  fixedCharges: z.object({
    monthlyCustomerCharge: z.number().min(0).max(100), // $/month
    meterCharge: z.number().min(0).max(50).optional(), // $/month
    facilityCharge: z.number().min(0).max(200).optional() // $/month
  }),
  
  // Net metering policy
  netMetering: z.object({
    available: z.boolean(),
    compensation: z.enum(['full_retail', 'avoided_cost', 'feed_in_tariff', 'net_billing']),
    rate: z.number().min(0).max(0.50).optional(), // $/kWh if different from retail
    rollover: z.enum(['monthly', 'annual', 'indefinite', 'cash_out']),
    systemSizeCap: z.number().min(10).max(2000).optional(), // kW
    aggregateCap: z.number().min(1).max(100).optional() // % of peak demand
  }),
  
  // Rate escalation
  escalation: z.object({
    historicalIncrease: z.number().min(0).max(10), // % annual average
    projectedIncrease: z.number().min(0).max(8), // % annual projected
    basis: z.enum(['historical', 'regulatory', 'inflation', 'fuel_costs'])
  })
})
.refine((rate) => {
  // Validate TOU rates don't overlap
  if (rate.energyCharges.touRates) {
    const onPeakHours = rate.energyCharges.touRates.onPeak.hours;
    const offPeakHours = rate.energyCharges.touRates.offPeak.hours;
    const overlap = onPeakHours.some(hour => offPeakHours.includes(hour));
    return !overlap;
  }
  return true;
}, {
  message: 'Time-of-use rate periods cannot overlap'
})
.refine((rate) => {
  // Validate tiered rate thresholds are increasing
  if (rate.energyCharges.tieredRates) {
    const thresholds = rate.energyCharges.tieredRates.map(tier => tier.threshold);
    for (let i = 1; i < thresholds.length; i++) {
      if (thresholds[i] <= thresholds[i-1]) return false;
    }
  }
  return true;
}, {
  message: 'Tiered rate thresholds must be in increasing order'
});

// =====================================================
// FINANCING VALIDATION
// =====================================================

// Solar loan validation
export const solarLoanSchema = z.object({
  // Loan terms
  loanAmount: z.number().min(FINANCING_LIMITS.loan.minAmount).max(FINANCING_LIMITS.loan.maxAmount),
  interestRate: z.number().min(FINANCING_LIMITS.loan.minRate).max(FINANCING_LIMITS.loan.maxRate), // % APR
  loanTerm: z.number().int().min(FINANCING_LIMITS.loan.minTerm).max(FINANCING_LIMITS.loan.maxTerm), // years
  
  // Payment structure
  paymentStructure: z.object({
    monthlyPayment: z.number().min(100).max(10000), // $/month
    totalPayments: z.number().min(12).max(300), // number of payments
    totalInterest: z.number().min(0).max(200000), // $ total interest
    totalCost: z.number().min(5000).max(700000) // $ total loan cost
  }),
  
  // Borrower qualification
  borrowerQualification: z.object({
    creditScore: z.number().int().min(300).max(850),
    annualIncome: z.number().min(20000).max(10000000), // $
    debtToIncomeRatio: z.number().min(0).max(60), // %
    employmentStatus: z.enum(['employed', 'self_employed', 'retired', 'other']),
    homeOwnership: z.enum(['own', 'rent', 'other'])
  }),
  
  // Loan features
  loanFeatures: z.object({
    fixedRate: z.boolean().default(true),
    prepaymentPenalty: z.boolean().default(false),
    deferredPayments: z.number().int().min(0).max(24).optional(), // months
    balloonPayment: z.number().min(0).max(100000).optional(), // $
    collateral: z.enum(['unsecured', 'home_equity', 'solar_system'])
  }),
  
  // Fees
  fees: z.object({
    originationFee: z.number().min(0).max(5000), // $
    processingFee: z.number().min(0).max(1000), // $
    appraisalFee: z.number().min(0).max(1000).optional(), // $
    totalFees: z.number().min(0).max(7000) // $
  })
})
.refine((loan) => {
  // Validate monthly payment calculation
  const r = loan.interestRate / 100 / 12; // Monthly rate
  const n = loan.loanTerm * 12; // Total payments
  const calculatedPayment = loan.loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.abs(calculatedPayment - loan.paymentStructure.monthlyPayment) < 10;
}, {
  message: 'Monthly payment calculation is incorrect'
})
.refine((loan) => {
  // Validate debt-to-income ratio
  return loan.borrowerQualification.debtToIncomeRatio <= FINANCING_LIMITS.loan.maxDebtToIncome;
}, {
  message: 'Debt-to-income ratio exceeds lending guidelines'
});

// Solar lease validation
export const solarLeaseSchema = z.object({
  // Lease terms
  systemValue: z.number().min(10000).max(200000), // $
  monthlyPayment: z.number().min(50).max(1000), // $
  leaseTerm: z.number().int().min(10).max(25), // years
  
  // Escalation
  escalation: z.object({
    annual: z.number().min(0).max(5), // % per year
    compounding: z.boolean().default(true)
  }),
  
  // Lease options
  leaseOptions: z.object({
    buyoutOption: z.boolean().default(true),
    buyoutSchedule: z.array(z.object({
      year: z.number().int().min(1).max(25),
      buyoutPrice: z.number().min(1000).max(150000) // $
    })).optional(),
    transferable: z.boolean().default(true),
    renewalOption: z.boolean().default(false),
    renewalTerm: z.number().int().min(5).max(10).optional() // years
  }),
  
  // Maintenance and service
  serviceIncluded: z.object({
    maintenance: z.boolean().default(true),
    monitoring: z.boolean().default(true),
    insurance: z.boolean().default(false),
    warranty: z.boolean().default(true),
    repairs: z.boolean().default(true)
  }),
  
  // Performance guarantee
  performanceGuarantee: z.object({
    guaranteed: z.boolean().default(false),
    minimumProduction: z.number().min(0).max(50000).optional(), // kWh/year
    compensationRate: z.number().min(0).max(0.30).optional() // $/kWh shortfall
  })
})
.refine((lease) => {
  // Validate escalation rate
  return lease.escalation.annual <= FINANCING_LIMITS.lease.escalator.max;
}, {
  message: 'Annual escalation rate exceeds typical lease limits'
});

// Power Purchase Agreement (PPA) validation
export const solarPPASchema = z.object({
  // PPA terms
  initialRate: z.number().min(FINANCING_LIMITS.ppa.minRate).max(FINANCING_LIMITS.ppa.maxRate), // $/kWh
  ppaterm: z.number().int().min(FINANCING_LIMITS.ppa.minTerm).max(FINANCING_LIMITS.ppa.maxTerm), // years
  
  // Rate escalation
  escalation: z.object({
    annual: z.number().min(0).max(5), // % per year
    method: z.enum(['simple', 'compound']),
    cap: z.number().min(0.05).max(0.50).optional() // $/kWh maximum rate
  }),
  
  // Production and billing
  production: z.object({
    estimatedAnnualProduction: z.number().min(1000).max(5000000), // kWh/year
    productionGuarantee: z.boolean().default(false),
    minimumProduction: z.number().min(0).max(5000000).optional(), // kWh/year
    shortfallCompensation: z.number().min(0).max(0.30).optional() // $/kWh
  }),
  
  // PPA options
  ppaOptions: z.object({
    buyoutOption: z.boolean().default(true),
    buyoutSchedule: z.array(z.object({
      year: z.number().int().min(6).max(25),
      buyoutPrice: z.number().min(0).max(200000) // $
    })).optional(),
    renewalOption: z.boolean().default(true),
    renewalRate: z.number().min(0.02).max(0.25).optional(), // $/kWh
    transferable: z.boolean().default(true)
  }),
  
  // Service and maintenance
  servicesIncluded: z.object({
    operationMaintenance: z.boolean().default(true),
    monitoring: z.boolean().default(true),
    insurance: z.boolean().default(true),
    warranty: z.boolean().default(true),
    repairs: z.boolean().default(true),
    replacement: z.boolean().default(true)
  })
});

// =====================================================
// ROI AND FINANCIAL ANALYSIS VALIDATION
// =====================================================

// Return on Investment analysis validation
export const roiAnalysisSchema = z.object({
  // Analysis parameters
  analysisParameters: z.object({
    systemLifetime: z.number().int().min(20).max(30), // years
    discountRate: z.number().min(1).max(15), // % discount rate
    inflationRate: z.number().min(0).max(8), // % inflation
    electricityEscalation: z.number().min(0).max(8), // % annual increase
    degradationRate: z.number().min(0.3).max(1.0) // % annual panel degradation
  }),
  
  // Cash flows
  cashFlows: z.object({
    initialInvestment: z.number().min(1000).max(15000000), // $
    netInitialCost: z.number().min(0).max(15000000), // $ after incentives
    annualSavings: z.array(z.number().min(0).max(200000)).min(20).max(30), // $ per year
    cumulativeSavings: z.array(z.number().min(0).max(5000000)).min(20).max(30), // $ cumulative
    maintenanceCosts: z.array(z.number().min(0).max(10000)).min(20).max(30) // $ per year
  }),
  
  // Financial metrics
  financialMetrics: z.object({
    paybackPeriod: z.number().min(2).max(25), // years
    simpleROI: z.number().min(-50).max(1000), // %
    npv: z.number().min(-1000000).max(5000000), // $ Net Present Value
    irr: z.number().min(-20).max(50), // % Internal Rate of Return
    lcoe: z.number().min(0.01).max(0.50), // $ Levelized Cost of Energy
    totalLifetimeSavings: z.number().min(0).max(5000000) // $
  }),
  
  // Sensitivity analysis
  sensitivityAnalysis: z.object({
    electricityRateVariation: z.object({
      low: z.number().min(-30).max(30), // % NPV change
      high: z.number().min(-30).max(30) // % NPV change
    }),
    systemCostVariation: z.object({
      low: z.number().min(-30).max(30), // % NPV change
      high: z.number().min(-30).max(30) // % NPV change
    }),
    productionVariation: z.object({
      low: z.number().min(-30).max(30), // % NPV change
      high: z.number().min(-30).max(30) // % NPV change
    })
  }),
  
  // Risk assessment
  riskAssessment: z.object({
    technologyRisk: z.enum(['low', 'medium', 'high']),
    financialRisk: z.enum(['low', 'medium', 'high']),
    regulatoryRisk: z.enum(['low', 'medium', 'high']),
    weatherRisk: z.enum(['low', 'medium', 'high']),
    overallRiskRating: z.enum(['conservative', 'moderate', 'aggressive'])
  })
})
.refine((roi) => {
  // Validate payback period calculation
  const cumulativeSavings = roi.cashFlows.cumulativeSavings;
  const netCost = roi.cashFlows.netInitialCost;
  
  // Find payback year
  let paybackYear = cumulativeSavings.findIndex(savings => savings >= netCost);
  if (paybackYear === -1) paybackYear = cumulativeSavings.length;
  else paybackYear += 1;
  
  return Math.abs(paybackYear - roi.financialMetrics.paybackPeriod) <= 1;
}, {
  message: 'Payback period calculation does not match cumulative savings'
})
.refine((roi) => {
  // Validate positive NPV means profitable investment
  return roi.financialMetrics.npv > 0 ? roi.financialMetrics.irr > roi.analysisParameters.discountRate : true;
}, {
  message: 'IRR should exceed discount rate when NPV is positive'
});

// Export type definitions
export type SystemCost = z.infer<typeof systemCostSchema>;
export type FederalIncentive = z.infer<typeof federalIncentiveSchema>;
export type StateLocalIncentive = z.infer<typeof stateLocalIncentiveSchema>;
export type UtilityRate = z.infer<typeof utilityRateSchema>;
export type SolarLoan = z.infer<typeof solarLoanSchema>;
export type SolarLease = z.infer<typeof solarLeaseSchema>;
export type SolarPPA = z.infer<typeof solarPPASchema>;
export type ROIAnalysis = z.infer<typeof roiAnalysisSchema>;
