
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, type UserCredential } from "firebase/auth";
import { auth, db, serverTimestamp } from "@/lib/firebase"; 
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"; 
import { getDefaultCurrency } from "@/lib/currencies";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSuccessfulLogin = async (user: UserCredential["user"], isNewGoogleUser: boolean = false) => {
    const userDocRef = doc(db, "users", user.uid);
    let userRole;
    let userFullName = user.displayName || "User";

    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        userRole = userDocSnap.data()?.role;
        userFullName = userDocSnap.data()?.fullName || userFullName; 
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp()
        });
      } else if (isNewGoogleUser) {
        // This case is specific to first-time Google login for a user not in our DB
        const defaultRole = "homeowner";
        const defaultLocation = ""; 
        const defaultPreferredCurrency = getDefaultCurrency().value;
        const defaultAvatar = user.photoURL || `https://placehold.co/100x100.png?text=${userFullName[0]?.toUpperCase() || 'U'}`;

        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          fullName: userFullName,
          role: defaultRole,
          location: defaultLocation,
          preferredCurrency: defaultPreferredCurrency,
          avatarUrl: defaultAvatar,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isActive: true,
        });
        userRole = defaultRole;
        toast({
          title: "Welcome!",
          description: "Your account has been created. Please review your settings.",
        });
      } else {
         toast({
          title: "Profile Error",
          description: "User profile data not found. Please contact support.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      if (userRole === "installer") {
        router.push("/installer/dashboard");
      } else if (userRole === "homeowner") {
        router.push("/homeowner/dashboard");
      } else if (userRole === "supplier") {
        router.push("/supplier/dashboard");
      } else {
        toast({
          title: "Role Undetermined",
          description: "Your role is not set. Redirecting to homepage.",
          variant: "default",
        });
        router.push("/");
      }
    } catch (dbError) {
      console.error("Firestore error during login:", dbError);
      toast({
        title: "Login Error",
        description: "Could not retrieve your profile information. Please try again.",
        variant: "destructive",
      });
    }
  };


  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Login Successful!",
        description: "Welcome back! Checking your role...",
      });
      await handleSuccessfulLogin(userCredential.user);
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please try again.";
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore to determine if it's a "new to our app" Google user
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const isNewAppUser = !userDocSnap.exists();

      toast({
        title: isNewAppUser ? "Account Creation via Google" : "Login Successful!",
        description: "Processing your Google login...",
      });
      await handleSuccessfulLogin(user, isNewAppUser);

    } catch (error: any) {
      console.error("Google login error:", error);
      let errorMessage = "Could not sign in with Google. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Google sign-in was cancelled.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email address. Try logging in with your original method or link your Google account in settings (feature coming soon).";
      }
      toast({
        title: "Google Login Failed",
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
          <CardTitle className="text-3xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>Log in to your Solarify account.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
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
              <div className="text-right">
                <Button variant="link" type="button" className="text-sm h-auto p-0 text-accent" onClick={() => toast({title: "Forgot Password", description: "Forgot password functionality is not implemented yet."})}>
                  Forgot Password?
                </Button>
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting || isGoogleSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <Button variant="outline" className="w-full mt-2" disabled={isSubmitting || isGoogleSubmitting} type="button" onClick={handleGoogleLogin}>
                 {isGoogleSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Login with Google"
                )}
              </Button>
            </CardContent>
          </form>
        </Form>
        <CardFooter className="text-center text-sm">
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
