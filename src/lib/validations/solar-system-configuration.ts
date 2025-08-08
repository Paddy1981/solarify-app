/**
 * Solar System Configuration Validation Layer
 * 
 * Advanced validation for solar array configurations, electrical design,
 * string optimization, and system performance calculations.
 * 
 * Based on:
 * - NEC Articles 690, 705, and 706
 * - IEEE 1547 standards
 * - UL 1741 requirements
 * - ASCE 7 structural standards
 * - NREL system design guidelines
 */

import { z } from 'zod';
import { solarPanelSpecSchema, inverterSpecSchema, batterySpecSchema } from './solar-equipment';

// =====================================================
// SYSTEM CONFIGURATION CONSTANTS
// =====================================================

// NEC code requirements
export const NEC_REQUIREMENTS = {
  // Article 690.7 - Maximum System Voltage
  maxSystemVoltage: {
    residential: 600, // V
    commercial: 1000, // V
    utility: 1500 // V
  },
  // Article 690.8 - Circuit Sizing and Current
  safetyfactors: {
    current: 1.25, // 125% of maximum current
    voltage: 1.25, // 125% of open circuit voltage
    irradiance: 1.25 // 125% of STC irradiance
  },
  // Article 690.12 - Rapid Shutdown
  rapidShutdown: {
    voltageLimit: 30, // V
    currentLimit: 2, // A
    timeLimit: 30 // seconds
  },
  // Grounding requirements
  grounding: {
    maxResistance: 25, // ohms
    bondingRequired: true
  }
} as const;

// DC/AC ratio guidelines
export const DC_AC_RATIO_LIMITS = {
  residential: { min: 1.0, max: 1.4, optimal: 1.25 },
  commercial: { min: 1.0, max: 1.3, optimal: 1.2 },
  utility: { min: 1.0, max: 1.2, optimal: 1.1 }
} as const;

// String configuration limits
export const STRING_LIMITS = {
  minPanelsPerString: 1,
  maxPanelsPerString: 30,
  minStringsPerInverter: 1,
  maxStringsPerInverter: 20,
  maxStringCurrent: 15, // A
  maxStringVoltage: 1500 // V
} as const;

// Shading analysis parameters
export const SHADING_PARAMETERS = {
  minRowSpacing: 2.0, // meters
  shadowFactor: 2.5, // height to spacing ratio
  maxShadingLoss: 5.0, // % acceptable shading loss
  analysisInterval: 15, // minutes
  criticalMonths: [11, 12, 1] // November, December, January
} as const;

// =====================================================
// ARRAY CONFIGURATION VALIDATION
// =====================================================

// Solar array layout specification
export const solarArrayLayoutSchema = z.object({
  // Array geometry
  geometry: z.object({
    orientation: z.enum(['portrait', 'landscape']),
    tiltAngle: z.number().min(0).max(90),
    azimuthAngle: z.number().min(0).max(360),
    panelSpacing: z.object({
      horizontal: z.number().min(0.01).max(0.5), // meters
      vertical: z.number().min(0.01).max(0.5) // meters
    }),
    rowSpacing: z.number().min(1.0).max(10.0), // meters
    arrayDimensions: z.object({
      rows: z.number().int().min(1).max(50),
      panelsPerRow: z.number().int().min(1).max(100),
      totalPanels: z.number().int().min(1).max(5000)
    })
  }),
  
  // Site constraints
  siteConstraints: z.object({
    availableArea: z.object({
      length: z.number().min(5).max(1000), // meters
      width: z.number().min(5).max(1000), // meters
      usableArea: z.number().min(25).max(1000000) // m²
    }),
    setbacks: z.object({
      front: z.number().min(0).max(50), // meters
      rear: z.number().min(0).max(50), // meters
      sides: z.number().min(0).max(50) // meters
    }),
    obstacles: z.array(z.object({
      type: z.enum(['building', 'tree', 'structure', 'chimney', 'vent']),
      height: z.number().min(0).max(200), // meters
      position: z.object({
        x: z.number(),
        y: z.number()
      }),
      shadowLength: z.number().min(0).max(1000) // meters
    })).default([])
  }),
  
  // Performance factors
  performanceFactors: z.object({
    shadingLoss: z.number().min(0).max(50), // %
    soilingLoss: z.number().min(0).max(20), // %
    mismatchLoss: z.number().min(0).max(10), // %
    connectionLoss: z.number().min(0).max(5), // %
    dcWiringLoss: z.number().min(0).max(5), // %
    acWiringLoss: z.number().min(0).max(3) // %
  })
})
.refine((layout) => {
  // Validate array fits within available area
  const panelArea = layout.geometry.arrayDimensions.totalPanels * 2.0; // Assume 2m² per panel
  return panelArea <= layout.siteConstraints.availableArea.usableArea;
}, {
  message: 'Array size exceeds available usable area'
})
.refine((layout) => {
  // Validate row spacing for shading
  const panelHeight = 1.65; // Assume standard panel height in meters
  const minSpacing = panelHeight * Math.sin(layout.geometry.tiltAngle * Math.PI / 180) * SHADING_PARAMETERS.shadowFactor;
  return layout.geometry.rowSpacing >= minSpacing;
}, {
  message: 'Row spacing insufficient to prevent inter-row shading'
});

// =====================================================
// ELECTRICAL DESIGN VALIDATION
// =====================================================

// DC electrical system design
export const dcElectricalDesignSchema = z.object({
  // String configuration
  stringConfiguration: z.object({
    panelsPerString: z.number().int().min(STRING_LIMITS.minPanelsPerString).max(STRING_LIMITS.maxPanelsPerString),
    stringsInParallel: z.number().int().min(1).max(20),
    totalStrings: z.number().int().min(1).max(100),
    stringVoltage: z.object({
      nominal: z.number().min(24).max(1500),
      openCircuit: z.number().min(30).max(1875), // 125% of max
      operatingPoint: z.number().min(20).max(1200)
    }),
    stringCurrent: z.object({
      shortCircuit: z.number().min(1).max(20),
      operatingPoint: z.number().min(0.5).max(15),
      maximumContinuous: z.number().min(1).max(18.75) // 125% of STC
    })
  }),
  
  // DC combiner and distribution
  dcCombiner: z.object({
    required: z.boolean(),
    inputCircuits: z.number().int().min(2).max(24).optional(),
    maxInputCurrent: z.number().min(10).max(100).optional(),
    overcurrentProtection: z.object({
      fuseRating: z.number().min(1).max(30), // A
      fuseType: z.enum(['DC_fuse', 'circuit_breaker']),
      coordinationStudy: z.boolean().default(false)
    }).optional(),
    monitoring: z.boolean().default(true)
  }),
  
  // DC disconnect requirements
  dcDisconnect: z.object({
    required: z.boolean().default(true),
    type: z.enum(['switch', 'circuit_breaker', 'fused_disconnect']),
    ampereRating: z.number().min(15).max(200),
    voltageRating: z.number().min(250).max(2000),
    location: z.enum(['array', 'inverter', 'service_panel']),
    accessibility: z.enum(['readily_accessible', 'accessible', 'not_accessible'])
  }),
  
  // Grounding and bonding
  grounding: z.object({
    systemGrounding: z.enum(['grounded', 'ungrounded', 'functionally_grounded']),
    equipmentGrounding: z.object({
      conductor: z.object({
        size: z.enum(['12_AWG', '10_AWG', '8_AWG', '6_AWG', '4_AWG']),
        material: z.enum(['copper', 'aluminum']).default('copper'),
        type: z.enum(['bare', 'insulated']).default('bare')
      }),
      electrodeSystem: z.object({
        type: z.enum(['ground_rod', 'concrete_encased', 'plate_electrode']),
        resistance: z.number().min(0.1).max(25), // ohms
        tested: z.boolean().default(false)
      })
    }),
    bondingJumpers: z.array(z.object({
      location: z.string(),
      size: z.string(),
      material: z.enum(['copper', 'aluminum'])
    })).default([])
  })
})
.refine((dc) => {
  // Validate NEC voltage limits
  return dc.stringConfiguration.stringVoltage.openCircuit <= NEC_REQUIREMENTS.maxSystemVoltage.commercial;
}, {
  message: 'Open circuit voltage exceeds NEC maximum system voltage limits'
})
.refine((dc) => {
  // Validate current derating factors
  const derated = dc.stringConfiguration.stringCurrent.operatingPoint * NEC_REQUIREMENTS.safetyfactors.current;
  return derated <= dc.stringConfiguration.stringCurrent.maximumContinuous;
}, {
  message: 'String current exceeds NEC 125% derating requirement'
});

// AC electrical system design
export const acElectricalDesignSchema = z.object({
  // AC output specifications
  acOutput: z.object({
    voltage: z.union([
      z.literal(120), z.literal(208), z.literal(240),
      z.literal(277), z.literal(480), z.literal(600)
    ]),
    frequency: z.union([z.literal(50), z.literal(60)]),
    phases: z.enum(['single', 'three']),
    nominalPower: z.number().min(1000).max(2000000), // W
    maxContinuousCurrent: z.number().min(5).max(5000) // A
  }),
  
  // AC disconnect and protection
  acDisconnect: z.object({
    required: z.boolean().default(true),
    type: z.enum(['switch', 'circuit_breaker']),
    ampereRating: z.number().min(15).max(800),
    voltageRating: z.number().min(250).max(1000),
    location: z.enum(['inverter', 'service_panel', 'separate_enclosure']),
    lockable: z.boolean().default(true)
  }),
  
  // Point of interconnection
  interconnection: z.object({
    method: z.enum(['supply_side', 'load_side', 'separate_service']),
    utilityVoltage: z.number().min(120).max(35000),
    servicePanelRating: z.number().min(100).max(4000), // A
    interconnectionRating: z.number().min(15).max(800), // A
    backfeedBreaker: z.object({
      required: z.boolean().default(true),
      rating: z.number().min(15).max(200),
      type: z.enum(['standard', 'suitable_for_backfeed'])
    }).optional(),
    rapidShutdown: z.object({
      compliant: z.boolean().default(true),
      method: z.enum(['inverter_based', 'module_level', 'string_level'])
    })
  }),
  
  // AC wiring and conduits
  wiring: z.object({
    acConductor: z.object({
      size: z.enum(['12_AWG', '10_AWG', '8_AWG', '6_AWG', '4_AWG', '2_AWG', '1_AWG', '1/0', '2/0', '3/0', '4/0']),
      material: z.enum(['copper', 'aluminum']).default('copper'),
      insulation: z.enum(['THWN', 'XHHW', 'USE']),
      ampacity: z.number().min(15).max(400)
    }),
    conduit: z.object({
      type: z.enum(['EMT', 'PVC', 'LFNC', 'RMC']),
      size: z.enum(['1/2', '3/4', '1', '1-1/4', '1-1/2', '2']),
      fillRatio: z.number().min(0.1).max(0.4) // NEC fill requirements
    }),
    routingMethod: z.enum(['aerial', 'underground', 'surface_mounted', 'concealed'])
  })
});

// =====================================================
// STRING OPTIMIZATION VALIDATION
// =====================================================

// String optimization parameters
export const stringOptimizationSchema = z.object({
  // Optimization objectives
  objectives: z.object({
    maximizeProduction: z.boolean().default(true),
    minimizeCost: z.boolean().default(true),
    balanceStrings: z.boolean().default(true),
    minimizeLosses: z.boolean().default(true)
  }),
  
  // Panel grouping constraints
  panelGrouping: z.object({
    allowMixedOrientations: z.boolean().default(false),
    allowMixedTilts: z.boolean().default(false),
    allowMixedPanelTypes: z.boolean().default(false),
    maxTiltDifference: z.number().min(0).max(45), // degrees
    maxAzimuthDifference: z.number().min(0).max(90) // degrees
  }),
  
  // String balancing parameters
  stringBalancing: z.object({
    maxCurrentImbalance: z.number().min(1).max(10), // %
    maxVoltageImbalance: z.number().min(1).max(5), // %
    maxPowerImbalance: z.number().min(1).max(10), // %
    requireIdenticalStrings: z.boolean().default(false)
  }),
  
  // Environmental considerations
  environmentalFactors: z.object({
    shadingAnalysis: z.object({
      enabled: z.boolean().default(true),
      timeStep: z.number().min(5).max(60), // minutes
      seasons: z.array(z.enum(['winter', 'spring', 'summer', 'fall'])).default(['winter']),
      maxShadingLoss: z.number().min(0).max(20) // %
    }),
    temperatureAnalysis: z.object({
      enabled: z.boolean().default(true),
      ambientTemperature: z.number().min(-30).max(50), // °C
      moduleTemperatureRise: z.number().min(20).max(50), // °C above ambient
      thermalDerating: z.boolean().default(true)
    }),
    soilingAnalysis: z.object({
      enabled: z.boolean().default(true),
      soilingRate: z.number().min(0).max(20), // % loss
      cleaningFrequency: z.number().min(0).max(365) // days
    })
  }),
  
  // Performance simulation
  performanceSimulation: z.object({
    timeResolution: z.enum(['hourly', 'sub_hourly', 'daily', 'monthly']),
    simulationYears: z.number().int().min(1).max(30),
    weatherDataSource: z.enum(['TMY', 'satellite', 'ground_station']),
    includeInterannualVariability: z.boolean().default(true),
    degradationModeling: z.boolean().default(true)
  })
})
.refine((opt) => {
  // Validate shading analysis parameters
  if (opt.environmentalFactors.shadingAnalysis.enabled) {
    return opt.environmentalFactors.shadingAnalysis.maxShadingLoss <= SHADING_PARAMETERS.maxShadingLoss;
  }
  return true;
}, {
  message: 'Maximum shading loss exceeds recommended limits'
});

// =====================================================
// SYSTEM PERFORMANCE VALIDATION
// =====================================================

// DC/AC ratio validation
export const dcAcRatioSchema = z.object({
  systemType: z.enum(['residential', 'commercial', 'utility']),
  dcCapacity: z.number().min(1).max(2000), // kW
  acCapacity: z.number().min(1).max(2000), // kW
  ratio: z.number().min(0.8).max(2.0),
  justification: z.string().max(500).optional()
})
.refine((ratio) => {
  const limits = DC_AC_RATIO_LIMITS[ratio.systemType];
  return ratio.ratio >= limits.min && ratio.ratio <= limits.max;
}, {
  message: 'DC/AC ratio is outside acceptable range for this system type'
})
.refine((ratio) => {
  // Calculate ratio from capacities
  const calculatedRatio = ratio.dcCapacity / ratio.acCapacity;
  return Math.abs(calculatedRatio - ratio.ratio) < 0.01;
}, {
  message: 'DC/AC ratio does not match calculated value from capacities'
});

// System efficiency calculation
export const systemEfficiencySchema = z.object({
  // Component efficiencies
  componentEfficiencies: z.object({
    panel: z.number().min(15).max(25), // %
    inverter: z.number().min(90).max(99), // %
    transformer: z.number().min(95).max(99.5).optional(), // %
    dcWiring: z.number().min(95).max(99), // %
    acWiring: z.number().min(97).max(99.5) // %
  }),
  
  // System losses
  systemLosses: z.object({
    shading: z.number().min(0).max(50), // %
    soiling: z.number().min(0).max(20), // %
    mismatch: z.number().min(0).max(10), // %
    connections: z.number().min(0).max(5), // %
    lightInducedDegradation: z.number().min(0).max(3), // %
    nameplateTolerance: z.number().min(0).max(5), // %
    availability: z.number().min(0).max(5) // %
  }),
  
  // Environmental factors
  environmentalFactors: z.object({
    temperature: z.object({
      coefficient: z.number().min(-0.6).max(-0.2), // %/°C
      averageOperatingTemp: z.number().min(20).max(70) // °C
    }),
    irradiance: z.object({
      averageAnnual: z.number().min(800).max(2500), // kWh/m²/year
      lowLightPerformance: z.number().min(90).max(100) // % of STC performance
    }),
    spectralEffects: z.number().min(95).max(105) // % of STC
  }),
  
  // Overall system performance
  overallPerformance: z.object({
    systemEfficiency: z.number().min(10).max(25), // %
    performanceRatio: z.number().min(0.6).max(0.9), // dimensionless
    capacityFactor: z.number().min(10).max(35), // %
    specificYield: z.number().min(800).max(2500) // kWh/kW/year
  })
})
.refine((eff) => {
  // Validate system efficiency calculation
  const calculatedSystemEff = eff.componentEfficiencies.panel *
    (eff.componentEfficiencies.inverter / 100) *
    (eff.componentEfficiencies.dcWiring / 100) *
    (eff.componentEfficiencies.acWiring / 100) *
    (1 - eff.systemLosses.shading / 100) *
    (1 - eff.systemLosses.soiling / 100) *
    (1 - eff.systemLosses.mismatch / 100);
  
  const tolerance = 2.0; // 2% tolerance
  return Math.abs(calculatedSystemEff - eff.overallPerformance.systemEfficiency) <= tolerance;
}, {
  message: 'Calculated system efficiency does not match specified value'
});

// =====================================================
// COMPREHENSIVE SYSTEM VALIDATION
// =====================================================

// Complete system configuration validation
export const solarSystemConfigurationSchema = z.object({
  // System identification
  systemId: z.string().min(1).max(50),
  systemName: z.string().min(1).max(100),
  systemType: z.enum(['residential', 'commercial', 'utility', 'community']),
  applicationClass: z.enum(['grid_tied', 'off_grid', 'hybrid', 'battery_backup']),
  
  // Component specifications
  components: z.object({
    panels: z.array(solarPanelSpecSchema).min(1),
    inverters: z.array(inverterSpecSchema).min(1),
    batteries: z.array(batterySpecSchema).optional(),
    monitoring: z.object({
      systemLevel: z.boolean().default(true),
      stringLevel: z.boolean().default(false),
      panelLevel: z.boolean().default(false)
    })
  }),
  
  // Array layout and configuration
  arrayLayout: solarArrayLayoutSchema,
  
  // Electrical design
  electricalDesign: z.object({
    dc: dcElectricalDesignSchema,
    ac: acElectricalDesignSchema
  }),
  
  // String optimization
  stringOptimization: stringOptimizationSchema,
  
  // System performance
  performance: z.object({
    dcAcRatio: dcAcRatioSchema,
    systemEfficiency: systemEfficiencySchema,
    estimatedProduction: z.object({
      firstYear: z.number().min(1000).max(10000000), // kWh
      annualDegradation: z.number().min(0.3).max(1.0), // %/year
      twentyFiveYear: z.number().min(20000).max(200000000) // kWh cumulative
    })
  }),
  
  // Compliance and safety
  compliance: z.object({
    necCompliant: z.boolean().default(true),
    localCodesCompliant: z.boolean().default(true),
    utilityRequirementsCompliant: z.boolean().default(true),
    rapidShutdownCompliant: z.boolean().default(true),
    groundingCompliant: z.boolean().default(true)
  }),
  
  // Documentation
  documentation: z.object({
    singleLineDiagram: z.boolean().default(false),
    arrayLayoutDrawing: z.boolean().default(false),
    structuralDrawings: z.boolean().default(false),
    electricalSchematics: z.boolean().default(false),
    specificationSheets: z.boolean().default(false)
  })
})
.refine((system) => {
  // Validate total system power consistency
  const totalPanelPower = system.components.panels.reduce((sum, panel) => 
    sum + panel.nominalPower, 0) * system.arrayLayout.geometry.arrayDimensions.totalPanels;
  const totalInverterPower = system.components.inverters.reduce((sum, inverter) => 
    sum + inverter.acOutput.nominalPower, 0);
  
  const dcAcRatio = totalPanelPower / totalInverterPower;
  return dcAcRatio <= 1.5; // Maximum oversizing
}, {
  message: 'System DC/AC ratio exceeds maximum allowable oversizing'
})
.refine((system) => {
  // Validate string configuration feasibility
  const totalPanels = system.arrayLayout.geometry.arrayDimensions.totalPanels;
  const panelsPerString = system.electricalDesign.dc.stringConfiguration.panelsPerString;
  const totalStrings = system.electricalDesign.dc.stringConfiguration.totalStrings;
  
  return totalPanels === panelsPerString * totalStrings;
}, {
  message: 'String configuration does not match total panel count'
})
.refine((system) => {
  // Validate compliance requirements
  return system.compliance.necCompliant && 
         system.compliance.rapidShutdownCompliant &&
         system.compliance.groundingCompliant;
}, {
  message: 'System does not meet mandatory safety and compliance requirements'
});

// Export type definitions
export type SolarArrayLayout = z.infer<typeof solarArrayLayoutSchema>;
export type DCElectricalDesign = z.infer<typeof dcElectricalDesignSchema>;
export type ACElectricalDesign = z.infer<typeof acElectricalDesignSchema>;
export type StringOptimization = z.infer<typeof stringOptimizationSchema>;
export type DCACRatio = z.infer<typeof dcAcRatioSchema>;
export type SystemEfficiency = z.infer<typeof systemEfficiencySchema>;
export type SolarSystemConfiguration = z.infer<typeof solarSystemConfigurationSchema>;
