
"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/mock-data/products";
import { getCurrencyByCode, getDefaultCurrency, type Currency } from "@/lib/currencies";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, CheckCircle, AlertTriangle, Tag, Layers, Package, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewSummaryCard } from "@/components/reviews/review-summary";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewForm } from "@/components/reviews/review-form";
import type { Review, ReviewSummary } from "@/lib/types/reviews";

function ProductDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative min-h-[300px] md:min-h-[400px] bg-muted/30 flex items-center justify-center p-4 md:p-8">
            <Skeleton className="w-full h-full max-w-[400px] max-h-[400px] rounded-lg" />
          </div>
          <div className="flex flex-col">
            <CardHeader className="pb-4">
              <Skeleton className="h-10 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4 flex-grow pt-0 pb-4">
              <Skeleton className="h-10 w-1/3 mb-3" />
              <Skeleton className="h-0.5 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-1/2 mt-2" />
            </CardContent>
            <CardFooter className="bg-muted/30 p-6 border-t">
              <Skeleton className="h-12 w-full" />
            </CardFooter>
          </div>
        </div>
      </Card>
      <div className="mt-6 text-center">
        <Skeleton className="h-10 w-40 mx-auto" />
      </div>
    </div>
  );
}


export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.productId as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (productId) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const productDocRef = doc(db, "products", productId);
          const docSnap = await getDoc(productDocRef);
          if (docSnap.exists()) {
            setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
          } else {
            setProduct(null);
            toast({ title: "Product not found", variant: "destructive" });
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          toast({ title: "Error fetching product", description: "Please try again later.", variant: "destructive" });
          setProduct(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
      fetchReviews();
    } else {
      setIsLoading(false);
      setProduct(null);
    }
  }, [productId, toast]);

  const fetchReviews = async () => {
    if (!productId) return;
    
    setReviewsLoading(true);
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("targetId", "==", productId),
        where("targetType", "==", "product"),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      
      setReviews(reviewsData);
      
      // Calculate review summary
      if (reviewsData.length > 0) {
        const totalReviews = reviewsData.length;
        const averageRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
        
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviewsData.forEach(review => {
          ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
        });
        
        setReviewSummary({
          averageRating,
          totalReviews,
          ratingDistribution
        });
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || !mounted) return;
    addItem(product, 1);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const getDisplayPrice = (priceValue?: number, currencyCode?: string): string => {
    if (priceValue === undefined || currencyCode === undefined) return "Price unavailable";
    const currency = getCurrencyByCode(currencyCode) || getDefaultCurrency();
    return `${currency.symbol}${priceValue.toFixed(2)}`;
  };

  if (!mounted || isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-3xl font-headline text-destructive mb-4">Product Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Sorry, we couldn&apos;t find the product you&apos;re looking for. It may have been removed or the link is incorrect.
        </p>
        <Button asChild variant="outline" size="lg" onClick={() => router.push('/supplier/store')}>
          <Link href="/supplier/store">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Products
          </Link>
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
              src={product.imageUrl || 'https://placehold.co/400x400.png'}
              alt={product.name}
              data-ai-hint={product.imageHint || "product item"}
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
               {product.supplierName && (
                <p className="text-sm text-muted-foreground mt-1">Sold by: <span className="font-medium text-foreground">{product.supplierName}</span></p>
              )}
            </CardHeader>
            <CardContent className="space-y-4 flex-grow pt-0 pb-4">
              <p className="text-3xl font-bold text-foreground">
                {getDisplayPrice(product.priceValue, product.currencyCode)}
              </p>
              <Separator />
              <p className="text-muted-foreground text-sm leading-relaxed">{product.description || "No description available."}</p>
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

      {/* Reviews Section */}
      <div className="mt-8 space-y-6">
        {/* Review Form */}
        <ReviewForm 
          targetId={productId}
          targetType="product"
          onReviewSubmitted={(newReview) => {
            setReviews(prev => [newReview, ...prev]);
            fetchReviews(); // Refresh to get updated summary
          }}
        />

        <div className="grid md:grid-cols-3 gap-6">
          {/* Review Summary */}
          <div className="md:col-span-1">
            {reviewSummary ? (
              <ReviewSummaryCard summary={reviewSummary} />
            ) : (
              <Card className="shadow-lg">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Be the first to review this product
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Reviews List */}
          <div className="md:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-headline">
                  Customer Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading reviews...</span>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard 
                        key={review.id} 
                        review={review}
                        onHelpfulClick={(reviewId) => {
                          toast({ title: "Thank you for your feedback!" });
                        }}
                        onReportClick={(reviewId) => {
                          toast({ title: "Review reported", description: "Thank you for helping us maintain quality." });
                        }}
                      />
                    ))}
                    {reviews.length >= 10 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" size="sm">
                          Load More Reviews
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No reviews yet for this product</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Purchase this product to leave a review
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

       <div className="mt-6 text-center">
         <Button variant="outline" asChild>
            <Link href="/supplier/store"><ArrowLeft className="mr-2 h-4 w-4" /> Back to All Products</Link>
         </Button>
      </div>
    </div>
  );
}
