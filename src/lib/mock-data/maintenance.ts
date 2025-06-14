
export type MaintenanceTaskFrequency = "monthly" | "quarterly" | "bi-annually" | "annually" | "as-needed";
export type MaintenanceTaskType = "cleaning" | "inspection" | "check" | "professional_service" | "diy";

export interface MaintenanceTask {
  id: string;
  taskType: MaintenanceTaskType;
  taskTitle: string;
  description: string;
  frequency: MaintenanceTaskFrequency;
  lastCompleted?: string; // ISO date string
  nextDue?: string; // ISO date string
  isCompleted: boolean;
  reminderSent?: boolean;
  notes?: string;
  estimatedDurationMinutes?: number;
  // images: array, // for future use
}

export const sampleMaintenanceTasks: MaintenanceTask[] = [
  {
    id: "task-001",
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
    id: "task-002",
    taskType: "inspection",
    taskTitle: "Inverter & Connections Check",
    description: "Inspect the inverter for any error codes or unusual noises. Check that all wiring connections are secure and free from corrosion or damage.",
    frequency: "bi-annually",
    lastCompleted: "2024-01-20",
    nextDue: "2024-07-20",
    isCompleted: false,
    estimatedDurationMinutes: 30,
  },
  {
    id: "task-003",
    taskType: "diy",
    taskTitle: "Clear Debris Around Panels",
    description: "Remove any leaves, branches, or other debris that may be shading or accumulating around the solar panels and mounting.",
    frequency: "monthly",
    nextDue: "2024-08-01", // Assuming this is the next upcoming one
    isCompleted: false,
    estimatedDurationMinutes: 20,
  },
  {
    id: "task-004",
    taskType: "professional_service",
    taskTitle: "Full System Inspection by Professional",
    description: "Schedule a comprehensive system check-up by a qualified solar technician. Includes electrical testing, mounting integrity, and performance analysis.",
    frequency: "annually",
    lastCompleted: "2023-09-01",
    nextDue: "2024-09-01",
    isCompleted: false,
    estimatedDurationMinutes: 120,
    notes: "Contact 'ProSolar Installations Inc.' or another certified provider."
  },
   {
    id: "task-005",
    taskType: "check",
    taskTitle: "Monitor Energy Production",
    description: "Review your system's energy production via your monitoring app or utility bills. Compare with previous periods and expected output.",
    frequency: "monthly",
    lastCompleted: "2024-07-01",
    nextDue: "2024-08-01",
    isCompleted: true, // Example of a recently completed task
    reminderSent: false,
  },
];

export function getTaskById(id: string): MaintenanceTask | undefined {
  return sampleMaintenanceTasks.find(task => task.id === id);
}
