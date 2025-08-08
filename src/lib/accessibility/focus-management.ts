/**
 * Focus management utilities for WCAG 2.1 AA compliance
 * Implements focus traps, restoration, and keyboard navigation
 */

import type { FocusTrapOptions } from './types';

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'details',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  
  return elements.filter(element => {
    // Check if element is visible and not hidden
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      !element.hasAttribute('aria-hidden') &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  });
}

/**
 * Focus trap implementation
 */
class FocusTrap {
  private container: HTMLElement;
  private options: FocusTrapOptions;
  private focusableElements: HTMLElement[] = [];
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;
  private isActive = false;

  constructor(container: HTMLElement, options: FocusTrapOptions = {}) {
    this.container = container;
    this.options = {
      escapeDeactivates: true,
      clickOutsideDeactivates: true,
      returnFocusOnDeactivate: true,
      ...options
    };
  }

  activate(): void {
    if (this.isActive) return;

    // Store the currently focused element
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Update focusable elements
    this.updateFocusableElements();

    // Set initial focus
    this.setInitialFocus();

    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('click', this.handleClick);
    
    this.isActive = true;
  }

  deactivate(): void {
    if (!this.isActive) return;

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleClick);

    // Return focus to previously focused element
    if (this.options.returnFocusOnDeactivate && this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }

    this.isActive = false;
  }

  private updateFocusableElements(): void {
    this.focusableElements = getFocusableElements(this.container);
    this.firstFocusableElement = this.focusableElements[0] || null;
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  private setInitialFocus(): void {
    let elementToFocus: HTMLElement | null = null;

    if (this.options.initialFocus) {
      elementToFocus = typeof this.options.initialFocus === 'function' 
        ? this.options.initialFocus() 
        : this.options.initialFocus;
    } else {
      elementToFocus = this.firstFocusableElement;
    }

    if (!elementToFocus && this.options.fallbackFocus) {
      elementToFocus = typeof this.options.fallbackFocus === 'function' 
        ? this.options.fallbackFocus() 
        : this.options.fallbackFocus;
    }

    if (elementToFocus) {
      elementToFocus.focus();
    }
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isActive) return;

    // Handle Escape key
    if (event.key === 'Escape' && this.options.escapeDeactivates) {
      event.preventDefault();
      this.deactivate();
      return;
    }

    // Handle Tab key for focus cycling
    if (event.key === 'Tab') {
      this.handleTabKey(event);
    }
  };

  private handleTabKey(event: KeyboardEvent): void {
    if (!this.firstFocusableElement || !this.lastFocusableElement) return;

    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault();
        this.lastFocusableElement.focus();
      }
    } else {
      // Tab (forward)
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault();
        this.firstFocusableElement.focus();
      }
    }
  }

  private handleClick = (event: MouseEvent): void => {
    if (!this.isActive || !this.options.clickOutsideDeactivates) return;

    const target = event.target as HTMLElement;
    if (!this.container.contains(target)) {
      event.preventDefault();
      this.deactivate();
    }
  };
}

/**
 * Create and manage a focus trap
 */
export function createFocusTrap(container: HTMLElement, options?: FocusTrapOptions): FocusTrap {
  return new FocusTrap(container, options);
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirstElement(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
    return true;
  }
  return false;
}

/**
 * Focus the last focusable element in a container
 */
export function focusLastElement(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[focusableElements.length - 1].focus();
    return true;
  }
  return false;
}

/**
 * Store current focus for later restoration
 */
let storedFocus: HTMLElement | null = null;

export function storeFocus(): void {
  storedFocus = document.activeElement as HTMLElement;
}

/**
 * Restore previously stored focus
 */
export function restoreFocus(): void {
  if (storedFocus && typeof storedFocus.focus === 'function') {
    storedFocus.focus();
    storedFocus = null;
  }
}

/**
 * React hook for focus management
 */
import { useRef, useCallback, useEffect } from 'react';

export function useFocusTrap(options?: FocusTrapOptions) {
  const containerRef = useRef<HTMLElement>(null);
  const trapRef = useRef<FocusTrap | null>(null);

  const activate = useCallback(() => {
    if (containerRef.current && !trapRef.current) {
      trapRef.current = createFocusTrap(containerRef.current, options);
      trapRef.current.activate();
    }
  }, [options]);

  const deactivate = useCallback(() => {
    if (trapRef.current) {
      trapRef.current.deactivate();
      trapRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      deactivate();
    };
  }, [deactivate]);

  return {
    containerRef,
    activate,
    deactivate
  };
}

/**
 * React hook for focus restoration
 */
export function useFocusRestore() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const store = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restore = useCallback(() => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  return { store, restore };
}

/**
 * React hook for managing focus within a container
 */
export function useFocusManagement() {
  const focusFirst = useCallback((container: HTMLElement) => {
    return focusFirstElement(container);
  }, []);

  const focusLast = useCallback((container: HTMLElement) => {
    return focusLastElement(container);
  }, []);

  const getFocusableElements = useCallback((container: HTMLElement) => {
    return getFocusableElements(container);
  }, []);

  return {
    focusFirst,
    focusLast,
    getFocusableElements
  };
}

/**
 * Skip to main content functionality
 */
export function skipToMainContent(): void {
  const mainContent = document.querySelector('main, [role="main"], #main-content');
  if (mainContent instanceof HTMLElement) {
    mainContent.focus();
    mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Enhanced focus management for roving tabindex pattern
 */
export class RovingTabindexManager {
  private items: HTMLElement[] = [];
  private currentIndex = 0;

  constructor(items: HTMLElement[]) {
    this.items = items;
    this.initializeTabindexes();
    this.addEventListeners();
  }

  private initializeTabindexes(): void {
    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
  }

  private addEventListeners(): void {
    this.items.forEach((item, index) => {
      item.addEventListener('keydown', (event) => this.handleKeyDown(event, index));
      item.addEventListener('focus', () => this.setActiveItem(index));
    });
  }

  private handleKeyDown(event: KeyboardEvent, index: number): void {
    let newIndex = index;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (index + 1) % this.items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = index === 0 ? this.items.length - 1 : index - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = this.items.length - 1;
        break;
      default:
        return;
    }

    this.setActiveItem(newIndex);
    this.items[newIndex].focus();
  }

  private setActiveItem(index: number): void {
    this.items[this.currentIndex].setAttribute('tabindex', '-1');
    this.currentIndex = index;
    this.items[this.currentIndex].setAttribute('tabindex', '0');
  }

  public destroy(): void {
    this.items.forEach(item => {
      item.removeEventListener('keydown', this.handleKeyDown);
      item.removeEventListener('focus', this.setActiveItem);
    });
  }
}

/**
 * Create roving tabindex for a group of elements
 */
export function createRovingTabindex(items: HTMLElement[]): RovingTabindexManager {
  return new RovingTabindexManager(items);
}