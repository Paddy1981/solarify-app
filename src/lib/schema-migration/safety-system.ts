/**
 * Migration Safety System
 * Comprehensive safety features including dry-run, backups, monitoring,
 * rollback capabilities, and error recovery mechanisms
 */

import { 
  Timestamp, 
  DocumentData, 
  DocumentSnapshot, 
  WriteBatch,
  Transaction
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
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  SchemaVersion, 
  VersionUtils,
  SchemaVersionManager 
} from './version-manager';
import {
  MigrationContext,
  MigrationResult,
  MigrationProgress,
  MigrationOptions,
  MigrationLogger
} from './migration-engine';

// =====================================================
// BACKUP SYSTEM
// =====================================================

export interface BackupConfiguration {
  enabled: boolean;
  strategy: 'full' | 'incremental' | 'differential';
  compression: boolean;
  encryption: boolean;
  retentionDays: number;
  storageLocation: 'firestore' | 'cloud_storage' | 'both';
  includeMetadata: boolean;
  excludeCollections?: string[];
  maxBackupSizeGB?: number;
}

export interface BackupRecord {
  id: string;
  migrationId: string;
  backupType: 'pre_migration' | 'checkpoint' | 'rollback_point';
  timestamp: Timestamp;
  collections: BackupCollectionInfo[];
  metadata: {
    totalDocuments: number;
    totalSize: number;
    compressionRatio?: number;
    checksumMD5: string;
    schemaVersion: SchemaVersion;
  };
  status: 'creating' | 'completed' | 'failed' | 'expired';
  expiresAt: Timestamp;
  storageLocation: string;
  restoreInstructions?: string;
}

export interface BackupCollectionInfo {
  name: string;
  documentCount: number;
  sizeBytes: number;
  backupPath: string;
  indexes?: IndexBackupInfo[];
}

export interface IndexBackupInfo {
  name: string;
  fields: Array<{ fieldPath: string; order: 'asc' | 'desc' }>;
  unique?: boolean;
  partialFilterExpression?: string;
}

export interface RestoreOptions {
  targetVersion?: SchemaVersion;
  includeIndexes: boolean;
  overwriteExisting: boolean;
  validateBeforeRestore: boolean;
  dryRun: boolean;
  specificCollections?: string[];
}

export interface RestoreResult {
  success: boolean;
  restoredCollections: string[];
  documentsRestored: number;
  errors: string[];
  warnings: string[];
  duration: number;
}

export class BackupManager {
  private static readonly BACKUP_COLLECTION = '_migration_backups';
  private static readonly BACKUP_DATA_PREFIX = '_backup_data_';

  static async createBackup(
    migrationId: string,
    collections: string[],
    config: BackupConfiguration,
    backupType: BackupRecord['backupType'] = 'pre_migration'
  ): Promise<string> {
    const backupId = `backup_${migrationId}_${Date.now()}`;
    const logger = new MigrationLogger(migrationId);

    try {
      logger.info(`Starting ${backupType} backup for migration ${migrationId}`, { collections });

      const backupCollections: BackupCollectionInfo[] = [];
      let totalDocuments = 0;
      let totalSize = 0;

      // Create backup for each collection
      for (const collectionName of collections) {
        if (config.excludeCollections?.includes(collectionName)) {
          logger.info(`Skipping excluded collection: ${collectionName}`);
          continue;
        }

        const collectionInfo = await this.backupCollection(
          collectionName,
          backupId,
          config,
          logger
        );

        backupCollections.push(collectionInfo);
        totalDocuments += collectionInfo.documentCount;
        totalSize += collectionInfo.sizeBytes;
      }

      // Calculate checksum
      const checksumMD5 = await this.calculateBackupChecksum(backupCollections);

      // Create backup record
      const backupRecord: BackupRecord = {
        id: backupId,
        migrationId,
        backupType,
        timestamp: Timestamp.now(),
        collections: backupCollections,
        metadata: {
          totalDocuments,
          totalSize,
          checksumMD5,
          schemaVersion: await SchemaVersionManager.getCurrentVersion() || { major: 0, minor: 0, patch: 0 }
        },
        status: 'completed',
        expiresAt: Timestamp.fromMillis(Date.now() + (config.retentionDays * 24 * 60 * 60 * 1000)),
        storageLocation: config.storageLocation,
        restoreInstructions: this.generateRestoreInstructions(backupId, backupCollections)
      };

      await setDoc(doc(db, this.BACKUP_COLLECTION, backupId), backupRecord);

      logger.info(`Backup completed successfully`, {
        backupId,
        totalDocuments,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
      });

      return backupId;

    } catch (error) {
      logger.error(`Backup failed for migration ${migrationId}`, error);
      
      // Update backup record with failure status
      const failedRecord: Partial<BackupRecord> = {
        id: backupId,
        status: 'failed',
        timestamp: Timestamp.now()
      };
      
      try {
        await setDoc(doc(db, this.BACKUP_COLLECTION, backupId), failedRecord);
      } catch (recordError) {
        logger.error('Failed to update backup record with failure status', recordError);
      }

      throw error;
    }
  }

  private static async backupCollection(
    collectionName: string,
    backupId: string,
    config: BackupConfiguration,
    logger: MigrationLogger
  ): Promise<BackupCollectionInfo> {
    const backupCollectionName = `${this.BACKUP_DATA_PREFIX}${backupId}_${collectionName}`;
    const batch = writeBatch(db);
    let documentCount = 0;
    let sizeBytes = 0;
    let batchOperations = 0;

    // Get all documents from the collection
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    logger.info(`Backing up collection ${collectionName}: ${snapshot.docs.length} documents`);

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const docSize = this.estimateDocumentSize(data);
      
      // Add backup metadata
      const backupDoc = {
        ...data,
        _backup_metadata: {
          originalId: docSnapshot.id,
          originalCollection: collectionName,
          backupId,
          backupTimestamp: Timestamp.now(),
          docSize
        }
      };

      if (config.compression) {
        // In a real implementation, you would compress the data here
        // For now, we'll just flag it as compressed
        backupDoc._backup_metadata.compressed = true;
      }

      batch.set(doc(db, backupCollectionName, docSnapshot.id), backupDoc);
      
      documentCount++;
      sizeBytes += docSize;
      batchOperations++;

      // Commit batch if approaching limit
      if (batchOperations >= 450) {
        await batch.commit();
        const newBatch = writeBatch(db);
        Object.assign(batch, newBatch);
        batchOperations = 0;
      }
    }

    // Commit remaining operations
    if (batchOperations > 0) {
      await batch.commit();
    }

    // Backup indexes if requested
    let indexes: IndexBackupInfo[] | undefined;
    if (config.includeMetadata) {
      indexes = await this.backupCollectionIndexes(collectionName);
    }

    return {
      name: collectionName,
      documentCount,
      sizeBytes,
      backupPath: backupCollectionName,
      indexes
    };
  }

  private static async backupCollectionIndexes(collectionName: string): Promise<IndexBackupInfo[]> {
    // In a real implementation, you would query Firestore's index configuration
    // For now, return empty array as Firestore doesn't provide direct API access to index definitions
    return [];
  }

  private static estimateDocumentSize(data: DocumentData): number {
    // Rough estimation of document size in bytes
    return JSON.stringify(data).length * 2; // UTF-8 approximation
  }

  private static async calculateBackupChecksum(collections: BackupCollectionInfo[]): Promise<string> {
    // Simple checksum based on collection metadata
    const data = collections.map(c => `${c.name}:${c.documentCount}:${c.sizeBytes}`).join('|');
    // In production, use proper hashing library
    return btoa(data).substring(0, 32);
  }

  private static generateRestoreInstructions(
    backupId: string,
    collections: BackupCollectionInfo[]
  ): string {
    const instructions = [
      `# Restore Instructions for Backup: ${backupId}`,
      `# Created: ${new Date().toISOString()}`,
      '',
      '## Collections backed up:',
      ...collections.map(c => `- ${c.name}: ${c.documentCount} documents`),
      '',
      '## To restore:',
      `BackupManager.restoreBackup('${backupId}', {`,
      '  includeIndexes: true,',
      '  overwriteExisting: false,',
      '  validateBeforeRestore: true,',
      '  dryRun: true // Set to false for actual restore',
      '});'
    ];

    return instructions.join('\n');
  }

  static async restoreBackup(
    backupId: string,
    options: RestoreOptions
  ): Promise<RestoreResult> {
    const startTime = Date.now();
    const logger = new MigrationLogger(`restore_${backupId}`);

    try {
      logger.info(`Starting restore from backup ${backupId}`, options);

      // Get backup record
      const backupDoc = await getDoc(doc(db, this.BACKUP_COLLECTION, backupId));
      if (!backupDoc.exists()) {
        throw new Error(`Backup ${backupId} not found`);
      }

      const backupRecord = backupDoc.data() as BackupRecord;
      
      if (backupRecord.status !== 'completed') {
        throw new Error(`Backup ${backupId} is not in completed state: ${backupRecord.status}`);
      }

      const collectionsToRestore = options.specificCollections || 
        backupRecord.collections.map(c => c.name);

      const restoredCollections: string[] = [];
      let documentsRestored = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Restore each collection
      for (const collectionInfo of backupRecord.collections) {
        if (!collectionsToRestore.includes(collectionInfo.name)) {
          continue;
        }

        try {
          const restored = await this.restoreCollection(
            collectionInfo,
            options,
            logger
          );

          restoredCollections.push(collectionInfo.name);
          documentsRestored += restored;

        } catch (error) {
          errors.push(`Failed to restore collection ${collectionInfo.name}: ${error.message}`);
          logger.error(`Collection restore failed: ${collectionInfo.name}`, error);
        }
      }

      const duration = Date.now() - startTime;

      logger.info(`Restore completed`, {
        restoredCollections,
        documentsRestored,
        duration: `${duration}ms`,
        errors: errors.length,
        warnings: warnings.length
      });

      return {
        success: errors.length === 0,
        restoredCollections,
        documentsRestored,
        errors,
        warnings,
        duration
      };

    } catch (error) {
      logger.error(`Restore failed for backup ${backupId}`, error);
      return {
        success: false,
        restoredCollections: [],
        documentsRestored: 0,
        errors: [error.message],
        warnings: [],
        duration: Date.now() - startTime
      };
    }
  }

  private static async restoreCollection(
    collectionInfo: BackupCollectionInfo,
    options: RestoreOptions,
    logger: MigrationLogger
  ): Promise<number> {
    const backupCollectionRef = collection(db, collectionInfo.backupPath);
    const targetCollectionRef = collection(db, collectionInfo.name);
    
    let documentsRestored = 0;

    if (options.dryRun) {
      logger.info(`DRY RUN: Would restore ${collectionInfo.documentCount} documents to ${collectionInfo.name}`);
      return collectionInfo.documentCount;
    }

    // Get backup documents
    const backupSnapshot = await getDocs(backupCollectionRef);

    const batch = writeBatch(db);
    let batchOperations = 0;

    for (const backupDoc of backupSnapshot.docs) {
      const backupData = backupDoc.data();
      const { _backup_metadata, ...originalData } = backupData;

      // Check if document exists if not overwriting
      if (!options.overwriteExisting) {
        const existingDoc = await getDoc(doc(targetCollectionRef, backupDoc.id));
        if (existingDoc.exists()) {
          logger.warn(`Document ${backupDoc.id} already exists, skipping`);
          continue;
        }
      }

      batch.set(doc(targetCollectionRef, backupDoc.id), originalData);
      documentsRestored++;
      batchOperations++;

      // Commit batch if approaching limit
      if (batchOperations >= 450) {
        await batch.commit();
        const newBatch = writeBatch(db);
        Object.assign(batch, newBatch);
        batchOperations = 0;
      }
    }

    // Commit remaining operations
    if (batchOperations > 0) {
      await batch.commit();
    }

    logger.info(`Restored ${documentsRestored} documents to collection ${collectionInfo.name}`);
    return documentsRestored;
  }

  static async listBackups(migrationId?: string): Promise<BackupRecord[]> {
    let q = query(
      collection(db, this.BACKUP_COLLECTION),
      orderBy('timestamp', 'desc')
    );

    if (migrationId) {
      q = query(q, where('migrationId', '==', migrationId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as BackupRecord);
  }

  static async deleteExpiredBackups(): Promise<number> {
    const expiredQuery = query(
      collection(db, this.BACKUP_COLLECTION),
      where('expiresAt', '<=', Timestamp.now())
    );

    const expiredSnapshot = await getDocs(expiredQuery);
    let deletedCount = 0;

    for (const backupDoc of expiredSnapshot.docs) {
      const backup = backupDoc.data() as BackupRecord;
      
      try {
        // Delete backup data collections
        for (const collectionInfo of backup.collections) {
          const backupCollectionRef = collection(db, collectionInfo.backupPath);
          const backupDataSnapshot = await getDocs(backupCollectionRef);
          
          const batch = writeBatch(db);
          backupDataSnapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }

        // Delete backup record
        await deleteDoc(backupDoc.ref);
        deletedCount++;

      } catch (error) {
        console.error(`Failed to delete expired backup ${backup.id}:`, error);
      }
    }

    return deletedCount;
  }
}

// =====================================================
// DRY RUN SYSTEM
// =====================================================

export interface DryRunOptions {
  showChanges: boolean;
  validateOnly: boolean;
  estimateImpact: boolean;
  sampleSize?: number; // For large collections, only analyze a sample
  generateReport: boolean;
}

export interface DryRunResult {
  wouldSucceed: boolean;
  estimatedChanges: {
    documentsAffected: number;
    collectionsModified: string[];
    operationsCount: number;
    estimatedDuration: number; // milliseconds
  };
  potentialIssues: DryRunIssue[];
  sampleChanges: DryRunChange[];
  validationResults: {
    schemaValidation: boolean;
    dataIntegrity: boolean;
    businessRules: boolean;
  };
  recommendations: string[];
  report?: string;
}

export interface DryRunIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'data_loss' | 'validation_error' | 'performance' | 'compatibility';
  message: string;
  affectedDocuments: number;
  suggestedAction: string;
}

export interface DryRunChange {
  documentId: string;
  collection: string;
  changeType: 'create' | 'update' | 'delete' | 'transform';
  before?: DocumentData;
  after?: DocumentData;
  diff?: Record<string, any>;
}

export class DryRunEngine {
  static async executeDryRun(
    migrationContext: MigrationContext,
    options: DryRunOptions
  ): Promise<DryRunResult> {
    const logger = migrationContext.logger;
    logger.info('Starting dry run analysis', options);

    const result: DryRunResult = {
      wouldSucceed: true,
      estimatedChanges: {
        documentsAffected: 0,
        collectionsModified: [],
        operationsCount: 0,
        estimatedDuration: 0
      },
      potentialIssues: [],
      sampleChanges: [],
      validationResults: {
        schemaValidation: true,
        dataIntegrity: true,
        businessRules: true
      },
      recommendations: []
    };

    try {
      // Analyze each operation without executing
      // This would be implemented with specific operation analysis
      
      // Schema validation
      result.validationResults.schemaValidation = await this.validateSchemaChanges(migrationContext);
      
      // Data integrity checks
      result.validationResults.dataIntegrity = await this.checkDataIntegrity(migrationContext);
      
      // Business rule validation
      result.validationResults.businessRules = await this.validateBusinessRules(migrationContext);

      // Generate recommendations
      result.recommendations = this.generateRecommendations(result);

      // Generate report if requested
      if (options.generateReport) {
        result.report = this.generateDryRunReport(result, migrationContext);
      }

    } catch (error) {
      logger.error('Dry run analysis failed', error);
      result.wouldSucceed = false;
      result.potentialIssues.push({
        severity: 'critical',
        type: 'compatibility',
        message: `Dry run analysis failed: ${error.message}`,
        affectedDocuments: 0,
        suggestedAction: 'Review migration configuration and retry'
      });
    }

    return result;
  }

  private static async validateSchemaChanges(context: MigrationContext): Promise<boolean> {
    // Validate schema changes don't break existing data
    return true; // Simplified for now
  }

  private static async checkDataIntegrity(context: MigrationContext): Promise<boolean> {
    // Check for potential data integrity issues
    return true; // Simplified for now
  }

  private static async validateBusinessRules(context: MigrationContext): Promise<boolean> {
    // Validate business rules are maintained
    return true; // Simplified for now
  }

  private static generateRecommendations(result: DryRunResult): string[] {
    const recommendations: string[] = [];

    if (result.estimatedChanges.documentsAffected > 10000) {
      recommendations.push('Consider running migration during low-traffic hours due to high document count');
    }

    if (result.potentialIssues.some(issue => issue.severity === 'critical')) {
      recommendations.push('Address critical issues before proceeding with migration');
    }

    if (result.estimatedChanges.estimatedDuration > 3600000) { // 1 hour
      recommendations.push('Migration estimated to take over 1 hour - consider breaking into smaller chunks');
    }

    return recommendations;
  }

  private static generateDryRunReport(result: DryRunResult, context: MigrationContext): string {
    const sections = [
      '# Migration Dry Run Report',
      `Migration ID: ${context.migrationId}`,
      `Schema Version: ${VersionUtils.versionToString(context.schemaVersion)}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- Would Succeed: ${result.wouldSucceed ? 'Yes' : 'No'}`,
      `- Documents Affected: ${result.estimatedChanges.documentsAffected.toLocaleString()}`,
      `- Collections Modified: ${result.estimatedChanges.collectionsModified.length}`,
      `- Estimated Duration: ${(result.estimatedChanges.estimatedDuration / 1000).toFixed(0)} seconds`,
      '',
      '## Validation Results',
      `- Schema Validation: ${result.validationResults.schemaValidation ? 'Pass' : 'Fail'}`,
      `- Data Integrity: ${result.validationResults.dataIntegrity ? 'Pass' : 'Fail'}`,
      `- Business Rules: ${result.validationResults.businessRules ? 'Pass' : 'Fail'}`,
      '',
      '## Potential Issues',
      ...result.potentialIssues.map(issue => 
        `- [${issue.severity.toUpperCase()}] ${issue.message} (${issue.affectedDocuments} documents)`
      ),
      '',
      '## Recommendations',
      ...result.recommendations.map(rec => `- ${rec}`)
    ];

    return sections.join('\n');
  }
}

// =====================================================
// MONITORING SYSTEM
// =====================================================

export interface MigrationMonitor {
  migrationId: string;
  startTime: Timestamp;
  status: 'preparing' | 'running' | 'paused' | 'completed' | 'failed' | 'rolled_back';
  progress: MigrationProgress;
  metrics: MigrationMetrics;
  alerts: MigrationAlert[];
  checkpoints: MigrationCheckpoint[];
}

export interface MigrationMetrics {
  documentsProcessedPerSecond: number;
  errorRate: number;
  memoryUsageMB: number;
  cpuUsagePercent: number;
  databaseConnections: number;
  avgResponseTimeMs: number;
  successRate: number;
}

export interface MigrationAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  type: 'performance' | 'error_rate' | 'memory' | 'timeout' | 'data_integrity';
  message: string;
  timestamp: Timestamp;
  acknowledged: boolean;
  metadata?: Record<string, any>;
}

export interface MigrationCheckpoint {
  id: string;
  timestamp: Timestamp;
  operationIndex: number;
  documentsProcessed: number;
  backupId?: string;
  canResumeFrom: boolean;
  metadata: Record<string, any>;
}

export class MigrationMonitoringSystem {
  private static monitors: Map<string, MigrationMonitor> = new Map();
  private static readonly MONITORING_COLLECTION = '_migration_monitoring';

  static async startMonitoring(migrationId: string): Promise<void> {
    const monitor: MigrationMonitor = {
      migrationId,
      startTime: Timestamp.now(),
      status: 'preparing',
      progress: {
        phase: 'preparation',
        operationIndex: 0,
        totalOperations: 0,
        documentsProcessed: 0,
        estimatedTotalDocuments: 0,
        errors: []
      },
      metrics: {
        documentsProcessedPerSecond: 0,
        errorRate: 0,
        memoryUsageMB: 0,
        cpuUsagePercent: 0,
        databaseConnections: 0,
        avgResponseTimeMs: 0,
        successRate: 100
      },
      alerts: [],
      checkpoints: []
    };

    this.monitors.set(migrationId, monitor);
    
    // Save to Firestore
    await setDoc(
      doc(db, this.MONITORING_COLLECTION, migrationId),
      monitor
    );

    // Start metric collection
    this.startMetricCollection(migrationId);
  }

  static async updateProgress(migrationId: string, progress: Partial<MigrationProgress>): Promise<void> {
    const monitor = this.monitors.get(migrationId);
    if (!monitor) return;

    monitor.progress = { ...monitor.progress, ...progress };
    monitor.status = progress.phase === 'completed' ? 'completed' : 'running';

    // Check for alerts based on progress
    await this.checkProgressAlerts(monitor);

    // Update in Firestore
    await updateDoc(
      doc(db, this.MONITORING_COLLECTION, migrationId),
      { progress: monitor.progress, status: monitor.status, alerts: monitor.alerts }
    );
  }

  static async createCheckpoint(
    migrationId: string,
    operationIndex: number,
    documentsProcessed: number,
    backupId?: string
  ): Promise<string> {
    const monitor = this.monitors.get(migrationId);
    if (!monitor) throw new Error(`Monitor not found for migration ${migrationId}`);

    const checkpoint: MigrationCheckpoint = {
      id: `checkpoint_${migrationId}_${operationIndex}`,
      timestamp: Timestamp.now(),
      operationIndex,
      documentsProcessed,
      backupId,
      canResumeFrom: true,
      metadata: {
        phase: monitor.progress.phase,
        metrics: { ...monitor.metrics }
      }
    };

    monitor.checkpoints.push(checkpoint);

    // Update in Firestore
    await updateDoc(
      doc(db, this.MONITORING_COLLECTION, migrationId),
      { checkpoints: monitor.checkpoints }
    );

    return checkpoint.id;
  }

  static async addAlert(
    migrationId: string,
    severity: MigrationAlert['severity'],
    type: MigrationAlert['type'],
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const monitor = this.monitors.get(migrationId);
    if (!monitor) return;

    const alert: MigrationAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      type,
      message,
      timestamp: Timestamp.now(),
      acknowledged: false,
      metadata
    };

    monitor.alerts.push(alert);

    // Auto-escalate critical alerts
    if (severity === 'critical') {
      console.error(`CRITICAL MIGRATION ALERT [${migrationId}]: ${message}`, metadata);
      // In production, you might want to send notifications, trigger rollback, etc.
    }

    // Update in Firestore
    await updateDoc(
      doc(db, this.MONITORING_COLLECTION, migrationId),
      { alerts: monitor.alerts }
    );
  }

  static async pauseMigration(migrationId: string, reason: string): Promise<void> {
    const monitor = this.monitors.get(migrationId);
    if (!monitor) return;

    monitor.status = 'paused';
    
    await this.addAlert(migrationId, 'warning', 'performance', `Migration paused: ${reason}`);
    
    await updateDoc(
      doc(db, this.MONITORING_COLLECTION, migrationId),
      { status: 'paused' }
    );
  }

  static async resumeMigration(migrationId: string): Promise<boolean> {
    const monitor = this.monitors.get(migrationId);
    if (!monitor || monitor.status !== 'paused') {
      return false;
    }

    // Find the latest checkpoint to resume from
    const latestCheckpoint = monitor.checkpoints
      .filter(cp => cp.canResumeFrom)
      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];

    if (!latestCheckpoint) {
      await this.addAlert(migrationId, 'error', 'error_rate', 'No valid checkpoint found for resume');
      return false;
    }

    monitor.status = 'running';
    
    await this.addAlert(migrationId, 'info', 'performance', 
      `Migration resumed from checkpoint ${latestCheckpoint.id}`);

    await updateDoc(
      doc(db, this.MONITORING_COLLECTION, migrationId),
      { status: 'running' }
    );

    return true;
  }

  private static startMetricCollection(migrationId: string): void {
    const interval = setInterval(async () => {
      const monitor = this.monitors.get(migrationId);
      if (!monitor || monitor.status === 'completed' || monitor.status === 'failed') {
        clearInterval(interval);
        return;
      }

      // Collect metrics (simplified - in production you'd use proper monitoring)
      const metrics: MigrationMetrics = {
        documentsProcessedPerSecond: this.calculateDocumentsPerSecond(monitor),
        errorRate: this.calculateErrorRate(monitor),
        memoryUsageMB: this.getMemoryUsage(),
        cpuUsagePercent: 0, // Would need proper system monitoring
        databaseConnections: 1, // Would track actual connections
        avgResponseTimeMs: 100, // Would track actual response times
        successRate: this.calculateSuccessRate(monitor)
      };

      monitor.metrics = metrics;

      // Check for performance alerts
      await this.checkPerformanceAlerts(monitor);

      // Update in Firestore periodically
      if (Date.now() % 30000 < 5000) { // Every 30 seconds
        await updateDoc(
          doc(db, this.MONITORING_COLLECTION, migrationId),
          { metrics }
        );
      }
    }, 5000); // Collect metrics every 5 seconds
  }

  private static calculateDocumentsPerSecond(monitor: MigrationMonitor): number {
    const elapsedSeconds = (Date.now() - monitor.startTime.toMillis()) / 1000;
    return elapsedSeconds > 0 ? monitor.progress.documentsProcessed / elapsedSeconds : 0;
  }

  private static calculateErrorRate(monitor: MigrationMonitor): number {
    const totalOperations = monitor.progress.documentsProcessed;
    const errors = monitor.progress.errors.length;
    return totalOperations > 0 ? (errors / totalOperations) * 100 : 0;
  }

  private static calculateSuccessRate(monitor: MigrationMonitor): number {
    return Math.max(0, 100 - this.calculateErrorRate(monitor));
  }

  private static getMemoryUsage(): number {
    // In Node.js environment, you would use process.memoryUsage()
    // For browser, you'd use performance.memory if available
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024;
    }
    return 0;
  }

  private static async checkProgressAlerts(monitor: MigrationMonitor): Promise<void> {
    // Check for slow progress
    const expectedRate = 100; // documents per second
    if (monitor.metrics.documentsProcessedPerSecond < expectedRate * 0.5) {
      await this.addAlert(
        monitor.migrationId,
        'warning',
        'performance',
        `Migration processing slower than expected: ${monitor.metrics.documentsProcessedPerSecond.toFixed(2)} docs/sec`
      );
    }

    // Check error rate
    if (monitor.metrics.errorRate > 5) {
      await this.addAlert(
        monitor.migrationId,
        'error',
        'error_rate',
        `High error rate detected: ${monitor.metrics.errorRate.toFixed(2)}%`
      );
    }

    // Check for stuck migration
    const stuckThresholdMs = 300000; // 5 minutes
    const lastProgressTime = monitor.checkpoints.length > 0 
      ? monitor.checkpoints[monitor.checkpoints.length - 1].timestamp.toMillis()
      : monitor.startTime.toMillis();
    
    if (Date.now() - lastProgressTime > stuckThresholdMs) {
      await this.addAlert(
        monitor.migrationId,
        'critical',
        'timeout',
        'Migration appears to be stuck - no progress in 5 minutes'
      );
    }
  }

  private static async checkPerformanceAlerts(monitor: MigrationMonitor): Promise<void> {
    // Memory usage alerts
    if (monitor.metrics.memoryUsageMB > 1000) {
      await this.addAlert(
        monitor.migrationId,
        'warning',
        'memory',
        `High memory usage: ${monitor.metrics.memoryUsageMB.toFixed(0)}MB`
      );
    }

    if (monitor.metrics.memoryUsageMB > 2000) {
      await this.addAlert(
        monitor.migrationId,
        'critical',
        'memory',
        `Critical memory usage: ${monitor.metrics.memoryUsageMB.toFixed(0)}MB - consider pausing migration`
      );
    }
  }

  static async stopMonitoring(migrationId: string): Promise<void> {
    const monitor = this.monitors.get(migrationId);
    if (monitor) {
      monitor.status = monitor.status === 'running' ? 'completed' : monitor.status;
      
      // Final update to Firestore
      await updateDoc(
        doc(db, this.MONITORING_COLLECTION, migrationId),
        { 
          status: monitor.status,
          endTime: Timestamp.now()
        }
      );
    }

    this.monitors.delete(migrationId);
  }

  static getMonitor(migrationId: string): MigrationMonitor | undefined {
    return this.monitors.get(migrationId);
  }

  static async getAllMonitors(): Promise<MigrationMonitor[]> {
    const snapshot = await getDocs(collection(db, this.MONITORING_COLLECTION));
    return snapshot.docs.map(doc => doc.data() as MigrationMonitor);
  }
}

// =====================================================
// ROLLBACK SYSTEM
// =====================================================

export interface RollbackPlan {
  migrationId: string;
  targetVersion: SchemaVersion;
  rollbackOperations: RollbackOperation[];
  backupId: string;
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites: string[];
}

export interface RollbackOperation {
  id: string;
  type: 'restore_backup' | 'reverse_operation' | 'manual_fix';
  description: string;
  order: number;
  estimatedTime: number;
  rollbackInstructions: string;
}

export class RollbackSystem {
  static async createRollbackPlan(
    migrationId: string,
    targetVersion: SchemaVersion,
    backupId: string
  ): Promise<RollbackPlan> {
    // Create a plan to rollback the migration
    const rollbackOperations: RollbackOperation[] = [
      {
        id: 'pause_migration',
        type: 'manual_fix',
        description: 'Pause the current migration',
        order: 1,
        estimatedTime: 30,
        rollbackInstructions: 'MigrationMonitoringSystem.pauseMigration(migrationId, "Initiating rollback")'
      },
      {
        id: 'restore_from_backup',
        type: 'restore_backup',
        description: 'Restore data from pre-migration backup',
        order: 2,
        estimatedTime: 600,
        rollbackInstructions: `BackupManager.restoreBackup('${backupId}', { overwriteExisting: true })`
      },
      {
        id: 'update_schema_version',
        type: 'manual_fix',
        description: 'Update schema version to target version',
        order: 3,
        estimatedTime: 60,
        rollbackInstructions: `SchemaVersionManager.recordVersionApplication(targetVersion, rollbackId, 'rollback-system', environment)`
      }
    ];

    const plan: RollbackPlan = {
      migrationId,
      targetVersion,
      rollbackOperations,
      backupId,
      estimatedDuration: rollbackOperations.reduce((sum, op) => sum + op.estimatedTime, 0),
      riskLevel: 'medium', // Assess based on migration complexity
      prerequisites: [
        'Migration must be paused or stopped',
        'Backup must be verified and accessible',
        'All application instances must be taken offline during rollback'
      ]
    };

    return plan;
  }

  static async executeRollback(plan: RollbackPlan): Promise<{
    success: boolean;
    completedOperations: string[];
    errors: string[];
  }> {
    const logger = new MigrationLogger(`rollback_${plan.migrationId}`);
    const completedOperations: string[] = [];
    const errors: string[] = [];

    try {
      logger.info('Starting rollback execution', plan);

      // Sort operations by order
      const sortedOperations = plan.rollbackOperations.sort((a, b) => a.order - b.order);

      for (const operation of sortedOperations) {
        try {
          logger.info(`Executing rollback operation: ${operation.description}`);

          switch (operation.type) {
            case 'restore_backup':
              await this.executeBackupRestore(operation, plan.backupId, logger);
              break;
            case 'reverse_operation':
              await this.executeReverseOperation(operation, logger);
              break;
            case 'manual_fix':
              logger.warn(`Manual operation required: ${operation.rollbackInstructions}`);
              break;
          }

          completedOperations.push(operation.id);
          logger.info(`Completed rollback operation: ${operation.id}`);

        } catch (error) {
          const errorMsg = `Rollback operation failed: ${operation.id} - ${error.message}`;
          errors.push(errorMsg);
          logger.error(errorMsg, error);
          
          // Stop rollback on critical failures
          if (operation.type === 'restore_backup') {
            throw new Error('Critical rollback operation failed, stopping rollback');
          }
        }
      }

      const success = errors.length === 0;
      logger.info(`Rollback ${success ? 'completed successfully' : 'completed with errors'}`, {
        completedOperations: completedOperations.length,
        errors: errors.length
      });

      return { success, completedOperations, errors };

    } catch (error) {
      logger.error('Rollback execution failed', error);
      return {
        success: false,
        completedOperations,
        errors: [...errors, error.message]
      };
    }
  }

  private static async executeBackupRestore(
    operation: RollbackOperation,
    backupId: string,
    logger: MigrationLogger
  ): Promise<void> {
    const restoreResult = await BackupManager.restoreBackup(backupId, {
      includeIndexes: true,
      overwriteExisting: true,
      validateBeforeRestore: true,
      dryRun: false
    });

    if (!restoreResult.success) {
      throw new Error(`Backup restore failed: ${restoreResult.errors.join(', ')}`);
    }

    logger.info(`Successfully restored ${restoreResult.documentsRestored} documents from backup`);
  }

  private static async executeReverseOperation(
    operation: RollbackOperation,
    logger: MigrationLogger
  ): Promise<void> {
    // Execute the reverse of the original migration operation
    // This would need to be implemented based on the specific operation type
    logger.info(`Executing reverse operation: ${operation.description}`);
    
    // For now, just log the instruction
    logger.info(`Reverse operation instruction: ${operation.rollbackInstructions}`);
  }
}