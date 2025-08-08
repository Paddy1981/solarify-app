#!/bin/bash

# =============================================================================
# Solarify Mobile Development Setup Script
# =============================================================================
# Sets up React Native development environment and creates shared packages
# architecture for code reuse between web and mobile apps
# =============================================================================

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MOBILE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly PROJECT_ROOT="$(cd "${MOBILE_ROOT}/.." && pwd)"
readonly LOG_FILE="${MOBILE_ROOT}/setup.log"

# App configuration
readonly APP_NAME="SolarifyMobile"
readonly BUNDLE_ID="com.solarify.mobile"
readonly REACT_NATIVE_VERSION="0.73.2"

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        INFO)  echo -e "${GREEN}[INFO]${NC}  ${timestamp} - $message" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC}  ${timestamp} - $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} ${timestamp} - $message" ;;
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message" ;;
    esac
    
    echo "[${level}] ${timestamp} - $message" >> "$LOG_FILE"
}

error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error_exit "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    fi
    
    local node_version=$(node -v | sed 's/v//')
    if ! printf '%s\n%s\n' "18.0.0" "$node_version" | sort -V -C; then
        error_exit "Node.js version $node_version is too old. Required: >= 18.0.0"
    fi
    log "INFO" "✅ Node.js $node_version is compatible"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error_exit "npm is not installed"
    fi
    log "INFO" "✅ npm is available"
    
    # Check for React Native CLI (install if missing)
    if ! command -v react-native &> /dev/null; then
        log "INFO" "Installing React Native CLI globally..."
        npm install -g @react-native-community/cli
    fi
    log "INFO" "✅ React Native CLI is available"
    
    # Check platform-specific requirements
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - check for Xcode
        if ! command -v xcodebuild &> /dev/null; then
            log "WARN" "Xcode is not installed. iOS development will not be available."
            log "INFO" "Install Xcode from the App Store to develop for iOS"
        else
            log "INFO" "✅ Xcode is available for iOS development"
        fi
        
        # Check for CocoaPods
        if ! command -v pod &> /dev/null; then
            log "INFO" "Installing CocoaPods..."
            sudo gem install cocoapods
        fi
        log "INFO" "✅ CocoaPods is available"
    fi
    
    # Check for Android development tools
    if [[ -n "${ANDROID_HOME:-}" ]]; then
        log "INFO" "✅ ANDROID_HOME is set: $ANDROID_HOME"
    else
        log "WARN" "ANDROID_HOME is not set. Android development may not work."
        log "INFO" "Install Android Studio and set ANDROID_HOME environment variable"
    fi
    
    log "INFO" "Prerequisites check completed"
}

# Create shared packages structure
create_shared_packages() {
    log "INFO" "Creating shared packages architecture..."
    
    mkdir -p "${MOBILE_ROOT}/shared-packages"
    cd "${MOBILE_ROOT}/shared-packages"
    
    # Create solarify-core package
    log "INFO" "Creating solarify-core package..."
    mkdir -p solarify-core/src
    cd solarify-core
    
    cat > package.json << EOF
{
  "name": "@solarify/core",
  "version": "1.0.0",
  "description": "Core types, schemas, and business logic for Solarify applications",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "keywords": ["solarify", "solar", "marketplace", "shared"],
  "author": "Solarify Team",
  "license": "MIT",
  "dependencies": {
    "zod": "^3.24.2",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.13",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  },
  "files": ["dist/**/*"]
}
EOF
    
    cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF
    
    # Copy types from main project
    log "INFO" "Copying shared types from main project..."
    if [[ -f "${PROJECT_ROOT}/src/types/firestore-schema.ts" ]]; then
        cp "${PROJECT_ROOT}/src/types/firestore-schema.ts" src/
    fi
    
    # Create index file
    cat > src/index.ts << EOF
// Core types and schemas
export * from './firestore-schema';
export * from './types';
export * from './schemas';
export * from './constants';

// Utilities
export * from './utils';
export * from './calculations';
export * from './validation';
EOF
    
    # Create essential shared files
    cat > src/types.ts << EOF
// =============================================================================
// Shared Types for Solarify Applications
// =============================================================================

export interface SolarSystemSpecs {
  capacity_kw: number;
  panel_count: number;
  panel_wattage: number;
  inverter_type: 'string' | 'power_optimizers' | 'micro_inverters';
  estimated_production_kwh_year: number;
  estimated_offset_percentage: number;
}

export interface PropertyDetails {
  address: string;
  latitude: number;
  longitude: number;
  roof_type: 'asphalt_shingle' | 'tile' | 'metal' | 'flat' | 'other';
  roof_age_years?: number;
  shading_factors: string[];
  electrical_panel_amps: number;
}

export interface RFQData {
  id: string;
  homeowner_id: string;
  property: PropertyDetails;
  system_requirements: SolarSystemSpecs;
  budget_range: [number, number];
  timeline: 'immediate' | 'within_3_months' | 'within_6_months' | 'flexible';
  created_at: Date;
  status: 'draft' | 'active' | 'quoted' | 'accepted' | 'completed' | 'cancelled';
}

export interface QuoteData {
  id: string;
  rfq_id: string;
  installer_id: string;
  system_specs: SolarSystemSpecs;
  pricing: {
    gross_price: number;
    incentives: number;
    net_price: number;
    financing_options?: FinancingOption[];
  };
  installation_timeline_weeks: number;
  warranty_years: number;
  created_at: Date;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired';
}

export interface FinancingOption {
  type: 'cash' | 'loan' | 'lease' | 'ppa';
  provider?: string;
  terms?: {
    duration_years?: number;
    interest_rate?: number;
    monthly_payment?: number;
    escalation_rate?: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'homeowner' | 'installer' | 'supplier';
  profile: {
    first_name: string;
    last_name: string;
    phone?: string;
    company?: string;
    license_number?: string;
    service_areas?: string[];
  };
  created_at: Date;
  updated_at: Date;
}

// Mobile-specific types
export interface MobileAppState {
  isOnline: boolean;
  lastSyncTime?: Date;
  pendingUploads: string[];
  draftData: Record<string, any>;
}

export interface PhotoUpload {
  id: string;
  uri: string;
  type: 'roof' | 'electrical_panel' | 'installation_progress' | 'documentation';
  rfq_id?: string;
  quote_id?: string;
  uploaded: boolean;
  created_at: Date;
}
EOF
    
    cat > src/schemas.ts << EOF
// =============================================================================
// Zod Validation Schemas for Solarify Applications
// =============================================================================

import { z } from 'zod';

export const PropertyDetailsSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  roof_type: z.enum(['asphalt_shingle', 'tile', 'metal', 'flat', 'other']),
  roof_age_years: z.number().min(0).max(100).optional(),
  shading_factors: z.array(z.string()),
  electrical_panel_amps: z.number().min(100).max(400)
});

export const SolarSystemSpecsSchema = z.object({
  capacity_kw: z.number().min(1).max(100),
  panel_count: z.number().min(4).max(200),
  panel_wattage: z.number().min(200).max(600),
  inverter_type: z.enum(['string', 'power_optimizers', 'micro_inverters']),
  estimated_production_kwh_year: z.number().min(1000),
  estimated_offset_percentage: z.number().min(0).max(120)
});

export const RFQCreateSchema = z.object({
  property: PropertyDetailsSchema,
  system_requirements: SolarSystemSpecsSchema.partial(),
  budget_range: z.tuple([z.number().min(5000), z.number().max(100000)]),
  timeline: z.enum(['immediate', 'within_3_months', 'within_6_months', 'flexible'])
});

export const QuoteCreateSchema = z.object({
  rfq_id: z.string().min(1),
  system_specs: SolarSystemSpecsSchema,
  pricing: z.object({
    gross_price: z.number().min(1000),
    incentives: z.number().min(0),
    net_price: z.number().min(1000),
  }),
  installation_timeline_weeks: z.number().min(2).max(52),
  warranty_years: z.number().min(10).max(30)
});
EOF
    
    cat > src/constants.ts << EOF
// =============================================================================
// Shared Constants for Solarify Applications
// =============================================================================

export const SOLAR_CONSTANTS = {
  // Average solar panel efficiency
  AVERAGE_PANEL_EFFICIENCY: 0.20,
  
  // Peak sun hours by region (simplified)
  PEAK_SUN_HOURS: {
    'California': 5.5,
    'Arizona': 6.0,
    'Florida': 4.5,
    'Texas': 4.8,
    'Nevada': 5.8,
    'North Carolina': 4.5,
    'default': 4.5
  },
  
  // System degradation rate per year
  SYSTEM_DEGRADATION_RATE: 0.005,
  
  // Typical system costs per watt (before incentives)
  COST_PER_WATT_RANGE: {
    min: 2.50,
    max: 4.50,
    average: 3.25
  }
} as const;

export const APP_CONSTANTS = {
  // API configuration
  API_TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  
  // File upload limits
  MAX_PHOTO_SIZE_MB: 10,
  MAX_DOCUMENT_SIZE_MB: 25,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
  
  // Offline sync
  SYNC_INTERVAL_MINUTES: 5,
  MAX_OFFLINE_STORAGE_MB: 100,
  
  // UI constants
  DEBOUNCE_DELAY_MS: 300,
  ANIMATION_DURATION_MS: 200,
  
  // Validation
  MIN_PASSWORD_LENGTH: 8,
  MAX_MESSAGE_LENGTH: 1000
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: \`Password must be at least \${APP_CONSTANTS.MIN_PASSWORD_LENGTH} characters long.\`,
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  OFFLINE_ERROR: 'This action requires an internet connection.'
} as const;
EOF
    
    cat > src/calculations.ts << EOF
// =============================================================================
// Solar Calculations - Shared Business Logic
// =============================================================================

import { SOLAR_CONSTANTS } from './constants';
import type { SolarSystemSpecs, PropertyDetails } from './types';

export class SolarCalculator {
  /**
   * Calculate estimated annual energy production
   */
  static calculateAnnualProduction(
    systemCapacityKw: number,
    peakSunHours: number = SOLAR_CONSTANTS.PEAK_SUN_HOURS.default,
    systemEfficiency: number = SOLAR_CONSTANTS.AVERAGE_PANEL_EFFICIENCY
  ): number {
    // kW × peak sun hours × days per year × system efficiency
    return systemCapacityKw * peakSunHours * 365 * systemEfficiency;
  }

  /**
   * Calculate system size needed for energy offset
   */
  static calculateSystemSizeForOffset(
    annualUsageKwh: number,
    offsetPercentage: number,
    peakSunHours: number = SOLAR_CONSTANTS.PEAK_SUN_HOURS.default
  ): number {
    const targetProduction = (annualUsageKwh * offsetPercentage) / 100;
    return targetProduction / (peakSunHours * 365 * SOLAR_CONSTANTS.AVERAGE_PANEL_EFFICIENCY);
  }

  /**
   * Calculate estimated system cost
   */
  static calculateSystemCost(
    systemCapacityKw: number,
    costPerWatt: number = SOLAR_CONSTANTS.COST_PER_WATT_RANGE.average
  ): number {
    return systemCapacityKw * 1000 * costPerWatt;
  }

  /**
   * Calculate federal tax credit (30% through 2032)
   */
  static calculateFederalTaxCredit(systemCost: number): number {
    return systemCost * 0.30;
  }

  /**
   * Calculate payback period in years
   */
  static calculatePaybackPeriod(
    systemCost: number,
    annualSavings: number,
    incentives: number = 0
  ): number {
    if (annualSavings <= 0) return Infinity;
    return (systemCost - incentives) / annualSavings;
  }

  /**
   * Calculate 25-year net present value
   */
  static calculateNPV(
    systemCost: number,
    annualSavings: number,
    incentives: number = 0,
    discountRate: number = 0.06,
    years: number = 25
  ): number {
    let npv = -systemCost + incentives;
    
    for (let year = 1; year <= years; year++) {
      const degradationFactor = Math.pow(1 - SOLAR_CONSTANTS.SYSTEM_DEGRADATION_RATE, year - 1);
      const yearSavings = annualSavings * degradationFactor;
      npv += yearSavings / Math.pow(1 + discountRate, year);
    }
    
    return npv;
  }

  /**
   * Get peak sun hours for location
   */
  static getPeakSunHours(state?: string): number {
    if (!state) return SOLAR_CONSTANTS.PEAK_SUN_HOURS.default;
    return SOLAR_CONSTANTS.PEAK_SUN_HOURS[state as keyof typeof SOLAR_CONSTANTS.PEAK_SUN_HOURS] 
           || SOLAR_CONSTANTS.PEAK_SUN_HOURS.default;
  }

  /**
   * Calculate recommended panel count
   */
  static calculatePanelCount(
    systemCapacityKw: number,
    panelWattage: number = 400
  ): number {
    return Math.ceil((systemCapacityKw * 1000) / panelWattage);
  }

  /**
   * Calculate roof area needed (square feet)
   */
  static calculateRoofAreaNeeded(panelCount: number): number {
    const averagePanelSqFt = 18; // Typical 400W panel size
    const spacingFactor = 1.3; // Account for spacing and access
    return panelCount * averagePanelSqFt * spacingFactor;
  }
}
EOF
    
    # Install dependencies
    npm install
    npm run build
    
    cd "${MOBILE_ROOT}/shared-packages"
    
    # Create solarify-services package
    log "INFO" "Creating solarify-services package..."
    mkdir -p solarify-services/src
    cd solarify-services
    
    cat > package.json << EOF
{
  "name": "@solarify/services",
  "version": "1.0.0",
  "description": "Firebase services and API layer for Solarify applications",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest"
  },
  "dependencies": {
    "@solarify/core": "file:../solarify-core",
    "firebase": "^11.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF
    
    cat > tsconfig.json << EOF
{
  "extends": "../solarify-core/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
EOF
    
    cat > src/index.ts << EOF
// Firebase services and API layer
export * from './firebase';
export * from './auth';
export * from './rfq';
export * from './quotes';
export * from './storage';
EOF
    
    cat > src/firebase.ts << EOF
// =============================================================================
// Firebase Configuration - Platform Agnostic
// =============================================================================

import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration (will be injected by platform)
let firebaseConfig: any;

export const setFirebaseConfig = (config: any) => {
  firebaseConfig = config;
};

export const getFirebaseApp = (): FirebaseApp => {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }
  
  if (!firebaseConfig) {
    throw new Error('Firebase config not set. Call setFirebaseConfig() first.');
  }
  
  return initializeApp(firebaseConfig);
};

export const getFirebaseFirestore = (): Firestore => {
  return getFirestore(getFirebaseApp());
};

export const getFirebaseAuth = (): Auth => {
  return getAuth(getFirebaseApp());
};

export const getFirebaseStorage = (): FirebaseStorage => {
  return getStorage(getFirebaseApp());
};
EOF
    
    npm install
    npm run build
    
    log "INFO" "Shared packages created successfully"
}

# Create React Native project
create_react_native_project() {
    log "INFO" "Creating React Native project..."
    
    cd "$MOBILE_ROOT"
    
    # Create React Native project
    if [[ ! -d "$APP_NAME" ]]; then
        npx react-native init "$APP_NAME" --version "$REACT_NATIVE_VERSION" --template react-native-template-typescript
        log "INFO" "React Native project created: $APP_NAME"
    else
        log "INFO" "React Native project already exists: $APP_NAME"
    fi
    
    cd "$APP_NAME"
    
    # Install core dependencies
    log "INFO" "Installing core React Native dependencies..."
    npm install --save \
        @react-native-firebase/app \
        @react-native-firebase/firestore \
        @react-native-firebase/auth \
        @react-native-firebase/messaging \
        @react-native-firebase/storage \
        @react-navigation/native \
        @react-navigation/stack \
        @react-navigation/bottom-tabs \
        react-native-screens \
        react-native-safe-area-context \
        react-native-gesture-handler \
        react-native-reanimated \
        @react-native-async-storage/async-storage \
        react-native-image-picker \
        @react-native-community/geolocation \
        @tanstack/react-query \
        react-hook-form \
        @hookform/resolvers
    
    # Install shared packages
    npm install --save file:../shared-packages/solarify-core file:../shared-packages/solarify-services
    
    # Install development dependencies
    npm install --save-dev \
        @types/react \
        @types/react-native \
        @react-native/metro-config \
        react-native-flipper \
        @react-native-community/eslint-config
    
    # iOS setup (if on macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log "INFO" "Setting up iOS dependencies..."
        cd ios
        pod install
        cd ..
    fi
    
    # Update package.json scripts
    log "INFO" "Updating package.json scripts..."
    npx json -I -f package.json -e 'this.scripts.postinstall = "cd ios && pod install && cd .."'
    npx json -I -f package.json -e 'this.scripts["build:ios"] = "react-native build-ios"'
    npx json -I -f package.json -e 'this.scripts["build:android"] = "react-native build-android"'
    
    log "INFO" "React Native project setup completed"
}

# Create project structure
create_project_structure() {
    log "INFO" "Creating project structure..."
    
    cd "${MOBILE_ROOT}/${APP_NAME}"
    
    # Create main source directories
    mkdir -p src/{components,screens,navigation,services,hooks,utils,types,constants}
    mkdir -p src/components/{ui,forms,solar}
    mkdir -p src/screens/{auth,homeowner,installer,supplier,common}
    
    # Create initial files
    cat > src/types/index.ts << EOF
// Mobile-specific types
export * from '@solarify/core';

// Platform-specific extensions
export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface MobilePhoto {
  uri: string;
  type: string;
  fileName?: string;
  fileSize?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}
EOF
    
    cat > src/constants/config.ts << EOF
// Mobile app configuration
export const CONFIG = {
  APP_NAME: 'Solarify',
  VERSION: '1.0.0',
  API_BASE_URL: __DEV__ ? 'https://solarify-staging.web.app/api' : 'https://solarify-prod.web.app/api',
  FIREBASE_CONFIG: {
    // Will be populated during Firebase setup
  },
  CAMERA: {
    QUALITY: 0.8,
    MAX_WIDTH: 1024,
    MAX_HEIGHT: 1024,
  },
  LOCATION: {
    ACCURACY: 'high' as const,
    TIMEOUT: 15000,
    MAX_AGE: 60000,
  },
  OFFLINE: {
    SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_STORAGE_SIZE: 100 * 1024 * 1024, // 100MB
  }
} as const;
EOF
    
    cat > src/services/firebase.service.ts << EOF
// Mobile Firebase service implementation
import { setFirebaseConfig } from '@solarify/services';
import { CONFIG } from '../constants/config';

// Initialize Firebase with mobile-specific configuration
export const initializeFirebase = () => {
  setFirebaseConfig(CONFIG.FIREBASE_CONFIG);
};
EOF
    
    cat > src/App.tsx << EOF
/**
 * Solarify Mobile App
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeFirebase } from './services/firebase.service';
import { AppNavigator } from './navigation/AppNavigator';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App(): JSX.Element {
  useEffect(() => {
    // Initialize Firebase
    initializeFirebase();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}

export default App;
EOF
    
    cat > src/navigation/AppNavigator.tsx << EOF
// Main app navigation
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import screens (to be created)
// import { HomeScreen } from '../screens/common/HomeScreen';
// import { AuthScreen } from '../screens/auth/AuthScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Solarify' }}
      />
    </Stack.Navigator>
  );
};

// Placeholder component
const HomeScreen: React.FC = () => {
  const { Text, View, StyleSheet } = require('react-native');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Solarify Mobile!</Text>
      <Text style={styles.subtitle}>Solar marketplace at your fingertips</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
EOF
    
    log "INFO" "Project structure created successfully"
}

# Create development documentation
create_documentation() {
    log "INFO" "Creating development documentation..."
    
    mkdir -p "${MOBILE_ROOT}/docs"
    
    cat > "${MOBILE_ROOT}/docs/getting-started.md" << EOF
# Getting Started with Solarify Mobile Development

## Prerequisites

- Node.js 18+
- React Native development environment
- iOS: Xcode 14+ (macOS only)
- Android: Android Studio with SDK 29+

## Quick Start

1. **Setup development environment:**
   \`\`\`bash
   cd mobile
   ./scripts/setup-mobile-development.sh
   \`\`\`

2. **Start development server:**
   \`\`\`bash
   cd SolarifyMobile
   npm start
   \`\`\`

3. **Run on devices:**
   \`\`\`bash
   # iOS (macOS only)
   npm run ios
   
   # Android
   npm run android
   \`\`\`

## Development Workflow

1. **Shared Code Changes:**
   - Make changes in \`shared-packages/\`
   - Run \`npm run build\` in the package directory
   - Changes are automatically picked up by the mobile app

2. **Mobile App Changes:**
   - Edit files in \`SolarifyMobile/src/\`
   - Hot reload will update the app automatically

3. **Testing:**
   \`\`\`bash
   npm test                 # Unit tests
   npm run test:e2e        # End-to-end tests
   npm run lint            # Code linting
   \`\`\`

## Firebase Setup

1. Create Firebase projects for iOS and Android
2. Download configuration files:
   - iOS: \`GoogleService-Info.plist\` → \`ios/SolarifyMobile/\`
   - Android: \`google-services.json\` → \`android/app/\`
3. Update \`src/constants/config.ts\` with Firebase configuration

## Building for Production

\`\`\`bash
# iOS
npm run build:ios

# Android
npm run build:android
\`\`\`

## Debugging

- **Flipper:** Integrated debugging tool
- **React Native Debugger:** Standalone debugging application
- **Device logs:** \`react-native log-ios\` or \`react-native log-android\`

## Common Issues

1. **Metro bundler issues:** Clear cache with \`npm start -- --reset-cache\`
2. **iOS build issues:** Clean build with \`cd ios && xcodebuild clean\`
3. **Android build issues:** Clean with \`cd android && ./gradlew clean\`

## Architecture

- **Shared Packages:** Business logic shared between web and mobile
- **Platform-Specific:** UI components and native integrations
- **Firebase:** Backend services and real-time data
- **Offline-First:** Local data storage with background sync
EOF
    
    cat > "${MOBILE_ROOT}/docs/project-structure.md" << EOF
# Solarify Mobile Project Structure

## Overview

\`\`\`
mobile/
├── shared-packages/              # Shared code between web and mobile
│   ├── solarify-core/           # Core types, schemas, calculations
│   ├── solarify-services/       # Firebase services and API layer
│   └── solarify-utils/          # Shared utilities (future)
├── SolarifyMobile/              # React Native application
│   ├── src/
│   │   ├── components/          # React Native components
│   │   │   ├── ui/              # Base UI components (buttons, inputs)
│   │   │   ├── forms/           # Form-specific components
│   │   │   └── solar/           # Solar industry components
│   │   ├── screens/             # Application screens
│   │   │   ├── auth/            # Authentication screens
│   │   │   ├── homeowner/       # Homeowner-specific screens
│   │   │   ├── installer/       # Installer-specific screens
│   │   │   ├── supplier/        # Supplier-specific screens
│   │   │   └── common/          # Shared screens
│   │   ├── navigation/          # Navigation configuration
│   │   ├── services/            # Platform-specific services
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Mobile-specific utilities
│   │   ├── types/               # TypeScript type definitions
│   │   └── constants/           # App constants and configuration
│   ├── ios/                     # iOS-specific code and configuration
│   ├── android/                 # Android-specific code and configuration
│   └── package.json
├── scripts/                     # Setup and build scripts
├── docs/                        # Documentation
└── README.md
\`\`\`

## Key Directories

### shared-packages/
Contains business logic and services shared between the web and mobile applications. This maximizes code reuse and ensures consistency.

- **solarify-core:** Types, schemas, calculations, constants
- **solarify-services:** Firebase integration and API services

### SolarifyMobile/src/
Contains the React Native application code.

- **components/:** Reusable React Native components organized by purpose
- **screens/:** Full-screen components organized by user type
- **navigation/:** Navigation structure and routing
- **services/:** Platform-specific service implementations
- **hooks/:** Custom React hooks for mobile-specific functionality

## Code Organization Principles

1. **Shared First:** Business logic goes in shared packages
2. **Platform-Specific:** UI and native features stay in the mobile app
3. **User-Centric:** Screens organized by user role (homeowner, installer, supplier)
4. **Feature-Based:** Components grouped by functionality
5. **Type-Safe:** Full TypeScript coverage with strict types

## Import Structure

\`\`\`typescript
// Shared packages (business logic)
import { SolarCalculator, RFQData } from '@solarify/core';
import { FirebaseService } from '@solarify/services';

// Mobile app code
import { Button } from '../components/ui/Button';
import { RFQForm } from '../components/forms/RFQForm';
import { useGeolocation } from '../hooks/useGeolocation';
\`\`\`

## File Naming Conventions

- **Components:** PascalCase (e.g., \`Button.tsx\`)
- **Screens:** PascalCase with Screen suffix (e.g., \`HomeScreen.tsx\`)
- **Hooks:** camelCase with use prefix (e.g., \`useGeolocation.ts\`)
- **Services:** camelCase with service suffix (e.g., \`firebase.service.ts\`)
- **Types:** camelCase with types suffix (e.g., \`navigation.types.ts\`)
EOF
    
    log "INFO" "Documentation created successfully"
}

# Main setup function
main() {
    log "INFO" "Starting Solarify mobile development setup..."
    log "INFO" "Setup log: $LOG_FILE"
    
    # Run setup steps
    check_prerequisites
    create_shared_packages
    create_react_native_project
    create_project_structure
    create_documentation
    
    log "INFO" "Mobile development setup completed successfully! 🎉"
    
    echo ""
    echo "============================================================================="
    echo "                    SOLARIFY MOBILE DEVELOPMENT SETUP COMPLETE"
    echo "============================================================================="
    echo ""
    echo "📱 React Native project created: ${MOBILE_ROOT}/${APP_NAME}"
    echo "📦 Shared packages configured for code reuse"
    echo "🔧 Development environment ready"
    echo ""
    echo "Next Steps:"
    echo "1. Configure Firebase for mobile apps (iOS/Android)"
    echo "2. Update Firebase configuration in src/constants/config.ts"
    echo "3. Start development:"
    echo "   cd ${MOBILE_ROOT}/${APP_NAME}"
    echo "   npm start"
    echo "   npm run ios    # or npm run android"
    echo ""
    echo "📖 Documentation: ${MOBILE_ROOT}/docs/"
    echo "🔧 Setup log: $LOG_FILE"
    echo "============================================================================="
}

# Run main function
main "$@"