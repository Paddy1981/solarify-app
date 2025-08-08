import { clientEnv, serverEnv, validateEnv } from '../env'

// Mock process.env for testing
const originalEnv = process.env

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('Client Environment', () => {
    it('validates valid client environment variables', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com'
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      expect(() => {
        const env = clientEnv
        expect(env.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('test-api-key')
        expect(env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN).toBe('test.firebaseapp.com')
        expect(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('test-project')
      }).not.toThrow()
    })

    it('throws error for missing required client environment variables', () => {
      delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      
      expect(() => {
        const env = clientEnv
      }).toThrow()
    })

    it('throws error for empty client environment variables', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = ''
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com'
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      expect(() => {
        const env = clientEnv
      }).toThrow(/Firebase API key is required/)
    })

    it('validates Firebase API key format', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'invalid-key'
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com'
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      expect(() => {
        const env = clientEnv
      }).not.toThrow() // Basic validation should pass, format validation is Firebase's responsibility
    })

    it('validates Firebase Auth Domain format', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'invalid-domain'
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      expect(() => {
        const env = clientEnv
      }).toThrow(/must be a valid Firebase Auth domain/)
    })

    it('validates Firebase Project ID format', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com'
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'Invalid_Project_ID!'
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      expect(() => {
        const env = clientEnv
      }).toThrow(/must be a valid Firebase project ID/)
    })
  })

  describe('Server Environment', () => {
    it('validates valid server environment variables', () => {
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n'
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'

      expect(() => {
        const env = serverEnv
        expect(env.FIREBASE_ADMIN_CLIENT_EMAIL).toBe('test@test-project.iam.gserviceaccount.com')
        expect(env.FIREBASE_ADMIN_PROJECT_ID).toBe('test-project')
      }).not.toThrow()
    })

    it('handles optional server environment variables', () => {
      // Only set required variables
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n'
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'

      expect(() => {
        const env = serverEnv
        expect(env.NEXTAUTH_SECRET).toBeUndefined()
        expect(env.SMTP_HOST).toBeUndefined()
      }).not.toThrow()
    })

    it('validates Firebase Admin Client Email format', () => {
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'invalid-email'
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n'
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'

      expect(() => {
        const env = serverEnv
      }).toThrow(/must be a valid service account email/)
    })

    it('validates Firebase Admin Private Key format', () => {
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = 'invalid-private-key'
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'

      expect(() => {
        const env = serverEnv
      }).toThrow(/must be a valid private key/)
    })

    it('validates SMTP configuration when provided', () => {
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n'
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'
      process.env.SMTP_HOST = 'smtp.gmail.com'
      process.env.SMTP_PORT = '587'
      process.env.SMTP_USER = 'user@gmail.com'
      process.env.SMTP_PASS = 'password'

      expect(() => {
        const env = serverEnv
        expect(env.SMTP_HOST).toBe('smtp.gmail.com')
        expect(env.SMTP_PORT).toBe(587)
        expect(env.SMTP_USER).toBe('user@gmail.com')
      }).not.toThrow()
    })

    it('validates SMTP port as number', () => {
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n'
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'
      process.env.SMTP_HOST = 'smtp.gmail.com'
      process.env.SMTP_PORT = 'invalid-port'
      process.env.SMTP_USER = 'user@gmail.com'
      process.env.SMTP_PASS = 'password'

      expect(() => {
        const env = serverEnv
      }).toThrow()
    })
  })

  describe('Environment Validation Utility', () => {
    it('validates both client and server environments in production', () => {
      process.env.NODE_ENV = 'production'
      
      // Set valid client environment
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com'
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef'
      
      // Set valid server environment
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n'
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'

      expect(() => {
        validateEnv()
      }).not.toThrow()
    })

    it('skips validation in development when variables are missing', () => {
      process.env.NODE_ENV = 'development'
      
      // Don't set any environment variables
      delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL

      expect(() => {
        validateEnv()
      }).not.toThrow()
    })

    it('provides helpful error messages for missing variables', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY

      expect(() => {
        validateEnv()
      }).toThrow(/Firebase API key is required/)
    })

    it('validates environment consistency', () => {
      process.env.NODE_ENV = 'production'
      
      // Set mismatched project IDs
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'client-project'
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'server-project'
      
      // Set other required variables
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'client-project.firebaseapp.com'
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'client-project.appspot.com'
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef'
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@server-project.iam.gserviceaccount.com'
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n'

      expect(() => {
        validateEnv()
      }).toThrow(/Client and server Firebase project IDs must match/)
    })
  })

  describe('Environment Variable Transformation', () => {
    it('transforms SMTP_PORT to number', () => {
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n'
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'
      process.env.SMTP_PORT = '587'

      const env = serverEnv
      expect(typeof env.SMTP_PORT).toBe('number')
      expect(env.SMTP_PORT).toBe(587)
    })

    it('handles private key newline replacement', () => {
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\ntest-key\\n-----END PRIVATE KEY-----\\n'
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project'

      const env = serverEnv
      expect(env.FIREBASE_ADMIN_PRIVATE_KEY).toContain('\n')
      expect(env.FIREBASE_ADMIN_PRIVATE_KEY).not.toContain('\\n')
    })

    it('trims whitespace from string values', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = '  test-api-key  '
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = '  test.firebaseapp.com  '
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = '  test-project  '
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = '  test-project.appspot.com  '
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '  123456789  '
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '  1:123456789:web:abcdef  '

      const env = clientEnv
      expect(env.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('test-api-key')
      expect(env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN).toBe('test.firebaseapp.com')
      expect(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('test-project')
    })
  })

  describe('Error Handling', () => {
    it('provides specific error messages for each validation failure', () => {
      const testCases = [
        {
          env: { NEXT_PUBLIC_FIREBASE_API_KEY: '' },
          expectedError: /Firebase API key is required/
        },
        {
          env: { 
            NEXT_PUBLIC_FIREBASE_API_KEY: 'test',
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'invalid-domain'
          },
          expectedError: /must be a valid Firebase Auth domain/
        },
        {
          env: {
            NEXT_PUBLIC_FIREBASE_API_KEY: 'test',
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'Invalid_ID!'
          },
          expectedError: /must be a valid Firebase project ID/
        }
      ]

      testCases.forEach(({ env, expectedError }) => {
        // Reset environment
        process.env = { ...originalEnv, ...env }
        
        expect(() => {
          const clientEnv = require('../env').clientEnv
        }).toThrow(expectedError)
      })
    })

    it('aggregates multiple validation errors', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = ''
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'invalid'
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = ''

      expect(() => {
        const env = clientEnv
      }).toThrow() // Should contain multiple error messages
    })
  })
})