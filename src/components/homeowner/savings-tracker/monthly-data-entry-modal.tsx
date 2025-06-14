
"use client";

import React from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import type { MonthlySavingEntry } from '@/app/homeowner/savings-tracker/page';
import { CalendarIcon, DollarSign, Zap, Leaf, TrendingUp } from 'lucide-react';

// Schema for the form, excluding 'id' as it's generated or handled separately
const formSchema = z.object({
  month: z.string()
    .min(7, "Month must be in YYYY-MM format")
    .regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM (e.g., 2024-07)"),
  projectedSavings: z.coerce.number().min(0, "Cannot be negative."),
  actualSavings: z.coerce.number().min(0, "Cannot be negative."),
  energyGenerated: z.coerce.number().min(0, "Cannot be negative.").describe("kWh"),
  energyConsumed: z.coerce.number().min(0, "Cannot be negative.").describe("kWh"),
  gridUsage: z.coerce.number().min(0, "Cannot be negative.").describe("kWh"),
  costSavings: z.coerce.number().min(0, "Cannot be negative."),
  co2Saved: z.coerce.number().min(0, "Cannot be negative.").describe("kg"),
});

type FormData = z.infer<typeof formSchema>;

interface MonthlyDataEntryModalProps {
  onSubmit: (data: FormData) => void;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<MonthlySavingEntry>; // For editing existing data
  currencySymbol?: string;
}

export function MonthlyDataEntryModal({ 
    onSubmit, 
    onOpenChange,
    initialData, 
    currencySymbol = "$" 
}: MonthlyDataEntryModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      month: initialData?.month || new Date().toISOString().substring(0, 7), // Default to current YYYY-MM
      projectedSavings: initialData?.projectedSavings ?? undefined,
      actualSavings: initialData?.actualSavings ?? undefined,
      energyGenerated: initialData?.energyGenerated ?? undefined,
      energyConsumed: initialData?.energyConsumed ?? undefined,
      gridUsage: initialData?.gridUsage ?? undefined,
      costSavings: initialData?.costSavings ?? undefined,
      co2Saved: initialData?.co2Saved ?? undefined,
    },
  });

  const processSubmit: SubmitHandler<FormData> = (data) => {
    onSubmit(data);
    form.reset(); // Reset form after successful submission
    // onOpenChange(false); // This is handled by DialogClose or main page's state
  };

  return (
    <DialogContent className="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle className="flex items-center">
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            {initialData?.month ? `Edit Data for ${initialData.month}` : 'Add New Monthly Savings Data'}
        </DialogTitle>
        <DialogDescription>
          Enter your solar performance and savings details for the selected month.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Month (YYYY-MM)</FormLabel>
                <FormControl>
                  <Input type="month" {...field} />
                </FormControl>
                <FormDescription>Select the year and month for this entry.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="projectedSavings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> Projected Savings ({currencySymbol})</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 120.50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actualSavings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> Actual Savings ({currencySymbol})</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 115.75" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="energyGenerated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Zap className="mr-2 h-4 w-4 text-muted-foreground" /> Energy Generated (kWh)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 450" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="energyConsumed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Zap className="mr-2 h-4 w-4 text-muted-foreground" /> Energy Consumed (kWh)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 300" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="gridUsage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Zap className="mr-2 h-4 w-4 text-muted-foreground" /> Grid Usage (kWh)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costSavings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> Cost Savings ({currencySymbol})</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 60.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="co2Saved"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Leaf className="mr-2 h-4 w-4 text-muted-foreground" /> CO₂ Saved (kg)</FormLabel>
                <FormControl><Input type="number" placeholder="e.g., 200" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                 {form.formState.isSubmitting ? "Saving..." : (initialData?.month ? "Update Data" : "Add Data")}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
