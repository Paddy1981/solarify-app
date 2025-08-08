/**
 * Solar Customer Data Validation Layer
 * 
 * Comprehensive validation for customer energy usage patterns, property information,
 * utility details, geographic data, and credit/financing qualifications.
 * 
 * Based on:
 * - Utility billing data standards
 * - Credit reporting industry standards
 * - Property assessment methodologies
 * - Solar industry customer qualification practices
 */

import { z } from 'zod';
import { coordinatesSchema } from './common';

// =====================================================
// CUSTOMER ENERGY USAGE VALIDATION
// =====================================================

// Energy usage patterns and historical data
export const energyUsagePatternsSchema = z.object({
  // Historical usage data
  historicalUsage: z.object({
    // Monthly usage for at least 12 months
    monthlyData: z.array(z.object({
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2020).max(new Date().getFullYear()),
      usage: z.number().min(0).max(10000), // kWh
      cost: z.number().min(0).max(2000), // $
      days: z.number().int().min(28).max(31), // billing days
      averageDailyUsage: z.number().min(0).max(400) // kWh/day
    })).min(12).max(36), // 1-3 years of data
    
    // Annual summaries
    annualSummary: z.array(z.object({
      year: z.number().int().min(2020).max(new Date().getFullYear()),
      totalUsage: z.number().min(0).max(120000), // kWh/year
      totalCost: z.number().min(0).max(15000), // $/year
      averageMonthlyUsage: z.number().min(0).max(10000), // kWh/month
      averageMonthlyBill: z.number().min(0).max(1500), // $/month
      peakMonth: z.number().int().min(1).max(12),
      lowMonth: z.number().int().min(1).max(12)
    })).min(1).max(3),
    
    // Data quality indicators
    dataQuality: z.object({
      completeness: z.number().min(75).max(100), // % of months with data
      source: z.enum(['utility_bill', 'online_account', 'smart_meter', 'manual_entry']),
      verified: z.boolean().default(false),
      estimatedMonths: z.number().int().min(0).max(12) // number of estimated months
    })
  }),
  
  // Seasonal patterns
  seasonalPatterns: z.object({
    // Seasonal usage distribution
    seasonalDistribution: z.object({
      spring: z.number().min(0).max(40), // % of annual usage
      summer: z.number().min(0).max(60), // % of annual usage
      fall: z.number().min(0).max(40), // % of annual usage
      winter: z.number().min(0).max(60) // % of annual usage
    }),
    
    // Peak usage characteristics
    peakUsage: z.object({
      peakSeason: z.enum(['spring', 'summer', 'fall', 'winter']),
      peakMonthUsage: z.number().min(0).max(5000), // kWh
      baselineUsage: z.number().min(0).max(3000), // kWh lowest month
      seasonalVariation: z.number().min(1).max(10) // ratio peak/baseline
    }),
    
    // Time-of-use patterns (if available)
    timeOfUsePatterns: z.object({
      available: z.boolean().default(false),
      onPeakUsage: z.number().min(0).max(50).optional(), // % of total usage
      offPeakUsage: z.number().min(0).max(80).optional(), // % of total usage
      shoulderUsage: z.number().min(0).max(30).optional() // % of total usage
    }).optional()
  }),
  
  // Load profile analysis
  loadProfileAnalysis: z.object({
    // Baseline load
    baselineLoad: z.object({
      averageBaseload: z.number().min(0.5).max(20), // kW continuous load
      nighttimeUsage: z.number().min(5).max(50), // % of daily usage
      weekendUsage: z.number().min(80).max(120) // % of weekday usage
    }),
    
    // Peak demand characteristics
    peakDemand: z.object({
      monthlyPeakDemand: z.array(z.object({
        month: z.number().int().min(1).max(12),
        peakDemand: z.number().min(1).max(100), // kW
        timeOfPeak: z.string().max(10).optional() // time of day
      })).length(12).optional(),
      annualPeakDemand: z.number().min(2).max(100), // kW
      loadFactor: z.number().min(0.1).max(1.0) // average/peak load ratio
    }),
    
    // Usage drivers
    usageDrivers: z.array(z.object({
      driver: z.enum([
        'heating', 'cooling', 'water_heating', 'pool', 'ev_charging',
        'home_office', 'appliances', 'lighting', 'other'
      ]),
      estimatedUsage: z.number().min(0).max(5000), // kWh/year
      percentage: z.number().min(0).max(80) // % of total usage
    })).default([])
  })
})
.refine((usage) => {
  // Validate seasonal distribution sums to ~100%
  const total = usage.seasonalPatterns.seasonalDistribution.spring +
                usage.seasonalPatterns.seasonalDistribution.summer +
                usage.seasonalPatterns.seasonalDistribution.fall +
                usage.seasonalPatterns.seasonalDistribution.winter;
  return Math.abs(total - 100) <= 5; // 5% tolerance
}, {
  message: 'Seasonal usage distribution must sum to approximately 100%'
})
.refine((usage) => {
  // Validate monthly data consistency
  const totalAnnualFromMonthly = usage.historicalUsage.monthlyData
    .filter(month => month.year === new Date().getFullYear() - 1)
    .reduce((sum, month) => sum + month.usage, 0);
  
  if (totalAnnualFromMonthly > 0) {
    const lastYearAnnual = usage.historicalUsage.annualSummary
      .find(year => year.year === new Date().getFullYear() - 1)?.totalUsage || 0;
    
    return Math.abs(totalAnnualFromMonthly - lastYearAnnual) / lastYearAnnual < 0.1;
  }
  return true;
}, {
  message: 'Monthly data does not sum to annual total within 10% tolerance'
});

// =====================================================
// PROPERTY INFORMATION VALIDATION
// =====================================================

// Detailed property characteristics
export const propertyInformationSchema = z.object({
  // Basic property details
  basicInfo: z.object({
    propertyType: z.enum(['single_family', 'multi_family', 'condo', 'townhouse', 'manufactured', 'mobile']),
    ownershipType: z.enum(['own_outright', 'mortgage', 'lease', 'rent', 'other']),
    yearBuilt: z.number().int().min(1850).max(new Date().getFullYear()),
    yearPurchased: z.number().int().min(1950).max(new Date().getFullYear()).optional(),
    purchasePrice: z.number().min(10000).max(50000000).optional(), // $
    currentValue: z.number().min(10000).max(50000000).optional() // $
  }),
  
  // Property dimensions and layout
  propertyDimensions: z.object({
    lotSize: z.object({
      area: z.number().min(0.01).max(1000), // acres
      dimensions: z.object({
        length: z.number().min(50).max(2000), // feet
        width: z.number().min(25).max(1000) // feet
      }).optional()
    }),
    buildingFootprint: z.object({
      area: z.number().min(400).max(50000), // sq ft
      floors: z.number().int().min(1).max(5),
      basement: z.boolean().default(false),
      attic: z.boolean().default(false)
    }),
    totalLivingSpace: z.number().min(400).max(50000), // sq ft
    bedrooms: z.number().int().min(1).max(20),
    bathrooms: z.number().min(1).max(20) // including half baths
  }),
  
  // Roof characteristics
  roofCharacteristics: z.object({
    roofStyle: z.enum(['gable', 'hip', 'shed', 'mansard', 'gambrel', 'flat', 'complex']),
    roofMaterial: z.enum(['asphalt_shingle', 'wood_shake', 'clay_tile', 'concrete_tile', 'metal', 'slate', 'membrane']),
    roofAge: z.number().int().min(0).max(100), // years
    roofCondition: z.enum(['excellent', 'good', 'fair', 'poor', 'needs_replacement']),
    roofColor: z.enum(['light', 'medium', 'dark']).optional(),
    
    // Roof sections for solar assessment
    roofSections: z.array(z.object({
      sectionId: z.string().max(20),
      area: z.number().min(50).max(5000), // sq ft
      slope: z.number().min(0).max(45), // degrees
      azimuth: z.number().min(0).max(360), // degrees from north
      shadingCategory: z.enum(['none', 'minimal', 'moderate', 'significant']),
      suitableForSolar: z.boolean()
    })).min(1).max(10),
    
    totalRoofArea: z.number().min(400).max(20000), // sq ft
    solarSuitableArea: z.number().min(0).max(15000) // sq ft
  }),
  
  // HVAC and major systems
  hvacSystems: z.object({
    heating: z.object({
      primaryType: z.enum(['gas_furnace', 'oil_furnace', 'electric_heat', 'heat_pump', 'radiant', 'other']),
      age: z.number().int().min(0).max(50), // years
      efficiency: z.string().max(20).optional(), // AFUE or HSPF rating
      size: z.number().min(20000).max(200000).optional() // BTU/hr
    }),
    cooling: z.object({
      primaryType: z.enum(['central_ac', 'heat_pump', 'window_units', 'mini_split', 'evaporative', 'none']),
      age: z.number().int().min(0).max(30), // years
      efficiency: z.string().max(20).optional(), // SEER rating
      size: z.number().min(12000).max(100000).optional() // BTU/hr
    }),
    waterHeating: z.object({
      type: z.enum(['gas_tank', 'electric_tank', 'gas_tankless', 'electric_tankless', 'heat_pump', 'solar']),
      age: z.number().int().min(0).max(30), // years
      capacity: z.number().min(20).max(100).optional(), // gallons
      efficiency: z.string().max(20).optional() // Energy Factor
    }),
    poolSpa: z.object({
      hasPool: z.boolean().default(false),
      poolType: z.enum(['in_ground', 'above_ground']).optional(),
      poolHeater: z.enum(['gas', 'electric', 'heat_pump', 'solar', 'none']).optional(),
      hasSpa: z.boolean().default(false)
    }).optional()
  }),
  
  // Energy efficiency characteristics
  energyEfficiency: z.object({
    insulation: z.object({
      atticInsulation: z.enum(['excellent', 'good', 'fair', 'poor', 'none']),
      wallInsulation: z.enum(['excellent', 'good', 'fair', 'poor', 'none']),
      basementInsulation: z.enum(['excellent', 'good', 'fair', 'poor', 'none', 'not_applicable'])
    }),
    windows: z.object({
      primaryType: z.enum(['single_pane', 'double_pane', 'triple_pane', 'storm_windows']),
      age: z.number().int().min(0).max(100), // years
      efficiency: z.enum(['high', 'medium', 'low']).optional()
    }),
    airSealing: z.enum(['excellent', 'good', 'fair', 'poor']),
    homeEfficiencyRating: z.object({
      hasRating: z.boolean().default(false),
      ratingType: z.enum(['HERS', 'Energy_Star', 'LEED', 'other']).optional(),
      score: z.number().min(0).max(200).optional() // HERS score or equivalent
    }).optional()
  })
})
.refine((property) => {
  // Validate solar suitable area doesn't exceed total roof area
  return property.roofCharacteristics.solarSuitableArea <= property.roofCharacteristics.totalRoofArea;
}, {
  message: 'Solar suitable area cannot exceed total roof area'
})
.refine((property) => {
  // Validate roof sections area sums approximately to total
  const sectionsTotal = property.roofCharacteristics.roofSections
    .reduce((sum, section) => sum + section.area, 0);
  return Math.abs(sectionsTotal - property.roofCharacteristics.totalRoofArea) / property.roofCharacteristics.totalRoofArea < 0.2;
}, {
  message: 'Roof sections total area should be within 20% of total roof area'
});

// =====================================================
// UTILITY INFORMATION VALIDATION
// =====================================================

// Comprehensive utility provider information
export const utilityInformationSchema = z.object({
  // Primary utility provider
  primaryUtility: z.object({
    utilityName: z.string().min(1).max(100),
    utilityType: z.enum(['investor_owned', 'municipal', 'cooperative', 'federal']),
    serviceTerritory: z.string().max(100),
    utilityWebsite: z.string().url().optional(),
    customerServicePhone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional()
  }),
  
  // Account information
  accountInfo: z.object({
    accountNumber: z.string().min(5).max(50),
    accountHolderName: z.string().min(1).max(100),
    serviceAddress: z.object({
      street: z.string().min(1).max(100),
      city: z.string().min(1).max(50),
      state: z.string().length(2),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/)
    }),
    accountStatus: z.enum(['active', 'inactive', 'suspended']),
    accountAge: z.number().int().min(0).max(50) // years
  }),
  
  // Rate schedule information
  rateSchedule: z.object({
    currentSchedule: z.string().min(1).max(50),
    scheduleType: z.enum(['residential', 'small_commercial', 'large_commercial', 'industrial']),
    meterType: z.enum(['analog', 'digital', 'smart', 'net_meter']),
    
    // Rate structure details
    rateStructure: z.object({
      energyCharges: z.object({
        hasTieredRates: z.boolean(),
        hasTimeOfUseRates: z.boolean(),
        flatRate: z.number().min(0.05).max(0.50).optional(), // $/kWh
        averageRate: z.number().min(0.08).max(0.40) // $/kWh blended
      }),
      demandCharges: z.object({
        applicable: z.boolean(),
        rate: z.number().min(0).max(50).optional() // $/kW
      }),
      fixedCharges: z.object({
        monthlyBasic: z.number().min(0).max(100), // $/month
        connectionCharge: z.number().min(0).max(50), // $/month
        totalFixed: z.number().min(0).max(150) // $/month
      })
    })
  }),
  
  // Net metering and solar policies
  solarPolicies: z.object({
    netMeteringAvailable: z.boolean(),
    netMeteringDetails: z.object({
      compensation: z.enum(['full_retail', 'avoided_cost', 'feed_in_tariff', 'net_billing']).optional(),
      rollover: z.enum(['monthly', 'annual', 'cash_out']).optional(),
      systemSizeCap: z.number().min(5).max(2000).optional(), // kW
      applicationFee: z.number().min(0).max(500).optional(), // $
      processingTime: z.number().int().min(30).max(180).optional() // days
    }).optional(),
    
    interconnectionRequirements: z.object({
      studyRequired: z.boolean(),
      applicationRequired: z.boolean(),
      insuranceRequired: z.boolean(),
      inspectionRequired: z.boolean(),
      additionalFees: z.number().min(0).max(2000) // $
    }),
    
    utilityIncentives: z.array(z.object({
      programName: z.string().max(100),
      incentiveType: z.enum(['rebate', 'performance_payment', 'loan', 'discount']),
      amount: z.number().min(0).max(10000), // $ or $/kW
      eligibilityRequirements: z.array(z.string()).default([])
    })).default([])
  }),
  
  // Grid characteristics
  gridCharacteristics: z.object({
    reliability: z.object({
      averageOutages: z.number().min(0).max(50), // per year
      averageOutageDuration: z.number().min(0).max(48), // hours
      saidi: z.number().min(0).max(1000).optional(), // System Average Interruption Duration Index
      saifi: z.number().min(0).max(10).optional() // System Average Interruption Frequency Index
    }),
    powerQuality: z.object({
      voltageStability: z.enum(['excellent', 'good', 'fair', 'poor']),
      frequencyStability: z.enum(['excellent', 'good', 'fair', 'poor']),
      harmonicDistortion: z.enum(['low', 'moderate', 'high']).optional()
    }),
    gridModernization: z.object({
      smartGridDeployment: z.enum(['complete', 'partial', 'planned', 'none']),
      smartMeterDeployment: z.enum(['complete', 'partial', 'planned', 'none']),
      distributedEnergySupport: z.enum(['excellent', 'good', 'fair', 'poor'])
    })
  })
});

// =====================================================
// CREDIT AND FINANCING VALIDATION
// =====================================================

// Credit and financial qualification
export const creditFinancingSchema = z.object({
  // Credit information
  creditProfile: z.object({
    creditScore: z.object({
      score: z.number().int().min(300).max(850),
      scoreModel: z.enum(['FICO', 'VantageScore', 'other']),
      reportDate: z.date(),
      bureau: z.enum(['Equifax', 'Experian', 'TransUnion', 'multiple'])
    }),
    creditHistory: z.object({
      lengthOfCreditHistory: z.number().int().min(0).max(60), // years
      numberOfAccounts: z.number().int().min(0).max(100),
      averageAccountAge: z.number().min(0).max(50), // years
      recentInquiries: z.number().int().min(0).max(20) // last 12 months
    }),
    creditUtilization: z.object({
      totalCreditLimit: z.number().min(0).max(1000000), // $
      totalBalance: z.number().min(0).max(500000), // $
      utilizationRatio: z.number().min(0).max(100), // %
      highestUtilization: z.number().min(0).max(100) // % single account
    }),
    paymentHistory: z.object({
      latePayments30Days: z.number().int().min(0).max(50), // last 24 months
      latePayments60Days: z.number().int().min(0).max(20), // last 24 months
      latePayments90Days: z.number().int().min(0).max(10), // last 24 months
      collections: z.number().int().min(0).max(10),
      bankruptcies: z.number().int().min(0).max(5),
      foreclosures: z.number().int().min(0).max(3)
    })
  }),
  
  // Income and employment
  incomeEmployment: z.object({
    primaryIncome: z.object({
      employmentStatus: z.enum(['employed_w2', 'self_employed', 'contractor', 'retired', 'unemployed', 'other']),
      employer: z.string().max(100).optional(),
      jobTitle: z.string().max(100).optional(),
      employmentLength: z.number().min(0).max(50), // years
      grossAnnualIncome: z.number().min(0).max(10000000), // $
      incomeVerified: z.boolean().default(false)
    }),
    additionalIncome: z.array(z.object({
      source: z.enum(['rental', 'investment', 'pension', 'social_security', 'alimony', 'other']),
      monthlyAmount: z.number().min(0).max(50000), // $
      verified: z.boolean().default(false)
    })).default([]),
    totalMonthlyIncome: z.number().min(0).max(500000) // $
  }),
  
  // Debt and obligations
  debtObligations: z.object({
    mortgage: z.object({
      hasMortgage: z.boolean(),
      monthlyPayment: z.number().min(0).max(20000).optional(), // $
      remainingBalance: z.number().min(0).max(5000000).optional(), // $
      yearsRemaining: z.number().min(0).max(30).optional()
    }),
    otherDebts: z.array(z.object({
      debtType: z.enum(['auto_loan', 'student_loan', 'credit_card', 'personal_loan', 'heloc', 'other']),
      monthlyPayment: z.number().min(0).max(5000), // $
      remainingBalance: z.number().min(0).max(200000), // $
      interestRate: z.number().min(0).max(30) // %
    })).default([]),
    totalMonthlyDebt: z.number().min(0).max(25000), // $
    debtToIncomeRatio: z.number().min(0).max(100) // %
  }),
  
  // Assets and down payment
  assetsDownPayment: z.object({
    liquidAssets: z.object({
      checkingAccounts: z.number().min(0).max(1000000), // $
      savingsAccounts: z.number().min(0).max(5000000), // $
      investmentAccounts: z.number().min(0).max(10000000), // $
      totalLiquid: z.number().min(0).max(15000000) // $
    }),
    homeEquity: z.object({
      currentHomeValue: z.number().min(0).max(50000000), // $
      mortgageBalance: z.number().min(0).max(25000000), // $
      availableEquity: z.number().min(0).max(25000000) // $
    }).optional(),
    downPaymentCapacity: z.object({
      cashAvailable: z.number().min(0).max(1000000), // $
      homeEquityAvailable: z.number().min(0).max(500000), // $
      totalAvailable: z.number().min(0).max(1000000) // $
    })
  }),
  
  // Financing preferences
  financingPreferences: z.object({
    preferredFinancingType: z.enum(['cash', 'loan', 'lease', 'ppa', 'undecided']),
    maxMonthlyPayment: z.number().min(0).max(2000), // $
    preferredTerm: z.number().int().min(5).max(25).optional(), // years
    downPaymentPreference: z.number().min(0).max(100).optional(), // % of system cost
    
    // Specific financing considerations
    considerations: z.object({
      taxAppetite: z.boolean(), // ability to use tax credits
      cashFlowImportance: z.enum(['very_important', 'important', 'somewhat_important', 'not_important']),
      ownershipImportance: z.enum(['very_important', 'important', 'somewhat_important', 'not_important']),
      maintenancePreference: z.enum(['handle_myself', 'included_in_financing', 'separate_contract'])
    })
  })
})
.refine((credit) => {
  // Validate credit utilization calculation
  const calculatedUtilization = credit.creditProfile.creditUtilization.totalBalance / 
    credit.creditProfile.creditUtilization.totalCreditLimit * 100;
  return Math.abs(calculatedUtilization - credit.creditProfile.creditUtilization.utilizationRatio) <= 1;
}, {
  message: 'Credit utilization ratio calculation is inconsistent'
})
.refine((credit) => {
  // Validate debt-to-income ratio
  const calculatedDTI = credit.debtObligations.totalMonthlyDebt / 
    credit.incomeEmployment.totalMonthlyIncome * 100;
  return Math.abs(calculatedDTI - credit.debtObligations.debtToIncomeRatio) <= 2;
}, {
  message: 'Debt-to-income ratio calculation is inconsistent'
})
.refine((credit) => {
  // Validate home equity calculation
  if (credit.assetsDownPayment.homeEquity) {
    const equity = credit.assetsDownPayment.homeEquity;
    const calculatedEquity = equity.currentHomeValue - equity.mortgageBalance;
    return Math.abs(calculatedEquity - equity.availableEquity) <= equity.currentHomeValue * 0.05;
  }
  return true;
}, {
  message: 'Home equity calculation appears incorrect'
});

// =====================================================
// GEOGRAPHIC AND SOLAR RESOURCE DATA
// =====================================================

// Geographic location and solar resource validation
export const geographicSolarDataSchema = z.object({
  // Location details
  location: z.object({
    coordinates: coordinatesSchema,
    address: z.object({
      street: z.string().min(1).max(100),
      city: z.string().min(1).max(50),
      state: z.string().length(2),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      county: z.string().max(50)
    }),
    timezone: z.string().max(50),
    elevation: z.number().min(-500).max(15000) // feet above sea level
  }),
  
  // Solar resource data
  solarResource: z.object({
    // Annual solar irradiance
    annualIrradiance: z.object({
      globalHorizontal: z.number().min(800).max(2800), // kWh/m²/year
      directNormal: z.number().min(500).max(3500), // kWh/m²/year
      diffuseHorizontal: z.number().min(400).max(1500), // kWh/m²/year
      planeOfArray: z.number().min(900).max(2500) // kWh/m²/year optimally tilted
    }),
    
    // Monthly solar data
    monthlySolarData: z.array(z.object({
      month: z.number().int().min(1).max(12),
      ghi: z.number().min(30).max(250), // kWh/m²/month
      dni: z.number().min(20).max(300), // kWh/m²/month
      dhi: z.number().min(20).max(120), // kWh/m²/month
      peakSunHours: z.number().min(2).max(10) // hours/day
    })).length(12),
    
    // Solar production potential
    productionPotential: z.object({
      optimalTilt: z.number().min(0).max(60), // degrees
      optimalAzimuth: z.number().min(135).max(225), // degrees (south-facing)
      annualProductionPotential: z.number().min(1000).max(2000), // kWh/kW/year
      seasonalVariation: z.number().min(1.5).max(5.0) // summer/winter ratio
    })
  }),
  
  // Climate characteristics
  climate: z.object({
    // Temperature data
    temperature: z.object({
      annualAverageTemp: z.number().min(30).max(90), // °F
      summerAverageTemp: z.number().min(60).max(110), // °F
      winterAverageTemp: z.number().min(-20).max(70), // °F
      extremeHigh: z.number().min(80).max(130), // °F
      extremeLow: z.number().min(-50).max(40) // °F
    }),
    
    // Weather patterns
    weatherPatterns: z.object({
      annualRainfall: z.number().min(5).max(200), // inches
      snowfall: z.number().min(0).max(500), // inches annually
      averageWindSpeed: z.number().min(3).max(25), // mph
      hurricaneRisk: z.enum(['none', 'low', 'moderate', 'high']),
      tornadoRisk: z.enum(['none', 'low', 'moderate', 'high']),
      hailRisk: z.enum(['none', 'low', 'moderate', 'high'])
    }),
    
    // Environmental factors
    environmentalFactors: z.object({
      airQuality: z.enum(['excellent', 'good', 'moderate', 'poor']),
      soilingRate: z.number().min(1).max(10), // % annually
      uvExposure: z.enum(['low', 'moderate', 'high', 'very_high']),
      saltAirExposure: z.enum(['none', 'low', 'moderate', 'high'])
    })
  }),
  
  // Local regulations and codes
  localRegulations: z.object({
    buildingCodes: z.object({
      windLoadRequirement: z.number().min(85).max(200), // mph
      snowLoadRequirement: z.number().min(0).max(150), // psf
      seismicDesignCategory: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
      fireSetbackRequirements: z.number().min(1).max(10) // feet
    }),
    
    solarRegulations: z.object({
      permitsRequired: z.array(z.enum(['building', 'electrical', 'structural', 'fire', 'utility'])),
      inspectionsRequired: z.array(z.enum(['electrical', 'structural', 'final', 'utility'])),
      ahjName: z.string().max(100),
      permitProcessingTime: z.number().int().min(1).max(180), // days
      interconnectionTime: z.number().int().min(30).max(365) // days
    }),
    
    homeownersAssociation: z.object({
      hasHOA: z.boolean(),
      solarRestrictions: z.boolean().optional(),
      approvalRequired: z.boolean().optional(),
      approvalTime: z.number().int().min(30).max(180).optional(), // days
      aestheticRequirements: z.array(z.string()).default([])
    }).optional()
  })
});

// =====================================================
// CONTACT AND COMMUNICATION PREFERENCES
// =====================================================

// Customer contact and communication preferences
export const contactCommunicationSchema = z.object({
  // Primary contact information
  primaryContact: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email().max(254),
    phone: z.object({
      primary: z.string().regex(/^\+?[1-9]\d{1,14}$/),
      type: z.enum(['mobile', 'home', 'work']),
      textEnabled: z.boolean().default(false)
    }),
    alternatePhone: z.object({
      number: z.string().regex(/^\+?[1-9]\d{1,14}$/),
      type: z.enum(['mobile', 'home', 'work'])
    }).optional()
  }),
  
  // Additional contacts
  additionalContacts: z.array(z.object({
    relationship: z.enum(['spouse', 'partner', 'family', 'property_manager', 'financial_advisor', 'other']),
    name: z.string().min(1).max(100),
    email: z.string().email().max(254).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    role: z.enum(['decision_maker', 'influencer', 'information_only', 'emergency_contact'])
  })).default([]),
  
  // Communication preferences
  communicationPreferences: z.object({
    preferredContactMethod: z.enum(['email', 'phone', 'text', 'mail', 'in_person']),
    bestTimeToContact: z.object({
      timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'anytime']),
      daysOfWeek: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']))
    }),
    timezone: z.string().max(50),
    language: z.enum(['english', 'spanish', 'french', 'chinese', 'other']).default('english')
  }),
  
  // Notification preferences
  notificationPreferences: z.object({
    projectUpdates: z.object({
      email: z.boolean().default(true),
      text: z.boolean().default(false),
      phone: z.boolean().default(false)
    }),
    systemPerformance: z.object({
      email: z.boolean().default(true),
      text: z.boolean().default(false),
      frequency: z.enum(['daily', 'weekly', 'monthly', 'alerts_only']).default('monthly')
    }),
    maintenance: z.object({
      email: z.boolean().default(true),
      text: z.boolean().default(true),
      phone: z.boolean().default(false)
    }),
    marketing: z.object({
      email: z.boolean().default(false),
      text: z.boolean().default(false),
      mail: z.boolean().default(false),
      phone: z.boolean().default(false)
    })
  }),
  
  // Special considerations
  specialConsiderations: z.object({
    accessibility: z.object({
      hearingImpaired: z.boolean().default(false),
      visionImpaired: z.boolean().default(false),
      mobilityImpaired: z.boolean().default(false),
      preferredCommunicationFormat: z.enum(['standard', 'large_print', 'audio', 'digital']).optional()
    }),
    security: z.object({
      gatedCommunity: z.boolean().default(false),
      specialAccessInstructions: z.string().max(200).optional(),
      emergencyContact: z.string().max(100).optional()
    }),
    scheduling: z.object({
      workFromHome: z.boolean().default(false),
      shiftWork: z.boolean().default(false),
      pets: z.boolean().default(false),
      specialSchedulingNeeds: z.string().max(200).optional()
    })
  })
});

// Export type definitions
export type EnergyUsagePatterns = z.infer<typeof energyUsagePatternsSchema>;
export type PropertyInformation = z.infer<typeof propertyInformationSchema>;
export type UtilityInformation = z.infer<typeof utilityInformationSchema>;
export type CreditFinancing = z.infer<typeof creditFinancingSchema>;
export type GeographicSolarData = z.infer<typeof geographicSolarDataSchema>;
export type ContactCommunication = z.infer<typeof contactCommunicationSchema>;