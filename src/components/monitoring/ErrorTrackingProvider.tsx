import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { errorTracker, ErrorTracker } from '../../lib/monitoring/error-tracker';

interface ErrorTrackingContextType {
  errorTracker: ErrorTracker;
  captureError: (error: Error | string, metadata?: Record<string, any>) => string;
  captureException: (error: Error, metadata?: Record<string, any>) => string;
  setUser: (user: User | null) => void;
  addBreadcrumb: (message: string, category?: string, data?: any) => void;
  setTag: (key: string, value: string) => void;
  setContext: (key: string, value: any) => void;
}

const ErrorTrackingContext = createContext<ErrorTrackingContextType | null>(null);

interface ErrorTrackingProviderProps {
  children: ReactNode;
}

export function ErrorTrackingProvider({ children }: ErrorTrackingProviderProps) {
  useEffect(() => {
    // Initialize error tracking on app start
    console.log('Error tracking initialized');
    
    // Add initial breadcrumb
    errorTracker.addBreadcrumb('Application started', 'lifecycle');
    
    // Set initial tags
    errorTracker.setTag('component', 'app_root');
    errorTracker.setTag('build_version', process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0');
    
    // Cleanup on unmount
    return () => {
      errorTracker.destroy();
    };
  }, []);

  const contextValue: ErrorTrackingContextType = {
    errorTracker,
    captureError: (error: Error | string, metadata = {}) => {
      return errorTracker.captureError(error, 'javascript', 'medium', metadata);
    },
    captureException: (error: Error, metadata = {}) => {
      return errorTracker.captureException(error, metadata);
    },
    setUser: (user: User | null) => {
      errorTracker.setUser(user);
    },
    addBreadcrumb: (message: string, category = 'navigation', data?: any) => {
      errorTracker.addBreadcrumb(message, category, data);
    },
    setTag: (key: string, value: string) => {
      errorTracker.setTag(key, value);
    },
    setContext: (key: string, value: any) => {
      errorTracker.setContext(key, value);
    }
  };

  return (
    <ErrorTrackingContext.Provider value={contextValue}>
      {children}
    </ErrorTrackingContext.Provider>
  );
}

export function useErrorTracking(): ErrorTrackingContextType {
  const context = useContext(ErrorTrackingContext);
  if (!context) {
    throw new Error('useErrorTracking must be used within an ErrorTrackingProvider');
  }
  return context;
}

// Higher-order component for automatic error boundary integration
export function withErrorTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const { addBreadcrumb, setTag } = useErrorTracking();
    
    useEffect(() => {
      const name = componentName || Component.displayName || Component.name || 'UnknownComponent';
      addBreadcrumb(`Component mounted: ${name}`, 'lifecycle');
      setTag('current_component', name);
      
      return () => {
        addBreadcrumb(`Component unmounted: ${name}`, 'lifecycle');
      };
    }, [addBreadcrumb, setTag]);
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `withErrorTracking(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
}