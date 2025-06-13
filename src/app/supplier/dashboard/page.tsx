
// TODO: This page should be protected and only accessible to logged-in suppliers.
// We would typically fetch the actual supplier's data here.

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StoreIcon, PackagePlus, ListOrdered, Settings, BarChartHorizontalBig } from "lucide-react";
import Image from "next/image";

// Simulating fetching some supplier data
// In a real app, this would come from auth context or a data store
const mockSupplier = {
  companyName: "EcoSolar Supplies Ltd.",
  email: "supplier@example.com",
  location: "Global Distribution Center",
  memberSince: "2022-11-01",
  avatarUrl: "https://placehold.co/120x120.png",
  tagline: "Powering a Brighter Future with Quality Solar Components",
  storeRating: 4.7,
  productsListed: 150,
};

export default function SupplierDashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-primary via-primary/70 to-accent">
           <Image
            src="https://placehold.co/1200x200.png"
            alt="Supplier dashboard cover"
            data-ai-hint="solar warehouse"
            layout="fill"
            objectFit="cover"
            className="opacity-20"
          />
        </div>
        <CardContent className="relative pt-0 -mt-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-x-0 sm:space-x-4">
            <Image
              src={mockSupplier.avatarUrl}
              alt={`${mockSupplier.companyName} logo`}
              data-ai-hint="company logo factory"
              width={96}
              height={96}
              className="rounded-full border-4 border-background shadow-lg"
            />
            <div className="mt-3 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-headline tracking-tight text-accent">{mockSupplier.companyName}</h1>
              <p className="text-sm text-muted-foreground">{mockSupplier.tagline}</p>
              <p className="text-xs text-muted-foreground">Store Rating: {mockSupplier.storeRating}/5</p>
            </div>
             <Button variant="outline" size="sm" className="mt-3 sm:mt-0 sm:ml-auto">
                <Settings className="mr-2 h-4 w-4" /> Edit Store Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-headline tracking-tight">Supplier Dashboard</h2>
        <p className="mt-1 text-lg text-foreground/70">
          Manage your product catalog, orders, and store settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><StoreIcon className="w-6 h-6 mr-2 text-primary"/> My Storefront</CardTitle>
            <CardDescription>View and manage your product listings, inventory, and pricing.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">{mockSupplier.productsListed} <span className="text-sm font-normal text-muted-foreground">Products Listed</span></p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button asChild className="w-full sm:flex-1">
              <Link href="/supplier/store">Manage Products</Link>
            </Button>
             <Button variant="outline" asChild className="w-full sm:flex-1">
              <Link href="/supplier/store/add-product">
                <PackagePlus className="mr-2 h-4 w-4"/> Add Product
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><ListOrdered className="w-6 h-6 mr-2 text-primary"/> Orders & Fulfillment</CardTitle>
            <CardDescription>Track incoming orders and manage fulfillment (Coming Soon).</CardDescription>
          </CardHeader>
           <CardContent>
            <p className="text-muted-foreground italic">Order management under development.</p>
          </CardContent>
          <CardFooter>
            <Button disabled variant="outline" className="w-full">View Orders</Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChartHorizontalBig className="w-6 h-6 mr-2 text-primary"/> Sales Analytics</CardTitle>
            <CardDescription>Review your sales performance and trends (Coming Soon).</CardDescription>
          </CardHeader>
           <CardContent>
             <p className="text-muted-foreground italic">Analytics dashboard under development.</p>
          </CardContent>
          <CardFooter>
            <Button disabled variant="outline" className="w-full">View Analytics</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
