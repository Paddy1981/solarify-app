
import type { Timestamp } from "firebase/firestore";

export interface Product {
  id: string; // Firestore document ID
  name: string;
  description: string;
  category: string;
  priceValue: number; // Stored as number
  currencyCode: string; // e.g., "USD", "INR"
  stock: number;
  imageUrl: string;
  imageHint: string;
  supplierId: string; // UID of the supplier
  supplierName?: string; // Denormalized for display
  createdAt?: Timestamp | Date; // Firestore Timestamp or Date for mock
  updatedAt?: Timestamp | Date; // Firestore Timestamp or Date for mock
}

// sampleProducts can be used for initial seeding or as a fallback if needed.
// Firestore will be the primary source of truth.
export const sampleProducts: Product[] = [
  {
    id: "prod-001",
    name: "High-Efficiency Solar Panel 450W",
    description: "A top-tier 450W monocrystalline solar panel, offering excellent performance and durability. Ideal for residential and commercial installations seeking maximum power output.",
    category: "Panels",
    priceValue: 250.00,
    currencyCode: "USD",
    stock: 120,
    imageUrl: "https://placehold.co/300x200.png?p=1",
    imageHint: "solar panel",
    supplierId: "supplier-user-001", // Example supplier UID
    supplierName: "EcoSolar Supplies Ltd.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-002",
    name: "5kW Grid-Tie Inverter",
    description: "Reliable and efficient 5kW grid-tie inverter. Features advanced MPPT technology for optimal energy harvest and a compact design for easy installation.",
    category: "Inverters",
    priceValue: 800.00,
    currencyCode: "USD",
    stock: 45,
    imageUrl: "https://placehold.co/300x200.png?p=2",
    imageHint: "inverter device",
    supplierId: "supplier-user-001",
    supplierName: "EcoSolar Supplies Ltd.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-003",
    name: "Mounting Rail Kit (Set of 4)",
    description: "Complete mounting rail kit including four aluminum rails and necessary hardware. Suitable for standard pitched roofs and compatible with most panel types.",
    category: "Mounting",
    priceValue: 75.00,
    currencyCode: "USD",
    stock: 300,
    imageUrl: "https://placehold.co/300x200.png?p=3",
    imageHint: "metal rails",
    supplierId: "supplier-user-002", // Example supplier UID
    supplierName: "SunPower Components",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-004",
    name: "Solar Cable MC4 Connectors (10 Pairs)",
    description: "Pack of 10 pairs of high-quality MC4 connectors for solar cables. UV resistant and waterproof, ensuring a secure and long-lasting connection.",
    category: "Accessories",
    priceValue: 25.00,
    currencyCode: "USD",
    stock: 500,
    imageUrl: "https://placehold.co/300x200.png?p=4",
    imageHint: "solar cables",
    supplierId: "supplier-user-002",
    supplierName: "SunPower Components",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-005",
    name: "10kWh Lithium Battery Storage",
    description: "High-capacity 10kWh lithium-ion battery for solar energy storage. Provides reliable backup power and helps maximize self-consumption of solar energy. Long cycle life.",
    category: "Batteries",
    priceValue: 4500.00,
    currencyCode: "USD",
    stock: 30,
    imageUrl: "https://placehold.co/300x200.png?p=5",
    imageHint: "solar battery",
    supplierId: "supplier-user-001",
    supplierName: "EcoSolar Supplies Ltd.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// getProductById will now primarily be for mock data if still needed.
// For live data, fetch directly from Firestore by ID.
export const getMockProductById = (id: string): Product | undefined => {
  return sampleProducts.find(product => product.id === id);
};
