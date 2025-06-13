"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

// Placeholder: In a real app, this would come from energy needs calculation or user profile
const prefilledData = {
  estimatedSystemSizeKW: 5.5,
  monthlyConsumptionKWh: 750,
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "555-123-4567",
  address: "123 Solar St, Sunville, CA 90210",
};

const rfqFormSchema = z.object({
  name: z.string().min(1, "Name is required").default(prefilledData.name),
  email: z.string().email("Invalid email address").default(prefilledData.email),
  phone: z.string().min(10, "Phone number is too short").default(prefilledData.phone),
  address: z.string().min(1, "Address is required").default(prefilledData.address),
  estimatedSystemSizeKW: z.number().positive().default(prefilledData.estimatedSystemSizeKW),
  monthlyConsumptionKWh: z.number().positive().default(prefilledData.monthlyConsumptionKWh),
  additionalNotes: z.string().optional(),
  includeMonitoring: z.boolean().default(true),
  includeBatteryStorage: z.boolean().default(false),
});

type RFQFormData = z.infer<typeof rfqFormSchema>;

export function RFQForm() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control
  } = useForm<RFQFormData>({
    resolver: zodResolver(rfqFormSchema),
    defaultValues: rfqFormSchema.parse({}), // use schema defaults
  });

  const onSubmit: SubmitHandler<RFQFormData> = async (data) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("RFQ Data:", data);
    toast({
      title: "RFQ Generated!",
      description: "Your Request for Quotation has been successfully created (simulated).",
    });
    // reset(); // Optionally reset form
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h3 className="text-xl font-semibold font-headline text-primary">Your Details (Auto-filled)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" {...register("phone")} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Installation Address</Label>
          <Input id="address" {...register("address")} />
          {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
        </div>
      </div>

      <h3 className="text-xl font-semibold font-headline text-primary mt-6">Solar Requirements (Auto-filled)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="estimatedSystemSizeKW">Estimated System Size (kW)</Label>
          <Input id="estimatedSystemSizeKW" type="number" step="0.1" {...register("estimatedSystemSizeKW", { valueAsNumber: true })} />
          {errors.estimatedSystemSizeKW && <p className="text-sm text-destructive">{errors.estimatedSystemSizeKW.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthlyConsumptionKWh">Average Monthly Consumption (kWh)</Label>
          <Input id="monthlyConsumptionKWh" type="number" {...register("monthlyConsumptionKWh", { valueAsNumber: true })} />
          {errors.monthlyConsumptionKWh && <p className="text-sm text-destructive">{errors.monthlyConsumptionKWh.message}</p>}
        </div>
      </div>
      
      <div className="space-y-4 mt-6">
        <div className="flex items-center space-x-2">
          <Checkbox id="includeMonitoring" {...register("includeMonitoring")} defaultChecked={prefilledData.includeMonitoring}/>
          <Label htmlFor="includeMonitoring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Include System Monitoring
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="includeBatteryStorage" {...register("includeBatteryStorage")} />
          <Label htmlFor="includeBatteryStorage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Interested in Battery Storage
          </Label>
        </div>
      </div>

      <div className="space-y-2 mt-6">
        <Label htmlFor="additionalNotes" className="text-lg font-medium">Additional Notes or Preferences</Label>
        <Textarea
          id="additionalNotes"
          placeholder="Any specific requirements, roof type, preferred brands, timeline, etc."
          rows={4}
          {...register("additionalNotes")}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isSubmitting ? (
          <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> Generating...</>
        ) : (
          <><Send className="mr-2 h-5 w-5" /> Generate RFQ (Preview)</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        This will generate an RFQ. In a real application, it would be sent to local installers.
      </p>
    </form>
  );
}
