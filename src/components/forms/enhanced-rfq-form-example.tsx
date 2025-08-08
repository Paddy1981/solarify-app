"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EnhancedFormWrapper } from "./enhanced-form-wrapper";
import { EnhancedSolarSizingForm } from "../solar/enhanced-solar-forms";
import { 
  SmartAutoComplete, 
  SmartNumericInput, 
  MultiSelectWithSearch,
  FileUploadWithDragDrop,
  ConditionalField,
  EnhancedPasswordInput
} from "../ui/advanced-form-components";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription,
  FormMessage 
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { useSmartFormPatterns } from "../../hooks/use-smart-form-patterns";
import { 
  commonValidationRules, 
  commonAsyncValidationRules 
} from "../../hooks/use-enhanced-form-validation";
import { 
  Sun, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  Settings,
  CreditCard,
  Shield
} from "lucide-react";

// Enhanced RFQ form schema with comprehensive validation
const enhancedRFQSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  
  // Property Information
  address: z.string().min(5, "Please enter a complete address"),
  propertyType: z.enum(['residential', 'commercial', 'industrial']),
  roofType: z.enum(['asphalt_shingles', 'metal', 'tile', 'flat', 'other']),
  roofAge: z.number().min(0).max(100),
  shadingLevel: z.enum(['none', 'minimal', 'moderate', 'significant']),
  
  // Energy Information
  monthlyBill: z.number().min(1, "Monthly bill must be greater than $0"),
  monthlyUsage: z.number().min(1, "Monthly usage must be greater than 0 kWh"),
  utilityProvider: z.string().min(1, "Utility provider is required"),
  
  // System Preferences
  systemSize: z.number().min(1, "System size must be at least 1 kW").optional(),
  batteryInterest: z.boolean().default(false),
  batteryBackupHours: z.number().min(0).max(72).optional(),
  monitoringPreferences: z.array(z.string()).default([]),
  
  // Project Details
  timeline: z.enum(['immediate', 'within_3_months', 'within_6_months', 'within_year', 'flexible']),
  budgetRange: z.enum(['under_15k', '15k_30k', '30k_50k', '50k_plus', 'flexible']),
  financingInterest: z.boolean().default(false),
  
  // Additional Information
  additionalNotes: z.string().max(1000, "Notes must be under 1000 characters").optional(),
  propertyPhotos: z.array(z.any()).optional(),
  electricalBills: z.array(z.any()).optional(),
  
  // Preferences
  preferredContactMethod: z.enum(['email', 'phone', 'text']),
  preferredContactTime: z.enum(['morning', 'afternoon', 'evening', 'anytime']),
  marketingOptIn: z.boolean().default(false),
  
  // Terms and Privacy
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  privacyAccepted: z.boolean().refine(val => val === true, "You must accept the privacy policy")
});

type EnhancedRFQFormData = z.infer<typeof enhancedRFQSchema>;

export function EnhancedRFQFormExample() {
  // Initialize form with validation
  const form = useForm<EnhancedRFQFormData>({
    resolver: zodResolver(enhancedRFQSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      propertyType: 'residential',
      roofType: 'asphalt_shingles',
      roofAge: 10,
      shadingLevel: 'minimal',
      monthlyBill: 150,
      monthlyUsage: 900,
      utilityProvider: '',
      batteryInterest: false,
      monitoringPreferences: [],
      timeline: 'within_6_months',
      budgetRange: '15k_30k',
      financingInterest: false,
      additionalNotes: '',
      propertyPhotos: [],
      electricalBills: [],
      preferredContactMethod: 'email',
      preferredContactTime: 'anytime',
      marketingOptIn: false,
      termsAccepted: false,
      privacyAccepted: false
    }
  });

  // Initialize smart form patterns
  const smartPatterns = useSmartFormPatterns({
    form,
    formId: 'enhanced-rfq-form',
    smartDefaultsConfig: {
      enableGeoLocation: true,
      enableBrowserData: true,
      enableContextualDefaults: true
    },
    progressiveDisclosureConfig: {
      enabled: true,
      revealOnInteraction: true,
      showAdvancedOptions: true
    },
    analyticsConfig: {
      enabled: true,
      trackFieldInteractions: true,
      trackValidationErrors: true,
      trackAbandonmentPoints: true
    }
  });

  // Mock data for dropdowns
  const utilityProviders = [
    { value: 'pge', label: 'Pacific Gas & Electric (PG&E)' },
    { value: 'sce', label: 'Southern California Edison (SCE)' },
    { value: 'sdge', label: 'San Diego Gas & Electric (SDG&E)' },
    { value: 'other', label: 'Other Provider' }
  ];

  const monitoringOptions = [
    { value: 'real_time', label: 'Real-time production monitoring' },
    { value: 'mobile_app', label: 'Mobile app notifications' },
    { value: 'email_reports', label: 'Weekly email reports' },
    { value: 'maintenance_alerts', label: 'Maintenance alerts' }
  ];

  // Watch for battery interest to show conditional fields
  const batteryInterest = form.watch('batteryInterest');
  const financingInterest = form.watch('financingInterest');

  // Handle form submission
  const handleSubmit = async (data: EnhancedRFQFormData) => {
    console.log('Enhanced RFQ Form Data:', data);
    
    // Track completion
    smartPatterns.trackFormCompletion();
    
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Handle success
    alert('RFQ submitted successfully!');
  };

  // Form steps for multi-step layout
  const formSteps = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'Tell us about yourself',
      required: true,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    {...field} 
                    placeholder="john@example.com" 
                  />
                </FormControl>
                <FormDescription>
                  We'll use this to send you your solar quote
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input 
                    type="tel" 
                    {...field} 
                    placeholder="(555) 123-4567" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    
    {
      id: 'property-info',
      title: 'Property Information',
      description: 'Details about your property',
      required: true,
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Installation Address
                </FormLabel>
                <FormControl>
                  <SmartAutoComplete
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter your full address"
                    suggestions={[]} // Would be populated from address API
                  />
                </FormControl>
                <FormDescription>
                  We need your address to analyze sun exposure and local incentives
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roofType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roof Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select roof type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="asphalt_shingles">Asphalt Shingles</SelectItem>
                      <SelectItem value="metal">Metal</SelectItem>
                      <SelectItem value="tile">Tile</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )
    },

    {
      id: 'energy-info',
      title: 'Energy Information',
      description: 'Your current energy usage',
      required: true,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="monthlyBill"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Average Monthly Electric Bill</FormLabel>
                  <FormControl>
                    <SmartNumericInput
                      type="currency"
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="$150"
                      min={1}
                      max={10000}
                      help="Look at your last 12 months of bills for the average"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlyUsage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Usage (kWh)</FormLabel>
                  <FormControl>
                    <SmartNumericInput
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="900"
                      min={1}
                      max={50000}
                      help="Find this on your electric bill, usually shown as kWh used"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="utilityProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Utility Provider</FormLabel>
                <FormControl>
                  <SmartAutoComplete
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={utilityProviders}
                    suggestionDisplayField="label"
                    suggestionKeyField="value"
                    placeholder="Search for your utility company"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },

    {
      id: 'system-preferences',
      title: 'System Preferences',
      description: 'Customize your solar system',
      required: false,
      content: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="batteryInterest"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Battery Storage</FormLabel>
                  <FormDescription>
                    Add battery backup for power outages and increased energy independence
                  </FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <ConditionalField
            condition={batteryInterest}
            animateIn={true}
          >
            <FormField
              control={form.control}
              name="batteryBackupHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desired Backup Hours</FormLabel>
                  <FormControl>
                    <SmartNumericInput
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="8"
                      min={0}
                      max={72}
                      help="How many hours of backup power do you need during outages?"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </ConditionalField>

          <FormField
            control={form.control}
            name="monitoringPreferences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monitoring Preferences</FormLabel>
                <FormControl>
                  <MultiSelectWithSearch
                    value={field.value || []}
                    onChange={field.onChange}
                    options={monitoringOptions}
                    placeholder="Select monitoring options"
                    showSelectAll={true}
                  />
                </FormControl>
                <FormDescription>
                  Choose how you'd like to monitor your solar system's performance
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },

    {
      id: 'project-details',
      title: 'Project Details',
      description: 'Timeline and budget preferences',
      required: true,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="timeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Installation Timeline</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (1 month)</SelectItem>
                      <SelectItem value="within_3_months">Within 3 months</SelectItem>
                      <SelectItem value="within_6_months">Within 6 months</SelectItem>
                      <SelectItem value="within_year">Within a year</SelectItem>
                      <SelectItem value="flexible">Flexible timeline</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budgetRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="under_15k">Under $15,000</SelectItem>
                      <SelectItem value="15k_30k">$15,000 - $30,000</SelectItem>
                      <SelectItem value="30k_50k">$30,000 - $50,000</SelectItem>
                      <SelectItem value="50k_plus">$50,000+</SelectItem>
                      <SelectItem value="flexible">Flexible budget</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="financingInterest"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Financing Options
                  </FormLabel>
                  <FormDescription>
                    Interest in solar loans, leases, or power purchase agreements
                  </FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      )
    },

    {
      id: 'additional-info',
      title: 'Additional Information',
      description: 'Documents and special requirements',
      required: false,
      content: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Any specific requirements, questions, or preferences..."
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
                <FormDescription>
                  <div className="flex justify-between items-center">
                    <span>Tell us about any special requirements or preferences</span>
                    <span className="text-xs">
                      {(field.value || '').length}/1000 characters
                    </span>
                  </div>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="propertyPhotos"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Property Photos (Optional)
                </FormLabel>
                <FormControl>
                  <FileUploadWithDragDrop
                    onFileSelect={field.onChange}
                    acceptedFileTypes={['image/*']}
                    maxFileSize={10}
                    maxFiles={5}
                    multiple={true}
                  >
                    <div className="text-center">
                      <p className="text-sm font-medium">Upload photos of your roof and property</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This helps us prepare a more accurate quote
                      </p>
                    </div>
                  </FileUploadWithDragDrop>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="electricalBills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recent Electric Bills (Optional)</FormLabel>
                <FormControl>
                  <FileUploadWithDragDrop
                    onFileSelect={field.onChange}
                    acceptedFileTypes={['.pdf', 'image/*']}
                    maxFileSize={5}
                    maxFiles={3}
                    multiple={true}
                  >
                    <div className="text-center">
                      <p className="text-sm font-medium">Upload your last 3 electric bills</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Helps us better understand your energy patterns
                      </p>
                    </div>
                  </FileUploadWithDragDrop>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },

    {
      id: 'preferences-terms',
      title: 'Preferences & Terms',
      description: 'Final details and agreements',
      required: true,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="preferredContactMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Contact Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How should we contact you?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="text">Text Message</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredContactTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Contact Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Best time to reach you" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                      <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
                      <SelectItem value="anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="marketingOptIn"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Send me updates about solar incentives and energy-saving tips
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      I accept the{' '}
                      <a href="/terms" className="text-primary hover:underline" target="_blank">
                        Terms and Conditions
                      </a>
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacyAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      I accept the{' '}
                      <a href="/privacy" className="text-primary hover:underline" target="_blank">
                        Privacy Policy
                      </a>
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Solar Quote Request</h1>
        <p className="text-muted-foreground text-center">
          Get a personalized solar quote in just a few steps
        </p>
      </div>

      <EnhancedFormWrapper
        form={form}
        onSubmit={handleSubmit}
        config={{
          formId: 'enhanced-rfq-form',
          title: 'Solar RFQ Form',
          enableAutoSave: true,
          enableRecovery: true,
          enableHistory: true,
          enableValidation: true,
          enableMultiStep: true,
          enableAnalytics: true,
          steps: formSteps,
          showProgress: true,
          showFormActions: true,
          showRecoveryPrompt: true,
          adaptToMobile: true,
          announceValidationErrors: true,
          keyboardShortcuts: true,
          analyticsVariant: 'enhanced-v1'
        }}
      />
    </div>
  );
}