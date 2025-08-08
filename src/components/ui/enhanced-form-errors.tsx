"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Info,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  CheckCircle2
} from "lucide-react";
import { Alert, AlertDescription } from "./alert";
import { Button } from "./button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";

// Error types and interfaces
export interface FormError {
  field?: string;
  message: string;
  type: 'validation' | 'network' | 'server' | 'permission' | 'timeout';
  severity: 'error' | 'warning' | 'info';
  code?: string;
  suggestion?: string;
  actionable?: boolean;
  retryable?: boolean;
  helpUrl?: string;
}

export interface ErrorSummaryProps {
  errors: FormError[];
  title?: string;
  showCount?: boolean;
  collapsible?: boolean;
  onRetry?: () => void;
  onDismiss?: (error: FormError) => void;
  className?: string;
}

export interface InlineErrorProps {
  error: FormError;
  showSuggestion?: boolean;
  showAction?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export interface ErrorRecoveryProps {
  error: FormError;
  onRetry?: () => void;
  onAlternativeAction?: () => void;
  alternativeActionLabel?: string;
  className?: string;
}

export interface ContextualHintProps {
  field: string;
  hint: string;
  examples?: string[];
  relatedFields?: string[];
  showIcon?: boolean;
  variant?: 'default' | 'warning' | 'info';
  className?: string;
}

export interface ValidationSummaryProps {
  fields: {
    name: string;
    label: string;
    isValid: boolean;
    isRequired: boolean;
    error?: string;
  }[];
  showOnlyErrors?: boolean;
  showProgress?: boolean;
  className?: string;
}

export interface AddressValidationErrorProps {
  address: string;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
  onVerifyManually?: () => void;
  className?: string;
}

export interface PhoneValidationErrorProps {
  phone: string;
  detectedCountry?: string;
  suggestions?: string[];
  onFormatSuggestion?: (formatted: string) => void;
  className?: string;
}

// Main error summary component for displaying all form errors
export function ErrorSummary({ 
  errors, 
  title = "Please fix the following issues:", 
  showCount = true,
  collapsible = false,
  onRetry,
  onDismiss,
  className 
}: ErrorSummaryProps) {
  const [isOpen, setIsOpen] = React.useState(!collapsible);
  
  const errorsByType = React.useMemo(() => {
    const grouped = errors.reduce((acc, error) => {
      if (!acc[error.type]) acc[error.type] = [];
      acc[error.type].push(error);
      return acc;
    }, {} as Record<string, FormError[]>);
    return grouped;
  }, [errors]);

  const severityOrder = ['error', 'warning', 'info'];
  const sortedErrors = React.useMemo(() => {
    return errors.sort((a, b) => 
      severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
    );
  }, [errors]);

  if (errors.length === 0) return null;

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  const content = (
    <div className="space-y-3">
      {/* Error statistics */}
      <div className="flex items-center gap-2 text-sm">
        {errorCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {errorCount} error{errorCount !== 1 ? 's' : ''}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
            <AlertTriangle className="h-3 w-3" />
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Error list */}
      <div className="space-y-2">
        {sortedErrors.map((error, index) => (
          <InlineError
            key={`${error.field}-${index}`}
            error={error}
            showSuggestion={true}
            showAction={true}
            onRetry={error.retryable ? onRetry : undefined}
            onDismiss={onDismiss ? () => onDismiss(error) : undefined}
          />
        ))}
      </div>

      {/* Global retry button */}
      {onRetry && errors.some(e => e.retryable) && (
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry All
          </Button>
        </div>
      )}
    </div>
  );

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0">
            <span className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {title}
              {showCount && ` (${errors.length})`}
            </span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          {content}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <p className="font-medium">
            {title}
            {showCount && ` (${errors.length})`}
          </p>
          {content}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Inline error component for individual field errors
export function InlineError({ 
  error, 
  showSuggestion = true, 
  showAction = true,
  onRetry,
  onDismiss,
  className 
}: InlineErrorProps) {
  const severityIcons = {
    error: <XCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />
  };

  const severityColors = {
    error: 'text-red-700 bg-red-50 border-red-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    info: 'text-blue-700 bg-blue-50 border-blue-200'
  };

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      severityColors[error.severity],
      className
    )}>
      {severityIcons[error.severity]}
      
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium">
          {error.field && (
            <span className="text-xs uppercase tracking-wide mr-2">
              {error.field}:
            </span>
          )}
          {error.message}
        </p>
        
        {showSuggestion && error.suggestion && (
          <p className="text-xs opacity-90">
            💡 {error.suggestion}
          </p>
        )}
        
        {error.helpUrl && (
          <a 
            href={error.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs hover:underline"
          >
            Learn more
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {showAction && (onRetry || onDismiss) && (
        <div className="flex items-center gap-1">
          {onRetry && error.retryable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 px-2 text-xs"
            >
              ×
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Error recovery component with action suggestions
export function ErrorRecovery({ 
  error, 
  onRetry, 
  onAlternativeAction,
  alternativeActionLabel = "Try another way",
  className 
}: ErrorRecoveryProps) {
  return (
    <Card className={cn("border-red-200 bg-red-50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-red-800 text-sm flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-red-700">{error.message}</p>
        
        {error.suggestion && (
          <div className="p-2 bg-white rounded border border-red-200">
            <p className="text-xs text-red-600">
              <strong>Suggestion:</strong> {error.suggestion}
            </p>
          </div>
        )}
        
        <div className="flex gap-2">
          {onRetry && error.retryable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
          )}
          
          {onAlternativeAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAlternativeAction}
              className="text-red-700 hover:bg-red-100"
            >
              {alternativeActionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Contextual hint component for providing helpful information
export function ContextualHint({ 
  field, 
  hint, 
  examples = [],
  relatedFields = [],
  showIcon = true,
  variant = 'default',
  className 
}: ContextualHintProps) {
  const variantStyles = {
    default: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-gray-50 border-gray-200 text-gray-700'
  };

  const icons = {
    default: <Info className="h-4 w-4 text-blue-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    info: <Info className="h-4 w-4 text-gray-500" />
  };

  return (
    <div className={cn(
      "p-3 rounded-lg border text-sm",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start gap-2">
        {showIcon && icons[variant]}
        <div className="flex-1 space-y-2">
          <p>{hint}</p>
          
          {examples.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium opacity-75">Examples:</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside opacity-90">
                {examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          )}
          
          {relatedFields.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium opacity-75">Related fields:</p>
              <div className="flex flex-wrap gap-1">
                {relatedFields.map((field, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs px-1.5 py-0.5"
                  >
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Validation summary showing form completion status
export function ValidationSummary({ 
  fields, 
  showOnlyErrors = false,
  showProgress = true,
  className 
}: ValidationSummaryProps) {
  const validFields = fields.filter(f => f.isValid);
  const invalidFields = fields.filter(f => !f.isValid);
  const requiredFields = fields.filter(f => f.isRequired);
  const completedRequired = requiredFields.filter(f => f.isValid);
  
  const progress = fields.length > 0 ? (validFields.length / fields.length) * 100 : 0;
  const requiredProgress = requiredFields.length > 0 ? (completedRequired.length / requiredFields.length) * 100 : 0;

  const fieldsToShow = showOnlyErrors ? invalidFields : fields;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Form Validation Status</span>
          {showProgress && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(requiredProgress)}% complete
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Overall Progress</span>
              <span>{validFields.length} of {fields.length} valid</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {fieldsToShow.map((field) => (
            <div key={field.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {field.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">{field.label}</span>
                {field.isRequired && (
                  <Badge variant="outline" className="text-xs px-1">
                    Required
                  </Badge>
                )}
              </div>
              {!field.isValid && field.error && (
                <span className="text-xs text-red-600 max-w-[200px] truncate">
                  {field.error}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized address validation error component
export function AddressValidationError({ 
  address, 
  suggestions = [],
  onSelectSuggestion,
  onVerifyManually,
  className 
}: AddressValidationErrorProps) {
  return (
    <div className={cn(
      "p-4 border border-amber-200 bg-amber-50 rounded-lg",
      className
    )}>
      <div className="flex items-start gap-3">
        <MapPin className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-amber-800">
              Address could not be verified
            </p>
            <p className="text-xs text-amber-700 mt-1">
              We couldn't verify the address: <strong>{address}</strong>
            </p>
          </div>
          
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-800">
                Did you mean one of these?
              </p>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectSuggestion?.(suggestion)}
                    className="block w-full text-left p-2 text-xs bg-white rounded border border-amber-200 hover:border-amber-300 hover:bg-amber-25 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            {onVerifyManually && (
              <Button
                variant="outline"
                size="sm"
                onClick={onVerifyManually}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                Use Address Anyway
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized phone validation error component
export function PhoneValidationError({ 
  phone, 
  detectedCountry,
  suggestions = [],
  onFormatSuggestion,
  className 
}: PhoneValidationErrorProps) {
  return (
    <div className={cn(
      "p-4 border border-amber-200 bg-amber-50 rounded-lg",
      className
    )}>
      <div className="flex items-start gap-3">
        <Phone className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-amber-800">
              Phone number format issue
            </p>
            <p className="text-xs text-amber-700 mt-1">
              The phone number <strong>{phone}</strong> doesn't appear to be in a valid format
              {detectedCountry && ` for ${detectedCountry}`}.
            </p>
          </div>
          
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-800">
                Try one of these formats:
              </p>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onFormatSuggestion?.(suggestion)}
                    className="block w-full text-left p-2 text-xs bg-white rounded border border-amber-200 hover:border-amber-300 hover:bg-amber-25 transition-colors font-mono"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Error factory functions for common error types
export const createFormError = {
  validation: (field: string, message: string, suggestion?: string): FormError => ({
    field,
    message,
    type: 'validation',
    severity: 'error',
    suggestion,
    actionable: true
  }),

  network: (message = 'Network connection error', retryable = true): FormError => ({
    message,
    type: 'network',
    severity: 'error',
    retryable,
    suggestion: 'Check your internet connection and try again.'
  }),

  server: (message = 'Server error', code?: string): FormError => ({
    message,
    type: 'server',
    severity: 'error',
    code,
    retryable: true,
    suggestion: 'This is a temporary issue. Please try again in a moment.'
  }),

  permission: (message = 'Permission denied'): FormError => ({
    message,
    type: 'permission',
    severity: 'error',
    actionable: false,
    suggestion: 'Please contact support if you believe this is an error.'
  }),

  timeout: (message = 'Request timed out'): FormError => ({
    message,
    type: 'timeout',
    severity: 'warning',
    retryable: true,
    suggestion: 'The request took too long. Please try again.'
  })
};