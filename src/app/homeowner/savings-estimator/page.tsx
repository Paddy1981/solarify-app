import { SavingsEstimatorForm } from "@/components/homeowner/savings-estimator-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartBig, TrendingUp } from "lucide-react";

export default function SavingsEstimatorPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <TrendingUp className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Savings Potential Estimator</CardTitle>
          <CardDescription>
            Discover your potential savings, payback period, and ROI from solar panel installation.
            This AI-powered tool considers your energy use, location, and roof details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SavingsEstimatorForm />
        </CardContent>
      </Card>
    </div>
  );
}
