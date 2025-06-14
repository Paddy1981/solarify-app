
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart, type CartItem } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Trash2, ShoppingCart, CreditCard, Info, MinusCircle, PlusCircle, Loader2, LogIn, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCurrencyByCode, getDefaultCurrency, type Currency } from '@/lib/currencies';
import { auth, db } from '@/lib/firebase'; // Import auth and db
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'; // Firestore functions
import type { Order, OrderItem } from '@/lib/types/orders'; // Import Order types
import type { User as FirebaseUser } from 'firebase/auth';
import type { MockUser } from '@/lib/mock-data/users';

export default function CartPage() {
  const { items, removeItem, updateItemQuantity, getCartTotal, clearCart, getItemCount } = useCart();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<MockUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUserProfile(userDocSnap.data() as MockUser);
        }
      } else {
        setCurrentUserProfile(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      updateItemQuantity(productId, 0); 
    } else {
      updateItemQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to proceed with checkout.",
        variant: "destructive",
      });
      return;
    }
    if (items.length === 0) {
        toast({
            title: "Empty Cart",
            description: "Your cart is empty. Please add items before checking out.",
            variant: "destructive",
        });
        return;
    }

    setIsProcessingCheckout(true);

    const orderItems: OrderItem[] = items.map(item => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      priceValue: item.priceValue,
      currencyCode: item.currencyCode,
      imageUrl: item.imageUrl,
      imageHint: item.imageHint,
      category: item.category,
      supplierId: item.supplierId,
    }));
    
    const subtotal = getCartTotal();
    const tax = subtotal * 0.08; // Simulated tax
    const total = subtotal + tax;
    // Assume the first item's currency is the order's currency for simplicity
    const orderCurrencyCode = items.length > 0 ? items[0].currencyCode : getDefaultCurrency().value;

    const newOrder: Omit<Order, 'id'> = {
      userId: currentUser.uid,
      userName: currentUserProfile?.fullName || currentUser.displayName || "N/A",
      userEmail: currentUserProfile?.email || currentUser.email || "N/A",
      items: orderItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(tax.toFixed(2)),
      totalAmount: parseFloat(total.toFixed(2)),
      currencyCode: orderCurrencyCode,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notes: orderNotes || undefined,
    };

    try {
      const docRef = await addDoc(collection(db, "orders"), newOrder);
      toast({
        title: "Order Request Placed!",
        description: `Your order request #${docRef.id.substring(0,8)} has been submitted. We will contact you shortly.`,
      });
      clearCart();
      setOrderNotes(""); 
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Checkout Failed",
        description: "There was an issue placing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const getDisplayPrice = (item: CartItem): string => {
    const currency = getCurrencyByCode(item.currencyCode) || getDefaultCurrency();
    return `${currency.symbol}${item.priceValue.toFixed(2)}`;
  };

  const getLineTotalDisplay = (item: CartItem): string => {
    const currency = getCurrencyByCode(item.currencyCode) || getDefaultCurrency();
    return `${currency.symbol}${(item.priceValue * item.quantity).toFixed(2)}`;
  };

  const cartTotal = getCartTotal();
  const estimatedTax = cartTotal * 0.08; 
  const orderTotal = cartTotal + estimatedTax;
  const currentItemCount = getItemCount();
  const summaryCurrencySymbol = items.length > 0 ? (getCurrencyByCode(items[0].currencyCode) || getDefaultCurrency()).symbol : getDefaultCurrency().symbol;


  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <ShoppingCart className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-headline mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Looks like you haven&apos;t added any products yet. Start exploring our catalog!
        </p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/supplier/store">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <ShoppingCart className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Your Shopping Cart</CardTitle>
          <CardDescription>Review your items and proceed to checkout.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell w-[80px] lg:w-[100px] pr-0">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center w-[150px] lg:w-[180px]">Quantity</TableHead>
                  <TableHead className="text-right w-[100px]">Price</TableHead>
                  <TableHead className="text-right w-[120px]">Total</TableHead>
                  <TableHead className="text-center w-[80px]">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="hidden md:table-cell pr-0">
                      <Image
                        src={item.imageUrl || 'https://placehold.co/64x64.png'}
                        alt={item.name}
                        data-ai-hint={item.imageHint || "product"}
                        width={64}
                        height={64}
                        className="rounded-md object-cover border"
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/products/${item.id}`} className="font-medium hover:text-accent transition-colors">
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleQuantityChange(item.id, isNaN(val) ? 1 : val );
                          }}
                          className="w-12 sm:w-16 h-8 text-center px-1"
                          min="1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{getDisplayPrice(item)}</TableCell>
                    <TableCell className="text-right font-medium">{getLineTotalDisplay(item)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
                <Textarea
                  placeholder="Add any notes for your order request here..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  className="shadow-sm"
                />
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={clearCart} className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Clear Entire Cart
                    </Button>
                </div>
                <Alert variant="default" className="bg-muted/30">
                  <Info className="h-5 w-5 text-accent" />
                  <AlertTitle className="font-medium">Please Note</AlertTitle>
                  <AlertDescription>
                    This is an order request. No payment will be processed. A representative may contact you to finalize details.
                    Shipping costs and final taxes are estimates. Cart total sums numerical price values and assumes a single currency for the summary.
                  </AlertDescription>
                </Alert>
            </div>

            <div className="space-y-3 p-4 bg-muted/30 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold font-headline text-accent">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span>Subtotal ({currentItemCount} item{currentItemCount === 1 ? '' : 's'}):</span>
                <span className="font-medium">{summaryCurrencySymbol}{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Tax (8%):</span>
                <span className="font-medium">{summaryCurrencySymbol}{estimatedTax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold text-accent pt-1">
                <span>Order Total:</span>
                <span>{summaryCurrencySymbol}{orderTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center p-6 border-t mt-6">
          <Button variant="outline" asChild size="lg">
            <Link href="/supplier/store">
              <ShoppingCart className="mr-2 h-5 w-5" /> Continue Shopping
            </Link>
          </Button>
          <Button 
            size="lg" 
            className="w-full sm:w-auto mt-4 sm:mt-0 bg-accent text-accent-foreground hover:bg-accent/90" 
            onClick={handleCheckout}
            disabled={isProcessingCheckout || isLoadingAuth || !currentUser}
          >
            {isProcessingCheckout ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
            ) : !currentUser && !isLoadingAuth ? (
              <><LogIn className="mr-2 h-5 w-5" /> Login to Checkout</>
            ) : (
              <><FileText className="mr-2 h-5 w-5" /> Submit Order Request</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
