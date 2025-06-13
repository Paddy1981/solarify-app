
"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Send, Users } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getMockUsersByRole, type MockUser } from "@/lib/mock-data/users";

// Placeholder: In a real app, this would come from energy needs calculation or user profile
const prefilledData = {
  estimatedSystemSizeKW: 5.5,
  monthlyConsumptionKWh: 750,
  name: "John Doe", // This should ideally come from logged-in user context
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
  selectedInstallerIds: z.array(z.string())
    .min(1, "Please select at least one installer.")
    .max(3, "You can select a maximum of three installers.")
    .default([]),
});

type RFQFormData = z.infer<typeof rfqFormSchema>;

export function RFQForm() {
  const { toast } = useToast();
  const [availableInstallers, setAvailableInstallers] = React.useState<MockUser[]>([]);

  React.useEffect(() => {
    // In a real app, fetch installers based on homeowner's location
    setAvailableInstallers(getMockUsersByRole("installer"));
  }, []);

  const form = useForm<RFQFormData>({
    resolver: zodResolver(rfqFormSchema),
    defaultValues: {
      name: prefilledData.name,
      email: prefilledData.email,
      phone: prefilledData.phone,
      address: prefilledData.address,
      estimatedSystemSizeKW: prefilledData.estimatedSystemSizeKW,
      monthlyConsumptionKWh: prefilledData.monthlyConsumptionKWh,
      additionalNotes: undefined, // Optional, Zod default won't apply if undefined and not set explicitly
      includeMonitoring: true, // Explicitly use Zod default or intended default
      includeBatteryStorage: false, // Explicitly use Zod default or intended default
      selectedInstallerIds: [], // Initialize as empty array. Validation will occur on submit/interaction.
    },
  });

  const watchedSelectedInstallers = form.watch("selectedInstallerIds");
  const canSelectMoreInstallers = React.useMemo(() => {
    return watchedSelectedInstallers ? watchedSelectedInstallers.length < 3 : true;
  }, [watchedSelectedInstallers]);


  const onSubmit: SubmitHandler<RFQFormData> = async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("RFQ Data:", data);
    console.log(`Simulating sending RFQ to installers: ${data.selectedInstallerIds.join(', ')}`);
    toast({
      title: "RFQ Generated!",
      description: `Your Request for Quotation has been created and notifications simulated to ${data.selectedInstallerIds.length} installer(s).`,
    });
    // form.reset(); // Optionally reset form
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold font-headline text-primary mb-1">Your Details</h3>
          <p className="text-sm text-muted-foreground mb-4">(Auto-filled for demonstration)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email Address</FormLabel> <FormControl><Input type="email" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem> <FormLabel>Phone Number</FormLabel> <FormControl><Input type="tel" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Installation Address</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold font-headline text-primary mb-1">Solar Requirements</h3>
          <p className="text-sm text-muted-foreground mb-4">(Auto-filled based on calculations or estimates)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="estimatedSystemSizeKW" render={({ field }) => ( <FormItem> <FormLabel>Estimated System Size (kW)</FormLabel> <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="monthlyConsumptionKWh" render={({ field }) => ( <FormItem> <FormLabel>Avg. Monthly Consumption (kWh)</FormLabel> <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl> <FormMessage /> </FormItem> )} />
          </div>
        </div>
        
        <div className="space-y-4">
            <FormField control={form.control} name="includeMonitoring" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">Include System Monitoring</FormLabel>
                </FormItem>
            )} />
            <FormField control={form.control} name="includeBatteryStorage" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">Interested in Battery Storage</FormLabel>
                </FormItem>
            )} />
        </div>

        <FormField
          control={form.control}
          name="selectedInstallerIds"
          render={({ field }) => (
            <FormItem>
              <div className="mb-2">
                <FormLabel className="text-xl font-semibold font-headline text-primary flex items-center"><Users className="w-5 h-5 mr-2"/>Select Installers</FormLabel>
                <FormDescription className="mt-1">
                  Choose 1 to 3 installers to send your RFQ. These would ideally be filtered by your location.
                </FormDescription>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto border p-4 rounded-md bg-muted/30 shadow-sm">
                {availableInstallers.length > 0 ? (
                  availableInstallers.map((installer) => {
                    const isChecked = field.value?.includes(installer.id);
                    // Disable checkbox if it's not checked AND we can't select more
                    const isDisabled = !isChecked && !canSelectMoreInstallers;
                    return (
                      <FormItem key={installer.id} className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-background rounded-md transition-colors">
                        <FormControl>
                          <Checkbox
                            checked={isChecked}
                            disabled={isDisabled}
                            onCheckedChange={(checkedState) => {
                              const currentArray = Array.isArray(field.value) ? field.value : [];
                              if (checkedState) {
                                // This check for length is a safeguard; primary control is `isDisabled`
                                if (currentArray.length < 3) {
                                  field.onChange([...currentArray, installer.id]);
                                }
                              } else {
                                field.onChange(
                                  currentArray.filter((id) => id !== installer.id)
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm cursor-pointer w-full">
                          {installer.companyName || installer.fullName}
                          {installer.location && <span className="text-xs text-muted-foreground block sm:inline sm:ml-2">({installer.location})</span>}
                        </FormLabel>
                      </FormItem>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground p-2">No installers available to select currently.</p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField control={form.control} name="additionalNotes" render={({ field }) => (
            <FormItem>
                <FormLabel className="text-lg font-medium">Additional Notes or Preferences</FormLabel>
                <FormControl>
                    <Textarea
                        placeholder="Any specific requirements, roof type, preferred brands, timeline, etc."
                        rows={4}
                        {...field}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <Button type="submit" disabled={form.formState.isSubmitting} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {form.formState.isSubmitting ? (
            <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg> Generating...</>
          ) : (
            <><Send className="mr-2 h-5 w-5" /> Generate & Send RFQ (Simulated)</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          This will generate an RFQ. Notifications to selected installers are simulated.
        </p>
      </form>
    </Form>
  );
}
