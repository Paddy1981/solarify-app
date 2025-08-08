describe('Authentication - Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should display login form correctly', () => {
    cy.get('[data-testid="login-form"]').should('be.visible')
    cy.get('[data-testid="email-input"]').should('be.visible')
    cy.get('[data-testid="password-input"]').should('be.visible')
    cy.get('[data-testid="login-button"]').should('be.visible')
    cy.get('[data-testid="signup-link"]').should('be.visible')
  })

  it('should show validation errors for empty fields', () => {
    cy.get('[data-testid="login-button"]').click()
    
    cy.contains('Email is required').should('be.visible')
    cy.contains('Password is required').should('be.visible')
  })

  it('should show validation error for invalid email format', () => {
    cy.get('[data-testid="email-input"]').type('invalid-email')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()
    
    cy.contains('Please enter a valid email address').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid="email-input"]').type('wrong@email.com')
    cy.get('[data-testid="password-input"]').type('wrongpassword')
    cy.get('[data-testid="login-button"]').click()
    
    cy.contains('Invalid email or password').should('be.visible')
  })

  it('should successfully login homeowner and redirect to dashboard', () => {
    cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', {
      fixture: 'auth/homeowner-login-success.json'
    }).as('homeownerLogin')
    
    cy.get('[data-testid="email-input"]').type(Cypress.env('TEST_HOMEOWNER_EMAIL'))
    cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_HOMEOWNER_PASSWORD'))
    cy.get('[data-testid="login-button"]').click()
    
    cy.wait('@homeownerLogin')
    cy.url().should('include', '/homeowner/dashboard')
    cy.contains('Solar Performance Dashboard').should('be.visible')
  })

  it('should successfully login installer and redirect to dashboard', () => {
    cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', {
      fixture: 'auth/installer-login-success.json'
    }).as('installerLogin')
    
    cy.get('[data-testid="email-input"]').type(Cypress.env('TEST_INSTALLER_EMAIL'))
    cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_INSTALLER_PASSWORD'))
    cy.get('[data-testid="login-button"]').click()
    
    cy.wait('@installerLogin')
    cy.url().should('include', '/installer/dashboard')
    cy.contains('Installer Dashboard').should('be.visible')
  })

  it('should successfully login supplier and redirect to dashboard', () => {
    cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', {
      fixture: 'auth/supplier-login-success.json'
    }).as('supplierLogin')
    
    cy.get('[data-testid="email-input"]').type(Cypress.env('TEST_SUPPLIER_EMAIL'))
    cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_SUPPLIER_PASSWORD'))
    cy.get('[data-testid="login-button"]').click()
    
    cy.wait('@supplierLogin')
    cy.url().should('include', '/supplier/dashboard')
    cy.contains('Supplier Dashboard').should('be.visible')
  })

  it('should toggle password visibility', () => {
    cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password')
    cy.get('[data-testid="toggle-password-visibility"]').click()
    cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'text')
    cy.get('[data-testid="toggle-password-visibility"]').click()
    cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password')
  })

  it('should remember email input when page reloads', () => {
    const testEmail = 'test@example.com'
    cy.get('[data-testid="email-input"]').type(testEmail)
    cy.get('[data-testid="remember-me"]').check()
    
    cy.reload()
    
    cy.get('[data-testid="email-input"]').should('have.value', testEmail)
    cy.get('[data-testid="remember-me"]').should('be.checked')
  })

  it('should navigate to signup page', () => {
    cy.get('[data-testid="signup-link"]').click()
    cy.url().should('include', '/signup')
  })

  it('should navigate to forgot password page', () => {
    cy.get('[data-testid="forgot-password-link"]').click()
    cy.url().should('include', '/forgot-password')
  })

  it('should be accessible', () => {
    cy.testAccessibility()
  })

  it('should work on mobile devices', () => {
    cy.testResponsive(() => {
      cy.get('[data-testid="login-form"]').should('be.visible')
      cy.get('[data-testid="email-input"]').should('be.visible')
      cy.get('[data-testid="login-button"]').should('be.visible')
    })
  })

  it('should handle keyboard navigation', () => {
    cy.get('[data-testid="email-input"]').focus().should('have.focus')
    cy.get('[data-testid="email-input"]').type('{tab}')
    cy.get('[data-testid="password-input"]').should('have.focus')
    cy.get('[data-testid="password-input"]').type('{tab}')
    cy.get('[data-testid="remember-me"]').should('have.focus')
    cy.get('[data-testid="remember-me"]').type('{tab}')
    cy.get('[data-testid="login-button"]').should('have.focus')
  })

  it('should handle loading state during login', () => {
    // Simulate slow network
    cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', {
      delay: 2000,
      fixture: 'auth/homeowner-login-success.json'
    }).as('slowLogin')
    
    cy.get('[data-testid="email-input"]').type(Cypress.env('TEST_HOMEOWNER_EMAIL'))
    cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_HOMEOWNER_PASSWORD'))
    cy.get('[data-testid="login-button"]').click()
    
    // Should show loading state
    cy.get('[data-testid="login-button"]').should('be.disabled')
    cy.get('[data-testid="loading-spinner"]').should('be.visible')
    
    cy.wait('@slowLogin')
    cy.url().should('include', '/homeowner/dashboard')
  })
})