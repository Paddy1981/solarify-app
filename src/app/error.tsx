"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Unhandled Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] bg-background text-foreground p-6 text-center">
      <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
      <h1 className="text-4xl font-headline mb-4 text-destructive">Oops! Something Went Wrong</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        We encountered an unexpected issue. Please try again, or if the problem persists, contact support.
      </p>
      {error?.message && (
         <p className="text-sm bg-muted p-3 rounded-md mb-6 max-w-xl text-left">
           <strong>Error details:</strong> {error.message}
        </p>
      )}
      <Button
        onClick={() => reset()}
        size="lg"
        className="bg-accent text-accent-foreground hover:bg-accent/90"
      >
        Try Again
      </Button>
    </div>
  );
}
