
import type { Timestamp } from "firebase/firestore";

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string; // Firestore document ID
  rfqId: string;
  installerId: string;
  homeownerId: string; // Denormalized from RFQ for easier querying by homeowner
  quoteDate: Timestamp; 
  validityPeriodDays: number;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  termsAndConditions?: string;
  currencyCode: string;
  status: "Draft" | "Submitted" | "Accepted" | "Rejected" | "Expired" | "Viewed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Optional denormalized fields for display convenience
  homeownerName?: string;
  installerCompanyName?: string;
  projectAddress?: string;
  rfqEstimatedSystemSizeKW?: number;
}
