/**
 * Solar Installation Data Validation Layer
 * 
 * Comprehensive validation for site assessment, structural requirements,
 * electrical code compliance, permit requirements, and quality control.
 * 
 * Based on:
 * - National Electrical Code (NEC) Articles 690, 705, 706
 * - International Building Code (IBC)
 * - ASCE 7 (Minimum Design Loads for Buildings)
 * - NFPA 70 (National Electrical Code)
 * - Local Authority Having Jurisdiction (AHJ) requirements
 */

import { z } from 'zod';

// =====================================================
// SITE ASSESSMENT VALIDATION
// =====================================================

// Building code requirements
export const BUILDING_CODE_REQUIREMENTS = {
  // Fire safety setbacks (NEC 690.12)
  fireSetbacks: {
    residential: {
      ridge: 3, // feet from ridge
      eave: 3, // feet from eave
      edge: 3, // feet from edge
      hip: 3, // feet from hip
      valley: 3 // feet from valley
    },
    commercial: {
      ridge: 3,
      eave: 3,
      edge: 3,
      hip: 3,
      valley: 3,
      walkway: 3 // feet for walkway
    }
  },
  // Structural requirements
  structural: {
    minRoofAge: 5, // years - roof should be relatively new
    maxRoofAge: 40, // years - roof too old needs replacement
    minSlopeForDrainage: 0.25, // inches per foot
    maxWindLoad: 180, // mph design wind speed
    minSnowLoad: 20, // psf design snow load
    maxSnowLoad: 150 // psf design snow load
  }
} as const;

// Site assessment validation
export const siteAssessmentSchema = z.object({
  // Property information
  propertyInfo: z.object({
    propertyType: z.enum(['residential', 'commercial', 'industrial', 'agricultural']),
    buildingType: z.enum(['single_family', 'multi_family', 'office', 'retail', 'warehouse', 'manufacturing']),
    yearBuilt: z.number().int().min(1900).max(new Date().getFullYear()),
    occupancyType: z.enum(['owner_occupied', 'rental', 'commercial_use']),
    assessorParcelNumber: z.string().max(50).optional()
  }),
  
  // Location and climate
  location: z.object({
    address: z.object({
      street: z.string().min(1).max(100),
      city: z.string().min(1).max(50),
      state: z.string().length(2),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      county: z.string().max(50)
    }),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      elevation: z.number().min(-500).max(15000) // feet above sea level
    }),
    climateZone: z.enum(['1A', '2A', '2B', '3A', '3B', '3C', '4A', '4B', '4C', '5A', '5B', '6A', '6B', '7', '8']),
    windZone: z.enum(['I', 'II', 'III', 'IV']),
    seismicZone: z.enum(['A', 'B', 'C', 'D0', 'D1', 'D2']),
    iceLoadZone: z.enum(['none', 'light', 'moderate', 'heavy'])
  }),
  
  // Roof assessment
  roofAssessment: z.object({
    roofType: z.enum(['gable', 'hip', 'shed', 'mansard', 'gambrel', 'flat', 'complex']),
    roofMaterial: z.enum(['asphalt_shingle', 'wood_shake', 'clay_tile', 'concrete_tile', 'metal_seam', 'metal_panel', 'membrane', 'built_up']),
    roofAge: z.number().int().min(0).max(100), // years
    roofCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
    structuralIntegrity: z.enum(['excellent', 'good', 'adequate', 'questionable', 'inadequate']),
    
    // Roof dimensions and geometry
    dimensions: z.object({
      totalArea: z.number().min(100).max(50000), // sq ft
      usableArea: z.number().min(50).max(50000), // sq ft available for solar
      slope: z.number().min(0).max(45), // degrees
      azimuth: z.number().min(0).max(360), // degrees from north
      complexityFactor: z.number().min(1).max(5) // 1=simple, 5=very complex
    }),
    
    // Obstructions and features
    obstructions: z.array(z.object({
      type: z.enum(['chimney', 'vent', 'skylight', 'dormer', 'antenna', 'hvac_unit', 'tree', 'building', 'utility_line']),
      dimensions: z.object({
        length: z.number().min(0).max(100), // feet
        width: z.number().min(0).max(100), // feet
        height: z.number().min(0).max(50) // feet above roof
      }),
      location: z.object({
        x: z.number(), // feet from reference point
        y: z.number() // feet from reference point
      }),
      shadowImpact: z.enum(['none', 'minimal', 'moderate', 'significant'])
    })).default([]),
    
    // Structural considerations
    structural: z.object({
      rafterSpacing: z.number().min(12).max(48), // inches on center
      rafterSize: z.string().max(20), // e.g., "2x8", "2x10"
      decking: z.enum(['plywood', 'osb', 'tongue_groove', 'skip_sheathing']),
      deckingThickness: z.number().min(0.375).max(2), // inches
      loadCapacity: z.number().min(10).max(200), // psf additional load capacity
      reinforcementNeeded: z.boolean().default(false)
    })
  }),
  
  // Electrical assessment
  electricalAssessment: z.object({
    mainPanel: z.object({
      amperage: z.number().min(60).max(4000), // amps
      voltage: z.union([z.literal(120), z.literal(240), z.literal(480)]),
      phases: z.enum(['single', 'three']),
      type: z.enum(['breaker', 'fuse', 'disconnect']),
      manufacturer: z.string().max(50),
      age: z.number().int().min(0).max(100), // years
      condition: z.enum(['excellent', 'good', 'fair', 'poor']),
      availableSpace: z.number().int().min(0).max(42) // number of available slots
    }),
    
    serviceConnection: z.object({
      utilityConnection: z.enum(['overhead', 'underground']),
      serviceSize: z.number().min(60).max(4000), // amps
      meterLocation: z.enum(['exterior', 'interior', 'detached']),
      groundingSystem: z.enum(['adequate', 'upgrade_required']),
      existingGECs: z.boolean() // Grounding Electrode Conductors
    }),
    
    existingWiring: z.object({
      wiringType: z.enum(['romex', 'conduit', 'knob_tube', 'aluminum']),
      condition: z.enum(['excellent', 'good', 'fair', 'poor']),
      codeCompliance: z.enum(['current', 'grandfathered', 'upgrade_required'])
    })
  }),
  
  // Site access and logistics
  siteAccess: z.object({
    accessRating: z.enum(['easy', 'moderate', 'difficult', 'very_difficult']),
    drivewayWidth: z.number().min(8).max(50), // feet
    gateHeight: z.number().min(6).max(20).optional(), // feet
    overheadClearance: z.number().min(8).max(30), // feet
    equipmentStagingArea: z.object({
      available: z.boolean(),
      size: z.number().min(100).max(10000) // sq ft
    }),
    craneTruckAccess: z.boolean(),
    specialEquipmentRequired: z.array(z.enum([
      'crane', 'boom_lift', 'scaffolding', 'ladder_hoist', 'helicopter'
    ])).default([])
  }),
  
  // Environmental factors
  environmentalFactors: z.object({
    shadingAnalysis: z.object({
      annualShadingLoss: z.number().min(0).max(100), // %
      criticalShadingHours: z.array(z.number().int().min(0).max(23)), // hours of day
      shadingSources: z.array(z.enum([
        'trees', 'buildings', 'terrain', 'power_lines', 'other_structures'
      ])).default([])
    }),
    soilConditions: z.object({
      soilType: z.enum(['clay', 'sand', 'loam', 'rock', 'mixed']).optional(),
      drainageRating: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      frostDepth: z.number().min(0).max(120).optional() // inches
    }).optional(),
    wildFireRisk: z.enum(['low', 'moderate', 'high', 'extreme']).optional(),
    floodZone: z.string().max(10).optional(), // FEMA flood zone designation
    saltAirExposure: z.enum(['none', 'low', 'moderate', 'high']).optional()
  })
})
.refine((assessment) => {
  // Validate roof age is reasonable for solar installation
  return assessment.roofAssessment.roofAge <= BUILDING_CODE_REQUIREMENTS.structural.maxRoofAge;
}, {
  message: 'Roof is too old and should be replaced before solar installation'
})
.refine((assessment) => {
  // Validate usable area doesn't exceed total area
  return assessment.roofAssessment.dimensions.usableArea <= assessment.roofAssessment.dimensions.totalArea;
}, {
  message: 'Usable roof area cannot exceed total roof area'
})
.refine((assessment) => {
  // Validate electrical panel has adequate capacity
  const panelAmps = assessment.electricalAssessment.mainPanel.amperage;
  const serviceAmps = assessment.electricalAssessment.serviceConnection.serviceSize;
  return panelAmps <= serviceAmps;
}, {
  message: 'Main panel amperage cannot exceed service connection size'
});

// =====================================================
// STRUCTURAL REQUIREMENTS VALIDATION
// =====================================================

// Structural engineering analysis
export const structuralAnalysisSchema = z.object({
  // Load calculations
  loadCalculations: z.object({
    // Dead loads
    deadLoads: z.object({
      roofDeadLoad: z.number().min(10).max(50), // psf existing roof
      solarSystemDeadLoad: z.number().min(2).max(8), // psf solar system
      additionalDeadLoad: z.number().min(0).max(20), // psf other equipment
      totalDeadLoad: z.number().min(12).max(78) // psf total
    }),
    
    // Live loads
    liveLoads: z.object({
      roofLiveLoad: z.number().min(20).max(40), // psf code required
      maintenanceLoad: z.number().min(25).max(40), // psf for maintenance access
      snowLoad: z.number().min(0).max(150) // psf design snow load
    }),
    
    // Wind loads (ASCE 7)
    windLoads: z.object({
      basicWindSpeed: z.number().min(85).max(200), // mph 3-second gust
      exposureCategory: z.enum(['B', 'C', 'D']),
      topographicFactor: z.number().min(1.0).max(1.3),
      windPressures: z.object({
        uplift: z.number().min(-80).max(-10), // psf (negative = uplift)
        positive: z.number().min(10).max(80) // psf downward
      })
    }),
    
    // Seismic loads
    seismicLoads: z.object({
      designSpectralAcceleration: z.number().min(0).max(2.0), // g
      seismicDesignCategory: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
      seismicForce: z.number().min(0).max(50) // psf horizontal
    })
  }),
  
  // Structural capacity
  structuralCapacity: z.object({
    existingCapacity: z.object({
      deadLoadCapacity: z.number().min(20).max(150), // psf
      liveLoadCapacity: z.number().min(20).max(150), // psf
      totalCapacity: z.number().min(40).max(250), // psf
      safetyFactor: z.number().min(1.5).max(3.0) // factor of safety
    }),
    
    utilization: z.object({
      deadLoadUtilization: z.number().min(0.2).max(1.0), // ratio
      liveLoadUtilization: z.number().min(0.2).max(1.0), // ratio
      combinedUtilization: z.number().min(0.4).max(1.0) // ratio
    }),
    
    reinforcement: z.object({
      reinforcementRequired: z.boolean(),
      reinforcementType: z.enum(['none', 'additional_framing', 'structural_upgrade', 'foundation_work']).optional(),
      reinforcementCost: z.number().min(0).max(50000).optional() // $
    })
  }),
  
  // Connection design
  connectionDesign: z.object({
    attachmentMethod: z.enum(['lag_screw', 'through_bolt', 'structural_screw', 'clamp']),
    penetrations: z.object({
      numberOfPenetrations: z.number().int().min(4).max(200),
      penetrationSize: z.number().min(0.25).max(1.0), // inches diameter
      sealingMethod: z.enum(['flashing', 'sealant', 'gasket', 'membrane']),
      flashing: z.object({
        material: z.enum(['aluminum', 'stainless_steel', 'copper', 'EPDM']),
        sealant: z.string().max(50)
      })
    }),
    connectionCapacity: z.object({
      tensileStrength: z.number().min(500).max(5000), // lbs per connection
      shearStrength: z.number().min(300).max(3000), // lbs per connection
      safetyFactor: z.number().min(2.0).max(4.0)
    })
  }),
  
  // Engineering certification
  engineeringCertification: z.object({
    structuralEngineerRequired: z.boolean(),
    engineerName: z.string().max(100).optional(),
    engineerLicense: z.string().max(50).optional(),
    stamped: z.boolean().default(false),
    calculationsProvided: z.boolean().default(false)
  })
})
.refine((structural) => {
  // Validate load utilization doesn't exceed capacity
  return structural.structuralCapacity.utilization.combinedUtilization <= 1.0;
}, {
  message: 'Combined load utilization exceeds structural capacity'
})
.refine((structural) => {
  // Validate safety factors are adequate
  return structural.structuralCapacity.existingCapacity.safetyFactor >= 1.5;
}, {
  message: 'Safety factor is below minimum required value'
});

// =====================================================
// ELECTRICAL CODE COMPLIANCE
// =====================================================

// NEC compliance validation
export const necComplianceSchema = z.object({
  // Article 690 - Solar Photovoltaic Systems
  article690Compliance: z.object({
    // 690.4 General Requirements
    generalRequirements: z.object({
      listedEquipment: z.boolean().default(true),
      identifiedForUse: z.boolean().default(true),
      installationInstructions: z.boolean().default(true)
    }),
    
    // 690.7 Maximum System Voltage
    systemVoltage: z.object({
      dcSystemVoltage: z.number().min(12).max(1500), // V
      systemType: z.enum(['residential', 'non_residential']),
      voltageCompliant: z.boolean().default(true)
    }),
    
    // 690.8 Circuit Sizing and Current
    circuitSizing: z.object({
      continuousCurrentFactor: z.number().min(1.25).max(1.25), // Must be 125%
      moduleRatedCurrent: z.number().min(1).max(20), // A
      stringCurrent: z.number().min(1).max(25), // A with 125% factor
      overcurrentProtectionRating: z.number().min(15).max(50) // A
    }),
    
    // 690.12 Rapid Shutdown
    rapidShutdown: z.object({
      compliant: z.boolean().default(true),
      method: z.enum(['module_level', 'string_level', 'inverter_controlled']),
      voltageReduction: z.object({
        timeLimit: z.number().max(30), // seconds
        voltageLimit: z.number().max(30), // V within 10 feet
        currentLimit: z.number().max(2) // A
      })
    }),
    
    // 690.15 Disconnecting Means
    disconnectingMeans: z.object({
      dcDisconnectRequired: z.boolean().default(true),
      dcDisconnectLocation: z.enum(['array', 'inverter', 'ac_disconnect']),
      acDisconnectRequired: z.boolean().default(true),
      acDisconnectLocation: z.enum(['inverter', 'service_panel', 'separate_enclosure']),
      readilyAccessible: z.boolean().default(true),
      lockableOpen: z.boolean().default(true)
    })
  }),
  
  // Article 705 - Interconnected Electric Power Production Sources
  article705Compliance: z.object({
    // 705.12 Point of Interconnection
    interconnection: z.object({
      interconnectionMethod: z.enum(['supply_side', 'load_side']),
      servicePanelRating: z.number().min(100).max(4000), // A
      inverterOutputRating: z.number().min(15).max(800), // A
      busbarRating: z.number().min(100).max(4000), // A
      the120PercentRule: z.object({
        applicable: z.boolean(),
        compliant: z.boolean().default(true),
        calculation: z.number().min(0).max(1.2) // ratio
      })
    }),
    
    // 705.22 Disconnect Device
    disconnectDevice: z.object({
      required: z.boolean().default(true),
      type: z.enum(['switch', 'circuit_breaker']),
      location: z.enum(['readily_accessible', 'accessible']),
      marking: z.boolean().default(true)
    })
  }),
  
  // Grounding and bonding (Article 250)
  groundingBonding: z.object({
    systemGrounding: z.object({
      method: z.enum(['grounded', 'ungrounded']),
      groundingElectrode: z.enum(['existing', 'supplemental']),
      groundingConductorSize: z.enum(['8_AWG', '6_AWG', '4_AWG', '2_AWG']),
      bondingJumpers: z.boolean().default(true)
    }),
    equipmentGrounding: z.object({
      equipmentGroundingConductor: z.boolean().default(true),
      conductorSize: z.enum(['12_AWG', '10_AWG', '8_AWG', '6_AWG']),
      bondingLugs: z.boolean().default(true),
      continuousGrounding: z.boolean().default(true)
    })
  }),
  
  // Wiring methods (Chapter 3)
  wiringMethods: z.object({
    dcWiring: z.object({
      wiringMethod: z.enum(['MC_cable', 'USE_cable', 'conduit_THWN']),
      insulation: z.enum(['USE', 'USE-2', 'RHW-2', 'XHHW-2']),
      temperatureRating: z.number().min(90).max(200), // °C
      ampacity: z.number().min(15).max(400) // A
    }),
    acWiring: z.object({
      wiringMethod: z.enum(['romex', 'MC_cable', 'conduit_THWN']),
      conduitFill: z.number().min(0.1).max(0.4), // ratio
      conductorSize: z.enum(['12_AWG', '10_AWG', '8_AWG', '6_AWG', '4_AWG'])
    })
  })
})
.refine((nec) => {
  // Validate 120% rule for load-side connections
  if (nec.article705Compliance.interconnection.interconnectionMethod === 'load_side' &&
      nec.article705Compliance.interconnection.the120PercentRule.applicable) {
    return nec.article705Compliance.interconnection.the120PercentRule.compliant;
  }
  return true;
}, {
  message: '120% rule must be satisfied for load-side interconnections'
})
.refine((nec) => {
  // Validate continuous current factor is exactly 125%
  return nec.article690Compliance.circuitSizing.continuousCurrentFactor === 1.25;
}, {
  message: 'Continuous current factor must be exactly 125% per NEC 690.8'
});

// =====================================================
// PERMIT REQUIREMENTS
// =====================================================

// Permit and inspection validation
export const permitRequirementsSchema = z.object({
  // Jurisdiction information
  jurisdiction: z.object({
    ahj: z.string().max(100), // Authority Having Jurisdiction
    permitOffice: z.string().max(100),
    inspectionDepartment: z.string().max(100),
    specialRequirements: z.array(z.string()).default([])
  }),
  
  // Required permits
  requiredPermits: z.object({
    buildingPermit: z.object({
      required: z.boolean().default(true),
      permitNumber: z.string().max(50).optional(),
      applicationFee: z.number().min(0).max(2000), // $
      issuedDate: z.date().optional(),
      expirationDate: z.date().optional()
    }),
    electricalPermit: z.object({
      required: z.boolean().default(true),
      permitNumber: z.string().max(50).optional(),
      applicationFee: z.number().min(0).max(1000), // $
      issuedDate: z.date().optional(),
      expirationDate: z.date().optional()
    }),
    structuralPermit: z.object({
      required: z.boolean(),
      permitNumber: z.string().max(50).optional(),
      applicationFee: z.number().min(0).max(1500).optional(), // $
      issuedDate: z.date().optional(),
      expirationDate: z.date().optional()
    }),
    firePermit: z.object({
      required: z.boolean(),
      permitNumber: z.string().max(50).optional(),
      applicationFee: z.number().min(0).max(500).optional() // $
    }),
    utilityPermit: z.object({
      required: z.boolean().default(true),
      applicationSubmitted: z.boolean().default(false),
      approvalReceived: z.boolean().default(false),
      interconnectionAgreement: z.boolean().default(false)
    })
  }),
  
  // Required documentation
  requiredDocumentation: z.object({
    sitePhotos: z.boolean().default(false),
    systemPhotos: z.boolean().default(false),
    singleLineDiagram: z.boolean().default(false),
    electricalSchematic: z.boolean().default(false),
    layoutDrawing: z.boolean().default(false),
    specSheets: z.boolean().default(false),
    structuralCalculations: z.boolean().default(false),
    shadingAnalysis: z.boolean().default(false),
    energyProduction: z.boolean().default(false),
    interconnectionApplication: z.boolean().default(false)
  }),
  
  // Required inspections
  requiredInspections: z.array(z.object({
    type: z.enum(['electrical_rough', 'structural', 'electrical_final', 'building_final', 'utility']),
    inspector: z.string().max(100),
    scheduled: z.boolean().default(false),
    scheduledDate: z.date().optional(),
    completed: z.boolean().default(false),
    completedDate: z.date().optional(),
    passed: z.boolean().optional(),
    notes: z.string().max(500).optional()
  })),
  
  // Special requirements
  specialRequirements: z.object({
    historicDistrict: z.boolean().default(false),
    hoa: z.object({
      required: z.boolean().default(false),
      approvalReceived: z.boolean().default(false),
      conditions: z.array(z.string()).default([])
    }),
    wetlands: z.boolean().default(false),
    coastalZone: z.boolean().default(false),
    airportProximity: z.boolean().default(false),
    environmentalReview: z.boolean().default(false)
  })
});

// =====================================================
// QUALITY CONTROL VALIDATION
// =====================================================

// Installation quality control
export const installationQualitySchema = z.object({
  // Pre-installation checks
  preInstallation: z.object({
    sitePreparation: z.object({
      roofCleaned: z.boolean().default(false),
      obstaclesRemoved: z.boolean().default(false),
      accessPrepared: z.boolean().default(false),
      safetyEquipment: z.boolean().default(false)
    }),
    equipmentInspection: z.object({
      panelsInspected: z.boolean().default(false),
      invertersInspected: z.boolean().default(false),
      mountingInspected: z.boolean().default(false),
      wiringInspected: z.boolean().default(false),
      damageDocumented: z.boolean().default(false)
    }),
    measurementsVerified: z.object({
      layoutMarked: z.boolean().default(false),
      setbacksVerified: z.boolean().default(false),
      structuralPointsMarked: z.boolean().default(false)
    })
  }),
  
  // Installation process checks
  installationProcess: z.object({
    mountingSystem: z.object({
      attachmentPointsLocated: z.boolean().default(false),
      penetrationsSealed: z.boolean().default(false),
      torqueSpecificationsMet: z.boolean().default(false),
      alignmentChecked: z.boolean().default(false),
      flashingInstalled: z.boolean().default(false)
    }),
    panelInstallation: z.object({
      panelsSecured: z.boolean().default(false),
      spacingCorrect: z.boolean().default(false),
      orientationCorrect: z.boolean().default(false),
      damagePrevented: z.boolean().default(false)
    }),
    electricalInstallation: z.object({
      dcWiringCorrect: z.boolean().default(false),
      acWiringCorrect: z.boolean().default(false),
      groundingComplete: z.boolean().default(false),
      labelingComplete: z.boolean().default(false),
      disconnectsInstalled: z.boolean().default(false)
    })
  }),
  
  // Post-installation testing
  postInstallation: z.object({
    systemTesting: z.object({
      continuityTesting: z.object({
        completed: z.boolean().default(false),
        allCircuitsPass: z.boolean().default(false),
        results: z.string().max(200).optional()
      }),
      insulationTesting: z.object({
        completed: z.boolean().default(false),
        testVoltage: z.number().min(250).max(1000).optional(), // V
        resistance: z.number().min(1).max(1000).optional(), // MΩ
        passed: z.boolean().default(false)
      }),
      groundingTesting: z.object({
        completed: z.boolean().default(false),
        resistance: z.number().min(0).max(25).optional(), // Ω
        passed: z.boolean().default(false)
      }),
      functionalTesting: z.object({
        systemStartup: z.boolean().default(false),
        powerProduction: z.boolean().default(false),
        monitoring: z.boolean().default(false),
        shutdownTesting: z.boolean().default(false)
      })
    }),
    
    performanceTesting: z.object({
      initialProduction: z.number().min(0).max(50000).optional(), // W
      expectedProduction: z.number().min(0).max(50000).optional(), // W
      performanceRatio: z.number().min(0.5).max(1.2).optional(),
      irradianceAtTest: z.number().min(200).max(1500).optional() // W/m²
    })
  }),
  
  // Documentation and handoff
  documentation: z.object({
    asBuiltDrawings: z.boolean().default(false),
    testResults: z.boolean().default(false),
    warrantyDocuments: z.boolean().default(false),
    operationManual: z.boolean().default(false),
    monitoringSetup: z.boolean().default(false),
    customerTraining: z.boolean().default(false)
  }),
  
  // Quality score
  qualityScore: z.object({
    overallScore: z.number().min(0).max(100), // % quality score
    criteriaScores: z.object({
      safety: z.number().min(0).max(100),
      workmanship: z.number().min(0).max(100),
      compliance: z.number().min(0).max(100),
      performance: z.number().min(0).max(100),
      documentation: z.number().min(0).max(100)
    }),
    deficiencies: z.array(z.object({
      category: z.string().max(50),
      description: z.string().max(200),
      severity: z.enum(['minor', 'major', 'critical']),
      corrected: z.boolean().default(false)
    })).default([])
  })
})
.refine((quality) => {
  // All critical deficiencies must be corrected
  const criticalDeficiencies = quality.qualityScore.deficiencies.filter(
    d => d.severity === 'critical' && !d.corrected
  );
  return criticalDeficiencies.length === 0;
}, {
  message: 'All critical deficiencies must be corrected before completion'
})
.refine((quality) => {
  // Quality score should reflect actual completion status
  const completionChecks = [
    quality.preInstallation.sitePreparation.roofCleaned,
    quality.installationProcess.mountingSystem.attachmentPointsLocated,
    quality.postInstallation.systemTesting.functionalTesting.systemStartup,
    quality.documentation.asBuiltDrawings
  ];
  const completionRate = completionChecks.filter(Boolean).length / completionChecks.length;
  return Math.abs(quality.qualityScore.overallScore / 100 - completionRate) <= 0.2;
}, {
  message: 'Quality score should align with actual completion status'
});

// Export type definitions
export type SiteAssessment = z.infer<typeof siteAssessmentSchema>;
export type StructuralAnalysis = z.infer<typeof structuralAnalysisSchema>;
export type NECCompliance = z.infer<typeof necComplianceSchema>;
export type PermitRequirements = z.infer<typeof permitRequirementsSchema>;
export type InstallationQuality = z.infer<typeof installationQualitySchema>;
