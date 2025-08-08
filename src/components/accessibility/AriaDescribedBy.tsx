/**
 * AriaDescribedBy utility component for managing aria-describedby relationships
 * Helps create proper associations between elements and their descriptions
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AriaDescribedByProps {
  children: React.ReactNode;
  /**
   * The description text
   */
  description: string;
  /**
   * Additional CSS classes for the description
   */
  descriptionClassName?: string;
  /**
   * Whether the description should be visually hidden
   */
  visuallyHidden?: boolean;
  /**
   * Render prop that receives the describedby ID
   */
  render?: (describedById: string) => React.ReactElement;
}

export function AriaDescribedBy({
  children,
  description,
  descriptionClassName,
  visuallyHidden = false,
  render
}: AriaDescribedByProps) {
  const descriptionId = React.useId();

  const descriptionElement = (
    <div
      id={descriptionId}
      className={cn(
        "text-sm text-muted-foreground",
        visuallyHidden && "sr-only",
        descriptionClassName
      )}
    >
      {description}
    </div>
  );

  if (render) {
    return (
      <>
        {render(descriptionId)}
        {descriptionElement}
      </>
    );
  }

  return (
    <div>
      {React.cloneElement(children as React.ReactElement, {
        'aria-describedby': descriptionId
      })}
      {descriptionElement}
    </div>
  );
}

/**
 * Hook for managing multiple aria-describedby relationships
 */
export function useAriaDescribedBy() {
  const [descriptions, setDescriptions] = React.useState<Record<string, string>>({});

  const addDescription = React.useCallback((key: string, description: string) => {
    setDescriptions(prev => ({ ...prev, [key]: description }));
  }, []);

  const removeDescription = React.useCallback((key: string) => {
    setDescriptions(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const getDescribedByIds = React.useCallback((keys: string[]) => {
    return keys.map(key => `description-${key}`).join(' ');
  }, []);

  const DescriptionElements = React.useMemo(() => (
    <>
      {Object.entries(descriptions).map(([key, description]) => (
        <div key={key} id={`description-${key}`} className="sr-only">
          {description}
        </div>
      ))}
    </>
  ), [descriptions]);

  return {
    addDescription,
    removeDescription,
    getDescribedByIds,
    DescriptionElements
  };
}

/**
 * Error description component for form fields
 */
interface ErrorDescriptionProps {
  error?: string;
  fieldName: string;
  className?: string;
}

export function ErrorDescription({ error, fieldName, className }: ErrorDescriptionProps) {
  const errorId = `${fieldName}-error`;

  if (!error) return null;

  return (
    <div
      id={errorId}
      role="alert"
      aria-live="polite"
      className={cn(
        "text-sm text-destructive flex items-start gap-2 mt-1",
        className
      )}
    >
      <span className="sr-only">Error:</span>
      {error}
    </div>
  );
}

/**
 * Help text component for form fields
 */
interface HelpTextProps {
  children: React.ReactNode;
  fieldName: string;
  className?: string;
}

export function HelpText({ children, fieldName, className }: HelpTextProps) {
  const helpId = `${fieldName}-help`;

  return (
    <div
      id={helpId}
      className={cn(
        "text-sm text-muted-foreground mt-1",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Instructions component for complex form fields
 */
interface InstructionsProps {
  children: React.ReactNode;
  fieldName: string;
  className?: string;
}

export function Instructions({ children, fieldName, className }: InstructionsProps) {
  const instructionsId = `${fieldName}-instructions`;

  return (
    <div
      id={instructionsId}
      className={cn(
        "text-sm text-muted-foreground mb-2",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Combined field descriptions component
 */
interface FieldDescriptionsProps {
  fieldName: string;
  instructions?: string;
  helpText?: string;
  error?: string;
  className?: string;
}

export function FieldDescriptions({
  fieldName,
  instructions,
  helpText,
  error,
  className
}: FieldDescriptionsProps) {
  const getDescribedByIds = () => {
    const ids = [];
    if (instructions) ids.push(`${fieldName}-instructions`);
    if (helpText) ids.push(`${fieldName}-help`);
    if (error) ids.push(`${fieldName}-error`);
    return ids.join(' ');
  };

  return (
    <>
      {instructions && (
        <Instructions fieldName={fieldName} className={className}>
          {instructions}
        </Instructions>
      )}
      {helpText && (
        <HelpText fieldName={fieldName} className={className}>
          {helpText}
        </HelpText>
      )}
      {error && (
        <ErrorDescription 
          fieldName={fieldName} 
          error={error} 
          className={className}
        />
      )}
    </>
  );
}

/**
 * Hook to get the proper aria-describedby value for a field
 */
export function useFieldDescriptions(
  fieldName: string,
  options: {
    instructions?: string;
    helpText?: string;
    error?: string;
  }
) {
  const { instructions, helpText, error } = options;

  const describedByIds = React.useMemo(() => {
    const ids = [];
    if (instructions) ids.push(`${fieldName}-instructions`);
    if (helpText) ids.push(`${fieldName}-help`);
    if (error) ids.push(`${fieldName}-error`);
    return ids.length > 0 ? ids.join(' ') : undefined;
  }, [fieldName, instructions, helpText, error]);

  return {
    describedByIds,
    DescriptionsComponent: () => (
      <FieldDescriptions
        fieldName={fieldName}
        instructions={instructions}
        helpText={helpText}
        error={error}
      />
    )
  };
}

/**
 * Expandable content with proper ARIA relationships
 */
interface ExpandableContentProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  description?: string;
}

export function ExpandableContent({
  trigger,
  children,
  expanded = false,
  onExpandedChange,
  description
}: ExpandableContentProps) {
  const triggerId = React.useId();
  const contentId = React.useId();
  const descriptionId = React.useId();

  const handleClick = () => {
    onExpandedChange?.(!expanded);
  };

  return (
    <div>
      {React.cloneElement(trigger, {
        id: triggerId,
        'aria-expanded': expanded,
        'aria-controls': contentId,
        'aria-describedby': description ? descriptionId : undefined,
        onClick: handleClick
      })}
      
      {description && (
        <div id={descriptionId} className="sr-only">
          {description}
        </div>
      )}
      
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!expanded}
      >
        {children}
      </div>
    </div>
  );
}