/**
 * AccessibilityProvider for managing global accessibility state and utilities
 * Provides WCAG 2.1 AA compliant accessibility features throughout the app
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  announceToScreenReader, 
  initializeScreenReader, 
  useScreenReader 
} from '@/lib/accessibility/screen-reader';
import { 
  focusFirstElement, 
  focusLastElement, 
  createFocusTrap, 
  skipToMainContent 
} from '@/lib/accessibility/focus-management';
import { 
  initializeSkipLinks, 
  prefersReducedMotion 
} from '@/lib/accessibility/keyboard-navigation';
import type { AccessibilityContextValue, FocusTrapOptions } from '@/lib/accessibility/types';

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [prefersReducedMotionState, setPrefersReducedMotionState] = useState(false);
  const screenReader = useScreenReader();

  // Initialize accessibility features
  useEffect(() => {
    // Initialize screen reader utilities
    initializeScreenReader();
    
    // Initialize skip links
    initializeSkipLinks();
    
    // Check for reduced motion preference
    const updateReducedMotionPreference = () => {
      setPrefersReducedMotionState(prefersReducedMotion());
    };
    
    updateReducedMotionPreference();
    
    // Listen for changes in motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', updateReducedMotionPreference);
    
    return () => {
      mediaQuery.removeEventListener('change', updateReducedMotionPreference);
    };
  }, []);

  const announceToScreenReaderCallback = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    announceToScreenReader(message, priority);
  }, []);

  const focusFirstElementCallback = useCallback((container: HTMLElement) => {
    focusFirstElement(container);
  }, []);

  const focusLastElementCallback = useCallback((container: HTMLElement) => {
    focusLastElement(container);
  }, []);

  const trapFocus = useCallback((container: HTMLElement, options?: FocusTrapOptions) => {
    const trap = createFocusTrap(container, options);
    trap.activate();
    
    return () => {
      trap.deactivate();
    };
  }, []);

  const skipToContentCallback = useCallback(() => {
    skipToMainContent();
  }, []);

  const contextValue: AccessibilityContextValue = {
    announceToScreenReader: announceToScreenReaderCallback,
    prefersReducedMotion: prefersReducedMotionState,
    focusFirstElement: focusFirstElementCallback,
    focusLastElement: focusLastElementCallback,
    trapFocus,
    skipToContent: skipToContentCallback
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook to access accessibility utilities
 */
export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  
  return context;
}

/**
 * Higher-order component to provide accessibility features to any component
 */
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const AccessibleComponent = (props: P) => {
    const accessibility = useAccessibility();
    
    return <Component {...props} accessibility={accessibility} />;
  };
  
  AccessibleComponent.displayName = `withAccessibility(${Component.displayName || Component.name})`;
  
  return AccessibleComponent;
}

/**
 * Hook for managing announcements with automatic cleanup
 */
export function useAccessibilityAnnouncements() {
  const { announceToScreenReader } = useAccessibility();
  
  const announceError = useCallback((message: string) => {
    announceToScreenReader(`Error: ${message}`, 'assertive');
  }, [announceToScreenReader]);
  
  const announceSuccess = useCallback((message: string) => {
    announceToScreenReader(`Success: ${message}`, 'polite');
  }, [announceToScreenReader]);
  
  const announceLoading = useCallback((message: string = 'Loading') => {
    announceToScreenReader(message, 'polite');
  }, [announceToScreenReader]);
  
  const announceNavigation = useCallback((page: string) => {
    announceToScreenReader(`Navigated to ${page}`, 'polite');
  }, [announceToScreenReader]);
  
  return {
    announceError,
    announceSuccess,
    announceLoading,
    announceNavigation,
    announce: announceToScreenReader
  };
}

/**
 * Hook for managing focus with accessibility considerations
 */
export function useAccessibilityFocus() {
  const { focusFirstElement, focusLastElement, trapFocus } = useAccessibility();
  
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);
  
  const storeFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      setFocusHistory(prev => [...prev, activeElement]);
    }
  }, []);
  
  const restoreFocus = useCallback(() => {
    const lastFocused = focusHistory[focusHistory.length - 1];
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
      setFocusHistory(prev => prev.slice(0, -1));
    }
  }, [focusHistory]);
  
  const clearFocusHistory = useCallback(() => {
    setFocusHistory([]);
  }, []);
  
  return {
    focusFirstElement,
    focusLastElement,
    trapFocus,
    storeFocus,
    restoreFocus,
    clearFocusHistory
  };
}

/**
 * Hook for accessibility-aware animations and transitions
 */
export function useAccessibilityMotion() {
  const { prefersReducedMotion } = useAccessibility();
  
  const getTransitionDuration = useCallback((normalDuration: number) => {
    return prefersReducedMotion ? 0 : normalDuration;
  }, [prefersReducedMotion]);
  
  const getAnimationConfig = useCallback((config: {
    duration?: number;
    easing?: string;
    delay?: number;
  }) => {
    if (prefersReducedMotion) {
      return {
        ...config,
        duration: 0,
        delay: 0
      };
    }
    return config;
  }, [prefersReducedMotion]);
  
  return {
    prefersReducedMotion,
    getTransitionDuration,
    getAnimationConfig
  };
}

/**
 * Hook for managing landmark regions
 */
export function useLandmarkRegions() {
  const { announceToScreenReader } = useAccessibility();
  
  const announceRegionEntry = useCallback((regionName: string, regionType: string) => {
    announceToScreenReader(`Entered ${regionType}: ${regionName}`, 'polite');
  }, [announceToScreenReader]);
  
  const createLandmarkProps = useCallback((
    role: string, 
    label?: string, 
    describedBy?: string
  ) => {
    const props: Record<string, string> = { role };
    
    if (label) {
      props['aria-label'] = label;
    }
    
    if (describedBy) {
      props['aria-describedby'] = describedBy;
    }
    
    return props;
  }, []);
  
  return {
    announceRegionEntry,
    createLandmarkProps
  };
}