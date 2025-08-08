export interface Review {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  targetId: string; // Product ID, Installer ID, or Supplier ID
  targetType: 'product' | 'installer' | 'supplier';
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  isVerified: boolean;
  isHelpful?: number; // Number of users who found this helpful
  isReported?: boolean;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  metadata?: {
    orderId?: string;
    projectId?: string;
    [key: string]: any;
  };
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}