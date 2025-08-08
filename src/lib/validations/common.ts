import { z } from 'zod';

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        return allowedTypes.includes(file.type);
      },
      'File type not supported. Please upload JPEG, PNG, WebP, PDF, or Word documents.'
    ),
  category: z.enum(['profile', 'document', 'portfolio', 'system_photo', 'permit']),
});

// Image upload specific validation
export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Image size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
  alt: z
    .string()
    .min(1, 'Alt text is required for accessibility')
    .max(200, 'Alt text must not exceed 200 characters'),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z
    .number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page cannot exceed 1000'),
  limit: z
    .number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  sortBy: z
    .string()
    .max(50, 'Sort field name too long')
    .optional(),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

// Search validation
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must not exceed 100 characters')
    .refine(
      (query) => {
        // Prevent SQL injection patterns
        const dangerousPatterns = [
          /['"`;\\]/,
          /\b(union|select|insert|update|delete|drop|create|alter)\b/i,
          /<script/i,
          /javascript:/i,
        ];
        return !dangerousPatterns.some(pattern => pattern.test(query));
      },
      'Search query contains invalid characters'
    ),
  filters: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
    .optional(),
  category: z
    .string()
    .max(50, 'Category name too long')
    .optional(),
});

// Contact form validation
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long'),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional(),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must not exceed 200 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must not exceed 2000 characters'),
  preferredContact: z
    .enum(['email', 'phone'])
    .default('email'),
  urgency: z
    .enum(['low', 'medium', 'high'])
    .default('medium'),
});

// URL validation
export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        // Only allow http and https protocols
        return ['http:', 'https:'].includes(parsedUrl.protocol);
      } catch {
        return false;
      }
    },
    'URL must use HTTP or HTTPS protocol'
  );

// Currency validation
export const currencySchema = z.object({
  amount: z
    .number()
    .min(0, 'Amount cannot be negative')
    .max(999999999.99, 'Amount is too large')
    .multipleOf(0.01, 'Amount must be rounded to 2 decimal places'),
  currency: z
    .enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .default('USD'),
});

// Date range validation
export const dateRangeSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })
  .refine((data) => {
    const daysDiff = (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 365; // Maximum 1 year range
  }, {
    message: 'Date range cannot exceed 1 year',
    path: ['endDate'],
  });

// Coordinates validation
export const coordinatesSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

// Rate limiting validation
export const rateLimitSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  identifier: z.string().min(1, 'Identifier is required'),
  limit: z.number().int().min(1, 'Limit must be at least 1'),
  window: z.number().int().min(1, 'Window must be at least 1 second'),
});

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
  meta: z
    .object({
      timestamp: z.string(),
      requestId: z.string().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

// Environment validation
export const environmentSchema = z.enum(['development', 'test', 'staging', 'production']);

// User preferences validation
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['en', 'es', 'fr', 'de']).default('en'),
  timezone: z.string().max(50, 'Timezone string too long'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
    marketing: z.boolean().default(false),
  }),
  units: z.object({
    temperature: z.enum(['celsius', 'fahrenheit']).default('fahrenheit'),
    energy: z.enum(['kwh', 'mwh']).default('kwh'),
    power: z.enum(['kw', 'mw']).default('kw'),
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
  }),
});

// Generic ID validation
export const idSchema = z
  .string()
  .min(1, 'ID is required')
  .max(128, 'ID is too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'ID contains invalid characters');

// Type exports
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type ImageUploadData = z.infer<typeof imageUploadSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;
export type SearchData = z.infer<typeof searchSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type CurrencyData = z.infer<typeof currencySchema>;
export type DateRangeData = z.infer<typeof dateRangeSchema>;
export type CoordinatesData = z.infer<typeof coordinatesSchema>;
export type RateLimitData = z.infer<typeof rateLimitSchema>;
export type ApiResponseData = z.infer<typeof apiResponseSchema>;
export type UserPreferencesData = z.infer<typeof userPreferencesSchema>;

// Validation helper functions
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function validateAndSanitizeEmail(email: string): string {
  const sanitized = email.toLowerCase().trim();
  const result = z.string().email().safeParse(sanitized);
  if (!result.success) {
    throw new Error('Invalid email format');
  }
  return result.data;
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}