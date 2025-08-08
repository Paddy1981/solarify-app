// =============================================================================
// Mobile App TypeScript Type Definitions
// =============================================================================
// Core types for navigation, authentication, and app-specific interfaces
// =============================================================================

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// =============================================================================
// Navigation Types
// =============================================================================

export type RootStackParamList = {
  // Authentication Flow
  AuthScreen: undefined;
  ForgotPassword: undefined;
  EmailVerification: { email: string };
  ProfileSetup: undefined;
  
  // Main Application
  MainTabs: undefined;
  
  // RFQ Flow
  CreateRFQ: undefined;
  RFQDetails: { rfqId: string };
  RFQEdit: { rfqId: string };
  
  // Quote Flow
  QuoteDetails: { quoteId: string };
  CompareQuotes: { rfqId: string };
  
  // Profile & Settings
  Profile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  NotificationSettings: undefined;
  
  // Installer-specific
  BrowseRFQs: undefined;
  CreateQuote: { rfqId: string };
  
  // Camera & Photos
  CameraScreen: { 
    purpose: 'roof_photo' | 'electrical_panel' | 'property_overview';
    rfqId?: string;
  };
  PhotoPreview: { 
    photoUri: string;
    purpose: string;
    rfqId?: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  RFQs: undefined;
  Quotes: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type NavigationProps = {
  navigation: StackNavigationProp<RootStackParamList>;
  route?: RouteProp<RootStackParamList>;
};

// =============================================================================
// Authentication Types
// =============================================================================

export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
}

export interface BiometricSettings {
  enabled: boolean;
  type: 'fingerprint' | 'face_id' | 'touch_id' | 'iris' | 'face';
  lastUsed?: Date;
}

// =============================================================================
// RFQ Types (Mobile-Optimized)
// =============================================================================

export interface MobileRFQData {
  id?: string;
  homeowner_id: string;
  
  // Property Information
  property: {
    address: string;
    latitude: number;
    longitude: number;
    property_type: 'single_family' | 'multi_family' | 'condo' | 'townhouse';
    roof_type: 'asphalt_shingle' | 'tile' | 'metal' | 'flat' | 'other';
    roof_age?: number;
    square_footage?: number;
    stories?: number;
  };
  
  // Energy Information
  energy_usage: {
    annual_kwh: number;
    monthly_bill_average: number;
    utility_company: string;
    rate_structure?: 'tiered' | 'time_of_use' | 'flat';
  };
  
  // System Preferences
  system_preferences: {
    desired_offset: number; // 50-150%
    budget_range: {
      min: number;
      max: number;
    };
    financing_interest: string[];
    installation_timeline: 'asap' | '3_months' | '6_months' | '1_year';
  };
  
  // Photos (Mobile-specific)
  photos: {
    roof_photos: string[];
    electrical_panel_photos: string[];
    property_overview: string[];
  };
  
  // Status & Metadata
  status: 'draft' | 'active' | 'quoted' | 'selected' | 'installed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
  
  // Mobile-specific fields
  location_data?: {
    gps_accuracy: number;
    altitude?: number;
    heading?: number;
  };
}

// =============================================================================
// Quote Types (Mobile-Optimized)
// =============================================================================

export interface MobileQuoteData {
  id?: string;
  rfq_id: string;
  installer_id: string;
  installer_profile: {
    company_name: string;
    license_number: string;
    rating: number;
    reviews_count: number;
    years_experience: number;
    certifications: string[];
  };
  
  // System Design
  system_design: {
    capacity_kw: number;
    panel_count: number;
    panel_specs: {
      brand: string;
      model: string;
      wattage: number;
      efficiency: number;
      warranty_years: number;
    };
    inverter_specs: {
      type: 'string' | 'power_optimizers' | 'micro_inverters';
      brand: string;
      model: string;
      efficiency: number;
      warranty_years: number;
    };
    mounting_system: string;
    estimated_production_kwh_year: number;
    estimated_offset_percentage: number;
  };
  
  // Pricing
  pricing: {
    gross_price: number;
    incentives: {
      federal_tax_credit: number;
      state_incentives: number;
      utility_rebates: number;
      local_incentives: number;
    };
    net_price: number;
    price_per_watt: number;
    financing_options: Array<{
      type: 'cash' | 'loan' | 'lease' | 'ppa';
      provider?: string;
      down_payment?: number;
      monthly_payment?: number;
      term_years?: number;
      interest_rate?: number;
      escalator?: number;
    }>;
  };
  
  // Timeline & Installation
  project_details: {
    installation_timeline: string;
    permits_included: boolean;
    warranty_details: {
      workmanship_years: number;
      equipment_years: number;
      performance_guarantee_years: number;
    };
    maintenance_included: boolean;
    monitoring_included: boolean;
  };
  
  // Status & Metadata
  status: 'draft' | 'submitted' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  valid_until: Date;
  created_at: Date;
  updated_at: Date;
  
  // Mobile-specific
  push_notification_sent?: boolean;
}

// =============================================================================
// Camera & Photo Types
// =============================================================================

export interface PhotoMetadata {
  uri: string;
  width: number;
  height: number;
  size: number; // bytes
  type: 'image/jpeg' | 'image/png' | 'image/heic';
  timestamp: Date;
  gps_location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  camera_settings?: {
    flash: boolean;
    focus_mode: string;
    exposure: number;
  };
}

export interface PhotoUploadProgress {
  id: string;
  uri: string;
  progress: number; // 0-100
  status: 'queued' | 'uploading' | 'completed' | 'error';
  error_message?: string;
}

// =============================================================================
// App State Types
// =============================================================================

export interface AppState {
  // Authentication
  auth: {
    user: AuthUser | null;
    profile: any | null;
    loading: boolean;
    error?: string;
    biometric_settings: BiometricSettings;
  };
  
  // Navigation
  navigation: {
    current_tab: keyof MainTabParamList;
    route_history: string[];
  };
  
  // Data
  rfqs: {
    items: MobileRFQData[];
    loading: boolean;
    error?: string;
  };
  
  quotes: {
    items: MobileQuoteData[];
    loading: boolean;
    error?: string;
  };
  
  // Offline Support
  offline: {
    is_online: boolean;
    pending_uploads: PhotoUploadProgress[];
    sync_status: 'idle' | 'syncing' | 'error';
    last_sync: Date | null;
  };
}

// =============================================================================
// Device & Platform Types
// =============================================================================

export interface DeviceInfo {
  platform: 'ios' | 'android';
  version: string;
  model: string;
  screen_dimensions: {
    width: number;
    height: number;
    scale: number;
  };
  capabilities: {
    camera: boolean;
    gps: boolean;
    biometric: boolean;
    push_notifications: boolean;
  };
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    request_id: string;
    version: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// =============================================================================
// Notification Types
// =============================================================================

export interface PushNotification {
  id: string;
  type: 'quote_received' | 'rfq_viewed' | 'installation_update' | 'system_alert';
  title: string;
  body: string;
  data?: {
    rfq_id?: string;
    quote_id?: string;
    deep_link?: string;
  };
  received_at: Date;
  read: boolean;
}