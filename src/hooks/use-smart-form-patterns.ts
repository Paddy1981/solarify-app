"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { logger } from '@/lib/error-handling/logger';

// Smart defaults configuration
export interface SmartDefaultsConfig {
  enableGeoLocation?: boolean;
  enableBrowserData?: boolean;
  enableUserProfileData?: boolean;
  enableContextualDefaults?: boolean;
  enableIntelligentPrefill?: boolean;
}

// Progressive disclosure configuration
export interface ProgressiveDisclosureConfig {
  enabled?: boolean;
  revealOnInteraction?: boolean;
  showAdvancedOptions?: boolean;
  collapseCompleted?: boolean;
  animationDuration?: number;
}

// Form analytics configuration
export interface FormAnalyticsConfig {
  enabled?: boolean;
  trackFieldInteractions?: boolean;
  trackValidationErrors?: boolean;
  trackAbandonmentPoints?: boolean;
  trackCompletionTime?: boolean;
  sampleRate?: number;
}

// Smart defaults data structure
export interface SmartDefaults {
  [fieldName: string]: {
    value: any;
    confidence: number; // 0-1 scale
    source: 'geo' | 'browser' | 'profile' | 'context' | 'ai';
    reasoning?: string;
  };
}

// Form analytics data
export interface FormAnalytics {
  formId: string;
  sessionId: string;
  startTime: Date;
  fieldInteractions: FieldInteraction[];
  validationErrors: ValidationError[];
  abandonmentPoint?: string;
  completionTime?: number;
  completedFields: string[];
  totalFields: number;
}

export interface FieldInteraction {
  fieldName: string;
  action: 'focus' | 'blur' | 'change' | 'validation';
  timestamp: Date;
  value?: any;
  timeSpent?: number;
}

export interface ValidationError {
  fieldName: string;
  errorType: string;
  message: string;
  timestamp: Date;
  attemptNumber: number;
}

// Main hook for smart form patterns
export function useSmartFormPatterns<TFieldValues extends FieldValues = FieldValues>({
  form,
  formId,
  smartDefaultsConfig = {},
  progressiveDisclosureConfig = {},
  analyticsConfig = {}
}: {
  form: UseFormReturn<TFieldValues>;
  formId: string;
  smartDefaultsConfig?: SmartDefaultsConfig;
  progressiveDisclosureConfig?: ProgressiveDisclosureConfig;
  analyticsConfig?: FormAnalyticsConfig;
}) {
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults>({});
  const [revealedSections, setRevealedSections] = useState<Set<string>>(new Set());
  const [analytics, setAnalytics] = useState<FormAnalytics>({
    formId,
    sessionId: generateSessionId(),
    startTime: new Date(),
    fieldInteractions: [],
    validationErrors: [],
    completedFields: [],
    totalFields: 0
  });

  const fieldFocusTimes = useRef<Map<string, Date>>(new Map());
  const validationAttempts = useRef<Map<string, number>>(new Map());

  // Generate smart defaults based on configuration
  const generateSmartDefaults = useCallback(async () => {
    const defaults: SmartDefaults = {};

    // Geographic location defaults
    if (smartDefaultsConfig.enableGeoLocation) {
      try {
        const geoDefaults = await getGeoLocationDefaults();
        Object.assign(defaults, geoDefaults);
      } catch (error) {
        console.warn('Failed to get geo location defaults:', error);
      }
    }

    // Browser data defaults
    if (smartDefaultsConfig.enableBrowserData) {
      const browserDefaults = getBrowserDataDefaults();
      Object.assign(defaults, browserDefaults);
    }

    // User profile defaults (if user is logged in)
    if (smartDefaultsConfig.enableUserProfileData) {
      try {
        const profileDefaults = await getUserProfileDefaults();
        Object.assign(defaults, profileDefaults);
      } catch (error) {
        console.warn('Failed to get user profile defaults:', error);
      }
    }

    // Contextual defaults based on form type
    if (smartDefaultsConfig.enableContextualDefaults) {
      const contextualDefaults = getContextualDefaults(formId);
      Object.assign(defaults, contextualDefaults);
    }

    setSmartDefaults(defaults);
    return defaults;
  }, [formId, smartDefaultsConfig]);

  // Apply smart defaults to form
  const applySmartDefaults = useCallback((defaults: SmartDefaults) => {
    Object.entries(defaults).forEach(([fieldName, defaultData]) => {
      const currentValue = form.getValues(fieldName as any);
      
      // Only apply if field is empty and confidence is high enough
      if (!currentValue && defaultData.confidence > 0.7) {
        form.setValue(fieldName as any, defaultData.value);
      }
    });
  }, [form]);

  // Progressive disclosure management
  const revealSection = useCallback((sectionId: string) => {
    setRevealedSections(prev => new Set([...prev, sectionId]));
    
    // Track analytics
    if (analyticsConfig.enabled && analyticsConfig.trackFieldInteractions) {
      trackFieldInteraction({
        fieldName: `section_${sectionId}`,
        action: 'focus',
        timestamp: new Date()
      });
    }
  }, [analyticsConfig]);

  const hideSection = useCallback((sectionId: string) => {
    setRevealedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  }, []);

  const isSectionRevealed = useCallback((sectionId: string) => {
    return revealedSections.has(sectionId);
  }, [revealedSections]);

  // Analytics tracking functions
  const trackFieldInteraction = useCallback((interaction: FieldInteraction) => {
    if (!analyticsConfig.enabled || !analyticsConfig.trackFieldInteractions) return;
    
    setAnalytics(prev => ({
      ...prev,
      fieldInteractions: [...prev.fieldInteractions, interaction]
    }));
  }, [analyticsConfig]);

  const trackValidationError = useCallback((fieldName: string, errorType: string, message: string) => {
    if (!analyticsConfig.enabled || !analyticsConfig.trackValidationErrors) return;
    
    const attemptNumber = (validationAttempts.current.get(fieldName) || 0) + 1;
    validationAttempts.current.set(fieldName, attemptNumber);
    
    const error: ValidationError = {
      fieldName,
      errorType,
      message,
      timestamp: new Date(),
      attemptNumber
    };
    
    setAnalytics(prev => ({
      ...prev,
      validationErrors: [...prev.validationErrors, error]
    }));
  }, [analyticsConfig]);

  const trackFormCompletion = useCallback(() => {
    const completionTime = Date.now() - analytics.startTime.getTime();
    
    setAnalytics(prev => ({
      ...prev,
      completionTime
    }));
    
    // Send analytics to backend
    if (analyticsConfig.enabled) {
      sendFormAnalytics({
        ...analytics,
        completionTime
      });
    }
  }, [analytics, analyticsConfig]);

  // Field interaction tracking
  useEffect(() => {
    if (!analyticsConfig.enabled || !analyticsConfig.trackFieldInteractions) return;

    const subscription = form.watch((data, { name, type }) => {
      if (!name) return;

      const fieldName = name as string;
      const now = new Date();

      // Track field changes
      if (type === 'change') {
        trackFieldInteraction({
          fieldName,
          action: 'change',
          timestamp: now,
          value: data[fieldName]
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, analyticsConfig, trackFieldInteraction]);

  // Initialize smart defaults
  useEffect(() => {
    generateSmartDefaults().then(defaults => {
      if (Object.keys(defaults).length > 0) {
        applySmartDefaults(defaults);
      }
    });
  }, [generateSmartDefaults, applySmartDefaults]);

  // Progressive disclosure automation
  useEffect(() => {
    if (!progressiveDisclosureConfig.enabled || !progressiveDisclosureConfig.revealOnInteraction) return;

    const handleFieldFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const fieldName = target.getAttribute('name');
      
      if (fieldName) {
        fieldFocusTimes.current.set(fieldName, new Date());
        
        // Auto-reveal related sections
        const relatedSections = getRelatedSections(fieldName);
        relatedSections.forEach(sectionId => {
          revealSection(sectionId);
        });
      }
    };

    const handleFieldBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const fieldName = target.getAttribute('name');
      
      if (fieldName) {
        const focusTime = fieldFocusTimes.current.get(fieldName);
        if (focusTime) {
          const timeSpent = Date.now() - focusTime.getTime();
          trackFieldInteraction({
            fieldName,
            action: 'blur',
            timestamp: new Date(),
            timeSpent
          });
        }
      }
    };

    document.addEventListener('focusin', handleFieldFocus);
    document.addEventListener('focusout', handleFieldBlur);

    return () => {
      document.removeEventListener('focusin', handleFieldFocus);
      document.removeEventListener('focusout', handleFieldBlur);
    };
  }, [progressiveDisclosureConfig, revealSection, trackFieldInteraction]);

  return {
    // Smart defaults
    smartDefaults,
    generateSmartDefaults,
    applySmartDefaults,
    
    // Progressive disclosure
    revealSection,
    hideSection,
    isSectionRevealed,
    revealedSections,
    
    // Analytics
    analytics,
    trackFieldInteraction,
    trackValidationError,
    trackFormCompletion,
    
    // Utilities
    getSmartDefaultForField: (fieldName: string) => smartDefaults[fieldName],
    getFieldAnalytics: (fieldName: string) => ({
      interactions: analytics.fieldInteractions.filter(i => i.fieldName === fieldName),
      errors: analytics.validationErrors.filter(e => e.fieldName === fieldName),
      timeSpent: analytics.fieldInteractions
        .filter(i => i.fieldName === fieldName && i.timeSpent)
        .reduce((total, i) => total + (i.timeSpent || 0), 0)
    })
  };
}

// Helper functions for smart defaults

async function getGeoLocationDefaults(): Promise<SmartDefaults> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Mock reverse geocoding - in real app, use Google Maps API or similar
          const { latitude, longitude } = position.coords;
          
          const defaults: SmartDefaults = {
            country: {
              value: 'United States',
              confidence: 0.9,
              source: 'geo',
              reasoning: 'Detected from GPS location'
            },
            state: {
              value: 'California',
              confidence: 0.8,
              source: 'geo',
              reasoning: 'Estimated from coordinates'
            },
            timezone: {
              value: Intl.DateTimeFormat().resolvedOptions().timeZone,
              confidence: 1.0,
              source: 'geo',
              reasoning: 'Browser timezone'
            }
          };
          
          resolve(defaults);
        } catch (error) {
          reject(error);
        }
      },
      (error) => reject(error),
      { timeout: 10000 }
    );
  });
}

function getBrowserDataDefaults(): SmartDefaults {
  const defaults: SmartDefaults = {};
  
  // Language preference
  defaults.language = {
    value: navigator.language.split('-')[0],
    confidence: 0.9,
    source: 'browser',
    reasoning: 'Browser language setting'
  };
  
  // Timezone
  defaults.timezone = {
    value: Intl.DateTimeFormat().resolvedOptions().timeZone,
    confidence: 1.0,
    source: 'browser',
    reasoning: 'Browser timezone'
  };
  
  // Currency (based on locale)
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const currency = getCurrencyFromLocale(locale);
  if (currency) {
    defaults.currency = {
      value: currency,
      confidence: 0.7,
      source: 'browser',
      reasoning: 'Inferred from browser locale'
    };
  }
  
  return defaults;
}

async function getUserProfileDefaults(): Promise<SmartDefaults> {
  // Mock user profile data - in real app, fetch from your user service
  try {
    const userProfile = await fetchUserProfile();
    
    const defaults: SmartDefaults = {};
    
    if (userProfile.name) {
      defaults.name = {
        value: userProfile.name,
        confidence: 1.0,
        source: 'profile',
        reasoning: 'From user profile'
      };
    }
    
    if (userProfile.email) {
      defaults.email = {
        value: userProfile.email,
        confidence: 1.0,
        source: 'profile',
        reasoning: 'From user profile'
      };
    }
    
    if (userProfile.address) {
      defaults.address = {
        value: userProfile.address,
        confidence: 0.8,
        source: 'profile',
        reasoning: 'From user profile (may be outdated)'
      };
    }
    
    return defaults;
  } catch (error) {
    return {};
  }
}

function getContextualDefaults(formId: string): SmartDefaults {
  const defaults: SmartDefaults = {};
  
  // Solar-specific defaults
  if (formId.includes('solar')) {
    defaults.roofType = {
      value: 'asphalt_shingles',
      confidence: 0.6,
      source: 'context',
      reasoning: 'Most common roof type in residential solar'
    };
    
    defaults.shadingLevel = {
      value: 'minimal',
      confidence: 0.5,
      source: 'context',
      reasoning: 'Most solar installations have minimal shading'
    };
    
    defaults.timeline = {
      value: 'within_6_months',
      confidence: 0.4,
      source: 'context',
      reasoning: 'Common installation timeline'
    };
  }
  
  // RFQ specific defaults
  if (formId.includes('rfq')) {
    defaults.preferredContactMethod = {
      value: 'email',
      confidence: 0.7,
      source: 'context',
      reasoning: 'Most users prefer email contact'
    };
  }
  
  return defaults;
}

function getRelatedSections(fieldName: string): string[] {
  // Define which sections should be revealed based on field interactions
  const sectionMappings: Record<string, string[]> = {
    'monthlyBill': ['energy-usage', 'savings-estimate'],
    'address': ['location-details', 'solar-analysis'],
    'roofType': ['roof-details', 'installation-options'],
    'batteryInterest': ['battery-options', 'backup-power'],
    'budgetRange': ['financing-options', 'incentives']
  };
  
  return sectionMappings[fieldName] || [];
}

function getCurrencyFromLocale(locale: string): string | null {
  const currencyMappings: Record<string, string> = {
    'en-US': 'USD',
    'en-CA': 'CAD',
    'en-GB': 'GBP',
    'fr-FR': 'EUR',
    'de-DE': 'EUR',
    'ja-JP': 'JPY',
    'zh-CN': 'CNY'
  };
  
  return currencyMappings[locale] || null;
}

async function fetchUserProfile() {
  // Mock implementation - replace with actual API call
  return {
    name: 'John Doe',
    email: 'john@example.com',
    address: '123 Main St, San Francisco, CA 94105'
  };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function sendFormAnalytics(analytics: FormAnalytics) {
  // Mock implementation - replace with actual analytics service
  logger.debug('Sending form analytics', { 
    analytics,
    context: 'form_analytics'
  });
  
  // In real implementation, send to your analytics service
  try {
    await fetch('/api/analytics/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analytics)
    });
  } catch (error) {
    logger.warn('Failed to send form analytics', {
      error: error instanceof Error ? error.message : String(error),
      context: 'form_analytics'
    });
  }
}

// Hook for A/B testing form variants
export function useFormABTesting(formId: string, variants: string[]) {
  const [currentVariant, setCurrentVariant] = useState<string>('');
  
  useEffect(() => {
    // Simple hash-based variant assignment
    const userId = getUserId(); // Get user ID or session ID
    const hash = simpleHash(userId + formId);
    const variantIndex = hash % variants.length;
    setCurrentVariant(variants[variantIndex]);
  }, [formId, variants]);
  
  const trackVariantPerformance = useCallback((metric: string, value: any) => {
    // Track performance metrics for the current variant
    logger.debug('Tracking variant performance', {
      variant: currentVariant,
      metric,
      value,
      context: 'form_ab_testing'
    });
  }, [currentVariant]);
  
  return {
    currentVariant,
    trackVariantPerformance
  };
}

function getUserId(): string {
  // Get user ID from session, cookie, or generate one
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}