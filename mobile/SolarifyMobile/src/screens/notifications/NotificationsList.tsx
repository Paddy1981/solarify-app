// =============================================================================
// Notifications List Screen
// =============================================================================
// Displays all received push notifications with filtering and actions
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { PushNotification } from '../../types';

export interface NotificationsListProps {
  onBack?: () => void;
  onNotificationPress?: (notification: PushNotification) => void;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  onBack,
  onNotificationPress,
}) => {
  const insets = useSafeAreaInsets();
  const [pushState, pushActions] = usePushNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // Refresh notifications when component mounts
    pushActions.refreshNotifications();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await pushActions.refreshNotifications();
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: PushNotification) => {
    // Mark as read if unread
    if (!notification.read) {
      await pushActions.markAsRead(notification.id);
    }

    // Handle custom press action or default navigation
    if (onNotificationPress) {
      onNotificationPress(notification);
    } else {
      handleDefaultNavigation(notification);
    }
  };

  const handleDefaultNavigation = (notification: PushNotification) => {
    // Default navigation based on notification type
    switch (notification.type) {
      case 'quote_received':
        Alert.alert('Quote Received', `Navigate to quote: ${notification.data?.quote_id}`);
        break;
      case 'rfq_viewed':
        Alert.alert('RFQ Viewed', `Navigate to RFQ: ${notification.data?.rfq_id}`);
        break;
      case 'installation_update':
        Alert.alert('Installation Update', 'Navigate to installation status');
        break;
      default:
        Alert.alert('Notification', notification.body);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = pushState.notifications.filter(n => !n.read);
    
    if (unreadNotifications.length === 0) {
      Alert.alert('No Unread Notifications', 'All notifications are already marked as read.');
      return;
    }

    try {
      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(notification =>
          pushActions.markAsRead(notification.id)
        )
      );
      
      Alert.alert('Success', `Marked ${unreadNotifications.length} notifications as read.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will permanently remove all notifications. This action cannot be undone.',
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

  const getFilteredNotifications = () => {
    if (filter === 'unread') {
      return pushState.notifications.filter(n => !n.read);
    }
    return pushState.notifications;
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'quote_received':
        return '💰';
      case 'rfq_viewed':
        return '👁️';
      case 'installation_update':
        return '🔧';
      case 'system_alert':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: PushNotification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(item.type)}
          </Text>
          <View style={styles.notificationInfo}>
            <Text style={[
              styles.notificationTitle,
              !item.read && styles.unreadTitle
            ]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.notificationDate}>
              {formatDate(item.received_at)}
            </Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={[
          styles.notificationBody,
          !item.read && styles.unreadBody
        ]} numberOfLines={3}>
          {item.body}
        </Text>
        
        {item.data?.rfq_id && (
          <Text style={styles.notificationMeta}>
            RFQ: {item.data.rfq_id}
          </Text>
        )}
        
        {item.data?.quote_id && (
          <Text style={styles.notificationMeta}>
            Quote: {item.data.quote_id}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.activeFilter
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterText,
            filter === 'all' && styles.activeFilterText
          ]}>
            All ({pushState.notifications.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'unread' && styles.activeFilter
          ]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[
            styles.filterText,
            filter === 'unread' && styles.activeFilterText
          ]}>
            Unread ({pushState.unreadCount})
          </Text>
        </TouchableOpacity>
      </View>
      
      {pushState.notifications.length > 0 && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMarkAllAsRead}
            disabled={pushState.unreadCount === 0}
          >
            <Text style={[
              styles.actionButtonText,
              pushState.unreadCount === 0 && styles.disabledActionText
            ]}>
              Mark All Read
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.destructiveAction]}
            onPress={handleClearAll}
          >
            <Text style={[styles.actionButtonText, styles.destructiveActionText]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => {
    const isUnreadFilter = filter === 'unread';
    const hasNotifications = pushState.notifications.length > 0;
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>
          {isUnreadFilter && hasNotifications ? '✅' : '📬'}
        </Text>
        <Text style={styles.emptyTitle}>
          {isUnreadFilter && hasNotifications 
            ? 'All Caught Up!' 
            : 'No Notifications'
          }
        </Text>
        <Text style={styles.emptyMessage}>
          {isUnreadFilter && hasNotifications
            ? 'You have no unread notifications. Great job staying on top of your solar projects!'
            : 'When you receive notifications about quotes, RFQ updates, or installation progress, they\'ll appear here.'
          }
        </Text>
        
        {isUnreadFilter && hasNotifications && (
          <TouchableOpacity
            style={styles.showAllButton}
            onPress={() => setFilter('all')}
          >
            <Text style={styles.showAllButtonText}>Show All Notifications</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor={'#007AFF'}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredNotifications.length === 0 && { flexGrow: 1 }
        ]}
        showsVerticalScrollIndicator={false}
      />
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
  listContent: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  destructiveAction: {
    borderColor: '#ff3b30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  disabledActionText: {
    color: '#cccccc',
  },
  destructiveActionText: {
    color: '#ff3b30',
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationDate: {
    fontSize: 12,
    color: '#666666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginTop: 8,
    marginLeft: 8,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  unreadBody: {
    color: '#333333',
  },
  notificationMeta: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  showAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  showAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});