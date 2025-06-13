"use server";

import { savingsPotentialEstimator, type SavingsPotentialEstimatorInput, type SavingsPotentialEstimatorOutput } from "@/ai/flows/savings-potential-estimator";
import { z } from "zod";

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
    const result = await savingsPotentialEstimator(inputData);

    return {
      data: result,
      error: null,
      message: "Savings estimation successful!",
    };
  } catch (e) {
    const error = e as Error;
    console.error("Error in estimateSavingsAction:", error);
    return {
      data: null,
      error: error.message || "An unexpected error occurred while estimating savings.",
      message: null,
    };
  }
}
