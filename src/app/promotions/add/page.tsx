
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, serverTimestamp } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import type { MockUser } from "@/lib/mock-data/users";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Edit3, Save, XCircle, Image as ImageIcon, AlertTriangle, LogIn } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const promotionFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  content: z.string().min(20, { message: "Content must be at least 20 characters." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  imageHint: z.string().max(50, "Hint too long").optional().refine(val => !val || val.split(" ").length <= 2, { message: "Hint must be one or two words"}),
  discountOffer: z.string().optional(),
  callToActionText: z.string().optional(),
  callToActionLink: z.string().url({ message: "Please enter a valid URL for the link." }).optional().or(z.literal('')),
  tags: z.string().optional(), // Comma-separated
  validUntil: z.string().optional().refine(val => !val || !isNaN(new Date(val).getTime()), {message: "Invalid date"}),
}).refine(data => !data.callToActionText || !!data.callToActionLink, {
  message: "Call to action link is required if call to action text is provided.",
  path: ["callToActionLink"],
}).refine(data => !!data.callToActionText || !data.callToActionLink, {
  message: "Call to action text is required if call to action link is provided.",
  path: ["callToActionText"],
});

type PromotionFormData = z.infer<typeof promotionFormSchema>;

function AddPromotionPageSkeleton() {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4 pt-6">
            <Skeleton className="h-10 w-10 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-7 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="pt-6 flex justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
}


export default function AddPromotionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<MockUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUserProfile(userDocSnap.data() as MockUser);
        } else {
          setCurrentUserProfile(null); // Or handle error: profile not found
        }
      } else {
        setCurrentUserProfile(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      title: "",
      content: "",
      imageUrl: "",
      imageHint: "",
      discountOffer: "",
      callToActionText: "",
      callToActionLink: "",
      tags: "",
      validUntil: "",
    },
  });

  const onSubmit: SubmitHandler<PromotionFormData> = async (data) => {
    if (!currentUser || !currentUserProfile) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a promotion.", variant: "destructive" });
      return;
    }
    // Basic role check for now - could be more granular
    if (currentUserProfile.role !== "installer" && currentUserProfile.role !== "supplier") {
        toast({ title: "Permission Denied", description: "Only installers and suppliers can create promotions.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
      const promotionData = {
        ...data,
        authorId: currentUser.uid,
        authorName: currentUserProfile.companyName || currentUserProfile.fullName,
        authorRole: currentUserProfile.role,
        authorAvatarUrl: currentUserProfile.avatarUrl || `https://placehold.co/100x100.png?text=${(currentUserProfile.companyName || currentUserProfile.fullName)[0]}`,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        postDate: serverTimestamp(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null, // Store as Date, Firestore converts
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "promotions"), promotionData);
      toast({
        title: "Promotion Created!",
        description: `Your promotion "${data.title}" has been successfully published. ID: ${docRef.id.substring(0,8)}`,
      });
      form.reset();
      router.push("/promotions"); 
    } catch (error) {
      console.error("Error creating promotion:", error);
      toast({
        title: "Error Creating Promotion",
        description: "There was a problem publishing your promotion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return <AddPromotionPageSkeleton />;
  }

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
                <LogIn className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Access Denied</CardTitle>
            <CardDescription>
              Please log in to create a new promotion.
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
   if (currentUserProfile && currentUserProfile.role !== "installer" && currentUserProfile.role !== "supplier") {
     return (
      <div className="max-w-xl mx-auto text-center py-12">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
                <AlertTriangle className="w-16 h-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-headline text-destructive">Permission Denied</CardTitle>
            <CardDescription>
              Only installers and suppliers are currently permitted to create promotions.
            </CardDescription>
          </CardHeader>
           <CardContent>
            <Button asChild variant="outline" size="lg">
              <Link href="/promotions">View Promotions</Link>
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
            <Edit3 className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Create New Promotion</CardTitle>
          <CardDescription>
            Share your latest offers, discounts, or announcements with the Solarify community.
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
                    <FormLabel>Promotion Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Summer Sale on Panels!" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Content</FormLabel>
                    <FormControl><Textarea placeholder="Describe your promotion in detail..." rows={5} {...field} /></FormControl>
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
                    <FormControl><Input type="url" placeholder="https://example.com/promo.png or https://placehold.co/600x300.png" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="e.g., solar discount" {...field} /></FormControl>
                    <FormDescription>Max 2 words. Used if Image URL is a placeholder (e.g., "sale event").</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="discountOffer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Offer (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., 15% Off, $100 Discount" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until (Optional)</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Optional, comma-separated)</FormLabel>
                    <FormControl><Input placeholder="e.g., Discount, New Product, Solar Panels" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="callToActionText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call to Action Text (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., Learn More, Shop Now" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="callToActionLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call to Action Link (Optional)</FormLabel>
                      <FormControl><Input type="url" placeholder="https://example.com/offer" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
               <Button variant="outline" type="button" asChild>
                <Link href="/promotions">
                  <XCircle className="mr-2 h-5 w-5" /> Cancel
                </Link>
              </Button>
              <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? (
                  <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                ) : (
                  <><Save className="mr-2 h-5 w-5" /> Publish Promotion</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
