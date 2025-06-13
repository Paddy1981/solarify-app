
"use client";

import * as React from "react";
import { RFQForm } from "@/components/homeowner/rfq-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, LogIn, UserCircle } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { getMockUserByEmail, type MockUser } from "@/lib/mock-data/users";
import { Skeleton } from "@/components/ui/skeleton";

export default function RFQPage() {
  const [currentUserProfile, setCurrentUserProfile] = React.useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        const profile = getMockUserByEmail(user.email);
        if (profile && profile.role === "homeowner") {
          setCurrentUserProfile(profile);
        } else {
          setCurrentUserProfile(null); // Not a homeowner or profile not found
        }
      } else {
        setCurrentUserProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <FileText className="w-12 h-12 text-primary" />
            </div>
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-full mx-auto" />
            <Skeleton className="h-4 w-5/6 mx-auto mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
                <LogIn className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Access Denied</CardTitle>
            <CardDescription>
              You need to be logged in as a homeowner to generate an RFQ.
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
  
  if (!currentUserProfile) {
     return (
      <div className="max-w-xl mx-auto text-center py-12">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
                <UserCircle className="w-16 h-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-headline">Profile Not Found or Invalid Role</CardTitle>
            <CardDescription>
              We couldn&apos;t find a valid homeowner profile for your account. Please ensure your account is set up correctly or contact support.
            </CardDescription>
          </CardHeader>
           <CardContent>
            <Button variant="outline" asChild size="lg">
              <Link href="/homeowner/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FileText className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Generate Request for Quotation (RFQ)</CardTitle>
          <CardDescription>
            Create an RFQ based on your solar needs. Your details are pre-filled below.
            This RFQ can then be shared with local installers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RFQForm homeownerDetails={currentUserProfile} />
        </CardContent>
      </Card>
    </div>
  );
}
