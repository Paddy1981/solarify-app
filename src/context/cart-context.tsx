"use client";

import type { Product } from '@/lib/mock-data/products';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

interface CartContextType extends CartState {
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; items: CartItem[] };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.id === action.product.id);
      let newItems;
      if (existingItemIndex > -1) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.quantity }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.product, quantity: action.quantity }];
      }
      return { ...state, items: newItems };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.productId),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.productId ? { ...item, quantity: Math.max(0, action.quantity) } : item
        ).filter(item => item.quantity > 0), 
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'LOAD_CART':
        return { ...state, items: action.items };
    default:
      return state;
  }
};

const CART_STORAGE_KEY = 'solarifyCart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart)) {
            dispatch({ type: 'LOAD_CART', items: parsedCart });
        }
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        localStorage.removeItem(CART_STORAGE_KEY); 
      }
    }
  }, []);

  useEffect(() => {
     localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  // Memoize cart actions to prevent unnecessary re-renders
  const addItem = useCallback((product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', product, quantity });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId });
  }, []);

  const updateItemQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  // Memoize expensive calculations
  const cartTotal = useMemo(() => {
    return state.items.reduce((total, item) => total + item.priceValue * item.quantity, 0);
  }, [state.items]);

  const itemCount = useMemo(() => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  }, [state.items]);

  const getCartTotal = useCallback(() => cartTotal, [cartTotal]);
  const getItemCount = useCallback(() => itemCount, [itemCount]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    items: state.items,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
  }), [state.items, addItem, removeItem, updateItemQuantity, clearCart, getCartTotal, getItemCount]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
