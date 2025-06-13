
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AddPromotionPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Edit3 className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Create New Promotion</CardTitle>
          <CardDescription>
            Share your latest offers, discounts, or announcements with the Solarify community.
            (Form to be implemented here)
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground mb-6">
            The form for adding promotion details will be available here soon.
            You'll be able to specify titles, descriptions, images, discounts, and more.
          </p>
          <Button variant="outline" asChild>
            <Link href="/promotions">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Promotions Hub
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
