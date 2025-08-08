/**
 * Accessibility testing utilities for WCAG 2.1 AA compliance
 * Provides automated and manual testing helpers for accessibility
 */

import type { AccessibilityAuditResult, AccessibilityViolation } from './types';

/**
 * Mock axe-core functionality for when jest-axe is not available
 * In a real implementation, this would use the actual jest-axe library
 */

/**
 * Basic accessibility checks that can be performed without axe-core
 */
export function performBasicAccessibilityChecks(element: HTMLElement): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = [];

  // Check for missing alt text on images
  const images = element.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      violations.push({
        id: 'image-alt',
        impact: 'critical',
        tags: ['wcag2a', 'wcag111', 'section508'],
        description: 'Images must have alternate text',
        help: 'All img elements must have an alt attribute',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/image-alt',
        nodes: [{
          any: [],
          all: [],
          none: [],
          html: img.outerHTML,
          target: [`img:nth-child(${index + 1})`],
          failureSummary: 'Fix any of the following: Element does not have an alt attribute'
        }]
      });
    }
  });

  // Check for form inputs without labels
  const inputs = element.querySelectorAll('input:not([type="hidden"]), textarea, select');
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    
    let hasLabel = false;
    
    if (id) {
      const label = element.querySelector(`label[for="${id}"]`);
      hasLabel = !!label;
    }
    
    if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
      violations.push({
        id: 'label',
        impact: 'critical',
        tags: ['wcag2a', 'wcag412', 'section508'],
        description: 'Form elements must have labels',
        help: 'All form elements must have a label',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/label',
        nodes: [{
          any: [],
          all: [],
          none: [],
          html: input.outerHTML,
          target: [`${input.tagName.toLowerCase()}:nth-child(${index + 1})`],
          failureSummary: 'Fix any of the following: Form element does not have a label'
        }]
      });
    }
  });

  // Check for buttons without accessible names
  const buttons = element.querySelectorAll('button');
  buttons.forEach((button, index) => {
    const textContent = button.textContent?.trim();
    const ariaLabel = button.getAttribute('aria-label');
    const ariaLabelledBy = button.getAttribute('aria-labelledby');
    
    if (!textContent && !ariaLabel && !ariaLabelledBy) {
      violations.push({
        id: 'button-name',
        impact: 'critical',
        tags: ['wcag2a', 'wcag412', 'section508'],
        description: 'Buttons must have discernible text',
        help: 'All buttons must have an accessible name',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/button-name',
        nodes: [{
          any: [],
          all: [],
          none: [],
          html: button.outerHTML,
          target: [`button:nth-child(${index + 1})`],
          failureSummary: 'Fix any of the following: Button does not have accessible text'
        }]
      });
    }
  });

  // Check for missing heading structure
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  if (headings.length > 0) {
    const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
    
    // Check if h1 exists
    if (!headingLevels.includes(1)) {
      violations.push({
        id: 'page-has-heading-one',
        impact: 'moderate',
        tags: ['wcag2a', 'best-practice'],
        description: 'Page should contain a level-one heading',
        help: 'Page must contain a level-one heading',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/page-has-heading-one',
        nodes: [{
          any: [],
          all: [],
          none: [],
          html: element.outerHTML,
          target: ['html'],
          failureSummary: 'Page does not contain a level-one heading'
        }]
      });
    }

    // Check for skipped heading levels
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const prevLevel = headingLevels[i - 1];
      
      if (currentLevel > prevLevel + 1) {
        violations.push({
          id: 'heading-order',
          impact: 'moderate',
          tags: ['wcag2a', 'best-practice'],
          description: 'Heading levels should only increase by one',
          help: 'Headings should not skip levels',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/heading-order',
          nodes: [{
            any: [],
            all: [],
            none: [],
            html: headings[i].outerHTML,
            target: [`h${currentLevel}:nth-child(${i + 1})`],
            failureSummary: `Heading level ${currentLevel} follows heading level ${prevLevel}`
          }]
        });
      }
    }
  }

  // Check for links without accessible names
  const links = element.querySelectorAll('a[href]');
  links.forEach((link, index) => {
    const textContent = link.textContent?.trim();
    const ariaLabel = link.getAttribute('aria-label');
    const ariaLabelledBy = link.getAttribute('aria-labelledby');
    const title = link.getAttribute('title');
    
    if (!textContent && !ariaLabel && !ariaLabelledBy && !title) {
      violations.push({
        id: 'link-name',
        impact: 'serious',
        tags: ['wcag2a', 'wcag412', 'section508'],
        description: 'Links must have discernible text',
        help: 'All links must have an accessible name',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/link-name',
        nodes: [{
          any: [],
          all: [],
          none: [],
          html: link.outerHTML,
          target: [`a:nth-child(${index + 1})`],
          failureSummary: 'Fix any of the following: Link does not have accessible text'
        }]
      });
    }
  });

  return violations;
}

/**
 * Check color contrast programmatically (basic implementation)
 */
export function checkColorContrast(element: HTMLElement): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = [];
  
  // This is a simplified implementation
  // In practice, you'd use a proper color contrast checking library
  const elementsToCheck = element.querySelectorAll('*');
  
  elementsToCheck.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    const styles = window.getComputedStyle(htmlEl);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // Skip if no text content or transparent background
    if (!htmlEl.textContent?.trim() || backgroundColor === 'rgba(0, 0, 0, 0)') {
      return;
    }
    
    // This is a placeholder - in reality you'd use a proper contrast calculation
    // For now, we'll flag common problematic combinations
    if (color === 'rgb(128, 128, 128)' && backgroundColor === 'rgb(255, 255, 255)') {
      violations.push({
        id: 'color-contrast',
        impact: 'serious',
        tags: ['wcag2aa', 'wcag143'],
        description: 'Elements must have sufficient color contrast',
        help: 'All text must have a contrast ratio of at least 4.5:1',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/color-contrast',
        nodes: [{
          any: [],
          all: [],
          none: [],
          html: htmlEl.outerHTML,
          target: [`*:nth-child(${index + 1})`],
          failureSummary: 'Element has insufficient color contrast'
        }]
      });
    }
  });
  
  return violations;
}

/**
 * Comprehensive accessibility audit function
 */
export function auditAccessibility(element: HTMLElement): AccessibilityAuditResult {
  const basicViolations = performBasicAccessibilityChecks(element);
  const contrastViolations = checkColorContrast(element);
  
  const allViolations = [...basicViolations, ...contrastViolations];
  
  return {
    violations: allViolations,
    passes: [], // Would be populated by actual axe-core
    incomplete: [], // Would be populated by actual axe-core
    inapplicable: [] // Would be populated by actual axe-core
  };
}

/**
 * Test helper for React Testing Library
 */
export function toHaveNoAccessibilityViolations(received: HTMLElement) {
  const result = auditAccessibility(received);
  const violations = result.violations;
  
  const pass = violations.length === 0;
  
  if (pass) {
    return {
      message: () => `Expected element to have accessibility violations, but none were found`,
      pass: true
    };
  } else {
    const violationMessages = violations.map(v => 
      `${v.id}: ${v.description} (${v.impact})`
    ).join('\n');
    
    return {
      message: () => `Expected element to have no accessibility violations, but found:\n${violationMessages}`,
      pass: false
    };
  }
}

// Extend Jest matchers if available
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoAccessibilityViolations(): R;
    }
  }
}

/**
 * Setup function to add custom matchers
 */
export function setupAccessibilityTesting() {
  if (typeof expect !== 'undefined' && expect.extend) {
    expect.extend({
      toHaveNoAccessibilityViolations
    });
  }
}

/**
 * Generate accessibility report
 */
export function generateAccessibilityReport(results: AccessibilityAuditResult): string {
  let report = 'Accessibility Audit Report\n';
  report += '==========================\n\n';
  
  const { violations, passes, incomplete } = results;
  
  if (violations.length > 0) {
    report += `VIOLATIONS (${violations.length}):\n`;
    violations.forEach((violation, index) => {
      report += `${index + 1}. ${violation.id} (${violation.impact})\n`;
      report += `   ${violation.description}\n`;
      report += `   Help: ${violation.help}\n`;
      report += `   Affected elements: ${violation.nodes.length}\n\n`;
    });
  } else {
    report += 'No accessibility violations found!\n\n';
  }
  
  if (passes.length > 0) {
    report += `PASSED CHECKS (${passes.length}):\n`;
    passes.forEach(pass => {
      report += `- ${pass.id}: ${pass.description}\n`;
    });
    report += '\n';
  }
  
  if (incomplete.length > 0) {
    report += `INCOMPLETE/MANUAL CHECKS (${incomplete.length}):\n`;
    incomplete.forEach(item => {
      report += `- ${item.id}: ${item.description}\n`;
    });
    report += '\n';
  }
  
  return report;
}

/**
 * WCAG Guidelines checker
 */
export interface WCAGGuideline {
  level: 'A' | 'AA' | 'AAA';
  principle: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';
  guideline: string;
  successCriteria: string;
  techniques: string[];
}

export const WCAG_GUIDELINES: Record<string, WCAGGuideline> = {
  '1.1.1': {
    level: 'A',
    principle: 'Perceivable',
    guideline: '1.1 Text Alternatives',
    successCriteria: 'Non-text Content',
    techniques: ['Providing alt text for images', 'Using aria-label for complex images']
  },
  '1.4.3': {
    level: 'AA',
    principle: 'Perceivable',
    guideline: '1.4 Distinguishable',
    successCriteria: 'Contrast (Minimum)',
    techniques: ['Ensuring 4.5:1 contrast ratio for normal text', 'Ensuring 3:1 contrast ratio for large text']
  },
  '2.1.1': {
    level: 'A',
    principle: 'Operable',
    guideline: '2.1 Keyboard Accessible',
    successCriteria: 'Keyboard',
    techniques: ['Making all functionality keyboard accessible', 'Providing keyboard alternatives for mouse interactions']
  },
  '2.4.3': {
    level: 'A',
    principle: 'Operable',
    guideline: '2.4 Navigable',
    successCriteria: 'Focus Order',
    techniques: ['Ensuring logical focus order', 'Using tabindex appropriately']
  },
  '3.3.2': {
    level: 'A',
    principle: 'Understandable',
    guideline: '3.3 Input Assistance',
    successCriteria: 'Labels or Instructions',
    techniques: ['Providing labels for form controls', 'Using aria-describedby for additional instructions']
  },
  '4.1.2': {
    level: 'A',
    principle: 'Robust',
    guideline: '4.1 Compatible',
    successCriteria: 'Name, Role, Value',
    techniques: ['Using semantic HTML', 'Providing proper ARIA attributes']
  }
};

/**
 * Check compliance with specific WCAG guidelines
 */
export function checkWCAGCompliance(
  element: HTMLElement, 
  guidelines: string[] = ['1.1.1', '1.4.3', '2.1.1', '2.4.3', '3.3.2', '4.1.2']
): { guideline: string; compliant: boolean; issues: string[] }[] {
  const results = [];
  
  for (const guidelineId of guidelines) {
    const guideline = WCAG_GUIDELINES[guidelineId];
    if (!guideline) continue;
    
    const issues: string[] = [];
    let compliant = true;
    
    // Simplified compliance checking based on guideline
    switch (guidelineId) {
      case '1.1.1':
        const images = element.querySelectorAll('img');
        images.forEach(img => {
          if (!img.hasAttribute('alt')) {
            issues.push(`Image missing alt text: ${img.outerHTML.substring(0, 50)}...`);
            compliant = false;
          }
        });
        break;
        
      case '2.1.1':
        const interactiveElements = element.querySelectorAll('button, a, input, select, textarea');
        interactiveElements.forEach(el => {
          if (el.hasAttribute('tabindex') && el.getAttribute('tabindex') === '-1') {
            // Check if element has alternative keyboard access
            const hasKeyHandler = el.hasAttribute('onkeydown') || el.hasAttribute('onkeyup');
            if (!hasKeyHandler) {
              issues.push(`Interactive element not keyboard accessible: ${el.tagName}`);
              compliant = false;
            }
          }
        });
        break;
        
      case '3.3.2':
        const formControls = element.querySelectorAll('input:not([type="hidden"]), textarea, select');
        formControls.forEach(control => {
          const id = control.getAttribute('id');
          const ariaLabel = control.getAttribute('aria-label');
          const label = id ? element.querySelector(`label[for="${id}"]`) : null;
          
          if (!label && !ariaLabel) {
            issues.push(`Form control missing label: ${control.tagName}`);
            compliant = false;
          }
        });
        break;
        
      case '4.1.2':
        const customElements = element.querySelectorAll('[role]');
        customElements.forEach(el => {
          const role = el.getAttribute('role');
          if (role === 'button' && !el.hasAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Custom button missing accessible name`);
            compliant = false;
          }
        });
        break;
    }
    
    results.push({
      guideline: `${guidelineId}: ${guideline.successCriteria}`,
      compliant,
      issues
    });
  }
  
  return results;
}