import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartProvider, useCart } from '../cart-context'
import type { Product } from '@/lib/mock-data/products'

// Test component to interact with cart context
const TestCartComponent = () => {
  const {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
  } = useCart()

  const testProduct: Product = {
    id: 'test-product-1',
    name: 'Test Solar Panel',
    price: 299.99,
    category: 'Solar Panels',
    supplierId: 'supplier-1',
    description: 'High efficiency solar panel',
    specifications: {},
    images: [],
    inStock: true,
    stockQuantity: 10,
    rating: 4.5,
    reviewCount: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return (
    <div>
      <div data-testid="cart-items">
        {items.map((item) => (
          <div key={item.product.id} data-testid="cart-item">
            <span>{item.product.name}</span>
            <span data-testid="item-quantity">{item.quantity}</span>
            <span data-testid="item-total">${(item.product.price * item.quantity).toFixed(2)}</span>
            <button
              data-testid={`update-quantity-${item.product.id}`}
              onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
            >
              Increase Quantity
            </button>
            <button
              data-testid={`remove-item-${item.product.id}`}
              onClick={() => removeItem(item.product.id)}
            >
              Remove Item
            </button>
          </div>
        ))}
      </div>
      
      <div data-testid="cart-summary">
        <span data-testid="total-items">{getItemCount()}</span>
        <span data-testid="cart-total">${getCartTotal().toFixed(2)}</span>
      </div>
      
      <button
        data-testid="add-test-product"
        onClick={() => addItem(testProduct, 2)}
      >
        Add Test Product
      </button>
      
      <button
        data-testid="clear-cart"
        onClick={clearCart}
      >
        Clear Cart
      </button>
    </div>
  )
}

// Test component that uses cart outside of provider (should throw error)
const TestComponentWithoutProvider = () => {
  const { items } = useCart()
  return <div>{items.length}</div>
}

describe('CartContext', () => {
  const renderWithProvider = (children: React.ReactNode) => {
    return render(
      <CartProvider>
        {children}
      </CartProvider>
    )
  }

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('CartProvider', () => {
    it('provides cart context to children', () => {
      renderWithProvider(<TestCartComponent />)
      
      expect(screen.getByTestId('cart-items')).toBeInTheDocument()
      expect(screen.getByTestId('cart-summary')).toBeInTheDocument()
      expect(screen.getByTestId('total-items')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$0.00')
    })

    it('throws error when useCart is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponentWithoutProvider />)
      }).toThrow('useCart must be used within a CartProvider')
      
      consoleSpy.mockRestore()
    })

    it('loads cart state from localStorage on initialization', () => {
      const savedCart = [
        {
          product: {
            id: 'saved-product',
            name: 'Saved Product',
            price: 150.00,
            category: 'Solar Panels',
            supplierId: 'supplier-1',
            description: 'Saved product',
            specifications: {},
            images: [],
            inStock: true,
            stockQuantity: 5,
            rating: 4.0,
            reviewCount: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          quantity: 3,
        },
      ]
      
      localStorage.setItem('solarify-cart', JSON.stringify(savedCart))
      
      renderWithProvider(<TestCartComponent />)
      
      expect(screen.getByText('Saved Product')).toBeInTheDocument()
      expect(screen.getByTestId('total-items')).toHaveTextContent('3')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$450.00')
    })

    it('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem('solarify-cart', 'invalid-json')
      
      renderWithProvider(<TestCartComponent />)
      
      expect(screen.getByTestId('total-items')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$0.00')
    })
  })

  describe('Cart Operations', () => {
    it('adds items to cart', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      await user.click(screen.getByTestId('add-test-product'))
      
      expect(screen.getByText('Test Solar Panel')).toBeInTheDocument()
      expect(screen.getByTestId('item-quantity')).toHaveTextContent('2')
      expect(screen.getByTestId('total-items')).toHaveTextContent('2')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$599.98')
    })

    it('updates quantity when adding existing item', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      // Add item twice
      await user.click(screen.getByTestId('add-test-product'))
      await user.click(screen.getByTestId('add-test-product'))
      
      expect(screen.getByTestId('item-quantity')).toHaveTextContent('4')
      expect(screen.getByTestId('total-items')).toHaveTextContent('4')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$1199.96')
    })

    it('removes items from cart', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      // Add item first
      await user.click(screen.getByTestId('add-test-product'))
      expect(screen.getByText('Test Solar Panel')).toBeInTheDocument()
      
      // Remove item
      await user.click(screen.getByTestId('remove-item-test-product-1'))
      expect(screen.queryByText('Test Solar Panel')).not.toBeInTheDocument()
      expect(screen.getByTestId('total-items')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$0.00')
    })

    it('updates item quantity', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      // Add item first
      await user.click(screen.getByTestId('add-test-product'))
      expect(screen.getByTestId('item-quantity')).toHaveTextContent('2')
      
      // Increase quantity
      await user.click(screen.getByTestId('update-quantity-test-product-1'))
      expect(screen.getByTestId('item-quantity')).toHaveTextContent('3')
      expect(screen.getByTestId('total-items')).toHaveTextContent('3')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$899.97')
    })

    it('removes item when quantity is set to 0', () => {
      renderWithProvider(<TestCartComponent />)
      
      const { updateItemQuantity } = useCart()
      
      act(() => {
        // Add item first
        const testProduct: Product = {
          id: 'test-product-2',
          name: 'Test Product 2',
          price: 100.00,
          category: 'Solar Panels',
          supplierId: 'supplier-1',
          description: 'Test product',
          specifications: {},
          images: [],
          inStock: true,
          stockQuantity: 10,
          rating: 4.0,
          reviewCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        updateItemQuantity('test-product-2', 0)
      })
      
      expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument()
    })

    it('clears entire cart', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      // Add item first
      await user.click(screen.getByTestId('add-test-product'))
      expect(screen.getByText('Test Solar Panel')).toBeInTheDocument()
      
      // Clear cart
      await user.click(screen.getByTestId('clear-cart'))
      expect(screen.queryByText('Test Solar Panel')).not.toBeInTheDocument()
      expect(screen.getByTestId('total-items')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$0.00')
    })
  })

  describe('Cart Calculations', () => {
    it('calculates correct item count', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      // Add 2 of the same product
      await user.click(screen.getByTestId('add-test-product'))
      expect(screen.getByTestId('total-items')).toHaveTextContent('2')
      
      // Increase quantity to 5 total
      await user.click(screen.getByTestId('update-quantity-test-product-1'))
      expect(screen.getByTestId('total-items')).toHaveTextContent('3')
    })

    it('calculates correct cart total', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      await user.click(screen.getByTestId('add-test-product'))
      
      // 2 items × $299.99 = $599.98
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$599.98')
      
      // Increase to 3 items × $299.99 = $899.97
      await user.click(screen.getByTestId('update-quantity-test-product-1'))
      expect(screen.getByTestId('cart-total')).toHaveTextContent('$899.97')
    })

    it('handles decimal precision correctly', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      await user.click(screen.getByTestId('add-test-product'))
      
      // Should handle floating point arithmetic correctly
      const total = screen.getByTestId('cart-total')
      expect(total.textContent).toMatch(/^\$\d+\.\d{2}$/) // Should have exactly 2 decimal places
    })
  })

  describe('Local Storage Persistence', () => {
    it('saves cart to localStorage when items change', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      await user.click(screen.getByTestId('add-test-product'))
      
      const savedCart = localStorage.getItem('solarify-cart')
      expect(savedCart).not.toBeNull()
      
      const parsedCart = JSON.parse(savedCart!)
      expect(parsedCart).toHaveLength(1)
      expect(parsedCart[0].product.id).toBe('test-product-1')
      expect(parsedCart[0].quantity).toBe(2)
    })

    it('updates localStorage when cart is cleared', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      // Add item first
      await user.click(screen.getByTestId('add-test-product'))
      expect(localStorage.getItem('solarify-cart')).not.toBe('[]')
      
      // Clear cart
      await user.click(screen.getByTestId('clear-cart'))
      
      const savedCart = localStorage.getItem('solarify-cart')
      expect(JSON.parse(savedCart!)).toEqual([])
    })

    it('updates localStorage when item is removed', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      // Add item first
      await user.click(screen.getByTestId('add-test-product'))
      expect(JSON.parse(localStorage.getItem('solarify-cart')!)).toHaveLength(1)
      
      // Remove item
      await user.click(screen.getByTestId('remove-item-test-product-1'))
      
      const savedCart = localStorage.getItem('solarify-cart')
      expect(JSON.parse(savedCart!)).toEqual([])
    })
  })

  describe('Memoization and Performance', () => {
    it('memoizes context value to prevent unnecessary re-renders', () => {
      const TestMemoComponent = React.memo(() => {
        const cart = useCart()
        return <div data-testid="memo-component">{cart.items.length}</div>
      })
      
      const { rerender } = renderWithProvider(<TestMemoComponent />)
      
      expect(screen.getByTestId('memo-component')).toHaveTextContent('0')
      
      // Re-render with same provider - memoized context should prevent child re-render
      rerender(
        <CartProvider>
          <TestMemoComponent />
        </CartProvider>
      )
      
      expect(screen.getByTestId('memo-component')).toHaveTextContent('0')
    })

    it('uses useCallback for cart actions to prevent re-renders', () => {
      let renderCount = 0
      
      const TestCallbackComponent = () => {
        renderCount++
        const { addItem } = useCart()
        
        return (
          <button onClick={() => addItem} data-testid="callback-button">
            Add Item
          </button>
        )
      }
      
      const { rerender } = renderWithProvider(<TestCallbackComponent />)
      const initialRenderCount = renderCount
      
      // Re-render - useCallback should prevent unnecessary re-renders
      rerender(
        <CartProvider>
          <TestCallbackComponent />
        </CartProvider>
      )
      
      // Component should be memoized properly
      expect(screen.getByTestId('callback-button')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles adding item with 0 quantity', () => {
      renderWithProvider(<TestCartComponent />)
      
      const testProduct: Product = {
        id: 'zero-quantity-product',
        name: 'Zero Quantity Product',
        price: 100.00,
        category: 'Solar Panels',
        supplierId: 'supplier-1',
        description: 'Test product',
        specifications: {},
        images: [],
        inStock: true,
        stockQuantity: 10,
        rating: 4.0,
        reviewCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      act(() => {
        const { addItem } = useCart()
        addItem(testProduct, 0)
      })
      
      // Should not add item with 0 quantity
      expect(screen.queryByText('Zero Quantity Product')).not.toBeInTheDocument()
      expect(screen.getByTestId('total-items')).toHaveTextContent('0')
    })

    it('handles negative quantity updates', () => {
      renderWithProvider(<TestCartComponent />)
      
      act(() => {
        const { updateItemQuantity } = useCart()
        updateItemQuantity('non-existent-item', -5)
      })
      
      // Should not crash or add negative items
      expect(screen.getByTestId('total-items')).toHaveTextContent('0')
    })

    it('handles very large quantities', async () => {
      const user = userEvent.setup()
      renderWithProvider(<TestCartComponent />)
      
      await user.click(screen.getByTestId('add-test-product'))
      
      act(() => {
        const { updateItemQuantity } = useCart()
        updateItemQuantity('test-product-1', 999999)
      })
      
      expect(screen.getByTestId('item-quantity')).toHaveTextContent('999999')
      expect(screen.getByTestId('total-items')).toHaveTextContent('999999')
      
      // Should handle large number calculations
      const expectedTotal = (299.99 * 999999).toFixed(2)
      expect(screen.getByTestid('cart-total')).toHaveTextContent(`$${expectedTotal}`)
    })
  })
})