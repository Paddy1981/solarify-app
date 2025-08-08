
"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, serverTimestamp } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getMockUserByEmail, type MockUser, type UserRole } from "@/lib/mock-data/users";
import { currencyOptions, getCurrencyByCode, getDefaultCurrency, type Currency } from "@/lib/currencies";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, UserCircle, Settings, Save, LogIn, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const settingsFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  location: z.string().min(3, { message: "Location is required." }),
  preferredCurrency: z.string().min(1, { message: "Please select your currency." }),
  phone: z.string().optional(),
  avatarUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  companyName: z.string().optional(),
  specialties: z.string().optional(), 
  productsOffered: z.string().optional(), 
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

function SettingsLoadingSkeleton() {
  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Settings className="w-12 h-12 text-primary" />
        </div>
        <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-28 ml-auto" />
      </CardFooter>
    </Card>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = React.useState<MockUser | null>(null);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {},
  });

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const firestoreProfile = userDocSnap.data() as MockUser; // Assuming Firestore data matches MockUser structure
          setCurrentUserProfile(firestoreProfile);
          form.reset({
            fullName: firestoreProfile.fullName,
            location: firestoreProfile.location || "",
            preferredCurrency: firestoreProfile.preferredCurrency || getDefaultCurrency().value,
            phone: firestoreProfile.phone || "",
            avatarUrl: firestoreProfile.avatarUrl || "",
            companyName: firestoreProfile.companyName || "",
            specialties: firestoreProfile.specialties?.join(', ') || "",
            productsOffered: firestoreProfile.productsOffered?.join(', ') || "",
          });
        } else {
          // Fallback to mock/localStorage if Firestore doc doesn't exist (e.g., for users not yet migrated)
          const profileFromMock = getMockUserByEmail(user.email || "");
          setCurrentUserProfile(profileFromMock || null);
           if (profileFromMock) {
             form.reset({
                fullName: profileFromMock.fullName,
                location: profileFromMock.location || "",
                preferredCurrency: profileFromMock.preferredCurrency || getDefaultCurrency().value,
                phone: profileFromMock.phone || "",
                avatarUrl: profileFromMock.avatarUrl || "",
                companyName: profileFromMock.companyName || "",
                specialties: profileFromMock.specialties?.join(', ') || "",
                productsOffered: profileFromMock.productsOffered?.join(', ') || "",
             });
           }
        }
      } else {
        setCurrentUserProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [form]);

  const onSubmit: SubmitHandler<SettingsFormData> = async (data) => {
    if (!currentUserProfile || !firebaseUser) {
      toast({ title: "Error", description: "User not found. Please log in again.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const updatedProfileData: Partial<MockUser> = {
      fullName: data.fullName,
      location: data.location,
      preferredCurrency: data.preferredCurrency,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
      companyName: data.companyName,
      specialties: data.specialties ? data.specialties.split(',').map(s => s.trim()).filter(s => s) : undefined,
      productsOffered: data.productsOffered ? data.productsOffered.split(',').map(s => s.trim()).filter(s => s) : undefined,
      // No 'updatedAt' here as serverTimestamp is for Firestore write operations
    };

    try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userDocRef, {
            ...updatedProfileData,
            updatedAt: serverTimestamp() // Add/update timestamp on Firestore write
        });

        // Update local state and localStorage if still needed for non-Firestore aware components
        const fullyUpdatedProfile = { ...currentUserProfile, ...updatedProfileData };
        setCurrentUserProfile(fullyUpdatedProfile);
        if (typeof window !== 'undefined' && fullyUpdatedProfile.email) {
            localStorage.setItem(`userProfile_${fullyUpdatedProfile.email.toLowerCase()}`, JSON.stringify(fullyUpdatedProfile));
        }
        if (global._mockUsers) {
            const userIndex = global._mockUsers.findIndex(u => u.id === firebaseUser.uid);
            if (userIndex !== -1) {
                global._mockUsers[userIndex] = { ...global._mockUsers[userIndex], ...updatedProfileData };
            }
        }

        toast({ title: "Profile Updated", description: "Your settings have been successfully saved to Firestore." });
    } catch (error) {
        console.error("Error updating profile in Firestore:", error);
        toast({ title: "Update Failed", description: "Could not save settings to Firestore.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-12">
        <SettingsLoadingSkeleton />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-12">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <div className="flex justify-center mb-4"> <LogIn className="w-12 h-12 text-primary" /></div>
            <CardTitle className="text-2xl font-headline">Access Denied</CardTitle>
            <CardDescription>Please log in to access your settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-12">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <div className="flex justify-center mb-4"><UserCircle className="w-12 h-12 text-destructive" /></div>
            <CardTitle className="text-2xl font-headline text-destructive">Profile Not Loaded</CardTitle>
            <CardDescription>We couldn't load your profile details. Please try again or contact support.</CardDescription>
          </CardHeader>
           <CardFooter>
             <Button variant="outline" asChild className="w-full">
                <Link href="/"> <ArrowLeft className="mr-2 h-4 w-4" /> Go to Homepage</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-[calc(100vh-10rem)] py-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Settings className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Account Settings</CardTitle>
          <CardDescription>Manage your profile information and preferences.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormItem>
                  <FormLabel>Email Address (Read-only)</FormLabel>
                  <FormControl><Input value={currentUserProfile.email} readOnly className="bg-muted/50" /></FormControl>
                  <FormDescription>Email cannot be changed here. Contact support if needed.</FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>Account Type (Read-only)</FormLabel>
                  <FormControl>
                    <Input 
                      value={currentUserProfile.role ? 
                        currentUserProfile.role.charAt(0).toUpperCase() + currentUserProfile.role.slice(1) : 
                        'Unknown'
                      } 
                      readOnly 
                      className="bg-muted/50" 
                    />
                  </FormControl>
                  <FormDescription>Your account type determines available features.</FormDescription>
                </FormItem>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (City, Country)</FormLabel>
                      <FormControl><Input placeholder="e.g., San Francisco, USA" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
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
              </div>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl><Input type="tel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL (Optional)</FormLabel>
                    <FormControl><Input type="url" placeholder="https://example.com/avatar.png" {...field} /></FormControl>
                    <FormDescription>Link to your profile picture.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(currentUserProfile.role === "installer" || currentUserProfile.role === "supplier") && (
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {currentUserProfile.role === "installer" && (
                <FormField
                  control={form.control}
                  name="specialties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialties</FormLabel>
                      <FormControl><Textarea placeholder="e.g., Residential Solar, Commercial Solar, Battery Storage" {...field} /></FormControl>
                      <FormDescription>Comma-separated list of your specialties.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {currentUserProfile.role === "supplier" && (
                <FormField
                  control={form.control}
                  name="productsOffered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Products Offered</FormLabel>
                      <FormControl><Textarea placeholder="e.g., Solar Panels, Inverters, Mounting Kits" {...field} /></FormControl>
                      <FormDescription>Comma-separated list of products you offer.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
               <Button type="button" variant="link" className="px-0 text-sm" onClick={() => alert("Password change functionality would be handled here, possibly directing to a Firebase flow.")}>
                Change Password
              </Button>
            </CardContent>
            <CardFooter className="flex justify-end pt-8">
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
