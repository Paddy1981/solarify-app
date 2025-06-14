
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, type UserCredential, sendPasswordResetEmail } from "firebase/auth";
import { auth, db, serverTimestamp } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getDefaultCurrency } from "@/lib/currencies";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

const passwordResetSchema = z.object({
  resetEmail: z.string().email({ message: "Please enter a valid email address." }),
});
type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);


  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const passwordResetForm = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      resetEmail: "",
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


  const onLoginSubmit: SubmitHandler<LoginFormData> = async (data) => {
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
        errorMessage = "An account already exists with this email address. Try logging in with your original method.";
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

  const onPasswordResetSubmit: SubmitHandler<PasswordResetFormData> = async (data) => {
    setIsSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(auth, data.resetEmail);
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).",
      });
      setIsPasswordResetDialogOpen(false);
      passwordResetForm.reset();
    } catch (error: any) {
      console.error("Password reset error:", error);
      let errorMessage = "Failed to send password reset email. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        // Don't explicitly say "user not found" for security, but you can tailor if needed
        errorMessage = "If an account exists for this email, a password reset link has been sent.";
         toast({
            title: "Password Reset Email Sent",
            description: errorMessage,
        });
         setIsPasswordResetDialogOpen(false);
         passwordResetForm.reset();

      } else {
         toast({
            title: "Password Reset Failed",
            description: "Could not send reset email. Please check the email address and try again.",
            variant: "destructive",
        });
      }
    } finally {
      setIsSendingResetEmail(false);
    }
  };


  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>Log in to your Solarify account.</CardDescription>
        </CardHeader>
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={loginForm.control}
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
                control={loginForm.control}
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
                <Dialog open={isPasswordResetDialogOpen} onOpenChange={setIsPasswordResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" type="button" className="text-sm h-auto p-0 text-accent">
                      Forgot Password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your email address below and we&apos;ll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...passwordResetForm}>
                      <form onSubmit={passwordResetForm.handleSubmit(onPasswordResetSubmit)} className="space-y-4">
                        <FormField
                          control={passwordResetForm.control}
                          name="resetEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isSendingResetEmail}>Cancel</Button>
                          </DialogClose>
                          <Button type="submit" disabled={isSendingResetEmail}>
                            {isSendingResetEmail ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                            ) : (
                              <><Mail className="mr-2 h-4 w-4" /> Send Reset Email</>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
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
