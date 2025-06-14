
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Briefcase, Save, XCircle, Image as ImageIcon, Loader2 } from "lucide-react";

const projectFormSchema = z.object({
  title: z.string().min(3, { message: "Project title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  imageHint: z.string().max(50, "Hint too long").optional().refine(val => !val || val.split(" ").length <= 2, { message: "Hint must be one or two words"}),
  location: z.string().min(3, { message: "Location is required." }),
  dateCompleted: z.string().refine((date) => new Date(date).toString() !== "Invalid Date", {
    message: "Please enter a valid completion date.",
  }),
  systemSize: z.string().min(1, { message: "System size is required (e.g., 5 kWp)." }),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export default function AddProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      imageHint: "",
      location: "",
      dateCompleted: "",
      systemSize: "",
    },
  });

  const onSubmit: SubmitHandler<ProjectFormData> = async (data) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("New Project Data:", data);
    
    toast({
      title: "Project Added (Simulated)",
      description: `Project "${data.title}" has been successfully added to your portfolio. This is a simulated action; no data was saved to a database in this step.`,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Briefcase className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Add New Project to Portfolio</CardTitle>
          <CardDescription>
            Showcase your latest solar installation to attract potential clients.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sunnyvale Family Home Solar Installation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the project, its impact, key features, challenges overcome, and customer benefits..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><ImageIcon className="w-4 h-4 mr-2 text-muted-foreground" />Project Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com/project-image.png or https://placehold.co/600x400.png" {...field} />
                    </FormControl>
                    <FormDescription>A high-quality image of the completed installation.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Keywords (Optional, for placeholders)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., residential solar, rooftop panels" {...field} />
                    </FormControl>
                     <FormDescription>Max 2 words. Used for AI assistance if Image URL is a placeholder (e.g., "rooftop solar").</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Austin, TX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Completed</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="systemSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Size (e.g., kWp, kWh)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 5.5 kWp PV, 10 kWh battery" {...field} />
                    </FormControl>
                    <FormDescription>Specify the capacity of the solar PV system and battery, if applicable.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
               <Button variant="outline" type="button" asChild>
                <Link href="/installer/portfolio">
                  <XCircle className="mr-2 h-5 w-5" /> Cancel
                </Link>
              </Button>
              <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Project...
                  </>
                ) : (
                  <><Save className="mr-2 h-5 w-5" /> Save Project</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
