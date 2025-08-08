"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Skeleton, 
  CardSkeleton, 
  ChartSkeleton, 
  TableSkeleton,
  type SkeletonProps 
} from '@/components/ui/advanced-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, 
  Zap, 
  Battery, 
  DollarSign, 
  Leaf, 
  TrendingUp,
  Calculator,
  MapPin,
  Calendar,
  Settings,
  BarChart3
} from 'lucide-react';

// Solar Calculator Loading Pattern
export function SolarCalculatorSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-solar-primary/20 animate-pulse flex items-center justify-center">
            <Sun className="w-4 h-4 text-solar-primary" />
          </div>
          <Skeleton width="200px" size="lg" variant="solar" {...props} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Step Indicators */}
        <div className="flex justify-center space-x-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              width="32px"
              height="32px"
              radius="full"
              variant="solar"
              delay={index * 0.1}
              {...props}
            />
          ))}
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          <div className="space-y-4">
            <Skeleton width="40%" size="lg" variant="solar" {...props} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton width="30%" size="sm" {...props} />
                  <Skeleton height="40px" variant="solar" delay={index * 0.1} {...props} />
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Usage Grid */}
          <div className="space-y-4">
            <Skeleton width="50%" size="lg" {...props} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="space-y-1">
                  <Skeleton width="60px" size="xs" {...props} />
                  <Skeleton height="36px" variant="solar" delay={index * 0.05} {...props} />
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Skeleton width="150px" height="40px" variant="solar" {...props} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Solar Results Loading Pattern
export function SolarResultsSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-6 max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <Skeleton width="60%" height="32px" variant="solar" {...props} />
        <Skeleton width="80%" size="sm" {...props} />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Sun, color: 'solar' },
          { icon: Zap, color: 'energy' },
          { icon: DollarSign, color: 'eco' },
          { icon: Leaf, color: 'chart' },
        ].map(({ icon: Icon, color }, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4 text-center space-y-3">
              <div className="w-8 h-8 mx-auto rounded-full bg-muted animate-pulse flex items-center justify-center">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <Skeleton 
                width="80px" 
                height="32px" 
                variant={color as any}
                delay={index * 0.1}
                {...props} 
              />
              <Skeleton width="60%" size="sm" {...props} />
            </CardContent>
            
            {/* Animated gradient overlay */}
            <div 
              className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-5",
                color === 'solar' && "from-solar-primary to-solar-accent",
                color === 'energy' && "from-energy-primary to-energy-secondary",
                color === 'eco' && "from-eco-primary to-eco-secondary",
                color === 'chart' && "from-chart-1 to-chart-2"
              )}
            />
          </Card>
        ))}
      </div>

      {/* System Components */}
      <Card>
        <CardHeader>
          <Skeleton width="40%" size="lg" {...props} />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton width="30%" size="default" variant="solar" {...props} />
              <Skeleton lines={2} {...props} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <Skeleton width="50%" size="lg" {...props} />
        </CardHeader>
        <CardContent>
          <ChartSkeleton type="area" variant="energy" {...props} />
        </CardContent>
      </Card>
    </div>
  );
}

// Equipment Catalog Loading Pattern
export function EquipmentCatalogSkeleton({ 
  itemsPerRow = 3,
  rows = 3,
  className,
  ...props 
}: SkeletonProps & { itemsPerRow?: number; rows?: number }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton width="300px" height="40px" {...props} />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton 
                key={index}
                width="100px" 
                height="32px" 
                delay={index * 0.1}
                {...props} 
              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Skeleton width="120px" size="sm" {...props} />
          <Skeleton width="80px" height="36px" {...props} />
        </div>
      </div>

      {/* Equipment Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-${itemsPerRow} gap-6`}>
        {Array.from({ length: itemsPerRow * rows }).map((_, index) => (
          <EquipmentCardSkeleton 
            key={index} 
            delay={index * 0.05}
            {...props} 
          />
        ))}
      </div>
    </div>
  );
}

// Individual Equipment Card Skeleton
export function EquipmentCardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="aspect-video relative">
        <Skeleton 
          className="absolute inset-0" 
          variant="solar" 
          {...props} 
        />
        
        {/* Badge */}
        <div className="absolute top-3 left-3">
          <Skeleton width="60px" height="20px" radius="full" {...props} />
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton width="80%" size="lg" variant="solar" {...props} />
          <Skeleton width="60%" size="sm" {...props} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton width="40%" size="sm" {...props} />
            <Skeleton width="30%" size="sm" variant="energy" {...props} />
          </div>
          <div className="flex justify-between">
            <Skeleton width="50%" size="sm" {...props} />
            <Skeleton width="25%" size="sm" variant="eco" {...props} />
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Skeleton width="80px" height="36px" variant="solar" {...props} />
          <Skeleton width="40px" height="36px" {...props} />
        </div>
      </CardContent>
    </Card>
  );
}

// Dashboard Analytics Loading Pattern
export function DashboardAnalyticsSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Welcome Message */}
      <div className="space-y-2">
        <Skeleton width="40%" height="32px" variant="solar" {...props} />
        <Skeleton width="60%" size="default" {...props} />
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton width="60%" size="sm" {...props} />
              <div className="w-4 h-4 rounded bg-muted animate-pulse" />
            </div>
            <Skeleton width="80px" height="28px" variant="energy" delay={index * 0.1} {...props} />
            <div className="flex items-center mt-2">
              <div className="w-3 h-3 rounded bg-muted animate-pulse mr-1" />
              <Skeleton width="50px" size="xs" {...props} />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton width="40%" size="lg" {...props} />
          <Skeleton width="100px" height="36px" {...props} />
        </CardHeader>
        <CardContent>
          <ChartSkeleton type="area" variant="solar" {...props} />
        </CardContent>
      </Card>

      {/* Side by Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton width="60%" size="lg" {...props} />
          </CardHeader>
          <CardContent>
            <ChartSkeleton type="pie" variant="eco" {...props} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton width="50%" size="lg" {...props} />
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={4} columns={3} {...props} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// RFQ Form Loading Pattern
export function RFQFormSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-solar-primary/20 animate-pulse flex items-center justify-center">
            <Calculator className="w-4 h-4 text-solar-primary" />
          </div>
          <div className="space-y-1">
            <Skeleton width="200px" size="lg" variant="solar" {...props} />
            <Skeleton width="300px" size="sm" {...props} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Progress Steps */}
        <div className="flex justify-between items-center">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center">
              <Skeleton 
                width="32px" 
                height="32px" 
                radius="full" 
                variant="solar"
                delay={index * 0.1}
                {...props} 
              />
              {index < 3 && (
                <Skeleton width="60px" height="2px" className="mx-2" {...props} />
              )}
            </div>
          ))}
        </div>

        {/* Form Sections */}
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <Skeleton width="40%" size="lg" variant="solar" {...props} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <Skeleton width="60%" size="sm" {...props} />
                  <Skeleton 
                    height="44px" 
                    variant="solar" 
                    delay={(sectionIndex * 4 + fieldIndex) * 0.05}
                    {...props} 
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Skeleton width="100px" height="44px" {...props} />
          <Skeleton width="120px" height="44px" variant="solar" {...props} />
        </div>
      </CardContent>
    </Card>
  );
}

// Quote Generation Loading Pattern
export function QuoteGenerationSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-6 max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-solar-primary/20 animate-pulse flex items-center justify-center">
          <DollarSign className="w-8 h-8 text-solar-primary" />
        </div>
        <Skeleton width="50%" height="32px" variant="solar" {...props} />
        <Skeleton width="70%" size="default" {...props} />
      </div>

      {/* Quote Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="text-center p-6">
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-muted animate-pulse" />
              <Skeleton width="80%" size="lg" variant="energy" delay={index * 0.1} {...props} />
              <Skeleton width="60%" size="sm" {...props} />
            </div>
          </Card>
        ))}
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <Skeleton width="50%" size="lg" {...props} />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
              <div className="space-y-1">
                <Skeleton width="200px" size="default" variant="solar" {...props} />
                <Skeleton width="150px" size="sm" {...props} />
              </div>
              <Skeleton width="100px" size="lg" variant="eco" delay={index * 0.1} {...props} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Terms and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton width="40%" size="lg" {...props} />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Skeleton width="16px" height="16px" radius="full" {...props} />
                <Skeleton width="100%" lines={1} delay={index * 0.05} {...props} />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton width="50%" size="lg" {...props} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton width="100%" height="48px" variant="solar" {...props} />
              <Skeleton width="100%" height="48px" {...props} />
            </div>
            <div className="text-center pt-4">
              <Skeleton width="80%" size="sm" {...props} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// System Monitoring Loading Pattern
export function SystemMonitoringSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* System Status Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-solar-primary/20 animate-pulse flex items-center justify-center">
                <Sun className="w-6 h-6 text-solar-primary" />
              </div>
              <div className="space-y-2">
                <Skeleton width="200px" size="lg" variant="solar" {...props} />
                <Skeleton width="120px" size="sm" {...props} />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton width="80px" height="24px" radius="full" variant="eco" {...props} />
              <Skeleton width="100px" size="sm" {...props} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Current', icon: Zap },
          { label: 'Daily', icon: Sun },
          { label: 'Monthly', icon: Calendar },
          { label: 'Savings', icon: DollarSign },
          { label: 'Efficiency', icon: TrendingUp },
          { label: 'Battery', icon: Battery },
        ].map(({ label, icon: Icon }, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <Icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <Skeleton width="60px" size="lg" variant="energy" delay={index * 0.1} {...props} />
              <Skeleton width="80%" size="xs" className="mt-1" {...props} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-2">
            <Skeleton width="50%" size="lg" {...props} />
            <Skeleton width="70%" size="sm" {...props} />
          </div>
          <div className="flex space-x-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} width="60px" height="32px" delay={index * 0.1} {...props} />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ChartSkeleton type="area" variant="solar" {...props} />
        </CardContent>
      </Card>

      {/* System Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton width="60%" size="lg" {...props} />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Skeleton width="40%" size="default" {...props} />
                  <Skeleton width="30%" size="default" variant="energy" delay={index * 0.1} {...props} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton width="50%" size="lg" {...props} />
          </CardHeader>
          <CardContent>
            <ChartSkeleton type="pie" variant="eco" {...props} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}