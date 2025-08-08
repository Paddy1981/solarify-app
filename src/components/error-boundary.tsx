"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Copy,
  Download
} from 'lucide-react';
import { handleErrorBoundary } from '@/lib/error-handling/handler';
import { logger } from '@/lib/error-handling/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'global';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    handleErrorBoundary(error, errorInfo);
    
    // Store error info in state
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to external error tracking service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, this would report to Sentry, Bugsnag, etc.
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        errorId: this.state.errorId,
        level: this.props.level || 'component',
        retryCount: this.state.retryCount,
      };

      logger.error('React Error Boundary Triggered', errorReport);

      // Store error report for debugging
      if (typeof window !== 'undefined') {
        const errorReports = JSON.parse(localStorage.getItem('error_reports') || '[]');
        errorReports.push(errorReport);
        
        // Keep only last 10 error reports
        if (errorReports.length > 10) {
          errorReports.splice(0, errorReports.length - 10);
        }
        
        localStorage.setItem('error_reports', JSON.stringify(errorReports));
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
      }));

      logger.info('Error boundary retry attempted', {
        retryCount: this.state.retryCount + 1,
        errorId: this.state.errorId,
      });
    }
  };

  private handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private copyErrorDetails = () => {
    if (!this.state.error) return;

    const errorDetails = {
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo?.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
    logger.info('Error details copied to clipboard', { errorId: this.state.errorId });
  };

  private downloadErrorReport = () => {
    if (!this.state.error) return;

    const errorReport = {
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo?.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      level: this.props.level || 'component',
    };

    const blob = new Blob([JSON.stringify(errorReport, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${this.state.errorId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render different error UI based on level
      const isGlobal = this.props.level === 'global';
      const isPage = this.props.level === 'page';
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className={`${isGlobal ? 'min-h-screen' : ''} flex items-center justify-center p-4`}>
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              <CardTitle className="text-2xl text-red-900">
                {isGlobal ? 'Application Error' : isPage ? 'Page Error' : 'Component Error'}
              </CardTitle>
              
              <CardDescription className="text-red-700">
                {isGlobal 
                  ? 'Something went wrong with the application'
                  : 'Something went wrong while loading this content'
                }
              </CardDescription>

              {this.state.errorId && (
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    ID: {this.state.errorId}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Retry: {this.state.retryCount}/{this.maxRetries}
                  </Badge>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert className="border-red-200 bg-red-50">
                  <Bug className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Development Error:</strong> {this.state.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center space-y-3">
                <p className="text-muted-foreground">
                  {isGlobal 
                    ? 'We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.'
                    : 'This section couldn\'t load properly. You can try again or continue using other parts of the application.'
                  }
                </p>

                <div className="flex flex-wrap gap-2 justify-center">
                  {canRetry && (
                    <Button onClick={this.handleRetry} variant="default">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again ({this.maxRetries - this.state.retryCount} left)
                    </Button>
                  )}

                  <Button onClick={this.handleRefresh} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Page
                  </Button>

                  {isGlobal && (
                    <Button onClick={this.handleGoHome} variant="outline">
                      <Home className="w-4 h-4 mr-2" />
                      Go Home
                    </Button>
                  )}
                </div>

                {/* Developer tools */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Developer Tools:</p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={this.copyErrorDetails} 
                        variant="ghost" 
                        size="sm"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Error
                      </Button>
                      <Button 
                        onClick={this.downloadErrorReport} 
                        variant="ghost" 
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download Report
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different contexts
export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="global">
      {children}
    </ErrorBoundary>
  );
}

export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="page">
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary level="component" fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

// Hook for handling async errors in components
export function useErrorHandler() {
  return (error: Error, errorInfo?: Partial<ErrorInfo>) => {
    handleErrorBoundary(error, errorInfo as ErrorInfo);
  };
}