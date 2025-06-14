
"use client";

import type { MaintenanceTask } from "@/lib/mock-data/maintenance";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, CalendarDays, CheckCircle2, AlertCircle, Clock, PlayCircle, Search } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";

interface MaintenanceTaskCardProps {
  task: MaintenanceTask;
  onMarkComplete: (taskId: string) => void; // Simulate completion
  onViewGuide: (taskId: string) => void; // Simulate viewing guide
}

export function MaintenanceTaskCard({ task, onMarkComplete, onViewGuide }: MaintenanceTaskCardProps) {
  const isOverdue = task.nextDue && new Date(task.nextDue) < new Date() && !task.isCompleted;

  const formatDate = (dateString?: string): string | null => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  };

  const nextDueDateFormatted = formatDate(task.nextDue);
  const lastCompletedDateFormatted = formatDate(task.lastCompleted);

  const getTaskTypeColor = (type: MaintenanceTask["taskType"]) => {
    switch (type) {
      case "cleaning": return "bg-blue-100 text-blue-800 border-blue-300";
      case "inspection": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "check": return "bg-purple-100 text-purple-800 border-purple-300";
      case "professional_service": return "bg-red-100 text-red-800 border-red-300";
      case "diy": return "bg-green-100 text-green-800 border-green-300";
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
          <Badge variant="outline" className={cn("text-xs", getTaskTypeColor(task.taskType))}>{task.taskType.replace("_", " ")}</Badge>
        </div>
        <CardDescription className="text-xs line-clamp-2">{task.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
          <span>Frequency: <span className="font-medium">{task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1)}</span></span>
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
         {task.notes && <p className="text-xs italic text-muted-foreground pt-1">Note: {task.notes}</p>}
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewGuide(task.id)}
          disabled={task.taskType === "professional_service"}
        >
          <PlayCircle className="w-4 h-4 mr-2" /> View Guide
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
