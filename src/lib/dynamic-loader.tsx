import React, { Suspense, ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading component for dynamic imports
function DynamicLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Dashboard loading skeleton
function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-8 w-16 mt-2" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Form loading skeleton
function FormSkeleton() {
  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          
          <div className="flex space-x-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Portfolio loading skeleton
function PortfolioSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-48 w-full rounded-t-lg" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Store loading skeleton
function StoreSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Search and filters */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      
      {/* Product grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-40 w-full rounded-t-lg" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Generic dynamic loader with error boundary
export function createDynamicComponent<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  options: {
    loading?: ComponentType;
    fallback?: ComponentType;
    displayName?: string;
  } = {}
) {
  const { loading: LoadingComponent = DynamicLoader, fallback, displayName } = options;

  const DynamicComponent = dynamic(loader, {
    loading: () => <LoadingComponent />,
    ssr: false,
  });

  if (displayName) {
    DynamicComponent.displayName = displayName;
  }

  return function WrappedDynamicComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <DynamicComponent {...props} />
      </Suspense>
    );
  };
}

// Specific loading components for different page types
export const LoadingComponents = {
  Dashboard: DashboardSkeleton,
  Form: FormSkeleton,
  Portfolio: PortfolioSkeleton,
  Store: StoreSkeleton,
  Default: DynamicLoader,
};

// Pre-built dynamic components for common heavy components
export const DynamicComponents = {
  // Dashboard components
  HomeownerDashboard: createDynamicComponent(
    () => import('@/app/homeowner/dashboard/page'),
    { loading: DashboardSkeleton, displayName: 'HomeownerDashboard' }
  ),
  
  InstallerDashboard: createDynamicComponent(
    () => import('@/app/installer/dashboard/page'),
    { loading: DashboardSkeleton, displayName: 'InstallerDashboard' }
  ),
  
  SupplierDashboard: createDynamicComponent(
    () => import('@/app/supplier/dashboard/page'),
    { loading: DashboardSkeleton, displayName: 'SupplierDashboard' }
  ),

  // Analytics components
  Analytics: createDynamicComponent(
    () => import('@/components/dashboard/performance-chart'),
    { loading: () => <Skeleton className="h-64 w-full" />, displayName: 'Analytics' }
  ),

  // Heavy form components
  EnergyCalculator: createDynamicComponent(
    () => import('@/components/homeowner/energy-calculator-form'),
    { loading: FormSkeleton, displayName: 'EnergyCalculator' }
  ),

  RfqForm: createDynamicComponent(
    () => import('@/components/homeowner/rfq-form'),
    { loading: FormSkeleton, displayName: 'RfqForm' }
  ),

  // Store components
  ProductStore: createDynamicComponent(
    () => import('@/app/supplier/store/page'),
    { loading: StoreSkeleton, displayName: 'ProductStore' }
  ),

  // Portfolio components
  Portfolio: createDynamicComponent(
    () => import('@/app/installer/portfolio/page'),
    { loading: PortfolioSkeleton, displayName: 'Portfolio' }
  ),

  // Settings components
  MfaSetup: createDynamicComponent(
    () => import('@/components/auth/mfa-setup'),
    { loading: FormSkeleton, displayName: 'MfaSetup' }
  ),
};

// Route-based code splitting utility
export function createRouteComponent(
  loader: () => Promise<{ default: ComponentType<any> }>,
  loadingComponent?: ComponentType
) {
  return dynamic(loader, {
    loading: loadingComponent || (() => <DynamicLoader />),
    ssr: false,
  });
}

// Image lazy loading component
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function LazyImage({ src, alt, className, width, height, priority = false }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const shouldLoad = priority || isInView;

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!isLoaded && shouldLoad && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
}