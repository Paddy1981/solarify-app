/**
 * Accessibility testing utilities test suite
 */

import { 
  performBasicAccessibilityChecks,
  auditAccessibility,
  checkWCAGCompliance,
  setupAccessibilityTesting
} from '../testing';

// Setup custom matchers
setupAccessibilityTesting();

describe('Accessibility Testing Utilities', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('performBasicAccessibilityChecks', () => {
    it('should detect missing alt text on images', () => {
      container.innerHTML = '<img src="test.jpg" />';
      
      const violations = performBasicAccessibilityChecks(container);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].id).toBe('image-alt');
      expect(violations[0].impact).toBe('critical');
    });

    it('should pass when images have alt text', () => {
      container.innerHTML = '<img src="test.jpg" alt="Test image" />';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const imageViolations = violations.filter(v => v.id === 'image-alt');
      expect(imageViolations).toHaveLength(0);
    });

    it('should detect form inputs without labels', () => {
      container.innerHTML = '<input type="text" />';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const labelViolations = violations.filter(v => v.id === 'label');
      expect(labelViolations).toHaveLength(1);
      expect(labelViolations[0].impact).toBe('critical');
    });

    it('should pass when form inputs have proper labels', () => {
      container.innerHTML = `
        <label for="test-input">Test Input</label>
        <input id="test-input" type="text" />
      `;
      
      const violations = performBasicAccessibilityChecks(container);
      
      const labelViolations = violations.filter(v => v.id === 'label');
      expect(labelViolations).toHaveLength(0);
    });

    it('should pass when form inputs have aria-label', () => {
      container.innerHTML = '<input type="text" aria-label="Test Input" />';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const labelViolations = violations.filter(v => v.id === 'label');
      expect(labelViolations).toHaveLength(0);
    });

    it('should detect buttons without accessible names', () => {
      container.innerHTML = '<button></button>';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const buttonViolations = violations.filter(v => v.id === 'button-name');
      expect(buttonViolations).toHaveLength(1);
      expect(buttonViolations[0].impact).toBe('critical');
    });

    it('should pass when buttons have text content', () => {
      container.innerHTML = '<button>Click me</button>';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const buttonViolations = violations.filter(v => v.id === 'button-name');
      expect(buttonViolations).toHaveLength(0);
    });

    it('should pass when buttons have aria-label', () => {
      container.innerHTML = '<button aria-label="Close dialog"></button>';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const buttonViolations = violations.filter(v => v.id === 'button-name');
      expect(buttonViolations).toHaveLength(0);
    });

    it('should detect missing h1 heading', () => {
      container.innerHTML = '<h2>Subheading</h2>';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const headingViolations = violations.filter(v => v.id === 'page-has-heading-one');
      expect(headingViolations).toHaveLength(1);
      expect(headingViolations[0].impact).toBe('moderate');
    });

    it('should pass when h1 heading is present', () => {
      container.innerHTML = '<h1>Main Heading</h1><h2>Subheading</h2>';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const headingViolations = violations.filter(v => v.id === 'page-has-heading-one');
      expect(headingViolations).toHaveLength(0);
    });

    it('should detect skipped heading levels', () => {
      container.innerHTML = '<h1>Main</h1><h3>Skipped H2</h3>';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const orderViolations = violations.filter(v => v.id === 'heading-order');
      expect(orderViolations).toHaveLength(1);
      expect(orderViolations[0].impact).toBe('moderate');
    });

    it('should detect links without accessible names', () => {
      container.innerHTML = '<a href="/test"></a>';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const linkViolations = violations.filter(v => v.id === 'link-name');
      expect(linkViolations).toHaveLength(1);
      expect(linkViolations[0].impact).toBe('serious');
    });

    it('should pass when links have text content', () => {
      container.innerHTML = '<a href="/test">Test Link</a>';
      
      const violations = performBasicAccessibilityChecks(container);
      
      const linkViolations = violations.filter(v => v.id === 'link-name');
      expect(linkViolations).toHaveLength(0);
    });
  });

  describe('auditAccessibility', () => {
    it('should return comprehensive audit results', () => {
      container.innerHTML = `
        <img src="test.jpg" />
        <input type="text" />
        <button></button>
      `;
      
      const results = auditAccessibility(container);
      
      expect(results.violations).toHaveLength(3); // img, input, button
      expect(results.violations.some(v => v.id === 'image-alt')).toBe(true);
      expect(results.violations.some(v => v.id === 'label')).toBe(true);
      expect(results.violations.some(v => v.id === 'button-name')).toBe(true);
    });

    it('should return no violations for accessible content', () => {
      container.innerHTML = `
        <h1>Main Heading</h1>
        <img src="test.jpg" alt="Test image" />
        <label for="test-input">Test Input</label>
        <input id="test-input" type="text" />
        <button>Click me</button>
        <a href="/test">Test Link</a>
      `;
      
      const results = auditAccessibility(container);
      
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('checkWCAGCompliance', () => {
    it('should check compliance with specific WCAG guidelines', () => {
      container.innerHTML = `
        <img src="test.jpg" />
        <input type="text" />
      `;
      
      const results = checkWCAGCompliance(container, ['1.1.1', '3.3.2']);
      
      expect(results).toHaveLength(2);
      
      const altTextResult = results.find(r => r.guideline.includes('1.1.1'));
      expect(altTextResult?.compliant).toBe(false);
      expect(altTextResult?.issues).toHaveLength(1);
      
      const labelResult = results.find(r => r.guideline.includes('3.3.2'));
      expect(labelResult?.compliant).toBe(false);
      expect(labelResult?.issues).toHaveLength(1);
    });

    it('should show compliance when guidelines are met', () => {
      container.innerHTML = `
        <img src="test.jpg" alt="Test image" />
        <label for="test-input">Test Input</label>
        <input id="test-input" type="text" />
      `;
      
      const results = checkWCAGCompliance(container, ['1.1.1', '3.3.2']);
      
      expect(results).toHaveLength(2);
      
      const altTextResult = results.find(r => r.guideline.includes('1.1.1'));
      expect(altTextResult?.compliant).toBe(true);
      expect(altTextResult?.issues).toHaveLength(0);
      
      const labelResult = results.find(r => r.guideline.includes('3.3.2'));
      expect(labelResult?.compliant).toBe(true);
      expect(labelResult?.issues).toHaveLength(0);
    });
  });

  describe('custom matchers', () => {
    it('should provide toHaveNoAccessibilityViolations matcher', () => {
      container.innerHTML = `
        <h1>Accessible Content</h1>
        <img src="test.jpg" alt="Test image" />
        <button>Click me</button>
      `;
      
      expect(container).toHaveNoAccessibilityViolations();
    });

    it('should fail when accessibility violations are present', () => {
      container.innerHTML = '<img src="test.jpg" />';
      
      expect(() => {
        expect(container).toHaveNoAccessibilityViolations();
      }).toThrow();
    });
  });
});