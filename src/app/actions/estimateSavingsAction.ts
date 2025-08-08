"use server";

// import { savingsPotentialEstimator, type SavingsPotentialEstimatorInput, type SavingsPotentialEstimatorOutput } from "@/ai/flows/savings-potential-estimator";
import { z } from "zod";
import { logger } from "@/lib/error-handling/logger";

// Temporary mock types until Genkit is properly configured
export interface SavingsPotentialEstimatorInput {
  currentElectricityBill: number;
  solarPanelCost: number;
  averageMonthlyConsumptionKWh: number;
  location: string;
  roofOrientation: string;
  roofShading: string;
}

export interface SavingsPotentialEstimatorOutput {
  estimatedMonthlySavings: number;
  paybackPeriodYears: number;
  totalLifetimeSavings: number;
  co2ReductionKgPerYear: number;
  recommendedSystemSizeKW: number;
}

const InputSchema = z.object({
  currentElectricityBill: z.coerce.number().positive("Current electricity bill must be positive."),
  solarPanelCost: z.coerce.number().positive("Solar panel cost must be positive."),
  averageMonthlyConsumptionKWh: z.coerce.number().positive("Average monthly consumption must be positive."),
  location: z.string().min(1, "Location is required."),
  roofOrientation: z.string().min(1, "Roof orientation is required."),
  roofShading: z.string().min(1, "Roof shading is required."),
});

export interface ActionState {
  data: SavingsPotentialEstimatorOutput | null;
  error: string | null;
  message: string | null;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function estimateSavingsAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const validatedFields = InputSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        data: null,
        error: "Invalid input. Please check the fields.",
        message: null,
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const inputData: SavingsPotentialEstimatorInput = validatedFields.data;
    // const result = await savingsPotentialEstimator(inputData);
    
    // Temporary mock implementation until Genkit is properly configured
    const result: SavingsPotentialEstimatorOutput = {
      estimatedMonthlySavings: inputData.currentElectricityBill * 0.7,
      paybackPeriodYears: inputData.solarPanelCost / (inputData.currentElectricityBill * 12 * 0.7),
      totalLifetimeSavings: inputData.currentElectricityBill * 12 * 0.7 * 25,
      co2ReductionKgPerYear: inputData.averageMonthlyConsumptionKWh * 12 * 0.4,
      recommendedSystemSizeKW: inputData.averageMonthlyConsumptionKWh * 12 / 1200
    };

    return {
      data: result,
      error: null,
      message: "Savings estimation successful!",
    };
  } catch (e) {
    const error = e as Error;
    logger.error("Error in estimateSavingsAction", {
      error: error.message,
      stack: error.stack,
      context: 'savings_estimation'
    });
    return {
      data: null,
      error: error.message || "An unexpected error occurred while estimating savings.",
      message: null,
    };
  }
}
