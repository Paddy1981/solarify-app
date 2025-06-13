
"use client";

import type { RFQ } from "@/lib/mock-data/rfqs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CalendarDays, Zap, CheckCircle2, Clock, ExternalLink, FileCheck, Info } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from 'date-fns';

interface HomeownerRfqStatusCardProps {
  rfq: RFQ;
}

export function HomeownerRfqStatusCard({ rfq }: HomeownerRfqStatusCardProps) {
  let formattedDate = rfq.dateCreated;
  try {
    formattedDate = format(parseISO(rfq.dateCreated), "PPP"); // e.g., Jul 28, 2024
  } catch (error) {
    // Keep original if parsing fails
  }

  const getStatusBadgeVariant = (status: RFQ["status"]): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "Pending":
        return "secondary"; // Yellowish/Orange in some themes
      case "Responded":
        return "default"; // Primary color (often blue/green)
      case "Closed":
        return "outline"; // Grayish
      default:
        return "outline";
    }
  };

   const getStatusIcon = (status: RFQ["status"]) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 mr-1.5" />;
      case "Responded":
        return <FileCheck className="w-4 h-4 mr-1.5 text-green-600" />;
      case "Closed":
        return <Info className="w-4 h-4 mr-1.5 text-muted-foreground" />;
      default:
        return <FileText className="w-4 h-4 mr-1.5" />;
    }
  };


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="text-lg font-headline text-accent flex items-center">
            <FileText className="w-5 h-5 mr-2" /> RFQ #{rfq.id.substring(rfq.id.length - 6)}
          </CardTitle>
           <Badge variant={getStatusBadgeVariant(rfq.status)} className="text-xs">
            {getStatusIcon(rfq.status)}
            {rfq.status}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Created on: {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        <div className="flex items-center">
          <Zap className="w-4 h-4 mr-2 text-primary" />
          <span>Est. System: {rfq.estimatedSystemSizeKW} kW</span>
        </div>
        <div className="flex items-center">
          <CalendarDays className="w-4 h-4 mr-2 text-primary" />
          <span>Avg. Consumption: {rfq.monthlyConsumptionKWh} kWh/month</span>
        </div>
        {rfq.additionalNotes && (
          <p className="text-xs italic text-muted-foreground pt-1 line-clamp-2">
            Notes: {rfq.additionalNotes}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-3">
        <Button variant="outline" size="sm" className="w-full sm:w-auto flex-1" asChild>
          {/* Placeholder Link - In a real app, this would go to a detailed RFQ view */}
          <Link href={`/homeowner/rfq?rfqId=${rfq.id}`} passHref>
            <ExternalLink className="w-4 h-4 mr-2" /> View RFQ Details
          </Link>
        </Button>
        {rfq.status === "Responded" && (
          <Button size="sm" className="w-full sm:w-auto flex-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            {/* Placeholder Link - In a real app, this would go to the received quote */}
            <Link href={`/homeowner/quotes?rfqId=${rfq.id}`} passHref>
              <CheckCircle2 className="w-4 h-4 mr-2" /> View Quote
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
