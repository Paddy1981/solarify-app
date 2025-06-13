
import { samplePromotions } from "@/lib/mock-data/promotions";
import { PromotionCard } from "@/components/promotions/promotion-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Megaphone, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function PromotionsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader className="text-center py-8">
          <div className="flex justify-center mb-4">
            <Megaphone className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-headline tracking-tight">Promotions Hub</CardTitle>
          <CardDescription className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Discover the latest offers, discounts, and announcements from Solarify installers and suppliers.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-end">
        {/* This button's visibility/functionality would be enhanced based on user role later */}
        <Button asChild variant="outline">
          <Link href="/promotions/add">
            <PlusCircle className="w-5 h-5 mr-2" /> Create New Promotion
          </Link>
        </Button>
      </div>

      {samplePromotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {samplePromotions.map((post) => (
            <PromotionCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <Card className="col-span-full text-center py-12">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Megaphone className="w-16 h-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-headline">No Promotions Yet</CardTitle>
            <CardDescription>Check back soon for exciting offers and updates!</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
