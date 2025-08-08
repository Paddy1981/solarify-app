/**
 * Solar Energy Production Validation Layer
 * 
 * Comprehensive validation for solar irradiance data, energy production measurements,
 * performance ratios, weather correlation, and production forecasting.
 * 
 * Based on:
 * - IEC 61724 (Photovoltaic system performance)
 * - ASTM E2848 (Standard test method for reporting performance)
 * - NREL Performance Assessment Methodology
 * - IEC 61853 (Performance testing and energy rating)
 * - IEEE 1526 (Recommended practice for testing)
 */

import { z } from 'zod';

// =====================================================
// IRRADIANCE DATA VALIDATION
// =====================================================

// Solar irradiance measurement standards
export const IRRADIANCE_STANDARDS = {
  // Measurement accuracy requirements (IEC 61724)
  accuracy: {
    globalHorizontal: 3.0, // % uncertainty
    planeOfArray: 3.0, // % uncertainty
    directNormal: 2.0, // % uncertainty
    diffuseHorizontal: 5.0 // % uncertainty
  },
  // Physical limits
  limits: {
    extraterrestrial: 1367, // W/m² solar constant
    clearSkyMax: 1200, // W/m² typical clear sky maximum
    globalMax: 1500, // W/m² absolute maximum observed
    diffuseMax: 500 // W/m² maximum diffuse
  },
  // Data quality flags
  qualityFlags: {
    excellent: { uncertainty: 1.0, completeness: 99 },
    good: { uncertainty: 3.0, completeness: 95 },
    fair: { uncertainty: 5.0, completeness: 90 },
    poor: { uncertainty: 10.0, completeness: 80 }
  }
} as const;

// TMY (Typical Meteorological Year) data validation
export const tmyDataSchema = z.object({
  // Data source identification
  dataSource: z.object({
    provider: z.enum(['NREL', 'NASA', 'PVGIS', 'Meteonorm', 'SolarGIS']),
    dataset: z.string().max(50),
    version: z.string().max(20),
    processingDate: z.date(),
    spatialResolution: z.number().min(0.1).max(50), // km
    temporalResolution: z.enum(['hourly', 'sub_hourly', 'daily', 'monthly'])
  }),
  
  // Location metadata
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    elevation: z.number().min(-500).max(9000), // meters
    timezone: z.string().max(50),
    climateZone: z.string().max(20).optional()
  }),
  
  // Annual irradiance statistics
  annualStatistics: z.object({
    globalHorizontalIrradiance: z.object({
      annual: z.number().min(365).max(2920), // kWh/m²/year
      monthly: z.array(z.number().min(10).max(300)).length(12), // kWh/m²/month
      dailyAverage: z.number().min(1).max(8) // kWh/m²/day
    }),
    directNormalIrradiance: z.object({
      annual: z.number().min(200).max(3500), // kWh/m²/year
      monthly: z.array(z.number().min(5).max(350)).length(12),
      dailyAverage: z.number().min(0.5).max(10)
    }),
    diffuseHorizontalIrradiance: z.object({
      annual: z.number().min(200).max(1500), // kWh/m²/year
      monthly: z.array(z.number().min(5).max(150)).length(12),
      dailyAverage: z.number().min(0.5).max(4)
    })
  }),
  
  // Data quality assessment
  dataQuality: z.object({
    completeness: z.number().min(80).max(100), // % of data present
    overallQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
    flaggedRecords: z.number().min(0).max(20), // % of flagged data
    gapFilling: z.object({
      method: z.enum(['interpolation', 'satellite', 'model', 'adjacent_station']),
      percentage: z.number().min(0).max(20) // % of data gap-filled
    }),
    uncertainty: z.object({
      ghi: z.number().min(1).max(10), // % uncertainty
      dni: z.number().min(1).max(8),
      dhi: z.number().min(2).max(12)
    })
  }),
  
  // Climate statistics
  climateStatistics: z.object({
    temperature: z.object({
      annualAverage: z.number().min(-20).max(40), // °C
      monthlyAverage: z.array(z.number().min(-30).max(50)).length(12),
      extremes: z.object({
        min: z.number().min(-50).max(10),
        max: z.number().min(30).max(60)
      })
    }),
    windSpeed: z.object({
      annualAverage: z.number().min(0).max(20), // m/s
      monthlyAverage: z.array(z.number().min(0).max(30)).length(12)
    }),
    humidity: z.object({
      annualAverage: z.number().min(10).max(100), // %
      monthlyAverage: z.array(z.number().min(5).max(100)).length(12)
    })
  })
})
.refine((tmy) => {
  // Validate GHI = DNI + DHI relationship (approximately)
  const ghiAnnual = tmy.annualStatistics.globalHorizontalIrradiance.annual;
  const dniAnnual = tmy.annualStatistics.directNormalIrradiance.annual;
  const dhiAnnual = tmy.annualStatistics.diffuseHorizontalIrradiance.annual;
  
  // DNI needs to be converted to horizontal using average sun angle
  const avgSunAngle = 45; // degrees, simplified
  const dniHorizontal = dniAnnual * Math.sin(avgSunAngle * Math.PI / 180);
  const calculatedGHI = dniHorizontal + dhiAnnual;
  
  return Math.abs(ghiAnnual - calculatedGHI) / ghiAnnual < 0.3; // 30% tolerance
}, {
  message: 'Irradiance components do not sum correctly (GHI ≠ DNI*cos(θ) + DHI)'
})
.refine((tmy) => {
  // Validate monthly data sums to annual
  const monthlySum = tmy.annualStatistics.globalHorizontalIrradiance.monthly.reduce((a, b) => a + b, 0);
  const annual = tmy.annualStatistics.globalHorizontalIrradiance.annual;
  return Math.abs(monthlySum - annual) / annual < 0.05; // 5% tolerance
}, {
  message: 'Monthly GHI values do not sum to annual total within tolerance'
});

// Real-time irradiance measurements
export const irradianceMeasurementSchema = z.object({
  // Measurement timestamp and location
  timestamp: z.date(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    elevation: z.number().min(-500).max(9000)
  }),
  
  // Irradiance measurements
  irradiance: z.object({
    globalHorizontal: z.number().min(0).max(1500), // W/m²
    planeOfArray: z.number().min(0).max(1500), // W/m²
    directNormal: z.number().min(0).max(1200), // W/m²
    diffuseHorizontal: z.number().min(0).max(500), // W/m²
    albedo: z.number().min(0).max(1) // ground reflectance
  }),
  
  // Environmental conditions
  meteorological: z.object({
    ambientTemperature: z.number().min(-50).max(60), // °C
    moduleTemperature: z.number().min(-40).max(90).optional(), // °C
    windSpeed: z.number().min(0).max(50), // m/s
    windDirection: z.number().min(0).max(360).optional(), // degrees
    humidity: z.number().min(0).max(100), // %
    pressure: z.number().min(800).max(1100).optional() // hPa
  }),
  
  // Solar geometry
  solarGeometry: z.object({
    sunElevation: z.number().min(0).max(90), // degrees
    sunAzimuth: z.number().min(0).max(360), // degrees
    airMass: z.number().min(1).max(40), // dimensionless
    extraterrestrialIrradiance: z.number().min(1300).max(1400) // W/m²
  }),
  
  // Data quality indicators
  quality: z.object({
    sensorStatus: z.enum(['operational', 'maintenance', 'fault', 'offline']),
    calibrationDate: z.date().optional(),
    uncertainty: z.number().min(0).max(20), // %
    flags: z.array(z.enum([
      'normal', 'suspect', 'estimated', 'missing', 'out_of_range'
    ])).default(['normal'])
  })
})
.refine((measurement) => {
  // Validate clear sky limits
  const clearSkyGHI = measurement.solarGeometry.extraterrestrialIrradiance * 
    Math.sin(measurement.solarGeometry.sunElevation * Math.PI / 180) * 0.75;
  return measurement.irradiance.globalHorizontal <= clearSkyGHI * 1.2;
}, {
  message: 'GHI measurement exceeds clear sky limit'
})
.refine((measurement) => {
  // Validate POA vs GHI relationship
  if (measurement.irradiance.globalHorizontal > 100) {
    const ratio = measurement.irradiance.planeOfArray / measurement.irradiance.globalHorizontal;
    return ratio >= 0.5 && ratio <= 1.8; // Reasonable POA enhancement range
  }
  return true;
}, {
  message: 'POA to GHI ratio is outside reasonable range'
});

// =====================================================
// ENERGY PRODUCTION VALIDATION
// =====================================================

// Production measurement standards
export const PRODUCTION_STANDARDS = {
  // Measurement accuracy (IEC 61724)
  accuracy: {
    energy: 1.0, // % uncertainty for AC energy
    power: 2.0, // % uncertainty for instantaneous power
    revenue: 0.5 // % uncertainty for revenue-grade meters
  },
  // Performance metrics
  performance: {
    performanceRatio: { min: 0.6, max: 0.95 },
    capacityFactor: { residential: { min: 10, max: 25 }, utility: { min: 15, max: 35 } },
    specificYield: { min: 800, max: 2500 } // kWh/kW/year
  },
  // Data validation limits
  validation: {
    maxPowerRatio: 1.2, // Max power vs STC rating
    minPerformanceRatio: 0.4, // Minimum acceptable PR
    maxDailyVariation: 50 // % day-to-day variation
  }
} as const;

// Energy production measurement validation
export const energyProductionSchema = z.object({
  // System identification
  systemId: z.string().min(1).max(50),
  measurementPeriod: z.object({
    startDate: z.date(),
    endDate: z.date(),
    duration: z.enum(['real_time', 'hourly', 'daily', 'monthly', 'annual'])
  }),
  
  // Production measurements
  production: z.object({
    dcPower: z.number().min(0).max(2000000), // W
    acPower: z.number().min(0).max(2000000), // W
    dcEnergy: z.number().min(0).max(50000), // kWh
    acEnergy: z.number().min(0).max(50000), // kWh
    inverterEfficiency: z.number().min(80).max(100) // %
  }),
  
  // System specifications for validation
  systemSpecs: z.object({
    dcRating: z.number().min(1000).max(2000000), // W
    acRating: z.number().min(1000).max(2000000), // W
    panelCount: z.number().int().min(1).max(10000),
    inverterCount: z.number().int().min(1).max(1000)
  }),
  
  // Environmental conditions during measurement
  conditions: z.object({
    irradiance: irradianceMeasurementSchema.shape.irradiance,
    temperature: z.object({
      ambient: z.number().min(-40).max(60), // °C
      module: z.number().min(-30).max(90) // °C
    }),
    windSpeed: z.number().min(0).max(50) // m/s
  }),
  
  // Performance metrics
  performance: z.object({
    performanceRatio: z.number().min(0.3).max(1.2),
    capacityFactor: z.number().min(0).max(100), // %
    specificYield: z.number().min(0).max(15), // kWh/kW for measurement period
    temperatureCorrectedPR: z.number().min(0.3).max(1.2),
    irradianceCorrectedPower: z.number().min(0).max(2000000) // W
  }),
  
  // Data quality
  dataQuality: z.object({
    measurementAccuracy: z.enum(['revenue_grade', 'commercial', 'residential']),
    calibrationStatus: z.enum(['calibrated', 'factory_calibrated', 'uncalibrated']),
    dataCompleteness: z.number().min(80).max(100), // %
    outlierCount: z.number().min(0).max(100), // count
    flags: z.array(z.enum([
      'normal', 'inverter_offline', 'grid_outage', 'maintenance', 'snow_cover', 'soiling'
    ])).default(['normal'])
  })
})
.refine((prod) => {
  // Validate DC/AC power relationship
  if (prod.production.dcPower > 100 && prod.production.acPower > 100) {
    const efficiency = prod.production.acPower / prod.production.dcPower;
    return efficiency >= 0.8 && efficiency <= 1.0;
  }
  return true;
}, {
  message: 'AC/DC power ratio indicates impossible inverter efficiency'
})
.refine((prod) => {
  // Validate power vs system rating
  const powerRatio = prod.production.dcPower / prod.systemSpecs.dcRating;
  return powerRatio <= PRODUCTION_STANDARDS.validation.maxPowerRatio;
}, {
  message: 'Power output exceeds system DC rating beyond reasonable limits'
})
.refine((prod) => {
  // Validate performance ratio
  return prod.performance.performanceRatio >= PRODUCTION_STANDARDS.validation.minPerformanceRatio;
}, {
  message: 'Performance ratio is below minimum acceptable threshold'
});

// =====================================================
// PERFORMANCE RATIO VALIDATION
// =====================================================

// Performance ratio calculation and validation
export const performanceRatioSchema = z.object({
  // Calculation period
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
    timeResolution: z.enum(['hourly', 'daily', 'monthly', 'annual'])
  }),
  
  // Reference conditions
  referenceConditions: z.object({
    irradiance: z.number().min(800).max(1200), // W/m² (typically 1000 W/m²)
    temperature: z.number().min(20).max(30), // °C (typically 25°C)
    airMass: z.number().min(1.0).max(2.0) // (typically 1.5)
  }),
  
  // Measured values
  measurements: z.object({
    totalIrradiation: z.number().min(0).max(10000), // kWh/m²
    totalProduction: z.number().min(0).max(100000), // kWh
    averageIrradiance: z.number().min(0).max(1500), // W/m²
    peakSunHours: z.number().min(0).max(12) // hours/day average
  }),
  
  // System parameters
  systemParams: z.object({
    dcRating: z.number().min(1).max(2000), // kW
    installedCapacity: z.number().min(1).max(2000), // kW
    moduleTemperatureCoeff: z.number().min(-0.6).max(-0.2) // %/°C
  }),
  
  // Environmental corrections
  corrections: z.object({
    temperatureCorrection: z.boolean().default(true),
    irradianceCorrection: z.boolean().default(true),
    spectralCorrection: z.boolean().default(false),
    incidenceAngleCorrection: z.boolean().default(false)
  }),
  
  // Calculated performance ratios
  performanceRatios: z.object({
    uncorrected: z.number().min(0.3).max(1.2),
    temperatureCorrected: z.number().min(0.3).max(1.2),
    fullyCorrected: z.number().min(0.3).max(1.2),
    benchmark: z.number().min(0.6).max(0.95) // Expected PR for system type
  }),
  
  // Loss analysis
  losses: z.object({
    temperatureLosses: z.number().min(0).max(25), // %
    irradianceLosses: z.number().min(0).max(15), // %
    systemLosses: z.number().min(5).max(30), // %
    shadingLosses: z.number().min(0).max(50), // %
    soilingLosses: z.number().min(0).max(20), // %
    otherLosses: z.number().min(0).max(10) // %
  })
})
.refine((pr) => {
  // Validate PR calculation
  const calculatedPR = (pr.measurements.totalProduction * 1000) / 
    (pr.measurements.totalIrradiation * pr.systemParams.dcRating);
  const tolerance = 0.05; // 5% tolerance
  return Math.abs(calculatedPR - pr.performanceRatios.uncorrected) <= tolerance;
}, {
  message: 'Calculated performance ratio does not match provided value'
})
.refine((pr) => {
  // Validate temperature corrected PR is higher than uncorrected
  return pr.performanceRatios.temperatureCorrected >= pr.performanceRatios.uncorrected * 0.95;
}, {
  message: 'Temperature corrected PR should be equal to or higher than uncorrected PR'
})
.refine((pr) => {
  // Validate total losses are reasonable
  const totalLosses = pr.losses.temperatureLosses + pr.losses.irradianceLosses + 
    pr.losses.systemLosses + pr.losses.shadingLosses + pr.losses.soilingLosses + 
    pr.losses.otherLosses;
  return totalLosses <= 70; // Maximum 70% total losses
}, {
  message: 'Total system losses exceed reasonable limits'
});

// =====================================================
// FORECASTING VALIDATION
// =====================================================

// Production forecasting model validation
export const productionForecastSchema = z.object({
  // Forecast metadata
  forecast: z.object({
    modelType: z.enum(['physical', 'statistical', 'hybrid', 'machine_learning']),
    forecastHorizon: z.enum(['intraday', 'day_ahead', 'week_ahead', 'month_ahead', 'annual']),
    resolution: z.enum(['15min', 'hourly', 'daily', 'monthly']),
    issueDate: z.date(),
    validFrom: z.date(),
    validTo: z.date()
  }),
  
  // Input data sources
  inputs: z.object({
    weatherForecast: z.object({
      provider: z.string().max(50),
      model: z.string().max(50),
      resolution: z.enum(['1km', '3km', '9km', '25km']),
      updateFrequency: z.enum(['hourly', 'every_6h', 'daily'])
    }),
    historicalData: z.object({
      years: z.number().int().min(1).max(30),
      completeness: z.number().min(80).max(100), // %
      quality: z.enum(['excellent', 'good', 'fair'])
    }),
    systemData: z.object({
      degradationRate: z.number().min(0.3).max(1.0), // %/year
      availabilityFactor: z.number().min(90).max(100), // %
      seasonalAdjustments: z.boolean().default(true)
    })
  }),
  
  // Forecast values
  predictions: z.object({
    energyProduction: z.array(z.object({
      timestamp: z.date(),
      predicted: z.number().min(0).max(50000), // kWh
      confidence: z.object({
        lower: z.number().min(0).max(50000), // kWh (lower bound)
        upper: z.number().min(0).max(50000) // kWh (upper bound)
      }),
      probabilityDistribution: z.array(z.object({
        percentile: z.number().min(0).max(100),
        value: z.number().min(0).max(50000)
      })).optional()
    })).min(1),
    powerOutput: z.array(z.object({
      timestamp: z.date(),
      predicted: z.number().min(0).max(2000000), // W
      rampRate: z.number().min(-50).max(50) // %/hour
    })).optional()
  }),
  
  // Model performance metrics
  validation: z.object({
    historicalAccuracy: z.object({
      mae: z.number().min(0).max(100), // % Mean Absolute Error
      rmse: z.number().min(0).max(100), // % Root Mean Square Error
      mbe: z.number().min(-50).max(50), // % Mean Bias Error
      r2: z.number().min(0).max(1) // R-squared
    }),
    uncertaintyBounds: z.object({
      p10: z.number().min(70).max(100), // % 10th percentile accuracy
      p50: z.number().min(80).max(100), // % median accuracy
      p90: z.number().min(90).max(100) // % 90th percentile accuracy
    }),
    modelSkill: z.number().min(0).max(1) // Skill score vs persistence
  }),
  
  // Environmental factors
  environmentalInputs: z.object({
    irradianceForecast: z.array(z.object({
      timestamp: z.date(),
      ghi: z.number().min(0).max(1500), // W/m²
      dni: z.number().min(0).max(1200), // W/m²
      dhi: z.number().min(0).max(500), // W/m²
      uncertainty: z.number().min(5).max(40) // % uncertainty
    })).min(1),
    temperatureForecast: z.array(z.object({
      timestamp: z.date(),
      ambient: z.number().min(-40).max(50), // °C
      module: z.number().min(-30).max(80) // °C
    })).optional(),
    cloudForecast: z.array(z.object({
      timestamp: z.date(),
      coverage: z.number().min(0).max(100), // %
      type: z.enum(['clear', 'scattered', 'broken', 'overcast'])
    })).optional()
  })
})
.refine((forecast) => {
  // Validate confidence intervals
  return forecast.predictions.energyProduction.every(pred => 
    pred.confidence.lower <= pred.predicted && pred.predicted <= pred.confidence.upper
  );
}, {
  message: 'Confidence intervals must bound the predicted values'
})
.refine((forecast) => {
  // Validate forecast horizon consistency
  const duration = forecast.forecast.validTo.getTime() - forecast.forecast.validFrom.getTime();
  const hours = duration / (1000 * 60 * 60);
  
  if (forecast.forecast.forecastHorizon === 'intraday') {
    return hours <= 24;
  } else if (forecast.forecast.forecastHorizon === 'day_ahead') {
    return hours <= 48;
  } else if (forecast.forecast.forecastHorizon === 'week_ahead') {
    return hours <= 168;
  }
  return true;
}, {
  message: 'Forecast duration does not match specified horizon'
});

// =====================================================
// WEATHER CORRELATION VALIDATION
// =====================================================

// Weather-production correlation analysis
export const weatherCorrelationSchema = z.object({
  // Analysis parameters
  analysis: z.object({
    timeframe: z.object({
      startDate: z.date(),
      endDate: z.date(),
      resolution: z.enum(['hourly', 'daily', 'monthly'])
    }),
    correlationMethod: z.enum(['pearson', 'spearman', 'kendall']),
    significanceLevel: z.number().min(0.01).max(0.10) // p-value threshold
  }),
  
  // Weather variables
  weatherVariables: z.object({
    irradiance: z.object({
      correlation: z.number().min(-1).max(1),
      significance: z.number().min(0).max(1), // p-value
      r_squared: z.number().min(0).max(1)
    }),
    temperature: z.object({
      correlation: z.number().min(-1).max(1),
      significance: z.number().min(0).max(1),
      optimalRange: z.object({
        min: z.number().min(-10).max(20), // °C
        max: z.number().min(20).max(40) // °C
      })
    }),
    windSpeed: z.object({
      correlation: z.number().min(-1).max(1),
      significance: z.number().min(0).max(1),
      coolingEffect: z.number().min(0).max(10) // % performance improvement
    }),
    humidity: z.object({
      correlation: z.number().min(-1).max(1),
      significance: z.number().min(0).max(1)
    }),
    cloudCover: z.object({
      correlation: z.number().min(-1).max(1),
      significance: z.number().min(0).max(1)
    })
  }),
  
  // Model coefficients
  regressionModel: z.object({
    modelType: z.enum(['linear', 'polynomial', 'exponential', 'multivariate']),
    coefficients: z.array(z.number()).min(1),
    intercept: z.number(),
    r_squared: z.number().min(0).max(1),
    adjustedR_squared: z.number().min(0).max(1),
    residualStats: z.object({
      mean: z.number().min(-1000).max(1000),
      standardDeviation: z.number().min(0).max(1000),
      skewness: z.number().min(-3).max(3)
    })
  }),
  
  // Seasonal variations
  seasonalFactors: z.object({
    spring: z.number().min(0.7).max(1.3),
    summer: z.number().min(0.8).max(1.4),
    fall: z.number().min(0.6).max(1.2),
    winter: z.number().min(0.4).max(1.0)
  })
})
.refine((corr) => {
  // Validate irradiance has strongest positive correlation
  return corr.weatherVariables.irradiance.correlation > 0.7;
}, {
  message: 'Irradiance should have strong positive correlation with production'
})
.refine((corr) => {
  // Validate temperature correlation is negative (due to efficiency decrease)
  return corr.weatherVariables.temperature.correlation < 0.2;
}, {
  message: 'Temperature correlation should be weakly negative due to efficiency losses'
});

// Export type definitions
export type TMYData = z.infer<typeof tmyDataSchema>;
export type IrradianceMeasurement = z.infer<typeof irradianceMeasurementSchema>;
export type EnergyProduction = z.infer<typeof energyProductionSchema>;
export type PerformanceRatio = z.infer<typeof performanceRatioSchema>;
export type ProductionForecast = z.infer<typeof productionForecastSchema>;
export type WeatherCorrelation = z.infer<typeof weatherCorrelationSchema>;
