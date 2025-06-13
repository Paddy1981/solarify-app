import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StoreIcon, Package, PlusCircle, Search } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";

const sampleProducts = [
  { id: "1", name: "High-Efficiency Solar Panel 450W", price: "$250.00", imageUrl: "https://placehold.co/300x200.png?p=1", imageHint: "solar panel", stock: 120, category: "Panels" },
  { id: "2", name: "5kW Grid-Tie Inverter", price: "$800.00", imageUrl: "https://placehold.co/300x200.png?p=2", imageHint: "inverter device", stock: 45, category: "Inverters" },
  { id: "3", name: "Mounting Rail Kit (Set of 4)", price: "$75.00", imageUrl: "https://placehold.co/300x200.png?p=3", imageHint: "metal rails", stock: 300, category: "Mounting" },
  { id: "4", name: "Solar Cable MC4 Connectors (10 Pairs)", price: "$25.00", imageUrl: "https://placehold.co/300x200.png?p=4", imageHint: "solar cables", stock: 500, category: "Accessories" },
];

export default function SupplierStorePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
            <h1 className="text-4xl font-headline tracking-tight text-primary flex items-center">
                <StoreIcon className="w-10 h-10 mr-3" /> My Digital Storefront
            </h1>
            <p className="mt-1 text-lg text-foreground/70">Manage your product catalog, inventory, and promotions.</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusCircle className="w-5 h-5 mr-2" /> Add New Product
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Product Listings</CardTitle>
            <CardDescription>View and manage your current product offerings.</CardDescription>
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
                  <div className="relative w-full h-40">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      data-ai-hint={product.imageHint}
                      layout="fill"
                      objectFit="contain"
                      className="p-2"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold line-clamp-2 h-14">{product.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-xl font-bold text-primary">{product.price}</p>
                    <p className={`text-sm ${product.stock > 20 ? 'text-green-600' : 'text-red-600'}`}>
                      Stock: {product.stock} units
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" className="flex-1">Edit</Button>
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10 flex-1">Delete</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No products listed yet.</h3>
                <p className="text-muted-foreground">Add products to start selling on Solarify.</p>
                <Button className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
                    <PlusCircle className="w-5 h-5 mr-2" /> Add First Product
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
