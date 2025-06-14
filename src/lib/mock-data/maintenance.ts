
import type { Timestamp } from "firebase/firestore";

export type MaintenanceTaskFrequency = "monthly" | "quarterly" | "bi-annually" | "annually" | "as-needed";
export type MaintenanceTaskType = "cleaning" | "inspection" | "check" | "professional_service" | "diy" | "custom";

export interface MaintenanceTask {
  id: string; // Firestore document ID
  userId: string; // UID of the user this task belongs to
  taskType: MaintenanceTaskType;
  taskTitle: string;
  description: string;
  frequency: MaintenanceTaskFrequency;
  lastCompleted?: Timestamp | Date | string; 
  nextDue?: Timestamp | Date | string; 
  isCompleted: boolean;
  reminderSent?: boolean;
  notes?: string;
  estimatedDurationMinutes?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// sampleMaintenanceTasks is now for reference/initial seeding only, not primary data source.
export const sampleMaintenanceTasks: Omit<MaintenanceTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    taskType: "cleaning",
    taskTitle: "Solar Panel Cleaning",
    description: "Gently clean solar panels to remove dust, dirt, and bird droppings to ensure optimal performance. Use soft brush and deionized water if possible.",
    frequency: "quarterly",
    lastCompleted: "2024-04-15",
    nextDue: "2024-07-15",
    isCompleted: false,
    estimatedDurationMinutes: 60,
    notes: "Check for any visible damage while cleaning."
  },
  {
    taskType: "inspection",
    taskTitle: "Inverter & Connections Check",
    description: "Inspect the inverter for any error codes or unusual noises. Check that all wiring connections are secure and free from corrosion or damage.",
    frequency: "bi-annually",
    lastCompleted: "2024-01-20",
    nextDue: "2024-07-20",
    isCompleted: false,
    estimatedDurationMinutes: 30,
  },
];

// Functions like getTaskById are deprecated for live data from Firestore.
// Use Firestore queries instead.

