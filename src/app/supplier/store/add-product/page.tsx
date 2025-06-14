
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, serverTimestamp } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import type { MockUser } from "@/lib/mock-data/users"; // For supplier profile
import { getCurrencyByCode, getDefaultCurrency, type Currency } from "@/lib/currencies";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PackagePlus, Save, XCircle, Image as ImageIcon, AlertTriangle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const productCategories = [
  { value: "Panels", label: "Solar Panels" },
  { value: "Inverters", label: "Inverters" },
  { value: "Batteries", label: "Battery Storage" },
  { value: "Mounting", label: "Mounting Systems" },
  { value: "Accessories", label: "Accessories & Cables" },
  { value: "Other", label: "Other Equipment" },
];

const productFormSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  priceValue: z.coerce.number().positive({ message: "Price must be a positive number." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  imageHint: z.string().max(50, "Hint too long").optional().refine(val => !val || val.split(" ").length <= 2, { message: "Hint must be one or two words"}),
  stock: z.coerce.number().int().min(0, { message: "Stock quantity cannot be negative." }),
  category: z.string().min(1, { message: "Please select a product category." }),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function AddProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentSupplier, setCurrentSupplier] = useState<MockUser | null>(null);
  const [supplierCurrency, setSupplierCurrency] = useState<Currency>(getDefaultCurrency());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.role === "supplier") {
          const supplierProfile = userDocSnap.data() as MockUser;
          setCurrentSupplier(supplierProfile);
          setSupplierCurrency(getCurrencyByCode(supplierProfile.preferredCurrency) || getDefaultCurrency());
        } else {
          setCurrentSupplier(null);
        }
      } else {
        setCurrentSupplier(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      priceValue: undefined,
      imageUrl: "",
      imageHint: "",
      stock: 0,
      category: "",
      description: "",
    },
  });

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    if (!currentSupplier) {
        toast({ title: "Authentication Error", description: "You must be logged in as a supplier to add products.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const productData = {
        ...data,
        supplierId: currentSupplier.id,
        supplierName: currentSupplier.companyName || currentSupplier.fullName,
        currencyCode: supplierCurrency.value,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "products"), productData);
      toast({
        title: "Product Added Successfully!",
        description: `Product "${data.name}" has been added with ID: ${docRef.id}.`,
      });
      form.reset();
      // router.push("/supplier/store"); // Optional: redirect after successful submission
    } catch (error) {
      console.error("Error adding product to Firestore:", error);
      toast({
        title: "Error Adding Product",
        description: "There was a problem saving your product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4 pt-6">
            <Skeleton className="h-10 w-10 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-7 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="pt-6">
            <Skeleton className="h-10 w-24 ml-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!currentSupplier) {
     return (
      <div className="max-w-xl mx-auto text-center py-12">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
                <AlertTriangle className="w-16 h-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-headline text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You need to be logged in as a supplier to add products.
            </CardDescription>
          </CardHeader>
           <CardContent>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PackagePlus className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Add New Product</CardTitle>
          <CardDescription>
            Expand your catalog. Prices will be in your profile currency ({supplierCurrency.value} - {supplierCurrency.symbol}).
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., High-Efficiency Solar Panel 500W" {...field} />
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
                    <FormLabel>Product Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Briefly describe the product, key features, specifications..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="priceValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground text-sm">
                          {supplierCurrency.symbol}
                        </span>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 299.99"
                            className="pl-8"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 100" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><ImageIcon className="w-4 h-4 mr-2 text-muted-foreground" />Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com/product.png or https://placehold.co/300x200.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Keywords (Optional, max 2 words)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., solar panel" {...field} />
                    </FormControl>
                     <FormDescription>Keywords for image search if using placeholders (e.g., "inverter device").</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
               <Button variant="outline" type="button" asChild>
                <Link href="/supplier/store">
                  <XCircle className="mr-2 h-5 w-5" /> Cancel
                </Link>
              </Button>
              <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Product...
                  </>
                ) : (
                  <><Save className="mr-2 h-5 w-5" /> Add Product to Catalog</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
