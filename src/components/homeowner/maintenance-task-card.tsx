
"use client";

import type { MaintenanceTask } from "@/lib/mock-data/maintenance";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, CalendarDays, CheckCircle2, AlertCircle, Clock, Film, Search } from "lucide-react"; // Changed PlayCircle to Film
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";

interface MaintenanceTaskCardProps {
  task: MaintenanceTask;
  onMarkComplete: (taskId: string) => void;
  onViewGuide: (taskId: string) => void;
}

export function MaintenanceTaskCard({ task, onMarkComplete, onViewGuide }: MaintenanceTaskCardProps) {
  
  const formatDate = (dateInput?: MaintenanceTask["nextDue"] | MaintenanceTask["lastCompleted"]): string | null => {
    if (!dateInput) return null;
    let dateToFormat: Date;
    if (typeof dateInput === 'string') {
      dateToFormat = parseISO(dateInput);
    } else if (dateInput instanceof Date) {
      dateToFormat = dateInput;
    } else if (typeof dateInput === 'object' && 'toDate' in dateInput) { // Firestore Timestamp
      dateToFormat = dateInput.toDate();
    } else {
      return String(dateInput); // Fallback if unknown type
    }

    if (!isValid(dateToFormat)) return String(dateInput); // Return original if parsing/conversion results in invalid date
    
    try {
      return format(dateToFormat, "MMM dd, yyyy");
    } catch (e) {
      return String(dateInput); 
    }
  };
  
  const nextDueDateFormatted = formatDate(task.nextDue);
  const lastCompletedDateFormatted = formatDate(task.lastCompleted);
  const isOverdue = task.nextDue && new Date(task.nextDue as string) < new Date() && !task.isCompleted;


  const getTaskTypeColor = (type: MaintenanceTask["taskType"]) => {
    switch (type) {
      case "cleaning": return "bg-blue-100 text-blue-800 border-blue-300";
      case "inspection": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "check": return "bg-purple-100 text-purple-800 border-purple-300";
      case "professional_service": return "bg-red-100 text-red-800 border-red-300";
      case "diy": return "bg-green-100 text-green-800 border-green-300";
      case "custom": return "bg-indigo-100 text-indigo-800 border-indigo-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  return (
    <Card className={cn(
        "shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col",
        task.isCompleted && "bg-muted/50 opacity-70",
        isOverdue && "border-destructive border-2"
      )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-headline flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-primary" /> {task.taskTitle}
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs capitalize", getTaskTypeColor(task.taskType))}>{task.taskType.replace("_", " ")}</Badge>
        </div>
        <CardDescription className="text-xs line-clamp-2 h-8">{task.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
          <span>Frequency: <span className="font-medium capitalize">{task.frequency}</span></span>
        </div>
        {nextDueDateFormatted && (
          <div className={cn("flex items-center", isOverdue ? "text-destructive font-semibold" : "text-muted-foreground")}>
            {isOverdue ? <AlertCircle className="w-4 h-4 mr-2" /> : <CalendarDays className="w-4 h-4 mr-2" />}
            <span>Next Due: {nextDueDateFormatted}</span>
          </div>
        )}
        {lastCompletedDateFormatted && (
          <div className="flex items-center text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
            <span>Last Completed: {lastCompletedDateFormatted}</span>
          </div>
        )}
        {task.estimatedDurationMinutes && (
            <div className="flex items-center text-muted-foreground text-xs">
                <Clock className="w-3 h-3 mr-1.5"/>
                <span>Est. Duration: {task.estimatedDurationMinutes} min</span>
            </div>
        )}
         {task.notes && <p className="text-xs italic text-muted-foreground pt-1 line-clamp-2">Note: {task.notes}</p>}
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewGuide(task.id)}
          disabled={task.taskType === "professional_service"}
        >
          {task.taskType === "professional_service" ? <Search className="w-4 h-4 mr-2" /> : <Film className="w-4 h-4 mr-2" />} 
          {task.taskType === "professional_service" ? "Find Pro" : "View Guide"}
        </Button>
        <Button
          size="sm"
          onClick={() => onMarkComplete(task.id)}
          disabled={task.isCompleted}
          className={cn(task.isCompleted ? "bg-green-600 hover:bg-green-700" : "bg-accent text-accent-foreground hover:bg-accent/90")}
        >
          {task.isCompleted ? <><CheckCircle2 className="w-4 h-4 mr-2"/>Completed</> : "Mark Complete"}
        </Button>
      </CardFooter>
    </Card>
  );
}
