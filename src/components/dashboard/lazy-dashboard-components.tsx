"use client";

import React from 'react';
import { createDynamicComponent, LoadingComponents } from '@/lib/dynamic-loader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Chart loading skeleton
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

// Stats grid loading skeleton
function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Form skeleton
function FormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-24" />
      </CardContent>
    </Card>
  );
}

// Lazy-loaded dashboard components
export const LazyDashboardComponents = {
  // Charts
  PerformanceChart: createDynamicComponent(
    () => import('@/components/dashboard/performance-chart'),
    { loading: ChartSkeleton, displayName: 'LazyPerformanceChart' }
  ),

  // Environmental impact
  EnvironmentalImpactCard: createDynamicComponent(
    () => import('@/components/dashboard/environmental-impact-card'),
    { loading: () => <Skeleton className="h-48 w-full" />, displayName: 'LazyEnvironmentalImpactCard' }
  ),

  // System setup form (heavy component)
  SystemSetupForm: createDynamicComponent(
    () => import('@/components/dashboard/system-setup-form'),
    { loading: FormSkeleton, displayName: 'LazySystemSetupForm' }
  ),

  // Solar journey choice form
  SolarJourneyChoiceForm: createDynamicComponent(
    () => import('@/components/dashboard/solar-journey-choice-form'),
    { loading: FormSkeleton, displayName: 'LazySolarJourneyChoiceForm' }
  ),

  // New to solar dashboard content (heavy component)
  NewToSolarDashboardContent: createDynamicComponent(
    () => import('@/components/dashboard/new-to-solar-dashboard-content'),
    { loading: LoadingComponents.Dashboard, displayName: 'LazyNewToSolarDashboardContent' }
  ),

  // RFQ status card
  HomeownerRfqStatusCard: createDynamicComponent(
    () => import('@/components/dashboard/homeowner-rfq-status-card'),
    { loading: () => <Skeleton className="h-32 w-full" />, displayName: 'LazyHomeownerRfqStatusCard' }
  ),

  // Energy calculator (very heavy component)
  EnergyCalculator: createDynamicComponent(
    () => import('@/components/homeowner/energy-calculator-form'),
    { loading: FormSkeleton, displayName: 'LazyEnergyCalculator' }
  ),

  // Savings tracker
  SavingsTracker: createDynamicComponent(
    () => import('@/components/homeowner/savings-tracker/savings-overview-card'),
    { loading: ChartSkeleton, displayName: 'LazySavingsTracker' }
  ),

  // Analytics components
  Analytics: createDynamicComponent(
    () => import('@/components/analytics/solar-performance-dashboard'),
    { loading: ChartSkeleton, displayName: 'LazyAnalytics' }
  ),

  // Maintenance tasks
  MaintenanceTasks: createDynamicComponent(
    () => import('@/components/homeowner/maintenance-task-card'),
    { loading: () => <Skeleton className="h-64 w-full" />, displayName: 'LazyMaintenanceTasks' }
  ),
};

// Lazy route components for better code splitting
export const LazyRouteComponents = {
  // Dashboard pages
  HomeownerDashboard: createDynamicComponent(
    () => import('@/app/homeowner/dashboard/page'),
    { loading: LoadingComponents.Dashboard, displayName: 'LazyHomeownerDashboard' }
  ),

  InstallerDashboard: createDynamicComponent(
    () => import('@/app/installer/dashboard/page'),
    { loading: LoadingComponents.Dashboard, displayName: 'LazyInstallerDashboard' }
  ),

  SupplierDashboard: createDynamicComponent(
    () => import('@/app/supplier/dashboard/page'),
    { loading: LoadingComponents.Dashboard, displayName: 'LazySupplierDashboard' }
  ),

  // Settings pages
  Settings: createDynamicComponent(
    () => import('@/app/settings/page'),
    { loading: FormSkeleton, displayName: 'LazySettings' }
  ),

  // Store page
  Store: createDynamicComponent(
    () => import('@/app/supplier/store/page'),
    { loading: LoadingComponents.Store, displayName: 'LazyStore' }
  ),

  // Portfolio page
  Portfolio: createDynamicComponent(
    () => import('@/app/installer/portfolio/page'),
    { loading: LoadingComponents.Portfolio, displayName: 'LazyPortfolio' }
  ),

  // RFQ pages
  RfqList: createDynamicComponent(
    () => import('@/app/homeowner/rfq/page'),
    { loading: LoadingComponents.Form, displayName: 'LazyRfqList' }
  ),

  // Quote pages
  QuoteList: createDynamicComponent(
    () => import('@/app/homeowner/quotes/page'),
    { loading: LoadingComponents.Form, displayName: 'LazyQuoteList' }
  ),

  // Analytics pages
  HomeownerAnalytics: createDynamicComponent(
    () => import('@/app/homeowner/savings-tracker/page'),
    { loading: ChartSkeleton, displayName: 'LazyHomeownerAnalytics' }
  ),

  InstallerAnalytics: createDynamicComponent(
    () => import('@/app/installer/analytics/page'),
    { loading: ChartSkeleton, displayName: 'LazyInstallerAnalytics' }
  ),

  SupplierAnalytics: createDynamicComponent(
    () => import('@/app/supplier/analytics/page'),
    { loading: ChartSkeleton, displayName: 'LazySupplierAnalytics' }
  ),
};

// Heavy third-party component lazy loading
export const LazyThirdPartyComponents = {
  // MFA setup (uses QR code generation)
  MfaSetup: createDynamicComponent(
    () => import('@/components/auth/mfa-setup'),
    { loading: FormSkeleton, displayName: 'LazyMfaSetup' }
  ),

  // Review components
  ReviewForm: createDynamicComponent(
    () => import('@/components/reviews/review-form'),
    { loading: FormSkeleton, displayName: 'LazyReviewForm' }
  ),

  // Chart libraries
  RechartsComponent: createDynamicComponent(
    () => import('@/components/dashboard/performance-chart'),
    { loading: ChartSkeleton, displayName: 'LazyRechartsComponent' }
  ),
};

// Intersection Observer based lazy loading hook
export function useLazyLoad<T extends HTMLElement>() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const ref = React.useRef<T>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          // Add a small delay to avoid loading too many components at once
          setTimeout(() => setIsLoaded(true), 100);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [isVisible]);

  return { ref, isVisible, isLoaded };
}

// Viewport-based component loader
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function LazyLoad({ children, fallback, threshold = 0.1, rootMargin = '50px' }: LazyLoadProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <Skeleton className="h-32 w-full" />)}
    </div>
  );
}