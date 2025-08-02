
"use client";

import { ProjectCard } from "@/components/installer/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, PlusCircle, Award, Loader2, LogIn, UserCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { MockUser } from '@/lib/mock-data/users';
import { Skeleton } from "@/components/ui/skeleton";

// Define a type for the project data fetched from Firestore
interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  dateCompleted: string; // Assuming it's stored as a string, might need conversion
  systemSize: string;
  imageUrl?: string;
  imageHint?: string;
}

function PortfolioPageSkeleton() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <Skeleton className="h-32 w-full" />
        <CardContent className="relative pt-0 -mt-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-x-0 sm:space-x-4">
            <Skeleton className="w-24 h-24 rounded-full border-4 border-background" />
            <div className="mt-3 sm:mt-0 text-center sm:text-left flex-grow">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-5 w-1/2 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-lg flex flex-col">
            <Skeleton className="w-full h-48" />
            <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
            <CardContent className="flex-grow space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent>
            <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}


export default function InstallerPortfolioPage() {
  const [installerProfile, setInstallerProfile] = useState<MockUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data()?.role === 'installer') {
          const profile = { id: userDocSnap.id, ...userDocSnap.data() } as MockUser;
          setInstallerProfile(profile);

          // Fetch projects for this installer
          try {
            const projectsQuery = query(
              collection(db, "projects"),
              where("installerId", "==", profile.id),
              orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(projectsQuery);
            const fetchedProjects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setProjects(fetchedProjects);
          } catch (error) {
            console.error("Error fetching projects:", error);
            // Handle error, e.g., show a toast message
          }

        } else {
          setInstallerProfile(null);
          setProjects([]);
        }
      } else {
        setInstallerProfile(null);
        setProjects([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);


  if (isLoading) {
    return <PortfolioPageSkeleton />;
  }

  if (!installerProfile) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <LogIn className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl font-headline mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Please log in as an installer to view and manage your portfolio.
        </p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-primary/10 via-accent/5 to-background" data-ai-hint="abstract energy">
           <div className="absolute inset-0 overflow-hidden opacity-20">
             <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="p" patternUnits="userSpaceOnUse" width="80" height="80" patternTransform="scale(0.5) rotate(30)"><path d="M0 40 Q 20 10, 40 40 T 80 40" stroke="hsl(var(--primary))" fill="transparent" strokeWidth="2"/><path d="M0 50 Q 20 20, 40 50 T 80 50" stroke="hsl(var(--accent))" fill="transparent" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)" /></svg>
           </div>
        </div>
        <CardContent className="relative pt-0 -mt-12">
            <div className="flex flex-col md:flex-row items-center md:items-end space-x-0 md:space-x-6">
                <Image
                    src={installerProfile.avatarUrl || 'https://placehold.co/120x120.png'}
                    alt={`${installerProfile.companyName || installerProfile.fullName} logo`}
                    data-ai-hint="company logo"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-background shadow-lg object-cover"
                />
                <div className="mt-4 md:mt-0 text-center md:text-left">
                    <h1 className="text-3xl font-headline tracking-tight text-accent">{installerProfile.companyName || installerProfile.fullName}</h1>
                    <p className="text-muted-foreground">{installerProfile.location}</p>
                </div>
                <Button className="mt-4 md:mt-0 md:ml-auto bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                    <Link href="/installer/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-headline tracking-tight flex items-center text-accent"><Award className="w-7 h-7 mr-2" /> My Project Showcase</h2>
        <Button variant="outline" asChild>
          <Link href="/installer/portfolio/add-project">
            <PlusCircle className="w-5 h-5 mr-2" /> Add New Project
          </Link>
        </Button>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
            ))}
        </div>
      ) : (
        <Card className="col-span-full text-center py-12">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Briefcase className="w-16 h-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-headline">Your Portfolio is Empty</CardTitle>
            <CardDescription>Showcase your work to attract new clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
            <Link href="/installer/portfolio/add-project">
                <PlusCircle className="w-5 h-5 mr-2" /> Add Your First Project
            </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
