import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  endBefore,
  getDocs, 
  getDoc,
  doc,
  QuerySnapshot,
  DocumentSnapshot,
  QueryConstraint,
  Query,
  CollectionReference,
  DocumentReference,
  Timestamp,
  WhereFilterOp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types for better type safety
export type FirestoreCollection = 
  | 'users'
  | 'products' 
  | 'rfqs'
  | 'quotes'
  | 'orders'
  | 'portfolioProjects'
  | 'notifications'
  | 'reviews'
  | 'maintenanceTasks'
  | 'promotions'
  | 'solarSystems'
  | 'energyProduction';

export interface QueryOptions {
  limit?: number;
  startAfter?: DocumentSnapshot;
  endBefore?: DocumentSnapshot;
}

export interface WhereCondition {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

export interface OrderByCondition {
  field: string;
  direction: 'asc' | 'desc';
}

// Query result with pagination info
export interface QueryResult<T = any> {
  docs: T[];
  lastDoc?: DocumentSnapshot;
  firstDoc?: DocumentSnapshot;
  hasMore: boolean;
  totalCount?: number;
}

// Base query builder class for type safety and optimization
export class FirestoreQueryBuilder<T = any> {
  private collectionRef: CollectionReference;
  private constraints: QueryConstraint[] = [];

  constructor(private collectionName: FirestoreCollection) {
    this.collectionRef = collection(db, collectionName);
  }

  // Add where conditions with automatic query optimization
  where(field: string, operator: WhereFilterOp, value: any): this {
    this.constraints.push(where(field, operator, value));
    return this;
  }

  // Add order by with automatic indexing hints
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.constraints.push(orderBy(field, direction));
    return this;
  }

  // Add limit with performance optimization
  limit(limitCount: number): this {
    // Optimize limit for better performance
    const optimizedLimit = Math.min(limitCount, 100); // Max 100 docs per query
    this.constraints.push(limit(optimizedLimit));
    return this;
  }

  // Add pagination support
  startAfter(doc: DocumentSnapshot): this {
    this.constraints.push(startAfter(doc));
    return this;
  }

  endBefore(doc: DocumentSnapshot): this {
    this.constraints.push(endBefore(doc));
    return this;
  }

  // Execute query with automatic caching and error handling
  async execute(): Promise<QueryResult<T>> {
    try {
      const q = query(this.collectionRef, ...this.constraints);
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      return {
        docs,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        firstDoc: snapshot.docs[0],
        hasMore: snapshot.docs.length === this.getLimit(),
      };
    } catch (error) {
      console.error(`Query failed for collection ${this.collectionName}:`, error);
      throw new Error(`Failed to query ${this.collectionName}: ${error.message}`);
    }
  }

  // Get the current limit constraint
  private getLimit(): number {
    const limitConstraint = this.constraints.find(c => c.type === 'limit');
    return limitConstraint ? (limitConstraint as any).limit : 25; // Default limit
  }

  // Build query without executing (for advanced use cases)
  build(): Query {
    return query(this.collectionRef, ...this.constraints);
  }
}

// Optimized query functions for specific collections
export const QueryHelpers = {
  // RFQ queries with optimized indexing
  async getRFQsByHomeowner(homeownerId: string, options: QueryOptions = {}): Promise<QueryResult> {
    const builder = new FirestoreQueryBuilder('rfqs')
      .where('homeownerId', '==', homeownerId)
      .orderBy('dateCreated', 'desc')
      .limit(options.limit || 25);

    if (options.startAfter) {
      builder.startAfter(options.startAfter);
    }

    return builder.execute();
  },

  async getRFQsByInstaller(installerId: string, status?: string, options: QueryOptions = {}): Promise<QueryResult> {
    const builder = new FirestoreQueryBuilder('rfqs')
      .where('selectedInstallerIds', 'array-contains', installerId);

    if (status) {
      builder.where('status', '==', status);
    }

    builder.orderBy('dateCreated', 'desc').limit(options.limit || 25);

    if (options.startAfter) {
      builder.startAfter(options.startAfter);
    }

    return builder.execute();
  },

  // Product queries with supplier and category optimization
  async getProductsBySupplier(supplierId: string, options: QueryOptions = {}): Promise<QueryResult> {
    const builder = new FirestoreQueryBuilder('products')
      .where('supplierId', '==', supplierId)
      .orderBy('createdAt', 'desc')
      .limit(options.limit || 25);

    if (options.startAfter) {
      builder.startAfter(options.startAfter);
    }

    return builder.execute();
  },

  async getProductsByCategory(category: string, options: QueryOptions = {}): Promise<QueryResult> {
    const builder = new FirestoreQueryBuilder('products')
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .limit(options.limit || 25);

    if (options.startAfter) {
      builder.startAfter(options.startAfter);
    }

    return builder.execute();
  },

  // Notification queries with read status optimization
  async getNotificationsByUser(userId: string, unreadOnly = false, options: QueryOptions = {}): Promise<QueryResult> {
    const builder = new FirestoreQueryBuilder('notifications')
      .where('userId', '==', userId);

    if (unreadOnly) {
      builder.where('read', '==', false);
    }

    builder.orderBy('createdAt', 'desc').limit(options.limit || 25);

    if (options.startAfter) {
      builder.startAfter(options.startAfter);
    }

    return builder.execute();
  },

  // Portfolio queries with installer optimization
  async getPortfolioProjectsByInstaller(installerId: string, options: QueryOptions = {}): Promise<QueryResult> {
    const builder = new FirestoreQueryBuilder('portfolioProjects')
      .where('installerId', '==', installerId)
      .orderBy('createdAt', 'desc')
      .limit(options.limit || 25);

    if (options.startAfter) {
      builder.startAfter(options.startAfter);
    }

    return builder.execute();
  },

  // Review queries with target optimization
  async getReviewsByTarget(targetId: string, targetType: 'product' | 'installer', options: QueryOptions = {}): Promise<QueryResult> {
    const builder = new FirestoreQueryBuilder('reviews')
      .where('targetId', '==', targetId)
      .where('targetType', '==', targetType)
      .orderBy('createdAt', 'desc')
      .limit(options.limit || 25);

    if (options.startAfter) {
      builder.startAfter(options.startAfter);
    }

    return builder.execute();
  },

  // Maintenance task queries with due date optimization
  async getMaintenanceTasksByUser(userId: string, options: QueryOptions = {}): Promise<QueryResult> {
    const builder = new FirestoreQueryBuilder('maintenanceTasks')
      .where('userId', '==', userId)
      .orderBy('nextDue', 'asc')
      .orderBy('createdAt', 'desc')
      .limit(options.limit || 25);

    if (options.startAfter) {
      builder.startAfter(options.startAfter);
    }

    return builder.execute();
  },

  // Quote queries with RFQ optimization
  async getQuotesByRFQ(rfqIds: string[], options: QueryOptions = {}): Promise<QueryResult> {
    if (rfqIds.length === 0) {
      return { docs: [], hasMore: false };
    }

    // Firestore 'in' queries are limited to 10 items
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < rfqIds.length; i += batchSize) {
      const batchIds = rfqIds.slice(i, i + batchSize);
      const builder = new FirestoreQueryBuilder('quotes')
        .where('rfqId', 'in', batchIds)
        .orderBy('createdAt', 'desc')
        .limit(options.limit || 25);

      batches.push(builder.execute());
    }

    // Execute all batches in parallel
    const results = await Promise.all(batches);
    
    // Merge and sort results
    const allDocs = results.flatMap(result => result.docs);
    allDocs.sort((a: any, b: any) => b.createdAt.seconds - a.createdAt.seconds);

    return {
      docs: allDocs.slice(0, options.limit || 25),
      hasMore: allDocs.length > (options.limit || 25),
    };
  },

  // Energy production queries with time-based optimization
  async getEnergyProductionBySystem(
    systemId: string, 
    startDate: Date, 
    endDate: Date, 
    options: QueryOptions = {}
  ): Promise<QueryResult> {
    const builder = new FirestoreQueryBuilder('energyProduction')
      .where('systemId', '==', systemId)
      .where('timestamp', '>=', Timestamp.fromDate(startDate))
      .where('timestamp', '<=', Timestamp.fromDate(endDate))
      .orderBy('timestamp', 'desc')
      .limit(options.limit || 100);

    if (options.startAfter) {
      builder.startAfter(options.startAfter);
    }

    return builder.execute();
  },
};

// Document getter with caching support
export class DocumentHelper {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getDocument<T = any>(
    collectionName: FirestoreCollection, 
    docId: string,
    useCache = true
  ): Promise<T | null> {
    const cacheKey = `${collectionName}/${docId}`;
    
    // Check cache first
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as T;
        
        // Cache the result
        if (useCache) {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get document ${cacheKey}:`, error);
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  // Clear cache for specific document or entire cache
  static clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Performance monitoring for queries
export class QueryPerformanceMonitor {
  private static queryStats = new Map<string, { count: number; totalTime: number; errors: number }>();

  static async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let stats = this.queryStats.get(queryName) || { count: 0, totalTime: 0, errors: 0 };

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      stats.count++;
      stats.totalTime += duration;
      
      // Log slow queries (> 2 seconds)
      if (duration > 2000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }
      
      this.queryStats.set(queryName, stats);
      return result;
    } catch (error) {
      stats.errors++;
      this.queryStats.set(queryName, stats);
      throw error;
    }
  }

  static getPerformanceStats(): Array<{
    queryName: string;
    count: number;
    averageTime: number;
    totalTime: number;
    errors: number;
  }> {
    return Array.from(this.queryStats.entries()).map(([queryName, stats]) => ({
      queryName,
      count: stats.count,
      averageTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
      totalTime: stats.totalTime,
      errors: stats.errors,
    }));
  }

  static clearStats(): void {
    this.queryStats.clear();
  }
}