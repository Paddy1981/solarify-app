
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db, serverTimestamp } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, type Timestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { MaintenanceTaskCard } from '@/components/homeowner/maintenance-task-card';
import type { MaintenanceTask, MaintenanceTaskFrequency, MaintenanceTaskType } from '@/lib/mock-data/maintenance';
import { Wrench, Calendar, Settings, BookOpen, Search, Info, PlusCircle, Film, Loader2, UserCircle as AlertUserCircle, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const taskFrequencies: MaintenanceTaskFrequency[] = ["monthly", "quarterly", "bi-annually", "annually", "as-needed"];
const taskTypes: MaintenanceTaskType[] = ["cleaning", "inspection", "check", "professional_service", "diy", "custom"];

const addTaskFormSchema = z.object({
  taskTitle: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(5, "Description is required."),
  taskType: z.enum(taskTypes, { required_error: "Please select a task type."}),
  frequency: z.enum(taskFrequencies, { required_error: "Please select a frequency."}),
  nextDue: z.string().optional().refine(val => !val || !isNaN(new Date(val).getTime()), {message: "Invalid date"}),
  estimatedDurationMinutes: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
});
type AddTaskFormData = z.infer<typeof addTaskFormSchema>;


function MaintenanceLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 w-full" />
      <div className="flex justify-end">
        <Skeleton className="h-10 w-36" />
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-7 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-5 w-2/3" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></CardContent><CardFooter><Skeleton className="h-9 w-full" /></CardFooter></Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


export default function MaintenanceHubPage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedTaskForGuide, setSelectedTaskForGuide] = useState<MaintenanceTask | null>(null);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);


  const addTaskForm = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskFormSchema),
    defaultValues: {
      taskTitle: "",
      description: "",
      taskType: "custom",
      frequency: "as-needed",
      nextDue: "",
      estimatedDurationMinutes: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchTasks(user.uid);
      } else {
        setTasks([]);
        setIsLoadingTasks(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchTasks = async (userId: string) => {
    setIsLoadingTasks(true);
    try {
      const tasksRef = collection(db, "maintenanceTasks");
      const q = query(tasksRef, where("userId", "==", userId), orderBy("nextDue", "asc"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedTasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure dates are Date objects if they are Timestamps
        nextDue: doc.data().nextDue?.toDate ? doc.data().nextDue.toDate().toISOString().split('T')[0] : doc.data().nextDue,
        lastCompleted: doc.data().lastCompleted?.toDate ? doc.data().lastCompleted.toDate().toISOString().split('T')[0] : doc.data().lastCompleted,
      } as MaintenanceTask));
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching maintenance tasks:", error);
      toast({ title: "Error", description: "Could not fetch maintenance tasks.", variant: "destructive" });
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    if (!currentUser) return;
    const taskDocRef = doc(db, "maintenanceTasks", taskId);
    try {
      await updateDoc(taskDocRef, {
        isCompleted: true,
        lastCompleted: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Task Updated", description: "Task marked as complete." });
      fetchTasks(currentUser.uid); // Re-fetch to update UI
    } catch (error) {
      console.error("Error marking task complete:", error);
      toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    }
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
        });
    }
  };

  const handleAddTaskSubmit: SubmitHandler<AddTaskFormData> = async (data) => {
    if (!currentUser) {
        toast({title: "Not Authenticated", description: "You must be logged in to add tasks.", variant: "destructive"});
        return;
    }
    setIsSubmittingTask(true);
    try {
        const newTaskData: Omit<MaintenanceTask, 'id'> = {
            userId: currentUser.uid,
            taskTitle: data.taskTitle,
            description: data.description,
            taskType: data.taskType,
            frequency: data.frequency,
            nextDue: data.nextDue ? new Date(data.nextDue) : undefined, // Store as Date, Firestore converts to Timestamp
            estimatedDurationMinutes: data.estimatedDurationMinutes,
            notes: data.notes,
            isCompleted: false,
            createdAt: serverTimestamp() as any, // Cast for serverTimestamp
            updatedAt: serverTimestamp() as any,
        };
        await addDoc(collection(db, "maintenanceTasks"), newTaskData);
        toast({title: "Task Added", description: `"${data.taskTitle}" has been added.`});
        setIsAddTaskModalOpen(false);
        addTaskForm.reset();
        fetchTasks(currentUser.uid); // Re-fetch tasks
    } catch (error) {
        console.error("Error adding task:", error);
        toast({title: "Error Adding Task", description: "Could not save the new task.", variant: "destructive"});
    } finally {
        setIsSubmittingTask(false);
    }
  };
  
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.nextDue && b.nextDue) {
      const dateA = new Date(a.nextDue as string).getTime();
      const dateB = new Date(b.nextDue as string).getTime();
      return dateA - dateB;
    }
    if (a.nextDue) return -1;
    if (b.nextDue) return 1;
    return 0;
  });

  if (isLoadingTasks && !currentUser) { // Initial load before auth state is known
    return <MaintenanceLoadingSkeleton />;
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-6">
        <LogIn className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl font-headline mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Please log in to manage your solar system maintenance.
        </p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }


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
        <Dialog open={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add New Maintenance Task</DialogTitle>
                    <DialogDescription>Fill in the details for your custom maintenance task.</DialogDescription>
                </DialogHeader>
                <Form {...addTaskForm}>
                    <form onSubmit={addTaskForm.handleSubmit(handleAddTaskSubmit)} className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
                        <FormField control={addTaskForm.control} name="taskTitle" render={({ field }) => (
                            <FormItem><FormLabel>Task Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={addTaskForm.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={addTaskForm.control} name="taskType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Task Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                        <SelectContent>{taskTypes.map(type => <SelectItem key={type} value={type}>{type.replace("_", " ")}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={addTaskForm.control} name="frequency" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Frequency</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger></FormControl>
                                        <SelectContent>{taskFrequencies.map(freq => <SelectItem key={freq} value={freq}>{freq}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={addTaskForm.control} name="nextDue" render={({ field }) => (
                            <FormItem><FormLabel>Next Due Date (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={addTaskForm.control} name="estimatedDurationMinutes" render={({ field }) => (
                            <FormItem><FormLabel>Est. Duration (Minutes, Optional)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={addTaskForm.control} name="notes" render={({ field }) => (
                            <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter className="pt-4">
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingTask}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmittingTask}>
                                {isSubmittingTask ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Add Task"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-accent">Upcoming & Due Maintenance</CardTitle>
          <CardDescription>Manage your scheduled solar system care tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTasks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                     <Card key={i}><CardHeader><Skeleton className="h-5 w-2/3" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></CardContent><CardFooter><Skeleton className="h-9 w-full" /></CardFooter></Card>
                ))}
            </div>
          ) : sortedTasks.length > 0 ? (
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
                You haven't added any maintenance tasks yet. Click "Add Custom Task" to get started.
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
                <Film className="w-12 h-12 text-muted-foreground" />
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
