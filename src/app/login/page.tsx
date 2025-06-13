
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getMockUserByEmail } from "@/lib/mock-data/users";

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

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsSubmitting(true);
    console.log("Login attempt with email:", data.email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUserEmail = userCredential.user.email;

      console.log("Firebase Auth successful for email:", firebaseUserEmail || data.email);

      toast({
        title: "Login Successful!",
        description: "Welcome back to Solarify. Checking your role...",
      });

      // Attempt to get user profile from our mock data (now potentially from global._mockUsers)
      const userProfile = getMockUserByEmail(data.email);

      if (userProfile) {
        console.log("User profile found in mock data:", JSON.stringify(userProfile));
        if (userProfile.role === "installer") {
          console.log("User role is 'installer'. Redirecting to /installer/dashboard.");
          router.push("/installer/dashboard");
        } else if (userProfile.role === "homeowner") {
          console.log("User role is 'homeowner'. Redirecting to /homeowner/dashboard.");
          router.push("/homeowner/dashboard");
        } else if (userProfile.role === "supplier") {
          console.log("User role is 'supplier'. Redirecting to /supplier/dashboard.");
          router.push("/supplier/dashboard");
        } else {
          console.log(`User role is '${userProfile.role}'. Redirecting to homepage.`);
          router.push("/");
        }
      } else {
        // This case should be less common now if signup correctly populates global._mockUsers
        console.warn(`User profile NOT found in mock data for email: '${data.email}'. global._mockUsers count: ${global._mockUsers?.length}. Redirecting to homepage.`);
        toast({
          title: "Profile Role Undetermined",
          description: "Login was successful, but we couldn't determine your specific role from our records. Taking you to the homepage.",
          variant: "default",
          duration: 7000,
        });
        router.push("/");
      }

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
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <Button variant="outline" className="w-full mt-2" disabled={isSubmitting} type="button">
                Login with Google
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
