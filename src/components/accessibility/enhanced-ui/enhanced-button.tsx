/**
 * Enhanced Button component with accessibility improvements
 * Drop-in replacement for the existing Button component
 */

"use client";

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AccessibleButton } from "../AccessibleButton";

/**
 * Enhanced button with better accessibility and color contrast
 */
export const EnhancedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <AccessibleButton
        ref={ref}
        className={cn(
          // Enhanced focus styles
          "focus-visible:ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring",
          // Improved contrast for disabled state
          "disabled:opacity-60 disabled:cursor-not-allowed",
          // Better hover states
          "transition-all duration-200 ease-in-out",
          className
        )}
        variant={variant}
        {...props}
      >
        {children}
      </AccessibleButton>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";