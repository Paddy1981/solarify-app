/**
 * Solar Component Patterns
 * Pre-built component patterns specific to solar marketplace functionality
 * Includes product cards, calculator widgets, status indicators, and more
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@/components/icons';
import { Flex, Stack } from './solar-layout-patterns';

// Base pattern props
interface BasePatternProps {
  className?: string;
}

// Solar Panel Card Pattern
interface SolarPanelCardProps extends BasePatternProps {
  name: string;
  brand?: string;
  wattage: number;
  efficiency: number;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  isOnSale?: boolean;
  isFeatured?: boolean;
  image?: string;
  onViewDetails?: () => void;
  onAddToCart?: () => void;
}

export function SolarPanelCard({
  name,
  brand,
  wattage,
  efficiency,
  price,
  originalPrice,
  rating,
  reviewCount,
  isOnSale,
  isFeatured,
  image,
  onViewDetails,
  onAddToCart,
  className
}: SolarPanelCardProps) {
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  return (
    <Card 
      variant="elevated" 
      className={cn("group hover:shadow-lg transition-all duration-200", className)}
    >
      <CardHeader className="p-0">
        <div className="relative">
          {image ? (
            <img 
              src={image} 
              alt={name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
              <Icon name="solar-panel" size="2xl" color="muted" />
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex gap-2">
            {isFeatured && (
              <Badge variant="solar" size="sm">
                Featured
              </Badge>
            )}
            {isOnSale && discount > 0 && (
              <Badge variant="error" size="sm">
                {discount}% OFF
              </Badge>
            )}
          </div>
          
          {rating && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded px-2 py-1">
              <Flex gap="xs" align="center">
                <Icon name="efficiency" size="xs" color="warning" />
                <span className="text-sm font-medium">{rating}</span>
                {reviewCount && (
                  <span className="text-xs text-muted-foreground">({reviewCount})</span>
                )}
              </Flex>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <Stack gap="sm">
          <div>
            {brand && (
              <p className="text-sm text-muted-foreground mb-1">{brand}</p>
            )}
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
              {name}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Power Output</p>
              <p className="font-semibold">{wattage}W</p>
            </div>
            <div>
              <p className="text-muted-foreground">Efficiency</p>
              <p className="font-semibold">{efficiency}%</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <Flex gap="sm" align="baseline">
              <span className="text-2xl font-bold text-primary">
                ${price.toLocaleString()}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-muted-foreground line-through">
                  ${originalPrice.toLocaleString()}
                </span>
              )}
            </Flex>
          </div>
        </Stack>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={onViewDetails}
        >
          View Details
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          className="flex-1"
          onClick={onAddToCart}
        >
          <Icon name="cart" size="sm" className="mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}

// Energy Production Widget Pattern
interface EnergyProductionWidgetProps extends BasePatternProps {
  currentProduction: number;
  dailyProduction: number;
  monthlyProduction: number;
  unit?: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  weatherCondition?: 'sunny' | 'partly-cloudy' | 'cloudy';
  lastUpdated?: Date;
}

export function EnergyProductionWidget({
  currentProduction,
  dailyProduction,
  monthlyProduction,
  unit = 'kWh',
  status,
  weatherCondition,
  lastUpdated,
  className
}: EnergyProductionWidgetProps) {
  const statusColors = {
    excellent: 'eco',
    good: 'success',
    fair: 'warning',
    poor: 'error',
  } as const;

  const weatherIcons = {
    sunny: 'sun',
    'partly-cloudy': 'partly-cloudy',
    cloudy: 'cloudy',
  } as const;

  return (
    <Card variant="elevated" className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-energy-primary/5 to-transparent" />
      
      <CardHeader className="pb-3">
        <Flex justify="between" align="start">
          <div>
            <h3 className="font-semibold text-lg">Energy Production</h3>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <Flex gap="sm" align="center">
            {weatherCondition && (
              <Icon 
                name={weatherIcons[weatherCondition]} 
                size="lg" 
                color="energy" 
              />
            )}
            <Badge variant={statusColors[status]} size="sm">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </Flex>
        </Flex>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-energy-primary">
            {currentProduction.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">
            {unit}/hour current
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-xl font-semibold">
              {dailyProduction.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">
              {unit} today
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-semibold">
              {monthlyProduction.toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">
              {unit} this month
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Savings Calculator Summary Pattern
interface SavingsCalculatorSummaryProps extends BasePatternProps {
  systemSize: number;
  estimatedCost: number;
  annualSavings: number;
  paybackPeriod: number;
  co2Reduction: number;
  incentives?: number;
  financing?: {
    monthlyPayment: number;
    term: number;
  };
}

export function SavingsCalculatorSummary({
  systemSize,
  estimatedCost,
  annualSavings,
  paybackPeriod,
  co2Reduction,
  incentives,
  financing,
  className
}: SavingsCalculatorSummaryProps) {
  const netCost = incentives ? estimatedCost - incentives : estimatedCost;
  const twentyYearSavings = annualSavings * 20 - netCost;

  return (
    <Card variant="solar" className={cn("sticky top-6", className)}>
      <CardHeader>
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <Icon name="calculator" size="lg" color="solar" />
          Solar Savings Summary
        </h3>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-solar-primary">
              {systemSize} kW
            </div>
            <div className="text-sm text-muted-foreground">
              System Size
            </div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-energy-primary">
              {paybackPeriod} years
            </div>
            <div className="text-sm text-muted-foreground">
              Payback Period
            </div>
          </div>
        </div>
        
        <Separator />
        
        <Stack gap="sm">
          <Flex justify="between">
            <span className="text-muted-foreground">System Cost</span>
            <span className="font-semibold">${estimatedCost.toLocaleString()}</span>
          </Flex>
          
          {incentives && (
            <Flex justify="between" className="text-success">
              <span>Tax Incentives</span>
              <span className="font-semibold">-${incentives.toLocaleString()}</span>
            </Flex>
          )}
          
          <Flex justify="between" className="text-lg font-bold">
            <span>Net Cost</span>
            <span>${netCost.toLocaleString()}</span>
          </Flex>
        </Stack>
        
        <Separator />
        
        {financing && (
          <div className="p-3 bg-eco-primary/10 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-eco-primary">
                ${financing.monthlyPayment}
              </div>
              <div className="text-sm text-muted-foreground">
                per month for {financing.term} years
              </div>
            </div>
          </div>
        )}
        
        <Stack gap="sm">
          <Flex justify="between">
            <span className="text-muted-foreground">Annual Savings</span>
            <span className="font-semibold text-success">
              ${annualSavings.toLocaleString()}
            </span>
          </Flex>
          
          <Flex justify="between" className="text-lg font-bold">
            <span>20-Year Savings</span>
            <span className="text-success">
              ${twentyYearSavings.toLocaleString()}
            </span>
          </Flex>
        </Stack>
        
        <Separator />
        
        <div className="text-center p-3 bg-eco-primary/10 rounded-lg">
          <Flex gap="sm" align="center" justify="center">
            <Icon name="carbon-footprint" size="md" color="eco" />
            <div>
              <div className="font-bold text-eco-primary">
                {co2Reduction.toFixed(1)} tons
              </div>
              <div className="text-sm text-muted-foreground">
                CO₂ reduced annually
              </div>
            </div>
          </Flex>
        </div>
      </CardContent>
    </Card>
  );
}

// Installer Profile Card Pattern
interface InstallerProfileCardProps extends BasePatternProps {
  name: string;
  company: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  projectsCompleted: number;
  certifications: string[];
  serviceAreas: string[];
  avatar?: string;
  isVerified?: boolean;
  response Time?: string;
  onContact?: () => void;
  onViewProfile?: () => void;
}

export function InstallerProfileCard({
  name,
  company,
  rating,
  reviewCount,
  yearsExperience,
  projectsCompleted,
  certifications,
  serviceAreas,
  avatar,
  isVerified,
  responseTime,
  onContact,
  onViewProfile,
  className
}: InstallerProfileCardProps) {
  return (
    <Card variant="elevated" className={cn("group hover:shadow-lg transition-all", className)}>
      <CardHeader>
        <Flex gap="md">
          <div className="relative">
            {avatar ? (
              <img 
                src={avatar} 
                alt={name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Icon name="installer" size="lg" color="muted" />
              </div>
            )}
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-success rounded-full p-1">
                <Icon name="check" size="xs" color="white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{name}</h3>
            <p className="text-muted-foreground truncate">{company}</p>
            
            <Flex gap="sm" align="center" className="mt-2">
              <Icon name="efficiency" size="sm" color="warning" />
              <span className="font-medium">{rating}</span>
              <span className="text-sm text-muted-foreground">
                ({reviewCount} reviews)
              </span>
            </Flex>
          </div>
        </Flex>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Experience</p>
            <p className="font-semibold">{yearsExperience} years</p>
          </div>
          <div>
            <p className="text-muted-foreground">Projects</p>
            <p className="font-semibold">{projectsCompleted}+</p>
          </div>
        </div>
        
        {responseTime && (
          <div className="flex items-center gap-2 text-sm text-success">
            <Icon name="info" size="sm" />
            <span>Typically responds in {responseTime}</span>
          </div>
        )}
        
        {certifications.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Certifications</p>
            <div className="flex flex-wrap gap-1">
              {certifications.slice(0, 3).map((cert, index) => (
                <Badge key={index} variant="outline" size="sm">
                  {cert}
                </Badge>
              ))}
              {certifications.length > 3 && (
                <Badge variant="outline" size="sm">
                  +{certifications.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {serviceAreas.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Service Areas</p>
            <p className="text-sm text-muted-foreground">
              {serviceAreas.slice(0, 2).join(', ')}
              {serviceAreas.length > 2 && ` and ${serviceAreas.length - 2} more`}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={onViewProfile}
        >
          View Profile
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          className="flex-1"
          onClick={onContact}
        >
          <Icon name="info" size="sm" className="mr-2" />
          Contact
        </Button>
      </CardFooter>
    </Card>
  );
}

// System Status Widget Pattern
interface SystemStatusWidgetProps extends BasePatternProps {
  status: 'online' | 'offline' | 'maintenance' | 'warning';
  uptime: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  alerts?: number;
  systemHealth: number;
}

export function SystemStatusWidget({
  status,
  uptime,
  lastMaintenance,
  nextMaintenance,
  alerts = 0,
  systemHealth,
  className
}: SystemStatusWidgetProps) {
  const statusConfig = {
    online: {
      color: 'success',
      icon: 'check',
      label: 'Online',
    },
    offline: {
      color: 'error',
      icon: 'alert',
      label: 'Offline',
    },
    maintenance: {
      color: 'warning',
      icon: 'maintenance',
      label: 'Maintenance',
    },
    warning: {
      color: 'warning',
      icon: 'alert',
      label: 'Warning',
    },
  } as const;

  const config = statusConfig[status];

  return (
    <Card variant="default" className={cn("", className)}>
      <CardHeader className="pb-3">
        <Flex justify="between" align="center">
          <h3 className="font-semibold">System Status</h3>
          <Badge variant={config.color} size="sm">
            <Icon name={config.icon} size="xs" className="mr-1" />
            {config.label}
          </Badge>
        </Flex>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">System Health</span>
            <span className="font-medium">{systemHealth}%</span>
          </div>
          <Progress 
            value={systemHealth} 
            variant={systemHealth > 80 ? 'success' : systemHealth > 50 ? 'warning' : 'error'}
            className="h-2"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Uptime</p>
            <p className="font-semibold">{uptime.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Alerts</p>
            <p className="font-semibold text-warning">{alerts}</p>
          </div>
        </div>
        
        {(lastMaintenance || nextMaintenance) && (
          <>
            <Separator />
            <Stack gap="xs">
              {lastMaintenance && (
                <Flex justify="between" className="text-sm">
                  <span className="text-muted-foreground">Last Service</span>
                  <span>{lastMaintenance.toLocaleDateString()}</span>
                </Flex>
              )}
              {nextMaintenance && (
                <Flex justify="between" className="text-sm">
                  <span className="text-muted-foreground">Next Service</span>
                  <span>{nextMaintenance.toLocaleDateString()}</span>
                </Flex>
              )}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Export all patterns
export const SolarComponentPatterns = {
  SolarPanelCard,
  EnergyProductionWidget,
  SavingsCalculatorSummary,
  InstallerProfileCard,
  SystemStatusWidget,
};

// Export individual patterns
export {
  SolarPanelCard,
  EnergyProductionWidget,
  SavingsCalculatorSummary,
  InstallerProfileCard,
  SystemStatusWidget,
};