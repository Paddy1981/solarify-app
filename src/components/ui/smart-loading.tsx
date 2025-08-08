"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { useLoading, type LoadingState } from '@/contexts/loading-context';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/advanced-skeleton';
import { 
  Loader2, 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Zap,
  Sun,
  Calculator,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';

export interface SmartLoadingProps {
  id: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  showProgress?: boolean;
  showEstimatedTime?: boolean;
  showRetry?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function SmartLoading({
  id,
  fallback,
  errorFallback,
  showProgress = true,
  showEstimatedTime = true,
  showRetry = true,
  children,
  className,
}: SmartLoadingProps) {
  const { getLoadingById, retry, clearLoading, getEstimatedTimeRemaining } = useLoading();
  const loadingState = getLoadingById(id);
  const estimatedTime = getEstimatedTimeRemaining(id);

  if (!loadingState || !loadingState.isLoading) {
    return <>{children}</>;
  }

  if (loadingState.error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-6 text-center", className)}>
        {errorFallback || (
          <ErrorState
            error={loadingState.error}
            retryCount={loadingState.retryCount}
            onRetry={showRetry ? () => retry(id) : undefined}
            onClear={() => clearLoading(id)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-6", className)}>
      {fallback || (
        <LoadingState
          loadingState={loadingState}
          showProgress={showProgress}
          showEstimatedTime={showEstimatedTime}
          estimatedTime={estimatedTime}
        />
      )}
    </div>
  );
}

interface LoadingStateProps {
  loadingState: LoadingState;
  showProgress: boolean;
  showEstimatedTime: boolean;
  estimatedTime: number | null;
}

function LoadingState({
  loadingState,
  showProgress,
  showEstimatedTime,
  estimatedTime,
}: LoadingStateProps) {
  const getLoadingIcon = (type?: string) => {
    switch (type) {
      case 'calculation':
        return <Calculator className="w-6 h-6" />;
      case 'data':
        return <Database className="w-6 h-6" />;
      case 'navigation':
        return <Zap className="w-6 h-6" />;
      default:
        return <Sun className="w-6 h-6" />;
    }
  };

  const formatEstimatedTime = (ms: number | null) => {
    if (!ms) return null;
    
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4 w-full max-w-md">
      {/* Loading Icon and Stage */}
      <div className="flex flex-col items-center space-y-2">
        <div className="relative">
          <div className="animate-spin text-solar-primary">
            {getLoadingIcon(loadingState.type)}
          </div>
          <div className="absolute inset-0 animate-pulse bg-solar-primary/20 rounded-full blur-lg" />
        </div>
        
        <div className="text-center">
          <h3 className="font-medium text-foreground capitalize">
            {loadingState.stage || 'Loading'}
          </h3>
          
          {showEstimatedTime && estimatedTime && (
            <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              <span>{formatEstimatedTime(estimatedTime)} remaining</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <Progress 
            value={loadingState.progress} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{loadingState.progress.toFixed(0)}% complete</span>
            {loadingState.retryCount > 0 && (
              <span>Attempt {loadingState.retryCount + 1}</span>
            )}
          </div>
        </div>
      )}

      {/* Additional Details */}
      {loadingState.details && (
        <div className="text-center text-sm text-muted-foreground">
          {typeof loadingState.details.message === 'string' && (
            <p>{loadingState.details.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  retryCount: number;
  onRetry?: () => void;
  onClear: () => void;
}

function ErrorState({ error, retryCount, onRetry, onClear }: ErrorStateProps) {
  return (
    <div className="space-y-4 w-full max-w-md">
      <div className="flex flex-col items-center space-y-2">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <div className="text-center">
          <h3 className="font-medium text-destructive">Loading Failed</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {retryCount} {retryCount === 1 ? 'retry' : 'retries'} attempted
            </p>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
        <Button
          onClick={onClear}
          variant="ghost"
          size="sm"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Progressive Loading Component
export interface ProgressiveLoadingProps {
  stages: Array<{
    name: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
  currentStage: number;
  progress: number;
  className?: string;
}

export function ProgressiveLoading({
  stages,
  currentStage,
  progress,
  className,
}: ProgressiveLoadingProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Stage Progress Indicators */}
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                index <= currentStage
                  ? "bg-solar-primary text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index < currentStage ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : index === currentStage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                index + 1
              )}
            </div>
            
            <div className="text-center">
              <div className="text-xs font-medium">{stage.name}</div>
              {stage.description && (
                <div className="text-xs text-muted-foreground">{stage.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Connecting Lines */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted transform -translate-y-1/2" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-solar-primary transform -translate-y-1/2 transition-all duration-500"
          style={{ width: `${(currentStage / Math.max(stages.length - 1, 1)) * 100}%` }}
        />
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}

// Network-aware Loading Component
export interface NetworkAwareLoadingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  offlineMessage?: string;
}

export function NetworkAwareLoading({
  children,
  fallback,
  offlineMessage = "You're currently offline. Some features may be limited.",
}: NetworkAwareLoadingProps) {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <Card className="border-warning bg-warning/5">
        <CardContent className="flex items-center space-x-3 p-4">
          <WifiOff className="w-5 h-5 text-warning" />
          <div className="flex-1">
            <p className="text-sm font-medium">Offline Mode</p>
            <p className="text-xs text-muted-foreground">{offlineMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

// Lazy Content Loader with Skeleton
export interface LazyContentLoaderProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  fadeIn?: boolean;
  className?: string;
}

export function LazyContentLoader({
  isLoading,
  skeleton,
  children,
  delay = 0,
  fadeIn = true,
  className,
}: LazyContentLoaderProps) {
  const [shouldShowSkeleton, setShouldShowSkeleton] = React.useState(isLoading);
  const [shouldShowContent, setShouldShowContent] = React.useState(!isLoading);

  React.useEffect(() => {
    if (isLoading) {
      setShouldShowContent(false);
      const timer = setTimeout(() => {
        setShouldShowSkeleton(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setShouldShowSkeleton(false);
      setShouldShowContent(true);
    }
  }, [isLoading, delay]);

  return (
    <div className={cn("relative", className)}>
      {shouldShowSkeleton && (
        <div
          className={cn(
            "absolute inset-0 z-10",
            fadeIn && "animate-in fade-in duration-200"
          )}
        >
          {skeleton}
        </div>
      )}
      
      <div
        className={cn(
          "transition-opacity duration-300",
          shouldShowContent ? "opacity-100" : "opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}