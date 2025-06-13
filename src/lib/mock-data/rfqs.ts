
import type { MockUser } from "./users"; // Assuming MockUser might be useful for homeowner/installer details later

export interface RFQ {
  id: string;
  homeownerId: string; // ID of the homeowner who created the RFQ
  name: string; // Prefilled from homeowner profile
  email: string;
  phone: string;
  address: string;
  estimatedSystemSizeKW: number;
  monthlyConsumptionKWh: number;
  additionalNotes?: string;
  includeMonitoring: boolean;
  includeBatteryStorage: boolean;
  dateCreated: string;
  selectedInstallerIds: string[]; // IDs of installers selected by the homeowner
  status: "Pending" | "Responded" | "Closed";
}

// Let's assume some mock homeowner and installer IDs for consistent samples
// From users.ts:
// Homeowner IDs: homeowner-user-001, homeowner-user-002, etc.
// Installer IDs: installer-user-001, installer-user-002, etc.

export const sampleRFQs: RFQ[] = [
  {
    id: "rfq-001",
    homeownerId: "homeowner-user-001", // Mock homeowner ID
    name: "Aarav Menon",
    email: "aarav.menon@example.com",
    phone: "555-001-0001",
    address: "101 Sunshine Ave, Sunville, CA 90210",
    estimatedSystemSizeKW: 6.2,
    monthlyConsumptionKWh: 800,
    additionalNotes: "Looking for high-efficiency panels. South-facing roof, no shade.",
    includeMonitoring: true,
    includeBatteryStorage: true,
    dateCreated: "2024-07-10",
    selectedInstallerIds: ["installer-user-001", "installer-user-002"], // Mock installer IDs
    status: "Pending",
  },
  {
    id: "rfq-002",
    homeownerId: "homeowner-user-002",
    name: "Priya Rao",
    email: "priya.rao@example.com",
    phone: "555-002-0002",
    address: "202 Solar Rd, Brightown, TX 75001",
    estimatedSystemSizeKW: 4.5,
    monthlyConsumptionKWh: 650,
    additionalNotes: "Interested in Tesla Powerwall if possible. Tile roof.",
    includeMonitoring: true,
    includeBatteryStorage: false,
    dateCreated: "2024-07-15",
    selectedInstallerIds: ["installer-user-001", "installer-user-003", "installer-user-004"],
    status: "Responded",
  },
  {
    id: "rfq-003",
    homeownerId: "homeowner-user-003",
    name: "Vikram Iyer",
    email: "vikram.iyer@example.com",
    phone: "555-003-0003",
    address: "303 Energy Ln, Powerton, FL 33001",
    estimatedSystemSizeKW: 8.0,
    monthlyConsumptionKWh: 1200,
    additionalNotes: "Large property, considering ground mount system as well.",
    includeMonitoring: true,
    includeBatteryStorage: true,
    dateCreated: "2024-07-20",
    selectedInstallerIds: ["installer-user-002"],
    status: "Pending",
  },
];

export const getRFQById = (id: string): RFQ | undefined => {
  return sampleRFQs.find(rfq => rfq.id === id);
};
