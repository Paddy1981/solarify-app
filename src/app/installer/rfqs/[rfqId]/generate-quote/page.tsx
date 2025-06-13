
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { getRFQById, type RFQ } from "@/lib/mock-data/rfqs";
import { getMockUserById, type MockUser } from "@/lib/mock-data/users";
import { getCurrencyByCode, getDefaultCurrency, type Currency } from "@/lib/currencies";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, PlusCircle, Trash2, Send, Info, UserCircle, Home, Edit } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";


const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().min(0.1, "Quantity must be positive."),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."),
  total: z.coerce.number(), 
});

const quoteFormSchema = z.object({
  rfqId: z.string(),
  generatedByInstallerId: z.string(),
  homeownerName: z.string(), 
  homeownerEmail: z.string().email(),
  projectAddress: z.string(), 
  quoteDate: z.string().default(new Date().toISOString().split("T")[0]),
  validityPeriodDays: z.coerce.number().min(1, "Validity period must be at least 1 day.").default(30),
  lineItems: z.array(lineItemSchema).min(1, "Please add at least one line item."),
  subtotal: z.coerce.number(),
  taxRate: z.coerce.number().min(0).max(100).default(0), 
  taxAmount: z.coerce.number(),
  totalAmount: z.coerce.number(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional().default("Standard terms apply. Payment due upon completion unless otherwise agreed."),
  currencyCode: z.string(), // To store the currency code for the quote
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;
type LineItemData = z.infer<typeof lineItemSchema>;

const defaultLineItem: LineItemData = { description: "", quantity: 1, unitPrice: 0, total: 0 };

export default function GenerateQuotePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const rfqId = params.rfqId as string;

  const [rfqDetails, setRfqDetails] = React.useState<RFQ | null>(null);
  const [installerDetails, setInstallerDetails] = React.useState<MockUser | null>(null);
  const [quoteCurrency, setQuoteCurrency] = React.useState<Currency>(getDefaultCurrency());
  const [isLoading, setIsLoading] = React.useState(true);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      rfqId: rfqId,
      generatedByInstallerId: "", // Will be set from installerDetails
      homeownerName: "",
      homeownerEmail: "",
      projectAddress: "",
      quoteDate: new Date().toISOString().split("T")[0],
      validityPeriodDays: 30,
      lineItems: [defaultLineItem],
      subtotal: 0,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: 0,
      notes: "",
      termsAndConditions: "Standard terms apply. Payment due upon completion unless otherwise agreed.",
      currencyCode: getDefaultCurrency().value,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  React.useEffect(() => {
    // In a real app, current installer ID would come from auth context
    const MOCK_CURRENT_INSTALLER_ID = "installer-user-001"; 
    const rfq = getRFQById(rfqId);
    const installer = getMockUserById(MOCK_CURRENT_INSTALLER_ID);
    
    if (rfq && installer) {
      setRfqDetails(rfq);
      setInstallerDetails(installer);
      const currentInstallerCurrency = getCurrencyByCode(installer.currency) || getDefaultCurrency();
      setQuoteCurrency(currentInstallerCurrency);

      form.reset({
        ...form.getValues(), 
        rfqId: rfq.id,
        generatedByInstallerId: installer.id,
        homeownerName: rfq.name,
        homeownerEmail: rfq.email,
        projectAddress: rfq.address,
        currencyCode: currentInstallerCurrency.value,
      });
    } else {
      if (!rfq) toast({ title: "Error", description: "RFQ not found.", variant: "destructive" });
      if (!installer) toast({ title: "Error", description: "Installer profile not found.", variant: "destructive" });
      router.push("/installer/rfqs");
    }
    setIsLoading(false);
  }, [rfqId, form, router, toast]);

  const watchedLineItems = form.watch("lineItems");
  const watchedTaxRate = form.watch("taxRate");

  React.useEffect(() => {
    let newSubtotal = 0;
    watchedLineItems.forEach((item, index) => {
      const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
      form.setValue(`lineItems.${index}.total`, parseFloat(lineTotal.toFixed(2)), { shouldValidate: false });
      newSubtotal += lineTotal;
    });

    const taxAmount = (newSubtotal * (watchedTaxRate || 0)) / 100;
    const totalAmount = newSubtotal + taxAmount;

    form.setValue("subtotal", parseFloat(newSubtotal.toFixed(2)));
    form.setValue("taxAmount", parseFloat(taxAmount.toFixed(2)));
    form.setValue("totalAmount", parseFloat(totalAmount.toFixed(2)));

  }, [watchedLineItems, watchedTaxRate, form]);


  const onSubmit: SubmitHandler<QuoteFormData> = async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Generated Quote Data:", data);
    toast({
      title: "Quote Generated (Simulated)",
      description: `Quote for RFQ ID ${data.rfqId} has been successfully generated in ${data.currencyCode}.`,
    });
  };

  if (isLoading || !rfqDetails || !installerDetails) {
    return (
      <div className="max-w-4xl mx-auto">
         <Card className="shadow-xl">
            <CardHeader className="text-center pb-4 pt-6">
                <Skeleton className="h-10 w-10 mx-auto mb-4 rounded-full" />
                <Skeleton className="h-7 w-1/2 mx-auto mb-2" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                <Skeleton className="h-20 w-full" />
                {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2 border p-4 rounded-md">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-1/2" />
                </div>
                ))}
                <Skeleton className="h-10 w-1/3 mt-4" />
            </CardContent>
             <CardFooter className="flex flex-col items-end gap-3 pt-6 bg-muted/30 p-6 rounded-b-lg">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-8 w-1/2 mt-2" />
                <Skeleton className="h-10 w-1/2 mt-4 self-stretch sm:self-auto" />
             </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <FileSpreadsheet className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-headline">Generate Quote</CardTitle>
              <CardDescription>
                Create a detailed quote for RFQ ID: <span className="font-semibold text-accent">{rfqId}</span>.
                All monetary values in {quoteCurrency.value} ({quoteCurrency.symbol}).
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Alert variant="default" className="mb-6 bg-muted/50">
                <Info className="h-5 w-5 text-accent" />
                <AlertTitle className="font-headline text-accent">Responding To:</AlertTitle>
                <AlertDescription>
                  <p><strong className="font-medium">Homeowner:</strong> {rfqDetails.name} ({rfqDetails.email})</p>
                  <p><strong className="font-medium">Address:</strong> {rfqDetails.address}</p>
                  <p><strong className="font-medium">Est. System:</strong> {rfqDetails.estimatedSystemSizeKW} kW, <strong className="font-medium">Avg. Consumption:</strong> {rfqDetails.monthlyConsumptionKWh} kWh/month</p>
                  {rfqDetails.additionalNotes && <p><strong className="font-medium">Notes:</strong> {rfqDetails.additionalNotes}</p>}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FormField control={form.control} name="quoteDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="validityPeriodDays" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validity Period (Days)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator className="my-6"/>

              <div>
                <h3 className="text-xl font-semibold font-headline text-accent mb-1">Line Items</h3>
                <FormDescription className="mb-4">Add products, services, and their costs. Currency: {quoteCurrency.symbol}</FormDescription>
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md mb-4 shadow-sm bg-muted/30 relative">
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-x-4 gap-y-4 items-end">
                      <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Input placeholder="e.g., Solar Panel 450W" {...f} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl><Input type="number" step="0.1" placeholder="1" {...f} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`lineItems.${index}.unitPrice`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Unit Price</FormLabel>
                           <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground text-sm">
                              {quoteCurrency.symbol}
                            </span>
                            <FormControl><Input type="number" step="0.01" placeholder="250" className="pl-8" {...f} /></FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`lineItems.${index}.total`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Line Total</FormLabel>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground text-sm">
                              {quoteCurrency.symbol}
                            </span>
                            <FormControl><Input type="number" {...f} readOnly className="bg-muted border-none pl-8" /></FormControl>
                          </div>
                        </FormItem>
                      )} />
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 h-7 w-7"
                        aria-label="Remove line item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {form.formState.errors.lineItems?.root && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.lineItems.root.message}</p>
                )}
                <Button type="button" variant="outline" onClick={() => append(defaultLineItem)} className="mt-2">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
                </Button>
              </div>

              <Separator className="my-6"/>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Additional Notes for Homeowner</FormLabel>
                    <FormControl><Textarea placeholder="Any clarifications, exclusions, or special offers..." {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="termsAndConditions" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl><Textarea {...field} rows={4} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

            </CardContent>
            <CardFooter className="flex flex-col items-end gap-3 pt-6 bg-muted/30 p-6 rounded-b-lg">
                <div className="w-full max-w-xs space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">{quoteCurrency.symbol}{form.getValues("subtotal").toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                             <FormLabel htmlFor="taxRate" className="shrink-0">Tax (%):</FormLabel>
                             <FormField control={form.control} name="taxRate" render={({ field }) => (
                                <FormItem className="w-20">
                                    <FormControl><Input id="taxRate" type="number" step="0.01" className="h-8 text-sm p-1" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <span className="font-medium">{quoteCurrency.symbol}{form.getValues("taxAmount").toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-lg font-bold text-accent border-t pt-1 mt-1">
                        <span>Total Amount:</span>
                        <span>{quoteCurrency.symbol}{form.getValues("totalAmount").toFixed(2)}</span>
                    </div>
                </div>
                 <Button type="submit" size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 mt-4" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <><Send className="mr-2 h-5 w-5" /> Generate & Send Quote (Simulated)</>
                  )}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
