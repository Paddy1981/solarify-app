/**
 * Solar Integration Validation Layer
 * 
 * Comprehensive validation for third-party API integrations, external system data,
 * data synchronization, cross-platform validation, and legacy system migration.
 * 
 * Based on:
 * - RESTful API design principles
 * - OAuth 2.0 and API security standards
 * - Data integration best practices
 * - Solar industry standard APIs (NREL, PVWatts, etc.)
 */

import { z } from 'zod';

// =====================================================
// THIRD-PARTY API VALIDATION
// =====================================================

// API integration standards
export const API_INTEGRATION_STANDARDS = {
  // Response time requirements
  responseTime: {
    synchronous: 5000, // ms - max response time for sync calls
    asynchronous: 60000, // ms - max response time for async calls
    weatherData: 10000, // ms - weather API response time
    utilityData: 15000, // ms - utility API response time
    financialData: 30000 // ms - financial API response time
  },
  // Rate limiting
  rateLimits: {
    weatherAPI: 1000, // calls per hour
    utilityAPI: 500, // calls per hour
    financialAPI: 100, // calls per hour
    mappingAPI: 2000 // calls per hour
  },
  // Data freshness requirements
  dataFreshness: {
    weather: 3600, // seconds - weather data max age
    utility: 86400, // seconds - utility data max age
    financial: 604800, // seconds - financial data max age (1 week)
    solar: 300 // seconds - solar production data max age
  }
} as const;

// Third-party API response validation
export const thirdPartyAPISchema = z.object({
  // API metadata
  apiMetadata: z.object({
    apiProvider: z.enum(['NREL', 'PVGIS', 'NASA', 'NOAA', 'OpenWeather', 'SolarAnywhere', 'utility_api', 'custom']),
    apiName: z.string().min(1).max(100),
    apiVersion: z.string().max(20),
    endpoint: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    requestId: z.string().min(1).max(100)
  }),
  
  // Request information
  requestInfo: z.object({
    timestamp: z.date(),
    parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
    headers: z.record(z.string(), z.string()).optional(),
    authentication: z.object({
      method: z.enum(['api_key', 'oauth2', 'basic_auth', 'bearer_token', 'none']),
      authenticated: z.boolean()
    }),
    rateLimitInfo: z.object({
      requestsRemaining: z.number().int().min(0),
      resetTime: z.date().optional(),
      dailyLimit: z.number().int().min(1).max(100000)
    }).optional()
  }),
  
  // Response validation
  responseInfo: z.object({
    statusCode: z.number().int().min(100).max(599),
    responseTime: z.number().min(0).max(300000), // ms
    responseSize: z.number().int().min(0).max(100000000), // bytes
    headers: z.record(z.string(), z.string()).optional(),
    
    // Success response
    data: z.union([
      z.object({}).passthrough(), // Allow any object for data
      z.array(z.unknown()),
      z.string(),
      z.number(),
      z.null()
    ]).optional(),
    
    // Error response
    error: z.object({
      errorCode: z.string().max(50),
      errorMessage: z.string().max(500),
      errorDetails: z.record(z.string(), z.unknown()).optional(),
      retryable: z.boolean().default(false),
      retryAfter: z.number().int().min(0).max(86400).optional() // seconds
    }).optional()
  }),
  
  // Data quality assessment
  dataQuality: z.object({
    completeness: z.number().min(0).max(100), // % of expected fields present
    accuracy: z.enum(['high', 'medium', 'low', 'unknown']),
    timeliness: z.number().min(0).max(31536000), // seconds since data collection
    consistency: z.boolean(), // data consistent with previous calls
    
    // Validation results
    validationResults: z.array(z.object({
      field: z.string().max(100),
      valid: z.boolean(),
      expectedType: z.string().max(50),
      actualType: z.string().max(50),
      errorMessage: z.string().max(200).optional()
    })).default([])
  }),
  
  // Caching information
  cacheInfo: z.object({
    cached: z.boolean(),
    cacheKey: z.string().max(200).optional(),
    cacheExpiry: z.date().optional(),
    cacheHit: z.boolean().optional(),
    cacheTTL: z.number().int().min(0).max(2592000).optional() // seconds (30 days max)
  }).optional()
})
.refine((api) => {
  // Validate successful responses have data
  if (api.responseInfo.statusCode >= 200 && api.responseInfo.statusCode < 300) {
    return api.responseInfo.data !== undefined;
  }
  return true;
}, {
  message: 'Successful API responses must include data'
})
.refine((api) => {
  // Validate error responses have error information
  if (api.responseInfo.statusCode >= 400) {
    return api.responseInfo.error !== undefined;
  }
  return true;
}, {
  message: 'Error responses must include error information'
});

// =====================================================
// WEATHER API INTEGRATION VALIDATION
// =====================================================

// Weather API specific validation
export const weatherAPIIntegrationSchema = z.object({
  // API call details
  apiCall: thirdPartyAPISchema,
  
  // Weather data validation
  weatherData: z.object({
    // Location verification
    location: z.object({
      requestedLocation: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180)
      }),
      actualLocation: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        elevation: z.number().min(-500).max(9000).optional() // meters
      }),
      locationAccuracy: z.number().min(0).max(50000) // meters
    }),
    
    // Current conditions
    currentConditions: z.object({
      temperature: z.number().min(-50).max(60), // °C
      humidity: z.number().min(0).max(100), // %
      windSpeed: z.number().min(0).max(100), // m/s
      windDirection: z.number().min(0).max(360).optional(), // degrees
      pressure: z.number().min(800).max(1100).optional(), // hPa
      visibility: z.number().min(0).max(50).optional(), // km
      cloudCover: z.number().min(0).max(100).optional(), // %
      precipitationRate: z.number().min(0).max(100).optional() // mm/hr
    }),
    
    // Solar irradiance data
    solarIrradiance: z.object({
      globalHorizontalIrradiance: z.number().min(0).max(1500), // W/m²
      directNormalIrradiance: z.number().min(0).max(1200).optional(), // W/m²
      diffuseHorizontalIrradiance: z.number().min(0).max(500).optional(), // W/m²
      planeOfArrayIrradiance: z.number().min(0).max(1500).optional(), // W/m²
      clearSkyIrradiance: z.number().min(0).max(1367).optional() // W/m²
    }),
    
    // Forecast data (if available)
    forecast: z.array(z.object({
      timestamp: z.date(),
      temperature: z.object({
        min: z.number().min(-50).max(50), // °C
        max: z.number().min(-40).max(60) // °C
      }),
      precipitationProbability: z.number().min(0).max(100), // %
      cloudCover: z.number().min(0).max(100), // %
      irradianceForecast: z.number().min(0).max(1500).optional() // W/m²
    })).max(168).optional(), // Max 7 days of hourly forecast
    
    // Data quality indicators
    dataQualityIndicators: z.object({
      measurementMethod: z.enum(['ground_station', 'satellite', 'model', 'interpolated']),
      spatialResolution: z.number().min(1).max(100), // km
      temporalResolution: z.number().min(60).max(86400), // seconds
      dataAge: z.number().min(0).max(7200), // seconds since measurement
      qualityFlag: z.enum(['excellent', 'good', 'fair', 'poor'])
    })
  })
})
.refine((weather) => {
  // Validate location accuracy
  const requested = weather.weatherData.location.requestedLocation;
  const actual = weather.weatherData.location.actualLocation;
  const distance = Math.sqrt(
    Math.pow(requested.latitude - actual.latitude, 2) + 
    Math.pow(requested.longitude - actual.longitude, 2)
  ) * 111320; // Convert to meters (approximate)
  
  return distance <= weather.weatherData.location.locationAccuracy;
}, {
  message: 'Actual location must be within specified accuracy of requested location'
})
.refine((weather) => {
  // Validate GHI vs clear sky relationship
  const ghi = weather.weatherData.solarIrradiance.globalHorizontalIrradiance;
  const clearSky = weather.weatherData.solarIrradiance.clearSkyIrradiance;
  
  if (clearSky) {
    return ghi <= clearSky * 1.2; // Allow 20% over clear sky (measurement uncertainty)
  }
  return true;
}, {
  message: 'Global horizontal irradiance cannot significantly exceed clear sky irradiance'
});

// =====================================================
// UTILITY API INTEGRATION VALIDATION
// =====================================================

// Utility API integration validation
export const utilityAPIIntegrationSchema = z.object({
  // API call details
  apiCall: thirdPartyAPISchema,
  
  // Utility account information
  utilityAccount: z.object({
    // Account identification
    accountInfo: z.object({
      accountNumber: z.string().min(5).max(50),
      utilityProvider: z.string().min(1).max(100),
      serviceAddress: z.object({
        street: z.string().min(1).max(100),
        city: z.string().min(1).max(50),
        state: z.string().length(2),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/)
      }),
      accountStatus: z.enum(['active', 'inactive', 'suspended'])
    }),
    
    // Usage data
    usageData: z.object({
      billingPeriods: z.array(z.object({
        startDate: z.date(),
        endDate: z.date(),
        usageKWh: z.number().min(0).max(50000),
        cost: z.number().min(0).max(10000), // $
        billingDays: z.number().int().min(28).max(31),
        demandKW: z.number().min(0).max(10000).optional()
      })).min(1).max(36), // 1-3 years of data
      
      // Interval data (if available)
      intervalData: z.array(z.object({
        timestamp: z.date(),
        usage: z.number().min(0).max(100), // kWh for interval
        demand: z.number().min(0).max(500).optional() // kW
      })).max(26304).optional(), // Up to 15-minute intervals for 3 months
      
      usageSummary: z.object({
        totalUsage12Months: z.number().min(0).max(600000), // kWh
        averageMonthlyUsage: z.number().min(0).max(50000), // kWh
        peakDemand12Months: z.number().min(0).max(10000).optional() // kW
      })
    }),
    
    // Rate schedule information
    rateSchedule: z.object({
      scheduleName: z.string().min(1).max(100),
      scheduleType: z.enum(['residential', 'commercial', 'industrial']),
      rateStructure: z.object({
        energyCharges: z.object({
          structure: z.enum(['flat', 'tiered', 'time_of_use']),
          rates: z.array(z.object({
            tier: z.number().int().min(1).max(10).optional(),
            timeOfUse: z.string().max(50).optional(),
            rate: z.number().min(0.01).max(1.0), // $/kWh
            threshold: z.number().min(0).max(10000).optional() // kWh
          })).min(1).max(20)
        }),
        demandCharges: z.object({
          applicable: z.boolean(),
          rate: z.number().min(0).max(100).optional() // $/kW
        }),
        fixedCharges: z.number().min(0).max(200) // $/month
      })
    }),
    
    // Net metering information
    netMeteringInfo: z.object({
      enrolled: z.boolean(),
      programName: z.string().max(100).optional(),
      compensation: z.enum(['full_retail', 'avoided_cost', 'feed_in_tariff']).optional(),
      rollover: z.enum(['monthly', 'annual', 'cash_out']).optional(),
      systemSize: z.number().min(0).max(2000).optional() // kW
    }).optional()
  }),
  
  // Data verification
  dataVerification: z.object({
    // Cross-reference with customer provided data
    customerDataMatch: z.object({
      accountNumberMatch: z.boolean(),
      addressMatch: z.boolean(),
      usagePattern: z.enum(['matches', 'similar', 'different']),
      discrepancyReasons: z.array(z.string()).default([])
    }),
    
    // Data completeness check
    completenessCheck: z.object({
      monthsOfData: z.number().int().min(0).max(36),
      missingMonths: z.array(z.string()).default([]),
      intervalDataAvailable: z.boolean(),
      demandDataAvailable: z.boolean()
    }),
    
    // Data quality assessment
    qualityAssessment: z.object({
      dataConsistency: z.enum(['consistent', 'minor_gaps', 'major_gaps']),
      estimatedData: z.number().min(0).max(100), // % of data that is estimated
      qualityScore: z.number().min(0).max(100) // overall quality score
    })
  })
});

// =====================================================
// FINANCIAL API INTEGRATION VALIDATION
// =====================================================

// Financial services API validation
export const financialAPIIntegrationSchema = z.object({
  // API call details
  apiCall: thirdPartyAPISchema,
  
  // Financial data type
  financialDataType: z.enum(['credit_check', 'income_verification', 'asset_verification', 'loan_qualification', 'incentive_lookup']),
  
  // Credit information (if applicable)
  creditInformation: z.object({
    // Credit report data
    creditReport: z.object({
      creditScore: z.number().int().min(300).max(850),
      scoreModel: z.enum(['FICO', 'VantageScore']),
      reportDate: z.date(),
      bureau: z.enum(['Equifax', 'Experian', 'TransUnion']),
      
      creditAccounts: z.array(z.object({
        accountType: z.enum(['credit_card', 'auto_loan', 'mortgage', 'student_loan', 'personal_loan']),
        currentBalance: z.number().min(0).max(1000000),
        creditLimit: z.number().min(0).max(1000000).optional(),
        paymentHistory: z.enum(['current', 'late_30', 'late_60', 'late_90', 'charge_off']),
        accountAge: z.number().min(0).max(600) // months
      })).max(100),
      
      creditInquiries: z.array(z.object({
        inquiryDate: z.date(),
        inquiryType: z.enum(['hard', 'soft']),
        creditor: z.string().max(100)
      })).max(50),
      
      publicRecords: z.array(z.object({
        recordType: z.enum(['bankruptcy', 'tax_lien', 'judgment', 'foreclosure']),
        filingDate: z.date(),
        amount: z.number().min(0).max(10000000).optional()
      })).max(20).default([])
    }).optional(),
    
    // Identity verification
    identityVerification: z.object({
      verified: z.boolean(),
      verificationMethod: z.enum(['ssn', 'drivers_license', 'passport', 'utility_bill']),
      confidenceScore: z.number().min(0).max(100),
      addressVerified: z.boolean(),
      phoneVerified: z.boolean()
    }).optional()
  }).optional(),
  
  // Income verification (if applicable)
  incomeVerification: z.object({
    verificationMethod: z.enum(['pay_stub', 'tax_return', 'bank_statements', 'employment_verification']),
    verifiedIncome: z.object({
      grossAnnualIncome: z.number().min(0).max(10000000),
      employmentStatus: z.enum(['employed', 'self_employed', 'retired', 'unemployed']),
      employmentLength: z.number().min(0).max(50), // years
      incomeStability: z.enum(['stable', 'increasing', 'decreasing', 'variable'])
    }),
    verificationDate: z.date(),
    confidence: z.enum(['high', 'medium', 'low'])
  }).optional(),
  
  // Asset verification (if applicable)
  assetVerification: z.object({
    verificationMethod: z.enum(['bank_statements', 'investment_statements', 'property_records']),
    verifiedAssets: z.object({
      liquidAssets: z.number().min(0).max(50000000),
      realEstate: z.number().min(0).max(100000000),
      investments: z.number().min(0).max(50000000),
      totalAssets: z.number().min(0).max(200000000)
    }),
    verificationDate: z.date(),
    confidence: z.enum(['high', 'medium', 'low'])
  }).optional(),
  
  // Loan qualification results
  loanQualification: z.object({
    qualified: z.boolean(),
    qualificationDetails: z.object({
      maxLoanAmount: z.number().min(0).max(2000000),
      interestRateRange: z.object({
        min: z.number().min(1).max(30),
        max: z.number().min(1).max(30)
      }),
      termOptions: z.array(z.number().int().min(5).max(30)), // years
      debtToIncomeRatio: z.number().min(0).max(100),
      
      conditions: z.array(z.object({
        condition: z.string().max(200),
        required: z.boolean()
      })).default([])
    }).optional(),
    
    reasons: z.array(z.string()).max(10).default([]) // Reasons for qualification/disqualification
  }).optional(),
  
  // Incentive information
  incentiveInformation: z.object({
    availableIncentives: z.array(z.object({
      incentiveType: z.enum(['federal_tax_credit', 'state_tax_credit', 'rebate', 'performance_payment', 'grant']),
      programName: z.string().max(100),
      amount: z.number().min(0).max(1000000),
      eligibilityMet: z.boolean(),
      requirementsDescription: z.string().max(500),
      applicationDeadline: z.date().optional()
    })).max(20),
    
    totalIncentiveValue: z.number().min(0).max(2000000),
    incentiveTimeline: z.string().max(200)
  }).optional(),
  
  // Data privacy and security
  privacyCompliance: z.object({
    dataEncrypted: z.boolean(),
    piiHandling: z.enum(['compliant', 'non_compliant', 'unknown']),
    consentObtained: z.boolean(),
    retentionPeriod: z.number().int().min(0).max(2555), // days (7 years max)
    thirdPartySharing: z.boolean()
  })
});

// =====================================================
// DATA SYNCHRONIZATION VALIDATION
// =====================================================

// Cross-system data synchronization validation
export const dataSynchronizationSchema = z.object({
  // Synchronization metadata
  syncMetadata: z.object({
    syncId: z.string().min(1).max(100),
    syncType: z.enum(['full_sync', 'incremental_sync', 'real_time_sync', 'batch_sync']),
    sourceSystems: z.array(z.string().min(1).max(100)).min(1).max(10),
    targetSystems: z.array(z.string().min(1).max(100)).min(1).max(10),
    syncTimestamp: z.date(),
    syncDuration: z.number().min(0).max(86400000) // ms
  }),
  
  // Data mapping and transformation
  dataMapping: z.object({
    // Field mappings between systems
    fieldMappings: z.array(z.object({
      sourceField: z.string().min(1).max(100),
      targetField: z.string().min(1).max(100),
      transformation: z.enum(['direct_copy', 'format_conversion', 'calculation', 'lookup', 'aggregation']).optional(),
      transformationRule: z.string().max(500).optional()
    })).min(1).max(500),
    
    // Data type conversions
    typeConversions: z.array(z.object({
      field: z.string().min(1).max(100),
      sourceType: z.string().max(50),
      targetType: z.string().max(50),
      conversionRule: z.string().max(200)
    })).default([]),
    
    // Validation rules
    validationRules: z.array(z.object({
      ruleId: z.string().max(50),
      ruleDescription: z.string().max(200),
      validationLogic: z.string().max(1000),
      severity: z.enum(['error', 'warning', 'info'])
    })).default([])
  }),
  
  // Synchronization results
  syncResults: z.object({
    // Overall status
    overallStatus: z.enum(['success', 'partial_success', 'failure']),
    recordsProcessed: z.number().int().min(0).max(10000000),
    recordsSuccessful: z.number().int().min(0).max(10000000),
    recordsFailed: z.number().int().min(0).max(10000000),
    
    // System-specific results
    systemResults: z.array(z.object({
      systemName: z.string().max(100),
      status: z.enum(['success', 'partial_success', 'failure']),
      recordsProcessed: z.number().int().min(0).max(10000000),
      errors: z.array(z.object({
        errorCode: z.string().max(50),
        errorMessage: z.string().max(500),
        recordId: z.string().max(100).optional(),
        severity: z.enum(['error', 'warning'])
      })).default([])
    })).min(1).max(10),
    
    // Data quality assessment
    dataQualityResults: z.object({
      duplicateRecords: z.number().int().min(0).max(1000000),
      incompleteRecords: z.number().int().min(0).max(1000000),
      dataInconsistencies: z.number().int().min(0).max(1000000),
      qualityScore: z.number().min(0).max(100) // % overall quality
    }),
    
    // Performance metrics
    performanceMetrics: z.object({
      throughputRecordsPerSecond: z.number().min(0).max(100000),
      averageResponseTime: z.number().min(0).max(300000), // ms
      peakMemoryUsage: z.number().min(0).max(100), // %
      networkUtilization: z.number().min(0).max(100) // %
    })
  }),
  
  // Conflict resolution
  conflictResolution: z.object({
    conflictsDetected: z.array(z.object({
      conflictId: z.string().max(100),
      conflictType: z.enum(['data_mismatch', 'timestamp_conflict', 'schema_mismatch', 'business_rule_violation']),
      affectedFields: z.array(z.string()).min(1).max(50),
      sourceValues: z.record(z.string(), z.unknown()),
      resolutionStrategy: z.enum(['source_priority', 'target_priority', 'latest_timestamp', 'manual_review', 'merge_values']),
      resolved: z.boolean(),
      resolutionDetails: z.string().max(500).optional()
    })).default([]),
    
    resolutionRules: z.array(z.object({
      ruleId: z.string().max(50),
      condition: z.string().max(500),
      action: z.string().max(200),
      priority: z.number().int().min(1).max(10)
    })).default([])
  })
})
.refine((sync) => {
  // Validate record counts are consistent
  return sync.syncResults.recordsSuccessful + sync.syncResults.recordsFailed === sync.syncResults.recordsProcessed;
}, {
  message: 'Sum of successful and failed records must equal total processed records'
})
.refine((sync) => {
  // Validate system results add up to overall results
  const systemTotal = sync.syncResults.systemResults.reduce((sum, system) => sum + system.recordsProcessed, 0);
  // Allow for some discrepancy due to deduplication
  return Math.abs(systemTotal - sync.syncResults.recordsProcessed) <= sync.syncResults.recordsProcessed * 0.1;
}, {
  message: 'System record counts should approximately match overall totals'
});

// =====================================================
// LEGACY SYSTEM MIGRATION VALIDATION
// =====================================================

// Legacy system data migration validation
export const legacyMigrationSchema = z.object({
  // Migration metadata
  migrationInfo: z.object({
    migrationId: z.string().min(1).max(100),
    migrationName: z.string().min(1).max(100),
    sourceSystemName: z.string().min(1).max(100),
    sourceSystemVersion: z.string().max(50),
    targetSystemName: z.string().min(1).max(100),
    targetSystemVersion: z.string().max(50),
    migrationStartTime: z.date(),
    migrationEndTime: z.date().optional()
  }),
  
  // Data inventory
  dataInventory: z.object({
    // Source system data
    sourceData: z.object({
      totalRecords: z.number().int().min(0).max(100000000),
      dataTypes: z.array(z.object({
        typeName: z.string().max(100),
        recordCount: z.number().int().min(0).max(10000000),
        sampleData: z.record(z.string(), z.unknown()).optional()
      })).min(1).max(100),
      
      dataQualityAssessment: z.object({
        completeRecords: z.number().int().min(0).max(100000000),
        incompleteRecords: z.number().int().min(0).max(100000000),
        duplicateRecords: z.number().int().min(0).max(10000000),
        corruptedRecords: z.number().int().min(0).max(1000000)
      }),
      
      dataVintage: z.object({
        oldestRecord: z.date(),
        newestRecord: z.date(),
        averageAge: z.number().min(0).max(36500) // days
      })
    }),
    
    // Migration scope
    migrationScope: z.object({
      recordsToMigrate: z.number().int().min(0).max(100000000),
      dataTypesToMigrate: z.array(z.string()).min(1).max(100),
      migrationStrategy: z.enum(['big_bang', 'phased', 'parallel_run', 'cutover']),
      backupStrategy: z.enum(['full_backup', 'incremental_backup', 'snapshot', 'none'])
    })
  }),
  
  // Schema mapping and transformation
  schemaMapping: z.object({
    // Field mappings
    tableMappings: z.array(z.object({
      sourceTable: z.string().max(100),
      targetTable: z.string().max(100),
      mappingType: z.enum(['direct', 'split', 'merge', 'transform']),
      
      fieldMappings: z.array(z.object({
        sourceField: z.string().max(100),
        targetField: z.string().max(100),
        dataType: z.object({
          sourceType: z.string().max(50),
          targetType: z.string().max(50),
          conversionRequired: z.boolean()
        }),
        transformationLogic: z.string().max(1000).optional(),
        defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional()
      })).min(1).max(500)
    })).min(1).max(100),
    
    // Business rule mappings
    businessRules: z.array(z.object({
      ruleId: z.string().max(50),
      sourceRule: z.string().max(1000),
      targetRule: z.string().max(1000),
      migrationApproach: z.enum(['direct_port', 'rewrite', 'deprecate', 'enhance'])
    })).default([])
  }),
  
  // Migration execution results
  migrationResults: z.object({
    // Overall execution status
    executionStatus: z.enum(['in_progress', 'completed', 'failed', 'cancelled']),
    completionPercentage: z.number().min(0).max(100),
    
    // Data migration results
    dataMigrationResults: z.array(z.object({
      dataType: z.string().max(100),
      sourceRecords: z.number().int().min(0).max(10000000),
      migratedRecords: z.number().int().min(0).max(10000000),
      failedRecords: z.number().int().min(0).max(10000000),
      transformationErrors: z.array(z.object({
        errorType: z.string().max(100),
        errorMessage: z.string().max(500),
        recordId: z.string().max(100).optional(),
        affectedCount: z.number().int().min(1).max(1000000)
      })).default([])
    })).min(1).max(100),
    
    // Validation results
    validationResults: z.object({
      dataIntegrityChecks: z.array(z.object({
        checkName: z.string().max(100),
        checkType: z.enum(['count_validation', 'checksum_validation', 'business_rule_validation', 'referential_integrity']),
        status: z.enum(['passed', 'failed', 'warning']),
        details: z.string().max(500).optional()
      })).default([]),
      
      performanceValidation: z.object({
        sourceSystemPerformance: z.object({
          averageQueryTime: z.number().min(0).max(300000), // ms
          peakMemoryUsage: z.number().min(0).max(100) // %
        }),
        targetSystemPerformance: z.object({
          averageQueryTime: z.number().min(0).max(300000), // ms
          peakMemoryUsage: z.number().min(0).max(100) // %
        }),
        performanceImprovement: z.number().min(-100).max(1000) // % improvement
      }),
      
      functionalValidation: z.object({
        testCasesPassed: z.number().int().min(0).max(10000),
        testCasesFailed: z.number().int().min(0).max(1000),
        criticalFunctionsWorking: z.boolean(),
        userAcceptanceTesting: z.enum(['not_started', 'in_progress', 'passed', 'failed'])
      })
    }),
    
    // Rollback capability
    rollbackInfo: z.object({
      rollbackPossible: z.boolean(),
      rollbackStrategy: z.enum(['restore_backup', 'reverse_migration', 'manual_rollback', 'not_possible']).optional(),
      rollbackTimeEstimate: z.number().min(0).max(86400).optional(), // seconds
      dataLossPotential: z.enum(['none', 'minimal', 'significant', 'complete']).optional()
    })
  })
})
.refine((migration) => {
  // Validate migration end time is after start time
  if (migration.migrationInfo.migrationEndTime) {
    return migration.migrationInfo.migrationEndTime >= migration.migrationInfo.migrationStartTime;
  }
  return true;
}, {
  message: 'Migration end time must be after start time'
})
.refine((migration) => {
  // Validate completion percentage matches execution status
  if (migration.migrationResults.executionStatus === 'completed') {
    return migration.migrationResults.completionPercentage === 100;
  }
  return true;
}, {
  message: 'Completed migrations must have 100% completion percentage'
});

// Export type definitions
export type ThirdPartyAPI = z.infer<typeof thirdPartyAPISchema>;
export type WeatherAPIIntegration = z.infer<typeof weatherAPIIntegrationSchema>;
export type UtilityAPIIntegration = z.infer<typeof utilityAPIIntegrationSchema>;
export type FinancialAPIIntegration = z.infer<typeof financialAPIIntegrationSchema>;
export type DataSynchronization = z.infer<typeof dataSynchronizationSchema>;
export type LegacyMigration = z.infer<typeof legacyMigrationSchema>;