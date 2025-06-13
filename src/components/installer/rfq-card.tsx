
"use client";

import type { RFQ } from "@/lib/mock-data/rfqs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, CalendarDays, Zap, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

interface RfqCardProps {
  rfq: RFQ;
}

export function RfqCard({ rfq }: RfqCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-xl text-primary">RFQ from: {rfq.name}</CardTitle>
            <FileText className="w-6 h-6 text-accent" />
        </div>
        <CardDescription>Received on: {new Date(rfq.dateCreated).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm flex-grow">
        <div className="flex items-center text-muted-foreground">
          <User className="w-4 h-4 mr-2 text-accent" />
          <span>Contact: {rfq.email}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Zap className="w-4 h-4 mr-2 text-accent" />
          <span>Est. System: {rfq.estimatedSystemSizeKW} kW</span>
        </div>
         <div className="flex items-center text-muted-foreground">
          <CalendarDays className="w-4 h-4 mr-2 text-accent" />
          <span>Avg. Consumption: {rfq.monthlyConsumptionKWh} kWh/month</span>
        </div>
        {rfq.additionalNotes && (
            <p className="text-xs italic text-muted-foreground pt-1 border-t border-border mt-2">
                Notes: {rfq.additionalNotes.length > 100 ? `${rfq.additionalNotes.substring(0, 97)}...` : rfq.additionalNotes}
            </p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href={`/installer/rfqs/${rfq.id}/generate-quote`}>
            Generate Quote <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
