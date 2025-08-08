/**
 * AccessibleLayout component providing proper landmark structure
 * Implements WCAG 2.1 navigation and heading hierarchy
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SkipLinks } from "./SkipLinks";
import { useAccessibilityAnnouncements } from "@/contexts/accessibility-context";

interface AccessibleLayoutProps {
  children: React.ReactNode;
  /**
   * Page title for announcements
   */
  pageTitle?: string;
  /**
   * Additional skip links
   */
  additionalSkipLinks?: Array<{
    label: string;
    target: string;
  }>;
  /**
   * Whether to announce page changes
   */
  announcePageChanges?: boolean;
  className?: string;
}

export function AccessibleLayout({
  children,
  pageTitle,
  additionalSkipLinks,
  announcePageChanges = true,
  className
}: AccessibleLayoutProps) {
  const { announceNavigation } = useAccessibilityAnnouncements();

  React.useEffect(() => {
    if (announcePageChanges && pageTitle) {
      // Announce page changes with a slight delay to ensure page is ready
      const timer = setTimeout(() => {
        announceNavigation(pageTitle);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [pageTitle, announcePageChanges, announceNavigation]);

  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {/* Skip Links - Always first for keyboard users */}
      <SkipLinks additionalLinks={additionalSkipLinks} />
      
      {/* Header/Navigation - Should be a landmark */}
      <header role="banner" className="border-b bg-background">
        {/* Header content will be provided by parent */}
      </header>
      
      {/* Main Content Area */}
      <main 
        id="main-content" 
        role="main" 
        className="flex-1"
        tabIndex={-1} // Allow programmatic focus for skip links
      >
        {children}
      </main>
      
      {/* Footer - Should be a landmark */}
      <footer role="contentinfo" className="border-t bg-background mt-auto">
        {/* Footer content will be provided by parent */}
      </footer>
    </div>
  );
}

/**
 * Page wrapper with proper heading structure
 */
interface AccessiblePageProps {
  children: React.ReactNode;
  /**
   * Main page heading (h1)
   */
  title: string;
  /**
   * Page description for screen readers
   */
  description?: string;
  /**
   * Whether to visually hide the title (still accessible to screen readers)
   */
  hiddenTitle?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function AccessiblePage({
  children,
  title,
  description,
  hiddenTitle = false,
  className
}: AccessiblePageProps) {
  const descriptionId = React.useId();

  return (
    <div 
      className={cn("container mx-auto px-4 py-6", className)}
      aria-describedby={description ? descriptionId : undefined}
    >
      <h1 className={cn(
        "text-3xl font-bold mb-6",
        hiddenTitle && "sr-only"
      )}>
        {title}
      </h1>
      
      {description && (
        <div id={descriptionId} className="sr-only">
          {description}
        </div>
      )}
      
      {children}
    </div>
  );
}

/**
 * Section component with proper heading hierarchy
 */
interface AccessibleSectionProps {
  children: React.ReactNode;
  /**
   * Section heading
   */
  title?: string;
  /**
   * Heading level (2-6)
   */
  level?: 2 | 3 | 4 | 5 | 6;
  /**
   * ARIA label for the section
   */
  ariaLabel?: string;
  /**
   * Section description
   */
  description?: string;
  className?: string;
}

export function AccessibleSection({
  children,
  title,
  level = 2,
  ariaLabel,
  description,
  className
}: AccessibleSectionProps) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  const descriptionId = React.useId();

  return (
    <section 
      className={cn("mb-8", className)}
      aria-label={ariaLabel}
      aria-describedby={description ? descriptionId : undefined}
    >
      {title && (
        <HeadingTag className={cn(
          "font-semibold mb-4",
          level === 2 && "text-2xl",
          level === 3 && "text-xl",
          level === 4 && "text-lg",
          level === 5 && "text-base",
          level === 6 && "text-sm"
        )}>
          {title}
        </HeadingTag>
      )}
      
      {description && (
        <div id={descriptionId} className="sr-only">
          {description}
        </div>
      )}
      
      {children}
    </section>
  );
}

/**
 * Navigation component with proper ARIA attributes
 */
interface AccessibleNavProps {
  children: React.ReactNode;
  /**
   * Navigation label
   */
  ariaLabel: string;
  /**
   * Whether this is the main navigation
   */
  main?: boolean;
  className?: string;
}

export function AccessibleNav({
  children,
  ariaLabel,
  main = false,
  className
}: AccessibleNavProps) {
  return (
    <nav 
      role="navigation"
      aria-label={ariaLabel}
      className={cn(
        main && "main-navigation",
        className
      )}
    >
      {children}
    </nav>
  );
}

/**
 * Breadcrumb navigation component
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface AccessibleBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function AccessibleBreadcrumbs({ items, className }: AccessibleBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4", className)}>
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-muted-foreground" aria-hidden="true">
                /
              </span>
            )}
            {item.current ? (
              <span 
                className="text-foreground font-medium"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : item.href ? (
              <a 
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-muted-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Alert component for important messages
 */
interface AccessibleAlertProps {
  children: React.ReactNode;
  /**
   * Alert type
   */
  type?: 'info' | 'warning' | 'error' | 'success';
  /**
   * Alert title
   */
  title?: string;
  /**
   * Whether to announce the alert
   */
  announce?: boolean;
  className?: string;
}

export function AccessibleAlert({
  children,
  type = 'info',
  title,
  announce = true,
  className
}: AccessibleAlertProps) {
  const { announce: announceToScreenReader } = useAccessibilityAnnouncements();
  const titleId = React.useId();

  React.useEffect(() => {
    if (announce && title) {
      announceToScreenReader(`${type}: ${title}`, type === 'error' ? 'assertive' : 'polite');
    }
  }, [announce, title, type, announceToScreenReader]);

  const getAlertStyles = () => {
    switch (type) {
      case 'error':
        return "border-destructive bg-destructive/10 text-destructive";
      case 'warning':
        return "border-yellow-500 bg-yellow-50 text-yellow-800";
      case 'success':
        return "border-green-500 bg-green-50 text-green-800";
      case 'info':
      default:
        return "border-blue-500 bg-blue-50 text-blue-800";
    }
  };

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        "p-4 border rounded-md",
        getAlertStyles(),
        className
      )}
    >
      {title && (
        <h3 id={titleId} className="font-semibold mb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}