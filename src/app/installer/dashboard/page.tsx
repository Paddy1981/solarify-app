
// TODO: This page should be protected and only accessible to logged-in installers.
// We would typically fetch the actual installer's data here.
// For now, we'll use some mock data or placeholders.

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, ListChecks, UserCircle, Settings, BarChartHorizontalBig, Building2 } from "lucide-react";
import Image from "next/image";

// Simulating fetching some installer data
// In a real app, this would come from auth context or a data store
const mockInstaller = {
  companyName: "ProSolar Installations Inc.",
  email: "installer@example.com",
  location: "San Francisco Bay Area, CA",
  memberSince: "2023-01-15",
  avatarUrl: "https://placehold.co/120x120.png", // This specific URL is not replaced as it might be intended to show initials or be a real logo later
  tagline: "Your Trusted Partner for Clean Energy Solutions",
};

export default function InstallerDashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-primary/10 via-accent/5 to-background" data-ai-hint="abstract energy">
           <div className="absolute inset-0 overflow-hidden opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="installerDashPattern" patternUnits="userSpaceOnUse" width="80" height="80" patternTransform="scale(0.6) rotate(30)">
                  <path d="M0 40 Q 20 10, 40 40 T 80 40" stroke="hsl(var(--primary))" fill="transparent" strokeWidth="3"/>
                  <path d="M0 50 Q 20 20, 40 50 T 80 50" stroke="hsl(var(--accent))" fill="transparent" strokeWidth="1.5" strokeDasharray="4,4"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#installerDashPattern)" />
            </svg>
          </div>
        </div>
        <CardContent className="relative pt-0 -mt-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-x-0 sm:space-x-4">
            {mockInstaller.avatarUrl && mockInstaller.avatarUrl.startsWith('https://placehold.co') ? (
              <div 
                data-ai-hint="company logo"
                className="w-24 h-24 rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center"
              >
                <Building2 className="w-12 h-12 text-muted-foreground" />
              </div>
            ) : (
              <Image
                src={mockInstaller.avatarUrl} // Assumes this could be a real URL
                alt={`${mockInstaller.companyName} logo`}
                width={96}
                height={96}
                className="rounded-full border-4 border-background shadow-lg"
              />
            )}
            <div className="mt-3 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-headline tracking-tight text-accent">{mockInstaller.companyName}</h1>
              <p className="text-sm text-muted-foreground">{mockInstaller.tagline}</p>
            </div>
             <Button variant="outline" size="sm" className="mt-3 sm:mt-0 sm:ml-auto">
                <Settings className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-headline tracking-tight text-accent">Installer Dashboard</h2>
        <p className="mt-1 text-lg text-foreground/70">
          Manage your projects, quotes, and profile.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><ListChecks className="w-6 h-6 mr-2 text-accent"/> RFQs</CardTitle>
            <CardDescription>View and respond to incoming Requests for Quotation from homeowners.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for summary stats, e.g., "3 New RFQs" */}
            <p className="text-2xl font-bold text-accent">5 <span className="text-sm font-normal text-muted-foreground">Active RFQs</span></p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/installer/rfqs">View All RFQs</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Briefcase className="w-6 h-6 mr-2 text-accent"/> Project Portfolio</CardTitle>
            <CardDescription>Showcase your completed installations and manage your project listings.</CardDescription>
          </CardHeader>
           <CardContent>
            <p className="text-2xl font-bold text-accent">12 <span className="text-sm font-normal text-muted-foreground">Projects Listed</span></p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/installer/portfolio">Manage Portfolio</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChartHorizontalBig className="w-6 h-6 mr-2 text-accent"/> Performance & Analytics</CardTitle>
            <CardDescription>Track your quote conversion rates and project completions (Coming Soon).</CardDescription>
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
