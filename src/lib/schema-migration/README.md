# Schema Migration System

A comprehensive schema versioning and migration framework for Firestore databases with specialized support for solar marketplace applications.

## 🌟 Features

- **Schema Version Management** - Semantic versioning for database schemas with comprehensive tracking
- **Automated Migration Engine** - Batch processing with data transformation utilities
- **Data Validation System** - Runtime validation with solar-specific validators
- **Migration Safety Features** - Dry-run, backups, monitoring, and rollback capabilities
- **Developer CLI Tools** - Command-line utilities for schema management
- **Production Deployment** - Zero-downtime strategies with blue-green and canary deployments
- **Firebase Integration** - TypeScript generation, security rules, and Cloud Functions
- **Solar-Specific Support** - Specialized schema management for solar equipment and energy data

## 🚀 Quick Start

### Installation

The schema migration system is integrated into the Solarify app. Import the main API:

```typescript
import { SchemaMigrationAPI } from './lib/schema-migration';

// Initialize the system
await SchemaMigrationAPI.initialize();
```

### Basic Usage

```typescript
// Check current schema version
const currentVersion = await SchemaMigrationAPI.getCurrentVersion();

// Create a migration
const migrationResult = await SchemaMigrationAPI.createMigration(
  { major: 1, minor: 0, patch: 0 },
  { major: 1, minor: 1, patch: 0 }
);

// Generate TypeScript types
const types = await SchemaMigrationAPI.generateTypes(
  { major: 1, minor: 1, patch: 0 }
);
```

### CLI Usage

The system provides comprehensive CLI tools:

```bash
# Check current schema version
node -e "import('./lib/schema-migration/cli-tools').then(({SchemaCLI}) => SchemaCLI.executeCommand('schema:version', {}))"

# List all schemas
schema:list

# Create a new schema
schema:create --name "Solar Panels V2" --version "2.0.0" --template "solar_panels"

# Run a migration
migration:run --from "1.0.0" --to "2.0.0" --dry-run

# Create a backup
backup:create --collections "products,users,profiles"
```

## 📋 System Architecture

### Core Components

1. **Version Manager** (`version-manager.ts`)
   - Schema version tracking with semantic versioning
   - Schema registry for all current and historical schemas
   - Migration path planning and validation

2. **Migration Engine** (`migration-engine.ts`)
   - Automated migration execution with batch processing
   - Data transformation utilities
   - Error handling and recovery mechanisms

3. **Validation System** (`validation-system.ts`)
   - Schema validation for all document operations
   - Runtime validation during reads/writes
   - Solar-specific validation rules

4. **Safety System** (`safety-system.ts`)
   - Backup and restore capabilities
   - Dry-run execution
   - Migration monitoring and alerting
   - Rollback mechanisms

5. **Solar Schema Manager** (`solar-schema-manager.ts`)
   - Solar equipment schema versioning
   - Energy production data schema evolution
   - Industry-specific validation rules

6. **CLI Tools** (`cli-tools.ts`)
   - Command-line interface for all operations
   - Schema management utilities
   - Documentation generation

7. **Deployment System** (`deployment-system.ts`)
   - Zero-downtime deployment strategies
   - Blue-green and canary deployments
   - Production safety checks

8. **Integration System** (`integration-system.ts`)
   - TypeScript type generation
   - Firebase security rules integration
   - Cloud Functions code generation
   - API documentation updates

## 🔧 Configuration

### Migration Options

```typescript
const migrationOptions: MigrationOptions = {
  batchSize: 100,
  concurrency: 5,
  retryAttempts: 3,
  retryDelay: 1000,
  timeoutMs: 600000,
  backupBeforeMigration: true,
  validateAfterMigration: true,
  rollbackOnError: false,
  continueOnError: false
};
```

### Deployment Configuration

```typescript
const deploymentConfig: DeploymentConfiguration = {
  strategy: 'rolling_update', // or 'blue_green', 'canary', 'immediate'
  environment: 'production',
  targetVersion: { major: 2, minor: 0, patch: 0 },
  rolloutConfig: {
    batchSize: 50,
    batchDelay: 5000,
    maxConcurrency: 2
  },
  safetyChecks: {
    preDeploymentChecks: ProductionSafetyChecks.getAllSafetyChecks(),
    postDeploymentChecks: ProductionSafetyChecks.getAllSafetyChecks(),
    autoRollbackTriggers: []
  }
};
```

## 📚 Detailed Usage

### Schema Version Management

#### Creating a New Schema

```typescript
import { SchemaVersionManager, SchemaDefinition } from './lib/schema-migration';

const schema: SchemaDefinition = {
  id: 'solar_panels_v2',
  version: { major: 2, minor: 0, patch: 0 },
  name: 'Solar Panels Schema V2',
  description: 'Enhanced solar panel product schema with bifacial support',
  collections: [
    {
      name: 'products_solar_panels',
      fields: [
        {
          name: 'id',
          type: 'string',
          required: true,
          description: 'Unique product identifier'
        },
        {
          name: 'bifacial',
          type: 'boolean',
          required: false,
          defaultValue: false,
          description: 'Whether panel is bifacial',
          addedInVersion: { major: 2, minor: 0, patch: 0 }
        }
        // ... more fields
      ],
      indexes: [
        {
          name: 'bifacial_efficiency_idx',
          fields: [
            { fieldPath: 'bifacial', order: 'asc' },
            { fieldPath: 'efficiency', order: 'desc' }
          ],
          type: 'composite'
        }
      ]
    }
  ],
  // ... rest of schema definition
};

await SchemaVersionManager.registerSchema(schema);
```

#### Planning a Migration

```typescript
const migrationPlan = await SchemaVersionManager.planMigrationPath(
  { major: 1, minor: 0, patch: 0 },
  { major: 2, minor: 0, patch: 0 }
);

console.log('Migration plan:', {
  isValid: migrationPlan.isValid,
  breakingChanges: migrationPlan.breakingChanges,
  estimatedTime: migrationPlan.estimatedTime,
  warnings: migrationPlan.warnings
});
```

### Migration Execution

#### Custom Data Transformers

```typescript
import { DataTransformer } from './lib/schema-migration';

const customTransformer: DataTransformer = {
  name: 'add_bifacial_field',
  transform: async (document) => {
    // Add bifacial field based on panel model
    const bifacial = document.model?.includes('Bifacial') || false;
    
    return {
      ...document,
      bifacial,
      updatedAt: new Date()
    };
  },
  validate: (original, transformed) => {
    return transformed.bifacial !== undefined;
  }
};
```

#### Running Migrations with Custom Operations

```typescript
import { MigrationEngine, MigrationOperation } from './lib/schema-migration';

const operations: MigrationOperation[] = [
  {
    id: 'add_bifacial_field',
    type: 'transform_data',
    collection: 'products',
    description: 'Add bifacial field to solar panels',
    transformer: customTransformer,
    priority: 1
  }
];

const result = await MigrationEngine.executeOperations(operations, context);
```

### Data Validation

#### Custom Validation Rules

```typescript
import { ValidationRule, ValidationRegistry } from './lib/schema-migration';

const solarPanelValidation: ValidationRule = {
  id: 'solar_panel_power_consistency',
  name: 'Solar Panel Power Consistency',
  description: 'Ensures panel wattage matches specifications',
  field: '*',
  severity: 'error',
  category: 'business',
  validate: (value, document) => {
    if (document.category === 'solar_panels') {
      const specPower = document.specifications?.power;
      const productPower = document.wattage;
      
      if (specPower && productPower && Math.abs(specPower - productPower) > 5) {
        return {
          passed: false,
          message: 'Panel wattage does not match specifications power rating'
        };
      }
    }
    
    return { passed: true };
  }
};

ValidationRegistry.registerRule(solarPanelValidation);
```

#### Runtime Validation

```typescript
import { RuntimeValidator } from './lib/schema-migration';

// Set up validation for a collection
RuntimeValidator.registerCollectionValidator(
  'products',
  solarPanelSchema,
  [solarPanelValidation]
);

// Validate a document before creation
const validationResult = await RuntimeValidator.validateOperation(
  'products',
  newProductData,
  'create'
);

if (!validationResult.isValid) {
  console.error('Validation failed:', validationResult.errors);
}
```

### Safety Features

#### Creating Backups

```typescript
import { BackupManager, BackupConfiguration } from './lib/schema-migration';

const backupConfig: BackupConfiguration = {
  enabled: true,
  strategy: 'full',
  compression: true,
  encryption: false,
  retentionDays: 30,
  storageLocation: 'firestore',
  includeMetadata: true
};

const backupId = await BackupManager.createBackup(
  'pre_migration_backup',
  ['products', 'users', 'profiles'],
  backupConfig
);
```

#### Dry Run Execution

```typescript
import { DryRunEngine, DryRunOptions } from './lib/schema-migration';

const dryRunOptions: DryRunOptions = {
  showChanges: true,
  validateOnly: false,
  estimateImpact: true,
  sampleSize: 100,
  generateReport: true
};

const dryRunResult = await DryRunEngine.executeDryRun(migrationContext, dryRunOptions);

console.log('Dry run results:', {
  wouldSucceed: dryRunResult.wouldSucceed,
  estimatedChanges: dryRunResult.estimatedChanges,
  potentialIssues: dryRunResult.potentialIssues.length,
  recommendations: dryRunResult.recommendations
});
```

#### Migration Monitoring

```typescript
import { MigrationMonitoringSystem } from './lib/schema-migration';

// Start monitoring
await MigrationMonitoringSystem.startMonitoring(migrationId);

// Update progress
await MigrationMonitoringSystem.updateProgress(migrationId, {
  phase: 'execution',
  operationIndex: 5,
  totalOperations: 10,
  documentsProcessed: 1000
});

// Add alerts
await MigrationMonitoringSystem.addAlert(
  migrationId,
  'warning',
  'performance',
  'Migration slower than expected'
);
```

### Production Deployment

#### Rolling Update Deployment

```typescript
import { DeploymentOrchestrator, DeploymentConfiguration } from './lib/schema-migration';

const config: DeploymentConfiguration = {
  strategy: 'rolling_update',
  environment: 'production',
  targetVersion: { major: 2, minor: 0, patch: 0 },
  rolloutConfig: {
    batchSize: 25,
    batchDelay: 10000,
    maxConcurrency: 1
  },
  safetyChecks: {
    preDeploymentChecks: [
      ProductionSafetyChecks.DATABASE_HEALTH_CHECK,
      ProductionSafetyChecks.SCHEMA_VALIDATION_CHECK
    ],
    postDeploymentChecks: [
      ProductionSafetyChecks.PERFORMANCE_BASELINE_CHECK
    ],
    autoRollbackTriggers: [
      {
        id: 'error_rate_trigger',
        name: 'High Error Rate',
        condition: 'error_rate > 5%',
        threshold: 5,
        timeWindow: 300000,
        action: 'rollback'
      }
    ]
  }
};

const deploymentId = await DeploymentOrchestrator.createDeployment(config);
const result = await DeploymentOrchestrator.executeDeployment(deploymentId);
```

#### Blue-Green Deployment

```typescript
const blueGreenConfig: DeploymentConfiguration = {
  strategy: 'blue_green',
  environment: 'production',
  targetVersion: { major: 2, minor: 0, patch: 0 },
  rolloutConfig: {
    switchoverDelay: 30000,
    warmupPeriod: 60000
  },
  // ... safety checks and other config
};
```

#### Canary Deployment

```typescript
const canaryConfig: DeploymentConfiguration = {
  strategy: 'canary',
  environment: 'production',
  targetVersion: { major: 2, minor: 0, patch: 0 },
  rolloutConfig: {
    canaryTrafficPercent: 5,
    canaryDuration: 1800000, // 30 minutes
    canarySuccessThreshold: 99.5
  },
  // ... safety checks and other config
};
```

### Integration with Firebase

#### Generating TypeScript Types

```typescript
import { TypeScriptGenerator, TypeGenerationOptions } from './lib/schema-migration';

const options: TypeGenerationOptions = {
  outputPath: './src/types/generated-schema.ts',
  namespace: 'SolarSchema',
  includeValidation: true,
  includeHelpers: true,
  includeComments: true,
  exportTypes: 'named',
  generateUnions: true,
  strictTypes: true
};

const typesFile = await TypeScriptGenerator.generateTypesFile(schemaVersion, options);
```

#### Generating Security Rules

```typescript
import { SecurityRulesGenerator } from './lib/schema-migration';

const rules = SecurityRulesGenerator.generateRulesFromSchema(schema);

// Deploy rules to Firebase (requires Firebase CLI or Admin SDK)
await SecurityRulesGenerator.updateSecurityRules(schema, true);
```

#### Generating Cloud Functions

```typescript
import { CloudFunctionsGenerator } from './lib/schema-migration';

const functions = CloudFunctionsGenerator.generateFunctionsFromSchema(schema);
const functionsFile = await CloudFunctionsGenerator.generateFunctionsFile(schema);

// Write to functions/index.js for deployment
```

#### API Documentation

```typescript
import { APIDocumentationGenerator } from './lib/schema-migration';

// Generate OpenAPI specification
const openAPISpec = APIDocumentationGenerator.generateOpenAPISpec(schema);

// Generate Markdown documentation
const markdownDoc = APIDocumentationGenerator.generateMarkdownDoc(schema);
```

### Solar-Specific Features

#### Solar Equipment Schema

The system includes pre-built schemas for solar equipment:

```typescript
import { SolarSchemaDefinitions } from './lib/schema-migration';

// Access predefined schemas
const solarPanelSchema = SolarSchemaDefinitions.SOLAR_PANEL_SCHEMA_V1;
const inverterSchema = SolarSchemaDefinitions.INVERTER_SCHEMA_V1;
const batterySchema = SolarSchemaDefinitions.BATTERY_SCHEMA_V1;
```

#### Solar Data Transformers

```typescript
import { SolarDataTransformers } from './lib/schema-migration';

// Use built-in transformers
const normalizedPowerData = await SolarDataTransformers.NORMALIZE_POWER_UNITS.transform(document);
const migratedEnergyData = await SolarDataTransformers.UPDATE_ENERGY_PRODUCTION_SCHEMA.transform(document);
```

#### Solar Validation Rules

```typescript
import { SolarValidationRules } from './lib/schema-migration';

// Access solar-specific validation rules
const solarRules = SolarValidationRules.getAllSolarRules();
```

## 🛠️ Development

### Setting Up Development Environment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   ```bash
   # Set up Firebase configuration
   cp .env.example .env.local
   # Edit .env.local with your Firebase config
   ```

3. **Initialize Schema System**
   ```typescript
   await SchemaMigrationAPI.initialize();
   ```

### Testing

```bash
# Run unit tests
npm test src/lib/schema-migration

# Run integration tests
npm run test:integration

# Run specific test file
npm test src/lib/schema-migration/version-manager.test.ts
```

### Building

```bash
# Build TypeScript
npm run build

# Generate types
npm run generate:types

# Validate schemas
npm run validate:schemas
```

## 🔒 Security Considerations

### Production Safety

1. **Always create backups** before running migrations in production
2. **Use dry-run** to validate migrations before execution
3. **Enable monitoring** to detect issues early
4. **Configure rollback triggers** for automatic recovery
5. **Test in staging** environment first

### Access Control

```typescript
// Implement proper authentication checks
const canRunMigration = (user: User, environment: string) => {
  if (environment === 'production') {
    return user.role === 'admin' && user.mfaEnabled;
  }
  return user.role === 'developer' || user.role === 'admin';
};
```

### Data Protection

- All sensitive data is handled according to GDPR and CCPA requirements
- Backups can be encrypted and stored securely
- Audit logs track all schema changes and migrations
- Personal data is properly anonymized in non-production environments

## 📈 Monitoring and Observability

### Migration Metrics

The system automatically tracks:

- **Execution Time** - Duration of migrations and operations
- **Document Processing Rate** - Documents processed per second
- **Error Rate** - Percentage of failed operations
- **Success Rate** - Overall migration success rate
- **Resource Usage** - Memory and CPU utilization during migrations

### Alerting

Configure alerts for:

- **High Error Rates** - > 5% failure rate
- **Slow Processing** - < 50% of expected processing speed
- **Memory Issues** - > 80% memory utilization
- **Stuck Migrations** - No progress for > 5 minutes
- **Critical Failures** - Any critical safety check failure

### Logging

All operations are logged with:

- **Timestamp** - When the operation occurred
- **User ID** - Who initiated the operation
- **Operation Type** - What type of operation was performed
- **Parameters** - What parameters were used
- **Result** - Success/failure and any error messages
- **Duration** - How long the operation took

## 🤝 Contributing

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comprehensive JSDoc comments
- Include unit tests for new features
- Follow the existing error handling patterns

### Adding New Features

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-migration-feature
   ```

2. **Implement Feature**
   - Add new functionality
   - Include comprehensive tests
   - Update documentation

3. **Test Thoroughly**
   ```bash
   npm test
   npm run test:integration
   npm run lint
   ```

4. **Submit Pull Request**
   - Include detailed description
   - Reference any related issues
   - Ensure CI passes

### Solar-Specific Contributions

When adding solar industry features:

- Follow solar industry standards and conventions
- Include validation for solar-specific data ranges
- Add appropriate unit tests with realistic solar data
- Update solar schema templates as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- [API Reference](./docs/api-reference.md)
- [Migration Guide](./docs/migration-guide.md)
- [Solar Schema Guide](./docs/solar-schema-guide.md)
- [Troubleshooting](./docs/troubleshooting.md)

### Getting Help

- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and community support
- **Email**: Contact the development team at dev@solarify.app

### FAQ

**Q: Can I use this system with databases other than Firestore?**
A: Currently, the system is specifically designed for Firestore. However, the architecture is modular and could be adapted for other databases.

**Q: Is this system suitable for other industries besides solar?**
A: Yes! While it includes solar-specific features, the core schema migration system is industry-agnostic and can be used for any application.

**Q: How do I handle breaking changes in production?**
A: Use the blue-green deployment strategy for breaking changes. This creates a parallel environment and switches traffic only after validation.

**Q: What happens if a migration fails halfway through?**
A: The system includes automatic rollback capabilities. Failed migrations can be rolled back using the backup created before the migration.

**Q: Can I extend the validation rules?**
A: Absolutely! The validation system is designed to be extensible. You can add custom validation rules for your specific business logic.

## 🗺️ Roadmap

### Version 1.1.0
- [ ] Multi-database support (MongoDB, PostgreSQL)
- [ ] Enhanced monitoring dashboard
- [ ] GraphQL API generation
- [ ] Advanced rollback strategies

### Version 1.2.0
- [ ] Machine learning-powered migration optimization
- [ ] Real-time collaboration features
- [ ] Advanced testing utilities
- [ ] Performance analytics

### Version 2.0.0
- [ ] Distributed migration execution
- [ ] Advanced security features
- [ ] Multi-tenant support
- [ ] Enterprise-grade compliance tools

---

**Built with ❤️ for the solar industry and the broader developer community.**