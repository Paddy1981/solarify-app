import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, z } from 'zod';

// Validation middleware for API routes
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      let data: any;

      // Parse request data based on method
      if (req.method === 'GET') {
        // For GET requests, validate query parameters
        const url = new URL(req.url);
        data = Object.fromEntries(url.searchParams.entries());
        
        // Convert numeric strings to numbers where appropriate
        Object.keys(data).forEach(key => {
          if (!isNaN(Number(data[key])) && data[key] !== '') {
            data[key] = Number(data[key]);
          }
          if (data[key] === 'true') data[key] = true;
          if (data[key] === 'false') data[key] = false;
        });
      } else {
        // For POST/PUT/PATCH requests, validate request body
        const contentType = req.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await req.json();
        } else if (contentType?.includes('multipart/form-data')) {
          const formData = await req.formData();
          data = Object.fromEntries(formData.entries());
        } else {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_CONTENT_TYPE',
                message: 'Content-Type must be application/json or multipart/form-data',
              },
            },
            { status: 400 }
          );
        }
      }

      // Validate data against schema
      const validationResult = schema.safeParse(data);

      if (!validationResult.success) {
        const errors = validationResult.error.flatten();
        
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: {
                fieldErrors: errors.fieldErrors,
                formErrors: errors.formErrors,
              },
            },
          },
          { status: 400 }
        );
      }

      // Call the handler with validated data
      return await handler(req, validationResult.data);
    } catch (error) {
      console.error('Validation middleware error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
        },
        { status: 500 }
      );
    }
  };
}

// Body validation middleware (for POST/PUT/PATCH)
export function withBodyValidation<T>(schema: ZodSchema<T>) {
  return (handler: (req: NextRequest, body: T) => Promise<NextResponse>) => {
    return withValidation(schema, handler);
  };
}

// Query validation middleware (for GET)
export function withQueryValidation<T>(schema: ZodSchema<T>) {
  return (handler: (req: NextRequest, query: T) => Promise<NextResponse>) => {
    return withValidation(schema, handler);
  };
}

// File upload validation middleware
export function withFileValidation(
  allowedTypes: string[],
  maxSize: number = 10 * 1024 * 1024 // 10MB default
) {
  return (handler: (req: NextRequest, files: File[]) => Promise<NextResponse>) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        const contentType = req.headers.get('content-type');
        
        if (!contentType?.includes('multipart/form-data')) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_CONTENT_TYPE',
                message: 'Content-Type must be multipart/form-data for file uploads',
              },
            },
            { status: 400 }
          );
        }

        const formData = await req.formData();
        const files: File[] = [];

        for (const [, value] of formData.entries()) {
          if (value instanceof File) {
            // Validate file type
            if (!allowedTypes.includes(value.type)) {
              return NextResponse.json(
                {
                  success: false,
                  error: {
                    code: 'INVALID_FILE_TYPE',
                    message: `File type ${value.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
                  },
                },
                { status: 400 }
              );
            }

            // Validate file size
            if (value.size > maxSize) {
              return NextResponse.json(
                {
                  success: false,
                  error: {
                    code: 'FILE_TOO_LARGE',
                    message: `File size ${value.size} exceeds maximum allowed size of ${maxSize} bytes`,
                  },
                },
                { status: 400 }
              );
            }

            files.push(value);
          }
        }

        if (files.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NO_FILES',
                message: 'No files found in request',
              },
            },
            { status: 400 }
          );
        }

        return await handler(req, files);
      } catch (error) {
        console.error('File validation middleware error:', error);
        
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'An unexpected error occurred during file processing',
            },
          },
          { status: 500 }
        );
      }
    };
  };
}

// Rate limiting validation
export async function validateRateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // This would integrate with Redis or another rate limiting service
  // For now, we'll return a mock implementation
  
  // In production, you would:
  // 1. Get current count from Redis with key `rate_limit:${action}:${identifier}`
  // 2. Check if count exceeds limit
  // 3. Update count and set expiry if needed
  // 4. Return rate limit info
  
  return {
    allowed: true,
    remaining: limit - 1,
    resetTime: Date.now() + windowMs,
  };
}

// Authentication validation middleware
export function withAuth(requiredRole?: string) {
  return (handler: (req: NextRequest, userId: string, userRole: string) => Promise<NextResponse>) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        const authHeader = req.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authorization header is required',
              },
            },
            { status: 401 }
          );
        }

        const token = authHeader.substring(7);
        
        // Verify token using Firebase Admin SDK
        // This would be implemented with firebase-admin
        // For now, we'll simulate token verification
        
        const userId = 'mock-user-id';
        const userRole = 'homeowner';

        if (requiredRole && userRole !== requiredRole) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: `Required role: ${requiredRole}`,
              },
            },
            { status: 403 }
          );
        }

        return await handler(req, userId, userRole);
      } catch (error) {
        console.error('Auth middleware error:', error);
        
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired token',
            },
          },
          { status: 401 }
        );
      }
    };
  };
}

// Input sanitization helper
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// CORS helper
export function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Standard API response helper
export function createApiResponse(
  success: boolean,
  data?: any,
  error?: { code: string; message: string; details?: any },
  status: number = 200
) {
  return NextResponse.json(
    {
      success,
      data,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    },
    { status }
  );
}