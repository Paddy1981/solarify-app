// =============================================================================
// useOfflineSync Hook
// =============================================================================
// React hook for managing offline sync state and operations in components
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { offlineSyncService, SyncQueueItem, OfflineSettings } from '../services/offline-sync.service';
import { MobileRFQData, MobileQuoteData, PhotoUploadProgress } from '../types';

export interface OfflineState {
  // Connectivity
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  
  // Sync Status
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError?: string;
  lastSync?: Date;
  
  // Data Counts
  pendingDrafts: number;
  cachedQuotes: number;
  pendingUploads: number;
  queuedSyncItems: number;
  
  // Storage
  storageUsedMB: number;
  
  // Settings
  offlineSettings: OfflineSettings;
}

export interface OfflineActions {
  // RFQ Management
  saveRFQDraft: (rfq: Partial<MobileRFQData>) => Promise<void>;
  getRFQDrafts: () => Promise<Record<string, Partial<MobileRFQData>>>;
  deleteRFQDraft: (draftId: string) => Promise<void>;
  
  // Quote Management
  cacheQuotes: (quotes: MobileQuoteData[]) => Promise<void>;
  getCachedQuotes: () => Promise<Record<string, MobileQuoteData>>;
  
  // Photo Management
  queuePhotoUpload: (photoData: {
    uri: string;
    rfq_id?: string;
    purpose: string;
    metadata?: any;
  }) => Promise<string>;
  getPendingUploads: () => Promise<Record<string, PhotoUploadProgress>>;
  
  // Sync Operations
  addToSyncQueue: (item: SyncQueueItem) => Promise<void>;
  forceSyncNow: () => Promise<void>;
  
  // Settings
  updateOfflineSettings: (settings: Partial<OfflineSettings>) => Promise<void>;
  
  // Storage Management
  getStorageStats: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  
  // Manual refresh
  refreshOfflineState: () => Promise<void>;
}

export function useOfflineSync(): [OfflineState, OfflineActions] {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isConnected: true,
    connectionType: null,
    syncStatus: 'idle',
    pendingDrafts: 0,
    cachedQuotes: 0,
    pendingUploads: 0,
    queuedSyncItems: 0,
    storageUsedMB: 0,
    offlineSettings: {
      auto_sync: true,
      sync_on_wifi_only: false,
      max_photo_cache_mb: 100,
      sync_interval_minutes: 15,
    },
  });

  // Initialize offline sync service
  useEffect(() => {
    initializeOfflineSync();
  }, []);

  // Monitor app state changes for sync triggers
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Refresh state when app becomes active
        refreshOfflineState();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const initializeOfflineSync = async () => {
    try {
      await offlineSyncService.initialize();
      
      // Set up listeners
      const networkUnsubscribe = offlineSyncService.addNetworkListener((isOnline) => {
        setState(prev => ({
          ...prev,
          isOnline,
          isConnected: isOnline,
        }));
      });

      const syncUnsubscribe = offlineSyncService.addSyncListener((syncStatus, syncError) => {
        setState(prev => ({
          ...prev,
          syncStatus,
          syncError,
          lastSync: syncStatus === 'idle' ? new Date() : prev.lastSync,
        }));
      });

      // Initial state load
      await refreshOfflineState();

      // Cleanup function
      return () => {
        networkUnsubscribe();
        syncUnsubscribe();
      };
    } catch (error) {
      console.error('Failed to initialize offline sync:', error);
    }
  };

  const refreshOfflineState = useCallback(async () => {
    try {
      const [
        storageStats,
        offlineSettings,
        isOnline,
      ] = await Promise.all([
        offlineSyncService.getStorageStats(),
        offlineSyncService.getOfflineSettings(),
        Promise.resolve(offlineSyncService.isDeviceOnline()),
      ]);

      setState(prev => ({
        ...prev,
        isOnline,
        isConnected: isOnline,
        pendingDrafts: storageStats.drafts_count,
        cachedQuotes: storageStats.cached_quotes_count,
        pendingUploads: storageStats.pending_uploads_count,
        queuedSyncItems: storageStats.sync_queue_count,
        storageUsedMB: storageStats.estimated_size_mb,
        offlineSettings,
      }));
    } catch (error) {
      console.error('Failed to refresh offline state:', error);
    }
  }, []);

  // Actions
  const saveRFQDraft = useCallback(async (rfq: Partial<MobileRFQData>) => {
    try {
      await offlineSyncService.saveRFQDraft(rfq);
      await refreshOfflineState();
    } catch (error) {
      console.error('Failed to save RFQ draft:', error);
      throw error;
    }
  }, [refreshOfflineState]);

  const getRFQDrafts = useCallback(async () => {
    return await offlineSyncService.getRFQDrafts();
  }, []);

  const deleteRFQDraft = useCallback(async (draftId: string) => {
    try {
      await offlineSyncService.deleteRFQDraft(draftId);
      await refreshOfflineState();
    } catch (error) {
      console.error('Failed to delete RFQ draft:', error);
      throw error;
    }
  }, [refreshOfflineState]);

  const cacheQuotes = useCallback(async (quotes: MobileQuoteData[]) => {
    try {
      await offlineSyncService.cacheQuotes(quotes);
      await refreshOfflineState();
    } catch (error) {
      console.error('Failed to cache quotes:', error);
      throw error;
    }
  }, [refreshOfflineState]);

  const getCachedQuotes = useCallback(async () => {
    const cache = await offlineSyncService.getQuoteCache();
    // Strip the cached_at field for cleaner return type
    const cleanCache: Record<string, MobileQuoteData> = {};
    Object.entries(cache).forEach(([id, quote]) => {
      cleanCache[id] = {
        id: quote.id,
        rfq_id: quote.rfq_id,
        installer_id: quote.installer_id,
        installer_profile: quote.installer_profile,
        system_design: quote.system_design,
        pricing: quote.pricing,
        project_details: quote.project_details,
        status: quote.status,
        valid_until: quote.valid_until,
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        push_notification_sent: quote.push_notification_sent,
      };
    });
    return cleanCache;
  }, []);

  const queuePhotoUpload = useCallback(async (photoData: {
    uri: string;
    rfq_id?: string;
    purpose: string;
    metadata?: any;
  }) => {
    try {
      const uploadId = await offlineSyncService.queuePhotoUpload(photoData);
      await refreshOfflineState();
      return uploadId;
    } catch (error) {
      console.error('Failed to queue photo upload:', error);
      throw error;
    }
  }, [refreshOfflineState]);

  const getPendingUploads = useCallback(async () => {
    return await offlineSyncService.getPendingUploads();
  }, []);

  const addToSyncQueue = useCallback(async (item: SyncQueueItem) => {
    try {
      await offlineSyncService.addToSyncQueue(item);
      await refreshOfflineState();
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
      throw error;
    }
  }, [refreshOfflineState]);

  const forceSyncNow = useCallback(async () => {
    if (!state.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      // This would trigger the sync process
      // The actual implementation would be handled by the service
      setState(prev => ({ ...prev, syncStatus: 'syncing' }));
      
      // In a real implementation, we'd call the sync service method
      // For now, simulate the sync process
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          syncStatus: 'idle',
          lastSync: new Date(),
        }));
        refreshOfflineState();
      }, 3000);
    } catch (error) {
      console.error('Failed to force sync:', error);
      setState(prev => ({ 
        ...prev, 
        syncStatus: 'error',
        syncError: (error as Error).message,
      }));
      throw error;
    }
  }, [state.isOnline, refreshOfflineState]);

  const updateOfflineSettings = useCallback(async (settings: Partial<OfflineSettings>) => {
    try {
      await offlineSyncService.updateOfflineSettings(settings);
      await refreshOfflineState();
    } catch (error) {
      console.error('Failed to update offline settings:', error);
      throw error;
    }
  }, [refreshOfflineState]);

  const getStorageStats = useCallback(async () => {
    await refreshOfflineState();
  }, [refreshOfflineState]);

  const clearOfflineData = useCallback(async () => {
    try {
      await offlineSyncService.clearAllOfflineData();
      await refreshOfflineState();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, [refreshOfflineState]);

  const actions: OfflineActions = {
    saveRFQDraft,
    getRFQDrafts,
    deleteRFQDraft,
    cacheQuotes,
    getCachedQuotes,
    queuePhotoUpload,
    getPendingUploads,
    addToSyncQueue,
    forceSyncNow,
    updateOfflineSettings,
    getStorageStats,
    clearOfflineData,
    refreshOfflineState,
  };

  return [state, actions];
}