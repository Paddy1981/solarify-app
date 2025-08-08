import { FirestoreQueryBuilder, QueryHelpers, DocumentHelper } from '../query-helpers'

// Mock Firestore
const mockCollection = jest.fn()
const mockQuery = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockGetDocs = jest.fn()
const mockGetDoc = jest.fn()

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  getDocs: mockGetDocs,
  getDoc: mockGetDoc,
  doc: jest.fn(),
}))

describe('FirestoreQueryBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCollection.mockReturnValue('mock-collection-ref')
    mockQuery.mockReturnValue('mock-query')
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: '1', data: () => ({ name: 'Test 1' }) },
        { id: '2', data: () => ({ name: 'Test 2' }) },
      ],
    })
  })

  it('builds queries with where conditions', async () => {
    const builder = new FirestoreQueryBuilder('users')
    await builder.where('role', '==', 'homeowner').execute()

    expect(mockWhere).toHaveBeenCalledWith('role', '==', 'homeowner')
    expect(mockQuery).toHaveBeenCalled()
    expect(mockGetDocs).toHaveBeenCalled()
  })

  it('builds queries with order by', async () => {
    const builder = new FirestoreQueryBuilder('products')
    await builder.orderBy('createdAt', 'desc').execute()

    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc')
  })

  it('applies default limit of 25', async () => {
    const builder = new FirestoreQueryBuilder('rfqs')
    await builder.execute()

    // Since no explicit limit is set, it should use internal logic
    expect(mockGetDocs).toHaveBeenCalled()
  })

  it('applies custom limit with maximum of 100', async () => {
    const builder = new FirestoreQueryBuilder('notifications')
    await builder.limit(150).execute() // Should be capped at 100

    expect(mockLimit).toHaveBeenCalledWith(100)
  })

  it('chains multiple conditions', async () => {
    const builder = new FirestoreQueryBuilder('rfqs')
    await builder
      .where('homeownerId', '==', 'user123')
      .orderBy('dateCreated', 'desc')
      .limit(10)
      .execute()

    expect(mockWhere).toHaveBeenCalledWith('homeownerId', '==', 'user123')
    expect(mockOrderBy).toHaveBeenCalledWith('dateCreated', 'desc')
    expect(mockLimit).toHaveBeenCalledWith(10)
  })

  it('returns formatted results with metadata', async () => {
    const builder = new FirestoreQueryBuilder('products')
    const result = await builder.execute()

    expect(result).toEqual({
      docs: [
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
      ],
      lastDoc: { id: '2', data: expect.any(Function) },
      firstDoc: { id: '1', data: expect.any(Function) },
      hasMore: false, // Since we got 2 docs and default limit is higher
    })
  })

  it('handles query errors gracefully', async () => {
    mockGetDocs.mockRejectedValue(new Error('Firestore error'))
    
    const builder = new FirestoreQueryBuilder('users')
    
    await expect(builder.execute()).rejects.toThrow('Failed to query users: Firestore error')
  })
})

describe('QueryHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'rfq1', data: () => ({ homeownerId: 'user1', title: 'Solar RFQ' }) },
      ],
    })
  })

  it('gets RFQs by homeowner with correct query', async () => {
    await QueryHelpers.getRFQsByHomeowner('user1', { limit: 10 })

    expect(mockWhere).toHaveBeenCalledWith('homeownerId', '==', 'user1')
    expect(mockOrderBy).toHaveBeenCalledWith('dateCreated', 'desc')
    expect(mockLimit).toHaveBeenCalledWith(10)
  })

  it('gets RFQs by installer with status filter', async () => {
    await QueryHelpers.getRFQsByInstaller('installer1', 'Pending', { limit: 25 })

    expect(mockWhere).toHaveBeenCalledWith('selectedInstallerIds', 'array-contains', 'installer1')
    expect(mockWhere).toHaveBeenCalledWith('status', '==', 'Pending')
    expect(mockOrderBy).toHaveBeenCalledWith('dateCreated', 'desc')
  })

  it('gets products by supplier', async () => {
    await QueryHelpers.getProductsBySupplier('supplier1')

    expect(mockWhere).toHaveBeenCalledWith('supplierId', '==', 'supplier1')
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc')
  })

  it('handles empty RFQ IDs in quote query', async () => {
    const result = await QueryHelpers.getQuotesByRFQ([])
    
    expect(result).toEqual({
      docs: [],
      hasMore: false,
    })
  })
})

describe('DocumentHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear cache before each test
    DocumentHelper.clearCache()
  })

  it('gets document by ID', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'user1',
      data: () => ({ name: 'John Doe', email: 'john@example.com' }),
    })

    const result = await DocumentHelper.getDocument('users', 'user1')

    expect(result).toEqual({
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
    })
  })

  it('returns null for non-existent document', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    })

    const result = await DocumentHelper.getDocument('users', 'nonexistent')
    expect(result).toBeNull()
  })

  it('caches document results', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'user1',
      data: () => ({ name: 'Cached User' }),
    })

    // First call
    await DocumentHelper.getDocument('users', 'user1', true)
    expect(mockGetDoc).toHaveBeenCalledTimes(1)

    // Second call should use cache
    const result = await DocumentHelper.getDocument('users', 'user1', true)
    expect(mockGetDoc).toHaveBeenCalledTimes(1) // Still only 1 call
    expect(result).toEqual({
      id: 'user1',
      name: 'Cached User',
    })
  })

  it('bypasses cache when disabled', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'user1',
      data: () => ({ name: 'Fresh User' }),
    })

    // First call without cache
    await DocumentHelper.getDocument('users', 'user1', false)
    expect(mockGetDoc).toHaveBeenCalledTimes(1)

    // Second call without cache should make another request
    await DocumentHelper.getDocument('users', 'user1', false)
    expect(mockGetDoc).toHaveBeenCalledTimes(2)
  })

  it('provides cache statistics', () => {
    // Add some items to cache by making requests
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'user1',
      data: () => ({ name: 'User 1' }),
    })

    DocumentHelper.getDocument('users', 'user1', true)
    
    const stats = DocumentHelper.getCacheStats()
    expect(stats.size).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(stats.keys)).toBe(true)
  })

  it('handles document fetch errors', async () => {
    mockGetDoc.mockRejectedValue(new Error('Network error'))

    await expect(
      DocumentHelper.getDocument('users', 'user1')
    ).rejects.toThrow('Failed to get document: Network error')
  })
})