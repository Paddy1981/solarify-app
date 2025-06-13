
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
    description: "5kW system installed for a modern family home, reducing energy bills by 70%.",
    location: "Sunnyvale, CA",
    dateCompleted: "2023-05-15",
    systemSize: "5 kW",
  },
  {
    id: "2",
    title: "Eco-Friendly Ranch Installation",
    imageUrl: "https://placehold.co/600x400.png?a=2",
    imageHint: "solar panels house",
    description: "10kW off-grid solution for a sustainable ranch, including battery backup.",
    location: "Austin, TX",
    dateCompleted: "2023-08-20",
    systemSize: "10 kW",
  },
  {
    id: "3",
    title: "Urban Rooftop Power Project",
    imageUrl: "https://placehold.co/600x400.png?a=3",
    imageHint: "rooftop solar",
    description: "Compact 3kW system optimized for an urban townhouse with limited roof space.",
    location: "Brooklyn, NY",
    dateCompleted: "2024-01-10",
    systemSize: "3 kW",
  },
];

// This featured installer profile is shown on the public showcase page.
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
        const profile = getMockUserByEmail(user.email);
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
        <div className="relative h-48 bg-gradient-to-r from-primary via-primary/70 to-accent">
          <Image 
            src="https://placehold.co/1200x300.png" 
            alt="Installer cover photo"
            data-ai-hint="solar company" 
            layout="fill" 
            objectFit="cover" 
            className="opacity-30"
          />
        </div>
        <CardContent className="relative pt-0 -mt-16">
            <div className="flex flex-col md:flex-row items-center md:items-end space-x-0 md:space-x-6">
                <Image
                    src={featuredInstallerProfile.avatarUrl}
                    alt={`${featuredInstallerProfile.name} logo`}
                    data-ai-hint="company logo"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-background shadow-lg"
                />
                <div className="mt-4 md:mt-0 text-center md:text-left">
                    <h1 className="text-3xl font-headline tracking-tight text-primary">{featuredInstallerProfile.name}</h1>
                    <p className="text-muted-foreground">{featuredInstallerProfile.tagline}</p>
                    <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4 text-accent" /> <span>{featuredInstallerProfile.location}</span>
                        <Star className="w-4 h-4 text-yellow-500" /> <span>{featuredInstallerProfile.rating} ({featuredInstallerProfile.reviews} reviews)</span>
                    </div>
                </div>
                {/* Request a Quote button might need to be smarter if this is a generic showcase */}
                <Button className="mt-4 md:mt-0 md:ml-auto bg-accent text-accent-foreground hover:bg-accent/90">
                    Request Information
                </Button>
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-headline tracking-tight flex items-center"><Award className="w-7 h-7 mr-2 text-primary" /> Project Showcase</h2>
        {isInstaller && !isLoadingAuth && (
          <Button variant="outline" asChild>
            <Link href="/installer/portfolio/add-project">
              <PlusCircle className="w-5 h-5 mr-2" /> Add New Project
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sampleProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      {sampleProjects.length === 0 && (
        <Card className="col-span-full text-center py-12">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Briefcase className="w-16 h-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-headline">No Projects Yet</CardTitle>
            <CardDescription>Explore inspiring solar installations from our community of installers.</CardDescription>
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
          Installers: Log in to add your projects to the showcase.
        </p>
    </div>
  );
}

