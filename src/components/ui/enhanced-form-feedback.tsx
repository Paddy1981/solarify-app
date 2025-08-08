"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Loader2, 
  Eye, 
  EyeOff,
  HelpCircle,
  TrendingUp
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Progress } from "./progress";
import { Badge } from "./badge";

// Base feedback state types
export type FeedbackState = 'idle' | 'loading' | 'success' | 'warning' | 'error' | 'info';

// Visual feedback component interfaces
export interface FieldFeedbackProps {
  state: FeedbackState;
  message?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ValidationIndicatorProps {
  isValid?: boolean;
  isValidating?: boolean;
  hasError?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ProgressIndicatorProps {
  current: number;
  total: number;
  showPercentage?: boolean;
  showLabels?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface CharacterCounterProps {
  current: number;
  max: number;
  showRemaining?: boolean;
  warningThreshold?: number; // Show warning when this percentage is reached
  className?: string;
}

export interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
  requirements?: PasswordRequirement[];
  className?: string;
}

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  required?: boolean;
}

export interface LoadingStateProps {
  isLoading: boolean;
  message?: string;
  variant?: 'spinner' | 'pulse' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export interface FieldCompletionIndicatorProps {
  isComplete: boolean;
  isRequired?: boolean;
  label?: string;
  className?: string;
}

export interface ContextualHelpProps {
  content: React.ReactNode;
  title?: string;
  trigger?: 'hover' | 'click';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
}

// Field feedback component for showing validation states
export function FieldFeedback({ 
  state, 
  message, 
  showIcon = true, 
  size = 'md', 
  className 
}: FieldFeedbackProps) {
  const icons = {
    idle: null,
    loading: <Loader2 className="animate-spin" />,
    success: <CheckCircle2 className="text-green-500" />,
    warning: <AlertTriangle className="text-amber-500" />,
    error: <XCircle className="text-red-500" />,
    info: <Info className="text-blue-500" />
  };

  const colors = {
    idle: 'text-muted-foreground',
    loading: 'text-muted-foreground',
    success: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    info: 'text-blue-600'
  };

  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (state === 'idle' && !message) return null;

  return (
    <div className={cn(
      "flex items-start gap-2 mt-1",
      sizes[size],
      colors[state],
      className
    )}>
      {showIcon && icons[state] && (
        <div className={cn("flex-shrink-0 mt-0.5", iconSizes[size])}>
          {React.cloneElement(icons[state]!, { className: iconSizes[size] })}
        </div>
      )}
      {message && (
        <span className="flex-1 leading-tight">{message}</span>
      )}
    </div>
  );
}

// Validation indicator for input fields
export function ValidationIndicator({ 
  isValid, 
  isValidating, 
  hasError, 
  size = 'md', 
  className 
}: ValidationIndicatorProps) {
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (isValidating) {
    return (
      <Loader2 className={cn(
        "animate-spin text-muted-foreground",
        iconSizes[size],
        className
      )} />
    );
  }

  if (hasError) {
    return (
      <XCircle className={cn(
        "text-red-500",
        iconSizes[size],
        className
      )} />
    );
  }

  if (isValid) {
    return (
      <CheckCircle2 className={cn(
        "text-green-500",
        iconSizes[size],
        className
      )} />
    );
  }

  return null;
}

// Progress indicator for multi-step forms
export function ProgressIndicator({ 
  current, 
  total, 
  showPercentage = true, 
  showLabels = false,
  variant = 'default',
  size = 'md',
  className 
}: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100);

  const variants = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500'
  };

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={cn("w-full", className)}>
      {(showLabels || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {showLabels && (
            <span className="text-sm font-medium text-muted-foreground">
              Step {current} of {total}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-muted-foreground">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <Progress 
        value={percentage} 
        className={cn(heights[size], "w-full")}
        // Use a custom progress bar with variant colors
        style={{
          '--progress-background': variants[variant]
        } as React.CSSProperties}
      />
    </div>
  );
}

// Character counter for text inputs
export function CharacterCounter({ 
  current, 
  max, 
  showRemaining = false, 
  warningThreshold = 80,
  className 
}: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isWarning = percentage >= warningThreshold;
  const isError = current > max;
  const remaining = max - current;

  return (
    <div className={cn(
      "flex items-center justify-between text-xs mt-1",
      isError ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-muted-foreground',
      className
    )}>
      <div className="flex items-center gap-2">
        {showRemaining ? (
          <span>{remaining} remaining</span>
        ) : (
          <span>{current} / {max}</span>
        )}
        {isError && <XCircle className="h-3 w-3" />}
        {isWarning && !isError && <AlertTriangle className="h-3 w-3" />}
      </div>
      {percentage > 0 && (
        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-200",
              isError ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-primary'
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Password strength meter
export function PasswordStrengthMeter({ 
  password, 
  showRequirements = true, 
  requirements = defaultPasswordRequirements,
  className 
}: PasswordStrengthMeterProps) {
  const strength = calculatePasswordStrength(password, requirements);
  const metRequirements = requirements.filter(req => req.test(password));
  
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500', 
    'bg-amber-500',
    'bg-lime-500',
    'bg-green-500'
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {password && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Password strength</span>
            <span className={cn(
              "font-medium",
              strength >= 4 ? 'text-green-600' : 
              strength >= 3 ? 'text-lime-600' :
              strength >= 2 ? 'text-amber-600' :
              'text-red-600'
            )}>
              {strengthLabels[strength]}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-200",
                  index <= strength ? strengthColors[strength] : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      )}
      
      {showRequirements && password && (
        <div className="space-y-1">
          {requirements.map((requirement, index) => {
            const isMet = requirement.test(password);
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  isMet ? 'text-green-600' : 'text-muted-foreground'
                )}
              >
                {isMet ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-current" />
                )}
                <span>{requirement.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Loading state wrapper
export function LoadingState({ 
  isLoading, 
  message, 
  variant = 'spinner', 
  size = 'md', 
  className,
  children 
}: LoadingStateProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 py-4",
      className
    )}>
      {variant === 'spinner' && (
        <Loader2 className={cn("animate-spin", sizes[size])} />
      )}
      {variant === 'pulse' && (
        <div className={cn(
          "rounded-full bg-primary animate-pulse",
          sizes[size]
        )} />
      )}
      {variant === 'skeleton' && (
        <div className={cn(
          "rounded bg-muted animate-pulse",
          size === 'sm' ? 'h-4 w-24' : size === 'md' ? 'h-6 w-32' : 'h-8 w-40'
        )} />
      )}
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

// Field completion indicator
export function FieldCompletionIndicator({ 
  isComplete, 
  isRequired = false, 
  label,
  className 
}: FieldCompletionIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {isComplete ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : isRequired ? (
        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
      ) : (
        <div className="h-4 w-4 rounded-full border border-muted" />
      )}
      {label && (
        <span className={cn(
          "text-sm",
          isComplete ? 'text-green-600' : 'text-muted-foreground'
        )}>
          {label}
        </span>
      )}
    </div>
  );
}

// Contextual help component
export function ContextualHelp({ 
  content, 
  title, 
  trigger = 'hover', 
  position = 'top',
  className,
  children 
}: ContextualHelpProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full hover:bg-muted transition-colors",
              "h-4 w-4 text-muted-foreground hover:text-foreground",
              className
            )}
          >
            {children || <HelpCircle className="h-3 w-3" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side={position} className="max-w-xs">
          {title && (
            <div className="font-medium mb-1">{title}</div>
          )}
          <div className="text-sm">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Enhanced password toggle with visibility indicator
export function PasswordToggle({ 
  isVisible, 
  onToggle, 
  size = 'md',
  className 
}: {
  isVisible: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center justify-center rounded-md hover:bg-muted transition-colors",
        "text-muted-foreground hover:text-foreground",
        size === 'sm' ? 'p-1' : size === 'md' ? 'p-1.5' : 'p-2',
        className
      )}
      aria-label={isVisible ? 'Hide password' : 'Show password'}
    >
      {isVisible ? (
        <EyeOff className={iconSizes[size]} />
      ) : (
        <Eye className={iconSizes[size]} />
      )}
    </button>
  );
}

// Success message component with celebration effect
export function SuccessMessage({ 
  message, 
  showIcon = true, 
  onDismiss,
  className 
}: {
  message: string;
  showIcon?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800",
      "animate-in slide-in-from-top duration-300",
      className
    )}>
      {showIcon && (
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
      )}
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800 transition-colors"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Form analytics badge for A/B testing
export function FormAnalyticsBadge({ 
  variant, 
  performance,
  className 
}: {
  variant: string;
  performance?: {
    completionRate: number;
    avgTime: number;
  };
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <TrendingUp className="h-3 w-3" />
      <span className="text-xs">
        {variant}
        {performance && ` (${performance.completionRate}%)`}
      </span>
    </Badge>
  );
}

// Default password requirements
const defaultPasswordRequirements: PasswordRequirement[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
    required: true
  },
  {
    label: 'Contains uppercase letter',
    test: (password) => /[A-Z]/.test(password),
    required: true
  },
  {
    label: 'Contains lowercase letter', 
    test: (password) => /[a-z]/.test(password),
    required: true
  },
  {
    label: 'Contains number',
    test: (password) => /\d/.test(password),
    required: true
  },
  {
    label: 'Contains special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    required: false
  }
];

// Calculate password strength based on requirements
function calculatePasswordStrength(password: string, requirements: PasswordRequirement[]): number {
  if (!password) return 0;
  
  const metRequirements = requirements.filter(req => req.test(password));
  const requiredMet = requirements.filter(req => req.required && req.test(password));
  const totalRequired = requirements.filter(req => req.required).length;
  
  // Base strength on required requirements
  let strength = Math.floor((requiredMet.length / totalRequired) * 3);
  
  // Bonus points for optional requirements and length
  if (metRequirements.length === requirements.length) strength += 1;
  if (password.length >= 12) strength += 1;
  
  return Math.min(strength, 4);
}