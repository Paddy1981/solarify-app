
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, FileText, Award, ArrowRight, Sparkles, Lightbulb } from "lucide-react";

export function NewToSolarDashboardContent() {
  const features = [
    {
      title: "Calculate Your Energy Needs",
      description: "Understand your home's electricity consumption and what size system you might need.",
      icon: <Calculator className="w-10 h-10 text-accent" />,
      link: "/homeowner/energy-needs",
      cta: "Start Calculating",
    },
    {
      title: "Estimate Potential Savings",
      description: "Discover how much you could save with solar, your payback period, and ROI with our AI-powered tool.",
      icon: <TrendingUp className="w-10 h-10 text-accent" />,
      link: "/homeowner/savings-estimator",
      cta: "Estimate Savings",
    },
    {
      title: "Explore Installer Showcase",
      description: "See inspiring solar projects completed by installers in the Solarify network.",
      icon: <Award className="w-10 h-10 text-accent" />,
      link: "/installer/portfolio", 
      cta: "View Showcase",
    },
    {
      title: "Generate a Request for Quotation",
      description: "Ready to take the next step? Create an RFQ to send to local solar professionals.",
      icon: <FileText className="w-10 h-10 text-accent" />,
      link: "/homeowner/rfq",
      cta: "Get Quotes",
    },
  ];

  return (
    <div className="space-y-10 py-8">
      <Card className="shadow-xl bg-gradient-to-br from-primary/10 via-background to-background border-2 border-primary/20">
        <CardHeader className="text-center py-10">
          <div className="flex justify-center mb-6">
            <Lightbulb className="w-20 h-20 text-primary opacity-80" />
          </div>
          <CardTitle className="text-4xl font-headline tracking-tight text-accent">
            Your Solar Journey Starts Here!
          </CardTitle>
          <CardDescription className="mt-3 text-lg text-foreground/80 max-w-3xl mx-auto">
            Welcome to Solarify! We're excited to help you explore the world of solar energy.
            Below are some tools and resources designed to guide you on your path to clean, renewable power.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="text-center">
        <h2 className="text-3xl font-headline text-foreground mb-2">Discover Your Solar Potential</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
            Use these tools to understand your needs, potential savings, and connect with professionals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature) => (
          <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col transform hover:-translate-y-1">
            <CardHeader className="items-center text-center pt-8">
              <div className="p-4 bg-accent/10 rounded-full mb-4 inline-block">
                {feature.icon}
              </div>
              <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow px-6 py-4">
              <p className="text-sm text-muted-foreground text-center min-h-[40px]">{feature.description}</p>
            </CardContent>
            <CardFooter className="p-6 pt-2">
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href={feature.link}>
                  {feature.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <div className="text-center mt-12 py-6 bg-muted/50 rounded-lg">
        <h3 className="text-xl font-headline text-foreground mb-3">Ready to Track an Existing System?</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          If you already have solar panels installed, you can update your status in your profile settings to access the performance dashboard.
        </p>
        <Button variant="outline" disabled>
            Go to Profile Settings (Coming Soon)
        </Button>
      </div>
    </div>
  );
}
