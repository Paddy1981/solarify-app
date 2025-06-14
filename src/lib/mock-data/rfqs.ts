
import type { Timestamp } from "firebase/firestore";

export interface RFQ {
  id: string; // Firestore document ID
  homeownerId: string; 
  name: string; 
  email: string;
  phone?: string;
  address?: string;
  estimatedSystemSizeKW: number;
  monthlyConsumptionKWh: number;
  additionalNotes?: string;
  includeMonitoring: boolean;
  includeBatteryStorage: boolean;
  dateCreated: Timestamp; 
  selectedInstallerIds: string[]; 
  status: "Pending" | "Responded" | "Closed";
}

// sampleRFQs can be kept for reference or initial testing if needed, but is no longer the primary source.
export const sampleRFQs: RFQ[] = [
  // {
  //   id: "rfq-001",
  //   homeownerId: "homeowner-user-001", 
  //   name: "Aarav Menon",
  //   email: "aarav.menon@example.com",
  //   phone: "555-001-0001",
  //   address: "101 Sunshine Ave, Sunville, CA 90210",
  //   estimatedSystemSizeKW: 6.2,
  //   monthlyConsumptionKWh: 800,
  //   additionalNotes: "Looking for high-efficiency panels. South-facing roof, no shade.",
  //   includeMonitoring: true,
  //   includeBatteryStorage: true,
  //   dateCreated: new Date("2024-07-10") as any, // Casting for mock data, Firestore will use Timestamps
  //   selectedInstallerIds: ["installer-user-001", "installer-user-002"],
  //   status: "Responded",
  // },
  // ... other samples if needed for local testing where Firestore might not be fully set up
];

// getRFQById and getRFQsByHomeownerId are deprecated for live data,
// as data will be fetched directly from Firestore.
// These can be removed or kept for testing mock scenarios only.
export const getMockRFQById = (id: string): RFQ | undefined => {
  // This function would now be for mock data testing only
  // return sampleRFQs.find(rfq => rfq.id === id);
  return undefined; 
};

export function getMockRFQsByHomeownerId(homeownerId: string): RFQ[] {
  // This function would now be for mock data testing only
  // if (!homeownerId) return [];
  // return sampleRFQs.filter(rfq => rfq.homeownerId === homeownerId);
  return [];
}
