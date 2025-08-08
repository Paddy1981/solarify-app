// =============================================================================
// Mobile-Optimized Authentication Service
// =============================================================================
// Enhanced authentication with biometric support and offline capabilities
// =============================================================================

import {
  getFirebaseAuth,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  AuthCredential,
  onAuthStateChanged,
  Unsubscribe,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import {
  getFirebaseFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import type { UserProfile } from '@solarify/core';
import { APP_CONSTANTS, ERROR_MESSAGES } from '@solarify/core';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'homeowner' | 'installer' | 'supplier';
  company?: string;
  licenseNumber?: string;
  serviceAreas?: string[];
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  credentials?: AuthCredential;
}

export interface SocialAuthResult {
  user: User;
  isNewUser: boolean;
  profile?: Partial<UserProfile>;
}

export class AuthService {
  private static instance: AuthService;
  private auth = getFirebaseAuth();
  private db = getFirebaseFirestore();
  private authStateSubscription: Unsubscribe | null = null;
  private currentUser: User | null = null;
  private currentProfile: UserProfile | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize auth service and set up state listener
   */
  initialize(): Promise<User | null> {
    return new Promise((resolve) => {
      // Listen for auth state changes
      this.authStateSubscription = onAuthStateChanged(this.auth, async (user) => {
        this.currentUser = user;
        
        if (user) {
          // Load user profile
          try {
            this.currentProfile = await this.loadUserProfile(user.uid);
          } catch (error) {
            console.error('Failed to load user profile:', error);
            this.currentProfile = null;
          }
        } else {
          this.currentProfile = null;
        }
        
        resolve(user);
      });
    });
  }

  /**
   * Sign up with email and password
   */
  async signUp(signUpData: SignUpData): Promise<{ user: User; profile: UserProfile }> {
    try {
      const { email, password, ...profileData } = signUpData;

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: `${profileData.firstName} ${profileData.lastName}`
      });

      // Send email verification
      await sendEmailVerification(user);

      // Create user profile in Firestore
      const profile: UserProfile = {
        id: user.uid,
        email: user.email!,
        role: profileData.role,
        profile: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          company: profileData.company,
          license_number: profileData.licenseNumber,
          service_areas: profileData.serviceAreas || []
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.createUserProfile(profile);
      this.currentProfile = profile;

      return { user, profile };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<{ user: User; profile: UserProfile }> {
    try {
      const { email, password } = credentials;

      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const user = userCredential.user;
      const profile = await this.loadUserProfile(user.uid);

      this.currentProfile = profile;

      // Update last sign in timestamp
      await this.updateLastSignIn(user.uid);

      return { user, profile };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Google (mobile-optimized)
   */
  async signInWithGoogle(googleCredential: AuthCredential): Promise<SocialAuthResult> {
    try {
      const userCredential = await signInWithCredential(this.auth, googleCredential);
      const user = userCredential.user;

      // Check if this is a new user
      const existingProfile = await this.getUserProfile(user.uid);
      const isNewUser = !existingProfile;

      let profile: UserProfile;

      if (isNewUser) {
        // Create new profile for Google user
        profile = {
          id: user.uid,
          email: user.email!,
          role: 'homeowner', // Default role, user can change later
          profile: {
            first_name: user.displayName?.split(' ')[0] || '',
            last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
            phone: user.phoneNumber || undefined,
          },
          created_at: new Date(),
          updated_at: new Date()
        };

        await this.createUserProfile(profile);
      } else {
        profile = existingProfile;
        await this.updateLastSignIn(user.uid);
      }

      this.currentProfile = profile;

      return { user, isNewUser, profile };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Apple (iOS only)
   */
  async signInWithApple(appleCredential: AuthCredential): Promise<SocialAuthResult> {
    try {
      const userCredential = await signInWithCredential(this.auth, appleCredential);
      const user = userCredential.user;

      const existingProfile = await this.getUserProfile(user.uid);
      const isNewUser = !existingProfile;

      let profile: UserProfile;

      if (isNewUser) {
        profile = {
          id: user.uid,
          email: user.email!,
          role: 'homeowner',
          profile: {
            first_name: user.displayName?.split(' ')[0] || 'User',
            last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
          },
          created_at: new Date(),
          updated_at: new Date()
        };

        await this.createUserProfile(profile);
      } else {
        profile = existingProfile;
        await this.updateLastSignIn(user.uid);
      }

      this.currentProfile = profile;

      return { user, isNewUser, profile };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUser = null;
      this.currentProfile = null;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(
        this.currentUser.email!,
        currentPassword
      );
      
      await reauthenticateWithCredential(this.currentUser, credential);
      await updatePassword(this.currentUser, newPassword);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.currentUser || !this.currentProfile) {
      throw new Error('No authenticated user');
    }

    try {
      const updatedProfile = {
        ...this.currentProfile,
        ...updates,
        updated_at: new Date()
      };

      await updateDoc(
        doc(this.db, 'users', this.currentUser.uid),
        {
          ...updatedProfile,
          updated_at: serverTimestamp()
        }
      );

      // Update display name if name changed
      if (updates.profile?.first_name || updates.profile?.last_name) {
        const displayName = `${updatedProfile.profile.first_name} ${updatedProfile.profile.last_name}`;
        await updateProfile(this.currentUser, { displayName });
      }

      this.currentProfile = updatedProfile;
      return updatedProfile;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current user profile
   */
  getCurrentProfile(): UserProfile | null {
    return this.currentProfile;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Check if user email is verified
   */
  isEmailVerified(): boolean {
    return this.currentUser?.emailVerified || false;
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      await sendEmailVerification(this.currentUser);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Refresh user token
   */
  async refreshToken(): Promise<string> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    return await this.currentUser.getIdToken(true);
  }

  /**
   * Get user ID token
   */
  async getIdToken(): Promise<string> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    return await this.currentUser.getIdToken();
  }

  /**
   * Create user profile in Firestore
   */
  private async createUserProfile(profile: UserProfile): Promise<void> {
    await setDoc(doc(this.db, 'users', profile.id), {
      ...profile,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  }

  /**
   * Load user profile from Firestore
   */
  private async loadUserProfile(uid: string): Promise<UserProfile> {
    const profile = await this.getUserProfile(uid);
    if (!profile) {
      throw new Error('User profile not found');
    }
    return profile;
  }

  /**
   * Get user profile from Firestore
   */
  private async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docSnap = await getDoc(doc(this.db, 'users', uid));
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date()
    } as UserProfile;
  }

  /**
   * Update last sign in timestamp
   */
  private async updateLastSignIn(uid: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'users', uid), {
        last_sign_in: serverTimestamp()
      });
    } catch (error) {
      // Non-critical error, don't throw
      console.warn('Failed to update last sign in:', error);
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): Error {
    console.error('Auth error:', error);

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
        
      case 'auth/email-already-in-use':
        return new Error(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
        
      case 'auth/weak-password':
        return new Error('Password is too weak. Please choose a stronger password.');
        
      case 'auth/invalid-email':
        return new Error(ERROR_MESSAGES.INVALID_EMAIL);
        
      case 'auth/too-many-requests':
        return new Error('Too many failed attempts. Please try again later.');
        
      case 'auth/network-request-failed':
        return new Error(ERROR_MESSAGES.NETWORK_ERROR);
        
      case 'auth/user-disabled':
        return new Error('This account has been disabled. Please contact support.');
        
      case 'auth/operation-not-allowed':
        return new Error('This authentication method is not enabled.');
        
      default:
        return new Error(error.message || ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Cleanup subscriptions
   */
  dispose(): void {
    if (this.authStateSubscription) {
      this.authStateSubscription();
      this.authStateSubscription = null;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();