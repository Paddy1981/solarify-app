describe('Homeowner - Create RFQ Flow', () => {
  beforeEach(() => {
    cy.loginAsHomeowner()
    cy.visit('/homeowner/rfq')
    cy.waitForPageLoad()
  })

  it('should display RFQ creation form with all required fields', () => {
    cy.get('[data-testid="rfq-form"]').should('be.visible')
    
    // Basic information fields
    cy.get('[data-testid="rfq-title"]').should('be.visible')
    cy.get('[data-testid="rfq-description"]').should('be.visible')
    cy.get('[data-testid="rfq-budget"]').should('be.visible')
    cy.get('[data-testid="rfq-timeline"]').should('be.visible')
    
    // Property information
    cy.get('[data-testid="property-address"]').should('be.visible')
    cy.get('[data-testid="property-type"]').should('be.visible')
    cy.get('[data-testid="roof-type"]').should('be.visible')
    cy.get('[data-testid="electricity-usage"]').should('be.visible')
    
    // Installation preferences
    cy.get('[data-testid="system-size-preference"]').should('be.visible')
    cy.get('[data-testid="panel-type-preference"]').should('be.visible')
    
    // Submit button
    cy.get('[data-testid="submit-rfq"]').should('be.visible')
  })

  it('should validate required fields before submission', () => {
    cy.get('[data-testid="submit-rfq"]').click()
    
    // Should show validation errors
    cy.contains('Title is required').should('be.visible')
    cy.contains('Description is required').should('be.visible')
    cy.contains('Budget is required').should('be.visible')
    cy.contains('Property address is required').should('be.visible')
  })

  it('should validate budget field accepts only valid numbers', () => {
    cy.get('[data-testid="rfq-budget"]').type('invalid-budget')
    cy.get('[data-testid="submit-rfq"]').click()
    
    cy.contains('Budget must be a valid number').should('be.visible')
    
    // Clear and enter valid budget
    cy.get('[data-testid="rfq-budget"]').clear().type('15000')
    cy.get('[data-testid="submit-rfq"]').click()
    
    cy.contains('Budget must be a valid number').should('not.exist')
  })

  it('should successfully create RFQ with valid data', () => {
    // Mock successful RFQ creation
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/rfqs', {
      statusCode: 200,
      body: {
        name: 'projects/test/databases/(default)/documents/rfqs/new-rfq-123',
        fields: {
          id: { stringValue: 'new-rfq-123' },
          title: { stringValue: 'Residential Solar Installation' },
          status: { stringValue: 'Pending' }
        }
      }
    }).as('createRFQ')

    // Fill out the form
    cy.get('[data-testid="rfq-title"]').type('Residential Solar Installation')
    cy.get('[data-testid="rfq-description"]').type('Looking to install solar panels on my 2000 sq ft home to reduce electricity bills.')
    cy.get('[data-testid="rfq-budget"]').type('15000')
    cy.get('[data-testid="rfq-timeline"]').select('3-6 months')
    
    // Property information
    cy.get('[data-testid="property-address"]').type('123 Main St, San Francisco, CA 94111')
    cy.get('[data-testid="property-type"]').select('Single Family Home')
    cy.get('[data-testid="roof-type"]').select('Asphalt Shingles')
    cy.get('[data-testid="electricity-usage"]').type('800')
    
    // Installation preferences
    cy.get('[data-testid="system-size-preference"]').select('8-10 kW')
    cy.get('[data-testid="panel-type-preference"]').select('Monocrystalline')
    
    // Submit the form
    cy.get('[data-testid="submit-rfq"]').click()
    
    cy.wait('@createRFQ')
    
    // Should show success message and redirect
    cy.contains('RFQ created successfully').should('be.visible')
    cy.url().should('include', '/homeowner/rfqs')
  })

  it('should allow file uploads for property photos', () => {
    // Create a test file
    const fileName = 'house-photo.jpg'
    
    cy.get('[data-testid="property-photos-upload"]').should('be.visible')
    
    // Upload file
    cy.get('[data-testid="file-input"]').selectFile({
      contents: Cypress.Buffer.from('fake-image-content'),
      fileName: fileName,
      mimeType: 'image/jpeg'
    })
    
    // Should show uploaded file
    cy.contains(fileName).should('be.visible')
    cy.get('[data-testid="uploaded-file"]').should('have.length', 1)
  })

  it('should validate file upload restrictions', () => {
    // Try to upload unsupported file type
    cy.get('[data-testid="file-input"]').selectFile({
      contents: Cypress.Buffer.from('fake-document'),
      fileName: 'document.pdf',
      mimeType: 'application/pdf'
    })
    
    cy.contains('Only image files are allowed').should('be.visible')
    
    // Try to upload oversized file (mock large file)
    cy.get('[data-testid="file-input"]').selectFile({
      contents: Cypress.Buffer.alloc(6 * 1024 * 1024), // 6MB
      fileName: 'large-image.jpg',
      mimeType: 'image/jpeg'
    })
    
    cy.contains('File size must be less than 5MB').should('be.visible')
  })

  it('should save draft automatically', () => {
    cy.get('[data-testid="rfq-title"]').type('Draft RFQ Title')
    cy.get('[data-testid="rfq-description"]').type('This is a draft description')
    
    // Wait for auto-save (assuming 2 second delay)
    cy.wait(2500)
    
    cy.contains('Draft saved').should('be.visible')
    
    // Refresh page and check if draft is restored
    cy.reload()
    
    cy.get('[data-testid="rfq-title"]').should('have.value', 'Draft RFQ Title')
    cy.get('[data-testid="rfq-description"]').should('have.value', 'This is a draft description')
  })

  it('should handle form submission errors gracefully', () => {
    // Mock server error
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/rfqs', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }).as('createRFQError')

    // Fill out and submit form
    cy.get('[data-testid="rfq-title"]').type('Test RFQ')
    cy.get('[data-testid="rfq-description"]').type('Test description')
    cy.get('[data-testid="rfq-budget"]').type('10000')
    cy.get('[data-testid="property-address"]').type('123 Test St')
    cy.get('[data-testid="property-type"]').select('Single Family Home')
    cy.get('[data-testid="roof-type"]').select('Asphalt Shingles')
    cy.get('[data-testid="electricity-usage"]').type('500')
    
    cy.get('[data-testid="submit-rfq"]').click()
    
    cy.wait('@createRFQError')
    
    // Should show error message
    cy.contains('Failed to create RFQ. Please try again.').should('be.visible')
    
    // Form should remain filled
    cy.get('[data-testid="rfq-title"]').should('have.value', 'Test RFQ')
  })

  it('should provide installer selection options', () => {
    // Mock installer list
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      body: [
        {
          document: {
            name: 'projects/test/databases/(default)/documents/users/installer1',
            fields: {
              fullName: { stringValue: 'SolarTech Solutions' },
              role: { stringValue: 'installer' },
              rating: { doubleValue: 4.8 },
              completedProjects: { integerValue: 25 }
            }
          }
        },
        {
          document: {
            name: 'projects/test/databases/(default)/documents/users/installer2',
            fields: {
              fullName: { stringValue: 'Green Energy Pros' },
              role: { stringValue: 'installer' },
              rating: { doubleValue: 4.6 },
              completedProjects: { integerValue: 18 }
            }
          }
        }
      ]
    }).as('getInstallers')

    cy.get('[data-testid="installer-selection-section"]').should('be.visible')
    cy.get('[data-testid="browse-installers"]').click()
    
    cy.wait('@getInstallers')
    
    // Should show installer options
    cy.contains('SolarTech Solutions').should('be.visible')
    cy.contains('Green Energy Pros').should('be.visible')
    cy.contains('4.8').should('be.visible') // Rating
    cy.contains('25 projects').should('be.visible') // Completed projects
    
    // Select installers
    cy.get('[data-testid="select-installer-installer1"]').click()
    cy.get('[data-testid="select-installer-installer2"]').click()
    
    cy.get('[data-testid="selected-installers"]').should('contain', 'SolarTech Solutions')
    cy.get('[data-testid="selected-installers"]').should('contain', 'Green Energy Pros')
  })

  it('should be accessible via keyboard navigation', () => {
    // Start from first field
    cy.get('[data-testid="rfq-title"]').focus().should('have.focus')
    
    // Tab through form fields
    cy.get('[data-testid="rfq-title"]').tab()
    cy.get('[data-testid="rfq-description"]').should('have.focus')
    
    cy.get('[data-testid="rfq-description"]').tab()
    cy.get('[data-testid="rfq-budget"]').should('have.focus')
    
    // Continue through all form fields
    cy.get('[data-testid="rfq-budget"]').tab()
    cy.get('[data-testid="rfq-timeline"]').should('have.focus')
    
    // Should be able to submit with Enter key
    cy.get('[data-testid="rfq-title"]').type('Keyboard Navigation Test')
    cy.get('[data-testid="submit-rfq"]').focus().type('{enter}')
    
    // Should trigger validation
    cy.contains('Description is required').should('be.visible')
  })

  it('should work on mobile devices', () => {
    cy.testResponsive(() => {
      cy.get('[data-testid="rfq-form"]').should('be.visible')
      cy.get('[data-testid="rfq-title"]').should('be.visible')
      cy.get('[data-testid="submit-rfq"]').should('be.visible')
      
      // Mobile-specific interactions
      cy.get('[data-testid="rfq-title"]').type('Mobile RFQ Test')
      cy.get('[data-testid="rfq-description"]').type('Testing on mobile viewport')
    })
  })

  it('should be accessible to screen readers', () => {
    cy.testAccessibility()
    
    // Check for proper labels
    cy.get('[data-testid="rfq-title"]').should('have.attr', 'aria-label')
    cy.get('[data-testid="rfq-description"]').should('have.attr', 'aria-describedby')
    
    // Check for form validation accessibility
    cy.get('[data-testid="submit-rfq"]').click()
    
    cy.get('[aria-invalid="true"]').should('exist')
    cy.get('[role="alert"]').should('exist')
  })

  it('should show progress indicator for multi-step form', () => {
    cy.get('[data-testid="form-progress"]').should('be.visible')
    cy.get('[data-testid="step-1"]').should('have.class', 'active')
    
    // Fill step 1 and proceed
    cy.get('[data-testid="rfq-title"]').type('Progress Test RFQ')
    cy.get('[data-testid="rfq-description"]').type('Testing form progress')
    cy.get('[data-testid="next-step"]').click()
    
    cy.get('[data-testid="step-2"]').should('have.class', 'active')
    cy.get('[data-testid="step-1"]').should('have.class', 'completed')
  })
})