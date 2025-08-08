// =============================================================================
// Authentication Flow E2E Tests
// =============================================================================
// End-to-end tests for user authentication journeys
// =============================================================================

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Sign Up Flow', () => {
    it('should complete homeowner sign up successfully', async () => {
      // Navigate to sign up screen
      await element(by.id('auth-screen')).toBeVisible();
      await element(by.id('sign-up-tab')).tap();
      
      // Verify sign up form is displayed
      await expect(element(by.id('sign-up-form'))).toBeVisible();
      
      // Fill in user information
      await element(by.id('first-name-input')).typeText('John');
      await element(by.id('last-name-input')).typeText('Doe');
      await element(by.id('email-input')).typeText(`test+${Date.now()}@solarify.com`);
      await element(by.id('phone-input')).typeText('(555) 123-4567');
      await element(by.id('password-input')).typeText('SecurePassword123!');
      
      // Select homeowner role
      await element(by.id('role-dropdown')).tap();
      await element(by.text('Homeowner')).tap();
      
      // Scroll down to see submit button if needed
      await element(by.id('sign-up-form')).scroll(200, 'down');
      
      // Submit form
      await element(by.id('sign-up-button')).tap();
      
      // Wait for success message
      await waitFor(element(by.text('Account created successfully')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Verify navigation to main screen
      await expect(element(by.id('main-dashboard'))).toBeVisible();
    });

    it('should handle sign up validation errors', async () => {
      await element(by.id('sign-up-tab')).tap();
      
      // Try to submit empty form
      await element(by.id('sign-up-button')).tap();
      
      // Verify validation messages
      await expect(element(by.text('Please enter your email address'))).toBeVisible();
    });

    it('should handle duplicate email error', async () => {
      await element(by.id('sign-up-tab')).tap();
      
      // Fill form with existing email
      await element(by.id('email-input')).typeText('existing@solarify.com');
      await element(by.id('password-input')).typeText('Password123!');
      await element(by.id('first-name-input')).typeText('Test');
      await element(by.id('last-name-input')).typeText('User');
      
      await element(by.id('sign-up-button')).tap();
      
      // Verify error message
      await expect(element(by.text('Email already in use'))).toBeVisible();
    });
  });

  describe('Sign In Flow', () => {
    it('should sign in existing user successfully', async () => {
      // Navigate to sign in (default tab)
      await expect(element(by.id('sign-in-form'))).toBeVisible();
      
      // Enter credentials
      await element(by.id('email-input')).typeText('test@solarify.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      
      // Submit form
      await element(by.id('sign-in-button')).tap();
      
      // Wait for dashboard
      await waitFor(element(by.id('main-dashboard')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Verify user is signed in
      await element(by.id('profile-tab')).tap();
      await expect(element(by.text('test@solarify.com'))).toBeVisible();
    });

    it('should handle invalid credentials', async () => {
      await element(by.id('email-input')).typeText('invalid@solarify.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      
      await element(by.id('sign-in-button')).tap();
      
      await expect(element(by.text('Invalid credentials'))).toBeVisible();
    });

    it('should show loading state during authentication', async () => {
      await element(by.id('email-input')).typeText('test@solarify.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      
      await element(by.id('sign-in-button')).tap();
      
      // Verify loading state
      await expect(element(by.id('sign-in-loading'))).toBeVisible();
    });
  });

  describe('Social Authentication', () => {
    it('should sign in with Google successfully', async () => {
      await element(by.id('google-sign-in-button')).tap();
      
      // Mock Google authentication success
      await device.openURL('solarify://auth/google?token=mock-google-token');
      
      // Verify successful authentication
      await waitFor(element(by.id('main-dashboard')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle Google sign-in cancellation', async () => {
      await element(by.id('google-sign-in-button')).tap();
      
      // Mock user cancellation (no URL callback)
      await device.pressBack(); // Android back button
      
      // Should remain on auth screen
      await expect(element(by.id('auth-screen'))).toBeVisible();
    });

    it('should show Apple sign-in on iOS', async () => {
      if (device.getPlatform() === 'ios') {
        await expect(element(by.id('apple-sign-in-button'))).toBeVisible();
      } else {
        await expect(element(by.id('apple-sign-in-button'))).not.toBeVisible();
      }
    });
  });

  describe('Biometric Authentication', () => {
    beforeAll(async () => {
      // Sign in first to set up biometric auth
      await element(by.id('email-input')).typeText('test@solarify.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      await element(by.id('sign-in-button')).tap();
      
      await waitFor(element(by.id('main-dashboard'))).toBeVisible();
    });

    it('should set up biometric authentication', async () => {
      // Navigate to settings
      await element(by.id('profile-tab')).tap();
      await element(by.id('settings-button')).tap();
      
      // Enable biometric authentication
      await element(by.id('biometric-toggle')).tap();
      
      // Mock biometric enrollment
      await device.setBiometricEnrollment(true);
      
      // Verify biometric setup success
      await expect(element(by.text('Biometric authentication enabled')))
        .toBeVisible();
    });

    it('should sign in with biometric authentication', async () => {
      // Sign out first
      await element(by.id('profile-tab')).tap();
      await element(by.id('sign-out-button')).tap();
      
      // Verify back on auth screen
      await expect(element(by.id('auth-screen'))).toBeVisible();
      
      // Try biometric sign in
      await expect(element(by.id('biometric-sign-in-button'))).toBeVisible();
      await element(by.id('biometric-sign-in-button')).tap();
      
      // Mock successful biometric authentication
      await device.matchBiometric();
      
      // Verify successful sign in
      await waitFor(element(by.id('main-dashboard')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle biometric authentication failure', async () => {
      await element(by.id('biometric-sign-in-button')).tap();
      
      // Mock failed biometric authentication
      await device.unmatchedBiometric();
      
      // Should remain on auth screen with error
      await expect(element(by.id('auth-screen'))).toBeVisible();
      await expect(element(by.text('Biometric authentication failed')))
        .toBeVisible();
    });
  });

  describe('Password Recovery', () => {
    it('should send password reset email', async () => {
      // Navigate to password reset
      await element(by.id('forgot-password-link')).tap();
      
      // Verify password reset screen
      await expect(element(by.id('password-reset-screen'))).toBeVisible();
      
      // Enter email
      await element(by.id('email-input')).typeText('test@solarify.com');
      
      // Submit reset request
      await element(by.id('reset-password-button')).tap();
      
      // Verify success message
      await expect(element(by.text('Password reset email sent')))
        .toBeVisible();
    });

    it('should handle invalid email for password reset', async () => {
      await element(by.id('forgot-password-link')).tap();
      await element(by.id('email-input')).typeText('nonexistent@solarify.com');
      await element(by.id('reset-password-button')).tap();
      
      await expect(element(by.text('No account found with this email')))
        .toBeVisible();
    });
  });

  describe('Sign Out Flow', () => {
    beforeAll(async () => {
      // Ensure user is signed in
      await element(by.id('email-input')).typeText('test@solarify.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      await element(by.id('sign-in-button')).tap();
      await waitFor(element(by.id('main-dashboard'))).toBeVisible();
    });

    it('should sign out user successfully', async () => {
      // Navigate to profile
      await element(by.id('profile-tab')).tap();
      
      // Sign out
      await element(by.id('sign-out-button')).tap();
      
      // Confirm sign out
      await element(by.text('Sign Out')).tap();
      
      // Verify back on auth screen
      await expect(element(by.id('auth-screen'))).toBeVisible();
    });

    it('should clear user data on sign out', async () => {
      // Sign in again
      await element(by.id('email-input')).typeText('test@solarify.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      await element(by.id('sign-in-button')).tap();
      await waitFor(element(by.id('main-dashboard'))).toBeVisible();
      
      // Create some user data (RFQ draft)
      await element(by.id('create-rfq-button')).tap();
      await element(by.id('property-address-input')).typeText('123 Test St');
      await element(by.id('save-draft-button')).tap();
      
      // Sign out
      await element(by.id('profile-tab')).tap();
      await element(by.id('sign-out-button')).tap();
      await element(by.text('Sign Out')).tap();
      
      // Sign back in
      await element(by.id('email-input')).typeText('test@solarify.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      await element(by.id('sign-in-button')).tap();
      await waitFor(element(by.id('main-dashboard'))).toBeVisible();
      
      // Verify user data is cleared (no drafts)
      await element(by.id('rfq-tab')).tap();
      await expect(element(by.text('No saved drafts'))).toBeVisible();
    });
  });

  describe('Auth State Persistence', () => {
    it('should maintain auth state across app restarts', async () => {
      // Sign in
      await element(by.id('email-input')).typeText('test@solarify.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      await element(by.id('sign-in-button')).tap();
      await waitFor(element(by.id('main-dashboard'))).toBeVisible();
      
      // Restart app
      await device.relaunchApp();
      
      // Should still be signed in
      await expect(element(by.id('main-dashboard'))).toBeVisible();
    });

    it('should handle expired auth tokens', async () => {
      // Mock expired token scenario
      await device.openURL('solarify://auth/expired');
      
      // Should redirect to auth screen
      await expect(element(by.id('auth-screen'))).toBeVisible();
      await expect(element(by.text('Session expired. Please sign in again')))
        .toBeVisible();
    });
  });
});

// Helper functions for authentication tests
const helpers = {
  signInTestUser: async () => {
    await element(by.id('email-input')).typeText('test@solarify.com');
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.id('sign-in-button')).tap();
    await waitFor(element(by.id('main-dashboard'))).toBeVisible();
  },
  
  signOutCurrentUser: async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('sign-out-button')).tap();
    await element(by.text('Sign Out')).tap();
    await expect(element(by.id('auth-screen'))).toBeVisible();
  },
  
  createTestAccount: async (email, password, firstName, lastName) => {
    await element(by.id('sign-up-tab')).tap();
    await element(by.id('first-name-input')).typeText(firstName);
    await element(by.id('last-name-input')).typeText(lastName);
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('sign-up-button')).tap();
    
    await waitFor(element(by.text('Account created successfully')))
      .toBeVisible()
      .withTimeout(10000);
  },
};