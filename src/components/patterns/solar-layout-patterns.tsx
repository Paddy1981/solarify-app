/**
 * Solar Marketplace Layout Patterns
 * Pre-built composition patterns for common solar marketplace layouts
 * Mobile-first responsive design with accessibility built-in
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  containerVariants, 
  gridVariants, 
  flexVariants, 
  stackVariants, 
  sectionVariants,
  contentAreaVariants,
  cardLayoutVariants,
  type ContainerSize,
  type GridCols,
  type ContentAreaType,
  type CardLayout
} from '@/lib/layout-system';
import { Card, type CardProps } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Base layout pattern props
interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Container pattern
interface ContainerPatternProps extends BaseLayoutProps {
  size?: ContainerSize;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'safe';
}

export function Container({ 
  children, 
  size = 'lg', 
  padding = 'safe', 
  className 
}: ContainerPatternProps) {
  return (
    <div className={cn(containerVariants({ size, padding }), className)}>
      {children}
    </div>
  );
}

// Grid pattern
interface GridPatternProps extends BaseLayoutProps {
  cols?: GridCols;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive' | 'mobile-friendly';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export function Grid({ 
  children, 
  cols = 3, 
  gap = 'responsive', 
  align = 'stretch', 
  className 
}: GridPatternProps) {
  return (
    <div className={cn(gridVariants({ cols, gap, align }), className)}>
      {children}
    </div>
  );
}

// Stack pattern for vertical layouts
interface StackPatternProps extends BaseLayoutProps {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'tight' | 'comfortable' | 'loose' | 'responsive-sm' | 'responsive-md' | 'responsive-lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export function Stack({ 
  children, 
  gap = 'md', 
  align = 'stretch', 
  className 
}: StackPatternProps) {
  return (
    <div className={cn(stackVariants({ gap, align }), className)}>
      {children}
    </div>
  );
}

// Flex pattern for horizontal layouts
interface FlexPatternProps extends BaseLayoutProps {
  direction?: 'row' | 'col' | 'responsive-col';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'mobile-sm' | 'mobile-md' | 'mobile-lg';
  wrap?: boolean;
}

export function Flex({ 
  children, 
  direction = 'row', 
  justify = 'start', 
  align = 'center', 
  gap = 'md', 
  wrap = false, 
  className 
}: FlexPatternProps) {
  return (
    <div className={cn(
      flexVariants({ 
        direction, 
        justify, 
        align, 
        gap, 
        wrap: wrap ? 'wrap' : 'nowrap' 
      }), 
      className
    )}>
      {children}
    </div>
  );
}

// Section pattern with consistent spacing
interface SectionPatternProps extends BaseLayoutProps {
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'responsive-sm' | 'responsive-md' | 'responsive-lg' | 'hero';
  background?: 'transparent' | 'default' | 'muted' | 'card' | 'solar-light' | 'energy-light' | 'eco-light';
}

export function Section({ 
  children, 
  padding = 'responsive-md', 
  background = 'transparent', 
  className 
}: SectionPatternProps) {
  return (
    <section className={cn(sectionVariants({ padding, background }), className)}>
      {children}
    </section>
  );
}

// Content Area pattern
interface ContentAreaProps extends BaseLayoutProps {
  type?: ContentAreaType;
}

export function ContentArea({ 
  children, 
  type = 'feature-section', 
  className 
}: ContentAreaProps) {
  return (
    <div className={cn(contentAreaVariants({ type }), className)}>
      {children}
    </div>
  );
}

// Hero Section Pattern
interface HeroSectionProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  background?: 'default' | 'solar' | 'energy' | 'eco';
  className?: string;
}

export function HeroSection({
  title,
  subtitle,
  description,
  actions,
  background = 'default',
  className
}: HeroSectionProps) {
  const backgroundClasses = {
    default: 'bg-gradient-to-br from-background to-muted',
    solar: 'bg-gradient-to-br from-solar-primary/10 via-solar-secondary/5 to-transparent',
    energy: 'bg-gradient-to-br from-energy-primary/10 via-energy-secondary/5 to-transparent',
    eco: 'bg-gradient-to-br from-eco-primary/10 via-eco-secondary/5 to-transparent',
  };

  return (
    <Section 
      padding="hero" 
      background="transparent"
      className={cn(backgroundClasses[background], className)}
    >
      <ContentArea type="hero">
        <Stack gap="comfortable" align="center">
          <div className="space-y-4 text-center">
            {subtitle && (
              <Badge variant="outline" size="lg" className="mb-4">
                {subtitle}
              </Badge>
            )}
            <h1 className="font-display text-display-lg font-bold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-6">
              {actions}
            </div>
          )}
        </Stack>
      </ContentArea>
    </Section>
  );
}

// Feature Section Pattern
interface FeatureSectionProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  layout?: 'grid' | 'list' | 'cards';
  columns?: GridCols;
  className?: string;
}

export function FeatureSection({
  title,
  subtitle,
  description,
  children,
  layout = 'grid',
  columns = 'feature-grid',
  className
}: FeatureSectionProps) {
  return (
    <Section padding="responsive-lg" className={className}>
      <ContentArea type="feature-section">
        <Stack gap="responsive-lg">
          {(title || subtitle || description) && (
            <div className="text-center max-w-3xl mx-auto space-y-4">
              {subtitle && (
                <Badge variant="outline" className="mb-2">
                  {subtitle}
                </Badge>
              )}
              {title && (
                <h2 className="font-display text-display-md font-bold tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          )}
          
          {layout === 'grid' && (
            <Grid cols={columns} gap="responsive">
              {children}
            </Grid>
          )}
          
          {layout === 'list' && (
            <Stack gap="responsive-md">
              {children}
            </Stack>
          )}
          
          {layout === 'cards' && (
            <div className={cn(cardLayoutVariants({ layout: 'feature-cards' }))}>
              {children}
            </div>
          )}
        </Stack>
      </ContentArea>
    </Section>
  );
}

// Product Showcase Pattern
interface ProductShowcaseProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
  layout?: CardLayout;
  showFilters?: boolean;
  className?: string;
}

export function ProductShowcase({
  title,
  subtitle,
  filters,
  children,
  layout = 'product-cards',
  showFilters = true,
  className
}: ProductShowcaseProps) {
  return (
    <Section padding="responsive-md" className={className}>
      <ContentArea type="product-showcase">
        <Stack gap="responsive-md">
          {(title || subtitle) && (
            <div className="text-center max-w-3xl mx-auto space-y-4">
              {subtitle && (
                <Badge variant="outline">
                  {subtitle}
                </Badge>
              )}
              {title && (
                <h2 className="font-display text-display-sm font-bold tracking-tight">
                  {title}
                </h2>
              )}
            </div>
          )}
          
          {showFilters && filters && (
            <Flex justify="center" wrap className="gap-2 sm:gap-4">
              {filters}
            </Flex>
          )}
          
          <div className={cn(cardLayoutVariants({ layout }))}>
            {children}
          </div>
        </Stack>
      </ContentArea>
    </Section>
  );
}

// Dashboard Pattern
interface DashboardPatternProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  stats?: React.ReactNode;
  children: React.ReactNode;
  showStats?: boolean;
  className?: string;
}

export function DashboardPattern({
  header,
  sidebar,
  stats,
  children,
  showStats = true,
  className
}: DashboardPatternProps) {
  return (
    <Section padding="responsive-sm" className={className}>
      <ContentArea type="dashboard-content">
        <Stack gap="responsive-md">
          {header && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {header}
            </div>
          )}
          
          {showStats && stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {sidebar && (
              <div className="lg:col-span-1 space-y-6">
                {sidebar}
              </div>
            )}
            <div className={cn(
              sidebar ? 'lg:col-span-3' : 'lg:col-span-4',
              'space-y-6'
            )}>
              {children}
            </div>
          </div>
        </Stack>
      </ContentArea>
    </Section>
  );
}

// Calculator Pattern
interface CalculatorPatternProps {
  title?: React.ReactNode;
  form: React.ReactNode;
  results: React.ReactNode;
  className?: string;
}

export function CalculatorPattern({
  title,
  form,
  results,
  className
}: CalculatorPatternProps) {
  return (
    <Section padding="responsive-md" className={className}>
      <ContentArea type="calculator-section">
        <Stack gap="responsive-md">
          {title && (
            <div className="text-center">
              <h2 className="font-display text-display-sm font-bold tracking-tight">
                {title}
              </h2>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-6">
              {form}
            </div>
            <div className="space-y-6 lg:space-y-8">
              {results}
            </div>
          </div>
        </Stack>
      </ContentArea>
    </Section>
  );
}

// Form Section Pattern
interface FormSectionProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  actions,
  className
}: FormSectionProps) {
  return (
    <Section padding="responsive-md" className={className}>
      <ContentArea type="form-section">
        <Stack gap="responsive-md">
          {(title || description) && (
            <div className="text-center space-y-4">
              {title && (
                <h2 className="font-display text-display-sm font-bold tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {description}
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-6">
            {children}
          </div>
          
          {actions && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-6">
              {actions}
            </div>
          )}
        </Stack>
      </ContentArea>
    </Section>
  );
}

// Testimonial Section Pattern
interface TestimonialSectionProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  layout?: 'single' | 'grid' | 'carousel';
  className?: string;
}

export function TestimonialSection({
  title,
  subtitle,
  children,
  layout = 'grid',
  className
}: TestimonialSectionProps) {
  return (
    <Section 
      padding="responsive-lg" 
      background="muted"
      className={className}
    >
      <ContentArea type="testimonial-section">
        <Stack gap="responsive-lg">
          {(title || subtitle) && (
            <div className="text-center space-y-4">
              {subtitle && (
                <Badge variant="outline">
                  {subtitle}
                </Badge>
              )}
              {title && (
                <h2 className="font-display text-display-md font-bold tracking-tight">
                  {title}
                </h2>
              )}
            </div>
          )}
          
          {layout === 'single' && (
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          )}
          
          {layout === 'grid' && (
            <div className={cn(cardLayoutVariants({ layout: 'testimonial-cards' }))}>
              {children}
            </div>
          )}
          
          {layout === 'carousel' && (
            <div className="relative">
              {children}
            </div>
          )}
        </Stack>
      </ContentArea>
    </Section>
  );
}

// Stats Section Pattern
interface StatsSectionProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  background?: 'default' | 'solar' | 'energy' | 'eco';
  className?: string;
}

export function StatsSection({
  title,
  subtitle,
  children,
  background = 'default',
  className
}: StatsSectionProps) {
  const backgroundClasses = {
    default: 'bg-card',
    solar: 'bg-gradient-to-r from-solar-primary/10 to-solar-secondary/10',
    energy: 'bg-gradient-to-r from-energy-primary/10 to-energy-secondary/10',
    eco: 'bg-gradient-to-r from-eco-primary/10 to-eco-secondary/10',
  };

  return (
    <Section 
      padding="responsive-lg"
      background="transparent"
      className={cn(backgroundClasses[background], className)}
    >
      <ContentArea type="feature-section">
        <Stack gap="responsive-md">
          {(title || subtitle) && (
            <div className="text-center space-y-4">
              {subtitle && (
                <Badge variant="outline">
                  {subtitle}
                </Badge>
              )}
              {title && (
                <h2 className="font-display text-display-md font-bold tracking-tight">
                  {title}
                </h2>
              )}
            </div>
          )}
          
          <div className={cn(cardLayoutVariants({ layout: 'stat-cards' }))}>
            {children}
          </div>
        </Stack>
      </ContentArea>
    </Section>
  );
}

// CTA Section Pattern
interface CTASectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  background?: 'default' | 'solar' | 'energy' | 'eco';
  className?: string;
}

export function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
  background = 'solar',
  className
}: CTASectionProps) {
  const backgroundClasses = {
    default: 'bg-primary text-primary-foreground',
    solar: 'bg-gradient-to-r from-solar-primary to-solar-secondary text-white',
    energy: 'bg-gradient-to-r from-energy-primary to-energy-secondary text-white',
    eco: 'bg-gradient-to-r from-eco-primary to-eco-secondary text-white',
  };

  return (
    <Section 
      padding="responsive-lg"
      background="transparent"
      className={cn(backgroundClasses[background], className)}
    >
      <ContentArea type="hero">
        <Stack gap="comfortable" align="center">
          <div className="text-center space-y-4">
            <h2 className="font-display text-display-md font-bold tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xl opacity-90 leading-relaxed max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
          
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-6">
              {primaryAction}
              {secondaryAction}
            </div>
          )}
        </Stack>
      </ContentArea>
    </Section>
  );
}

// Export all patterns
export const SolarLayoutPatterns = {
  Container,
  Grid,
  Stack,
  Flex,
  Section,
  ContentArea,
  HeroSection,
  FeatureSection,
  ProductShowcase,
  DashboardPattern,
  CalculatorPattern,
  FormSection,
  TestimonialSection,
  StatsSection,
  CTASection,
};

// Export individual patterns as default for tree shaking
export {
  Container,
  Grid,
  Stack,
  Flex,
  Section,
  ContentArea,
  HeroSection,
  FeatureSection,
  ProductShowcase,
  DashboardPattern,
  CalculatorPattern,
  FormSection,
  TestimonialSection,
  StatsSection,
  CTASection,
};