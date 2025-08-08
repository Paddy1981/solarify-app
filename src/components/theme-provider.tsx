/**
 * Theme Provider Component
 * Provides theme context and initialization for the entire application
 * Handles SSR compatibility and system preference detection
 */

'use client';

import * as React from 'react';
import { 
  themeManager, 
  type ThemeVariant, 
  type AccessibilityPreferences,
  type UseTheme 
} from '@/lib/theme-system';

// Theme context
const ThemeContext = React.createContext<UseTheme | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeVariant;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
}

/**
 * Theme Provider Component
 * Wraps the application to provide theme management functionality
 * 
 * @example
 * function App() {
 *   return (
 *     <ThemeProvider defaultTheme="solar-light" enableSystem>
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 */
export function ThemeProvider({
  children,
  defaultTheme = 'light',
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = 'solarify-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemeVariant>(defaultTheme);
  const [accessibility, setAccessibilityState] = React.useState<AccessibilityPreferences>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    forcedColors: false,
    prefersColorScheme: 'no-preference',
  });
  const [mounted, setMounted] = React.useState(false);

  // Set theme with transition handling
  const setTheme = React.useCallback((variant: ThemeVariant) => {
    if (disableTransitionOnChange && typeof document !== 'undefined') {
      // Temporarily disable transitions
      const css = document.createElement('style');
      css.type = 'text/css';
      css.appendChild(
        document.createTextNode(
          `* {
            -webkit-transition: none !important;
            -moz-transition: none !important;
            -o-transition: none !important;
            -ms-transition: none !important;
            transition: none !important;
          }`
        )
      );
      document.head.appendChild(css);

      // Apply theme
      themeManager.setTheme(variant);
      setThemeState(variant);

      // Re-enable transitions after a frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.head.removeChild(css);
        });
      });
    } else {
      themeManager.setTheme(variant);
      setThemeState(variant);
    }
  }, [disableTransitionOnChange]);

  // Update accessibility preferences
  const updateAccessibility = React.useCallback((preferences: Partial<AccessibilityPreferences>) => {
    themeManager.updateAccessibilityPreferences(preferences);
    setAccessibilityState(themeManager.getAccessibilityPreferences());
  }, []);

  // Get auto-selected theme
  const autoTheme = React.useMemo(() => {
    return themeManager.autoSelectTheme();
  }, [accessibility]);

  // Initialize theme on mount
  React.useEffect(() => {
    const root = document.documentElement;
    
    // Remove any existing theme classes
    root.className = root.className
      .split(' ')
      .filter(cls => !cls.startsWith('theme-'))
      .join(' ');

    // Initialize theme manager
    themeManager.initialize();

    // Get stored or auto theme
    const storedTheme = enableSystem 
      ? (localStorage.getItem(storageKey) as ThemeVariant) || autoTheme
      : defaultTheme;

    setTheme(storedTheme);
    setAccessibilityState(themeManager.getAccessibilityPreferences());
    setMounted(true);

    // Listen for system preference changes
    if (enableSystem) {
      const mediaQueries = [
        window.matchMedia('(prefers-color-scheme: dark)'),
        window.matchMedia('(prefers-reduced-motion: reduce)'),
        window.matchMedia('(prefers-contrast: high)'),
        window.matchMedia('(forced-colors: active)'),
      ];

      const handleSystemChange = () => {
        const newAccessibility = themeManager.getAccessibilityPreferences();
        setAccessibilityState(newAccessibility);

        // Auto-update theme if user hasn't set a preference
        if (!localStorage.getItem(storageKey)) {
          const newAutoTheme = themeManager.autoSelectTheme();
          if (newAutoTheme !== theme) {
            setTheme(newAutoTheme);
          }
        }
      };

      mediaQueries.forEach(mq => {
        mq.addEventListener('change', handleSystemChange);
      });

      return () => {
        mediaQueries.forEach(mq => {
          mq.removeEventListener('change', handleSystemChange);
        });
      };
    }
  }, [defaultTheme, enableSystem, storageKey, autoTheme, setTheme, theme]);

  // Listen for storage changes (theme changes in other tabs)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const newTheme = e.newValue as ThemeVariant;
        setTheme(newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storageKey, setTheme]);

  // Context value
  const value = React.useMemo<UseTheme>(() => ({
    theme,
    setTheme,
    accessibility,
    updateAccessibility,
    autoTheme,
  }), [theme, setTheme, accessibility, updateAccessibility, autoTheme]);

  // Don't render theme-dependent content until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={value} {...props}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use the theme context
 * Must be used within a ThemeProvider
 */
export function useTheme(): UseTheme {
  const context = React.useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Theme Toggle Button Component
 * Pre-built component for toggling between light and dark themes
 */
export function ThemeToggle({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'solar-light') {
      setTheme('solar-dark');
    } else if (theme === 'solar-dark') {
      setTheme('solar-light');
    } else {
      // For other themes, toggle between light and dark
      setTheme(theme.includes('dark') ? 'light' : 'dark');
    }
  };

  const isDark = theme.includes('dark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className || ''}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      {...props}
    >
      {isDark ? (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

/**
 * Theme Select Component
 * Dropdown selector for all available themes
 */
interface ThemeSelectProps {
  className?: string;
  showLabels?: boolean;
}

export function ThemeSelect({ className, showLabels = true }: ThemeSelectProps) {
  const { theme, setTheme } = useTheme();

  const themes: { value: ThemeVariant; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'solar-light', label: 'Solar Light' },
    { value: 'solar-dark', label: 'Solar Dark' },
    { value: 'high-contrast-light', label: 'High Contrast Light' },
    { value: 'high-contrast-dark', label: 'High Contrast Dark' },
  ];

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as ThemeVariant)}
      className={`rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className || ''}`}
      aria-label="Select theme"
    >
      {themes.map(({ value, label }) => (
        <option key={value} value={value}>
          {showLabels ? label : value}
        </option>
      ))}
    </select>
  );
}

// Export the hook for backward compatibility
export { useTheme as useThemeContext };

// Export types
export type { ThemeProviderProps, UseTheme, ThemeVariant, AccessibilityPreferences };