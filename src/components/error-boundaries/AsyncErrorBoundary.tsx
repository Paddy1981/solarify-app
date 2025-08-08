import React, { Component, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { errorTracker } from '../../lib/monitoring/error-tracker';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  level?: 'page' | 'section' | 'component';
  name?: string;
}

interface AsyncErrorBoundaryState {
  asyncError: Error | null;
}

/**
 * AsyncErrorBoundary catches both synchronous and asynchronous errors
 * including Promise rejections that happen within React components
 */
export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = {
      asyncError: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return {
      asyncError: error
    };
  }

  componentDidMount() {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const { onError, name } = this.props;
    
    // Create an error from the rejection
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));

    // Track the async error
    errorTracker.captureException(error, {
      asyncError: true,
      componentName: name,
      type: 'unhandled_promise_rejection',
      reason: event.reason
    });

    errorTracker.addBreadcrumb(
      `Unhandled promise rejection in ${name || 'AsyncErrorBoundary'}`,
      'error',
      { reason: String(event.reason) }
    );

    // Update state to trigger error boundary
    this.setState({ asyncError: error });

    // Call custom error handler
    onError?.(error);

    // Prevent the default browser behavior
    event.preventDefault();
  };

  handleErrorBoundaryError = (error: Error) => {
    const { onError } = this.props;
    onError?.(error);
  };

  render() {
    const { children, fallback, level, name } = this.props;
    const { asyncError } = this.state;

    // If we have an async error, throw it to be caught by ErrorBoundary
    if (asyncError) {
      throw asyncError;
    }

    return (
      <ErrorBoundary
        fallback={fallback}
        level={level}
        name={name}
        onError={this.handleErrorBoundaryError}
        enableRetry={true}
        showDetails={process.env.NODE_ENV === 'development'}
      >
        {children}
      </ErrorBoundary>
    );
  }
}

// Hook for components to report async errors
export function useAsyncError() {
  const [, setError] = React.useState<Error | null>(null);
  
  return React.useCallback((error: Error) => {
    errorTracker.captureException(error, {
      asyncError: true,
      reportedViaHook: true
    });
    
    setError(() => {
      throw error;
    });
  }, []);
}

// Higher-order component for wrapping components with async error boundary
export function withAsyncErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<AsyncErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <AsyncErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </AsyncErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withAsyncErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default AsyncErrorBoundary;