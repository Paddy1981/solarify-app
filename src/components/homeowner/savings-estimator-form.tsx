"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { estimateSavingsAction, type ActionState } from "@/app/actions/estimateSavingsAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialState: ActionState = {
  data: null,
  error: null,
  message: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Estimating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" /> Estimate Savings
        </>
      )}
    </Button>
  );
}

export function SavingsEstimatorForm() {
  const [state, formAction] = useFormState(estimateSavingsAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      toast({
        title: "Success",
        description: state.message,
      });
    }
    if (state.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive",
      });
    }
  }, [state.message, state.error, toast]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="currentElectricityBill">Current Monthly Electricity Bill ($)</Label>
          <Input id="currentElectricityBill" name="currentElectricityBill" type="number" placeholder="e.g., 150" required />
          {state.fieldErrors?.currentElectricityBill && <p className="text-sm text-destructive">{state.fieldErrors.currentElectricityBill[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="solarPanelCost">Estimated Solar Panel Cost ($)</Label>
          <Input id="solarPanelCost" name="solarPanelCost" type="number" placeholder="e.g., 15000" required />
          {state.fieldErrors?.solarPanelCost && <p className="text-sm text-destructive">{state.fieldErrors.solarPanelCost[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="averageMonthlyConsumptionKWh">Average Monthly Consumption (kWh)</Label>
          <Input id="averageMonthlyConsumptionKWh" name="averageMonthlyConsumptionKWh" type="number" placeholder="e.g., 750" required />
          {state.fieldErrors?.averageMonthlyConsumptionKWh && <p className="text-sm text-destructive">{state.fieldErrors.averageMonthlyConsumptionKWh[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location (City, State)</Label>
          <Input id="location" name="location" placeholder="e.g., Austin, TX" required />
          {state.fieldErrors?.location && <p className="text-sm text-destructive">{state.fieldErrors.location[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="roofOrientation">Roof Orientation</Label>
          <Select name="roofOrientation" required>
            <SelectTrigger id="roofOrientation">
              <SelectValue placeholder="Select orientation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="Flat">Flat</SelectItem>
              <SelectItem value="Multiple">Multiple</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.roofOrientation && <p className="text-sm text-destructive">{state.fieldErrors.roofOrientation[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="roofShading">Roof Shading</Label>
          <Select name="roofShading" required>
            <SelectTrigger id="roofShading">
              <SelectValue placeholder="Select shading" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Full">Full</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.roofShading && <p className="text-sm text-destructive">{state.fieldErrors.roofShading[0]}</p>}
        </div>
      </div>

      <SubmitButton />

      {state.data && (
        <Card className="mt-8 shadow-md bg-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center text-primary">Estimated Solar Potential</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg">
            <div className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
              <span className="font-medium">Estimated Annual Savings:</span>
              <span className="font-bold text-primary">${state.data.estimatedSavingsPerYear.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
              <span className="font-medium">Payback Period:</span>
              <span className="font-bold text-primary">{state.data.paybackPeriodYears.toFixed(1)} years</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
              <span className="font-medium">Return on Investment (ROI):</span>
              <span className="font-bold text-primary">{state.data.roiPercentage.toFixed(1)}%</span>
            </div>
            {state.data.promptUserAboutData && (
              <Alert variant="default" className="mt-4 bg-accent/10 border-accent/50">
                <Info className="h-5 w-5 text-accent" />
                <AlertTitle className="font-headline text-accent">Important Considerations</AlertTitle>
                <AlertDescription className="text-accent/90">
                  {state.data.promptUserAboutData}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
             <p className="text-sm text-muted-foreground text-center w-full">
              These are AI-generated estimates. Actual results may vary. Consult with a professional installer for precise figures.
            </p>
          </CardFooter>
        </Card>
      )}
    </form>
  );
}
