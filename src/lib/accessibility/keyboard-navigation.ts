/**
 * Keyboard navigation utilities for WCAG 2.1 AA compliance
 * Implements standard keyboard interaction patterns
 */

/**
 * Standard keyboard navigation keys
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace'
} as const;

/**
 * Check if an element should be treated as clickable via keyboard
 */
export function isClickableElement(element: HTMLElement): boolean {
  const clickableRoles = ['button', 'link', 'menuitem', 'option', 'tab', 'switch', 'checkbox', 'radio'];
  const clickableTags = ['button', 'a', 'input', 'select', 'textarea'];
  
  const role = element.getAttribute('role');
  const tagName = element.tagName.toLowerCase();
  
  return clickableRoles.includes(role || '') || clickableTags.includes(tagName);
}

/**
 * Handle Enter and Space key activation for custom interactive elements
 */
export function handleActivationKeys(
  event: KeyboardEvent, 
  callback: () => void, 
  keys: string[] = [KEYBOARD_KEYS.ENTER, KEYBOARD_KEYS.SPACE]
): boolean {
  if (keys.includes(event.key)) {
    event.preventDefault();
    callback();
    return true;
  }
  return false;
}

/**
 * Navigation handler for arrow key navigation in lists/menus
 */
export function handleArrowNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onNavigate: (newIndex: number) => void,
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
): boolean {
  let newIndex = currentIndex;
  let handled = false;

  switch (event.key) {
    case KEYBOARD_KEYS.ARROW_DOWN:
      if (orientation === 'vertical' || orientation === 'both') {
        newIndex = (currentIndex + 1) % totalItems;
        handled = true;
      }
      break;
    case KEYBOARD_KEYS.ARROW_UP:
      if (orientation === 'vertical' || orientation === 'both') {
        newIndex = currentIndex === 0 ? totalItems - 1 : currentIndex - 1;
        handled = true;
      }
      break;
    case KEYBOARD_KEYS.ARROW_RIGHT:
      if (orientation === 'horizontal' || orientation === 'both') {
        newIndex = (currentIndex + 1) % totalItems;
        handled = true;
      }
      break;
    case KEYBOARD_KEYS.ARROW_LEFT:
      if (orientation === 'horizontal' || orientation === 'both') {
        newIndex = currentIndex === 0 ? totalItems - 1 : currentIndex - 1;
        handled = true;
      }
      break;
    case KEYBOARD_KEYS.HOME:
      newIndex = 0;
      handled = true;
      break;
    case KEYBOARD_KEYS.END:
      newIndex = totalItems - 1;
      handled = true;
      break;
  }

  if (handled) {
    event.preventDefault();
    onNavigate(newIndex);
  }

  return handled;
}

/**
 * Dropdown/Combobox keyboard navigation
 */
export function handleDropdownNavigation(
  event: KeyboardEvent,
  isOpen: boolean,
  currentIndex: number,
  totalItems: number,
  onNavigate: (index: number) => void,
  onOpen: () => void,
  onClose: () => void,
  onSelect: (index: number) => void
): boolean {
  let handled = false;

  switch (event.key) {
    case KEYBOARD_KEYS.ENTER:
    case KEYBOARD_KEYS.SPACE:
      if (!isOpen) {
        onOpen();
      } else if (currentIndex >= 0) {
        onSelect(currentIndex);
      }
      handled = true;
      break;
    case KEYBOARD_KEYS.ESCAPE:
      if (isOpen) {
        onClose();
        handled = true;
      }
      break;
    case KEYBOARD_KEYS.ARROW_DOWN:
      if (!isOpen) {
        onOpen();
      } else {
        const newIndex = (currentIndex + 1) % totalItems;
        onNavigate(newIndex);
      }
      handled = true;
      break;
    case KEYBOARD_KEYS.ARROW_UP:
      if (!isOpen) {
        onOpen();
      } else {
        const newIndex = currentIndex === 0 ? totalItems - 1 : currentIndex - 1;
        onNavigate(newIndex);
      }
      handled = true;
      break;
    case KEYBOARD_KEYS.HOME:
      if (isOpen) {
        onNavigate(0);
        handled = true;
      }
      break;
    case KEYBOARD_KEYS.END:
      if (isOpen) {
        onNavigate(totalItems - 1);
        handled = true;
      }
      break;
  }

  if (handled) {
    event.preventDefault();
  }

  return handled;
}

/**
 * Tab navigation handler
 */
export function handleTabNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  totalTabs: number,
  onTabSelect: (index: number) => void,
  onActivateTab?: (index: number) => void
): boolean {
  let handled = false;
  let newIndex = currentIndex;

  switch (event.key) {
    case KEYBOARD_KEYS.ARROW_LEFT:
      newIndex = currentIndex === 0 ? totalTabs - 1 : currentIndex - 1;
      handled = true;
      break;
    case KEYBOARD_KEYS.ARROW_RIGHT:
      newIndex = (currentIndex + 1) % totalTabs;
      handled = true;
      break;
    case KEYBOARD_KEYS.HOME:
      newIndex = 0;
      handled = true;
      break;
    case KEYBOARD_KEYS.END:
      newIndex = totalTabs - 1;
      handled = true;
      break;
    case KEYBOARD_KEYS.ENTER:
    case KEYBOARD_KEYS.SPACE:
      if (onActivateTab) {
        onActivateTab(currentIndex);
        handled = true;
      }
      break;
  }

  if (handled && event.key !== KEYBOARD_KEYS.ENTER && event.key !== KEYBOARD_KEYS.SPACE) {
    event.preventDefault();
    onTabSelect(newIndex);
  }

  return handled;
}

/**
 * Dialog keyboard navigation
 */
export function handleDialogNavigation(
  event: KeyboardEvent,
  onClose: () => void
): boolean {
  if (event.key === KEYBOARD_KEYS.ESCAPE) {
    event.preventDefault();
    onClose();
    return true;
  }
  return false;
}

/**
 * Table keyboard navigation
 */
export function handleTableNavigation(
  event: KeyboardEvent,
  currentRow: number,
  currentCol: number,
  totalRows: number,
  totalCols: number,
  onNavigate: (row: number, col: number) => void
): boolean {
  let newRow = currentRow;
  let newCol = currentCol;
  let handled = false;

  switch (event.key) {
    case KEYBOARD_KEYS.ARROW_UP:
      newRow = Math.max(0, currentRow - 1);
      handled = true;
      break;
    case KEYBOARD_KEYS.ARROW_DOWN:
      newRow = Math.min(totalRows - 1, currentRow + 1);
      handled = true;
      break;
    case KEYBOARD_KEYS.ARROW_LEFT:
      newCol = Math.max(0, currentCol - 1);
      handled = true;
      break;
    case KEYBOARD_KEYS.ARROW_RIGHT:
      newCol = Math.min(totalCols - 1, currentCol + 1);
      handled = true;
      break;
    case KEYBOARD_KEYS.HOME:
      if (event.ctrlKey) {
        newRow = 0;
        newCol = 0;
      } else {
        newCol = 0;
      }
      handled = true;
      break;
    case KEYBOARD_KEYS.END:
      if (event.ctrlKey) {
        newRow = totalRows - 1;
        newCol = totalCols - 1;
      } else {
        newCol = totalCols - 1;
      }
      handled = true;
      break;
    case KEYBOARD_KEYS.PAGE_UP:
      newRow = Math.max(0, currentRow - 10); // Jump 10 rows up
      handled = true;
      break;
    case KEYBOARD_KEYS.PAGE_DOWN:
      newRow = Math.min(totalRows - 1, currentRow + 10); // Jump 10 rows down
      handled = true;
      break;
  }

  if (handled) {
    event.preventDefault();
    onNavigate(newRow, newCol);
  }

  return handled;
}

/**
 * React hook for keyboard navigation in lists
 */
import { useState, useCallback, useEffect } from 'react';

export function useKeyboardNavigation(
  items: any[],
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    handleArrowNavigation(
      event,
      currentIndex,
      items.length,
      setCurrentIndex,
      orientation
    );
  }, [currentIndex, items.length, orientation]);

  const resetIndex = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    if (currentIndex >= items.length && items.length > 0) {
      setCurrentIndex(items.length - 1);
    }
  }, [items.length, currentIndex]);

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
    resetIndex
  };
}

/**
 * React hook for dropdown keyboard navigation
 */
export function useDropdownNavigation(items: any[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    handleDropdownNavigation(
      event,
      isOpen,
      currentIndex,
      items.length,
      setCurrentIndex,
      () => setIsOpen(true),
      () => {
        setIsOpen(false);
        setCurrentIndex(-1);
      },
      (index) => {
        setIsOpen(false);
        setCurrentIndex(-1);
        // Callback would be handled by parent component
      }
    );
  }, [isOpen, currentIndex, items.length]);

  const open = useCallback(() => {
    setIsOpen(true);
    setCurrentIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCurrentIndex(-1);
  }, []);

  return {
    isOpen,
    currentIndex,
    handleKeyDown,
    open,
    close,
    setCurrentIndex
  };
}

/**
 * Skip links functionality for keyboard navigation
 */
export function createSkipLink(
  text: string,
  targetSelector: string,
  className: string = 'sr-only-focusable'
): HTMLElement {
  const link = document.createElement('a');
  link.href = '#';
  link.textContent = text;
  link.className = className;
  
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(targetSelector);
    if (target instanceof HTMLElement) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  return link;
}

/**
 * Initialize standard skip links for the application
 */
export function initializeSkipLinks(): void {
  const skipLinksContainer = document.createElement('div');
  skipLinksContainer.className = 'skip-links';
  
  const skipToMain = createSkipLink('Skip to main content', 'main, [role="main"], #main-content');
  const skipToNav = createSkipLink('Skip to navigation', 'nav, [role="navigation"]');
  
  skipLinksContainer.appendChild(skipToMain);
  skipLinksContainer.appendChild(skipToNav);
  
  document.body.insertBefore(skipLinksContainer, document.body.firstChild);
}

/**
 * Utility to check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Smooth scroll with reduced motion consideration
 */
export function accessibleScroll(element: HTMLElement, options?: ScrollIntoViewOptions): void {
  const scrollOptions: ScrollIntoViewOptions = {
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
    ...options
  };
  
  element.scrollIntoView(scrollOptions);
}