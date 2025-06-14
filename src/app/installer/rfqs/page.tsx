
"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, type Timestamp } from "firebase/firestore";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import type { RFQ } from "@/lib/mock-data/rfqs";
import type { MockUser } from "@/lib/mock-data/users";
import { RfqCard } from "@/components/installer/rfq-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Inbox, Loader2, UserCircle as AlertUserCircle, LogIn } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function InstallerRFQsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Skeleton className="h-10 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-1/3 mx-auto mt-1" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-2/3 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function InstallerRFQsPage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [installerProfile, setInstallerProfile] = useState<MockUser | null>(null);
  const [relevantRFQs, setRelevantRFQs] = useState<RFQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'installer') {
          const profile = { id: userDocSnap.id, ...userDocSnap.data() } as MockUser;
          setInstallerProfile(profile);
          
          // Fetch RFQs for this installer
          try {
            const rfqsRef = collection(db, "rfqs");
            const q = query(rfqsRef, 
                            where("selectedInstallerIds", "array-contains", profile.id),
                            where("status", "==", "Pending"), // Only show pending RFQs for action
                            orderBy("dateCreated", "desc"));
            const querySnapshot = await getDocs(q);
            const fetchedRFQs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RFQ));
            setRelevantRFQs(fetchedRFQs);
          } catch (error) {
            console.error("Error fetching RFQs for installer:", error);
            // Handle error (e.g., show toast)
          }
        } else {
          setInstallerProfile(null); // Not an installer or profile not found
          setRelevantRFQs([]);
        }
      } else {
        setInstallerProfile(null);
        setRelevantRFQs([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <InstallerRFQsSkeleton />;
  }

  if (!firebaseUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <LogIn className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl font-headline mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Please log in as an installer to view RFQs.
        </p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (!installerProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <AlertUserCircle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-3xl font-headline mb-4 text-destructive">Installer Profile Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          We couldn't find an installer profile for your account or your role is not set to 'installer'.
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="/installer/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline tracking-tight text-accent flex items-center justify-center">
          <ListChecks className="w-10 h-10 mr-3" /> Incoming Requests for Quotation
        </h1>
        <p className="mt-2 text-lg text-foreground/70">
          Review RFQs from homeowners and generate your quotes.
        </p>
        {installerProfile && (
          <p className="text-sm text-muted-foreground mt-1">
            Viewing RFQs for: <strong>{installerProfile.companyName || installerProfile.fullName}</strong>
          </p>
        )}
      </div>

      {relevantRFQs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {relevantRFQs.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq} />
          ))}
        </div>
      ) : (
        <Card className="col-span-full text-center py-12 shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Inbox className="w-16 h-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-headline">No Pending RFQs</CardTitle>
            <CardDescription>You currently have no new requests for quotation assigned to you, or all have been actioned.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              When homeowners select you for an RFQ, it will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
