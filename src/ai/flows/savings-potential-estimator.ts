'use server';

/**
 * @fileOverview A flow for estimating the potential savings, payback period, and ROI of solar panel installation.
 *
 * - savingsPotentialEstimator - A function that calculates potential savings.
 * - SavingsPotentialEstimatorInput - The input type for the savingsPotentialEstimator function.
 * - SavingsPotentialEstimatorOutput - The return type for the savingsPotentialEstimator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SavingsPotentialEstimatorInputSchema = z.object({
  currentElectricityBill: z
    .number()
    .describe('The current monthly electricity bill in dollars.'),
  solarPanelCost: z
    .number()
    .describe('The estimated total cost of solar panel installation in dollars.'),
  averageMonthlyConsumptionKWh: z
    .number()
    .describe('The average monthly electricity consumption in kWh.'),
  location: z
    .string()
    .describe('The location of the property (city, state).'),
  roofOrientation: z
    .string()
    .describe('The orientation of the roof (e.g., South, East, West, North).'),
  roofShading: z
    .string()
    .describe('The amount of shading on the roof (e.g., None, Partial, Full).'),
});
export type SavingsPotentialEstimatorInput = z.infer<
  typeof SavingsPotentialEstimatorInputSchema
>;

const SavingsPotentialEstimatorOutputSchema = z.object({
  estimatedSavingsPerYear: z
    .number()
    .describe('The estimated annual savings in dollars.'),
  paybackPeriodYears: z.number().describe('The estimated payback period in years.'),
  roiPercentage: z.number().describe('The estimated return on investment (ROI) as a percentage.'),
  promptUserAboutData: z.string().optional().describe('Any prompts to the user about data that may influence the estimate.')
});
export type SavingsPotentialEstimatorOutput = z.infer<
  typeof SavingsPotentialEstimatorOutputSchema
>;

export async function savingsPotentialEstimator(
  input: SavingsPotentialEstimatorInput
): Promise<SavingsPotentialEstimatorOutput> {
  return savingsPotentialEstimatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'savingsPotentialEstimatorPrompt',
  input: {schema: SavingsPotentialEstimatorInputSchema},
  output: {schema: SavingsPotentialEstimatorOutputSchema},
  prompt: `You are an expert financial advisor specializing in solar panel investments. 

You will receive information about a homeowner's current electricity bill, the cost of solar panel installation, their location, roof orientation, and roof shading.  Based on this information, you will estimate the potential savings per year, payback period, and ROI for the homeowner.  

Consider factors such as the location's solar irradiance, the impact of roof orientation and shading on energy production, and typical electricity prices in the area. Also, prompt the user about additional data that may influence the estimate, such as potential government incentives or changes in electricity prices.

Current Electricity Bill: ${'{{currentElectricityBill}}'}
Solar Panel Cost: ${'{{solarPanelCost}}'}
Average Monthly Consumption: ${'{{averageMonthlyConsumptionKWh}}'} kWh
Location: ${'{{location}}'}
Roof Orientation: ${'{{roofOrientation}}'}
Roof Shading: ${'{{roofShading}}'}

Estimate the following:
- Estimated Savings Per Year (dollars):
- Payback Period (years):
- ROI (%):
- Prompts to the User about data which may influence the estimate:

Output in JSON format.`, 
});

const savingsPotentialEstimatorFlow = ai.defineFlow(
  {
    name: 'savingsPotentialEstimatorFlow',
    inputSchema: SavingsPotentialEstimatorInputSchema,
    outputSchema: SavingsPotentialEstimatorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
