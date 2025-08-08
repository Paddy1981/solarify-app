# Solarify Design System

A comprehensive design system for solar marketplace applications with accessibility, mobile optimization, and solar industry theming built-in.

## Table of Contents

- [Overview](#overview)
- [Design Tokens](#design-tokens)
- [Typography](#typography)
- [Component Variants](#component-variants)
- [Layout System](#layout-system)
- [Icon System](#icon-system)
- [Theme System](#theme-system)
- [Component Patterns](#component-patterns)
- [Accessibility](#accessibility)
- [Mobile Optimization](#mobile-optimization)
- [Usage Guidelines](#usage-guidelines)
- [Development](#development)

## Overview

The Solarify Design System provides a complete set of design tokens, components, and patterns for building consistent, accessible, and mobile-optimized solar marketplace applications.

### Key Features

- **Accessibility First**: WCAG 2.1 AA compliant with proper contrast ratios, focus management, and screen reader support
- **Mobile Optimized**: Touch-friendly interactions, responsive design, and performance optimizations
- **Solar Industry Focus**: Purpose-built components and theming for solar marketplace applications
- **Comprehensive Theming**: Light, dark, high-contrast, and solar-branded theme variants
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Developer Experience**: Easy-to-use APIs with clear documentation and examples

## Design Tokens

### Colors

The color system is built on semantic tokens that adapt to different themes and accessibility requirements.

```typescript
// Brand Colors
--primary: 45 100% 35%;        // Solar gold - WCAG AA compliant
--secondary: 197 78% 35%;      // Energy blue - WCAG AA compliant
--accent: 120 60% 35%;         // Eco green - WCAG AA compliant

// Solar-specific Colors
--solar-primary: 45 100% 35%;
--energy-primary: 197 78% 35%;
--eco-primary: 120 60% 35%;

// State Colors
--success: 120 60% 35%;
--warning: 38 100% 35%;
--error: 0 65% 35%;
```

### Usage

```tsx
// Using design tokens
import { designTokens } from '@/styles/design-tokens';

// Access color tokens
const primaryColor = designTokens.colors.semantic.primary[600];

// Use in components
<div className="bg-solar-primary text-white">Solar Panel</div>
```

## Typography

### Font Families

- **Primary**: Inter - Clean, readable body text
- **Heading**: Space Grotesk - Modern, technical headings
- **Display**: Space Grotesk - Large display text
- **Mono**: JetBrains Mono - Code and technical content

### Typography Scale

```tsx
// Display sizes (fluid, responsive)
text-display-lg     // clamp(3rem, 5vw, 4.5rem)
text-display-md     // clamp(2.25rem, 4vw, 3.75rem)
text-display-sm     // clamp(1.875rem, 3vw, 3rem)

// Heading sizes
text-4xl           // 2.25rem (36px)
text-3xl           // 1.875rem (30px)
text-2xl           // 1.5rem (24px)
text-xl            // 1.25rem (20px)

// Body sizes
text-lg            // 1.125rem (18px)
text-base          // 1rem (16px) - No zoom on iOS
text-sm            // 0.875rem (14px)

// Solar-specific sizes
text-solar-metric  // 1.5rem with solar theming
text-energy-value  // 2rem with energy theming
```

### Usage

```tsx
// Typography components
<h1 className="font-display text-display-lg font-bold">
  Solar Energy Solutions
</h1>

<p className="text-lg text-muted-foreground">
  Sustainable power for your home
</p>

// Solar-specific typography
<div className="text-solar-metric text-solar-primary">
  5.2 kW
</div>
```

## Component Variants

All components use a consistent variant system built with `class-variance-authority`.

### Button Variants

```tsx
// Variant types
type ButtonVariant = 
  | 'default' | 'primary' | 'secondary' | 'accent'
  | 'success' | 'warning' | 'error' | 'destructive'
  | 'outline' | 'ghost' | 'link'
  | 'solar' | 'energy' | 'eco';

// Size types
type ButtonSize = 
  | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  | 'mobile-sm' | 'mobile-md' | 'mobile-lg'
  | 'icon-sm' | 'icon-md' | 'icon-lg';

// Usage
<Button variant="solar" size="lg">
  Get Solar Quote
</Button>
```

### Card Variants

```tsx
// Card variants with solar theming
<Card variant="solar" size="md">
  Solar panel information
</Card>

<Card variant="energy" size="lg">
  Energy production data
</Card>
```

### Input Variants

```tsx
// Input states and sizes
<Input variant="success" size="mobile-md" />
<Input variant="warning" size="lg" />
<Input variant="error" />
```

## Layout System

### Container System

```tsx
import { Container } from '@/components/patterns';

// Container sizes
<Container size="sm">Small content (672px)</Container>
<Container size="md">Medium content (896px)</Container>
<Container size="lg">Large content (1152px)</Container>
<Container size="xl">Extra large (1280px)</Container>
<Container size="prose">Reading width (65ch)</Container>

// Padding variants
<Container padding="safe">Mobile-safe padding</Container>
<Container padding="md">Medium padding</Container>
```

### Grid System

```tsx
import { Grid } from '@/components/patterns';

// Responsive grids
<Grid cols="product-grid" gap="responsive">
  Product cards
</Grid>

<Grid cols="feature-grid" gap="mobile-friendly">
  Feature cards
</Grid>
```

### Layout Patterns

```tsx
// Pre-built layout patterns
import { 
  HeroSection,
  FeatureSection,
  ProductShowcase,
  DashboardPattern 
} from '@/components/patterns';

<HeroSection
  title="Solar Energy Solutions"
  subtitle="Clean Power"
  background="solar"
  actions={<Button variant="solar">Get Started</Button>}
/>
```

## Icon System

### Solar Industry Icons

The icon system includes 40+ icons specifically designed for solar marketplace applications.

```tsx
import { Icon } from '@/components/icons';

// Basic usage
<Icon name="solar-panel" size="lg" color="solar" />
<Icon name="battery" size="md" color="energy" />
<Icon name="sun" size="xl" color="warning" />

// With accessibility
<Icon 
  name="efficiency" 
  size="lg" 
  aria-label="System efficiency rating" 
/>
```

### Icon Categories

- **Solar Equipment**: solar-panel, sun, battery, power, electric-meter
- **Energy & Efficiency**: energy, efficiency, cost-savings
- **Installation**: installer, maintenance, inspection
- **Environmental**: leaf, recycle, carbon-footprint
- **Analytics**: chart, dashboard, report
- **Buildings**: home, building, rooftop
- **Financial**: dollar, calculator
- **Weather**: cloudy, partly-cloudy
- **Status**: check, alert, info
- **Navigation**: arrow-up, arrow-down, arrow-right

## Theme System

### Available Themes

- `light` - Default light theme
- `dark` - Dark theme for low-light environments
- `solar-light` - Enhanced solar branding (light)
- `solar-dark` - Enhanced solar branding (dark)
- `high-contrast-light` - High contrast for accessibility
- `high-contrast-dark` - High contrast dark theme

### Usage

```tsx
import { ThemeProvider, useTheme } from '@/components/theme-provider';

// App level
function App() {
  return (
    <ThemeProvider defaultTheme="solar-light" enableSystem>
      <YourApp />
    </ThemeProvider>
  );
}

// Component level
function Component() {
  const { theme, setTheme, accessibility } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('solar-dark')}>
        Switch to Solar Dark
      </button>
    </div>
  );
}
```

### Accessibility Features

The theme system automatically detects and respects:

- `prefers-color-scheme` - Light/dark preference
- `prefers-reduced-motion` - Animation preferences
- `prefers-contrast` - High contrast preference
- `forced-colors` - Windows High Contrast mode

## Component Patterns

### Solar Panel Card

```tsx
import { SolarPanelCard } from '@/components/patterns';

<SolarPanelCard
  name="Premium Monocrystalline Panel"
  brand="SolarTech Pro"
  wattage={400}
  efficiency={22.1}
  price={299}
  originalPrice={349}
  rating={4.8}
  reviewCount={156}
  isOnSale={true}
  isFeatured={true}
  onViewDetails={() => {}}
  onAddToCart={() => {}}
/>
```

### Energy Production Widget

```tsx
import { EnergyProductionWidget } from '@/components/patterns';

<EnergyProductionWidget
  currentProduction={5.2}
  dailyProduction={28.4}
  monthlyProduction={847}
  status="excellent"
  weatherCondition="sunny"
  lastUpdated={new Date()}
/>
```

### Savings Calculator

```tsx
import { SavingsCalculatorSummary } from '@/components/patterns';

<SavingsCalculatorSummary
  systemSize={6.2}
  estimatedCost={15600}
  annualSavings={1850}
  paybackPeriod={8.4}
  co2Reduction={4.2}
  incentives={4680}
/>
```

## Accessibility

### WCAG 2.1 AA Compliance

All components meet WCAG 2.1 AA standards:

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Management**: Proper focus indicators and keyboard navigation
- **Screen Readers**: Semantic HTML and ARIA labels
- **Touch Targets**: Minimum 44px touch targets on mobile

### Implementation

```tsx
// Proper ARIA usage
<Icon 
  name="solar-panel" 
  aria-label="Solar panel efficiency rating"
  role="img"
/>

// Focus management
<Button className="focus-visible:ring-2 focus-visible:ring-ring">
  Accessible Button
</Button>

// High contrast support
<div className="high-contrast:border-2 high-contrast:border-foreground">
  High contrast content
</div>
```

### Accessibility Utilities

```css
/* Reduced motion support */
.reduce-motion * {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}

/* High contrast utilities */
.high-contrast {
  --primary: 0 0% 0%;
  --accent: 240 100% 25%;
}

/* Focus utilities */
.focus-accessible {
  @apply focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
}
```

## Mobile Optimization

### Touch-Friendly Design

- **Minimum Touch Targets**: 44px (2.75rem) minimum for all interactive elements
- **Mobile-Optimized Spacing**: Comfortable spacing for thumb navigation
- **Gesture Support**: Swipe, pinch, and scroll optimizations

### Responsive Breakpoints

```typescript
const breakpoints = {
  xs: '375px',      // Small phones
  sm: '640px',      // Large phones / small tablets
  md: '768px',      // Tablets
  lg: '1024px',     // Small laptops
  xl: '1280px',     // Large laptops / desktops
  '2xl': '1536px',  // Large desktops
};
```

### Mobile-First Components

```tsx
// Mobile-optimized button sizes
<Button size="mobile-md">Mobile Button</Button>

// Mobile-safe spacing
<div className="p-mobile-safe">Mobile content</div>

// Responsive visibility
<div className="mobile-only">Mobile only</div>
<div className="desktop-only">Desktop only</div>
```

## Usage Guidelines

### Do's

✅ Use semantic color tokens (`text-primary`, `bg-success`)  
✅ Follow the established spacing scale  
✅ Use proper ARIA labels for icons and interactive elements  
✅ Test with keyboard navigation and screen readers  
✅ Use mobile-optimized sizes on touch devices  
✅ Respect user accessibility preferences  

### Don'ts

❌ Use arbitrary colors or spacing values  
❌ Create custom components without accessibility testing  
❌ Ignore mobile touch target requirements  
❌ Use animations without reduced motion support  
❌ Override focus indicators without providing alternatives  

### Component Composition

```tsx
// Good: Using established patterns
<FeatureSection
  title="Solar Solutions"
  layout="grid"
  columns="feature-grid"
>
  <Card variant="solar">Feature 1</Card>
  <Card variant="energy">Feature 2</Card>
</FeatureSection>

// Good: Consistent spacing and variants
<Stack gap="responsive-md">
  <Button variant="solar" size="lg">Primary Action</Button>
  <Button variant="outline" size="lg">Secondary Action</Button>
</Stack>
```

## Development

### Installation

The design system is built into the Solarify application. To use components:

```tsx
// Import design system components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/icons';

// Import patterns
import { 
  HeroSection, 
  SolarPanelCard 
} from '@/components/patterns';

// Import theme provider
import { ThemeProvider } from '@/components/theme-provider';
```

### Customization

```tsx
// Extend component variants
import { buttonVariants } from '@/lib/component-variants';
import { cva } from 'class-variance-authority';

const customButtonVariants = cva(
  buttonVariants.base,
  {
    variants: {
      ...buttonVariants.variants,
      custom: 'bg-custom text-custom-foreground',
    },
  }
);
```

### Theme Customization

```tsx
// Add custom colors
themeManager.setCustomColor('brand-orange', '38 100% 50%');

// Create custom theme
const customTheme = {
  colors: {
    ...baseThemes.light.colors,
    primary: 'hsl(280, 100%, 35%)', // Purple primary
  },
};
```

## Support

For questions, issues, or contributions:

1. Check the component showcase at `/design-system`
2. Review the accessibility guidelines
3. Test with multiple themes and accessibility preferences
4. Ensure mobile optimization

---

*The Solarify Design System is built with accessibility, performance, and developer experience as core principles. Every component and pattern is designed to work seamlessly across devices, themes, and accessibility preferences.*