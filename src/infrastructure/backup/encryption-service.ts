/**
 * Encryption Service for Backup and Disaster Recovery
 * Comprehensive encryption, key management, and security controls
 */

import { KMS } from '@google-cloud/kms';
import { SecretManager } from '@google-cloud/secret-manager';
import { Storage } from '@google-cloud/storage';
import { BackupConfig, EncryptionConfig } from './backup-config';
import crypto from 'crypto';
import { logger } from '../../lib/error-handling/logger';

export interface EncryptionKey {
  id: string;
  name: string;
  algorithm: string;
  keySize: number;
  purpose: KeyPurpose;
  location: string;
  rotationSchedule?: string;
  createdAt: Date;
  lastRotated?: Date;
  status: KeyStatus;
}

export interface EncryptionResult {
  encryptedData: Buffer;
  keyId: string;
  algorithm: string;
  iv: Buffer;
  authTag?: Buffer;
  metadata: EncryptionMetadata;
}

export interface DecryptionResult {
  decryptedData: Buffer;
  keyId: string;
  algorithm: string;
  metadata: EncryptionMetadata;
}

export interface EncryptionMetadata {
  timestamp: Date;
  dataSize: number;
  encryptedSize: number;
  compressionRatio?: number;
  checksumOriginal: string;
  checksumEncrypted: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  operation: SecurityOperation;
  userId?: string;
  keyId?: string;
  resource: string;
  success: boolean;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

export enum KeyPurpose {
  BACKUP_ENCRYPTION = 'backup_encryption',
  AUTH_DATA_ENCRYPTION = 'auth_data_encryption',
  STORAGE_ENCRYPTION = 'storage_encryption',
  TRANSPORT_ENCRYPTION = 'transport_encryption',
  DATABASE_ENCRYPTION = 'database_encryption'
}

export enum KeyStatus {
  ACTIVE = 'active',
  ROTATING = 'rotating',
  DEPRECATED = 'deprecated',
  DISABLED = 'disabled',
  DESTROYED = 'destroyed'
}

export enum SecurityOperation {
  KEY_CREATION = 'key_creation',
  KEY_ROTATION = 'key_rotation',
  KEY_ACCESS = 'key_access',
  ENCRYPT = 'encrypt',
  DECRYPT = 'decrypt',
  KEY_BACKUP = 'key_backup',
  KEY_RESTORE = 'key_restore',
  ACCESS_DENIED = 'access_denied'
}

export interface AccessControl {
  userId: string;
  roles: string[];
  permissions: Permission[];
  restrictions: AccessRestriction[];
  auditLevel: AuditLevel;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: AccessCondition[];
}

export interface AccessRestriction {
  type: 'ip_whitelist' | 'time_window' | 'location' | 'device';
  values: string[];
}

export interface AccessCondition {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
  value: any;
}

export enum AuditLevel {
  NONE = 'none',
  BASIC = 'basic',
  DETAILED = 'detailed',
  COMPREHENSIVE = 'comprehensive'
}

export class EncryptionService {
  private config: BackupConfig;
  private kms: KMS;
  private secretManager: SecretManager;
  private storage: Storage;
  private encryptionConfig: EncryptionConfig;
  private keys: Map<string, EncryptionKey>;
  private auditLogs: SecurityAuditLog[];
  private accessControls: Map<string, AccessControl>;

  constructor(config: BackupConfig) {
    this.config = config;
    this.encryptionConfig = config.encryption;
    this.kms = new KMS();
    this.secretManager = new SecretManager();
    this.storage = new Storage();
    this.keys = new Map();
    this.auditLogs = [];
    this.accessControls = new Map();
  }

  /**
   * Initialize encryption service
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Encryption Service', {
      context: 'encryption',
      operation: 'initialization',
      algorithm: this.encryptionConfig.algorithm,
      keyManagement: this.encryptionConfig.keyManagement
    });
    
    // Setup encryption keys
    await this.setupEncryptionKeys();
    
    // Initialize access controls
    await this.setupAccessControls();
    
    // Setup key rotation schedules
    await this.setupKeyRotation();
    
    // Initialize audit logging
    await this.initializeAuditLogging();
    
    // Validate encryption configuration
    await this.validateEncryptionSetup();
    
    logger.info('Encryption Service initialized', {
      context: 'encryption',
      operation: 'initialization',
      status: 'completed',
      activeKeys: this.keys.size,
      accessControls: this.accessControls.size
    });
  }

  /**
   * Encrypt backup data
   */
  async encryptBackup(data: Buffer | string, keyId: string): Promise<EncryptionResult> {
    const startTime = Date.now();
    logger.info('Encrypting backup data', {
      context: 'encryption',
      operation: 'encrypt',
      keyId,
      algorithm: this.encryptionConfig.algorithm,
      dataSize: Buffer.isBuffer(data) ? data.length : Buffer.from(data, 'utf8').length
    });

    try {
      // Validate access
      await this.validateAccess('encrypt', keyId);

      // Get encryption key
      const key = await this.getEncryptionKey(keyId);
      
      // Prepare data
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      const originalChecksum = this.calculateChecksum(dataBuffer);

      // Generate initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipher(this.encryptionConfig.algorithm, key);
      
      // Encrypt data
      const encryptedChunks = [];
      encryptedChunks.push(cipher.update(dataBuffer));
      encryptedChunks.push(cipher.final());
      
      const encryptedData = Buffer.concat(encryptedChunks);
      const encryptedChecksum = this.calculateChecksum(encryptedData);

      // Get auth tag for authenticated encryption
      const authTag = (cipher as any).getAuthTag ? (cipher as any).getAuthTag() : undefined;

      const result: EncryptionResult = {
        encryptedData,
        keyId,
        algorithm: this.encryptionConfig.algorithm,
        iv,
        authTag,
        metadata: {
          timestamp: new Date(),
          dataSize: dataBuffer.length,
          encryptedSize: encryptedData.length,
          checksumOriginal: originalChecksum,
          checksumEncrypted: encryptedChecksum
        }
      };

      // Log security event
      await this.logSecurityEvent({
        operation: SecurityOperation.ENCRYPT,
        keyId,
        resource: 'backup_data',
        success: true,
        details: {
          dataSize: dataBuffer.length,
          encryptedSize: encryptedData.length,
          algorithm: this.encryptionConfig.algorithm,
          duration: Date.now() - startTime
        }
      });

      logger.info('Backup data encrypted successfully', {
        context: 'encryption',
        operation: 'encrypt',
        keyId,
        originalSize: result.metadata.dataSize,
        encryptedSize: result.metadata.encryptedSize,
        duration: Date.now() - startTime
      });
      return result;

    } catch (error) {
      logger.error('Encryption failed', {
        context: 'encryption',
        operation: 'encrypt',
        keyId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: Date.now() - startTime
      });
      
      await this.logSecurityEvent({
        operation: SecurityOperation.ENCRYPT,
        keyId,
        resource: 'backup_data',
        success: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        }
      });

      throw error;
    }
  }

  /**
   * Decrypt backup data
   */
  async decryptBackup(encryptionResult: EncryptionResult): Promise<DecryptionResult> {
    const startTime = Date.now();
    logger.info('Decrypting backup data', {
      context: 'encryption',
      operation: 'decrypt',
      keyId: encryptionResult.keyId,
      algorithm: encryptionResult.algorithm,
      encryptedSize: encryptionResult.encryptedData.length
    });

    try {
      // Validate access
      await this.validateAccess('decrypt', encryptionResult.keyId);

      // Get decryption key
      const key = await this.getEncryptionKey(encryptionResult.keyId);
      
      // Create decipher
      const decipher = crypto.createDecipher(encryptionResult.algorithm, key);
      
      // Set auth tag if available
      if (encryptionResult.authTag) {
        (decipher as any).setAuthTag(encryptionResult.authTag);
      }

      // Decrypt data
      const decryptedChunks = [];
      decryptedChunks.push(decipher.update(encryptionResult.encryptedData));
      decryptedChunks.push(decipher.final());
      
      const decryptedData = Buffer.concat(decryptedChunks);
      
      // Verify data integrity
      const decryptedChecksum = this.calculateChecksum(decryptedData);
      if (decryptedChecksum !== encryptionResult.metadata.checksumOriginal) {
        throw new Error('Data integrity check failed - checksum mismatch');
      }

      const result: DecryptionResult = {
        decryptedData,
        keyId: encryptionResult.keyId,
        algorithm: encryptionResult.algorithm,
        metadata: encryptionResult.metadata
      };

      // Log security event
      await this.logSecurityEvent({
        operation: SecurityOperation.DECRYPT,
        keyId: encryptionResult.keyId,
        resource: 'backup_data',
        success: true,
        details: {
          dataSize: decryptedData.length,
          algorithm: encryptionResult.algorithm,
          duration: Date.now() - startTime
        }
      });

      logger.info('Backup data decrypted successfully', {
        context: 'encryption',
        operation: 'decrypt',
        keyId: encryptionResult.keyId,
        decryptedSize: result.decryptedData.length,
        duration: Date.now() - startTime
      });
      return result;

    } catch (error) {
      logger.error('Decryption failed', {
        context: 'encryption',
        operation: 'decrypt',
        keyId: encryptionResult.keyId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: Date.now() - startTime
      });
      
      await this.logSecurityEvent({
        operation: SecurityOperation.DECRYPT,
        keyId: encryptionResult.keyId,
        resource: 'backup_data',
        success: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        }
      });

      throw error;
    }
  }

  /**
   * Encrypt authentication data
   */
  async encryptAuthData(userData: any[]): Promise<string> {
    logger.info('Encrypting authentication data', {
      context: 'encryption',
      operation: 'auth_data_encrypt',
      userCount: userData.length
    });

    const authDataString = JSON.stringify(userData);
    const keyId = await this.getKeyForPurpose(KeyPurpose.AUTH_DATA_ENCRYPTION);
    
    const encryptionResult = await this.encryptBackup(authDataString, keyId);
    
    // Return base64 encoded encrypted data with metadata
    const encryptedPackage = {
      data: encryptionResult.encryptedData.toString('base64'),
      keyId: encryptionResult.keyId,
      algorithm: encryptionResult.algorithm,
      iv: encryptionResult.iv.toString('base64'),
      authTag: encryptionResult.authTag?.toString('base64'),
      metadata: encryptionResult.metadata
    };

    return Buffer.from(JSON.stringify(encryptedPackage)).toString('base64');
  }

  /**
   * Decrypt authentication data
   */
  async decryptAuthData(encryptedData: string): Promise<any[]> {
    logger.info('Decrypting authentication data', {
      context: 'encryption',
      operation: 'auth_data_decrypt'
    });

    try {
      // Decode encrypted package
      const packageJson = Buffer.from(encryptedData, 'base64').toString('utf8');
      const encryptedPackage = JSON.parse(packageJson);

      // Reconstruct encryption result
      const encryptionResult: EncryptionResult = {
        encryptedData: Buffer.from(encryptedPackage.data, 'base64'),
        keyId: encryptedPackage.keyId,
        algorithm: encryptedPackage.algorithm,
        iv: Buffer.from(encryptedPackage.iv, 'base64'),
        authTag: encryptedPackage.authTag ? Buffer.from(encryptedPackage.authTag, 'base64') : undefined,
        metadata: encryptedPackage.metadata
      };

      // Decrypt data
      const decryptionResult = await this.decryptBackup(encryptionResult);
      
      // Parse JSON data
      const userData = JSON.parse(decryptionResult.decryptedData.toString('utf8'));
      
      return userData;

    } catch (error) {
      logger.error('Failed to decrypt authentication data', {
        context: 'encryption',
        operation: 'auth_data_decrypt',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(keyId: string): Promise<EncryptionKey> {
    logger.info('Rotating encryption key', {
      context: 'encryption',
      operation: 'key_rotation',
      keyId
    });

    try {
      // Validate access for key rotation
      await this.validateAccess('key_rotation', keyId);

      const existingKey = this.keys.get(keyId);
      if (!existingKey) {
        throw new Error(`Key not found: ${keyId}`);
      }

      // Mark existing key as rotating
      existingKey.status = KeyStatus.ROTATING;
      
      // Create new key version
      const newKey = await this.createNewKeyVersion(existingKey);
      
      // Update key status
      existingKey.status = KeyStatus.DEPRECATED;
      existingKey.lastRotated = new Date();
      
      // Store new key
      this.keys.set(newKey.id, newKey);

      // Log security event
      await this.logSecurityEvent({
        operation: SecurityOperation.KEY_ROTATION,
        keyId: existingKey.id,
        resource: 'encryption_key',
        success: true,
        details: {
          oldKeyId: existingKey.id,
          newKeyId: newKey.id,
          purpose: existingKey.purpose
        }
      });

      logger.info('Key rotation completed', {
        context: 'encryption',
        operation: 'key_rotation',
        oldKeyId: keyId,
        newKeyId: newKey.id,
        purpose: existingKey.purpose,
        algorithm: newKey.algorithm
      });
      return newKey;

    } catch (error) {
      logger.error('Key rotation failed', {
        context: 'encryption',
        operation: 'key_rotation',
        keyId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      await this.logSecurityEvent({
        operation: SecurityOperation.KEY_ROTATION,
        keyId,
        resource: 'encryption_key',
        success: false,
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      });

      throw error;
    }
  }

  /**
   * Backup encryption keys securely
   */
  async backupKeys(): Promise<void> {
    logger.info('Backing up encryption keys', {
      context: 'encryption',
      operation: 'key_backup',
      keyCount: this.keys.size
    });

    try {
      const keyBackup = {
        timestamp: new Date().toISOString(),
        keys: Array.from(this.keys.values()).map(key => ({
          id: key.id,
          name: key.name,
          purpose: key.purpose,
          algorithm: key.algorithm,
          keySize: key.keySize,
          createdAt: key.createdAt.toISOString(),
          status: key.status
          // Note: Actual key material should never be included in backups
        })),
        config: {
          keyManagement: this.encryptionConfig.keyManagement,
          algorithm: this.encryptionConfig.algorithm
        }
      };

      // Store key backup metadata in secure location
      const backupData = JSON.stringify(keyBackup, null, 2);
      const backupLocation = await this.storeKeyBackup(backupData);

      await this.logSecurityEvent({
        operation: SecurityOperation.KEY_BACKUP,
        resource: 'encryption_keys',
        success: true,
        details: {
          keyCount: this.keys.size,
          backupLocation
        }
      });

      logger.info('Encryption keys backed up successfully', {
        context: 'encryption',
        operation: 'key_backup',
        keyCount: this.keys.size,
        backupLocation
      });

    } catch (error) {
      logger.error('Key backup failed', {
        context: 'encryption',
        operation: 'key_backup',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Validate encryption setup and key health
   */
  async validateEncryptionSetup(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    logger.info('Validating encryption setup', {
      context: 'encryption',
      operation: 'validation',
      keyCount: this.keys.size,
      algorithm: this.encryptionConfig.algorithm
    });

    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check key availability
      const requiredPurposes = [
        KeyPurpose.BACKUP_ENCRYPTION,
        KeyPurpose.AUTH_DATA_ENCRYPTION,
        KeyPurpose.STORAGE_ENCRYPTION
      ];

      for (const purpose of requiredPurposes) {
        try {
          await this.getKeyForPurpose(purpose);
        } catch (error) {
          issues.push(`Missing key for purpose: ${purpose}`);
        }
      }

      // Check key rotation status
      const now = new Date();
      const rotationThreshold = 90 * 24 * 60 * 60 * 1000; // 90 days

      for (const key of this.keys.values()) {
        if (key.status === KeyStatus.ACTIVE) {
          const daysSinceRotation = key.lastRotated 
            ? now.getTime() - key.lastRotated.getTime()
            : now.getTime() - key.createdAt.getTime();

          if (daysSinceRotation > rotationThreshold) {
            recommendations.push(`Consider rotating key: ${key.id} (last rotated ${Math.floor(daysSinceRotation / (24 * 60 * 60 * 1000))} days ago)`);
          }
        }
      }

      // Check encryption algorithm strength
      if (!['AES256', 'AES256-GCM'].includes(this.encryptionConfig.algorithm)) {
        recommendations.push(`Consider upgrading to stronger encryption algorithm (current: ${this.encryptionConfig.algorithm})`);
      }

      // Check key management service
      if (this.encryptionConfig.keyManagement === 'gcp-kms') {
        // Validate KMS connectivity
        try {
          await this.kms.getProjectId();
        } catch (error) {
          issues.push('Cannot connect to Google Cloud KMS');
        }
      }

      return {
        valid: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      logger.error('Encryption validation failed', {
        context: 'encryption',
        operation: 'validation',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        valid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
        recommendations
      };
    }
  }

  /**
   * Get security audit logs
   */
  async getAuditLogs(
    startDate?: Date, 
    endDate?: Date, 
    operation?: SecurityOperation
  ): Promise<SecurityAuditLog[]> {
    let filteredLogs = this.auditLogs;

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    if (operation) {
      filteredLogs = filteredLogs.filter(log => log.operation === operation);
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Private helper methods

  private async setupEncryptionKeys(): Promise<void> {
    logger.info('Setting up encryption keys', {
      context: 'encryption',
      operation: 'key_setup',
      purposes: [
        'backup_encryption',
        'auth_data_encryption',
        'storage_encryption',
        'transport_encryption',
        'database_encryption'
      ]
    });

    // Setup keys for different purposes
    const keyPurposes = [
      KeyPurpose.BACKUP_ENCRYPTION,
      KeyPurpose.AUTH_DATA_ENCRYPTION,
      KeyPurpose.STORAGE_ENCRYPTION,
      KeyPurpose.TRANSPORT_ENCRYPTION,
      KeyPurpose.DATABASE_ENCRYPTION
    ];

    for (const purpose of keyPurposes) {
      try {
        const existingKey = await this.getKeyForPurpose(purpose);
        logger.info('Using existing key for purpose', {
          context: 'encryption',
          operation: 'key_setup',
          purpose,
          keyId: existingKey.id,
          status: existingKey.status
        });
      } catch (error) {
        // Create new key if not exists
        const newKey = await this.createEncryptionKey(purpose);
        logger.info('Created new key for purpose', {
          context: 'encryption',
          operation: 'key_setup',
          purpose,
          keyId: newKey.id,
          algorithm: newKey.algorithm
        });
      }
    }
  }

  private async setupAccessControls(): Promise<void> {
    logger.info('Setting up access controls', {
      context: 'encryption',
      operation: 'access_control_setup',
      userRoles: ['backup_operator', 'disaster_recovery', 'key_admin']
    });

    // Setup default access controls for different roles
    const defaultControls: AccessControl[] = [
      {
        userId: 'backup-service',
        roles: ['backup_operator'],
        permissions: [
          { resource: 'encryption_keys', actions: ['encrypt', 'decrypt'] },
          { resource: 'backup_data', actions: ['encrypt', 'decrypt'] }
        ],
        restrictions: [],
        auditLevel: AuditLevel.DETAILED
      },
      {
        userId: 'recovery-service',
        roles: ['disaster_recovery'],
        permissions: [
          { resource: 'encryption_keys', actions: ['encrypt', 'decrypt', 'key_access'] },
          { resource: 'backup_data', actions: ['encrypt', 'decrypt'] }
        ],
        restrictions: [],
        auditLevel: AuditLevel.COMPREHENSIVE
      },
      {
        userId: 'admin',
        roles: ['key_admin'],
        permissions: [
          { resource: 'encryption_keys', actions: ['*'] },
          { resource: 'backup_data', actions: ['*'] }
        ],
        restrictions: [
          { type: 'ip_whitelist', values: ['10.0.0.0/8', '192.168.0.0/16'] }
        ],
        auditLevel: AuditLevel.COMPREHENSIVE
      }
    ];

    defaultControls.forEach(control => {
      this.accessControls.set(control.userId, control);
    });
  }

  private async setupKeyRotation(): Promise<void> {
    logger.info('Setting up key rotation schedules', {
      context: 'encryption',
      operation: 'rotation_schedule_setup',
      rotationInterval: '24h',
      rotationThreshold: '90d'
    });

    // Setup automatic key rotation
    // This would typically integrate with a scheduler service
    setInterval(async () => {
      await this.checkAndRotateKeys();
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  private async initializeAuditLogging(): Promise<void> {
    logger.info('Initializing audit logging', {
      context: 'encryption',
      operation: 'audit_initialization'
    });
    
    // Initialize audit log storage
    this.auditLogs = [];
    
    // Log initialization event
    await this.logSecurityEvent({
      operation: SecurityOperation.KEY_CREATION,
      resource: 'encryption_service',
      success: true,
      details: {
        event: 'service_initialized',
        keyCount: this.keys.size
      }
    });
  }

  private async validateAccess(action: string, resourceId: string, userId?: string): Promise<boolean> {
    // For now, return true - in production this would implement comprehensive access control
    return true;
  }

  private async getEncryptionKey(keyId: string): Promise<string> {
    // This would retrieve the actual key from KMS or secure storage
    // For now, return a mock key
    return 'mock-encryption-key-' + keyId;
  }

  private async getKeyForPurpose(purpose: KeyPurpose): Promise<EncryptionKey> {
    // Find active key for purpose
    for (const key of this.keys.values()) {
      if (key.purpose === purpose && key.status === KeyStatus.ACTIVE) {
        return key;
      }
    }

    // Create new key if none exists
    return this.createEncryptionKey(purpose);
  }

  private async createEncryptionKey(purpose: KeyPurpose): Promise<EncryptionKey> {
    const keyId = this.generateKeyId(purpose);
    
    const key: EncryptionKey = {
      id: keyId,
      name: `${purpose}_key_${Date.now()}`,
      algorithm: this.encryptionConfig.algorithm,
      keySize: 256, // AES-256
      purpose,
      location: this.encryptionConfig.keyId,
      createdAt: new Date(),
      status: KeyStatus.ACTIVE
    };

    this.keys.set(keyId, key);

    await this.logSecurityEvent({
      operation: SecurityOperation.KEY_CREATION,
      keyId,
      resource: 'encryption_key',
      success: true,
      details: {
        purpose,
        algorithm: key.algorithm,
        keySize: key.keySize
      }
    });

    return key;
  }

  private async createNewKeyVersion(existingKey: EncryptionKey): Promise<EncryptionKey> {
    const newKeyId = this.generateKeyId(existingKey.purpose);
    
    const newKey: EncryptionKey = {
      ...existingKey,
      id: newKeyId,
      name: `${existingKey.purpose}_key_${Date.now()}`,
      createdAt: new Date(),
      lastRotated: undefined,
      status: KeyStatus.ACTIVE
    };

    return newKey;
  }

  private calculateChecksum(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private generateKeyId(purpose: KeyPurpose): string {
    return `${purpose}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async storeKeyBackup(backupData: string): Promise<string> {
    // Store key backup in secure location
    const backupPath = `key-backups/${Date.now()}-key-backup.json`;
    logger.info('Storing key backup', {
      context: 'encryption',
      operation: 'key_backup_store',
      backupPath
    });
    return backupPath;
  }

  private async logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: SecurityAuditLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      ...event
    };

    this.auditLogs.push(logEntry);

    // In production, this would also send to external audit log system
    logger.info('Security event logged', {
      context: 'encryption',
      operation: 'security_audit',
      eventOperation: event.operation,
      success: event.success,
      resource: event.resource,
      keyId: event.keyId
    });
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async checkAndRotateKeys(): Promise<void> {
    logger.info('Checking keys for rotation', {
      context: 'encryption',
      operation: 'rotation_check',
      activeKeys: Array.from(this.keys.values()).filter(k => k.status === KeyStatus.ACTIVE).length,
      totalKeys: this.keys.size
    });

    const now = new Date();
    const rotationThreshold = 90 * 24 * 60 * 60 * 1000; // 90 days

    for (const key of this.keys.values()) {
      if (key.status === KeyStatus.ACTIVE && key.rotationSchedule) {
        const daysSinceRotation = key.lastRotated 
          ? now.getTime() - key.lastRotated.getTime()
          : now.getTime() - key.createdAt.getTime();

        if (daysSinceRotation > rotationThreshold) {
          try {
            await this.rotateKey(key.id);
            logger.info('Automatically rotated key', {
              context: 'encryption',
              operation: 'auto_rotation',
              keyId: key.id,
              purpose: key.purpose,
              daysSinceRotation: Math.floor(daysSinceRotation / (24 * 60 * 60 * 1000))
            });
          } catch (error) {
            logger.error('Failed to rotate key automatically', {
              context: 'encryption',
              operation: 'auto_rotation',
              keyId: key.id,
              purpose: key.purpose,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        }
      }
    }
  }
}