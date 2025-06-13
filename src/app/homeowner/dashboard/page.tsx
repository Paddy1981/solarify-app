
"use client"; 

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
import { BarChartBig, Zap, Leaf, DollarSign, CheckCircle2, Bell, Info, AlertTriangle, Wrench, LogIn, UserCircle, Signal, RadioTower } from "lucide-react";
import { SystemSetupForm, type SystemConfigData } from '@/components/dashboard/system-setup-form';
import { SolarJourneyChoiceForm } from '@/components/dashboard/solar-journey-choice-form';
import { NewToSolarDashboardContent } from '@/components/dashboard/new-to-solar-dashboard-content';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const DASHBOARD_STATE_KEY_PREFIX = 'homeownerDashboardState_';

type DashboardStatus =
  | 'loading'
  | 'needs_auth'
  | 'invalid_role'
  | 'needs_choice'
  | 'existing_setup_pending'
  | 'existing_configured'
  | 'new_to_solar';

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

function ActualDashboardContent() {
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
          Monitor your solar system&apos;s real-time performance and environmental impact. (Demo Data)
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
            <CardDescription>Past 7 days energy production (kWh) (Demo Data)</CardDescription>
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
          <CardDescription>Recent system events and recommendations. (Demo Data)</CardDescription>
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

      {/* New "Coming Soon" Card for Live Solar Performance Tracking */}
      <Card className="shadow-xl border-2 border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center text-accent">
            <Signal className="w-7 h-7 mr-3 text-primary" />
            Coming Soon: Live Solar Performance Tracking
          </CardTitle>
          <CardDescription className="text-foreground/80">
            Get ready to monitor your solar system&apos;s performance in real-time with our upcoming IoT integration!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-foreground/70">
            We&apos;re diligently working on integrating smart IoT-enabled solar tracking devices with Solarify. Soon, you&apos;ll be able to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-foreground/70 pl-5">
            <li>View live Solar Generation (kW) and Daily Energy produced (kWh).</li>
            <li>Track your real-time CO₂ Savings and Car Miles Avoided.</li>
            <li>Securely pair your compatible solar monitoring devices with your Solarify account.</li>
            <li>Customize data refresh intervals, performance alerts, and reporting preferences.</li>
          </ul>
          <div className="flex items-center gap-2 text-accent font-semibold pt-2">
             <RadioTower className="w-5 h-5"/> 
             <p>Stay tuned for updates on this exciting new feature!</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = React.useState<MockUser | null>(null);
  const [dashboardStatus, setDashboardStatus] = React.useState<DashboardStatus>('loading');
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        const profile = getMockUserByEmail(user.email);
        setCurrentUserProfile(profile);

        if (profile && profile.role === 'homeowner') {
          if (typeof window !== 'undefined') {
            try {
              const storedState = localStorage.getItem(`${DASHBOARD_STATE_KEY_PREFIX}${user.uid}`) as DashboardStatus | null;
              if (storedState === 'existing_configured') {
                setDashboardStatus('existing_configured');
              } else if (storedState === 'new_to_solar') {
                setDashboardStatus('new_to_solar');
              } else if (storedState === 'existing_setup_pending') {
                 setDashboardStatus('existing_setup_pending');
              } else {
                setDashboardStatus('needs_choice');
              }
            } catch (error) {
              console.error("Error accessing localStorage for dashboard state:", error);
              setDashboardStatus('needs_choice'); // Fallback safely
            }
          } else {
             setDashboardStatus('needs_choice'); // Should not happen in client component effect
          }
        } else {
          setDashboardStatus('invalid_role');
        }
      } else {
        setCurrentUserProfile(null);
        setDashboardStatus('needs_auth');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSolarJourneyChoice = (choice: 'existing' | 'new_to_solar') => {
    if (currentUser && typeof window !== 'undefined') {
      try {
        if (choice === 'existing') {
          localStorage.setItem(`${DASHBOARD_STATE_KEY_PREFIX}${currentUser.uid}`, 'existing_setup_pending');
          setDashboardStatus('existing_setup_pending');
          toast({ title: "Great!", description: "Please tell us about your solar system." });
        } else { // new_to_solar
          localStorage.setItem(`${DASHBOARD_STATE_KEY_PREFIX}${currentUser.uid}`, 'new_to_solar');
          setDashboardStatus('new_to_solar');
          toast({ title: "Welcome!", description: "Let's explore your solar options." });
        }
      } catch (error) {
        console.error("Error saving solar journey choice:", error);
        toast({ title: "Error", description: "Could not save your choice.", variant: "destructive" });
      }
    }
  };

  const handleConfigurationComplete = (data: SystemConfigData) => {
    if (currentUser && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${DASHBOARD_STATE_KEY_PREFIX}${currentUser.uid}`, 'existing_configured');
        // Optionally, save system data too, though not strictly part of status
        localStorage.setItem(`dashboardSystemData_${currentUser.uid}`, JSON.stringify(data));
        setDashboardStatus('existing_configured');
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
  };

  if (dashboardStatus === 'loading') {
    return <DashboardLoadingSkeleton />;
  }

  if (dashboardStatus === 'needs_auth') {
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

  if (dashboardStatus === 'invalid_role' || !currentUserProfile || currentUserProfile.role !== 'homeowner') {
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
  if (dashboardStatus === 'needs_choice') {
    return <SolarJourneyChoiceForm onChoiceMade={handleSolarJourneyChoice} userName={currentUserProfile?.fullName} />;
  }

  if (dashboardStatus === 'existing_setup_pending') {
    return <SystemSetupForm onConfigSubmit={handleConfigurationComplete} userProfile={currentUserProfile} />;
  }
  
  if (dashboardStatus === 'new_to_solar') {
    return <NewToSolarDashboardContent />;
  }

  if (dashboardStatus === 'existing_configured') {
    return <ActualDashboardContent />;
  }

  // Fallback for any unexpected status
  return <DashboardLoadingSkeleton />; 
}
