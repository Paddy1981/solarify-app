/**
 * Design System Showcase
 * Interactive documentation and examples for the Solarify design system
 * Demonstrates all components, patterns, and guidelines
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

// Import all design system components
import { Button, buttonVariants } from '@/components/ui/button';
import { Input, inputVariants } from '@/components/ui/input';
import { Card, type CardProps } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// Import icons
import { Icon, SolarIcons, iconCategories, type IconName } from '@/components/icons';

// Import patterns
import {
  Container,
  Grid,
  Stack,
  HeroSection,
  FeatureSection,
  SolarPanelCard,
  EnergyProductionWidget,
  SavingsCalculatorSummary,
  InstallerProfileCard,
  SystemStatusWidget,
} from '@/components/patterns';

// Import theme system
import { ThemeToggle, ThemeSelect } from '@/components/theme-provider';
import { baseThemes, type ThemeVariant } from '@/lib/theme-system';
import { designTokens } from '@/styles/design-tokens';

// Showcase section interface
interface ShowcaseSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  code?: string;
}

function ShowcaseSection({ title, description, children, code }: ShowcaseSectionProps) {
  const [showCode, setShowCode] = React.useState(false);

  return (
    <div className="space-y-6 p-6 border border-border rounded-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{title}</h3>
          {code && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCode(!showCode)}
            >
              {showCode ? 'Hide Code' : 'Show Code'}
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-border">
          {children}
        </div>
        
        {code && showCode && (
          <div className="p-4 bg-card border rounded-lg">
            <pre className="text-sm overflow-auto">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Color palette display
function ColorPalette() {
  const { theme } = useTheme();
  const currentTheme = baseThemes[theme as ThemeVariant] || baseThemes.light;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Brand Colors */}
      <div className="space-y-3">
        <h4 className="font-semibold">Brand Colors</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="h-16 bg-primary rounded-lg border" />
            <div className="text-sm">
              <div className="font-medium">Primary</div>
              <div className="text-muted-foreground font-mono text-xs">
                {currentTheme.colors.primary}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-secondary rounded-lg border" />
            <div className="text-sm">
              <div className="font-medium">Secondary</div>
              <div className="text-muted-foreground font-mono text-xs">
                {currentTheme.colors.secondary}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solar Colors */}
      <div className="space-y-3">
        <h4 className="font-semibold">Solar Theme Colors</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <div className="h-16 bg-solar-primary rounded-lg border" />
            <div className="text-sm">
              <div className="font-medium">Solar</div>
              <div className="text-muted-foreground font-mono text-xs">
                {currentTheme.colors['solar-primary']}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-energy-primary rounded-lg border" />
            <div className="text-sm">
              <div className="font-medium">Energy</div>
              <div className="text-muted-foreground font-mono text-xs">
                {currentTheme.colors['energy-primary']}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-eco-primary rounded-lg border" />
            <div className="text-sm">
              <div className="font-medium">Eco</div>
              <div className="text-muted-foreground font-mono text-xs">
                {currentTheme.colors['eco-primary']}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Typography showcase
function TypographyShowcase() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="font-display text-display-lg font-bold">
          Display Large - Solar Energy Solutions
        </h1>
        <h2 className="font-display text-display-md font-bold">
          Display Medium - Sustainable Power
        </h2>
        <h3 className="font-display text-display-sm font-bold">
          Display Small - Clean Technology
        </h3>
        
        <Separator />
        
        <h1 className="text-4xl font-bold">
          Heading 1 - Premium Solar Panels
        </h1>
        <h2 className="text-3xl font-semibold">
          Heading 2 - Energy Efficiency
        </h2>
        <h3 className="text-2xl font-semibold">
          Heading 3 - Installation Services
        </h3>
        <h4 className="text-xl font-semibold">
          Heading 4 - Maintenance Plans
        </h4>
        
        <Separator />
        
        <p className="text-lg">
          Large body text - Perfect for introductory paragraphs and important information about solar solutions.
        </p>
        <p className="text-base">
          Base body text - The primary text size for most content, optimized for readability across all devices.
        </p>
        <p className="text-sm text-muted-foreground">
          Small text - Used for captions, metadata, and secondary information.
        </p>
      </div>
    </div>
  );
}

// Component variants showcase
function ComponentVariantsShowcase() {
  return (
    <div className="space-y-8">
      {/* Button Variants */}
      <div className="space-y-4">
        <h4 className="font-semibold">Button Variants</h4>
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="solar">Solar</Button>
          <Button variant="energy">Energy</Button>
          <Button variant="eco">Eco</Button>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-4">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>
      </div>

      <Separator />

      {/* Badge Variants */}
      <div className="space-y-4">
        <h4 className="font-semibold">Badge Variants</h4>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="solar">Solar</Badge>
          <Badge variant="energy">Energy</Badge>
          <Badge variant="eco">Eco</Badge>
        </div>
      </div>

      <Separator />

      {/* Input Variants */}
      <div className="space-y-4">
        <h4 className="font-semibold">Input Variants</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Input placeholder="Default input" />
          <Input variant="success" placeholder="Success state" />
          <Input variant="warning" placeholder="Warning state" />
          <Input variant="error" placeholder="Error state" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mt-4">
          <Input size="sm" placeholder="Small" />
          <Input size="md" placeholder="Medium" />
          <Input size="lg" placeholder="Large" />
        </div>
      </div>
    </div>
  );
}

// Icons showcase
function IconsShowcase() {
  return (
    <div className="space-y-6">
      {Object.entries(iconCategories).map(([categoryKey, category]) => (
        <div key={categoryKey} className="space-y-4">
          <div>
            <h4 className="font-semibold">{category.label}</h4>
            <p className="text-sm text-muted-foreground">{category.description}</p>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {Object.entries(category.icons).map(([iconKey, IconComponent]) => (
              <div
                key={iconKey}
                className="flex flex-col items-center p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <Icon name={iconKey as IconName} size="lg" className="mb-2" />
                <span className="text-xs text-center">{iconKey}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Patterns showcase
function PatternsShowcase() {
  return (
    <div className="space-y-8">
      {/* Solar Panel Card */}
      <div className="space-y-4">
        <h4 className="font-semibold">Solar Panel Card Pattern</h4>
        <div className="max-w-sm">
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
            onViewDetails={() => console.log('View details')}
            onAddToCart={() => console.log('Add to cart')}
          />
        </div>
      </div>

      <Separator />

      {/* Energy Production Widget */}
      <div className="space-y-4">
        <h4 className="font-semibold">Energy Production Widget</h4>
        <div className="max-w-sm">
          <EnergyProductionWidget
            currentProduction={5.2}
            dailyProduction={28.4}
            monthlyProduction={847}
            status="excellent"
            weatherCondition="sunny"
            lastUpdated={new Date()}
          />
        </div>
      </div>

      <Separator />

      {/* System Status Widget */}
      <div className="space-y-4">
        <h4 className="font-semibold">System Status Widget</h4>
        <div className="max-w-sm">
          <SystemStatusWidget
            status="online"
            uptime={99.7}
            systemHealth={94}
            alerts={1}
            lastMaintenance={new Date(2024, 5, 15)}
            nextMaintenance={new Date(2024, 11, 15)}
          />
        </div>
      </div>
    </div>
  );
}

// Theme showcase
function ThemeShowcase() {
  const { theme, setTheme, accessibility } = useTheme();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-semibold">Theme Controls</h4>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Theme:</label>
            <ThemeSelect />
          </div>
          <ThemeToggle />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-semibold">Current Theme: {theme}</h4>
        <ColorPalette />
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-semibold">Accessibility Preferences</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Reduced Motion:</span>
            <span className={accessibility.reducedMotion ? 'text-success' : 'text-muted-foreground'}>
              {accessibility.reducedMotion ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>High Contrast:</span>
            <span className={accessibility.highContrast ? 'text-success' : 'text-muted-foreground'}>
              {accessibility.highContrast ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Color Scheme:</span>
            <span className="text-muted-foreground">{accessibility.prefersColorScheme}</span>
          </div>
          <div className="flex justify-between">
            <span>Forced Colors:</span>
            <span className={accessibility.forcedColors ? 'text-success' : 'text-muted-foreground'}>
              {accessibility.forcedColors ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main showcase component
export function DesignSystemShowcase({ className }: { className?: string }) {
  return (
    <div className={cn("w-full max-w-none", className)}>
      <Container size="xl" className="py-12">
        <Stack gap="responsive-lg">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="font-display text-display-lg font-bold">
              Solarify Design System
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A comprehensive design system for solar marketplace applications with 
              accessibility, mobile optimization, and solar industry theming.
            </p>
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="icons">Icons</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <Stack gap="lg">
                <ShowcaseSection
                  title="Design System Overview"
                  description="The Solarify design system provides a complete set of design tokens, components, and patterns for building consistent solar marketplace applications."
                >
                  <ThemeShowcase />
                </ShowcaseSection>

                <ShowcaseSection
                  title="Key Features"
                  description="Accessibility-first design with WCAG 2.1 AA compliance, mobile-first responsive design, and comprehensive theming."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon name="check" size="lg" color="success" />
                        <h4 className="font-semibold">Accessible</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        WCAG 2.1 AA compliant with proper contrast ratios, focus management, and screen reader support.
                      </p>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon name="efficiency" size="lg" color="energy" />
                        <h4 className="font-semibold">Mobile-First</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Responsive design with touch-friendly interactions and optimized mobile performance.
                      </p>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon name="solar-panel" size="lg" color="solar" />
                        <h4 className="font-semibold">Solar-Themed</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Purpose-built for solar marketplace with industry-specific components and theming.
                      </p>
                    </Card>
                  </div>
                </ShowcaseSection>
              </Stack>
            </TabsContent>

            <TabsContent value="colors" className="mt-8">
              <ShowcaseSection
                title="Color System"
                description="Semantic color tokens with solar energy branding and full accessibility compliance."
              >
                <ThemeShowcase />
              </ShowcaseSection>
            </TabsContent>

            <TabsContent value="typography" className="mt-8">
              <ShowcaseSection
                title="Typography System"
                description="Responsive typography scale with solar industry appropriate fonts and accessibility optimizations."
              >
                <TypographyShowcase />
              </ShowcaseSection>
            </TabsContent>

            <TabsContent value="components" className="mt-8">
              <ShowcaseSection
                title="Component Variants"
                description="Consistent component variants across all UI elements with solar-specific styling options."
              >
                <ComponentVariantsShowcase />
              </ShowcaseSection>
            </TabsContent>

            <TabsContent value="icons" className="mt-8">
              <ShowcaseSection
                title="Solar Icon System"
                description="Comprehensive icon library specifically designed for solar marketplace applications."
              >
                <IconsShowcase />
              </ShowcaseSection>
            </TabsContent>

            <TabsContent value="patterns" className="mt-8">
              <ShowcaseSection
                title="Component Patterns"
                description="Pre-built composition patterns for common solar marketplace layouts and functionality."
              >
                <PatternsShowcase />
              </ShowcaseSection>
            </TabsContent>
          </Tabs>
        </Stack>
      </Container>
    </div>
  );
}

export default DesignSystemShowcase;