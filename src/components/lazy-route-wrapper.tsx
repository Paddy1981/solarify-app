"use client";

import React, { Suspense } from 'react';
import { LoadingComponents } from '@/lib/dynamic-loader';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Something went wrong
          </CardTitle>
          <CardDescription>
            An error occurred while loading this component. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="text-sm bg-muted p-3 rounded-md overflow-auto max-h-32">
            {error.message}
          </pre>
          <Button onClick={resetErrorBoundary} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface LazyRouteWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function LazyRouteWrapper({ 
  children, 
  fallback: FallbackComponent = LoadingComponents.Dashboard,
  onError 
}: LazyRouteWrapperProps) {
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={onError}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<FallbackComponent />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// HOC for wrapping pages with lazy loading
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  options: {
    fallback?: React.ComponentType;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  } = {}
) {
  const WrappedComponent = (props: T) => (
    <LazyRouteWrapper {...options}>
      <Component {...props} />
    </LazyRouteWrapper>
  );

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Intersection Observer hook for viewport-based lazy loading
export function useInViewport<T extends HTMLElement>() {
  const [isInViewport, setIsInViewport] = React.useState(false);
  const [hasBeenInViewport, setHasBeenInViewport] = React.useState(false);
  const ref = React.useRef<T>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inViewport = entry.isIntersecting;
        setIsInViewport(inViewport);
        
        if (inViewport && !hasBeenInViewport) {
          setHasBeenInViewport(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Start loading 100px before entering viewport
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
  }, [hasBeenInViewport]);

  return { ref, isInViewport, hasBeenInViewport };
}

// Component for lazy loading sections within a page
interface LazySection {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function LazySection({ 
  children, 
  fallback, 
  threshold = 0.1, 
  rootMargin = '50px' 
}: LazySection) {
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
      {isVisible ? children : (fallback || <LoadingComponents.Default />)}
    </div>
  );
}