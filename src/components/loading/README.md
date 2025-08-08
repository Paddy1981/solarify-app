# Solarify Loading System

A comprehensive loading skeletons and perceived performance optimization system for the Solarify solar marketplace application.

## Features

### 🎨 Advanced Skeleton Components
- **Enhanced skeletons** with shimmer, pulse, and custom animations
- **Solar-themed variants** with branded colors and effects
- **Responsive sizing** with touch-friendly mobile targets
- **Accessibility support** with reduced motion preferences

### ⚡ Smart Loading States
- **Context-aware loading** with progress tracking
- **Estimated time displays** based on real performance
- **Error states and retry mechanisms** with exponential backoff
- **Network and battery awareness** for mobile optimization

### 🌱 Solar-Specific Patterns
- **Solar calculator loading** with step-by-step progress
- **Equipment catalog** with staggered grid animations
- **Dashboard analytics** with real-time data loading
- **RFQ form validation** with progressive submission
- **Quote generation** with multi-stage processing
- **System monitoring** with live performance updates

### 📱 Mobile Optimization
- **Touch-friendly targets** meeting WCAG guidelines
- **Battery-conscious animations** that adapt to device state
- **Network-aware loading** with slow connection fallbacks
- **Reduced motion support** for accessibility
- **Performance-aware rendering** based on device capabilities

### 📊 Performance Monitoring
- **Real-time metrics tracking** with performance budgets
- **Loading time analytics** and optimization insights
- **Error rate monitoring** with automatic alerting
- **Success rate tracking** and A/B testing support

## Quick Start

### Basic Usage

```tsx
import { LoadingWrapper, SolarCalculatorSkeleton } from '@/components/loading';

function MySolarCalculator() {
  return (
    <LoadingWrapper
      loadingId="solar-calc"
      skeleton="solar-calculator"
      showProgress
      showEstimatedTime
    >
      <SolarCalculatorContent />
    </LoadingWrapper>
  );
}
```

### With React Query Integration

```tsx
import { useQueryWithLoading } from '@/components/loading';

function EquipmentCatalog() {
  const { data, isLoading, showSkeleton } = useQueryWithLoading(
    ['equipment'],
    () => fetchEquipment(),
    {
      loadingId: 'equipment-catalog',
      loadingStages: ['Searching database', 'Processing results', 'Calculating pricing'],
      showSkeleton: true
    }
  );

  if (showSkeleton) {
    return <EquipmentCatalogSkeleton />;
  }

  return <EquipmentList data={data} />;
}
```

### Form Integration

```tsx
import { useFormWithLoading, RFQFormSkeleton } from '@/components/loading';

function SolarRFQForm() {
  const {
    loadingState,
    startSubmission,
    updateSubmissionProgress,
    completeSubmission,
    handleFormError
  } = useFormWithLoading('rfq-form');

  const handleSubmit = async (formData) => {
    try {
      startSubmission();
      updateSubmissionProgress('Validating data', 25);
      await validateData(formData);
      
      updateSubmissionProgress('Processing requirements', 50);
      await processRequirements(formData);
      
      updateSubmissionProgress('Generating RFQ', 75);
      await generateRFQ(formData);
      
      completeSubmission();
    } catch (error) {
      handleFormError(error.message);
    }
  };

  if (loadingState?.isLoading) {
    return <RFQFormSkeleton />;
  }

  return <RFQFormContent onSubmit={handleSubmit} />;
}
```

## Component Library

### Pre-configured Components

```tsx
import {
  SolarCalculatorLoader,
  EquipmentCatalogLoader, 
  DashboardLoader,
  RFQFormLoader,
  QuoteGenerationLoader,
  SystemMonitoringLoader
} from '@/components/loading';

// Solar Calculator with loading
<SolarCalculatorLoader loadingId="calc-1">
  <SolarCalculator />
</SolarCalculatorLoader>

// Equipment catalog with infinite scroll
<EquipmentCatalogLoader 
  loadingId="equipment"
  itemsPerPage={12}
  enableInfiniteScroll
>
  <EquipmentGrid />
</EquipmentCatalogLoader>

// Dashboard with real-time updates
<DashboardLoader
  loadingId="dashboard"
  enableRealTime
  sections={['stats', 'charts', 'alerts']}
>
  <DashboardContent />
</DashboardLoader>
```

### Skeleton Components

```tsx
import {
  SolarCalculatorSkeleton,
  EquipmentCatalogSkeleton,
  DashboardAnalyticsSkeleton,
  RFQFormSkeleton,
  QuoteGenerationSkeleton,
  SystemMonitoringSkeleton
} from '@/components/loading/solar-loading-patterns';

// Custom skeleton usage
<SolarCalculatorSkeleton showSteps />
<EquipmentCatalogSkeleton itemsPerRow={3} rows={4} />
<DashboardAnalyticsSkeleton sections={['stats', 'charts']} />
```

### Mobile Components

```tsx
import {
  MobileSolarCalculatorSkeleton,
  MobileDashboardSkeleton,
  MobileNetworkAwareLoading,
  MobileBatteryAwareLoading
} from '@/components/loading/mobile-loading-patterns';

// Mobile-optimized loading
<MobileNetworkAwareLoading fallback={<MobileDashboardSkeleton />}>
  <MobileBatteryAwareLoading>
    <Dashboard />
  </MobileBatteryAwareLoading>
</MobileNetworkAwareLoading>
```

### Animation Components

```tsx
import {
  ProgressiveReveal,
  StaggeredGrid,
  LoadingIcon,
  SolarLoadingIcon
} from '@/components/loading';

// Progressive content reveal
<ProgressiveReveal direction="up" delay={300}>
  <Content />
</ProgressiveReveal>

// Staggered grid animation
<StaggeredGrid columns={3} staggerDelay={100}>
  {items.map(item => <ItemCard key={item.id} {...item} />)}
</StaggeredGrid>

// Custom loading icons
<SolarLoadingIcon variant="solar-glow" size="lg" />
<LoadingIcon icon={Calculator} variant="spin" color="text-solar-primary" />
```

## Advanced Usage

### Performance Monitoring

```tsx
import { 
  PerformanceMonitoringProvider,
  usePerformanceDashboard,
  PERFORMANCE_BUDGETS 
} from '@/components/loading';

function App() {
  return (
    <PerformanceMonitoringProvider globalBudget={PERFORMANCE_BUDGETS.NORMAL}>
      <AppContent />
    </PerformanceMonitoringProvider>
  );
}

function PerformanceDashboard() {
  const { overallStats, worstPerformers, alerts } = usePerformanceDashboard();
  
  return (
    <div>
      <h2>Performance Overview</h2>
      <p>Average Loading Time: {overallStats.avgLoadingTime}ms</p>
      <p>Success Rate: {overallStats.avgSuccessRate}%</p>
      
      <h3>Performance Issues</h3>
      {worstPerformers.map(({ id, score }) => (
        <div key={id}>Component: {id}, Score: {score}</div>
      ))}
    </div>
  );
}
```

### Custom Skeletons

```tsx
import { Skeleton, CardSkeleton } from '@/components/loading';

function CustomEquipmentSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="border rounded-lg overflow-hidden">
          {/* Equipment Image */}
          <Skeleton 
            className="aspect-video" 
            variant="solar" 
            delay={index * 0.1}
          />
          
          <div className="p-4 space-y-3">
            {/* Equipment Title */}
            <Skeleton width="80%" height="20px" variant="solar" />
            
            {/* Equipment Details */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton width="40%" height="14px" />
                <Skeleton width="30%" height="14px" variant="energy" />
              </div>
              <div className="flex justify-between">
                <Skeleton width="50%" height="14px" />
                <Skeleton width="25%" height="14px" variant="eco" />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Skeleton width="60%" height="36px" variant="solar" />
              <Skeleton width="36px" height="36px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### HOC Integration

```tsx
import { withLoading } from '@/components/loading';

const EnhancedSolarCalculator = withLoading(SolarCalculator, {
  loadingId: 'solar-calculator',
  skeleton: 'calculator',
  enableMobile: true,
  showProgress: true
});

// Usage
<EnhancedSolarCalculator />
```

## Configuration

### Global Configuration

```tsx
import { LoadingProvider, PerformanceMonitoringProvider } from '@/components/loading';

function App() {
  return (
    <PerformanceMonitoringProvider
      globalBudget={{
        maxLoadingTime: 2000,
        maxRetryAttempts: 3,
        targetSuccessRate: 95,
        maxErrorRate: 5
      }}
    >
      <LoadingProvider globalLoadingId="app">
        <AppContent />
      </LoadingProvider>
    </PerformanceMonitoringProvider>
  );
}
```

### Performance Budgets

```tsx
import { PERFORMANCE_BUDGETS } from '@/components/loading';

// Use predefined budgets
const fastBudget = PERFORMANCE_BUDGETS.FAST;    // 1s max loading
const normalBudget = PERFORMANCE_BUDGETS.NORMAL; // 2s max loading  
const slowBudget = PERFORMANCE_BUDGETS.SLOW;    // 4s max loading

// Or create custom budgets
const customBudget = {
  maxLoadingTime: 1500,
  maxRetryAttempts: 2,
  targetSuccessRate: 98,
  maxErrorRate: 2
};
```

## Utilities

### Loading Utils

```tsx
import { loadingUtils } from '@/components/loading';

// Create standardized loading IDs
const loadingId = loadingUtils.createLoadingId('solar-calculator', 'user-123');

// Get appropriate skeleton for content
const skeleton = loadingUtils.getSkeletonForContent('equipment');

// Get performance budget for operation
const budget = loadingUtils.getBudgetForOperation('complex');

// Get loading stages for operation
const stages = loadingUtils.getStagesForOperation('SOLAR_CALCULATION');
```

## Best Practices

### 1. Loading ID Naming
- Use descriptive, hierarchical names: `"solar-calculator-residential"`
- Include context when needed: `"dashboard-system-${systemId}"`
- Avoid special characters and spaces

### 2. Skeleton Selection
- Match skeleton complexity to actual content
- Use mobile-optimized skeletons on mobile devices
- Consider network conditions for skeleton choice

### 3. Performance Budgets
- Set realistic budgets based on operation complexity
- Monitor budget violations and adjust accordingly
- Use stricter budgets for critical user flows

### 4. Mobile Optimization
- Enable network-aware loading for data-heavy components
- Use battery-aware loading for animation-heavy content
- Ensure touch targets meet minimum size requirements

### 5. Accessibility
- Respect user's reduced motion preferences
- Provide meaningful loading messages
- Ensure sufficient color contrast in skeletons

## TypeScript Support

The loading system is fully typed with comprehensive TypeScript support:

```tsx
import type {
  LoadingState,
  PerformanceMetrics,
  SkeletonProps,
  LoadingWrapperProps
} from '@/components/loading';

// Type-safe loading component props
interface MyComponentProps extends LoadingWrapperProps {
  data: MyData[];
  onDataLoad: (data: MyData[]) => void;
}

// Type-safe performance monitoring
const metrics: PerformanceMetrics = {
  loadingStartTime: Date.now(),
  errorCount: 0,
  retryCount: 0,
  successRate: 100
};
```

## Browser Support

- **Modern browsers**: Full feature support
- **IE11**: Basic skeleton support (no advanced animations)
- **Mobile browsers**: Optimized loading patterns
- **Progressive enhancement**: Graceful degradation for unsupported features

## Performance

- **Minimal bundle impact**: Tree-shakeable exports
- **Efficient animations**: CSS-based with GPU acceleration
- **Memory optimized**: Automatic cleanup of loading states
- **Network efficient**: Adaptive loading based on connection quality