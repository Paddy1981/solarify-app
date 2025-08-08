"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import type { MockUser } from "@/lib/mock-data/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FileText, Inbox, Loader2, UserCircle as AlertUserCircle, LogIn, Calendar, User, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrencyByCode, getDefaultCurrency } from '@/lib/currencies';
import Link from 'next/link';
import { format } from 'date-fns';

interface Quote {
  id: string;
  rfqId: string;
  installerId: string;
  installerName: string;
  installerCompany?: string;
  installerEmail: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currencyCode: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  validUntil: any;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

const statusColors = {
  'Pending': 'bg-yellow-500',
  'Accepted': 'bg-green-500',
  'Rejected': 'bg-red-500',
  'Expired': 'bg-gray-500'
};

function QuotesSkeleton() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Skeleton className="h-10 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-2/3 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function HomeownerQuotesPage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [homeownerProfile, setHomeownerProfile] = useState<MockUser | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'homeowner') {
          const profile = { id: userDocSnap.id, ...userDocSnap.data() } as MockUser;
          setHomeownerProfile(profile);
          
          // Fetch quotes for this homeowner's RFQs
          await fetchHomeownerQuotes(profile.id);
        } else {
          setHomeownerProfile(null);
          setQuotes([]);
        }
      } else {
        setHomeownerProfile(null);
        setQuotes([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchHomeownerQuotes = async (homeownerId: string) => {
    try {
      // First, get all RFQs created by this homeowner
      const rfqsQuery = query(
        collection(db, "rfqs"),
        where("homeownerId", "==", homeownerId)
      );
      const rfqsSnapshot = await getDocs(rfqsQuery);
      const rfqIds = rfqsSnapshot.docs.map(doc => doc.id);

      if (rfqIds.length === 0) {
        setQuotes([]);
        return;
      }

      // Then, get all quotes for those RFQs
      const quotesQuery = query(
        collection(db, "quotes"),
        where("rfqId", "in", rfqIds),
        orderBy("createdAt", "desc")
      );
      const quotesSnapshot = await getDocs(quotesQuery);
      
      const homeownerQuotes = quotesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Quote));
      
      setQuotes(homeownerQuotes);
    } catch (error) {
      console.error("Error fetching homeowner quotes:", error);
      setQuotes([]);
    }
  };

  const getDisplayPrice = (amount: number, currencyCode: string): string => {
    const currency = getCurrencyByCode(currencyCode) || getDefaultCurrency();
    return `${currency.symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM dd, yyyy');
  };

  const isExpired = (validUntil: any): boolean => {
    if (!validUntil) return false;
    const expiryDate = validUntil.toDate ? validUntil.toDate() : new Date(validUntil);
    return new Date() > expiryDate;
  };

  const getStatusIcon = (status: Quote['status']) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4" />;
      case 'Expired':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return <QuotesSkeleton />;
  }

  if (!firebaseUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <LogIn className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl font-headline mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Please log in as a homeowner to view quotes.
        </p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (!homeownerProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <AlertUserCircle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-3xl font-headline mb-4 text-destructive">Homeowner Profile Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          We couldn't find a homeowner profile for your account or your role is not set to 'homeowner'.
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="/homeowner/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline tracking-tight text-accent flex items-center justify-center">
          <FileText className="w-10 h-10 mr-3" /> My Quotes
        </h1>
        <p className="mt-2 text-lg text-foreground/70">
          Review quotes received from solar installers for your RFQs.
        </p>
        {homeownerProfile && (
          <p className="text-sm text-muted-foreground mt-1">
            Viewing quotes for: <strong>{homeownerProfile.fullName}</strong>
          </p>
        )}
      </div>

      {quotes.length > 0 ? (
        <div className="space-y-6">
          {quotes.map((quote) => {
            const expired = isExpired(quote.validUntil);
            const displayStatus = expired && quote.status === 'Pending' ? 'Expired' : quote.status;
            
            return (
              <Card key={quote.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-headline">
                        Quote from {quote.installerCompany || quote.installerName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {quote.installerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Received: {formatDate(quote.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Valid until: {formatDate(quote.validUntil)}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={`${statusColors[displayStatus as keyof typeof statusColors]} text-white flex items-center gap-1`}>
                      {getStatusIcon(displayStatus)}
                      {displayStatus}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-accent mb-3">Quote Details:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quote.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                {getDisplayPrice(item.unitPrice, quote.currencyCode)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {getDisplayPrice(item.total, quote.currencyCode)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{getDisplayPrice(quote.subtotal, quote.currencyCode)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{getDisplayPrice(quote.tax, quote.currencyCode)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-accent">{getDisplayPrice(quote.total, quote.currencyCode)}</span>
                      </div>
                    </div>

                    {quote.notes && (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-sm">
                          <strong>Installer Notes:</strong> {quote.notes}
                        </p>
                      </div>
                    )}

                    {displayStatus === 'Pending' && !expired && (
                      <div className="flex gap-2 pt-4">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Quote
                        </Button>
                        <Button variant="outline" className="flex-1 border-red-500 text-red-600 hover:bg-red-50">
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline Quote
                        </Button>
                      </div>
                    )}

                    {expired && quote.status === 'Pending' && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
                        <p className="text-sm text-red-600 font-medium">
                          This quote has expired. Please contact the installer to request a new quote.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12 shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Inbox className="w-16 h-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-headline">No Quotes Yet</CardTitle>
            <CardDescription>
              You haven't received any quotes from installers yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Once you submit an RFQ and installers respond with quotes, they will appear here.
            </p>
            <Button asChild variant="outline">
              <Link href="/homeowner/rfq">Create Your First RFQ</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}