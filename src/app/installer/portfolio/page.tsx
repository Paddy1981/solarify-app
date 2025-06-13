
import { ProjectCard } from "@/components/installer/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, PlusCircle, UserCircle, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

const installerProfile = {
    name: "ProSolar Installations Inc.",
    tagline: "Your Trusted Partner for Clean Energy Solutions",
    location: "San Francisco Bay Area, CA",
    rating: 4.8,
    reviews: 125,
    yearsInBusiness: 10,
    specialties: ["Residential Solar", "Battery Storage", "EV Charger Installation"],
    avatarUrl: "https://placehold.co/120x120.png"
};


export default function InstallerPortfolioPage() {
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
                    src={installerProfile.avatarUrl}
                    alt={`${installerProfile.name} logo`}
                    data-ai-hint="company logo"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-background shadow-lg"
                />
                <div className="mt-4 md:mt-0 text-center md:text-left">
                    <h1 className="text-3xl font-headline tracking-tight text-primary">{installerProfile.name}</h1>
                    <p className="text-muted-foreground">{installerProfile.tagline}</p>
                    <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4 text-accent" /> <span>{installerProfile.location}</span>
                        <Star className="w-4 h-4 text-yellow-500" /> <span>{installerProfile.rating} ({installerProfile.reviews} reviews)</span>
                    </div>
                </div>
                <Button className="mt-4 md:mt-0 md:ml-auto bg-accent text-accent-foreground hover:bg-accent/90">
                    Request a Quote
                </Button>
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-headline tracking-tight">Completed Projects</h2>
        <Button variant="outline" asChild>
          <Link href="/installer/portfolio/add-project">
            <PlusCircle className="w-5 h-5 mr-2" /> Add New Project
          </Link>
        </Button>
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
            <CardDescription>Start building your portfolio by adding your completed solar installations.</CardDescription>
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
