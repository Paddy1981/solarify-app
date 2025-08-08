"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import type { Order } from "@/lib/types/orders";
import type { MockUser } from "@/lib/mock-data/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Package, Inbox, Loader2, UserCircle as AlertUserCircle, LogIn, Eye, Calendar, User, Mail } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getCurrencyByCode, getDefaultCurrency } from '@/lib/currencies';
import Link from 'next/link';
import { format } from 'date-fns';

type OrderStatus = 'Pending' | 'Confirmed' | 'In Progress' | 'Shipped' | 'Delivered' | 'Cancelled';

const statusColors: Record<OrderStatus, string> = {
  'Pending': 'bg-yellow-500',
  'Confirmed': 'bg-blue-500',
  'In Progress': 'bg-purple-500',
  'Shipped': 'bg-orange-500',
  'Delivered': 'bg-green-500',
  'Cancelled': 'bg-red-500'
};

function OrdersSkeleton() {
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

export default function SupplierOrdersPage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [supplierProfile, setSupplierProfile] = useState<MockUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'supplier') {
          const profile = { id: userDocSnap.id, ...userDocSnap.data() } as MockUser;
          setSupplierProfile(profile);
          
          // Fetch orders containing this supplier's products
          await fetchSupplierOrders(profile.id);
        } else {
          setSupplierProfile(null);
          setOrders([]);
        }
      } else {
        setSupplierProfile(null);
        setOrders([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchSupplierOrders = async (supplierId: string) => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      // Filter orders that contain products from this supplier
      const supplierOrders = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .filter(order => 
          order.items.some(item => item.supplierId === supplierId)
        );
      
      setOrders(supplierOrders);
    } catch (error) {
      console.error("Error fetching supplier orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(orderId);
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast({
        title: "Order Updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
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

  if (isLoading) {
    return <OrdersSkeleton />;
  }

  if (!firebaseUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <LogIn className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl font-headline mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Please log in as a supplier to view orders.
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
          We couldn't find a supplier profile for your account or your role is not set to 'supplier'.
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="/supplier/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline tracking-tight text-accent flex items-center justify-center">
          <Package className="w-10 h-10 mr-3" /> Order Management
        </h1>
        <p className="mt-2 text-lg text-foreground/70">
          Manage and fulfill orders containing your products.
        </p>
        {supplierProfile && (
          <p className="text-sm text-muted-foreground mt-1">
            Viewing orders for: <strong>{supplierProfile.companyName || supplierProfile.fullName}</strong>
          </p>
        )}
      </div>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const supplierItems = order.items.filter(item => item.supplierId === supplierProfile?.id);
            const supplierTotal = supplierItems.reduce((sum, item) => sum + (item.priceValue * item.quantity), 0);
            
            return (
              <Card key={order.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-headline">
                        Order #{order.id.substring(0, 8)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {order.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {order.userEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.createdAt)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${statusColors[order.status as OrderStatus]} text-white`}>
                        {order.status}
                      </Badge>
                      <Select
                        value={order.status}
                        onValueChange={(value: OrderStatus) => updateOrderStatus(order.id, value)}
                        disabled={isUpdating === order.id}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Shipped">Shipped</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-accent mb-3">Your Products in This Order:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {supplierItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <Link 
                                    href={`/products/${item.productId}`} 
                                    className="font-medium hover:text-accent transition-colors"
                                  >
                                    {item.name}
                                  </Link>
                                  <p className="text-xs text-muted-foreground">{item.category}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                {getDisplayPrice(item.priceValue, item.currencyCode)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {getDisplayPrice(item.priceValue * item.quantity, item.currencyCode)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        <strong>Your Revenue from this Order:</strong>
                      </div>
                      <div className="text-lg font-bold text-accent">
                        {getDisplayPrice(supplierTotal, order.currencyCode)}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-sm">
                          <strong>Customer Notes:</strong> {order.notes}
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
            <CardTitle className="text-2xl font-headline">No Orders Yet</CardTitle>
            <CardDescription>
              You currently have no orders containing your products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              When customers order your products, they will appear here for fulfillment.
            </p>
            <Button asChild variant="outline">
              <Link href="/supplier/store">Manage Your Products</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}