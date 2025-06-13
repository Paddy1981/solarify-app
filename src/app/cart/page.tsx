
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Trash2, ShoppingCart, CreditCard, Info, MinusCircle, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CartPage() {
  const { items, removeItem, updateItemQuantity, getCartTotal, clearCart, getItemCount } = useCart();
  const { toast } = useToast();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      updateItemQuantity(productId, 0);
    } else {
      updateItemQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    toast({
      title: "Checkout Initiated (Simulated)",
      description: "This is where the payment and order processing would begin.",
    });
  };

  const cartTotal = getCartTotal();
  const estimatedTax = cartTotal * 0.08; // Simulate 8% tax
  const orderTotal = cartTotal + estimatedTax;
  const currentItemCount = getItemCount();

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
                    <TableCell className="text-right">${item.priceValue.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${(item.priceValue * item.quantity).toFixed(2)}</TableCell>
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
                <Button variant="outline" onClick={clearCart} className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Entire Cart
                </Button>
                <Alert variant="default" className="bg-muted/30">
                  <Info className="h-5 w-5 text-accent" />
                  <AlertTitle className="font-medium">Please Note</AlertTitle>
                  <AlertDescription>
                    Shipping costs and final taxes are estimates and will be calculated at checkout. All sales are simulated.
                  </AlertDescription>
                </Alert>
            </div>

            <div className="space-y-3 p-4 bg-muted/30 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold font-headline text-accent">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span>Subtotal ({currentItemCount} item{currentItemCount === 1 ? '' : 's'}):</span>
                <span className="font-medium">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Tax (8%):</span>
                <span className="font-medium">${estimatedTax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold text-accent pt-1">
                <span>Order Total:</span>
                <span>${orderTotal.toFixed(2)}</span>
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
          <Button size="lg" className="w-full sm:w-auto mt-4 sm:mt-0 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleCheckout}>
            <CreditCard className="mr-2 h-5 w-5" /> Proceed to Checkout (Simulated)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
