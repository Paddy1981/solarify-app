
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StoreIcon, PackagePlus, ListOrdered, Settings, BarChartHorizontalBig, Factory, LogIn, UserCircle as AlertUserCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { MockUser } from '@/lib/mock-data/users';
import { Skeleton } from "@/components/ui/skeleton";

function SupplierDashboardSkeleton() {
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
              <Skeleton className="h-4 w-1/4 mt-1" />
            </div>
            <Skeleton className="h-9 w-36 mt-3 sm:mt-0 sm:ml-auto" />
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

export default function SupplierDashboardPage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [supplierProfile, setSupplierProfile] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'supplier') {
          const profile = { id: userDocSnap.id, ...userDocSnap.data() } as MockUser;
          setSupplierProfile(profile);
          try {
            const productsQuery = query(collection(db, "products"), where("supplierId", "==", profile.id));
            const productsSnapshot = await getDocs(productsQuery);
            setProductCount(productsSnapshot.size);
          } catch (error) {
            console.error("Error fetching product count:", error);
            setProductCount(0); 
          }
        } else {
          setSupplierProfile(null);
          setProductCount(0);
        }
      } else {
        setSupplierProfile(null);
        setProductCount(0);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <SupplierDashboardSkeleton />;
  }

  if (!firebaseUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <LogIn className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl font-headline mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Please log in as a supplier to view this dashboard.
        </p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (!supplierProfile) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <AlertUserCircle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-3xl font-headline mb-4 text-destructive">Supplier Profile Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
           We couldn't find a supplier profile for your account, or your role is not set to 'supplier'. Please ensure your account is set up correctly or contact support.
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
        <div className="relative h-32 bg-gradient-to-r from-primary/10 via-accent/5 to-background" data-ai-hint="solar warehouse">
           <div className="absolute inset-0 overflow-hidden opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="supplierDashPattern" patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="scale(0.5) rotate(-30)">
                  <rect width="50" height="50" fill="hsl(var(--primary))" />
                  <rect x="50" y="50" width="50" height="50" fill="hsl(var(--accent))" />
                   <rect x="25" y="25" width="50" height="50" fill="hsl(var(--muted))" opacity="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#supplierDashPattern)" />
            </svg>
          </div>
        </div>
        <CardContent className="relative pt-0 -mt-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-x-0 sm:space-x-4">
            {supplierProfile.avatarUrl ? (
                <Image
                  src={supplierProfile.avatarUrl}
                  alt={`${supplierProfile.companyName || supplierProfile.fullName} logo`}
                  data-ai-hint="company logo factory"
                  width={96}
                  height={96}
                  className="rounded-full border-4 border-background shadow-lg object-cover"
                />
              ) : (
                <div
                  data-ai-hint="company factory"
                  className="w-24 h-24 rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center"
                >
                  <Factory className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            <div className="mt-3 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-headline tracking-tight text-accent">{supplierProfile.companyName || supplierProfile.fullName}</h1>
              <p className="text-sm text-muted-foreground">{supplierProfile.location}</p>
              <p className="text-xs text-muted-foreground">Store Rating: {supplierProfile.storeRating || "N/A"}/5</p>
            </div>
             <Button variant="outline" size="sm" className="mt-3 sm:mt-0 sm:ml-auto" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" /> Edit Store Profile
                </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-headline tracking-tight text-accent">Supplier Dashboard</h2>
        <p className="mt-1 text-lg text-foreground/70">
          Manage your product catalog, orders, and store settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><StoreIcon className="w-6 h-6 mr-2 text-accent"/> My Storefront</CardTitle>
            <CardDescription>View and manage your product listings, inventory, and pricing.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">
              {productCount === null ? <Loader2 className="h-6 w-6 animate-spin" /> : productCount}{' '}
              <span className="text-sm font-normal text-muted-foreground">Products Listed</span>
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button asChild className="w-full sm:flex-1">
              <Link href="/supplier/store">Manage Products</Link>
            </Button>
             <Button variant="outline" asChild className="w-full sm:flex-1">
              <Link href="/supplier/store/add-product">
                <PackagePlus className="mr-2 h-4 w-4"/> Add Product
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><ListOrdered className="w-6 h-6 mr-2 text-accent"/> Orders & Fulfillment</CardTitle>
            <CardDescription>Track incoming orders and manage fulfillment. (Coming Soon)</CardDescription>
          </CardHeader>
           <CardContent>
            <p className="text-muted-foreground italic">Order management under development.</p>
          </CardContent>
          <CardFooter>
            <Button disabled variant="outline" className="w-full">View Orders</Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChartHorizontalBig className="w-6 h-6 mr-2 text-accent"/> Sales Analytics</CardTitle>
            <CardDescription>Review your sales performance and trends. (Coming Soon)</CardDescription>
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
