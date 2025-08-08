"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAccessibilityContext } from "@/contexts/accessibility-context";
import { 
  useFormStateManagement, 
  useMultiStepFormState, 
  FormStateConfig 
} from "@/hooks/use-form-state-management";
import { 
  useEnhancedFormValidation, 
  UseEnhancedFormValidationConfig 
} from "@/hooks/use-enhanced-form-validation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { 
  Save, 
  RotateCcw, 
  RotateCw, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Accessibility
} from "lucide-react";
import { 
  SuccessMessage,
  LoadingState,
  ProgressIndicator,
  FormAnalyticsBadge
} from "../ui/enhanced-form-feedback";
import { 
  ErrorSummary,
  ValidationSummary,
  createFormError
} from "../ui/enhanced-form-errors";
import { MobileForm } from "../ui/mobile-form";

// Enhanced form wrapper configuration
export interface EnhancedFormWrapperConfig {
  // Form identification
  formId: string;
  title?: string;
  description?: string;
  
  // Features
  enableAutoSave?: boolean;
  enableRecovery?: boolean;
  enableHistory?: boolean;
  enableValidation?: boolean;
  enableMultiStep?: boolean;
  enableAnalytics?: boolean;
  
  // State management
  stateConfig?: FormStateConfig;
  validationConfig?: Partial<UseEnhancedFormValidationConfig<any>>;
  
  // Multi-step
  steps?: FormStep[];
  allowStepSkipping?: boolean;
  
  // Accessibility
  announceValidationErrors?: boolean;
  provideLiveRegion?: boolean;
  keyboardShortcuts?: boolean;
  
  // Mobile optimization
  adaptToMobile?: boolean;
  mobileBreakpoint?: number;
  
  // Visual customization
  showProgress?: boolean;
  showFormActions?: boolean;
  showRecoveryPrompt?: boolean;
  compactMode?: boolean;
  
  // Analytics and testing
  analyticsVariant?: string;
  enableFormAnalytics?: boolean;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  validation?: () => boolean | Promise<boolean>;
  required?: boolean;
}

export interface EnhancedFormWrapperProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  config: EnhancedFormWrapperConfig;
  onSubmit: (data: TFieldValues) => void | Promise<void>;
  children?: React.ReactNode;
  className?: string;
}

// Main enhanced form wrapper component
export function EnhancedFormWrapper<TFieldValues extends FieldValues = FieldValues>({
  form,
  config,
  onSubmit,
  children,
  className
}: EnhancedFormWrapperProps<TFieldValues>) {
  const isMobile = useIsMobile();
  const { 
    preferences, 
    announceToScreenReader,
    isHighContrast,
    isReducedMotion
  } = useAccessibilityContext();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showValidationSummary, setShowValidationSummary] = React.useState(false);

  // Initialize form state management
  const stateManagement = config.enableMultiStep && config.steps 
    ? useMultiStepFormState({
        form,
        totalSteps: config.steps.length,
        config: config.stateConfig || { storageKey: config.formId }
      })
    : useFormStateManagement({
        form,
        config: config.stateConfig || { storageKey: config.formId }
      });

  // Initialize form validation
  const validation = config.enableValidation 
    ? useEnhancedFormValidation({
        form,
        ...config.validationConfig
      })
    : null;

  // Determine if mobile layout should be used
  const shouldUseMobileLayout = React.useMemo(() => {
    if (!config.adaptToMobile) return false;
    return isMobile;
  }, [config.adaptToMobile, isMobile]);

  // Handle form submission
  const handleSubmit = React.useCallback(async (data: TFieldValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Run validation if enabled
      if (validation) {
        const isValid = await validation.triggerValidation();
        if (!isValid) {
          setShowValidationSummary(true);
          if (config.announceValidationErrors) {
            announceToScreenReader('Form has validation errors. Please review and correct them.');
          }
          return;
        }
      }

      // Call submit handler
      await onSubmit(data);
      
      // Success handling
      setSubmitSuccess(true);
      if (config.announceValidationErrors) {
        announceToScreenReader('Form submitted successfully!');
      }
      
      // Clear saved state on successful submission
      stateManagement.clearStorage();
      
      // Analytics
      if (config.enableFormAnalytics) {
        trackFormSubmission(config.formId, data, config.analyticsVariant);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while submitting the form';
      setSubmitError(errorMessage);
      
      if (config.announceValidationErrors) {
        announceToScreenReader(`Form submission failed: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, validation, config, announceToScreenReader, stateManagement]);

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!config.keyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        stateManagement.saveManually('Manual save via keyboard');
      }
      
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (stateManagement.canUndo) {
          stateManagement.undo();
        }
      }
      
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (stateManagement.canRedo) {
          stateManagement.redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config.keyboardShortcuts, stateManagement]);

  // Form errors for display
  const formErrors = React.useMemo(() => {
    const errors = Object.entries(form.formState.errors).map(([field, error]) => 
      createFormError.validation(field, error?.message || 'Invalid value')
    );
    
    if (submitError) {
      errors.unshift(createFormError.server(submitError));
    }
    
    return errors;
  }, [form.formState.errors, submitError]);

  // Form fields for validation summary
  const formFields = React.useMemo(() => {
    // This would need to be configured based on your actual form fields
    return Object.keys(form.formState.errors).map(fieldName => ({
      name: fieldName,
      label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
      isValid: !form.formState.errors[fieldName],
      isRequired: true, // Would need to determine this from schema
      error: form.formState.errors[fieldName]?.message
    }));
  }, [form.formState.errors]);

  // Recovery prompt component
  const RecoveryPrompt = () => {
    if (!config.showRecoveryPrompt || !stateManagement.recoveryData) return null;

    return (
      <Alert className="mb-4 border-blue-200 bg-blue-50">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-800">Unsaved changes found</p>
              <p className="text-sm text-blue-700">
                We found unsaved changes from {stateManagement.recoveryData.timestamp.toLocaleString()}. 
                Would you like to recover them?
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={stateManagement.applyRecoveryData}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Recover
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={stateManagement.dismissRecoveryData}
                className="text-blue-700 hover:bg-blue-100"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // Form actions component
  const FormActions = () => {
    if (!config.showFormActions) return null;

    return (
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {stateManagement.isAutoSaving && (
            <div className="flex items-center gap-1">
              <LoadingState isLoading variant="spinner" size="sm" />
              <span>Saving...</span>
            </div>
          )}
          
          {stateManagement.lastSaved && !stateManagement.isAutoSaving && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>Saved {stateManagement.lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
          
          {stateManagement.hasUnsavedChanges && !stateManagement.isAutoSaving && (
            <div className="flex items-center gap-1 text-amber-600">
              <Clock className="h-3 w-3" />
              <span>Unsaved changes</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {config.enableHistory && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={stateManagement.undo}
                disabled={!stateManagement.canUndo}
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={stateManagement.redo}
                disabled={!stateManagement.canRedo}
                title="Redo (Ctrl+Shift+Z)"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </>
          )}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => stateManagement.saveManually('Manual save')}
            title="Save (Ctrl+S)"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    );
  };

  // Accessibility indicators
  const AccessibilityInfo = () => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <Accessibility className="h-3 w-3" />
        <span>Accessible</span>
      </div>
      {shouldUseMobileLayout ? (
        <div className="flex items-center gap-1">
          <Smartphone className="h-3 w-3" />
          <span>Mobile Optimized</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Monitor className="h-3 w-3" />
          <span>Desktop</span>
        </div>
      )}
      {config.enableAnalytics && config.analyticsVariant && (
        <FormAnalyticsBadge variant={config.analyticsVariant} />
      )}
    </div>
  );

  // Multi-step form rendering
  if (config.enableMultiStep && config.steps && 'currentStep' in stateManagement) {
    const multiStepState = stateManagement as ReturnType<typeof useMultiStepFormState>;
    
    if (shouldUseMobileLayout) {
      return (
        <div className={cn("w-full", className)}>
          <RecoveryPrompt />
          
          <MobileForm
            steps={config.steps.map(step => ({
              ...step,
              content: (
                <div className="space-y-4">
                  {step.content}
                  <AccessibilityInfo />
                </div>
              )
            }))}
            currentStep={multiStepState.currentStep}
            onStepChange={multiStepState.goToStep}
            onComplete={form.handleSubmit(handleSubmit)}
            showProgress={config.showProgress}
            allowSkipSteps={config.allowStepSkipping}
          />
          
          {formErrors.length > 0 && (
            <div className="mt-4">
              <ErrorSummary errors={formErrors} />
            </div>
          )}
        </div>
      );
    }

    // Desktop multi-step form
    const currentStep = config.steps[multiStepState.currentStep];
    
    return (
      <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
        <RecoveryPrompt />
        
        {/* Progress indicator */}
        {config.showProgress && (
          <ProgressIndicator
            current={multiStepState.currentStep + 1}
            total={config.steps.length}
            showLabels
            showPercentage
          />
        )}
        
        {/* Current step */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{currentStep.title}</CardTitle>
                {currentStep.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentStep.description}
                  </p>
                )}
              </div>
              <Badge variant="outline">
                Step {multiStepState.currentStep + 1} of {config.steps.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              {currentStep.content}
              
              {/* Step navigation */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={multiStepState.prevStep}
                  disabled={multiStepState.isFirstStep}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-4">
                  <AccessibilityInfo />
                  
                  {multiStepState.isLastStep ? (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? <LoadingState isLoading size="sm" /> : 'Submit'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={multiStepState.nextStep}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Validation summary */}
        {showValidationSummary && formFields.length > 0 && (
          <ValidationSummary
            fields={formFields}
            showOnlyErrors
            showProgress
          />
        )}
        
        {/* Form actions */}
        <FormActions />
        
        {/* Success message */}
        {submitSuccess && (
          <SuccessMessage
            message="Form submitted successfully!"
            onDismiss={() => setSubmitSuccess(false)}
          />
        )}
      </div>
    );
  }

  // Single-step form rendering
  return (
    <div className={cn("w-full", className)}>
      <RecoveryPrompt />
      
      <Card className={cn(config.compactMode && "shadow-sm")}>
        {(config.title || config.description) && (
          <CardHeader className={cn(config.compactMode && "pb-4")}>
            {config.title && <CardTitle>{config.title}</CardTitle>}
            {config.description && (
              <p className="text-sm text-muted-foreground">{config.description}</p>
            )}
          </CardHeader>
        )}
        
        <CardContent className={cn(config.compactMode && "pt-0")}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {children}
            
            {/* Form errors */}
            {formErrors.length > 0 && (
              <ErrorSummary errors={formErrors} />
            )}
            
            {/* Submit button */}
            <div className="flex justify-between items-center">
              <AccessibilityInfo />
              
              <Button
                type="submit"
                disabled={isSubmitting}
                size={shouldUseMobileLayout ? "mobile" : "default"}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <LoadingState isLoading size="sm" message="Submitting..." />
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </form>
          
          <FormActions />
        </CardContent>
      </Card>
      
      {/* Success message */}
      {submitSuccess && (
        <div className="mt-4">
          <SuccessMessage
            message="Form submitted successfully!"
            onDismiss={() => setSubmitSuccess(false)}
          />
        </div>
      )}
    </div>
  );
}

// Form analytics tracking (mock implementation)
function trackFormSubmission(formId: string, data: any, variant?: string) {
  // Implement actual analytics tracking here
  console.log('Form analytics:', {
    formId,
    variant,
    timestamp: new Date(),
    dataKeys: Object.keys(data)
  });
}