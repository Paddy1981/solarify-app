
import type { Timestamp } from 'firebase/firestore';

export interface OrderItem {
  productId: string;
  name: string; // Denormalized product name
  quantity: number;
  priceValue: number; // Price per unit at time of checkout
  currencyCode: string;
  imageUrl?: string; // Denormalized
  imageHint?: string; // Denormalized for placeholder images
  category?: string; // Denormalized
  supplierId?: string; // Denormalized
}

export interface Order {
  id?: string; // Firestore document ID, will be auto-generated
  userId: string;
  userName?: string; // Denormalized
  userEmail?: string; // Denormalized
  items: OrderItem[];
  subtotal: number;
  taxAmount: number; // Store tax applied at checkout
  totalAmount: number;
  currencyCode: string; // Overall order currency (assumes single currency for now)
  status: 'Pending' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled' | 'Inquiry';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Example: shippingAddress structure, not fully implemented in UI for this change
  // shippingAddress?: {
  //   street: string;
  //   city: string;
  //   postalCode: string;
  //   country: string;
  // };
  notes?: string; // User notes from checkout
}
