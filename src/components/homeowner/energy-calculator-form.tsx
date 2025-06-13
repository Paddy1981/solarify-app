
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, PlusCircle, Lightbulb, ListChecks, Layers, RadioTower, BatteryCharging, Wrench, Cable } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { currencyOptions, getCurrencyByCode, getDefaultCurrency, type Currency } from "@/lib/currencies";
import { auth } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

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
  wattage: z.coerce.number({ invalid_type_error: "Must be a number" }).min(1, "Wattage must be positive").optional(),
  quantity: z.coerce.number({ invalid_type_error: "Must be a number" }).int().min(1, "Quantity must be at least 1").default(1),
  hoursPerDay: z.coerce.number({ invalid_type_error: "Must be a number" }).min(0).max(24, "Hours must be between 0 and 24").optional(),
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
  quantity?: number;
  hoursPerDay?: number;
};

interface EquipmentItem {
    iconName?: string; // Changed from React.ReactNode to string
    name: string;
    quantity: string;
    details: string;
}

interface CalculationResult {
  dailyConsumptionKWh: number;
  monthlyConsumptionKWh: number;
  suggestedSystemSizeKW: number;
  itemizedEquipmentList: EquipmentItem[];
  solarPanelOptions: string[];
  inverterRecommendation: string;
  batteryRecommendation: string;
}

const getDefaultNewAppliance = (): ApplianceDefaultValue => {
  const firstAppliance = commonAppliancesData.find(a => a.value !== 'other');
  if (firstAppliance) {
    return {
      applianceType: firstAppliance.value,
      customName: "",
      wattage: firstAppliance.defaultWattage,
      quantity: 1,
      hoursPerDay: undefined
    };
  }
  return {
    applianceType: "other",
    customName: "",
    wattage: undefined,
    quantity: 1,
    hoursPerDay: undefined
  };
};

const renderEquipmentIcon = (iconName?: string): React.ReactNode => {
  if (!iconName) return null;
  const commonProps = { className: "w-5 h-5 text-accent" };
  switch (iconName) {
    case "Layers": return <Layers {...commonProps} />;
    case "RadioTower": return <RadioTower {...commonProps} />;
    case "BatteryCharging": return <BatteryCharging {...commonProps} />;
    case "Wrench": return <Wrench {...commonProps} />;
    case "Cable": return <Cable {...commonProps} />;
    default: return null;
  }
};

export function EnergyCalculatorForm() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(getDefaultCurrency());
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      try {
        const storedResultKey = `energyCalcResult_${currentUser.uid}`;
        const storedResult = localStorage.getItem(storedResultKey);
        if (storedResult) {
          setCalculationResult(JSON.parse(storedResult));
        }
      } catch (error) {
        console.error("Error loading energy calculation from localStorage:", error);
        localStorage.removeItem(`energyCalcResult_${currentUser.uid}`); // Clear potentially corrupted data
      }
    }
  }, [currentUser]);


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
  }, [watchedCurrencyValue, setSelectedCurrency]);


  const onSubmit: SubmitHandler<FormData> = (data) => {
    let totalDailyWattHours = 0;
    data.appliances.forEach(appliance => {
      totalDailyWattHours += (appliance.wattage || 0) * (appliance.hoursPerDay || 0) * (appliance.quantity || 1);
    });

    const dailyConsumptionKWh = totalDailyWattHours / 1000;
    const monthlyConsumptionKWh = dailyConsumptionKWh * 30;
    const suggestedSystemSizeKW = (dailyConsumptionKWh / 4) * 1.25; // 4 peak sun hours, 25% buffer

    const panelWattages = [450, 500, 550];
    const solarPanelOptions = panelWattages.map(wattage => {
        const numPanels = Math.ceil((suggestedSystemSizeKW * 1000) / wattage);
        return `Approx. ${numPanels} x ${wattage}W panels (Total: ${(numPanels * wattage / 1000).toFixed(1)} kW)`;
    });

    const inverterSizeKW = parseFloat(suggestedSystemSizeKW.toFixed(1));
    const inverterRecommendation = `A ~${inverterSizeKW} kW Grid-Tie Inverter is recommended. Consider a Hybrid Inverter if adding batteries.`;

    const recommendedBatteryKWh = parseFloat((dailyConsumptionKWh * 1.5).toFixed(1));
    const batteryRecommendation = `For backup & self-consumption, a ~${recommendedBatteryKWh} kWh battery system is suggested. (Based on ${dailyConsumptionKWh.toFixed(1)} kWh daily usage).`;

    const itemizedEquipmentList: EquipmentItem[] = [
        { iconName: "Layers", name: `Solar Panels (${panelWattages.join('/')}W range)`, quantity: `${Math.ceil(suggestedSystemSizeKW*1000/550)}-${Math.ceil(suggestedSystemSizeKW*1000/450)} units`, details: `Total ~${inverterSizeKW} kW capacity` },
        { iconName: "RadioTower", name: "Inverter", quantity: "1 unit", details: `~${inverterSizeKW} kW, Grid-Tie or Hybrid` },
        { iconName: "BatteryCharging", name: "Battery Storage", quantity: "1 unit (Optional)", details: `~${recommendedBatteryKWh} kWh Lithium-ion` },
        { iconName: "Wrench", name: "Mounting System", quantity: "1 set", details: "Standard roof-mount kit" },
        { iconName: "Cable", name: "Cables & Accessories", quantity: "1 lot", details: "PV cabling, connectors, etc." }
    ];

    const newCalculationResult: CalculationResult = {
      dailyConsumptionKWh: parseFloat(dailyConsumptionKWh.toFixed(2)),
      monthlyConsumptionKWh: parseFloat(monthlyConsumptionKWh.toFixed(2)),
      suggestedSystemSizeKW: parseFloat(suggestedSystemSizeKW.toFixed(2)),
      itemizedEquipmentList,
      solarPanelOptions,
      inverterRecommendation,
      batteryRecommendation,
    };
    setCalculationResult(newCalculationResult);

    if (currentUser) {
      try {
        localStorage.setItem(`energyCalcResult_${currentUser.uid}`, JSON.stringify(newCalculationResult));
      } catch (error) {
        console.error("Error saving energy calculation to localStorage:", error);
      }
    }
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

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-x-4 gap-y-4 items-end mt-4">
                     <FormField
                      control={form.control}
                      name={`appliances.${index}.quantity`}
                      render={({ field: controllerField }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 1"
                              {...controllerField}
                              value={controllerField.value ?? ""}
                              onChange={e => controllerField.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                      <div className="hidden md:block h-10"></div>
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
            <Lightbulb className="mr-2 h-5 w-5" /> Calculate Energy Needs & System
          </Button>
        </form>
      </Form>

      {calculationResult && (
        <Card className="mt-8 shadow-md bg-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center text-accent">Solar System Estimation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                <div className="p-3 bg-background rounded-md shadow-sm">
                    <p className="font-medium">Daily Energy Consumption:</p>
                    <p className="font-bold text-accent text-xl">{calculationResult.dailyConsumptionKWh} kWh</p>
                </div>
                <div className="p-3 bg-background rounded-md shadow-sm">
                    <p className="font-medium">Monthly Consumption (approx.):</p>
                    <p className="font-bold text-accent text-xl">{calculationResult.monthlyConsumptionKWh} kWh</p>
                </div>
            </div>
             <div className="p-4 bg-background rounded-md shadow-sm">
                <p className="font-medium text-lg">Suggested Solar System Size:</p>
                <p className="font-bold text-accent text-2xl">{calculationResult.suggestedSystemSizeKW} kW</p>
            </div>

            <Separator className="my-4"/>

            <div>
                <h4 className="text-xl font-headline text-accent mb-3 flex items-center"><ListChecks className="w-6 h-6 mr-2"/>Estimated Equipment List</h4>
                <div className="space-y-3">
                    {calculationResult.itemizedEquipmentList.map(item => (
                        <Card key={item.name} className="bg-background/70 shadow">
                            <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
                                {item.iconName && <div className="mt-1">{renderEquipmentIcon(item.iconName)}</div>}
                                <div className="flex-1">
                                    <CardTitle className="text-md font-semibold">{item.name}</CardTitle>
                                    <CardDescription className="text-sm">
                                        <strong>Quantity:</strong> {item.quantity} <br/>
                                        <strong>Details:</strong> {item.details}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>

            <Separator className="my-4"/>
            
            <div>
                <h4 className="text-xl font-headline text-accent mb-2">Solar Panel Options</h4>
                <ul className="list-disc list-inside space-y-1 pl-2 text-muted-foreground">
                    {calculationResult.solarPanelOptions.map((option, idx) => (
                        <li key={idx} className="text-sm">{option}</li>
                    ))}
                </ul>
            </div>

            <Separator className="my-4"/>

            <div>
                <h4 className="text-xl font-headline text-accent mb-2">Inverter Recommendation</h4>
                <p className="text-sm text-muted-foreground">{calculationResult.inverterRecommendation}</p>
            </div>
            
            <Separator className="my-4"/>

            <div>
                <h4 className="text-xl font-headline text-accent mb-2">Battery Recommendation</h4>
                <p className="text-sm text-muted-foreground">{calculationResult.batteryRecommendation}</p>
            </div>

          </CardContent>
          <CardFooter>
             <p className="text-sm text-muted-foreground text-center w-full">
              Note: This is a simplified estimation. Actual system components and sizes may vary based on detailed site assessment, location, roof characteristics, specific energy goals, and local regulations. Consult with a professional solar installer.
            </p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}

