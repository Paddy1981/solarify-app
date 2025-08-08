/**
 * Solarify Layout & Spacing System
 * Comprehensive layout patterns and spacing utilities for solar marketplace
 * Mobile-first responsive design with accessibility considerations
 */

import { cva } from 'class-variance-authority';

// Container system for different content types
export const containerVariants = cva(
  ['w-full mx-auto px-4'],
  {
    variants: {
      size: {
        sm: 'max-w-2xl',        // 672px - Small content, forms
        md: 'max-w-4xl',        // 896px - Medium content, dashboards
        lg: 'max-w-6xl',        // 1152px - Large content, product grids
        xl: 'max-w-7xl',        // 1280px - Extra large, marketing pages
        full: 'max-w-full',     // Full width
        prose: 'max-w-prose',   // 65ch - Optimal reading width
      },
      padding: {
        none: 'px-0',
        sm: 'px-4 sm:px-6',
        md: 'px-4 sm:px-6 lg:px-8',
        lg: 'px-6 sm:px-8 lg:px-12',
        // Mobile-safe padding considering device edges
        safe: 'px-4 safe-left safe-right sm:px-6 lg:px-8',
      },
    },
    defaultVariants: {
      size: 'lg',
      padding: 'safe',
    },
  }
);

// Grid system for solar marketplace layouts
export const gridVariants = cva(
  ['grid gap-4'],
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
        12: 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12',
        // Solar-specific layouts
        'product-grid': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        'feature-grid': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        'dashboard-grid': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        'calculator-grid': 'grid-cols-1 lg:grid-cols-2',
      },
      gap: {
        none: 'gap-0',
        xs: 'gap-2',
        sm: 'gap-3',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        // Responsive gaps
        responsive: 'gap-4 sm:gap-6 lg:gap-8',
        'mobile-friendly': 'gap-3 sm:gap-4 lg:gap-6',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      },
      justify: {
        start: 'justify-items-start',
        center: 'justify-items-center',
        end: 'justify-items-end',
        stretch: 'justify-items-stretch',
      },
    },
    defaultVariants: {
      cols: 3,
      gap: 'responsive',
      align: 'stretch',
      justify: 'stretch',
    },
  }
);

// Flex layout system
export const flexVariants = cva(
  ['flex'],
  {
    variants: {
      direction: {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        col: 'flex-col',
        'col-reverse': 'flex-col-reverse',
        // Responsive directions
        'responsive-col': 'flex-col sm:flex-row',
        'responsive-row': 'flex-row sm:flex-col',
      },
      wrap: {
        nowrap: 'flex-nowrap',
        wrap: 'flex-wrap',
        'wrap-reverse': 'flex-wrap-reverse',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        baseline: 'items-baseline',
        stretch: 'items-stretch',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
      },
      gap: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-3',
        lg: 'gap-4',
        xl: 'gap-6',
        '2xl': 'gap-8',
        // Mobile-friendly gaps
        'mobile-sm': 'gap-2 sm:gap-3',
        'mobile-md': 'gap-3 sm:gap-4',
        'mobile-lg': 'gap-4 sm:gap-6',
      },
    },
    defaultVariants: {
      direction: 'row',
      wrap: 'nowrap',
      align: 'center',
      justify: 'start',
      gap: 'md',
    },
  }
);

// Stack layout for vertical spacing
export const stackVariants = cva(
  ['flex flex-col'],
  {
    variants: {
      gap: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        '2xl': 'gap-12',
        '3xl': 'gap-16',
        // Context-specific gaps
        'tight': 'gap-2',
        'comfortable': 'gap-6',
        'loose': 'gap-12',
        // Responsive gaps
        'responsive-sm': 'gap-2 sm:gap-4',
        'responsive-md': 'gap-4 sm:gap-6',
        'responsive-lg': 'gap-6 sm:gap-8 lg:gap-12',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      },
    },
    defaultVariants: {
      gap: 'md',
      align: 'stretch',
    },
  }
);

// Section spacing system
export const sectionVariants = cva(
  ['w-full'],
  {
    variants: {
      padding: {
        none: 'py-0',
        xs: 'py-4',
        sm: 'py-8',
        md: 'py-12',
        lg: 'py-16',
        xl: 'py-20',
        '2xl': 'py-24',
        // Mobile-first responsive padding
        'responsive-sm': 'py-8 sm:py-12',
        'responsive-md': 'py-12 sm:py-16 lg:py-20',
        'responsive-lg': 'py-16 sm:py-20 lg:py-24 xl:py-32',
        // Hero section padding
        'hero': 'py-16 sm:py-20 lg:py-24 xl:py-32',
      },
      background: {
        transparent: 'bg-transparent',
        default: 'bg-background',
        muted: 'bg-muted',
        card: 'bg-card',
        // Solar-themed backgrounds
        'solar-light': 'bg-gradient-to-br from-solar-primary/5 to-transparent',
        'energy-light': 'bg-gradient-to-br from-energy-primary/5 to-transparent',
        'eco-light': 'bg-gradient-to-br from-eco-primary/5 to-transparent',
        'solar-gradient': 'bg-gradient-to-r from-solar-primary to-solar-secondary',
        'energy-gradient': 'bg-gradient-to-r from-energy-primary to-energy-secondary',
        'eco-gradient': 'bg-gradient-to-r from-eco-primary to-eco-secondary',
      },
    },
    defaultVariants: {
      padding: 'responsive-md',
      background: 'transparent',
    },
  }
);

// Content area layouts for specific solar marketplace sections
export const contentAreaVariants = cva(
  ['w-full'],
  {
    variants: {
      type: {
        'hero': [
          'text-center',
          'max-w-4xl mx-auto',
          'px-4 sm:px-6 lg:px-8',
          'py-16 sm:py-20 lg:py-24',
        ],
        'feature-section': [
          'max-w-6xl mx-auto',
          'px-4 sm:px-6 lg:px-8',
          'py-12 sm:py-16 lg:py-20',
        ],
        'product-showcase': [
          'max-w-7xl mx-auto',
          'px-4 sm:px-6 lg:px-8',
          'py-8 sm:py-12 lg:py-16',
        ],
        'calculator-section': [
          'max-w-6xl mx-auto',
          'px-4 sm:px-6 lg:px-8',
          'py-8 sm:py-12',
        ],
        'dashboard-content': [
          'max-w-full mx-auto',
          'px-4 sm:px-6 lg:px-8',
          'py-6 sm:py-8',
        ],
        'form-section': [
          'max-w-2xl mx-auto',
          'px-4 sm:px-6 lg:px-8',
          'py-8 sm:py-12',
        ],
        'testimonial-section': [
          'max-w-4xl mx-auto',
          'px-4 sm:px-6 lg:px-8',
          'py-12 sm:py-16 lg:py-20',
          'text-center',
        ],
        'footer-content': [
          'max-w-7xl mx-auto',
          'px-4 sm:px-6 lg:px-8',
          'py-12 sm:py-16',
        ],
      },
    },
    defaultVariants: {
      type: 'feature-section',
    },
  }
);

// Card layout patterns for solar marketplace
export const cardLayoutVariants = cva(
  ['grid gap-4'],
  {
    variants: {
      layout: {
        'product-cards': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
        'feature-cards': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8',
        'stat-cards': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4',
        'dashboard-cards': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
        'testimonial-cards': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        'installer-cards': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
        'savings-cards': 'grid-cols-1 sm:grid-cols-2 gap-6',
        'calculator-cards': 'grid-cols-1 lg:grid-cols-2 gap-8',
      },
    },
    defaultVariants: {
      layout: 'feature-cards',
    },
  }
);

// Spacing utilities
export const spacing = {
  // Base spacing scale (consistent with design tokens)
  scale: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',    // 2px
    1: '0.25rem',       // 4px
    1.5: '0.375rem',    // 6px
    2: '0.5rem',        // 8px
    2.5: '0.625rem',    // 10px
    3: '0.75rem',       // 12px
    3.5: '0.875rem',    // 14px
    4: '1rem',          // 16px
    5: '1.25rem',       // 20px
    6: '1.5rem',        // 24px
    7: '1.75rem',       // 28px
    8: '2rem',          // 32px
    9: '2.25rem',       // 36px
    10: '2.5rem',       // 40px
    11: '2.75rem',      // 44px - Touch target minimum
    12: '3rem',         // 48px
    14: '3.5rem',       // 56px
    16: '4rem',         // 64px
    20: '5rem',         // 80px
    24: '6rem',         // 96px
    28: '7rem',         // 112px
    32: '8rem',         // 128px
    36: '9rem',         // 144px
    40: '10rem',        // 160px
    44: '11rem',        // 176px
    48: '12rem',        // 192px
    52: '13rem',        // 208px
    56: '14rem',        // 224px
    60: '15rem',        // 240px
    64: '16rem',        // 256px
    72: '18rem',        // 288px
    80: '20rem',        // 320px
    96: '24rem',        // 384px
  },
  
  // Context-specific spacing
  contexts: {
    touchTarget: '2.75rem',        // 44px minimum for touch targets
    mobileComfortable: '1.5rem',   // 24px comfortable mobile spacing
    mobileSafe: '1rem',            // 16px safe area padding
    sectionGap: '4rem',            // 64px between major sections
    componentGap: '2rem',          // 32px between components
    contentGap: '1.5rem',          // 24px between content blocks
    formFieldGap: '1rem',          // 16px between form fields
    cardPadding: '1.5rem',         // 24px standard card padding
    headerHeight: '4rem',          // 64px header height
    footerPadding: '3rem',         // 48px footer padding
  },
  
  // Responsive spacing patterns
  responsive: {
    // Padding that grows with screen size
    responsivePadding: {
      sm: 'px-4 py-4 sm:px-6 sm:py-6',
      md: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12',
      lg: 'px-6 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16',
    },
    
    // Margins that adapt to screen size
    responsiveMargin: {
      sm: 'mx-4 my-4 sm:mx-6 sm:my-6',
      md: 'mx-4 my-6 sm:mx-6 sm:my-8 lg:mx-8 lg:my-12',
      lg: 'mx-6 my-8 sm:mx-8 sm:my-12 lg:mx-12 lg:my-16',
    },
    
    // Section spacing that scales
    sectionSpacing: {
      sm: 'py-8 sm:py-12',
      md: 'py-12 sm:py-16 lg:py-20',
      lg: 'py-16 sm:py-20 lg:py-24 xl:py-32',
      hero: 'py-16 sm:py-20 lg:py-24 xl:py-32',
    },
  },
} as const;

// Solar marketplace-specific layout patterns
export const solarLayoutPatterns = {
  // Hero section layout
  hero: {
    container: 'max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24',
    title: 'space-y-4',
    content: 'space-y-6 mt-8',
    actions: 'flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mt-10',
  },
  
  // Feature section layouts
  features: {
    container: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20',
    header: 'text-center max-w-3xl mx-auto mb-12 lg:mb-16',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12',
  },
  
  // Product showcase layouts
  products: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16',
    header: 'text-center max-w-3xl mx-auto mb-8 lg:mb-12',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
    filters: 'flex flex-wrap gap-2 sm:gap-4 mb-8',
  },
  
  // Dashboard layouts
  dashboard: {
    container: 'max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
    header: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8',
    stats: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8',
    content: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6',
    sidebar: 'w-full lg:w-80 xl:w-96 space-y-6',
    main: 'flex-1 space-y-6',
  },
  
  // Calculator layouts
  calculator: {
    container: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
    layout: 'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12',
    form: 'space-y-6',
    results: 'space-y-6 lg:space-y-8',
    summary: 'bg-muted rounded-lg p-6 space-y-4',
  },
  
  // Form layouts
  forms: {
    container: 'max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
    header: 'text-center mb-8',
    fieldset: 'space-y-6',
    field: 'space-y-2',
    actions: 'flex flex-col sm:flex-row gap-4 sm:gap-6 pt-6',
  },
} as const;

// Export types
export type ContainerSize = Parameters<typeof containerVariants>[0]['size'];
export type GridCols = Parameters<typeof gridVariants>[0]['cols'];
export type FlexDirection = Parameters<typeof flexVariants>[0]['direction'];
export type SectionPadding = Parameters<typeof sectionVariants>[0]['padding'];
export type ContentAreaType = Parameters<typeof contentAreaVariants>[0]['type'];
export type CardLayout = Parameters<typeof cardLayoutVariants>[0]['layout'];