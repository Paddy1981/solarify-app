/**
 * Solar Validation Layer - Centralized Exports
 * 
 * Central export hub for all solar validation schemas, types, utilities,
 * and middleware components. Provides organized access to the complete
 * solar data validation ecosystem.
 */

// =====================================================
// COMMON VALIDATION EXPORTS
// =====================================================

export {
  // Common schemas
  fileUploadSchema,
  imageUploadSchema,
  paginationSchema,
  searchSchema,
  contactFormSchema,
  currencySchema,
  dateRangeSchema,
  coordinatesSchema,
  rateLimitSchema,
  apiResponseSchema,
  environmentSchema,
  userPreferencesSchema,
  idSchema,
  
  // Common types
  type FileUploadData,
  type ImageUploadData,
  type PaginationData,
  type SearchData,
  type ContactFormData,
  type CurrencyData,
  type DateRangeData,
  type CoordinatesData,
  type RateLimitData,
  type ApiResponseData,
  type UserPreferencesData,
  
  // Common utility functions
  sanitizeString,
  validateAndSanitizeEmail,
  isValidUUID
} from './common';

// =====================================================
// SOLAR EQUIPMENT VALIDATION EXPORTS
// =====================================================

export {
  // Equipment schemas
  solarPanelSpecSchema,
  inverterSpecSchema,
  batterySpecSchema,
  mountingSystemSchema,
  systemCompatibilitySchema,
  
  // Equipment types
  type SolarPanelSpec,
  type InverterSpec,
  type BatterySpec,
  type MountingSystemSpec,
  type SystemCompatibility,
  
  // Equipment constants
  PANEL_TECHNOLOGIES,
  REQUIRED_PANEL_CERTIFICATIONS,
  OPTIONAL_PANEL_CERTIFICATIONS,
  PANEL_FRAME_MATERIALS,
  INVERTER_TECHNOLOGIES,
  REQUIRED_INVERTER_CERTIFICATIONS,
  OPTIONAL_INVERTER_CERTIFICATIONS,
  BATTERY_TECHNOLOGIES,
  MOUNTING_SYSTEMS
} from './solar-equipment';

// =====================================================
// SYSTEM CONFIGURATION VALIDATION EXPORTS
// =====================================================

export {
  // System configuration schemas
  solarArrayLayoutSchema,
  dcElectricalDesignSchema,
  acElectricalDesignSchema,
  stringOptimizationSchema,
  dcAcRatioSchema,
  systemEfficiencySchema,
  solarSystemConfigurationSchema,
  
  // System configuration types
  type SolarArrayLayout,
  type DCElectricalDesign,
  type ACElectricalDesign,
  type StringOptimization,
  type DCACRatio,
  type SystemEfficiency,
  type SolarSystemConfiguration,
  
  // System configuration constants
  NEC_REQUIREMENTS,
  DC_AC_RATIO_LIMITS,
  STRING_LIMITS,
  SHADING_PARAMETERS
} from './solar-system-configuration';

// =====================================================
// ENERGY PRODUCTION VALIDATION EXPORTS
// =====================================================

export {
  // Energy production schemas
  tmyDataSchema,
  irradianceMeasurementSchema,
  energyProductionSchema,
  performanceRatioSchema,
  productionForecastSchema,
  weatherCorrelationSchema,
  
  // Energy production types
  type TMYData,
  type IrradianceMeasurement,
  type EnergyProduction,
  type PerformanceRatio,
  type ProductionForecast,
  type WeatherCorrelation,
  
  // Energy production constants
  IRRADIANCE_STANDARDS,
  PRODUCTION_STANDARDS,
  SHADING_PARAMETERS as ENERGY_SHADING_PARAMETERS
} from './solar-energy-production';

// =====================================================
// FINANCIAL DATA VALIDATION EXPORTS
// =====================================================

export {
  // Financial schemas
  systemCostSchema,
  federalIncentiveSchema,
  stateLocalIncentiveSchema,
  utilityRateSchema,
  solarLoanSchema,
  solarLeaseSchema,
  solarPPASchema,
  roiAnalysisSchema,
  
  // Financial types
  type SystemCost,
  type FederalIncentive,
  type StateLocalIncentive,
  type UtilityRate,
  type SolarLoan,
  type SolarLease,
  type SolarPPA,
  type ROIAnalysis,
  
  // Financial constants
  FEDERAL_INCENTIVES,
  FINANCING_LIMITS,
  COST_RANGES
} from './solar-financial-data';

// =====================================================
// INSTALLATION DATA VALIDATION EXPORTS
// =====================================================

export {
  // Installation schemas
  siteAssessmentSchema,
  structuralAnalysisSchema,
  necComplianceSchema,
  permitRequirementsSchema,
  installationQualitySchema,
  
  // Installation types
  type SiteAssessment,
  type StructuralAnalysis,
  type NECCompliance,
  type PermitRequirements,
  type InstallationQuality,
  
  // Installation constants
  BUILDING_CODE_REQUIREMENTS
} from './solar-installation-data';

// =====================================================
// CUSTOMER DATA VALIDATION EXPORTS
// =====================================================

export {
  // Customer data schemas
  energyUsagePatternsSchema,
  propertyInformationSchema,
  utilityInformationSchema,
  creditFinancingSchema,
  geographicSolarDataSchema,
  contactCommunicationSchema,
  
  // Customer data types
  type EnergyUsagePatterns,
  type PropertyInformation,
  type UtilityInformation,
  type CreditFinancing,
  type GeographicSolarData,
  type ContactCommunication
} from './solar-customer-data';

// =====================================================
// REAL-TIME DATA VALIDATION EXPORTS
// =====================================================

export {
  // Real-time data schemas
  sensorMeasurementSchema,
  dataTransmissionSchema,
  alertThresholdSchema,
  anomalyDetectionSchema,
  systemHealthSchema,
  
  // Real-time data types
  type SensorMeasurement,
  type DataTransmission,
  type AlertThreshold,
  type AnomalyDetection,
  type SystemHealth,
  
  // Real-time data constants
  SENSOR_DATA_STANDARDS
} from './solar-real-time-data';

// =====================================================
// INTEGRATION VALIDATION EXPORTS
// =====================================================

export {
  // Integration schemas
  thirdPartyAPISchema,
  weatherAPIIntegrationSchema,
  utilityAPIIntegrationSchema,
  financialAPIIntegrationSchema,
  dataSynchronizationSchema,
  legacyMigrationSchema,
  
  // Integration types
  type ThirdPartyAPI,
  type WeatherAPIIntegration,
  type UtilityAPIIntegration,
  type FinancialAPIIntegration,
  type DataSynchronization,
  type LegacyMigration,
  
  // Integration constants
  API_INTEGRATION_STANDARDS
} from './solar-integration-validation';

// =====================================================
// VALIDATION ORCHESTRATOR EXPORTS
// =====================================================

export {
  // Orchestrator classes and functions
  SolarValidationOrchestrator,
  solarValidationOrchestrator,
  createValidationMiddleware,
  
  // Orchestrator schemas
  validationRequestSchema,
  validationResultSchema,
  
  // Orchestrator types
  type ValidationRequest,
  type ValidationResult,
  
  // Orchestrator constants
  VALIDATION_CONTEXTS,
  VALIDATION_SEVERITY,
  VALIDATION_CATEGORIES
} from './solar-validation-orchestrator';

// =====================================================
// MIDDLEWARE EXPORTS
// =====================================================

export {
  // Middleware functions
  createSolarValidationMiddleware,
  createResponseValidationMiddleware,
  createRateLimitMiddleware,
  withValidation,
  
  // Specialized middleware
  equipmentValidationMiddleware,
  systemConfigValidationMiddleware,
  financialValidationMiddleware,
  customerDataValidationMiddleware,
  realTimeDataValidationMiddleware,
  
  // Middleware utilities
  solarAPIMiddleware,
  defaultRateLimitMiddleware,
  
  // Middleware types
  type ValidationMiddlewareConfig,
  type ApiValidationOptions
} from './middleware';

// =====================================================
// VALIDATION UTILITIES
// =====================================================

// Solar calculation utilities
export {
  calculateSystemSize,
  calculateStringConfiguration,
  calculateSystemEfficiency,
  calculateAnnualProduction,
  calculateMonthlyProduction,
  calculatePerformanceRatio,
  calculateOptimalTilt,
  calculateShadingLoss,
  calculateTemperatureDerating,
  calculateLCOE,
  calculatePaybackPeriod,
  convertEnergyUnits,
  validateCalculationInputs
} from './utils/solar-calculations';

// Data normalization utilities
export {
  normalizePanelSpecifications,
  normalizeInverterSpecifications,
  normalizeUtilityBillData,
  normalizeWeatherData,
  normalizeIncentiveData
} from './utils/data-normalization';

// Validation helper utilities
export {
  validateSystemPowerConsistency,
  validateElectricalCompatibility,
  validateFinancialConsistency,
  validateBuildingCodeCompliance,
  validateUtilityInterconnection,
  validateCustomerSuitability,
  createConditionalValidator,
  createRequiredWhenPresent,
  validateUniqueArray,
  calculateDataCompleteness,
  validateTemporalConsistency,
  validateIndustryBestPractices
} from './utils/validation-helpers';

// =====================================================
// GROUPED SCHEMA COLLECTIONS
// =====================================================

/**
 * All equipment-related validation schemas
 */
export const EQUIPMENT_SCHEMAS = {
  solarPanel: 'solar_panel_spec',
  inverter: 'inverter_spec',
  battery: 'battery_spec',
  mounting: 'mounting_system',
  compatibility: 'system_compatibility'
} as const;

/**
 * All system configuration schemas
 */
export const SYSTEM_CONFIG_SCHEMAS = {
  arrayLayout: 'solar_array_layout',
  dcElectrical: 'dc_electrical_design',
  acElectrical: 'ac_electrical_design',
  stringOptimization: 'string_optimization',
  dcAcRatio: 'dc_ac_ratio',
  systemEfficiency: 'system_efficiency',
  fullSystem: 'solar_system_configuration'
} as const;

/**
 * All financial validation schemas
 */
export const FINANCIAL_SCHEMAS = {
  systemCost: 'system_cost',
  federalIncentive: 'federal_incentive',
  stateLocalIncentive: 'state_local_incentive',
  utilityRate: 'utility_rate',
  loan: 'solar_loan',
  lease: 'solar_lease',
  ppa: 'solar_ppa',
  roiAnalysis: 'roi_analysis'
} as const;

/**
 * All customer data schemas
 */
export const CUSTOMER_SCHEMAS = {
  energyUsage: 'energy_usage_patterns',
  propertyInfo: 'property_information',
  utilityInfo: 'utility_information',
  creditFinancing: 'credit_financing',
  geographicData: 'geographic_solar_data',
  contactInfo: 'contact_communication'
} as const;

/**
 * All real-time monitoring schemas
 */
export const MONITORING_SCHEMAS = {
  sensorData: 'sensor_measurement',
  transmission: 'data_transmission',
  alerts: 'alert_threshold',
  anomalies: 'anomaly_detection',
  systemHealth: 'system_health'
} as const;

/**
 * All integration schemas
 */
export const INTEGRATION_SCHEMAS = {
  thirdPartyAPI: 'third_party_api',
  weatherAPI: 'weather_api_integration',
  utilityAPI: 'utility_api_integration',
  financialAPI: 'financial_api_integration',
  dataSync: 'data_synchronization',
  migration: 'legacy_migration'
} as const;

// =====================================================
// VALIDATION PRESETS
// =====================================================

/**
 * Common validation presets for different use cases
 */
export const VALIDATION_PRESETS = {
  // Complete system validation
  COMPLETE_SYSTEM: [
    ...Object.values(EQUIPMENT_SCHEMAS),
    ...Object.values(SYSTEM_CONFIG_SCHEMAS),
    ...Object.values(FINANCIAL_SCHEMAS)
  ],
  
  // Basic quote validation
  BASIC_QUOTE: [
    EQUIPMENT_SCHEMAS.solarPanel,
    EQUIPMENT_SCHEMAS.inverter,
    SYSTEM_CONFIG_SCHEMAS.arrayLayout,
    FINANCIAL_SCHEMAS.systemCost
  ],
  
  // Installation readiness
  INSTALLATION_READY: [
    EQUIPMENT_SCHEMAS.compatibility,
    SYSTEM_CONFIG_SCHEMAS.fullSystem,
    'site_assessment',
    'permit_requirements'
  ],
  
  // Customer onboarding
  CUSTOMER_ONBOARDING: [
    CUSTOMER_SCHEMAS.energyUsage,
    CUSTOMER_SCHEMAS.propertyInfo,
    CUSTOMER_SCHEMAS.contactInfo
  ],
  
  // Real-time monitoring setup
  MONITORING_SETUP: [
    MONITORING_SCHEMAS.sensorData,
    MONITORING_SCHEMAS.alerts,
    MONITORING_SCHEMAS.systemHealth
  ]
} as const;

// =====================================================
// VALIDATION ERROR CODES
// =====================================================

/**
 * Standardized error codes for solar validation
 */
export const SOLAR_VALIDATION_ERROR_CODES = {
  // Equipment errors
  EQUIPMENT_INCOMPATIBLE: 'EQUIPMENT_INCOMPATIBLE',
  CERTIFICATION_MISSING: 'CERTIFICATION_MISSING',
  SPECIFICATION_INVALID: 'SPECIFICATION_INVALID',
  
  // System configuration errors
  SYSTEM_OVERSIZED: 'SYSTEM_OVERSIZED',
  VOLTAGE_MISMATCH: 'VOLTAGE_MISMATCH',
  NEC_VIOLATION: 'NEC_VIOLATION',
  STRING_IMBALANCE: 'STRING_IMBALANCE',
  
  // Financial errors
  COST_OUT_OF_RANGE: 'COST_OUT_OF_RANGE',
  INCENTIVE_INELIGIBLE: 'INCENTIVE_INELIGIBLE',
  FINANCING_DISQUALIFIED: 'FINANCING_DISQUALIFIED',
  ROI_CALCULATION_ERROR: 'ROI_CALCULATION_ERROR',
  
  // Installation errors
  SITE_UNSUITABLE: 'SITE_UNSUITABLE',
  PERMIT_VIOLATION: 'PERMIT_VIOLATION',
  STRUCTURAL_INADEQUATE: 'STRUCTURAL_INADEQUATE',
  
  // Customer data errors
  USAGE_DATA_INCOMPLETE: 'USAGE_DATA_INCOMPLETE',
  PROPERTY_INFO_MISSING: 'PROPERTY_INFO_MISSING',
  CREDIT_INSUFFICIENT: 'CREDIT_INSUFFICIENT',
  
  // Real-time monitoring errors
  SENSOR_DATA_STALE: 'SENSOR_DATA_STALE',
  TRANSMISSION_FAILED: 'TRANSMISSION_FAILED',
  PERFORMANCE_ANOMALY: 'PERFORMANCE_ANOMALY',
  
  // Integration errors
  API_AUTHENTICATION_FAILED: 'API_AUTHENTICATION_FAILED',
  DATA_SYNC_FAILED: 'DATA_SYNC_FAILED',
  MIGRATION_INCOMPLETE: 'MIGRATION_INCOMPLETE'
} as const;

// =====================================================
// VERSION INFORMATION
// =====================================================

export const SOLAR_VALIDATION_VERSION = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  compatibleApiVersions: ['v1', 'v2'],
  features: [
    'comprehensive_equipment_validation',
    'system_configuration_validation',
    'financial_analysis_validation',
    'real_time_monitoring_validation',
    'integration_validation',
    'cross_validation_rules',
    'context_aware_validation',
    'performance_optimized',
    'industry_standards_compliant'
  ]
};

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  // Core components
  orchestrator: solarValidationOrchestrator,
  middleware: solarAPIMiddleware,
  
  // Schema collections
  schemas: {
    equipment: EQUIPMENT_SCHEMAS,
    systemConfig: SYSTEM_CONFIG_SCHEMAS,
    financial: FINANCIAL_SCHEMAS,
    customer: CUSTOMER_SCHEMAS,
    monitoring: MONITORING_SCHEMAS,
    integration: INTEGRATION_SCHEMAS
  },
  
  // Validation presets
  presets: VALIDATION_PRESETS,
  
  // Error codes
  errorCodes: SOLAR_VALIDATION_ERROR_CODES,
  
  // Version info
  version: SOLAR_VALIDATION_VERSION
};