/**
 * AccessibleModal component with comprehensive WCAG 2.1 AA compliance
 * Enhanced modal/dialog with focus trapping, keyboard navigation, and screen reader support
 */

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useAccessibilityAnnouncements, 
  useAccessibilityFocus 
} from "@/contexts/accessibility-context";
import { useFocusTrap } from "@/lib/accessibility/focus-management";
import { handleDialogNavigation } from "@/lib/accessibility/keyboard-navigation";

const AccessibleModal = DialogPrimitive.Root;

const AccessibleModalTrigger = DialogPrimitive.Trigger;

const AccessibleModalPortal = DialogPrimitive.Portal;

const AccessibleModalClose = DialogPrimitive.Close;

/**
 * Enhanced modal overlay with accessibility features
 */
const AccessibleModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      // Ensure overlay is announced to screen readers
      "focus:outline-none",
      className
    )}
    {...props}
  />
));
AccessibleModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Enhanced modal content with focus management and keyboard navigation
 */
interface AccessibleModalContentProps extends 
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Whether to show the close button
   */
  showCloseButton?: boolean;
  /**
   * Custom close button aria-label
   */
  closeButtonLabel?: string;
  /**
   * Whether to trap focus within the modal
   */
  trapFocus?: boolean;
  /**
   * Custom class for the close button
   */
  closeButtonClassName?: string;
}

const AccessibleModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AccessibleModalContentProps
>(({ 
  className, 
  children, 
  showCloseButton = true, 
  closeButtonLabel = "Close dialog",
  trapFocus = true,
  closeButtonClassName,
  onEscapeKeyDown,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props 
}, ref) => {
  const { announce } = useAccessibilityAnnouncements();
  const { storeFocus, restoreFocus } = useAccessibilityFocus();
  const { containerRef, activate, deactivate } = useFocusTrap({
    escapeDeactivates: true,
    returnFocusOnDeactivate: true
  });
  
  const [isOpen, setIsOpen] = React.useState(false);

  // Handle modal open
  const handleOpenAutoFocus = React.useCallback((event: Event) => {
    storeFocus();
    setIsOpen(true);
    
    if (trapFocus) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        activate();
      }, 0);
    }
    
    onOpenAutoFocus?.(event);
  }, [storeFocus, trapFocus, activate, onOpenAutoFocus]);

  // Handle modal close
  const handleCloseAutoFocus = React.useCallback((event: Event) => {
    setIsOpen(false);
    
    if (trapFocus) {
      deactivate();
    } else {
      restoreFocus();
    }
    
    onCloseAutoFocus?.(event);
  }, [trapFocus, deactivate, restoreFocus, onCloseAutoFocus]);

  // Handle escape key
  const handleEscapeKeyDown = React.useCallback((event: KeyboardEvent) => {
    announce("Dialog closed", 'polite');
    onEscapeKeyDown?.(event);
  }, [announce, onEscapeKeyDown]);

  // Handle other keyboard navigation
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    handleDialogNavigation(event.nativeEvent, () => {
      // This will trigger the escape key handler
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      event.currentTarget.dispatchEvent(escapeEvent);
    });
  }, []);

  return (
    <AccessibleModalPortal>
      <AccessibleModalOverlay />
      <DialogPrimitive.Content
        ref={trapFocus ? containerRef : ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
          "gap-4 border bg-background p-6 shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "sm:rounded-lg",
          "focus:outline-none", // Remove default focus outline as we'll handle focus management
          className
        )}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        onEscapeKeyDown={handleEscapeKeyDown}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
        
        {showCloseButton && (
          <DialogPrimitive.Close 
            className={cn(
              "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background",
              "transition-opacity hover:opacity-100",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:pointer-events-none",
              "data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
              closeButtonClassName
            )}
            aria-label={closeButtonLabel}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </AccessibleModalPortal>
  );
});
AccessibleModalContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Enhanced modal header with proper heading structure
 */
interface AccessibleModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Heading level for the title (h1, h2, h3, etc.)
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const AccessibleModalHeader = React.forwardRef<HTMLDivElement, AccessibleModalHeaderProps>(
  ({ className, level = 2, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
);
AccessibleModalHeader.displayName = "AccessibleModalHeader";

/**
 * Enhanced modal footer with proper button grouping
 */
const AccessibleModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    role="group"
    aria-label="Dialog actions"
    {...props}
  >
    {children}
  </div>
));
AccessibleModalFooter.displayName = "AccessibleModalFooter";

/**
 * Enhanced modal title with proper heading semantics
 */
interface AccessibleModalTitleProps extends 
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
  /**
   * Heading level for semantic structure
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const AccessibleModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  AccessibleModalTitleProps
>(({ className, level = 2, children, ...props }, ref) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      asChild
      {...props}
    >
      <HeadingTag>{children}</HeadingTag>
    </DialogPrimitive.Title>
  );
});
AccessibleModalTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * Enhanced modal description
 */
const AccessibleModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AccessibleModalDescription.displayName = DialogPrimitive.Description.displayName;

/**
 * Alert Dialog variant for important confirmations
 */
interface AccessibleAlertModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: "destructive" | "default";
}

export function AccessibleAlertModal({
  children,
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default"
}: AccessibleAlertModalProps) {
  const { announce } = useAccessibilityAnnouncements();

  const handleConfirm = React.useCallback(() => {
    announce("Action confirmed", 'polite');
    onConfirm?.();
    onOpenChange?.(false);
  }, [announce, onConfirm, onOpenChange]);

  const handleCancel = React.useCallback(() => {
    announce("Action cancelled", 'polite');
    onCancel?.();
    onOpenChange?.(false);
  }, [announce, onCancel, onOpenChange]);

  return (
    <AccessibleModal open={open} onOpenChange={onOpenChange}>
      <AccessibleModalTrigger asChild>
        {children}
      </AccessibleModalTrigger>
      <AccessibleModalContent 
        role="alertdialog"
        aria-describedby={description ? "alert-description" : undefined}
      >
        <AccessibleModalHeader>
          <AccessibleModalTitle level={1}>
            {title}
          </AccessibleModalTitle>
          {description && (
            <AccessibleModalDescription id="alert-description">
              {description}
            </AccessibleModalDescription>
          )}
        </AccessibleModalHeader>
        
        <AccessibleModalFooter>
          <AccessibleModalClose asChild>
            <button
              type="button"
              className="px-4 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          </AccessibleModalClose>
          <button
            type="button"
            className={cn(
              "px-4 py-2 text-sm rounded-md",
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={handleConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </AccessibleModalFooter>
      </AccessibleModalContent>
    </AccessibleModal>
  );
}

export {
  AccessibleModal,
  AccessibleModalPortal,
  AccessibleModalOverlay,
  AccessibleModalClose,
  AccessibleModalTrigger,
  AccessibleModalContent,
  AccessibleModalHeader,
  AccessibleModalFooter,
  AccessibleModalTitle,
  AccessibleModalDescription,
};