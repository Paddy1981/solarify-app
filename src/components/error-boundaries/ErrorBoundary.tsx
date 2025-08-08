import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorTracker } from '../../lib/monitoring/error-tracker';
import { AlertTriangle, RefreshCcw, Home, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'section' | 'component';
  name?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level = 'component', name, onError } = this.props;
    
    // Capture error with monitoring system
    const errorId = errorTracker.captureException(error, {
      errorBoundary: true,
      level,
      componentName: name,
      componentStack: errorInfo.componentStack,
      errorBoundaryStack: new Error().stack,
      retryCount: this.state.retryCount,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });

    // Add breadcrumb for debugging
    errorTracker.addBreadcrumb(
      `Error caught by ${level} boundary: ${name || 'Unknown'}`,
      'error',
      {
        errorMessage: error.message,
        componentStack: errorInfo.componentStack.split('\n').slice(0, 3).join('\n')
      }
    );

    this.setState({
      errorInfo,
      errorId,
      retryCount: this.state.retryCount + 1
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= 3) {
      errorTracker.addBreadcrumb('Max retry attempts reached', 'error');
      return;
    }

    errorTracker.addBreadcrumb(`Retrying after error (attempt ${retryCount + 1})`, 'user_action');

    // Clear error state after a short delay to allow for re-render
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    }, 100);
  };

  handleReload = () => {
    errorTracker.addBreadcrumb('User triggered page reload from error boundary', 'user_action');
    window.location.reload();
  };

  handleGoHome = () => {
    errorTracker.addBreadcrumb('User navigated to home from error boundary', 'user_action');
    window.location.href = '/';
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback, level = 'component', enableRetry = true, showDetails = false } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render different UI based on error boundary level
      switch (level) {
        case 'page':
          return this.renderPageError();
        case 'section':
          return this.renderSectionError();
        case 'component':
        default:
          return this.renderComponentError();
      }
    }

    return children;
  }

  private renderPageError() {
    const { error, errorId, retryCount } = this.state;
    const { showDetails } = this.props;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            We're sorry, but there was an unexpected error on this page.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardContent className="py-6">
              <div className="space-y-4">
                {errorId && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Error ID: {errorId}</p>
                  </div>
                )}

                <div className="flex flex-col space-y-3">
                  <Button
                    onClick={this.handleRetry}
                    disabled={retryCount >= 3}
                    className="w-full"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Try Again {retryCount > 0 && `(${retryCount}/3)`}
                  </Button>

                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reload Page
                  </Button>

                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go to Homepage
                  </Button>
                </div>

                {showDetails && error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Technical Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 font-mono whitespace-pre-wrap">
                      {error.message}
                      {error.stack && '\n\n' + error.stack}
                    </div>
                  </details>
                )}

                <div className="text-center text-xs text-gray-500">
                  Need help?{' '}
                  <a
                    href="mailto:support@solarify.com"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  private renderSectionError() {
    const { error, errorId, retryCount } = this.state;
    const { enableRetry, showDetails } = this.props;

    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-800">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Section Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-red-700">
              This section encountered an error and couldn't be displayed properly.
            </p>

            {errorId && (
              <p className="text-xs text-red-600">Error ID: {errorId}</p>
            )}

            {enableRetry && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={this.handleRetry}
                  disabled={retryCount >= 3}
                  variant="outline"
                >
                  <RefreshCcw className="mr-1 h-3 w-3" />
                  Retry {retryCount > 0 && `(${retryCount}/3)`}
                </Button>

                <Button
                  size="sm"
                  onClick={this.handleReload}
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>
            )}

            {showDetails && error && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                  Show Details
                </summary>
                <div className="mt-1 p-2 bg-red-100 rounded text-xs text-red-800 font-mono whitespace-pre-wrap">
                  {error.message}
                </div>
              </details>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  private renderComponentError() {
    const { error, retryCount } = this.state;
    const { enableRetry } = this.props;

    return (
      <div className="border border-red-200 bg-red-50 rounded-md p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Component Error
            </h3>
            <p className="mt-1 text-sm text-red-700">
              This component failed to render.
            </p>
            {enableRetry && (
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={this.handleRetry}
                  disabled={retryCount >= 3}
                  variant="outline"
                  className="text-xs"
                >
                  <RefreshCcw className="mr-1 h-3 w-3" />
                  Retry {retryCount > 0 && `(${retryCount}/3)`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// Default export for easier imports
export default ErrorBoundary;