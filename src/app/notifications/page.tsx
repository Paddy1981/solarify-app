"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Inbox, ArrowLeft, ExternalLink } from "lucide-react";
import { useNotifications } from '@/hooks/use-notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-1" />
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-2/3 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <NotificationsSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/homeowner/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-headline tracking-tight text-accent flex items-center">
            <Bell className="w-8 h-8 mr-3" />
            Notifications
          </h1>
          <p className="text-lg text-foreground/70">Stay updated with your solar journey.</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              {unreadCount} unread
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="text-center py-12 shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Inbox className="w-16 h-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-headline">No Notifications</CardTitle>
            <CardDescription>
              You're all caught up! Notifications will appear here when there's activity on your account.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl ${
                !notification.isRead ? 'ring-2 ring-blue-200 bg-blue-50/50' : 'hover:bg-muted/30'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className={`text-lg font-headline ${
                      !notification.isRead ? 'font-bold' : ''
                    }`}>
                      {notification.title}
                      {!notification.isRead && (
                        <Badge className="ml-2 bg-blue-500">New</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        {format(
                          notification.createdAt.toDate ? 
                            notification.createdAt.toDate() : 
                            new Date(notification.createdAt),
                          'MMMM dd, yyyy \'at\' h:mm a'
                        )}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {notification.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </CardDescription>
                  </div>
                  {!notification.isRead && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-foreground/80 mb-4">
                  {notification.message}
                </p>

                {notification.actionUrl && (
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    className="flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={notification.actionUrl}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                )}

                {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Additional Details:</p>
                    <div className="space-y-1">
                      {notification.metadata.rfqId && (
                        <p className="text-xs">RFQ ID: {notification.metadata.rfqId}</p>
                      )}
                      {notification.metadata.quoteId && (
                        <p className="text-xs">Quote ID: {notification.metadata.quoteId}</p>
                      )}
                      {notification.metadata.orderId && (
                        <p className="text-xs">Order ID: {notification.metadata.orderId}</p>
                      )}
                      {notification.metadata.projectId && (
                        <p className="text-xs">Project ID: {notification.metadata.projectId}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">
          Notifications are automatically cleared after 30 days. Important notifications will be sent to your email as well.
        </p>
      </div>
    </div>
  );
}