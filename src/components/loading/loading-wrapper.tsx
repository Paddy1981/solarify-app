"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { useLoading } from '@/contexts/loading-context';
import { SmartLoading } from '@/components/ui/smart-loading';
import { LazyContentLoader } from '@/components/ui/smart-loading';
import { 
  SolarCalculatorSkeleton,
  SolarResultsSkeleton,
  EquipmentCatalogSkeleton,
  DashboardAnalyticsSkeleton,
  RFQFormSkeleton,
  QuoteGenerationSkeleton,
  SystemMonitoringSkeleton
} from '@/components/loading/solar-loading-patterns';
import {
  MobileSolarCalculatorSkeleton,
  MobileDashboardSkeleton,
  MobileEquipmentCardSkeleton,
  MobileRFQFormSkeleton,
  MobileListSkeleton,
  MobileNetworkAwareLoading,
  MobileBatteryAwareLoading
} from '@/components/loading/mobile-loading-patterns';
import { ProgressiveReveal, StaggeredGrid } from '@/components/ui/loading-animations';
import { useMobile } from '@/hooks/use-mobile';

// Main Loading Wrapper Component
export interface LoadingWrapperProps {
  children: React.ReactNode;
  loadingId: string;
  skeleton?: 'solar-calculator' | 'solar-results' | 'equipment-catalog' | 
           'dashboard' | 'rfq-form' | 'quote-generation' | 'system-monitoring' | 'custom';
  customSkeleton?: React.ReactNode;
  showProgress?: boolean;
  showEstimatedTime?: boolean;
  showRetry?: boolean;
  enableMobileOptimization?: boolean;
  enableNetworkAware?: boolean;
  enableBatteryAware?: boolean;
  fadeIn?: boolean;
  staggerChildren?: boolean;
  className?: string;
  skeletonProps?: any;
}

export function LoadingWrapper({
  children,
  loadingId,
  skeleton = 'dashboard',
  customSkeleton,
  showProgress = true,
  showEstimatedTime = true,
  showRetry = true,
  enableMobileOptimization = true,
  enableNetworkAware = true,
  enableBatteryAware = true,
  fadeIn = true,
  staggerChildren = false,
  className,
  skeletonProps = {},
}: LoadingWrapperProps) {
  const { getLoadingById } = useLoading();
  const { isMobile } = useMobile();
  const loadingState = getLoadingById(loadingId);
  const isLoading = loadingState?.isLoading || false;

  // Select appropriate skeleton based on device and configuration
  const getSkeletonComponent = React.useCallback(() => {
    if (customSkeleton) return customSkeleton;

    // Mobile-specific skeletons
    if (enableMobileOptimization && isMobile) {
      switch (skeleton) {
        case 'solar-calculator':
          return <MobileSolarCalculatorSkeleton {...skeletonProps} />;
        case 'dashboard':
          return <MobileDashboardSkeleton {...skeletonProps} />;
        case 'equipment-catalog':
          return <MobileEquipmentCardSkeleton {...skeletonProps} />;
        case 'rfq-form':
          return <MobileRFQFormSkeleton {...skeletonProps} />;
        case 'system-monitoring':
          return <MobileListSkeleton items={6} showAvatars {...skeletonProps} />;
        default:
          return <MobileDashboardSkeleton {...skeletonProps} />;
      }
    }

    // Desktop skeletons
    switch (skeleton) {
      case 'solar-calculator':
        return <SolarCalculatorSkeleton {...skeletonProps} />;
      case 'solar-results':
        return <SolarResultsSkeleton {...skeletonProps} />;
      case 'equipment-catalog':
        return <EquipmentCatalogSkeleton {...skeletonProps} />;
      case 'dashboard':
        return <DashboardAnalyticsSkeleton {...skeletonProps} />;
      case 'rfq-form':
        return <RFQFormSkeleton {...skeletonProps} />;
      case 'quote-generation':
        return <QuoteGenerationSkeleton {...skeletonProps} />;
      case 'system-monitoring':
        return <SystemMonitoringSkeleton {...skeletonProps} />;
      default:
        return <DashboardAnalyticsSkeleton {...skeletonProps} />;
    }
  }, [customSkeleton, enableMobileOptimization, isMobile, skeleton, skeletonProps]);

  // Wrap content with progressive enhancements
  let content = (
    <SmartLoading
      id={loadingId}
      fallback={getSkeletonComponent()}
      showProgress={showProgress}
      showEstimatedTime={showEstimatedTime}
      showRetry={showRetry}
      className={className}
    >
      {staggerChildren ? (
        <StaggeredGrid>
          {children}
        </StaggeredGrid>
      ) : fadeIn ? (
        <ProgressiveReveal direction="fade" duration={300}>
          {children}
        </ProgressiveReveal>
      ) : (
        children
      )}
    </SmartLoading>
  );

  // Apply mobile optimizations
  if (enableMobileOptimization && isMobile) {
    if (enableNetworkAware) {
      content = (
        <MobileNetworkAwareLoading fallback={getSkeletonComponent()}>
          {content}
        </MobileNetworkAwareLoading>
      );
    }

    if (enableBatteryAware) {
      content = (
        <MobileBatteryAwareLoading 
          lowBatteryFallback={getSkeletonComponent()}
        >
          {content}
        </MobileBatteryAwareLoading>
      );
    }
  }

  return content;
}

// Specialized Solar Calculator Wrapper
export function SolarCalculatorWrapper({
  children,
  calculationId = 'solar-calculator',
  showCalculationSteps = true,
  className,
  ...props
}: Omit<LoadingWrapperProps, 'skeleton' | 'loadingId'> & {
  calculationId?: string;
  showCalculationSteps?: boolean;
}) {
  return (
    <LoadingWrapper
      loadingId={calculationId}
      skeleton="solar-calculator"
      showProgress={showCalculationSteps}
      showEstimatedTime={showCalculationSteps}
      className={cn("solar-calculator-wrapper", className)}
      skeletonProps={{ showSteps: showCalculationSteps }}
      {...props}
    >
      {children}
    </LoadingWrapper>
  );
}

// Equipment Catalog Wrapper
export function EquipmentCatalogWrapper({
  children,
  catalogId = 'equipment-catalog',
  itemsPerPage = 12,
  enableInfiniteScroll = false,
  className,
  ...props
}: Omit<LoadingWrapperProps, 'skeleton' | 'loadingId'> & {
  catalogId?: string;
  itemsPerPage?: number;
  enableInfiniteScroll?: boolean;
}) {
  const itemsPerRow = props.enableMobileOptimization ? 1 : 3;
  const rows = Math.ceil(itemsPerPage / itemsPerRow);

  return (
    <LoadingWrapper
      loadingId={catalogId}
      skeleton="equipment-catalog"
      staggerChildren={!enableInfiniteScroll}
      className={cn("equipment-catalog-wrapper", className)}
      skeletonProps={{ 
        itemsPerRow, 
        rows,
        enableInfiniteScroll 
      }}
      {...props}
    >
      {children}
    </LoadingWrapper>
  );
}

// Dashboard Wrapper with Multiple Data Sources
export function DashboardWrapper({
  children,
  dashboardId = 'dashboard',
  sections = ['stats', 'charts', 'tables'],
  enableRealTime = false,
  className,
  ...props
}: Omit<LoadingWrapperProps, 'skeleton' | 'loadingId'> & {
  dashboardId?: string;
  sections?: string[];
  enableRealTime?: boolean;
}) {
  return (
    <LoadingWrapper
      loadingId={dashboardId}
      skeleton="dashboard"
      staggerChildren={true}
      showEstimatedTime={!enableRealTime}
      className={cn("dashboard-wrapper", className)}
      skeletonProps={{ 
        sections,
        showRealTimeIndicator: enableRealTime 
      }}
      {...props}
    >
      {children}
    </LoadingWrapper>
  );
}

// RFQ Form Wrapper with Validation States
export function RFQFormWrapper({
  children,
  formId = 'rfq-form',
  steps = 4,
  showValidationProgress = true,
  className,
  ...props
}: Omit<LoadingWrapperProps, 'skeleton' | 'loadingId'> & {
  formId?: string;
  steps?: number;
  showValidationProgress?: boolean;
}) {
  return (
    <LoadingWrapper
      loadingId={formId}
      skeleton="rfq-form"
      showProgress={showValidationProgress}
      className={cn("rfq-form-wrapper", className)}
      skeletonProps={{ 
        steps,
        showValidation: showValidationProgress 
      }}
      {...props}
    >
      {children}
    </LoadingWrapper>
  );
}

// System Monitoring Wrapper with Real-time Updates
export function SystemMonitoringWrapper({
  children,
  systemId,
  monitoringId = `system-monitoring-${systemId}`,
  enableRealTime = true,
  updateInterval = 30000, // 30 seconds
  className,
  ...props
}: Omit<LoadingWrapperProps, 'skeleton' | 'loadingId'> & {
  systemId: string;
  monitoringId?: string;
  enableRealTime?: boolean;
  updateInterval?: number;
}) {
  const { getLoadingById, startLoading, finishLoading } = useLoading();

  // Simulate real-time updates
  React.useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      const loadingState = getLoadingById(monitoringId);
      if (!loadingState?.isLoading) {
        startLoading(monitoringId, {
          type: 'data',
          stage: 'updating',
          estimatedTime: 2000,
        });
        
        // Simulate quick update
        setTimeout(() => {
          finishLoading(monitoringId);
        }, 2000);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [enableRealTime, updateInterval, monitoringId, getLoadingById, startLoading, finishLoading]);

  return (
    <LoadingWrapper
      loadingId={monitoringId}
      skeleton="system-monitoring"
      showEstimatedTime={!enableRealTime}
      className={cn("system-monitoring-wrapper", className)}
      skeletonProps={{ 
        systemId,
        showRealTimeIndicator: enableRealTime,
        updateInterval 
      }}
      {...props}
    >
      {children}
    </LoadingWrapper>
  );
}

// Quote Generation Wrapper with Multi-step Process
export function QuoteGenerationWrapper({
  children,
  quoteId = 'quote-generation',
  includeCalculations = true,
  includePricing = true,
  includeTerms = true,
  className,
  ...props
}: Omit<LoadingWrapperProps, 'skeleton' | 'loadingId'> & {
  quoteId?: string;
  includeCalculations?: boolean;
  includePricing?: boolean;
  includeTerms?: boolean;
}) {
  const steps = [
    includeCalculations && 'calculations',
    includePricing && 'pricing',
    includeTerms && 'terms',
    'generation'
  ].filter(Boolean);

  return (
    <LoadingWrapper
      loadingId={quoteId}
      skeleton="quote-generation"
      showProgress={true}
      showEstimatedTime={true}
      className={cn("quote-generation-wrapper", className)}
      skeletonProps={{ 
        steps: steps.length,
        includeCalculations,
        includePricing,
        includeTerms 
      }}
      {...props}
    >
      {children}
    </LoadingWrapper>
  );
}

// Generic Content Loader with Progressive Enhancement
export function ContentLoader({
  children,
  isLoading,
  skeleton,
  delay = 300,
  fadeIn = true,
  className,
}: {
  children: React.ReactNode;
  isLoading: boolean;
  skeleton: React.ReactNode;
  delay?: number;
  fadeIn?: boolean;
  className?: string;
}) {
  return (
    <LazyContentLoader
      isLoading={isLoading}
      skeleton={skeleton}
      delay={delay}
      fadeIn={fadeIn}
      className={className}
    >
      {children}
    </LazyContentLoader>
  );
}

// Performance-aware wrapper that adjusts based on device capabilities
export function PerformanceAwareWrapper({
  children,
  highPerformanceContent,
  lowPerformanceContent,
  performanceThreshold = 4, // GB RAM threshold
  className,
}: {
  children: React.ReactNode;
  highPerformanceContent?: React.ReactNode;
  lowPerformanceContent?: React.ReactNode;
  performanceThreshold?: number;
  className?: string;
}) {
  const [isLowPerformance, setIsLowPerformance] = React.useState(false);

  React.useEffect(() => {
    if ('navigator' in window && 'deviceMemory' in navigator) {
      const deviceMemory = (navigator as any).deviceMemory;
      setIsLowPerformance(deviceMemory < performanceThreshold);
    } else if ('hardwareConcurrency' in navigator) {
      // Fallback: Use CPU cores as performance indicator
      setIsLowPerformance(navigator.hardwareConcurrency < 4);
    }
  }, [performanceThreshold]);

  let content = children;

  if (isLowPerformance && lowPerformanceContent) {
    content = lowPerformanceContent;
  } else if (!isLowPerformance && highPerformanceContent) {
    content = highPerformanceContent;
  }

  return (
    <div className={cn("performance-aware-wrapper", className)}>
      {content}
    </div>
  );
}