
"use client"; // This page uses client-side hooks and localStorage

import * as React from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { getMockUserByEmail, type MockUser } from '@/lib/mock-data/users';

import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { StatsCard } from "@/components/dashboard/stats-card";
import { EnvironmentalImpactCard } from "@/components/dashboard/environmental-impact-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChartBig, Zap, Leaf, DollarSign, CheckCircle2, Bell, Info, AlertTriangle, Wrench, LogIn, UserCircle } from "lucide-react";
import { SystemSetupForm, type SystemConfigData } from '@/components/dashboard/system-setup-form';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// Skeleton placeholder for the dashboard
function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Skeleton className="h-10 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-1" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </div>
       <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
          <Skeleton className="h-10 w-1/3 mt-4" />
        </CardContent>
      </Card>
    </div>
  );
}

// Actual Dashboard Content
function ActualDashboardContent() {
  // In a real app, this data would eventually come from the configured system data
  // or live data. For now, it uses the same mock data.
  const stats = [
    { title: "Current Generation", value: "3.2 kW", icon: <Zap className="w-6 h-6 text-primary" />, change: "+5%", changeType: "positive" as "positive" | "negative" },
    { title: "Today's Energy", value: "15.7 kWh", icon: <Zap className="w-6 h-6 text-primary" />, change: "+12%", changeType: "positive" as "positive" | "negative" },
    { title: "Monthly Savings", value: "$45.80", icon: <DollarSign className="w-6 h-6 text-primary" />, change: "+8%", changeType: "positive" as "positive" | "negative" },
    { title: "System Health", value: "Optimal", icon: <CheckCircle2 className="w-6 h-6 text-green-500" /> },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline tracking-tight text-accent">Performance Dashboard</h1>
        <p className="mt-2 text-lg text-foreground/70">
          Monitor your solar system&apos;s real-time performance and environmental impact.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChartBig className="w-6 h-6 mr-2 text-primary" />Energy Generation Overview</CardTitle>
            <CardDescription>Past 7 days energy production (kWh)</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart />
          </CardContent>
        </Card>
        <EnvironmentalImpactCard />
      </div>
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Bell className="w-6 h-6 mr-2 text-primary" />Notifications & Alerts</CardTitle>
          <CardDescription>Recent system events and recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <Info className="w-5 h-5 text-accent mt-1 shrink-0" />
              <div>
                <p className="font-medium">System check completed successfully.</p>
                <p className="text-xs text-muted-foreground">Yesterday, 3:00 PM</p>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1 shrink-0" />
              <div>
                <p className="font-medium">Minor dip in production yesterday afternoon. Likely due to cloud cover.</p>
                <p className="text-xs text-muted-foreground">Yesterday, 4:30 PM</p>
              </div>
            </li>
             <li className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <Wrench className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-medium">Scheduled maintenance reminder: Panel cleaning recommended next month.</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </li>
          </ul>
           <Button variant="outline" className="mt-4 w-full md:w-auto">View All Notifications</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = React.useState<MockUser | null>(null);
  const [isConfigured, setIsConfigured] = React.useState<boolean>(false); // Default to false: show form
  const [isLoading, setIsLoading] = React.useState(true); // Unified loading state
  const { toast } = useToast();

  React.useEffect(() => {
    setIsLoading(true); // Start loading when effect runs
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        const profile = getMockUserByEmail(user.email);
        setCurrentUserProfile(profile);

        if (profile && profile.role === 'homeowner') {
          // Only try to load from localStorage if it's a homeowner
          if (typeof window !== 'undefined') { // Ensure client-side for localStorage
            try {
              const storedConfigStatus = localStorage.getItem(`dashboardConfigured_${user.uid}`);
              setIsConfigured(storedConfigStatus === 'true'); // This will be false if null or not 'true'
            } catch (error) {
              console.error("Error accessing localStorage for dashboard config:", error);
              setIsConfigured(false); // Fallback safely
            }
          } else {
            setIsConfigured(false); // Should not really happen in client component effect
          }
        } else {
          // Not a homeowner, or profile issue.
          // isConfigured remains false (or its current state), they'll be caught by role check below.
           setIsConfigured(false); // Explicitly set for clarity if not homeowner
        }
      } else {
        // Logged out
        setCurrentUserProfile(null);
        setIsConfigured(false);
      }
      setIsLoading(false); // Finish all loading (auth, profile, config check)
    });
    return () => unsubscribe();
  }, []); // Runs once on mount

  const handleConfigurationComplete = (data: SystemConfigData) => {
    if (currentUser) {
      if (typeof window !== 'undefined') { // Ensure client-side for localStorage
        try {
          localStorage.setItem(`dashboardConfigured_${currentUser.uid}`, 'true');
          localStorage.setItem(`dashboardSystemData_${currentUser.uid}`, JSON.stringify(data));
          setIsConfigured(true);
          toast({
            title: "System Configured!",
            description: "Your dashboard is now set up.",
          });
        } catch (error) {
          console.error("Error saving dashboard configuration:", error);
          toast({
            title: "Configuration Error",
            description: "Could not save your system configuration.",
            variant: "destructive",
          });
        }
      }
    }
  };

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <LogIn className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl font-headline mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Please log in to view your dashboard.
        </p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (!currentUserProfile || currentUserProfile.role !== 'homeowner') {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <UserCircle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-3xl font-headline mb-4 text-destructive">Invalid Access</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          This dashboard is for homeowners only. Your current profile role is '{currentUserProfile?.role || 'unknown'}'.
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  // At this point, user is a logged-in homeowner
  if (!isConfigured) {
    return <SystemSetupForm onConfigSubmit={handleConfigurationComplete} userProfile={currentUserProfile} />;
  }

  return <ActualDashboardContent />;
}
