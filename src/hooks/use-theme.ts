/**
 * useTheme Hook
 * React hook for managing themes and accessibility preferences
 * Provides reactive theme switching with accessibility support
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  themeManager, 
  type ThemeVariant, 
  type AccessibilityPreferences,
  type UseTheme 
} from '@/lib/theme-system';

/**
 * Custom hook for theme management
 * 
 * @example
 * function ThemeSelector() {
 *   const { theme, setTheme, accessibility } = useTheme();
 *   
 *   return (
 *     <select value={theme} onChange={(e) => setTheme(e.target.value)}>
 *       <option value="light">Light</option>
 *       <option value="dark">Dark</option>
 *       <option value="solar-light">Solar Light</option>
 *     </select>
 *   );
 * }
 */
export function useTheme(): UseTheme {
  const [theme, setThemeState] = useState<ThemeVariant>(themeManager.getTheme());
  const [accessibility, setAccessibilityState] = useState<AccessibilityPreferences>(
    themeManager.getAccessibilityPreferences()
  );

  // Update theme
  const setTheme = useCallback((variant: ThemeVariant) => {
    themeManager.setTheme(variant);
    setThemeState(variant);
  }, []);

  // Update accessibility preferences
  const updateAccessibility = useCallback((preferences: Partial<AccessibilityPreferences>) => {
    themeManager.updateAccessibilityPreferences(preferences);
    setAccessibilityState(themeManager.getAccessibilityPreferences());
  }, []);

  // Get auto-selected theme based on system preferences
  const autoTheme = themeManager.autoSelectTheme();

  // Initialize and listen for system changes
  useEffect(() => {
    // Initialize theme manager
    themeManager.initialize();
    
    // Update state if theme changed externally
    setThemeState(themeManager.getTheme());
    setAccessibilityState(themeManager.getAccessibilityPreferences());
    
    // Listen for storage changes (theme changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'solarify-theme' && e.newValue) {
        const newTheme = e.newValue as ThemeVariant;
        themeManager.setTheme(newTheme);
        setThemeState(newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    theme,
    setTheme,
    accessibility,
    updateAccessibility,
    autoTheme,
  };
}

/**
 * Hook for theme-aware CSS classes
 * Returns classes that adapt to the current theme
 */
export function useThemeClasses() {
  const { theme, accessibility } = useTheme();

  return {
    // Base theme classes
    container: accessibility.highContrast ? 'high-contrast' : '',
    reduced: accessibility.reducedMotion ? 'reduce-motion' : '',
    large: accessibility.largeText ? 'large-text' : '',
    
    // Theme-specific utilities
    solarGradient: theme.includes('solar') 
      ? 'bg-gradient-to-r from-solar-primary to-solar-secondary' 
      : 'bg-gradient-to-r from-primary to-secondary',
    
    energyGradient: theme.includes('solar') 
      ? 'bg-gradient-to-r from-energy-primary to-energy-secondary'
      : 'bg-gradient-to-r from-secondary to-accent',
    
    // Text colors that work with current theme
    primaryText: accessibility.highContrast 
      ? 'text-foreground' 
      : 'text-primary',
    
    secondaryText: accessibility.highContrast 
      ? 'text-foreground' 
      : 'text-secondary',
    
    mutedText: accessibility.highContrast 
      ? 'text-foreground opacity-75' 
      : 'text-muted-foreground',
  };
}

/**
 * Hook for system color scheme detection
 */
export function useSystemColorScheme() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'no-preference'>('no-preference');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)');

    const updateColorScheme = () => {
      if (darkQuery.matches) {
        setColorScheme('dark');
      } else if (lightQuery.matches) {
        setColorScheme('light');
      } else {
        setColorScheme('no-preference');
      }
    };

    // Initial check
    updateColorScheme();

    // Listen for changes
    darkQuery.addEventListener('change', updateColorScheme);
    lightQuery.addEventListener('change', updateColorScheme);

    return () => {
      darkQuery.removeEventListener('change', updateColorScheme);
      lightQuery.removeEventListener('change', updateColorScheme);
    };
  }, []);

  return colorScheme;
}

/**
 * Hook for accessibility preference detection
 */
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    forcedColors: false,
    prefersColorScheme: 'no-preference',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const queries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      largeText: window.matchMedia('(min-resolution: 1.5dppx)'),
      forcedColors: window.matchMedia('(forced-colors: active)'),
      darkMode: window.matchMedia('(prefers-color-scheme: dark)'),
      lightMode: window.matchMedia('(prefers-color-scheme: light)'),
    };

    const updatePreferences = () => {
      setPreferences({
        reducedMotion: queries.reducedMotion.matches,
        highContrast: queries.highContrast.matches,
        largeText: queries.largeText.matches,
        forcedColors: queries.forcedColors.matches,
        prefersColorScheme: queries.darkMode.matches 
          ? 'dark' 
          : queries.lightMode.matches 
          ? 'light' 
          : 'no-preference',
      });
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    Object.values(queries).forEach(query => {
      query.addEventListener('change', updatePreferences);
    });

    return () => {
      Object.values(queries).forEach(query => {
        query.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  return preferences;
}

/**
 * Hook for theme-aware animations
 * Returns animation settings that respect accessibility preferences
 */
export function useThemeAnimations() {
  const { accessibility } = useTheme();

  return {
    // Duration values that respect reduced motion
    duration: {
      fast: accessibility.reducedMotion ? '0.01ms' : '150ms',
      normal: accessibility.reducedMotion ? '0.01ms' : '250ms',
      slow: accessibility.reducedMotion ? '0.01ms' : '500ms',
    },
    
    // CSS classes for animations
    classes: {
      transition: accessibility.reducedMotion 
        ? 'transition-none' 
        : 'transition-all duration-200',
      
      fadeIn: accessibility.reducedMotion 
        ? 'opacity-100' 
        : 'animate-in fade-in duration-300',
      
      slideUp: accessibility.reducedMotion 
        ? 'translate-y-0' 
        : 'animate-in slide-in-from-bottom duration-300',
      
      scaleIn: accessibility.reducedMotion 
        ? 'scale-100' 
        : 'animate-in zoom-in duration-200',
    },
    
    // Inline styles for complex animations
    styles: {
      transition: accessibility.reducedMotion 
        ? undefined 
        : { transition: 'all 0.2s ease-in-out' },
      
      transform: accessibility.reducedMotion 
        ? undefined 
        : { transition: 'transform 0.2s ease-in-out' },
    },
  };
}

// Re-export types for convenience
export type { ThemeVariant, AccessibilityPreferences, UseTheme };