"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton, type SkeletonProps } from '@/components/ui/advanced-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Sun, 
  Zap, 
  Battery, 
  Calculator,
  Smartphone,
  Wifi,
  Signal
} from 'lucide-react';

// Mobile-specific skeleton with touch-friendly sizing
export interface MobileSkeletonProps extends SkeletonProps {
  touchFriendly?: boolean;
  reducedMotion?: boolean;
}

export function MobileSkeleton({
  className,
  touchFriendly = true,
  reducedMotion,
  ...props
}: MobileSkeletonProps) {
  // Detect user's motion preference
  const prefersReducedMotion = reducedMotion ?? 
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  return (
    <Skeleton
      className={cn(
        touchFriendly && "min-h-touch-target", // Ensure touch target minimum
        className
      )}
      animation={prefersReducedMotion ? "none" : "shimmer"}
      {...props}
    />
  );
}

// Mobile Solar Calculator Skeleton
export function MobileSolarCalculatorSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("w-full max-w-md mx-auto space-y-4 p-mobile-safe", className)}>
      {/* Mobile Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-solar-primary/20 animate-pulse flex items-center justify-center">
            <Sun className="w-5 h-5 text-solar-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <MobileSkeleton width="70%" height="24px" variant="solar" {...props} />
            <MobileSkeleton width="90%" height="16px" {...props} />
          </div>
        </div>
      </div>

      {/* Mobile Step Indicators */}
      <div className="flex justify-center space-x-2 py-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <MobileSkeleton
            key={index}
            width="40px"
            height="40px"
            radius="full"
            variant="solar"
            delay={index * 0.1}
            touchFriendly
            {...props}
          />
        ))}
      </div>

      {/* Mobile Form Fields */}
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <MobileSkeleton width="60%" height="20px" variant="solar" {...props} />
            
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <MobileSkeleton width="40%" height="14px" {...props} />
                  <MobileSkeleton 
                    height="48px" 
                    variant="solar" 
                    delay={(sectionIndex * 3 + fieldIndex) * 0.1}
                    touchFriendly
                    {...props} 
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Action Button */}
      <div className="pt-4">
        <MobileSkeleton 
          width="100%" 
          height="48px" 
          variant="solar" 
          touchFriendly
          {...props} 
        />
      </div>
    </div>
  );
}

// Mobile Equipment Card Skeleton
export function MobileEquipmentCardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <Card className={cn("w-full", className)}>
      {/* Mobile Image */}
      <div className="aspect-[4/3] relative">
        <MobileSkeleton 
          className="absolute inset-0" 
          variant="solar" 
          {...props} 
        />
        
        {/* Mobile Badge */}
        <div className="absolute top-3 left-3">
          <MobileSkeleton width="80px" height="24px" radius="full" {...props} />
        </div>
        
        {/* Mobile Price Tag */}
        <div className="absolute top-3 right-3">
          <MobileSkeleton width="60px" height="20px" radius="sm" variant="eco" {...props} />
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Title and Brand */}
        <div className="space-y-2">
          <MobileSkeleton width="90%" height="20px" variant="solar" {...props} />
          <MobileSkeleton width="60%" height="16px" {...props} />
        </div>
        
        {/* Specs */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <MobileSkeleton width="40%" height="14px" {...props} />
            <MobileSkeleton width="30%" height="14px" variant="energy" {...props} />
          </div>
          <div className="flex justify-between">
            <MobileSkeleton width="50%" height="14px" {...props} />
            <MobileSkeleton width="25%" height="14px" variant="eco" {...props} />
          </div>
        </div>
        
        {/* Mobile Action Buttons */}
        <div className="flex gap-2 pt-2">
          <MobileSkeleton 
            className="flex-1" 
            height="44px" 
            variant="solar" 
            touchFriendly
            {...props} 
          />
          <MobileSkeleton 
            width="44px" 
            height="44px" 
            touchFriendly
            {...props} 
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Mobile Dashboard Skeleton
export function MobileDashboardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("w-full space-y-6 p-mobile-safe", className)}>
      {/* Mobile Header */}
      <div className="space-y-3">
        <MobileSkeleton width="80%" height="28px" variant="solar" {...props} />
        <MobileSkeleton width="100%" height="16px" {...props} />
      </div>

      {/* Mobile Stats Cards - Stacked on mobile */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <MobileSkeleton width="60%" height="14px" {...props} />
                <MobileSkeleton width="40%" height="24px" variant="energy" delay={index * 0.1} {...props} />
              </div>
              <div className="w-8 h-8 rounded bg-muted animate-pulse" />
            </div>
            
            {/* Mobile trend indicator */}
            <div className="flex items-center mt-2 space-x-2">
              <div className="w-3 h-3 rounded bg-muted animate-pulse" />
              <MobileSkeleton width="50px" height="12px" {...props} />
            </div>
          </Card>
        ))}
      </div>

      {/* Mobile Chart */}
      <Card>
        <CardHeader className="pb-2">
          <MobileSkeleton width="60%" height="20px" {...props} />
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-48 relative">
            <MobileSkeleton className="absolute inset-0" variant="chart" {...props} />
          </div>
        </CardContent>
      </Card>

      {/* Mobile Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-4 text-center">
            <div className="space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-muted animate-pulse" />
              <MobileSkeleton width="80%" height="16px" delay={index * 0.1} {...props} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Mobile RFQ Form Skeleton
export function MobileRFQFormSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("w-full space-y-6 p-mobile-safe", className)}>
      {/* Mobile Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-solar-primary/20 animate-pulse flex items-center justify-center">
            <Calculator className="w-6 h-6 text-solar-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <MobileSkeleton width="70%" height="24px" variant="solar" {...props} />
            <MobileSkeleton width="90%" height="16px" {...props} />
          </div>
        </div>
      </div>

      {/* Mobile Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <MobileSkeleton width="30%" height="14px" {...props} />
          <MobileSkeleton width="20%" height="14px" {...props} />
        </div>
        <MobileSkeleton width="100%" height="8px" variant="solar" {...props} />
      </div>

      {/* Mobile Form Sections */}
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader className="pb-4">
            <MobileSkeleton width="60%" height="20px" variant="solar" {...props} />
          </CardHeader>
          
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <MobileSkeleton width="50%" height="16px" {...props} />
                <MobileSkeleton 
                  height="48px" 
                  variant="solar" 
                  delay={(sectionIndex * 4 + fieldIndex) * 0.05}
                  touchFriendly
                  {...props} 
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Mobile Navigation */}
      <div className="flex gap-3 pt-4">
        <MobileSkeleton 
          width="100px" 
          height="48px" 
          touchFriendly
          {...props} 
        />
        <MobileSkeleton 
          className="flex-1" 
          height="48px" 
          variant="solar" 
          touchFriendly
          {...props} 
        />
      </div>
    </div>
  );
}

// Mobile List Skeleton (for equipment lists, orders, etc.)
export function MobileListSkeleton({ 
  items = 5,
  showAvatars = false,
  className,
  ...props 
}: SkeletonProps & { 
  items?: number;
  showAvatars?: boolean;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center space-x-3">
            {showAvatars && (
              <MobileSkeleton 
                width="48px" 
                height="48px" 
                radius="full" 
                variant="solar"
                delay={index * 0.05}
                {...props} 
              />
            )}
            
            <div className="flex-1 space-y-2">
              <MobileSkeleton 
                width="80%" 
                height="18px" 
                variant="solar" 
                delay={index * 0.05}
                {...props} 
              />
              <MobileSkeleton 
                width="60%" 
                height="14px" 
                delay={index * 0.05 + 0.1}
                {...props} 
              />
            </div>
            
            <div className="text-right space-y-1">
              <MobileSkeleton 
                width="60px" 
                height="16px" 
                variant="eco" 
                delay={index * 0.05}
                {...props} 
              />
              <MobileSkeleton 
                width="40px" 
                height="12px" 
                delay={index * 0.05 + 0.1}
                {...props} 
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Mobile Network-Aware Loading
export function MobileNetworkAwareLoading({ 
  children,
  fallback,
  className,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}) {
  const [networkInfo, setNetworkInfo] = React.useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }>({});

  const [isSlowConnection, setIsSlowConnection] = React.useState(false);

  React.useEffect(() => {
    if ('navigator' in window && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkInfo = () => {
        const info = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        };
        
        setNetworkInfo(info);
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' ||
          connection.downlink < 0.5
        );
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);
      
      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  if (isSlowConnection) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Slow connection notice */}
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex items-center space-x-3 p-4">
            <Signal className="w-5 h-5 text-warning" />
            <div className="flex-1">
              <p className="text-sm font-medium">Slow Connection Detected</p>
              <p className="text-xs text-muted-foreground">
                Loading optimized content...
              </p>
            </div>
          </CardContent>
        </Card>
        
        {fallback || <MobileDashboardSkeleton />}
      </div>
    );
  }

  return <>{children}</>;
}

// Mobile Touch Loading Indicator
export function MobileTouchLoadingIndicator({
  size = "default",
  message = "Loading...",
  progress,
  className,
}: {
  size?: "sm" | "default" | "lg";
  message?: string;
  progress?: number;
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    default: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={cn("flex flex-col items-center space-y-4 p-6", className)}>
      <div className="relative">
        <div className={cn(
          "rounded-full border-4 border-solar-primary/20 animate-spin",
          sizeClasses[size]
        )}>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-solar-primary" />
        </div>
        
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-solar-primary">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {progress !== undefined && (
          <div className="mt-2 w-32 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-solar-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile Battery-Aware Component
export function MobileBatteryAwareLoading({
  children,
  lowBatteryFallback,
  batteryThreshold = 20,
  className,
}: {
  children: React.ReactNode;
  lowBatteryFallback?: React.ReactNode;
  batteryThreshold?: number;
  className?: string;
}) {
  const [batteryLevel, setBatteryLevel] = React.useState<number | null>(null);
  const [isCharging, setIsCharging] = React.useState(false);

  React.useEffect(() => {
    if ('navigator' in window && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryInfo = () => {
          setBatteryLevel(battery.level * 100);
          setIsCharging(battery.charging);
        };

        updateBatteryInfo();
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);

        return () => {
          battery.removeEventListener('levelchange', updateBatteryInfo);
          battery.removeEventListener('chargingchange', updateBatteryInfo);
        };
      });
    }
  }, []);

  const isLowBattery = batteryLevel !== null && batteryLevel < batteryThreshold && !isCharging;

  if (isLowBattery) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex items-center space-x-3 p-4">
            <Battery className="w-5 h-5 text-warning" />
            <div className="flex-1">
              <p className="text-sm font-medium">Low Battery Mode</p>
              <p className="text-xs text-muted-foreground">
                Reduced animations to save battery
              </p>
            </div>
            <span className="text-xs font-medium text-warning">
              {Math.round(batteryLevel!)}%
            </span>
          </CardContent>
        </Card>
        
        {lowBatteryFallback || (
          <MobileSkeleton 
            animation="none" 
            className="w-full h-32" 
            variant="solar" 
          />
        )}
      </div>
    );
  }

  return <>{children}</>;
}