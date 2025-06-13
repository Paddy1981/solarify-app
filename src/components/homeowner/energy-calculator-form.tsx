
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { currencyOptions, getCurrencyByCode, getDefaultCurrency, type Currency } from "@/lib/currencies";

const commonAppliancesData: { value: string; label: string; defaultWattage: number }[] = [
  { value: "refrigerator", label: "Refrigerator (Energy Star)", defaultWattage: 150 },
  { value: "led_lights_room", label: "LED Lights (per room, avg 4 bulbs)", defaultWattage: 24 },
  { value: "ceiling_fan", label: "Ceiling Fan", defaultWattage: 75 },
  { value: "tv_led_42", label: "Television (42\" LED)", defaultWattage: 60 },
  { value: "laptop_charger", label: "Laptop Charger", defaultWattage: 65 },
  { value: "modem_router", label: "Modem & Router", defaultWattage: 15 },
  { value: "phone_tablet_charger", label: "Phone/Tablet Charger", defaultWattage: 10 },
  { value: "microwave_brief", label: "Microwave Oven (brief use)", defaultWattage: 1000 },
  { value: "water_pump_0.5hp_brief", label: "Water Pump (0.5 HP, brief use)", defaultWattage: 375 },
  { value: "cpap_machine", label: "CPAP Machine", defaultWattage: 60 },
  { value: "sump_pump_brief", label: "Sump Pump (1/3 HP, brief use)", defaultWattage: 800 },
  { value: "other", label: "Other (Specify)", defaultWattage: 0 },
];

const applianceSchema = z.object({
  applianceType: z.string().min(1, "Please select an appliance type."),
  customName: z.string().optional(),
  wattage: z.coerce.number({ invalid_type_error: "Must be a number" }).min(1, "Wattage must be positive"),
  hoursPerDay: z.coerce.number({ invalid_type_error: "Must be a number" }).min(0).max(24, "Hours must be between 0 and 24"),
}).refine(
  (data) => {
    if (data.applianceType === "other") {
      return !!data.customName && data.customName.trim().length > 0;
    }
    return true;
  },
  {
    message: "Custom appliance name is required when 'Other' is selected.",
    path: ["customName"],
  }
);

const formSchema = z.object({
  appliances: z.array(applianceSchema).min(1, "Please add at least one appliance."),
  currentMonthlyBill: z.coerce.number({ invalid_type_error: "Must be a number" }).min(0, "Bill amount must be positive").optional(),
  selectedCurrencyValue: z.string().optional(),
});

type ApplianceFormEntry = z.infer<typeof applianceSchema>;
type FormData = z.infer<typeof formSchema>;

type ApplianceDefaultValue = {
  applianceType: string;
  customName?: string;
  wattage?: number; 
  hoursPerDay?: number; 
};

interface CalculationResult {
  dailyConsumptionKWh: number;
  monthlyConsumptionKWh: number;
  suggestedSystemSizeKW: number;
}

const getDefaultNewAppliance = (): ApplianceDefaultValue => {
  const firstAppliance = commonAppliancesData.find(a => a.value !== 'other');
  if (firstAppliance) {
    return { 
      applianceType: firstAppliance.value, 
      customName: "", 
      wattage: firstAppliance.defaultWattage, 
      hoursPerDay: undefined 
    };
  }
  return { 
    applianceType: "other", 
    customName: "", 
    wattage: undefined, 
    hoursPerDay: undefined 
  };
};

export function EnergyCalculatorForm() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(getDefaultCurrency());

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appliances: [getDefaultNewAppliance() as ApplianceFormEntry],
      currentMonthlyBill: undefined,
      selectedCurrencyValue: getDefaultCurrency().value,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "appliances",
  });
  
  const watchedCurrencyValue = form.watch("selectedCurrencyValue");
  useEffect(() => {
    setSelectedCurrency(getCurrencyByCode(watchedCurrencyValue) || getDefaultCurrency());
  }, [watchedCurrencyValue, form]);


  const onSubmit: SubmitHandler<FormData> = (data) => {
    let totalDailyWattHours = 0;
    data.appliances.forEach(appliance => {
      totalDailyWattHours += appliance.wattage * appliance.hoursPerDay;
    });

    const dailyConsumptionKWh = totalDailyWattHours / 1000;
    const monthlyConsumptionKWh = dailyConsumptionKWh * 30;
    const suggestedSystemSizeKW = (dailyConsumptionKWh / 4) * 1.25; 

    setCalculationResult({
      dailyConsumptionKWh: parseFloat(dailyConsumptionKWh.toFixed(2)),
      monthlyConsumptionKWh: parseFloat(monthlyConsumptionKWh.toFixed(2)),
      suggestedSystemSizeKW: parseFloat(suggestedSystemSizeKW.toFixed(2)),
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2 font-headline">Appliances</h3>
            {fields.map((field, index) => {
              const currentApplianceType = form.watch(`appliances.${index}.applianceType`);
              return (
                <div key={field.id} className="p-4 border rounded-md mb-4 shadow-sm bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 items-start">
                    <FormField
                      control={form.control}
                      name={`appliances.${index}.applianceType`}
                      render={({ field: controllerField }) => (
                        <FormItem>
                          <FormLabel>Appliance</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              controllerField.onChange(value);
                              const applianceData = commonAppliancesData.find(a => a.value === value);
                              if (applianceData) {
                                 if (value !== 'other') {
                                  form.setValue(`appliances.${index}.wattage`, applianceData.defaultWattage, { shouldValidate: true });
                                  form.setValue(`appliances.${index}.customName`, '', { shouldValidate: false });
                                 } else {
                                   form.setValue(`appliances.${index}.wattage`, undefined, { shouldValidate: true });
                                 }
                              }
                            }}
                            value={controllerField.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select appliance" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {commonAppliancesData.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {currentApplianceType === 'other' && (
                      <FormField
                        control={form.control}
                        name={`appliances.${index}.customName`}
                        render={({ field: controllerField }) => (
                          <FormItem>
                            <FormLabel>Custom Appliance Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Gaming PC" {...controllerField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4 items-end mt-4">
                    <FormField
                      control={form.control}
                      name={`appliances.${index}.wattage`}
                      render={({ field: controllerField }) => (
                        <FormItem>
                          <FormLabel>Wattage (W)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 150" 
                              {...controllerField} 
                              value={controllerField.value ?? ""}
                              onChange={e => controllerField.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`appliances.${index}.hoursPerDay`}
                      render={({ field: controllerField }) => (
                        <FormItem>
                          <FormLabel>Hours/Day</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              placeholder="e.g., 8" 
                              {...controllerField} 
                              value={controllerField.value ?? ""}
                              onChange={e => controllerField.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:bg-destructive/10 md:justify-self-end h-10 w-10"
                        aria-label="Remove appliance"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    ) : (
                      <div className="hidden md:block h-10"></div> // Placeholder for alignment
                    )}
                  </div>
                </div>
              );
            })}
            {form.formState.errors.appliances?.root && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.appliances.root.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => append(getDefaultNewAppliance() as ApplianceFormEntry)}
              className="mt-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Appliance
            </Button>
          </div>

          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="selectedCurrencyValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency for Bill</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencyOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
                control={form.control}
                name="currentMonthlyBill"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-medium">Current Monthly Electricity Bill (Optional)</FormLabel>
                         <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground text-sm">
                              {selectedCurrency.symbol}
                            </span>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter your average monthly bill"
                                    className="pl-8"
                                    {...field}
                                    onChange={e => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />
          </div>


          <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Lightbulb className="mr-2 h-5 w-5" /> Calculate Energy Needs
          </Button>
        </form>
      </Form>

      {calculationResult && (
        <Card className="mt-8 shadow-md bg-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center text-accent">Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg">
            <div className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
              <span className="font-medium">Daily Energy Consumption:</span>
              <span className="font-bold text-accent">{calculationResult.dailyConsumptionKWh} kWh</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
              <span className="font-medium">Monthly Energy Consumption (approx.):</span>
              <span className="font-bold text-accent">{calculationResult.monthlyConsumptionKWh} kWh</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
              <span className="font-medium">Suggested Solar System Size:</span>
              <span className="font-bold text-accent">{calculationResult.suggestedSystemSizeKW} kW</span>
            </div>
          </CardContent>
          <CardFooter>
             <p className="text-sm text-muted-foreground text-center w-full">
              Note: This is a simplified estimation. Actual system size may vary based on location, roof characteristics, and specific energy goals.
            </p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}

