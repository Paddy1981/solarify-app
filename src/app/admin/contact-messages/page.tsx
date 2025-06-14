
"use client";

import React, { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { auth, rtdb } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Inbox, UserCircle, LogIn, ArrowLeft, MessageSquare, CalendarDays, Hash, Tag } from 'lucide-react';
import Link from 'next/link';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  timestamp: number; // RTDB timestamps are numbers
  status: string;
}

function ContactMessageSkeleton() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-1/4" />
      </CardFooter>
    </Card>
  );
}

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser || authLoading) return; // Don't fetch if not logged in or auth is loading

    setIsLoading(true);
    const messagesRef = ref(rtdb, 'contactMessages');
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages: ContactMessage[] = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
        setMessages(loadedMessages);
      } else {
        setMessages([]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching contact messages from RTDB:", error);
      setIsLoading(false);
      // Add toast notification for error
    });

    return () => unsubscribeMessages();
  }, [currentUser, authLoading]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading authentication status...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <LogIn className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl font-headline mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Please log in to view contact messages. This area is typically for administrators.
        </p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-headline">Contact Form Submissions</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Review messages submitted through the contact form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
              {[...Array(3)].map((_, i) => <ContactMessageSkeleton key={i} />)}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-semibold">No Messages Yet</h2>
              <p className="text-muted-foreground">The inbox is currently empty.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-25rem)] pr-4">
              <div className="space-y-6">
                {messages.map((msg) => (
                  <Card key={msg.id} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-semibold flex items-center">
                             <MessageSquare className="w-5 h-5 mr-2 text-accent" /> {msg.subject}
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">
                            From: {msg.name} ({msg.email})
                          </CardDescription>
                        </div>
                        <Badge variant={msg.status === 'new' ? 'default' : 'secondary'} className="capitalize text-xs">
                          {msg.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center">
                            <Tag className="w-3.5 h-3.5 mr-1.5" />
                            Category: <span className="font-medium ml-1">{msg.category}</span>
                        </div>
                        <div className="flex items-center">
                            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                             Received: {format(new Date(msg.timestamp), "PPP p")}
                        </div>
                        <div className="flex items-center">
                           <Hash className="w-3.5 h-3.5 mr-1.5" />
                           ID: <span className="font-medium ml-1">{msg.id.substring(0,8)}...</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" size="sm" disabled>Mark as Read</Button>
                      <Button size="sm" disabled>Reply (Placeholder)</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
         <CardFooter className="border-t pt-4 text-center">
            <Button variant="outline" asChild>
                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Homepage</Link>
            </Button>
         </CardFooter>
      </Card>
    </div>
  );
}
