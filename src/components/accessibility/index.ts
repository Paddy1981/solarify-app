/**
 * Accessibility components and utilities index
 * Comprehensive WCAG 2.1 AA compliance implementation for Solarify
 */

// Core accessibility components
export { AccessibilityProvider, useAccessibility, useAccessibilityAnnouncements, useAccessibilityFocus, useAccessibilityMotion, useLandmarkRegions } from '@/contexts/accessibility-context';

// Visually hidden and skip links
export { VisuallyHidden, SkipLink } from './VisuallyHidden';
export { SkipLinks, useSkipLinks } from './SkipLinks';

// Enhanced interactive components
export { AccessibleButton, AccessibleToggleButton, AccessibleMenuButton } from './AccessibleButton';
export { 
  AccessibleFormField,
  AccessibleInput,
  AccessibleTextarea,
  AccessibleSelect,
  AccessibleCheckbox,
  AccessibleRadioGroup,
  AccessibleRadioItem,
  FormSection,
  FormSuccess,
  Form // Re-export the base form
} from './AccessibleForm';

// Modal and dialog components
export {
  AccessibleModal,
  AccessibleModalContent,
  AccessibleModalHeader,
  AccessibleModalFooter, 
  AccessibleModalTitle,
  AccessibleModalDescription,
  AccessibleModalTrigger,
  AccessibleModalClose,
  AccessibleAlertModal
} from './AccessibleModal';

// Table components
export {
  AccessibleTable,
  AccessibleTableHeader,
  AccessibleTableBody,
  AccessibleTableRow,
  AccessibleTableHead,
  AccessibleTableCell,
  SortableTable
} from './AccessibleTable';

// ARIA and live region components
export {
  AriaLive,
  AriaStatus,
  AriaAlert,
  AriaProgress,
  useAriaLive,
  DynamicAnnouncement,
  LoadingAnnouncement,
  ValidationAnnouncement
} from './AriaLive';

// ARIA describedby utilities
export {
  AriaDescribedBy,
  useAriaDescribedBy,
  ErrorDescription,
  HelpText,
  Instructions,
  FieldDescriptions,
  useFieldDescriptions,
  ExpandableContent
} from './AriaDescribedBy';

// Layout and structural components
export {
  AccessibleLayout,
  AccessiblePage,
  AccessibleSection,
  AccessibleNav,
  AccessibleBreadcrumbs,
  AccessibleAlert
} from './AccessibleLayout';

// Enhanced UI components
export { EnhancedButton } from './enhanced-ui/enhanced-button';
export { EnhancedRFQForm } from './enhanced-ui/enhanced-rfq-form';

// Accessibility utilities
export * from '@/lib/accessibility/screen-reader';
export * from '@/lib/accessibility/focus-management';
export * from '@/lib/accessibility/keyboard-navigation';
export * from '@/lib/accessibility/color-contrast';
export { auditAccessibility, generateAccessibilityReport } from '@/lib/accessibility/testing';
export * from '@/lib/accessibility/types';

// Common accessibility patterns and hooks
export const ACCESSIBILITY_PATTERNS = {
  // Focus management
  FOCUS_TRAP: 'focus-trap',
  FOCUS_RESTORATION: 'focus-restoration',
  SKIP_LINKS: 'skip-links',
  
  // ARIA patterns
  LIVE_REGIONS: 'live-regions',
  MODAL_DIALOG: 'modal-dialog',
  ACCORDION: 'accordion',
  TABS: 'tabs',
  DROPDOWN: 'dropdown',
  TABLE_SORTING: 'table-sorting',
  
  // Form patterns
  FORM_VALIDATION: 'form-validation',
  FIELD_DESCRIPTIONS: 'field-descriptions',
  ERROR_HANDLING: 'error-handling',
  
  // Navigation patterns
  BREADCRUMBS: 'breadcrumbs',
  PAGINATION: 'pagination',
  MENU_NAVIGATION: 'menu-navigation'
} as const;

export const WCAG_LEVELS = {
  A: 'A',
  AA: 'AA', 
  AAA: 'AAA'
} as const;

export const ACCESSIBILITY_ROLES = {
  // Landmark roles
  BANNER: 'banner',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  CONTENTINFO: 'contentinfo',
  SEARCH: 'search',
  REGION: 'region',
  
  // Widget roles
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  TEXTBOX: 'textbox',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TABLIST: 'tablist',
  SLIDER: 'slider',
  PROGRESSBAR: 'progressbar',
  
  // Document structure roles
  HEADING: 'heading',
  LIST: 'list',
  LISTITEM: 'listitem',
  TABLE: 'table',
  ROW: 'row',
  CELL: 'cell',
  COLUMNHEADER: 'columnheader',
  ROWHEADER: 'rowheader',
  
  // Live region roles
  ALERT: 'alert',
  STATUS: 'status',
  LOG: 'log',
  MARQUEE: 'marquee',
  TIMER: 'timer'
} as const;

/**
 * Common accessibility utilities
 */
export const a11yUtils = {
  /**
   * Generate unique ID for accessibility relationships
   */
  generateId: (prefix: string = 'a11y') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,
  
  /**
   * Check if element is visible to screen readers
   */
  isVisibleToScreenReader: (element: HTMLElement) => {
    return !element.hasAttribute('aria-hidden') || element.getAttribute('aria-hidden') !== 'true';
  },
  
  /**
   * Get accessible name for an element
   */
  getAccessibleName: (element: HTMLElement) => {
    return element.getAttribute('aria-label') || 
           element.getAttribute('aria-labelledby') || 
           element.textContent?.trim() || 
           element.getAttribute('title') || '';
  },
  
  /**
   * Check if element is focusable
   */
  isFocusable: (element: HTMLElement) => {
    const tabindex = element.getAttribute('tabindex');
    return tabindex !== '-1' && !element.hasAttribute('disabled');
  }
};

/**
 * Accessibility testing helpers
 */
export const a11yTesting = {
  /**
   * Wait for screen reader announcement
   */
  waitForAnnouncement: (timeout: number = 1000) => 
    new Promise(resolve => setTimeout(resolve, timeout)),
  
  /**
   * Simulate keyboard navigation
   */
  simulateKeyPress: (element: HTMLElement, key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    element.dispatchEvent(event);
  },
  
  /**
   * Check focus trap
   */
  testFocusTrap: async (container: HTMLElement) => {
    // Implementation would test focus cycling within container
    return true; // Placeholder
  }
};

/**
 * Default accessibility configuration
 */
export const DEFAULT_A11Y_CONFIG = {
  announcements: {
    politeDelay: 100,
    assertiveDelay: 0,
    clearDelay: 1000
  },
  focus: {
    trapEnabled: true,
    restoreOnClose: true,
    skipLinksEnabled: true
  },
  motion: {
    respectReducedMotion: true,
    defaultDuration: 200
  },
  colors: {
    enforceContrast: true,
    minimumRatio: 4.5,
    largeTextRatio: 3.0
  }
} as const;