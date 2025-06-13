"use client";

import { useState } from "react";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, Zap, Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const applianceSchema = z.object({
  name: z.string().min(1, "Appliance name is required"),
  wattage: z.number().min(1, "Wattage must be positive"),
  hoursPerDay: z.number().min(0).max(24, "Hours must be between 0 and 24"),
});

const formSchema = z.object({
  appliances: z.array(applianceSchema).min(1, "Please add at least one appliance"),
  currentMonthlyBill: z.number().min(0, "Bill amount must be positive").optional(),
});

type Appliance = z.infer<typeof applianceSchema>;
type FormData = z.infer<typeof formSchema>;

interface CalculationResult {
  dailyConsumptionKWh: number;
  monthlyConsumptionKWh: number;
  suggestedSystemSizeKW: number;
}

export function EnergyCalculatorForm() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appliances: [{ name: "", wattage: 0, hoursPerDay: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "appliances",
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    let totalDailyWattHours = 0;
    data.appliances.forEach(appliance => {
      totalDailyWattHours += appliance.wattage * appliance.hoursPerDay;
    });

    const dailyConsumptionKWh = totalDailyWattHours / 1000;
    const monthlyConsumptionKWh = dailyConsumptionKWh * 30; // Approximate
    
    // Simplified system size suggestion: assume 4 peak sun hours per day
    // System Size (kW) = Daily Consumption (kWh) / Peak Sun Hours
    // Add a 25% buffer for system losses and future needs
    const suggestedSystemSizeKW = (dailyConsumptionKWh / 4) * 1.25;


    setCalculationResult({
      dailyConsumptionKWh: parseFloat(dailyConsumptionKWh.toFixed(2)),
      monthlyConsumptionKWh: parseFloat(monthlyConsumptionKWh.toFixed(2)),
      suggestedSystemSizeKW: parseFloat(suggestedSystemSizeKW.toFixed(2)),
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2 font-headline">Appliances</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-md mb-4 shadow-sm bg-background">
              <div className="space-y-1 col-span-1 md:col-span-2">
                <Label htmlFor={`appliances.${index}.name`}>Appliance Name</Label>
                <Input
                  id={`appliances.${index}.name`}
                  placeholder="e.g., Refrigerator, TV"
                  {...register(`appliances.${index}.name`)}
                />
                {errors.appliances?.[index]?.name && (
                  <p className="text-sm text-destructive">{errors.appliances[index]?.name?.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor={`appliances.${index}.wattage`}>Wattage (W)</Label>
                <Input
                  id={`appliances.${index}.wattage`}
                  type="number"
                  placeholder="e.g., 150"
                  {...register(`appliances.${index}.wattage`, { valueAsNumber: true })}
                />
                {errors.appliances?.[index]?.wattage && (
                  <p className="text-sm text-destructive">{errors.appliances[index]?.wattage?.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor={`appliances.${index}.hoursPerDay`}>Hours/Day</Label>
                <Input
                  id={`appliances.${index}.hoursPerDay`}
                  type="number"
                  step="0.1"
                  placeholder="e.g., 8"
                  {...register(`appliances.${index}.hoursPerDay`, { valueAsNumber: true })}
                />
                {errors.appliances?.[index]?.hoursPerDay && (
                  <p className="text-sm text-destructive">{errors.appliances[index]?.hoursPerDay?.message}</p>
                )}
              </div>
              {fields.length > 1 && (
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-destructive hover:bg-destructive/10 md:col-start-4 md:justify-self-end"
                    aria-label="Remove appliance"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
              )}
            </div>
          ))}
          {errors.appliances?.root && (
            <p className="text-sm text-destructive mt-1">{errors.appliances.root.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ name: "", wattage: 0, hoursPerDay: 0 })}
            className="mt-2"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Appliance
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="currentMonthlyBill" className="text-lg font-medium font-headline">Current Monthly Electricity Bill (Optional)</Label>
          <Input
            id="currentMonthlyBill"
            type="number"
            step="0.01"
            placeholder="Enter your average monthly bill in $"
            {...register("currentMonthlyBill", { valueAsNumber: true, required: false })}
          />
          {errors.currentMonthlyBill && (
            <p className="text-sm text-destructive">{errors.currentMonthlyBill.message}</p>
          )}
        </div>
        
        <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Lightbulb className="mr-2 h-5 w-5" /> Calculate Energy Needs
        </Button>
      </form>

      {calculationResult && (
        <Card className="mt-8 shadow-md bg-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center text-primary">Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg">
            <div className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
              <span className="font-medium">Daily Energy Consumption:</span>
              <span className="font-bold text-primary">{calculationResult.dailyConsumptionKWh} kWh</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
              <span className="font-medium">Monthly Energy Consumption (approx.):</span>
              <span className="font-bold text-primary">{calculationResult.monthlyConsumptionKWh} kWh</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
              <span className="font-medium">Suggested Solar System Size:</span>
              <span className="font-bold text-primary">{calculationResult.suggestedSystemSizeKW} kW</span>
            </div>
          </CardContent>
          <CardFooter>
             <p className="text-sm text-muted-foreground text-center w-full">
              Note: This is a simplified estimation. Actual system size may vary based on location, roof characteristics, and specific energy goals.
            </p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
