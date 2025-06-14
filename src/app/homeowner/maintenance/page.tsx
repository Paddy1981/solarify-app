
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { MaintenanceTaskCard } from '@/components/homeowner/maintenance-task-card';
import { sampleMaintenanceTasks, type MaintenanceTask } from '@/lib/mock-data/maintenance';
import { Wrench, Calendar, Settings, BookOpen, Search, Info, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MaintenanceHubPage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(sampleMaintenanceTasks);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [selectedTaskForGuide, setSelectedTaskForGuide] = useState<MaintenanceTask | null>(null);
  const { toast } = useToast();

  const handleMarkComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isCompleted: true, lastCompleted: new Date().toISOString().split('T')[0] } : task
      )
    );
    const completedTask = tasks.find(t => t.id === taskId);
    toast({
      title: "Task Updated",
      description: `Task "${completedTask?.taskTitle || 'Item'}" marked as complete.`,
    });
  };

  const handleViewGuide = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.taskType !== "professional_service") {
      setSelectedTaskForGuide(task);
      setIsGuideModalOpen(true);
    } else if (task) {
        toast({
            title: "Professional Service",
            description: `"${task.taskTitle}" should be performed by a qualified professional.`,
            variant: "default"
        })
    }
  };
  
  // Sort tasks: not completed first, then by nextDue date (earliest first)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    if (a.nextDue && b.nextDue) {
      return new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime();
    }
    if (a.nextDue) return -1; // Tasks with due dates first
    if (b.nextDue) return 1;
    return 0;
  });

  return (
    <div className="space-y-8">
      <Card className="shadow-xl bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="text-center py-8">
          <div className="flex justify-center mb-4">
            <Wrench className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-headline tracking-tight">Solar Maintenance Hub</CardTitle>
          <CardDescription className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Keep your solar system performing optimally with regular maintenance. Track tasks, view guides, and get reminders.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-end">
         <Button variant="outline" onClick={() => toast({title: "Coming Soon!", description: "Functionality to add custom tasks will be available later."})}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Task
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-accent">Upcoming & Due Maintenance</CardTitle>
          <CardDescription>Manage your scheduled solar system care tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTasks.map(task => (
                <MaintenanceTaskCard
                  key={task.id}
                  task={task}
                  onMarkComplete={handleMarkComplete}
                  onViewGuide={handleViewGuide}
                />
              ))}
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Maintenance Tasks</AlertTitle>
              <AlertDescription>
                There are no maintenance tasks currently configured. You can add standard or custom tasks.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isGuideModalOpen} onOpenChange={setIsGuideModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-primary" /> 
                DIY Guide: {selectedTaskForGuide?.taskTitle}
            </DialogTitle>
            <DialogDescription>
              {selectedTaskForGuide?.description || "General maintenance information."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3 text-sm">
            <p className="font-semibold">Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Safety first! Ensure the system is powered down if required.</li>
                <li>Gather necessary tools: (e.g., soft brush, squeegee, hose with nozzle - for panel cleaning).</li>
                <li>Follow specific instructions for <span className="font-medium">{selectedTaskForGuide?.taskTitle || "the task"}</span>. (Detailed steps for each guide will be available here).</li>
                <li>Inspect for any damage or unusual signs during the process.</li>
                <li>Log completion and any observations.</li>
            </ol>
            <p className="font-semibold mt-3">Video Tutorial (Placeholder):</p>
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                <PlayCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">Detailed video instructions will be embedded here.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close Guide</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Calendar className="mr-2 h-5 w-5 text-primary" /> Maintenance Calendar</CardTitle>
            <CardDescription>Visual overview of your maintenance schedule. (Coming Soon)</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center bg-muted/30 rounded-b-md">
            <p className="text-muted-foreground">Interactive calendar view will be here.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" /> DIY Guides Library</CardTitle>
            <CardDescription>Access detailed step-by-step maintenance guides. (More guides coming soon)</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center bg-muted/30 rounded-b-md">
            <p className="text-muted-foreground">Library of DIY guides will be displayed here.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Search className="mr-2 h-5 w-5 text-primary" /> Find Service Providers</CardTitle>
            <CardDescription>Connect with local professionals for complex tasks. (Coming Soon)</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center bg-muted/30 rounded-b-md">
            <p className="text-muted-foreground">Service provider integration will be here.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" /> Reminder Settings</CardTitle>
            <CardDescription>Customize your maintenance reminder preferences. (Coming Soon)</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center bg-muted/30 rounded-b-md">
            <p className="text-muted-foreground">Notification settings form will be here.</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
