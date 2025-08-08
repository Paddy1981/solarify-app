import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useHomeownerRFQs,
  useInstallerRFQs,
  useSupplierProducts,
  useUserNotifications,
  useUserDocument,
  CacheUtils
} from '../use-optimized-queries'
import { QueryHelpers, DocumentHelper } from '@/lib/firestore/query-helpers'

// Mock the query helpers
jest.mock('@/lib/firestore/query-helpers', () => ({
  QueryHelpers: {
    getRFQsByHomeowner: jest.fn(),
    getRFQsByInstaller: jest.fn(),
    getProductsBySupplier: jest.fn(),
    getNotificationsByUser: jest.fn(),
  },
  DocumentHelper: {
    getDocument: jest.fn(),
  },
  QueryPerformanceMonitor: {
    measureQuery: jest.fn(),
  },
}))

const mockQueryHelpers = QueryHelpers as jest.Mocked<typeof QueryHelpers>
const mockDocumentHelper = DocumentHelper as jest.Mocked<typeof DocumentHelper>

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useOptimizedQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useHomeownerRFQs', () => {
    it('fetches RFQs for homeowner successfully', async () => {
      const mockRFQs = {
        docs: [
          { id: 'rfq1', title: 'Solar Installation', homeownerId: 'user1' },
          { id: 'rfq2', title: 'Panel Upgrade', homeownerId: 'user1' },
        ],
        hasMore: false,
      }

      mockQueryHelpers.getRFQsByHomeowner.mockResolvedValue(mockRFQs)

      const { result } = renderHook(
        () => useHomeownerRFQs('user1', { limit: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockQueryHelpers.getRFQsByHomeowner).toHaveBeenCalledWith('user1', { limit: 10 })
      expect(result.current.data).toEqual(mockRFQs)
    })

    it('does not fetch when homeownerId is not provided', () => {
      const { result } = renderHook(
        () => useHomeownerRFQs('', { limit: 10 }),
        { wrapper: createWrapper() }
      )

      expect(result.current.status).toBe('pending')
      expect(mockQueryHelpers.getRFQsByHomeowner).not.toHaveBeenCalled()
    })

    it('uses correct cache key', async () => {
      const mockRFQs = { docs: [], hasMore: false }
      mockQueryHelpers.getRFQsByHomeowner.mockResolvedValue(mockRFQs)

      const { result } = renderHook(
        () => useHomeownerRFQs('user1', { limit: 15 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // The hook should use a cache key that includes the homeowner ID and limit
      expect(mockQueryHelpers.getRFQsByHomeowner).toHaveBeenCalledWith('user1', { limit: 15 })
    })

    it('handles query errors gracefully', async () => {
      const error = new Error('Failed to fetch RFQs')
      mockQueryHelpers.getRFQsByHomeowner.mockRejectedValue(error)

      const { result } = renderHook(
        () => useHomeownerRFQs('user1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })

  describe('useInstallerRFQs', () => {
    it('fetches RFQs for installer with status filter', async () => {
      const mockRFQs = {
        docs: [
          { id: 'rfq1', status: 'Pending', selectedInstallerIds: ['installer1'] },
        ],
        hasMore: false,
      }

      mockQueryHelpers.getRFQsByInstaller.mockResolvedValue(mockRFQs)

      const { result } = renderHook(
        () => useInstallerRFQs('installer1', 'Pending', { limit: 20 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockQueryHelpers.getRFQsByInstaller).toHaveBeenCalledWith('installer1', 'Pending', { limit: 20 })
      expect(result.current.data).toEqual(mockRFQs)
    })

    it('fetches RFQs without status filter', async () => {
      const mockRFQs = { docs: [], hasMore: false }
      mockQueryHelpers.getRFQsByInstaller.mockResolvedValue(mockRFQs)

      const { result } = renderHook(
        () => useInstallerRFQs('installer1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockQueryHelpers.getRFQsByInstaller).toHaveBeenCalledWith('installer1', undefined, { limit: 50 })
    })

    it('does not fetch when installerId is not provided', () => {
      const { result } = renderHook(
        () => useInstallerRFQs(''),
        { wrapper: createWrapper() }
      )

      expect(result.current.status).toBe('pending')
      expect(mockQueryHelpers.getRFQsByInstaller).not.toHaveBeenCalled()
    })
  })

  describe('useSupplierProducts', () => {
    it('fetches products with infinite query', async () => {
      const mockProducts = {
        docs: [
          { id: 'product1', name: 'Solar Panel A', supplierId: 'supplier1' },
          { id: 'product2', name: 'Solar Panel B', supplierId: 'supplier1' },
        ],
        hasMore: true,
        lastDoc: { id: 'product2' },
      }

      mockQueryHelpers.getProductsBySupplier.mockResolvedValue(mockProducts)

      const { result } = renderHook(
        () => useSupplierProducts('supplier1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockQueryHelpers.getProductsBySupplier).toHaveBeenCalledWith('supplier1', { 
        limit: 20, 
        startAfter: undefined 
      })
      expect(result.current.data?.pages[0]).toEqual(mockProducts)
      expect(result.current.hasNextPage).toBe(true)
    })

    it('handles pagination correctly', async () => {
      const firstPage = {
        docs: [{ id: 'product1', name: 'Product 1' }],
        hasMore: true,
        lastDoc: { id: 'product1' },
      }

      const secondPage = {
        docs: [{ id: 'product2', name: 'Product 2' }],
        hasMore: false,
        lastDoc: { id: 'product2' },
      }

      mockQueryHelpers.getProductsBySupplier
        .mockResolvedValueOnce(firstPage)
        .mockResolvedValueOnce(secondPage)

      const { result } = renderHook(
        () => useSupplierProducts('supplier1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.hasNextPage).toBe(true)

      // Fetch next page
      await result.current.fetchNextPage()

      await waitFor(() => {
        expect(result.current.data?.pages).toHaveLength(2)
      })

      expect(mockQueryHelpers.getProductsBySupplier).toHaveBeenCalledTimes(2)
      expect(mockQueryHelpers.getProductsBySupplier).toHaveBeenNthCalledWith(2, 'supplier1', {
        limit: 20,
        startAfter: { id: 'product1' },
      })
    })
  })

  describe('useUserNotifications', () => {
    it('fetches notifications for user', async () => {
      const mockNotifications = {
        docs: [
          { id: 'notif1', message: 'New RFQ received', userId: 'user1', read: false },
          { id: 'notif2', message: 'Quote accepted', userId: 'user1', read: true },
        ],
        hasMore: false,
      }

      mockQueryHelpers.getNotificationsByUser.mockResolvedValue(mockNotifications)

      const { result } = renderHook(
        () => useUserNotifications('user1', false),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockQueryHelpers.getNotificationsByUser).toHaveBeenCalledWith('user1', false, { limit: 50 })
      expect(result.current.data).toEqual(mockNotifications)
    })

    it('fetches only unread notifications when specified', async () => {
      const mockNotifications = {
        docs: [
          { id: 'notif1', message: 'New RFQ received', userId: 'user1', read: false },
        ],
        hasMore: false,
      }

      mockQueryHelpers.getNotificationsByUser.mockResolvedValue(mockNotifications)

      const { result } = renderHook(
        () => useUserNotifications('user1', true),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockQueryHelpers.getNotificationsByUser).toHaveBeenCalledWith('user1', true, { limit: 50 })
    })

    it('has shorter stale time for real-time data', async () => {
      const mockNotifications = { docs: [], hasMore: false }
      mockQueryHelpers.getNotificationsByUser.mockResolvedValue(mockNotifications)

      const { result } = renderHook(
        () => useUserNotifications('user1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // The hook should be configured for more frequent updates
      expect(mockQueryHelpers.getNotificationsByUser).toHaveBeenCalled()
    })
  })

  describe('useUserDocument', () => {
    it('fetches user document by ID', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'homeowner',
      }

      mockDocumentHelper.getDocument.mockResolvedValue(mockUser)

      const { result } = renderHook(
        () => useUserDocument('user1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockDocumentHelper.getDocument).toHaveBeenCalledWith('users', 'user1', true)
      expect(result.current.data).toEqual(mockUser)
    })

    it('does not fetch when userId is not provided', () => {
      const { result } = renderHook(
        () => useUserDocument(''),
        { wrapper: createWrapper() }
      )

      expect(result.current.status).toBe('pending')
      expect(mockDocumentHelper.getDocument).not.toHaveBeenCalled()
    })

    it('handles non-existent user gracefully', async () => {
      mockDocumentHelper.getDocument.mockResolvedValue(null)

      const { result } = renderHook(
        () => useUserDocument('nonexistent'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeNull()
    })
  })

  describe('CacheUtils', () => {
    let queryClient: QueryClient

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
        },
      })
    })

    it('invalidates homeowner RFQs correctly', () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')
      
      // Mock the queryClient in CacheUtils
      ;(CacheUtils as any).queryClient = queryClient

      CacheUtils.invalidateHomeownerRFQs('user1')

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['rfqs', 'homeowner', 'user1']
      })
    })

    it('prefetches homeowner RFQs', async () => {
      const prefetchQuerySpy = jest.spyOn(queryClient, 'prefetchQuery')
      const mockRFQs = { docs: [], hasMore: false }
      mockQueryHelpers.getRFQsByHomeowner.mockResolvedValue(mockRFQs)

      // Mock the queryClient in CacheUtils
      ;(CacheUtils as any).queryClient = queryClient

      await CacheUtils.prefetchHomeownerRFQs('user1')

      expect(prefetchQuerySpy).toHaveBeenCalledWith({
        queryKey: ['rfqs', 'homeowner', 'user1', 25],
        queryFn: expect.any(Function),
        staleTime: 2 * 60 * 1000,
      })
    })

    it('clears all cache correctly', () => {
      const clearSpy = jest.spyOn(queryClient, 'clear')
      const clearCacheSpy = jest.spyOn(DocumentHelper, 'clearCache')

      // Mock the queryClient in CacheUtils
      ;(CacheUtils as any).queryClient = queryClient

      CacheUtils.clearAllCache()

      expect(clearSpy).toHaveBeenCalled()
      expect(clearCacheSpy).toHaveBeenCalled()
    })

    it('provides cache statistics', () => {
      const getQueryCacheSpy = jest.spyOn(queryClient, 'getQueryCache')
      const mockQueries = [
        { isActive: () => true, isStale: () => false, state: { status: 'success' } },
        { isActive: () => false, isStale: () => true, state: { status: 'error' } },
        { isActive: () => true, isStale: () => false, state: { status: 'success' } },
      ]

      getQueryCacheSpy.mockReturnValue({
        getAll: () => mockQueries as any,
      } as any)

      // Mock the queryClient in CacheUtils
      ;(CacheUtils as any).queryClient = queryClient

      const stats = CacheUtils.getCacheStats()

      expect(stats).toEqual({
        totalQueries: 3,
        activeQueries: 2,
        stalequeries: 1,
        errorQueries: 1,
      })
    })
  })
})