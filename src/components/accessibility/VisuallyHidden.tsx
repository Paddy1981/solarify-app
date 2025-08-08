/**
 * VisuallyHidden component for screen reader only content
 * Implements WCAG 2.1 technique for hiding content visually while keeping it accessible
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  /**
   * Whether the content should be focusable.
   * When true, the content becomes visible when focused (useful for skip links)
   */
  focusable?: boolean;
  /**
   * HTML element to render as
   */
  as?: keyof JSX.IntrinsicElements;
}

export const VisuallyHidden = React.forwardRef<HTMLElement, VisuallyHiddenProps>(
  ({ children, className, focusable = false, as: Component = "span", ...props }, ref) => {
    const classes = cn(
      // Base screen reader only styles
      "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
      // Clip path for better browser support
      "[clip:rect(0,0,0,0)]",
      // Focusable styles - make visible when focused
      focusable && [
        "focus:static focus:w-auto focus:h-auto focus:p-1 focus:m-0",
        "focus:overflow-visible focus:whitespace-normal focus:clip-auto",
        "focus:bg-black focus:text-white focus:no-underline",
        "focus:rounded focus:z-[9999]"
      ],
      className
    );

    return React.createElement(
      Component,
      {
        ...props,
        ref,
        className: classes
      },
      children
    );
  }
);

VisuallyHidden.displayName = "VisuallyHidden";

/**
 * Utility component for skip links
 */
export interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  /**
   * Target element selector or ID
   */
  target: string;
}

export const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ children, target, className, onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      
      const targetElement = document.querySelector(target);
      if (targetElement instanceof HTMLElement) {
        targetElement.focus();
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
      
      onClick?.(event);
    };

    return (
      <VisuallyHidden
        as="a"
        focusable
        ref={ref}
        href="#"
        className={cn(
          "focus:fixed focus:top-4 focus:left-4 focus:px-4 focus:py-2",
          "focus:bg-primary focus:text-primary-foreground focus:font-medium",
          "focus:rounded-md focus:shadow-lg",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </VisuallyHidden>
    );
  }
);

SkipLink.displayName = "SkipLink";