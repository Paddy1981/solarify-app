
"use client"; 

import * as React from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db, serverTimestamp } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, type Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { MockUser } from '@/lib/mock-data/users';
import type { RFQ } from '@/lib/mock-data/rfqs';

import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { StatsCard } from "@/components/dashboard/stats-card";
import { EnvironmentalImpactCard } from "@/components/dashboard/environmental-impact-card";
import { HomeownerRfqStatusCard } from '@/components/dashboard/homeowner-rfq-status-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChartBig, Zap, DollarSign, CheckCircle2, Bell, Info, AlertTriangle, Wrench, LogIn, UserCircle, Signal, RadioTower, FileText, PlusCircle } from "lucide-react";
import { SystemSetupForm, type SystemConfigData } from '@/components/dashboard/system-setup-form';
import { SolarJourneyChoiceForm } from '@/components/dashboard/solar-journey-choice-form';
import { NewToSolarDashboardContent } from '@/components/dashboard/new-to-solar-dashboard-content';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

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

interface ActualDashboardContentProps {
  homeownerProfile: MockUser | null;
  systemConfiguration: SystemConfigData | null;
}

function ActualDashboardContent({ homeownerProfile, systemConfiguration }: ActualDashboardContentProps) {
  const [userRFQs, setUserRFQs] = React.useState<RFQ[]>([]);
  const [isLoadingRFQs, setIsLoadingRFQs] = React.useState(true);

  React.useEffect(() => {
    if (homeownerProfile && homeownerProfile.id) {
      const fetchRFQs = async () => {
        setIsLoadingRFQs(true);
        try {
          const rfqsRef = collection(db, "rfqs");
          const q = query(rfqsRef, where("homeownerId", "==", homeownerProfile.id), orderBy("dateCreated", "desc"));
          const querySnapshot = await getDocs(q);
          const fetchedRFQs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RFQ));
          setUserRFQs(fetchedRFQs);
        } catch (error) {
          console.error("Error fetching RFQs:", error);
        } finally {
          setIsLoadingRFQs(false);
        }
      };
      fetchRFQs();
    } else {
      setUserRFQs([]);
      setIsLoadingRFQs(false);
    }
  }, [homeownerProfile]);
  
  const systemSizeKW = systemConfiguration?.systemSizeKW || 0;

  const stats = [
    { 
      title: "Current Generation", 
      value: systemSizeKW > 0 ? `${(systemSizeKW * 0.6).toFixed(1)} kW` : "N/A", 
      icon: <Zap className="w-6 h-6 text-primary" />, 
      change: systemSizeKW > 0 ? "+5%" : undefined, 
      changeType: "positive" as "positive" | "negative" 
    },
    { 
      title: "Today's Energy", 
      value: systemSizeKW > 0 ? `${(systemSizeKW * 3.5).toFixed(1)} kWh` : "N/A", 
      icon: <Zap className="w-6 h-6 text-primary" />, 
      change: systemSizeKW > 0 ? "+12%" : undefined, 
      changeType: "positive" as "positive" | "negative" 
    },
    { 
      title: "Monthly Savings", 
      value: "$45.80", // Placeholder, as this is complex
      icon: <DollarSign className="w-6 h-6 text-primary" />, 
      change: "+8%", // Placeholder
      changeType: "positive" as "positive" | "negative" 
    },
    { 
      title: "System Health", 
      value: "Optimal", // Placeholder
      icon: <CheckCircle2 className="w-6 h-6 text-green-500" /> 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline tracking-tight text-accent">Performance Dashboard</h1>
        <p className="mt-2 text-lg text-foreground/70">
          Monitor your solar system&apos;s performance and environmental impact. 
          {systemSizeKW > 0 ? ` (Stats based on ${systemSizeKW}kW system)` : ' (Demo Data)'}
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
          <CardTitle className="font-headline flex items-center"><FileText className="w-6 h-6 mr-2 text-primary" />My Requests for Quotation</CardTitle>
          <CardDescription>Track the status of your RFQs and view received quotes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRFQs ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : userRFQs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userRFQs.map(rfq => (
                <HomeownerRfqStatusCard key={rfq.id} rfq={rfq} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">You haven&apos;t generated any RFQs yet.</p>
              <Button asChild>
                <Link href="/homeowner/rfq">
                  <PlusCircle className="w-4 h-4 mr-2" /> Create New RFQ
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
           <Button variant="outline" className="mt-4 w-full md:w-auto" asChild>
             <Link href="/homeowner/notifications">View All Notifications</Link>
           </Button>
        </CardContent>
      </Card>

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
  const [systemConfig, setSystemConfig] = React.useState<SystemConfigData | null>(null);
  const [dashboardStatus, setDashboardStatus] = React.useState<DashboardStatus>('loading');
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.uid) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const profile = { id: userDocSnap.id, ...userDocSnap.data() } as MockUser;
            setCurrentUserProfile(profile);

            if (profile.role === 'homeowner') {
              const journeyChoice = profile.dashboardJourneyChoice || 'needs_choice';
              setDashboardStatus(journeyChoice);
              if (journeyChoice === 'existing_configured' && profile.systemConfiguration) {
                setSystemConfig(profile.systemConfiguration);
              } else if (journeyChoice === 'existing_configured' && !profile.systemConfiguration) {
                // Data inconsistency: configured but no config data. Prompt for setup again.
                setDashboardStatus('existing_setup_pending'); 
                 try {
                    await updateDoc(userDocRef, { dashboardJourneyChoice: 'existing_setup_pending' });
                  } catch (error) { console.error("Failed to reset journey choice in Firestore", error); }
              }
            } else {
              setDashboardStatus('invalid_role');
            }
        } else {
            setCurrentUserProfile(null);
            setDashboardStatus('invalid_role'); 
        }
      } else {
        setCurrentUserProfile(null);
        setDashboardStatus('needs_auth');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSolarJourneyChoice = async (choice: 'existing' | 'new_to_solar') => {
    if (currentUser && currentUserProfile) {
      const userDocRef = doc(db, "users", currentUser.uid);
      const newStatus = choice === 'existing' ? 'existing_setup_pending' : 'new_to_solar';
      try {
        await updateDoc(userDocRef, { 
          dashboardJourneyChoice: newStatus,
          updatedAt: serverTimestamp() 
        });
        setDashboardStatus(newStatus);
        setCurrentUserProfile(prev => prev ? {...prev, dashboardJourneyChoice: newStatus} : null);
        if (choice === 'existing') {
          toast({ title: "Great!", description: "Please tell us about your solar system." });
        } else {
          toast({ title: "Welcome!", description: "Let's explore your solar options." });
        }
      } catch (error) {
        console.error("Error updating solar journey choice in Firestore:", error);
        toast({ title: "Error", description: "Could not save your choice to cloud.", variant: "destructive" });
      }
    }
  };

  const handleConfigurationComplete = async (data: SystemConfigData) => {
     if (currentUser && currentUserProfile) {
      const userDocRef = doc(db, "users", currentUser.uid);
      try {
        await updateDoc(userDocRef, {
          systemConfiguration: data,
          dashboardJourneyChoice: 'existing_configured',
          updatedAt: serverTimestamp()
        });
        setSystemConfig(data);
        setDashboardStatus('existing_configured');
        setCurrentUserProfile(prev => prev ? {
            ...prev, 
            systemConfiguration: data, 
            dashboardJourneyChoice: 'existing_configured'
        } : null);
        toast({
          title: "System Configured!",
          description: "Your dashboard is now set up and saved to your profile.",
        });
      } catch (error) {
        console.error("Error saving dashboard configuration to Firestore:", error);
        toast({
          title: "Configuration Error",
          description: "Could not save your system configuration to cloud.",
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
    return <ActualDashboardContent homeownerProfile={currentUserProfile} systemConfiguration={systemConfig} />;
  }

  return <DashboardLoadingSkeleton />; 
}
