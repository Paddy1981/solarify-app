
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, ListChecks, Settings, BarChartHorizontalBig, Building2, LogIn, UserCircle as AlertUserCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { MockUser, UserRole } from '@/lib/mock-data/users';
import { Skeleton } from "@/components/ui/skeleton";

function InstallerDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl overflow-hidden">
        <Skeleton className="h-32 w-full" />
        <CardContent className="relative pt-0 -mt-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-x-0 sm:space-x-4">
            <Skeleton className="w-24 h-24 rounded-full border-4 border-background shadow-lg" />
            <div className="mt-3 sm:mt-0 text-center sm:text-left flex-grow">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-5 w-1/2 mt-1" />
            </div>
            <Skeleton className="h-9 w-28 mt-3 sm:mt-0 sm:ml-auto" />
          </div>
        </CardContent>
      </Card>
      <div className="text-center mb-8">
        <Skeleton className="h-9 w-1/2 mx-auto" />
        <Skeleton className="h-6 w-3/4 mx-auto mt-1" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-1" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
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


export default function InstallerDashboardPage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [installerProfile, setInstallerProfile] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRfqCount, setActiveRfqCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'installer') {
          const profile = { id: userDocSnap.id, ...userDocSnap.data() } as MockUser;
          setInstallerProfile(profile);

          // Fetch active RFQ count
          try {
            const rfqsQuery = query(
              collection(db, "rfqs"),
              where("selectedInstallerIds", "array-contains", profile.id),
              where("status", "==", "Pending")
            );
            const rfqsSnapshot = await getDocs(rfqsQuery);
            setActiveRfqCount(rfqsSnapshot.size);
          } catch (error) {
            console.error("Error fetching active RFQ count:", error);
            setActiveRfqCount(0); // Set to 0 on error
          }

        } else {
          setInstallerProfile(null); // Not an installer or profile not found
          setActiveRfqCount(0);
        }
      } else {
        setInstallerProfile(null);
        setActiveRfqCount(0);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <InstallerDashboardSkeleton />;
  }

  if (!firebaseUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <LogIn className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl font-headline mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Please log in as an installer to view this dashboard.
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
          We couldn't find an installer profile for your account, or your role is not set to 'installer'. Please ensure your account is set up correctly or contact support.
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-primary/10 via-accent/5 to-background" data-ai-hint="abstract energy">
           <div className="absolute inset-0 overflow-hidden opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="installerDashPattern" patternUnits="userSpaceOnUse" width="80" height="80" patternTransform="scale(0.6) rotate(30)">
                  <path d="M0 40 Q 20 10, 40 40 T 80 40" stroke="hsl(var(--primary))" fill="transparent" strokeWidth="3"/>
                  <path d="M0 50 Q 20 20, 40 50 T 80 50" stroke="hsl(var(--accent))" fill="transparent" strokeWidth="1.5" strokeDasharray="4,4"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#installerDashPattern)" />
            </svg>
          </div>
        </div>
        <CardContent className="relative pt-0 -mt-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-x-0 sm:space-x-4">
            {installerProfile.avatarUrl && installerProfile.avatarUrl.startsWith('https://placehold.co') ? (
              <div 
                data-ai-hint="company logo"
                className="w-24 h-24 rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center"
              >
                <Building2 className="w-12 h-12 text-muted-foreground" />
              </div>
            ) : (
              <Image
                src={installerProfile.avatarUrl || 'https://placehold.co/96x96.png'}
                alt={`${installerProfile.companyName || installerProfile.fullName} logo`}
                data-ai-hint="company logo"
                width={96}
                height={96}
                className="rounded-full border-4 border-background shadow-lg"
              />
            )}
            <div className="mt-3 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-headline tracking-tight text-accent">{installerProfile.companyName || installerProfile.fullName}</h1>
              <p className="text-sm text-muted-foreground">{installerProfile.location}</p>
            </div>
             <Button variant="outline" size="sm" className="mt-3 sm:mt-0 sm:ml-auto" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" /> Edit Profile
                </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-headline tracking-tight text-accent">Installer Dashboard</h2>
        <p className="mt-1 text-lg text-foreground/70">
          Manage your projects, quotes, and profile.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><ListChecks className="w-6 h-6 mr-2 text-accent"/> RFQs</CardTitle>
            <CardDescription>View and respond to incoming Requests for Quotation from homeowners.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">
              {activeRfqCount === null ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                activeRfqCount
              )}
              <span className="text-sm font-normal text-muted-foreground"> Active RFQs</span>
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/installer/rfqs">View All RFQs</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Briefcase className="w-6 h-6 mr-2 text-accent"/> Project Portfolio</CardTitle>
            <CardDescription>Showcase your completed installations and manage your project listings.</CardDescription>
          </CardHeader>
           <CardContent>
            <p className="text-2xl font-bold text-accent">{installerProfile.projectCount || 0} <span className="text-sm font-normal text-muted-foreground">Projects Listed</span></p>
             <p className="text-xs text-muted-foreground mt-1">(Note: Project count is currently mock and not live from Firestore)</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/installer/portfolio">Manage Portfolio</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChartHorizontalBig className="w-6 h-6 mr-2 text-accent"/> Performance &amp; Analytics</CardTitle>
            <CardDescription>Track your quote conversion rates and project completions (Coming Soon).</CardDescription>
          </CardHeader>
           <CardContent>
             <p className="text-muted-foreground italic">Analytics dashboard under development.</p>
          </CardContent>
          <CardFooter>
            <Button disabled variant="outline" className="w-full">View Analytics</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
