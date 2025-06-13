
"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getProductById, type Product } from "@/lib/mock-data/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, CheckCircle, AlertTriangle, Tag, Layers, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useCart } from "@/context/cart-context";

export default function ProductDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const productId = params.productId as string;
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const { addItem } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (productId) {
      const foundProduct = getProductById(productId);
      setProduct(foundProduct);
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (!product || !mounted) return;
    addItem(product, 1);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (!mounted || product === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-4 text-lg">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-headline text-destructive">Product Not Found</h1>
        <p className="text-muted-foreground mt-2">
          Sorry, we couldn&apos;t find the product you&apos;re looking for.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/supplier/store">Back to Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative min-h-[300px] md:min-h-[400px] bg-muted/30 flex items-center justify-center p-4 md:p-8">
            <Image
              src={product.imageUrl}
              alt={product.name}
              data-ai-hint={product.imageHint}
              width={400}
              height={400}
              className="object-contain max-h-[300px] sm:max-h-[400px] rounded-lg shadow-md border"
            />
          </div>
          <div className="flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl lg:text-4xl font-headline text-accent">{product.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Layers className="w-5 h-5 text-muted-foreground" />
                <Badge variant="secondary">{product.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow pt-0 pb-4">
              <p className="text-3xl font-bold text-foreground">{product.price}</p>
              <Separator />
              <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
              <div className="flex items-center gap-2">
                {product.stock > 0 ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">In Stock ({product.stock} units)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>
              {product.supplierId && (
                <p className="text-xs text-muted-foreground">
                  Sold by: <span className="font-medium">{product.supplierId}</span> (Mock Supplier ID)
                </p>
              )}
            </CardContent>
            <CardFooter className="bg-muted/30 p-6 border-t">
              <Button
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || !mounted}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
       <div className="mt-6 text-center">
         <Button variant="outline" asChild>
            <Link href="/supplier/store">← Back to All Products</Link>
         </Button>
      </div>
    </div>
  );
}
