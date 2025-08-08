/**
 * AccessibleForm components with comprehensive WCAG 2.1 AA compliance
 * Enhanced form components with better accessibility features
 */

"use client";

import * as React from "react";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  useFormField 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAccessibilityAnnouncements } from "@/contexts/accessibility-context";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

// Re-export the base Form component
export { Form };

/**
 * Enhanced FormField with better error announcements
 */
interface AccessibleFormFieldProps {
  children: React.ReactNode;
  name: string;
  /**
   * Instructions for the field
   */
  instructions?: string;
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Additional context for screen readers
   */
  helpText?: string;
}

export function AccessibleFormField({ 
  children, 
  name, 
  instructions, 
  required = false,
  helpText 
}: AccessibleFormFieldProps) {
  const { announceError } = useAccessibilityAnnouncements();
  const fieldId = React.useId();
  
  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => {
        // Announce errors when they occur
        React.useEffect(() => {
          if (fieldState.error) {
            announceError(`${name}: ${fieldState.error.message}`);
          }
        }, [fieldState.error]);

        return (
          <FormItem className="space-y-2">
            <FormLabel className={cn(required && "after:content-['*'] after:text-destructive after:ml-1")}>
              {field.name}
              {required && <span className="sr-only">required</span>}
            </FormLabel>
            
            {instructions && (
              <FormDescription id={`${fieldId}-instructions`} className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                {instructions}
              </FormDescription>
            )}
            
            <FormControl>
              {React.cloneElement(children as React.ReactElement, {
                ...field,
                "aria-describedby": [
                  instructions && `${fieldId}-instructions`,
                  helpText && `${fieldId}-help`,
                  fieldState.error && `${fieldId}-error`
                ].filter(Boolean).join(' '),
                "aria-invalid": fieldState.error ? "true" : "false",
                "aria-required": required ? "true" : "false"
              })}
            </FormControl>
            
            {helpText && (
              <p id={`${fieldId}-help`} className="text-sm text-muted-foreground">
                {helpText}
              </p>
            )}
            
            <FormMessage id={`${fieldId}-error`} className="flex items-start gap-2">
              {fieldState.error && (
                <>
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  {fieldState.error.message}
                </>
              )}
            </FormMessage>
          </FormItem>
        );
      }}
    />
  );
}

/**
 * Enhanced Input with accessibility features
 */
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Error state styling
   */
  error?: boolean;
  /**
   * Success state styling
   */
  success?: boolean;
}

export const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ className, error, success, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn(
          // Enhanced focus styles
          "focus-visible:ring-offset-2",
          // Error styles
          error && "border-destructive focus-visible:ring-destructive",
          // Success styles
          success && "border-green-500 focus-visible:ring-green-500",
          className
        )}
        {...props}
      />
    );
  }
);

AccessibleInput.displayName = "AccessibleInput";

/**
 * Enhanced Textarea with accessibility features
 */
interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  success?: boolean;
  /**
   * Character count display
   */
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const AccessibleTextarea = React.forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ className, error, success, maxLength, showCharacterCount = false, onChange, ...props }, ref) => {
    const [characterCount, setCharacterCount] = React.useState(0);
    const countId = React.useId();

    const handleChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharacterCount(event.target.value.length);
      onChange?.(event);
    }, [onChange]);

    const remainingChars = maxLength ? maxLength - characterCount : 0;
    const isNearLimit = maxLength && remainingChars <= 20;

    return (
      <div className="space-y-2">
        <Textarea
          ref={ref}
          className={cn(
            "focus-visible:ring-offset-2",
            error && "border-destructive focus-visible:ring-destructive",
            success && "border-green-500 focus-visible:ring-green-500",
            className
          )}
          maxLength={maxLength}
          onChange={handleChange}
          aria-describedby={showCharacterCount ? countId : undefined}
          {...props}
        />
        
        {showCharacterCount && maxLength && (
          <div 
            id={countId}
            className={cn(
              "text-sm text-right",
              isNearLimit ? "text-destructive" : "text-muted-foreground"
            )}
            aria-live="polite"
          >
            {characterCount} / {maxLength} characters
            {isNearLimit && <span className="sr-only">approaching character limit</span>}
          </div>
        )}
      </div>
    );
  }
);

AccessibleTextarea.displayName = "AccessibleTextarea";

/**
 * Enhanced Select with accessibility features
 */
interface AccessibleSelectProps {
  children: React.ReactNode;
  placeholder?: string;
  error?: boolean;
  success?: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
}

export function AccessibleSelect({ 
  children, 
  placeholder, 
  error, 
  success, 
  ...props 
}: AccessibleSelectProps) {
  return (
    <Select {...props}>
      <SelectTrigger 
        className={cn(
          "focus-visible:ring-offset-2",
          error && "border-destructive focus-visible:ring-destructive",
          success && "border-green-500 focus-visible:ring-green-500"
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
}

/**
 * Enhanced Checkbox with accessibility features
 */
interface AccessibleCheckboxProps {
  children?: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  /**
   * Description of what happens when checked/unchecked
   */
  description?: string;
}

export function AccessibleCheckbox({ 
  children, 
  checked, 
  onCheckedChange,
  disabled,
  required,
  error,
  description,
  ...props 
}: AccessibleCheckboxProps) {
  const { announce } = useAccessibilityAnnouncements();
  const descriptionId = React.useId();

  const handleCheckedChange = React.useCallback((newChecked: boolean) => {
    onCheckedChange?.(newChecked);
    
    if (children) {
      const action = newChecked ? "checked" : "unchecked";
      announce(`${children} ${action}`, 'polite');
    }
  }, [onCheckedChange, children, announce]);

  return (
    <div className="flex items-start space-x-2">
      <Checkbox
        checked={checked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        aria-required={required}
        aria-invalid={error}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          error && "border-destructive",
          "mt-0.5" // Align with text baseline
        )}
        {...props}
      />
      <div className="grid gap-1.5 leading-none">
        {children && (
          <label 
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              required && "after:content-['*'] after:text-destructive after:ml-1"
            )}
            onClick={() => !disabled && handleCheckedChange(!checked)}
          >
            {children}
            {required && <span className="sr-only">required</span>}
          </label>
        )}
        {description && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Enhanced RadioGroup with accessibility features
 */
interface AccessibleRadioGroupProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  orientation?: "horizontal" | "vertical";
  name?: string;
}

export function AccessibleRadioGroup({ 
  children, 
  value,
  onValueChange,
  disabled,
  required,
  error,
  orientation = "vertical",
  name,
  ...props 
}: AccessibleRadioGroupProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      aria-required={required}
      aria-invalid={error}
      orientation={orientation}
      name={name}
      className={cn(
        orientation === "horizontal" ? "flex flex-row space-x-4" : "space-y-2"
      )}
      {...props}
    >
      {children}
    </RadioGroup>
  );
}

/**
 * Enhanced RadioGroupItem with accessibility features
 */
interface AccessibleRadioItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  description?: string;
}

export function AccessibleRadioItem({ 
  value, 
  children, 
  disabled,
  description 
}: AccessibleRadioItemProps) {
  const descriptionId = React.useId();

  return (
    <div className="flex items-start space-x-2">
      <RadioGroupItem
        value={value}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        className="mt-0.5"
      />
      <div className="grid gap-1.5 leading-none">
        <label 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {children}
        </label>
        {description && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Form section with fieldset for grouping related fields
 */
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  required?: boolean;
}

export function FormSection({ title, description, children, required }: FormSectionProps) {
  const descriptionId = React.useId();

  return (
    <fieldset className="space-y-4 border border-border rounded-lg p-4">
      <legend className={cn(
        "text-lg font-semibold px-2",
        required && "after:content-['*'] after:text-destructive after:ml-1"
      )}>
        {title}
        {required && <span className="sr-only">required section</span>}
      </legend>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground -mt-2">
          {description}
        </p>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  );
}

/**
 * Form success message component
 */
interface FormSuccessProps {
  children: React.ReactNode;
  className?: string;
}

export function FormSuccess({ children, className }: FormSuccessProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3",
      className
    )} role="status" aria-live="polite">
      <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      {children}
    </div>
  );
}