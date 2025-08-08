
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Send, Users, Loader2 } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MobileForm, MobileFormSection, MobileFormField, MobileFormGrid } from "@/components/ui/mobile-form";
import { getMockUsersByRole, type MockUser } from "@/lib/mock-data/users"; // Still used for listing installers
import { Skeleton } from "@/components/ui/skeleton";
import { db, serverTimestamp } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { logger } from "@/lib/error-handling/logger";

const rfqFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is too short").optional().or(z.literal('')),
  address: z.string().min(1, "Address is required").optional().or(z.literal('')),
  estimatedSystemSizeKW: z.coerce.number().positive("System size must be positive."),
  monthlyConsumptionKWh: z.coerce.number().positive("Consumption must be positive."),
  additionalNotes: z.string().optional(),
  includeMonitoring: z.boolean().default(true),
  includeBatteryStorage: z.boolean().default(false),
  selectedInstallerIds: z.array(z.string())
    .min(1, "Please select at least one installer.")
    .max(3, "You can select a maximum of three installers.")
    .default([]),
});

type RFQFormData = z.infer<typeof rfqFormSchema>;

interface RFQFormProps {
  homeownerDetails: MockUser;
}

export function RFQForm({ homeownerDetails }: RFQFormProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [availableInstallers, setAvailableInstallers] = React.useState<MockUser[]>([]);
  const [hasMounted, setHasMounted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    setHasMounted(true);
    // In a real app, fetch installers based on homeowner's location from Firestore
    // For now, using mock data for installer selection
    setAvailableInstallers(getMockUsersByRole("installer"));
  }, []);

  const form = useForm<RFQFormData>({
    resolver: zodResolver(rfqFormSchema),
    defaultValues: {
      name: homeownerDetails.fullName,
      email: homeownerDetails.email,
      phone: homeownerDetails.phone || "",
      address: homeownerDetails.address || "",
      estimatedSystemSizeKW: 5.0,
      monthlyConsumptionKWh: 700,
      additionalNotes: "",
      includeMonitoring: true,
      includeBatteryStorage: false,
      selectedInstallerIds: [],
    },
  });

  const watchedSelectedInstallers = form.watch("selectedInstallerIds");
  const canSelectMoreInstallers = React.useMemo(() => {
    return watchedSelectedInstallers ? watchedSelectedInstallers.length < 3 : true;
  }, [watchedSelectedInstallers]);


  const onSubmit: SubmitHandler<RFQFormData> = async (data) => {
    setIsSubmitting(true);
    if (!homeownerDetails || !homeownerDetails.id) {
        toast({ title: "Error", description: "Homeowner ID is missing. Please log in again.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
      const rfqDataToSave = {
        ...data,
        homeownerId: homeownerDetails.id,
        dateCreated: serverTimestamp(),
        status: "Pending" as const,
      };
      
      const docRef = await addDoc(collection(db, "rfqs"), rfqDataToSave);
      logger.info('RFQ Data saved to Firestore', { 
        rfqId: docRef.id,
        homeownerId: homeownerDetails.id,
        installerCount: data.selectedInstallerIds.length,
        context: 'rfq_submission'
      });
      
      toast({
        title: "RFQ Submitted!",
        description: `Your Request for Quotation has been successfully submitted to ${data.selectedInstallerIds.length} installer(s). RFQ ID: ${docRef.id}`,
      });
      form.reset(); 
    } catch (error) {
      logger.error('Error saving RFQ to Firestore', {
        error: error instanceof Error ? error.message : String(error),
        homeownerId: homeownerDetails.id,
        context: 'rfq_submission'
      });
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your RFQ. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const formSteps = [
    {
      id: 'personal-details',
      title: 'Your Details',
      description: 'Automatically pre-filled from your profile',
      content: (
        <MobileFormSection title="Contact Information">
          <MobileFormGrid columns={isMobile ? 1 : 2}>
            <FormField control={form.control} name="name" render={({ field }) => (
              <MobileFormField label="Full Name" required>
                <Input {...field} readOnly className="bg-muted/50 border-muted" />
              </MobileFormField>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <MobileFormField label="Email Address" required>
                <Input type="email" {...field} readOnly className="bg-muted/50 border-muted" />
              </MobileFormField>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <MobileFormField label="Phone Number">
                <Input type="tel" {...field} />
              </MobileFormField>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <MobileFormField label="Installation Address">
                <Input {...field} />
              </MobileFormField>
            )} />
          </MobileFormGrid>
        </MobileFormSection>
      ),
      validation: () => {
        const values = form.getValues();
        return !!(values.name && values.email);
      }
    },
    {
      id: 'solar-requirements',
      title: 'Solar Requirements',
      description: 'Enter your estimated energy needs',
      content: (
        <MobileFormSection title="System Specifications">
          <MobileFormGrid columns={isMobile ? 1 : 2}>
            <FormField control={form.control} name="estimatedSystemSizeKW" render={({ field }) => (
              <MobileFormField label="Estimated System Size (kW)" required>
                <Input 
                  type="number" 
                  step="0.1" 
                  {...field} 
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                />
              </MobileFormField>
            )} />
            <FormField control={form.control} name="monthlyConsumptionKWh" render={({ field }) => (
              <MobileFormField label="Avg. Monthly Consumption (kWh)" required>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                />
              </MobileFormField>
            )} />
          </MobileFormGrid>
          
          <div className="space-y-4 mt-6">
            <FormField control={form.control} name="includeMonitoring" render={({ field }) => (
              <div className="flex items-center space-x-3">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <label className="text-sm font-medium">Include System Monitoring</label>
              </div>
            )} />
            <FormField control={form.control} name="includeBatteryStorage" render={({ field }) => (
              <div className="flex items-center space-x-3">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <label className="text-sm font-medium">Interested in Battery Storage</label>
              </div>
            )} />
          </div>
        </MobileFormSection>
      ),
      validation: () => {
        const values = form.getValues();
        return !!(values.estimatedSystemSizeKW > 0 && values.monthlyConsumptionKWh > 0);
      }
    },
    {
      id: 'installer-selection',
      title: 'Select Installers',
      description: 'Choose 1 to 3 installers to send your RFQ',
      content: (
        <MobileFormSection title="Available Installers" description="Select installers in your area">
          <FormField
            control={form.control}
            name="selectedInstallerIds"
            render={({ field }) => (
              <div className="space-y-3">
                {!hasMounted ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                        <div className="h-4 flex-1 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : availableInstallers.length > 0 ? (
                  availableInstallers.map((installer) => {
                    const isChecked = field.value?.includes(installer.id);
                    const isDisabled = !isChecked && !canSelectMoreInstallers;
                    return (
                      <div key={installer.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <Checkbox
                          checked={isChecked}
                          disabled={isDisabled}
                          onCheckedChange={(checkedState) => {
                            const currentArray = Array.isArray(field.value) ? field.value : [];
                            if (checkedState) {
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
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {installer.companyName || installer.fullName}
                          </div>
                          {installer.location && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {installer.location}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                    No installers available currently.
                  </p>
                )}
              </div>
            )}
          />
        </MobileFormSection>
      ),
      validation: () => {
        const values = form.getValues();
        return values.selectedInstallerIds && values.selectedInstallerIds.length > 0;
      }
    },
    {
      id: 'additional-notes',
      title: 'Additional Information',
      description: 'Any specific requirements or preferences',
      content: (
        <MobileFormSection title="Additional Details">
          <FormField control={form.control} name="additionalNotes" render={({ field }) => (
            <MobileFormField label="Additional Notes or Preferences">
              <Textarea
                placeholder="Any specific requirements, roof type, preferred brands, timeline, etc."
                rows={4}
                className="resize-none"
                {...field}
              />
            </MobileFormField>
          )} />
        </MobileFormSection>
      )
    }
  ];

  if (isMobile) {
    return (
      <div className="w-full">
        <MobileForm
          steps={formSteps}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onComplete={form.handleSubmit(onSubmit)}
          showProgress={true}
        />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold font-headline text-accent mb-1">Your Details</h3>
          <p className="text-sm text-muted-foreground mb-4">(Automatically pre-filled from your profile)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl><Input {...field} readOnly className="bg-muted/50 border-muted" /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email Address</FormLabel> <FormControl><Input type="email" {...field} readOnly className="bg-muted/50 border-muted" /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem> <FormLabel>Phone Number</FormLabel> <FormControl><Input type="tel" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Installation Address</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold font-headline text-accent mb-1">Solar Requirements</h3>
          <p className="text-sm text-muted-foreground mb-4">(Enter your estimated needs)</p>
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
                <FormLabel className="text-xl font-semibold font-headline text-accent flex items-center"><Users className="w-5 h-5 mr-2"/>Select Installers</FormLabel>
                <FormDescription className="mt-1">
                  Choose 1 to 3 installers to send your RFQ. These would ideally be filtered by your location.
                </FormDescription>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto border p-4 rounded-md bg-muted/30 shadow-sm min-h-[100px]">
                {!hasMounted ? (
                  <>
                    <div className="flex items-center space-x-2 p-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                    <div className="flex items-center space-x-2 p-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-3/5" />
                    </div>
                    <div className="flex items-center space-x-2 p-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </>
                ) : availableInstallers.length > 0 ? (
                  availableInstallers.map((installer) => {
                    const isChecked = field.value?.includes(installer.id);
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

        <Button 
          type="submit" 
          disabled={isSubmitting} 
          size={isMobile ? "mobile-large" : "lg"} 
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting RFQ...</>
          ) : (
            <><Send className="mr-2 h-5 w-5" /> Submit RFQ to Selected Installers</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          This will submit your RFQ to Firestore and selected installers will be able to view it.
        </p>
      </form>
    </Form>
  );
}
