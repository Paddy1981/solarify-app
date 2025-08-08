/**
 * Solar Validation Middleware Layer
 * 
 * Middleware components that integrate with Next.js API routes to provide
 * consistent validation patterns, error handling, and request/response processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  solarValidationOrchestrator, 
  VALIDATION_CONTEXTS, 
  VALIDATION_CATEGORIES,
  type ValidationRequest,
  type ValidationResult 
} from './solar-validation-orchestrator';

// =====================================================
// MIDDLEWARE CONFIGURATION TYPES
// =====================================================

export interface ValidationMiddlewareConfig {
  schemas: string[];
  context?: string;
  category?: string;
  strictMode?: boolean;
  enableCaching?: boolean;
  enableMetrics?: boolean;
  customRules?: Array<{
    ruleId: string;
    description: string;
    rule: (data: any) => boolean | Promise<boolean>;
  }>;
  crossValidationRules?: string[];
  onError?: (error: ValidationResult, req: NextRequest) => NextResponse | Promise<NextResponse>;
  onSuccess?: (result: ValidationResult, req: NextRequest) => void | Promise<void>;
}

export interface ApiValidationOptions {
  validateRequest?: ValidationMiddlewareConfig;
  validateResponse?: ValidationMiddlewareConfig;
  skipValidation?: boolean;
  rateLimiting?: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

// =====================================================
// CORE MIDDLEWARE FUNCTIONS
// =====================================================

/**
 * Main validation middleware factory
 */
export function createSolarValidationMiddleware(config: ValidationMiddlewareConfig) {
  return async (req: NextRequest): Promise<NextResponse | void> => {
    // Skip validation in test environment if specified
    if (process.env.NODE_ENV === 'test' && process.env.SKIP_VALIDATION === 'true') {
      return;
    }

    try {
      // Parse request body
      let requestData: any;
      try {
        requestData = await req.json();
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
            details: error instanceof Error ? error.message : 'JSON parsing failed'
          }
        }, { status: 400 });
      }

      // Create validation request
      const validationRequest: ValidationRequest = {
        requestId: req.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        context: config.context || VALIDATION_CONTEXTS.API_REQUEST,
        category: config.category || VALIDATION_CATEGORIES.SYSTEM_CONFIG,
        config: {
          strictMode: config.strictMode ?? (process.env.NODE_ENV === 'production'),
          skipWarnings: false,
          maxErrors: 50,
          timeoutMs: 15000,
          enableCaching: config.enableCaching ?? true,
          enableMetrics: config.enableMetrics ?? true
        },
        data: {
          primary: requestData,
          metadata: {
            userAgent: req.headers.get('user-agent'),
            origin: req.headers.get('origin'),
            referer: req.headers.get('referer'),
            contentType: req.headers.get('content-type'),
            timestamp: new Date().toISOString()
          },
          correlationId: req.headers.get('x-correlation-id') || undefined
        },
        validationRules: {
          schemas: config.schemas,
          customRules: config.customRules || [],
          crossValidationRules: config.crossValidationRules || []
        },
        contextOptions: {}
      };

      // Execute validation
      const validationResult = await solarValidationOrchestrator.validate(validationRequest);

      // Handle validation result
      if (!validationResult.overallValid) {
        if (config.onError) {
          return await config.onError(validationResult, req);
        }
        
        return createValidationErrorResponse(validationResult, validationRequest);
      }

      // Success callback
      if (config.onSuccess) {
        await config.onSuccess(validationResult, req);
      }

      // Attach validation result to request headers for downstream handlers
      const response = NextResponse.next();
      response.headers.set('x-validation-result', JSON.stringify({
        requestId: validationResult.requestId,
        valid: validationResult.overallValid,
        duration: validationResult.duration
      }));

      return response;

    } catch (error) {
      console.error('Validation middleware error:', error);
      
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_MIDDLEWARE_ERROR',
          message: 'Validation system encountered an error',
          details: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : 'Unknown error')
            : 'Internal server error'
        }
      }, { status: 500 });
    }
  };
}

/**
 * Response validation middleware
 */
export function createResponseValidationMiddleware(config: ValidationMiddlewareConfig) {
  return async (response: any): Promise<any> => {
    if (!response || typeof response !== 'object') {
      return response;
    }

    try {
      const validationRequest: ValidationRequest = {
        requestId: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        context: VALIDATION_CONTEXTS.API_RESPONSE,
        category: config.category || VALIDATION_CATEGORIES.SYSTEM_CONFIG,
        config: {
          strictMode: false, // Less strict for responses
          skipWarnings: true,
          maxErrors: 10,
          timeoutMs: 5000,
          enableCaching: false, // Don't cache response validations
          enableMetrics: config.enableMetrics ?? true
        },
        data: {
          primary: response,
          metadata: {
            timestamp: new Date().toISOString()
          }
        },
        validationRules: {
          schemas: config.schemas,
          customRules: config.customRules || [],
          crossValidationRules: []
        },
        contextOptions: {}
      };

      const validationResult = await solarValidationOrchestrator.validate(validationRequest);

      if (!validationResult.overallValid && process.env.NODE_ENV === 'development') {
        console.warn('Response validation failed:', validationResult.results);
      }

      // Add validation metadata to response in development
      if (process.env.NODE_ENV === 'development') {
        response._validation = {
          valid: validationResult.overallValid,
          duration: validationResult.duration,
          errors: validationResult.results.schemaResults
            .filter(r => !r.valid)
            .map(r => r.errors)
            .flat()
        };
      }

      return response;

    } catch (error) {
      console.error('Response validation error:', error);
      return response; // Don't break the response on validation error
    }
  };
}

// =====================================================
// SPECIALIZED MIDDLEWARE FUNCTIONS
// =====================================================

/**
 * Equipment validation middleware
 */
export const equipmentValidationMiddleware = createSolarValidationMiddleware({
  schemas: ['solar_panel_spec', 'inverter_spec', 'battery_spec', 'mounting_system'],
  context: VALIDATION_CONTEXTS.API_REQUEST,
  category: VALIDATION_CATEGORIES.EQUIPMENT,
  crossValidationRules: ['panel_inverter_compatibility'],
  customRules: [
    {
      ruleId: 'equipment_certification_check',
      description: 'Verify equipment has required certifications',
      rule: (data: any) => {
        if (data.certifications && Array.isArray(data.certifications.required)) {
          return data.certifications.required.length > 0;
        }
        return true;
      }
    }
  ]
});

/**
 * System configuration validation middleware
 */
export const systemConfigValidationMiddleware = createSolarValidationMiddleware({
  schemas: ['solar_system_configuration', 'solar_array_layout', 'dc_electrical_design', 'ac_electrical_design'],
  context: VALIDATION_CONTEXTS.API_REQUEST,
  category: VALIDATION_CATEGORIES.SYSTEM_CONFIG,
  crossValidationRules: ['system_size_consistency', 'panel_inverter_compatibility'],
  customRules: [
    {
      ruleId: 'nec_compliance_check',
      description: 'Verify system meets NEC requirements',
      rule: (data: any) => {
        return data.compliance?.necCompliant !== false;
      }
    }
  ]
});

/**
 * Financial data validation middleware
 */
export const financialValidationMiddleware = createSolarValidationMiddleware({
  schemas: ['system_cost', 'roi_analysis', 'federal_incentive', 'utility_rate'],
  context: VALIDATION_CONTEXTS.API_REQUEST,
  category: VALIDATION_CATEGORIES.FINANCIAL,
  crossValidationRules: ['financial_calculation_accuracy'],
  customRules: [
    {
      ruleId: 'cost_reasonableness_check',
      description: 'Verify costs are within reasonable market ranges',
      rule: (data: any) => {
        if (data.pricePerWatt) {
          return data.pricePerWatt >= 1.0 && data.pricePerWatt <= 8.0;
        }
        return true;
      }
    }
  ]
});

/**
 * Customer data validation middleware
 */
export const customerDataValidationMiddleware = createSolarValidationMiddleware({
  schemas: ['energy_usage_patterns', 'property_information', 'contact_communication'],
  context: VALIDATION_CONTEXTS.API_REQUEST,
  category: VALIDATION_CATEGORIES.CUSTOMER,
  customRules: [
    {
      ruleId: 'pii_protection_check',
      description: 'Verify PII is properly handled',
      rule: async (data: any) => {
        // Check for potential PII in unexpected places
        const dataString = JSON.stringify(data).toLowerCase();
        const piiPatterns = [
          /\d{3}-\d{2}-\d{4}/, // SSN
          /\d{16}/, // Credit card
          /\d{3}-\d{3}-\d{4}/ // Phone in specific format
        ];
        
        return !piiPatterns.some(pattern => pattern.test(dataString));
      }
    }
  ]
});

/**
 * Real-time data validation middleware
 */
export const realTimeDataValidationMiddleware = createSolarValidationMiddleware({
  schemas: ['sensor_measurement', 'system_health'],
  context: VALIDATION_CONTEXTS.REAL_TIME_MONITORING,
  category: VALIDATION_CATEGORIES.REAL_TIME,
  enableCaching: false, // Real-time data shouldn't be cached
  customRules: [
    {
      ruleId: 'data_freshness_check',
      description: 'Verify data is recent enough for real-time use',
      rule: (data: any) => {
        if (data.timestamp) {
          const dataAge = Date.now() - new Date(data.timestamp).getTime();
          return dataAge <= 300000; // 5 minutes max age
        }
        return true;
      }
    }
  ]
});

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Create standardized validation error response
 */
function createValidationErrorResponse(
  validationResult: ValidationResult, 
  validationRequest: ValidationRequest
): NextResponse {
  const errors = validationResult.results.schemaResults
    .filter(result => !result.valid)
    .map(result => ({
      schema: result.schemaName,
      errors: result.errors.map(error => ({
        path: error.path.join('.'),
        message: error.message,
        code: error.code,
        severity: error.severity
      }))
    }));

  const customErrors = validationResult.results.customRuleResults
    .filter(result => !result.valid)
    .map(result => ({
      rule: result.ruleId,
      message: result.message,
      severity: result.severity
    }));

  return NextResponse.json({
    success: false,
    error: {
      code: 'VALIDATION_FAILED',
      message: 'Request validation failed',
      requestId: validationResult.requestId,
      details: {
        schemaErrors: errors,
        customRuleErrors: customErrors,
        crossValidationErrors: validationResult.results.crossValidationResults
          .filter(result => !result.valid)
      },
      recommendations: validationResult.recommendations
    },
    metadata: {
      validationDuration: validationResult.duration,
      context: validationRequest.context,
      category: validationRequest.category
    }
  }, { status: 400 });
}

/**
 * Validate API route handler wrapper
 */
export function withValidation<T = any>(
  handler: (req: NextRequest, validatedData: T) => Promise<NextResponse> | NextResponse,
  config: ValidationMiddlewareConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Run validation middleware
    const middlewareResult = await createSolarValidationMiddleware(config)(req);
    
    if (middlewareResult instanceof NextResponse) {
      return middlewareResult;
    }

    // Extract validated data
    let validatedData: T;
    try {
      validatedData = await req.json();
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON'
        }
      }, { status: 400 });
    }

    // Call the actual handler with validated data
    return await handler(req, validatedData);
  };
}

/**
 * Rate limiting middleware
 */
export function createRateLimitMiddleware(config: {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: NextRequest): Promise<NextResponse | void> => {
    const key = config.keyGenerator 
      ? config.keyGenerator(req)
      : req.ip || req.headers.get('x-forwarded-for') || 'unknown';

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime <= windowStart) {
        requests.delete(k);
      }
    }

    // Check current request count
    const current = requests.get(key);
    if (current) {
      if (current.count >= config.maxRequests) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            retryAfter: Math.ceil((current.resetTime - now) / 1000)
          }
        }, { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, config.maxRequests - current.count - 1).toString(),
            'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString()
          }
        });
      }
      current.count++;
    } else {
      requests.set(key, { count: 1, resetTime: now + config.windowMs });
    }
  };
}

// =====================================================
// EXPORT MIDDLEWARE COMBINATIONS
// =====================================================

/**
 * Combined middleware for common solar API endpoints
 */
export const solarAPIMiddleware = {
  equipment: equipmentValidationMiddleware,
  systemConfig: systemConfigValidationMiddleware,
  financial: financialValidationMiddleware,
  customer: customerDataValidationMiddleware,
  realTime: realTimeDataValidationMiddleware
};

/**
 * Default rate limiting for solar APIs
 */
export const defaultRateLimitMiddleware = createRateLimitMiddleware({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (req: NextRequest) => {
    // Use API key or IP for rate limiting
    return req.headers.get('x-api-key') || 
           req.headers.get('authorization') || 
           req.ip || 
           'anonymous';
  }
});

export default {
  createSolarValidationMiddleware,
  createResponseValidationMiddleware,
  withValidation,
  solarAPIMiddleware,
  defaultRateLimitMiddleware
};