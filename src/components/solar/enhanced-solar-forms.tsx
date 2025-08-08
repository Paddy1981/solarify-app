"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Sun, 
  Zap, 
  MapPin, 
  Home, 
  Battery, 
  Calculator,
  DollarSign,
  TrendingUp,
  Lightbulb,
  Shield,
  Info,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Slider } from "../ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  SmartAutoComplete, 
  SmartNumericInput, 
  MultiSelectWithSearch,
  ConditionalField
} from "../ui/advanced-form-components";
import { 
  FieldFeedback, 
  ProgressIndicator, 
  ContextualHelp,
  CharacterCounter
} from "../ui/enhanced-form-feedback";
import { 
  AddressValidationError, 
  ContextualHint,
  ValidationSummary
} from "../ui/enhanced-form-errors";
import { useEnhancedFormValidation, commonValidationRules } from "../../hooks/use-enhanced-form-validation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

// Solar system sizing form
const solarSizingSchema = z.object({
  monthlyBill: z.number().min(1, "Monthly bill must be greater than $0").max(10000, "Monthly bill seems unusually high"),
  monthlyUsage: z.number().min(1, "Monthly usage must be greater than 0 kWh").max(50000, "Monthly usage seems unusually high"),
  roofType: z.enum(['asphalt_shingles', 'metal', 'tile', 'flat', 'other']),
  roofAge: z.number().min(0, "Roof age cannot be negative").max(100, "Roof age cannot exceed 100 years"),
  shadingLevel: z.enum(['none', 'minimal', 'moderate', 'significant']),
  utilityProvider: z.string().min(1, "Utility provider is required"),
  address: z.string().min(5, "Please enter a complete address"),
  batteryInterest: z.boolean().default(false),
  timeline: z.enum(['immediate', 'within_3_months', 'within_6_months', 'within_year', 'flexible']),
  budgetRange: z.enum(['under_15k', '15k_30k', '30k_50k', '50k_plus', 'flexible'])
});

type SolarSizingFormData = z.infer<typeof solarSizingSchema>;

export interface EnhancedSolarSizingFormProps {
  onSubmit: (data: SolarSizingFormData) => void;
  onEstimateChange?: (estimate: SolarEstimate) => void;
  className?: string;
}

export interface SolarEstimate {
  recommendedSystemSize: number;
  estimatedCost: number;
  estimatedSavings: number;
  paybackPeriod: number;
  co2Reduction: number;
}

export function EnhancedSolarSizingForm({
  onSubmit,
  onEstimateChange,
  className
}: EnhancedSolarSizingFormProps) {
  const [currentEstimate, setCurrentEstimate] = React.useState<SolarEstimate | null>(null);
  const [addressSuggestions, setAddressSuggestions] = React.useState<string[]>([]);
  const [utilityProviders] = React.useState([
    { value: 'pge', label: 'Pacific Gas & Electric (PG&E)' },
    { value: 'sce', label: 'Southern California Edison (SCE)' },
    { value: 'sdge', label: 'San Diego Gas & Electric (SDG&E)' },
    { value: 'other', label: 'Other Provider' }
  ]);

  const form = useForm<SolarSizingFormData>({
    resolver: zodResolver(solarSizingSchema),
    defaultValues: {
      monthlyBill: 150,
      monthlyUsage: 900,
      roofType: 'asphalt_shingles',
      roofAge: 10,
      shadingLevel: 'minimal',
      utilityProvider: '',
      address: '',
      batteryInterest: false,
      timeline: 'within_6_months',
      budgetRange: '15k_30k'
    }
  });

  const validation = useEnhancedFormValidation({
    form,
    validationRules: {
      monthlyBill: [
        commonValidationRules.required('Monthly bill is required'),
        commonValidationRules.min(1, 'Monthly bill must be greater than $0'),
        commonValidationRules.max(10000, 'Monthly bill seems unusually high - please verify')
      ],
      monthlyUsage: [
        commonValidationRules.required('Monthly usage is required'),
        commonValidationRules.min(1, 'Monthly usage must be greater than 0'),
        commonValidationRules.max(50000, 'Monthly usage seems unusually high - please verify')
      ],
      address: [
        commonValidationRules.required('Address is required for solar analysis'),
        commonValidationRules.minLength(5, 'Please enter a complete address')
      ]
    },
    progressiveValidation: true
  });

  const watchedValues = form.watch();

  // Calculate solar estimate when key values change
  React.useEffect(() => {
    if (watchedValues.monthlyBill && watchedValues.monthlyUsage) {
      const estimate = calculateSolarEstimate(watchedValues);
      setCurrentEstimate(estimate);
      onEstimateChange?.(estimate);
    }
  }, [watchedValues.monthlyBill, watchedValues.monthlyUsage, watchedValues.roofType, watchedValues.shadingLevel, onEstimateChange]);

  const calculateSolarEstimate = (data: Partial<SolarSizingFormData>): SolarEstimate => {
    // Simplified solar calculation - in real app, this would use more sophisticated algorithms
    const annualUsage = (data.monthlyUsage || 900) * 12;
    const systemSize = Math.round((annualUsage / 1200) * 10) / 10; // Rough sizing
    const costPerWatt = 3.5;
    const estimatedCost = systemSize * 1000 * costPerWatt;
    const annualSavings = (data.monthlyBill || 150) * 12 * 0.85; // 85% bill reduction
    const paybackPeriod = estimatedCost / annualSavings;
    const co2Reduction = systemSize * 1200; // Rough CO2 reduction in lbs/year

    return {
      recommendedSystemSize: systemSize,
      estimatedCost,
      estimatedSavings: annualSavings,
      paybackPeriod,
      co2Reduction
    };
  };

  const handleAddressSearch = async (query: string) => {
    // Mock address suggestions - in real app, integrate with Google Places API
    if (query.length > 3) {
      setAddressSuggestions([
        `${query} Street, San Francisco, CA`,
        `${query} Avenue, Los Angeles, CA`,
        `${query} Boulevard, San Diego, CA`
      ]);
    }
  };

  const getRoofTypeHelp = (roofType: string) => {
    const roofHelp = {
      asphalt_shingles: "Most common and solar-friendly roof type. Excellent for installations.",
      metal: "Great for solar! Metal roofs are durable and often easier to work with.",
      tile: "Common in warmer climates. May require special mounting hardware.",
      flat: "Good for solar, especially with ground-mount or ballasted systems.",
      other: "We'll need to assess your specific roof type for compatibility."
    };
    return roofHelp[roofType as keyof typeof roofHelp] || "";
  };

  const getShadingImpact = (level: string) => {
    const impacts = {
      none: { color: 'text-green-600', text: 'Excellent for solar production' },
      minimal: { color: 'text-green-500', text: 'Good solar potential' },
      moderate: { color: 'text-amber-500', text: 'May reduce efficiency by 10-25%' },
      significant: { color: 'text-red-500', text: 'May significantly impact production' }
    };
    return impacts[level as keyof typeof impacts] || impacts.minimal;
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-orange-500" />
            Solar System Sizing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Energy Usage Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Energy Usage
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="monthlyBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Average Monthly Electric Bill
                          <ContextualHelp 
                            content="Your total monthly electricity bill including all charges. This helps us estimate your potential savings."
                          />
                        </FormLabel>
                        <FormControl>
                          <SmartNumericInput
                            type="currency"
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="$150"
                            min={1}
                            max={10000}
                            error={validation.getFieldError(field.name)}
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
                        <FormLabel className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Monthly Usage (kWh)
                          <ContextualHelp 
                            content="Find this on your electric bill. It's usually shown as kWh used. Average US household uses 877 kWh/month."
                          />
                        </FormLabel>
                        <FormControl>
                          <SmartNumericInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="900"
                            min={1}
                            max={50000}
                            error={validation.getFieldError(field.name)}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your utility provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {utilityProviders.map((provider) => (
                            <SelectItem key={provider.value} value={provider.value}>
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Property Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Property Information
                </h3>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Installation Address
                        <ContextualHelp 
                          content="We need your address to analyze sun exposure, local incentives, and utility rates in your area."
                        />
                      </FormLabel>
                      <FormControl>
                        <SmartAutoComplete
                          value={field.value}
                          onChange={field.onChange}
                          onSelect={(item) => field.onChange(item.label)}
                          placeholder="Enter your full address"
                          suggestions={addressSuggestions.map(addr => ({ label: addr, value: addr }))}
                          error={validation.getFieldError(field.name)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {field.value && (
                          <ContextualHint
                            field="roofType"
                            hint={getRoofTypeHelp(field.value)}
                            variant="info"
                          />
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roofAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Roof Age (years)
                          <ContextualHelp 
                            content="If your roof is over 15 years old, it may need replacement before or during solar installation."
                          />
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <Slider
                              value={[field.value || 0]}
                              onValueChange={(value) => field.onChange(value[0])}
                              max={50}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>New</span>
                              <span className="font-medium">{field.value || 0} years</span>
                              <span>50+ years</span>
                            </div>
                          </div>
                        </FormControl>
                        {(field.value || 0) > 15 && (
                          <FieldFeedback
                            state="warning"
                            message="Consider roof inspection before installation"
                          />
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="shadingLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roof Shading Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shading level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Shading</SelectItem>
                          <SelectItem value="minimal">Minimal Shading</SelectItem>
                          <SelectItem value="moderate">Moderate Shading</SelectItem>
                          <SelectItem value="significant">Significant Shading</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.value && (
                        <div className={cn("text-sm mt-1", getShadingImpact(field.value).color)}>
                          {getShadingImpact(field.value).text}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  Additional Options
                </h3>

                <FormField
                  control={form.control}
                  name="batteryInterest"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <Battery className="h-4 w-4" />
                          Battery Storage Interest
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Add battery backup for power outages and increased energy independence
                        </div>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

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
              </div>

              <Button type="submit" className="w-full" size="lg">
                Get Solar Estimate
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Real-time estimate display */}
      {currentEstimate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Your Solar Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {currentEstimate.recommendedSystemSize} kW
                </div>
                <div className="text-sm text-muted-foreground">Recommended Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${currentEstimate.estimatedCost.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Estimated Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${Math.round(currentEstimate.estimatedSavings).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Annual Savings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentEstimate.paybackPeriod.toFixed(1)} yrs
                </div>
                <div className="text-sm text-muted-foreground">Payback Period</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <Lightbulb className="h-4 w-4" />
                <span className="font-medium">Environmental Impact</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your system could reduce CO₂ emissions by approximately{' '}
                <strong>{Math.round(currentEstimate.co2Reduction).toLocaleString()} lbs per year</strong>,
                equivalent to planting {Math.round(currentEstimate.co2Reduction / 48)} trees!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Enhanced address validation component specifically for solar installations
export interface SolarAddressValidatorProps {
  address: string;
  onChange: (address: string) => void;
  onValidationComplete?: (result: AddressValidationResult) => void;
  error?: string;
  className?: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  coordinates?: { lat: number; lng: number };
  roofArea?: number;
  sunExposure?: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedAnnualSunHours?: number;
  nearbyShading?: string[];
  utilityTerritory?: string;
}

export function SolarAddressValidator({
  address,
  onChange,
  onValidationComplete,
  error,
  className
}: SolarAddressValidatorProps) {
  const [validationResult, setValidationResult] = React.useState<AddressValidationResult | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);

  const validateAddress = async (addr: string) => {
    if (addr.length < 5) return;
    
    setIsValidating(true);
    
    // Mock validation - in real app, integrate with Google Solar API or similar
    setTimeout(() => {
      const mockResult: AddressValidationResult = {
        isValid: true,
        coordinates: { lat: 37.7749, lng: -122.4194 },
        roofArea: 1200,
        sunExposure: 'good',
        estimatedAnnualSunHours: 2800,
        nearbyShading: ['Tree to the south', 'Neighboring building'],
        utilityTerritory: 'PG&E'
      };
      
      setValidationResult(mockResult);
      onValidationComplete?.(mockResult);
      setIsValidating(false);
    }, 1500);
  };

  const debouncedValidate = React.useMemo(
    () => {
      let timeout: NodeJS.Timeout;
      return (addr: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => validateAddress(addr), 1000);
      };
    },
    []
  );

  React.useEffect(() => {
    debouncedValidate(address);
  }, [address, debouncedValidate]);

  const getSunExposureColor = (exposure?: string) => {
    switch (exposure) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-green-500';
      case 'fair': return 'text-amber-500';
      case 'poor': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <SmartAutoComplete
        value={address}
        onChange={onChange}
        placeholder="Enter your full address for solar analysis"
        suggestions={suggestions.map(s => ({ label: s, value: s }))}
        isLoading={isValidating}
        error={error}
        showIcon={true}
      />

      {validationResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Address Validated</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Roof Area:</span>
                <span className="ml-2 font-medium">{validationResult.roofArea} sq ft</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sun Exposure:</span>
                <span className={cn("ml-2 font-medium", getSunExposureColor(validationResult.sunExposure))}>
                  {validationResult.sunExposure?.charAt(0).toUpperCase() + validationResult.sunExposure?.slice(1)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Annual Sun Hours:</span>
                <span className="ml-2 font-medium">{validationResult.estimatedAnnualSunHours}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Utility:</span>
                <span className="ml-2 font-medium">{validationResult.utilityTerritory}</span>
              </div>
            </div>

            {validationResult.nearbyShading && validationResult.nearbyShading.length > 0 && (
              <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
                <div className="flex items-center gap-1 text-amber-800 text-xs font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  Potential Shading Sources:
                </div>
                <ul className="text-xs text-amber-700 mt-1 list-disc list-inside">
                  {validationResult.nearbyShading.map((shade, index) => (
                    <li key={index}>{shade}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}