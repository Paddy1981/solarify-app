// =============================================================================
// Advanced Performance Monitoring (APM) Configuration for Solarify
// =============================================================================
// OpenTelemetry and Google Cloud Monitoring integration
// Custom metrics, traces, and performance monitoring for solar marketplace
// =============================================================================

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';
import { MetricExporter } from '@google-cloud/opentelemetry-cloud-monitoring-exporter';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { metrics, trace } from '@opentelemetry/api';
import { Histogram, Counter, Gauge } from '@opentelemetry/api';

interface APMConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  projectId: string;
  enableConsoleExport?: boolean;
  enableDetailedInstrumentation?: boolean;
  customAttributes?: Record<string, string>;
}

class SolarifyAPM {
  private sdk: NodeSDK;
  private meter: any;
  private tracer: any;
  
  // Custom metrics for solar marketplace business logic
  private metrics = {
    // RFQ (Request for Quote) metrics
    rfqCreationDuration: null as Histogram | null,
    rfqCreationCount: null as Counter | null,
    activeRFQsGauge: null as Gauge | null,
    
    // Quote response metrics
    quoteResponseDuration: null as Histogram | null,
    quoteResponseCount: null as Counter | null,
    quoteAcceptanceRate: null as Gauge | null,
    
    // User engagement metrics
    userSessionDuration: null as Histogram | null,
    userActiveCount: null as Gauge | null,
    userRegistrationCount: null as Counter | null,
    
    // Solar system performance metrics
    systemPerformanceEfficiency: null as Gauge | null,
    energyProductionRate: null as Gauge | null,
    systemHealthScore: null as Gauge | null,
    
    // Database performance metrics
    databaseQueryDuration: null as Histogram | null,
    databaseConnectionCount: null as Gauge | null,
    firestoreReadCount: null as Counter | null,
    firestoreWriteCount: null as Counter | null,
    
    // API performance metrics
    externalApiDuration: null as Histogram | null,
    externalApiFailureCount: null as Counter | null,
    
    // Financial metrics
    transactionAmount: null as Histogram | null,
    paymentFailureCount: null as Counter | null,
    paymentSuccessCount: null as Counter | null,
  };

  constructor(private config: APMConfig) {
    this.initializeSDK();
    this.setupCustomMetrics();
    this.setupCustomTracer();
  }

  private initializeSDK() {
    // Resource definition
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
      [SemanticResourceAttributes.CLOUD_PROVIDER]: 'gcp',
      [SemanticResourceAttributes.CLOUD_PLATFORM]: 'gcp_cloud_run',
      [SemanticResourceAttributes.CLOUD_REGION]: process.env.GOOGLE_CLOUD_REGION || 'us-central1',
      ...this.config.customAttributes,
    });

    // Configure trace exporter
    const traceExporter = new TraceExporter({
      projectId: this.config.projectId,
    });

    // Configure metric exporter
    const metricExporter = new MetricExporter({
      projectId: this.config.projectId,
    });

    // Metric readers configuration
    const metricReaders = [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 60000, // 1 minute
      }),
    ];

    if (this.config.enableConsoleExport) {
      metricReaders.push(
        new PeriodicExportingMetricReader({
          exporter: new ConsoleMetricExporter(),
          exportIntervalMillis: 30000, // 30 seconds for console
        })
      );
    }

    // Initialize SDK
    this.sdk = new NodeSDK({
      resource: resource,
      traceExporter: traceExporter,
      metricReader: metricReaders[0],
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-dns': { enabled: false },
          '@opentelemetry/instrumentation-net': { enabled: false },
          '@opentelemetry/instrumentation-http': {
            enabled: true,
            requestHook: this.httpRequestHook.bind(this),
            responseHook: this.httpResponseHook.bind(this),
          },
          '@opentelemetry/instrumentation-express': { enabled: true },
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });

    // Start the SDK
    this.sdk.start();
  }

  private setupCustomMetrics() {
    this.meter = metrics.getMeter(this.config.serviceName, this.config.serviceVersion);
    
    // RFQ metrics
    this.metrics.rfqCreationDuration = this.meter.createHistogram('solarify_rfq_creation_duration', {
      description: 'Time taken to create RFQ',
      unit: 'ms',
    });
    
    this.metrics.rfqCreationCount = this.meter.createCounter('solarify_rfq_creation_total', {
      description: 'Total number of RFQs created',
    });
    
    this.metrics.activeRFQsGauge = this.meter.createGauge('solarify_active_rfqs', {
      description: 'Current number of active RFQs',
    });

    // Quote metrics
    this.metrics.quoteResponseDuration = this.meter.createHistogram('solarify_quote_response_duration', {
      description: 'Time taken to respond to RFQ with quote',
      unit: 'ms',
    });
    
    this.metrics.quoteResponseCount = this.meter.createCounter('solarify_quote_response_total', {
      description: 'Total number of quotes submitted',
    });
    
    this.metrics.quoteAcceptanceRate = this.meter.createGauge('solarify_quote_acceptance_rate', {
      description: 'Rate of quote acceptance',
      unit: 'percentage',
    });

    // User engagement metrics
    this.metrics.userSessionDuration = this.meter.createHistogram('solarify_user_session_duration', {
      description: 'User session duration',
      unit: 'minutes',
    });
    
    this.metrics.userActiveCount = this.meter.createGauge('solarify_active_users', {
      description: 'Current number of active users',
    });
    
    this.metrics.userRegistrationCount = this.meter.createCounter('solarify_user_registration_total', {
      description: 'Total user registrations',
    });

    // Solar system performance metrics
    this.metrics.systemPerformanceEfficiency = this.meter.createGauge('solarify_system_efficiency', {
      description: 'Solar system performance efficiency',
      unit: 'percentage',
    });
    
    this.metrics.energyProductionRate = this.meter.createGauge('solarify_energy_production_rate', {
      description: 'Energy production rate',
      unit: 'kWh',
    });
    
    this.metrics.systemHealthScore = this.meter.createGauge('solarify_system_health_score', {
      description: 'Overall system health score',
      unit: 'score',
    });

    // Database metrics
    this.metrics.databaseQueryDuration = this.meter.createHistogram('solarify_database_query_duration', {
      description: 'Database query execution time',
      unit: 'ms',
    });
    
    this.metrics.databaseConnectionCount = this.meter.createGauge('solarify_database_connections', {
      description: 'Active database connections',
    });
    
    this.metrics.firestoreReadCount = this.meter.createCounter('solarify_firestore_reads_total', {
      description: 'Total Firestore read operations',
    });
    
    this.metrics.firestoreWriteCount = this.meter.createCounter('solarify_firestore_writes_total', {
      description: 'Total Firestore write operations',
    });

    // API metrics
    this.metrics.externalApiDuration = this.meter.createHistogram('solarify_external_api_duration', {
      description: 'External API call duration',
      unit: 'ms',
    });
    
    this.metrics.externalApiFailureCount = this.meter.createCounter('solarify_external_api_failures_total', {
      description: 'External API call failures',
    });

    // Financial metrics
    this.metrics.transactionAmount = this.meter.createHistogram('solarify_transaction_amount', {
      description: 'Transaction amounts',
      unit: 'USD',
    });
    
    this.metrics.paymentFailureCount = this.meter.createCounter('solarify_payment_failures_total', {
      description: 'Payment processing failures',
    });
    
    this.metrics.paymentSuccessCount = this.meter.createCounter('solarify_payment_success_total', {
      description: 'Successful payments',
    });
  }

  private setupCustomTracer() {
    this.tracer = trace.getTracer(this.config.serviceName, this.config.serviceVersion);
  }

  private httpRequestHook(span: any, request: any) {
    if (this.config.enableDetailedInstrumentation) {
      span.setAttributes({
        'solarify.request.user_agent': request.headers['user-agent'] || 'unknown',
        'solarify.request.client_ip': request.headers['x-forwarded-for'] || request.connection?.remoteAddress || 'unknown',
        'solarify.request.content_length': request.headers['content-length'] || 0,
      });
    }
  }

  private httpResponseHook(span: any, response: any) {
    if (this.config.enableDetailedInstrumentation) {
      span.setAttributes({
        'solarify.response.content_length': response.headers['content-length'] || 0,
        'solarify.response.content_type': response.headers['content-type'] || 'unknown',
      });
    }
  }

  // Public methods for custom metric recording

  recordRFQCreation(duration: number, attributes: Record<string, string> = {}) {
    this.metrics.rfqCreationDuration?.record(duration, attributes);
    this.metrics.rfqCreationCount?.add(1, attributes);
  }

  updateActiveRFQs(count: number) {
    this.metrics.activeRFQsGauge?.record(count);
  }

  recordQuoteResponse(duration: number, accepted: boolean, attributes: Record<string, string> = {}) {
    this.metrics.quoteResponseDuration?.record(duration, attributes);
    this.metrics.quoteResponseCount?.add(1, { ...attributes, accepted: accepted.toString() });
  }

  updateQuoteAcceptanceRate(rate: number) {
    this.metrics.quoteAcceptanceRate?.record(rate);
  }

  recordUserSession(duration: number, userId?: string) {
    this.metrics.userSessionDuration?.record(duration, userId ? { user_id: userId } : {});
  }

  updateActiveUsers(count: number) {
    this.metrics.userActiveCount?.record(count);
  }

  recordUserRegistration(attributes: Record<string, string> = {}) {
    this.metrics.userRegistrationCount?.add(1, attributes);
  }

  updateSystemPerformance(efficiency: number, productionRate: number, healthScore: number, systemId?: string) {
    const attrs = systemId ? { system_id: systemId } : {};
    this.metrics.systemPerformanceEfficiency?.record(efficiency, attrs);
    this.metrics.energyProductionRate?.record(productionRate, attrs);
    this.metrics.systemHealthScore?.record(healthScore, attrs);
  }

  recordDatabaseQuery(duration: number, operation: string, collection?: string) {
    const attributes: Record<string, string> = { operation };
    if (collection) attributes.collection = collection;
    
    this.metrics.databaseQueryDuration?.record(duration, attributes);
    
    if (operation === 'read') {
      this.metrics.firestoreReadCount?.add(1, attributes);
    } else if (operation === 'write') {
      this.metrics.firestoreWriteCount?.add(1, attributes);
    }
  }

  updateDatabaseConnections(count: number) {
    this.metrics.databaseConnectionCount?.record(count);
  }

  recordExternalApiCall(duration: number, service: string, success: boolean) {
    const attributes = { service, success: success.toString() };
    this.metrics.externalApiDuration?.record(duration, attributes);
    
    if (!success) {
      this.metrics.externalApiFailureCount?.add(1, attributes);
    }
  }

  recordTransaction(amount: number, success: boolean, paymentMethod?: string) {
    const attributes: Record<string, string> = { success: success.toString() };
    if (paymentMethod) attributes.payment_method = paymentMethod;
    
    this.metrics.transactionAmount?.record(amount, attributes);
    
    if (success) {
      this.metrics.paymentSuccessCount?.add(1, attributes);
    } else {
      this.metrics.paymentFailureCount?.add(1, attributes);
    }
  }

  // Create custom spans for business logic tracing
  createCustomSpan(name: string, attributes: Record<string, string> = {}) {
    const span = this.tracer.startSpan(name, {
      attributes: {
        'solarify.component': 'business_logic',
        ...attributes,
      },
    });
    
    return {
      span,
      end: () => span.end(),
      setAttributes: (attrs: Record<string, string>) => span.setAttributes(attrs),
      setStatus: (status: any) => span.setStatus(status),
      recordException: (exception: Error) => span.recordException(exception),
    };
  }

  // Health check method
  isHealthy(): boolean {
    return this.sdk !== null && this.meter !== null && this.tracer !== null;
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      await this.sdk.shutdown();
      console.log('APM monitoring shutdown successfully');
    } catch (error) {
      console.error('Error during APM shutdown:', error);
    }
  }
}

// Export singleton instance
export const createAPMInstance = (config: APMConfig): SolarifyAPM => {
  return new SolarifyAPM(config);
};

// Default configuration factory
export const createDefaultAPMConfig = (overrides: Partial<APMConfig> = {}): APMConfig => {
  return {
    serviceName: 'solarify-app',
    serviceVersion: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID || 'solarify-staging',
    enableConsoleExport: process.env.NODE_ENV === 'development',
    enableDetailedInstrumentation: process.env.NODE_ENV !== 'production',
    customAttributes: {
      'solarify.application': 'solar-marketplace',
      'solarify.component': 'web-app',
      'solarify.region': process.env.GOOGLE_CLOUD_REGION || 'us-central1',
    },
    ...overrides,
  };
};

export { SolarifyAPM, APMConfig };