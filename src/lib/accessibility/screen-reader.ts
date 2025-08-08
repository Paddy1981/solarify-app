/**
 * Screen reader utilities for WCAG 2.1 AA compliance
 * Implements live regions and announcements for assistive technologies
 */

import type { ScreenReaderAnnouncementOptions } from './types';

/**
 * Create and manage live regions for screen reader announcements
 */
class ScreenReaderManager {
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;
  private statusRegion: HTMLElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.createLiveRegions();
    }
  }

  private createLiveRegions(): void {
    // Create polite live region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.setAttribute('aria-relevant', 'additions text');
    this.politeRegion.className = 'sr-only';
    this.politeRegion.id = 'sr-polite-region';

    // Create assertive live region
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.setAttribute('aria-relevant', 'additions text');
    this.assertiveRegion.className = 'sr-only';
    this.assertiveRegion.id = 'sr-assertive-region';

    // Create status region
    this.statusRegion = document.createElement('div');
    this.statusRegion.setAttribute('role', 'status');
    this.statusRegion.setAttribute('aria-live', 'polite');
    this.statusRegion.setAttribute('aria-atomic', 'true');
    this.statusRegion.className = 'sr-only';
    this.statusRegion.id = 'sr-status-region';

    // Append to body
    document.body.appendChild(this.politeRegion);
    document.body.appendChild(this.assertiveRegion);
    document.body.appendChild(this.statusRegion);
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, options: ScreenReaderAnnouncementOptions = {}): void {
    if (!message.trim()) return;

    const { priority = 'polite', clear = false } = options;
    let region: HTMLElement | null = null;

    switch (priority) {
      case 'assertive':
        region = this.assertiveRegion;
        break;
      case 'polite':
      default:
        region = this.politeRegion;
        break;
    }

    if (!region) return;

    if (clear) {
      region.textContent = '';
      // Small delay to ensure the clear is processed
      setTimeout(() => {
        if (region) region.textContent = message;
      }, 100);
    } else {
      region.textContent = message;
    }
  }

  /**
   * Announce status updates (loading, success, error states)
   */
  announceStatus(message: string): void {
    if (!this.statusRegion || !message.trim()) return;
    this.statusRegion.textContent = message;
  }

  /**
   * Clear all live regions
   */
  clear(): void {
    if (this.politeRegion) this.politeRegion.textContent = '';
    if (this.assertiveRegion) this.assertiveRegion.textContent = '';
    if (this.statusRegion) this.statusRegion.textContent = '';
  }

  /**
   * Clean up live regions
   */
  destroy(): void {
    if (this.politeRegion) {
      document.body.removeChild(this.politeRegion);
      this.politeRegion = null;
    }
    if (this.assertiveRegion) {
      document.body.removeChild(this.assertiveRegion);
      this.assertiveRegion = null;
    }
    if (this.statusRegion) {
      document.body.removeChild(this.statusRegion);
      this.statusRegion = null;
    }
  }
}

// Global instance
let screenReaderManager: ScreenReaderManager | null = null;

/**
 * Get or create the screen reader manager instance
 */
function getScreenReaderManager(): ScreenReaderManager {
  if (!screenReaderManager) {
    screenReaderManager = new ScreenReaderManager();
  }
  return screenReaderManager;
}

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const manager = getScreenReaderManager();
  manager.announce(message, { priority });
}

/**
 * Announce status updates
 */
export function announceStatus(message: string): void {
  const manager = getScreenReaderManager();
  manager.announceStatus(message);
}

/**
 * Clear all screen reader announcements
 */
export function clearScreenReaderAnnouncements(): void {
  const manager = getScreenReaderManager();
  manager.clear();
}

/**
 * Announce form errors to screen readers
 */
export function announceFormError(fieldName: string, errorMessage: string): void {
  const message = `${fieldName}: ${errorMessage}`;
  announceToScreenReader(message, 'assertive');
}

/**
 * Announce form success to screen readers
 */
export function announceFormSuccess(message: string): void {
  announceStatus(`Success: ${message}`);
}

/**
 * Announce loading states
 */
export function announceLoading(message: string = 'Loading'): void {
  announceStatus(message);
}

/**
 * Announce page navigation
 */
export function announcePageChange(pageName: string): void {
  announceToScreenReader(`Navigated to ${pageName}`, 'polite');
}

/**
 * Announce modal/dialog open
 */
export function announceModalOpen(modalTitle: string): void {
  announceToScreenReader(`${modalTitle} dialog opened`, 'polite');
}

/**
 * Announce modal/dialog close
 */
export function announceModalClose(modalTitle?: string): void {
  const message = modalTitle ? `${modalTitle} dialog closed` : 'Dialog closed';
  announceToScreenReader(message, 'polite');
}

/**
 * Announce dynamic content changes
 */
export function announceDynamicContent(message: string): void {
  announceToScreenReader(message, 'polite');
}

/**
 * Announce search results
 */
export function announceSearchResults(count: number, query?: string): void {
  const message = query 
    ? `${count} search results found for "${query}"`
    : `${count} results found`;
  announceToScreenReader(message, 'polite');
}

/**
 * Announce table sorting
 */
export function announceTableSort(column: string, direction: 'ascending' | 'descending'): void {
  announceToScreenReader(`Table sorted by ${column}, ${direction}`, 'polite');
}

/**
 * Announce tab selection
 */
export function announceTabChange(tabName: string, position: number, total: number): void {
  announceToScreenReader(`${tabName} tab selected, ${position} of ${total}`, 'polite');
}

/**
 * React hook for screen reader announcements
 */
import { useCallback } from 'react';

export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);

  const announceError = useCallback((fieldName: string, errorMessage: string) => {
    announceFormError(fieldName, errorMessage);
  }, []);

  const announceSuccess = useCallback((message: string) => {
    announceFormSuccess(message);
  }, []);

  const announceLoading = useCallback((message: string = 'Loading') => {
    announceStatus(message);
  }, []);

  const clear = useCallback(() => {
    clearScreenReaderAnnouncements();
  }, []);

  return {
    announce,
    announceError,
    announceSuccess,
    announceLoading,
    clear
  };
}

/**
 * Check if screen reader is likely in use
 */
export function isScreenReaderActive(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for common screen reader indicators
  const hasScreenReaderAttributes = document.querySelector('[aria-live], [role="status"], [role="alert"]');
  const hasAriaHidden = document.querySelector('[aria-hidden="true"]');
  const hasAriaExpanded = document.querySelector('[aria-expanded]');
  
  // Check for reduced motion preference (often used by screen reader users)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Very basic heuristic - in a real app you might use more sophisticated detection
  return !!(hasScreenReaderAttributes || hasAriaHidden || hasAriaExpanded || prefersReducedMotion);
}

/**
 * Initialize screen reader utilities
 */
export function initializeScreenReader(): void {
  if (typeof window === 'undefined') return;
  
  // Create the manager instance
  getScreenReaderManager();
  
  // Add global styles for screen reader only content
  const style = document.createElement('style');
  style.textContent = `
    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
    
    .sr-only-focusable:focus {
      position: static !important;
      width: auto !important;
      height: auto !important;
      padding: 0.25rem 0.5rem !important;
      margin: 0 !important;
      overflow: visible !important;
      clip: auto !important;
      white-space: normal !important;
      background: #000 !important;
      color: #fff !important;
      text-decoration: none !important;
      border-radius: 0.25rem !important;
      z-index: 9999 !important;
    }
  `;
  document.head.appendChild(style);
}