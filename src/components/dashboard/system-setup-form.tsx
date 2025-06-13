
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { PanelTop, CalendarDays, MapPin, Send } from "lucide-react"; // Changed SolarPanel to PanelTop
import type { MockUser } from "@/lib/mock-data/users";

export const systemConfigSchema = z.object({
  systemSizeKW: z.coerce.number().positive("System size must be a positive number.").min(0.1, "System size must be at least 0.1 kW."),
  installationDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: "Please enter a valid installation date.",
  }),
  location: z.string().min(2, "Location is required (e.g., City, State)."),
});

export type SystemConfigData = z.infer<typeof systemConfigSchema>;

interface SystemSetupFormProps {
  onConfigSubmit: (data: SystemConfigData) => void;
  userProfile: MockUser | null;
}

export function SystemSetupForm({ onConfigSubmit, userProfile }: SystemSetupFormProps) {
  const form = useForm<SystemConfigData>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      systemSizeKW: undefined,
      installationDate: "",
      location: userProfile?.location || "",
    },
  });

  const onSubmit: SubmitHandler<SystemConfigData> = (data) => {
    onConfigSubmit(data);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-15rem)] py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PanelTop className="w-16 h-16 text-primary" /> {/* Changed SolarPanel to PanelTop */}
          </div>
          <CardTitle className="text-3xl font-headline">Configure Your Solar Dashboard</CardTitle>
          <CardDescription>
            Please provide some basic details about your solar system to personalize your dashboard experience.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="systemSizeKW"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><PanelTop className="w-4 h-4 mr-2 text-muted-foreground" /> System Size (kWp)</FormLabel> {/* Changed SolarPanel to PanelTop */}
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 5.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>Enter the total power output of your solar panels (e.g., 5.5 for 5.5 kWp).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="installationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" /> Installation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                     <FormDescription>When was your solar system installed?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-muted-foreground" /> Location (City, State/Country)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Austin, TX or Bangalore, India" {...field} />
                    </FormControl>
                    <FormDescription>This helps in estimating solar irradiance if used by future features.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <><Send className="mr-2 h-5 w-5" /> Save Configuration & View Dashboard</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
