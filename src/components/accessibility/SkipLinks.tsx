/**
 * SkipLinks component for keyboard navigation accessibility
 * Provides quick navigation to main content areas
 */

"use client";

import * as React from "react";
import { SkipLink } from "./VisuallyHidden";

interface SkipLinksProps {
  /**
   * Additional skip links to include
   */
  additionalLinks?: Array<{
    label: string;
    target: string;
  }>;
}

export function SkipLinks({ additionalLinks = [] }: SkipLinksProps) {
  // Default skip links for common page sections
  const defaultLinks = [
    { label: "Skip to main content", target: "main, [role='main'], #main-content" },
    { label: "Skip to navigation", target: "nav, [role='navigation'], #navigation" },
    { label: "Skip to search", target: "[role='search'], #search, .search" }
  ];

  const allLinks = [...defaultLinks, ...additionalLinks];

  return (
    <div className="skip-links">
      {allLinks.map(({ label, target }, index) => (
        <SkipLink key={index} target={target}>
          {label}
        </SkipLink>
      ))}
    </div>
  );
}

/**
 * Hook to add skip links to a page
 */
export function useSkipLinks(additionalLinks?: SkipLinksProps['additionalLinks']) {
  React.useEffect(() => {
    // This effect could be used to dynamically inject skip links
    // if they're not rendered in the layout
    const existingSkipLinks = document.querySelector('.skip-links');
    
    if (!existingSkipLinks) {
      const skipLinksContainer = document.createElement('div');
      skipLinksContainer.className = 'skip-links-dynamic';
      
      // Create skip links programmatically
      const links = [
        { label: "Skip to main content", target: "main, [role='main'], #main-content" },
        { label: "Skip to navigation", target: "nav, [role='navigation'], #navigation" },
        ...(additionalLinks || [])
      ];
      
      links.forEach(({ label, target }) => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = label;
        link.className = 'sr-only sr-only-focusable';
        
        link.addEventListener('click', (event) => {
          event.preventDefault();
          const targetElement = document.querySelector(target);
          if (targetElement instanceof HTMLElement) {
            targetElement.focus();
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        
        skipLinksContainer.appendChild(link);
      });
      
      document.body.insertBefore(skipLinksContainer, document.body.firstChild);
      
      return () => {
        const dynamicSkipLinks = document.querySelector('.skip-links-dynamic');
        if (dynamicSkipLinks) {
          document.body.removeChild(dynamicSkipLinks);
        }
      };
    }
  }, [additionalLinks]);
}