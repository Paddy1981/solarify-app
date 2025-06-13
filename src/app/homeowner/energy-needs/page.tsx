import { EnergyCalculatorForm } from "@/components/homeowner/energy-calculator-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export default function EnergyNeedsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Calculator className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Solar Requirement Calculator</CardTitle>
          <CardDescription>
            Estimate your energy consumption and the solar system size you might need.
            Input your home appliances and typical daily usage below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnergyCalculatorForm />
        </CardContent>
      </Card>
    </div>
  );
}
