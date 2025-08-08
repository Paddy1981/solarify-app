/**
 * Enhanced RFQ Form with comprehensive accessibility improvements
 * Drop-in replacement for the existing RFQ form with WCAG 2.1 AA compliance
 */

"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Send, Users, Loader2 } from "lucide-react";

// Accessible components
import { AccessibleButton } from "../AccessibleButton";
import { 
  AccessibleFormField,
  AccessibleInput,
  AccessibleTextarea,
  AccessibleCheckbox,
  FormSection,
  FormSuccess
} from "../AccessibleForm";
import { Form } from "@/components/ui/form";
import { useAccessibilityAnnouncements } from "@/contexts/accessibility-context";
import { LoadingAnnouncement, ValidationAnnouncement } from "../AriaLive";
import { AccessibleSection } from "../AccessibleLayout";

import { useToast } from "@/hooks/use-toast";
import { getMockUsersByRole, type MockUser } from "@/lib/mock-data/users";
import { Skeleton } from "@/components/ui/skeleton";
import { db, serverTimestamp } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const rfqFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal('')),
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

interface EnhancedRFQFormProps {
  homeownerDetails: MockUser;
}

export function EnhancedRFQForm({ homeownerDetails }: EnhancedRFQFormProps) {
  const { toast } = useToast();
  const { announceSuccess, announceError, announceLoading } = useAccessibilityAnnouncements();
  
  const [availableInstallers, setAvailableInstallers] = React.useState<MockUser[]>([]);
  const [hasMounted, setHasMounted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

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

  const formErrors = form.formState.errors;

  const onSubmit: SubmitHandler<RFQFormData> = async (data) => {
    setIsSubmitting(true);
    setSubmitSuccess(false);
    
    announceLoading("Submitting your request for quotation");
    
    if (!homeownerDetails || !homeownerDetails.id) {
      const errorMsg = "Homeowner ID is missing. Please log in again.";
      announceError(errorMsg);
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
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
      console.log("RFQ Data saved to Firestore with ID:", docRef.id);
      
      const successMsg = `Your Request for Quotation has been successfully submitted to ${data.selectedInstallerIds.length} installer(s). RFQ ID: ${docRef.id}`;
      
      setSubmitSuccess(true);
      announceSuccess(successMsg);
      
      toast({
        title: "RFQ Submitted!",
        description: successMsg,
      });
      
      form.reset(); 
    } catch (error) {
      console.error("Error saving RFQ to Firestore:", error);
      const errorMsg = "There was an error submitting your RFQ. Please try again.";
      
      announceError(errorMsg);
      toast({
        title: "Submission Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <AccessibleSection title="Request for Quotation" level={1}>
        <p className="text-muted-foreground mb-6">
          Fill out this form to request quotes from solar installers. All fields marked with an asterisk (*) are required.
        </p>
      </AccessibleSection>

      {/* Live regions for form feedback */}
      <LoadingAnnouncement loading={isSubmitting} />
      <ValidationAnnouncement 
        errors={Object.fromEntries(
          Object.entries(formErrors).map(([key, error]) => [key, error?.message || ''])
        )}
        successMessage={submitSuccess ? "RFQ submitted successfully" : undefined}
      />

      {submitSuccess && (
        <FormSuccess className="mb-6">
          Your request for quotation has been submitted successfully!
        </FormSuccess>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Details Section */}
          <FormSection 
            title="Your Details" 
            description="Your contact information (automatically pre-filled from your profile)"
            required
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AccessibleFormField 
                name="name" 
                required
                instructions="Your full name as it appears in your profile"
              >
                <AccessibleInput 
                  readOnly 
                  className="bg-muted/50 border-muted" 
                  aria-describedby="name-readonly-note"
                />
              </AccessibleFormField>
              <div id="name-readonly-note" className="sr-only">
                This field is read-only and populated from your profile
              </div>
              
              <AccessibleFormField 
                name="email" 
                required
                instructions="Your email address for communication"
              >
                <AccessibleInput 
                  type="email" 
                  readOnly 
                  className="bg-muted/50 border-muted"
                  aria-describedby="email-readonly-note"
                />
              </AccessibleFormField>
              <div id="email-readonly-note" className="sr-only">
                This field is read-only and populated from your profile
              </div>
              
              <AccessibleFormField 
                name="phone"
                instructions="Your phone number for quick contact (optional)"
                helpText="10 digits minimum, no spaces or dashes needed"
              >
                <AccessibleInput 
                  type="tel" 
                  placeholder="1234567890"
                  error={!!formErrors.phone}
                />
              </AccessibleFormField>
              
              <AccessibleFormField 
                name="address"
                instructions="Installation address (optional but recommended)"
                helpText="Street address where solar panels will be installed"
              >
                <AccessibleInput 
                  placeholder="123 Main St, City, State"
                  error={!!formErrors.address}
                />
              </AccessibleFormField>
            </div>
          </FormSection>

          {/* Solar Requirements Section */}
          <FormSection 
            title="Solar System Requirements" 
            description="Technical specifications for your solar installation"
            required
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AccessibleFormField 
                name="estimatedSystemSizeKW" 
                required
                instructions="Estimated solar system size in kilowatts"
                helpText="Typical residential systems range from 3kW to 10kW"
              >
                <AccessibleInput 
                  type="number" 
                  step="0.1" 
                  min="0.1"
                  max="50"
                  error={!!formErrors.estimatedSystemSizeKW}
                  aria-describedby="system-size-help"
                />
              </AccessibleFormField>
              
              <AccessibleFormField 
                name="monthlyConsumptionKWh" 
                required
                instructions="Your average monthly electricity consumption in kilowatt-hours"
                helpText="Check your electricity bill for this information"
              >
                <AccessibleInput 
                  type="number" 
                  min="1"
                  max="10000"
                  error={!!formErrors.monthlyConsumptionKWh}
                />
              </AccessibleFormField>
            </div>
          </FormSection>

          {/* Additional Options Section */}
          <FormSection 
            title="Additional Options" 
            description="Select additional services you're interested in"
          >
            <div className="space-y-4">
              <AccessibleFormField name="includeMonitoring">
                <AccessibleCheckbox
                  description="Monitor your solar system's performance remotely"
                >
                  Include System Monitoring
                </AccessibleCheckbox>
              </AccessibleFormField>
              
              <AccessibleFormField name="includeBatteryStorage">
                <AccessibleCheckbox
                  description="Store excess solar energy for use during outages or peak hours"
                >
                  Interested in Battery Storage
                </AccessibleCheckbox>
              </AccessibleFormField>
            </div>
          </FormSection>

          {/* Installer Selection Section */}
          <FormSection 
            title="Select Installers" 
            description="Choose 1 to 3 installers to send your request to"
            required
          >
            <AccessibleFormField 
              name="selectedInstallerIds" 
              required
              instructions="These installers are filtered by your location. You must select at least one."
              helpText={`You can select up to 3 installers. Currently selected: ${watchedSelectedInstallers?.length || 0}`}
            >
              <div 
                role="group" 
                aria-labelledby="installer-selection-label"
                className="space-y-3 max-h-60 overflow-y-auto border border-border rounded-md p-4 bg-muted/30"
              >
                <div id="installer-selection-label" className="sr-only">
                  Available installers
                </div>
                
                {!hasMounted ? (
                  <div role="status" aria-label="Loading installers">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-2 p-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                ) : availableInstallers.length > 0 ? (
                  availableInstallers.map((installer) => {
                    const isChecked = watchedSelectedInstallers?.includes(installer.id);
                    const isDisabled = !isChecked && !canSelectMoreInstallers;
                    
                    return (
                      <AccessibleCheckbox
                        key={installer.id}
                        checked={isChecked}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => {
                          const currentArray = Array.isArray(watchedSelectedInstallers) ? watchedSelectedInstallers : [];
                          if (checked) {
                            if (currentArray.length < 3) {
                              form.setValue("selectedInstallerIds", [...currentArray, installer.id]);
                            }
                          } else {
                            form.setValue("selectedInstallerIds", currentArray.filter((id) => id !== installer.id));
                          }
                        }}
                        description={installer.location ? `Located in ${installer.location}` : undefined}
                      >
                        {installer.companyName || installer.fullName}
                      </AccessibleCheckbox>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground p-2" role="status">
                    No installers available in your area currently.
                  </p>
                )}
              </div>
            </AccessibleFormField>
          </FormSection>

          {/* Additional Notes Section */}
          <FormSection 
            title="Additional Information" 
            description="Provide any additional details about your requirements"
          >
            <AccessibleFormField 
              name="additionalNotes"
              instructions="Optional: Any specific requirements, preferences, or questions"
              helpText="Include information about roof type, timeline, preferred brands, etc."
            >
              <AccessibleTextarea
                placeholder="Any specific requirements, roof type, preferred brands, timeline, etc."
                rows={4}
                maxLength={1000}
                showCharacterCount
                error={!!formErrors.additionalNotes}
              />
            </AccessibleFormField>
          </FormSection>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <AccessibleButton 
              type="submit" 
              disabled={isSubmitting} 
              loading={isSubmitting}
              loadingText="Submitting your request for quotation"
              size="lg" 
              className="w-full max-w-md"
              pressAnnouncement="Submitting RFQ to selected installers"
              announcePress
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting RFQ...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit RFQ to Selected Installers
                </>
              )}
            </AccessibleButton>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            This will submit your RFQ to Firestore and selected installers will be able to view it.
          </p>
        </form>
      </Form>
    </div>
  );
}