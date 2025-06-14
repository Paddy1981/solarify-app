
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, type UserCredential } from "firebase/auth";
import { auth, db, serverTimestamp } from "@/lib/firebase"; 
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"; 
import { currencyOptions } from "@/lib/currencies";
import type { MockUser } from "@/lib/mock-data/users"; 

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const signupFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["homeowner", "installer", "supplier"], { required_error: "Please select a role." }),
  location: z.string().min(3, { message: "Location must be at least 3 characters (e.g., City, Country)." }),
  preferredCurrency: z.string().min(1, { message: "Please select your preferred currency." }),
});

type SignupFormData = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: undefined,
      location: "",
      preferredCurrency: "",
    },
  });

  const createOrUpdateFirestoreUser = async (
    user: UserCredential["user"], 
    role: SignupFormData['role'], 
    location: SignupFormData['location'], 
    preferredCurrency: SignupFormData['preferredCurrency'],
    fullName?: string, // For Google Sign-in, as it might override form's fullName
    avatarUrl?: string // For Google Sign-in
  ) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    const userFullName = fullName || user.displayName || form.getValues("fullName");
    const userAvatar = avatarUrl || user.photoURL || `https://placehold.co/100x100.png?text=${userFullName[0]?.toUpperCase() || 'U'}`;

    if (!userDocSnap.exists()) {
      const userDocData = {
        uid: user.uid,
        email: user.email,
        fullName: userFullName,
        role: role,
        location: location,
        preferredCurrency: preferredCurrency,
        avatarUrl: userAvatar,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isActive: true,
        companyName: role === 'installer' || role === 'supplier' ? `${userFullName}'s Company (Default)` : undefined,
        specialties: role === 'installer' ? ['Residential Solar (Default)'] : undefined,
        productsOffered: role === 'supplier' ? ['Solar Panels (Default)'] : undefined,
      };
      await setDoc(userDocRef, userDocData);
      toast({
        title: "Account Created!",
        description: "Your Solarify account has been successfully created.",
      });
    } else {
      // User exists in Firestore, update lastLogin and potentially merge info if needed
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        // Optionally, update other fields if Google profile has newer info, but be cautious
        // fullName: userFullName, // Example: update if Google's name is preferred
        // avatarUrl: userAvatar, // Example: update avatar
      });
      toast({
        title: "Welcome Back!",
        description: "Logged in successfully.",
      });
    }
    
    // Common redirection logic
    if (role === "installer") {
      router.push("/installer/dashboard");
    } else if (role === "homeowner") {
      router.push("/homeowner/dashboard");
    } else if (role === "supplier") {
      router.push("/supplier/dashboard");
    } else {
      router.push("/");
    }

    // Update local mock data cache (can be phased out with full Firestore integration)
    const newUserProfileForMock: MockUser = {
        id: user.uid,
        fullName: userFullName,
        email: user.email!,
        role,
        location,
        preferredCurrency,
        avatarUrl: userAvatar,
        lastLogin: new Date().toISOString(),
        isActive: true,
        memberSince: new Date().toISOString().split("T")[0],
        companyName: (role === 'installer' || role === 'supplier') ? `${userFullName}'s Company (Default)` : undefined,
    };
    if (typeof window !== 'undefined') {
        localStorage.setItem(`userProfile_${user.email!.toLowerCase()}`, JSON.stringify(newUserProfileForMock));
    }
    if (global._mockUsers && !global._mockUsers.find(u => u.id === user.uid)) {
        global._mockUsers.push(newUserProfileForMock);
    }
  };

  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await createOrUpdateFirestoreUser(userCredential.user, data.role, data.location, data.preferredCurrency, data.fullName);
    } catch (error: any) {
      console.error("Signup error:", error.code, error.message);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email address is already in use.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "The password is too weak.";
      }
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleSubmitting(true);
    const isValid = await form.trigger(["role", "location", "preferredCurrency"]);
    if (!isValid) {
      toast({
        title: "Missing Information",
        description: "Please select your role, location, and currency before signing up with Google.",
        variant: "destructive",
      });
      setIsGoogleSubmitting(false);
      // Manually set errors if needed, though trigger() should show them
      if (!form.getValues("role")) form.setError("role", { type: "manual", message: "Role is required." });
      if (!form.getValues("location")) form.setError("location", { type: "manual", message: "Location is required." });
      if (!form.getValues("preferredCurrency")) form.setError("preferredCurrency", { type: "manual", message: "Currency is required." });
      return;
    }

    const { role, location, preferredCurrency } = form.getValues();
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await createOrUpdateFirestoreUser(user, role, location, preferredCurrency, user.displayName || undefined, user.photoURL || undefined);
    } catch (error: any) {
      console.error("Google signup error:", error);
      let errorMessage = "Could not sign up with Google. Please try again.";
       if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Google sign-up was cancelled.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email address. Try logging in with your original method or link your Google account in settings (feature coming soon).";
      }
      toast({
        title: "Google Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Create Account</CardTitle>
          <CardDescription>Join Solarify and start your solar journey.</CardDescription>
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
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="homeowner">Homeowner</SelectItem>
                        <SelectItem value="installer">Installer</SelectItem>
                        <SelectItem value="supplier">Supplier</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (City, Country)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, USA" {...field} />
                    </FormControl>
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
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting || isGoogleSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
              <Button variant="outline" className="w-full mt-2" disabled={isSubmitting || isGoogleSubmitting} type="button" onClick={handleGoogleSignup}>
                 {isGoogleSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Sign Up with Google"
                )}
              </Button>
            </CardContent>
          </form>
        </Form>
        <CardFooter className="text-center text-sm">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
