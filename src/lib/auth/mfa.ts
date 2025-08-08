import { 
  multiFactor, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  ApplicationVerifier,
  MultiFactorError,
  type User,
  type MultiFactorSession,
  type ConfirmationResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// MFA enrollment
export class MfaService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  // Initialize reCAPTCHA verifier
  private async initializeRecaptcha(): Promise<ApplicationVerifier> {
    if (this.recaptchaVerifier) {
      return this.recaptchaVerifier;
    }

    this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired');
      }
    });

    return this.recaptchaVerifier;
  }

  // Enroll user in SMS MFA
  async enrollSms(user: User, phoneNumber: string): Promise<void> {
    try {
      const multiFactorSession = await multiFactor(user).getSession();
      const phoneAuthCredential = PhoneAuthProvider.credential(phoneNumber);
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneNumber,
        await this.initializeRecaptcha()
      );

      // Return verification ID to be used in confirmation step
      return verificationId;
    } catch (error) {
      console.error('SMS MFA enrollment failed:', error);
      throw new Error('Failed to enroll in SMS MFA');
    }
  }

  // Confirm SMS MFA enrollment
  async confirmSmsEnrollment(
    user: User,
    verificationId: string,
    verificationCode: string,
    displayName: string = 'SMS'
  ): Promise<void> {
    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      const multiFactorSession = await multiFactor(user).getSession();

      await multiFactor(user).enroll(multiFactorAssertion, {
        multiFactorSession,
        displayName
      });

      console.log('SMS MFA enrollment successful');
    } catch (error) {
      console.error('SMS MFA confirmation failed:', error);
      throw new Error('Failed to confirm SMS MFA enrollment');
    }
  }

  // Unenroll from MFA
  async unenroll(user: User, factorUid: string): Promise<void> {
    try {
      const enrolledFactors = multiFactor(user).enrolledFactors;
      const factorToUnenroll = enrolledFactors.find(factor => factor.uid === factorUid);
      
      if (!factorToUnenroll) {
        throw new Error('MFA factor not found');
      }

      await multiFactor(user).unenroll(factorToUnenroll);
      console.log('MFA unenrollment successful');
    } catch (error) {
      console.error('MFA unenrollment failed:', error);
      throw new Error('Failed to unenroll from MFA');
    }
  }

  // Handle MFA sign-in challenge
  async resolveMfaChallenge(
    error: MultiFactorError,
    verificationCode: string,
    selectedFactorIndex: number = 0
  ): Promise<any> {
    try {
      const resolver = error.resolver;
      const hints = resolver.hints;
      
      if (hints.length === 0) {
        throw new Error('No MFA factors available');
      }

      const selectedHint = hints[selectedFactorIndex];
      
      if (selectedHint.factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
          selectedHint,
          resolver.session,
          await this.initializeRecaptcha()
        );

        const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
        
        return await resolver.resolveSignIn(multiFactorAssertion);
      }

      throw new Error('Unsupported MFA factor type');
    } catch (error) {
      console.error('MFA challenge resolution failed:', error);
      throw new Error('Failed to resolve MFA challenge');
    }
  }

  // Get enrolled MFA factors for user
  getEnrolledFactors(user: User): any[] {
    return multiFactor(user).enrolledFactors.map(factor => ({
      uid: factor.uid,
      displayName: factor.displayName,
      factorId: factor.factorId,
      enrollmentTime: factor.enrollmentTime
    }));
  }

  // Check if user has MFA enabled
  isMfaEnabled(user: User): boolean {
    return multiFactor(user).enrolledFactors.length > 0;
  }

  // Generate backup codes (implement with your backend)
  async generateBackupCodes(user: User): Promise<string[]> {
    try {
      // This would typically call your backend API to generate backup codes
      // For now, we'll generate them client-side (not recommended for production)
      const codes: string[] = [];
      for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substr(2, 8).toUpperCase();
        codes.push(code);
      }
      
      // In production, store these securely in your backend
      localStorage.setItem(`backup_codes_${user.uid}`, JSON.stringify(codes));
      
      return codes;
    } catch (error) {
      console.error('Backup code generation failed:', error);
      throw new Error('Failed to generate backup codes');
    }
  }

  // Verify backup code
  async verifyBackupCode(user: User, code: string): Promise<boolean> {
    try {
      // In production, this would call your backend to verify and invalidate the code
      const storedCodes = localStorage.getItem(`backup_codes_${user.uid}`);
      if (!storedCodes) {
        return false;
      }

      const codes: string[] = JSON.parse(storedCodes);
      const codeIndex = codes.indexOf(code.toUpperCase());
      
      if (codeIndex === -1) {
        return false;
      }

      // Remove used code
      codes.splice(codeIndex, 1);
      localStorage.setItem(`backup_codes_${user.uid}`, JSON.stringify(codes));
      
      return true;
    } catch (error) {
      console.error('Backup code verification failed:', error);
      return false;
    }
  }

  // Clean up resources
  cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
  }
}

// TOTP (Time-based One-Time Password) implementation
export class TotpService {
  // Generate TOTP secret (would typically be done on backend)
  generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }

  // Generate QR code URL for TOTP setup
  generateQrCodeUrl(secret: string, userEmail: string, issuer: string = 'Solarify'): string {
    const label = encodeURIComponent(`${issuer}:${userEmail}`);
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    });

    return `otpauth://totp/${label}?${params.toString()}`;
  }

  // Verify TOTP token (would typically be done on backend)
  async verifyTotp(secret: string, token: string): Promise<boolean> {
    try {
      // This is a simplified implementation
      // In production, use a proper TOTP library and verify on the backend
      const timeStep = Math.floor(Date.now() / 1000 / 30);
      
      // Check current window and ±1 window for clock skew tolerance
      for (let i = -1; i <= 1; i++) {
        const computedToken = this.generateTotpToken(secret, timeStep + i);
        if (computedToken === token) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('TOTP verification failed:', error);
      return false;
    }
  }

  // Generate TOTP token (simplified implementation)
  private generateTotpToken(secret: string, timeStep: number): string {
    // This is a very simplified implementation
    // In production, use a proper TOTP library like 'otplib'
    const hash = this.hmacSha1(secret, timeStep.toString());
    const offset = hash.charCodeAt(hash.length - 1) & 0xf;
    const code = ((hash.charCodeAt(offset) & 0x7f) << 24) |
                 ((hash.charCodeAt(offset + 1) & 0xff) << 16) |
                 ((hash.charCodeAt(offset + 2) & 0xff) << 8) |
                 (hash.charCodeAt(offset + 3) & 0xff);
    
    return (code % 1000000).toString().padStart(6, '0');
  }

  // Simplified HMAC-SHA1 (use proper crypto library in production)
  private hmacSha1(key: string, message: string): string {
    // This is a placeholder - use proper crypto library in production
    return btoa(key + message).substring(0, 20);
  }
}

// Export singleton instances
export const mfaService = new MfaService();
export const totpService = new TotpService();