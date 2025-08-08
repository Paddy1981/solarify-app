/**
 * Validation Helper Utilities
 * 
 * Helper functions and utilities specific to solar industry validation,
 * including cross-field validation, business rule validation, and
 * specialized validation patterns.
 */

import { z } from 'zod';

// =====================================================
// CROSS-FIELD VALIDATION HELPERS
// =====================================================

/**
 * Validate that system power calculations are consistent across components
 */
export function validateSystemPowerConsistency(data: {
  panels?: { count: number; wattage: number };
  systemSize?: number; // kW
  inverterCapacity?: number; // W
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (data.panels && data.systemSize) {
    const calculatedSystemSize = (data.panels.count * data.panels.wattage) / 1000;
    const tolerance = 0.1; // 10% tolerance
    
    if (Math.abs(calculatedSystemSize - data.systemSize) / data.systemSize > tolerance) {
      errors.push(`System size (${data.systemSize} kW) does not match calculated size from panels (${calculatedSystemSize} kW)`);
    }
  }
  
  if (data.panels && data.inverterCapacity) {
    const totalDCPower = data.panels.count * data.panels.wattage;
    const dcAcRatio = totalDCPower / data.inverterCapacity;
    
    if (dcAcRatio > 1.5) {
      warnings.push(`DC/AC ratio (${dcAcRatio.toFixed(2)}) is high and may cause clipping`);
    } else if (dcAcRatio < 1.0) {
      warnings.push(`DC/AC ratio (${dcAcRatio.toFixed(2)}) is low and may reduce system efficiency`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate electrical system compatibility
 */
export function validateElectricalCompatibility(data: {
  panels?: { voltage: number; current: number };
  inverter?: { 
    minVoltage: number; 
    maxVoltage: number; 
    maxCurrent: number; 
  };
  stringConfig?: { panelsPerString: number; strings: number };
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (data.panels && data.inverter && data.stringConfig) {
    const stringVoltage = data.panels.voltage * data.stringConfig.panelsPerString;
    const stringCurrent = data.panels.current;
    
    // Voltage compatibility
    if (stringVoltage < data.inverter.minVoltage) {
      errors.push(`String voltage (${stringVoltage}V) below inverter minimum (${data.inverter.minVoltage}V)`);
    }
    if (stringVoltage > data.inverter.maxVoltage) {
      errors.push(`String voltage (${stringVoltage}V) exceeds inverter maximum (${data.inverter.maxVoltage}V)`);
    }
    
    // Current compatibility
    if (stringCurrent > data.inverter.maxCurrent) {
      errors.push(`String current (${stringCurrent}A) exceeds inverter maximum (${data.inverter.maxCurrent}A)`);
    }
    
    // Optimal voltage range check
    const optimalRange = {
      min: data.inverter.minVoltage + (data.inverter.maxVoltage - data.inverter.minVoltage) * 0.3,
      max: data.inverter.minVoltage + (data.inverter.maxVoltage - data.inverter.minVoltage) * 0.8
    };
    
    if (stringVoltage < optimalRange.min || stringVoltage > optimalRange.max) {
      warnings.push(`String voltage (${stringVoltage}V) outside optimal range (${optimalRange.min.toFixed(0)}-${optimalRange.max.toFixed(0)}V)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate financial calculations consistency
 */
export function validateFinancialConsistency(data: {
  systemCost?: number;
  incentives?: number;
  financing?: { amount: number; rate: number; term: number };
  savings?: { annual: number; monthly: number };
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate monthly vs annual savings
  if (data.savings?.annual && data.savings?.monthly) {
    const calculatedAnnual = data.savings.monthly * 12;
    const tolerance = 0.15; // 15% tolerance for seasonal variation
    
    if (Math.abs(calculatedAnnual - data.savings.annual) / data.savings.annual > tolerance) {
      warnings.push(`Annual savings (${data.savings.annual}) not consistent with monthly (${data.savings.monthly * 12})`);
    }
  }
  
  // Validate financing amount vs system cost
  if (data.systemCost && data.incentives && data.financing) {
    const expectedLoanAmount = data.systemCost - data.incentives;
    const tolerance = 0.05; // 5% tolerance
    
    if (Math.abs(data.financing.amount - expectedLoanAmount) / expectedLoanAmount > tolerance) {
      warnings.push(`Financing amount (${data.financing.amount}) doesn't match system cost minus incentives (${expectedLoanAmount})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// =====================================================
// BUSINESS RULE VALIDATION
// =====================================================

/**
 * Validate system meets local building codes and regulations
 */
export function validateBuildingCodeCompliance(data: {
  location?: { state: string; jurisdiction: string };
  system?: { 
    roofMounted: boolean;
    setbacks: { front: number; rear: number; sides: number };
    fireRating: string;
  };
  roof?: { age: number; condition: string; material: string };
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (data.system?.roofMounted && data.system.setbacks) {
    // Basic fire setback requirements (NEC 690.12)
    const minSetback = 3; // feet
    
    if (data.system.setbacks.front < minSetback) {
      errors.push(`Front setback (${data.system.setbacks.front}') below NEC minimum (${minSetback}')`);
    }
    if (data.system.setbacks.rear < minSetback) {
      errors.push(`Rear setback (${data.system.setbacks.rear}') below NEC minimum (${minSetback}')`);
    }
    if (data.system.setbacks.sides < minSetback) {
      errors.push(`Side setback (${data.system.setbacks.sides}') below NEC minimum (${minSetback}')`);
    }
  }
  
  // Roof condition assessment
  if (data.roof) {
    if (data.roof.age > 15 && data.roof.condition !== 'excellent') {
      warnings.push(`Roof age (${data.roof.age} years) and condition may require replacement before installation`);
    }
    
    if (data.roof.condition === 'poor') {
      errors.push('Roof condition is poor and not suitable for solar installation');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate utility interconnection requirements
 */
export function validateUtilityInterconnection(data: {
  utility?: { provider: string; netMetering: boolean };
  system?: { size: number; inverterType: string };
  electrical?: { servicePanelRating: number; voltagelevel: number };
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (data.system && data.electrical) {
    // 120% rule check for load-side interconnections
    const maxInverterSize = data.electrical.servicePanelRating * 0.2; // 20% of service panel
    
    if (data.system.size > maxInverterSize) {
      warnings.push(`System size (${data.system.size}kW) may require supply-side interconnection due to 120% rule`);
    }
    
    // Service panel adequacy
    if (data.electrical.servicePanelRating < 200 && data.system.size > 10) {
      warnings.push('Service panel upgrade may be required for system size');
    }
  }
  
  if (data.utility && !data.utility.netMetering && data.system) {
    warnings.push('Utility does not offer net metering - consider system sizing accordingly');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate customer qualification and suitability
 */
export function validateCustomerSuitability(data: {
  financial?: { creditScore: number; income: number; debtToIncome: number };
  property?: { roofCondition: string; shading: string; orientation: string };
  usage?: { monthlyUsage: number; monthlyBill: number };
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Financial qualification
  if (data.financial) {
    if (data.financial.creditScore < 640) {
      warnings.push('Credit score below typical financing thresholds');
    }
    
    if (data.financial.debtToIncome > 43) {
      warnings.push('Debt-to-income ratio above typical lending limits');
    }
    
    if (data.financial.income < 40000) {
      warnings.push('Income may be insufficient for solar financing options');
    }
  }
  
  // Property suitability
  if (data.property) {
    if (data.property.roofCondition === 'poor') {
      errors.push('Roof condition unsuitable for solar installation');
    }
    
    if (data.property.shading === 'significant') {
      warnings.push('Significant shading may reduce system performance');
    }
    
    if (data.property.orientation === 'north') {
      warnings.push('North-facing orientation not ideal for solar production');
    }
  }
  
  // Usage patterns
  if (data.usage) {
    if (data.usage.monthlyUsage < 500) {
      warnings.push('Low energy usage may not justify solar investment');
    }
    
    if (data.usage.monthlyBill < 80) {
      warnings.push('Low monthly bill may result in long payback period');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// =====================================================
// SPECIALIZED VALIDATION PATTERNS
// =====================================================

/**
 * Create conditional validation based on field values
 */
export function createConditionalValidator<T>(
  condition: (data: T) => boolean,
  validator: z.ZodSchema,
  fieldPath: string
) {
  return z.any().superRefine((data, ctx) => {
    if (condition(data)) {
      const result = validator.safeParse(data[fieldPath as keyof typeof data]);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          ctx.addIssue({
            ...issue,
            path: [fieldPath, ...issue.path]
          });
        });
      }
    }
  });
}

/**
 * Create validation that requires certain fields when others are present
 */
export function createRequiredWhenPresent<T>(
  triggerField: keyof T,
  requiredFields: (keyof T)[]
) {
  return z.any().superRefine((data: T, ctx) => {
    if (data[triggerField] !== undefined && data[triggerField] !== null) {
      requiredFields.forEach(field => {
        if (data[field] === undefined || data[field] === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${String(field)} is required when ${String(triggerField)} is provided`,
            path: [field as string]
          });
        }
      });
    }
  });
}

/**
 * Validate array elements have unique values
 */
export function validateUniqueArray<T>(
  array: T[],
  keyExtractor: (item: T) => string | number
): { valid: boolean; duplicates: T[] } {
  const seen = new Set<string | number>();
  const duplicates: T[] = [];
  
  array.forEach(item => {
    const key = keyExtractor(item);
    if (seen.has(key)) {
      duplicates.push(item);
    } else {
      seen.add(key);
    }
  });
  
  return {
    valid: duplicates.length === 0,
    duplicates
  };
}

// =====================================================
// DATA QUALITY CHECKS
// =====================================================

/**
 * Check data completeness score
 */
export function calculateDataCompleteness(
  data: Record<string, any>,
  requiredFields: string[],
  optionalFields: string[] = []
): {
  score: number; // 0-100
  missingRequired: string[];
  missingOptional: string[];
  completenessDetails: Record<string, boolean>;
} {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const completenessDetails: Record<string, boolean> = {};
  
  // Check required fields
  requiredFields.forEach(field => {
    const hasValue = hasValidValue(data, field);
    completenessDetails[field] = hasValue;
    if (!hasValue) {
      missingRequired.push(field);
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    const hasValue = hasValidValue(data, field);
    completenessDetails[field] = hasValue;
    if (!hasValue) {
      missingOptional.push(field);
    }
  });
  
  // Calculate score
  const totalFields = requiredFields.length + optionalFields.length;
  const requiredWeight = 0.8; // Required fields worth 80% of score
  const optionalWeight = 0.2; // Optional fields worth 20% of score
  
  const requiredScore = requiredFields.length > 0 ? 
    ((requiredFields.length - missingRequired.length) / requiredFields.length) * 100 : 100;
  const optionalScore = optionalFields.length > 0 ? 
    ((optionalFields.length - missingOptional.length) / optionalFields.length) * 100 : 100;
  
  const score = Math.round((requiredScore * requiredWeight + optionalScore * optionalWeight));
  
  return {
    score,
    missingRequired,
    missingOptional,
    completenessDetails
  };
}

/**
 * Check if a field has a valid value
 */
function hasValidValue(data: Record<string, any>, fieldPath: string): boolean {
  const keys = fieldPath.split('.');
  let current = data;
  
  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return false;
    }
    current = current[key];
  }
  
  // Check if the final value is valid
  return current !== null && 
         current !== undefined && 
         current !== '' && 
         !(Array.isArray(current) && current.length === 0) &&
         !(typeof current === 'object' && Object.keys(current).length === 0);
}

/**
 * Validate data consistency across time periods
 */
export function validateTemporalConsistency<T>(
  data: Array<T & { timestamp: Date; value: number }>,
  options: {
    maxVariation?: number; // % maximum variation between consecutive points
    maxGap?: number; // maximum time gap in milliseconds
    requireMonotonic?: boolean; // require values to be monotonically increasing
  } = {}
): {
  valid: boolean;
  issues: Array<{ 
    type: 'variation' | 'gap' | 'non_monotonic';
    index: number;
    message: string;
  }>;
} {
  const issues: Array<{ type: 'variation' | 'gap' | 'non_monotonic'; index: number; message: string; }> = [];
  
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    
    // Check time gaps
    if (options.maxGap) {
      const timeDiff = current.timestamp.getTime() - previous.timestamp.getTime();
      if (timeDiff > options.maxGap) {
        issues.push({
          type: 'gap',
          index: i,
          message: `Time gap of ${timeDiff}ms exceeds maximum of ${options.maxGap}ms`
        });
      }
    }
    
    // Check value variation
    if (options.maxVariation && previous.value > 0) {
      const variation = Math.abs((current.value - previous.value) / previous.value) * 100;
      if (variation > options.maxVariation) {
        issues.push({
          type: 'variation',
          index: i,
          message: `Value variation of ${variation.toFixed(1)}% exceeds maximum of ${options.maxVariation}%`
        });
      }
    }
    
    // Check monotonic requirement
    if (options.requireMonotonic && current.value < previous.value) {
      issues.push({
        type: 'non_monotonic',
        index: i,
        message: `Non-monotonic data: ${current.value} < ${previous.value}`
      });
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// =====================================================
// INDUSTRY-SPECIFIC VALIDATION RULES
// =====================================================

/**
 * Validate solar system meets industry best practices
 */
export function validateIndustryBestPractices(data: {
  system?: {
    dcAcRatio?: number;
    stringConfiguration?: { panelsPerString: number; stringsPerInverter: number };
    tiltAngle?: number;
    azimuth?: number;
  };
  location?: { latitude: number };
  equipment?: { panelEfficiency?: number; inverterEfficiency?: number };
}): {
  score: number; // 0-100 best practices score
  recommendations: string[];
  compliance: Record<string, boolean>;
} {
  const recommendations: string[] = [];
  const compliance: Record<string, boolean> = {};
  
  // DC/AC ratio best practices
  if (data.system?.dcAcRatio) {
    const idealRange = { min: 1.15, max: 1.35 };
    compliance.dcAcRatio = data.system.dcAcRatio >= idealRange.min && data.system.dcAcRatio <= idealRange.max;
    
    if (!compliance.dcAcRatio) {
      if (data.system.dcAcRatio < idealRange.min) {
        recommendations.push('Consider increasing DC/AC ratio to improve system economics');
      } else {
        recommendations.push('DC/AC ratio may cause significant clipping - consider larger inverter');
      }
    }
  }
  
  // Tilt and azimuth optimization
  if (data.system?.tiltAngle && data.system?.azimuth && data.location?.latitude) {
    const optimalTilt = Math.abs(data.location.latitude);
    const tiltDifference = Math.abs(data.system.tiltAngle - optimalTilt);
    compliance.tiltAngle = tiltDifference <= 15; // Within 15 degrees of optimal
    
    const optimalAzimuth = 180; // South-facing
    const azimuthDifference = Math.abs(data.system.azimuth - optimalAzimuth);
    compliance.azimuth = azimuthDifference <= 45; // Within 45 degrees of south
    
    if (!compliance.tiltAngle) {
      recommendations.push(`Consider tilt angle closer to ${optimalTilt}° for optimal production`);
    }
    if (!compliance.azimuth) {
      recommendations.push('Consider south-facing orientation for maximum production');
    }
  }
  
  // Equipment efficiency standards
  if (data.equipment?.panelEfficiency) {
    compliance.panelEfficiency = data.equipment.panelEfficiency >= 20; // Modern panels should be >20%
    if (!compliance.panelEfficiency) {
      recommendations.push('Consider higher efficiency panels to maximize roof space utilization');
    }
  }
  
  if (data.equipment?.inverterEfficiency) {
    compliance.inverterEfficiency = data.equipment.inverterEfficiency >= 96; // Modern inverters should be >96%
    if (!compliance.inverterEfficiency) {
      recommendations.push('Consider higher efficiency inverter to minimize conversion losses');
    }
  }
  
  // Calculate overall best practices score
  const practiceKeys = Object.keys(compliance);
  const score = practiceKeys.length > 0 ? 
    (Object.values(compliance).filter(Boolean).length / practiceKeys.length) * 100 : 0;
  
  return {
    score: Math.round(score),
    recommendations,
    compliance
  };
}