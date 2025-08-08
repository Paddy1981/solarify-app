import React, { Suspense } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { LazyRouteWrapper, withLazyLoading, useInViewport, LazySection } from '../lazy-route-wrapper'

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
window.IntersectionObserver = mockIntersectionObserver

// Mock console.error to suppress error boundary messages in tests
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('LazyRouteWrapper', () => {
  it('renders children successfully', () => {
    render(
      <LazyRouteWrapper>
        <div data-testid="test-content">Test Content</div>
      </LazyRouteWrapper>
    )
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('shows fallback component while loading', () => {
    const SlowComponent = () => {
      // Simulate slow component
      throw new Promise(resolve => setTimeout(resolve, 100))
    }

    const CustomFallback = () => <div data-testid="custom-fallback">Loading...</div>

    render(
      <LazyRouteWrapper fallback={CustomFallback}>
        <SlowComponent />
      </LazyRouteWrapper>
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
  })

  it('catches and displays errors with error boundary', () => {
    const ErrorComponent = () => {
      throw new Error('Test error')
    }

    render(
      <LazyRouteWrapper>
        <ErrorComponent />
      </LazyRouteWrapper>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onErrorMock = jest.fn()
    const ErrorComponent = () => {
      throw new Error('Test error')
    }

    render(
      <LazyRouteWrapper onError={onErrorMock}>
        <ErrorComponent />
      </LazyRouteWrapper>
    )

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('shows default loading component when no fallback provided', () => {
    const SlowComponent = () => {
      throw new Promise(resolve => setTimeout(resolve, 100))
    }

    render(
      <LazyRouteWrapper>
        <SlowComponent />
      </LazyRouteWrapper>
    )

    // Should render default loading component from LoadingComponents.Dashboard
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})

describe('withLazyLoading HOC', () => {
  it('wraps component with lazy loading functionality', () => {
    const TestComponent = ({ message }: { message: string }) => (
      <div data-testid="wrapped-component">{message}</div>
    )

    const WrappedComponent = withLazyLoading(TestComponent)

    render(<WrappedComponent message="Hello World" />)

    expect(screen.getByTestId('wrapped-component')).toBeInTheDocument()
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('sets correct display name for wrapped component', () => {
    const TestComponent = () => <div>Test</div>
    TestComponent.displayName = 'TestComponent'

    const WrappedComponent = withLazyLoading(TestComponent)

    expect(WrappedComponent.displayName).toBe('withLazyLoading(TestComponent)')
  })

  it('handles component without display name', () => {
    const TestComponent = () => <div>Test</div>

    const WrappedComponent = withLazyLoading(TestComponent)

    expect(WrappedComponent.displayName).toBe('withLazyLoading(TestComponent)')
  })

  it('passes through all props to wrapped component', () => {
    const TestComponent = ({ 
      prop1, 
      prop2, 
      prop3 
    }: { 
      prop1: string; 
      prop2: number; 
      prop3: boolean; 
    }) => (
      <div data-testid="props-test">
        {prop1}-{prop2}-{prop3.toString()}
      </div>
    )

    const WrappedComponent = withLazyLoading(TestComponent)

    render(
      <WrappedComponent 
        prop1="test" 
        prop2={42} 
        prop3={true} 
      />
    )

    expect(screen.getByText('test-42-true')).toBeInTheDocument()
  })

  it('applies custom fallback and error handling options', () => {
    const onErrorMock = jest.fn()
    const CustomFallback = () => <div data-testid="hoc-fallback">HOC Loading...</div>
    
    const ErrorComponent = () => {
      throw new Error('HOC error')
    }

    const WrappedErrorComponent = withLazyLoading(ErrorComponent, {
      fallback: CustomFallback,
      onError: onErrorMock
    })

    render(<WrappedErrorComponent />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(onErrorMock).toHaveBeenCalled()
  })
})

describe('useInViewport hook', () => {
  it('returns ref and viewport state', () => {
    let hookResult: any

    const TestComponent = () => {
      hookResult = useInViewport<HTMLDivElement>()
      return <div ref={hookResult.ref} data-testid="viewport-test">Content</div>
    }

    render(<TestComponent />)

    expect(hookResult.ref.current).toBeInstanceOf(HTMLDivElement)
    expect(typeof hookResult.isInViewport).toBe('boolean')
    expect(typeof hookResult.hasBeenInViewport).toBe('boolean')
  })

  it('sets up IntersectionObserver on mount', () => {
    const observeMock = jest.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: observeMock,
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })

    const TestComponent = () => {
      const { ref } = useInViewport<HTMLDivElement>()
      return <div ref={ref} data-testid="observer-test">Content</div>
    }

    render(<TestComponent />)

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.1,
        rootMargin: '100px',
      })
    )
  })

  it('cleans up observer on unmount', () => {
    const unobserveMock = jest.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: jest.fn(),
      unobserve: unobserveMock,
      disconnect: jest.fn(),
    })

    const TestComponent = () => {
      const { ref } = useInViewport<HTMLDivElement>()
      return <div ref={ref}>Content</div>
    }

    const { unmount } = render(<TestComponent />)
    unmount()

    // Note: In a real test, we'd need to trigger the intersection observer callback
    // to verify the cleanup behavior properly
    expect(unobserveMock).toHaveBeenCalled()
  })
})

describe('LazySection component', () => {
  it('renders fallback initially', () => {
    const CustomFallback = () => <div data-testid="section-fallback">Section Loading...</div>

    render(
      <LazySection fallback={<CustomFallback />}>
        <div data-testid="section-content">Lazy Content</div>
      </LazySection>
    )

    expect(screen.getByTestId('section-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('section-content')).not.toBeInTheDocument()
  })

  it('uses default skeleton when no fallback provided', () => {
    render(
      <LazySection>
        <div data-testid="section-content">Lazy Content</div>
      </LazySection>
    )

    // Should render default skeleton
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.queryByTestId('section-content')).not.toBeInTheDocument()
  })

  it('sets up IntersectionObserver with custom options', () => {
    const observeMock = jest.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: observeMock,
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })

    render(
      <LazySection threshold={0.5} rootMargin="25px">
        <div>Content</div>
      </LazySection>
    )

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.5,
        rootMargin: '25px',
      })
    )
  })

  it('uses default options when not provided', () => {
    const observeMock = jest.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: observeMock,
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })

    render(
      <LazySection>
        <div>Content</div>
      </LazySection>
    )

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.1,
        rootMargin: '50px',
      })
    )
  })

  it('disconnects observer on unmount', () => {
    const disconnectMock = jest.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: disconnectMock,
    })

    const { unmount } = render(
      <LazySection>
        <div>Content</div>
      </LazySection>
    )

    unmount()
    expect(disconnectMock).toHaveBeenCalled()
  })
})

describe('Error Boundary Integration', () => {
  it('recovers from errors when retry button is clicked', async () => {
    let shouldError = true

    const ConditionalErrorComponent = () => {
      if (shouldError) {
        throw new Error('Conditional error')
      }
      return <div data-testid="recovered-content">Recovered!</div>
    }

    render(
      <LazyRouteWrapper>
        <ConditionalErrorComponent />
      </LazyRouteWrapper>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Fix the error condition
    shouldError = false

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i })
    retryButton.click()

    // Component should recover
    await waitFor(() => {
      expect(screen.getByTestId('recovered-content')).toBeInTheDocument()
    })
  })

  it('handles multiple error scenarios', () => {
    const MultipleErrorComponent = ({ errorType }: { errorType: string }) => {
      switch (errorType) {
        case 'network':
          throw new Error('Network connection failed')
        case 'permission':
          throw new Error('Permission denied')
        default:
          throw new Error('Unknown error')
      }
    }

    const { rerender } = render(
      <LazyRouteWrapper>
        <MultipleErrorComponent errorType="network" />
      </LazyRouteWrapper>
    )

    expect(screen.getByText('Network connection failed')).toBeInTheDocument()

    rerender(
      <LazyRouteWrapper>
        <MultipleErrorComponent errorType="permission" />
      </LazyRouteWrapper>
    )

    expect(screen.getByText('Permission denied')).toBeInTheDocument()
  })

  it('provides accessible error UI', () => {
    const ErrorComponent = () => {
      throw new Error('Accessibility test error')
    }

    render(
      <LazyRouteWrapper>
        <ErrorComponent />
      </LazyRouteWrapper>
    )

    // Error message should be accessible
    expect(screen.getByRole('heading')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    
    // Error details should be available
    expect(screen.getByText('Accessibility test error')).toBeInTheDocument()
  })
})