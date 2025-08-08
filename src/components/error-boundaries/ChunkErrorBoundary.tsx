import React, { Component, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { errorTracker } from '../../lib/monitoring/error-tracker';
import { RefreshCcw, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ChunkErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onChunkError?: (error: Error) => void;
}

interface ChunkErrorBoundaryState {
  hasChunkError: boolean;
  chunkError: Error | null;
  isRefreshing: boolean;
}

/**
 * ChunkErrorBoundary specifically handles chunk loading errors
 * that occur during code splitting and lazy loading
 */
export class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  private refreshTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasChunkError: false,
      chunkError: null,
      isRefreshing: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChunkErrorBoundaryState> {
    // Check if this is a chunk loading error
    const isChunkError = ChunkErrorBoundary.isChunkLoadingError(error);
    
    if (isChunkError) {
      return {
        hasChunkError: true,
        chunkError: error
      };
    }

    // If not a chunk error, let parent error boundary handle it
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onChunkError } = this.props;

    if (ChunkErrorBoundary.isChunkLoadingError(error)) {
      // Track chunk loading error
      errorTracker.captureException(error, {
        chunkError: true,
        componentStack: errorInfo.componentStack,
        chunkLoadingFailure: true,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: Date.now()
      });

      errorTracker.addBreadcrumb(
        'Chunk loading error detected',
        'error',
        {
          errorMessage: error.message,
          errorName: error.name
        }
      );

      // Call custom chunk error handler
      onChunkError?.(error);

      // Automatically attempt to refresh after a short delay
      this.scheduleAutoRefresh();
    }
  }

  private static isChunkLoadingError(error: Error): boolean {
    const chunkErrorPatterns = [
      /Loading chunk \d+ failed/i,
      /Loading CSS chunk \d+ failed/i,
      /ChunkLoadError/i,
      /Failed to import/i,
      /NetworkError.*chunk/i,
      /fetch.*chunk.*failed/i,
      /Script error.*chunk/i,
      /Unable to preload CSS/i,
      /SyntaxError.*Unexpected token/i, // Can happen with corrupted chunks
      /TypeError.*fetch/i // Network issues while loading chunks
    ];

    return chunkErrorPatterns.some(pattern => 
      pattern.test(error.message) || 
      pattern.test(error.name) ||
      (error.stack && pattern.test(error.stack))
    );
  }

  private scheduleAutoRefresh = () => {
    // Auto-refresh after 3 seconds if user doesn't manually refresh
    this.refreshTimeoutId = setTimeout(() => {
      if (this.state.hasChunkError && !this.state.isRefreshing) {
        errorTracker.addBreadcrumb('Auto-refreshing due to chunk error', 'system');
        this.handleRefresh();
      }
    }, 3000);
  };

  handleRefresh = () => {
    errorTracker.addBreadcrumb('User triggered refresh for chunk error', 'user_action');
    
    this.setState({ isRefreshing: true });

    // Clear any scheduled auto-refresh
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }

    // Force a hard refresh to reload all chunks
    window.location.reload();
  };

  handleClearCache = () => {
    errorTracker.addBreadcrumb('User triggered cache clear for chunk error', 'user_action');
    
    // Clear various caches if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
        this.handleRefresh();
      }).catch(() => {
        // Fallback to regular refresh if cache clearing fails
        this.handleRefresh();
      });
    } else {
      this.handleRefresh();
    }
  };

  componentWillUnmount() {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
    }
  }

  render() {
    const { children, fallback } = this.props;
    const { hasChunkError, chunkError, isRefreshing } = this.state;

    if (hasChunkError && chunkError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      return this.renderChunkErrorUI();
    }

    return (
      <ErrorBoundary
        level="section"
        name="ChunkErrorBoundary"
        enableRetry={false} // We handle our own retry logic
      >
        {children}
      </ErrorBoundary>
    );
  }

  private renderChunkErrorUI() {
    const { isRefreshing } = this.state;

    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <Download className="mr-2 h-5 w-5" />
              Loading Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                There was a problem loading part of the application. This usually happens due to:
              </p>
              
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Network connectivity issues</li>
                <li>Server deployment in progress</li>
                <li>Cached files that need updating</li>
              </ul>

              {isRefreshing ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Refreshing...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={this.handleRefresh}
                    className="w-full"
                    size="sm"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh Page
                  </Button>
                  
                  <Button
                    onClick={this.handleClearCache}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    Clear Cache & Refresh
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Auto-refreshing in a few seconds...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

// Higher-order component for wrapping lazy-loaded components
export function withChunkErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ChunkErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <ChunkErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ChunkErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withChunkErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for creating chunk-safe lazy components
export function useChunkSafeLazy<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      // If it's a chunk loading error, throw it to be caught by ChunkErrorBoundary
      if (error instanceof Error && ChunkErrorBoundary.isChunkLoadingError) {
        errorTracker.captureException(error, {
          chunkError: true,
          lazyComponentImport: true
        });
      }
      throw error;
    }
  });

  return (props: React.ComponentProps<T>) => (
    <ChunkErrorBoundary>
      <React.Suspense fallback={fallback || <div>Loading...</div>}>
        <LazyComponent {...props} />
      </React.Suspense>
    </ChunkErrorBoundary>
  );
}

export default ChunkErrorBoundary;