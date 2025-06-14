
"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, type Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { PromotionPost } from "@/lib/mock-data/promotions";
import { PromotionCard } from "@/components/promotions/promotion-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Megaphone, PlusCircle, Loader2, Inbox } from "lucide-react";
import Link from "next/link";
import { Skeleton } from '@/components/ui/skeleton';

function PromotionsPageSkeleton() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center py-8">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-10 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </CardHeader>
      </Card>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-lg flex flex-col">
            <Skeleton className="w-full h-48" />
            <CardHeader><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader>
            <CardContent className="flex-grow space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent>
            <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      setIsLoading(true);
      try {
        const promotionsRef = collection(db, "promotions");
        const q = query(promotionsRef, orderBy("postDate", "desc")); // Assuming postDate is a Timestamp or comparable
        const querySnapshot = await getDocs(q);
        const fetchedPromotions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromotionPost));
        setPromotions(fetchedPromotions);
      } catch (error) {
        console.error("Error fetching promotions:", error);
        // Optionally, show a toast message for the error
      } finally {
        setIsLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  if (isLoading) {
    return <PromotionsPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader className="text-center py-8">
          <div className="flex justify-center mb-4">
            <Megaphone className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-headline tracking-tight">Promotions Hub</CardTitle>
          <CardDescription className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Discover the latest offers, discounts, and announcements from Solarify installers and suppliers.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/promotions/add">
            <PlusCircle className="w-5 h-5 mr-2" /> Create New Promotion
          </Link>
        </Button>
      </div>

      {promotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {promotions.map((post) => (
            <PromotionCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <Card className="col-span-full text-center py-12 shadow-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Inbox className="w-16 h-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-headline">No Promotions Yet</CardTitle>
            <CardDescription>Check back soon for exciting offers and updates!</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
