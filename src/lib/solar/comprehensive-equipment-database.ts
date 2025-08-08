/**
 * Comprehensive Solar Equipment Database
 * Enhanced database covering all solar system components including mounting hardware,
 * electrical components, monitoring devices, and safety equipment.
 */

import { SolarPanel, Inverter, BatteryStorage } from './solar-database';

// =====================================================
// MOUNTING HARDWARE AND RACKING SYSTEMS
// =====================================================

export interface MountingHardware {
  id: string;
  manufacturer: string;
  model: string;
  category: 'rail_system' | 'clamp' | 'end_cap' | 'splice' | 'grounding' | 'flashing' | 'hardware_kit';
  
  // Compatibility
  compatibility: {
    panelTypes: ('framed' | 'frameless' | 'thin_film')[];
    panelThickness: { min: number; max: number }; // mm
    frameWidth: { min: number; max: number }; // mm
    roofTypes: string[];
  };
  
  // Material specifications
  materials: {
    primary: 'aluminum' | 'stainless_steel' | 'galvanized_steel' | 'composite';
    coating?: 'anodized' | 'powder_coated' | 'galvanized' | 'marine_grade';
    corrosionResistance: 'standard' | 'enhanced' | 'marine_grade';
  };
  
  // Physical properties
  physical: {
    dimensions?: { length: number; width: number; thickness: number }; // mm
    weight: number; // kg or g
    color?: string;
  };
  
  // Load ratings
  loadRatings: {
    windLoad?: number; // Pa
    snowLoad?: number; // Pa
    safeWorkingLoad?: number; // N
  };
  
  // Environmental specifications
  environmental: {
    temperatureRange: { min: number; max: number }; // °C
    uvResistance: boolean;
    saltSprayResistance: boolean;
  };
  
  // Installation specifications
  installation: {
    torqueSpecs?: { min: number; max: number }; // N⋅m
    toolsRequired: string[];
    installationTime?: number; // minutes per unit
  };
  
  // Certifications and compliance
  certifications: string[];
  
  // Warranty
  warranty: {
    years: number;
    coverage: string;
  };
  
  // Pricing and availability
  pricing: {
    listPrice: number;
    currency: string;
    pricePerUnit: number;
    quantityBreaks?: { quantity: number; price: number }[];
  };
  availability: 'in-stock' | 'limited' | 'discontinued' | 'pre-order';
  leadTime?: number; // days
}

export interface RackingSystem {
  id: string;
  manufacturer: string;
  model: string;
  systemType: 'penetrating' | 'ballasted' | 'ground_mount' | 'tracking' | 'carport' | 'canopy';
  
  // System specifications
  specifications: {
    panelOrientation: 'portrait' | 'landscape' | 'both';
    maxPanelsPerRow: number;
    maxRows: number;
    tiltRange: { min: number; max: number }; // degrees
    azimuthRange?: { min: number; max: number }; // degrees
  };
  
  // Compatibility
  compatibility: {
    panelSizes: { min: { length: number; width: number }; max: { length: number; width: number } }; // mm
    panelWeight: { min: number; max: number }; // kg
    roofTypes: string[];
    roofPitch: { min: number; max: number }; // degrees
  };
  
  // Load ratings
  loadRatings: {
    windLoad: { uplift: number; lateral: number }; // Pa
    snowLoad: number; // Pa
    deadLoad: number; // Pa
    seismicLoad?: number; // g
  };
  
  // Materials and construction
  construction: {
    railMaterial: 'aluminum' | 'steel';
    railProfile: string;
    fasteners: 'stainless_steel' | 'galvanized_steel' | 'aluminum';
    sealingMethod: 'flashing' | 'sealant' | 'membrane' | 'integrated';
  };
  
  // Installation requirements
  installation: {
    penetrationRequired: boolean;
    attachmentPoints: number; // per panel
    spacingRequirements: {
      panelGap: number; // mm
      rowSpacing: number; // mm
      edgeSetback: number; // mm
    };
    foundationRequirements?: string;
    grounding: {
      method: 'rail_bonding' | 'grounding_lugs' | 'integrated';
      bondingRequired: boolean;
    };
  };
  
  // Components included
  components: {
    rails: boolean;
    clamps: boolean;
    endCaps: boolean;
    splices: boolean;
    flashing: boolean;
    hardwareKit: boolean;
    grounding: boolean;
  };
  
  // Certifications
  certifications: string[];
  
  // Environmental ratings
  environmental: {
    temperatureRange: { min: number; max: number }; // °C
    corrosionResistance: string;
    fireRating?: string;
  };
  
  // Warranty and support
  warranty: {
    structural: number; // years
    weatherproofing: number; // years
    coverage: string;
  };
  
  // Pricing
  pricing: {
    pricePerPanel: number;
    pricePerKW: number;
    currency: string;
    installationCost?: number; // per panel
  };
  availability: 'in-stock' | 'limited' | 'discontinued';
}

// =====================================================
// ELECTRICAL COMPONENTS AND SAFETY EQUIPMENT
// =====================================================

export interface ElectricalComponent {
  id: string;
  manufacturer: string;
  model: string;
  category: 'combiner_box' | 'dc_disconnect' | 'ac_disconnect' | 'production_meter' | 'monitoring_ct' | 'surge_protector' | 'fusing' | 'breaker' | 'conduit' | 'wire' | 'connector';
  
  // Electrical specifications
  electrical: {
    voltage: { min: number; max: number }; // V
    current: { min: number; max: number }; // A
    power?: { min: number; max: number }; // W
    frequency?: number; // Hz
    phases?: number;
  };
  
  // Physical specifications
  physical: {
    dimensions: { height: number; width: number; depth: number }; // mm
    weight: number; // kg
    mounting: 'wall' | 'din_rail' | 'panel' | 'conduit' | 'free_standing';
  };
  
  // Environmental specifications
  environmental: {
    ipRating: string;
    temperatureRange: { min: number; max: number }; // °C
    humidity: { max: number }; // %
    altitude?: { max: number }; // m
  };
  
  // Safety features
  safety: {
    arcFaultProtection?: boolean;
    groundFaultProtection?: boolean;
    overcurrentProtection?: boolean;
    shortCircuitRating?: number; // A
    interruptingCapacity?: number; // A
  };
  
  // Connectivity
  connectivity: {
    inputConnections: number;
    outputConnections: number;
    connectionType: 'screw_terminal' | 'spring_clamp' | 'mc4' | 'anderson' | 'ring_terminal';
    wireGauge: { min: number; max: number }; // AWG
  };
  
  // Standards and certifications
  certifications: string[];
  
  // Installation requirements
  installation: {
    clearanceRequirements: { top: number; bottom: number; sides: number }; // mm
    toolsRequired: string[];
    torqueSpecs?: { min: number; max: number }; // N⋅m
  };
  
  // Monitoring capabilities
  monitoring?: {
    communicationProtocol?: string[];
    measuredParameters?: string[];
    dataLogging?: boolean;
    remoteMonitoring?: boolean;
  };
  
  // Warranty
  warranty: {
    years: number;
    coverage: string;
  };
  
  // Pricing
  pricing: {
    listPrice: number;
    currency: string;
    quantityBreaks?: { quantity: number; price: number }[];
  };
  availability: 'in-stock' | 'limited' | 'discontinued';
}

// =====================================================
// MONITORING AND OPTIMIZATION DEVICES
// =====================================================

export interface MonitoringDevice {
  id: string;
  manufacturer: string;
  model: string;
  category: 'system_monitor' | 'panel_optimizer' | 'string_monitor' | 'environmental_sensor' | 'gateway' | 'data_logger' | 'display' | 'mobile_app';
  
  // Monitoring capabilities
  monitoring: {
    parameters: string[];
    accuracy: { [key: string]: number }; // percentage
    resolution: { [key: string]: number };
    sampleRate: { min: number; max: number }; // seconds
    dataRetention: number; // days
  };
  
  // Communication specifications
  communication: {
    protocols: ('ethernet' | 'wifi' | 'cellular' | 'zigbee' | 'powerline' | 'rs485' | 'can_bus')[];
    range?: number; // meters for wireless
    maxDevices?: number; // devices that can be monitored
    cloudConnectivity: boolean;
  };
  
  // Power requirements
  power: {
    source: 'dc_system' | 'ac_grid' | 'battery' | 'solar' | 'poe';
    consumption: number; // W
    voltage: { min: number; max: number }; // V
  };
  
  // Physical specifications
  physical: {
    dimensions: { height: number; width: number; depth: number }; // mm
    weight: number; // kg
    mounting: 'din_rail' | 'wall' | 'panel' | 'outdoor_enclosure';
    display?: {
      type: 'lcd' | 'led' | 'oled';
      size: number; // inches
      resolution?: string;
    };
  };
  
  // Environmental specifications
  environmental: {
    operatingTemperature: { min: number; max: number }; // °C
    humidity: { max: number }; // %
    ipRating: string;
    uvResistance?: boolean;
  };
  
  // Software features
  software: {
    webInterface: boolean;
    mobileApp: boolean;
    apiAccess: boolean;
    dataExport: string[]; // formats: csv, json, xml, etc.
    alerting: {
      email: boolean;
      sms: boolean;
      push: boolean;
      thresholds: boolean;
    };
    analytics: {
      performanceAnalysis: boolean;
      faultDetection: boolean;
      predictiveMaintenance: boolean;
      benchmarking: boolean;
    };
  };
  
  // Integration capabilities
  integration: {
    inverterCompatibility: string[]; // inverter brands/models
    thirdPartyPlatforms: string[];
    apiEndpoints?: string[];
    webhookSupport?: boolean;
  };
  
  // Installation requirements
  installation: {
    professionalRequired: boolean;
    commissioning: boolean;
    networkSetup: boolean;
    calibration: boolean;
  };
  
  // Certifications
  certifications: string[];
  
  // Subscription and licensing
  subscription?: {
    required: boolean;
    plans: { name: string; price: number; features: string[] }[];
  };
  
  // Warranty and support
  warranty: {
    hardware: number; // years
    software: number; // years
    support: string;
  };
  
  // Pricing
  pricing: {
    hardwarePrice: number;
    installationPrice?: number;
    subscriptionPrice?: number; // per month
    currency: string;
  };
  availability: 'in-stock' | 'limited' | 'discontinued';
}

// =====================================================
// PERFORMANCE CURVES AND EFFICIENCY DATA
// =====================================================

export interface PerformanceCurve {
  equipmentId: string;
  equipmentType: 'panel' | 'inverter' | 'battery' | 'optimizer';
  curveType: 'power_temperature' | 'power_irradiance' | 'efficiency_load' | 'capacity_cycles';
  
  dataPoints: {
    x: number; // input parameter (temperature, irradiance, load percentage, etc.)
    y: number; // output parameter (power, efficiency, capacity, etc.)
  }[];
  
  conditions: {
    temperature?: number; // °C
    irradiance?: number; // W/m²
    windSpeed?: number; // m/s
    spectralConditions?: string;
  };
  
  metadata: {
    testStandard: string;
    testDate: Date;
    testLab: string;
    uncertainty: number; // percentage
  };
}

// =====================================================
// EQUIPMENT DATABASE SAMPLES
// =====================================================

export const MOUNTING_HARDWARE_SAMPLES: MountingHardware[] = [
  {
    id: 'ironridge-xr-rail-168',
    manufacturer: 'IronRidge',
    model: 'XR Rail 168" Clear',
    category: 'rail_system',
    compatibility: {
      panelTypes: ['framed'],
      panelThickness: { min: 32, max: 50 },
      frameWidth: { min: 30, max: 50 },
      roofTypes: ['asphalt_shingle', 'tile', 'metal']
    },
    materials: {
      primary: 'aluminum',
      coating: 'anodized',
      corrosionResistance: 'marine_grade'
    },
    physical: {
      dimensions: { length: 4267, width: 31.8, thickness: 31.8 },
      weight: 3.2,
      color: 'Clear Anodized'
    },
    loadRatings: {
      windLoad: 3600,
      snowLoad: 5400
    },
    environmental: {
      temperatureRange: { min: -40, max: 85 },
      uvResistance: true,
      saltSprayResistance: true
    },
    installation: {
      torqueSpecs: { min: 16, max: 20 },
      toolsRequired: ['drill', 'socket_wrench', 'measuring_tape'],
      installationTime: 5
    },
    certifications: ['UL2703', 'ICC-ESR-3451'],
    warranty: {
      years: 25,
      coverage: 'Material defects and structural integrity'
    },
    pricing: {
      listPrice: 89.99,
      currency: 'USD',
      pricePerUnit: 89.99,
      quantityBreaks: [
        { quantity: 10, price: 85.49 },
        { quantity: 50, price: 80.99 },
        { quantity: 100, price: 76.49 }
      ]
    },
    availability: 'in-stock',
    leadTime: 3
  },
  {
    id: 'unirac-solarmount-clamp-endcap',
    manufacturer: 'Unirac',
    model: 'SolarMount End Cap Clamp',
    category: 'clamp',
    compatibility: {
      panelTypes: ['framed'],
      panelThickness: { min: 30, max: 50 },
      frameWidth: { min: 32, max: 46 },
      roofTypes: ['all']
    },
    materials: {
      primary: 'aluminum',
      coating: 'anodized',
      corrosionResistance: 'standard'
    },
    physical: {
      dimensions: { length: 76, width: 50, thickness: 35 },
      weight: 0.15,
      color: 'Mill Finish'
    },
    environmental: {
      temperatureRange: { min: -40, max: 85 },
      uvResistance: true,
      saltSprayResistance: false
    },
    installation: {
      torqueSpecs: { min: 14, max: 18 },
      toolsRequired: ['socket_wrench'],
      installationTime: 1
    },
    certifications: ['UL2703'],
    warranty: {
      years: 25,
      coverage: 'Material defects'
    },
    pricing: {
      listPrice: 4.99,
      currency: 'USD',
      pricePerUnit: 4.99,
      quantityBreaks: [
        { quantity: 100, price: 4.49 },
        { quantity: 500, price: 3.99 },
        { quantity: 1000, price: 3.49 }
      ]
    },
    availability: 'in-stock'
  }
];

export const RACKING_SYSTEMS_SAMPLES: RackingSystem[] = [
  {
    id: 'ironridge-xr1000-pitched-roof',
    manufacturer: 'IronRidge',
    model: 'XR1000 Pitched Roof System',
    systemType: 'penetrating',
    specifications: {
      panelOrientation: 'both',
      maxPanelsPerRow: 15,
      maxRows: 10,
      tiltRange: { min: 15, max: 60 }
    },
    compatibility: {
      panelSizes: { 
        min: { length: 1500, width: 800 }, 
        max: { length: 2200, width: 1200 }
      },
      panelWeight: { min: 15, max: 35 },
      roofTypes: ['asphalt_shingle', 'wood_shake', 'tile', 'metal_seam'],
      roofPitch: { min: 15, max: 60 }
    },
    loadRatings: {
      windLoad: { uplift: 3600, lateral: 2400 },
      snowLoad: 5400,
      deadLoad: 1200,
      seismicLoad: 1.0
    },
    construction: {
      railMaterial: 'aluminum',
      railProfile: 'XR Rail',
      fasteners: 'stainless_steel',
      sealingMethod: 'flashing'
    },
    installation: {
      penetrationRequired: true,
      attachmentPoints: 4,
      spacingRequirements: {
        panelGap: 10,
        rowSpacing: 2000,
        edgeSetback: 914
      },
      grounding: {
        method: 'rail_bonding',
        bondingRequired: true
      }
    },
    components: {
      rails: true,
      clamps: true,
      endCaps: true,
      splices: true,
      flashing: true,
      hardwareKit: true,
      grounding: true
    },
    certifications: ['UL2703', 'ICC-ESR-3451', 'TUV'],
    environmental: {
      temperatureRange: { min: -40, max: 85 },
      corrosionResistance: 'Marine Grade',
      fireRating: 'Class A'
    },
    warranty: {
      structural: 25,
      weatherproofing: 10,
      coverage: 'Complete system warranty including weatherproofing'
    },
    pricing: {
      pricePerPanel: 45.00,
      pricePerKW: 180.00,
      currency: 'USD',
      installationCost: 25.00
    },
    availability: 'in-stock'
  }
];

export const ELECTRICAL_COMPONENTS_SAMPLES: ElectricalComponent[] = [
  {
    id: 'midnite-solar-mnpv6-combiner',
    manufacturer: 'MidNite Solar',
    model: 'MNPV6 Combiner Box',
    category: 'combiner_box',
    electrical: {
      voltage: { min: 0, max: 600 },
      current: { min: 0, max: 60 },
      phases: 1
    },
    physical: {
      dimensions: { height: 305, width: 229, depth: 152 },
      weight: 3.2,
      mounting: 'wall'
    },
    environmental: {
      ipRating: 'IP65',
      temperatureRange: { min: -40, max: 75 },
      humidity: { max: 95 }
    },
    safety: {
      arcFaultProtection: false,
      groundFaultProtection: true,
      overcurrentProtection: true,
      shortCircuitRating: 10000,
      interruptingCapacity: 10000
    },
    connectivity: {
      inputConnections: 6,
      outputConnections: 1,
      connectionType: 'screw_terminal',
      wireGauge: { min: 14, max: 2 }
    },
    certifications: ['UL1741', 'NEC690'],
    installation: {
      clearanceRequirements: { top: 152, bottom: 152, sides: 76 },
      toolsRequired: ['screwdriver', 'wire_strippers'],
      torqueSpecs: { min: 35, max: 40 }
    },
    warranty: {
      years: 5,
      coverage: 'Manufacturing defects'
    },
    pricing: {
      listPrice: 199.99,
      currency: 'USD'
    },
    availability: 'in-stock'
  }
];

export const MONITORING_DEVICES_SAMPLES: MonitoringDevice[] = [
  {
    id: 'solaredge-se1000-monitoring',
    manufacturer: 'SolarEdge',
    model: 'SE1000 SetApp Portal',
    category: 'system_monitor',
    monitoring: {
      parameters: ['power_production', 'energy_yield', 'panel_performance', 'system_efficiency', 'environmental_data'],
      accuracy: { power: 2, energy: 1 },
      resolution: { power: 1, energy: 0.1 },
      sampleRate: { min: 15, max: 900 },
      dataRetention: 3650
    },
    communication: {
      protocols: ['ethernet', 'wifi', 'cellular'],
      range: 50,
      maxDevices: 1000,
      cloudConnectivity: true
    },
    power: {
      source: 'ac_grid',
      consumption: 5,
      voltage: { min: 100, max: 240 }
    },
    physical: {
      dimensions: { height: 165, width: 124, depth: 35 },
      weight: 0.5,
      mounting: 'wall'
    },
    environmental: {
      operatingTemperature: { min: -25, max: 60 },
      humidity: { max: 95 },
      ipRating: 'IP54'
    },
    software: {
      webInterface: true,
      mobileApp: true,
      apiAccess: true,
      dataExport: ['csv', 'json', 'xml'],
      alerting: {
        email: true,
        sms: true,
        push: true,
        thresholds: true
      },
      analytics: {
        performanceAnalysis: true,
        faultDetection: true,
        predictiveMaintenance: true,
        benchmarking: true
      }
    },
    integration: {
      inverterCompatibility: ['SolarEdge', 'ABB', 'Fronius'],
      thirdPartyPlatforms: ['PVLib', 'SolarAnywhere', 'Energy Toolbase'],
      apiEndpoints: ['monitoring.solaredge.com/solaredge-web/p/api'],
      webhookSupport: true
    },
    installation: {
      professionalRequired: false,
      commissioning: true,
      networkSetup: true,
      calibration: false
    },
    certifications: ['FCC', 'CE', 'IC'],
    subscription: {
      required: false,
      plans: [
        { name: 'Basic', price: 0, features: ['basic_monitoring', 'mobile_app'] },
        { name: 'Professional', price: 9.99, features: ['advanced_analytics', 'api_access', 'custom_reports'] }
      ]
    },
    warranty: {
      hardware: 5,
      software: 1,
      support: 'Email and phone support'
    },
    pricing: {
      hardwarePrice: 299.99,
      installationPrice: 100.00,
      currency: 'USD'
    },
    availability: 'in-stock'
  }
];

export const PERFORMANCE_CURVES_SAMPLES: PerformanceCurve[] = [
  {
    equipmentId: 'rec-alpha-pure-405',
    equipmentType: 'panel',
    curveType: 'power_temperature',
    dataPoints: [
      { x: -10, y: 440.6 },
      { x: 0, y: 431.1 },
      { x: 10, y: 421.6 },
      { x: 25, y: 405.0 },
      { x: 40, y: 388.4 },
      { x: 50, y: 378.9 },
      { x: 60, y: 369.4 },
      { x: 70, y: 359.9 }
    ],
    conditions: {
      irradiance: 1000,
      windSpeed: 0,
      spectralConditions: 'AM1.5'
    },
    metadata: {
      testStandard: 'IEC 61215',
      testDate: new Date('2024-01-15'),
      testLab: 'TUV Rheinland',
      uncertainty: 3.0
    }
  }
];