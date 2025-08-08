/**
 * Solarify Theme System
 * Advanced theming with accessibility, dark mode, and solar-specific variants
 * Supports high contrast, reduced motion, and custom themes
 */

import { designTokens } from '@/styles/design-tokens';

// Theme variant types
export type ThemeVariant = 
  | 'light' 
  | 'dark' 
  | 'high-contrast-light' 
  | 'high-contrast-dark'
  | 'solar-light'
  | 'solar-dark'
  | 'energy-light'
  | 'energy-dark';

// Accessibility preference types
export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  forcedColors: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
}

// Theme configuration interface
export interface ThemeConfig {
  variant: ThemeVariant;
  accessibility: AccessibilityPreferences;
  customColors?: Partial<Record<string, string>>;
  customSpacing?: Partial<Record<string, string>>;
  customBorderRadius?: Partial<Record<string, string>>;
}

// Base theme definitions
export const baseThemes = {
  light: {
    name: 'Light Theme',
    description: 'Default light theme with solar branding',
    colors: {
      // Base colors
      background: 'hsl(0, 0%, 98%)',
      foreground: 'hsl(0, 0%, 10%)',
      
      // Surface colors
      card: 'hsl(0, 0%, 100%)',
      'card-foreground': 'hsl(0, 0%, 10%)',
      popover: 'hsl(0, 0%, 100%)',
      'popover-foreground': 'hsl(0, 0%, 10%)',
      
      // Brand colors
      primary: 'hsl(45, 100%, 35%)',        // Solar gold - WCAG AA
      'primary-foreground': 'hsl(0, 0%, 98%)',
      secondary: 'hsl(197, 78%, 35%)',      // Energy blue - WCAG AA
      'secondary-foreground': 'hsl(0, 0%, 98%)',
      
      // Utility colors
      muted: 'hsl(0, 0%, 96%)',
      'muted-foreground': 'hsl(0, 0%, 35%)', // 4.6:1 contrast
      accent: 'hsl(120, 60%, 35%)',          // Eco green - WCAG AA
      'accent-foreground': 'hsl(0, 0%, 98%)',
      
      // State colors
      success: 'hsl(120, 60%, 35%)',
      'success-foreground': 'hsl(0, 0%, 98%)',
      warning: 'hsl(38, 100%, 35%)',
      'warning-foreground': 'hsl(0, 0%, 98%)',
      error: 'hsl(0, 65%, 35%)',
      'error-foreground': 'hsl(0, 0%, 98%)',
      destructive: 'hsl(0, 65%, 35%)',
      'destructive-foreground': 'hsl(0, 0%, 98%)',
      
      // Interactive colors
      border: 'hsl(0, 0%, 88%)',
      input: 'hsl(0, 0%, 100%)',
      'input-border': 'hsl(0, 0%, 70%)',
      ring: 'hsl(45, 100%, 35%)',
      
      // Solar-specific colors
      'solar-primary': 'hsl(45, 100%, 35%)',
      'solar-secondary': 'hsl(45, 100%, 45%)',
      'solar-accent': 'hsl(38, 100%, 35%)',
      'energy-primary': 'hsl(197, 78%, 35%)',
      'energy-secondary': 'hsl(197, 78%, 45%)',
      'eco-primary': 'hsl(120, 60%, 35%)',
      'eco-secondary': 'hsl(120, 60%, 45%)',
    },
  },
  
  dark: {
    name: 'Dark Theme',
    description: 'Dark theme optimized for low-light environments',
    colors: {
      // Base colors
      background: 'hsl(0, 0%, 5%)',
      foreground: 'hsl(0, 0%, 98%)',
      
      // Surface colors
      card: 'hsl(0, 0%, 10%)',
      'card-foreground': 'hsl(0, 0%, 98%)',
      popover: 'hsl(0, 0%, 10%)',
      'popover-foreground': 'hsl(0, 0%, 98%)',
      
      // Brand colors - brighter for dark backgrounds
      primary: 'hsl(45, 100%, 50%)',
      'primary-foreground': 'hsl(0, 0%, 5%)',
      secondary: 'hsl(197, 78%, 55%)',
      'secondary-foreground': 'hsl(0, 0%, 5%)',
      
      // Utility colors
      muted: 'hsl(0, 0%, 15%)',
      'muted-foreground': 'hsl(0, 0%, 70%)',
      accent: 'hsl(120, 60%, 50%)',
      'accent-foreground': 'hsl(0, 0%, 5%)',
      
      // State colors
      success: 'hsl(120, 60%, 50%)',
      'success-foreground': 'hsl(0, 0%, 5%)',
      warning: 'hsl(38, 100%, 50%)',
      'warning-foreground': 'hsl(0, 0%, 5%)',
      error: 'hsl(0, 65%, 50%)',
      'error-foreground': 'hsl(0, 0%, 5%)',
      destructive: 'hsl(0, 65%, 50%)',
      'destructive-foreground': 'hsl(0, 0%, 5%)',
      
      // Interactive colors
      border: 'hsl(0, 0%, 25%)',
      input: 'hsl(0, 0%, 15%)',
      'input-border': 'hsl(0, 0%, 35%)',
      ring: 'hsl(45, 100%, 50%)',
      
      // Solar-specific colors
      'solar-primary': 'hsl(45, 100%, 50%)',
      'solar-secondary': 'hsl(45, 100%, 60%)',
      'solar-accent': 'hsl(38, 100%, 50%)',
      'energy-primary': 'hsl(197, 78%, 55%)',
      'energy-secondary': 'hsl(197, 78%, 65%)',
      'eco-primary': 'hsl(120, 60%, 50%)',
      'eco-secondary': 'hsl(120, 60%, 60%)',
    },
  },
  
  'high-contrast-light': {
    name: 'High Contrast Light',
    description: 'High contrast light theme for accessibility',
    colors: {
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(0, 0%, 0%)',
      
      card: 'hsl(0, 0%, 100%)',
      'card-foreground': 'hsl(0, 0%, 0%)',
      popover: 'hsl(0, 0%, 100%)',
      'popover-foreground': 'hsl(0, 0%, 0%)',
      
      // High contrast brand colors
      primary: 'hsl(0, 0%, 0%)',           // Pure black
      'primary-foreground': 'hsl(0, 0%, 100%)',
      secondary: 'hsl(240, 100%, 25%)',    // Dark blue
      'secondary-foreground': 'hsl(0, 0%, 100%)',
      
      muted: 'hsl(0, 0%, 95%)',
      'muted-foreground': 'hsl(0, 0%, 20%)',
      accent: 'hsl(120, 100%, 25%)',       // Dark green
      'accent-foreground': 'hsl(0, 0%, 100%)',
      
      success: 'hsl(120, 100%, 25%)',
      'success-foreground': 'hsl(0, 0%, 100%)',
      warning: 'hsl(45, 100%, 25%)',
      'warning-foreground': 'hsl(0, 0%, 100%)',
      error: 'hsl(0, 100%, 25%)',
      'error-foreground': 'hsl(0, 0%, 100%)',
      destructive: 'hsl(0, 100%, 25%)',
      'destructive-foreground': 'hsl(0, 0%, 100%)',
      
      border: 'hsl(0, 0%, 20%)',
      input: 'hsl(0, 0%, 100%)',
      'input-border': 'hsl(0, 0%, 0%)',
      ring: 'hsl(240, 100%, 50%)',
      
      // Solar-specific high contrast
      'solar-primary': 'hsl(45, 100%, 25%)',
      'solar-secondary': 'hsl(45, 100%, 30%)',
      'solar-accent': 'hsl(38, 100%, 25%)',
      'energy-primary': 'hsl(197, 100%, 25%)',
      'energy-secondary': 'hsl(197, 100%, 30%)',
      'eco-primary': 'hsl(120, 100%, 25%)',
      'eco-secondary': 'hsl(120, 100%, 30%)',
    },
  },
  
  'high-contrast-dark': {
    name: 'High Contrast Dark',
    description: 'High contrast dark theme for accessibility',
    colors: {
      background: 'hsl(0, 0%, 0%)',
      foreground: 'hsl(0, 0%, 100%)',
      
      card: 'hsl(0, 0%, 0%)',
      'card-foreground': 'hsl(0, 0%, 100%)',
      popover: 'hsl(0, 0%, 0%)',
      'popover-foreground': 'hsl(0, 0%, 100%)',
      
      primary: 'hsl(0, 0%, 100%)',         // Pure white
      'primary-foreground': 'hsl(0, 0%, 0%)',
      secondary: 'hsl(240, 100%, 75%)',    // Light blue
      'secondary-foreground': 'hsl(0, 0%, 0%)',
      
      muted: 'hsl(0, 0%, 5%)',
      'muted-foreground': 'hsl(0, 0%, 80%)',
      accent: 'hsl(120, 100%, 75%)',       // Light green
      'accent-foreground': 'hsl(0, 0%, 0%)',
      
      success: 'hsl(120, 100%, 75%)',
      'success-foreground': 'hsl(0, 0%, 0%)',
      warning: 'hsl(45, 100%, 75%)',
      'warning-foreground': 'hsl(0, 0%, 0%)',
      error: 'hsl(0, 100%, 75%)',
      'error-foreground': 'hsl(0, 0%, 0%)',
      destructive: 'hsl(0, 100%, 75%)',
      'destructive-foreground': 'hsl(0, 0%, 0%)',
      
      border: 'hsl(0, 0%, 80%)',
      input: 'hsl(0, 0%, 0%)',
      'input-border': 'hsl(0, 0%, 100%)',
      ring: 'hsl(240, 100%, 75%)',
      
      // Solar-specific high contrast
      'solar-primary': 'hsl(45, 100%, 75%)',
      'solar-secondary': 'hsl(45, 100%, 80%)',
      'solar-accent': 'hsl(38, 100%, 75%)',
      'energy-primary': 'hsl(197, 100%, 75%)',
      'energy-secondary': 'hsl(197, 100%, 80%)',
      'eco-primary': 'hsl(120, 100%, 75%)',
      'eco-secondary': 'hsl(120, 100%, 80%)',
    },
  },
  
  'solar-light': {
    name: 'Solar Light',
    description: 'Light theme with enhanced solar branding',
    colors: {
      background: 'hsl(45, 20%, 98%)',     // Warm light background
      foreground: 'hsl(0, 0%, 10%)',
      
      card: 'hsl(45, 30%, 99%)',
      'card-foreground': 'hsl(0, 0%, 10%)',
      popover: 'hsl(45, 30%, 99%)',
      'popover-foreground': 'hsl(0, 0%, 10%)',
      
      primary: 'hsl(45, 100%, 35%)',       // Strong solar gold
      'primary-foreground': 'hsl(0, 0%, 98%)',
      secondary: 'hsl(38, 100%, 35%)',     // Solar orange
      'secondary-foreground': 'hsl(0, 0%, 98%)',
      
      muted: 'hsl(45, 20%, 96%)',
      'muted-foreground': 'hsl(0, 0%, 35%)',
      accent: 'hsl(45, 100%, 40%)',
      'accent-foreground': 'hsl(0, 0%, 98%)',
      
      success: 'hsl(120, 60%, 35%)',
      'success-foreground': 'hsl(0, 0%, 98%)',
      warning: 'hsl(38, 100%, 35%)',
      'warning-foreground': 'hsl(0, 0%, 98%)',
      error: 'hsl(0, 65%, 35%)',
      'error-foreground': 'hsl(0, 0%, 98%)',
      destructive: 'hsl(0, 65%, 35%)',
      'destructive-foreground': 'hsl(0, 0%, 98%)',
      
      border: 'hsl(45, 20%, 88%)',
      input: 'hsl(45, 30%, 99%)',
      'input-border': 'hsl(45, 30%, 70%)',
      ring: 'hsl(45, 100%, 40%)',
      
      'solar-primary': 'hsl(45, 100%, 35%)',
      'solar-secondary': 'hsl(45, 100%, 40%)',
      'solar-accent': 'hsl(38, 100%, 35%)',
      'energy-primary': 'hsl(197, 78%, 35%)',
      'energy-secondary': 'hsl(197, 78%, 45%)',
      'eco-primary': 'hsl(120, 60%, 35%)',
      'eco-secondary': 'hsl(120, 60%, 45%)',
    },
  },
  
  'solar-dark': {
    name: 'Solar Dark',
    description: 'Dark theme with enhanced solar branding',
    colors: {
      background: 'hsl(45, 10%, 5%)',      // Warm dark background
      foreground: 'hsl(45, 20%, 98%)',
      
      card: 'hsl(45, 15%, 8%)',
      'card-foreground': 'hsl(45, 20%, 98%)',
      popover: 'hsl(45, 15%, 8%)',
      'popover-foreground': 'hsl(45, 20%, 98%)',
      
      primary: 'hsl(45, 100%, 55%)',       // Bright solar gold
      'primary-foreground': 'hsl(45, 10%, 5%)',
      secondary: 'hsl(38, 100%, 55%)',     // Bright solar orange
      'secondary-foreground': 'hsl(45, 10%, 5%)',
      
      muted: 'hsl(45, 10%, 15%)',
      'muted-foreground': 'hsl(45, 10%, 70%)',
      accent: 'hsl(45, 100%, 60%)',
      'accent-foreground': 'hsl(45, 10%, 5%)',
      
      success: 'hsl(120, 60%, 50%)',
      'success-foreground': 'hsl(45, 10%, 5%)',
      warning: 'hsl(38, 100%, 55%)',
      'warning-foreground': 'hsl(45, 10%, 5%)',
      error: 'hsl(0, 65%, 50%)',
      'error-foreground': 'hsl(45, 10%, 5%)',
      destructive: 'hsl(0, 65%, 50%)',
      'destructive-foreground': 'hsl(45, 10%, 5%)',
      
      border: 'hsl(45, 10%, 25%)',
      input: 'hsl(45, 15%, 12%)',
      'input-border': 'hsl(45, 15%, 35%)',
      ring: 'hsl(45, 100%, 55%)',
      
      'solar-primary': 'hsl(45, 100%, 55%)',
      'solar-secondary': 'hsl(45, 100%, 65%)',
      'solar-accent': 'hsl(38, 100%, 55%)',
      'energy-primary': 'hsl(197, 78%, 55%)',
      'energy-secondary': 'hsl(197, 78%, 65%)',
      'eco-primary': 'hsl(120, 60%, 50%)',
      'eco-secondary': 'hsl(120, 60%, 60%)',
    },
  },
} as const;

// Theme utilities
export class ThemeManager {
  private currentTheme: ThemeVariant = 'light';
  private accessibility: AccessibilityPreferences;
  private customProperties: Map<string, string> = new Map();
  
  constructor() {
    this.accessibility = this.detectAccessibilityPreferences();
    this.applyTheme();
  }
  
  // Detect user accessibility preferences
  private detectAccessibilityPreferences(): AccessibilityPreferences {
    if (typeof window === 'undefined') {
      return {
        reducedMotion: false,
        highContrast: false,
        largeText: false,
        forcedColors: false,
        prefersColorScheme: 'no-preference',
      };
    }
    
    return {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      largeText: window.matchMedia('(min-resolution: 1.5dppx)').matches,
      forcedColors: window.matchMedia('(forced-colors: active)').matches,
      prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : window.matchMedia('(prefers-color-scheme: light)').matches 
        ? 'light' 
        : 'no-preference',
    };
  }
  
  // Set theme variant
  setTheme(variant: ThemeVariant): void {
    this.currentTheme = variant;
    this.applyTheme();
    
    // Store preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('solarify-theme', variant);
    }
  }
  
  // Get current theme
  getTheme(): ThemeVariant {
    return this.currentTheme;
  }
  
  // Auto-select theme based on preferences
  autoSelectTheme(): ThemeVariant {
    const { highContrast, prefersColorScheme } = this.accessibility;
    
    if (highContrast) {
      return prefersColorScheme === 'dark' ? 'high-contrast-dark' : 'high-contrast-light';
    }
    
    return prefersColorScheme === 'dark' ? 'dark' : 'light';
  }
  
  // Apply theme to DOM
  private applyTheme(): void {
    if (typeof window === 'undefined') return;
    
    const theme = baseThemes[this.currentTheme];
    if (!theme) return;
    
    const root = document.documentElement;
    
    // Apply theme colors as CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value.replace('hsl(', '').replace(')', ''));
    });
    
    // Apply custom properties
    this.customProperties.forEach((value, key) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    // Set theme class for CSS cascade
    root.className = root.className
      .split(' ')
      .filter(cls => !cls.startsWith('theme-'))
      .concat(`theme-${this.currentTheme}`)
      .join(' ');
    
    // Apply accessibility preferences
    this.applyAccessibilityPreferences();
  }
  
  // Apply accessibility preferences
  private applyAccessibilityPreferences(): void {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    // Reduced motion
    if (this.accessibility.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
      root.classList.add('reduce-motion');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
      root.classList.remove('reduce-motion');
    }
    
    // High contrast
    if (this.accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (this.accessibility.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // Forced colors (Windows High Contrast)
    if (this.accessibility.forcedColors) {
      root.classList.add('forced-colors');
    } else {
      root.classList.remove('forced-colors');
    }
  }
  
  // Set custom color
  setCustomColor(name: string, value: string): void {
    this.customProperties.set(name, value);
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty(`--${name}`, value);
    }
  }
  
  // Remove custom color
  removeCustomColor(name: string): void {
    this.customProperties.delete(name);
    if (typeof window !== 'undefined') {
      document.documentElement.style.removeProperty(`--${name}`);
    }
  }
  
  // Get accessibility preferences
  getAccessibilityPreferences(): AccessibilityPreferences {
    return { ...this.accessibility };
  }
  
  // Update accessibility preferences
  updateAccessibilityPreferences(preferences: Partial<AccessibilityPreferences>): void {
    this.accessibility = { ...this.accessibility, ...preferences };
    this.applyAccessibilityPreferences();
  }
  
  // Initialize theme from stored preference or auto-detect
  initialize(): void {
    if (typeof window === 'undefined') return;
    
    const storedTheme = localStorage.getItem('solarify-theme') as ThemeVariant;
    const autoTheme = this.autoSelectTheme();
    
    this.setTheme(storedTheme && baseThemes[storedTheme] ? storedTheme : autoTheme);
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.accessibility.prefersColorScheme = e.matches ? 'dark' : 'light';
      
      // Auto-update if user hasn't set a preference
      if (!localStorage.getItem('solarify-theme')) {
        this.setTheme(this.autoSelectTheme());
      }
    });
    
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.accessibility.reducedMotion = e.matches;
      this.applyAccessibilityPreferences();
    });
    
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.accessibility.highContrast = e.matches;
      this.applyAccessibilityPreferences();
    });
  }
  
  // Get CSS custom properties for a theme
  static getCSSProperties(variant: ThemeVariant): Record<string, string> {
    const theme = baseThemes[variant];
    if (!theme) return {};
    
    const properties: Record<string, string> = {};
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      properties[`--${key}`] = value.replace('hsl(', '').replace(')', '');
    });
    
    return properties;
  }
  
  // Export theme as CSS
  static exportThemeCSS(variant: ThemeVariant): string {
    const properties = ThemeManager.getCSSProperties(variant);
    
    const cssRules = Object.entries(properties)
      .map(([property, value]) => `  ${property}: ${value};`)
      .join('\n');
    
    return `:root {\n${cssRules}\n}`;
  }
}

// Create singleton instance
export const themeManager = new ThemeManager();

// Utility functions
export const getThemeColors = (variant: ThemeVariant) => {
  return baseThemes[variant]?.colors || baseThemes.light.colors;
};

export const isLightTheme = (variant: ThemeVariant) => {
  return variant.includes('light') || variant === 'solar-light';
};

export const isDarkTheme = (variant: ThemeVariant) => {
  return variant.includes('dark') || variant === 'solar-dark';
};

export const isHighContrastTheme = (variant: ThemeVariant) => {
  return variant.includes('high-contrast');
};

export const isSolarTheme = (variant: ThemeVariant) => {
  return variant.includes('solar');
};

// React hook types (for future hook implementation)
export interface UseTheme {
  theme: ThemeVariant;
  setTheme: (variant: ThemeVariant) => void;
  accessibility: AccessibilityPreferences;
  updateAccessibility: (preferences: Partial<AccessibilityPreferences>) => void;
  autoTheme: ThemeVariant;
}

// Export default
export default themeManager;