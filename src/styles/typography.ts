/**
 * Solarify Typography System
 * Comprehensive typography tokens and utilities for consistent text rendering
 * Optimized for solar industry content with excellent accessibility
 */

export const typography = {
  // Font families with solar industry focus
  fontFamilies: {
    primary: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(', '),
    
    heading: [
      '"Space Grotesk"',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(', '),
    
    mono: [
      '"JetBrains Mono"',
      'Menlo',
      'Monaco',
      'Consolas',
      '"Liberation Mono"',
      '"Courier New"',
      'monospace',
    ].join(', '),
    
    display: [
      '"Space Grotesk"',
      'Inter',
      'system-ui',
      'sans-serif',
    ].join(', '),
  },

  // Responsive font scales with mobile-first approach
  fontSizes: {
    // Base text sizes
    xs: {
      fontSize: '0.75rem',    // 12px
      lineHeight: '1rem',     // 16px
      letterSpacing: '0.025em',
      mobile: {
        fontSize: '0.75rem',
        lineHeight: '1rem',
      },
    },
    
    sm: {
      fontSize: '0.875rem',   // 14px
      lineHeight: '1.25rem',  // 20px
      letterSpacing: '0.0125em',
      mobile: {
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
      },
    },
    
    base: {
      fontSize: '1rem',       // 16px - no zoom on iOS
      lineHeight: '1.5rem',   // 24px
      letterSpacing: '0',
      mobile: {
        fontSize: '1rem',     // 16px prevents zoom
        lineHeight: '1.5rem',
      },
    },
    
    lg: {
      fontSize: '1.125rem',   // 18px
      lineHeight: '1.75rem',  // 28px
      letterSpacing: '-0.0125em',
      mobile: {
        fontSize: '1rem',     // Smaller on mobile
        lineHeight: '1.5rem',
      },
    },
    
    xl: {
      fontSize: '1.25rem',    // 20px
      lineHeight: '1.75rem',  // 28px
      letterSpacing: '-0.025em',
      mobile: {
        fontSize: '1.125rem', // 18px on mobile
        lineHeight: '1.625rem',
      },
    },
    
    '2xl': {
      fontSize: '1.5rem',     // 24px
      lineHeight: '2rem',     // 32px
      letterSpacing: '-0.025em',
      mobile: {
        fontSize: '1.25rem',  // 20px on mobile
        lineHeight: '1.75rem',
      },
    },
    
    '3xl': {
      fontSize: '1.875rem',   // 30px
      lineHeight: '2.25rem',  // 36px
      letterSpacing: '-0.025em',
      mobile: {
        fontSize: '1.5rem',   // 24px on mobile
        lineHeight: '2rem',
      },
    },
    
    '4xl': {
      fontSize: '2.25rem',    // 36px
      lineHeight: '2.5rem',   // 40px
      letterSpacing: '-0.025em',
      mobile: {
        fontSize: '1.875rem', // 30px on mobile
        lineHeight: '2.25rem',
      },
    },
    
    '5xl': {
      fontSize: '3rem',       // 48px
      lineHeight: '1',        // Tight for headlines
      letterSpacing: '-0.025em',
      mobile: {
        fontSize: '2.25rem',  // 36px on mobile
        lineHeight: '1.1',
      },
    },
    
    '6xl': {
      fontSize: '3.75rem',    // 60px
      lineHeight: '1',
      letterSpacing: '-0.025em',
      mobile: {
        fontSize: '3rem',     // 48px on mobile
        lineHeight: '1',
      },
    },
    
    '7xl': {
      fontSize: '4.5rem',     // 72px
      lineHeight: '1',
      letterSpacing: '-0.025em',
      mobile: {
        fontSize: '3.75rem',  // 60px on mobile
        lineHeight: '1',
      },
    },
  },

  // Font weights for different contexts
  fontWeights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Semantic text styles for consistent usage
  textStyles: {
    // Display styles for hero sections
    displayLarge: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(3rem, 5vw, 4.5rem)',
      fontWeight: '700',
      lineHeight: '1',
      letterSpacing: '-0.025em',
      color: 'hsl(var(--foreground))',
    },
    
    displayMedium: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(2.25rem, 4vw, 3.75rem)',
      fontWeight: '600',
      lineHeight: '1.1',
      letterSpacing: '-0.025em',
      color: 'hsl(var(--foreground))',
    },
    
    displaySmall: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(1.875rem, 3vw, 3rem)',
      fontWeight: '600',
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
      color: 'hsl(var(--foreground))',
    },
    
    // Headline styles
    h1: {
      fontFamily: 'var(--font-heading)',
      fontSize: 'clamp(1.875rem, 3vw, 2.25rem)',
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
      color: 'hsl(var(--foreground))',
    },
    
    h2: {
      fontFamily: 'var(--font-heading)',
      fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)',
      fontWeight: '600',
      lineHeight: '1.3',
      letterSpacing: '-0.025em',
      color: 'hsl(var(--foreground))',
    },
    
    h3: {
      fontFamily: 'var(--font-heading)',
      fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '-0.0125em',
      color: 'hsl(var(--foreground))',
    },
    
    h4: {
      fontFamily: 'var(--font-heading)',
      fontSize: 'clamp(1.125rem, 1.5vw, 1.25rem)',
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '0',
      color: 'hsl(var(--foreground))',
    },
    
    h5: {
      fontFamily: 'var(--font-heading)',
      fontSize: '1.125rem',
      fontWeight: '600',
      lineHeight: '1.5',
      letterSpacing: '0',
      color: 'hsl(var(--foreground))',
    },
    
    h6: {
      fontFamily: 'var(--font-heading)',
      fontSize: '1rem',
      fontWeight: '600',
      lineHeight: '1.5',
      letterSpacing: '0.025em',
      textTransform: 'uppercase',
      color: 'hsl(var(--muted-foreground))',
    },
    
    // Body text styles
    bodyLarge: {
      fontFamily: 'var(--font-primary)',
      fontSize: '1.125rem',
      fontWeight: '400',
      lineHeight: '1.75',
      letterSpacing: '0',
      color: 'hsl(var(--foreground))',
    },
    
    bodyBase: {
      fontFamily: 'var(--font-primary)',
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.6',
      letterSpacing: '0',
      color: 'hsl(var(--foreground))',
    },
    
    bodySmall: {
      fontFamily: 'var(--font-primary)',
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.5',
      letterSpacing: '0.0125em',
      color: 'hsl(var(--muted-foreground))',
    },
    
    // Caption and label styles
    caption: {
      fontFamily: 'var(--font-primary)',
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1.25',
      letterSpacing: '0.025em',
      color: 'hsl(var(--muted-foreground))',
    },
    
    label: {
      fontFamily: 'var(--font-primary)',
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '1.25',
      letterSpacing: '0.0125em',
      color: 'hsl(var(--foreground))',
    },
    
    // Interactive text styles
    link: {
      fontFamily: 'var(--font-primary)',
      fontSize: 'inherit',
      fontWeight: '500',
      lineHeight: 'inherit',
      letterSpacing: 'inherit',
      color: 'hsl(var(--primary))',
      textDecoration: 'underline',
      textDecorationThickness: '1px',
      textUnderlineOffset: '2px',
    },
    
    button: {
      fontFamily: 'var(--font-primary)',
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '1.25',
      letterSpacing: '0.0125em',
      color: 'inherit',
    },
    
    // Code and technical text
    code: {
      fontFamily: 'var(--font-mono)',
      fontSize: '0.875em',
      fontWeight: '400',
      lineHeight: '1.5',
      letterSpacing: '0',
      color: 'hsl(var(--foreground))',
      backgroundColor: 'hsl(var(--muted))',
      padding: '0.125rem 0.25rem',
      borderRadius: '0.25rem',
    },
    
    // Solar-specific text styles
    solarMetric: {
      fontFamily: 'var(--font-primary)',
      fontSize: '1.5rem',
      fontWeight: '600',
      lineHeight: '1.2',
      letterSpacing: '-0.0125em',
      color: 'hsl(var(--solar-primary))',
    },
    
    energyValue: {
      fontFamily: 'var(--font-primary)',
      fontSize: '2rem',
      fontWeight: '700',
      lineHeight: '1',
      letterSpacing: '-0.025em',
      color: 'hsl(var(--energy-primary))',
    },
    
    savingsAmount: {
      fontFamily: 'var(--font-primary)',
      fontSize: '1.25rem',
      fontWeight: '600',
      lineHeight: '1.2',
      letterSpacing: '-0.0125em',
      color: 'hsl(var(--eco-primary))',
    },
  },

  // Line height scale
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing scale
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text decoration utilities
  textDecoration: {
    none: 'none',
    underline: 'underline',
    overline: 'overline',
    'line-through': 'line-through',
  },

  // Text transform utilities
  textTransform: {
    none: 'none',
    capitalize: 'capitalize',
    uppercase: 'uppercase',
    lowercase: 'lowercase',
  },
} as const;

// CSS custom properties for font families
export const fontVariables = {
  '--font-primary': typography.fontFamilies.primary,
  '--font-heading': typography.fontFamilies.heading,
  '--font-mono': typography.fontFamilies.mono,
  '--font-display': typography.fontFamilies.display,
} as const;

// Utility functions for typography
export const getResponsiveFont = (size: keyof typeof typography.fontSizes) => {
  const config = typography.fontSizes[size];
  return {
    fontSize: config.mobile?.fontSize || config.fontSize,
    lineHeight: config.mobile?.lineHeight || config.lineHeight,
    letterSpacing: config.letterSpacing,
    '@media (min-width: 640px)': {
      fontSize: config.fontSize,
      lineHeight: config.lineHeight,
    },
  };
};

// Type exports
export type FontSize = keyof typeof typography.fontSizes;
export type FontWeight = keyof typeof typography.fontWeights;
export type TextStyle = keyof typeof typography.textStyles;