import { z } from 'zod';

// Solar system configuration validation
export const solarSystemSchema = z.object({
  systemSize: z
    .number()
    .min(1, 'System size must be at least 1 kW')
    .max(1000, 'System size cannot exceed 1000 kW')
    .multipleOf(0.1, 'System size must be in 0.1 kW increments'),
  panelCount: z
    .number()
    .int('Panel count must be a whole number')
    .min(1, 'Must have at least 1 panel')
    .max(10000, 'Panel count cannot exceed 10,000'),
  panelWattage: z
    .number()
    .min(100, 'Panel wattage must be at least 100W')
    .max(700, 'Panel wattage cannot exceed 700W')
    .int('Panel wattage must be a whole number'),
  inverterType: z.enum(['string', 'power_optimizer', 'microinverter']),
  mountingType: z.enum(['roof', 'ground', 'carport', 'awning']),
  roofType: z.enum(['asphalt_shingles', 'metal', 'tile', 'flat', 'other']).optional(),
  azimuth: z
    .number()
    .min(0, 'Azimuth must be between 0 and 360 degrees')
    .max(360, 'Azimuth must be between 0 and 360 degrees'),
  tilt: z
    .number()
    .min(0, 'Tilt must be between 0 and 90 degrees')
    .max(90, 'Tilt must be between 0 and 90 degrees'),
  shading: z.enum(['none', 'minimal', 'moderate', 'significant']),
  interconnectionType: z.enum(['net_metering', 'feed_in_tariff', 'self_consumption']),
});

// Address validation for solar installations
export const addressSchema = z.object({
  street: z
    .string()
    .min(1, 'Street address is required')
    .max(100, 'Street address must not exceed 100 characters'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(50, 'City must not exceed 50 characters'),
  state: z
    .string()
    .min(2, 'State is required')
    .max(50, 'State must not exceed 50 characters'),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  country: z
    .string()
    .min(2, 'Country is required')
    .max(50, 'Country must not exceed 50 characters')
    .default('US'),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
});

// Energy usage validation
export const energyUsageSchema = z.object({
  monthlyUsage: z
    .number()
    .min(0, 'Monthly usage cannot be negative')
    .max(50000, 'Monthly usage seems unreasonably high'),
  yearlyUsage: z
    .number()
    .min(0, 'Yearly usage cannot be negative')
    .max(600000, 'Yearly usage seems unreasonably high')
    .optional(),
  averageMonthlyBill: z
    .number()
    .min(0, 'Monthly bill cannot be negative')
    .max(10000, 'Monthly bill seems unreasonably high'),
  utilityProvider: z
    .string()
    .min(1, 'Utility provider is required')
    .max(100, 'Utility provider name too long'),
  rateSchedule: z
    .string()
    .max(50, 'Rate schedule name too long')
    .optional(),
  peakHours: z
    .array(z.number().min(0).max(23))
    .max(24, 'Cannot have more than 24 peak hours')
    .optional(),
});

// Appliance validation for energy calculator
export const applianceSchema = z.object({
  name: z
    .string()
    .min(1, 'Appliance name is required')
    .max(50, 'Appliance name must not exceed 50 characters'),
  wattage: z
    .number()
    .min(1, 'Wattage must be at least 1W')
    .max(50000, 'Wattage cannot exceed 50,000W'),
  hoursPerDay: z
    .number()
    .min(0, 'Hours per day cannot be negative')
    .max(24, 'Hours per day cannot exceed 24'),
  daysPerWeek: z
    .number()
    .int('Days per week must be a whole number')
    .min(0, 'Days per week cannot be negative')
    .max(7, 'Days per week cannot exceed 7'),
  seasonalUsage: z
    .enum(['year_round', 'summer_only', 'winter_only', 'spring_fall'])
    .default('year_round'),
  priority: z
    .enum(['essential', 'important', 'nice_to_have'])
    .default('important'),
});

// RFQ (Request for Quote) validation
export const rfqSchema = z.object({
  systemType: z.enum(['grid_tied', 'off_grid', 'hybrid']),
  budgetRange: z.enum(['under_10k', '10k_25k', '25k_50k', '50k_100k', 'over_100k']),
  timeframe: z.enum(['immediate', 'within_3_months', 'within_6_months', 'within_year', 'flexible']),
  propertyType: z.enum(['residential', 'commercial', 'industrial', 'agricultural']),
  roofAge: z
    .number()
    .int('Roof age must be a whole number')
    .min(0, 'Roof age cannot be negative')
    .max(100, 'Roof age cannot exceed 100 years')
    .optional(),
  electricalPanelUpgrade: z.boolean().default(false),
  permitsRequired: z.boolean().default(true),
  financingNeeded: z.boolean().default(false),
  additionalRequirements: z
    .string()
    .max(1000, 'Additional requirements must not exceed 1000 characters')
    .optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'text']).default('email'),
});

// Quote validation from installers
export const quoteSchema = z.object({
  systemSize: z
    .number()
    .min(0.1, 'System size must be at least 0.1 kW')
    .max(1000, 'System size cannot exceed 1000 kW'),
  totalCost: z
    .number()
    .min(100, 'Total cost must be at least $100')
    .max(1000000, 'Total cost cannot exceed $1,000,000'),
  pricePerWatt: z
    .number()
    .min(0.5, 'Price per watt seems unreasonably low')
    .max(10, 'Price per watt seems unreasonably high'),
  equipmentCost: z
    .number()
    .min(0, 'Equipment cost cannot be negative'),
  installationCost: z
    .number()
    .min(0, 'Installation cost cannot be negative'),
  permitsCost: z
    .number()
    .min(0, 'Permits cost cannot be negative'),
  estimatedAnnualProduction: z
    .number()
    .min(0, 'Annual production cannot be negative')
    .max(2000000, 'Annual production seems unreasonably high'),
  warrantyYears: z
    .number()
    .int('Warranty years must be a whole number')
    .min(1, 'Warranty must be at least 1 year')
    .max(30, 'Warranty cannot exceed 30 years'),
  paybackPeriod: z
    .number()
    .min(1, 'Payback period must be at least 1 year')
    .max(50, 'Payback period cannot exceed 50 years'),
  financingOptions: z
    .array(z.enum(['cash', 'loan', 'lease', 'ppa']))
    .min(1, 'Must offer at least one financing option'),
  incentivesIncluded: z
    .array(z.string())
    .optional(),
  installationTimeframe: z
    .string()
    .max(100, 'Installation timeframe description too long'),
});

// Equipment specification validation
export const equipmentSpecSchema = z.object({
  category: z.enum(['panel', 'inverter', 'battery', 'mounting', 'monitoring']),
  manufacturer: z
    .string()
    .min(1, 'Manufacturer is required')
    .max(50, 'Manufacturer name too long'),
  model: z
    .string()
    .min(1, 'Model is required')
    .max(100, 'Model name too long'),
  specifications: z.record(z.union([z.string(), z.number()])),
  certifications: z
    .array(z.string())
    .optional(),
  warranty: z
    .object({
      years: z.number().min(1).max(30),
      type: z.enum(['full', 'limited', 'performance']),
      coverage: z.string().max(500),
    })
    .optional(),
});

// Performance monitoring validation
export const performanceDataSchema = z.object({
  timestamp: z.date(),
  powerOutput: z
    .number()
    .min(0, 'Power output cannot be negative'),
  energyProduced: z
    .number()
    .min(0, 'Energy produced cannot be negative'),
  irradiance: z
    .number()
    .min(0, 'Irradiance cannot be negative')
    .max(1500, 'Irradiance seems unreasonably high'),
  temperature: z
    .number()
    .min(-50, 'Temperature seems unreasonably low')
    .max(80, 'Temperature seems unreasonably high'),
  windSpeed: z
    .number()
    .min(0, 'Wind speed cannot be negative')
    .max(200, 'Wind speed seems unreasonably high')
    .optional(),
  humidity: z
    .number()
    .min(0, 'Humidity cannot be negative')
    .max(100, 'Humidity cannot exceed 100%')
    .optional(),
  performanceRatio: z
    .number()
    .min(0, 'Performance ratio cannot be negative')
    .max(1.2, 'Performance ratio seems unreasonably high')
    .optional(),
});

// Type exports
export type SolarSystemData = z.infer<typeof solarSystemSchema>;
export type AddressData = z.infer<typeof addressSchema>;
export type EnergyUsageData = z.infer<typeof energyUsageSchema>;
export type ApplianceData = z.infer<typeof applianceSchema>;
export type RfqData = z.infer<typeof rfqSchema>;
export type QuoteData = z.infer<typeof quoteSchema>;
export type EquipmentSpecData = z.infer<typeof equipmentSpecSchema>;
export type PerformanceData = z.infer<typeof performanceDataSchema>;