
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Search, Sun } from "lucide-react";

interface SolarJourneyChoiceFormProps {
  onChoiceMade: (choice: 'existing' | 'new_to_solar') => void;
  userName?: string | null;
}

export function SolarJourneyChoiceForm({ onChoiceMade, userName }: SolarJourneyChoiceFormProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-20rem)] py-12">
      <Card className="w-full max-w-lg shadow-xl border-2 border-primary/20">
        <CardHeader className="text-center pb-6 pt-8">
          <div className="flex justify-center mb-6">
            <Sun className="w-20 h-20 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-headline text-accent">
            Welcome{userName ? `, ${userName}` : ''}!
          </CardTitle>
          <CardDescription className="text-lg text-foreground/80 mt-2">
            Let's personalize your Solarify experience.
            Please tell us about your current solar situation:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8">
          <Button
            size="lg"
            className="w-full py-8 text-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-shadow duration-300"
            onClick={() => onChoiceMade('existing')}
          >
            <Zap className="mr-3 h-6 w-6" />
            I Have an Existing Solar Setup
            <ArrowRight className="ml-auto h-6 w-6" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full py-8 text-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-accent text-accent hover:bg-accent/10"
            onClick={() => onChoiceMade('new_to_solar')}
          >
            <Search className="mr-3 h-6 w-6" />
            I'm New to Solar & Exploring
            <ArrowRight className="ml-auto h-6 w-6" />
          </Button>
        </CardContent>
        <CardFooter className="pt-6 pb-8 px-8">
            <p className="text-xs text-muted-foreground text-center w-full">Your choice will help us tailor the dashboard to your needs. You can change this later in your profile settings.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
