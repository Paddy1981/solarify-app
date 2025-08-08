/**
 * Schema helper functions for Firestore operations
 * Provides type-safe CRUD operations and validation
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  User, 
  Profile, 
  HomeownerProfile, 
  InstallerProfile, 
  SupplierProfile,
  RFQ, 
  Quote, 
  Project, 
  Product, 
  SolarSystem,
  EnergyProductionRecord,
  WeatherRecord,
  UtilityRate,
  Notification,
  AnalyticsRecord,
  COLLECTIONS,
  isHomeownerProfile,
  isInstallerProfile,
  isSupplierProfile
} from '../../types/firestore-schema';

// =====================================================
// GENERIC CRUD OPERATIONS
// =====================================================

export class FirestoreSchemaHelper {
  
  /**
   * Generic document creation with type safety
   */
  static async createDocument<T>(
    collectionName: string, 
    docId: string, 
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const now = Timestamp.now();
    const docData = {
      ...data,
      id: docId,
      createdAt: now,
      updatedAt: now
    } as T;

    await setDoc(doc(db, collectionName, docId), docData);
  }

  /**
   * Generic document retrieval with type safety
   */
  static async getDocument<T>(
    collectionName: string, 
    docId: string
  ): Promise<T | null> {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as T;
    }
    return null;
  }

  /**
   * Generic document update with timestamp
   */
  static async updateDocument<T>(
    collectionName: string, 
    docId: string, 
    updates: Partial<Omit<T, 'id' | 'createdAt'>>
  ): Promise<void> {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Generic document deletion
   */
  static async deleteDocument(
    collectionName: string, 
    docId: string
  ): Promise<void> {
    await deleteDoc(doc(db, collectionName, docId));
  }

  /**
   * Generic query with pagination and type safety
   */
  static async queryDocuments<T>(
    collectionName: string,
    constraints: QueryConstraint[],
    pageSize: number = 25,
    lastDoc?: DocumentSnapshot
  ): Promise<{ 
    documents: T[], 
    lastDoc: DocumentSnapshot | null,
    hasMore: boolean 
  }> {
    let queryConstraints = [...constraints, limit(pageSize + 1)];
    
    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }

    const q = query(collection(db, collectionName), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const documents: T[] = [];
    const docs = querySnapshot.docs;
    const hasMore = docs.length > pageSize;
    
    // Remove the extra document used to check for more results
    const docsToProcess = hasMore ? docs.slice(0, -1) : docs;
    
    docsToProcess.forEach(doc => {
      documents.push(doc.data() as T);
    });

    return {
      documents,
      lastDoc: docsToProcess.length > 0 ? docsToProcess[docsToProcess.length - 1] : null,
      hasMore
    };
  }
}

// =====================================================
// USER & PROFILE OPERATIONS
// =====================================================

export class UserSchemaHelper extends FirestoreSchemaHelper {
  
  static async createUser(userId: string, userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.createDocument<User>(COLLECTIONS.USERS, userId, userData);
  }

  static async getUser(userId: string): Promise<User | null> {
    return this.getDocument<User>(COLLECTIONS.USERS, userId);
  }

  static async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void> {
    await this.updateDocument<User>(COLLECTIONS.USERS, userId, updates);
  }

  static async createProfile(userId: string, profileData: Omit<Profile, 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const data = {
      ...profileData,
      userId,
    };
    await this.createDocument<Profile>(COLLECTIONS.PROFILES, userId, data);
  }

  static async getProfile(userId: string): Promise<Profile | null> {
    return this.getDocument<Profile>(COLLECTIONS.PROFILES, userId);
  }

  static async updateProfile(userId: string, updates: Partial<Omit<Profile, 'userId' | 'createdAt'>>): Promise<void> {
    await this.updateDocument<Profile>(COLLECTIONS.PROFILES, userId, updates);
  }

  static async getUserWithProfile(userId: string): Promise<{ user: User | null, profile: Profile | null }> {
    const [user, profile] = await Promise.all([
      this.getUser(userId),
      this.getProfile(userId)
    ]);
    
    return { user, profile };
  }

  // Type-specific profile operations
  static async getHomeownerProfile(userId: string): Promise<HomeownerProfile | null> {
    const profile = await this.getProfile(userId);
    return profile && isHomeownerProfile(profile) ? profile : null;
  }

  static async getInstallerProfile(userId: string): Promise<InstallerProfile | null> {
    const profile = await this.getProfile(userId);
    return profile && isInstallerProfile(profile) ? profile : null;
  }

  static async getSupplierProfile(userId: string): Promise<SupplierProfile | null> {
    const profile = await this.getProfile(userId);
    return profile && isSupplierProfile(profile) ? profile : null;
  }
}

// =====================================================
// RFQ & QUOTE OPERATIONS
// =====================================================

export class RFQSchemaHelper extends FirestoreSchemaHelper {

  static async createRFQ(rfqData: Omit<RFQ, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const rfqId = doc(collection(db, COLLECTIONS.RFQS)).id;
    await this.createDocument<RFQ>(COLLECTIONS.RFQS, rfqId, rfqData);
    return rfqId;
  }

  static async getRFQ(rfqId: string): Promise<RFQ | null> {
    return this.getDocument<RFQ>(COLLECTIONS.RFQS, rfqId);
  }

  static async updateRFQ(rfqId: string, updates: Partial<Omit<RFQ, 'id' | 'createdAt'>>): Promise<void> {
    await this.updateDocument<RFQ>(COLLECTIONS.RFQS, rfqId, updates);
  }

  static async getRFQsForHomeowner(
    homeownerId: string, 
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ rfqs: RFQ[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    const constraints = [
      where('homeownerId', '==', homeownerId),
      orderBy('createdAt', 'desc')
    ];
    
    const result = await this.queryDocuments<RFQ>(
      COLLECTIONS.RFQS, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      rfqs: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }

  static async getRFQsForInstaller(
    installerId: string, 
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ rfqs: RFQ[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    const constraints = [
      where('selectedInstallerIds', 'array-contains', installerId),
      orderBy('createdAt', 'desc')
    ];
    
    const result = await this.queryDocuments<RFQ>(
      COLLECTIONS.RFQS, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      rfqs: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }

  static async getPublicRFQs(
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ rfqs: RFQ[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    const constraints = [
      where('visibility', '==', 'public'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    ];
    
    const result = await this.queryDocuments<RFQ>(
      COLLECTIONS.RFQS, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      rfqs: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }
}

export class QuoteSchemaHelper extends FirestoreSchemaHelper {

  static async createQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const quoteId = doc(collection(db, COLLECTIONS.QUOTES)).id;
    await this.createDocument<Quote>(COLLECTIONS.QUOTES, quoteId, quoteData);
    return quoteId;
  }

  static async getQuote(quoteId: string): Promise<Quote | null> {
    return this.getDocument<Quote>(COLLECTIONS.QUOTES, quoteId);
  }

  static async updateQuote(quoteId: string, updates: Partial<Omit<Quote, 'id' | 'createdAt'>>): Promise<void> {
    await this.updateDocument<Quote>(COLLECTIONS.QUOTES, quoteId, updates);
  }

  static async getQuotesForRFQ(
    rfqId: string, 
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ quotes: Quote[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    const constraints = [
      where('rfqId', '==', rfqId),
      orderBy('submittedAt', 'desc')
    ];
    
    const result = await this.queryDocuments<Quote>(
      COLLECTIONS.QUOTES, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      quotes: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }

  static async getQuotesForInstaller(
    installerId: string, 
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ quotes: Quote[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    const constraints = [
      where('installerId', '==', installerId),
      orderBy('submittedAt', 'desc')
    ];
    
    const result = await this.queryDocuments<Quote>(
      COLLECTIONS.QUOTES, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      quotes: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }

  static async getQuotesForHomeowner(
    homeownerId: string, 
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ quotes: Quote[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    const constraints = [
      where('homeownerId', '==', homeownerId),
      orderBy('submittedAt', 'desc')
    ];
    
    const result = await this.queryDocuments<Quote>(
      COLLECTIONS.QUOTES, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      quotes: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }
}

// =====================================================
// PRODUCT CATALOG OPERATIONS
// =====================================================

export class ProductSchemaHelper extends FirestoreSchemaHelper {

  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const productId = doc(collection(db, COLLECTIONS.PRODUCTS)).id;
    await this.createDocument<Product>(COLLECTIONS.PRODUCTS, productId, productData);
    return productId;
  }

  static async getProduct(productId: string): Promise<Product | null> {
    return this.getDocument<Product>(COLLECTIONS.PRODUCTS, productId);
  }

  static async updateProduct(productId: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
    await this.updateDocument<Product>(COLLECTIONS.PRODUCTS, productId, updates);
  }

  static async getProductsByCategory(
    category: Product['category'], 
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ products: Product[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    const constraints = [
      where('category', '==', category),
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    ];
    
    const result = await this.queryDocuments<Product>(
      COLLECTIONS.PRODUCTS, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      products: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }

  static async getProductsBySupplier(
    supplierId: string, 
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ products: Product[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    const constraints = [
      where('supplierId', '==', supplierId),
      orderBy('updatedAt', 'desc')
    ];
    
    const result = await this.queryDocuments<Product>(
      COLLECTIONS.PRODUCTS, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      products: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }

  static async searchProducts(
    searchTerms: string[], 
    category?: Product['category'],
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ products: Product[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    let constraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    ];

    if (category) {
      constraints.unshift(where('category', '==', category));
    }

    // Note: Firestore doesn't support full-text search natively
    // This is a simplified approach - in production, use Algolia or similar
    if (searchTerms.length > 0) {
      constraints.unshift(where('searchTerms', 'array-contains-any', searchTerms));
    }
    
    const result = await this.queryDocuments<Product>(
      COLLECTIONS.PRODUCTS, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      products: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }
}

// =====================================================
// PROJECT MANAGEMENT OPERATIONS
// =====================================================

export class ProjectSchemaHelper extends FirestoreSchemaHelper {

  static async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const projectId = doc(collection(db, COLLECTIONS.PROJECTS)).id;
    await this.createDocument<Project>(COLLECTIONS.PROJECTS, projectId, projectData);
    return projectId;
  }

  static async getProject(projectId: string): Promise<Project | null> {
    return this.getDocument<Project>(COLLECTIONS.PROJECTS, projectId);
  }

  static async updateProject(projectId: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<void> {
    await this.updateDocument<Project>(COLLECTIONS.PROJECTS, projectId, updates);
  }

  static async getProjectsForHomeowner(
    homeownerId: string, 
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ projects: Project[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    const constraints = [
      where('homeownerId', '==', homeownerId),
      orderBy('createdAt', 'desc')
    ];
    
    const result = await this.queryDocuments<Project>(
      COLLECTIONS.PROJECTS, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      projects: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }

  static async getProjectsForInstaller(
    installerId: string, 
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ projects: Project[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    const constraints = [
      where('installerId', '==', installerId),
      orderBy('createdAt', 'desc')
    ];
    
    const result = await this.queryDocuments<Project>(
      COLLECTIONS.PROJECTS, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      projects: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }
}

// =====================================================
// SOLAR SYSTEM & PERFORMANCE OPERATIONS
// =====================================================

export class SolarSystemSchemaHelper extends FirestoreSchemaHelper {

  static async createSolarSystem(systemData: Omit<SolarSystem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const systemId = doc(collection(db, COLLECTIONS.SOLAR_SYSTEMS)).id;
    await this.createDocument<SolarSystem>(COLLECTIONS.SOLAR_SYSTEMS, systemId, systemData);
    return systemId;
  }

  static async getSolarSystem(systemId: string): Promise<SolarSystem | null> {
    return this.getDocument<SolarSystem>(COLLECTIONS.SOLAR_SYSTEMS, systemId);
  }

  static async updateSolarSystem(systemId: string, updates: Partial<Omit<SolarSystem, 'id' | 'createdAt'>>): Promise<void> {
    await this.updateDocument<SolarSystem>(COLLECTIONS.SOLAR_SYSTEMS, systemId, updates);
  }

  static async addEnergyProduction(
    systemId: string, 
    productionData: Omit<EnergyProductionRecord, 'id' | 'systemId' | 'createdAt'>
  ): Promise<void> {
    const recordId = doc(collection(db, `${COLLECTIONS.ENERGY_PRODUCTION}/${systemId}/data`)).id;
    const data = {
      ...productionData,
      id: recordId,
      systemId,
      createdAt: Timestamp.now()
    };
    
    await setDoc(doc(db, `${COLLECTIONS.ENERGY_PRODUCTION}/${systemId}/data`, recordId), data);
  }

  static async getEnergyProduction(
    systemId: string,
    startDate: Timestamp,
    endDate: Timestamp,
    interval: EnergyProductionRecord['interval'] = '1day',
    pageSize: number = 100
  ): Promise<EnergyProductionRecord[]> {
    const constraints = [
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      where('interval', '==', interval),
      orderBy('timestamp', 'asc'),
      limit(pageSize)
    ];

    const result = await this.queryDocuments<EnergyProductionRecord>(
      `${COLLECTIONS.ENERGY_PRODUCTION}/${systemId}/data`,
      constraints,
      pageSize
    );

    return result.documents;
  }
}

// =====================================================
// NOTIFICATION OPERATIONS
// =====================================================

export class NotificationSchemaHelper extends FirestoreSchemaHelper {

  static async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    const notificationId = doc(collection(db, COLLECTIONS.NOTIFICATIONS)).id;
    const data = {
      ...notificationData,
      createdAt: Timestamp.now()
    };
    await this.createDocument<Notification>(COLLECTIONS.NOTIFICATIONS, notificationId, data);
    return notificationId;
  }

  static async getNotification(notificationId: string): Promise<Notification | null> {
    return this.getDocument<Notification>(COLLECTIONS.NOTIFICATIONS, notificationId);
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.updateDocument<Notification>(COLLECTIONS.NOTIFICATIONS, notificationId, {
      read: true,
      readAt: Timestamp.now()
    });
  }

  static async getUserNotifications(
    userId: string, 
    unreadOnly: boolean = false,
    pageSize: number = 25, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ notifications: Notification[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    let constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ];

    if (unreadOnly) {
      constraints.unshift(where('read', '==', false));
    }
    
    const result = await this.queryDocuments<Notification>(
      COLLECTIONS.NOTIFICATIONS, 
      constraints, 
      pageSize, 
      lastDoc
    );
    
    return {
      notifications: result.documents,
      lastDoc: result.lastDoc,
      hasMore: result.hasMore
    };
  }
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

export class SchemaValidationHelper {
  
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhoneNumber(phone: string): boolean {
    // E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  static validateZipCode(zipCode: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  }

  static validateSystemCapacity(capacity: number): boolean {
    return capacity > 0 && capacity <= 1000; // 0-1000 kW range
  }

  static validatePrice(price: number): boolean {
    return price >= 0 && price <= 1000000; // Max $1M
  }

  static validatePercentage(value: number): boolean {
    return value >= 0 && value <= 100;
  }

  static validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  static validateRFQData(rfq: Partial<RFQ>): string[] {
    const errors: string[] = [];

    if (!rfq.title || rfq.title.length < 5) {
      errors.push('RFQ title must be at least 5 characters');
    }

    if (!rfq.description || rfq.description.length < 20) {
      errors.push('RFQ description must be at least 20 characters');
    }

    if (!rfq.budget || rfq.budget.min <= 0 || rfq.budget.max <= rfq.budget.min) {
      errors.push('Budget range must be valid with max > min > 0');
    }

    if (rfq.systemRequirements?.desiredCapacity && !this.validateSystemCapacity(rfq.systemRequirements.desiredCapacity)) {
      errors.push('System capacity must be between 0 and 1000 kW');
    }

    return errors;
  }

  static validateProductData(product: Partial<Product>): string[] {
    const errors: string[] = [];

    if (!product.name || product.name.length < 3) {
      errors.push('Product name must be at least 3 characters');
    }

    if (!product.brand || product.brand.length < 2) {
      errors.push('Product brand must be at least 2 characters');
    }

    if (!product.pricing?.basePrice || !this.validatePrice(product.pricing.basePrice)) {
      errors.push('Product price must be a valid positive number');
    }

    if (product.specifications?.efficiency && !this.validatePercentage(product.specifications.efficiency)) {
      errors.push('Efficiency must be between 0 and 100 percent');
    }

    return errors;
  }
}

export {
  FirestoreSchemaHelper,
  UserSchemaHelper,
  RFQSchemaHelper,
  QuoteSchemaHelper,
  ProductSchemaHelper,
  ProjectSchemaHelper,
  SolarSystemSchemaHelper,
  NotificationSchemaHelper,
  SchemaValidationHelper
};