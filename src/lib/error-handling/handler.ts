import { NextRequest, NextResponse } from 'next/server';
import { 
  AppError, 
  getUserFriendlyMessage, 
  shouldReportError, 
  sanitizeErrorForLogging 
} from './errors';
import { logger } from './logger';

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    requestId?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

// Global error handler for API routes
export function handleApiError(error: unknown, requestId?: string): NextResponse<ErrorResponse> {
  let appError: AppError;

  // Convert unknown errors to AppError instances
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    // Handle known error types
    if (error.name === 'ValidationError') {
      appError = new AppError(
        error.message,
        'VALIDATION_ERROR',
        400,
        true,
        requestId
      );
    } else if (error.name === 'CastError') {
      appError = new AppError(
        'Invalid ID format',
        'INVALID_ID',
        400,
        true,
        requestId
      );
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      appError = new AppError(
        'Database error occurred',
        'DATABASE_ERROR',
        500,
        true,
        requestId
      );
    } else if (error.message.includes('Firebase')) {
      appError = new AppError(
        'Firebase service error',
        'FIREBASE_ERROR',
        500,
        true,
        requestId
      );
    } else {
      appError = new AppError(
        error.message || 'An unexpected error occurred',
        'INTERNAL_ERROR',
        500,
        false,
        requestId
      );
    }
  } else {
    // Handle non-Error objects
    appError = new AppError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      false,
      requestId
    );
  }

  // Log error if it should be reported
  if (shouldReportError(appError)) {
    logger.error('API Error', {
      error: sanitizeErrorForLogging(appError),
      requestId,
      stack: appError.stack,
    });
  } else {
    logger.warn('API Warning', {
      error: sanitizeErrorForLogging(appError),
      requestId,
    });
  }

  // Create user-friendly response
  const userMessage = getUserFriendlyMessage(appError);
  
  const response: ErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: process.env.NODE_ENV === 'development' ? appError.message : userMessage,
      timestamp: appError.timestamp,
      requestId: appError.requestId,
      // Include validation details only for validation errors
      ...(appError instanceof AppError && 
          appError.code === 'VALIDATION_ERROR' && 
          'validationErrors' in appError && 
          { details: (appError as any).validationErrors }
      ),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      requestId,
    },
  };

  // Add rate limit headers for rate limit errors
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (appError.code === 'RATE_LIMIT_EXCEEDED' && 'retryAfter' in appError) {
    headers['Retry-After'] = String((appError as any).retryAfter);
    headers['X-RateLimit-Limit'] = '100'; // Example limit
    headers['X-RateLimit-Remaining'] = '0';
    headers['X-RateLimit-Reset'] = String(Math.floor(Date.now() / 1000) + (appError as any).retryAfter);
  }

  return NextResponse.json(response, {
    status: appError.statusCode,
    headers,
  });
}

// Error handler wrapper for API route handlers
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request ID from the request if available
      let requestId: string | undefined;
      
      // Assume first argument is NextRequest for API routes
      if (args.length > 0 && args[0] && typeof args[0] === 'object' && 'headers' in args[0]) {
        const req = args[0] as NextRequest;
        requestId = req.headers.get('x-request-id') || undefined;
      }

      return handleApiError(error, requestId);
    }
  };
}

// Client-side error handler
export function handleClientError(error: unknown, context?: string): void {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(
      error.message,
      'CLIENT_ERROR',
      400,
      true
    );
  } else {
    appError = new AppError(
      'An unexpected error occurred',
      'UNKNOWN_CLIENT_ERROR',
      500,
      false
    );
  }

  // Log client-side errors
  logger.error('Client Error', {
    error: sanitizeErrorForLogging(appError),
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  // Report to external error tracking service (e.g., Sentry)
  if (typeof window !== 'undefined' && shouldReportError(appError)) {
    // This would integrate with Sentry or another error tracking service
    console.error('Reported to error tracking:', appError);
  }
}

// React Error Boundary error handler
export function handleErrorBoundary(error: Error, errorInfo: React.ErrorInfo): void {
  const appError = new AppError(
    error.message,
    'REACT_ERROR_BOUNDARY',
    500,
    false
  );

  logger.error('React Error Boundary', {
    error: sanitizeErrorForLogging(appError),
    componentStack: errorInfo.componentStack,
    errorBoundary: true,
  });

  // Report to error tracking service
  if (typeof window !== 'undefined') {
    console.error('React Error Boundary:', error, errorInfo);
  }
}

// Async operation error handler
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed',
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(errorMessage, 'ASYNC_OPERATION_ERROR', 500, true);

    logger.error('Async Operation Error', {
      error: sanitizeErrorForLogging(appError),
      context,
    });

    throw appError;
  }
}

// Utility function to create standardized API responses
export function createApiResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200,
  requestId?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        requestId,
      },
    },
    { status: statusCode }
  );
}

// Utility function to create error responses
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any,
  requestId?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        requestId,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        requestId,
      },
    },
    { status: statusCode }
  );
}

// Request timeout handler
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AppError(errorMessage, 'TIMEOUT_ERROR', 408, true));
      }, timeoutMs);
    }),
  ]);
}

// Retry mechanism with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 10000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry for certain error types
      if (error instanceof AppError) {
        if ([400, 401, 403, 404, 422].includes(error.statusCode)) {
          throw error;
        }
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelayMs
      );

      logger.warn(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`, {
        error: lastError.message,
        attempt: attempt + 1,
        delay,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}