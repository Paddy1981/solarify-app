/**
 * Solar Validation Orchestrator
 * 
 * Central coordination system for all solar data validation contexts including
 * user input, API validation, system validation, and cross-validation workflows.
 * 
 * Features:
 * - Context-aware validation routing
 * - Comprehensive error handling and logging
 * - Performance monitoring and metrics
 * - Validation result caching
 * - Async validation workflows
 */

import { z } from 'zod';

// Import all validation schemas
import * as equipment from './solar-equipment';
import * as systemConfig from './solar-system-configuration';
import * as energyProduction from './solar-energy-production';
import * as financialData from './solar-financial-data';
import * as installationData from './solar-installation-data';
import * as customerData from './solar-customer-data';
import * as realTimeData from './solar-real-time-data';
import * as integrationValidation from './solar-integration-validation';
import * as commonValidation from './common';

// =====================================================
// VALIDATION CONTEXT DEFINITIONS
// =====================================================

// Validation context types
export const VALIDATION_CONTEXTS = {
  USER_INPUT: 'user_input',
  API_REQUEST: 'api_request', 
  API_RESPONSE: 'api_response',
  SYSTEM_INTERNAL: 'system_internal',
  BATCH_PROCESSING: 'batch_processing',
  REAL_TIME_MONITORING: 'real_time_monitoring',
  DATA_MIGRATION: 'data_migration',
  INTEGRATION_SYNC: 'integration_sync'
} as const;

// Validation severity levels
export const VALIDATION_SEVERITY = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

// Validation categories
export const VALIDATION_CATEGORIES = {
  EQUIPMENT: 'equipment',
  SYSTEM_CONFIG: 'system_config',
  ENERGY_PRODUCTION: 'energy_production',
  FINANCIAL: 'financial',
  INSTALLATION: 'installation',
  CUSTOMER: 'customer',
  REAL_TIME: 'real_time',
  INTEGRATION: 'integration'
} as const;

// =====================================================
// VALIDATION ORCHESTRATOR SCHEMA
// =====================================================

// Validation request schema
export const validationRequestSchema = z.object({
  // Request metadata
  requestId: z.string().min(1).max(100),
  timestamp: z.date(),
  context: z.enum(Object.values(VALIDATION_CONTEXTS) as [string, ...string[]]),
  category: z.enum(Object.values(VALIDATION_CATEGORIES) as [string, ...string[]]),
  
  // Validation configuration
  config: z.object({
    strictMode: z.boolean().default(false),
    skipWarnings: z.boolean().default(false),
    maxErrors: z.number().int().min(1).max(1000).default(100),
    timeoutMs: z.number().int().min(1000).max(300000).default(30000),
    enableCaching: z.boolean().default(true),
    enableMetrics: z.boolean().default(true)
  }),
  
  // Data to validate
  data: z.object({
    primary: z.unknown(), // Main data object
    metadata: z.record(z.string(), z.unknown()).optional(),
    correlationId: z.string().max(100).optional()
  }),
  
  // Validation rules to apply
  validationRules: z.object({
    schemas: z.array(z.string()).min(1).max(50), // Schema names to apply
    customRules: z.array(z.object({
      ruleId: z.string().max(50),
      description: z.string().max(200),
      rule: z.function().optional() // Custom validation function
    })).default([]),
    crossValidationRules: z.array(z.string()).default([])
  }),
  
  // Context-specific options
  contextOptions: z.record(z.string(), z.unknown()).default({})
});

// Validation result schema
export const validationResultSchema = z.object({
  // Result metadata
  requestId: z.string().min(1).max(100),
  timestamp: z.date(),
  duration: z.number().min(0).max(300000), // ms
  
  // Validation status
  status: z.enum(['success', 'warning', 'error', 'timeout', 'cache_hit']),
  overallValid: z.boolean(),
  
  // Detailed results
  results: z.object({
    // Schema validation results
    schemaResults: z.array(z.object({
      schemaName: z.string().max(100),
      valid: z.boolean(),
      errors: z.array(z.object({
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string().max(500),
        code: z.string().max(50),
        severity: z.enum(Object.values(VALIDATION_SEVERITY) as [string, ...string[]])
      })).default([]),
      warnings: z.array(z.object({
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string().max(500),
        code: z.string().max(50)
      })).default([])
    })).default([]),
    
    // Custom rule results
    customRuleResults: z.array(z.object({
      ruleId: z.string().max(50),
      valid: z.boolean(),
      message: z.string().max(500).optional(),
      severity: z.enum(Object.values(VALIDATION_SEVERITY) as [string, ...string[]]).optional()
    })).default([]),
    
    // Cross-validation results
    crossValidationResults: z.array(z.object({
      ruleName: z.string().max(100),
      valid: z.boolean(),
      details: z.string().max(1000).optional()
    })).default([])
  }),
  
  // Performance metrics
  metrics: z.object({
    validationTime: z.number().min(0),
    schemaValidationTime: z.number().min(0),
    customRuleTime: z.number().min(0),
    crossValidationTime: z.number().min(0),
    cacheHit: z.boolean(),
    memoryUsage: z.number().min(0).optional() // bytes
  }),
  
  // Suggestions and recommendations
  recommendations: z.array(z.object({
    type: z.enum(['data_quality', 'performance', 'security', 'best_practice']),
    message: z.string().max(500),
    severity: z.enum(['low', 'medium', 'high']),
    actionRequired: z.boolean()
  })).default([])
});

// =====================================================
// VALIDATION ORCHESTRATOR CLASS
// =====================================================

export class SolarValidationOrchestrator {
  private cache: Map<string, any> = new Map();
  private metrics: Map<string, number> = new Map();
  private validationSchemas: Map<string, z.ZodSchema> = new Map();
  
  constructor() {
    this.initializeSchemas();
  }
  
  /**
   * Initialize all available validation schemas
   */
  private initializeSchemas(): void {
    // Equipment validation schemas
    this.validationSchemas.set('solar_panel_spec', equipment.solarPanelSpecSchema);
    this.validationSchemas.set('inverter_spec', equipment.inverterSpecSchema);
    this.validationSchemas.set('battery_spec', equipment.batterySpecSchema);
    this.validationSchemas.set('mounting_system', equipment.mountingSystemSchema);
    this.validationSchemas.set('system_compatibility', equipment.systemCompatibilitySchema);
    
    // System configuration schemas
    this.validationSchemas.set('solar_array_layout', systemConfig.solarArrayLayoutSchema);
    this.validationSchemas.set('dc_electrical_design', systemConfig.dcElectricalDesignSchema);
    this.validationSchemas.set('ac_electrical_design', systemConfig.acElectricalDesignSchema);
    this.validationSchemas.set('string_optimization', systemConfig.stringOptimizationSchema);
    this.validationSchemas.set('system_efficiency', systemConfig.systemEfficiencySchema);
    this.validationSchemas.set('solar_system_configuration', systemConfig.solarSystemConfigurationSchema);
    
    // Energy production schemas
    this.validationSchemas.set('tmy_data', energyProduction.tmyDataSchema);
    this.validationSchemas.set('irradiance_measurement', energyProduction.irradianceMeasurementSchema);
    this.validationSchemas.set('energy_production', energyProduction.energyProductionSchema);
    this.validationSchemas.set('performance_ratio', energyProduction.performanceRatioSchema);
    this.validationSchemas.set('production_forecast', energyProduction.productionForecastSchema);
    this.validationSchemas.set('weather_correlation', energyProduction.weatherCorrelationSchema);
    
    // Financial data schemas
    this.validationSchemas.set('system_cost', financialData.systemCostSchema);
    this.validationSchemas.set('federal_incentive', financialData.federalIncentiveSchema);
    this.validationSchemas.set('state_local_incentive', financialData.stateLocalIncentiveSchema);
    this.validationSchemas.set('utility_rate', financialData.utilityRateSchema);
    this.validationSchemas.set('solar_loan', financialData.solarLoanSchema);
    this.validationSchemas.set('solar_lease', financialData.solarLeaseSchema);
    this.validationSchemas.set('solar_ppa', financialData.solarPPASchema);
    this.validationSchemas.set('roi_analysis', financialData.roiAnalysisSchema);
    
    // Installation schemas
    this.validationSchemas.set('site_assessment', installationData.siteAssessmentSchema);
    this.validationSchemas.set('structural_analysis', installationData.structuralAnalysisSchema);
    this.validationSchemas.set('nec_compliance', installationData.necComplianceSchema);
    this.validationSchemas.set('permit_requirements', installationData.permitRequirementsSchema);
    this.validationSchemas.set('installation_quality', installationData.installationQualitySchema);
    
    // Customer data schemas
    this.validationSchemas.set('energy_usage_patterns', customerData.energyUsagePatternsSchema);
    this.validationSchemas.set('property_information', customerData.propertyInformationSchema);
    this.validationSchemas.set('utility_information', customerData.utilityInformationSchema);
    this.validationSchemas.set('credit_financing', customerData.creditFinancingSchema);
    this.validationSchemas.set('geographic_solar_data', customerData.geographicSolarDataSchema);
    this.validationSchemas.set('contact_communication', customerData.contactCommunicationSchema);
    
    // Real-time data schemas
    this.validationSchemas.set('sensor_measurement', realTimeData.sensorMeasurementSchema);
    this.validationSchemas.set('data_transmission', realTimeData.dataTransmissionSchema);
    this.validationSchemas.set('alert_threshold', realTimeData.alertThresholdSchema);
    this.validationSchemas.set('anomaly_detection', realTimeData.anomalyDetectionSchema);
    this.validationSchemas.set('system_health', realTimeData.systemHealthSchema);
    
    // Integration validation schemas
    this.validationSchemas.set('third_party_api', integrationValidation.thirdPartyAPISchema);
    this.validationSchemas.set('weather_api_integration', integrationValidation.weatherAPIIntegrationSchema);
    this.validationSchemas.set('utility_api_integration', integrationValidation.utilityAPIIntegrationSchema);
    this.validationSchemas.set('financial_api_integration', integrationValidation.financialAPIIntegrationSchema);
    this.validationSchemas.set('data_synchronization', integrationValidation.dataSynchronizationSchema);
    this.validationSchemas.set('legacy_migration', integrationValidation.legacyMigrationSchema);
    
    // Common schemas
    this.validationSchemas.set('file_upload', commonValidation.fileUploadSchema);
    this.validationSchemas.set('pagination', commonValidation.paginationSchema);
    this.validationSchemas.set('search', commonValidation.searchSchema);
    this.validationSchemas.set('contact_form', commonValidation.contactFormSchema);
  }
  
  /**
   * Main validation method
   */
  async validate(request: z.infer<typeof validationRequestSchema>): Promise<z.infer<typeof validationResultSchema>> {
    const startTime = Date.now();
    const result: z.infer<typeof validationResultSchema> = {
      requestId: request.requestId,
      timestamp: new Date(),
      duration: 0,
      status: 'success',
      overallValid: true,
      results: {
        schemaResults: [],
        customRuleResults: [],
        crossValidationResults: []
      },
      metrics: {
        validationTime: 0,
        schemaValidationTime: 0,
        customRuleTime: 0,
        crossValidationTime: 0,
        cacheHit: false
      },
      recommendations: []
    };
    
    try {
      // Check cache first
      if (request.config.enableCaching) {
        const cacheKey = this.generateCacheKey(request);
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
          result.status = 'cache_hit';
          result.metrics.cacheHit = true;
          result.duration = Date.now() - startTime;
          return cachedResult;
        }
      }
      
      // Context-specific preprocessing
      await this.preprocessByContext(request);
      
      // Schema validation
      const schemaStartTime = Date.now();
      result.results.schemaResults = await this.validateSchemas(request);
      result.metrics.schemaValidationTime = Date.now() - schemaStartTime;
      
      // Custom rule validation
      const customRuleStartTime = Date.now();
      result.results.customRuleResults = await this.validateCustomRules(request);
      result.metrics.customRuleTime = Date.now() - customRuleStartTime;
      
      // Cross-validation
      const crossValidationStartTime = Date.now();
      result.results.crossValidationResults = await this.performCrossValidation(request);
      result.metrics.crossValidationTime = Date.now() - crossValidationStartTime;
      
      // Determine overall status
      result.overallValid = this.determineOverallValidity(result.results);
      result.status = result.overallValid ? 'success' : 'error';
      
      // Generate recommendations
      result.recommendations = this.generateRecommendations(request, result);
      
      // Cache result if enabled
      if (request.config.enableCaching && result.overallValid) {
        const cacheKey = this.generateCacheKey(request);
        this.cache.set(cacheKey, result);
        
        // Simple cache cleanup - remove oldest entries if cache is too large
        if (this.cache.size > 1000) {
          const oldestKey = this.cache.keys().next().value;
          this.cache.delete(oldestKey);
        }
      }
      
      // Update metrics
      if (request.config.enableMetrics) {
        this.updateMetrics(request, result);
      }
      
    } catch (error) {
      result.status = 'error';
      result.overallValid = false;
      result.results.schemaResults.push({
        schemaName: 'orchestrator_error',
        valid: false,
        errors: [{
          path: [],
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'ORCHESTRATOR_ERROR',
          severity: 'critical'
        }],
        warnings: []
      });
    }
    
    result.duration = Date.now() - startTime;
    result.metrics.validationTime = result.duration;
    
    return result;
  }
  
  /**
   * Context-specific preprocessing
   */
  private async preprocessByContext(request: z.infer<typeof validationRequestSchema>): Promise<void> {
    switch (request.context) {
      case VALIDATION_CONTEXTS.USER_INPUT:
        // Sanitize and normalize user input
        if (typeof request.data.primary === 'object' && request.data.primary !== null) {
          this.sanitizeUserInput(request.data.primary as Record<string, any>);
        }
        break;
        
      case VALIDATION_CONTEXTS.API_REQUEST:
        // Validate API request format and authentication
        await this.validateAPIRequest(request);
        break;
        
      case VALIDATION_CONTEXTS.REAL_TIME_MONITORING:
        // Check data freshness and sensor validity
        await this.validateRealTimeData(request);
        break;
        
      case VALIDATION_CONTEXTS.BATCH_PROCESSING:
        // Optimize for batch processing performance
        request.config.enableCaching = false; // Disable caching for batch
        break;
    }
  }
  
  /**
   * Validate against specified schemas
   */
  private async validateSchemas(request: z.infer<typeof validationRequestSchema>): Promise<any[]> {
    const results: any[] = [];
    
    for (const schemaName of request.validationRules.schemas) {
      const schema = this.validationSchemas.get(schemaName);
      if (!schema) {
        results.push({
          schemaName,
          valid: false,
          errors: [{
            path: [],
            message: `Schema '${schemaName}' not found`,
            code: 'SCHEMA_NOT_FOUND',
            severity: 'error'
          }],
          warnings: []
        });
        continue;
      }
      
      try {
        const validation = schema.safeParse(request.data.primary);
        
        if (validation.success) {
          results.push({
            schemaName,
            valid: true,
            errors: [],
            warnings: []
          });
        } else {
          const errors = validation.error.issues.map(issue => ({
            path: issue.path,
            message: issue.message,
            code: issue.code,
            severity: this.determineSeverity(issue.code, request.context)
          }));
          
          results.push({
            schemaName,
            valid: false,
            errors,
            warnings: []
          });
        }
      } catch (error) {
        results.push({
          schemaName,
          valid: false,
          errors: [{
            path: [],
            message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            code: 'VALIDATION_ERROR',
            severity: 'error'
          }],
          warnings: []
        });
      }
    }
    
    return results;
  }
  
  /**
   * Validate custom rules
   */
  private async validateCustomRules(request: z.infer<typeof validationRequestSchema>): Promise<any[]> {
    const results: any[] = [];
    
    for (const rule of request.validationRules.customRules) {
      try {
        if (rule.rule) {
          // Execute custom validation function
          const isValid = await rule.rule(request.data.primary);
          results.push({
            ruleId: rule.ruleId,
            valid: isValid,
            message: isValid ? undefined : `Custom rule '${rule.ruleId}' failed`,
            severity: isValid ? undefined : 'error'
          });
        }
      } catch (error) {
        results.push({
          ruleId: rule.ruleId,
          valid: false,
          message: `Custom rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        });
      }
    }
    
    return results;
  }
  
  /**
   * Perform cross-validation between related data
   */
  private async performCrossValidation(request: z.infer<typeof validationRequestSchema>): Promise<any[]> {
    const results: any[] = [];
    
    // Implement solar-specific cross-validation rules
    for (const ruleName of request.validationRules.crossValidationRules) {
      try {
        const isValid = await this.executeCrossValidationRule(ruleName, request.data.primary);
        results.push({
          ruleName,
          valid: isValid,
          details: isValid ? undefined : `Cross-validation rule '${ruleName}' failed`
        });
      } catch (error) {
        results.push({
          ruleName,
          valid: false,
          details: `Cross-validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
    
    return results;
  }
  
  /**
   * Execute specific cross-validation rules
   */
  private async executeCrossValidationRule(ruleName: string, data: any): Promise<boolean> {
    switch (ruleName) {
      case 'panel_inverter_compatibility':
        return this.validatePanelInverterCompatibility(data);
      case 'system_size_consistency':
        return this.validateSystemSizeConsistency(data);
      case 'financial_calculation_accuracy':
        return this.validateFinancialCalculations(data);
      case 'production_estimate_reasonableness':
        return this.validateProductionEstimate(data);
      default:
        return true; // Unknown rule, assume valid
    }
  }
  
  /**
   * Solar-specific cross-validation methods
   */
  private validatePanelInverterCompatibility(data: any): boolean {
    // Check if panel and inverter specifications are compatible
    if (data.panels && data.inverter) {
      const panel = data.panels[0];
      const stringVoltage = panel.stc?.voltage * (data.panelsPerString || 1);
      const inverterMinVoltage = data.inverter.dcInput?.voltageRange?.min;
      const inverterMaxVoltage = data.inverter.dcInput?.voltageRange?.max;
      
      if (stringVoltage && inverterMinVoltage && inverterMaxVoltage) {
        return stringVoltage >= inverterMinVoltage && stringVoltage <= inverterMaxVoltage;
      }
    }
    return true;
  }
  
  private validateSystemSizeConsistency(data: any): boolean {
    // Check if system size calculations are consistent
    if (data.systemSize && data.panelCount && data.panelWattage) {
      const calculatedSize = (data.panelCount * data.panelWattage) / 1000; // Convert to kW
      const tolerance = 0.1; // 10% tolerance
      return Math.abs(calculatedSize - data.systemSize) / data.systemSize <= tolerance;
    }
    return true;
  }
  
  private validateFinancialCalculations(data: any): boolean {
    // Validate financial calculations are mathematically correct
    if (data.totalCost && data.equipmentCost && data.installationCost) {
      const calculatedTotal = data.equipmentCost + data.installationCost;
      const tolerance = 100; // $100 tolerance
      return Math.abs(calculatedTotal - data.totalCost) <= tolerance;
    }
    return true;
  }
  
  private validateProductionEstimate(data: any): boolean {
    // Check if production estimate is reasonable for system size and location
    if (data.annualProduction && data.systemSize && data.solarResource) {
      const specificYield = data.annualProduction / data.systemSize;
      const expectedRange = { min: 800, max: 2500 }; // kWh/kW/year typical range
      return specificYield >= expectedRange.min && specificYield <= expectedRange.max;
    }
    return true;
  }
  
  /**
   * Helper methods
   */
  private sanitizeUserInput(data: Record<string, any>): void {
    // Remove potentially dangerous characters and normalize data
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        data[key] = data[key].trim().replace(/[<>]/g, '');
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        this.sanitizeUserInput(data[key]);
      }
    });
  }
  
  private async validateAPIRequest(request: z.infer<typeof validationRequestSchema>): Promise<void> {
    // Add API-specific validation logic
    if (!request.data.metadata?.apiKey && !request.data.metadata?.bearerToken) {
      throw new Error('API authentication required');
    }
  }
  
  private async validateRealTimeData(request: z.infer<typeof validationRequestSchema>): Promise<void> {
    // Check data freshness for real-time validation
    const timestamp = request.data.metadata?.timestamp;
    if (timestamp) {
      const dataAge = Date.now() - new Date(timestamp as string).getTime();
      if (dataAge > 300000) { // 5 minutes
        request.data.metadata.stale = true;
      }
    }
  }
  
  private generateCacheKey(request: z.infer<typeof validationRequestSchema>): string {
    return `${request.context}_${request.category}_${JSON.stringify(request.validationRules.schemas)}_${this.hashData(request.data.primary)}`;
  }
  
  private hashData(data: any): string {
    // Simple hash function for cache key generation
    return JSON.stringify(data).length.toString();
  }
  
  private determineSeverity(code: string, context: string): string {
    // Determine severity based on error code and context
    const criticalCodes = ['required', 'invalid_type', 'invalid_union'];
    const criticalContexts = [VALIDATION_CONTEXTS.API_REQUEST, VALIDATION_CONTEXTS.SYSTEM_INTERNAL];
    
    if (criticalCodes.includes(code) || criticalContexts.includes(context)) {
      return VALIDATION_SEVERITY.CRITICAL;
    }
    return VALIDATION_SEVERITY.ERROR;
  }
  
  private determineOverallValidity(results: any): boolean {
    // Check if any schema or custom rule failed
    const hasSchemaErrors = results.schemaResults.some((r: any) => !r.valid);
    const hasCustomRuleErrors = results.customRuleResults.some((r: any) => !r.valid);
    const hasCrossValidationErrors = results.crossValidationResults.some((r: any) => !r.valid);
    
    return !hasSchemaErrors && !hasCustomRuleErrors && !hasCrossValidationErrors;
  }
  
  private generateRecommendations(request: z.infer<typeof validationRequestSchema>, result: any): any[] {
    const recommendations: any[] = [];
    
    // Generate context-specific recommendations
    if (request.context === VALIDATION_CONTEXTS.USER_INPUT && !result.overallValid) {
      recommendations.push({
        type: 'data_quality',
        message: 'Please review and correct the highlighted fields',
        severity: 'high',
        actionRequired: true
      });
    }
    
    if (result.metrics.validationTime > 5000) {
      recommendations.push({
        type: 'performance',
        message: 'Validation took longer than expected. Consider enabling caching.',
        severity: 'medium',
        actionRequired: false
      });
    }
    
    return recommendations;
  }
  
  private updateMetrics(request: z.infer<typeof validationRequestSchema>, result: any): void {
    const key = `${request.context}_${request.category}`;
    const currentCount = this.metrics.get(`${key}_count`) || 0;
    const currentTotal = this.metrics.get(`${key}_total_time`) || 0;
    
    this.metrics.set(`${key}_count`, currentCount + 1);
    this.metrics.set(`${key}_total_time`, currentTotal + result.duration);
    this.metrics.set(`${key}_avg_time`, (currentTotal + result.duration) / (currentCount + 1));
  }
  
  /**
   * Get validation metrics
   */
  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get available validation schemas
   */
  getAvailableSchemas(): string[] {
    return Array.from(this.validationSchemas.keys());
  }
}

// =====================================================
// VALIDATION MIDDLEWARE HELPER
// =====================================================

/**
 * Create validation middleware for Next.js API routes
 */
export function createValidationMiddleware(
  schemas: string[],
  context: string = VALIDATION_CONTEXTS.API_REQUEST,
  category: string = VALIDATION_CATEGORIES.SYSTEM_CONFIG
) {
  const orchestrator = new SolarValidationOrchestrator();
  
  return async (req: any, res: any, next: () => void) => {
    try {
      const validationRequest = {
        requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
        timestamp: new Date(),
        context,
        category,
        config: {
          strictMode: process.env.NODE_ENV === 'production',
          skipWarnings: false,
          maxErrors: 10,
          timeoutMs: 10000,
          enableCaching: true,
          enableMetrics: true
        },
        data: {
          primary: req.body,
          metadata: {
            userAgent: req.headers['user-agent'],
            ip: req.ip
          }
        },
        validationRules: {
          schemas,
          customRules: [],
          crossValidationRules: []
        },
        contextOptions: {}
      };
      
      const result = await orchestrator.validate(validationRequest);
      
      if (!result.overallValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: result.results
          }
        });
      }
      
      // Attach validation result to request for downstream use
      req.validationResult = result;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_MIDDLEWARE_ERROR',
          message: 'Validation middleware failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };
}

// Export types
export type ValidationRequest = z.infer<typeof validationRequestSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;

// Export singleton instance
export const solarValidationOrchestrator = new SolarValidationOrchestrator();