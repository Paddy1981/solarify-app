describe('Complete Solar Marketplace Journey', () => {
  // This test covers the full end-to-end user journey from homeowner RFQ creation
  // to installer quote generation to supplier product purchase
  
  it('should complete full solar marketplace workflow', () => {
    // Step 1: Homeowner creates RFQ
    cy.log('🏠 HOMEOWNER: Creating RFQ')
    cy.loginAsHomeowner()
    cy.visit('/homeowner/rfq')
    
    // Create comprehensive RFQ
    cy.get('[data-testid="rfq-title"]').type('Complete Solar Installation - 3 bedroom home')
    cy.get('[data-testid="rfq-description"]').type('Looking for complete solar solution including panels, inverter, and installation. Home gets good sun exposure, south-facing roof.')
    cy.get('[data-testid="rfq-budget"]').type('18000')
    cy.get('[data-testid="rfq-timeline"]').select('3-6 months')
    
    cy.get('[data-testid="property-address"]').type('456 Solar Street, Berkeley, CA 94704')
    cy.get('[data-testid="property-type"]').select('Single Family Home')
    cy.get('[data-testid="roof-type"]').select('Asphalt Shingles')
    cy.get('[data-testid="electricity-usage"]').type('900')
    cy.get('[data-testid="system-size-preference"]').select('8-10 kW')
    cy.get('[data-testid="panel-type-preference"]').select('Monocrystalline')
    
    // Mock RFQ creation
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/rfqs', {
      statusCode: 200,
      body: {
        name: 'projects/test/databases/(default)/documents/rfqs/journey-rfq-123',
        fields: {
          id: { stringValue: 'journey-rfq-123' },
          title: { stringValue: 'Complete Solar Installation - 3 bedroom home' },
          status: { stringValue: 'Pending' },
          homeownerId: { stringValue: 'test-homeowner-uid' }
        }
      }
    }).as('createJourneyRFQ')
    
    cy.get('[data-testid="submit-rfq"]').click()
    cy.wait('@createJourneyRFQ')
    
    cy.contains('RFQ created successfully').should('be.visible')
    cy.url().should('include', '/homeowner/rfqs')
    
    // Step 2: Switch to installer view and respond to RFQ
    cy.log('🔧 INSTALLER: Reviewing and responding to RFQ')
    cy.loginAsInstaller()
    cy.visit('/installer/rfqs')
    
    // Mock installer RFQs including the one just created
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      body: [{
        document: {
          name: 'projects/test/databases/(default)/documents/rfqs/journey-rfq-123',
          fields: {
            id: { stringValue: 'journey-rfq-123' },
            title: { stringValue: 'Complete Solar Installation - 3 bedroom home' },
            description: { stringValue: 'Looking for complete solar solution including panels, inverter, and installation.' },
            budget: { doubleValue: 18000 },
            status: { stringValue: 'Pending' },
            homeownerId: { stringValue: 'test-homeowner-uid' },
            selectedInstallerIds: { 
              arrayValue: { 
                values: [{ stringValue: 'test-installer-uid' }]
              }
            }
          }
        }
      }]
    }).as('getInstallerRFQs')
    
    cy.wait('@getInstallerRFQs')
    
    // Review and generate quote
    cy.get('[data-testid="rfq-card"]').first().click()
    cy.get('[data-testid="generate-quote"]').click()
    
    // Fill comprehensive quote
    cy.get('[data-testid="system-size"]').type('9.2')
    cy.get('[data-testid="panel-count"]').type('23')
    cy.get('[data-testid="panel-type"]').select('Monocrystalline')
    cy.get('[data-testid="inverter-type"]').select('String Inverter')
    
    cy.get('[data-testid="equipment-cost"]').type('14500')
    cy.get('[data-testid="installation-cost"]').type('3200')
    cy.get('[data-testid="permit-cost"]').type('300')
    // Total should calculate to $18,000
    
    cy.get('[data-testid="installation-timeline"]').select('6-8 weeks')
    cy.get('[data-testid="completion-date"]').type('2024-04-15')
    
    cy.get('[data-testid="quote-notes"]').type('Premium monocrystalline panels with 25-year warranty. Professional installation with post-installation monitoring setup.')
    
    // Mock quote creation
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/quotes', {
      statusCode: 200,
      body: {
        name: 'projects/test/databases/(default)/documents/quotes/journey-quote-123',
        fields: {
          id: { stringValue: 'journey-quote-123' },
          rfqId: { stringValue: 'journey-rfq-123' },
          installerId: { stringValue: 'test-installer-uid' },
          totalCost: { doubleValue: 18000 },
          status: { stringValue: 'Submitted' }
        }
      }
    }).as('createJourneyQuote')
    
    cy.get('[data-testid="submit-quote"]').click()
    cy.wait('@createJourneyQuote')
    
    cy.contains('Quote submitted successfully').should('be.visible')
    
    // Step 3: Homeowner reviews and accepts quote
    cy.log('🏠 HOMEOWNER: Reviewing and accepting quote')
    cy.loginAsHomeowner()
    cy.visit('/homeowner/quotes')
    
    // Mock homeowner quotes
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      body: [{
        document: {
          name: 'projects/test/databases/(default)/documents/quotes/journey-quote-123',
          fields: {
            id: { stringValue: 'journey-quote-123' },
            rfqId: { stringValue: 'journey-rfq-123' },
            installerId: { stringValue: 'test-installer-uid' },
            installerName: { stringValue: 'SolarTech Solutions' },
            totalCost: { doubleValue: 18000 },
            systemSize: { doubleValue: 9.2 },
            panelCount: { integerValue: 23 },
            status: { stringValue: 'Submitted' },
            submittedAt: { timestampValue: '2024-01-20T10:00:00Z' }
          }
        }
      }]
    }).as('getHomeownerQuotes')
    
    cy.wait('@getHomeownerQuotes')
    
    // Review quote details
    cy.get('[data-testid="quote-card"]').first().click()
    cy.get('[data-testid="quote-details"]').should('be.visible')
    cy.contains('$18,000').should('be.visible')
    cy.contains('9.2 kW').should('be.visible')
    cy.contains('23 panels').should('be.visible')
    
    // Accept quote
    cy.get('[data-testid="accept-quote"]').click()
    cy.get('[data-testid="acceptance-terms"]').check()
    cy.get('[data-testid="confirm-acceptance"]').click()
    
    cy.contains('Quote accepted successfully').should('be.visible')
    
    // Step 4: Installer begins procurement from supplier
    cy.log('🔧 INSTALLER: Sourcing materials from supplier')
    cy.loginAsInstaller()
    cy.visit('/installer/dashboard')
    
    // Navigate to equipment sourcing
    cy.contains('Source Equipment').click()
    cy.url().should('include', '/installer/sourcing')
    
    // Search for required equipment
    cy.get('[data-testid="equipment-search"]').type('400W solar panel')
    cy.get('[data-testid="search-button"]').click()
    
    // Mock product search results
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      fixture: 'products/supplier-products.json'
    }).as('searchProducts')
    
    cy.wait('@searchProducts')
    
    // Select products for quote
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="add-to-cart"]').click()
    })
    
    cy.get('[data-testid="quantity-selector"]').clear().type('23') // 23 panels needed
    cy.get('[data-testid="confirm-quantity"]').click()
    
    // Add inverter to cart
    cy.get('[data-testid="equipment-search"]').clear().type('5000W inverter')
    cy.get('[data-testid="search-button"]').click()
    
    cy.get('[data-testid="product-card"]').contains('5000W').within(() => {
      cy.get('[data-testid="add-to-cart"]').click()
    })
    
    // Proceed to checkout
    cy.get('[data-testid="view-cart"]').click()
    cy.get('[data-testid="cart-summary"]').should('be.visible')
    
    // Request quote from supplier
    cy.get('[data-testid="request-quote"]').click()
    cy.get('[data-testid="project-details"]').type('Residential solar installation for accepted homeowner RFQ. Need competitive pricing for bulk order.')
    cy.get('[data-testid="delivery-date"]').type('2024-02-15')
    cy.get('[data-testid="submit-quote-request"]').click()
    
    cy.contains('Quote request sent to supplier').should('be.visible')
    
    // Step 5: Supplier processes equipment order
    cy.log('🏪 SUPPLIER: Processing equipment order')
    cy.loginAsSupplier()
    cy.visit('/supplier/orders')
    
    // Mock supplier orders/quote requests
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      body: [{
        document: {
          name: 'projects/test/databases/(default)/documents/quoteRequests/journey-quote-req-123',
          fields: {
            id: { stringValue: 'journey-quote-req-123' },
            installerId: { stringValue: 'test-installer-uid' },
            installerName: { stringValue: 'SolarTech Solutions' },
            items: {
              arrayValue: {
                values: [
                  {
                    mapValue: {
                      fields: {
                        productName: { stringValue: 'SolarMax Pro 400W Panel' },
                        quantity: { integerValue: 23 },
                        unitPrice: { doubleValue: 299.99 }
                      }
                    }
                  },
                  {
                    mapValue: {
                      fields: {
                        productName: { stringValue: 'EcoString 5000W Inverter' },
                        quantity: { integerValue: 1 },
                        unitPrice: { doubleValue: 899.99 }
                      }
                    }
                  }
                ]
              }
            },
            status: { stringValue: 'Pending' },
            requestedDate: { timestampValue: '2024-01-20T14:30:00Z' }
          }
        }
      }]
    }).as('getQuoteRequests')
    
    cy.wait('@getQuoteRequests')
    
    // Review and respond to quote request
    cy.get('[data-testid="quote-request-card"]').first().click()
    cy.get('[data-testid="quote-details"]').should('be.visible')
    
    // Provide pricing
    cy.get('[data-testid="bulk-discount"]').type('5') // 5% bulk discount
    cy.get('[data-testid="shipping-cost"]').type('200')
    cy.get('[data-testid="delivery-timeline"]').select('7-10 business days')
    
    cy.get('[data-testid="supplier-notes"]').type('Bulk pricing applied. Free extended warranty included. Professional support available.')
    
    // Submit supplier quote
    cy.get('[data-testid="submit-supplier-quote"]').click()
    
    cy.contains('Quote submitted to installer').should('be.visible')
    
    // Step 6: Complete the circular workflow verification
    cy.log('🔄 VERIFICATION: Checking end-to-end data consistency')
    
    // Verify homeowner can see project progress
    cy.loginAsHomeowner()
    cy.visit('/homeowner/dashboard')
    
    cy.get('[data-testid="project-status"]').should('contain', 'Equipment Sourcing')
    cy.get('[data-testid="installation-timeline"]').should('be.visible')
    
    // Verify installer can see supplier response
    cy.loginAsInstaller()
    cy.visit('/installer/sourcing')
    
    cy.get('[data-testid="supplier-quotes"]').should('be.visible')
    cy.contains('Quote received from supplier').should('be.visible')
    
    // Verify supplier sees order in pipeline
    cy.loginAsSupplier()
    cy.visit('/supplier/dashboard')
    
    cy.get('[data-testid="pending-orders"]').should('contain', '1')
    cy.get('[data-testid="revenue-pipeline"]').should('be.visible')
  })

  it('should handle complex multi-installer RFQ scenario', () => {
    cy.log('🏠 HOMEOWNER: Creating RFQ for multiple installer bids')
    cy.loginAsHomeowner()
    cy.createTestRFQ({
      title: 'Complex Solar Project - Multiple Quotes Needed',
      description: 'Large home with complex roof layout. Need multiple quotes to compare options.',
      budget: 25000
    })

    // Mock multiple installers responding
    const installers = ['installer-1', 'installer-2', 'installer-3']
    
    installers.forEach((installerId, index) => {
      cy.log(`🔧 INSTALLER ${index + 1}: Generating competitive quote`)
      
      // Simulate installer login and quote generation
      cy.window().then((win) => {
        win.localStorage.setItem('mockInstallerId', installerId)
      })
      
      cy.loginAsInstaller()
      cy.visit('/installer/rfqs')
      
      // Generate unique quote
      cy.get('[data-testid="rfq-card"]').first().click()
      cy.get('[data-testid="generate-quote"]').click()
      
      const quotePrices = [24500, 23800, 25200]
      const systemSizes = [10.5, 10.2, 11.0]
      
      cy.get('[data-testid="total-cost"]').clear().type(quotePrices[index].toString())
      cy.get('[data-testid="system-size"]').clear().type(systemSizes[index].toString())
      cy.get('[data-testid="submit-quote"]').click()
      
      cy.contains('Quote submitted successfully').should('be.visible')
    })

    // Homeowner compares quotes
    cy.log('🏠 HOMEOWNER: Comparing multiple quotes')
    cy.loginAsHomeowner()
    cy.visit('/homeowner/quotes')
    
    cy.get('[data-testid="quote-card"]').should('have.length', 3)
    cy.get('[data-testid="compare-quotes"]').click()
    
    cy.get('[data-testid="quote-comparison"]').should('be.visible')
    cy.get('[data-testid="price-comparison"]').should('be.visible')
    cy.get('[data-testid="system-comparison"]').should('be.visible')
    
    // Select best quote
    cy.get('[data-testid="select-quote"]').first().click()
    cy.get('[data-testid="confirm-selection"]').click()
    
    cy.contains('Quote selected successfully').should('be.visible')
  })

  it('should handle error scenarios gracefully throughout the journey', () => {
    cy.log('🧪 TESTING: Error handling across the platform')
    
    // Test RFQ creation failure
    cy.loginAsHomeowner()
    cy.visit('/homeowner/rfq')
    
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/rfqs', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('createRFQError')
    
    cy.get('[data-testid="rfq-title"]').type('Error Test RFQ')
    cy.get('[data-testid="rfq-description"]').type('Testing error handling')
    cy.get('[data-testid="rfq-budget"]').type('15000')
    cy.get('[data-testid="property-address"]').type('123 Error St')
    cy.get('[data-testid="property-type"]').select('Single Family Home')
    cy.get('[data-testid="roof-type"]').select('Asphalt Shingles')
    cy.get('[data-testid="electricity-usage"]').type('800')
    
    cy.get('[data-testid="submit-rfq"]').click()
    cy.wait('@createRFQError')
    
    cy.contains('Failed to create RFQ').should('be.visible')
    cy.get('[data-testid="retry-button"]').should('be.visible')
    
    // Test quote generation failure
    cy.loginAsInstaller()
    cy.visit('/installer/rfqs')
    
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/quotes', {
      statusCode: 500,
      body: { error: 'Quote creation failed' }
    }).as('createQuoteError')
    
    cy.get('[data-testid="rfq-card"]').first().click()
    cy.get('[data-testid="generate-quote"]').click()
    
    cy.get('[data-testid="system-size"]').type('8.0')
    cy.get('[data-testid="total-cost"]').type('16000')
    cy.get('[data-testid="submit-quote"]').click()
    
    cy.wait('@createQuoteError')
    
    cy.contains('Failed to submit quote').should('be.visible')
    cy.get('[data-testid="save-draft"]').should('be.visible')
    
    // Test supplier order processing failure
    cy.loginAsSupplier()
    cy.visit('/supplier/orders')
    
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/orders', {
      statusCode: 500,
      body: { error: 'Order processing failed' }
    }).as('processOrderError')
    
    cy.get('[data-testid="order-card"]').first().find('[data-testid="process-order"]').click()
    cy.wait('@processOrderError')
    
    cy.contains('Failed to process order').should('be.visible')
    cy.get('[data-testid="contact-support"]').should('be.visible')
  })

  it('should maintain data consistency across user sessions', () => {
    cy.log('🔄 TESTING: Data persistence and session management')
    
    // Create RFQ as homeowner
    cy.loginAsHomeowner()
    cy.createTestRFQ({
      title: 'Persistence Test RFQ',
      budget: 12000
    })
    
    // Log out and log back in
    cy.get('[data-testid="user-menu"]').click()
    cy.get('[data-testid="logout"]').click()
    
    cy.loginAsHomeowner()
    cy.visit('/homeowner/rfqs')
    
    // Should see the created RFQ
    cy.contains('Persistence Test RFQ').should('be.visible')
    cy.get('[data-testid="rfq-status"]').should('contain', 'Pending')
    
    // Switch to installer and verify RFQ visibility
    cy.loginAsInstaller()
    cy.visit('/installer/rfqs')
    
    cy.contains('Persistence Test RFQ').should('be.visible')
    
    // Create quote and verify persistence
    cy.get('[data-testid="rfq-card"]').contains('Persistence Test RFQ').click()
    cy.get('[data-testid="generate-quote"]').click()
    
    cy.get('[data-testid="system-size"]').type('7.5')
    cy.get('[data-testid="total-cost"]').type('11500')
    cy.get('[data-testid="save-draft"]').click()
    
    cy.contains('Draft saved').should('be.visible')
    
    // Log out and back in - draft should persist
    cy.get('[data-testid="user-menu"]').click()
    cy.get('[data-testid="logout"]').click()
    
    cy.loginAsInstaller()
    cy.visit('/installer/quotes')
    
    cy.get('[data-testid="draft-quotes"]').should('contain', 'Persistence Test RFQ')
  })
})