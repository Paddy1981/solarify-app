import React, { Component, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { ErrorBoundary } from './ErrorBoundary';
import { errorTracker } from '../../lib/monitoring/error-tracker';
import { Home, ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  routeName?: string;
}

interface RouteErrorBoundaryState {
  hasRouteError: boolean;
  routeError: Error | null;
  errorRoute: string | null;
}

/**
 * RouteErrorBoundary handles errors specific to route navigation
 * and provides route-aware error recovery options
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasRouteError: false,
      routeError: null,
      errorRoute: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    return {
      hasRouteError: true,
      routeError: error,
      errorRoute: typeof window !== 'undefined' ? window.location.pathname : null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { routeName } = this.props;
    const currentRoute = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
    
    errorTracker.captureException(error, {
      routeError: true,
      route: currentRoute,
      routeName: routeName,
      componentStack: errorInfo.componentStack,
      referrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
    });

    errorTracker.addBreadcrumb(
      `Route error in ${routeName || currentRoute}`,
      'error',
      {
        errorMessage: error.message,
        route: currentRoute
      }
    );

    this.setState({
      errorRoute: currentRoute
    });
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    // Reset error state when route changes (for client-side navigation)
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const { errorRoute } = this.state;
      
      if (errorRoute && currentPath !== errorRoute) {
        errorTracker.addBreadcrumb('Route changed - resetting error state', 'navigation');
        this.setState({
          hasRouteError: false,
          routeError: null,
          errorRoute: null
        });
      }
    }
  }

  handleGoBack = () => {
    errorTracker.addBreadcrumb('User navigated back from route error', 'user_action');
    window.history.back();
  };

  handleGoHome = () => {
    errorTracker.addBreadcrumb('User navigated to home from route error', 'user_action');
    window.location.href = '/';
  };

  handleRetry = () => {
    errorTracker.addBreadcrumb('User retried route after error', 'user_action');
    window.location.reload();
  };

  render() {
    const { children, fallback, routeName } = this.props;
    const { hasRouteError, routeError, errorRoute } = this.state;

    if (hasRouteError && routeError) {
      if (fallback) {
        return fallback;
      }

      return this.renderRouteErrorUI();
    }

    return (
      <ErrorBoundary
        level="page"
        name={`Route: ${routeName || 'Unknown'}`}
        enableRetry={true}
        showDetails={false}
      >
        {children}
      </ErrorBoundary>
    );
  }

  private renderRouteErrorUI() {
    const { routeError, errorRoute } = this.state;
    const { routeName } = this.props;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Page Not Working
            </h1>
            <p className="text-gray-600 mb-8">
              There was an error loading this page.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center text-lg">
                What happened?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>Route:</strong> {errorRoute || 'Unknown'}
                  </p>
                  {routeName && (
                    <p>
                      <strong>Page:</strong> {routeName}
                    </p>
                  )}
                  <p>
                    <strong>Error:</strong> {routeError?.message || 'Unknown error occurred'}
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={this.handleGoBack}
                      variant="outline"
                      size="sm"
                    >
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      Go Back
                    </Button>

                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      size="sm"
                    >
                      <Home className="mr-1 h-3 w-3" />
                      Home
                    </Button>
                  </div>
                </div>

                <div className="text-center text-xs text-gray-500">
                  If this problem persists, please{' '}
                  <a
                    href="mailto:support@solarify.com"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    contact support
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}

// Hook for route-aware error boundary
export function useRouteErrorBoundary() {
  const router = useRouter();
  
  React.useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      errorTracker.addBreadcrumb(`Route change started: ${url}`, 'navigation');
    };

    const handleRouteChangeComplete = (url: string) => {
      errorTracker.addBreadcrumb(`Route change completed: ${url}`, 'navigation');
      errorTracker.setContext('currentRoute', url);
    };

    const handleRouteChangeError = (err: Error, url: string) => {
      errorTracker.captureException(err, {
        routeChangeError: true,
        targetUrl: url,
        currentUrl: router.asPath
      });
      
      errorTracker.addBreadcrumb(`Route change error: ${url}`, 'error', {
        error: err.message
      });
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  return {
    currentRoute: router.asPath,
    routeName: router.pathname
  };
}

// Higher-order component for wrapping pages with route error boundary
export function withRouteErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  routeName?: string
) {
  const WrappedComponent = (props: P) => {
    return (
      <RouteErrorBoundary routeName={routeName}>
        <Component {...props} />
      </RouteErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withRouteErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default RouteErrorBoundary;