describe('Supplier - Product Management Flow', () => {
  beforeEach(() => {
    cy.loginAsSupplier()
    cy.visit('/supplier/store')
    cy.waitForPageLoad()
  })

  it('should display supplier product catalog', () => {
    // Mock supplier products
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      fixture: 'products/supplier-products.json'
    }).as('getSupplierProducts')

    cy.reload()
    cy.wait('@getSupplierProducts')

    cy.get('[data-testid="product-catalog"]').should('be.visible')
    cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0)

    // Check product card content
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="product-image"]').should('be.visible')
      cy.get('[data-testid="product-name"]').should('be.visible')
      cy.get('[data-testid="product-price"]').should('be.visible')
      cy.get('[data-testid="product-category"]').should('be.visible')
      cy.get('[data-testid="stock-status"]').should('be.visible')
    })
  })

  it('should add new product to catalog', () => {
    cy.get('[data-testid="add-product"]').click()
    
    // Should navigate to add product page
    cy.url().should('include', '/supplier/store/add-product')
    
    // Product form should be visible
    cy.get('[data-testid="product-form"]').should('be.visible')
    
    // Fill product information
    cy.get('[data-testid="product-name"]').type('High-Efficiency Solar Panel 400W')
    cy.get('[data-testid="product-description"]').type('Monocrystalline solar panel with 22% efficiency rating and 25-year warranty.')
    cy.get('[data-testid="product-category"]').select('Solar Panels')
    cy.get('[data-testid="product-price"]').type('299.99')
    cy.get('[data-testid="stock-quantity"]').type('100')
    
    // Product specifications
    cy.get('[data-testid="spec-power"]').type('400')
    cy.get('[data-testid="spec-efficiency"]').type('22.1')
    cy.get('[data-testid="spec-warranty"]').type('25')
    cy.get('[data-testid="spec-dimensions"]').type('78.7 x 39.4 x 1.4 inches')
    cy.get('[data-testid="spec-weight"]').type('44 lbs')
    
    // Upload product images
    cy.get('[data-testid="product-images"]').selectFile([
      {
        contents: Cypress.Buffer.from('fake-image-1'),
        fileName: 'panel-front.jpg',
        mimeType: 'image/jpeg'
      },
      {
        contents: Cypress.Buffer.from('fake-image-2'),
        fileName: 'panel-side.jpg',
        mimeType: 'image/jpeg'
      }
    ])
    
    // Mock product creation
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/products', {
      statusCode: 200,
      body: {
        name: 'projects/test/databases/(default)/documents/products/new-product-123',
        fields: {
          id: { stringValue: 'new-product-123' },
          name: { stringValue: 'High-Efficiency Solar Panel 400W' },
          status: { stringValue: 'Active' }
        }
      }
    }).as('createProduct')
    
    cy.get('[data-testid="submit-product"]').click()
    
    cy.wait('@createProduct')
    
    // Should show success message and redirect
    cy.contains('Product added successfully').should('be.visible')
    cy.url().should('include', '/supplier/store')
  })

  it('should edit existing product', () => {
    cy.get('[data-testid="product-card"]').first().find('[data-testid="edit-product"]').click()
    
    // Should navigate to edit page
    cy.url().should('match', /\/supplier\/store\/edit\/[^\/]+$/)
    
    // Form should be pre-filled
    cy.get('[data-testid="product-name"]').should('not.have.value', '')
    cy.get('[data-testid="product-price"]').should('not.have.value', '')
    
    // Update product information
    cy.get('[data-testid="product-price"]').clear().type('279.99')
    cy.get('[data-testid="stock-quantity"]').clear().type('150')
    
    // Mock product update
    cy.intercept('PATCH', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents/products/*', {
      statusCode: 200,
      body: { fields: {} }
    }).as('updateProduct')
    
    cy.get('[data-testid="update-product"]').click()
    
    cy.wait('@updateProduct')
    
    cy.contains('Product updated successfully').should('be.visible')
  })

  it('should manage product inventory', () => {
    cy.get('[data-testid="product-card"]').first().find('[data-testid="manage-inventory"]').click()
    
    // Inventory modal should open
    cy.get('[data-testid="inventory-modal"]').should('be.visible')
    cy.get('[data-testid="current-stock"]').should('be.visible')
    cy.get('[data-testid="stock-adjustment"]').should('be.visible')
    
    // Add stock
    cy.get('[data-testid="adjustment-type"]').select('Add Stock')
    cy.get('[data-testid="adjustment-quantity"]').type('50')
    cy.get('[data-testid="adjustment-reason"]').type('New shipment received')
    
    cy.get('[data-testid="apply-adjustment"]').click()
    
    cy.contains('Inventory updated successfully').should('be.visible')
    cy.get('[data-testid="inventory-modal"]').should('not.exist')
  })

  it('should set product pricing and discounts', () => {
    cy.get('[data-testid="product-card"]').first().find('[data-testid="manage-pricing"]').click()
    
    // Pricing modal should open
    cy.get('[data-testid="pricing-modal"]').should('be.visible')
    
    // Set bulk pricing
    cy.get('[data-testid="bulk-pricing"]').within(() => {
      cy.get('[data-testid="tier-1-min"]').type('10')
      cy.get('[data-testid="tier-1-price"]').type('289.99')
      
      cy.get('[data-testid="add-tier"]').click()
      
      cy.get('[data-testid="tier-2-min"]').type('50')
      cy.get('[data-testid="tier-2-price"]').type('269.99')
    })
    
    // Set promotional discount
    cy.get('[data-testid="promotional-discount"]').type('10')
    cy.get('[data-testid="promotion-start"]').type('2024-01-15')
    cy.get('[data-testid="promotion-end"]').type('2024-02-15')
    
    cy.get('[data-testid="save-pricing"]').click()
    
    cy.contains('Pricing updated successfully').should('be.visible')
  })

  it('should manage product reviews and ratings', () => {
    cy.get('[data-testid="product-card"]').first().click()
    
    // Should navigate to product details
    cy.get('[data-testid="product-reviews"]').should('be.visible')
    cy.get('[data-testid="review-item"]').should('have.length.greaterThan', 0)
    
    // Should show review statistics
    cy.get('[data-testid="average-rating"]').should('be.visible')
    cy.get('[data-testid="total-reviews"]').should('be.visible')
    cy.get('[data-testid="rating-distribution"]').should('be.visible')
    
    // Respond to review
    cy.get('[data-testid="review-item"]').first().within(() => {
      cy.get('[data-testid="respond-to-review"]').click()
    })
    
    cy.get('[data-testid="response-text"]').type('Thank you for your feedback! We\'re glad you\'re satisfied with the product quality.')
    cy.get('[data-testid="submit-response"]').click()
    
    cy.contains('Response submitted').should('be.visible')
  })

  it('should track product performance analytics', () => {
    cy.visit('/supplier/analytics')
    
    // Analytics dashboard should be visible
    cy.get('[data-testid="analytics-dashboard"]').should('be.visible')
    
    // Product performance metrics
    cy.get('[data-testid="total-sales"]').should('be.visible')
    cy.get('[data-testid="top-products"]').should('be.visible')
    cy.get('[data-testid="revenue-chart"]').should('be.visible')
    cy.get('[data-testid="inventory-turnover"]').should('be.visible')
    
    // Filter analytics by date range
    cy.get('[data-testid="date-range-picker"]').click()
    cy.get('[data-testid="last-30-days"]').click()
    
    // Should update charts
    cy.get('[data-testid="revenue-chart"]').should('be.visible')
  })

  it('should manage product categories', () => {
    cy.get('[data-testid="manage-categories"]').click()
    
    // Categories modal should open
    cy.get('[data-testid="categories-modal"]').should('be.visible')
    cy.get('[data-testid="category-list"]').should('be.visible')
    
    // Add new category
    cy.get('[data-testid="add-category"]').click()
    cy.get('[data-testid="category-name"]').type('Energy Storage')
    cy.get('[data-testid="category-description"]').type('Battery storage systems and accessories')
    cy.get('[data-testid="save-category"]').click()
    
    cy.contains('Category added successfully').should('be.visible')
    
    // Edit existing category
    cy.get('[data-testid="category-item"]').first().find('[data-testid="edit-category"]').click()
    cy.get('[data-testid="category-description"]').clear().type('Updated description')
    cy.get('[data-testid="save-category"]').click()
    
    cy.contains('Category updated successfully').should('be.visible')
  })

  it('should handle bulk product operations', () => {
    // Select multiple products
    cy.get('[data-testid="select-all-products"]').click()
    cy.get('[data-testid="bulk-actions"]').should('be.visible')
    
    // Bulk update pricing
    cy.get('[data-testid="bulk-actions"]').select('Update Pricing')
    cy.get('[data-testid="bulk-pricing-modal"]').should('be.visible')
    
    cy.get('[data-testid="pricing-adjustment"]').select('Percentage Increase')
    cy.get('[data-testid="adjustment-value"]').type('5')
    cy.get('[data-testid="apply-bulk-pricing"]').click()
    
    cy.contains('Bulk pricing update completed').should('be.visible')
    
    // Bulk inventory update
    cy.get('[data-testid="bulk-actions"]').select('Update Inventory')
    cy.get('[data-testid="bulk-inventory-modal"]').should('be.visible')
    
    cy.get('[data-testid="inventory-action"]').select('Add Stock')
    cy.get('[data-testid="quantity-to-add"]').type('25')
    cy.get('[data-testid="apply-bulk-inventory"]').click()
    
    cy.contains('Bulk inventory update completed').should('be.visible')
  })

  it('should export product data', () => {
    cy.get('[data-testid="export-products"]').click()
    
    // Export modal should open
    cy.get('[data-testid="export-modal"]').should('be.visible')
    
    // Select export options
    cy.get('[data-testid="export-format"]').select('CSV')
    cy.get('[data-testid="include-inventory"]').check()
    cy.get('[data-testid="include-pricing"]').check()
    cy.get('[data-testid="include-reviews"]').check()
    
    cy.get('[data-testid="start-export"]').click()
    
    cy.contains('Export started').should('be.visible')
    cy.contains('Download will begin shortly').should('be.visible')
  })

  it('should handle low stock alerts', () => {
    // Mock low stock products
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      body: [
        {
          document: {
            fields: {
              name: { stringValue: 'Low Stock Panel' },
              stockQuantity: { integerValue: 5 },
              lowStockThreshold: { integerValue: 10 }
            }
          }
        }
      ]
    }).as('getLowStockProducts')

    cy.visit('/supplier/inventory')
    cy.wait('@getLowStockProducts')

    // Should show low stock alerts
    cy.get('[data-testid="low-stock-alerts"]').should('be.visible')
    cy.get('[data-testid="low-stock-item"]').should('have.length.greaterThan', 0)

    // Quick reorder action
    cy.get('[data-testid="quick-reorder"]').first().click()
    cy.get('[data-testid="reorder-quantity"]').type('100')
    cy.get('[data-testid="supplier-notes"]').type('Urgent reorder - stock running low')
    cy.get('[data-testid="submit-reorder"]').click()

    cy.contains('Reorder request submitted').should('be.visible')
  })

  it('should be accessible', () => {
    cy.testAccessibility()
    
    // Test keyboard navigation
    cy.get('[data-testid="product-card"]').first().focus().should('have.focus')
    cy.get('[data-testid="product-card"]').first().type('{enter}')
    
    // Should navigate to product details
    cy.url().should('match', /\/supplier\/store\/product\/[^\/]+$/)
  })

  it('should work on mobile devices', () => {
    cy.testResponsive(() => {
      cy.get('[data-testid="product-catalog"]').should('be.visible')
      cy.get('[data-testid="product-card"]').should('be.visible')
      
      // Mobile-specific features
      cy.get('[data-testid="mobile-search"]').should('be.visible')
      cy.get('[data-testid="mobile-filters"]').should('be.visible')
    })
  })

  it('should handle search and filtering', () => {
    // Search products
    cy.get('[data-testid="product-search"]').type('solar panel')
    cy.get('[data-testid="search-button"]').click()
    
    cy.get('[data-testid="product-card"]').each(($card) => {
      cy.wrap($card).should('contain.text', 'solar panel')
    })
    
    // Filter by category
    cy.get('[data-testid="category-filter"]').select('Solar Panels')
    
    cy.get('[data-testid="product-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="product-category"]').should('contain', 'Solar Panels')
    })
    
    // Filter by stock status
    cy.get('[data-testid="stock-filter"]').select('In Stock')
    
    cy.get('[data-testid="product-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="stock-status"]').should('not.contain', 'Out of Stock')
    })
  })

  it('should handle errors gracefully', () => {
    // Mock API error
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('getProductsError')

    cy.reload()
    cy.wait('@getProductsError')

    // Should show error state
    cy.contains('Unable to load products').should('be.visible')
    cy.get('[data-testid="retry-button"]').should('be.visible')

    // Should retry on button click
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/(default)/documents:runQuery', {
      fixture: 'products/supplier-products.json'
    }).as('getProductsRetry')

    cy.get('[data-testid="retry-button"]').click()
    cy.wait('@getProductsRetry')

    cy.get('[data-testid="product-catalog"]').should('be.visible')
  })
})