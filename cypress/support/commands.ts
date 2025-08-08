/// <reference types="cypress" />

import 'cypress-axe'

// Custom command for logging in users
Cypress.Commands.add('loginAsHomeowner', () => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(Cypress.env('TEST_HOMEOWNER_EMAIL'))
  cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_HOMEOWNER_PASSWORD'))
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('include', '/homeowner/dashboard')
})

Cypress.Commands.add('loginAsInstaller', () => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(Cypress.env('TEST_INSTALLER_EMAIL'))
  cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_INSTALLER_PASSWORD'))
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('include', '/installer/dashboard')
})

Cypress.Commands.add('loginAsSupplier', () => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(Cypress.env('TEST_SUPPLIER_EMAIL'))
  cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_SUPPLIER_PASSWORD'))
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('include', '/supplier/dashboard')
})

// Custom command for creating test data
Cypress.Commands.add('createTestRFQ', (rfqData = {}) => {
  const defaultRFQ = {
    title: 'Test Solar Installation',
    description: 'Need solar panels for 2000 sq ft home',
    budget: 15000,
    location: 'San Francisco, CA',
    ...rfqData
  }
  
  cy.loginAsHomeowner()
  cy.visit('/homeowner/rfq')
  cy.get('[data-testid="rfq-title"]').type(defaultRFQ.title)
  cy.get('[data-testid="rfq-description"]').type(defaultRFQ.description)
  cy.get('[data-testid="rfq-budget"]').type(defaultRFQ.budget.toString())
  cy.get('[data-testid="rfq-location"]').type(defaultRFQ.location)
  cy.get('[data-testid="submit-rfq"]').click()
  cy.contains('RFQ created successfully').should('be.visible')
})

// Custom command for waiting for Firebase operations
Cypress.Commands.add('waitForFirebase', () => {
  // Wait for Firebase Auth to initialize
  cy.window().its('firebase').should('exist')
  cy.wait(1000) // Allow Firebase to settle
})

// Custom command for checking loading states
Cypress.Commands.add('waitForPageLoad', () => {
  // Wait for any loading spinners to disappear
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist')
  cy.get('[data-testid="skeleton"]', { timeout: 10000 }).should('not.exist')
})

// Custom command for form validation testing
Cypress.Commands.add('testFormValidation', (formSelector: string, validationTests: Array<{field: string, value: string, error: string}>) => {
  validationTests.forEach(({ field, value, error }) => {
    cy.get(`${formSelector} [data-testid="${field}"]`).clear().type(value)
    cy.get(`${formSelector} [data-testid="submit-button"]`).click()
    cy.contains(error).should('be.visible')
  })
})

// Custom command for accessibility testing
Cypress.Commands.add('testAccessibility', () => {
  cy.injectAxe()
  cy.checkA11y(undefined, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true },
    }
  })
})

// Custom command for responsive testing
Cypress.Commands.add('testResponsive', (callback: () => void) => {
  const viewports = [
    { width: 375, height: 667 }, // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1280, height: 720 }, // Desktop
  ]
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height)
    callback()
  })
})

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsHomeowner(): Chainable<void>
      loginAsInstaller(): Chainable<void>
      loginAsSupplier(): Chainable<void>
      createTestRFQ(rfqData?: object): Chainable<void>
      waitForFirebase(): Chainable<void>
      waitForPageLoad(): Chainable<void>
      testFormValidation(formSelector: string, validationTests: Array<{field: string, value: string, error: string}>): Chainable<void>
      testAccessibility(): Chainable<void>
      testResponsive(callback: () => void): Chainable<void>
      checkA11y(context?: string, options?: any): Chainable<void>
    }
  }
}