/**
 * Backup and Disaster Recovery Configuration
 * Comprehensive backup system for Solarify solar marketplace
 */

export interface BackupConfig {
  retention: RetentionPolicies;
  scheduling: BackupScheduling;
  destinations: BackupDestinations;
  encryption: EncryptionConfig;
  monitoring: MonitoringConfig;
  recovery: RecoveryConfig;
}

export interface RetentionPolicies {
  daily: {
    count: number;
    duration: string; // ISO duration
  };
  weekly: {
    count: number;
    duration: string;
  };
  monthly: {
    count: number;
    duration: string;
  };
  yearly: {
    count: number;
    duration: string;
  };
}

export interface BackupScheduling {
  timezone: string;
  schedules: {
    firestore: {
      full: string; // cron expression
      incremental: string;
    };
    auth: string;
    storage: string;
    solar_data: string;
    analytics: string;
  };
}

export interface BackupDestinations {
  primary: {
    provider: 'gcs' | 'aws' | 'azure';
    bucket: string;
    region: string;
    path: string;
  };
  secondary: {
    provider: 'gcs' | 'aws' | 'azure';
    bucket: string;
    region: string;
    path: string;
  };
  archive: {
    provider: 'gcs' | 'aws' | 'azure';
    bucket: string;
    region: string;
    path: string;
    storageClass: string;
  };
}

export interface EncryptionConfig {
  algorithm: string;
  keyManagement: 'gcp-kms' | 'aws-kms' | 'azure-keyvault';
  keyId: string;
  customerKeys: boolean;
}

export interface MonitoringConfig {
  healthChecks: {
    interval: string;
    timeout: string;
    retries: number;
  };
  alerts: {
    email: string[];
    slack?: string;
    pagerduty?: string;
  };
  metrics: {
    provider: 'stackdriver' | 'datadog' | 'prometheus';
    namespace: string;
  };
}

export interface RecoveryConfig {
  rto: string; // Recovery Time Objective
  rpo: string; // Recovery Point Objective
  priorities: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  procedures: {
    [scenario: string]: RecoveryProcedure;
  };
}

export interface RecoveryProcedure {
  description: string;
  steps: RecoveryStep[];
  rollback: RecoveryStep[];
  validations: ValidationStep[];
}

export interface RecoveryStep {
  name: string;
  command: string;
  timeout: string;
  dependencies: string[];
  parallel: boolean;
}

export interface ValidationStep {
  name: string;
  type: 'data_integrity' | 'functional' | 'performance';
  command: string;
  threshold: any;
}

// Default production configuration
export const PRODUCTION_BACKUP_CONFIG: BackupConfig = {
  retention: {
    daily: { count: 30, duration: 'P30D' },
    weekly: { count: 12, duration: 'P84D' },
    monthly: { count: 12, duration: 'P365D' },
    yearly: { count: 7, duration: 'P2555D' } // 7 years
  },
  scheduling: {
    timezone: 'UTC',
    schedules: {
      firestore: {
        full: '0 2 * * 0', // Weekly full backup at 2 AM Sunday
        incremental: '0 2 * * 1-6' // Daily incremental Monday-Saturday
      },
      auth: '0 3 * * *', // Daily at 3 AM
      storage: '0 4 * * *', // Daily at 4 AM
      solar_data: '0 1 * * *', // Daily at 1 AM (critical data)
      analytics: '0 5 * * 0' // Weekly at 5 AM Sunday
    }
  },
  destinations: {
    primary: {
      provider: 'gcs',
      bucket: 'solarify-backups-primary',
      region: 'us-central1',
      path: 'production'
    },
    secondary: {
      provider: 'gcs',
      bucket: 'solarify-backups-secondary',
      region: 'us-east1',
      path: 'production'
    },
    archive: {
      provider: 'gcs',
      bucket: 'solarify-backups-archive',
      region: 'us-central1',
      path: 'archive',
      storageClass: 'COLDLINE'
    }
  },
  encryption: {
    algorithm: 'AES256',
    keyManagement: 'gcp-kms',
    keyId: 'projects/solarify/locations/global/keyRings/backup-keys/cryptoKeys/primary',
    customerKeys: true
  },
  monitoring: {
    healthChecks: {
      interval: 'PT5M', // Every 5 minutes
      timeout: 'PT30S',
      retries: 3
    },
    alerts: {
      email: ['devops@solarify.com', 'cto@solarify.com'],
      slack: 'https://hooks.slack.com/services/...',
      pagerduty: 'backup-failures'
    },
    metrics: {
      provider: 'stackdriver',
      namespace: 'solarify/backup'
    }
  },
  recovery: {
    rto: 'PT4H', // 4 hours
    rpo: 'PT1H', // 1 hour
    priorities: {
      critical: ['users', 'rfqs', 'quotes', 'solar_systems', 'energy_production'],
      high: ['profiles', 'projects', 'products', 'weather_data'],
      medium: ['reviews', 'notifications', 'analytics'],
      low: ['userActivity', 'portfolios', 'equipment']
    },
    procedures: {
      database_corruption: {
        description: 'Recovery from Firestore database corruption',
        steps: [
          {
            name: 'stop_application',
            command: 'kubectl scale deployment solarify-app --replicas=0',
            timeout: 'PT5M',
            dependencies: [],
            parallel: false
          },
          {
            name: 'restore_firestore',
            command: 'gcloud firestore databases restore --source-backup=$BACKUP_NAME',
            timeout: 'PT2H',
            dependencies: ['stop_application'],
            parallel: false
          },
          {
            name: 'validate_data',
            command: 'npm run validate:backup-restore',
            timeout: 'PT30M',
            dependencies: ['restore_firestore'],
            parallel: false
          },
          {
            name: 'start_application',
            command: 'kubectl scale deployment solarify-app --replicas=3',
            timeout: 'PT5M',
            dependencies: ['validate_data'],
            parallel: false
          }
        ],
        rollback: [
          {
            name: 'rollback_firestore',
            command: 'gcloud firestore databases restore --source-backup=$PREVIOUS_BACKUP',
            timeout: 'PT2H',
            dependencies: [],
            parallel: false
          }
        ],
        validations: [
          {
            name: 'data_consistency',
            type: 'data_integrity',
            command: 'npm run validate:data-consistency',
            threshold: { errorRate: 0.01 }
          },
          {
            name: 'application_health',
            type: 'functional',
            command: 'npm run health-check',
            threshold: { success: true }
          }
        ]
      },
      region_outage: {
        description: 'Recovery from complete regional outage',
        steps: [
          {
            name: 'activate_dr_region',
            command: 'terraform apply -var="dr_active=true" -target=module.disaster_recovery',
            timeout: 'PT30M',
            dependencies: [],
            parallel: false
          },
          {
            name: 'restore_latest_backup',
            command: 'npm run restore:cross-region -- --region=us-east1',
            timeout: 'PT2H',
            dependencies: ['activate_dr_region'],
            parallel: false
          },
          {
            name: 'update_dns',
            command: 'gcloud dns record-sets transaction replace --zone=solarify-zone',
            timeout: 'PT5M',
            dependencies: ['restore_latest_backup'],
            parallel: false
          },
          {
            name: 'notify_stakeholders',
            command: 'npm run notify:disaster-recovery-active',
            timeout: 'PT2M',
            dependencies: [],
            parallel: true
          }
        ],
        rollback: [
          {
            name: 'restore_primary_region',
            command: 'terraform apply -var="dr_active=false"',
            timeout: 'PT30M',
            dependencies: [],
            parallel: false
          }
        ],
        validations: [
          {
            name: 'cross_region_sync',
            type: 'data_integrity',
            command: 'npm run validate:cross-region-sync',
            threshold: { syncLag: 'PT5M' }
          }
        ]
      }
    }
  }
};

// Development/Staging configuration
export const DEVELOPMENT_BACKUP_CONFIG: BackupConfig = {
  ...PRODUCTION_BACKUP_CONFIG,
  retention: {
    daily: { count: 7, duration: 'P7D' },
    weekly: { count: 4, duration: 'P28D' },
    monthly: { count: 3, duration: 'P90D' },
    yearly: { count: 1, duration: 'P365D' }
  },
  scheduling: {
    ...PRODUCTION_BACKUP_CONFIG.scheduling,
    schedules: {
      firestore: {
        full: '0 2 * * *', // Daily full backup
        incremental: '0 */6 * * *' // Every 6 hours
      },
      auth: '0 3 * * *',
      storage: '0 4 * * *',
      solar_data: '0 */4 * * *', // Every 4 hours
      analytics: '0 5 * * *' // Daily
    }
  },
  destinations: {
    primary: {
      provider: 'gcs',
      bucket: 'solarify-backups-dev-primary',
      region: 'us-central1',
      path: 'development'
    },
    secondary: {
      provider: 'gcs',
      bucket: 'solarify-backups-dev-secondary',
      region: 'us-east1',
      path: 'development'
    },
    archive: {
      provider: 'gcs',
      bucket: 'solarify-backups-dev-archive',
      region: 'us-central1',
      path: 'archive',
      storageClass: 'NEARLINE'
    }
  },
  recovery: {
    ...PRODUCTION_BACKUP_CONFIG.recovery,
    rto: 'PT2H', // 2 hours for development
    rpo: 'PT4H' // 4 hours for development
  }
};

export function getBackupConfig(environment: 'production' | 'staging' | 'development'): BackupConfig {
  switch (environment) {
    case 'production':
      return PRODUCTION_BACKUP_CONFIG;
    case 'staging':
    case 'development':
      return DEVELOPMENT_BACKUP_CONFIG;
    default:
      throw new Error(`Unknown environment: ${environment}`);
  }
}