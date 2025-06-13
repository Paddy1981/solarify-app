
export interface Product {
  id: string;
  name: string;
  price: string; // Keep as string for now, e.g., "$250.00"
  priceValue: number; // Numerical price for calculations
  imageUrl: string;
  imageHint: string;
  stock: number;
  category: string;
  description: string;
  supplierId?: string; // Optional: To link product to a supplier
}

export const sampleProducts: Product[] = [
  { 
    id: "prod-001", 
    name: "High-Efficiency Solar Panel 450W", 
    price: "$250.00", 
    priceValue: 250.00,
    imageUrl: "https://placehold.co/300x200.png?p=1", 
    imageHint: "solar panel", 
    stock: 120, 
    category: "Panels",
    description: "A top-tier 450W monocrystalline solar panel, offering excellent performance and durability. Ideal for residential and commercial installations seeking maximum power output.",
    supplierId: "supplier-user-001"
  },
  { 
    id: "prod-002", 
    name: "5kW Grid-Tie Inverter", 
    price: "$800.00", 
    priceValue: 800.00,
    imageUrl: "https://placehold.co/300x200.png?p=2", 
    imageHint: "inverter device", 
    stock: 45, 
    category: "Inverters",
    description: "Reliable and efficient 5kW grid-tie inverter. Features advanced MPPT technology for optimal energy harvest and a compact design for easy installation.",
    supplierId: "supplier-user-001"
  },
  { 
    id: "prod-003", 
    name: "Mounting Rail Kit (Set of 4)", 
    price: "$75.00", 
    priceValue: 75.00,
    imageUrl: "https://placehold.co/300x200.png?p=3", 
    imageHint: "metal rails", 
    stock: 300, 
    category: "Mounting",
    description: "Complete mounting rail kit including four aluminum rails and necessary hardware. Suitable for standard pitched roofs and compatible with most panel types.",
    supplierId: "supplier-user-002"
  },
  { 
    id: "prod-004", 
    name: "Solar Cable MC4 Connectors (10 Pairs)", 
    price: "$25.00", 
    priceValue: 25.00,
    imageUrl: "https://placehold.co/300x200.png?p=4", 
    imageHint: "solar cables", 
    stock: 500, 
    category: "Accessories",
    description: "Pack of 10 pairs of high-quality MC4 connectors for solar cables. UV resistant and waterproof, ensuring a secure and long-lasting connection.",
    supplierId: "supplier-user-002"
  },
  {
    id: "prod-005",
    name: "10kWh Lithium Battery Storage",
    price: "$4500.00",
    priceValue: 4500.00,
    imageUrl: "https://placehold.co/300x200.png?p=5",
    imageHint: "solar battery",
    stock: 30,
    category: "Batteries",
    description: "High-capacity 10kWh lithium-ion battery for solar energy storage. Provides reliable backup power and helps maximize self-consumption of solar energy. Long cycle life.",
    supplierId: "supplier-user-001"
  },
];

export const getProductById = (id: string): Product | undefined => {
  return sampleProducts.find(product => product.id === id);
};
