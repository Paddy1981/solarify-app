// =============================================================================
// Offline Sync Service for Mobile
// =============================================================================
// Handles offline data storage, synchronization, and network connectivity
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { MobileRFQData, MobileQuoteData, PhotoUploadProgress } from '../types';

export interface OfflineStorageKeys {
  RFQ_DRAFTS: 'rfq_drafts';
  QUOTE_CACHE: 'quote_cache';
  PENDING_UPLOADS: 'pending_uploads';
  SYNC_QUEUE: 'sync_queue';
  LAST_SYNC: 'last_sync';
  USER_SETTINGS: 'user_settings';
}

export interface SyncQueueItem {
  id: string;
  type: 'create_rfq' | 'update_rfq' | 'upload_photo' | 'create_quote';
  data: any;
  timestamp: Date;
  retries: number;
  error?: string;
}

export interface OfflineSettings {
  auto_sync: boolean;
  sync_on_wifi_only: boolean;
  max_photo_cache_mb: number;
  sync_interval_minutes: number;
}

export class OfflineSyncService {
  private static instance: OfflineSyncService;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private syncListeners: Array<(status: 'idle' | 'syncing' | 'error', error?: string) => void> = [];
  private networkListeners: Array<(isOnline: boolean) => void> = [];

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  /**
   * Initialize offline sync service
   */
  async initialize(): Promise<void> {
    try {
      // Set up network monitoring
      NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected || false;
        
        console.log(`Network state changed: ${wasOnline ? 'online' : 'offline'} -> ${this.isOnline ? 'online' : 'offline'}`);
        
        // Notify listeners
        this.networkListeners.forEach(listener => listener(this.isOnline));
        
        // Auto-sync when coming back online
        if (!wasOnline && this.isOnline) {
          this.autoSyncWhenOnline();
        }
      });

      // Get current network state
      const networkState = await NetInfo.fetch();
      this.isOnline = networkState.isConnected || false;

      // Initialize offline settings
      await this.initializeSettings();

      console.log('OfflineSyncService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OfflineSyncService:', error);
    }
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Add network connectivity listener
   */
  addNetworkListener(callback: (isOnline: boolean) => void): () => void {
    this.networkListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.networkListeners.indexOf(callback);
      if (index > -1) {
        this.networkListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add sync status listener
   */
  addSyncListener(callback: (status: 'idle' | 'syncing' | 'error', error?: string) => void): () => void {
    this.syncListeners.push(callback);
    
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  // =============================================================================
  // RFQ Offline Management
  // =============================================================================

  /**
   * Save RFQ draft offline
   */
  async saveRFQDraft(rfqData: Partial<MobileRFQData>): Promise<void> {
    try {
      const drafts = await this.getRFQDrafts();
      const draftId = rfqData.id || `draft_${Date.now()}`;
      
      drafts[draftId] = {
        ...rfqData,
        id: draftId,
        updated_at: new Date(),
        offline_created: true,
      };

      await AsyncStorage.setItem('rfq_drafts', JSON.stringify(drafts));
      console.log(`RFQ draft saved: ${draftId}`);
    } catch (error) {
      console.error('Failed to save RFQ draft:', error);
      throw error;
    }
  }

  /**
   * Get all RFQ drafts
   */
  async getRFQDrafts(): Promise<Record<string, Partial<MobileRFQData>>> {
    try {
      const draftsString = await AsyncStorage.getItem('rfq_drafts');
      return draftsString ? JSON.parse(draftsString) : {};
    } catch (error) {
      console.error('Failed to get RFQ drafts:', error);
      return {};
    }
  }

  /**
   * Delete RFQ draft
   */
  async deleteRFQDraft(draftId: string): Promise<void> {
    try {
      const drafts = await this.getRFQDrafts();
      delete drafts[draftId];
      await AsyncStorage.setItem('rfq_drafts', JSON.stringify(drafts));
      console.log(`RFQ draft deleted: ${draftId}`);
    } catch (error) {
      console.error('Failed to delete RFQ draft:', error);
      throw error;
    }
  }

  // =============================================================================
  // Quote Caching
  // =============================================================================

  /**
   * Cache quotes for offline viewing
   */
  async cacheQuotes(quotes: MobileQuoteData[]): Promise<void> {
    try {
      const cache = await this.getQuoteCache();
      
      quotes.forEach(quote => {
        cache[quote.id!] = {
          ...quote,
          cached_at: new Date(),
        };
      });

      await AsyncStorage.setItem('quote_cache', JSON.stringify(cache));
      console.log(`Cached ${quotes.length} quotes for offline viewing`);
    } catch (error) {
      console.error('Failed to cache quotes:', error);
    }
  }

  /**
   * Get cached quotes
   */
  async getQuoteCache(): Promise<Record<string, MobileQuoteData & { cached_at: Date }>> {
    try {
      const cacheString = await AsyncStorage.getItem('quote_cache');
      const cache = cacheString ? JSON.parse(cacheString) : {};
      
      // Convert cached_at back to Date objects
      Object.values(cache).forEach((quote: any) => {
        quote.cached_at = new Date(quote.cached_at);
        quote.created_at = new Date(quote.created_at);
        quote.updated_at = new Date(quote.updated_at);
        quote.valid_until = new Date(quote.valid_until);
      });

      return cache;
    } catch (error) {
      console.error('Failed to get quote cache:', error);
      return {};
    }
  }

  /**
   * Clear expired quotes from cache
   */
  async clearExpiredQuotes(): Promise<void> {
    try {
      const cache = await this.getQuoteCache();
      const now = new Date();
      const expiredIds: string[] = [];

      Object.entries(cache).forEach(([id, quote]) => {
        // Remove quotes older than 7 days or past their valid_until date
        const isExpired = 
          now.getTime() - quote.cached_at.getTime() > 7 * 24 * 60 * 60 * 1000 ||
          now > quote.valid_until;
          
        if (isExpired) {
          expiredIds.push(id);
          delete cache[id];
        }
      });

      if (expiredIds.length > 0) {
        await AsyncStorage.setItem('quote_cache', JSON.stringify(cache));
        console.log(`Removed ${expiredIds.length} expired quotes from cache`);
      }
    } catch (error) {
      console.error('Failed to clear expired quotes:', error);
    }
  }

  // =============================================================================
  // Photo Upload Queue Management
  // =============================================================================

  /**
   * Add photo to upload queue
   */
  async queuePhotoUpload(photoData: {
    uri: string;
    rfq_id?: string;
    purpose: string;
    metadata?: any;
  }): Promise<string> {
    try {
      const uploads = await this.getPendingUploads();
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const uploadItem: PhotoUploadProgress = {
        id: uploadId,
        uri: photoData.uri,
        progress: 0,
        status: 'queued',
        ...photoData,
      };

      uploads[uploadId] = uploadItem;
      await AsyncStorage.setItem('pending_uploads', JSON.stringify(uploads));
      
      console.log(`Photo queued for upload: ${uploadId}`);
      
      // Try to upload immediately if online
      if (this.isOnline) {
        this.processUploadQueue();
      }

      return uploadId;
    } catch (error) {
      console.error('Failed to queue photo upload:', error);
      throw error;
    }
  }

  /**
   * Get pending photo uploads
   */
  async getPendingUploads(): Promise<Record<string, PhotoUploadProgress>> {
    try {
      const uploadsString = await AsyncStorage.getItem('pending_uploads');
      return uploadsString ? JSON.parse(uploadsString) : {};
    } catch (error) {
      console.error('Failed to get pending uploads:', error);
      return {};
    }
  }

  /**
   * Update upload progress
   */
  async updateUploadProgress(uploadId: string, progress: number, status?: 'uploading' | 'completed' | 'error', error?: string): Promise<void> {
    try {
      const uploads = await this.getPendingUploads();
      
      if (uploads[uploadId]) {
        uploads[uploadId].progress = progress;
        if (status) uploads[uploadId].status = status;
        if (error) uploads[uploadId].error_message = error;
        
        await AsyncStorage.setItem('pending_uploads', JSON.stringify(uploads));
        
        // Remove completed/failed uploads after a delay
        if (status === 'completed' || status === 'error') {
          setTimeout(() => this.cleanupCompletedUploads(), 5000);
        }
      }
    } catch (error) {
      console.error('Failed to update upload progress:', error);
    }
  }

  /**
   * Process upload queue
   */
  private async processUploadQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    try {
      const uploads = await this.getPendingUploads();
      const queuedUploads = Object.values(uploads).filter(upload => upload.status === 'queued');
      
      if (queuedUploads.length === 0) return;

      console.log(`Processing ${queuedUploads.length} queued uploads`);
      
      // Process uploads one by one to avoid overwhelming the network
      for (const upload of queuedUploads) {
        if (!this.isOnline) break;
        
        try {
          await this.updateUploadProgress(upload.id, 0, 'uploading');
          
          // Here you would implement the actual upload logic
          // This is a placeholder for the real upload implementation
          await this.uploadPhotoToFirebase(upload);
          
          await this.updateUploadProgress(upload.id, 100, 'completed');
        } catch (error: any) {
          await this.updateUploadProgress(upload.id, 0, 'error', error.message);
          console.error(`Failed to upload ${upload.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to process upload queue:', error);
    }
  }

  /**
   * Upload photo to Firebase (placeholder implementation)
   */
  private async uploadPhotoToFirebase(upload: PhotoUploadProgress): Promise<void> {
    // This would be implemented with actual Firebase Storage upload
    // For now, simulate upload with progress updates
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.updateUploadProgress(upload.id, 25);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.updateUploadProgress(upload.id, 50);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.updateUploadProgress(upload.id, 75);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // =============================================================================
  // General Sync Operations
  // =============================================================================

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue[item.id] = item;
      await AsyncStorage.setItem('sync_queue', JSON.stringify(queue));
      
      console.log(`Added to sync queue: ${item.type} (${item.id})`);
      
      // Process queue if online
      if (this.isOnline) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  /**
   * Get sync queue
   */
  async getSyncQueue(): Promise<Record<string, SyncQueueItem>> {
    try {
      const queueString = await AsyncStorage.getItem('sync_queue');
      const queue = queueString ? JSON.parse(queueString) : {};
      
      // Convert timestamps back to Date objects
      Object.values(queue).forEach((item: any) => {
        item.timestamp = new Date(item.timestamp);
      });

      return queue;
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return {};
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    try {
      this.syncInProgress = true;
      this.notifySyncListeners('syncing');
      
      const queue = await this.getSyncQueue();
      const pendingItems = Object.values(queue).filter(item => item.retries < 3);
      
      if (pendingItems.length === 0) {
        this.syncInProgress = false;
        this.notifySyncListeners('idle');
        return;
      }

      console.log(`Processing ${pendingItems.length} sync queue items`);
      
      for (const item of pendingItems) {
        if (!this.isOnline) break;
        
        try {
          await this.processSyncItem(item);
          await this.removeSyncQueueItem(item.id);
        } catch (error: any) {
          item.retries++;
          item.error = error.message;
          
          if (item.retries >= 3) {
            console.error(`Sync item failed after 3 retries: ${item.id}`, error);
            await this.removeSyncQueueItem(item.id);
          } else {
            await this.updateSyncQueueItem(item);
          }
        }
      }

      await this.setLastSyncTime(new Date());
      this.syncInProgress = false;
      this.notifySyncListeners('idle');
      
    } catch (error) {
      console.error('Sync process failed:', error);
      this.syncInProgress = false;
      this.notifySyncListeners('error', (error as Error).message);
    }
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'create_rfq':
        // Implement RFQ creation sync
        console.log(`Syncing RFQ creation: ${item.id}`);
        break;
      case 'update_rfq':
        // Implement RFQ update sync
        console.log(`Syncing RFQ update: ${item.id}`);
        break;
      case 'create_quote':
        // Implement quote creation sync
        console.log(`Syncing quote creation: ${item.id}`);
        break;
      default:
        console.warn(`Unknown sync item type: ${item.type}`);
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // =============================================================================
  // Auto-sync and Background Operations
  // =============================================================================

  /**
   * Auto-sync when device comes online
   */
  private async autoSyncWhenOnline(): Promise<void> {
    const settings = await this.getOfflineSettings();
    
    if (!settings.auto_sync) return;

    // Check if we should sync on current connection type
    const networkState = await NetInfo.fetch();
    if (settings.sync_on_wifi_only && networkState.type !== 'wifi') {
      console.log('Auto-sync skipped: WiFi-only setting enabled but not on WiFi');
      return;
    }

    console.log('Device came online, starting auto-sync...');
    
    // Show user notification about sync
    Alert.alert(
      'Syncing Data',
      'Your offline data is being synchronized...',
      [{ text: 'OK' }]
    );

    // Start sync processes
    await Promise.all([
      this.processSyncQueue(),
      this.processUploadQueue(),
    ]);
  }

  // =============================================================================
  // Settings Management
  // =============================================================================

  /**
   * Initialize default offline settings
   */
  private async initializeSettings(): Promise<void> {
    const existingSettings = await this.getOfflineSettings();
    
    const defaultSettings: OfflineSettings = {
      auto_sync: true,
      sync_on_wifi_only: false,
      max_photo_cache_mb: 100,
      sync_interval_minutes: 15,
    };

    const settings = { ...defaultSettings, ...existingSettings };
    await this.updateOfflineSettings(settings);
  }

  /**
   * Get offline settings
   */
  async getOfflineSettings(): Promise<OfflineSettings> {
    try {
      const settingsString = await AsyncStorage.getItem('user_settings');
      const allSettings = settingsString ? JSON.parse(settingsString) : {};
      return allSettings.offline || {};
    } catch (error) {
      console.error('Failed to get offline settings:', error);
      return {
        auto_sync: true,
        sync_on_wifi_only: false,
        max_photo_cache_mb: 100,
        sync_interval_minutes: 15,
      };
    }
  }

  /**
   * Update offline settings
   */
  async updateOfflineSettings(settings: Partial<OfflineSettings>): Promise<void> {
    try {
      const settingsString = await AsyncStorage.getItem('user_settings');
      const allSettings = settingsString ? JSON.parse(settingsString) : {};
      
      allSettings.offline = { ...allSettings.offline, ...settings };
      
      await AsyncStorage.setItem('user_settings', JSON.stringify(allSettings));
      console.log('Offline settings updated:', settings);
    } catch (error) {
      console.error('Failed to update offline settings:', error);
    }
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  private async removeSyncQueueItem(itemId: string): Promise<void> {
    const queue = await this.getSyncQueue();
    delete queue[itemId];
    await AsyncStorage.setItem('sync_queue', JSON.stringify(queue));
  }

  private async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const queue = await this.getSyncQueue();
    queue[item.id] = item;
    await AsyncStorage.setItem('sync_queue', JSON.stringify(queue));
  }

  private async setLastSyncTime(time: Date): Promise<void> {
    await AsyncStorage.setItem('last_sync', time.toISOString());
  }

  private async cleanupCompletedUploads(): Promise<void> {
    try {
      const uploads = await this.getPendingUploads();
      const activeUploads: Record<string, PhotoUploadProgress> = {};
      
      Object.entries(uploads).forEach(([id, upload]) => {
        if (upload.status === 'queued' || upload.status === 'uploading') {
          activeUploads[id] = upload;
        }
      });

      await AsyncStorage.setItem('pending_uploads', JSON.stringify(activeUploads));
    } catch (error) {
      console.error('Failed to cleanup completed uploads:', error);
    }
  }

  private notifySyncListeners(status: 'idle' | 'syncing' | 'error', error?: string): void {
    this.syncListeners.forEach(listener => listener(status, error));
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    drafts_count: number;
    cached_quotes_count: number;
    pending_uploads_count: number;
    sync_queue_count: number;
    estimated_size_mb: number;
  }> {
    try {
      const [drafts, cache, uploads, queue] = await Promise.all([
        this.getRFQDrafts(),
        this.getQuoteCache(),
        this.getPendingUploads(),
        this.getSyncQueue(),
      ]);

      // Rough estimation of storage size
      const dataSize = JSON.stringify({ drafts, cache, uploads, queue }).length;
      const estimatedSizeMb = Math.round(dataSize / (1024 * 1024) * 100) / 100;

      return {
        drafts_count: Object.keys(drafts).length,
        cached_quotes_count: Object.keys(cache).length,
        pending_uploads_count: Object.keys(uploads).length,
        sync_queue_count: Object.keys(queue).length,
        estimated_size_mb: estimatedSizeMb,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        drafts_count: 0,
        cached_quotes_count: 0,
        pending_uploads_count: 0,
        sync_queue_count: 0,
        estimated_size_mb: 0,
      };
    }
  }

  /**
   * Clear all offline data
   */
  async clearAllOfflineData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('rfq_drafts'),
        AsyncStorage.removeItem('quote_cache'),
        AsyncStorage.removeItem('pending_uploads'),
        AsyncStorage.removeItem('sync_queue'),
        AsyncStorage.removeItem('last_sync'),
      ]);
      
      console.log('All offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineSyncService = OfflineSyncService.getInstance();