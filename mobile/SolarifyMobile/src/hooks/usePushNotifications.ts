// =============================================================================
// usePushNotifications Hook
// =============================================================================
// React hook for managing push notifications in components
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService, NotificationPermissionStatus, NotificationPreferences } from '../services/push-notification.service';
import { PushNotification } from '../types';

export interface PushNotificationState {
  // Permission status
  permissionGranted: boolean;
  permissionLoading: boolean;
  permissionError?: string;
  
  // Token status
  fcmToken?: string;
  tokenLoading: boolean;
  
  // Notifications
  notifications: PushNotification[];
  unreadCount: number;
  notificationsLoading: boolean;
  
  // Preferences
  preferences: NotificationPreferences;
  preferencesLoading: boolean;
  
  // Service status
  isInitialized: boolean;
}

export interface PushNotificationActions {
  // Permissions
  requestPermissions: () => Promise<NotificationPermissionStatus>;
  
  // Notifications
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  
  // Topics
  subscribeToTopic: (topic: string) => Promise<void>;
  unsubscribeFromTopic: (topic: string) => Promise<void>;
  
  // Manual initialization
  initializeService: () => Promise<void>;
}

export function usePushNotifications(): [PushNotificationState, PushNotificationActions] {
  const [state, setState] = useState<PushNotificationState>({
    permissionGranted: false,
    permissionLoading: false,
    tokenLoading: false,
    notifications: [],
    unreadCount: 0,
    notificationsLoading: false,
    preferences: {
      quote_updates: true,
      rfq_status_changes: true,
      installation_updates: true,
      marketing_messages: false,
      system_alerts: true,
    },
    preferencesLoading: false,
    isInitialized: false,
  });

  // Initialize service on mount
  useEffect(() => {
    initializeService();
  }, []);

  // Set up notification message handler
  useEffect(() => {
    if (!state.isInitialized) return;

    const unsubscribe = pushNotificationService.addMessageHandler((notification) => {
      console.log('New notification received in hook:', notification);
      
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications],
        unreadCount: prev.unreadCount + 1,
      }));
    });

    return unsubscribe;
  }, [state.isInitialized]);

  const initializeService = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, permissionLoading: true, tokenLoading: true }));

      // Initialize the service
      await pushNotificationService.initialize();
      
      // Get current status
      const [fcmToken, notifications, preferences] = await Promise.all([
        pushNotificationService.getCurrentToken(),
        pushNotificationService.getStoredNotifications(),
        pushNotificationService.getNotificationPreferences(),
      ]);

      const unreadCount = notifications.filter(n => !n.read).length;

      setState(prev => ({
        ...prev,
        isInitialized: true,
        permissionGranted: true, // If initialization succeeded, permissions were granted
        permissionLoading: false,
        fcmToken: fcmToken || undefined,
        tokenLoading: false,
        notifications,
        unreadCount,
        preferences,
      }));

      console.log('Push notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      setState(prev => ({
        ...prev,
        permissionLoading: false,
        tokenLoading: false,
        permissionError: (error as Error).message,
      }));
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<NotificationPermissionStatus> => {
    try {
      setState(prev => ({ ...prev, permissionLoading: true, permissionError: undefined }));

      const permissionStatus = await pushNotificationService.requestPermissions();
      
      setState(prev => ({
        ...prev,
        permissionLoading: false,
        permissionGranted: permissionStatus.granted,
        permissionError: permissionStatus.granted ? undefined : permissionStatus.message,
      }));

      // If permissions were granted, try to get the FCM token
      if (permissionStatus.granted) {
        setState(prev => ({ ...prev, tokenLoading: true }));
        
        const token = await pushNotificationService.getFCMToken();
        
        setState(prev => ({
          ...prev,
          tokenLoading: false,
          fcmToken: token || undefined,
        }));
      }

      return permissionStatus;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      setState(prev => ({
        ...prev,
        permissionLoading: false,
        permissionError: (error as Error).message,
      }));
      
      return {
        granted: false,
        denied: true,
        message: (error as Error).message,
      };
    }
  }, []);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, notificationsLoading: true }));

      const notifications = await pushNotificationService.getStoredNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;

      setState(prev => ({
        ...prev,
        notifications,
        unreadCount,
        notificationsLoading: false,
      }));
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      setState(prev => ({ ...prev, notificationsLoading: false }));
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await pushNotificationService.markNotificationAsRead(notificationId);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const clearAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await pushNotificationService.clearAllNotifications();
      
      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      throw error;
    }
  }, []);

  const updatePreferences = useCallback(async (preferences: Partial<NotificationPreferences>): Promise<void> => {
    try {
      setState(prev => ({ ...prev, preferencesLoading: true }));

      const updatedPreferences = { ...state.preferences, ...preferences };
      await pushNotificationService.updateNotificationPreferences(updatedPreferences);
      
      setState(prev => ({
        ...prev,
        preferences: updatedPreferences,
        preferencesLoading: false,
      }));
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      setState(prev => ({ ...prev, preferencesLoading: false }));
      throw error;
    }
  }, [state.preferences]);

  const subscribeToTopic = useCallback(async (topic: string): Promise<void> => {
    try {
      await pushNotificationService.subscribeToTopic(topic);
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }, []);

  const unsubscribeFromTopic = useCallback(async (topic: string): Promise<void> => {
    try {
      await pushNotificationService.unsubscribeFromTopic(topic);
    } catch (error) {
      console.error(`Failed to unsubscribe from topic ${topic}:`, error);
      throw error;
    }
  }, []);

  const actions: PushNotificationActions = {
    requestPermissions,
    refreshNotifications,
    markAsRead,
    clearAllNotifications,
    updatePreferences,
    subscribeToTopic,
    unsubscribeFromTopic,
    initializeService,
  };

  return [state, actions];
}