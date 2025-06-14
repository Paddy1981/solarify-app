
"use client";

import type { RFQ } from "@/lib/mock-data/rfqs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, CalendarDays, Zap, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { format } from 'date-fns'; // For Timestamp

interface RfqCardProps {
  rfq: RFQ;
}

export function RfqCard({ rfq }: RfqCardProps) {
  const [formattedDate, setFormattedDate] = useState("N/A");

  useEffect(() => {
    if (rfq.dateCreated && typeof rfq.dateCreated.toDate === 'function') {
      try {
        setFormattedDate(format(rfq.dateCreated.toDate(), "PPP"));
      } catch (e) {
        console.error("Error formatting RFQ date:", e);
        // Keep N/A or original if string
      }
    } else if (typeof rfq.dateCreated === 'string') { // Fallback for old mock string dates
        try {
            setFormattedDate(format(new Date(rfq.dateCreated), "PPP"));
        } catch (e) { /* Keep N/A */ }
    }
  }, [rfq.dateCreated]);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-xl text-accent">RFQ from: {rfq.name}</CardTitle>
            <FileText className="w-6 h-6 text-accent" />
        </div>
        <CardDescription>Received on: {formattedDate}</CardDescription>
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
            <p className="text-xs italic text-muted-foreground pt-1 border-t border-border mt-2 line-clamp-3">
                Notes: {rfq.additionalNotes}
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
