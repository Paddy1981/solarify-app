/**
 * Solar Calculation Utilities
 * 
 * Utility functions for common solar industry calculations including
 * system sizing, energy production estimates, financial analysis,
 * and performance metrics.
 */

// =====================================================
// SOLAR SYSTEM SIZING CALCULATIONS
// =====================================================

/**
 * Calculate system size based on energy needs and solar resource
 */
export function calculateSystemSize(params: {
  annualEnergyNeeds: number; // kWh/year
  solarResource: number; // kWh/m²/year or kWh/kW/year
  systemEfficiency?: number; // % (default: 80%)
  safetyFactor?: number; // multiplier (default: 1.1)
}): {
  systemSizeKW: number;
  recommendedPanelCount: number;
  estimatedRoofArea: number; // sq ft
} {
  const efficiency = params.systemEfficiency || 80;
  const safetyFactor = params.safetyFactor || 1.1;
  
  // Calculate required DC system size
  const systemSizeKW = (params.annualEnergyNeeds * safetyFactor) / 
    (params.solarResource * (efficiency / 100));
  
  // Estimate panel count (assuming 400W panels)
  const recommendedPanelCount = Math.ceil(systemSizeKW * 1000 / 400);
  
  // Estimate roof area needed (assuming 20 sq ft per panel)
  const estimatedRoofArea = recommendedPanelCount * 20;
  
  return {
    systemSizeKW: Math.round(systemSizeKW * 100) / 100,
    recommendedPanelCount,
    estimatedRoofArea
  };
}

/**
 * Calculate optimal panel count and string configuration
 */
export function calculateStringConfiguration(params: {
  totalSystemSizeKW: number;
  panelWattage: number; // W
  panelVoltage: number; // V
  inverterVoltageRange: { min: number; max: number };
  inverterMPPTChannels: number;
}): {
  totalPanels: number;
  panelsPerString: number;
  stringsPerInverter: number;
  totalStrings: number;
  stringVoltage: number;
  dcAcRatio: number;
} {
  const totalPanels = Math.round((params.totalSystemSizeKW * 1000) / params.panelWattage);
  
  // Calculate optimal panels per string
  const maxPanelsPerString = Math.floor(params.inverterVoltageRange.max / params.panelVoltage);
  const minPanelsPerString = Math.ceil(params.inverterVoltageRange.min / params.panelVoltage);
  
  // Use a value in the middle of the range for optimal performance
  const panelsPerString = Math.floor((maxPanelsPerString + minPanelsPerString) / 2);
  
  const totalStrings = Math.ceil(totalPanels / panelsPerString);
  const stringsPerInverter = Math.min(totalStrings, params.inverterMPPTChannels);
  const stringVoltage = panelsPerString * params.panelVoltage;
  
  // Calculate DC/AC ratio
  const totalDCPower = totalPanels * params.panelWattage;
  const dcAcRatio = totalDCPower / (params.totalSystemSizeKW * 1000);
  
  return {
    totalPanels,
    panelsPerString,
    stringsPerInverter,
    totalStrings,
    stringVoltage,
    dcAcRatio: Math.round(dcAcRatio * 100) / 100
  };
}

/**
 * Calculate system losses and overall efficiency
 */
export function calculateSystemEfficiency(losses: {
  panelEfficiency: number; // %
  inverterEfficiency: number; // %
  dcWiring: number; // % loss
  acWiring: number; // % loss
  shading: number; // % loss
  soiling: number; // % loss
  mismatch: number; // % loss
  temperature: number; // % loss
  availability: number; // % loss
}): {
  overallEfficiency: number; // %
  totalLosses: number; // %
  lossBreakdown: Record<string, number>;
} {
  const lossFactors = {
    panelEfficiency: losses.panelEfficiency / 100,
    inverterEfficiency: losses.inverterEfficiency / 100,
    dcWiring: (100 - losses.dcWiring) / 100,
    acWiring: (100 - losses.acWiring) / 100,
    shading: (100 - losses.shading) / 100,
    soiling: (100 - losses.soiling) / 100,
    mismatch: (100 - losses.mismatch) / 100,
    temperature: (100 - losses.temperature) / 100,
    availability: (100 - losses.availability) / 100
  };
  
  const overallEfficiency = Object.values(lossFactors).reduce((acc, factor) => acc * factor, 1) * 100;
  const totalLosses = 100 - overallEfficiency;
  
  return {
    overallEfficiency: Math.round(overallEfficiency * 100) / 100,
    totalLosses: Math.round(totalLosses * 100) / 100,
    lossBreakdown: {
      dcWiring: losses.dcWiring,
      acWiring: losses.acWiring,
      shading: losses.shading,
      soiling: losses.soiling,
      mismatch: losses.mismatch,
      temperature: losses.temperature,
      availability: losses.availability
    }
  };
}

// =====================================================
// ENERGY PRODUCTION CALCULATIONS
// =====================================================

/**
 * Calculate annual energy production
 */
export function calculateAnnualProduction(params: {
  systemSizeDC: number; // kW
  solarResource: number; // kWh/m²/year or specific yield kWh/kW/year
  systemEfficiency: number; // %
  degradationRate?: number; // %/year (default: 0.5)
  year?: number; // year of operation (default: 1)
}): {
  firstYearProduction: number; // kWh
  adjustedProduction: number; // kWh for specified year
  degradationAdjustment: number; // %
} {
  const degradationRate = params.degradationRate || 0.5;
  const year = params.year || 1;
  
  const firstYearProduction = params.systemSizeDC * params.solarResource * (params.systemEfficiency / 100);
  
  // Apply degradation for multi-year calculations
  const degradationAdjustment = Math.pow((100 - degradationRate) / 100, year - 1);
  const adjustedProduction = firstYearProduction * degradationAdjustment;
  
  return {
    firstYearProduction: Math.round(firstYearProduction),
    adjustedProduction: Math.round(adjustedProduction),
    degradationAdjustment: Math.round(degradationAdjustment * 10000) / 100 // Convert to percentage
  };
}

/**
 * Calculate monthly energy production
 */
export function calculateMonthlyProduction(params: {
  annualProduction: number; // kWh
  monthlyIrradianceProfile: number[]; // 12 months of relative irradiance (0-1)
  temperatureAdjustments?: number[]; // 12 months of temperature coefficients (optional)
}): {
  monthlyProduction: number[]; // kWh for each month
  monthlyPercentages: number[]; // % of annual production
} {
  const temperatureAdjustments = params.temperatureAdjustments || new Array(12).fill(1);
  
  // Calculate total weighted irradiance
  const totalWeightedIrradiance = params.monthlyIrradianceProfile.reduce(
    (sum, irr, index) => sum + (irr * temperatureAdjustments[index]), 0
  );
  
  const monthlyProduction = params.monthlyIrradianceProfile.map((irradiance, index) => {
    const adjustedIrradiance = irradiance * temperatureAdjustments[index];
    return Math.round(params.annualProduction * (adjustedIrradiance / totalWeightedIrradiance));
  });
  
  const monthlyPercentages = monthlyProduction.map(production => 
    Math.round((production / params.annualProduction) * 10000) / 100
  );
  
  return {
    monthlyProduction,
    monthlyPercentages
  };
}

/**
 * Calculate performance ratio
 */
export function calculatePerformanceRatio(params: {
  actualProduction: number; // kWh
  theoreticalProduction: number; // kWh
  irradiance: number; // kWh/m²
  referenceIrradiance?: number; // kWh/m² (default: 1000 W/m² = 1 kWh/m²/hour)
}): {
  performanceRatio: number;
  normalizedPerformanceRatio: number;
  performanceIndex: number;
} {
  const referenceIrradiance = params.referenceIrradiance || 1;
  
  const performanceRatio = params.actualProduction / params.theoreticalProduction;
  const normalizedPerformanceRatio = performanceRatio * (referenceIrradiance / params.irradiance);
  const performanceIndex = performanceRatio * 100;
  
  return {
    performanceRatio: Math.round(performanceRatio * 10000) / 10000,
    normalizedPerformanceRatio: Math.round(normalizedPerformanceRatio * 10000) / 10000,
    performanceIndex: Math.round(performanceIndex * 100) / 100
  };
}

// =====================================================
// SHADING AND TILT CALCULATIONS
// =====================================================

/**
 * Calculate optimal tilt angle for maximum annual production
 */
export function calculateOptimalTilt(latitude: number): {
  optimalTilt: number; // degrees
  summerTilt: number; // degrees
  winterTilt: number; // degrees
} {
  // Rule of thumb: optimal tilt ≈ latitude
  const optimalTilt = Math.abs(latitude);
  
  // Seasonal adjustments
  const summerTilt = Math.max(0, Math.abs(latitude) - 15);
  const winterTilt = Math.min(90, Math.abs(latitude) + 15);
  
  return {
    optimalTilt: Math.round(optimalTilt),
    summerTilt: Math.round(summerTilt),
    winterTilt: Math.round(winterTilt)
  };
}

/**
 * Calculate shading losses from nearby objects
 */
export function calculateShadingLoss(params: {
  obstacleHeight: number; // feet
  obstacleDistance: number; // feet
  systemTilt: number; // degrees
  latitude: number; // degrees
  timeOfYear?: 'winter' | 'summer' | 'average'; // default: average
}): {
  shadingLoss: number; // % annual production loss
  criticalHours: number[]; // hours of day when shading occurs
  shadowLength: number; // feet
} {
  const timeOfYear = params.timeOfYear || 'average';
  
  // Simplified shadow length calculation
  const sunAngle = timeOfYear === 'winter' ? 
    Math.max(25, 65 - Math.abs(params.latitude)) :
    timeOfYear === 'summer' ?
    Math.min(75, 65 + Math.abs(params.latitude)) :
    65; // average sun angle
  
  const shadowLength = params.obstacleHeight / Math.tan(sunAngle * Math.PI / 180);
  
  // Calculate shading loss based on distance
  let shadingLoss = 0;
  if (params.obstacleDistance < shadowLength) {
    const shadingRatio = (shadowLength - params.obstacleDistance) / shadowLength;
    shadingLoss = Math.min(50, shadingRatio * 30); // Max 50% loss, scale factor 30
  }
  
  // Determine critical hours (simplified)
  const criticalHours: number[] = [];
  if (shadingLoss > 0) {
    const morningHours = timeOfYear === 'winter' ? 4 : 2;
    for (let i = 0; i < morningHours; i++) {
      criticalHours.push(8 + i);
    }
  }
  
  return {
    shadingLoss: Math.round(shadingLoss * 100) / 100,
    criticalHours,
    shadowLength: Math.round(shadowLength)
  };
}

// =====================================================
// TEMPERATURE AND ENVIRONMENTAL CALCULATIONS
// =====================================================

/**
 * Calculate temperature derating for solar panels
 */
export function calculateTemperatureDerating(params: {
  ambientTemperature: number; // °C
  moduleTemperatureCoefficient: number; // %/°C (negative value)
  nominalOperatingCellTemp?: number; // °C (default: 45°C)
  referenceTemperature?: number; // °C (default: 25°C)
  windSpeed?: number; // m/s (default: 2 m/s)
}): {
  moduleTemperature: number; // °C
  temperatureDerating: number; // % power reduction
  correctedPower: number; // % of rated power
} {
  const noct = params.nominalOperatingCellTemp || 45;
  const referenceTemp = params.referenceTemperature || 25;
  const windSpeed = params.windSpeed || 2;
  
  // Calculate module temperature with wind adjustment
  const windAdjustment = Math.max(0.7, 1 - (windSpeed - 2) * 0.05);
  const moduleTemperature = params.ambientTemperature + 
    (noct - 20) * windAdjustment;
  
  // Calculate temperature derating
  const tempDifference = moduleTemperature - referenceTemp;
  const temperatureDerating = tempDifference * params.moduleTemperatureCoefficient;
  const correctedPower = 100 + temperatureDerating;
  
  return {
    moduleTemperature: Math.round(moduleTemperature * 10) / 10,
    temperatureDerating: Math.round(temperatureDerating * 100) / 100,
    correctedPower: Math.round(correctedPower * 100) / 100
  };
}

// =====================================================
// FINANCIAL CALCULATIONS
// =====================================================

/**
 * Calculate levelized cost of energy (LCOE)
 */
export function calculateLCOE(params: {
  initialInvestment: number; // $
  annualProduction: number; // kWh
  systemLife: number; // years
  discountRate: number; // %
  annualOperatingCost: number; // $
  degradationRate?: number; // %/year (default: 0.5)
}): {
  lcoe: number; // $/kWh
  totalLifetimeProduction: number; // kWh
  totalLifetimeCost: number; // $
} {
  const degradationRate = params.degradationRate || 0.5;
  
  // Calculate total lifetime production with degradation
  let totalLifetimeProduction = 0;
  for (let year = 1; year <= params.systemLife; year++) {
    const yearlyDegradation = Math.pow((100 - degradationRate) / 100, year - 1);
    totalLifetimeProduction += params.annualProduction * yearlyDegradation;
  }
  
  // Calculate net present value of operating costs
  const presentValueOperatingCosts = Array.from({ length: params.systemLife }, (_, i) => {
    const year = i + 1;
    return params.annualOperatingCost / Math.pow(1 + params.discountRate / 100, year);
  }).reduce((sum, pv) => sum + pv, 0);
  
  const totalLifetimeCost = params.initialInvestment + presentValueOperatingCosts;
  const lcoe = totalLifetimeCost / totalLifetimeProduction;
  
  return {
    lcoe: Math.round(lcoe * 10000) / 10000,
    totalLifetimeProduction: Math.round(totalLifetimeProduction),
    totalLifetimeCost: Math.round(totalLifetimeCost)
  };
}

/**
 * Calculate simple payback period
 */
export function calculatePaybackPeriod(params: {
  initialInvestment: number; // $
  annualSavings: number; // $
  annualDegradation?: number; // % (default: 0.5)
  electricityRateEscalation?: number; // % (default: 2.5)
}): {
  simplePayback: number; // years
  discountedPayback: number; // years
  breakEvenYear: number;
} {
  const degradation = params.annualDegradation || 0.5;
  const escalation = params.electricityRateEscalation || 2.5;
  
  let cumulativeSavings = 0;
  let discountedSavings = 0;
  let simplePayback = 0;
  let discountedPayback = 0;
  
  for (let year = 1; year <= 30; year++) {
    const yearlyDegradation = Math.pow((100 - degradation) / 100, year - 1);
    const yearlyEscalation = Math.pow((100 + escalation) / 100, year - 1);
    const adjustedSavings = params.annualSavings * yearlyDegradation * yearlyEscalation;
    
    cumulativeSavings += adjustedSavings;
    discountedSavings += adjustedSavings / Math.pow(1.06, year); // 6% discount rate
    
    if (simplePayback === 0 && cumulativeSavings >= params.initialInvestment) {
      simplePayback = year;
    }
    
    if (discountedPayback === 0 && discountedSavings >= params.initialInvestment) {
      discountedPayback = year;
    }
    
    if (simplePayback > 0 && discountedPayback > 0) break;
  }
  
  return {
    simplePayback: Math.round(simplePayback * 100) / 100,
    discountedPayback: Math.round(discountedPayback * 100) / 100,
    breakEvenYear: simplePayback
  };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Convert between different energy units
 */
export function convertEnergyUnits(value: number, fromUnit: string, toUnit: string): number {
  const conversionFactors: Record<string, number> = {
    'Wh': 1,
    'kWh': 1000,
    'MWh': 1000000,
    'GWh': 1000000000,
    'BTU': 3.412, // 1 Wh = 3.412 BTU
    'kBTU': 3412,
    'therm': 29307 // 1 Wh = 0.000034 therms
  };
  
  const valueInWh = value * conversionFactors[fromUnit];
  return valueInWh / conversionFactors[toUnit];
}

/**
 * Validate solar calculation inputs
 */
export function validateCalculationInputs(
  inputs: Record<string, number>,
  ranges: Record<string, { min: number; max: number }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [key, value] of Object.entries(inputs)) {
    if (ranges[key]) {
      if (value < ranges[key].min) {
        errors.push(`${key} (${value}) is below minimum value of ${ranges[key].min}`);
      }
      if (value > ranges[key].max) {
        errors.push(`${key} (${value}) is above maximum value of ${ranges[key].max}`);
      }
    }
    
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      errors.push(`${key} must be a valid number`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}