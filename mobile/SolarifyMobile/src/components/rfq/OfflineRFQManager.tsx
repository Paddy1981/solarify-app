// =============================================================================
// Offline RFQ Manager Component
// =============================================================================
// Manages RFQ drafts when offline, allows creation and editing
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { MobileRFQData } from '../../types';

export interface OfflineRFQManagerProps {
  onSelectDraft?: (draft: Partial<MobileRFQData>) => void;
  onCreateNew?: () => void;
  showCreateButton?: boolean;
}

export const OfflineRFQManager: React.FC<OfflineRFQManagerProps> = ({
  onSelectDraft,
  onCreateNew,
  showCreateButton = true,
}) => {
  const [offlineState, offlineActions] = useOfflineSync();
  const [drafts, setDrafts] = useState<Array<Partial<MobileRFQData> & { key: string }>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, [offlineState.pendingDrafts]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const draftData = await offlineActions.getRFQDrafts();
      
      const draftArray = Object.entries(draftData).map(([key, draft]) => ({
        ...draft,
        key,
      }));
      
      // Sort by updated_at, most recent first
      draftArray.sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      });
      
      setDrafts(draftArray);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      Alert.alert('Error', 'Failed to load saved drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDrafts();
    setRefreshing(false);
  };

  const handleSelectDraft = (draft: Partial<MobileRFQData> & { key: string }) => {
    if (onSelectDraft) {
      onSelectDraft(draft);
    }
  };

  const handleDeleteDraft = (draftId: string, draftAddress?: string) => {
    Alert.alert(
      'Delete Draft',
      `Are you sure you want to delete this draft${draftAddress ? ` for ${draftAddress}` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineActions.deleteRFQDraft(draftId);
              await loadDrafts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete draft');
            }
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    }
  };

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Unknown date';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return d.toLocaleDateString();
  };

  const getCompletionPercentage = (draft: Partial<MobileRFQData>): number => {
    const requiredFields = [
      'property.address',
      'property.property_type',
      'energy_usage.annual_kwh',
      'energy_usage.monthly_bill_average',
      'system_preferences.desired_offset',
      'system_preferences.budget_range',
    ];

    let completedFields = 0;
    
    requiredFields.forEach(field => {
      const keys = field.split('.');
      let value: any = draft;
      
      keys.forEach(key => {
        value = value?.[key];
      });
      
      if (value !== undefined && value !== null && value !== '') {
        completedFields++;
      }
    });

    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const renderDraftItem = ({ item }: { item: Partial<MobileRFQData> & { key: string } }) => {
    const completionPercent = getCompletionPercentage(item);
    const address = item.property?.address || 'No address specified';
    const photoCount = (item.photos?.roof_photos?.length || 0) + 
                      (item.photos?.electrical_panel_photos?.length || 0) + 
                      (item.photos?.property_overview?.length || 0);

    return (
      <TouchableOpacity
        style={styles.draftItem}
        onPress={() => handleSelectDraft(item)}
      >
        <View style={styles.draftHeader}>
          <View style={styles.draftInfo}>
            <Text style={styles.draftAddress} numberOfLines={2}>
              {address}
            </Text>
            <Text style={styles.draftDate}>
              Last edited {formatDate(item.updated_at)}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteDraft(item.key, address)}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.draftProgress}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {completionPercent}% complete
            </Text>
            {photoCount > 0 && (
              <Text style={styles.photoCount}>
                📷 {photoCount} photos
              </Text>
            )}
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${completionPercent}%` }
              ]} 
            />
          </View>
        </View>

        {item.status && (
          <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'draft':
        return { backgroundColor: '#8E8E93' };
      case 'active':
        return { backgroundColor: '#34C759' };
      default:
        return { backgroundColor: '#8E8E93' };
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'active':
        return 'Published';
      default:
        return status;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No Saved Drafts</Text>
      <Text style={styles.emptyMessage}>
        Create an RFQ to get started. Drafts are automatically saved as you work, even when offline.
      </Text>
      {showCreateButton && (
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
          <Text style={styles.createButtonText}>Create New RFQ</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Saved Drafts</Text>
        <Text style={styles.headerSubtitle}>
          {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'} saved offline
        </Text>
      </View>
      
      {!offlineState.isOnline && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>📵 Offline</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={drafts}
        renderItem={renderDraftItem}
        keyExtractor={item => item.key}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
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
          drafts.length === 0 && { flexGrow: 1 }
        ]}
        showsVerticalScrollIndicator={false}
      />
      
      {showCreateButton && drafts.length > 0 && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleCreateNew}>
          <Text style={styles.floatingButtonText}>+ New RFQ</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  offlineBadge: {
    backgroundColor: '#8E8E93',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  offlineBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  draftItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  draftInfo: {
    flex: 1,
    marginRight: 12,
  },
  draftAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 22,
  },
  draftDate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 16,
  },
  draftProgress: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  photoCount: {
    fontSize: 12,
    color: '#666666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});