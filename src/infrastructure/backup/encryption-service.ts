/**
 * Encryption Service for Backup and Disaster Recovery
 * Comprehensive encryption, key management, and security controls
 */

import { KMS } from '@google-cloud/kms';
import { SecretManager } from '@google-cloud/secret-manager';
import { Storage } from '@google-cloud/storage';
import { BackupConfig, EncryptionConfig } from './backup-config';
import crypto from 'crypto';

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
    console.log('Initializing Encryption Service...');
    
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
    
    console.log('Encryption Service initialized');
  }

  /**
   * Encrypt backup data
   */
  async encryptBackup(data: Buffer | string, keyId: string): Promise<EncryptionResult> {
    const startTime = Date.now();
    console.log(`Encrypting backup data with key: ${keyId}`);

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

      console.log(`Backup data encrypted successfully with key: ${keyId}`);
      return result;

    } catch (error) {
      console.error(`Encryption failed for key ${keyId}:`, error);
      
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
    console.log(`Decrypting backup data with key: ${encryptionResult.keyId}`);

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

      console.log(`Backup data decrypted successfully with key: ${encryptionResult.keyId}`);
      return result;

    } catch (error) {
      console.error(`Decryption failed for key ${encryptionResult.keyId}:`, error);
      
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
    console.log('Encrypting authentication data...');

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
    console.log('Decrypting authentication data...');

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
      console.error('Failed to decrypt authentication data:', error);
      throw error;
    }
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(keyId: string): Promise<EncryptionKey> {
    console.log(`Rotating encryption key: ${keyId}`);

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

      console.log(`Key rotation completed: ${keyId} -> ${newKey.id}`);
      return newKey;

    } catch (error) {
      console.error(`Key rotation failed for ${keyId}:`, error);
      
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
    console.log('Backing up encryption keys...');

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

      console.log('Encryption keys backed up successfully');

    } catch (error) {
      console.error('Key backup failed:', error);
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
    console.log('Validating encryption setup...');

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
      console.error('Encryption validation failed:', error);
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
    console.log('Setting up encryption keys...');

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
        console.log(`Using existing key for ${purpose}: ${existingKey.id}`);
      } catch (error) {
        // Create new key if not exists
        const newKey = await this.createEncryptionKey(purpose);
        console.log(`Created new key for ${purpose}: ${newKey.id}`);
      }
    }
  }

  private async setupAccessControls(): Promise<void> {
    console.log('Setting up access controls...');

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
    console.log('Setting up key rotation schedules...');

    // Setup automatic key rotation
    // This would typically integrate with a scheduler service
    setInterval(async () => {
      await this.checkAndRotateKeys();
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  private async initializeAuditLogging(): Promise<void> {
    console.log('Initializing audit logging...');
    
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
    console.log(`Storing key backup at: ${backupPath}`);
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
    console.log(`Security event logged: ${event.operation} - ${event.success ? 'SUCCESS' : 'FAILURE'}`);
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async checkAndRotateKeys(): Promise<void> {
    console.log('Checking keys for rotation...');

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
            console.log(`Automatically rotated key: ${key.id}`);
          } catch (error) {
            console.error(`Failed to rotate key ${key.id}:`, error);
          }
        }
      }
    }
  }
}