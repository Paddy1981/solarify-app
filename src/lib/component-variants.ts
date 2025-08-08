/**
 * Solarify Component Variants System
 * Centralized variant definitions for consistent component styling
 * Uses class-variance-authority for type-safe variant management
 */

import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Base component sizes used across all components
export const componentSizes = {
  xs: 'xs',
  sm: 'sm', 
  md: 'md',
  lg: 'lg',
  xl: 'xl',
} as const;

export type ComponentSize = keyof typeof componentSizes;

// Base component variants used across components
export const componentVariants = {
  default: 'default',
  primary: 'primary',
  secondary: 'secondary', 
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  error: 'error',
  destructive: 'destructive',
  ghost: 'ghost',
  outline: 'outline',
  link: 'link',
  // Solar-specific variants
  solar: 'solar',
  energy: 'energy',
  eco: 'eco',
} as const;

export type ComponentVariant = keyof typeof componentVariants;

// Button variants system
export const buttonVariants = cva(
  // Base styles - optimized for accessibility and mobile
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-md font-medium',
    'ring-offset-background transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-95 touch-manipulation',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-sm hover:shadow',
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-sm hover:shadow',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/95 shadow-sm hover:shadow',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/95 shadow-sm hover:shadow',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 shadow-sm hover:shadow',
        success: 'bg-success text-success-foreground hover:bg-success/90 active:bg-success/95 shadow-sm hover:shadow',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90 active:bg-warning/95 shadow-sm hover:shadow',
        error: 'bg-error text-error-foreground hover:bg-error/90 active:bg-error/95 shadow-sm hover:shadow',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        link: 'text-primary underline-offset-4 hover:underline active:text-primary/80',
        // Solar-specific variants
        solar: 'bg-solar-primary text-white hover:bg-solar-secondary active:bg-solar-primary/95 shadow-md hover:shadow-lg',
        energy: 'bg-energy-primary text-white hover:bg-energy-secondary active:bg-energy-primary/95 shadow-md hover:shadow-lg',
        eco: 'bg-eco-primary text-white hover:bg-eco-secondary active:bg-eco-primary/95 shadow-md hover:shadow-lg',
      },
      size: {
        xs: 'h-8 px-2 text-xs rounded-sm',
        sm: 'h-9 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-md',
        lg: 'h-11 px-6 text-base rounded-lg',
        xl: 'h-12 px-8 text-lg rounded-lg',
        // Mobile-optimized sizes
        'mobile-sm': 'h-11 px-4 text-base rounded-md min-w-[44px]',
        'mobile-md': 'h-12 px-6 text-base rounded-md min-w-[44px]', 
        'mobile-lg': 'h-14 px-8 text-lg rounded-lg min-w-[44px]',
        // Icon sizes
        'icon-xs': 'h-8 w-8 rounded-sm',
        'icon-sm': 'h-9 w-9 rounded-md',
        'icon-md': 'h-10 w-10 rounded-md',
        'icon-lg': 'h-11 w-11 rounded-lg',
        'icon-xl': 'h-12 w-12 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Input variants system
export const inputVariants = cva(
  [
    'flex w-full rounded-md border border-input bg-input px-3 py-2',
    'text-sm ring-offset-background file:border-0 file:bg-transparent',
    'file:text-sm file:font-medium placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-colors duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'border-input-border',
        success: 'border-success focus-visible:ring-success',
        warning: 'border-warning focus-visible:ring-warning',
        error: 'border-error focus-visible:ring-error',
      },
      size: {
        sm: 'h-9 px-2 text-sm rounded-sm',
        md: 'h-10 px-3 text-sm rounded-md',
        lg: 'h-11 px-4 text-base rounded-lg',
        // Mobile-optimized sizes
        'mobile-sm': 'h-11 px-3 text-base rounded-md min-h-[44px]',
        'mobile-md': 'h-12 px-4 text-base rounded-md min-h-[44px]',
        'mobile-lg': 'h-14 px-6 text-lg rounded-lg min-h-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Card variants system  
export const cardVariants = cva(
  [
    'rounded-lg border bg-card text-card-foreground',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'shadow-sm border-border',
        elevated: 'shadow-md border-border hover:shadow-lg',
        outline: 'border-2 border-border shadow-none',
        filled: 'bg-muted border-transparent shadow-none',
        // Solar-specific variants
        solar: 'border-solar-primary/20 bg-gradient-to-br from-solar-primary/5 to-transparent shadow-solar-glow/10',
        energy: 'border-energy-primary/20 bg-gradient-to-br from-energy-primary/5 to-transparent shadow-energy-glow/10',
        eco: 'border-eco-primary/20 bg-gradient-to-br from-eco-primary/5 to-transparent shadow-eco-glow/10',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        // Mobile-optimized sizes
        'mobile-sm': 'p-4 mobile-card-spacing',
        'mobile-md': 'p-6 mobile-card-spacing',
        'mobile-lg': 'p-8 mobile-card-spacing',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Badge variants system
export const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full border px-2.5 py-0.5',
    'text-xs font-semibold transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        accent: 'border-transparent bg-accent text-accent-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        error: 'border-transparent bg-error text-error-foreground',
        outline: 'border-border text-foreground',
        // Solar-specific variants
        solar: 'border-transparent bg-solar-primary text-white shadow-sm',
        energy: 'border-transparent bg-energy-primary text-white shadow-sm',
        eco: 'border-transparent bg-eco-primary text-white shadow-sm',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Alert variants system
export const alertVariants = cva(
  [
    'relative w-full rounded-lg border p-4',
    '[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute',
    '[&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  ],
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        success: 'border-success/50 text-success-foreground bg-success/10 [&>svg]:text-success',
        warning: 'border-warning/50 text-warning-foreground bg-warning/10 [&>svg]:text-warning',
        error: 'border-error/50 text-error-foreground bg-error/10 [&>svg]:text-error',
        destructive: 'border-destructive/50 text-destructive-foreground bg-destructive/10 [&>svg]:text-destructive',
        // Solar-specific variants
        solar: 'border-solar-primary/50 text-solar-primary bg-solar-primary/5 [&>svg]:text-solar-primary',
        energy: 'border-energy-primary/50 text-energy-primary bg-energy-primary/5 [&>svg]:text-energy-primary',
        eco: 'border-eco-primary/50 text-eco-primary bg-eco-primary/5 [&>svg]:text-eco-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Progress variants system
export const progressVariants = cva(
  [
    'relative overflow-hidden rounded-full bg-secondary',
  ],
  {
    variants: {
      variant: {
        default: '[&>div]:bg-primary',
        success: '[&>div]:bg-success',
        warning: '[&>div]:bg-warning', 
        error: '[&>div]:bg-error',
        // Solar-specific variants
        solar: '[&>div]:bg-solar-primary',
        energy: '[&>div]:bg-energy-primary [&>div]:shadow-energy-glow/20',
        eco: '[&>div]:bg-eco-primary',
      },
      size: {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Skeleton variants system
export const skeletonVariants = cva(
  [
    'animate-pulse rounded-md bg-muted',
  ],
  {
    variants: {
      variant: {
        default: 'bg-muted',
        circular: 'rounded-full bg-muted',
        text: 'h-4 bg-muted',
        // Solar-specific loading states
        solar: 'bg-solar-primary/10',
        energy: 'bg-energy-primary/10',
        eco: 'bg-eco-primary/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Export all variant types
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type InputVariants = VariantProps<typeof inputVariants>;
export type CardVariants = VariantProps<typeof cardVariants>;
export type BadgeVariants = VariantProps<typeof badgeVariants>;
export type AlertVariants = VariantProps<typeof alertVariants>;
export type ProgressVariants = VariantProps<typeof progressVariants>;
export type SkeletonVariants = VariantProps<typeof skeletonVariants>;

// Utility function to combine variants with custom classes
export const withVariants = <T extends Record<string, any>>(
  baseVariants: T,
  customClass?: string
) => {
  return (props: VariantProps<T>) => cn(baseVariants(props), customClass);
};

// Solar-specific utility classes
export const solarUtilityClasses = {
  // Solar-themed gradients
  gradients: {
    solar: 'bg-gradient-to-r from-solar-primary to-solar-secondary',
    energy: 'bg-gradient-to-r from-energy-primary to-energy-secondary',
    eco: 'bg-gradient-to-r from-eco-primary to-eco-secondary',
    solarRadial: 'bg-gradient-radial from-solar-primary/20 to-transparent',
    energyRadial: 'bg-gradient-radial from-energy-primary/20 to-transparent',
    ecoRadial: 'bg-gradient-radial from-eco-primary/20 to-transparent',
  },
  
  // Solar-themed shadows
  shadows: {
    solar: 'shadow-solar-glow',
    energy: 'shadow-energy-glow',
    eco: 'shadow-eco-glow',
    solarSm: 'shadow-sm shadow-solar-primary/10',
    energySm: 'shadow-sm shadow-energy-primary/10',
    ecoSm: 'shadow-sm shadow-eco-primary/10',
  },
  
  // Solar-themed borders
  borders: {
    solar: 'border-solar-primary',
    energy: 'border-energy-primary',
    eco: 'border-eco-primary',
    solarLight: 'border-solar-primary/30',
    energyLight: 'border-energy-primary/30',
    ecoLight: 'border-eco-primary/30',
  },
} as const;