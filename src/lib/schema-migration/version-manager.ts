/**
 * Schema Version Management System
 * Handles version tracking, schema registry, and migration planning for Firestore schemas
 */

import { Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  limit,
  writeBatch
} from 'firebase/firestore';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface SchemaVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface SchemaDefinition {
  id: string;
  version: SchemaVersion;
  name: string;
  description: string;
  collections: CollectionSchemaDefinition[];
  createdAt: Timestamp;
  createdBy: string;
  environment: 'development' | 'staging' | 'production';
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  compatibility: {
    backwards: boolean;
    forwards: boolean;
    minimumVersion?: SchemaVersion;
    maximumVersion?: SchemaVersion;
  };
  metadata: {
    changeType: 'major' | 'minor' | 'patch';
    breaking: boolean;
    rollbackSupported: boolean;
    migrationRequired: boolean;
    estimatedMigrationTime?: number; // minutes
  };
}

export interface CollectionSchemaDefinition {
  name: string;
  fields: FieldDefinition[];
  indexes: IndexDefinition[];
  securityRules?: SecurityRuleDefinition[];
  subcollections?: CollectionSchemaDefinition[];
  constraints?: ConstraintDefinition[];
  validationRules?: ValidationRuleDefinition[];
}

export interface FieldDefinition {
  name: string;
  type: FirestoreFieldType;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
    customValidator?: string;
  };
  deprecated?: boolean;
  addedInVersion?: SchemaVersion;
  removedInVersion?: SchemaVersion;
  description?: string;
  references?: {
    collection: string;
    field?: string;
    cascadeDelete?: boolean;
  };
}

export interface IndexDefinition {
  name: string;
  fields: Array<{
    fieldPath: string;
    order?: 'asc' | 'desc';
  }>;
  type: 'single' | 'composite' | 'array';
  unique?: boolean;
  sparse?: boolean;
}

export interface SecurityRuleDefinition {
  operation: 'read' | 'write' | 'create' | 'update' | 'delete';
  condition: string;
  description?: string;
}

export interface ConstraintDefinition {
  name: string;
  type: 'unique' | 'foreign_key' | 'check';
  fields: string[];
  condition?: string;
  description?: string;
}

export interface ValidationRuleDefinition {
  name: string;
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export type FirestoreFieldType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'map' 
  | 'timestamp' 
  | 'geopoint' 
  | 'reference' 
  | 'bytes'
  | 'null';

export interface SchemaVersionRecord {
  id: string;
  version: SchemaVersion;
  schemaId: string;
  appliedAt: Timestamp;
  appliedBy: string;
  environment: string;
  rollbackInfo?: {
    canRollback: boolean;
    rollbackToVersion?: SchemaVersion;
    rollbackInstructions?: string;
  };
  migrationStats?: {
    documentsProcessed: number;
    documentsUpdated: number;
    documentsSkipped: number;
    errorsEncountered: number;
    processingTimeMs: number;
  };
}

export interface SchemaRegistry {
  currentVersion: SchemaVersion;
  availableVersions: SchemaVersion[];
  activeSchemas: Record<string, SchemaDefinition>;
  versionHistory: SchemaVersionRecord[];
  environment: string;
  lastUpdated: Timestamp;
}

// =====================================================
// VERSION UTILITIES
// =====================================================

export class VersionUtils {
  static parseVersion(versionString: string): SchemaVersion {
    const parts = versionString.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error(`Invalid version string: ${versionString}`);
    }
    return {
      major: parts[0],
      minor: parts[1],
      patch: parts[2]
    };
  }

  static versionToString(version: SchemaVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
  }

  static compareVersions(v1: SchemaVersion, v2: SchemaVersion): number {
    if (v1.major !== v2.major) return v1.major - v2.major;
    if (v1.minor !== v2.minor) return v1.minor - v2.minor;
    return v1.patch - v2.patch;
  }

  static isVersionGreater(v1: SchemaVersion, v2: SchemaVersion): boolean {
    return this.compareVersions(v1, v2) > 0;
  }

  static isVersionEqual(v1: SchemaVersion, v2: SchemaVersion): boolean {
    return this.compareVersions(v1, v2) === 0;
  }

  static getNextVersion(
    current: SchemaVersion, 
    changeType: 'major' | 'minor' | 'patch'
  ): SchemaVersion {
    switch (changeType) {
      case 'major':
        return { major: current.major + 1, minor: 0, patch: 0 };
      case 'minor':
        return { major: current.major, minor: current.minor + 1, patch: 0 };
      case 'patch':
        return { major: current.major, minor: current.minor, patch: current.patch + 1 };
      default:
        throw new Error(`Invalid change type: ${changeType}`);
    }
  }

  static isBreakingChange(fromVersion: SchemaVersion, toVersion: SchemaVersion): boolean {
    return toVersion.major > fromVersion.major;
  }

  static getVersionRange(versions: SchemaVersion[]): { min: SchemaVersion; max: SchemaVersion } {
    if (versions.length === 0) {
      throw new Error('Cannot determine version range for empty array');
    }

    const sorted = [...versions].sort(this.compareVersions);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }
}

// =====================================================
// SCHEMA VERSION MANAGER
// =====================================================

export class SchemaVersionManager {
  private static readonly SCHEMA_COLLECTION = '_schema_registry';
  private static readonly VERSION_COLLECTION = '_schema_versions';
  private static readonly REGISTRY_DOC = 'current_registry';

  // Schema Version Operations
  static async getCurrentVersion(): Promise<SchemaVersion | null> {
    try {
      const registryDoc = await getDoc(
        doc(db, this.SCHEMA_COLLECTION, this.REGISTRY_DOC)
      );
      
      if (registryDoc.exists()) {
        const registry = registryDoc.data() as SchemaRegistry;
        return registry.currentVersion;
      }
      return null;
    } catch (error) {
      console.error('Error getting current schema version:', error);
      throw error;
    }
  }

  static async getSchemaRegistry(): Promise<SchemaRegistry | null> {
    try {
      const registryDoc = await getDoc(
        doc(db, this.SCHEMA_COLLECTION, this.REGISTRY_DOC)
      );
      
      if (registryDoc.exists()) {
        return registryDoc.data() as SchemaRegistry;
      }
      return null;
    } catch (error) {
      console.error('Error getting schema registry:', error);
      throw error;
    }
  }

  static async updateRegistry(registry: SchemaRegistry): Promise<void> {
    try {
      registry.lastUpdated = Timestamp.now();
      await setDoc(
        doc(db, this.SCHEMA_COLLECTION, this.REGISTRY_DOC),
        registry
      );
    } catch (error) {
      console.error('Error updating schema registry:', error);
      throw error;
    }
  }

  // Schema Definition Management
  static async registerSchema(schema: SchemaDefinition): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Save schema definition
      const schemaDocRef = doc(db, this.SCHEMA_COLLECTION, schema.id);
      batch.set(schemaDocRef, schema);
      
      // Update registry
      const registry = await this.getSchemaRegistry();
      if (registry) {
        registry.activeSchemas[schema.id] = schema;
        registry.availableVersions.push(schema.version);
        registry.availableVersions.sort(VersionUtils.compareVersions);
        
        // Update current version if this is newer
        if (!registry.currentVersion || 
            VersionUtils.isVersionGreater(schema.version, registry.currentVersion)) {
          registry.currentVersion = schema.version;
        }
        
        const registryDocRef = doc(db, this.SCHEMA_COLLECTION, this.REGISTRY_DOC);
        batch.set(registryDocRef, registry);
      } else {
        // Create initial registry
        const newRegistry: SchemaRegistry = {
          currentVersion: schema.version,
          availableVersions: [schema.version],
          activeSchemas: { [schema.id]: schema },
          versionHistory: [],
          environment: schema.environment,
          lastUpdated: Timestamp.now()
        };
        
        const registryDocRef = doc(db, this.SCHEMA_COLLECTION, this.REGISTRY_DOC);
        batch.set(registryDocRef, newRegistry);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error registering schema:', error);
      throw error;
    }
  }

  static async getSchemaDefinition(schemaId: string): Promise<SchemaDefinition | null> {
    try {
      const schemaDoc = await getDoc(doc(db, this.SCHEMA_COLLECTION, schemaId));
      if (schemaDoc.exists()) {
        return schemaDoc.data() as SchemaDefinition;
      }
      return null;
    } catch (error) {
      console.error('Error getting schema definition:', error);
      throw error;
    }
  }

  static async getSchemaByVersion(version: SchemaVersion): Promise<SchemaDefinition | null> {
    try {
      const q = query(
        collection(db, this.SCHEMA_COLLECTION),
        where('version.major', '==', version.major),
        where('version.minor', '==', version.minor),
        where('version.patch', '==', version.patch),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as SchemaDefinition;
      }
      return null;
    } catch (error) {
      console.error('Error getting schema by version:', error);
      throw error;
    }
  }

  static async getAllSchemas(): Promise<SchemaDefinition[]> {
    try {
      const q = query(
        collection(db, this.SCHEMA_COLLECTION),
        orderBy('version.major', 'desc'),
        orderBy('version.minor', 'desc'),
        orderBy('version.patch', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .filter(doc => doc.id !== this.REGISTRY_DOC)
        .map(doc => doc.data() as SchemaDefinition);
    } catch (error) {
      console.error('Error getting all schemas:', error);
      throw error;
    }
  }

  // Version History Management
  static async recordVersionApplication(
    version: SchemaVersion,
    schemaId: string,
    appliedBy: string,
    environment: string,
    migrationStats?: SchemaVersionRecord['migrationStats'],
    rollbackInfo?: SchemaVersionRecord['rollbackInfo']
  ): Promise<void> {
    try {
      const versionRecord: SchemaVersionRecord = {
        id: `${VersionUtils.versionToString(version)}_${Date.now()}`,
        version,
        schemaId,
        appliedAt: Timestamp.now(),
        appliedBy,
        environment,
        migrationStats,
        rollbackInfo
      };
      
      await setDoc(
        doc(db, this.VERSION_COLLECTION, versionRecord.id),
        versionRecord
      );
      
      // Update registry history
      const registry = await this.getSchemaRegistry();
      if (registry) {
        registry.versionHistory.push(versionRecord);
        registry.versionHistory.sort((a, b) => 
          VersionUtils.compareVersions(b.version, a.version)
        );
        await this.updateRegistry(registry);
      }
    } catch (error) {
      console.error('Error recording version application:', error);
      throw error;
    }
  }

  static async getVersionHistory(limit?: number): Promise<SchemaVersionRecord[]> {
    try {
      const constraints = [orderBy('appliedAt', 'desc')];
      if (limit) {
        constraints.push(limit(limit) as any);
      }
      
      const q = query(collection(db, this.VERSION_COLLECTION), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as SchemaVersionRecord);
    } catch (error) {
      console.error('Error getting version history:', error);
      throw error;
    }
  }

  // Migration Path Planning
  static async planMigrationPath(
    fromVersion: SchemaVersion,
    toVersion: SchemaVersion
  ): Promise<{
    path: SchemaDefinition[];
    isValid: boolean;
    warnings: string[];
    estimatedTime: number;
    breakingChanges: boolean;
  }> {
    try {
      const allSchemas = await this.getAllSchemas();
      const path: SchemaDefinition[] = [];
      const warnings: string[] = [];
      let estimatedTime = 0;
      let breakingChanges = false;

      // Find all schemas between versions
      const relevantSchemas = allSchemas.filter(schema => {
        const schemaVersion = schema.version;
        return VersionUtils.compareVersions(schemaVersion, fromVersion) > 0 &&
               VersionUtils.compareVersions(schemaVersion, toVersion) <= 0;
      });

      // Sort by version
      relevantSchemas.sort((a, b) => 
        VersionUtils.compareVersions(a.version, b.version)
      );

      // Build migration path
      let currentVersion = fromVersion;
      
      for (const schema of relevantSchemas) {
        // Check compatibility
        if (schema.compatibility.minimumVersion &&
            VersionUtils.compareVersions(currentVersion, schema.compatibility.minimumVersion) < 0) {
          warnings.push(
            `Schema ${schema.id} requires minimum version ${VersionUtils.versionToString(schema.compatibility.minimumVersion)}, but current is ${VersionUtils.versionToString(currentVersion)}`
          );
        }

        if (schema.compatibility.maximumVersion &&
            VersionUtils.compareVersions(currentVersion, schema.compatibility.maximumVersion) > 0) {
          warnings.push(
            `Schema ${schema.id} supports maximum version ${VersionUtils.versionToString(schema.compatibility.maximumVersion)}, but current is ${VersionUtils.versionToString(currentVersion)}`
          );
        }

        // Check for breaking changes
        if (schema.metadata.breaking) {
          breakingChanges = true;
          warnings.push(`Schema ${schema.id} contains breaking changes`);
        }

        path.push(schema);
        estimatedTime += schema.metadata.estimatedMigrationTime || 5;
        currentVersion = schema.version;
      }

      return {
        path,
        isValid: warnings.length === 0 || warnings.every(w => w.includes('warning')),
        warnings,
        estimatedTime,
        breakingChanges
      };
    } catch (error) {
      console.error('Error planning migration path:', error);
      throw error;
    }
  }

  // Schema Validation
  static validateSchemaDefinition(schema: SchemaDefinition): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic validation
      if (!schema.name || schema.name.length < 3) {
        errors.push('Schema name must be at least 3 characters');
      }

      if (!schema.description || schema.description.length < 10) {
        warnings.push('Schema description should be at least 10 characters');
      }

      if (!schema.collections || schema.collections.length === 0) {
        errors.push('Schema must define at least one collection');
      }

      // Validate version format
      if (!schema.version || 
          typeof schema.version.major !== 'number' ||
          typeof schema.version.minor !== 'number' ||
          typeof schema.version.patch !== 'number') {
        errors.push('Schema must have valid semantic version');
      }

      // Validate collections
      if (schema.collections) {
        for (const collection of schema.collections) {
          const collectionValidation = this.validateCollectionDefinition(collection);
          errors.push(...collectionValidation.errors.map(e => `Collection '${collection.name}': ${e}`));
          warnings.push(...collectionValidation.warnings.map(w => `Collection '${collection.name}': ${w}`));
        }
      }

      // Check for duplicate collection names
      const collectionNames = new Set();
      for (const collection of schema.collections || []) {
        if (collectionNames.has(collection.name)) {
          errors.push(`Duplicate collection name: ${collection.name}`);
        }
        collectionNames.add(collection.name);
      }

    } catch (error) {
      errors.push(`Schema validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateCollectionDefinition(collection: CollectionSchemaDefinition): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Collection name validation
      if (!collection.name || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(collection.name)) {
        errors.push('Collection name must start with letter and contain only letters, numbers, and underscores');
      }

      // Fields validation
      if (!collection.fields || collection.fields.length === 0) {
        warnings.push('Collection has no defined fields');
      }

      if (collection.fields) {
        const fieldNames = new Set();
        for (const field of collection.fields) {
          if (fieldNames.has(field.name)) {
            errors.push(`Duplicate field name: ${field.name}`);
          }
          fieldNames.add(field.name);

          const fieldValidation = this.validateFieldDefinition(field);
          errors.push(...fieldValidation.errors);
          warnings.push(...fieldValidation.warnings);
        }
      }

      // Index validation
      if (collection.indexes) {
        for (const index of collection.indexes) {
          const indexValidation = this.validateIndexDefinition(index, collection.fields || []);
          errors.push(...indexValidation.errors);
          warnings.push(...indexValidation.warnings);
        }
      }

    } catch (error) {
      errors.push(`Collection validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateFieldDefinition(field: FieldDefinition): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Field name validation
      if (!field.name || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
        errors.push(`Invalid field name: ${field.name}`);
      }

      // Type validation
      const validTypes: FirestoreFieldType[] = [
        'string', 'number', 'boolean', 'array', 'map', 'timestamp', 'geopoint', 'reference', 'bytes', 'null'
      ];
      if (!validTypes.includes(field.type)) {
        errors.push(`Invalid field type: ${field.type}`);
      }

      // Validation rules
      if (field.validation) {
        if (field.type === 'string' && field.validation.min && field.validation.min < 0) {
          errors.push(`String field ${field.name} minimum length cannot be negative`);
        }

        if (field.type === 'number' && field.validation.min !== undefined && 
            field.validation.max !== undefined && field.validation.min > field.validation.max) {
          errors.push(`Field ${field.name} minimum value cannot be greater than maximum`);
        }

        if (field.validation.pattern) {
          try {
            new RegExp(field.validation.pattern);
          } catch {
            errors.push(`Field ${field.name} has invalid regex pattern`);
          }
        }
      }

      // Reference validation
      if (field.references) {
        if (!field.references.collection) {
          errors.push(`Field ${field.name} reference must specify collection`);
        }
      }

      // Deprecation warnings
      if (field.deprecated && !field.removedInVersion) {
        warnings.push(`Field ${field.name} is deprecated but no removal version specified`);
      }

    } catch (error) {
      errors.push(`Field validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateIndexDefinition(
    index: IndexDefinition, 
    collectionFields: FieldDefinition[]
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Index name validation
      if (!index.name || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(index.name)) {
        errors.push(`Invalid index name: ${index.name}`);
      }

      // Fields validation
      if (!index.fields || index.fields.length === 0) {
        errors.push(`Index ${index.name} must have at least one field`);
      }

      if (index.fields) {
        const fieldNames = collectionFields.map(f => f.name);
        
        for (const indexField of index.fields) {
          if (!fieldNames.includes(indexField.fieldPath)) {
            errors.push(`Index ${index.name} references non-existent field: ${indexField.fieldPath}`);
          }
        }

        // Check for composite index limitations
        if (index.fields.length > 1 && index.type !== 'composite') {
          warnings.push(`Index ${index.name} has multiple fields but type is not 'composite'`);
        }

        // Check for array field limitations
        const arrayFields = index.fields.filter(f => {
          const field = collectionFields.find(cf => cf.name === f.fieldPath);
          return field && field.type === 'array';
        });

        if (arrayFields.length > 1) {
          errors.push(`Index ${index.name} cannot have multiple array fields`);
        }
      }

    } catch (error) {
      errors.push(`Index validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}