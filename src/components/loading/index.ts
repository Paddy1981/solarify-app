// Import React for component factories
import React from 'react';

// Enhanced Skeleton Components
export * from '../ui/advanced-skeleton';

// Smart Loading Components
export * from '../ui/smart-loading';

// Animation Components  
export * from '../ui/loading-animations';

// Solar-specific Loading Patterns
export * from './solar-loading-patterns';

// Mobile Loading Patterns
export * from './mobile-loading-patterns';

// Loading Wrapper Components
export * from './loading-wrapper';
import { LoadingWrapper } from './loading-wrapper';

// Context and Hooks
export * from '../../contexts/loading-context';
export * from '../../hooks/use-performance-monitoring';
export * from '../../hooks/use-loading-integration';

// Type exports for convenience
export type {
  LoadingState,
  LoadingContextValue,
  PerformanceMetrics,
  PerformanceBudget,
} from '../../contexts/loading-context';

export type {
  SkeletonProps,
  LoadingIconProps,
  ProgressiveRevealProps,
  StaggeredGridProps,
} from '../ui/advanced-skeleton';

// Utility constants
export const LOADING_STAGES = {
  SOLAR_CALCULATION: [
    'Initializing calculation',
    'Analyzing location data', 
    'Calculating solar irradiance',
    'Processing energy requirements',
    'Evaluating equipment options',
    'Optimizing system design',
    'Calculating financial metrics',
    'Generating recommendations',
    'Finalizing results'
  ],
  EQUIPMENT_SEARCH: [
    'Initializing search',
    'Applying filters',
    'Querying equipment database', 
    'Processing compatibility',
    'Calculating pricing',
    'Sorting results',
    'Finalizing search'
  ],
  RFQ_FORM: [
    'Validating form data',
    'Processing requirements',
    'Generating RFQ',
    'Submitting request',
    'Confirming submission'
  ],
  DASHBOARD_DATA: [
    'Loading system data',
    'Fetching performance metrics',
    'Calculating analytics',
    'Processing charts',
    'Finalizing dashboard'
  ],
  QUOTE_GENERATION: [
    'Processing requirements',
    'Calculating system design',
    'Analyzing pricing',
    'Generating terms',
    'Finalizing quote'
  ]
} as const;

export const PERFORMANCE_BUDGETS = {
  FAST: {
    maxLoadingTime: 1000,
    maxRetryAttempts: 2,
    targetSuccessRate: 98,
    maxErrorRate: 2,
  },
  NORMAL: {
    maxLoadingTime: 2000,
    maxRetryAttempts: 3,
    targetSuccessRate: 95,
    maxErrorRate: 5,
  },
  SLOW: {
    maxLoadingTime: 4000,
    maxRetryAttempts: 5,
    targetSuccessRate: 90,
    maxErrorRate: 10,
  }
} as const;

// Component factories for common use cases
export const createSolarLoadingComponent = (
  skeleton: 'calculator' | 'results' | 'equipment' | 'dashboard' | 'rfq' | 'quote' | 'monitoring',
  options?: {
    enableMobile?: boolean;
    enableNetworkAware?: boolean;
    enableBatteryAware?: boolean;
    showProgress?: boolean;
    showEstimatedTime?: boolean;
  }
) => {
  return function SolarLoadingComponent({ 
    children, 
    loadingId,
    className,
    ...props 
  }: {
    children: React.ReactNode;
    loadingId: string;
    className?: string;
    [key: string]: any;
  }) {
    const skeletonMap = {
      calculator: 'solar-calculator',
      results: 'solar-results', 
      equipment: 'equipment-catalog',
      dashboard: 'dashboard',
      rfq: 'rfq-form',
      quote: 'quote-generation',
      monitoring: 'system-monitoring'
    } as const;

    return (
      <LoadingWrapper
        loadingId={loadingId}
        skeleton={skeletonMap[skeleton]}
        enableMobileOptimization={options?.enableMobile ?? true}
        enableNetworkAware={options?.enableNetworkAware ?? true}
        enableBatteryAware={options?.enableBatteryAware ?? true}
        showProgress={options?.showProgress ?? true}
        showEstimatedTime={options?.showEstimatedTime ?? true}
        className={className}
        {...props}
      >
        {children}
      </LoadingWrapper>
    );
  };
};

// Pre-configured components for common patterns
export const SolarCalculatorLoader = createSolarLoadingComponent('calculator');
export const SolarResultsLoader = createSolarLoadingComponent('results');
export const EquipmentCatalogLoader = createSolarLoadingComponent('equipment');
export const DashboardLoader = createSolarLoadingComponent('dashboard');
export const RFQFormLoader = createSolarLoadingComponent('rfq');
export const QuoteGenerationLoader = createSolarLoadingComponent('quote');
export const SystemMonitoringLoader = createSolarLoadingComponent('monitoring');

// HOC for adding loading capabilities to existing components
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingConfig: {
    loadingId: string;
    skeleton?: keyof typeof createSolarLoadingComponent;
    enableMobile?: boolean;
    showProgress?: boolean;
  }
) {
  return function WithLoadingComponent(props: P) {
    const LoadingComponent = createSolarLoadingComponent(
      loadingConfig.skeleton || 'dashboard',
      {
        enableMobile: loadingConfig.enableMobile,
        showProgress: loadingConfig.showProgress,
      }
    );

    return (
      <LoadingComponent loadingId={loadingConfig.loadingId}>
        <Component {...props} />
      </LoadingComponent>
    );
  };
}

// Utility functions for loading state management
export const loadingUtils = {
  /**
   * Create a standardized loading ID based on component and context
   */
  createLoadingId: (component: string, context?: string) => {
    return context ? `${component}-${context}` : component;
  },

  /**
   * Get appropriate skeleton based on content type
   */
  getSkeletonForContent: (contentType: string) => {
    const skeletonMap: Record<string, string> = {
      calculator: 'solar-calculator',
      results: 'solar-results',
      equipment: 'equipment-catalog',
      catalog: 'equipment-catalog',
      dashboard: 'dashboard',
      analytics: 'dashboard',
      form: 'rfq-form',
      rfq: 'rfq-form',
      quote: 'quote-generation',
      monitoring: 'system-monitoring',
      system: 'system-monitoring',
    };
    
    return skeletonMap[contentType] || 'dashboard';
  },

  /**
   * Get performance budget based on operation complexity
   */
  getBudgetForOperation: (operationType: 'simple' | 'normal' | 'complex') => {
    const budgetMap = {
      simple: PERFORMANCE_BUDGETS.FAST,
      normal: PERFORMANCE_BUDGETS.NORMAL,
      complex: PERFORMANCE_BUDGETS.SLOW,
    };
    
    return budgetMap[operationType];
  },

  /**
   * Get loading stages for specific operation
   */
  getStagesForOperation: (operation: keyof typeof LOADING_STAGES) => {
    return LOADING_STAGES[operation] || [];
  },
};

// Re-export the main wrapper for convenience
export { LoadingWrapper } from './loading-wrapper';