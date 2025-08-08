/**
 * Solar Real-Time Data Validation Layer
 * 
 * Comprehensive validation for live system monitoring, sensor data accuracy,
 * data transmission integrity, alert thresholds, and anomaly detection.
 * 
 * Based on:
 * - IEC 61724 (Photovoltaic system performance monitoring)
 * - IEEE 1547 (Standard for Interconnecting Distributed Resources)
 * - ModBus and SunSpec communication standards
 * - Solar monitoring industry best practices
 */

import { z } from 'zod';

// =====================================================
// REAL-TIME SENSOR DATA VALIDATION
// =====================================================

// Sensor data quality standards
export const SENSOR_DATA_STANDARDS = {
  // Measurement accuracy requirements
  accuracy: {
    irradiance: 3.0, // % uncertainty
    temperature: 1.0, // °C uncertainty
    voltage: 0.5, // % uncertainty
    current: 1.0, // % uncertainty
    power: 2.0, // % uncertainty
    energy: 1.5 // % uncertainty
  },
  // Update frequency requirements
  updateFrequency: {
    power: 60, // seconds - power measurements
    environmental: 300, // seconds - weather data
    status: 60, // seconds - system status
    alarms: 5 // seconds - alarm conditions
  },
  // Data validation limits
  limits: {
    maxIrradianceJump: 200, // W/m² per minute
    maxTemperatureJump: 5, // °C per minute
    maxPowerJump: 20, // % per minute
    maxMissedReadings: 3, // consecutive missed readings
    maxClockSkew: 30 // seconds time synchronization
  }
} as const;

// Live sensor measurements validation
export const sensorMeasurementSchema = z.object({
  // Measurement metadata
  measurement: z.object({
    sensorId: z.string().min(1).max(50),
    timestamp: z.date(),
    measurementType: z.enum(['instantaneous', 'average', 'cumulative']),
    samplingPeriod: z.number().min(1).max(3600), // seconds
    sequenceNumber: z.number().int().min(0).max(4294967295) // 32-bit sequence
  }),
  
  // Power generation data
  powerGeneration: z.object({
    // DC measurements
    dcPower: z.object({
      total: z.number().min(0).max(2000000), // W
      strings: z.array(z.object({
        stringId: z.string().max(20),
        power: z.number().min(0).max(50000), // W
        voltage: z.number().min(0).max(1500), // V
        current: z.number().min(0).max(50) // A
      })).max(50).optional(),
      mpptChannels: z.array(z.object({
        channelId: z.string().max(20),
        power: z.number().min(0).max(100000), // W
        voltage: z.number().min(0).max(1000), // V
        current: z.number().min(0).max(100) // A
      })).max(20).optional()
    }),
    
    // AC measurements
    acPower: z.object({
      total: z.number().min(0).max(2000000), // W
      phases: z.array(z.object({
        phase: z.enum(['L1', 'L2', 'L3']),
        power: z.number().min(0).max(1000000), // W
        voltage: z.number().min(0).max(600), // V
        current: z.number().min(0).max(5000), // A
        frequency: z.number().min(45).max(65), // Hz
        powerFactor: z.number().min(-1).max(1)
      })).min(1).max(3),
      thd: z.object({
        voltage: z.number().min(0).max(10), // % Total Harmonic Distortion
        current: z.number().min(0).max(10) // % Total Harmonic Distortion
      }).optional()
    }),
    
    // Inverter efficiency
    inverterEfficiency: z.number().min(0).max(100) // %
  }),
  
  // Environmental measurements
  environmental: z.object({
    irradiance: z.object({
      planeOfArray: z.number().min(0).max(1500), // W/m²
      globalHorizontal: z.number().min(0).max(1500), // W/m²
      directNormal: z.number().min(0).max(1200).optional(), // W/m²
      diffuseHorizontal: z.number().min(0).max(500).optional(), // W/m²
      backOfModule: z.number().min(0).max(300).optional() // W/m² (for bifacial)
    }),
    
    temperature: z.object({
      ambient: z.number().min(-50).max(60), // °C
      moduleBack: z.number().min(-40).max(90), // °C
      inverterInternal: z.number().min(-20).max(80).optional(), // °C
      combinerBox: z.number().min(-30).max(70).optional() // °C
    }),
    
    weatherConditions: z.object({
      windSpeed: z.number().min(0).max(50), // m/s
      windDirection: z.number().min(0).max(360).optional(), // degrees
      humidity: z.number().min(0).max(100), // %
      pressure: z.number().min(800).max(1100).optional(), // hPa
      precipitation: z.number().min(0).max(100).optional() // mm/hour
    }).optional()
  }),
  
  // System status indicators
  systemStatus: z.object({
    operationalState: z.enum(['running', 'standby', 'fault', 'maintenance', 'offline']),
    gridConnection: z.enum(['connected', 'disconnected', 'islanding']),
    inverterStatus: z.array(z.object({
      inverterId: z.string().max(30),
      status: z.enum(['operating', 'standby', 'fault', 'maintenance']),
      faultCodes: z.array(z.string()).default([]),
      temperature: z.number().min(-20).max(80).optional() // °C
    })).min(1).max(50),
    
    communicationStatus: z.object({
      dataLoggerOnline: z.boolean(),
      internetConnection: z.boolean(),
      lastDataUpload: z.date(),
      signalStrength: z.number().min(0).max(100).optional() // % for cellular
    })
  })
})
.refine((sensor) => {
  // Validate AC power is less than or equal to DC power
  return sensor.powerGeneration.acPower.total <= sensor.powerGeneration.dcPower.total;
}, {
  message: 'AC power cannot exceed DC power input'
})
.refine((sensor) => {
  // Validate performance ratio is within reasonable bounds
  if (sensor.environmental.irradiance.planeOfArray > 100) {
    const performanceRatio = sensor.powerGeneration.acPower.total / 
      (sensor.environmental.irradiance.planeOfArray * 1000); // Assuming 1000W system per kW
    return performanceRatio <= 1.2; // Maximum 120% performance ratio
  }
  return true;
}, {
  message: 'Performance ratio indicates potential sensor error or system over-performance'
})
.refine((sensor) => {
  // Validate module temperature is reasonable given ambient conditions
  const tempDifference = sensor.environmental.temperature.moduleBack - sensor.environmental.temperature.ambient;
  return tempDifference >= -5 && tempDifference <= 40; // Module can be -5°C to +40°C above ambient
}, {
  message: 'Module temperature differential from ambient is outside reasonable range'
});

// =====================================================
// DATA TRANSMISSION VALIDATION
// =====================================================

// Communication protocol validation
export const dataTransmissionSchema = z.object({
  // Transmission metadata
  transmission: z.object({
    protocolType: z.enum(['modbus_tcp', 'modbus_rtu', 'sunspec', 'http_rest', 'mqtt', 'websocket']),
    transmissionId: z.string().min(1).max(100),
    sourceDevice: z.string().min(1).max(50),
    destinationEndpoint: z.string().min(1).max(200),
    transmissionTime: z.date(),
    receiveTime: z.date()
  }),
  
  // Data integrity
  dataIntegrity: z.object({
    checksumType: z.enum(['CRC16', 'CRC32', 'MD5', 'SHA256', 'none']),
    checksumValue: z.string().max(100).optional(),
    dataSize: z.number().int().min(1).max(10000000), // bytes
    compressionUsed: z.boolean().default(false),
    encryptionUsed: z.boolean().default(false)
  }),
  
  // Transmission quality
  transmissionQuality: z.object({
    signalStrength: z.number().min(0).max(100).optional(), // % for wireless
    latency: z.number().min(0).max(30000), // ms
    packetLoss: z.number().min(0).max(100), // %
    retransmissionCount: z.number().int().min(0).max(10),
    errorRate: z.number().min(0).max(100) // % transmission errors
  }),
  
  // Data payload validation
  payload: z.object({
    dataPoints: z.number().int().min(1).max(10000),
    timeSeriesData: z.array(z.object({
      timestamp: z.date(),
      parameterId: z.string().max(50),
      value: z.union([z.number(), z.string(), z.boolean()]),
      unit: z.string().max(20).optional(),
      quality: z.enum(['good', 'uncertain', 'bad']).default('good')
    })).min(1).max(10000),
    
    // Batch transmission info
    batchInfo: z.object({
      batchSize: z.number().int().min(1).max(1000),
      batchSequence: z.number().int().min(0).max(999999),
      isLastBatch: z.boolean().default(true),
      totalBatches: z.number().int().min(1).max(1000)
    }).optional()
  }),
  
  // Network information
  networkInfo: z.object({
    connectionType: z.enum(['ethernet', 'wifi', 'cellular_3g', 'cellular_4g', 'cellular_5g', 'satellite']),
    ipAddress: z.string().ip().optional(),
    port: z.number().int().min(1).max(65535).optional(),
    networkLatency: z.number().min(0).max(5000), // ms
    bandwidth: z.number().min(1).max(1000000).optional() // kbps
  })
})
.refine((transmission) => {
  // Validate transmission time is before receive time
  return transmission.transmission.transmissionTime <= transmission.transmission.receiveTime;
}, {
  message: 'Transmission time must be before or equal to receive time'
})
.refine((transmission) => {
  // Validate latency calculation
  const calculatedLatency = transmission.transmission.receiveTime.getTime() - 
    transmission.transmission.transmissionTime.getTime();
  return Math.abs(calculatedLatency - transmission.transmissionQuality.latency) <= 1000;
}, {
  message: 'Latency calculation does not match transmission timestamps'
});

// =====================================================
// ALERT THRESHOLD VALIDATION
// =====================================================

// Alert configuration and threshold validation
export const alertThresholdSchema = z.object({
  // Alert configuration
  alertConfig: z.object({
    alertId: z.string().min(1).max(50),
    alertName: z.string().min(1).max(100),
    alertType: z.enum(['performance', 'fault', 'maintenance', 'security', 'communication']),
    priority: z.enum(['critical', 'high', 'medium', 'low', 'info']),
    enabled: z.boolean().default(true)
  }),
  
  // Threshold definitions
  thresholds: z.object({
    // Performance thresholds
    performance: z.object({
      minDailyProduction: z.number().min(0).max(100000).optional(), // kWh
      minPerformanceRatio: z.number().min(0.1).max(1.0).optional(),
      maxStringImbalance: z.number().min(1).max(50).optional(), // %
      minSystemEfficiency: z.number().min(10).max(25).optional() // %
    }).optional(),
    
    // Environmental thresholds
    environmental: z.object({
      maxModuleTemperature: z.number().min(60).max(100).optional(), // °C
      minIrradianceForProduction: z.number().min(50).max(200).optional(), // W/m²
      maxWindSpeed: z.number().min(10).max(50).optional(), // m/s
      maxHumidity: z.number().min(80).max(100).optional() // %
    }).optional(),
    
    // Electrical thresholds
    electrical: z.object({
      maxVoltageDeviation: z.number().min(2).max(20).optional(), // %
      maxCurrentImbalance: z.number().min(5).max(50).optional(), // %
      minPowerFactor: z.number().min(0.8).max(1.0).optional(),
      maxTHD: z.number().min(3).max(10).optional() // %
    }).optional(),
    
    // Communication thresholds
    communication: z.object({
      maxDataLatency: z.number().min(300).max(3600).optional(), // seconds
      minSignalStrength: z.number().min(10).max(80).optional(), // %
      maxPacketLoss: z.number().min(1).max(20).optional(), // %
      maxOfflineTime: z.number().min(300).max(86400).optional() // seconds
    }).optional()
  }),
  
  // Alert conditions
  alertConditions: z.object({
    triggerCondition: z.enum(['threshold_exceeded', 'threshold_below', 'rate_change', 'pattern_deviation']),
    evaluationPeriod: z.number().min(60).max(86400), // seconds
    consecutiveReadings: z.number().int().min(1).max(100), // readings to confirm alert
    hysteresis: z.number().min(0).max(50).optional(), // % hysteresis to prevent flapping
    
    // Advanced conditions
    timeBased: z.object({
      activeHours: z.array(z.number().int().min(0).max(23)).optional(),
      activeDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
      seasonalAdjustment: z.boolean().default(false)
    }).optional()
  }),
  
  // Alert actions
  alertActions: z.object({
    // Notification methods
    notifications: z.object({
      email: z.object({
        enabled: z.boolean().default(false),
        recipients: z.array(z.string().email()).max(20).optional(),
        template: z.string().max(50).optional()
      }),
      sms: z.object({
        enabled: z.boolean().default(false),
        recipients: z.array(z.string().regex(/^\+?[1-9]\d{1,14}$/)).max(10).optional()
      }),
      push: z.object({
        enabled: z.boolean().default(false),
        deviceTokens: z.array(z.string()).max(50).optional()
      }),
      webhook: z.object({
        enabled: z.boolean().default(false),
        url: z.string().url().optional(),
        method: z.enum(['POST', 'PUT']).default('POST').optional()
      })
    }),
    
    // Automated responses
    automatedResponses: z.object({
      shutdownSystem: z.boolean().default(false),
      isolateComponent: z.boolean().default(false),
      adjustOperatingPoint: z.boolean().default(false),
      scheduleInspection: z.boolean().default(false)
    }).optional(),
    
    // Escalation rules
    escalation: z.object({
      escalationEnabled: z.boolean().default(false),
      escalationDelay: z.number().int().min(300).max(86400).optional(), // seconds
      escalationRecipients: z.array(z.string().email()).max(10).optional()
    }).optional()
  })
});

// =====================================================
// ANOMALY DETECTION VALIDATION
// =====================================================

// Anomaly detection and machine learning validation
export const anomalyDetectionSchema = z.object({
  // Detection algorithm configuration
  detectionConfig: z.object({
    algorithmType: z.enum(['statistical', 'ml_isolation_forest', 'ml_autoencoder', 'rule_based', 'hybrid']),
    modelVersion: z.string().max(20),
    lastTrainingDate: z.date(),
    trainingDataPeriod: z.number().int().min(30).max(365), // days of historical data
    confidenceThreshold: z.number().min(0.7).max(0.99) // detection confidence
  }),
  
  // Input data for analysis
  analysisInput: z.object({
    // Time series data
    timeSeriesData: z.array(z.object({
      timestamp: z.date(),
      measurements: z.record(z.string(), z.number()), // key-value pairs of measurements
      weatherConditions: z.object({
        irradiance: z.number().min(0).max(1500),
        temperature: z.number().min(-50).max(60),
        windSpeed: z.number().min(0).max(50).optional()
      }),
      systemState: z.enum(['normal', 'startup', 'shutdown', 'maintenance'])
    })).min(1).max(10000),
    
    // Baseline performance model
    baselineModel: z.object({
      expectedProduction: z.number().min(0).max(100000), // kWh
      expectedEfficiency: z.number().min(10).max(25), // %
      confidenceInterval: z.object({
        lower: z.number().min(0).max(100000),
        upper: z.number().min(0).max(100000)
      }),
      seasonalAdjustment: z.number().min(0.5).max(2.0) // seasonal factor
    }),
    
    // Feature engineering
    features: z.object({
      powerRatios: z.array(z.number().min(0).max(2)).max(100),
      temperatureCoefficients: z.array(z.number().min(-1).max(1)).max(100),
      weatherCorrelations: z.array(z.number().min(-1).max(1)).max(50),
      timeBasedFeatures: z.array(z.number()).max(20) // hour, day, month features
    })
  }),
  
  // Detection results
  detectionResults: z.object({
    // Anomaly scores
    anomalyScores: z.array(z.object({
      timestamp: z.date(),
      overallScore: z.number().min(0).max(1), // 0=normal, 1=highly anomalous
      componentScores: z.object({
        powerGeneration: z.number().min(0).max(1),
        efficiency: z.number().min(0).max(1),
        environmental: z.number().min(0).max(1),
        systemHealth: z.number().min(0).max(1)
      }),
      isAnomaly: z.boolean(),
      confidence: z.number().min(0).max(1)
    })).min(1).max(10000),
    
    // Pattern analysis
    patternAnalysis: z.object({
      detectedPatterns: z.array(z.object({
        patternType: z.enum(['degradation', 'shading', 'soiling', 'inverter_fault', 'wiring_issue', 'weather_impact']),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        affectedComponents: z.array(z.string()).max(20),
        estimatedImpact: z.number().min(0).max(100), // % production impact
        recommendedAction: z.string().max(200)
      })).max(50),
      
      trendAnalysis: z.object({
        overallTrend: z.enum(['improving', 'stable', 'degrading']),
        degradationRate: z.number().min(0).max(10).optional(), // %/year
        seasonalPatterns: z.boolean(),
        cyclicPatterns: z.boolean()
      })
    }),
    
    // Root cause analysis
    rootCauseAnalysis: z.object({
      primaryCauses: z.array(z.object({
        cause: z.string().max(100),
        probability: z.number().min(0).max(1),
        evidence: z.array(z.string()).max(10),
        recommendedInvestigation: z.string().max(200)
      })).max(10),
      
      correlationAnalysis: z.object({
        weatherCorrelation: z.number().min(-1).max(1),
        timeOfDayCorrelation: z.number().min(-1).max(1),
        seasonalCorrelation: z.number().min(-1).max(1),
        systemAgeCorrelation: z.number().min(-1).max(1)
      })
    })
  }),
  
  // Model performance metrics
  modelPerformance: z.object({
    accuracy: z.number().min(0.7).max(1.0),
    precision: z.number().min(0.6).max(1.0),
    recall: z.number().min(0.6).max(1.0),
    f1Score: z.number().min(0.6).max(1.0),
    falsePositiveRate: z.number().min(0).max(0.3),
    falseNegativeRate: z.number().min(0).max(0.3),
    
    // Model drift detection
    modelDrift: z.object({
      detected: z.boolean(),
      driftMagnitude: z.number().min(0).max(1).optional(),
      retrainingRecommended: z.boolean().default(false),
      lastDriftCheck: z.date()
    })
  })
})
.refine((anomaly) => {
  // Validate confidence threshold is appropriate for algorithm
  if (['ml_isolation_forest', 'ml_autoencoder'].includes(anomaly.detectionConfig.algorithmType)) {
    return anomaly.detectionConfig.confidenceThreshold >= 0.8;
  }
  return true;
}, {
  message: 'ML-based anomaly detection requires higher confidence threshold'
})
.refine((anomaly) => {
  // Validate baseline model confidence interval
  const baseline = anomaly.analysisInput.baselineModel;
  return baseline.confidenceInterval.lower <= baseline.expectedProduction && 
         baseline.expectedProduction <= baseline.confidenceInterval.upper;
}, {
  message: 'Expected production must be within confidence interval bounds'
});

// =====================================================
// SYSTEM HEALTH MONITORING
// =====================================================

// System health and diagnostic validation
export const systemHealthSchema = z.object({
  // Health assessment metadata
  healthAssessment: z.object({
    assessmentId: z.string().min(1).max(50),
    systemId: z.string().min(1).max(50),
    assessmentTime: z.date(),
    assessmentType: z.enum(['routine', 'alert_triggered', 'manual', 'scheduled']),
    assessmentDuration: z.number().min(60).max(3600) // seconds
  }),
  
  // Component health status
  componentHealth: z.object({
    // Inverter health
    inverters: z.array(z.object({
      inverterId: z.string().max(30),
      healthScore: z.number().min(0).max(100), // % overall health
      operationalStatus: z.enum(['normal', 'warning', 'fault', 'offline']),
      diagnostics: z.object({
        internalTemperature: z.number().min(-20).max(80), // °C
        fanStatus: z.enum(['normal', 'slow', 'fast', 'fault']).optional(),
        capacitorVoltage: z.number().min(0).max(1000).optional(), // V
        igbtTemperature: z.number().min(-10).max(150).optional() // °C
      }),
      faultHistory: z.array(z.object({
        faultCode: z.string().max(20),
        faultDescription: z.string().max(100),
        faultTime: z.date(),
        cleared: z.boolean(),
        clearTime: z.date().optional()
      })).max(100).default([])
    })).max(50),
    
    // String/module health
    strings: z.array(z.object({
      stringId: z.string().max(30),
      healthScore: z.number().min(0).max(100), // % overall health
      moduleCount: z.number().int().min(1).max(50),
      diagnostics: z.object({
        stringVoltage: z.number().min(0).max(1500), // V
        stringCurrent: z.number().min(0).max(50), // A
        isolationResistance: z.number().min(1).max(1000).optional(), // MΩ
        hotspotDetection: z.boolean().optional()
      }),
      moduleHealth: z.array(z.object({
        moduleId: z.string().max(20),
        status: z.enum(['normal', 'underperforming', 'fault', 'bypass']),
        powerOutput: z.number().min(0).max(1000), // W
        temperature: z.number().min(-30).max(90) // °C
      })).max(50).optional()
    })).max(100),
    
    // Communication system health
    communications: z.object({
      dataLogger: z.object({
        status: z.enum(['online', 'offline', 'intermittent']),
        healthScore: z.number().min(0).max(100),
        memoryUsage: z.number().min(0).max(100), // %
        cpuUsage: z.number().min(0).max(100), // %
        storageUsage: z.number().min(0).max(100) // %
      }),
      networkConnection: z.object({
        connectionType: z.enum(['ethernet', 'wifi', 'cellular', 'satellite']),
        signalStrength: z.number().min(0).max(100), // %
        dataTransmissionRate: z.number().min(0).max(10000), // kbps
        lastSuccessfulTransmission: z.date()
      })
    })
  }),
  
  // Performance metrics
  performanceMetrics: z.object({
    currentPerformance: z.object({
      actualProduction: z.number().min(0).max(100000), // kWh
      expectedProduction: z.number().min(0).max(100000), // kWh
      performanceRatio: z.number().min(0).max(1.2),
      systemEfficiency: z.number().min(10).max(25) // %
    }),
    
    historicalTrends: z.object({
      performanceTrend: z.enum(['improving', 'stable', 'degrading']),
      degradationRate: z.number().min(0).max(5), // %/year
      seasonalVariation: z.number().min(1).max(3), // ratio summer/winter
      weatherNormalizedPerformance: z.number().min(0.6).max(1.1)
    }),
    
    benchmarking: z.object({
      peerSystemComparison: z.enum(['above_average', 'average', 'below_average']),
      industryBenchmark: z.number().min(0.6).max(0.9), // typical PR
      ageAdjustedPerformance: z.number().min(0.5).max(1.1) // age-adjusted PR
    })
  }),
  
  // Predictive maintenance
  predictiveMaintenance: z.object({
    maintenanceRecommendations: z.array(z.object({
      component: z.string().max(50),
      maintenanceType: z.enum(['cleaning', 'inspection', 'replacement', 'calibration', 'firmware_update']),
      priority: z.enum(['immediate', 'high', 'medium', 'low']),
      estimatedCost: z.number().min(0).max(50000), // $
      estimatedTimeToFailure: z.number().min(0).max(365).optional(), // days
      productionImpactIfDeferred: z.number().min(0).max(100) // % impact
    })).max(20).default([]),
    
    failurePredictions: z.array(z.object({
      component: z.string().max(50),
      failureType: z.string().max(100),
      probability: z.number().min(0).max(1),
      timeHorizon: z.number().min(1).max(365), // days
      confidence: z.number().min(0.6).max(1.0)
    })).max(10).default([]),
    
    optimizationOpportunities: z.array(z.object({
      opportunityType: z.enum(['string_rebalancing', 'inverter_tuning', 'cleaning_schedule', 'shading_mitigation']),
      estimatedBenefit: z.number().min(0).max(50), // % production increase
      implementationCost: z.number().min(0).max(25000), // $
      paybackPeriod: z.number().min(0.1).max(10) // years
    })).max(10).default([])
  }),
  
  // Overall system score
  overallSystemScore: z.object({
    healthScore: z.number().min(0).max(100), // % overall system health
    riskScore: z.number().min(0).max(100), // % risk of failure
    performanceScore: z.number().min(0).max(100), // % performance vs expected
    reliabilityScore: z.number().min(0).max(100), // % uptime and consistency
    
    scoreBreakdown: z.object({
      equipmentHealth: z.number().min(0).max(100), // % weight
      performanceHealth: z.number().min(0).max(100), // % weight
      communicationHealth: z.number().min(0).max(100), // % weight
      environmentalHealth: z.number().min(0).max(100) // % weight
    }),
    
    scoreHistory: z.array(z.object({
      date: z.date(),
      healthScore: z.number().min(0).max(100)
    })).max(365).default([])
  })
})
.refine((health) => {
  // Validate health scores are consistent with component status
  const inverterHealthAvg = health.componentHealth.inverters.reduce((sum, inv) => 
    sum + inv.healthScore, 0) / health.componentHealth.inverters.length;
  
  return Math.abs(inverterHealthAvg - health.overallSystemScore.scoreBreakdown.equipmentHealth) <= 20;
}, {
  message: 'Overall equipment health score should align with component health scores'
});

// Export type definitions
export type SensorMeasurement = z.infer<typeof sensorMeasurementSchema>;
export type DataTransmission = z.infer<typeof dataTransmissionSchema>;
export type AlertThreshold = z.infer<typeof alertThresholdSchema>;
export type AnomalyDetection = z.infer<typeof anomalyDetectionSchema>;
export type SystemHealth = z.infer<typeof systemHealthSchema>;