import { 
  loginSchema, 
  signupSchema, 
  passwordSchema, 
  emailSchema,
  resetPasswordSchema,
  changePasswordSchema,
  phoneNumberSchema
} from '../auth'
import { ZodError } from 'zod'

describe('Auth Validation Schemas', () => {
  describe('emailSchema', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'test123@test-domain.com'
      ]

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow()
      })
    })

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@.com',
        'invalid.@com',
        'invalid..email@example.com',
        ''
      ]

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow(ZodError)
      })
    })

    it('trims whitespace from emails', () => {
      const result = emailSchema.parse('  test@example.com  ')
      expect(result).toBe('test@example.com')
    })

    it('converts email to lowercase', () => {
      const result = emailSchema.parse('TEST@EXAMPLE.COM')
      expect(result).toBe('test@example.com')
    })
  })

  describe('passwordSchema', () => {
    it('validates strong passwords', () => {
      const validPasswords = [
        'MyStrongP@ssw0rd!', // 16 chars, all requirements
        'Abc123!@#def', // 12 chars minimum
        'P@ssw0rd123456', // Long with all requirements
        'MyP@ss1234!' // Exactly 11 chars but meets complexity
      ]

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow()
      })
    })

    it('rejects passwords that are too short', () => {
      const shortPasswords = [
        'Short1!', // 7 chars
        'Pass1!@', // 7 chars
        'Abc123!@#de' // 11 chars but still short for enterprise
      ]

      shortPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow(ZodError)
      })
    })

    it('rejects passwords without uppercase letters', () => {
      const passwords = [
        'mypassword123!@#',
        'lowercase1234!@#'
      ]

      passwords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow(ZodError)
      })
    })

    it('rejects passwords without lowercase letters', () => {
      const passwords = [
        'MYPASSWORD123!@#',
        'UPPERCASE1234!@#'
      ]

      passwords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow(ZodError)
      })
    })

    it('rejects passwords without numbers', () => {
      const passwords = [
        'MyPasswordWithoutNumbers!@#',
        'NoDigitsHere!@#$'
      ]

      passwords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow(ZodError)
      })
    })

    it('rejects passwords without special characters', () => {
      const passwords = [
        'MyPasswordWithoutSpecial123',
        'NoSpecialChars1234'
      ]

      passwords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow(ZodError)
      })
    })

    it('provides detailed error messages', () => {
      try {
        passwordSchema.parse('weak')
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError)
        const zodError = error as ZodError
        expect(zodError.errors[0].message).toContain('Password must be at least 12 characters long')
      }

      try {
        passwordSchema.parse('toolongbutnospecialchars123')
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError)
        const zodError = error as ZodError
        expect(zodError.errors[0].message).toContain('Password must contain at least one uppercase letter')
      }
    })
  })

  describe('phoneNumberSchema', () => {
    it('validates US phone numbers in various formats', () => {
      const validPhones = [
        '+1234567890',
        '+1-234-567-8900',
        '+1 (234) 567-8900',
        '+12345678900'
      ]

      validPhones.forEach(phone => {
        expect(() => phoneNumberSchema.parse(phone)).not.toThrow()
      })
    })

    it('rejects invalid phone numbers', () => {
      const invalidPhones = [
        '1234567890', // Missing +
        '+123456789', // Too short
        '+123456789012345', // Too long
        'abc123456789', // Contains letters
        '+1-abc-def-ghij' // Contains letters
      ]

      invalidPhones.forEach(phone => {
        expect(() => phoneNumberSchema.parse(phone)).toThrow(ZodError)
      })
    })

    it('normalizes phone number format', () => {
      const result = phoneNumberSchema.parse('+1 (234) 567-8900')
      expect(result).toMatch(/^\+\d{10,15}$/)
    })
  })

  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'MyStrongP@ssw0rd!'
      }

      expect(() => loginSchema.parse(validLogin)).not.toThrow()
    })

    it('validates login with remember me option', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'MyStrongP@ssw0rd!',
        rememberMe: true
      }

      expect(() => loginSchema.parse(validLogin)).not.toThrow()
    })

    it('rejects login with invalid email', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'MyStrongP@ssw0rd!'
      }

      expect(() => loginSchema.parse(invalidLogin)).toThrow(ZodError)
    })

    it('rejects login with weak password', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: 'weak'
      }

      expect(() => loginSchema.parse(invalidLogin)).toThrow(ZodError)
    })

    it('sets default value for rememberMe', () => {
      const login = {
        email: 'test@example.com',
        password: 'MyStrongP@ssw0rd!'
      }

      const result = loginSchema.parse(login)
      expect(result.rememberMe).toBe(false)
    })
  })

  describe('signupSchema', () => {
    it('validates correct signup data', () => {
      const validSignup = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'MyStrongP@ssw0rd!',
        confirmPassword: 'MyStrongP@ssw0rd!',
        role: 'homeowner' as const,
        phone: '+1234567890',
        termsAccepted: true
      }

      expect(() => signupSchema.parse(validSignup)).not.toThrow()
    })

    it('rejects signup when passwords do not match', () => {
      const invalidSignup = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'MyStrongP@ssw0rd!',
        confirmPassword: 'DifferentP@ssw0rd!',
        role: 'homeowner' as const,
        phone: '+1234567890',
        termsAccepted: true
      }

      expect(() => signupSchema.parse(invalidSignup)).toThrow(ZodError)
    })

    it('rejects signup with invalid role', () => {
      const invalidSignup = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'MyStrongP@ssw0rd!',
        confirmPassword: 'MyStrongP@ssw0rd!',
        role: 'invalid_role' as any,
        phone: '+1234567890',
        termsAccepted: true
      }

      expect(() => signupSchema.parse(invalidSignup)).toThrow(ZodError)
    })

    it('rejects signup without terms acceptance', () => {
      const invalidSignup = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'MyStrongP@ssw0rd!',
        confirmPassword: 'MyStrongP@ssw0rd!',
        role: 'homeowner' as const,
        phone: '+1234567890',
        termsAccepted: false
      }

      expect(() => signupSchema.parse(invalidSignup)).toThrow(ZodError)
    })

    it('validates all user roles', () => {
      const roles = ['homeowner', 'installer', 'supplier'] as const

      roles.forEach(role => {
        const signup = {
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'MyStrongP@ssw0rd!',
          confirmPassword: 'MyStrongP@ssw0rd!',
          role,
          phone: '+1234567890',
          termsAccepted: true
        }

        expect(() => signupSchema.parse(signup)).not.toThrow()
      })
    })

    it('trims and validates full name', () => {
      const signup = {
        fullName: '  John Doe  ',
        email: 'john@example.com',
        password: 'MyStrongP@ssw0rd!',
        confirmPassword: 'MyStrongP@ssw0rd!',
        role: 'homeowner' as const,
        phone: '+1234567890',
        termsAccepted: true
      }

      const result = signupSchema.parse(signup)
      expect(result.fullName).toBe('John Doe')
    })

    it('rejects empty or very short full names', () => {
      const invalidSignups = [
        { fullName: '' },
        { fullName: 'A' },
        { fullName: '  ' }
      ].map(nameData => ({
        ...nameData,
        email: 'john@example.com',
        password: 'MyStrongP@ssw0rd!',
        confirmPassword: 'MyStrongP@ssw0rd!',
        role: 'homeowner' as const,
        phone: '+1234567890',
        termsAccepted: true
      }))

      invalidSignups.forEach(signup => {
        expect(() => signupSchema.parse(signup)).toThrow(ZodError)
      })
    })
  })

  describe('resetPasswordSchema', () => {
    it('validates correct email for password reset', () => {
      const validReset = { email: 'test@example.com' }
      expect(() => resetPasswordSchema.parse(validReset)).not.toThrow()
    })

    it('rejects invalid email for password reset', () => {
      const invalidReset = { email: 'invalid-email' }
      expect(() => resetPasswordSchema.parse(invalidReset)).toThrow(ZodError)
    })
  })

  describe('changePasswordSchema', () => {
    it('validates correct password change data', () => {
      const validChange = {
        currentPassword: 'OldP@ssw0rd123!',
        newPassword: 'NewP@ssw0rd123!',
        confirmNewPassword: 'NewP@ssw0rd123!'
      }

      expect(() => changePasswordSchema.parse(validChange)).not.toThrow()
    })

    it('rejects when new passwords do not match', () => {
      const invalidChange = {
        currentPassword: 'OldP@ssw0rd123!',
        newPassword: 'NewP@ssw0rd123!',
        confirmNewPassword: 'DifferentP@ssw0rd!'
      }

      expect(() => changePasswordSchema.parse(invalidChange)).toThrow(ZodError)
    })

    it('rejects when current password is same as new password', () => {
      const invalidChange = {
        currentPassword: 'SameP@ssw0rd123!',
        newPassword: 'SameP@ssw0rd123!',
        confirmNewPassword: 'SameP@ssw0rd123!'
      }

      expect(() => changePasswordSchema.parse(invalidChange)).toThrow(ZodError)
    })

    it('validates that new password meets complexity requirements', () => {
      const invalidChange = {
        currentPassword: 'OldP@ssw0rd123!',
        newPassword: 'weak',
        confirmNewPassword: 'weak'
      }

      expect(() => changePasswordSchema.parse(invalidChange)).toThrow(ZodError)
    })
  })

  describe('Schema Integration', () => {
    it('maintains consistent validation rules across schemas', () => {
      const email = 'test@example.com'
      const password = 'MyStrongP@ssw0rd!'

      // Email should be valid in all schemas that use it
      expect(() => emailSchema.parse(email)).not.toThrow()
      expect(() => loginSchema.parse({ email, password })).not.toThrow()
      expect(() => resetPasswordSchema.parse({ email })).not.toThrow()

      // Password should be valid in all schemas that use it
      expect(() => passwordSchema.parse(password)).not.toThrow()
      expect(() => loginSchema.parse({ email, password })).not.toThrow()
    })

    it('provides consistent error messages', () => {
      const weakPassword = 'weak'

      // Test password validation consistency
      const testPasswordInSchema = (schema: any, data: any) => {
        try {
          schema.parse(data)
        } catch (error) {
          return (error as ZodError).errors.some(e => 
            e.message.includes('Password must be at least 12 characters long')
          )
        }
        return false
      }

      expect(testPasswordInSchema(passwordSchema, weakPassword)).toBe(true)
      expect(testPasswordInSchema(loginSchema, { email: 'test@example.com', password: weakPassword })).toBe(true)
    })
  })
})