"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  Sun, 
  Zap, 
  Battery, 
  Loader2,
  RotateCcw,
  RefreshCw,
  Circle,
  ArrowRight
} from 'lucide-react';

// Animation variants for different loading states
const animationVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        spin: "animate-spin",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        ping: "animate-ping",
        "fade-in": "animate-in fade-in duration-300",
        "fade-out": "animate-out fade-out duration-300",
        "slide-in": "animate-in slide-in-from-left duration-300",
        "slide-out": "animate-out slide-out-to-right duration-300",
        "scale-in": "animate-in zoom-in duration-200",
        "scale-out": "animate-out zoom-out duration-200",
        "glow": "animate-pulse",
        "shimmer": "animate-[shimmer_2s_ease-in-out_infinite]",
        "wave": "animate-[wave_1.5s_ease-in-out_infinite]",
        "solar-glow": "animate-[solar-glow_3s_ease-in-out_infinite]",
      },
      size: {
        xs: "w-3 h-3",
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-12 h-12",
        "2xl": "w-16 h-16",
      },
      speed: {
        slow: "[animation-duration:3s]",
        normal: "[animation-duration:2s]",
        fast: "[animation-duration:1s]",
        "very-fast": "[animation-duration:0.5s]",
      },
    },
    defaultVariants: {
      variant: "spin",
      size: "default",
      speed: "normal",
    },
  }
);

export interface LoadingIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof animationVariants> {
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  delay?: number;
}

export function LoadingIcon({
  className,
  variant,
  size,
  speed,
  icon: Icon = Loader2,
  color = "text-solar-primary",
  delay = 0,
  style,
  ...props
}: LoadingIconProps) {
  return (
    <div
      className={cn(animationVariants({ variant, size, speed }), className)}
      style={{
        animationDelay: `${delay}ms`,
        ...style,
      }}
      {...props}
    >
      <Icon className={cn("w-full h-full", color)} />
    </div>
  );
}

// Solar-specific animated icons
export function SolarLoadingIcon({ 
  className, 
  variant = "solar-glow",
  ...props 
}: LoadingIconProps) {
  return (
    <LoadingIcon
      className={cn("relative", className)}
      icon={Sun}
      variant={variant}
      color="text-solar-primary"
      {...props}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-solar-primary/20 rounded-full blur-lg animate-pulse" />
    </LoadingIcon>
  );
}

export function EnergyLoadingIcon(props: LoadingIconProps) {
  return (
    <LoadingIcon
      icon={Zap}
      variant="ping"
      color="text-energy-primary"
      {...props}
    />
  );
}

export function BatteryLoadingIcon({ 
  level = 50,
  ...props 
}: LoadingIconProps & { level?: number }) {
  return (
    <div className="relative">
      <LoadingIcon
        icon={Battery}
        variant="pulse"
        color="text-green-500"
        {...props}
      />
      
      {/* Battery level indicator */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-green-500 to-yellow-500 opacity-30 rounded"
        style={{ width: `${level}%` }}
      />
    </div>
  );
}

// Progressive Content Reveal Animation
export interface ProgressiveRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  className?: string;
  stagger?: boolean;
  staggerDelay?: number;
}

export function ProgressiveReveal({
  children,
  delay = 0,
  duration = 300,
  direction = 'fade',
  className,
  stagger = false,
  staggerDelay = 100,
}: ProgressiveRevealProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationClass = () => {
    const base = "transition-all duration-300 ease-out";
    
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `${base} transform translate-y-4 opacity-0`;
        case 'down':
          return `${base} transform -translate-y-4 opacity-0`;
        case 'left':
          return `${base} transform translate-x-4 opacity-0`;
        case 'right':
          return `${base} transform -translate-x-4 opacity-0`;
        default:
          return `${base} opacity-0`;
      }
    }

    return `${base} transform translate-x-0 translate-y-0 opacity-100`;
  };

  if (stagger && React.isValidElement(children)) {
    return (
      <div className={className}>
        {React.Children.map(children.props.children, (child, index) => (
          <ProgressiveReveal
            key={index}
            delay={delay + (index * staggerDelay)}
            duration={duration}
            direction={direction}
          >
            {child}
          </ProgressiveReveal>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(getAnimationClass(), className)}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Staggered Grid Animation
export interface StaggeredGridProps {
  children: React.ReactNode;
  columns?: number;
  staggerDelay?: number;
  animationDuration?: number;
  className?: string;
}

export function StaggeredGrid({
  children,
  columns = 3,
  staggerDelay = 100,
  animationDuration = 300,
  className,
}: StaggeredGridProps) {
  return (
    <div 
      className={cn(
        `grid gap-4`,
        `grid-cols-1 md:grid-cols-${columns}`,
        className
      )}
    >
      {React.Children.map(children, (child, index) => (
        <ProgressiveReveal
          key={index}
          delay={index * staggerDelay}
          duration={animationDuration}
          direction="up"
        >
          {child}
        </ProgressiveReveal>
      ))}
    </div>
  );
}

// Loading Dots Animation
export interface LoadingDotsProps {
  count?: number;
  size?: 'sm' | 'default' | 'lg';
  color?: string;
  className?: string;
}

export function LoadingDots({
  count = 3,
  size = 'default',
  color = "bg-solar-primary",
  className,
}: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    default: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "rounded-full animate-pulse",
            sizeClasses[size],
            color
          )}
          style={{
            animationDelay: `${index * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

// Progress Wave Animation
export interface ProgressWaveProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  className?: string;
}

export function ProgressWave({
  progress,
  height = 4,
  color = "bg-gradient-to-r from-solar-primary to-solar-accent",
  backgroundColor = "bg-muted",
  animated = true,
  className,
}: ProgressWaveProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full",
        backgroundColor,
        className
      )}
      style={{ height: `${height}px` }}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full transition-all duration-500 ease-out",
          color,
          animated && "animate-[wave_2s_ease-in-out_infinite]"
        )}
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
        }}
      />
      
      {animated && (
        <>
          {/* Wave shimmer effect */}
          <div
            className="absolute top-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
            }}
          />
        </>
      )}
    </div>
  );
}

// Breathing Card Animation
export interface BreathingCardProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'normal' | 'strong';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export function BreathingCard({
  children,
  intensity = 'normal',
  speed = 'normal',
  className,
}: BreathingCardProps) {
  const intensityScale = {
    subtle: 'hover:scale-[1.02]',
    normal: 'hover:scale-[1.05]',
    strong: 'hover:scale-[1.08]',
  };

  const speedDuration = {
    slow: 'duration-700',
    normal: 'duration-500',
    fast: 'duration-300',
  };

  return (
    <div
      className={cn(
        "transform transition-transform ease-in-out",
        intensityScale[intensity],
        speedDuration[speed],
        "hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

// Pulse Ring Animation
export interface PulseRingProps {
  size?: number;
  color?: string;
  intensity?: number;
  speed?: number;
  className?: string;
}

export function PulseRing({
  size = 40,
  color = "border-solar-primary",
  intensity = 0.5,
  speed = 2,
  className,
}: PulseRingProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn("rounded-full border-2 animate-ping", color)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          animationDuration: `${speed}s`,
          opacity: intensity,
        }}
      />
      <div
        className={cn("absolute inset-0 rounded-full border-2", color)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
    </div>
  );
}

// Skeleton Shimmer Effect Component
export interface SkeletonShimmerProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'default' | 'solar' | 'energy' | 'eco';
}

export function SkeletonShimmer({
  width = "100%",
  height = "1rem",
  className,
  variant = 'default',
}: SkeletonShimmerProps) {
  const variantClasses = {
    default: "bg-gradient-to-r from-muted via-muted/50 to-muted",
    solar: "bg-gradient-to-r from-solar-primary/10 via-solar-accent/5 to-solar-primary/10",
    energy: "bg-gradient-to-r from-energy-primary/10 via-energy-secondary/5 to-energy-primary/10",
    eco: "bg-gradient-to-r from-eco-primary/10 via-eco-secondary/5 to-eco-primary/10",
  };

  return (
    <div
      className={cn(
        "rounded-md bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]",
        variantClasses[variant],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// Typewriter Effect for Text Loading
export interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function Typewriter({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  onComplete,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = React.useState('');
  const [showCursor, setShowCursor] = React.useState(cursor);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        setDisplayText(text.slice(0, index + 1));
        index++;

        if (index >= text.length) {
          clearInterval(interval);
          if (cursor) {
            setTimeout(() => setShowCursor(false), 1000);
          }
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, speed, delay, cursor, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <span className="animate-blink ml-0.5 font-thin">|</span>
      )}
    </span>
  );
}

// CSS animations to be added to globals.css
export const loadingAnimationCSS = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @keyframes wave {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes solar-glow {
    0%, 100% { 
      filter: drop-shadow(0 0 8px theme(colors.solar.primary / 0.4));
      transform: scale(1);
    }
    50% { 
      filter: drop-shadow(0 0 16px theme(colors.solar.primary / 0.6));
      transform: scale(1.05);
    }
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slide-in-left {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.5s ease-out forwards;
  }

  .animate-slide-in-left {
    animation: slide-in-left 0.5s ease-out forwards;
  }

  .animate-scale-in {
    animation: scale-in 0.3s ease-out forwards;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;