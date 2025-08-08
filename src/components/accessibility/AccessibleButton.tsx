/**
 * AccessibleButton component with comprehensive WCAG 2.1 AA compliance
 * Extends the base Button component with enhanced accessibility features
 */

"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAccessibilityAnnouncements } from "@/contexts/accessibility-context";
import { handleActivationKeys, KEYBOARD_KEYS } from "@/lib/accessibility/keyboard-navigation";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AccessibleButtonProps extends ButtonProps {
  /**
   * Screen reader description of what the button does
   */
  "aria-describedby"?: string;
  /**
   * Whether the button is in a loading state
   */
  loading?: boolean;
  /**
   * Loading text to announce to screen readers
   */
  loadingText?: string;
  /**
   * Text to announce when the button is pressed
   */
  pressAnnouncement?: string;
  /**
   * Whether to announce press actions to screen readers
   */
  announcePress?: boolean;
  /**
   * Expanded state for buttons that control collapsible content
   */
  "aria-expanded"?: boolean;
  /**
   * Controls attribute for buttons that control other elements
   */
  "aria-controls"?: string;
  /**
   * Pressed state for toggle buttons
   */
  "aria-pressed"?: boolean;
  /**
   * Whether this button has a popup (menu, dialog, etc.)
   */
  "aria-haspopup"?: boolean | "true" | "false" | "menu" | "listbox" | "tree" | "grid" | "dialog";
  /**
   * Current value for buttons in a group
   */
  "aria-current"?: boolean | "page" | "step" | "location" | "date" | "time";
  /**
   * Position in a set (e.g., "2 of 5")
   */
  "aria-setsize"?: number;
  "aria-posinset"?: number;
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    className,
    variant,
    size,
    disabled,
    loading = false,
    loadingText = "Loading",
    pressAnnouncement,
    announcePress = false,
    onClick,
    onKeyDown,
    "aria-describedby": ariaDescribedBy,
    "aria-expanded": ariaExpanded,
    "aria-controls": ariaControls,
    "aria-pressed": ariaPressed,
    "aria-haspopup": ariaHasPopup,
    "aria-current": ariaCurrent,
    "aria-setsize": ariaSetSize,
    "aria-posinset": ariaPosInSet,
    ...props
  }, ref) => {
    const { announce } = useAccessibilityAnnouncements();
    const [isPressed, setIsPressed] = React.useState(false);

    // Generate unique IDs for accessibility
    const buttonId = React.useId();
    const loadingId = `${buttonId}-loading`;

    const isDisabled = disabled || loading;

    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }

      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);

      if (announcePress && pressAnnouncement) {
        announce(pressAnnouncement, 'polite');
      }

      onClick?.(event);
    }, [isDisabled, announcePress, pressAnnouncement, announce, onClick]);

    const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isDisabled) return;

      // Handle space bar and enter key activation
      const wasHandled = handleActivationKeys(event.nativeEvent, () => {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        event.currentTarget.dispatchEvent(clickEvent);
      });

      if (!wasHandled) {
        onKeyDown?.(event);
      }
    }, [isDisabled, onKeyDown]);

    // Build aria attributes
    const ariaAttributes: Record<string, any> = {};
    
    if (ariaDescribedBy || loading) {
      ariaAttributes['aria-describedby'] = [ariaDescribedBy, loading ? loadingId : '']
        .filter(Boolean)
        .join(' ');
    }
    
    if (ariaExpanded !== undefined) {
      ariaAttributes['aria-expanded'] = ariaExpanded;
    }
    
    if (ariaControls) {
      ariaAttributes['aria-controls'] = ariaControls;
    }
    
    if (ariaPressed !== undefined) {
      ariaAttributes['aria-pressed'] = ariaPressed;
    }
    
    if (ariaHasPopup !== undefined) {
      ariaAttributes['aria-haspopup'] = ariaHasPopup;
    }
    
    if (ariaCurrent) {
      ariaAttributes['aria-current'] = ariaCurrent;
    }
    
    if (ariaSetSize) {
      ariaAttributes['aria-setsize'] = ariaSetSize;
    }
    
    if (ariaPosInSet) {
      ariaAttributes['aria-posinset'] = ariaPosInSet;
    }

    // Loading state announcement
    if (loading) {
      ariaAttributes['aria-live'] = 'polite';
      ariaAttributes['aria-busy'] = true;
    }

    return (
      <>
        <Button
          ref={ref}
          className={cn(
            // Enhanced focus styles for better visibility
            "focus-visible:outline-offset-2 focus-visible:outline-2",
            // Pressed state visual feedback
            isPressed && "scale-95 transition-transform duration-75",
            className
          )}
          variant={variant}
          size={size}
          disabled={isDisabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...ariaAttributes}
          {...props}
        >
          {loading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {children}
        </Button>
        
        {/* Hidden loading announcement for screen readers */}
        {loading && (
          <span id={loadingId} className="sr-only">
            {loadingText}
          </span>
        )}
      </>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

/**
 * Toggle button with accessible pressed state management
 */
interface AccessibleToggleButtonProps extends Omit<AccessibleButtonProps, 'aria-pressed'> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  pressedText?: string;
  unpressedText?: string;
}

export const AccessibleToggleButton = React.forwardRef<HTMLButtonElement, AccessibleToggleButtonProps>(
  ({
    pressed = false,
    onPressedChange,
    pressedText = "pressed",
    unpressedText = "not pressed",
    onClick,
    children,
    ...props
  }, ref) => {
    const { announce } = useAccessibilityAnnouncements();

    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      const newPressed = !pressed;
      onPressedChange?.(newPressed);
      
      // Announce state change
      const stateText = newPressed ? pressedText : unpressedText;
      announce(`${children} ${stateText}`, 'polite');
      
      onClick?.(event);
    }, [pressed, onPressedChange, pressedText, unpressedText, children, announce, onClick]);

    return (
      <AccessibleButton
        ref={ref}
        aria-pressed={pressed}
        onClick={handleClick}
        {...props}
      >
        {children}
      </AccessibleButton>
    );
  }
);

AccessibleToggleButton.displayName = "AccessibleToggleButton";

/**
 * Menu button with proper ARIA attributes for dropdown menus
 */
interface AccessibleMenuButtonProps extends Omit<AccessibleButtonProps, 'aria-haspopup' | 'aria-expanded'> {
  menuOpen?: boolean;
  onMenuToggle?: (open: boolean) => void;
  menuId?: string;
}

export const AccessibleMenuButton = React.forwardRef<HTMLButtonElement, AccessibleMenuButtonProps>(
  ({
    menuOpen = false,
    onMenuToggle,
    menuId,
    onClick,
    onKeyDown,
    children,
    ...props
  }, ref) => {
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      onMenuToggle?.(!menuOpen);
      onClick?.(event);
    }, [menuOpen, onMenuToggle, onClick]);

    const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle arrow down to open menu and focus first item
      if (event.key === KEYBOARD_KEYS.ARROW_DOWN && !menuOpen) {
        event.preventDefault();
        onMenuToggle?.(true);
        return;
      }
      
      onKeyDown?.(event);
    }, [menuOpen, onMenuToggle, onKeyDown]);

    return (
      <AccessibleButton
        ref={ref}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </AccessibleButton>
    );
  }
);

AccessibleMenuButton.displayName = "AccessibleMenuButton";