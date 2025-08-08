// =============================================================================
// Offline Indicator Component
// =============================================================================
// Shows network status, sync progress, and offline capabilities
// =============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useOfflineSync } from '../../hooks/useOfflineSync';

export interface OfflineIndicatorProps {
  style?: ViewStyle;
  position?: 'top' | 'bottom';
  showDetails?: boolean;
  onPress?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  style,
  position = 'top',
  showDetails = false,
  onPress,
}) => {
  const [offlineState, offlineActions] = useOfflineSync();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      showOfflineDetails();
    }
  };

  const showOfflineDetails = () => {
    const { 
      isOnline, 
      syncStatus, 
      pendingDrafts, 
      cachedQuotes, 
      pendingUploads, 
      queuedSyncItems,
      storageUsedMB 
    } = offlineState;

    const message = isOnline
      ? `📶 Online\n\nStored offline:\n• ${pendingDrafts} RFQ drafts\n• ${cachedQuotes} cached quotes\n• ${pendingUploads} pending uploads\n• ${queuedSyncItems} sync items\n\nStorage used: ${storageUsedMB.toFixed(1)} MB`
      : `📵 Offline Mode\n\nYou can still:\n• View cached quotes (${cachedQuotes})\n• Create RFQ drafts (${pendingDrafts})\n• Take photos for later upload\n\nData will sync when online.`;

    Alert.alert(
      isOnline ? 'Connection Status' : 'Offline Mode',
      message,
      [
        { text: 'OK', style: 'cancel' },
        ...(isOnline ? [{ text: 'Sync Now', onPress: handleSyncNow }] : []),
        { text: 'Settings', onPress: showOfflineSettings },
      ]
    );
  };

  const handleSyncNow = async () => {
    try {
      await offlineActions.forceSyncNow();
      Alert.alert('Sync Complete', 'All offline data has been synchronized.');
    } catch (error) {
      Alert.alert('Sync Failed', (error as Error).message);
    }
  };

  const showOfflineSettings = () => {
    Alert.alert(
      'Offline Settings',
      'Would you like to adjust offline sync settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear Offline Data', style: 'destructive', onPress: handleClearData },
        { text: 'Open Settings', onPress: () => {/* Navigate to settings */} },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Offline Data',
      'This will remove all drafts, cached data, and pending uploads. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await offlineActions.clearOfflineData();
              Alert.alert('Success', 'All offline data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear offline data.');
            }
          }
        },
      ]
    );
  };

  if (!offlineState.isOnline || offlineState.syncStatus !== 'idle') {
    const indicatorStyles = [
      styles.indicator,
      styles[position],
      getStatusStyle(offlineState.isOnline, offlineState.syncStatus),
      style,
    ];

    return (
      <TouchableOpacity style={indicatorStyles} onPress={handlePress}>
        <View style={styles.content}>
          {/* Status Icon/Spinner */}
          <View style={styles.iconContainer}>
            {offlineState.syncStatus === 'syncing' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.icon}>
                {getStatusIcon(offlineState.isOnline, offlineState.syncStatus)}
              </Text>
            )}
          </View>

          {/* Status Text */}
          <View style={styles.textContainer}>
            <Text style={styles.statusText} numberOfLines={1}>
              {getStatusText(offlineState.isOnline, offlineState.syncStatus)}
            </Text>
            
            {showDetails && (
              <Text style={styles.detailText} numberOfLines={1}>
                {getDetailText(offlineState)}
              </Text>
            )}
          </View>

          {/* Badge for pending items */}
          {(offlineState.pendingUploads > 0 || offlineState.queuedSyncItems > 0) && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {offlineState.pendingUploads + offlineState.queuedSyncItems}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Don't show anything when online and idle
  return null;
};

const getStatusIcon = (isOnline: boolean, syncStatus: string): string => {
  if (syncStatus === 'error') return '⚠️';
  if (syncStatus === 'syncing') return '⏳';
  if (!isOnline) return '📵';
  return '📶';
};

const getStatusText = (isOnline: boolean, syncStatus: string): string => {
  if (syncStatus === 'syncing') return 'Syncing...';
  if (syncStatus === 'error') return 'Sync Error';
  if (!isOnline) return 'Offline Mode';
  return 'Online';
};

const getDetailText = (state: any): string => {
  if (state.syncStatus === 'syncing') {
    return 'Uploading data...';
  }
  if (state.syncStatus === 'error') {
    return state.syncError || 'Sync failed';
  }
  if (!state.isOnline) {
    const totalPending = state.pendingDrafts + state.pendingUploads + state.queuedSyncItems;
    return totalPending > 0 
      ? `${totalPending} items pending`
      : 'Data available offline';
  }
  return '';
};

const getStatusStyle = (isOnline: boolean, syncStatus: string): ViewStyle => {
  if (syncStatus === 'error') {
    return { backgroundColor: '#FF3B30' }; // Red
  }
  if (syncStatus === 'syncing') {
    return { backgroundColor: '#FF9500' }; // Orange
  }
  if (!isOnline) {
    return { backgroundColor: '#8E8E93' }; // Gray
  }
  return { backgroundColor: '#34C759' }; // Green
};

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  iconContainer: {
    marginRight: 8,
    width: 20,
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailText: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});