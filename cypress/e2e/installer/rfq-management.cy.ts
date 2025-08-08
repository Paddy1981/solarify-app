describe('Installer - RFQ Management Flow', () => {
  beforeEach(() => {
    cy.loginAsInstaller()
    cy.visit('/installer/rfqs')
    cy.waitForPageLoad()
  })

  it('should display list of available RFQs', () => {
    // Mock RFQs assigned to installer
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      fixture: 'rfqs/installer-rfqs.json'
    }).as('getInstallerRFQs')

    cy.reload()
    cy.wait('@getInstallerRFQs')

    cy.get('[data-testid="rfq-list"]').should('be.visible')
    cy.get('[data-testid="rfq-card"]').should('have.length.greaterThan', 0)

    // Check RFQ card content
    cy.get('[data-testid="rfq-card"]').first().within(() => {
      cy.get('[data-testid="rfq-title"]').should('be.visible')
      cy.get('[data-testid="rfq-budget"]').should('be.visible')
      cy.get('[data-testid="rfq-location"]').should('be.visible')
      cy.get('[data-testid="rfq-timeline"]').should('be.visible')
      cy.get('[data-testid="rfq-status"]').should('be.visible')
    })
  })

  it('should filter RFQs by status', () => {
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      fixture: 'rfqs/installer-rfqs-filtered.json'
    }).as('getFilteredRFQs')

    cy.get('[data-testid="status-filter"]').select('Pending')
    cy.wait('@getFilteredRFQs')

    cy.get('[data-testid="rfq-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="rfq-status"]').should('contain', 'Pending')
    })
  })

  it('should sort RFQs by different criteria', () => {
    cy.get('[data-testid="sort-select"]').select('Budget (High to Low)')
    
    // Check that RFQs are sorted by budget descending
    cy.get('[data-testid="rfq-budget"]').then(($budgets) => {
      const budgets = Array.from($budgets).map(el => 
        parseInt(el.textContent.replace(/[^\d]/g, ''))
      )
      
      // Verify descending order
      for (let i = 0; i < budgets.length - 1; i++) {
        expect(budgets[i]).to.be.greaterThan(budgets[i + 1])
      }
    })
  })

  it('should view detailed RFQ information', () => {
    cy.get('[data-testid="rfq-card"]').first().click()
    
    // Should navigate to RFQ detail page
    cy.url().should('match', /\/installer\/rfqs\/[^\/]+$/)
    
    // Should show detailed RFQ information
    cy.get('[data-testid="rfq-details"]').should('be.visible')
    cy.get('[data-testid="property-details"]').should('be.visible')
    cy.get('[data-testid="homeowner-info"]').should('be.visible')
    cy.get('[data-testid="requirements"]').should('be.visible')
    
    // Should show action buttons
    cy.get('[data-testid="generate-quote"]').should('be.visible')
    cy.get('[data-testid="contact-homeowner"]').should('be.visible')
    cy.get('[data-testid="decline-rfq"]').should('be.visible')
  })

  it('should generate quote for RFQ', () => {
    // Navigate to RFQ detail
    cy.get('[data-testid="rfq-card"]').first().click()
    cy.get('[data-testid="generate-quote"]').click()
    
    // Should navigate to quote generation page
    cy.url().should('include', '/generate-quote')
    
    // Quote form should be visible
    cy.get('[data-testid="quote-form"]').should('be.visible')
    cy.get('[data-testid="system-design"]').should('be.visible')
    cy.get('[data-testid="pricing"]').should('be.visible')
    cy.get('[data-testid="timeline"]').should('be.visible')
  })

  it('should complete quote generation workflow', () => {
    // Mock quote creation
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/quotes', {
      statusCode: 200,
      body: {
        name: 'projects/test/databases/(default)/documents/quotes/new-quote-123',
        fields: {
          id: { stringValue: 'new-quote-123' },
          rfqId: { stringValue: 'rfq-123' },
          status: { stringValue: 'Submitted' }
        }
      }
    }).as('createQuote')

    // Navigate to quote generation
    cy.get('[data-testid="rfq-card"]').first().click()
    cy.get('[data-testid="generate-quote"]').click()

    // Fill quote form
    cy.get('[data-testid="system-size"]').type('8.5')
    cy.get('[data-testid="panel-count"]').type('24')
    cy.get('[data-testid="panel-type"]').select('Monocrystalline')
    cy.get('[data-testid="inverter-type"]').select('String Inverter')
    
    // Pricing information
    cy.get('[data-testid="equipment-cost"]').type('12000')
    cy.get('[data-testid="installation-cost"]').type('3000')
    cy.get('[data-testid="permit-cost"]').type('500')
    cy.get('[data-testid="total-cost"]').should('contain', '$15,500')
    
    // Timeline
    cy.get('[data-testid="installation-timeline"]').select('4-6 weeks')
    cy.get('[data-testid="completion-date"]').type('2024-03-15')
    
    // Additional notes
    cy.get('[data-testid="quote-notes"]').type('High-efficiency panels with 25-year warranty included.')
    
    // Submit quote
    cy.get('[data-testid="submit-quote"]').click()
    
    cy.wait('@createQuote')
    
    // Should show success message
    cy.contains('Quote submitted successfully').should('be.visible')
    cy.url().should('include', '/installer/rfqs')
  })

  it('should contact homeowner through platform', () => {
    cy.get('[data-testid="rfq-card"]').first().click()
    cy.get('[data-testid="contact-homeowner"]').click()
    
    // Contact modal should open
    cy.get('[data-testid="contact-modal"]').should('be.visible')
    cy.get('[data-testid="message-input"]').should('be.visible')
    cy.get('[data-testid="send-message"]').should('be.visible')
    
    // Send message
    cy.get('[data-testid="message-input"]').type('Hi! I have reviewed your RFQ and would like to discuss your solar project. When would be a good time to schedule a consultation?')
    cy.get('[data-testid="send-message"]').click()
    
    cy.contains('Message sent successfully').should('be.visible')
    cy.get('[data-testid="contact-modal"]').should('not.exist')
  })

  it('should decline RFQ with reason', () => {
    cy.get('[data-testid="rfq-card"]').first().click()
    cy.get('[data-testid="decline-rfq"]').click()
    
    // Decline modal should open
    cy.get('[data-testid="decline-modal"]').should('be.visible')
    cy.get('[data-testid="decline-reason"]').should('be.visible')
    
    // Select decline reason
    cy.get('[data-testid="decline-reason"]').select('Outside service area')
    cy.get('[data-testid="decline-notes"]').type('Unfortunately, we do not currently service this location.')
    
    cy.get('[data-testid="confirm-decline"]').click()
    
    cy.contains('RFQ declined').should('be.visible')
    
    // RFQ should be removed from list or marked as declined
    cy.get('[data-testid="rfq-card"]').first().should('not.contain', 'Pending')
  })

  it('should track quote status and responses', () => {
    cy.visit('/installer/quotes')
    
    // Should show quotes list
    cy.get('[data-testid="quotes-list"]').should('be.visible')
    cy.get('[data-testid="quote-card"]').should('have.length.greaterThan', 0)
    
    cy.get('[data-testid="quote-card"]').first().within(() => {
      cy.get('[data-testid="quote-status"]').should('be.visible')
      cy.get('[data-testid="quote-amount"]').should('be.visible')
      cy.get('[data-testid="submission-date"]').should('be.visible')
    })
  })

  it('should update quote after homeowner feedback', () => {
    cy.visit('/installer/quotes')
    cy.get('[data-testid="quote-card"]').first().click()
    
    // Should show quote details
    cy.get('[data-testid="quote-details"]').should('be.visible')
    
    // If homeowner requested changes
    cy.get('[data-testid="homeowner-feedback"]').should('be.visible')
    cy.get('[data-testid="update-quote"]').click()
    
    // Should allow quote modification
    cy.get('[data-testid="quote-form"]').should('be.visible')
    cy.get('[data-testid="equipment-cost"]').clear().type('11500')
    cy.get('[data-testid="update-reason"]').type('Adjusted pricing based on homeowner feedback')
    
    cy.get('[data-testid="submit-updated-quote"]').click()
    
    cy.contains('Quote updated successfully').should('be.visible')
  })

  it('should handle RFQ search and filtering', () => {
    // Search by location
    cy.get('[data-testid="search-input"]').type('San Francisco')
    cy.get('[data-testid="search-button"]').click()
    
    cy.get('[data-testid="rfq-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="rfq-location"]').should('contain', 'San Francisco')
    })
    
    // Clear search
    cy.get('[data-testid="clear-search"]').click()
    cy.get('[data-testid="search-input"]').should('have.value', '')
    
    // Filter by budget range
    cy.get('[data-testid="budget-min"]').type('10000')
    cy.get('[data-testid="budget-max"]').type('20000')
    cy.get('[data-testid="apply-filters"]').click()
    
    cy.get('[data-testid="rfq-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="rfq-budget"]').then(($budget) => {
        const budget = parseInt($budget.text().replace(/[^\d]/g, ''))
        expect(budget).to.be.within(10000, 20000)
      })
    })
  })

  it('should show portfolio and credentials to build trust', () => {
    cy.get('[data-testid="rfq-card"]').first().click()
    
    // Should show installer profile/credentials
    cy.get('[data-testid="installer-profile"]').should('be.visible')
    cy.get('[data-testid="certifications"]').should('be.visible')
    cy.get('[data-testid="portfolio-preview"]').should('be.visible')
    cy.get('[data-testid="customer-reviews"]').should('be.visible')
    
    // Should link to full portfolio
    cy.get('[data-testid="view-full-portfolio"]').click()
    cy.url().should('include', '/installer/portfolio')
  })

  it('should handle errors gracefully', () => {
    // Mock API error
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('getRFQsError')

    cy.reload()
    cy.wait('@getRFQsError')

    // Should show error state
    cy.contains('Unable to load RFQs').should('be.visible')
    cy.get('[data-testid="retry-button"]').should('be.visible')

    // Should retry on button click
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      fixture: 'rfqs/installer-rfqs.json'
    }).as('getRFQsRetry')

    cy.get('[data-testid="retry-button"]').click()
    cy.wait('@getRFQsRetry')

    cy.get('[data-testid="rfq-list"]').should('be.visible')
  })

  it('should be responsive on mobile devices', () => {
    cy.testResponsive(() => {
      cy.get('[data-testid="rfq-list"]').should('be.visible')
      cy.get('[data-testid="rfq-card"]').should('be.visible')
      
      // Mobile-specific UI elements
      cy.get('[data-testid="mobile-filters-toggle"]').should('be.visible')
      cy.get('[data-testid="mobile-sort"]').should('be.visible')
    })
  })

  it('should be accessible', () => {
    cy.testAccessibility()
    
    // Check keyboard navigation
    cy.get('[data-testid="rfq-card"]').first().focus().should('have.focus')
    cy.get('[data-testid="rfq-card"]').first().type('{enter}')
    
    // Should navigate to RFQ details
    cy.url().should('match', /\/installer\/rfqs\/[^\/]+$/)
  })

  it('should track installer performance metrics', () => {
    cy.visit('/installer/analytics')
    
    // Should show performance dashboard
    cy.get('[data-testid="performance-metrics"]').should('be.visible')
    cy.get('[data-testid="rfqs-received"]').should('be.visible')
    cy.get('[data-testid="quotes-submitted"]').should('be.visible')
    cy.get('[data-testid="conversion-rate"]').should('be.visible')
    cy.get('[data-testid="average-quote-time"]').should('be.visible')
  })
})