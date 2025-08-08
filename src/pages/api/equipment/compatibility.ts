/**
 * Equipment Compatibility API Endpoint
 * System compatibility analysis and validation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { 
  CompatibilityMatchingEngine, 
  SystemConfiguration,
  CompatibilityResult
} from '@/lib/solar/compatibility-matching-engine';
import { z } from 'zod';

// Validation schema for compatibility check request
const compatibilityRequestSchema = z.object({
  system: z.object({
    panels: z.array(z.any()).min(1),
    inverter: z.any(),
    battery: z.any().optional(),
    racking: z.any().optional(),
    mounting: z.array(z.any()).optional(),
    electrical: z.array(z.any()).optional(),
    monitoring: z.array(z.any()).optional(),
    layout: z.object({
      panelsPerString: z.number().min(1).max(30),
      stringsPerInverter: z.number().min(1).max(20),
      totalPanels: z.number().min(1).max(1000),
      systemVoltage: z.number().min(12).max(1500),
      totalCapacity: z.number().min(0.1).max(10000)
    }),
    installation: z.object({
      roofType: z.string(),
      roofPitch: z.number().min(0).max(90),
      azimuth: z.number().min(0).max(360),
      tilt: z.number().min(0).max(90),
      shading: z.enum(['none', 'minimal', 'moderate', 'significant']),
      location: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        climate: z.string(),
        windZone: z.number().min(1).max(5),
        snowLoad: z.number().min(0)
      })
    })
  }),
  options: z.object({
    includeRecommendations: z.boolean().default(true),
    includeAlternatives: z.boolean().default(false),
    detailedAnalysis: z.boolean().default(false)
  }).optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request data
    const validatedRequest = compatibilityRequestSchema.parse(req.body);
    const { system, options = {} } = validatedRequest;

    // Perform compatibility analysis
    const compatibilityResult = CompatibilityMatchingEngine.analyzeSystemCompatibility(
      system as SystemConfiguration
    );

    // Generate additional analysis if requested
    let additionalAnalysis = {};
    if (options.detailedAnalysis) {
      additionalAnalysis = await generateDetailedAnalysis(system as SystemConfiguration);
    }

    // Generate alternatives if requested
    let alternatives = [];
    if (options.includeAlternatives) {
      alternatives = await generateAlternativeConfigurations(system as SystemConfiguration);
    }

    // Return comprehensive compatibility report
    res.status(200).json({
      success: true,
      data: {
        compatibility: compatibilityResult,
        ...additionalAnalysis,
        alternatives: options.includeAlternatives ? alternatives : undefined,
        systemSummary: generateSystemSummary(system as SystemConfiguration),
        analysis: {
          electricalValidation: await validateElectricalCompatibility(system as SystemConfiguration),
          physicalValidation: await validatePhysicalCompatibility(system as SystemConfiguration),
          performanceAnalysis: await analyzeSystemPerformance(system as SystemConfiguration),
          complianceCheck: await checkRegulatoryCompliance(system as SystemConfiguration)
        }
      },
      timestamp: new Date().toISOString(),
      version: '1.0'
    });

  } catch (error) {
    console.error('Compatibility analysis error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate detailed technical analysis
 */
async function generateDetailedAnalysis(system: SystemConfiguration) {
  const panel = system.panels[0];
  const { inverter, layout } = system;

  // Calculate detailed electrical parameters
  const stringVoltage = (panel.stc?.voltage || 0) * layout.panelsPerString;
  const stringCurrent = panel.stc?.current || 0;
  const totalPower = (panel.wattage || 0) * layout.totalPanels;
  const dcAcRatio = totalPower / (inverter.capacity || 1);

  // Temperature analysis
  const minTemperatureVoltage = stringVoltage * (1 + (panel.temperatureCoefficient || -0.3) * (-10 - 25) / 100);
  const maxTemperatureVoltage = stringVoltage * (1 + (panel.temperatureCoefficient || -0.3) * (70 - 25) / 100);

  return {
    electricalAnalysis: {
      stringConfiguration: {
        voltage: stringVoltage,
        current: stringCurrent,
        power: (panel.wattage || 0) * layout.panelsPerString
      },
      temperatureEffects: {
        minOperatingVoltage: minTemperatureVoltage,
        maxOperatingVoltage: maxTemperatureVoltage,
        temperatureCoefficient: panel.temperatureCoefficient
      },
      systemRatios: {
        dcAcRatio,
        oversizingFactor: dcAcRatio > 1 ? dcAcRatio : 1,
        inverterUtilization: Math.min(100, (totalPower / (inverter.capacity || 1)) * 100)
      }
    },
    performanceEstimation: {
      estimatedAnnualProduction: calculateEstimatedProduction(system),
      systemEfficiency: calculateSystemEfficiency(system),
      degradationRate: panel.temperatureCoefficient ? Math.abs(panel.temperatureCoefficient) : 0.5,
      expectedLifetime: panel.warranty?.performance || 25
    }
  };
}

/**
 * Generate alternative system configurations
 */
async function generateAlternativeConfigurations(system: SystemConfiguration) {
  // This would implement logic to suggest alternative configurations
  // that address compatibility issues or improve performance
  
  return [
    {
      type: 'optimized_string_configuration',
      description: 'Adjusted string configuration for better voltage matching',
      changes: {
        panelsPerString: 12,
        reason: 'Better inverter voltage matching'
      },
      impact: {
        compatibility: 95,
        performance: 102,
        cost: 100
      }
    },
    {
      type: 'alternative_inverter',
      description: 'Alternative inverter with better compatibility',
      changes: {
        inverterId: 'alternative-inverter-123',
        reason: 'Better power handling and efficiency'
      },
      impact: {
        compatibility: 100,
        performance: 105,
        cost: 103
      }
    }
  ];
}

/**
 * Generate system summary
 */
function generateSystemSummary(system: SystemConfiguration) {
  const panel = system.panels[0];
  
  return {
    systemSize: system.layout.totalCapacity,
    panelCount: system.layout.totalPanels,
    panelModel: `${panel.manufacturer} ${panel.model}`,
    inverterModel: `${system.inverter.manufacturer} ${system.inverter.model}`,
    estimatedCost: calculateSystemCost(system),
    keySpecifications: {
      totalDCPower: (panel.wattage || 0) * system.layout.totalPanels,
      inverterACPower: system.inverter.capacity,
      systemVoltage: system.layout.systemVoltage,
      panelEfficiency: panel.efficiency,
      inverterEfficiency: system.inverter.efficiency?.cec || system.inverter.efficiency?.peak
    }
  };
}

/**
 * Validate electrical compatibility
 */
async function validateElectricalCompatibility(system: SystemConfiguration) {
  const issues = [];
  const warnings = [];
  
  const panel = system.panels[0];
  const stringVoltage = (panel.stc?.voltage || 0) * system.layout.panelsPerString;
  const inverterMinV = system.inverter.dcInput?.voltageRange?.min || 0;
  const inverterMaxV = system.inverter.dcInput?.voltageRange?.max || 1500;
  
  // Voltage range check
  if (stringVoltage < inverterMinV) {
    issues.push({
      type: 'voltage_too_low',
      severity: 'critical',
      message: `String voltage (${stringVoltage}V) below inverter minimum (${inverterMinV}V)`
    });
  }
  
  if (stringVoltage > inverterMaxV) {
    issues.push({
      type: 'voltage_too_high',
      severity: 'critical',
      message: `String voltage (${stringVoltage}V) exceeds inverter maximum (${inverterMaxV}V)`
    });
  }
  
  // Power compatibility check
  const totalPower = (panel.wattage || 0) * system.layout.totalPanels;
  const inverterPower = system.inverter.capacity || 0;
  const oversizing = totalPower / inverterPower;
  
  if (oversizing > 1.5) {
    warnings.push({
      type: 'high_oversizing',
      severity: 'medium',
      message: `High DC/AC ratio (${oversizing.toFixed(2)}) may cause power clipping`
    });
  }
  
  return {
    passed: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
    warnings,
    summary: {
      voltageCompatible: stringVoltage >= inverterMinV && stringVoltage <= inverterMaxV,
      powerCompatible: oversizing <= 1.5,
      overallScore: issues.length === 0 ? (warnings.length === 0 ? 100 : 85) : 60
    }
  };
}

/**
 * Validate physical compatibility
 */
async function validatePhysicalCompatibility(system: SystemConfiguration) {
  const issues = [];
  const warnings = [];
  
  // Check panel-racking compatibility
  if (system.racking) {
    const panel = system.panels[0];
    const racking = system.racking;
    
    const panelLength = panel.dimensions?.length || 0;
    const panelWidth = panel.dimensions?.width || 0;
    
    if (panelLength < racking.compatibility.panelSizes.min.length ||
        panelLength > racking.compatibility.panelSizes.max.length) {
      issues.push({
        type: 'panel_size_incompatible',
        severity: 'high',
        message: 'Panel length outside racking system compatibility range'
      });
    }
  }
  
  // Check roof type compatibility
  if (system.racking && !system.racking.compatibility.roofTypes.includes(system.installation.roofType)) {
    issues.push({
      type: 'roof_type_incompatible',
      severity: 'critical',
      message: `Racking system not compatible with ${system.installation.roofType} roof`
    });
  }
  
  return {
    passed: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
    warnings,
    summary: {
      dimensionCompatible: issues.filter(i => i.type === 'panel_size_incompatible').length === 0,
      roofCompatible: issues.filter(i => i.type === 'roof_type_incompatible').length === 0,
      overallScore: issues.length === 0 ? 100 : 70
    }
  };
}

/**
 * Analyze system performance
 */
async function analyzeSystemPerformance(system: SystemConfiguration) {
  const panel = system.panels[0];
  const location = system.installation.location;
  
  // Calculate performance factors
  const azimuthFactor = calculateAzimuthFactor(system.installation.azimuth, location.latitude);
  const tiltFactor = calculateTiltFactor(system.installation.tilt, location.latitude);
  const shadingFactor = getShadingFactor(system.installation.shading);
  
  const overallPerformanceFactor = azimuthFactor * tiltFactor * shadingFactor;
  const estimatedProduction = calculateEstimatedProduction(system) * overallPerformanceFactor;
  
  return {
    performanceFactors: {
      azimuth: azimuthFactor,
      tilt: tiltFactor,
      shading: shadingFactor,
      overall: overallPerformanceFactor
    },
    estimatedAnnualProduction: estimatedProduction,
    performanceRatio: overallPerformanceFactor,
    optimizationSuggestions: generateOptimizationSuggestions(system, {
      azimuthFactor,
      tiltFactor,
      shadingFactor
    })
  };
}

/**
 * Check regulatory compliance
 */
async function checkRegulatoryCompliance(system: SystemConfiguration) {
  const issues = [];
  const warnings = [];
  
  const panel = system.panels[0];
  const inverter = system.inverter;
  
  // Check required certifications
  const requiredPanelCerts = ['IEC 61215', 'IEC 61730', 'UL 1703'];
  const panelCerts = panel.certifications || [];
  
  for (const cert of requiredPanelCerts) {
    if (!panelCerts.some(c => c.includes(cert.replace(/\s/g, '')))) {
      issues.push({
        type: 'missing_certification',
        severity: 'high',
        component: 'panel',
        certification: cert,
        message: `Panel missing required certification: ${cert}`
      });
    }
  }
  
  const requiredInverterCerts = ['UL 1741', 'IEEE 1547'];
  const inverterCerts = inverter.certifications || [];
  
  for (const cert of requiredInverterCerts) {
    if (!inverterCerts.some(c => c.includes(cert.replace(/\s/g, '')))) {
      issues.push({
        type: 'missing_certification',
        severity: 'critical',
        component: 'inverter',
        certification: cert,
        message: `Inverter missing required certification: ${cert}`
      });
    }
  }
  
  return {
    compliant: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
    warnings,
    certificationSummary: {
      panelCertifications: panelCerts,
      inverterCertifications: inverterCerts,
      missingCertifications: issues.filter(i => i.type === 'missing_certification')
        .map(i => `${i.component}: ${i.certification}`)
    }
  };
}

// Helper functions
function calculateEstimatedProduction(system: SystemConfiguration): number {
  // Simplified production calculation
  const totalPower = (system.panels[0].wattage || 0) * system.layout.totalPanels;
  const averageSunHours = 5; // Simplified - would use location-specific data
  return totalPower * averageSunHours * 365 / 1000; // kWh/year
}

function calculateSystemEfficiency(system: SystemConfiguration): number {
  const panelEfficiency = system.panels[0].efficiency || 20;
  const inverterEfficiency = system.inverter.efficiency?.cec || system.inverter.efficiency?.peak || 97;
  return panelEfficiency * (inverterEfficiency / 100);
}

function calculateSystemCost(system: SystemConfiguration): number {
  const panelCost = (system.panels[0].pricePerWatt || 0.5) * (system.panels[0].wattage || 0) * system.layout.totalPanels;
  const inverterCost = (system.inverter.pricePerWatt || 0.3) * (system.inverter.capacity || 0);
  return panelCost + inverterCost;
}

function calculateAzimuthFactor(azimuth: number, latitude: number): number {
  const optimalAzimuth = latitude > 0 ? 180 : 0;
  const deviation = Math.abs(azimuth - optimalAzimuth);
  return Math.max(0.8, 1 - (deviation / 180) * 0.2);
}

function calculateTiltFactor(tilt: number, latitude: number): number {
  const optimalTilt = Math.abs(latitude);
  const deviation = Math.abs(tilt - optimalTilt);
  return Math.max(0.85, 1 - (deviation / 90) * 0.15);
}

function getShadingFactor(shading: string): number {
  const factors = {
    'none': 1.0,
    'minimal': 0.95,
    'moderate': 0.85,
    'significant': 0.7
  };
  return factors[shading as keyof typeof factors] || 1.0;
}

function generateOptimizationSuggestions(
  system: SystemConfiguration, 
  factors: { azimuthFactor: number; tiltFactor: number; shadingFactor: number }
): string[] {
  const suggestions = [];
  
  if (factors.azimuthFactor < 0.95) {
    suggestions.push('Consider adjusting panel azimuth closer to south-facing for optimal production');
  }
  
  if (factors.tiltFactor < 0.95) {
    const optimalTilt = Math.abs(system.installation.location.latitude);
    suggestions.push(`Consider adjusting tilt angle closer to ${optimalTilt}° for optimal annual production`);
  }
  
  if (factors.shadingFactor < 0.9) {
    suggestions.push('Consider microinverters or power optimizers to mitigate shading losses');
  }
  
  return suggestions;
}