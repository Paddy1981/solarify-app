#!/usr/bin/env tsx

/**
 * Production Environment Validation Script
 * Validates all required environment variables and configurations for production deployment
 */

interface ValidationResult {
  category: string;
  variable: string;
  status: 'required' | 'recommended' | 'optional' | 'present' | 'missing' | 'invalid';
  message: string;
  value?: string;
}

class ProductionEnvValidator {
  private results: ValidationResult[] = [];

  validate(): void {
    console.log('🔍 Validating Production Environment Configuration...\n');

    this.validateFirebaseConfig();
    this.validateSecurityConfig();
    this.validateExternalAPIs();
    this.validateMonitoringConfig();
    this.validateOptionalServices();
    
    this.displayResults();
  }

  private validateFirebaseConfig(): void {
    console.log('🔥 Validating Firebase Configuration...');
    
    const firebaseVars = [
      {
        name: 'NEXT_PUBLIC_FIREBASE_API_KEY',
        required: true,
        description: 'Firebase Web API key'
      },
      {
        name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
        required: true,
        description: 'Firebase Auth domain'
      },
      {
        name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        required: true, 
        description: 'Firebase Project ID'
      },
      {
        name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
        required: true,
        description: 'Firebase Storage bucket'
      },
      {
        name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        required: true,
        description: 'Firebase Messaging Sender ID'
      },
      {
        name: 'NEXT_PUBLIC_FIREBASE_APP_ID',
        required: true,
        description: 'Firebase App ID'
      },
      {
        name: 'FIREBASE_ADMIN_PROJECT_ID',
        required: true,
        description: 'Firebase Admin Project ID (server-side)'
      },
      {
        name: 'FIREBASE_ADMIN_CLIENT_EMAIL',
        required: true,
        description: 'Firebase Admin Service Account Email'
      },
      {
        name: 'FIREBASE_ADMIN_PRIVATE_KEY',
        required: true,
        description: 'Firebase Admin Private Key',
        sensitive: true
      }
    ];

    for (const variable of firebaseVars) {
      const value = process.env[variable.name];
      
      if (!value) {
        this.results.push({
          category: 'Firebase',
          variable: variable.name,
          status: 'missing',
          message: `Required for ${variable.description}`
        });
      } else {
        // Validate format
        let isValid = true;
        let validationMessage = 'Present and configured';

        if (variable.name === 'FIREBASE_ADMIN_PRIVATE_KEY') {
          if (!value.includes('BEGIN PRIVATE KEY')) {
            isValid = false;
            validationMessage = 'Invalid private key format';
          }
        }

        if (variable.name === 'FIREBASE_ADMIN_CLIENT_EMAIL') {
          if (!value.includes('@') || !value.includes('.iam.gserviceaccount.com')) {
            isValid = false; 
            validationMessage = 'Invalid service account email format';
          }
        }

        this.results.push({
          category: 'Firebase',
          variable: variable.name,
          status: isValid ? 'present' : 'invalid',
          message: validationMessage,
          value: variable.sensitive ? '[REDACTED]' : value.substring(0, 20) + '...'
        });
      }
    }
  }

  private validateSecurityConfig(): void {
    console.log('🔒 Validating Security Configuration...');
    
    const securityVars = [
      {
        name: 'NODE_ENV',
        required: true,
        expectedValue: 'production',
        description: 'Node environment'
      },
      {
        name: 'NEXTAUTH_SECRET',
        required: true,
        description: 'NextAuth secret key (min 32 chars)',
        minLength: 32
      },
      {
        name: 'NEXTAUTH_URL',
        required: true,
        description: 'NextAuth canonical URL',
        shouldContain: 'https://'
      },
      {
        name: 'NEXT_PUBLIC_APP_URL',
        required: true,
        description: 'Application base URL',
        shouldContain: 'https://'
      }
    ];

    for (const variable of securityVars) {
      const value = process.env[variable.name];
      
      if (!value) {
        this.results.push({
          category: 'Security',
          variable: variable.name,
          status: 'missing',
          message: `Required for ${variable.description}`
        });
        continue;
      }

      let isValid = true;
      let validationMessage = 'Present and configured';

      // Check expected value
      if (variable.expectedValue && value !== variable.expectedValue) {
        isValid = false;
        validationMessage = `Expected '${variable.expectedValue}', got '${value}'`;
      }

      // Check minimum length
      if (variable.minLength && value.length < variable.minLength) {
        isValid = false;
        validationMessage = `Too short (${value.length} chars, min ${variable.minLength})`;
      }

      // Check should contain
      if (variable.shouldContain && !value.includes(variable.shouldContain)) {
        isValid = false;
        validationMessage = `Should contain '${variable.shouldContain}'`;
      }

      this.results.push({
        category: 'Security',
        variable: variable.name,
        status: isValid ? 'present' : 'invalid',
        message: validationMessage,
        value: variable.name.includes('SECRET') ? '[REDACTED]' : value
      });
    }
  }

  private validateExternalAPIs(): void {
    console.log('🌐 Validating External API Configuration...');
    
    const apiVars = [
      {
        name: 'NREL_API_KEY',
        required: false,
        recommended: true,
        description: 'NREL API for solar calculations',
        impact: 'Solar calculations will be limited to basic estimates'
      },
      {
        name: 'NOAA_API_KEY', 
        required: false,
        recommended: true,
        description: 'NOAA API for weather data',
        impact: 'Weather data will be limited or unavailable'
      },
      {
        name: 'OPENWEATHERMAP_API_KEY',
        required: false,
        recommended: false,
        description: 'OpenWeatherMap API (alternative weather)',
        impact: 'Alternative weather service'
      },
      {
        name: 'WEATHERAPI_KEY',
        required: false,
        recommended: false, 
        description: 'WeatherAPI.com (alternative weather)',
        impact: 'Alternative weather service'
      }
    ];

    for (const variable of apiVars) {
      const value = process.env[variable.name];
      
      if (!value) {
        const status = variable.required ? 'missing' : variable.recommended ? 'recommended' : 'optional';
        this.results.push({
          category: 'External APIs',
          variable: variable.name,
          status,
          message: `${variable.description}. Impact: ${variable.impact}`
        });
      } else {
        // Basic validation - check if it looks like an API key
        const isValid = value.length >= 10 && /^[A-Za-z0-9_-]+$/.test(value);
        
        this.results.push({
          category: 'External APIs',
          variable: variable.name,
          status: isValid ? 'present' : 'invalid',
          message: isValid ? 'API key configured' : 'Invalid API key format',
          value: value.substring(0, 8) + '...'
        });
      }
    }
  }

  private validateMonitoringConfig(): void {
    console.log('📊 Validating Monitoring Configuration...');
    
    const monitoringVars = [
      {
        name: 'NEXT_PUBLIC_SENTRY_DSN',
        required: false,
        recommended: true,
        description: 'Sentry error tracking',
        impact: 'Error tracking and monitoring will be unavailable'
      },
      {
        name: 'GOOGLE_ANALYTICS_ID',
        required: false,
        recommended: true,
        description: 'Google Analytics tracking',
        impact: 'User analytics will be unavailable'
      },
      {
        name: 'UPSTASH_REDIS_REST_URL',
        required: false,
        recommended: true,
        description: 'Redis for caching and rate limiting',
        impact: 'Rate limiting and caching will be unavailable'
      },
      {
        name: 'UPSTASH_REDIS_REST_TOKEN',
        required: false,
        recommended: true,
        description: 'Redis authentication token',
        impact: 'Redis will be unavailable'
      }
    ];

    for (const variable of monitoringVars) {
      const value = process.env[variable.name];
      
      if (!value) {
        const status = variable.recommended ? 'recommended' : 'optional';
        this.results.push({
          category: 'Monitoring',
          variable: variable.name,
          status,
          message: `${variable.description}. Impact: ${variable.impact}`
        });
      } else {
        let isValid = true;
        let validationMessage = 'Present and configured';

        // Validate Sentry DSN format
        if (variable.name === 'NEXT_PUBLIC_SENTRY_DSN') {
          if (!value.includes('sentry.io') || !value.startsWith('https://')) {
            isValid = false;
            validationMessage = 'Invalid Sentry DSN format';
          }
        }

        // Validate Google Analytics ID format  
        if (variable.name === 'GOOGLE_ANALYTICS_ID') {
          if (!value.startsWith('G-') && !value.startsWith('GA-')) {
            isValid = false;
            validationMessage = 'Invalid Google Analytics ID format';
          }
        }

        // Validate Redis URL format
        if (variable.name === 'UPSTASH_REDIS_REST_URL') {
          if (!value.startsWith('https://')) {
            isValid = false;
            validationMessage = 'Redis URL should use HTTPS';
          }
        }

        this.results.push({
          category: 'Monitoring',
          variable: variable.name,
          status: isValid ? 'present' : 'invalid',
          message: validationMessage,
          value: variable.name.includes('TOKEN') ? '[REDACTED]' : value.substring(0, 30) + '...'
        });
      }
    }
  }

  private validateOptionalServices(): void {
    console.log('🔧 Validating Optional Services...');
    
    // Check for additional optional configurations
    const optionalVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY', 
      'MAILGUN_API_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ];

    for (const varName of optionalVars) {
      const value = process.env[varName];
      if (value) {
        this.results.push({
          category: 'Optional Services',
          variable: varName,
          status: 'present',
          message: 'Optional service configured',
          value: '[REDACTED]'
        });
      }
    }

    if (optionalVars.every(varName => !process.env[varName])) {
      this.results.push({
        category: 'Optional Services',
        variable: 'None configured',
        status: 'optional',
        message: 'No optional services configured - this is fine for basic deployment'
      });
    }
  }

  private displayResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📋 PRODUCTION ENVIRONMENT VALIDATION RESULTS');
    console.log('='.repeat(80));

    // Group results by category and status
    const categories = ['Firebase', 'Security', 'External APIs', 'Monitoring', 'Optional Services'];
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      if (categoryResults.length === 0) continue;

      console.log(`\n🏷️  ${category.toUpperCase()}:`);
      console.log('-'.repeat(50));

      for (const result of categoryResults) {
        const emoji = {
          present: '✅',
          missing: '❌',
          invalid: '⚠️',
          required: '🚨',
          recommended: '💡',
          optional: 'ℹ️'
        }[result.status] || '❓';

        console.log(`  ${emoji} ${result.variable}`);
        console.log(`     └─ ${result.message}`);
        
        if (result.value && !result.value.includes('[REDACTED]')) {
          console.log(`     └─ Value: ${result.value}`);
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');

    const counts = {
      present: this.results.filter(r => r.status === 'present').length,
      missing: this.results.filter(r => r.status === 'missing').length,
      invalid: this.results.filter(r => r.status === 'invalid').length,
      required: this.results.filter(r => r.status === 'required').length,
      recommended: this.results.filter(r => r.status === 'recommended').length,
      optional: this.results.filter(r => r.status === 'optional').length
    };

    console.log(`✅ Configured: ${counts.present}`);
    console.log(`❌ Missing: ${counts.missing}`);
    console.log(`⚠️  Invalid: ${counts.invalid}`);
    console.log(`💡 Recommended: ${counts.recommended}`);
    console.log(`ℹ️  Optional: ${counts.optional}`);

    // Determine deployment readiness
    const criticalIssues = counts.missing + counts.invalid;
    const warnings = counts.recommended;

    console.log('\n' + '='.repeat(80));
    
    if (criticalIssues === 0 && warnings <= 2) {
      console.log('🎉 ENVIRONMENT READY FOR PRODUCTION DEPLOYMENT!');
      console.log('All critical configurations are present and valid.');
      
      if (warnings > 0) {
        console.log(`💡 Consider addressing ${warnings} recommended configurations for optimal performance.`);
      }
      
      console.log('\n📋 Next Steps:');
      console.log('1. Deploy infrastructure: ./scripts/deploy.sh production apply');
      console.log('2. Deploy application with configured environment variables');
      console.log('3. Run post-deployment verification tests');
      
    } else if (criticalIssues === 0 && warnings > 2) {
      console.log('⚠️  ENVIRONMENT PARTIALLY READY');
      console.log('Critical configurations are present, but several recommended ones are missing.');
      console.log('Consider addressing recommended configurations before production deployment.');
      
    } else {
      console.log('🚨 ENVIRONMENT NOT READY FOR PRODUCTION');
      console.log(`Found ${criticalIssues} critical issues that must be resolved.`);
      console.log('\n📋 Required Actions:');
      console.log('1. Configure all missing required environment variables');
      console.log('2. Fix any invalid configurations');
      console.log('3. Re-run this validation script');
      console.log('4. Refer to DEPLOYMENT_CHECKLIST.md for setup instructions');
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new ProductionEnvValidator();
  validator.validate();
}

export default ProductionEnvValidator;