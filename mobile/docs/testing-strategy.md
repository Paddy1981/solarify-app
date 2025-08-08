# Mobile App Testing Strategy

This document outlines the comprehensive testing strategy for the Solarify mobile application, covering all testing levels from unit tests to end-to-end automation.

## Table of Contents

- [Testing Pyramid](#testing-pyramid)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Manual Testing](#manual-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Accessibility Testing](#accessibility-testing)
- [Device Testing](#device-testing)
- [Continuous Testing](#continuous-testing)

## Testing Pyramid

Our testing strategy follows the testing pyramid principle:

```
                /\
               /  \     E2E Tests (10%)
              /____\    - Critical user flows
             /      \   - Cross-platform scenarios
            /        \  
           /          \ Integration Tests (20%)
          /____________\ - Component integration  
         /              \ - Service integration
        /                \
       /                  \ Unit Tests (70%)
      /____________________\ - Business logic
                              - Utilities
                              - Components
```

### Testing Levels

1. **Unit Tests (70%)**: Fast, isolated tests for individual functions and components
2. **Integration Tests (20%)**: Tests for component interactions and service integrations
3. **End-to-End Tests (10%)**: Full user journey tests across the application

## Unit Testing

### Tools and Framework

- **Test Runner**: Jest
- **React Native Testing**: React Native Testing Library
- **Mocking**: Jest mocks, Mock Service Worker
- **Coverage**: Istanbul (built into Jest)

### Test Structure

```
src/
├── __tests__/           # Unit tests
├── components/
│   └── __tests__/       # Component tests
├── services/
│   └── __tests__/       # Service tests
├── hooks/
│   └── __tests__/       # Hook tests
└── utils/
    └── __tests__/       # Utility tests
```

### Testing Guidelines

#### Business Logic Testing
```javascript
// Example: Solar calculator tests
describe('SolarCalculator', () => {
  describe('calculateAnnualProduction', () => {
    it('should calculate annual production correctly', () => {
      const result = SolarCalculator.calculateAnnualProduction(
        5, // 5kW system
        5.5, // peak sun hours
        0.8 // system efficiency
      );
      
      expect(result).toBe(8030); // 5 * 5.5 * 365 * 0.8
    });

    it('should handle edge cases', () => {
      expect(() => {
        SolarCalculator.calculateAnnualProduction(-1, 5.5, 0.8);
      }).toThrow('System capacity must be positive');
    });
  });
});
```

#### Component Testing
```javascript
// Example: LoadingButton component tests
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LoadingButton } from '../LoadingButton';

describe('LoadingButton', () => {
  it('renders with title', () => {
    const { getByText } = render(
      <LoadingButton title="Test Button" onPress={jest.fn()} />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId } = render(
      <LoadingButton 
        title="Test Button" 
        onPress={jest.fn()} 
        loading={true}
        testID="loading-button"
      />
    );
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <LoadingButton title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

#### Service Testing
```javascript
// Example: Authentication service tests
import { authService } from '../auth.service';
import { mockFirebaseAuth } from '../../__mocks__/firebase';

jest.mock('@react-native-firebase/auth', () => mockFirebaseAuth);

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.signIn(credentials);
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(credentials.email);
    });

    it('should handle invalid credentials', async () => {
      mockFirebaseAuth.signInWithEmailAndPassword.mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      await expect(
        authService.signIn({
          email: 'invalid@example.com',
          password: 'wrong'
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- AuthService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should calculate"
```

## Integration Testing

### Service Integration Tests

Test interactions between services and external APIs:

```javascript
// Example: RFQ service integration test
describe('RFQ Service Integration', () => {
  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  afterAll(async () => {
    // Cleanup test database
    await cleanupTestDatabase();
  });

  it('should create RFQ and trigger notifications', async () => {
    const rfqData = {
      property: {
        address: '123 Test St, Test City, TC 12345',
        latitude: 40.7128,
        longitude: -74.0060,
      },
      energy_usage: {
        annual_kwh: 10000,
        monthly_bill_average: 150,
        utility_company: 'Test Utility'
      }
    };

    const createdRFQ = await rfqService.createRFQ(rfqData);
    
    expect(createdRFQ.id).toBeDefined();
    expect(createdRFQ.status).toBe('active');

    // Verify notification was sent
    const notifications = await getTestNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('rfq_created');
  });
});
```

### Component Integration Tests

Test component interactions and data flow:

```javascript
// Example: RFQ creation flow integration
describe('RFQ Creation Flow', () => {
  it('should complete RFQ creation with all steps', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RFQCreationFlow onComplete={mockOnComplete} />
    );

    // Step 1: Property information
    fireEvent.changeText(
      getByPlaceholderText('Property Address'),
      '123 Test Street, Test City, TC 12345'
    );
    fireEvent.press(getByText('Next'));

    // Step 2: Energy usage
    await waitFor(() => {
      expect(getByPlaceholderText('Annual kWh Usage')).toBeTruthy();
    });
    fireEvent.changeText(
      getByPlaceholderText('Annual kWh Usage'),
      '10000'
    );
    fireEvent.press(getByText('Next'));

    // Step 3: System preferences
    await waitFor(() => {
      expect(getByText('System Preferences')).toBeTruthy();
    });
    fireEvent.press(getByText('Create RFQ'));

    // Verify completion
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          property: expect.objectContaining({
            address: '123 Test Street, Test City, TC 12345'
          })
        })
      );
    });
  });
});
```

## End-to-End Testing

### Tools

- **Framework**: Detox (React Native E2E testing)
- **Device Management**: iOS Simulator, Android Emulator
- **CI Integration**: GitHub Actions with device farms

### E2E Test Structure

```
e2e/
├── __tests__/
│   ├── auth.e2e.js           # Authentication flows
│   ├── rfq-creation.e2e.js   # RFQ creation journey
│   ├── quote-comparison.e2e.js # Quote viewing and comparison
│   └── offline-sync.e2e.js   # Offline functionality
├── helpers/
│   ├── authentication.js     # Auth helpers
│   ├── navigation.js         # Navigation helpers
│   └── assertions.js         # Custom assertions
└── config/
    ├── detox.config.js       # Detox configuration
    └── jest.config.js        # Jest E2E configuration
```

### Critical User Journey Tests

#### Authentication Flow
```javascript
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should allow user to sign up and sign in', async () => {
    // Navigate to sign up
    await element(by.id('sign-up-tab')).tap();
    
    // Fill sign up form
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('first-name-input')).typeText('Test');
    await element(by.id('last-name-input')).typeText('User');
    
    // Submit form
    await element(by.id('sign-up-button')).tap();
    
    // Verify success message
    await expect(element(by.text('Account created successfully'))).toBeVisible();
    
    // Sign in with created account
    await element(by.id('sign-in-tab')).tap();
    await element(by.id('email-input')).clearText();
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).clearText();
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('sign-in-button')).tap();
    
    // Verify signed in
    await expect(element(by.id('main-dashboard'))).toBeVisible();
  });

  it('should enable biometric authentication', async () => {
    // Navigate to settings
    await element(by.id('profile-tab')).tap();
    await element(by.id('settings-button')).tap();
    
    // Enable biometric auth
    await element(by.id('biometric-toggle')).tap();
    
    // Mock biometric authentication success
    await device.setBiometricEnrollment(true);
    
    // Sign out and test biometric sign in
    await element(by.id('sign-out-button')).tap();
    await element(by.id('biometric-sign-in-button')).tap();
    
    // Verify biometric prompt and success
    await expect(element(by.id('main-dashboard'))).toBeVisible();
  });
});
```

#### RFQ Creation Journey
```javascript
describe('RFQ Creation Journey', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await authenticateUser(); // Helper function
  });

  it('should create RFQ with photos and location', async () => {
    // Navigate to RFQ creation
    await element(by.id('create-rfq-button')).tap();
    
    // Step 1: Location
    await element(by.id('get-location-button')).tap();
    await device.setLocation(40.7128, -74.0060); // Mock location
    await expect(element(by.text('Location captured'))).toBeVisible();
    await element(by.id('next-button')).tap();
    
    // Step 2: Property details
    await element(by.id('property-type-dropdown')).tap();
    await element(by.text('Single Family')).tap();
    await element(by.id('square-footage-input')).typeText('2000');
    await element(by.id('next-button')).tap();
    
    // Step 3: Energy usage
    await element(by.id('annual-usage-input')).typeText('10000');
    await element(by.id('monthly-bill-input')).typeText('150');
    await element(by.id('next-button')).tap();
    
    // Step 4: Photos
    await element(by.id('take-photo-button')).tap();
    await device.takeScreenshot('camera-screen');
    await element(by.id('capture-button')).tap();
    await element(by.id('use-photo-button')).tap();
    await element(by.id('next-button')).tap();
    
    // Step 5: Review and submit
    await element(by.id('submit-rfq-button')).tap();
    
    // Verify RFQ created
    await expect(element(by.text('RFQ created successfully'))).toBeVisible();
    await expect(element(by.id('rfq-list'))).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Build app for testing
detox build --configuration ios.sim.debug

# Run E2E tests
detox test --configuration ios.sim.debug

# Run specific test suite
detox test --configuration ios.sim.debug e2e/auth.e2e.js

# Run with device logs
detox test --configuration ios.sim.debug --loglevel trace
```

## Manual Testing

### Test Plans

#### Pre-Release Checklist

**Authentication & Onboarding**
- [ ] Email/password signup and signin
- [ ] Google social signin
- [ ] Apple signin (iOS only)
- [ ] Biometric authentication setup and usage
- [ ] Password reset functionality
- [ ] Email verification flow

**Core Functionality**
- [ ] RFQ creation with all steps
- [ ] Photo capture and gallery selection
- [ ] GPS location accuracy
- [ ] Roof measurement with sensors
- [ ] Quote viewing and comparison
- [ ] Installer messaging

**Offline Functionality**
- [ ] RFQ draft saving when offline
- [ ] Photo queueing for upload
- [ ] Data sync when back online
- [ ] Offline indicator display
- [ ] Cached data viewing

**Push Notifications**
- [ ] Permission request flow
- [ ] Quote received notifications
- [ ] RFQ status notifications
- [ ] Notification settings management
- [ ] Deep link navigation from notifications

#### Device-Specific Testing

**iOS Testing**
- [ ] iPhone 14/15 series support
- [ ] iPad layout (if supported)
- [ ] iOS 16+ compatibility
- [ ] Face ID/Touch ID integration
- [ ] App Store compliance

**Android Testing**
- [ ] Various screen sizes and densities
- [ ] Android 10+ compatibility
- [ ] Fingerprint authentication
- [ ] Google Play compliance
- [ ] Android-specific permissions

### Manual Test Cases

#### Critical Path: RFQ Creation
```
Test Case: Complete RFQ Creation Flow

Preconditions:
- User is signed in
- Location services enabled
- Camera permissions granted

Steps:
1. Tap "Create RFQ" button
2. Allow location access and verify accuracy
3. Enter property details (type, size, age)
4. Enter energy usage information
5. Capture 3+ roof photos
6. Take electrical panel photo
7. Review all information
8. Submit RFQ

Expected Results:
- Location captured with <50m accuracy
- All photos saved and displayed
- RFQ appears in user's RFQ list
- Push notification sent to nearby installers
- Success message displayed

Pass/Fail: ___________
Notes: _____________
```

## Performance Testing

### Metrics to Monitor

- **App Launch Time**: <3 seconds cold start
- **Screen Transition**: <300ms between screens
- **Photo Capture**: <2 seconds from tap to save
- **API Response**: <5 seconds for quote loading
- **Memory Usage**: <150MB RAM on average
- **Battery Impact**: Minimal background usage

### Performance Test Tools

```javascript
// Example: Performance test for RFQ list loading
import { measurePerformance } from '@testing-library/react-native';

describe('RFQ List Performance', () => {
  it('should load RFQ list within performance budget', async () => {
    const performanceMetrics = await measurePerformance(() => {
      return render(<RFQListScreen />);
    });

    expect(performanceMetrics.renderTime).toBeLessThan(1000); // 1 second
    expect(performanceMetrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

### Load Testing

```javascript
// Example: Stress test for offline data storage
describe('Offline Storage Load Test', () => {
  it('should handle 100+ RFQ drafts without performance degradation', async () => {
    const startTime = Date.now();
    
    // Create 100 RFQ drafts
    for (let i = 0; i < 100; i++) {
      await offlineSyncService.saveRFQDraft({
        id: `draft_${i}`,
        property: { address: `Test Address ${i}` },
        created_at: new Date()
      });
    }
    
    const saveTime = Date.now() - startTime;
    expect(saveTime).toBeLessThan(5000); // 5 seconds max
    
    // Test retrieval performance
    const retrievalStartTime = Date.now();
    const drafts = await offlineSyncService.getRFQDrafts();
    const retrievalTime = Date.now() - retrievalStartTime;
    
    expect(Object.keys(drafts)).toHaveLength(100);
    expect(retrievalTime).toBeLessThan(1000); // 1 second max
  });
});
```

## Security Testing

### Security Test Checklist

**Authentication Security**
- [ ] JWT token expiration handling
- [ ] Biometric data encryption
- [ ] Session management
- [ ] Password policy enforcement

**Data Protection**
- [ ] Local data encryption
- [ ] Secure storage of credentials
- [ ] API communication encryption (HTTPS)
- [ ] Photo metadata scrubbing

**Network Security**
- [ ] Certificate pinning
- [ ] API authentication
- [ ] Request signing
- [ ] Protection against MITM attacks

### Automated Security Tests

```javascript
// Example: Security test for credential storage
describe('Security Tests', () => {
  it('should encrypt sensitive data in storage', async () => {
    const sensitiveData = {
      email: 'test@example.com',
      refreshToken: 'sensitive-refresh-token'
    };

    await secureStorage.setItem('user_credentials', sensitiveData);
    
    // Verify data is encrypted in storage
    const rawStorageData = await AsyncStorage.getItem('user_credentials');
    expect(rawStorageData).not.toContain('test@example.com');
    expect(rawStorageData).not.toContain('sensitive-refresh-token');
    
    // Verify data can be decrypted properly
    const retrievedData = await secureStorage.getItem('user_credentials');
    expect(retrievedData.email).toBe('test@example.com');
  });

  it('should clear sensitive data on logout', async () => {
    await authService.signIn({ email: 'test@example.com', password: 'test' });
    expect(await secureStorage.getItem('user_credentials')).toBeTruthy();
    
    await authService.signOut();
    expect(await secureStorage.getItem('user_credentials')).toBeNull();
  });
});
```

## Accessibility Testing

### Accessibility Standards

- **WCAG 2.1 Level AA compliance**
- **iOS Accessibility Guidelines**
- **Android Accessibility Guidelines**

### Automated Accessibility Tests

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('should have no accessibility violations on login screen', async () => {
    const { container } = render(<AuthScreen />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper accessibility labels', () => {
    const { getByLabelText } = render(<LoadingButton title="Submit RFQ" />);
    expect(getByLabelText('Submit RFQ')).toBeTruthy();
  });
});
```

### Manual Accessibility Testing

**Screen Reader Testing**
- [ ] VoiceOver (iOS) navigation
- [ ] TalkBack (Android) navigation  
- [ ] Proper reading order
- [ ] Descriptive labels and hints

**Visual Accessibility**
- [ ] Color contrast ratios (4.5:1 minimum)
- [ ] Text scaling up to 200%
- [ ] Focus indicators
- [ ] High contrast mode support

**Motor Accessibility**
- [ ] Touch target size (44pt minimum)
- [ ] Switch control support
- [ ] Voice control compatibility

## Device Testing

### Test Device Matrix

#### iOS Devices
| Device | iOS Version | Screen Size | Test Priority |
|--------|-------------|-------------|---------------|
| iPhone 15 Pro | iOS 17 | 6.1" | High |
| iPhone 14 | iOS 16/17 | 6.1" | High |
| iPhone 13 mini | iOS 16/17 | 5.4" | Medium |
| iPhone SE (3rd gen) | iOS 16/17 | 4.7" | Medium |
| iPad Air | iPadOS 17 | 10.9" | Low |

#### Android Devices
| Device | Android Version | Screen Size | Test Priority |
|--------|-----------------|-------------|---------------|
| Pixel 7 | Android 13/14 | 6.3" | High |
| Samsung Galaxy S23 | Android 13/14 | 6.1" | High |
| Samsung Galaxy A54 | Android 13 | 6.4" | Medium |
| OnePlus 11 | Android 13/14 | 6.7" | Medium |
| Pixel 6a | Android 13/14 | 6.1" | Low |

### Cloud Device Testing

**Firebase Test Lab (Android)**
```bash
# Run tests on multiple Android devices
gcloud firebase test android run \
  --type instrumentation \
  --app app-debug.apk \
  --test app-debug-androidTest.apk \
  --device model=Pixel2,version=28,locale=en,orientation=portrait \
  --device model=NexusLowRes,version=29,locale=en,orientation=portrait
```

**AWS Device Farm**
```bash
# Upload and run tests on real devices
aws devicefarm create-upload --project-arn $PROJECT_ARN --name "SolarifyMobile.apk" --type ANDROID_APP
aws devicefarm schedule-run --project-arn $PROJECT_ARN --app-arn $APP_ARN --device-pool-arn $DEVICE_POOL_ARN
```

## Continuous Testing

### Test Automation in CI/CD

```yaml
# GitHub Actions test workflow
name: Mobile App Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:integration

  e2e-ios:
    runs-on: macos-13
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: detox build --configuration ios.sim.release
      - run: detox test --configuration ios.sim.release --cleanup

  e2e-android:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '11'
      - run: npm ci
      - run: detox build --configuration android.emu.release
      - run: detox test --configuration android.emu.release --cleanup
```

### Quality Gates

**Pre-commit Hooks**
```bash
# .husky/pre-commit
npm run lint
npm run typecheck
npm test -- --passWithNoTests
```

**Pull Request Requirements**
- All tests must pass
- Code coverage > 80%
- No security vulnerabilities
- Performance benchmarks met

### Test Reporting

**Coverage Reports**
- Minimum 80% code coverage
- Critical paths 100% covered
- Regular coverage trend monitoring

**Test Results Dashboard**
- Real-time test status
- Historical trend analysis
- Device-specific results
- Performance metrics

## Test Data Management

### Test Data Strategy

**Static Test Data**
- Predefined user accounts for different roles
- Sample property data for RFQ testing
- Mock installer profiles and quotes
- Test images and documents

**Dynamic Test Data**
- Generated test data for load testing
- Random property addresses for location testing
- Synthetic solar calculation data
- Mock API responses

### Test Environment Management

**Development Environment**
- Local development with mocked services
- Hot reloading for rapid testing
- Debug mode with detailed logging

**Staging Environment**
- Production-like configuration
- Real Firebase services with test data
- Performance monitoring enabled
- Automated testing on every deploy

## Conclusion

This comprehensive testing strategy ensures the Solarify mobile app delivers a high-quality, reliable, and secure experience across all supported devices and platforms. Regular execution of these tests, combined with continuous monitoring and improvement, maintains the app's quality standards and user satisfaction.

### Success Metrics

- **Test Coverage**: >80% overall, >90% for critical paths
- **Defect Escape Rate**: <2% of issues reach production
- **Test Execution Time**: <30 minutes for full test suite
- **Device Coverage**: >95% of user devices represented in testing
- **Accessibility Compliance**: WCAG 2.1 AA standard met

Regular review and updates of this testing strategy ensure it remains effective as the application evolves and new testing tools and methodologies become available.