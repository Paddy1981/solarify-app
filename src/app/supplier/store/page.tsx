
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StoreIcon, Package, PlusCircle, Search, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { sampleProducts, type Product } from "@/lib/mock-data/products"; // Import from new location

export default function SupplierStorePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
            <h1 className="text-4xl font-headline tracking-tight text-accent flex items-center">
                <StoreIcon className="w-10 h-10 mr-3" /> Solarify Product Marketplace
            </h1>
            <p className="mt-1 text-lg text-foreground/70">Browse and discover solar products from our trusted suppliers.</p>
        </div>
        {/* For Suppliers, the Add Product button is usually on their dashboard or a dedicated management page.
            Keeping this public page focused on browsing.
            Suppliers can navigate to /supplier/store/add-product via their dashboard.
        */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Available Products</CardTitle>
            <CardDescription>Explore our catalog of solar panels, inverters, batteries, and more.</CardDescription>
            <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-10 w-full md:w-1/3" />
            </div>
        </CardHeader>
        <CardContent>
          {sampleProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sampleProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                  <div className="relative w-full h-48 bg-muted/30">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      data-ai-hint={product.imageHint}
                      layout="fill"
                      objectFit="contain" // Changed to contain to see more of the product
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
                    <p className="text-xl font-bold text-accent">{product.price}</p>
                    <p className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `Stock: ${product.stock} units` : "Out of Stock"}
                    </p>
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
                <h3 className="text-xl font-semibold">No products listed yet.</h3>
                <p className="text-muted-foreground">Check back soon for new product additions!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
