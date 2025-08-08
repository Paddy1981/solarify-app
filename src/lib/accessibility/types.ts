/**
 * Accessibility types and interfaces for WCAG 2.1 AA compliance
 */

export interface AccessibilityContextValue {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  prefersReducedMotion: boolean;
  focusFirstElement: (container: HTMLElement) => void;
  focusLastElement: (container: HTMLElement) => void;
  trapFocus: (container: HTMLElement) => () => void;
  skipToContent: () => void;
}

export interface FocusTrapOptions {
  initialFocus?: HTMLElement | (() => HTMLElement);
  fallbackFocus?: HTMLElement | (() => HTMLElement);
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
  returnFocusOnDeactivate?: boolean;
}

export interface ScreenReaderAnnouncementOptions {
  priority?: 'polite' | 'assertive';
  clear?: boolean;
}

export interface ColorContrastResult {
  ratio: number;
  passes: {
    AA: boolean;
    AAA: boolean;
    AAlarge: boolean;
    AAAlarge: boolean;
  };
  grade: 'A' | 'AA' | 'AAA' | 'Fail';
}

export type AriaRole = 
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'dialog'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'textbox'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';

export interface AccessibilityAuditResult {
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  incomplete: AccessibilityIncomplete[];
  inapplicable: AccessibilityInapplicable[];
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityPass {
  id: string;
  impact: string | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityIncomplete {
  id: string;
  impact: string | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityInapplicable {
  id: string;
  impact: string | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
}

export interface AccessibilityNode {
  any: AccessibilityCheck[];
  all: AccessibilityCheck[];
  none: AccessibilityCheck[];
  html: string;
  target: string[];
  failureSummary?: string;
}

export interface AccessibilityCheck {
  id: string;
  impact: string;
  message: string;
  data: any;
  relatedNodes: AccessibilityRelatedNode[];
}

export interface AccessibilityRelatedNode {
  target: string[];
  html: string;
}