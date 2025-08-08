/**
 * Data Validation System
 * Comprehensive validation framework for schema operations, runtime validation,
 * and data integrity checks with solar-specific validators
 */

import { DocumentData, Timestamp } from 'firebase/firestore';
import { 
  SchemaDefinition, 
  CollectionSchemaDefinition, 
  FieldDefinition,
  SchemaVersion,
  VersionUtils
} from './version-manager';

// =====================================================
// VALIDATION TYPES
// =====================================================

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  field?: string; // If null, applies to entire document
  severity: 'error' | 'warning' | 'info';
  category: 'type' | 'format' | 'business' | 'integrity' | 'performance' | 'security';
  validate: (value: any, document: DocumentData, context: ValidationContext) => ValidationRuleResult;
  dependencies?: string[]; // Other rules that must pass first
}

export interface ValidationRuleResult {
  passed: boolean;
  message?: string;
  suggestedFix?: any;
  metadata?: Record<string, any>;
}

export interface ValidationContext {
  collectionName: string;
  documentId?: string;
  schema?: CollectionSchemaDefinition;
  schemaVersion?: SchemaVersion;
  environment: string;
  userId?: string;
  operation: 'create' | 'update' | 'delete' | 'read' | 'migration' | 'batch';
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

export interface DocumentValidationResult {
  isValid: boolean;
  documentId?: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
  stats: ValidationStats;
  suggestedFixes: Record<string, any>;
}

export interface ValidationError {
  ruleId: string;
  field?: string;
  message: string;
  value?: any;
  expectedType?: string;
  severity: 'error';
  code: string;
}

export interface ValidationWarning {
  ruleId: string;
  field?: string;
  message: string;
  value?: any;
  severity: 'warning';
  code: string;
}

export interface ValidationInfo {
  ruleId: string;
  field?: string;
  message: string;
  value?: any;
  severity: 'info';
  code: string;
}

export interface ValidationStats {
  rulesEvaluated: number;
  rulesSkipped: number;
  rulesPassed: number;
  rulesFailed: number;
  executionTimeMs: number;
  fieldsValidated: number;
}

export interface SchemaValidationResult {
  isValid: boolean;
  collectionResults: Record<string, CollectionValidationResult>;
  globalErrors: ValidationError[];
  globalWarnings: ValidationWarning[];
  stats: SchemaValidationStats;
}

export interface CollectionValidationResult {
  collectionName: string;
  isValid: boolean;
  documentsValidated: number;
  documentResults: DocumentValidationResult[];
  fieldValidation: Record<string, FieldValidationResult>;
  indexValidation: IndexValidationResult[];
}

export interface FieldValidationResult {
  fieldName: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  typeConsistency: number; // 0-1 score
  nullCount: number;
  uniqueValues: number;
  valueDistribution: Record<string, number>;
}

export interface IndexValidationResult {
  indexName: string;
  isValid: boolean;
  exists: boolean;
  performance: 'excellent' | 'good' | 'poor' | 'critical';
  usageStats?: {
    queryCount: number;
    avgExecutionTime: number;
    slowQueries: number;
  };
}

export interface SchemaValidationStats {
  collectionsValidated: number;
  documentsValidated: number;
  totalErrors: number;
  totalWarnings: number;
  executionTimeMs: number;
  memoryUsageMB: number;
}

// =====================================================
// VALIDATION REGISTRY
// =====================================================

export class ValidationRegistry {
  private static rules: Map<string, ValidationRule> = new Map();
  private static rulesByCategory: Map<string, ValidationRule[]> = new Map();

  static registerRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
    
    // Add to category map
    if (!this.rulesByCategory.has(rule.category)) {
      this.rulesByCategory.set(rule.category, []);
    }
    this.rulesByCategory.get(rule.category)!.push(rule);
  }

  static getRule(id: string): ValidationRule | undefined {
    return this.rules.get(id);
  }

  static getAllRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  static getRulesByCategory(category: string): ValidationRule[] {
    return this.rulesByCategory.get(category) || [];
  }

  static getRulesForField(fieldName: string): ValidationRule[] {
    return this.getAllRules().filter(rule => 
      rule.field === fieldName || rule.field === '*'
    );
  }

  // Pre-register common rules
  static initialize(): void {
    // Register built-in rules
    BuiltInValidationRules.getAllRules().forEach(rule => {
      this.registerRule(rule);
    });
  }
}

// =====================================================
// DOCUMENT VALIDATOR
// =====================================================

export class DocumentValidator {
  private schema?: CollectionSchemaDefinition;
  private rules: ValidationRule[];

  constructor(schema?: CollectionSchemaDefinition, customRules?: ValidationRule[]) {
    this.schema = schema;
    this.rules = [
      ...ValidationRegistry.getAllRules(),
      ...(customRules || [])
    ];
  }

  async validateDocument(
    document: DocumentData,
    context: ValidationContext
  ): Promise<DocumentValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];
    const suggestedFixes: Record<string, any> = {};

    let rulesEvaluated = 0;
    let rulesSkipped = 0;
    let rulesPassed = 0;
    let rulesFailed = 0;

    // Sort rules by dependencies
    const sortedRules = this.sortRulesByDependencies();
    const executedRules = new Set<string>();

    for (const rule of sortedRules) {
      try {
        // Check dependencies
        if (rule.dependencies) {
          const dependenciesMet = rule.dependencies.every(depId => 
            executedRules.has(depId)
          );
          
          if (!dependenciesMet) {
            rulesSkipped++;
            continue;
          }
        }

        // Determine what to validate
        let value: any;
        if (rule.field) {
          if (rule.field === '*') {
            value = document;
          } else {
            value = this.getNestedValue(document, rule.field);
          }
        } else {
          value = document;
        }

        // Execute validation
        const result = rule.validate(value, document, context);
        rulesEvaluated++;
        executedRules.add(rule.id);

        if (result.passed) {
          rulesPassed++;
        } else {
          rulesFailed++;
          
          const validationItem = {
            ruleId: rule.id,
            field: rule.field,
            message: result.message || `Validation failed for rule: ${rule.name}`,
            value,
            severity: rule.severity,
            code: `${rule.category.toUpperCase()}_${rule.id.toUpperCase()}`
          };

          switch (rule.severity) {
            case 'error':
              errors.push(validationItem as ValidationError);
              break;
            case 'warning':
              warnings.push(validationItem as ValidationWarning);
              break;
            case 'info':
              info.push(validationItem as ValidationInfo);
              break;
          }

          // Add suggested fix
          if (result.suggestedFix && rule.field) {
            suggestedFixes[rule.field] = result.suggestedFix;
          }
        }

      } catch (error) {
        rulesSkipped++;
        console.error(`Error executing validation rule ${rule.id}:`, error);
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      isValid: errors.length === 0,
      documentId: context.documentId,
      errors,
      warnings,
      info,
      stats: {
        rulesEvaluated,
        rulesSkipped,
        rulesPassed,
        rulesFailed,
        executionTimeMs: executionTime,
        fieldsValidated: this.countFields(document)
      },
      suggestedFixes
    };
  }

  private sortRulesByDependencies(): ValidationRule[] {
    const sorted: ValidationRule[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (rule: ValidationRule) => {
      if (visiting.has(rule.id)) {
        throw new Error(`Circular dependency detected in validation rules: ${rule.id}`);
      }

      if (visited.has(rule.id)) {
        return;
      }

      visiting.add(rule.id);

      // Visit dependencies first
      if (rule.dependencies) {
        for (const depId of rule.dependencies) {
          const depRule = this.rules.find(r => r.id === depId);
          if (depRule) {
            visit(depRule);
          }
        }
      }

      visiting.delete(rule.id);
      visited.add(rule.id);
      sorted.push(rule);
    };

    this.rules.forEach(visit);
    return sorted;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : undefined, obj
    );
  }

  private countFields(obj: any): number {
    if (typeof obj !== 'object' || obj === null) return 0;
    
    let count = 0;
    for (const key in obj) {
      count++;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        count += this.countFields(obj[key]);
      }
    }
    return count;
  }
}

// =====================================================
// RUNTIME VALIDATOR
// =====================================================

export class RuntimeValidator {
  private static validators: Map<string, DocumentValidator> = new Map();

  static registerCollectionValidator(
    collectionName: string, 
    schema: CollectionSchemaDefinition,
    customRules?: ValidationRule[]
  ): void {
    const validator = new DocumentValidator(schema, customRules);
    this.validators.set(collectionName, validator);
  }

  static async validateOperation(
    collectionName: string,
    document: DocumentData,
    operation: ValidationContext['operation'],
    documentId?: string
  ): Promise<DocumentValidationResult> {
    const validator = this.validators.get(collectionName);
    
    if (!validator) {
      // Create basic validator if none exists
      const basicValidator = new DocumentValidator();
      const context: ValidationContext = {
        collectionName,
        documentId,
        environment: process.env.NODE_ENV || 'development',
        operation,
        timestamp: Timestamp.now()
      };
      
      return basicValidator.validateDocument(document, context);
    }

    const context: ValidationContext = {
      collectionName,
      documentId,
      environment: process.env.NODE_ENV || 'development',
      operation,
      timestamp: Timestamp.now()
    };

    return validator.validateDocument(document, context);
  }

  // Validation middleware for Firestore operations
  static createValidationMiddleware() {
    return {
      async beforeCreate(collectionName: string, document: DocumentData, documentId?: string) {
        const result = await this.validateOperation(collectionName, document, 'create', documentId);
        if (!result.isValid) {
          throw new ValidationError(`Document validation failed: ${result.errors.map(e => e.message).join(', ')}`);
        }
        return result;
      },

      async beforeUpdate(collectionName: string, updates: DocumentData, documentId: string) {
        const result = await this.validateOperation(collectionName, updates, 'update', documentId);
        if (!result.isValid) {
          throw new ValidationError(`Document validation failed: ${result.errors.map(e => e.message).join(', ')}`);
        }
        return result;
      },

      async afterRead(collectionName: string, document: DocumentData, documentId: string) {
        // Optional: validate data integrity on read
        return this.validateOperation(collectionName, document, 'read', documentId);
      }
    };
  }
}

// =====================================================
// BUILT-IN VALIDATION RULES
// =====================================================

export class BuiltInValidationRules {
  static getAllRules(): ValidationRule[] {
    return [
      // Type validation rules
      this.REQUIRED_FIELD_RULE,
      this.FIELD_TYPE_RULE,
      this.STRING_LENGTH_RULE,
      this.NUMBER_RANGE_RULE,
      this.EMAIL_FORMAT_RULE,
      this.PHONE_FORMAT_RULE,
      this.URL_FORMAT_RULE,
      this.DATE_FORMAT_RULE,

      // Business logic rules
      this.POSITIVE_NUMBER_RULE,
      this.PERCENTAGE_RANGE_RULE,
      this.COORDINATE_RANGE_RULE,

      // Solar-specific rules
      this.SOLAR_CAPACITY_RANGE_RULE,
      this.SOLAR_EFFICIENCY_RANGE_RULE,
      this.ENERGY_PRODUCTION_POSITIVE_RULE,
      this.SOLAR_IRRADIANCE_RANGE_RULE,
      this.POWER_RATING_CONSISTENCY_RULE,

      // Data integrity rules
      this.UNIQUE_IDENTIFIER_RULE,
      this.REFERENCE_INTEGRITY_RULE,
      this.TIMESTAMP_CONSISTENCY_RULE,

      // Security rules
      this.NO_SCRIPT_INJECTION_RULE,
      this.SANITIZED_INPUT_RULE
    ];
  }

  // Basic type validation
  static readonly REQUIRED_FIELD_RULE: ValidationRule = {
    id: 'required_field',
    name: 'Required Field',
    description: 'Validates that required fields are present',
    severity: 'error',
    category: 'type',
    validate: (value: any, document: DocumentData, context: ValidationContext) => {
      if (context.schema?.fields) {
        for (const field of context.schema.fields) {
          if (field.required && (document[field.name] === undefined || document[field.name] === null)) {
            return {
              passed: false,
              message: `Required field '${field.name}' is missing`,
              suggestedFix: field.defaultValue
            };
          }
        }
      }
      return { passed: true };
    }
  };

  static readonly FIELD_TYPE_RULE: ValidationRule = {
    id: 'field_type',
    name: 'Field Type Validation',
    description: 'Validates field types match schema definitions',
    severity: 'error',
    category: 'type',
    validate: (value: any, document: DocumentData, context: ValidationContext) => {
      if (!context.schema?.fields) return { passed: true };

      for (const field of context.schema.fields) {
        const fieldValue = document[field.name];
        if (fieldValue === undefined || fieldValue === null) continue;

        const expectedType = field.type;
        const actualType = this.getFirestoreType(fieldValue);

        if (expectedType !== actualType) {
          return {
            passed: false,
            message: `Field '${field.name}' expected type '${expectedType}' but got '${actualType}'`,
            suggestedFix: this.convertToType(fieldValue, expectedType)
          };
        }
      }

      return { passed: true };
    }
  };

  // String validation
  static readonly STRING_LENGTH_RULE: ValidationRule = {
    id: 'string_length',
    name: 'String Length Validation',
    description: 'Validates string field lengths',
    severity: 'warning',
    category: 'format',
    validate: (value: any, document: DocumentData, context: ValidationContext) => {
      if (!context.schema?.fields) return { passed: true };

      for (const field of context.schema.fields) {
        if (field.type !== 'string') continue;
        
        const fieldValue = document[field.name];
        if (typeof fieldValue !== 'string') continue;

        if (field.validation?.min && fieldValue.length < field.validation.min) {
          return {
            passed: false,
            message: `Field '${field.name}' length ${fieldValue.length} is below minimum ${field.validation.min}`,
          };
        }

        if (field.validation?.max && fieldValue.length > field.validation.max) {
          return {
            passed: false,
            message: `Field '${field.name}' length ${fieldValue.length} exceeds maximum ${field.validation.max}`,
            suggestedFix: fieldValue.substring(0, field.validation.max)
          };
        }
      }

      return { passed: true };
    }
  };

  // Number validation
  static readonly NUMBER_RANGE_RULE: ValidationRule = {
    id: 'number_range',
    name: 'Number Range Validation',
    description: 'Validates numeric field ranges',
    severity: 'error',
    category: 'format',
    validate: (value: any, document: DocumentData, context: ValidationContext) => {
      if (!context.schema?.fields) return { passed: true };

      for (const field of context.schema.fields) {
        if (field.type !== 'number') continue;
        
        const fieldValue = document[field.name];
        if (typeof fieldValue !== 'number') continue;

        if (field.validation?.min !== undefined && fieldValue < field.validation.min) {
          return {
            passed: false,
            message: `Field '${field.name}' value ${fieldValue} is below minimum ${field.validation.min}`,
            suggestedFix: field.validation.min
          };
        }

        if (field.validation?.max !== undefined && fieldValue > field.validation.max) {
          return {
            passed: false,
            message: `Field '${field.name}' value ${fieldValue} exceeds maximum ${field.validation.max}`,
            suggestedFix: field.validation.max
          };
        }
      }

      return { passed: true };
    }
  };

  // Format validation rules
  static readonly EMAIL_FORMAT_RULE: ValidationRule = {
    id: 'email_format',
    name: 'Email Format Validation',
    description: 'Validates email format',
    field: 'email',
    severity: 'error',
    category: 'format',
    validate: (value: any) => {
      if (typeof value !== 'string') return { passed: true };
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(value);
      
      return {
        passed: isValid,
        message: isValid ? undefined : 'Invalid email format'
      };
    }
  };

  static readonly PHONE_FORMAT_RULE: ValidationRule = {
    id: 'phone_format',
    name: 'Phone Format Validation',
    description: 'Validates phone number format',
    field: 'phoneNumber',
    severity: 'warning',
    category: 'format',
    validate: (value: any) => {
      if (typeof value !== 'string') return { passed: true };
      
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const isValid = phoneRegex.test(value.replace(/\s|-|\(|\)/g, ''));
      
      return {
        passed: isValid,
        message: isValid ? undefined : 'Invalid phone number format'
      };
    }
  };

  static readonly URL_FORMAT_RULE: ValidationRule = {
    id: 'url_format',
    name: 'URL Format Validation',
    description: 'Validates URL format',
    severity: 'warning',
    category: 'format',
    validate: (value: any) => {
      if (typeof value !== 'string') return { passed: true };
      
      try {
        new URL(value);
        return { passed: true };
      } catch {
        return {
          passed: false,
          message: 'Invalid URL format'
        };
      }
    }
  };

  static readonly DATE_FORMAT_RULE: ValidationRule = {
    id: 'date_format',
    name: 'Date Format Validation',
    description: 'Validates date/timestamp fields',
    severity: 'error',
    category: 'format',
    validate: (value: any) => {
      if (value instanceof Timestamp || value instanceof Date) {
        return { passed: true };
      }
      
      if (typeof value === 'string') {
        const date = new Date(value);
        const isValid = !isNaN(date.getTime());
        return {
          passed: isValid,
          message: isValid ? undefined : 'Invalid date format',
          suggestedFix: isValid ? Timestamp.fromDate(date) : undefined
        };
      }
      
      return { passed: true }; // Skip validation for other types
    }
  };

  // Business logic rules
  static readonly POSITIVE_NUMBER_RULE: ValidationRule = {
    id: 'positive_number',
    name: 'Positive Number Validation',
    description: 'Validates that numeric values are positive',
    severity: 'error',
    category: 'business',
    validate: (value: any) => {
      if (typeof value !== 'number') return { passed: true };
      
      const isValid = value > 0;
      return {
        passed: isValid,
        message: isValid ? undefined : 'Value must be positive',
        suggestedFix: Math.abs(value)
      };
    }
  };

  static readonly PERCENTAGE_RANGE_RULE: ValidationRule = {
    id: 'percentage_range',
    name: 'Percentage Range Validation',
    description: 'Validates percentage values are between 0-100',
    severity: 'error',
    category: 'business',
    validate: (value: any) => {
      if (typeof value !== 'number') return { passed: true };
      
      const isValid = value >= 0 && value <= 100;
      return {
        passed: isValid,
        message: isValid ? undefined : 'Percentage must be between 0 and 100',
        suggestedFix: Math.max(0, Math.min(100, value))
      };
    }
  };

  static readonly COORDINATE_RANGE_RULE: ValidationRule = {
    id: 'coordinate_range',
    name: 'Geographic Coordinate Validation',
    description: 'Validates latitude and longitude ranges',
    severity: 'error',
    category: 'business',
    validate: (value: any, document: DocumentData) => {
      if (document.coordinates || (document.address && document.address.coordinates)) {
        const coords = document.coordinates || document.address.coordinates;
        
        if (coords.latitude && (coords.latitude < -90 || coords.latitude > 90)) {
          return {
            passed: false,
            message: 'Latitude must be between -90 and 90'
          };
        }
        
        if (coords.longitude && (coords.longitude < -180 || coords.longitude > 180)) {
          return {
            passed: false,
            message: 'Longitude must be between -180 and 180'
          };
        }
      }
      
      return { passed: true };
    }
  };

  // Solar-specific validation rules
  static readonly SOLAR_CAPACITY_RANGE_RULE: ValidationRule = {
    id: 'solar_capacity_range',
    name: 'Solar System Capacity Range',
    description: 'Validates solar system capacity is within reasonable range',
    field: 'totalCapacity',
    severity: 'warning',
    category: 'business',
    validate: (value: any) => {
      if (typeof value !== 'number') return { passed: true };
      
      // Typical residential: 3-20 kW, commercial: up to 1000 kW
      if (value < 0.1 || value > 10000) {
        return {
          passed: false,
          message: 'Solar capacity should be between 0.1 kW and 10,000 kW'
        };
      }
      
      return { passed: true };
    }
  };

  static readonly SOLAR_EFFICIENCY_RANGE_RULE: ValidationRule = {
    id: 'solar_efficiency_range',
    name: 'Solar Panel Efficiency Range',
    description: 'Validates solar panel efficiency percentage',
    field: 'efficiency',
    severity: 'warning',
    category: 'business',
    validate: (value: any) => {
      if (typeof value !== 'number') return { passed: true };
      
      // Typical solar panel efficiency: 15-25%
      if (value < 5 || value > 50) {
        return {
          passed: false,
          message: 'Solar panel efficiency should be between 5% and 50%'
        };
      }
      
      return { passed: true };
    }
  };

  static readonly ENERGY_PRODUCTION_POSITIVE_RULE: ValidationRule = {
    id: 'energy_production_positive',
    name: 'Energy Production Positive Values',
    description: 'Validates energy production values are non-negative',
    severity: 'error',
    category: 'business',
    validate: (value: any, document: DocumentData) => {
      if (document.production) {
        const production = document.production;
        const fields = ['dcPower', 'acPower', 'energy'];
        
        for (const field of fields) {
          if (typeof production[field] === 'number' && production[field] < 0) {
            return {
              passed: false,
              message: `Energy production field '${field}' cannot be negative`
            };
          }
        }
      }
      
      return { passed: true };
    }
  };

  static readonly SOLAR_IRRADIANCE_RANGE_RULE: ValidationRule = {
    id: 'solar_irradiance_range',
    name: 'Solar Irradiance Range Validation',
    description: 'Validates solar irradiance values are within physical limits',
    severity: 'warning',
    category: 'business',
    validate: (value: any, document: DocumentData) => {
      if (document.irradiance) {
        const irradiance = document.irradiance;
        
        // Solar constant is about 1361 W/m², surface max around 1200 W/m²
        if (irradiance.ghi && (irradiance.ghi < 0 || irradiance.ghi > 1500)) {
          return {
            passed: false,
            message: 'Global Horizontal Irradiance should be between 0 and 1500 W/m²'
          };
        }
      }
      
      return { passed: true };
    }
  };

  static readonly POWER_RATING_CONSISTENCY_RULE: ValidationRule = {
    id: 'power_rating_consistency',
    name: 'Power Rating Consistency',
    description: 'Validates consistency between panel count, power rating, and total capacity',
    severity: 'warning',
    category: 'integrity',
    validate: (value: any, document: DocumentData) => {
      if (document.systemDesign) {
        const design = document.systemDesign;
        const { totalCapacity, panelCount, panels } = design;
        
        if (totalCapacity && panelCount && panels && panels.length > 0) {
          const calculatedCapacity = panels.reduce((sum: number, panel: any) => 
            sum + (panel.wattage * panel.quantity), 0) / 1000; // Convert to kW
          
          const tolerance = 0.1; // 10% tolerance
          const difference = Math.abs(calculatedCapacity - totalCapacity) / totalCapacity;
          
          if (difference > tolerance) {
            return {
              passed: false,
              message: `Total capacity (${totalCapacity} kW) doesn't match calculated capacity from panels (${calculatedCapacity.toFixed(2)} kW)`,
              suggestedFix: calculatedCapacity
            };
          }
        }
      }
      
      return { passed: true };
    }
  };

  // Data integrity rules
  static readonly UNIQUE_IDENTIFIER_RULE: ValidationRule = {
    id: 'unique_identifier',
    name: 'Unique Identifier Validation',
    description: 'Validates unique identifiers are present and properly formatted',
    field: 'id',
    severity: 'error',
    category: 'integrity',
    validate: (value: any) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return {
          passed: false,
          message: 'Document must have a valid unique identifier'
        };
      }
      
      return { passed: true };
    }
  };

  static readonly REFERENCE_INTEGRITY_RULE: ValidationRule = {
    id: 'reference_integrity',
    name: 'Reference Integrity Validation',
    description: 'Validates foreign key references',
    severity: 'warning',
    category: 'integrity',
    validate: (value: any, document: DocumentData, context: ValidationContext) => {
      // This would need to be implemented with actual reference checking
      // For now, just validate format
      const referenceFields = ['homeownerId', 'installerId', 'supplierId', 'rfqId', 'quoteId'];
      
      for (const field of referenceFields) {
        if (document[field] && typeof document[field] !== 'string') {
          return {
            passed: false,
            message: `Reference field '${field}' must be a string`
          };
        }
      }
      
      return { passed: true };
    }
  };

  static readonly TIMESTAMP_CONSISTENCY_RULE: ValidationRule = {
    id: 'timestamp_consistency',
    name: 'Timestamp Consistency Validation',
    description: 'Validates timestamp field consistency',
    severity: 'warning',
    category: 'integrity',
    validate: (value: any, document: DocumentData) => {
      if (document.createdAt && document.updatedAt) {
        const created = document.createdAt instanceof Timestamp ? 
          document.createdAt : Timestamp.fromDate(new Date(document.createdAt));
        const updated = document.updatedAt instanceof Timestamp ? 
          document.updatedAt : Timestamp.fromDate(new Date(document.updatedAt));
        
        if (updated.toMillis() < created.toMillis()) {
          return {
            passed: false,
            message: 'updatedAt timestamp cannot be before createdAt'
          };
        }
      }
      
      return { passed: true };
    }
  };

  // Security rules
  static readonly NO_SCRIPT_INJECTION_RULE: ValidationRule = {
    id: 'no_script_injection',
    name: 'Script Injection Prevention',
    description: 'Prevents script injection in text fields',
    severity: 'error',
    category: 'security',
    validate: (value: any, document: DocumentData) => {
      const checkString = (str: string): boolean => {
        const dangerousPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /<iframe[^>]*>.*?<\/iframe>/gi
        ];
        
        return dangerousPatterns.some(pattern => pattern.test(str));
      };
      
      const checkObject = (obj: any): string | null => {
        for (const [key, val] of Object.entries(obj)) {
          if (typeof val === 'string' && checkString(val)) {
            return key;
          } else if (typeof val === 'object' && val !== null) {
            const result = checkObject(val);
            if (result) return `${key}.${result}`;
          }
        }
        return null;
      };
      
      const dangerousField = checkObject(document);
      if (dangerousField) {
        return {
          passed: false,
          message: `Potentially dangerous script content detected in field: ${dangerousField}`
        };
      }
      
      return { passed: true };
    }
  };

  static readonly SANITIZED_INPUT_RULE: ValidationRule = {
    id: 'sanitized_input',
    name: 'Input Sanitization Validation',
    description: 'Validates input has been properly sanitized',
    severity: 'warning',
    category: 'security',
    validate: (value: any, document: DocumentData) => {
      // Check for potentially unsafe characters in user input fields
      const userInputFields = ['description', 'notes', 'comments', 'message'];
      
      for (const field of userInputFields) {
        if (document[field] && typeof document[field] === 'string') {
          const value = document[field];
          
          // Check for excessive HTML tags
          const htmlTagCount = (value.match(/<[^>]*>/g) || []).length;
          if (htmlTagCount > 10) {
            return {
              passed: false,
              message: `Field '${field}' contains excessive HTML tags, may need sanitization`
            };
          }
        }
      }
      
      return { passed: true };
    }
  };

  // Helper methods
  private static getFirestoreType(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Timestamp) return 'timestamp';
    if (value instanceof Date) return 'timestamp';
    if (typeof value === 'object') return 'map';
    return 'unknown';
  }

  private static convertToType(value: any, targetType: string): any {
    switch (targetType) {
      case 'string': return String(value);
      case 'number': return Number(value);
      case 'boolean': return Boolean(value);
      case 'timestamp': return value instanceof Timestamp ? value : Timestamp.fromDate(new Date(value));
      default: return value;
    }
  }
}

// Initialize the validation registry
ValidationRegistry.initialize();

// Custom error class
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}