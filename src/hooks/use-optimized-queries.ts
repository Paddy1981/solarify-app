import { useQuery, useInfiniteQuery, QueryClient } from '@tanstack/react-query';
import { QueryHelpers, DocumentHelper, QueryPerformanceMonitor } from '@/lib/firestore/query-helpers';
import type { RFQ } from '@/lib/mock-data/rfqs';
import type { MockUser } from '@/lib/mock-data/users';

// Query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Custom hook for RFQs by homeowner with caching
export function useHomeownerRFQs(homeownerId: string, options?: { limit?: number }) {
  return useQuery({
    queryKey: ['rfqs', 'homeowner', homeownerId, options?.limit || 25],
    queryFn: () => QueryPerformanceMonitor.measureQuery(
      'homeowner-rfqs-cached',
      () => QueryHelpers.getRFQsByHomeowner(homeownerId, { limit: options?.limit || 25 })
    ),
    enabled: !!homeownerId,
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time-ish data
  });
}

// Custom hook for RFQs by installer with caching
export function useInstallerRFQs(
  installerId: string, 
  status?: string, 
  options?: { limit?: number }
) {
  return useQuery({
    queryKey: ['rfqs', 'installer', installerId, status, options?.limit || 50],
    queryFn: () => QueryPerformanceMonitor.measureQuery(
      'installer-rfqs-cached',
      () => QueryHelpers.getRFQsByInstaller(installerId, status, { limit: options?.limit || 50 })
    ),
    enabled: !!installerId,
    staleTime: 1 * 60 * 1000, // 1 minute for business-critical data
  });
}

// Custom hook for products by supplier with infinite scroll
export function useSupplierProducts(supplierId: string) {
  return useInfiniteQuery({
    queryKey: ['products', 'supplier', supplierId],
    queryFn: ({ pageParam }) => QueryPerformanceMonitor.measureQuery(
      'supplier-products-paginated',
      () => QueryHelpers.getProductsBySupplier(supplierId, { 
        limit: 20, 
        startAfter: pageParam 
      })
    ),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    enabled: !!supplierId,
    staleTime: 10 * 60 * 1000, // 10 minutes for product data
  });
}

// Custom hook for products by category with infinite scroll
export function useProductsByCategory(category: string) {
  return useInfiniteQuery({
    queryKey: ['products', 'category', category],
    queryFn: ({ pageParam }) => QueryPerformanceMonitor.measureQuery(
      'products-by-category-paginated',
      () => QueryHelpers.getProductsByCategory(category, { 
        limit: 20, 
        startAfter: pageParam 
      })
    ),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    enabled: !!category,
    staleTime: 15 * 60 * 1000, // 15 minutes for category data
  });
}

// Custom hook for user notifications with real-time updates
export function useUserNotifications(userId: string, unreadOnly = false) {
  return useQuery({
    queryKey: ['notifications', userId, unreadOnly],
    queryFn: () => QueryPerformanceMonitor.measureQuery(
      'user-notifications-cached',
      () => QueryHelpers.getNotificationsByUser(userId, unreadOnly, { limit: 50 })
    ),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds for notifications
    refetchInterval: 60 * 1000, // Auto-refetch every minute
  });
}

// Custom hook for portfolio projects with caching
export function useInstallerPortfolio(installerId: string) {
  return useInfiniteQuery({
    queryKey: ['portfolio', 'installer', installerId],
    queryFn: ({ pageParam }) => QueryPerformanceMonitor.measureQuery(
      'installer-portfolio-paginated',
      () => QueryHelpers.getPortfolioProjectsByInstaller(installerId, { 
        limit: 12, 
        startAfter: pageParam 
      })
    ),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    enabled: !!installerId,
    staleTime: 5 * 60 * 1000, // 5 minutes for portfolio data
  });
}

// Custom hook for reviews with caching
export function useTargetReviews(
  targetId: string, 
  targetType: 'product' | 'installer'
) {
  return useQuery({
    queryKey: ['reviews', targetType, targetId],
    queryFn: () => QueryPerformanceMonitor.measureQuery(
      'target-reviews-cached',
      () => QueryHelpers.getReviewsByTarget(targetId, targetType, { limit: 20 })
    ),
    enabled: !!targetId && !!targetType,
    staleTime: 10 * 60 * 1000, // 10 minutes for reviews
  });
}

// Custom hook for maintenance tasks with caching
export function useMaintenanceTasks(userId: string) {
  return useQuery({
    queryKey: ['maintenance', 'user', userId],
    queryFn: () => QueryPerformanceMonitor.measureQuery(
      'maintenance-tasks-cached',
      () => QueryHelpers.getMaintenanceTasksByUser(userId, { limit: 50 })
    ),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes for maintenance tasks
  });
}

// Custom hook for quotes with caching
export function useQuotesByRFQ(rfqIds: string[]) {
  return useQuery({
    queryKey: ['quotes', 'rfqs', rfqIds.sort().join(',')],
    queryFn: () => QueryPerformanceMonitor.measureQuery(
      'quotes-by-rfq-cached',
      () => QueryHelpers.getQuotesByRFQ(rfqIds, { limit: 100 })
    ),
    enabled: rfqIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for quotes
  });
}

// Custom hook for user document with caching
export function useUserDocument(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => QueryPerformanceMonitor.measureQuery(
      'user-document-cached',
      () => DocumentHelper.getDocument<MockUser>('users', userId, true)
    ),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes for user data
  });
}

// Custom hook for energy production data with time-based caching
export function useEnergyProduction(
  systemId: string, 
  startDate: Date, 
  endDate: Date
) {
  const dateKey = `${startDate.toISOString()}-${endDate.toISOString()}`;
  
  return useQuery({
    queryKey: ['energy', 'production', systemId, dateKey],
    queryFn: () => QueryPerformanceMonitor.measureQuery(
      'energy-production-cached',
      () => QueryHelpers.getEnergyProductionBySystem(systemId, startDate, endDate, { limit: 100 })
    ),
    enabled: !!systemId && startDate && endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes for energy data
  });
}

// Utility functions for cache management
export const CacheUtils = {
  // Invalidate specific queries
  invalidateHomeownerRFQs: (homeownerId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['rfqs', 'homeowner', homeownerId] 
    });
  },

  invalidateInstallerRFQs: (installerId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['rfqs', 'installer', installerId] 
    });
  },

  invalidateUserNotifications: (userId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['notifications', userId] 
    });
  },

  invalidateSupplierProducts: (supplierId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['products', 'supplier', supplierId] 
    });
  },

  // Prefetch data for better UX
  prefetchHomeownerRFQs: async (homeownerId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['rfqs', 'homeowner', homeownerId, 25],
      queryFn: () => QueryHelpers.getRFQsByHomeowner(homeownerId, { limit: 25 }),
      staleTime: 2 * 60 * 1000,
    });
  },

  prefetchInstallerRFQs: async (installerId: string, status?: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['rfqs', 'installer', installerId, status, 50],
      queryFn: () => QueryHelpers.getRFQsByInstaller(installerId, status, { limit: 50 }),
      staleTime: 1 * 60 * 1000,
    });
  },

  // Clear all cached data
  clearAllCache: () => {
    queryClient.clear();
    DocumentHelper.clearCache();
  },

  // Get cache statistics
  getCacheStats: () => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.isActive()).length,
      stalequeries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
    };
  },
};

// Performance monitoring hook
export function useQueryPerformance() {
  return {
    getStats: () => QueryPerformanceMonitor.getPerformanceStats(),
    clearStats: () => QueryPerformanceMonitor.clearStats(),
    getCacheStats: () => CacheUtils.getCacheStats(),
  };
}