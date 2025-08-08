/**
 * AriaLive component for dynamic content announcements
 * Provides live regions for screen reader accessibility
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AriaLiveProps {
  children: React.ReactNode;
  /**
   * The politeness level of the live region
   */
  politeness?: 'polite' | 'assertive' | 'off';
  /**
   * Whether the entire live region should be announced when changed
   */
  atomic?: boolean;
  /**
   * What types of changes should be announced
   */
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether the live region should be visually hidden
   */
  visuallyHidden?: boolean;
  /**
   * HTML element to render as
   */
  as?: keyof JSX.IntrinsicElements;
}

export const AriaLive = React.forwardRef<HTMLElement, AriaLiveProps>(
  ({ 
    children, 
    politeness = 'polite',
    atomic = true,
    relevant = 'additions text',
    className,
    visuallyHidden = false,
    as: Component = 'div',
    ...props 
  }, ref) => {
    return React.createElement(
      Component,
      {
        ...props,
        ref,
        'aria-live': politeness,
        'aria-atomic': atomic,
        'aria-relevant': relevant,
        className: cn(
          visuallyHidden && "sr-only",
          className
        )
      },
      children
    );
  }
);

AriaLive.displayName = "AriaLive";

/**
 * Status component for status updates
 */
interface AriaStatusProps {
  children: React.ReactNode;
  className?: string;
  visuallyHidden?: boolean;
}

export const AriaStatus = React.forwardRef<HTMLDivElement, AriaStatusProps>(
  ({ children, className, visuallyHidden = false, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        visuallyHidden && "sr-only",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

AriaStatus.displayName = "AriaStatus";

/**
 * Alert component for important messages
 */
interface AriaAlertProps {
  children: React.ReactNode;
  className?: string;
  visuallyHidden?: boolean;
}

export const AriaAlert = React.forwardRef<HTMLDivElement, AriaAlertProps>(
  ({ children, className, visuallyHidden = false, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        visuallyHidden && "sr-only",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

AriaAlert.displayName = "AriaAlert";

/**
 * Progress announcement component
 */
interface AriaProgressProps {
  children: React.ReactNode;
  value?: number;
  max?: number;
  className?: string;
  visuallyHidden?: boolean;
}

export const AriaProgress = React.forwardRef<HTMLDivElement, AriaProgressProps>(
  ({ children, value, max = 100, className, visuallyHidden = false, ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        visuallyHidden && "sr-only",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

AriaProgress.displayName = "AriaProgress";

/**
 * Hook for managing live region announcements
 */
export function useAriaLive() {
  const [announcement, setAnnouncement] = React.useState('');
  const [alertMessage, setAlertMessage] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState('');

  const announce = React.useCallback((message: string, type: 'polite' | 'assertive' | 'status' = 'polite') => {
    switch (type) {
      case 'assertive':
        setAlertMessage(message);
        // Clear after announcement
        setTimeout(() => setAlertMessage(''), 1000);
        break;
      case 'status':
        setStatusMessage(message);
        setTimeout(() => setStatusMessage(''), 1000);
        break;
      case 'polite':
      default:
        setAnnouncement(message);
        setTimeout(() => setAnnouncement(''), 1000);
        break;
    }
  }, []);

  const clear = React.useCallback(() => {
    setAnnouncement('');
    setAlertMessage('');
    setStatusMessage('');
  }, []);

  const LiveRegions = React.useMemo(() => (
    <>
      <AriaLive visuallyHidden>
        {announcement}
      </AriaLive>
      <AriaAlert visuallyHidden>
        {alertMessage}
      </AriaAlert>
      <AriaStatus visuallyHidden>
        {statusMessage}
      </AriaStatus>
    </>
  ), [announcement, alertMessage, statusMessage]);

  return {
    announce,
    clear,
    LiveRegions
  };
}

/**
 * Dynamic announcement component that announces changes
 */
interface DynamicAnnouncementProps {
  message: string;
  /**
   * Type of announcement
   */
  type?: 'polite' | 'assertive' | 'status';
  /**
   * Whether to clear the message after announcement
   */
  autoClear?: boolean;
  /**
   * Delay before clearing (in ms)
   */
  clearDelay?: number;
}

export function DynamicAnnouncement({ 
  message, 
  type = 'polite',
  autoClear = true,
  clearDelay = 1000
}: DynamicAnnouncementProps) {
  const [currentMessage, setCurrentMessage] = React.useState(message);

  React.useEffect(() => {
    setCurrentMessage(message);
    
    if (autoClear && message) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearDelay);
      
      return () => clearTimeout(timer);
    }
  }, [message, autoClear, clearDelay]);

  switch (type) {
    case 'assertive':
      return <AriaAlert visuallyHidden>{currentMessage}</AriaAlert>;
    case 'status':
      return <AriaStatus visuallyHidden>{currentMessage}</AriaStatus>;
    case 'polite':
    default:
      return <AriaLive visuallyHidden>{currentMessage}</AriaLive>;
  }
}

/**
 * Loading announcement component
 */
interface LoadingAnnouncementProps {
  loading: boolean;
  loadingMessage?: string;
  completeMessage?: string;
}

export function LoadingAnnouncement({ 
  loading, 
  loadingMessage = 'Loading',
  completeMessage = 'Loading complete'
}: LoadingAnnouncementProps) {
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (loading) {
      setMessage(loadingMessage);
    } else if (message === loadingMessage) {
      setMessage(completeMessage);
      // Clear the complete message after a delay
      setTimeout(() => setMessage(''), 1000);
    }
  }, [loading, loadingMessage, completeMessage, message]);

  return <AriaStatus visuallyHidden>{message}</AriaStatus>;
}

/**
 * Form validation announcements
 */
interface ValidationAnnouncementProps {
  errors: Record<string, string>;
  successMessage?: string;
}

export function ValidationAnnouncement({ 
  errors, 
  successMessage 
}: ValidationAnnouncementProps) {
  const [announcement, setAnnouncement] = React.useState('');

  React.useEffect(() => {
    const errorCount = Object.keys(errors).length;
    
    if (errorCount > 0) {
      const errorMessages = Object.entries(errors).map(([field, error]) => `${field}: ${error}`);
      setAnnouncement(`Form has ${errorCount} error${errorCount > 1 ? 's' : ''}: ${errorMessages.join(', ')}`);
    } else if (successMessage) {
      setAnnouncement(successMessage);
    } else {
      setAnnouncement('');
    }
  }, [errors, successMessage]);

  return <AriaAlert visuallyHidden>{announcement}</AriaAlert>;
}