
"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, CalendarDays, Zap } from "lucide-react";
import { useState, useEffect } from 'react';

interface Project {
  id: string;
  title: string;
  imageUrl?: string; // Made optional
  imageHint?: string; // Made optional
  description: string;
  location: string;
  dateCompleted: string;
  systemSize: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [formattedDate, setFormattedDate] = useState(project.dateCompleted);

  useEffect(() => {
    try {
      setFormattedDate(new Date(project.dateCompleted).toLocaleDateString());
    } catch (e) {
      setFormattedDate(project.dateCompleted);
    }
  }, [project.dateCompleted]);

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="relative w-full h-48 bg-muted/30"> {/* Added bg for consistency if image is missing */}
        <Image
          src={project.imageUrl || 'https://placehold.co/600x400.png'}
          alt={project.title}
          data-ai-hint={project.imageHint || "solar project"}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <CardHeader>
        <CardTitle className="font-headline text-xl">{project.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        <div className="flex items-center text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2 text-accent" />
          <span>{project.location}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <CalendarDays className="w-4 h-4 mr-2 text-accent" />
          <span>Completed: {formattedDate}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Zap className="w-4 h-4 mr-2 text-accent" />
          <span>System Size: {project.systemSize}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View Project Details</Button>
      </CardFooter>
    </Card>
  );
}
