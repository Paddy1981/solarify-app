// =============================================================================
// Notification Settings Screen
// =============================================================================
// Allows users to manage push notification preferences and permissions
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { LoadingButton } from '../../components/ui/LoadingButton';

export interface NotificationSettingsProps {
  onBack?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [pushState, pushActions] = usePushNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        pushActions.refreshNotifications(),
      ]);
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
    setRefreshing(false);
  };

  const handleRequestPermissions = async () => {
    try {
      const result = await pushActions.requestPermissions();
      
      if (result.granted) {
        Alert.alert(
          'Notifications Enabled',
          'You will now receive push notifications for your solar projects.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Notifications Denied',
          result.message || 'Push notifications were not enabled. You can enable them later in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    try {
      await pushActions.updatePreferences({ [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will remove all your notification history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await pushActions.clearAllNotifications();
              Alert.alert('Success', 'All notifications have been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const renderPermissionSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Push Notification Permissions</Text>
      
      <View style={styles.permissionCard}>
        <View style={styles.permissionStatus}>
          <Text style={styles.permissionIcon}>
            {pushState.permissionGranted ? '✅' : '❌'}
          </Text>
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionText}>
              Push Notifications
            </Text>
            <Text style={styles.permissionSubtext}>
              {pushState.permissionGranted 
                ? 'Enabled - You\'ll receive notifications'
                : 'Disabled - Enable to receive notifications'
              }
            </Text>
          </View>
        </View>
        
        {!pushState.permissionGranted && (
          <LoadingButton
            title="Enable Notifications"
            onPress={handleRequestPermissions}
            loading={pushState.permissionLoading}
            style={styles.enableButton}
            size="small"
          />
        )}
        
        {pushState.fcmToken && (
          <View style={styles.tokenInfo}>
            <Text style={styles.tokenLabel}>Device Token:</Text>
            <Text style={styles.tokenText} numberOfLines={1}>
              {pushState.fcmToken.substring(0, 20)}...
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderNotificationTypes = () => {
    if (!pushState.permissionGranted) return null;

    const notificationTypes = [
      {
        key: 'quote_updates',
        title: 'Quote Updates',
        description: 'Get notified when you receive new quotes or quote status changes',
        icon: '💰',
      },
      {
        key: 'rfq_status_changes',
        title: 'RFQ Status Changes',
        description: 'Know when installers view or respond to your RFQs',
        icon: '📋',
      },
      {
        key: 'installation_updates',
        title: 'Installation Updates',
        description: 'Stay updated on your solar installation progress',
        icon: '🔧',
      },
      {
        key: 'system_alerts',
        title: 'System Alerts',
        description: 'Important alerts about your account or the app',
        icon: '⚠️',
      },
      {
        key: 'marketing_messages',
        title: 'Marketing Messages',
        description: 'Promotional content and solar industry news',
        icon: '📢',
      },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        <Text style={styles.sectionSubtitle}>
          Choose which types of notifications you'd like to receive
        </Text>
        
        {notificationTypes.map((type) => (
          <View key={type.key} style={styles.notificationItem}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationIcon}>{type.icon}</Text>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>{type.title}</Text>
                <Text style={styles.notificationDescription}>
                  {type.description}
                </Text>
              </View>
              <Switch
                value={pushState.preferences[type.key as keyof typeof pushState.preferences]}
                onValueChange={(value) => handlePreferenceChange(type.key, value)}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor={pushState.preferences[type.key as keyof typeof pushState.preferences] ? '#ffffff' : '#f4f3f4'}
                disabled={pushState.preferencesLoading}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderNotificationHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notification History</Text>
      
      <View style={styles.historyCard}>
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Total Notifications:</Text>
          <Text style={styles.historyValue}>{pushState.notifications.length}</Text>
        </View>
        
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Unread:</Text>
          <Text style={[styles.historyValue, styles.unreadValue]}>
            {pushState.unreadCount}
          </Text>
        </View>
        
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Most Recent:</Text>
          <Text style={styles.historyValue}>
            {pushState.notifications.length > 0
              ? formatDate(pushState.notifications[0].received_at)
              : 'No notifications'
            }
          </Text>
        </View>
      </View>
      
      {pushState.notifications.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearAllNotifications}
        >
          <Text style={styles.clearButtonText}>Clear All Notifications</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTroubleshooting = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Troubleshooting</Text>
      
      <View style={styles.troubleshootingCard}>
        <Text style={styles.troubleshootingTitle}>Not receiving notifications?</Text>
        
        <View style={styles.troubleshootingItem}>
          <Text style={styles.troubleshootingBullet}>•</Text>
          <Text style={styles.troubleshootingText}>
            Check your device notification settings for Solarify
          </Text>
        </View>
        
        <View style={styles.troubleshootingItem}>
          <Text style={styles.troubleshootingBullet}>•</Text>
          <Text style={styles.troubleshootingText}>
            Ensure you have a stable internet connection
          </Text>
        </View>
        
        <View style={styles.troubleshootingItem}>
          <Text style={styles.troubleshootingBullet}>•</Text>
          <Text style={styles.troubleshootingText}>
            Try logging out and back in to refresh your notification token
          </Text>
        </View>
        
        <View style={styles.troubleshootingItem}>
          <Text style={styles.troubleshootingBullet}>•</Text>
          <Text style={styles.troubleshootingText}>
            Make sure the app is updated to the latest version
          </Text>
        </View>
      </View>
    </View>
  );

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor={'#007AFF'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderPermissionSection()}
        {renderNotificationTypes()}
        {renderNotificationHistory()}
        {renderTroubleshooting()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  permissionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  permissionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  enableButton: {
    marginBottom: 12,
  },
  tokenInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  tokenLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333333',
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyLabel: {
    fontSize: 14,
    color: '#666666',
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  unreadValue: {
    color: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  troubleshootingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  troubleshootingItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  troubleshootingBullet: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 8,
    marginTop: 2,
  },
  troubleshootingText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});