// =============================================================================
// Push Notification Service for Mobile
// =============================================================================
// Handles Firebase Cloud Messaging (FCM) for push notifications
// =============================================================================

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { PushNotification } from '../types';

export interface NotificationPermissionStatus {
  granted: boolean;
  denied: boolean;
  provisional?: boolean;
  message?: string;
}

export interface NotificationPreferences {
  quote_updates: boolean;
  rfq_status_changes: boolean;
  installation_updates: boolean;
  marketing_messages: boolean;
  system_alerts: boolean;
}

export interface PushNotificationPayload {
  notification: {
    title: string;
    body: string;
    image?: string;
  };
  data: {
    type: 'quote_received' | 'rfq_viewed' | 'installation_update' | 'system_alert';
    rfq_id?: string;
    quote_id?: string;
    deep_link?: string;
    [key: string]: string | undefined;
  };
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private fcmToken: string | null = null;
  private isInitialized: boolean = false;
  private messageHandlers: Array<(notification: PushNotification) => void> = [];
  private backgroundMessageHandlers: Array<(remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void> = [];

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notification service
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing PushNotificationService...');
      
      // Request permissions
      const permissionStatus = await this.requestPermissions();
      
      if (!permissionStatus.granted) {
        console.warn('Push notification permissions not granted');
        return;
      }

      // Get FCM token
      await this.getFCMToken();

      // Set up message handlers
      this.setupMessageHandlers();

      // Set up token refresh listener
      this.setupTokenRefreshListener();

      this.isInitialized = true;
      console.log('PushNotificationService initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize PushNotificationService:', error);
      throw error;
    }
  }

  /**
   * Request push notification permissions
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        
        const granted = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
                        
        const provisional = authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        return {
          granted,
          denied: !granted,
          provisional,
          message: granted 
            ? 'iOS push notifications enabled'
            : 'iOS push notifications denied',
        };
      } else {
        // Android
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Solarify Notifications',
            message: 'Solarify needs notification permissions to keep you updated about your solar projects.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        
        return {
          granted: isGranted,
          denied: !isGranted,
          message: isGranted
            ? 'Android push notifications enabled'
            : 'Android push notifications denied',
        };
      }
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return {
        granted: false,
        denied: true,
        message: `Permission request failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get FCM token for this device
   */
  async getFCMToken(): Promise<string | null> {
    try {
      if (this.fcmToken) {
        return this.fcmToken;
      }

      const token = await messaging().getToken();
      
      if (token) {
        this.fcmToken = token;
        await this.storeFCMToken(token);
        console.log('FCM Token obtained:', token.substring(0, 20) + '...');
        
        // Send token to backend for user association
        await this.sendTokenToBackend(token);
      }

      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  /**
   * Setup message handlers for different app states
   */
  private setupMessageHandlers(): void {
    // Handle messages when app is in foreground
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      const notification = this.parseRemoteMessage(remoteMessage);
      
      // Show local notification since FCM doesn't show notifications in foreground
      this.showLocalNotification(notification);
      
      // Notify handlers
      this.messageHandlers.forEach(handler => handler(notification));
    });

    // Handle messages when app is in background
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
      
      // Notify background handlers
      this.backgroundMessageHandlers.forEach(handler => handler(remoteMessage));
      
      // Store notification for later processing
      await this.storeBackgroundNotification(remoteMessage);
    });

    // Handle notification tap when app is killed/background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification tap opened app:', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });

    // Handle notification tap when app was killed
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from killed state via notification:', remoteMessage);
          this.handleNotificationTap(remoteMessage);
        }
      });
  }

  /**
   * Setup FCM token refresh listener
   */
  private setupTokenRefreshListener(): void {
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token refreshed:', token.substring(0, 20) + '...');
      
      this.fcmToken = token;
      await this.storeFCMToken(token);
      
      // Send new token to backend
      await this.sendTokenToBackend(token);
    });
  }

  /**
   * Add message handler for foreground notifications
   */
  addMessageHandler(handler: (notification: PushNotification) => void): () => void {
    this.messageHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Add background message handler
   */
  addBackgroundMessageHandler(handler: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    this.backgroundMessageHandlers.push(handler);
    
    return () => {
      const index = this.backgroundMessageHandlers.indexOf(handler);
      if (index > -1) {
        this.backgroundMessageHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to notification topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from notification topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Failed to unsubscribe from topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
      
      // Update topic subscriptions based on preferences
      const topicMap: Record<keyof NotificationPreferences, string> = {
        quote_updates: 'quote_updates',
        rfq_status_changes: 'rfq_status',
        installation_updates: 'installation_updates',
        marketing_messages: 'marketing',
        system_alerts: 'system_alerts',
      };

      for (const [key, topic] of Object.entries(topicMap)) {
        const prefKey = key as keyof NotificationPreferences;
        if (preferences[prefKey]) {
          await this.subscribeToTopic(topic);
        } else {
          await this.unsubscribeFromTopic(topic);
        }
      }

      console.log('Notification preferences updated:', preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get current notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const prefsString = await AsyncStorage.getItem('notification_preferences');
      
      if (prefsString) {
        return JSON.parse(prefsString);
      }

      // Default preferences
      const defaultPrefs: NotificationPreferences = {
        quote_updates: true,
        rfq_status_changes: true,
        installation_updates: true,
        marketing_messages: false,
        system_alerts: true,
      };

      await this.updateNotificationPreferences(defaultPrefs);
      return defaultPrefs;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      
      return {
        quote_updates: true,
        rfq_status_changes: true,
        installation_updates: true,
        marketing_messages: false,
        system_alerts: true,
      };
    }
  }

  /**
   * Get stored notifications (for offline viewing)
   */
  async getStoredNotifications(): Promise<PushNotification[]> {
    try {
      const notificationsString = await AsyncStorage.getItem('stored_notifications');
      
      if (notificationsString) {
        const notifications = JSON.parse(notificationsString);
        
        // Convert date strings back to Date objects
        return notifications.map((notification: any) => ({
          ...notification,
          received_at: new Date(notification.received_at),
        }));
      }

      return [];
    } catch (error) {
      console.error('Failed to get stored notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );

      await AsyncStorage.setItem('stored_notifications', JSON.stringify(updatedNotifications));
      console.log(`Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Clear all stored notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('stored_notifications');
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      throw error;
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private parseRemoteMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): PushNotification {
    return {
      id: remoteMessage.messageId || `notification_${Date.now()}`,
      type: (remoteMessage.data?.type as any) || 'system_alert',
      title: remoteMessage.notification?.title || 'Solarify',
      body: remoteMessage.notification?.body || 'You have a new notification',
      data: remoteMessage.data ? {
        rfq_id: remoteMessage.data.rfq_id,
        quote_id: remoteMessage.data.quote_id,
        deep_link: remoteMessage.data.deep_link,
      } : undefined,
      received_at: new Date(),
      read: false,
    };
  }

  private showLocalNotification(notification: PushNotification): void {
    // Show alert for foreground notifications
    Alert.alert(
      notification.title,
      notification.body,
      [
        { text: 'Dismiss', style: 'cancel' },
        { 
          text: 'View', 
          onPress: () => this.handleNotificationAction(notification) 
        },
      ]
    );
  }

  private async handleNotificationTap(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    const notification = this.parseRemoteMessage(remoteMessage);
    await this.handleNotificationAction(notification);
  }

  private async handleNotificationAction(notification: PushNotification): Promise<void> {
    // Store the notification as read
    await this.storeNotification({ ...notification, read: true });
    
    // Handle deep linking based on notification type
    const { data } = notification;
    
    if (data?.deep_link) {
      // Handle deep link navigation
      console.log(`Deep link navigation: ${data.deep_link}`);
      // In a real app, you would use your navigation system here
    } else {
      // Default navigation based on type
      switch (notification.type) {
        case 'quote_received':
          if (data?.quote_id) {
            console.log(`Navigate to quote: ${data.quote_id}`);
            // Navigate to quote details screen
          }
          break;
        case 'rfq_viewed':
          if (data?.rfq_id) {
            console.log(`Navigate to RFQ: ${data.rfq_id}`);
            // Navigate to RFQ details screen
          }
          break;
        case 'installation_update':
          console.log('Navigate to installation updates');
          // Navigate to installation status screen
          break;
        default:
          console.log('Navigate to notifications list');
          // Navigate to general notifications screen
      }
    }
  }

  private async storeNotification(notification: PushNotification): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      
      // Add new notification to the beginning
      notifications.unshift(notification);
      
      // Keep only last 100 notifications
      const limitedNotifications = notifications.slice(0, 100);
      
      await AsyncStorage.setItem('stored_notifications', JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  private async storeBackgroundNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    const notification = this.parseRemoteMessage(remoteMessage);
    await this.storeNotification(notification);
  }

  private async storeFCMToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('fcm_token', token);
    } catch (error) {
      console.error('Failed to store FCM token:', error);
    }
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      // This would send the token to your backend API
      // The backend would associate the token with the current user
      console.log('Sending FCM token to backend...');
      
      // Example API call (implement based on your backend)
      /*
      const response = await fetch('/api/users/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          fcm_token: token,
          platform: Platform.OS,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send FCM token to backend');
      }
      */
      
    } catch (error) {
      console.error('Failed to send FCM token to backend:', error);
    }
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.fcmToken;
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();