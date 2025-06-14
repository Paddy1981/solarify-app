
"use client";

import { ProjectCard } from "@/components/installer/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, PlusCircle, MapPin, Star, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getMockUserByEmail, type UserRole } from '@/lib/mock-data/users';

const sampleProjects = [
  {
    id: "1",
    title: "Sunnyvale Family Home Solar",
    imageUrl: "https://placehold.co/600x400.png?a=1",
    imageHint: "residential solar",
    description: "5kW system installed for a modern family home, significantly reducing energy bills and carbon footprint.",
    location: "Sunnyvale, CA",
    dateCompleted: "2023-05-15",
    systemSize: "5 kWp",
  },
  {
    id: "2",
    title: "Eco-Friendly Ranch Installation",
    imageUrl: "https://placehold.co/600x400.png?a=2",
    imageHint: "solar panels house",
    description: "Comprehensive 10kW off-grid solution for a sustainable ranch, including battery backup for energy independence.",
    location: "Austin, TX",
    dateCompleted: "2023-08-20",
    systemSize: "10 kWp Solar, 20 kWh Battery",
  },
  {
    id: "3",
    title: "Urban Rooftop Power Project",
    imageUrl: "https://placehold.co/600x400.png?a=3",
    imageHint: "rooftop solar",
    description: "Compact 3kW system cleverly optimized for an urban townhouse with limited roof space, maximizing solar gain.",
    location: "Brooklyn, NY",
    dateCompleted: "2024-01-10",
    systemSize: "3 kWp",
  },
];

const featuredInstallerProfile = {
    name: "Featured Solar Installations Co.",
    tagline: "Pioneering Clean Energy Solutions for a Brighter Tomorrow.",
    location: "Nationwide Showcase",
    rating: 4.9,
    reviews: 250,
    yearsInBusiness: 12,
    specialties: ["Residential Solar", "Commercial Solar", "Battery Storage", "EV Charging"],
    avatarUrl: "https://placehold.co/120x120.png?text=FS" 
};


export default function InstallerPortfolioPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        const profile = getMockUserByEmail(user.email); // Mock data used here
        setUserRole(profile?.role || null);
      } else {
        setUserRole(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const isInstaller = currentUser && userRole === 'installer';

  return (
    <div className="space-y-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-primary/10 via-accent/5 to-background" data-ai-hint="solar company office">
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="portfolioCoverPattern" patternUnits="userSpaceOnUse" width="60" height="60" patternTransform="scale(0.7) rotate(-15)">
                  <path d="M0 0 L30 30 L0 60 Z" fill="hsl(var(--primary))" opacity="0.5"/>
                  <path d="M30 0 L60 30 L30 60 Z" fill="hsl(var(--accent))" opacity="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#portfolioCoverPattern)" />
            </svg>
          </div>
        </div>
        <CardContent className="relative pt-0 -mt-16">
            <div className="flex flex-col md:flex-row items-center md:items-end space-x-0 md:space-x-6">
                <Image
                    src={featuredInstallerProfile.avatarUrl} // This uses placehold.co?text=FS
                    alt={`${featuredInstallerProfile.name} logo`}
                    data-ai-hint="company logo initials" // Hint for the initials-based placeholder
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-background shadow-lg"
                />
                <div className="mt-4 md:mt-0 text-center md:text-left">
                    <h1 className="text-3xl font-headline tracking-tight text-accent">{featuredInstallerProfile.name}</h1>
                    <p className="text-muted-foreground">{featuredInstallerProfile.tagline}</p>
                    <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4 text-accent" /> <span>{featuredInstallerProfile.location}</span>
                        <Star className="w-4 h-4 text-yellow-500" /> <span>{featuredInstallerProfile.rating} ({featuredInstallerProfile.reviews} reviews)</span>
                    </div>
                </div>
                <Button className="mt-4 md:mt-0 md:ml-auto bg-accent text-accent-foreground hover:bg-accent/90">
                    Request Information from this Installer
                </Button>
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-headline tracking-tight flex items-center text-accent"><Award className="w-7 h-7 mr-2 text-accent" /> Project Showcase</h2>
        {isInstaller && !isLoadingAuth && (
          <Button variant="outline" asChild>
            <Link href="/installer/portfolio/add-project">
              <PlusCircle className="w-5 h-5 mr-2" /> Add New Project
            </Link>
          </Button>
        )}
      </div>

      {sampleProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sampleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
            ))}
        </div>
      ) : (
        <Card className="col-span-full text-center py-12">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Briefcase className="w-16 h-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-headline">No Projects Yet</CardTitle>
            <CardDescription>Explore inspiring solar installations from our community of installers, or add your own if you are an installer.</CardDescription>
          </CardHeader>
          <CardContent>
            {isInstaller && (
                <Button asChild>
                <Link href="/installer/portfolio/add-project">
                    <PlusCircle className="w-5 h-5 mr-2" /> Add Your First Project
                </Link>
                </Button>
            )}
          </CardContent>
        </Card>
      )}
       <p className="text-sm text-center text-muted-foreground mt-8">
          Installers: Log in to add your projects to this public showcase. Currently displaying sample projects.
        </p>
    </div>
  );
}
