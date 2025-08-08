
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/mock-data/products";
import { getCurrencyByCode, getDefaultCurrency, type Currency } from "@/lib/currencies";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StoreIcon, Package, Search, ArrowRight, Loader2, Filter, X } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function SupplierStorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const productsCollectionRef = collection(db, "products");
        const q = query(productsCollectionRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedProducts: Product[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products from Firestore:", error);
        // Optionally, set an error state and display a message to the user
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Get unique categories from products
  const categories = [...new Set(products.map(product => product.category))];

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter(product => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;

      // Price range filter
      const matchesPriceRange = (() => {
        if (priceRange === "all") return true;
        const price = product.priceValue;
        switch (priceRange) {
          case "0-100": return price <= 100;
          case "100-500": return price > 100 && price <= 500;
          case "500-1000": return price > 500 && price <= 1000;
          case "1000-5000": return price > 1000 && price <= 5000;
          case "5000+": return price > 5000;
          default: return true;
        }
      })();

      // Stock filter
      const matchesStock = (() => {
        if (stockFilter === "all") return true;
        if (stockFilter === "instock") return product.stock > 0;
        if (stockFilter === "outofstock") return product.stock === 0;
        if (stockFilter === "lowstock") return product.stock > 0 && product.stock <= 10;
        return true;
      })();

      return matchesSearch && matchesCategory && matchesPriceRange && matchesStock;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low": return a.priceValue - b.priceValue;
        case "price-high": return b.priceValue - a.priceValue;
        case "name": return a.name.localeCompare(b.name);
        case "newest": 
        default:
          // Assume createdAt exists, fallback to alphabetical
          return b.createdAt && a.createdAt ? 
            b.createdAt.toMillis() - a.createdAt.toMillis() : 
            a.name.localeCompare(b.name);
      }
    });

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setPriceRange("all");
    setStockFilter("all");
    setSortBy("newest");
  };

  const hasActiveFilters = searchTerm !== "" || categoryFilter !== "all" || 
                          priceRange !== "all" || stockFilter !== "all" || sortBy !== "newest";

  const getDisplayPrice = (priceValue: number, currencyCode: string): string => {
    const currency = getCurrencyByCode(currencyCode) || getDefaultCurrency();
    return `${currency.symbol}${priceValue.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-3/4" />
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-1/3 mt-4" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden shadow-md flex flex-col">
                <Skeleton className="w-full h-48" />
                <CardHeader className="pb-2 pt-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent className="flex-grow py-2">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-4 w-1/4 mt-1" />
                </CardContent>
                <CardFooter className="pt-2">
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
            <h1 className="text-4xl font-headline tracking-tight text-accent flex items-center">
                <StoreIcon className="w-10 h-10 mr-3" /> Solarify Product Marketplace
            </h1>
            <p className="mt-1 text-lg text-foreground/70">Browse and discover solar products from our trusted suppliers.</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline">Available Products</CardTitle>
                <CardDescription>Explore our catalog of solar panels, inverters, batteries, and more.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && <Badge className="ml-2" variant="secondary">Active</Badge>}
              </Button>
            </div>
            
            <div className="space-y-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, category, or description..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-md">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Price Range</label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Prices" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="0-100">$0 - $100</SelectItem>
                        <SelectItem value="100-500">$100 - $500</SelectItem>
                        <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                        <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                        <SelectItem value="5000+">$5,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Stock Status</label>
                    <Select value={stockFilter} onValueChange={setStockFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Stock" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stock</SelectItem>
                        <SelectItem value="instock">In Stock</SelectItem>
                        <SelectItem value="lowstock">Low Stock (≤10)</SelectItem>
                        <SelectItem value="outofstock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="name">Name A-Z</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {hasActiveFilters && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredAndSortedProducts.length} of {products.length} products
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                  <div className="relative w-full h-48 bg-muted/30">
                    <Image
                      src={product.imageUrl || 'https://placehold.co/300x200.png'} // Fallback placeholder
                      alt={product.name}
                      data-ai-hint={product.imageHint || "product item"}
                      layout="fill"
                      objectFit="contain"
                      className="p-2"
                    />
                  </div>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-lg font-semibold line-clamp-2 h-14 hover:text-accent transition-colors">
                        <Link href={`/products/${product.id}`}>{product.name}</Link>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </CardHeader>
                  <CardContent className="flex-grow py-2">
                    <p className="text-xl font-bold text-accent">{getDisplayPrice(product.priceValue, product.currencyCode)}</p>
                    <p className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `Stock: ${product.stock} units` : "Out of Stock"}
                    </p>
                     {product.supplierName && <p className="text-xs text-muted-foreground mt-1">Sold by: {product.supplierName}</p>}
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/products/${product.id}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold">
                  {searchTerm ? "No products match your search." : "No products listed yet."}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms." : "Check back soon for new product additions!"}
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
