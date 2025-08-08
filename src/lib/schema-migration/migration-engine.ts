/**
 * Migration Engine
 * Automated migration execution system with batch processing, transformation utilities,
 * and comprehensive error handling for Firestore schema changes
 */

import { 
  Firestore,
  Timestamp,
  WriteBatch,
  QuerySnapshot,
  DocumentSnapshot,
  DocumentData,
  Transaction,
  FieldValue
} from 'firebase/firestore';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  SchemaVersion, 
  SchemaDefinition, 
  VersionUtils,
  SchemaVersionManager 
} from './version-manager';

// =====================================================
// MIGRATION TYPES
// =====================================================

export interface MigrationOperation {
  id: string;
  type: MigrationOperationType;
  collection: string;
  description: string;
  batchSize?: number;
  priority: number;
  dependencies?: string[]; // IDs of operations that must complete first
  rollback?: MigrationOperation;
  estimatedDuration?: number; // milliseconds
  validation?: MigrationValidation;
}

export type MigrationOperationType = 
  | 'add_field'
  | 'remove_field'
  | 'rename_field'
  | 'change_field_type'
  | 'add_collection'
  | 'remove_collection'
  | 'add_index'
  | 'remove_index'
  | 'transform_data'
  | 'custom_operation';

export interface AddFieldOperation extends MigrationOperation {
  type: 'add_field';
  field: {
    name: string;
    defaultValue: any;
    required: boolean;
  };
}

export interface RemoveFieldOperation extends MigrationOperation {
  type: 'remove_field';
  field: {
    name: string;
    backupLocation?: string; // Collection to backup removed data
  };
}

export interface RenameFieldOperation extends MigrationOperation {
  type: 'rename_field';
  field: {
    oldName: string;
    newName: string;
    preserveOldField?: boolean;
  };
}

export interface ChangeFieldTypeOperation extends MigrationOperation {
  type: 'change_field_type';
  field: {
    name: string;
    oldType: string;
    newType: string;
    transformer?: (value: any) => any;
  };
}

export interface TransformDataOperation extends MigrationOperation {
  type: 'transform_data';
  transformer: DataTransformer;
  filter?: DocumentFilter;
}

export interface CustomOperation extends MigrationOperation {
  type: 'custom_operation';
  executor: (
    batch: WriteBatch, 
    documents: DocumentSnapshot[], 
    context: MigrationContext
  ) => Promise<void>;
}

export interface DataTransformer {
  name: string;
  transform: (document: DocumentData) => Promise<DocumentData | null>;
  validate?: (original: DocumentData, transformed: DocumentData) => boolean;
}

export interface DocumentFilter {
  conditions: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
    value: any;
  }>;
  limit?: number;
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
}

export interface MigrationValidation {
  preCheck?: (documents: DocumentSnapshot[]) => Promise<ValidationResult>;
  postCheck?: (documents: DocumentSnapshot[]) => Promise<ValidationResult>;
  rollbackCheck?: (documents: DocumentSnapshot[]) => Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  affectedDocuments: number;
}

// =====================================================
// MIGRATION EXECUTION CONTEXT
// =====================================================

export interface MigrationContext {
  migrationId: string;
  schemaVersion: SchemaVersion;
  environment: string;
  startTime: Timestamp;
  dryRun: boolean;
  options: MigrationOptions;
  stats: MigrationStats;
  logger: MigrationLogger;
}

export interface MigrationOptions {
  batchSize: number;
  concurrency: number;
  retryAttempts: number;
  retryDelay: number;
  timeoutMs: number;
  backupBeforeMigration: boolean;
  validateAfterMigration: boolean;
  rollbackOnError: boolean;
  continueOnError: boolean;
  progressCallback?: (progress: MigrationProgress) => void;
}

export interface MigrationStats {
  documentsProcessed: number;
  documentsUpdated: number;
  documentsSkipped: number;
  documentsDeleted: number;
  errorsEncountered: number;
  operationsCompleted: number;
  totalOperations: number;
  startTime: Timestamp;
  endTime?: Timestamp;
  elapsedMs: number;
}

export interface MigrationProgress {
  phase: 'preparation' | 'execution' | 'validation' | 'cleanup' | 'rollback' | 'completed';
  operationIndex: number;
  totalOperations: number;
  documentsProcessed: number;
  estimatedTotalDocuments: number;
  currentOperation?: string;
  estimatedTimeRemaining?: number;
  errors: string[];
}

export interface MigrationResult {
  success: boolean;
  stats: MigrationStats;
  errors: string[];
  warnings: string[];
  rollbackId?: string;
  backupLocation?: string;
}

// =====================================================
// MIGRATION LOGGER
// =====================================================

export class MigrationLogger {
  private logs: Array<{
    timestamp: Timestamp;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any;
  }> = [];

  private migrationId: string;

  constructor(migrationId: string) {
    this.migrationId = migrationId;
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
    const entry = {
      timestamp: Timestamp.now(),
      level,
      message,
      data
    };
    
    this.logs.push(entry);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console[level](`[Migration ${this.migrationId}] ${message}`, data || '');
    }
  }

  getLogs(): Array<{
    timestamp: Timestamp;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any;
  }> {
    return [...this.logs];
  }

  async saveLogs(): Promise<void> {
    try {
      const logDoc = {
        migrationId: this.migrationId,
        logs: this.logs,
        createdAt: Timestamp.now()
      };
      
      await setDoc(
        doc(db, '_migration_logs', `${this.migrationId}_${Date.now()}`),
        logDoc
      );
    } catch (error) {
      console.error('Failed to save migration logs:', error);
    }
  }
}

// =====================================================
// MIGRATION ENGINE
// =====================================================

export class MigrationEngine {
  private static readonly DEFAULT_OPTIONS: MigrationOptions = {
    batchSize: 100,
    concurrency: 5,
    retryAttempts: 3,
    retryDelay: 1000,
    timeoutMs: 600000, // 10 minutes
    backupBeforeMigration: true,
    validateAfterMigration: true,
    rollbackOnError: false,
    continueOnError: false
  };

  // Execute complete migration
  static async executeMigration(
    fromVersion: SchemaVersion,
    toVersion: SchemaVersion,
    options: Partial<MigrationOptions> = {},
    dryRun: boolean = false
  ): Promise<MigrationResult> {
    const migrationId = `migration_${VersionUtils.versionToString(fromVersion)}_to_${VersionUtils.versionToString(toVersion)}_${Date.now()}`;
    const logger = new MigrationLogger(migrationId);
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    const context: MigrationContext = {
      migrationId,
      schemaVersion: toVersion,
      environment: process.env.NODE_ENV || 'development',
      startTime: Timestamp.now(),
      dryRun,
      options: finalOptions,
      stats: {
        documentsProcessed: 0,
        documentsUpdated: 0,
        documentsSkipped: 0,
        documentsDeleted: 0,
        errorsEncountered: 0,
        operationsCompleted: 0,
        totalOperations: 0,
        startTime: Timestamp.now(),
        elapsedMs: 0
      },
      logger
    };

    try {
      logger.info(`Starting migration from ${VersionUtils.versionToString(fromVersion)} to ${VersionUtils.versionToString(toVersion)}`, {
        dryRun,
        options: finalOptions
      });

      // Plan migration path
      const migrationPlan = await SchemaVersionManager.planMigrationPath(fromVersion, toVersion);
      
      if (!migrationPlan.isValid) {
        throw new Error(`Invalid migration path: ${migrationPlan.warnings.join(', ')}`);
      }

      if (migrationPlan.breakingChanges) {
        logger.warn('Migration contains breaking changes');
      }

      // Generate migration operations
      const operations = await this.generateMigrationOperations(migrationPlan.path);
      context.stats.totalOperations = operations.length;

      logger.info(`Generated ${operations.length} migration operations`, {
        estimatedTime: migrationPlan.estimatedTime,
        breakingChanges: migrationPlan.breakingChanges
      });

      // Execute operations
      const result = await this.executeOperations(operations, context);

      // Record migration
      if (!dryRun && result.success) {
        await SchemaVersionManager.recordVersionApplication(
          toVersion,
          `migration_${migrationId}`,
          'migration-engine',
          context.environment,
          context.stats
        );
      }

      logger.info('Migration completed', result);
      await logger.saveLogs();

      return result;

    } catch (error) {
      logger.error('Migration failed', error);
      await logger.saveLogs();
      
      return {
        success: false,
        stats: context.stats,
        errors: [error.message],
        warnings: []
      };
    }
  }

  // Generate operations from schema changes
  static async generateMigrationOperations(schemas: SchemaDefinition[]): Promise<MigrationOperation[]> {
    const operations: MigrationOperation[] = [];
    
    // This would be implemented based on schema differences
    // For now, return empty array - would need schema diff logic
    
    return operations;
  }

  // Execute all migration operations
  static async executeOperations(
    operations: MigrationOperation[],
    context: MigrationContext
  ): Promise<MigrationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Sort operations by priority and dependencies
      const sortedOperations = this.sortOperationsByDependency(operations);
      
      // Execute operations in batches
      for (let i = 0; i < sortedOperations.length; i++) {
        const operation = sortedOperations[i];
        
        context.logger.info(`Executing operation ${i + 1}/${sortedOperations.length}: ${operation.description}`);
        
        try {
          await this.executeOperation(operation, context);
          context.stats.operationsCompleted++;
          
          // Report progress
          if (context.options.progressCallback) {
            context.options.progressCallback({
              phase: 'execution',
              operationIndex: i,
              totalOperations: sortedOperations.length,
              documentsProcessed: context.stats.documentsProcessed,
              estimatedTotalDocuments: 0, // Would calculate this
              currentOperation: operation.description,
              errors: errors
            });
          }
          
        } catch (error) {
          context.stats.errorsEncountered++;
          const errorMsg = `Operation failed: ${operation.description} - ${error.message}`;
          errors.push(errorMsg);
          context.logger.error(errorMsg, error);
          
          if (!context.options.continueOnError) {
            throw error;
          }
        }
      }
      
      context.stats.endTime = Timestamp.now();
      context.stats.elapsedMs = context.stats.endTime.toMillis() - context.stats.startTime.toMillis();
      
      return {
        success: errors.length === 0 || context.options.continueOnError,
        stats: context.stats,
        errors,
        warnings
      };
      
    } catch (error) {
      return {
        success: false,
        stats: context.stats,
        errors: [...errors, error.message],
        warnings
      };
    }
  }

  // Execute individual operation
  static async executeOperation(
    operation: MigrationOperation,
    context: MigrationContext
  ): Promise<void> {
    const batchSize = operation.batchSize || context.options.batchSize;
    
    // Get documents to process
    const query = this.buildQuery(operation);
    let lastDoc: DocumentSnapshot | undefined;
    let hasMore = true;
    
    while (hasMore) {
      const querySnapshot = await this.getDocumentBatch(query, batchSize, lastDoc);
      const docs = querySnapshot.docs;
      
      if (docs.length === 0) {
        break;
      }
      
      hasMore = docs.length === batchSize;
      lastDoc = docs[docs.length - 1];
      
      // Process batch
      await this.processBatch(docs, operation, context);
      
      context.stats.documentsProcessed += docs.length;
    }
  }

  // Process a batch of documents
  static async processBatch(
    documents: DocumentSnapshot[],
    operation: MigrationOperation,
    context: MigrationContext
  ): Promise<void> {
    if (context.dryRun) {
      context.logger.debug(`DRY RUN: Would process ${documents.length} documents for ${operation.type}`);
      return;
    }
    
    const batch = writeBatch(db);
    let batchOperations = 0;
    
    for (const doc of documents) {
      try {
        const processed = await this.processDocument(doc, operation, batch, context);
        if (processed) {
          batchOperations++;
          context.stats.documentsUpdated++;
        } else {
          context.stats.documentsSkipped++;
        }
        
        // Firestore batch limit is 500 operations
        if (batchOperations >= 450) {
          await batch.commit();
          // Create new batch
          const newBatch = writeBatch(db);
          Object.assign(batch, newBatch);
          batchOperations = 0;
        }
        
      } catch (error) {
        context.logger.error(`Error processing document ${doc.id}`, error);
        context.stats.errorsEncountered++;
        
        if (!context.options.continueOnError) {
          throw error;
        }
      }
    }
    
    if (batchOperations > 0) {
      await batch.commit();
    }
  }

  // Process individual document
  static async processDocument(
    doc: DocumentSnapshot,
    operation: MigrationOperation,
    batch: WriteBatch,
    context: MigrationContext
  ): Promise<boolean> {
    const data = doc.data();
    if (!data) return false;
    
    switch (operation.type) {
      case 'add_field':
        return this.processAddField(doc, operation as AddFieldOperation, batch);
      
      case 'remove_field':
        return this.processRemoveField(doc, operation as RemoveFieldOperation, batch);
      
      case 'rename_field':
        return this.processRenameField(doc, operation as RenameFieldOperation, batch);
      
      case 'change_field_type':
        return this.processChangeFieldType(doc, operation as ChangeFieldTypeOperation, batch);
      
      case 'transform_data':
        return this.processTransformData(doc, operation as TransformDataOperation, batch, context);
      
      case 'custom_operation':
        const customOp = operation as CustomOperation;
        await customOp.executor(batch, [doc], context);
        return true;
      
      default:
        context.logger.warn(`Unknown operation type: ${operation.type}`);
        return false;
    }
  }

  // Field operation processors
  static processAddField(
    doc: DocumentSnapshot,
    operation: AddFieldOperation,
    batch: WriteBatch
  ): boolean {
    const data = doc.data();
    if (!data) return false;
    
    // Skip if field already exists
    if (data[operation.field.name] !== undefined) {
      return false;
    }
    
    batch.update(doc.ref, {
      [operation.field.name]: operation.field.defaultValue,
      updatedAt: Timestamp.now()
    });
    
    return true;
  }

  static processRemoveField(
    doc: DocumentSnapshot,
    operation: RemoveFieldOperation,
    batch: WriteBatch
  ): boolean {
    const data = doc.data();
    if (!data || data[operation.field.name] === undefined) {
      return false;
    }
    
    // Backup data if specified
    if (operation.field.backupLocation) {
      const backupData = {
        originalDocId: doc.id,
        originalCollection: operation.collection,
        removedField: operation.field.name,
        removedValue: data[operation.field.name],
        removedAt: Timestamp.now()
      };
      
      const backupRef = doc(db, operation.field.backupLocation, `backup_${doc.id}_${Date.now()}`);
      batch.set(backupRef, backupData);
    }
    
    batch.update(doc.ref, {
      [operation.field.name]: FieldValue.delete(),
      updatedAt: Timestamp.now()
    });
    
    return true;
  }

  static processRenameField(
    doc: DocumentSnapshot,
    operation: RenameFieldOperation,
    batch: WriteBatch
  ): boolean {
    const data = doc.data();
    if (!data || data[operation.field.oldName] === undefined) {
      return false;
    }
    
    const updates: any = {
      [operation.field.newName]: data[operation.field.oldName],
      updatedAt: Timestamp.now()
    };
    
    if (!operation.field.preserveOldField) {
      updates[operation.field.oldName] = FieldValue.delete();
    }
    
    batch.update(doc.ref, updates);
    return true;
  }

  static processChangeFieldType(
    doc: DocumentSnapshot,
    operation: ChangeFieldTypeOperation,
    batch: WriteBatch
  ): boolean {
    const data = doc.data();
    if (!data || data[operation.field.name] === undefined) {
      return false;
    }
    
    let newValue = data[operation.field.name];
    
    if (operation.field.transformer) {
      newValue = operation.field.transformer(newValue);
    } else {
      // Default type conversions
      newValue = this.convertFieldType(newValue, operation.field.newType);
    }
    
    batch.update(doc.ref, {
      [operation.field.name]: newValue,
      updatedAt: Timestamp.now()
    });
    
    return true;
  }

  static async processTransformData(
    doc: DocumentSnapshot,
    operation: TransformDataOperation,
    batch: WriteBatch,
    context: MigrationContext
  ): Promise<boolean> {
    const data = doc.data();
    if (!data) return false;
    
    try {
      const transformedData = await operation.transformer.transform(data);
      
      if (!transformedData) {
        return false; // Skip this document
      }
      
      // Validate if validator provided
      if (operation.transformer.validate && 
          !operation.transformer.validate(data, transformedData)) {
        context.logger.warn(`Validation failed for document ${doc.id}`);
        return false;
      }
      
      batch.update(doc.ref, {
        ...transformedData,
        updatedAt: Timestamp.now()
      });
      
      return true;
      
    } catch (error) {
      context.logger.error(`Transform failed for document ${doc.id}`, error);
      throw error;
    }
  }

  // Utility methods
  static convertFieldType(value: any, targetType: string): any {
    switch (targetType) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'timestamp':
        return value instanceof Timestamp ? value : Timestamp.fromDate(new Date(value));
      default:
        return value;
    }
  }

  static sortOperationsByDependency(operations: MigrationOperation[]): MigrationOperation[] {
    const sorted: MigrationOperation[] = [];
    const processed = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (operation: MigrationOperation) => {
      if (visiting.has(operation.id)) {
        throw new Error(`Circular dependency detected for operation: ${operation.id}`);
      }
      
      if (processed.has(operation.id)) {
        return;
      }
      
      visiting.add(operation.id);
      
      // Visit dependencies first
      if (operation.dependencies) {
        for (const depId of operation.dependencies) {
          const dependency = operations.find(op => op.id === depId);
          if (dependency) {
            visit(dependency);
          }
        }
      }
      
      visiting.delete(operation.id);
      processed.add(operation.id);
      sorted.push(operation);
    };
    
    // Sort by priority first, then visit
    operations
      .sort((a, b) => a.priority - b.priority)
      .forEach(visit);
    
    return sorted;
  }

  static buildQuery(operation: MigrationOperation): any {
    return collection(db, operation.collection);
  }

  static async getDocumentBatch(
    collectionQuery: any,
    batchSize: number,
    lastDoc?: DocumentSnapshot
  ): Promise<QuerySnapshot> {
    let q = query(collectionQuery, limit(batchSize));
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    return getDocs(q);
  }
}

// =====================================================
// BUILT-IN TRANSFORMERS
// =====================================================

export class DataTransformers {
  // Solar-specific transformers
  static readonly NORMALIZE_SOLAR_PANEL_DATA: DataTransformer = {
    name: 'normalize_solar_panel_data',
    transform: async (data: DocumentData): Promise<DocumentData | null> => {
      if (!data.specifications || !data.specifications.power) {
        return null;
      }
      
      // Normalize power rating to watts
      let power = data.specifications.power;
      if (typeof power === 'string' && power.includes('kW')) {
        power = parseFloat(power.replace('kW', '')) * 1000;
      }
      
      return {
        ...data,
        specifications: {
          ...data.specifications,
          power,
          powerUnit: 'watts'
        }
      };
    },
    validate: (original: DocumentData, transformed: DocumentData): boolean => {
      return transformed.specifications?.power > 0;
    }
  };

  static readonly UPDATE_ENERGY_PRODUCTION_SCHEMA: DataTransformer = {
    name: 'update_energy_production_schema',
    transform: async (data: DocumentData): Promise<DocumentData | null> => {
      // Convert old energy production format to new schema
      if (!data.production) return null;
      
      return {
        ...data,
        production: {
          dcPower: data.production.dc_power || data.production.dcPower || 0,
          acPower: data.production.ac_power || data.production.acPower || 0,
          energy: data.production.energy || 0,
          voltage: data.production.voltage || 0,
          current: data.production.current || 0,
          frequency: data.production.frequency || 60
        },
        // Remove old fields
        dc_power: undefined,
        ac_power: undefined
      };
    }
  };

  static readonly MIGRATE_ADDRESS_FORMAT: DataTransformer = {
    name: 'migrate_address_format',
    transform: async (data: DocumentData): Promise<DocumentData | null> => {
      if (!data.address || typeof data.address === 'object') {
        return null; // Already in correct format or missing
      }
      
      // Convert string address to structured format
      const addressParts = data.address.split(',').map((part: string) => part.trim());
      
      return {
        ...data,
        address: {
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          state: addressParts[2] || '',
          zipCode: addressParts[3] || '',
          county: '',
          coordinates: {
            latitude: data.latitude || 0,
            longitude: data.longitude || 0
          }
        }
      };
    }
  };
}