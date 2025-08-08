"use client";

import React, { Component, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ChunkErrorBoundary } from './ChunkErrorBoundary';
import { AsyncErrorBoundary } from './AsyncErrorBoundary';
import { errorTracker } from '../../lib/monitoring/error-tracker';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

interface GlobalErrorBoundaryState {
  hasGlobalError: boolean;
  errorCount: number;
  lastErrorTime: number;
}

/**
 * GlobalErrorBoundary provides comprehensive error handling
 * at the application root level with cascading error boundaries
 */
export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  private errorResetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasGlobalError: false,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  componentDidMount() {
    // Set up global error tracking
    this.setupGlobalErrorHandlers();
    
    // Initialize error boundary context
    errorTracker.setContext('errorBoundary', {
      level: 'global',
      hasGlobalBoundary: true,
      mountTime: Date.now()
    });

    errorTracker.addBreadcrumb('Global error boundary mounted', 'lifecycle');
  }

  componentWillUnmount() {
    this.cleanupGlobalErrorHandlers();
    
    if (this.errorResetTimeoutId) {
      clearTimeout(this.errorResetTimeoutId);
    }
  }

  private setupGlobalErrorHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', this.handleGlobalError);
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Handle React-specific errors that escape error boundaries
    if (typeof window !== 'undefined' && window.React) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Check if this looks like a React error
        const errorMessage = args.join(' ');
        if (errorMessage.includes('React') || errorMessage.includes('component')) {
          this.handleReactConsoleError(errorMessage);
        }
        originalConsoleError.apply(console, args);
      };
    }
  }

  private cleanupGlobalErrorHandlers() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleGlobalError = (event: ErrorEvent) => {
    const error = event.error || new Error(event.message);
    
    errorTracker.captureException(error, {
      globalError: true,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'javascript_error'
    });

    this.updateErrorState();
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));

    errorTracker.captureException(error, {
      globalError: true,
      type: 'unhandled_promise_rejection',
      reason: event.reason
    });

    this.updateErrorState();
  };

  private handleReactConsoleError = (errorMessage: string) => {
    errorTracker.captureError(errorMessage, 'javascript', 'medium', {
      reactConsoleError: true,
      source: 'console.error'
    });
  };

  private updateErrorState() {
    const now = Date.now();
    const { errorCount, lastErrorTime } = this.state;
    
    // Reset error count if it's been more than 5 minutes since last error
    const resetCount = now - lastErrorTime > 300000 ? 0 : errorCount;
    
    this.setState({
      errorCount: resetCount + 1,
      lastErrorTime: now
    });

    // If we're getting too many errors, trigger global error state
    if (resetCount + 1 >= 5) {
      this.setState({ hasGlobalError: true });
      
      errorTracker.captureError(
        'Too many global errors detected - entering error state',
        'javascript',
        'critical',
        {
          errorCount: resetCount + 1,
          timeWindow: now - lastErrorTime
        }
      );
    }
  }

  handleGlobalErrorBoundaryError = (error: Error, errorInfo: React.ErrorInfo) => {
    errorTracker.captureException(error, {
      globalErrorBoundary: true,
      componentStack: errorInfo.componentStack,
      critical: true
    });

    this.setState({ hasGlobalError: true });

    // Schedule error state reset after 30 seconds
    this.errorResetTimeoutId = setTimeout(() => {
      this.setState({
        hasGlobalError: false,
        errorCount: 0,
        lastErrorTime: 0
      });
      
      errorTracker.addBreadcrumb('Global error state reset', 'system');
    }, 30000);
  };

  render() {
    const { children } = this.props;
    const { hasGlobalError } = this.state;

    if (hasGlobalError) {
      return (
        <ErrorBoundary
          level="page"
          name="GlobalErrorBoundary"
          showDetails={true}
          enableRetry={true}
        >
          <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-800 mb-4">
                Application Error
              </h1>
              <p className="text-red-600 mb-6">
                The application has encountered multiple errors and needs to be refreshed.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Refresh Application
              </button>
            </div>
          </div>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary
        level="page"
        name="GlobalErrorBoundary"
        onError={this.handleGlobalErrorBoundaryError}
        showDetails={process.env.NODE_ENV === 'development'}
        enableRetry={true}
      >
        <ChunkErrorBoundary
          onChunkError={(error) => {
            errorTracker.addBreadcrumb('Chunk error in global boundary', 'error');
          }}
        >
          <AsyncErrorBoundary
            level="page"
            name="GlobalAsyncErrorBoundary"
            onError={(error) => {
              errorTracker.addBreadcrumb('Async error in global boundary', 'error');
            }}
          >
            {children}
          </AsyncErrorBoundary>
        </ChunkErrorBoundary>
      </ErrorBoundary>
    );
  }
}

export default GlobalErrorBoundary;