describe('Homeowner Dashboard', () => {
  beforeEach(() => {
    // Login as homeowner before each test
    cy.loginAsHomeowner()
    cy.waitForPageLoad()
  })

  it('should display dashboard with all key sections', () => {
    cy.contains('Solar Performance Dashboard').should('be.visible')
    
    // Check stats cards
    cy.get('[data-testid="stats-grid"]').should('be.visible')
    cy.contains('Current Generation').should('be.visible')
    cy.contains('Today\'s Energy').should('be.visible')
    cy.contains('Monthly Savings').should('be.visible')
    cy.contains('System Health').should('be.visible')
    
    // Check charts section
    cy.get('[data-testid="performance-chart"]').should('be.visible')
    cy.contains('Energy Generation Overview').should('be.visible')
    
    // Check environmental impact
    cy.get('[data-testid="environmental-impact"]').should('be.visible')
    
    // Check RFQ section
    cy.contains('My Requests for Quotation').should('be.visible')
    
    // Check notifications section
    cy.contains('Notifications & Alerts').should('be.visible')
  })

  it('should show correct system information when configured', () => {
    // Mock user with configured system
    cy.intercept('GET', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/users/*', {
      fixture: 'users/homeowner-with-system.json'
    }).as('getUserWithSystem')
    
    cy.reload()
    cy.wait('@getUserWithSystem')
    
    // Should show system size in dashboard description
    cy.contains('System Size: 8.5kWp').should('be.visible')
    
    // Stats should show actual values instead of "Setup System"
    cy.get('[data-testid="current-generation"]').should('not.contain', 'N/A (Setup System)')
  })

  it('should display RFQs when available', () => {
    // Mock RFQs data
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      fixture: 'rfqs/homeowner-rfqs.json'
    }).as('getRFQs')
    
    cy.reload()
    cy.wait('@getRFQs')
    
    // Should show RFQ cards
    cy.get('[data-testid="rfq-card"]').should('have.length.greaterThan', 0)
    cy.contains('Solar Panel Installation').should('be.visible')
    cy.contains('Status: Pending').should('be.visible')
  })

  it('should show empty state when no RFQs exist', () => {
    // Mock empty RFQs response
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      body: []
    }).as('getEmptyRFQs')
    
    cy.reload()
    cy.wait('@getEmptyRFQs')
    
    cy.contains('You haven\'t generated any RFQs yet').should('be.visible')
    cy.get('[data-testid="create-rfq-button"]').should('be.visible')
  })

  it('should navigate to create RFQ when button clicked', () => {
    // First ensure empty state
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      body: []
    }).as('getEmptyRFQs')
    
    cy.reload()
    cy.wait('@getEmptyRFQs')
    
    cy.get('[data-testid="create-rfq-button"]').click()
    cy.url().should('include', '/homeowner/rfq')
  })

  it('should display performance chart with data', () => {
    cy.get('[data-testid="performance-chart"]').should('be.visible')
    
    // Check for chart elements (assuming Recharts)
    cy.get('.recharts-wrapper').should('be.visible')
    cy.get('.recharts-cartesian-grid').should('be.visible')
  })

  it('should show environmental impact metrics', () => {
    cy.get('[data-testid="environmental-impact"]').within(() => {
      cy.contains('Environmental Impact').should('be.visible')
      cy.contains('CO₂ Saved').should('be.visible')
      cy.contains('Trees Equivalent').should('be.visible')
      cy.contains('Car Miles Avoided').should('be.visible')
    })
  })

  it('should display notifications with proper formatting', () => {
    cy.get('[data-testid="notifications-section"]').within(() => {
      cy.contains('Notifications & Alerts').should('be.visible')
      
      // Check for notification items
      cy.get('[data-testid="notification-item"]').should('have.length.greaterThan', 0)
      
      // Check notification structure
      cy.get('[data-testid="notification-item"]').first().within(() => {
        cy.get('[data-testid="notification-icon"]').should('be.visible')
        cy.get('[data-testid="notification-message"]').should('be.visible')
        cy.get('[data-testid="notification-timestamp"]').should('be.visible')
      })
    })
  })

  it('should navigate to all notifications page', () => {
    cy.get('[data-testid="view-all-notifications"]').click()
    cy.url().should('include', '/homeowner/notifications')
  })

  it('should show system setup form for new users', () => {
    // Mock user without system configuration
    cy.intercept('GET', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/users/*', {
      fixture: 'users/homeowner-without-system.json'
    }).as('getUserWithoutSystem')
    
    cy.visit('/homeowner/dashboard')
    cy.wait('@getUserWithoutSystem')
    
    // Should show system setup form instead of dashboard
    cy.contains('System Configuration').should('be.visible')
    cy.get('[data-testid="system-setup-form"]').should('be.visible')
  })

  it('should show solar journey choice for new users', () => {
    // Mock user without journey choice
    cy.intercept('GET', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/users/*', {
      fixture: 'users/homeowner-new.json'
    }).as('getNewUser')
    
    cy.visit('/homeowner/dashboard')
    cy.wait('@getNewUser')
    
    // Should show journey choice form
    cy.contains('Welcome to Your Solar Journey').should('be.visible')
    cy.get('[data-testid="existing-system-choice"]').should('be.visible')
    cy.get('[data-testid="new-to-solar-choice"]').should('be.visible')
  })

  it('should handle loading states gracefully', () => {
    // Simulate slow loading
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      delay: 2000,
      fixture: 'rfqs/homeowner-rfqs.json'
    }).as('getSlowRFQs')
    
    cy.reload()
    
    // Should show loading skeletons
    cy.get('[data-testid="rfq-skeleton"]').should('be.visible')
    
    cy.wait('@getSlowRFQs')
    
    // Loading should disappear and content should appear
    cy.get('[data-testid="rfq-skeleton"]').should('not.exist')
    cy.get('[data-testid="rfq-card"]').should('be.visible')
  })

  it('should be responsive on different screen sizes', () => {
    cy.testResponsive(() => {
      cy.contains('Solar Performance Dashboard').should('be.visible')
      cy.get('[data-testid="stats-grid"]').should('be.visible')
      cy.get('[data-testid="performance-chart"]').should('be.visible')
    })
  })

  it('should be accessible', () => {
    cy.testAccessibility()
  })

  it('should handle errors gracefully', () => {
    // Mock API error
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }).as('getErrorRFQs')
    
    cy.reload()
    cy.wait('@getErrorRFQs')
    
    // Should show error state or fallback content
    cy.contains('Unable to load').should('be.visible')
  })

  it('should update data when refreshed', () => {
    // Initial load
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      fixture: 'rfqs/homeowner-rfqs-initial.json'
    }).as('getInitialRFQs')
    
    cy.reload()
    cy.wait('@getInitialRFQs')
    cy.contains('Initial RFQ').should('be.visible')
    
    // Mock updated data
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      fixture: 'rfqs/homeowner-rfqs-updated.json'
    }).as('getUpdatedRFQs')
    
    cy.get('[data-testid="refresh-button"]').click()
    cy.wait('@getUpdatedRFQs')
    cy.contains('Updated RFQ').should('be.visible')
  })
})