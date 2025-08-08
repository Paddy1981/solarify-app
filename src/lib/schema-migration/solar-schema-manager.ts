/**
 * Solar-Specific Schema Management
 * Specialized schema management for solar equipment, energy production data,
 * user profiles, financial calculations, and API integrations
 */

import { Timestamp } from 'firebase/firestore';
import {
  SchemaDefinition,
  CollectionSchemaDefinition,
  FieldDefinition,
  SchemaVersion,
  VersionUtils,
  SchemaVersionManager
} from './version-manager';
import {
  MigrationOperation,
  DataTransformer,
  TransformDataOperation,
  AddFieldOperation,
  RenameFieldOperation,
  MigrationEngine
} from './migration-engine';
import {
  ValidationRule,
  ValidationRegistry,
  DocumentValidator
} from './validation-system';

// =====================================================
// SOLAR SCHEMA DEFINITIONS
// =====================================================

export class SolarSchemaDefinitions {
  // Solar Equipment Schemas
  static readonly SOLAR_PANEL_SCHEMA_V1: CollectionSchemaDefinition = {
    name: 'products_solar_panels',
    fields: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Unique product identifier'
      },
      {
        name: 'brand',
        type: 'string',
        required: true,
        validation: { min: 2, max: 50 },
        description: 'Panel manufacturer brand'
      },
      {
        name: 'model',
        type: 'string',
        required: true,
        validation: { min: 2, max: 100 },
        description: 'Panel model number'
      },
      {
        name: 'wattage',
        type: 'number',
        required: true,
        validation: { min: 100, max: 1000 },
        description: 'Panel power rating in watts'
      },
      {
        name: 'efficiency',
        type: 'number',
        required: true,
        validation: { min: 10, max: 35 },
        description: 'Panel efficiency percentage'
      },
      {
        name: 'dimensions',
        type: 'map',
        required: true,
        description: 'Panel physical dimensions'
      },
      {
        name: 'voltage',
        type: 'map',
        required: true,
        description: 'Electrical voltage specifications'
      },
      {
        name: 'temperature',
        type: 'map',
        required: false,
        description: 'Temperature coefficients'
      },
      {
        name: 'warranty',
        type: 'map',
        required: true,
        description: 'Warranty information'
      },
      {
        name: 'certifications',
        type: 'array',
        required: true,
        description: 'Industry certifications'
      }
    ],
    indexes: [
      {
        name: 'brand_wattage_idx',
        fields: [
          { fieldPath: 'brand', order: 'asc' },
          { fieldPath: 'wattage', order: 'desc' }
        ],
        type: 'composite'
      },
      {
        name: 'efficiency_idx',
        fields: [{ fieldPath: 'efficiency', order: 'desc' }],
        type: 'single'
      }
    ],
    validationRules: [
      {
        name: 'solar_panel_power_validation',
        field: 'wattage',
        rule: 'value >= 100 && value <= 1000',
        message: 'Solar panel wattage must be between 100W and 1000W',
        severity: 'error'
      }
    ]
  };

  static readonly INVERTER_SCHEMA_V1: CollectionSchemaDefinition = {
    name: 'products_inverters',
    fields: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Unique product identifier'
      },
      {
        name: 'brand',
        type: 'string',
        required: true,
        validation: { min: 2, max: 50 }
      },
      {
        name: 'model',
        type: 'string',
        required: true,
        validation: { min: 2, max: 100 }
      },
      {
        name: 'type',
        type: 'string',
        required: true,
        validation: { enum: ['string', 'central', 'microinverter', 'power_optimizer'] },
        description: 'Inverter type'
      },
      {
        name: 'acPower',
        type: 'number',
        required: true,
        validation: { min: 100, max: 100000 },
        description: 'AC power rating in watts'
      },
      {
        name: 'dcPower',
        type: 'number',
        required: true,
        validation: { min: 100, max: 100000 },
        description: 'DC power rating in watts'
      },
      {
        name: 'efficiency',
        type: 'number',
        required: true,
        validation: { min: 85, max: 99.5 },
        description: 'Inverter efficiency percentage'
      },
      {
        name: 'channels',
        type: 'number',
        required: false,
        validation: { min: 1, max: 32 },
        description: 'Number of input channels'
      },
      {
        name: 'warranty',
        type: 'map',
        required: true,
        description: 'Warranty information'
      }
    ],
    indexes: [
      {
        name: 'type_power_idx',
        fields: [
          { fieldPath: 'type', order: 'asc' },
          { fieldPath: 'acPower', order: 'desc' }
        ],
        type: 'composite'
      }
    ],
    validationRules: [
      {
        name: 'inverter_efficiency_validation',
        field: 'efficiency',
        rule: 'value >= 85 && value <= 99.5',
        message: 'Inverter efficiency must be between 85% and 99.5%',
        severity: 'error'
      }
    ]
  };

  static readonly BATTERY_SCHEMA_V1: CollectionSchemaDefinition = {
    name: 'products_batteries',
    fields: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Unique product identifier'
      },
      {
        name: 'brand',
        type: 'string',
        required: true,
        validation: { min: 2, max: 50 }
      },
      {
        name: 'model',
        type: 'string',
        required: true,
        validation: { min: 2, max: 100 }
      },
      {
        name: 'type',
        type: 'string',
        required: true,
        validation: { enum: ['lithium_ion', 'lead_acid', 'saltwater', 'flow'] },
        description: 'Battery chemistry type'
      },
      {
        name: 'capacity',
        type: 'number',
        required: true,
        validation: { min: 1, max: 1000 },
        description: 'Battery capacity in kWh'
      },
      {
        name: 'voltage',
        type: 'number',
        required: true,
        validation: { min: 12, max: 800 },
        description: 'Battery voltage'
      },
      {
        name: 'cycleLife',
        type: 'number',
        required: true,
        validation: { min: 1000, max: 20000 },
        description: 'Expected cycle life'
      },
      {
        name: 'depthOfDischarge',
        type: 'number',
        required: true,
        validation: { min: 50, max: 100 },
        description: 'Maximum depth of discharge percentage'
      },
      {
        name: 'roundTripEfficiency',
        type: 'number',
        required: true,
        validation: { min: 70, max: 99 },
        description: 'Round trip efficiency percentage'
      },
      {
        name: 'warranty',
        type: 'map',
        required: true,
        description: 'Warranty information'
      }
    ],
    indexes: [
      {
        name: 'type_capacity_idx',
        fields: [
          { fieldPath: 'type', order: 'asc' },
          { fieldPath: 'capacity', order: 'desc' }
        ],
        type: 'composite'
      }
    ],
    validationRules: [
      {
        name: 'battery_capacity_validation',
        field: 'capacity',
        rule: 'value > 0 && value <= 1000',
        message: 'Battery capacity must be between 1 and 1000 kWh',
        severity: 'error'
      }
    ]
  };

  // Energy Production Schema
  static readonly ENERGY_PRODUCTION_SCHEMA_V1: CollectionSchemaDefinition = {
    name: 'energy_production',
    fields: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Unique record identifier'
      },
      {
        name: 'systemId',
        type: 'string',
        required: true,
        description: 'Reference to solar system',
        references: { collection: 'solar_systems' }
      },
      {
        name: 'timestamp',
        type: 'timestamp',
        required: true,
        description: 'Data timestamp'
      },
      {
        name: 'interval',
        type: 'string',
        required: true,
        validation: { enum: ['15min', '1hour', '1day', '1month'] },
        description: 'Data aggregation interval'
      },
      {
        name: 'production',
        type: 'map',
        required: true,
        description: 'Production metrics'
      },
      {
        name: 'environmental',
        type: 'map',
        required: false,
        description: 'Environmental conditions'
      },
      {
        name: 'performance',
        type: 'map',
        required: true,
        description: 'Performance metrics'
      },
      {
        name: 'status',
        type: 'map',
        required: true,
        description: 'System status'
      },
      {
        name: 'dataQuality',
        type: 'map',
        required: true,
        description: 'Data quality indicators'
      }
    ],
    indexes: [
      {
        name: 'system_timestamp_idx',
        fields: [
          { fieldPath: 'systemId', order: 'asc' },
          { fieldPath: 'timestamp', order: 'desc' }
        ],
        type: 'composite'
      },
      {
        name: 'interval_timestamp_idx',
        fields: [
          { fieldPath: 'interval', order: 'asc' },
          { fieldPath: 'timestamp', order: 'desc' }
        ],
        type: 'composite'
      }
    ]
  };

  // User Profile Schemas
  static readonly HOMEOWNER_PROFILE_SCHEMA_V2: CollectionSchemaDefinition = {
    name: 'profiles_homeowners',
    fields: [
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: 'Reference to user account'
      },
      {
        name: 'type',
        type: 'string',
        required: true,
        validation: { enum: ['homeowner'] },
        description: 'Profile type'
      },
      {
        name: 'personalInfo',
        type: 'map',
        required: true,
        description: 'Personal information',
        addedInVersion: { major: 2, minor: 0, patch: 0 }
      },
      {
        name: 'properties',
        type: 'array',
        required: true,
        description: 'Property information array'
      },
      {
        name: 'preferences',
        type: 'map',
        required: true,
        description: 'Solar preferences'
      },
      {
        name: 'verification',
        type: 'map',
        required: true,
        description: 'Verification status'
      },
      {
        name: 'financialProfile',
        type: 'map',
        required: false,
        description: 'Financial qualification data',
        addedInVersion: { major: 2, minor: 0, patch: 0 }
      },
      {
        name: 'energyProfile',
        type: 'map',
        required: false,
        description: 'Energy usage patterns',
        addedInVersion: { major: 2, minor: 0, patch: 0 }
      }
    ],
    indexes: [
      {
        name: 'verification_status_idx',
        fields: [{ fieldPath: 'verification.identityVerified', order: 'asc' }],
        type: 'single'
      }
    ]
  };

  // Financial Calculation Schema
  static readonly FINANCIAL_CALCULATION_SCHEMA_V1: CollectionSchemaDefinition = {
    name: 'financial_calculations',
    fields: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Unique calculation identifier'
      },
      {
        name: 'systemId',
        type: 'string',
        required: false,
        description: 'Reference to solar system'
      },
      {
        name: 'quoteId',
        type: 'string',
        required: false,
        description: 'Reference to quote'
      },
      {
        name: 'calculationType',
        type: 'string',
        required: true,
        validation: { enum: ['savings_estimate', 'roi_analysis', 'financing_comparison', 'incentive_calculation'] },
        description: 'Type of financial calculation'
      },
      {
        name: 'inputs',
        type: 'map',
        required: true,
        description: 'Calculation input parameters'
      },
      {
        name: 'outputs',
        type: 'map',
        required: true,
        description: 'Calculation results'
      },
      {
        name: 'assumptions',
        type: 'map',
        required: true,
        description: 'Calculation assumptions'
      },
      {
        name: 'sensitivity',
        type: 'map',
        required: false,
        description: 'Sensitivity analysis results'
      },
      {
        name: 'scenarios',
        type: 'array',
        required: false,
        description: 'Alternative scenario results'
      },
      {
        name: 'calculatedAt',
        type: 'timestamp',
        required: true,
        description: 'Calculation timestamp'
      },
      {
        name: 'validUntil',
        type: 'timestamp',
        required: false,
        description: 'Calculation expiration'
      }
    ],
    indexes: [
      {
        name: 'type_calculated_idx',
        fields: [
          { fieldPath: 'calculationType', order: 'asc' },
          { fieldPath: 'calculatedAt', order: 'desc' }
        ],
        type: 'composite'
      }
    ]
  };
}

// =====================================================
// SOLAR SCHEMA MIGRATION TEMPLATES
// =====================================================

export class SolarMigrationTemplates {
  // Equipment schema migrations
  static createSolarPanelV1ToV2Migration(): MigrationOperation[] {
    return [
      {
        id: 'add_degradation_rate',
        type: 'add_field',
        collection: 'products',
        description: 'Add degradation rate field to solar panels',
        field: {
          name: 'specifications.degradationRate',
          defaultValue: 0.5, // 0.5% per year typical
          required: false
        },
        priority: 1
      } as AddFieldOperation,
      {
        id: 'normalize_power_units',
        type: 'transform_data',
        collection: 'products',
        description: 'Normalize power units to watts',
        transformer: SolarDataTransformers.NORMALIZE_POWER_UNITS,
        priority: 2
      } as TransformDataOperation,
      {
        id: 'add_bifacial_support',
        type: 'add_field',
        collection: 'products',
        description: 'Add bifacial panel support',
        field: {
          name: 'specifications.bifacial',
          defaultValue: false,
          required: false
        },
        priority: 3
      } as AddFieldOperation
    ];
  }

  static createEnergyProductionV1ToV2Migration(): MigrationOperation[] {
    return [
      {
        id: 'rename_dc_power_field',
        type: 'rename_field',
        collection: 'energy_production',
        description: 'Rename dcPower to dc_power for consistency',
        field: {
          oldName: 'production.dcPower',
          newName: 'production.dc_power',
          preserveOldField: false
        },
        priority: 1
      } as RenameFieldOperation,
      {
        id: 'add_performance_ratio',
        type: 'add_field',
        collection: 'energy_production',
        description: 'Add performance ratio calculation',
        field: {
          name: 'performance.performanceRatio',
          defaultValue: 0,
          required: false
        },
        priority: 2
      } as AddFieldOperation,
      {
        id: 'migrate_status_structure',
        type: 'transform_data',
        collection: 'energy_production',
        description: 'Migrate status structure to new format',
        transformer: SolarDataTransformers.MIGRATE_STATUS_STRUCTURE,
        priority: 3
      } as TransformDataOperation
    ];
  }

  static createHomeownerProfileV1ToV2Migration(): MigrationOperation[] {
    return [
      {
        id: 'restructure_personal_info',
        type: 'transform_data',
        collection: 'profiles',
        description: 'Restructure personal information fields',
        transformer: SolarDataTransformers.RESTRUCTURE_PERSONAL_INFO,
        priority: 1
      } as TransformDataOperation,
      {
        id: 'add_financial_profile',
        type: 'add_field',
        collection: 'profiles',
        description: 'Add financial profile section',
        field: {
          name: 'financialProfile',
          defaultValue: {
            creditScore: null,
            annualIncome: null,
            debtToIncomeRatio: null,
            preferredFinancing: null
          },
          required: false
        },
        priority: 2
      } as AddFieldOperation,
      {
        id: 'add_energy_profile',
        type: 'add_field',
        collection: 'profiles',
        description: 'Add energy usage profile',
        field: {
          name: 'energyProfile',
          defaultValue: {
            averageMonthlyUsage: null,
            peakUsageMonths: [],
            timeOfUseRates: null,
            netMeteringAvailable: null
          },
          required: false
        },
        priority: 3
      } as AddFieldOperation
    ];
  }

  // Comprehensive migration for major version update
  static createMajorVersionMigration(fromVersion: SchemaVersion, toVersion: SchemaVersion): MigrationOperation[] {
    const operations: MigrationOperation[] = [];

    // Equipment migrations
    operations.push(...this.createSolarPanelV1ToV2Migration());
    operations.push(...this.createEnergyProductionV1ToV2Migration());
    operations.push(...this.createHomeownerProfileV1ToV2Migration());

    // Add any cross-collection migrations
    operations.push({
      id: 'update_collection_references',
      type: 'transform_data',
      collection: '*', // Apply to all collections
      description: 'Update collection references for new schema structure',
      transformer: SolarDataTransformers.UPDATE_COLLECTION_REFERENCES,
      priority: 100 // Run last
    } as TransformDataOperation);

    return operations;
  }
}

// =====================================================
// SOLAR DATA TRANSFORMERS
// =====================================================

export class SolarDataTransformers {
  static readonly NORMALIZE_POWER_UNITS: DataTransformer = {
    name: 'normalize_power_units',
    transform: async (document: any) => {
      if (!document.specifications || document.category !== 'solar_panels') {
        return null; // Skip non-solar panel products
      }

      let power = document.specifications.power || document.specifications.wattage;
      if (!power) return null;

      // Convert various power formats to watts
      if (typeof power === 'string') {
        if (power.includes('kW') || power.includes('KW')) {
          power = parseFloat(power.replace(/[^\d.]/g, '')) * 1000;
        } else if (power.includes('MW') || power.includes('mW')) {
          power = parseFloat(power.replace(/[^\d.]/g, '')) * 1000000;
        } else {
          power = parseFloat(power.replace(/[^\d.]/g, ''));
        }
      }

      return {
        ...document,
        specifications: {
          ...document.specifications,
          power: Math.round(power),
          powerUnit: 'watts',
          // Remove old fields
          wattage: undefined
        }
      };
    },
    validate: (original: any, transformed: any) => {
      return transformed.specifications?.power > 0;
    }
  };

  static readonly MIGRATE_STATUS_STRUCTURE: DataTransformer = {
    name: 'migrate_status_structure',
    transform: async (document: any) => {
      if (!document.status) return null;

      const oldStatus = document.status;
      const newStatus = {
        operationalStatus: oldStatus.status || 'normal',
        faults: Array.isArray(oldStatus.faults) ? oldStatus.faults : [],
        alerts: Array.isArray(oldStatus.alerts) ? oldStatus.alerts : [],
        lastUpdate: oldStatus.lastUpdate || Timestamp.now(),
        communicationStatus: oldStatus.online ? 'online' : 'offline'
      };

      return {
        ...document,
        status: newStatus
      };
    }
  };

  static readonly RESTRUCTURE_PERSONAL_INFO: DataTransformer = {
    name: 'restructure_personal_info',
    transform: async (document: any) => {
      if (document.type !== 'homeowner') return null;

      const personalInfo = {
        firstName: document.firstName,
        lastName: document.lastName,
        fullName: `${document.firstName} ${document.lastName}`,
        dateOfBirth: document.dateOfBirth || null,
        ssn: document.ssn || null, // Should be encrypted
        address: document.address,
        contactInfo: {
          email: document.email,
          phone: document.phoneNumber,
          preferredContact: document.preferences?.communicationPreference || 'email'
        }
      };

      return {
        ...document,
        personalInfo,
        // Remove old top-level fields
        firstName: undefined,
        lastName: undefined,
        email: undefined,
        phoneNumber: undefined
      };
    }
  };

  static readonly UPDATE_COLLECTION_REFERENCES: DataTransformer = {
    name: 'update_collection_references',
    transform: async (document: any) => {
      let hasChanges = false;
      const updated = { ...document };

      // Update common reference field naming
      const referenceFields = [
        { old: 'homeowner_id', new: 'homeownerId' },
        { old: 'installer_id', new: 'installerId' },
        { old: 'supplier_id', new: 'supplierId' },
        { old: 'system_id', new: 'systemId' },
        { old: 'rfq_id', new: 'rfqId' },
        { old: 'quote_id', new: 'quoteId' }
      ];

      for (const { old, new: newField } of referenceFields) {
        if (document[old] !== undefined) {
          updated[newField] = document[old];
          updated[old] = undefined;
          hasChanges = true;
        }
      }

      return hasChanges ? updated : null;
    }
  };

  static readonly MIGRATE_ENERGY_CALCULATIONS: DataTransformer = {
    name: 'migrate_energy_calculations',
    transform: async (document: any) => {
      if (!document.production) return null;

      const production = document.production;
      let updated = false;
      const newProduction = { ...production };

      // Calculate missing fields
      if (!production.energy && production.acPower && document.interval) {
        const hours = document.interval === '1hour' ? 1 : 
                     document.interval === '1day' ? 24 : 
                     document.interval === '15min' ? 0.25 : 1;
        newProduction.energy = (production.acPower * hours) / 1000; // Convert to kWh
        updated = true;
      }

      // Calculate efficiency if missing
      if (!production.efficiency && production.acPower && production.dcPower && production.dcPower > 0) {
        newProduction.efficiency = (production.acPower / production.dcPower) * 100;
        updated = true;
      }

      return updated ? { ...document, production: newProduction } : null;
    }
  };

  static readonly NORMALIZE_ADDRESS_FORMAT: DataTransformer = {
    name: 'normalize_address_format',
    transform: async (document: any) => {
      const addressFields = ['address', 'businessAddress', 'propertyAddress'];
      let hasChanges = false;
      const updated = { ...document };

      for (const field of addressFields) {
        const address = document[field];
        if (!address) continue;

        // If address is a string, convert to structured format
        if (typeof address === 'string') {
          const parts = address.split(',').map(part => part.trim());
          updated[field] = {
            street: parts[0] || '',
            city: parts[1] || '',
            state: parts[2] || '',
            zipCode: parts[3] || '',
            county: '',
            coordinates: {
              latitude: document.latitude || 0,
              longitude: document.longitude || 0
            }
          };
          hasChanges = true;
        }
        // Ensure coordinates exist
        else if (typeof address === 'object' && !address.coordinates) {
          updated[field] = {
            ...address,
            coordinates: {
              latitude: document.latitude || 0,
              longitude: document.longitude || 0
            }
          };
          hasChanges = true;
        }
      }

      return hasChanges ? updated : null;
    }
  };
}

// =====================================================
// SOLAR VALIDATION RULES
// =====================================================

export class SolarValidationRules {
  static readonly SOLAR_SYSTEM_CAPACITY_CONSISTENCY: ValidationRule = {
    id: 'solar_system_capacity_consistency',
    name: 'Solar System Capacity Consistency',
    description: 'Validates system capacity matches component specifications',
    severity: 'warning',
    category: 'integrity',
    validate: (value: any, document: any) => {
      if (!document.systemDesign) return { passed: true };

      const { totalCapacity, panels, inverters } = document.systemDesign;
      
      // Calculate panel capacity
      let panelCapacityKW = 0;
      if (panels && Array.isArray(panels)) {
        panelCapacityKW = panels.reduce((sum, panel) => 
          sum + ((panel.wattage || 0) * (panel.quantity || 0)), 0) / 1000;
      }

      // Calculate inverter capacity
      let inverterCapacityKW = 0;
      if (inverters && Array.isArray(inverters)) {
        inverterCapacityKW = inverters.reduce((sum, inverter) => 
          sum + ((inverter.capacity || 0) * (inverter.quantity || 0)), 0) / 1000;
      }

      // Check consistency
      const tolerance = 0.1; // 10% tolerance
      if (totalCapacity && panelCapacityKW > 0) {
        const panelDiff = Math.abs(totalCapacity - panelCapacityKW) / totalCapacity;
        if (panelDiff > tolerance) {
          return {
            passed: false,
            message: `System capacity (${totalCapacity} kW) doesn't match panel capacity (${panelCapacityKW.toFixed(2)} kW)`
          };
        }
      }

      return { passed: true };
    }
  };

  static readonly SOLAR_PRODUCTION_DATA_QUALITY: ValidationRule = {
    id: 'solar_production_data_quality',
    name: 'Solar Production Data Quality',
    description: 'Validates energy production data quality and consistency',
    severity: 'error',
    category: 'integrity',
    validate: (value: any, document: any) => {
      if (!document.production) return { passed: true };

      const production = document.production;
      
      // Check for negative values
      const numericFields = ['dcPower', 'acPower', 'energy', 'voltage', 'current'];
      for (const field of numericFields) {
        if (production[field] && production[field] < 0) {
          return {
            passed: false,
            message: `Production field '${field}' cannot be negative: ${production[field]}`
          };
        }
      }

      // Check AC/DC power relationship (AC should be <= DC)
      if (production.acPower && production.dcPower && 
          production.acPower > production.dcPower * 1.1) { // Allow 10% tolerance for measurement errors
        return {
          passed: false,
          message: `AC power (${production.acPower}W) cannot exceed DC power (${production.dcPower}W) by more than 10%`
        };
      }

      // Check power and voltage/current relationship (P = V * I)
      if (production.dcPower && production.voltage && production.current) {
        const calculatedPower = production.voltage * production.current;
        const powerDiff = Math.abs(calculatedPower - production.dcPower) / production.dcPower;
        if (powerDiff > 0.2) { // 20% tolerance
          return {
            passed: false,
            message: `DC power (${production.dcPower}W) inconsistent with V*I calculation (${calculatedPower.toFixed(0)}W)`
          };
        }
      }

      return { passed: true };
    }
  };

  static readonly SOLAR_FINANCIAL_CALCULATION_VALIDATION: ValidationRule = {
    id: 'solar_financial_calculation_validation',
    name: 'Solar Financial Calculation Validation',
    description: 'Validates solar financial calculations for reasonableness',
    severity: 'warning',
    category: 'business',
    validate: (value: any, document: any) => {
      if (!document.outputs) return { passed: true };

      const outputs = document.outputs;

      // Payback period should be reasonable (2-25 years)
      if (outputs.paybackPeriod && (outputs.paybackPeriod < 2 || outputs.paybackPeriod > 25)) {
        return {
          passed: false,
          message: `Payback period (${outputs.paybackPeriod} years) seems unrealistic (should be 2-25 years)`
        };
      }

      // ROI should be reasonable (5-30% annually)
      if (outputs.roi && (outputs.roi < 5 || outputs.roi > 30)) {
        return {
          passed: false,
          message: `ROI (${outputs.roi}%) seems unrealistic (should be 5-30%)`
        };
      }

      // NPV should be positive for good investments
      if (outputs.npv && outputs.npv < -10000) {
        return {
          passed: false,
          message: `Very negative NPV ($${outputs.npv.toLocaleString()}) suggests poor investment`
        };
      }

      // First year savings should be reasonable percentage of system cost
      if (outputs.firstYearSavings && document.inputs?.systemCost) {
        const savingsPercentage = (outputs.firstYearSavings / document.inputs.systemCost) * 100;
        if (savingsPercentage > 50 || savingsPercentage < 5) {
          return {
            passed: false,
            message: `First year savings (${savingsPercentage.toFixed(1)}% of system cost) seems unrealistic`
          };
        }
      }

      return { passed: true };
    }
  };

  static getAllSolarRules(): ValidationRule[] {
    return [
      this.SOLAR_SYSTEM_CAPACITY_CONSISTENCY,
      this.SOLAR_PRODUCTION_DATA_QUALITY,
      this.SOLAR_FINANCIAL_CALCULATION_VALIDATION
    ];
  }
}

// =====================================================
// SOLAR SCHEMA MANAGER
// =====================================================

export class SolarSchemaManager {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    // Register solar-specific validation rules
    SolarValidationRules.getAllSolarRules().forEach(rule => {
      ValidationRegistry.registerRule(rule);
    });

    // Create initial schema definitions if they don't exist
    await this.createInitialSchemas();

    this.initialized = true;
  }

  static async createInitialSchemas(): Promise<void> {
    const schemas = [
      {
        id: 'solar_panels_v1',
        version: { major: 1, minor: 0, patch: 0 },
        name: 'Solar Panels Schema V1',
        description: 'Initial solar panel product schema',
        collections: [SolarSchemaDefinitions.SOLAR_PANEL_SCHEMA_V1],
        createdAt: Timestamp.now(),
        createdBy: 'system',
        environment: 'development',
        status: 'active',
        compatibility: { backwards: true, forwards: false },
        metadata: {
          changeType: 'major',
          breaking: false,
          rollbackSupported: true,
          migrationRequired: false
        }
      } as SchemaDefinition,
      {
        id: 'energy_production_v1',
        version: { major: 1, minor: 0, patch: 0 },
        name: 'Energy Production Schema V1',
        description: 'Initial energy production data schema',
        collections: [SolarSchemaDefinitions.ENERGY_PRODUCTION_SCHEMA_V1],
        createdAt: Timestamp.now(),
        createdBy: 'system',
        environment: 'development',
        status: 'active',
        compatibility: { backwards: true, forwards: false },
        metadata: {
          changeType: 'major',
          breaking: false,
          rollbackSupported: true,
          migrationRequired: false
        }
      } as SchemaDefinition
    ];

    for (const schema of schemas) {
      try {
        const existing = await SchemaVersionManager.getSchemaDefinition(schema.id);
        if (!existing) {
          await SchemaVersionManager.registerSchema(schema);
          console.log(`Created schema: ${schema.name}`);
        }
      } catch (error) {
        console.error(`Failed to create schema ${schema.name}:`, error);
      }
    }
  }

  static async migrateSolarEquipmentSchema(
    fromVersion: SchemaVersion,
    toVersion: SchemaVersion
  ): Promise<void> {
    const operations = SolarMigrationTemplates.createSolarPanelV1ToV2Migration();
    
    const migrationResult = await MigrationEngine.executeOperations(operations, {
      migrationId: `solar_equipment_${Date.now()}`,
      schemaVersion: toVersion,
      environment: process.env.NODE_ENV || 'development',
      startTime: Timestamp.now(),
      dryRun: false,
      options: {
        batchSize: 100,
        concurrency: 3,
        retryAttempts: 3,
        retryDelay: 1000,
        timeoutMs: 300000,
        backupBeforeMigration: true,
        validateAfterMigration: true,
        rollbackOnError: false,
        continueOnError: false
      },
      stats: {
        documentsProcessed: 0,
        documentsUpdated: 0,
        documentsSkipped: 0,
        documentsDeleted: 0,
        errorsEncountered: 0,
        operationsCompleted: 0,
        totalOperations: operations.length,
        startTime: Timestamp.now(),
        elapsedMs: 0
      },
      logger: new (await import('./migration-engine')).MigrationLogger(`solar_equipment_${Date.now()}`)
    });

    if (!migrationResult.success) {
      throw new Error(`Solar equipment migration failed: ${migrationResult.errors.join(', ')}`);
    }
  }

  static async validateSolarSystemData(systemData: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const validator = new DocumentValidator();
    const context = {
      collectionName: 'solar_systems',
      environment: process.env.NODE_ENV || 'development',
      operation: 'create' as const,
      timestamp: Timestamp.now()
    };

    const result = await validator.validateDocument(systemData, context);
    
    return {
      isValid: result.isValid,
      errors: result.errors.map(e => e.message),
      warnings: result.warnings.map(w => w.message)
    };
  }

  // Helper method to get solar-specific schema templates
  static getSolarSchemaTemplates(): Record<string, CollectionSchemaDefinition> {
    return {
      'solar_panels': SolarSchemaDefinitions.SOLAR_PANEL_SCHEMA_V1,
      'inverters': SolarSchemaDefinitions.INVERTER_SCHEMA_V1,
      'batteries': SolarSchemaDefinitions.BATTERY_SCHEMA_V1,
      'energy_production': SolarSchemaDefinitions.ENERGY_PRODUCTION_SCHEMA_V1,
      'homeowner_profiles': SolarSchemaDefinitions.HOMEOWNER_PROFILE_SCHEMA_V2,
      'financial_calculations': SolarSchemaDefinitions.FINANCIAL_CALCULATION_SCHEMA_V1
    };
  }
}

// Auto-initialize when module is imported
SolarSchemaManager.initialize().catch(console.error);