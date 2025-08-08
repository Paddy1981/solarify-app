/**
 * Solar Equipment Validation Layer
 * 
 * Comprehensive validation system for solar equipment specifications,
 * compatibility checks, and certification requirements.
 * 
 * Based on:
 * - IEC 61215 (Crystalline silicon photovoltaic modules)
 * - IEC 61730 (Photovoltaic module safety qualification)
 * - IEEE 1547 (Standard for Interconnection and Interoperability)
 * - UL 1703 (Flat-Plate Photovoltaic Modules and Panels)
 * - UL 1741 (Inverters, Converters, Controllers and Interconnection Equipment)
 */

import { z } from 'zod';

// =====================================================
// SOLAR PANEL VALIDATION
// =====================================================

// Panel technology types with specifications
export const PANEL_TECHNOLOGIES = {
  monocrystalline: {
    minEfficiency: 18,
    maxEfficiency: 24,
    temperatureCoeff: { min: -0.5, max: -0.35 },
    warrantyYears: { performance: 25, product: 12 }
  },
  polycrystalline: {
    minEfficiency: 15,
    maxEfficiency: 20,
    temperatureCoeff: { min: -0.55, max: -0.40 },
    warrantyYears: { performance: 25, product: 12 }
  },
  thin_film_cdte: {
    minEfficiency: 12,
    maxEfficiency: 18,
    temperatureCoeff: { min: -0.35, max: -0.20 },
    warrantyYears: { performance: 20, product: 10 }
  },
  thin_film_cigs: {
    minEfficiency: 13,
    maxEfficiency: 19,
    temperatureCoeff: { min: -0.40, max: -0.25 },
    warrantyYears: { performance: 20, product: 10 }
  },
  perovskite: {
    minEfficiency: 20,
    maxEfficiency: 26,
    temperatureCoeff: { min: -0.30, max: -0.15 },
    warrantyYears: { performance: 15, product: 8 }
  },
  bifacial: {
    minEfficiency: 19,
    maxEfficiency: 22,
    temperatureCoeff: { min: -0.45, max: -0.30 },
    warrantyYears: { performance: 25, product: 12 }
  }
} as const;

// Required certifications for panels
export const REQUIRED_PANEL_CERTIFICATIONS = [
  'IEC_61215',
  'IEC_61730',
  'UL_1703'
] as const;

export const OPTIONAL_PANEL_CERTIFICATIONS = [
  'ISO_9001',
  'ISO_14001',
  'OHSAS_18001',
  'IEC_61701', // Salt mist corrosion
  'IEC_62716', // Ammonia corrosion
  'IEC_61853', // Performance at low irradiance
  'IEC_62804'  // Potential induced degradation
] as const;

// Panel frame materials and their properties
export const PANEL_FRAME_MATERIALS = {
  aluminum: {
    corrosionResistance: 'excellent',
    weight: 'light',
    thermalExpansion: 'low',
    recyclable: true
  },
  stainless_steel: {
    corrosionResistance: 'excellent',
    weight: 'heavy',
    thermalExpansion: 'very_low',
    recyclable: true
  },
  galvanized_steel: {
    corrosionResistance: 'good',
    weight: 'medium',
    thermalExpansion: 'low',
    recyclable: true
  },
  frameless: {
    corrosionResistance: 'n/a',
    weight: 'lightest',
    thermalExpansion: 'n/a',
    recyclable: true
  }
} as const;

// Solar panel specification validation
export const solarPanelSpecSchema = z.object({
  // Basic identification
  manufacturer: z.string()
    .min(1, 'Manufacturer is required')
    .max(100, 'Manufacturer name too long'),
  model: z.string()
    .min(1, 'Model is required')
    .max(100, 'Model name too long'),
  partNumber: z.string()
    .optional(),
  
  // Technology and construction
  technology: z.enum(Object.keys(PANEL_TECHNOLOGIES) as [string, ...string[]])
    .refine((tech) => tech in PANEL_TECHNOLOGIES, 'Invalid panel technology'),
  cellType: z.enum(['monocrystalline', 'polycrystalline', 'thin_film', 'bifacial']),
  frameType: z.enum(Object.keys(PANEL_FRAME_MATERIALS) as [string, ...string[]])
    .default('aluminum'),
  
  // Electrical specifications
  nominalPower: z.number()
    .min(50, 'Nominal power must be at least 50W')
    .max(700, 'Nominal power cannot exceed 700W')
    .multipleOf(1, 'Nominal power must be a whole number'),
  efficiency: z.number()
    .min(10, 'Efficiency must be at least 10%')
    .max(30, 'Efficiency cannot exceed 30%'),
  
  // STC (Standard Test Conditions) ratings
  stc: z.object({
    powerOutput: z.number().min(50).max(700),
    voltage: z.number().min(20).max(60),
    current: z.number().min(1).max(15),
    openCircuitVoltage: z.number().min(25).max(70),
    shortCircuitCurrent: z.number().min(1).max(16)
  }),
  
  // Temperature coefficients
  temperatureCoefficients: z.object({
    power: z.number().min(-1).max(0), // %/°C
    voltage: z.number().min(-0.5).max(0), // %/°C
    current: z.number().min(-0.1).max(0.1) // %/°C
  }),
  
  // Physical dimensions and weight
  dimensions: z.object({
    length: z.number().min(1000).max(2500), // mm
    width: z.number().min(500).max(1500), // mm
    thickness: z.number().min(30).max(60), // mm
    weight: z.number().min(15).max(35) // kg
  }),
  
  // Environmental ratings
  environmental: z.object({
    operatingTemperature: z.object({
      min: z.number().min(-50).max(-30),
      max: z.number().min(70).max(90)
    }),
    windLoad: z.number().min(2400).max(5400), // Pa
    snowLoad: z.number().min(2400).max(5400), // Pa
    hailResistance: z.number().min(20).max(35), // mm diameter
    ipRating: z.enum(['IP65', 'IP67', 'IP68']).default('IP65')
  }),
  
  // Certifications
  certifications: z.object({
    required: z.array(z.enum(REQUIRED_PANEL_CERTIFICATIONS))
      .min(REQUIRED_PANEL_CERTIFICATIONS.length, 'All required certifications must be present'),
    optional: z.array(z.enum(OPTIONAL_PANEL_CERTIFICATIONS))
      .optional()
  }),
  
  // Warranty information
  warranty: z.object({
    performance: z.object({
      years: z.number().min(20).max(30),
      degradationRate: z.number().min(0.5).max(0.8), // %/year
      firstYearDegradation: z.number().min(2).max(3) // %
    }),
    product: z.object({
      years: z.number().min(10).max(25),
      coverage: z.string().max(500)
    })
  }),
  
  // Manufacturing and quality
  manufacturingDate: z.date().optional(),
  countryOfOrigin: z.string().max(50),
  tierRating: z.enum(['Tier_1', 'Tier_2', 'Tier_3']).optional(),
  
  // Financial information
  pricing: z.object({
    listPrice: z.number().min(0),
    currency: z.string().length(3).default('USD'),
    pricePerWatt: z.number().min(0.3).max(5.0)
  }).optional(),
  
  // Additional properties
  bifacialGain: z.number().min(0).max(30).optional(), // % for bifacial panels
  fireRating: z.enum(['Class_A', 'Class_B', 'Class_C']).optional(),
  recyclingProgram: z.boolean().default(false)
})
.refine((panel) => {
  // Validate efficiency against technology limits
  const tech = PANEL_TECHNOLOGIES[panel.technology as keyof typeof PANEL_TECHNOLOGIES];
  return panel.efficiency >= tech.minEfficiency && panel.efficiency <= tech.maxEfficiency;
}, {
  message: 'Panel efficiency is outside acceptable range for this technology'
})
.refine((panel) => {
  // Validate temperature coefficient
  const tech = PANEL_TECHNOLOGIES[panel.technology as keyof typeof PANEL_TECHNOLOGIES];
  const powerCoeff = panel.temperatureCoefficients.power;
  return powerCoeff >= tech.temperatureCoeff.min && powerCoeff <= tech.temperatureCoeff.max;
}, {
  message: 'Temperature coefficient is outside expected range for this technology'
})
.refine((panel) => {
  // Validate warranty against technology standards
  const tech = PANEL_TECHNOLOGIES[panel.technology as keyof typeof PANEL_TECHNOLOGIES];
  return panel.warranty.performance.years >= tech.warrantyYears.performance;
}, {
  message: 'Performance warranty period is below industry standard for this technology'
})
.refine((panel) => {
  // Validate power calculation consistency
  const calculatedPower = (panel.stc.voltage * panel.stc.current);
  const tolerance = panel.nominalPower * 0.1; // 10% tolerance
  return Math.abs(calculatedPower - panel.nominalPower) <= tolerance;
}, {
  message: 'STC power calculation does not match nominal power rating'
});

// =====================================================
// INVERTER VALIDATION
// =====================================================

// Inverter technology types
export const INVERTER_TECHNOLOGIES = {
  string: {
    minEfficiency: 95,
    maxEfficiency: 98.5,
    typicalMPPT: { min: 1, max: 4 },
    dcInputVoltage: { min: 200, max: 1500 }
  },
  power_optimizer: {
    minEfficiency: 97,
    maxEfficiency: 99.5,
    typicalMPPT: { min: 1, max: 2 },
    dcInputVoltage: { min: 12.5, max: 80 }
  },
  microinverter: {
    minEfficiency: 95,
    maxEfficiency: 97.5,
    typicalMPPT: { min: 1, max: 2 },
    dcInputVoltage: { min: 16, max: 60 }
  },
  central: {
    minEfficiency: 96,
    maxEfficiency: 99,
    typicalMPPT: { min: 4, max: 12 },
    dcInputVoltage: { min: 450, max: 1500 }
  }
} as const;

// Required inverter certifications
export const REQUIRED_INVERTER_CERTIFICATIONS = [
  'UL_1741',
  'IEEE_1547',
  'FCC_Part_15'
] as const;

export const OPTIONAL_INVERTER_CERTIFICATIONS = [
  'ISO_9001',
  'IEC_62109',
  'IEC_62116',
  'CSA_C22.2',
  'ENERGY_STAR'
] as const;

// Inverter specification validation
export const inverterSpecSchema = z.object({
  // Basic identification
  manufacturer: z.string()
    .min(1, 'Manufacturer is required')
    .max(100, 'Manufacturer name too long'),
  model: z.string()
    .min(1, 'Model is required')
    .max(100, 'Model name too long'),
  partNumber: z.string().optional(),
  
  // Technology and type
  technology: z.enum(Object.keys(INVERTER_TECHNOLOGIES) as [string, ...string[]]),
  phaseConfiguration: z.enum(['single_phase', 'three_phase']),
  
  // Electrical specifications - AC Output
  acOutput: z.object({
    nominalPower: z.number().min(240).max(2000000), // W
    maxPower: z.number().min(240).max(2000000), // W
    voltage: z.union([
      z.literal(120), z.literal(208), z.literal(240),
      z.literal(277), z.literal(480), z.literal(600)
    ]),
    frequency: z.union([z.literal(50), z.literal(60)]), // Hz
    currentTHD: z.number().min(0).max(5), // % Total Harmonic Distortion
    powerFactor: z.number().min(0.95).max(1.0)
  }),
  
  // Electrical specifications - DC Input
  dcInput: z.object({
    maxPower: z.number().min(240).max(2000000), // W
    voltageRange: z.object({
      min: z.number().min(50).max(500),
      max: z.number().min(500).max(1500),
      nominal: z.number().min(200).max(1000)
    }),
    currentRange: z.object({
      max: z.number().min(1).max(50), // A
      startupCurrent: z.number().min(0.1).max(2) // A
    }),
    mpptChannels: z.number().min(1).max(12),
    mpptVoltageRange: z.object({
      min: z.number().min(50).max(300),
      max: z.number().min(400).max(1000)
    })
  }),
  
  // Efficiency and performance
  efficiency: z.object({
    peak: z.number().min(94).max(100), // %
    euro: z.number().min(93).max(100), // % European efficiency
    cec: z.number().min(93).max(100), // % California Energy Commission
    at25Percent: z.number().min(90).max(100), // % at 25% load
    at50Percent: z.number().min(92).max(100), // % at 50% load
    at75Percent: z.number().min(94).max(100), // % at 75% load
    at100Percent: z.number().min(93).max(100) // % at 100% load
  }),
  
  // Environmental specifications
  environmental: z.object({
    operatingTemperature: z.object({
      min: z.number().min(-40).max(-10),
      max: z.number().min(50).max(70),
      derating: z.number().min(40).max(60) // °C when derating starts
    }),
    humidity: z.object({
      max: z.number().min(85).max(100), // % relative humidity
      condensing: z.boolean().default(false)
    }),
    altitude: z.object({
      max: z.number().min(2000).max(4000), // meters
      derating: z.number().min(1000).max(2000) // meters when derating starts
    }),
    ipRating: z.enum(['IP65', 'IP66', 'NEMA_3R', 'NEMA_4']),
    noiseLevel: z.number().min(25).max(55) // dB
  }),
  
  // Safety and protection features
  protection: z.object({
    groundFaultProtection: z.boolean().default(true),
    arcFaultProtection: z.boolean().default(true),
    rapidShutdown: z.boolean().default(true),
    dcDisconnect: z.boolean().default(true),
    acDisconnect: z.boolean().default(true),
    overvoltageProtection: z.boolean().default(true),
    undervoltageProtection: z.boolean().default(true),
    overtemperatureProtection: z.boolean().default(true),
    islanding: z.boolean().default(true)
  }),
  
  // Physical specifications
  physical: z.object({
    dimensions: z.object({
      height: z.number().min(200).max(2000), // mm
      width: z.number().min(300).max(1500), // mm
      depth: z.number().min(150).max(500) // mm
    }),
    weight: z.number().min(5).max(200), // kg
    mounting: z.enum(['wall', 'ground', 'pole', 'rack']),
    cooling: z.enum(['passive', 'active', 'hybrid'])
  }),
  
  // Communication and monitoring
  communication: z.object({
    interfaces: z.array(z.enum([
      'ethernet', 'wifi', 'cellular', 'zigbee', 'powerline', 'rs485'
    ])).min(1),
    protocols: z.array(z.enum([
      'modbus', 'sunspec', 'snmp', 'http', 'mqtt'
    ])).optional(),
    monitoring: z.object({
      builtin: z.boolean().default(true),
      webInterface: z.boolean().default(true),
      mobileApp: z.boolean().default(false)
    })
  }),
  
  // Certifications and compliance
  certifications: z.object({
    required: z.array(z.enum(REQUIRED_INVERTER_CERTIFICATIONS))
      .min(REQUIRED_INVERTER_CERTIFICATIONS.length),
    optional: z.array(z.enum(OPTIONAL_INVERTER_CERTIFICATIONS))
      .optional(),
    gridCodes: z.array(z.string()).optional() // Country-specific grid codes
  }),
  
  // Warranty
  warranty: z.object({
    standard: z.number().min(5).max(25), // years
    extended: z.number().min(10).max(30).optional(), // years
    coverage: z.string().max(500)
  }),
  
  // Financial
  pricing: z.object({
    listPrice: z.number().min(0),
    currency: z.string().length(3).default('USD'),
    pricePerWatt: z.number().min(0.1).max(2.0)
  }).optional()
})
.refine((inverter) => {
  // Validate DC/AC power ratio
  const dcAcRatio = inverter.dcInput.maxPower / inverter.acOutput.nominalPower;
  return dcAcRatio >= 1.0 && dcAcRatio <= 1.5;
}, {
  message: 'DC to AC power ratio must be between 1.0 and 1.5'
})
.refine((inverter) => {
  // Validate efficiency against technology standards
  const tech = INVERTER_TECHNOLOGIES[inverter.technology as keyof typeof INVERTER_TECHNOLOGIES];
  return inverter.efficiency.peak >= tech.minEfficiency;
}, {
  message: 'Peak efficiency is below minimum for this inverter technology'
})
.refine((inverter) => {
  // Validate MPPT channels against technology
  const tech = INVERTER_TECHNOLOGIES[inverter.technology as keyof typeof INVERTER_TECHNOLOGIES];
  const mppt = inverter.dcInput.mpptChannels;
  return mppt >= tech.typicalMPPT.min && mppt <= tech.typicalMPPT.max;
}, {
  message: 'MPPT channel count is outside typical range for this technology'
});

// =====================================================
// BATTERY VALIDATION
// =====================================================

export const BATTERY_TECHNOLOGIES = {
  lithium_ion: {
    energyDensity: { min: 150, max: 300 }, // Wh/kg
    cycleLife: { min: 3000, max: 10000 },
    roundTripEfficiency: { min: 85, max: 98 }, // %
    depthOfDischarge: { min: 80, max: 100 } // %
  },
  lithium_iron_phosphate: {
    energyDensity: { min: 90, max: 160 }, // Wh/kg
    cycleLife: { min: 5000, max: 15000 },
    roundTripEfficiency: { min: 85, max: 96 }, // %
    depthOfDischarge: { min: 95, max: 100 } // %
  },
  lead_acid: {
    energyDensity: { min: 30, max: 50 }, // Wh/kg
    cycleLife: { min: 500, max: 2000 },
    roundTripEfficiency: { min: 75, max: 85 }, // %
    depthOfDischarge: { min: 50, max: 80 } // %
  },
  saltwater: {
    energyDensity: { min: 40, max: 80 }, // Wh/kg
    cycleLife: { min: 5000, max: 20000 },
    roundTripEfficiency: { min: 80, max: 90 }, // %
    depthOfDischarge: { min: 100, max: 100 } // %
  }
} as const;

// Battery specification validation
export const batterySpecSchema = z.object({
  // Basic identification
  manufacturer: z.string()
    .min(1, 'Manufacturer is required')
    .max(100, 'Manufacturer name too long'),
  model: z.string()
    .min(1, 'Model is required')
    .max(100, 'Model name too long'),
  partNumber: z.string().optional(),
  
  // Technology
  technology: z.enum(Object.keys(BATTERY_TECHNOLOGIES) as [string, ...string[]]),
  chemistry: z.string().max(50),
  
  // Electrical specifications
  electrical: z.object({
    nominalVoltage: z.number().min(12).max(1000), // V
    nominalCapacity: z.number().min(1).max(1000), // kWh
    usableCapacity: z.number().min(1).max(1000), // kWh
    maxChargeRate: z.number().min(0.1).max(10), // C-rate
    maxDischargeRate: z.number().min(0.1).max(10), // C-rate
    roundTripEfficiency: z.number().min(70).max(100), // %
    depthOfDischarge: z.number().min(50).max(100), // %
    selfDischargeRate: z.number().min(0).max(10) // %/month
  }),
  
  // Performance characteristics
  performance: z.object({
    cycleLife: z.number().min(500).max(20000),
    expectedLifespan: z.number().min(5).max(25), // years
    warrantyYears: z.number().min(5).max(20),
    warrantyCycles: z.number().min(3000).max(15000),
    calendarLife: z.number().min(10).max(30), // years
    temperatureRange: z.object({
      operating: z.object({
        min: z.number().min(-30).max(0),
        max: z.number().min(40).max(70)
      }),
      storage: z.object({
        min: z.number().min(-40).max(-10),
        max: z.number().min(50).max(80)
      })
    })
  }),
  
  // Safety features
  safety: z.object({
    bms: z.boolean().default(true), // Battery Management System
    thermalProtection: z.boolean().default(true),
    overchargeProtection: z.boolean().default(true),
    overDischargeProtection: z.boolean().default(true),
    shortCircuitProtection: z.boolean().default(true),
    balancing: z.enum(['active', 'passive', 'none']).default('active'),
    fireSafety: z.enum(['UL9540A', 'UN38.3', 'IEC62619']).optional()
  }),
  
  // Physical specifications
  physical: z.object({
    dimensions: z.object({
      height: z.number().min(100).max(2000), // mm
      width: z.number().min(200).max(1500), // mm
      depth: z.number().min(100).max(800) // mm
    }),
    weight: z.number().min(10).max(2000), // kg
    energyDensity: z.number().min(20).max(350), // Wh/kg
    mounting: z.enum(['floor', 'wall', 'rack', 'outdoor_pad']),
    cooling: z.enum(['air', 'liquid', 'passive'])
  }),
  
  // Environmental ratings
  environmental: z.object({
    ipRating: z.enum(['IP54', 'IP65', 'IP66']),
    humidity: z.object({
      max: z.number().min(80).max(95), // % relative humidity
      condensing: z.boolean().default(false)
    }),
    altitude: z.number().min(0).max(3000), // meters
    seismicRating: z.string().optional(),
    floodRating: z.string().optional()
  }),
  
  // Communication and monitoring
  communication: z.object({
    interfaces: z.array(z.enum([
      'ethernet', 'wifi', 'cellular', 'can_bus', 'rs485', 'modbus'
    ])).min(1),
    monitoring: z.object({
      soc: z.boolean().default(true), // State of Charge
      soh: z.boolean().default(true), // State of Health
      cellVoltages: z.boolean().default(true),
      temperatures: z.boolean().default(true),
      alarms: z.boolean().default(true)
    })
  }),
  
  // Certifications
  certifications: z.array(z.enum([
    'UL1973', 'UL9540', 'IEC62619', 'UN38.3', 'IEEE1547', 'FCC_Part_15'
  ])).min(1),
  
  // Modularity and scalability
  scalability: z.object({
    modular: z.boolean().default(false),
    maxParallelUnits: z.number().min(1).max(50).optional(),
    maxSeriesUnits: z.number().min(1).max(20).optional(),
    maxSystemCapacity: z.number().min(1).max(10000).optional() // kWh
  }),
  
  // Financial
  pricing: z.object({
    listPrice: z.number().min(0),
    currency: z.string().length(3).default('USD'),
    pricePerKWh: z.number().min(100).max(2000)
  }).optional()
})
.refine((battery) => {
  // Validate usable capacity against nominal capacity
  const usableRatio = battery.electrical.usableCapacity / battery.electrical.nominalCapacity;
  return usableRatio <= 1.0 && usableRatio >= 0.5;
}, {
  message: 'Usable capacity must be between 50% and 100% of nominal capacity'
})
.refine((battery) => {
  // Validate performance against technology standards
  const tech = BATTERY_TECHNOLOGIES[battery.technology as keyof typeof BATTERY_TECHNOLOGIES];
  return battery.performance.cycleLife >= tech.cycleLife.min &&
         battery.performance.cycleLife <= tech.cycleLife.max;
}, {
  message: 'Cycle life is outside acceptable range for this battery technology'
})
.refine((battery) => {
  // Validate energy density
  const actualDensity = (battery.electrical.nominalCapacity * 1000) / battery.physical.weight; // Wh/kg
  const tech = BATTERY_TECHNOLOGIES[battery.technology as keyof typeof BATTERY_TECHNOLOGIES];
  return actualDensity >= tech.energyDensity.min * 0.8; // Allow 20% tolerance
}, {
  message: 'Energy density is significantly below expected range for this technology'
});

// =====================================================
// MOUNTING SYSTEM VALIDATION
// =====================================================

export const MOUNTING_SYSTEMS = {
  roof_penetrating: {
    roofTypes: ['asphalt_shingle', 'wood_shake', 'tile', 'metal_seam'],
    windLoad: { min: 2400, max: 3600 }, // Pa
    snowLoad: { min: 2400, max: 4800 }, // Pa
    tiltRange: { min: 0, max: 60 } // degrees
  },
  roof_ballasted: {
    roofTypes: ['flat', 'membrane'],
    windLoad: { min: 1800, max: 2400 }, // Pa
    snowLoad: { min: 2400, max: 3600 }, // Pa
    tiltRange: { min: 5, max: 30 } // degrees
  },
  ground_fixed: {
    roofTypes: ['ground'],
    windLoad: { min: 3600, max: 5400 }, // Pa
    snowLoad: { min: 3600, max: 7200 }, // Pa
    tiltRange: { min: 0, max: 90 } // degrees
  },
  ground_tracking: {
    roofTypes: ['ground'],
    windLoad: { min: 2400, max: 4800 }, // Pa
    snowLoad: { min: 1200, max: 2400 }, // Pa (reduced due to tracking)
    tiltRange: { min: 0, max: 60 } // degrees
  },
  carport: {
    roofTypes: ['ground'],
    windLoad: { min: 2400, max: 3600 }, // Pa
    snowLoad: { min: 2400, max: 4800 }, // Pa
    tiltRange: { min: 0, max: 20 } // degrees
  }
} as const;

// Mounting system specification validation
export const mountingSystemSchema = z.object({
  // Basic identification
  manufacturer: z.string()
    .min(1, 'Manufacturer is required')
    .max(100, 'Manufacturer name too long'),
  model: z.string()
    .min(1, 'Model is required')
    .max(100, 'Model name too long'),
  
  // System type and compatibility
  systemType: z.enum(Object.keys(MOUNTING_SYSTEMS) as [string, ...string[]]),
  compatibleRoofTypes: z.array(z.enum([
    'asphalt_shingle', 'wood_shake', 'tile', 'metal_seam', 'flat', 'membrane', 'ground'
  ])).min(1),
  compatiblePanelTypes: z.array(z.enum([
    'framed', 'frameless', 'thin_film'
  ])).min(1),
  
  // Load ratings
  loadRatings: z.object({
    windLoad: z.object({
      uplift: z.number().min(1200).max(7200), // Pa
      lateral: z.number().min(1200).max(5400) // Pa
    }),
    snowLoad: z.number().min(1200).max(7200), // Pa
    deadLoad: z.number().min(200).max(1000), // Pa
    seismicLoad: z.number().min(0.1).max(2.0) // g
  }),
  
  // Geometric constraints
  geometry: z.object({
    tiltRange: z.object({
      min: z.number().min(0).max(30),
      max: z.number().min(10).max(90)
    }),
    azimuthRange: z.object({
      min: z.number().min(90).max(180),
      max: z.number().min(180).max(270)
    }),
    panelSpacing: z.object({
      min: z.number().min(10).max(50), // mm
      recommended: z.number().min(15).max(100) // mm
    }),
    rowSpacing: z.object({
      min: z.number().min(1000).max(3000), // mm
      formula: z.string().optional() // Shading calculation formula
    })
  }),
  
  // Materials and construction
  materials: z.object({
    rails: z.enum(['aluminum', 'stainless_steel', 'galvanized_steel']),
    fasteners: z.enum(['stainless_steel', 'aluminum', 'galvanized_steel']),
    sealants: z.array(z.string()).optional(),
    corrosionResistance: z.enum(['marine_grade', 'standard', 'enhanced'])
  }),
  
  // Installation specifications
  installation: z.object({
    attachmentPoints: z.number().min(4).max(16), // per panel
    penetrationRequired: z.boolean(),
    flashing: z.object({
      required: z.boolean(),
      type: z.enum(['integrated', 'separate', 'sealant_only']).optional()
    }),
    grounding: z.object({
      method: z.enum(['rail_bonding', 'grounding_lugs', 'integrated']),
      required: z.boolean().default(true)
    }),
    tools: z.array(z.string()).optional()
  }),
  
  // Environmental specifications
  environmental: z.object({
    temperatureRange: z.object({
      min: z.number().min(-50).max(-20),
      max: z.number().min(60).max(90)
    }),
    uvResistance: z.boolean().default(true),
    saltSprayResistance: z.boolean().default(false),
    fireRating: z.enum(['Class_A', 'Class_B', 'Class_C']).optional()
  }),
  
  // Certifications and standards
  certifications: z.array(z.enum([
    'UL2703', 'IEC61215', 'ASTM_E1830', 'ICC_ESR', 'Florida_NOA'
  ])).min(1),
  
  // Warranty
  warranty: z.object({
    structural: z.number().min(10).max(25), // years
    weatherproofing: z.number().min(5).max(20), // years
    coverage: z.string().max(500)
  })
})
.refine((mounting) => {
  // Validate load ratings against system type
  const systemSpec = MOUNTING_SYSTEMS[mounting.systemType as keyof typeof MOUNTING_SYSTEMS];
  return mounting.loadRatings.windLoad.uplift >= systemSpec.windLoad.min;
}, {
  message: 'Wind load rating is below minimum for this mounting system type'
})
.refine((mounting) => {
  // Validate tilt range against system type
  const systemSpec = MOUNTING_SYSTEMS[mounting.systemType as keyof typeof MOUNTING_SYSTEMS];
  return mounting.geometry.tiltRange.min >= systemSpec.tiltRange.min &&
         mounting.geometry.tiltRange.max <= systemSpec.tiltRange.max;
}, {
  message: 'Tilt range is outside acceptable range for this mounting system type'
});

// =====================================================
// EQUIPMENT COMPATIBILITY VALIDATION
// =====================================================

// System component compatibility validator
export const systemCompatibilitySchema = z.object({
  panels: z.array(solarPanelSpecSchema).min(1),
  inverter: inverterSpecSchema,
  battery: batterySpecSchema.optional(),
  mounting: mountingSystemSchema,
  
  // System configuration
  configuration: z.object({
    panelsPerString: z.number().min(1).max(30),
    stringsPerInverter: z.number().min(1).max(20),
    totalPanels: z.number().min(1).max(1000),
    systemVoltage: z.number().min(12).max(1500)
  })
})
.refine((system) => {
  // Validate panel-inverter voltage compatibility
  const panel = system.panels[0]; // Assuming all panels are the same
  const stringVoltage = panel.stc.voltage * system.configuration.panelsPerString;
  const inverterMinVoltage = system.inverter.dcInput.voltageRange.min;
  const inverterMaxVoltage = system.inverter.dcInput.voltageRange.max;
  
  return stringVoltage >= inverterMinVoltage && stringVoltage <= inverterMaxVoltage;
}, {
  message: 'Panel string voltage is outside inverter input voltage range'
})
.refine((system) => {
  // Validate power compatibility
  const panel = system.panels[0];
  const totalPanelPower = panel.nominalPower * system.configuration.totalPanels;
  const inverterMaxPower = system.inverter.dcInput.maxPower;
  
  // Allow 1.3x oversizing
  return totalPanelPower <= inverterMaxPower * 1.3;
}, {
  message: 'Total panel power exceeds inverter maximum DC input power (including 1.3x oversizing limit)'
});

// Export type definitions
export type SolarPanelSpec = z.infer<typeof solarPanelSpecSchema>;
export type InverterSpec = z.infer<typeof inverterSpecSchema>;
export type BatterySpec = z.infer<typeof batterySpecSchema>;
export type MountingSystemSpec = z.infer<typeof mountingSystemSchema>;
export type SystemCompatibility = z.infer<typeof systemCompatibilitySchema>;
