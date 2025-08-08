/**
 * Schema Migration System - Main Index
 * 
 * Comprehensive schema versioning and migration framework for Firestore databases
 * with specialized support for solar marketplace applications.
 * 
 * Features:
 * - Schema version management with semantic versioning
 * - Automated migration execution with batch processing
 * - Data validation system with runtime validation
 * - Solar-specific schema management
 * - Migration safety features (dry-run, backups, monitoring)
 * - Developer CLI tools
 * - Production deployment with zero-downtime strategies
 * - Firebase systems integration
 * 
 * @author Schema Migration System
 * @version 1.0.0
 * @created 2025-08-06
 */

// =====================================================
// VERSION MANAGEMENT
// =====================================================

export {
  // Types
  SchemaVersion,
  SchemaDefinition,
  CollectionSchemaDefinition,
  FieldDefinition,
  IndexDefinition,
  SecurityRuleDefinition,
  ConstraintDefinition,
  ValidationRuleDefinition,
  SchemaVersionRecord,
  SchemaRegistry,
  FirestoreFieldType,

  // Utilities
  VersionUtils,
  SchemaVersionManager,

  // Constants
  COLLECTIONS
} from './version-manager';

// =====================================================
// MIGRATION ENGINE
// =====================================================

export {
  // Types
  MigrationOperation,
  MigrationOperationType,
  AddFieldOperation,
  RemoveFieldOperation,
  RenameFieldOperation,
  ChangeFieldTypeOperation,
  TransformDataOperation,
  CustomOperation,
  DataTransformer,
  DocumentFilter,
  MigrationValidation,
  ValidationResult,
  MigrationContext,
  MigrationOptions,
  MigrationStats,
  MigrationProgress,
  MigrationResult,

  // Classes
  MigrationLogger,
  MigrationEngine,

  // Built-in transformers
  DataTransformers
} from './migration-engine';

// =====================================================
// VALIDATION SYSTEM
// =====================================================

export {
  // Types
  ValidationRule,
  ValidationRuleResult,
  ValidationContext,
  DocumentValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationInfo,
  ValidationStats,
  SchemaValidationResult,
  CollectionValidationResult,
  FieldValidationResult,
  IndexValidationResult,
  SchemaValidationStats,

  // Classes
  ValidationRegistry,
  DocumentValidator,
  RuntimeValidator,
  BuiltInValidationRules,

  // Error class
  ValidationError as ValidationErrorClass
} from './validation-system';

// =====================================================
// SOLAR SCHEMA MANAGEMENT
// =====================================================

export {
  // Schema definitions
  SolarSchemaDefinitions,

  // Migration templates
  SolarMigrationTemplates,

  // Data transformers
  SolarDataTransformers,

  // Validation rules
  SolarValidationRules,

  // Main manager
  SolarSchemaManager
} from './solar-schema-manager';

// =====================================================
// SAFETY SYSTEM
// =====================================================

export {
  // Backup system
  BackupConfiguration,
  BackupRecord,
  BackupCollectionInfo,
  IndexBackupInfo,
  RestoreOptions,
  RestoreResult,
  BackupManager,

  // Dry run system
  DryRunOptions,
  DryRunResult,
  DryRunIssue,
  DryRunChange,
  DryRunEngine,

  // Monitoring system
  MigrationMonitor,
  MigrationMetrics,
  MigrationAlert,
  MigrationCheckpoint,
  MigrationMonitoringSystem,

  // Rollback system
  RollbackPlan,
  RollbackOperation,
  RollbackSystem
} from './safety-system';

// =====================================================
// CLI TOOLS
// =====================================================

export {
  // Types
  CLICommand,
  CLIOption,
  CLIArgs,
  CLIResult,

  // Main CLI class
  SchemaCLI,

  // Built-in commands
  COMMANDS,

  // Utility classes
  SchemaUtils,
  SchemaDocGenerator,
  SystemHealthChecker
} from './cli-tools';

// =====================================================
// DEPLOYMENT SYSTEM
// =====================================================

export {
  // Types
  DeploymentStrategy,
  DeploymentEnvironment,
  DeploymentConfiguration,
  RolloutConfiguration,
  SafetyCheckConfiguration,
  SafetyCheck,
  SafetyCheckResult,
  RollbackTrigger,
  RollbackConfiguration,
  NotificationConfiguration,
  NotificationChannel,
  NotificationEvent,
  ValidationConfiguration,
  DeploymentContext,
  DeploymentPhase,
  DeploymentMetrics,
  DeploymentResult,

  // Classes
  DeploymentOrchestrator,
  ProductionSafetyChecks,
  EnvironmentSyncManager
} from './deployment-system';

// =====================================================
// INTEGRATION SYSTEM
// =====================================================

export {
  // TypeScript generation
  TypeGenerationOptions,
  GeneratedTypes,
  TypeScriptGenerator,

  // Security rules
  SecurityRuleTemplate,
  SecurityRulesGenerator,

  // Cloud Functions
  CloudFunctionTemplate,
  CloudFunctionsGenerator,

  // API Documentation
  APIEndpoint,
  APIParameter,
  APIRequestBody,
  APIResponse,
  APIDocumentationGenerator,

  // Main orchestrator
  IntegrationOrchestrator
} from './integration-system';

// =====================================================
// CONVENIENCE EXPORTS AND MAIN API
// =====================================================

/**
 * Main Schema Migration API
 * High-level interface for common operations
 */
export class SchemaMigrationAPI {
  /**
   * Initialize the schema migration system
   */
  static async initialize(): Promise<void> {
    // Import required modules dynamically to avoid circular dependencies
    const { SolarSchemaManager } = await import('./solar-schema-manager');
    const { ValidationRegistry } = await import('./validation-system');
    const { SchemaCLI } = await import('./cli-tools');

    // Initialize all subsystems
    await SolarSchemaManager.initialize();
    ValidationRegistry.initialize();
    SchemaCLI.initialize();

    console.log('Schema Migration System initialized successfully');
  }

  /**
   * Get current schema version
   */
  static async getCurrentVersion(): Promise<SchemaVersion | null> {
    const { SchemaVersionManager } = await import('./version-manager');
    return SchemaVersionManager.getCurrentVersion();
  }

  /**
   * Create a new migration
   */
  static async createMigration(
    fromVersion: SchemaVersion,
    toVersion: SchemaVersion,
    options?: Partial<MigrationOptions>
  ): Promise<MigrationResult> {
    const { MigrationEngine } = await import('./migration-engine');
    return MigrationEngine.executeMigration(fromVersion, toVersion, options, false);
  }

  /**
   * Run a dry-run migration
   */
  static async dryRunMigration(
    fromVersion: SchemaVersion,
    toVersion: SchemaVersion,
    options?: Partial<MigrationOptions>
  ): Promise<MigrationResult> {
    const { MigrationEngine } = await import('./migration-engine');
    return MigrationEngine.executeMigration(fromVersion, toVersion, options, true);
  }

  /**
   * Create a backup
   */
  static async createBackup(
    collections: string[],
    config?: Partial<BackupConfiguration>
  ): Promise<string> {
    const { BackupManager } = await import('./safety-system');
    const defaultConfig: BackupConfiguration = {
      enabled: true,
      strategy: 'full',
      compression: true,
      encryption: false,
      retentionDays: 7,
      storageLocation: 'firestore',
      includeMetadata: true
    };

    return BackupManager.createBackup(
      `manual_backup_${Date.now()}`,
      collections,
      { ...defaultConfig, ...config }
    );
  }

  /**
   * Validate a schema
   */
  static async validateSchema(schema: SchemaDefinition): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const { SchemaVersionManager } = await import('./version-manager');
    return SchemaVersionManager.validateSchemaDefinition(schema);
  }

  /**
   * Generate TypeScript types
   */
  static async generateTypes(
    schemaVersion: SchemaVersion,
    options?: Partial<TypeGenerationOptions>
  ): Promise<string> {
    const { TypeScriptGenerator } = await import('./integration-system');
    const defaultOptions: TypeGenerationOptions = {
      outputPath: './generated-types.ts',
      includeValidation: true,
      includeHelpers: true,
      includeComments: true,
      exportTypes: 'named',
      generateUnions: true,
      strictTypes: true
    };

    return TypeScriptGenerator.generateTypesFile(schemaVersion, { ...defaultOptions, ...options });
  }

  /**
   * Deploy schema to production
   */
  static async deploySchema(
    targetVersion: SchemaVersion,
    strategy: DeploymentStrategy = 'rolling_update',
    environment: DeploymentEnvironment = 'production'
  ): Promise<DeploymentResult> {
    const { DeploymentOrchestrator, ProductionSafetyChecks } = await import('./deployment-system');
    
    const config: DeploymentConfiguration = {
      strategy,
      environment,
      targetVersion,
      rolloutConfig: {
        batchSize: 50,
        batchDelay: 5000,
        maxConcurrency: 2
      },
      safetyChecks: {
        preDeploymentChecks: ProductionSafetyChecks.getAllSafetyChecks(),
        postDeploymentChecks: ProductionSafetyChecks.getAllSafetyChecks(),
        monitoringChecks: [],
        autoRollbackTriggers: []
      },
      rollbackStrategy: {
        automatic: true,
        maxAttempts: 3,
        strategy: 'backup_restore',
        timeoutMinutes: 30
      },
      notifications: {
        channels: [],
        events: [],
        recipients: []
      },
      validation: {
        schemaValidation: true,
        dataIntegrityChecks: true,
        performanceBaseline: true,
        businessRuleValidation: true,
        customValidations: []
      }
    };

    const deploymentId = await DeploymentOrchestrator.createDeployment(config);
    return DeploymentOrchestrator.executeDeployment(deploymentId);
  }

  /**
   * Execute CLI command
   */
  static async runCommand(commandName: string, args: CLIArgs): Promise<CLIResult> {
    const { SchemaCLI } = await import('./cli-tools');
    return SchemaCLI.executeCommand(commandName, args);
  }

  /**
   * Get system health status
   */
  static async getHealthStatus(): Promise<{
    overall: boolean;
    details: Record<string, any>;
  }> {
    const { SystemHealthChecker } = await import('./cli-tools');
    const health = await SystemHealthChecker.performHealthCheck();
    
    return {
      overall: health.overall,
      details: health.details
    };
  }
}

// =====================================================
// QUICK START UTILITIES
// =====================================================

/**
 * Quick start utilities for common operations
 */
export class QuickStart {
  /**
   * Set up a new solar marketplace schema
   */
  static async setupSolarSchema(): Promise<{
    schemasCreated: string[];
    version: string;
  }> {
    const { SolarSchemaManager } = await import('./solar-schema-manager');
    
    await SolarSchemaManager.initialize();
    
    const version = { major: 1, minor: 0, patch: 0 };
    
    return {
      schemasCreated: ['solar_panels_v1', 'energy_production_v1'],
      version: '1.0.0'
    };
  }

  /**
   * Perform a complete schema update workflow
   */
  static async updateSchemaWorkflow(
    targetVersion: SchemaVersion,
    environment: DeploymentEnvironment = 'development'
  ): Promise<{
    backupId: string;
    migrationResult: MigrationResult;
    deploymentResult?: DeploymentResult;
  }> {
    // Get current version
    const currentVersion = await SchemaMigrationAPI.getCurrentVersion();
    if (!currentVersion) {
      throw new Error('No current schema version found');
    }

    // Create backup
    const backupId = await SchemaMigrationAPI.createBackup(['users', 'profiles', 'products']);

    // Run migration
    const migrationResult = await SchemaMigrationAPI.createMigration(currentVersion, targetVersion);

    // Deploy if production
    let deploymentResult: DeploymentResult | undefined;
    if (environment === 'production') {
      deploymentResult = await SchemaMigrationAPI.deploySchema(targetVersion, 'rolling_update', environment);
    }

    return {
      backupId,
      migrationResult,
      deploymentResult
    };
  }

  /**
   * Generate complete project integration
   */
  static async generateProjectIntegration(schemaVersion: SchemaVersion): Promise<{
    typesGenerated: boolean;
    securityRulesGenerated: boolean;
    apiDocsGenerated: boolean;
    functionsGenerated: boolean;
  }> {
    const { IntegrationOrchestrator, SchemaVersionManager } = await import('./integration-system');
    
    const schema = await SchemaVersionManager.getSchemaByVersion(schemaVersion);
    if (!schema) {
      throw new Error(`Schema version ${schemaVersion} not found`);
    }

    const result = await IntegrationOrchestrator.syncSchemaWithFirebaseSystems(schema, {
      generateTypes: true,
      updateSecurityRules: true,
      generateCloudFunctions: true,
      updateAPIDocumentation: true,
      deployChanges: false
    });

    return {
      typesGenerated: !!result.results.types,
      securityRulesGenerated: !!result.results.securityRules,
      apiDocsGenerated: !!result.results.apiDocumentation,
      functionsGenerated: !!result.results.cloudFunctions
    };
  }
}

// =====================================================
// VERSION INFO
// =====================================================

export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();
export const FEATURES = [
  'Schema Version Management',
  'Automated Migration Engine',
  'Data Validation System',
  'Solar-Specific Schema Support',
  'Migration Safety Features',
  'Developer CLI Tools',
  'Production Deployment Support',
  'Firebase Integration',
  'TypeScript Generation',
  'Security Rules Generation',
  'API Documentation Generation'
] as const;

/**
 * System information
 */
export const SYSTEM_INFO = {
  version: VERSION,
  buildDate: BUILD_DATE,
  features: FEATURES,
  description: 'Comprehensive schema versioning and migration framework for Firestore databases with specialized support for solar marketplace applications',
  repository: 'https://github.com/your-org/solarify-app',
  license: 'MIT',
  authors: ['Schema Migration System Team']
} as const;

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  console.log('🚀 Schema Migration System loaded');
  console.log(`Version: ${VERSION}`);
  console.log(`Features: ${FEATURES.length} modules available`);
  console.log('Run SchemaMigrationAPI.initialize() to get started');
}