"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Enhanced skeleton variants with solar-specific animations
const skeletonVariants = cva(
  "block rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
  {
    variants: {
      animation: {
        pulse: "animate-pulse",
        shimmer: "animate-[shimmer_2s_ease-in-out_infinite]",
        wave: "animate-[wave_1.6s_ease-in-out_infinite]",
        glow: "animate-[glow_2s_ease-in-out_infinite]",
        none: "",
      },
      variant: {
        default: "bg-muted",
        solar: "bg-gradient-to-r from-solar-primary/10 via-solar-accent/5 to-solar-primary/10",
        energy: "bg-gradient-to-r from-energy-primary/10 via-energy-secondary/5 to-energy-primary/10",
        eco: "bg-gradient-to-r from-eco-primary/10 via-eco-secondary/5 to-eco-primary/10",
        chart: "bg-gradient-to-r from-chart-1/10 via-chart-2/5 to-chart-3/10",
        glass: "bg-white/5 backdrop-blur-sm border border-white/10",
      },
      size: {
        xs: "h-3",
        sm: "h-4",
        default: "h-6",
        lg: "h-8",
        xl: "h-12",
        "2xl": "h-16",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        default: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      animation: "shimmer",
      variant: "default",
      size: "default",
      radius: "default",
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
  lines?: number;
  spacing?: string;
  delay?: number;
  duration?: number;
}

export function Skeleton({
  className,
  animation,
  variant,
  size,
  radius,
  width,
  height,
  lines = 1,
  spacing = "0.5rem",
  delay = 0,
  duration = 2,
  style,
  ...props
}: SkeletonProps) {
  const skeletonStyle = {
    width: width || "100%",
    height: height,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    ...style,
  };

  if (lines === 1) {
    return (
      <div
        className={cn(skeletonVariants({ animation, variant, size, radius }), className)}
        style={skeletonStyle}
        {...props}
      />
    );
  }

  return (
    <div className="space-y-2" {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(skeletonVariants({ animation, variant, size, radius }), className)}
          style={{
            ...skeletonStyle,
            width: index === lines - 1 ? "75%" : skeletonStyle.width,
            marginBottom: index < lines - 1 ? spacing : 0,
            animationDelay: `${delay + index * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Specialized skeleton components for common use cases

export function TextSkeleton({
  lines = 3,
  className,
  ...props
}: Omit<SkeletonProps, "size"> & { lines?: number }) {
  return (
    <Skeleton
      size="sm"
      lines={lines}
      className={cn("max-w-full", className)}
      {...props}
    />
  );
}

export function AvatarSkeleton({
  size = "lg",
  className,
  ...props
}: Omit<SkeletonProps, "radius">) {
  return (
    <Skeleton
      radius="full"
      size={size}
      className={cn("aspect-square", className)}
      {...props}
    />
  );
}

export function CardSkeleton({
  showHeader = true,
  showFooter = false,
  contentLines = 3,
  className,
  ...props
}: SkeletonProps & {
  showHeader?: boolean;
  showFooter?: boolean;
  contentLines?: number;
}) {
  return (
    <div className={cn("p-4 space-y-4", className)}>
      {showHeader && (
        <div className="space-y-2">
          <Skeleton size="lg" width="60%" {...props} />
          <Skeleton size="sm" width="40%" {...props} />
        </div>
      )}
      <div className="space-y-2">
        <TextSkeleton lines={contentLines} {...props} />
      </div>
      {showFooter && (
        <div className="flex justify-between items-center pt-2">
          <Skeleton size="sm" width="30%" {...props} />
          <Skeleton size="default" width="80px" {...props} />
        </div>
      )}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
  ...props
}: SkeletonProps & {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              size="sm"
              width="80%"
              {...props}
            />
          ))}
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                size="default"
                delay={rowIndex * 0.05 + colIndex * 0.02}
                {...props}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({
  type = "line",
  className,
  ...props
}: SkeletonProps & {
  type?: "line" | "bar" | "pie" | "area";
}) {
  if (type === "pie") {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Skeleton
          radius="full"
          size="2xl"
          width="200px"
          height="200px"
          variant="chart"
          {...props}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 p-4", className)}>
      {/* Chart Title */}
      <div className="space-y-2">
        <Skeleton width="40%" size="lg" {...props} />
        <Skeleton width="60%" size="sm" {...props} />
      </div>
      
      {/* Chart Area */}
      <div className="relative h-64 flex items-end space-x-2">
        {Array.from({ length: type === "bar" ? 8 : 12 }).map((_, index) => {
          const height = Math.random() * 80 + 20;
          return (
            <Skeleton
              key={index}
              width={type === "bar" ? "20px" : "2px"}
              height={`${height}%`}
              variant="chart"
              delay={index * 0.1}
              {...props}
            />
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex space-x-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Skeleton width="12px" height="12px" radius="full" variant="chart" {...props} />
            <Skeleton width="60px" size="sm" {...props} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom CSS for advanced animations (to be added to globals.css)
export const skeletonAnimations = `
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  @keyframes wave {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  @keyframes glow {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.8;
    }
  }

  @keyframes pulse-soft {
    0%, 100% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.3;
    }
  }
`;