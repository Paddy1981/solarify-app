
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { SavingsOverviewCard } from '@/components/homeowner/savings-tracker/savings-overview-card';
import { SavingsTrendChart } from '@/components/homeowner/savings-tracker/savings-trend-chart';
import { SavingsComparisonChart } from '@/components/homeowner/savings-tracker/savings-comparison-chart';
import { MonthlyDataEntryModal } from '@/components/homeowner/savings-tracker/monthly-data-entry-modal';
import { DollarSign, TrendingUp, Zap, Leaf, FilePlus, Download, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface MonthlySavingEntry {
  id: string; // YYYY-MM or a unique ID
  month: string; // "YYYY-MM" format for display & sorting
  projectedSavings: number;
  actualSavings: number;
  energyGenerated: number; // kWh
  energyConsumed: number; // kWh
  gridUsage: number; // kWh
  costSavings: number; // currency
  co2Saved: number; // kg
}

// Sample data - in a real app, this would come from a backend/Firebase
const initialSampleData: MonthlySavingEntry[] = [
  { id: '2024-01', month: '2024-01', projectedSavings: 100, actualSavings: 95, energyGenerated: 300, energyConsumed: 250, gridUsage: 50, costSavings: 45, co2Saved: 150 },
  { id: '2024-02', month: '2024-02', projectedSavings: 110, actualSavings: 115, energyGenerated: 350, energyConsumed: 260, gridUsage: 40, costSavings: 55, co2Saved: 175 },
  { id: '2024-03', month: '2024-03', projectedSavings: 120, actualSavings: 125, energyGenerated: 400, energyConsumed: 270, gridUsage: 30, costSavings: 60, co2Saved: 200 },
  { id: '2024-04', month: '2024-04', projectedSavings: 130, actualSavings: 120, energyGenerated: 450, energyConsumed: 300, gridUsage: 20, costSavings: 58, co2Saved: 225 },
  { id: '2024-05', month: '2024-05', projectedSavings: 140, actualSavings: 150, energyGenerated: 500, energyConsumed: 280, gridUsage: 10, costSavings: 70, co2Saved: 250 },
];

export default function SavingsTrackerPage() {
  const [savingsData, setSavingsData] = useState<MonthlySavingEntry[]>(initialSampleData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAddData = (newData: Omit<MonthlySavingEntry, 'id'>) => {
    const entryId = newData.month; // Use YYYY-MM as ID for simplicity in mock
    const existingEntryIndex = savingsData.findIndex(entry => entry.id === entryId);
    
    let updatedData;
    if (existingEntryIndex > -1) {
      updatedData = savingsData.map((entry, index) => 
        index === existingEntryIndex ? { ...entry, ...newData, id: entryId } : entry
      );
      toast({ title: "Data Updated", description: `Savings data for ${newData.month} has been updated.` });
    } else {
      updatedData = [...savingsData, { ...newData, id: entryId }];
      toast({ title: "Data Added", description: `New savings data for ${newData.month} has been added.` });
    }
    
    // Sort data by month after adding/updating
    updatedData.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    setSavingsData(updatedData);
    setIsModalOpen(false); // Close modal on successful submission
  };

  const totalActualSavingsYTD = savingsData.reduce((acc, item) => acc + item.actualSavings, 0);
  const averageMonthlySavings = savingsData.length > 0 ? totalActualSavingsYTD / savingsData.length : 0;
  const totalCO2SavedYTD = savingsData.reduce((acc, item) => acc + item.co2Saved, 0);
  const totalEnergyGeneratedYTD = savingsData.reduce((acc, item) => acc + item.energyGenerated, 0);

  // For currency, this should ideally come from user profile or a global context
  const currencySymbol = "$"; // Placeholder

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <TrendingUp className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-headline">Monthly Savings Tracker</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Monitor your solar savings, energy production, and environmental impact over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6 space-x-3">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FilePlus className="mr-2 h-5 w-5" /> Add Monthly Data
                </Button>
              </DialogTrigger>
              <MonthlyDataEntryModal onSubmit={handleAddData} onOpenChange={setIsModalOpen} />
            </Dialog>
            <Button variant="outline" onClick={() => toast({ title: "Coming Soon!", description: "Export functionality will be available in a future update."})}>
              <Download className="mr-2 h-5 w-5" /> Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SavingsOverviewCard
              title="Total Savings YTD"
              value={`${currencySymbol}${totalActualSavingsYTD.toFixed(2)}`}
              icon={<DollarSign className="w-8 h-8 text-green-500" />}
              description="Actual savings this year"
            />
            <SavingsOverviewCard
              title="Avg. Monthly Savings"
              value={`${currencySymbol}${averageMonthlySavings.toFixed(2)}`}
              icon={<DollarSign className="w-8 h-8 text-blue-500" />}
              description="Average of recorded months"
            />
            <SavingsOverviewCard
              title="CO₂ Saved YTD"
              value={`${totalCO2SavedYTD.toFixed(0)} kg`}
              icon={<Leaf className="w-8 h-8 text-green-600" />}
              description="Your environmental impact"
            />
            <SavingsOverviewCard
              title="Energy Generated YTD"
              value={`${totalEnergyGeneratedYTD.toFixed(0)} kWh`}
              icon={<Zap className="w-8 h-8 text-yellow-500" />}
              description="Total solar production"
            />
          </div>

          {savingsData.length > 0 ? (
            <>
              <Card className="mb-8 shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline">Savings Trends Over Time</CardTitle>
                  <CardDescription>Projected vs. Actual Monthly Savings ({currencySymbol})</CardDescription>
                </CardHeader>
                <CardContent>
                  <SavingsTrendChart data={savingsData} currencySymbol={currencySymbol} />
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline">Monthly Performance Breakdown</CardTitle>
                  <CardDescription>Comparison of Projected vs. Actual Savings by Month ({currencySymbol})</CardDescription>
                </CardHeader>
                <CardContent>
                  <SavingsComparisonChart data={savingsData} currencySymbol={currencySymbol}/>
                </CardContent>
              </Card>
            </>
          ) : (
             <Alert variant="default" className="bg-muted/50">
                <Info className="h-5 w-5 text-primary" />
                <AlertTitle className="font-medium">No Data Yet</AlertTitle>
                <AlertDescription>
                  Start by adding your monthly solar performance data to see your savings and trends.
                </AlertDescription>
              </Alert>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            All data is currently stored locally in your browser for demonstration.
            Actual savings depend on various factors including weather, system performance, and energy prices.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
