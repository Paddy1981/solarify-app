// Custom error classes for better error handling
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    requestId?: string
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    // Capture stack trace (excluding constructor call from stack trace)
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication specific errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', requestId?: string) {
    super(message, 'AUTH_FAILED', 401, true, requestId);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', requestId?: string) {
    super(message, 'ACCESS_DENIED', 403, true, requestId);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired', requestId?: string) {
    super(message, 'TOKEN_EXPIRED', 401, true, requestId);
  }
}

// Validation errors
export class ValidationError extends AppError {
  public readonly validationErrors: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    validationErrors: Record<string, string[]> = {},
    requestId?: string
  ) {
    super(message, 'VALIDATION_ERROR', 400, true, requestId);
    this.validationErrors = validationErrors;
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string = 'Invalid input provided', requestId?: string) {
    super(message, 'INVALID_INPUT', 400, true, requestId);
  }
}

// Resource errors
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', requestId?: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, true, requestId);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', requestId?: string) {
    super(message, 'CONFLICT', 409, true, requestId);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60, requestId?: string) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, requestId);
    this.retryAfter = retryAfter;
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string = 'External service error', requestId?: string) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, true, requestId);
    this.service = service;
  }
}

export class FirebaseError extends AppError {
  public readonly firebaseCode: string;

  constructor(firebaseCode: string, message: string, requestId?: string) {
    super(message, 'FIREBASE_ERROR', 500, true, requestId);
    this.firebaseCode = firebaseCode;
  }
}

// Solar-specific errors
export class SolarCalculationError extends AppError {
  constructor(message: string = 'Solar calculation failed', requestId?: string) {
    super(message, 'SOLAR_CALCULATION_ERROR', 400, true, requestId);
  }
}

export class WeatherDataError extends AppError {
  constructor(message: string = 'Weather data unavailable', requestId?: string) {
    super(message, 'WEATHER_DATA_ERROR', 503, true, requestId);
  }
}

export class EquipmentSpecError extends AppError {
  constructor(message: string = 'Equipment specification error', requestId?: string) {
    super(message, 'EQUIPMENT_SPEC_ERROR', 400, true, requestId);
  }
}

// File upload errors
export class FileUploadError extends AppError {
  public readonly fileName: string;

  constructor(fileName: string, message: string = 'File upload failed', requestId?: string) {
    super(`File upload failed for ${fileName}: ${message}`, 'FILE_UPLOAD_ERROR', 400, true, requestId);
    this.fileName = fileName;
  }
}

export class FileSizeError extends AppError {
  constructor(maxSize: string, requestId?: string) {
    super(`File size exceeds limit of ${maxSize}`, 'FILE_SIZE_ERROR', 400, true, requestId);
  }
}

export class FileTypeError extends AppError {
  constructor(allowedTypes: string[], requestId?: string) {
    super(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`, 'FILE_TYPE_ERROR', 400, true, requestId);
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', requestId?: string) {
    super(message, 'DATABASE_ERROR', 500, true, requestId);
  }
}

export class ConnectionError extends AppError {
  constructor(message: string = 'Connection failed', requestId?: string) {
    super(message, 'CONNECTION_ERROR', 503, true, requestId);
  }
}

// Configuration errors
export class ConfigurationError extends AppError {
  constructor(message: string = 'Configuration error', requestId?: string) {
    super(message, 'CONFIG_ERROR', 500, false, requestId);
  }
}

// Helper function to create errors from Firebase Auth errors
export function createAuthError(firebaseError: any, requestId?: string): AppError {
  const code = firebaseError.code || 'unknown';
  const message = firebaseError.message || 'Authentication error occurred';

  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return new AuthenticationError('Invalid email or password', requestId);
    
    case 'auth/too-many-requests':
      return new RateLimitError('Too many failed login attempts. Please try again later.', 900, requestId);
    
    case 'auth/user-disabled':
      return new AuthorizationError('Account has been disabled', requestId);
    
    case 'auth/email-already-in-use':
      return new ConflictError('Email address is already registered', requestId);
    
    case 'auth/weak-password':
      return new ValidationError('Password is too weak', { password: ['Password must be stronger'] }, requestId);
    
    case 'auth/invalid-email':
      return new ValidationError('Invalid email address', { email: ['Email format is invalid'] }, requestId);
    
    case 'auth/network-request-failed':
      return new ConnectionError('Network error. Please check your connection.', requestId);
    
    case 'auth/id-token-expired':
    case 'auth/id-token-revoked':
      return new TokenExpiredError('Session has expired. Please sign in again.', requestId);
    
    default:
      return new FirebaseError(code, message, requestId);
  }
}

// Helper function to create errors from Firestore errors
export function createFirestoreError(firestoreError: any, requestId?: string): AppError {
  const code = firestoreError.code || 'unknown';
  const message = firestoreError.message || 'Database error occurred';

  switch (code) {
    case 'permission-denied':
      return new AuthorizationError('Access denied to this resource', requestId);
    
    case 'not-found':
      return new NotFoundError('Document', requestId);
    
    case 'already-exists':
      return new ConflictError('Document already exists', requestId);
    
    case 'resource-exhausted':
      return new RateLimitError('Database quota exceeded', 300, requestId);
    
    case 'unavailable':
    case 'deadline-exceeded':
      return new ConnectionError('Database temporarily unavailable', requestId);
    
    case 'invalid-argument':
      return new InvalidInputError('Invalid data provided', requestId);
    
    default:
      return new DatabaseError(message, requestId);
  }
}

// Helper function to create user-friendly error messages
export function getUserFriendlyMessage(error: AppError): string {
  // Don't expose internal error details to users
  const userFriendlyMessages: Record<string, string> = {
    'AUTH_FAILED': 'Please check your email and password and try again.',
    'ACCESS_DENIED': 'You do not have permission to perform this action.',
    'TOKEN_EXPIRED': 'Your session has expired. Please sign in again.',
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'NOT_FOUND': 'The requested item was not found.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
    'EXTERNAL_SERVICE_ERROR': 'A temporary service issue occurred. Please try again later.',
    'FIREBASE_ERROR': 'A temporary issue occurred. Please try again.',
    'DATABASE_ERROR': 'A temporary database issue occurred. Please try again later.',
    'CONNECTION_ERROR': 'Connection failed. Please check your internet connection.',
    'CONFIG_ERROR': 'A system configuration error occurred. Please contact support.',
    'SOLAR_CALCULATION_ERROR': 'Unable to calculate solar estimates. Please check your input.',
    'WEATHER_DATA_ERROR': 'Weather data is temporarily unavailable. Please try again later.',
    'FILE_UPLOAD_ERROR': 'File upload failed. Please try again.',
    'FILE_SIZE_ERROR': 'File is too large. Please choose a smaller file.',
    'FILE_TYPE_ERROR': 'File type is not supported. Please choose a different file.',
  };

  return userFriendlyMessages[error.code] || 'An unexpected error occurred. Please try again.';
}

// Helper function to check if error should be reported to monitoring
export function shouldReportError(error: AppError): boolean {
  // Don't report operational errors that are expected (like validation errors)
  if (!error.isOperational) return true;
  
  // Don't report client errors (4xx) except for authentication issues
  if (error.statusCode >= 400 && error.statusCode < 500) {
    return ['AUTH_FAILED', 'ACCESS_DENIED'].includes(error.code);
  }
  
  // Report all server errors (5xx)
  return error.statusCode >= 500;
}

// Helper function to sanitize error for logging
export function sanitizeErrorForLogging(error: AppError): object {
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: error.timestamp,
    requestId: error.requestId,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    // Add any additional fields specific to error types
    ...(error instanceof ValidationError && { validationErrors: error.validationErrors }),
    ...(error instanceof RateLimitError && { retryAfter: error.retryAfter }),
    ...(error instanceof ExternalServiceError && { service: error.service }),
    ...(error instanceof FirebaseError && { firebaseCode: error.firebaseCode }),
  };
}