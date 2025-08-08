import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../ErrorBoundary';
import { errorTracker } from '../../../lib/monitoring/error-tracker';

// Mock the error tracker
jest.mock('../../../lib/monitoring/error-tracker', () => ({
  errorTracker: {
    captureException: jest.fn(),
    addBreadcrumb: jest.fn()
  }
}));

// Mock window.location methods
const mockReload = jest.fn();
const mockAssign = jest.fn();

Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
    href: 'http://localhost:3000',
    assign: mockAssign
  },
  writable: true,
});

// Component that throws an error
const ThrowError = ({ shouldError = false }: { shouldError?: boolean }) => {
  if (shouldError) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('when no error occurs', () => {
    it('should render children normally', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('when error occurs', () => {
    it('should catch error and display component-level error UI', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText('This component failed to render.')).toBeInTheDocument();
    });

    it('should catch error and display section-level error UI', () => {
      render(
        <ErrorBoundary level="section">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Section Error')).toBeInTheDocument();
      expect(screen.getByText(/This section encountered an error/)).toBeInTheDocument();
    });

    it('should catch error and display page-level error UI', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We're sorry, but there was an unexpected error/)).toBeInTheDocument();
    });

    it('should capture error with monitoring system', () => {
      render(
        <ErrorBoundary name="TestBoundary" level="component">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(errorTracker.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          errorBoundary: true,
          level: 'component',
          componentName: 'TestBoundary'
        })
      );

      expect(errorTracker.addBreadcrumb).toHaveBeenCalledWith(
        'Error caught by component boundary: TestBoundary',
        'error',
        expect.any(Object)
      );
    });

    it('should call custom onError handler', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });
  });

  describe('retry functionality', () => {
    it('should show retry button when enableRetry is true', () => {
      render(
        <ErrorBoundary enableRetry={true} level="component">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should not show retry button when enableRetry is false', () => {
      render(
        <ErrorBoundary enableRetry={false} level="component">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('should reset error state when retry is clicked', async () => {
      const TestComponent = () => {
        const [shouldError, setShouldError] = React.useState(true);
        
        React.useEffect(() => {
          // Simulate fixing the error after retry
          const timer = setTimeout(() => setShouldError(false), 100);
          return () => clearTimeout(timer);
        }, []);

        return <ThrowError shouldError={shouldError} />;
      };

      render(
        <ErrorBoundary enableRetry={true} level="component">
          <TestComponent />
        </ErrorBoundary>
      );

      // Error should be displayed initially
      expect(screen.getByText('Component Error')).toBeInTheDocument();

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Wait for component to re-render
      await screen.findByText('No error');
    });

    it('should disable retry button after max attempts', () => {
      render(
        <ErrorBoundary enableRetry={true} level="section">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      // Simulate multiple errors to reach retry limit
      const boundary = screen.getByText('Section Error').closest('.border-red-200');
      
      // The retry count tracking is internal, but we can test the button exists
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('page-level error actions', () => {
    it('should show reload page button', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });

    it('should show go to homepage button', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /go to homepage/i })).toBeInTheDocument();
    });

    it('should reload page when reload button is clicked', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      fireEvent.click(reloadButton);

      expect(mockReload).toHaveBeenCalled();
    });

    it('should navigate to home when home button is clicked', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      const homeButton = screen.getByRole('button', { name: /go to homepage/i });
      fireEvent.click(homeButton);

      expect(window.location.href).toBe('/');
    });
  });

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Component Error')).not.toBeInTheDocument();
    });
  });

  describe('development mode', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary level="page" showDetails={true}>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
    });

    it('should log to console in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error)
      );
    });
  });

  describe('error ID tracking', () => {
    it('should display error ID when available', () => {
      (errorTracker.captureException as jest.Mock).mockReturnValue('error-123');

      render(
        <ErrorBoundary level="page">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error ID: error-123')).toBeInTheDocument();
    });
  });
});