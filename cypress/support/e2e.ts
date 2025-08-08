// Import commands.js using ES2015 syntax:
import './commands'
import '@cypress/code-coverage/support'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global before hook for E2E tests
beforeEach(() => {
  // Clear all cookies and local storage before each test
  cy.clearCookies()
  cy.clearLocalStorage()
  cy.clearAllSessionStorage()
  
  // Set viewport size
  cy.viewport(1280, 720)
  
  // Intercept Firebase Auth requests
  cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', {
    fixture: 'auth/signin-success.json'
  }).as('signIn')
  
  cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:signUp**', {
    fixture: 'auth/signup-success.json'
  }).as('signUp')
  
  // Intercept Firestore requests
  cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:batchGet', {
    fixture: 'firestore/batch-get-success.json'
  }).as('firestoreBatchGet')
  
  cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
    fixture: 'firestore/query-success.json'
  }).as('firestoreQuery')
})

// Custom assertion for accessibility
Cypress.Commands.add('checkA11y', (context?: string, options?: any) => {
  cy.injectAxe()
  cy.checkA11y(context, options)
})

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore ResizeObserver errors that don't affect functionality
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  
  // Ignore Firebase connection errors in test environment
  if (err.message.includes('Firebase')) {
    return false
  }
  
  // Let other errors fail the test
  return true
})