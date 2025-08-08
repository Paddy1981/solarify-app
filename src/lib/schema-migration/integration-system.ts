/**
 * Integration System
 * Integration with existing Firebase systems, TypeScript type generation,
 * security rules integration, Cloud Functions integration, and API documentation updates
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
import { MigrationLogger } from './migration-engine';
import { ValidationRule, ValidationRegistry } from './validation-system';

// =====================================================
// TYPESCRIPT TYPE GENERATION
// =====================================================

export interface TypeGenerationOptions {
  outputPath: string;
  namespace?: string;
  includeValidation: boolean;
  includeHelpers: boolean;
  includeComments: boolean;
  exportTypes: 'named' | 'default' | 'both';
  generateUnions: boolean;
  strictTypes: boolean;
}

export interface GeneratedTypes {
  interfaces: string[];
  types: string[];
  enums: string[];
  validators: string[];
  helpers: string[];
}

export class TypeScriptGenerator {
  private static readonly FIRESTORE_TYPES_MAP = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    array: 'Array<any>',
    map: 'Record<string, any>',
    timestamp: 'Timestamp',
    geopoint: 'GeoPoint',
    reference: 'DocumentReference',
    bytes: 'Uint8Array',
    null: 'null'
  };

  static async generateTypesFromSchema(
    schema: SchemaDefinition,
    options: TypeGenerationOptions
  ): Promise<GeneratedTypes> {
    const generated: GeneratedTypes = {
      interfaces: [],
      types: [],
      enums: [],
      validators: [],
      helpers: []
    };

    // Generate file header
    const header = this.generateFileHeader(schema, options);
    
    // Generate imports
    const imports = this.generateImports(options);
    
    // Generate types for each collection
    for (const collection of schema.collections) {
      const collectionTypes = await this.generateCollectionTypes(collection, options);
      
      generated.interfaces.push(...collectionTypes.interfaces);
      generated.types.push(...collectionTypes.types);
      generated.enums.push(...collectionTypes.enums);
      
      if (options.includeValidation) {
        generated.validators.push(...collectionTypes.validators);
      }
      
      if (options.includeHelpers) {
        generated.helpers.push(...collectionTypes.helpers);
      }
    }

    // Generate schema metadata
    const metadata = this.generateSchemaMetadata(schema);
    generated.types.push(metadata);

    // Generate union types if requested
    if (options.generateUnions) {
      const unions = this.generateUnionTypes(schema);
      generated.types.push(...unions);
    }

    return generated;
  }

  private static generateFileHeader(schema: SchemaDefinition, options: TypeGenerationOptions): string {
    const lines = [
      '/**',
      ` * Generated TypeScript types for ${schema.name}`,
      ` * Schema Version: ${VersionUtils.versionToString(schema.version)}`,
      ` * Generated: ${new Date().toISOString()}`,
      ` * `,
      ` * ⚠️  WARNING: This file is auto-generated. Do not edit manually.`,
      ` * Changes will be overwritten on next generation.`,
      ' */',
      ''
    ];

    if (options.includeComments) {
      lines.push(`// Schema Description: ${schema.description}`);
      lines.push(`// Environment: ${schema.environment}`);
      lines.push(`// Collections: ${schema.collections.length}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private static generateImports(options: TypeGenerationOptions): string {
    const imports = [
      "import { Timestamp, DocumentReference, GeoPoint } from 'firebase/firestore';"
    ];

    if (options.includeValidation) {
      imports.push("import { ValidationRule, ValidationResult } from '../validation-system';");
    }

    if (options.includeHelpers) {
      imports.push("import { FirestoreSchemaHelper } from '../schema-helpers';");
    }

    imports.push('');
    return imports.join('\n');
  }

  private static async generateCollectionTypes(
    collection: CollectionSchemaDefinition,
    options: TypeGenerationOptions
  ): Promise<GeneratedTypes> {
    const generated: GeneratedTypes = {
      interfaces: [],
      types: [],
      enums: [],
      validators: [],
      helpers: []
    };

    // Generate main interface
    const interfaceName = this.toPascalCase(collection.name);
    const interfaceLines = [
      `export interface ${interfaceName} {`
    ];

    // Generate field types
    for (const field of collection.fields) {
      const fieldType = this.generateFieldType(field, options);
      const comment = options.includeComments && field.description ? 
        `  /** ${field.description} */` : '';
      
      if (comment) interfaceLines.push(comment);
      
      const optional = field.required ? '' : '?';
      interfaceLines.push(`  ${field.name}${optional}: ${fieldType};`);
      
      // Generate enums for field validation
      if (field.validation?.enum) {
        const enumName = `${interfaceName}${this.toPascalCase(field.name)}`;
        const enumValues = field.validation.enum.map(val => `  ${this.toEnumKey(val)} = '${val}'`).join(',\n');
        generated.enums.push(
          `export enum ${enumName} {\n${enumValues}\n}`
        );
      }
    }

    interfaceLines.push('}');
    generated.interfaces.push(interfaceLines.join('\n'));

    // Generate create/update types
    generated.types.push(
      `export type Create${interfaceName} = Omit<${interfaceName}, 'id' | 'createdAt' | 'updatedAt'>;`
    );
    generated.types.push(
      `export type Update${interfaceName} = Partial<Omit<${interfaceName}, 'id' | 'createdAt'>>;`
    );

    // Generate validators if requested
    if (options.includeValidation) {
      generated.validators.push(
        await this.generateCollectionValidator(collection, interfaceName)
      );
    }

    // Generate helpers if requested
    if (options.includeHelpers) {
      generated.helpers.push(
        this.generateCollectionHelper(collection, interfaceName)
      );
    }

    return generated;
  }

  private static generateFieldType(field: FieldDefinition, options: TypeGenerationOptions): string {
    const baseType = this.FIRESTORE_TYPES_MAP[field.type] || 'any';
    
    // Handle special cases
    if (field.type === 'array' && field.validation?.customValidator) {
      // Try to infer array element type from validation
      return 'Array<any>'; // In a real implementation, you'd parse the validator
    }
    
    if (field.type === 'map' && field.name.includes('specifications')) {
      // Generate specific types for known map structures
      return this.generateMapType(field.name);
    }

    if (field.validation?.enum) {
      const enumName = this.toPascalCase(field.name);
      return enumName;
    }

    // Handle references
    if (field.references) {
      return `string`; // Document ID as string, could also be DocumentReference
    }

    return baseType;
  }

  private static generateMapType(fieldName: string): string {
    // Generate specific map types based on field names
    if (fieldName.includes('specifications')) {
      return 'ProductSpecifications';
    }
    if (fieldName.includes('address')) {
      return 'Address';
    }
    if (fieldName.includes('coordinates')) {
      return '{ latitude: number; longitude: number }';
    }
    
    return 'Record<string, any>';
  }

  private static async generateCollectionValidator(
    collection: CollectionSchemaDefinition,
    interfaceName: string
  ): Promise<string> {
    const validatorName = `${interfaceName.toLowerCase()}Validator`;
    
    const lines = [
      `export const ${validatorName} = {`,
      `  validate: async (data: ${interfaceName}): Promise<ValidationResult> => {`,
      '    const errors: string[] = [];',
      '    const warnings: string[] = [];',
      ''
    ];

    // Generate validation logic for each field
    for (const field of collection.fields) {
      if (field.required) {
        lines.push(`    if (!data.${field.name}) {`);
        lines.push(`      errors.push('${field.name} is required');`);
        lines.push('    }');
      }

      if (field.validation) {
        lines.push(`    // Validate ${field.name}`);
        if (field.validation.min !== undefined) {
          if (field.type === 'string') {
            lines.push(`    if (data.${field.name} && data.${field.name}.length < ${field.validation.min}) {`);
            lines.push(`      errors.push('${field.name} must be at least ${field.validation.min} characters');`);
            lines.push('    }');
          } else if (field.type === 'number') {
            lines.push(`    if (data.${field.name} !== undefined && data.${field.name} < ${field.validation.min}) {`);
            lines.push(`      errors.push('${field.name} must be at least ${field.validation.min}');`);
            lines.push('    }');
          }
        }

        if (field.validation.max !== undefined) {
          if (field.type === 'string') {
            lines.push(`    if (data.${field.name} && data.${field.name}.length > ${field.validation.max}) {`);
            lines.push(`      errors.push('${field.name} must be at most ${field.validation.max} characters');`);
            lines.push('    }');
          } else if (field.type === 'number') {
            lines.push(`    if (data.${field.name} !== undefined && data.${field.name} > ${field.validation.max}) {`);
            lines.push(`      errors.push('${field.name} must be at most ${field.validation.max}');`);
            lines.push('    }');
          }
        }

        if (field.validation.pattern) {
          lines.push(`    if (data.${field.name} && !/${field.validation.pattern}/.test(data.${field.name})) {`);
          lines.push(`      errors.push('${field.name} format is invalid');`);
          lines.push('    }');
        }
      }
    }

    lines.push('');
    lines.push('    return {');
    lines.push('      isValid: errors.length === 0,');
    lines.push('      errors,');
    lines.push('      warnings');
    lines.push('    };');
    lines.push('  }');
    lines.push('};');

    return lines.join('\n');
  }

  private static generateCollectionHelper(
    collection: CollectionSchemaDefinition,
    interfaceName: string
  ): string {
    const helperName = `${interfaceName}Helper`;
    const collectionName = collection.name;

    return `
export class ${helperName} extends FirestoreSchemaHelper {
  static readonly COLLECTION = '${collectionName}';

  static async create(data: Create${interfaceName}): Promise<string> {
    const id = doc(collection(db, this.COLLECTION)).id;
    await this.createDocument<${interfaceName}>(this.COLLECTION, id, data);
    return id;
  }

  static async get(id: string): Promise<${interfaceName} | null> {
    return this.getDocument<${interfaceName}>(this.COLLECTION, id);
  }

  static async update(id: string, updates: Update${interfaceName}): Promise<void> {
    await this.updateDocument<${interfaceName}>(this.COLLECTION, id, updates);
  }

  static async delete(id: string): Promise<void> {
    await this.deleteDocument(this.COLLECTION, id);
  }

  static async list(
    pageSize: number = 25,
    lastDoc?: DocumentSnapshot
  ): Promise<{
    items: ${interfaceName}[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }> {
    const result = await this.queryDocuments<${interfaceName}>(
      this.COLLECTION,
      [orderBy('createdAt', 'desc')],
      pageSize,
      lastDoc
    );

    return {
      items: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }
}`;
  }

  private static generateSchemaMetadata(schema: SchemaDefinition): string {
    const collectionsMetadata = schema.collections.map(c => 
      `  '${c.name}': { fields: ${c.fields.length}, indexes: ${c.indexes?.length || 0} }`
    ).join(',\n');

    return `
export const SCHEMA_METADATA = {
  id: '${schema.id}',
  version: '${VersionUtils.versionToString(schema.version)}',
  name: '${schema.name}',
  environment: '${schema.environment}',
  collections: {
${collectionsMetadata}
  },
  generatedAt: '${new Date().toISOString()}'
} as const;`;
  }

  private static generateUnionTypes(schema: SchemaDefinition): string[] {
    const unions: string[] = [];
    
    // Generate collection name union
    const collectionNames = schema.collections.map(c => `'${c.name}'`).join(' | ');
    unions.push(`export type CollectionName = ${collectionNames};`);

    // Generate document type union
    const documentTypes = schema.collections.map(c => this.toPascalCase(c.name)).join(' | ');
    unions.push(`export type DocumentType = ${documentTypes};`);

    return unions;
  }

  private static toPascalCase(str: string): string {
    return str
      .split(/[_-\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private static toEnumKey(str: string): string {
    return str.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  }

  static async generateTypesFile(
    schemaVersion: SchemaVersion,
    options: TypeGenerationOptions
  ): Promise<string> {
    const schema = await SchemaVersionManager.getSchemaByVersion(schemaVersion);
    if (!schema) {
      throw new Error(`Schema version ${VersionUtils.versionToString(schemaVersion)} not found`);
    }

    const generated = await this.generateTypesFromSchema(schema, options);
    
    const sections = [
      this.generateFileHeader(schema, options),
      this.generateImports(options),
      ...generated.interfaces,
      ...generated.enums,
      ...generated.types
    ];

    if (options.includeValidation) {
      sections.push('// Validators', ...generated.validators);
    }

    if (options.includeHelpers) {
      sections.push('// Helpers', ...generated.helpers);
    }

    return sections.join('\n\n');
  }
}

// =====================================================
// FIREBASE SECURITY RULES INTEGRATION
// =====================================================

export interface SecurityRuleTemplate {
  collection: string;
  rules: {
    read?: string;
    write?: string;
    create?: string;
    update?: string;
    delete?: string;
  };
  conditions?: {
    [key: string]: string;
  };
}

export class SecurityRulesGenerator {
  static generateRulesFromSchema(schema: SchemaDefinition): string {
    const rules = ['rules_version = "2";', '', 'service cloud.firestore {', '  match /databases/{database}/documents {'];

    for (const collection of schema.collections) {
      const collectionRules = this.generateCollectionRules(collection);
      rules.push(...collectionRules);
    }

    // Add schema metadata rules
    rules.push('    // Schema metadata (read-only)');
    rules.push('    match /_schema_registry/{document} {');
    rules.push('      allow read: if true;');
    rules.push('      allow write: if false; // Only system can write');
    rules.push('    }');

    // Add migration rules
    rules.push('    // Migration collections (system only)');
    rules.push('    match /_migration_logs/{document} {');
    rules.push('      allow read: if request.auth != null && request.auth.token.admin == true;');
    rules.push('      allow write: if false; // System only');
    rules.push('    }');

    rules.push('  }', '}');

    return rules.join('\n');
  }

  private static generateCollectionRules(collection: CollectionSchemaDefinition): string[] {
    const rules: string[] = [];
    const collectionName = collection.name;

    rules.push(`    // Rules for ${collectionName} collection`);
    rules.push(`    match /${collectionName}/{documentId} {`);

    // Generate rules based on collection type and schema
    if (collection.securityRules && collection.securityRules.length > 0) {
      for (const rule of collection.securityRules) {
        rules.push(`      allow ${rule.operation}: if ${rule.condition}; // ${rule.description || ''}`);
      }
    } else {
      // Generate default rules based on collection naming conventions
      if (collectionName.includes('profiles')) {
        rules.push('      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;');
      } else if (collectionName.includes('products')) {
        rules.push('      allow read: if true;');
        rules.push('      allow write: if request.auth != null && request.auth.token.supplier == true;');
      } else if (collectionName.includes('rfqs')) {
        rules.push('      allow read: if request.auth != null;');
        rules.push('      allow write: if request.auth != null && request.auth.uid == resource.data.homeownerId;');
      } else if (collectionName.includes('quotes')) {
        rules.push('      allow read: if request.auth != null && (request.auth.uid == resource.data.homeownerId || request.auth.uid == resource.data.installerId);');
        rules.push('      allow write: if request.auth != null && request.auth.uid == resource.data.installerId;');
      } else {
        // Default authenticated access
        rules.push('      allow read, write: if request.auth != null;');
      }
    }

    // Add validation rules based on schema fields
    const validationConditions = this.generateValidationConditions(collection);
    if (validationConditions.length > 0) {
      rules.push('      // Schema validation');
      rules.push(...validationConditions);
    }

    rules.push('    }');
    rules.push('');

    return rules;
  }

  private static generateValidationConditions(collection: CollectionSchemaDefinition): string[] {
    const conditions: string[] = [];

    // Generate required field validations
    const requiredFields = collection.fields.filter(f => f.required);
    if (requiredFields.length > 0) {
      const fieldChecks = requiredFields
        .map(f => `request.resource.data.keys().hasAll(['${f.name}'])`)
        .join(' && ');
      conditions.push(`      allow create: if ${fieldChecks};`);
    }

    // Generate type validations
    for (const field of collection.fields) {
      if (field.validation?.enum) {
        const enumValues = field.validation.enum.map(v => `'${v}'`).join(', ');
        conditions.push(`      allow write: if request.resource.data.${field.name} in [${enumValues}];`);
      }
    }

    return conditions;
  }

  static async updateSecurityRules(
    schema: SchemaDefinition,
    deployToFirebase: boolean = false
  ): Promise<string> {
    const rules = this.generateRulesFromSchema(schema);
    
    if (deployToFirebase) {
      // In a real implementation, you would deploy rules using Firebase Admin SDK
      // or Firebase CLI
      console.log('Security rules would be deployed to Firebase');
    }

    return rules;
  }
}

// =====================================================
// CLOUD FUNCTIONS INTEGRATION
// =====================================================

export interface CloudFunctionTemplate {
  name: string;
  trigger: 'onCreate' | 'onUpdate' | 'onDelete' | 'onWrite' | 'https' | 'scheduled';
  collection?: string;
  schedule?: string;
  handler: string;
  imports: string[];
}

export class CloudFunctionsGenerator {
  static generateFunctionsFromSchema(schema: SchemaDefinition): CloudFunctionTemplate[] {
    const functions: CloudFunctionTemplate[] = [];

    for (const collection of schema.collections) {
      // Generate audit functions
      if (this.shouldGenerateAuditFunction(collection)) {
        functions.push(this.generateAuditFunction(collection));
      }

      // Generate validation functions
      if (this.shouldGenerateValidationFunction(collection)) {
        functions.push(this.generateValidationFunction(collection));
      }

      // Generate notification functions
      if (this.shouldGenerateNotificationFunction(collection)) {
        functions.push(this.generateNotificationFunction(collection));
      }
    }

    // Generate schema migration functions
    functions.push(this.generateMigrationFunction());

    return functions;
  }

  private static shouldGenerateAuditFunction(collection: CollectionSchemaDefinition): boolean {
    // Generate audit functions for important collections
    return ['users', 'profiles', 'projects', 'quotes'].some(name => 
      collection.name.includes(name)
    );
  }

  private static shouldGenerateValidationFunction(collection: CollectionSchemaDefinition): boolean {
    // Generate validation functions for collections with complex validation rules
    return collection.validationRules && collection.validationRules.length > 0;
  }

  private static shouldGenerateNotificationFunction(collection: CollectionSchemaDefinition): boolean {
    // Generate notification functions for user-facing collections
    return ['rfqs', 'quotes', 'projects', 'notifications'].some(name => 
      collection.name.includes(name)
    );
  }

  private static generateAuditFunction(collection: CollectionSchemaDefinition): CloudFunctionTemplate {
    const functionName = `audit${this.toPascalCase(collection.name)}`;
    
    return {
      name: functionName,
      trigger: 'onWrite',
      collection: collection.name,
      handler: `
export const ${functionName} = functions.firestore
  .document('${collection.name}/{documentId}')
  .onWrite(async (change, context) => {
    const { documentId } = context.params;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    
    const auditEntry = {
      collection: '${collection.name}',
      documentId,
      operation: !before ? 'create' : !after ? 'delete' : 'update',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: context.auth?.uid || 'system',
      changes: after ? Object.keys(after) : [],
      metadata: {
        source: 'function',
        version: '1.0.0'
      }
    };
    
    await admin.firestore()
      .collection('_audit_logs')
      .add(auditEntry);
  });`,
      imports: ['import * as functions from "firebase-functions";', 'import * as admin from "firebase-admin";']
    };
  }

  private static generateValidationFunction(collection: CollectionSchemaDefinition): CloudFunctionTemplate {
    const functionName = `validate${this.toPascalCase(collection.name)}`;
    
    return {
      name: functionName,
      trigger: 'onCreate',
      collection: collection.name,
      handler: `
export const ${functionName} = functions.firestore
  .document('${collection.name}/{documentId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const validationErrors: string[] = [];
    
    ${this.generateValidationLogic(collection)}
    
    if (validationErrors.length > 0) {
      // Log validation errors
      await admin.firestore()
        .collection('_validation_errors')
        .add({
          collection: '${collection.name}',
          documentId: context.params.documentId,
          errors: validationErrors,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          data
        });
        
      // Optionally, you could reject the write by throwing an error
      // throw new functions.https.HttpsError('invalid-argument', validationErrors.join(', '));
    }
  });`,
      imports: ['import * as functions from "firebase-functions";', 'import * as admin from "firebase-admin";']
    };
  }

  private static generateNotificationFunction(collection: CollectionSchemaDefinition): CloudFunctionTemplate {
    const functionName = `notify${this.toPascalCase(collection.name)}`;
    
    return {
      name: functionName,
      trigger: 'onWrite',
      collection: collection.name,
      handler: `
export const ${functionName} = functions.firestore
  .document('${collection.name}/{documentId}')
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;
    
    if (!after) return; // Document deleted, no notification needed
    
    // Determine notification type
    let notificationType = 'unknown';
    if (!before) {
      notificationType = '${collection.name}_created';
    } else if (JSON.stringify(before) !== JSON.stringify(after)) {
      notificationType = '${collection.name}_updated';
    }
    
    // Create notification
    const notification = {
      type: notificationType,
      title: \`\${notificationType.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}\`,
      message: \`Document \${context.params.documentId} has been \${notificationType.split('_')[1]}\`,
      userId: after.userId || after.homeownerId || after.installerId,
      documentId: context.params.documentId,
      collection: '${collection.name}',
      data: after,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore()
      .collection('notifications')
      .add(notification);
  });`,
      imports: ['import * as functions from "firebase-functions";', 'import * as admin from "firebase-admin";']
    };
  }

  private static generateMigrationFunction(): CloudFunctionTemplate {
    return {
      name: 'schemaMigrationTrigger',
      trigger: 'https',
      handler: `
export const schemaMigrationTrigger = functions.https.onCall(async (data, context) => {
  // Verify admin access
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { fromVersion, toVersion, options } = data;
  
  try {
    // Trigger schema migration
    const migrationResult = await triggerSchemaMigration(fromVersion, toVersion, options);
    
    return {
      success: true,
      migrationId: migrationResult.migrationId,
      estimatedDuration: migrationResult.estimatedDuration
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

async function triggerSchemaMigration(fromVersion: string, toVersion: string, options: any) {
  // Implementation would integrate with the migration system
  return {
    migrationId: \`migration_\${Date.now()}\`,
    estimatedDuration: 300000 // 5 minutes
  };
}`,
      imports: ['import * as functions from "firebase-functions";']
    };
  }

  private static generateValidationLogic(collection: CollectionSchemaDefinition): string {
    if (!collection.validationRules) return '// No validation rules defined';
    
    const validations = collection.validationRules.map(rule => `
    // ${rule.name}
    if (!(${rule.rule})) {
      validationErrors.push('${rule.message}');
    }`);

    return validations.join('\n');
  }

  private static toPascalCase(str: string): string {
    return str
      .split(/[_-\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  static async generateFunctionsFile(schema: SchemaDefinition): Promise<string> {
    const functions = this.generateFunctionsFromSchema(schema);
    
    const imports = new Set<string>();
    functions.forEach(fn => fn.imports.forEach(imp => imports.add(imp)));
    
    const sections = [
      '/**',
      ` * Generated Cloud Functions for ${schema.name}`,
      ` * Schema Version: ${VersionUtils.versionToString(schema.version)}`,
      ` * Generated: ${new Date().toISOString()}`,
      ' */',
      '',
      ...Array.from(imports),
      '',
      'admin.initializeApp();',
      '',
      ...functions.map(fn => fn.handler)
    ];

    return sections.join('\n');
  }
}

// =====================================================
// API DOCUMENTATION GENERATOR
// =====================================================

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  collection: string;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface APIRequestBody {
  type: string;
  schema: string;
  example?: any;
}

export interface APIResponse {
  status: number;
  description: string;
  schema?: string;
  example?: any;
}

export class APIDocumentationGenerator {
  static generateOpenAPISpec(schema: SchemaDefinition): any {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: `${schema.name} API`,
        description: schema.description,
        version: VersionUtils.versionToString(schema.version),
        contact: {
          name: 'Schema Migration System',
          url: 'https://github.com/your-org/solarify-app'
        }
      },
      servers: [
        {
          url: 'https://your-firebase-project.web.app/api',
          description: 'Production server'
        },
        {
          url: 'http://localhost:3000/api',
          description: 'Development server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          FirebaseAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [{ FirebaseAuth: [] }]
    };

    // Generate paths and schemas for each collection
    for (const collection of schema.collections) {
      const endpoints = this.generateCollectionEndpoints(collection);
      const collectionSchema = this.generateCollectionSchema(collection);
      
      // Add paths
      endpoints.forEach(endpoint => {
        if (!spec.paths[endpoint.path]) {
          spec.paths[endpoint.path] = {};
        }
        spec.paths[endpoint.path][endpoint.method.toLowerCase()] = this.generateEndpointSpec(endpoint);
      });
      
      // Add schemas
      spec.components.schemas[this.toPascalCase(collection.name)] = collectionSchema;
    }

    return spec;
  }

  private static generateCollectionEndpoints(collection: CollectionSchemaDefinition): APIEndpoint[] {
    const collectionName = collection.name;
    const entityName = this.toPascalCase(collectionName);
    const basePath = `/${collectionName}`;

    return [
      // List endpoint
      {
        path: basePath,
        method: 'GET',
        description: `List ${collectionName}`,
        parameters: [
          { name: 'limit', type: 'integer', required: false, description: 'Number of items to return', example: 25 },
          { name: 'offset', type: 'integer', required: false, description: 'Number of items to skip', example: 0 },
          { name: 'orderBy', type: 'string', required: false, description: 'Field to order by', example: 'createdAt' },
          { name: 'orderDirection', type: 'string', required: false, description: 'Order direction', example: 'desc' }
        ],
        responses: [
          {
            status: 200,
            description: 'Successful response',
            schema: `Array<${entityName}>`,
            example: []
          }
        ],
        collection: collectionName
      },
      // Create endpoint
      {
        path: basePath,
        method: 'POST',
        description: `Create a new ${collectionName.slice(0, -1)}`,
        parameters: [],
        requestBody: {
          type: 'application/json',
          schema: `Create${entityName}`,
          example: this.generateExampleData(collection)
        },
        responses: [
          {
            status: 201,
            description: 'Created successfully',
            schema: entityName,
            example: { id: 'generated-id', ...this.generateExampleData(collection) }
          },
          {
            status: 400,
            description: 'Validation error',
            example: { error: 'Validation failed', details: ['Field is required'] }
          }
        ],
        collection: collectionName
      },
      // Get by ID endpoint
      {
        path: `${basePath}/{id}`,
        method: 'GET',
        description: `Get ${collectionName.slice(0, -1)} by ID`,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Document ID', example: 'doc-id-123' }
        ],
        responses: [
          {
            status: 200,
            description: 'Successful response',
            schema: entityName,
            example: { id: 'doc-id-123', ...this.generateExampleData(collection) }
          },
          {
            status: 404,
            description: 'Document not found',
            example: { error: 'Document not found' }
          }
        ],
        collection: collectionName
      },
      // Update endpoint
      {
        path: `${basePath}/{id}`,
        method: 'PUT',
        description: `Update ${collectionName.slice(0, -1)}`,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Document ID', example: 'doc-id-123' }
        ],
        requestBody: {
          type: 'application/json',
          schema: `Update${entityName}`,
          example: this.generateExampleData(collection, true)
        },
        responses: [
          {
            status: 200,
            description: 'Updated successfully',
            schema: entityName
          },
          {
            status: 404,
            description: 'Document not found'
          }
        ],
        collection: collectionName
      },
      // Delete endpoint
      {
        path: `${basePath}/{id}`,
        method: 'DELETE',
        description: `Delete ${collectionName.slice(0, -1)}`,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Document ID', example: 'doc-id-123' }
        ],
        responses: [
          {
            status: 204,
            description: 'Deleted successfully'
          },
          {
            status: 404,
            description: 'Document not found'
          }
        ],
        collection: collectionName
      }
    ];
  }

  private static generateCollectionSchema(collection: CollectionSchemaDefinition): any {
    const properties: any = {};
    const required: string[] = [];

    for (const field of collection.fields) {
      properties[field.name] = this.generateFieldSchema(field);
      if (field.required) {
        required.push(field.name);
      }
    }

    return {
      type: 'object',
      description: `Schema for ${collection.name}`,
      properties,
      required: required.length > 0 ? required : undefined
    };
  }

  private static generateFieldSchema(field: FieldDefinition): any {
    const schema: any = {
      description: field.description
    };

    switch (field.type) {
      case 'string':
        schema.type = 'string';
        if (field.validation?.min) schema.minLength = field.validation.min;
        if (field.validation?.max) schema.maxLength = field.validation.max;
        if (field.validation?.pattern) schema.pattern = field.validation.pattern;
        if (field.validation?.enum) schema.enum = field.validation.enum;
        break;
      case 'number':
        schema.type = 'number';
        if (field.validation?.min) schema.minimum = field.validation.min;
        if (field.validation?.max) schema.maximum = field.validation.max;
        break;
      case 'boolean':
        schema.type = 'boolean';
        break;
      case 'array':
        schema.type = 'array';
        schema.items = { type: 'string' }; // Default to string array
        break;
      case 'map':
        schema.type = 'object';
        break;
      case 'timestamp':
        schema.type = 'string';
        schema.format = 'date-time';
        break;
      default:
        schema.type = 'string';
    }

    if (field.defaultValue !== undefined) {
      schema.default = field.defaultValue;
    }

    return schema;
  }

  private static generateEndpointSpec(endpoint: APIEndpoint): any {
    const spec: any = {
      summary: endpoint.description,
      description: endpoint.description,
      tags: [endpoint.collection],
      parameters: endpoint.parameters.map(param => ({
        name: param.name,
        in: param.name === 'id' ? 'path' : 'query',
        required: param.required,
        description: param.description,
        schema: { type: param.type },
        example: param.example
      })),
      responses: {}
    };

    if (endpoint.requestBody) {
      spec.requestBody = {
        required: true,
        content: {
          [endpoint.requestBody.type]: {
            schema: { $ref: `#/components/schemas/${endpoint.requestBody.schema}` },
            example: endpoint.requestBody.example
          }
        }
      };
    }

    endpoint.responses.forEach(response => {
      spec.responses[response.status] = {
        description: response.description
      };

      if (response.schema) {
        spec.responses[response.status].content = {
          'application/json': {
            schema: { $ref: `#/components/schemas/${response.schema}` },
            example: response.example
          }
        };
      }
    });

    return spec;
  }

  private static generateExampleData(collection: CollectionSchemaDefinition, isUpdate: boolean = false): any {
    const example: any = {};

    for (const field of collection.fields) {
      if (isUpdate && ['id', 'createdAt'].includes(field.name)) {
        continue; // Skip these fields in update examples
      }

      switch (field.type) {
        case 'string':
          if (field.validation?.enum) {
            example[field.name] = field.validation.enum[0];
          } else {
            example[field.name] = `example_${field.name}`;
          }
          break;
        case 'number':
          example[field.name] = field.validation?.min || 100;
          break;
        case 'boolean':
          example[field.name] = false;
          break;
        case 'array':
          example[field.name] = [];
          break;
        case 'map':
          example[field.name] = {};
          break;
        case 'timestamp':
          example[field.name] = new Date().toISOString();
          break;
      }
    }

    return example;
  }

  private static toPascalCase(str: string): string {
    return str
      .split(/[_-\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  static generateMarkdownDoc(schema: SchemaDefinition): string {
    const spec = this.generateOpenAPISpec(schema);
    
    const sections = [
      `# ${spec.info.title}`,
      '',
      spec.info.description,
      '',
      `**Version:** ${spec.info.version}`,
      `**Generated:** ${new Date().toISOString()}`,
      '',
      '## Authentication',
      '',
      'All API endpoints require Firebase Authentication. Include the JWT token in the Authorization header:',
      '```',
      'Authorization: Bearer <your-jwt-token>',
      '```',
      '',
      '## Endpoints',
      ''
    ];

    // Document each path
    Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
      sections.push(`### \`${path}\``);
      sections.push('');

      Object.entries(methods).forEach(([method, endpoint]: [string, any]) => {
        sections.push(`#### ${method.toUpperCase()}`);
        sections.push('');
        sections.push(endpoint.description);
        sections.push('');

        if (endpoint.parameters && endpoint.parameters.length > 0) {
          sections.push('**Parameters:**');
          sections.push('');
          endpoint.parameters.forEach((param: any) => {
            sections.push(`- \`${param.name}\` (${param.schema.type}${param.required ? ', required' : ''}): ${param.description}`);
          });
          sections.push('');
        }

        if (endpoint.requestBody) {
          sections.push('**Request Body:**');
          sections.push('```json');
          sections.push(JSON.stringify(endpoint.requestBody.content['application/json'].example, null, 2));
          sections.push('```');
          sections.push('');
        }

        sections.push('**Responses:**');
        sections.push('');
        Object.entries(endpoint.responses).forEach(([status, response]: [string, any]) => {
          sections.push(`- \`${status}\`: ${(response as any).description}`);
        });
        sections.push('');
      });
    });

    // Document schemas
    sections.push('## Schemas');
    sections.push('');

    Object.entries(spec.components.schemas).forEach(([name, schema]: [string, any]) => {
      sections.push(`### ${name}`);
      sections.push('');
      sections.push(schema.description || '');
      sections.push('');
      sections.push('```json');
      sections.push(JSON.stringify(this.generateExampleFromSchema(schema), null, 2));
      sections.push('```');
      sections.push('');
    });

    return sections.join('\n');
  }

  private static generateExampleFromSchema(schema: any): any {
    if (schema.type === 'object' && schema.properties) {
      const example: any = {};
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        example[key] = this.generateExampleFromSchema(prop);
      });
      return example;
    }

    if (schema.enum) {
      return schema.enum[0];
    }

    switch (schema.type) {
      case 'string':
        return schema.format === 'date-time' ? new Date().toISOString() : 'string';
      case 'number':
        return schema.minimum || 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }
}

// =====================================================
// INTEGRATION ORCHESTRATOR
// =====================================================

export class IntegrationOrchestrator {
  static async syncSchemaWithFirebaseSystems(
    schema: SchemaDefinition,
    options: {
      generateTypes: boolean;
      updateSecurityRules: boolean;
      generateCloudFunctions: boolean;
      updateAPIDocumentation: boolean;
      deployChanges: boolean;
    }
  ): Promise<{
    success: boolean;
    results: Record<string, any>;
    errors: string[];
  }> {
    const logger = new MigrationLogger(`integration_${schema.id}`);
    const results: Record<string, any> = {};
    const errors: string[] = [];

    try {
      logger.info('Starting Firebase systems integration', { schema: schema.id, options });

      // Generate TypeScript types
      if (options.generateTypes) {
        try {
          const typeOptions: TypeGenerationOptions = {
            outputPath: `./src/types/generated/${schema.id}.ts`,
            namespace: 'Generated',
            includeValidation: true,
            includeHelpers: true,
            includeComments: true,
            exportTypes: 'named',
            generateUnions: true,
            strictTypes: true
          };

          const typesFile = await TypeScriptGenerator.generateTypesFile(schema.version, typeOptions);
          results.types = { generated: true, file: typeOptions.outputPath, size: typesFile.length };
          logger.info('TypeScript types generated', results.types);
        } catch (error) {
          errors.push(`Type generation failed: ${error.message}`);
        }
      }

      // Update security rules
      if (options.updateSecurityRules) {
        try {
          const rules = await SecurityRulesGenerator.updateSecurityRules(schema, options.deployChanges);
          results.securityRules = { updated: true, deployed: options.deployChanges, rulesLength: rules.length };
          logger.info('Security rules updated', results.securityRules);
        } catch (error) {
          errors.push(`Security rules update failed: ${error.message}`);
        }
      }

      // Generate Cloud Functions
      if (options.generateCloudFunctions) {
        try {
          const functionsFile = await CloudFunctionsGenerator.generateFunctionsFile(schema);
          results.cloudFunctions = { generated: true, functionsCount: functionsFile.split('export const').length - 1 };
          logger.info('Cloud Functions generated', results.cloudFunctions);
        } catch (error) {
          errors.push(`Cloud Functions generation failed: ${error.message}`);
        }
      }

      // Update API documentation
      if (options.updateAPIDocumentation) {
        try {
          const openAPISpec = APIDocumentationGenerator.generateOpenAPISpec(schema);
          const markdownDoc = APIDocumentationGenerator.generateMarkdownDoc(schema);
          results.apiDocumentation = { 
            generated: true, 
            endpoints: Object.keys(openAPISpec.paths).length,
            schemas: Object.keys(openAPISpec.components.schemas).length
          };
          logger.info('API documentation generated', results.apiDocumentation);
        } catch (error) {
          errors.push(`API documentation generation failed: ${error.message}`);
        }
      }

      const success = errors.length === 0;
      logger.info('Firebase systems integration completed', { success, errors: errors.length });

      return { success, results, errors };

    } catch (error) {
      logger.error('Integration orchestration failed', error);
      return {
        success: false,
        results,
        errors: [...errors, error.message]
      };
    }
  }

  static async validateIntegration(schema: SchemaDefinition): Promise<{
    valid: boolean;
    checks: Array<{
      name: string;
      passed: boolean;
      message: string;
    }>;
  }> {
    const checks: Array<{ name: string; passed: boolean; message: string }> = [];

    // Validate schema structure
    const schemaValidation = SchemaVersionManager.validateSchemaDefinition(schema);
    checks.push({
      name: 'Schema Validation',
      passed: schemaValidation.isValid,
      message: schemaValidation.isValid ? 'Schema is valid' : schemaValidation.errors.join(', ')
    });

    // Validate type generation
    try {
      await TypeScriptGenerator.generateTypesFromSchema(schema, {
        outputPath: './temp',
        includeValidation: false,
        includeHelpers: false,
        includeComments: false,
        exportTypes: 'named',
        generateUnions: false,
        strictTypes: true
      });
      checks.push({
        name: 'TypeScript Generation',
        passed: true,
        message: 'Types can be generated successfully'
      });
    } catch (error) {
      checks.push({
        name: 'TypeScript Generation',
        passed: false,
        message: `Type generation failed: ${error.message}`
      });
    }

    // Validate security rules generation
    try {
      SecurityRulesGenerator.generateRulesFromSchema(schema);
      checks.push({
        name: 'Security Rules Generation',
        passed: true,
        message: 'Security rules can be generated successfully'
      });
    } catch (error) {
      checks.push({
        name: 'Security Rules Generation',
        passed: false,
        message: `Security rules generation failed: ${error.message}`
      });
    }

    const valid = checks.every(check => check.passed);
    return { valid, checks };
  }
}