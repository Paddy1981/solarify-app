
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Bell className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Notifications</CardTitle>
          <CardDescription>
            All your system alerts and important updates will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground mb-6">
            This feature is currently under development. 
            Soon, you'll find a list of all notifications related to your account and solar system.
          </p>
          <Button variant="outline" asChild>
            <Link href="/homeowner/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
