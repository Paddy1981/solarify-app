export interface Notification {
  id: string;
  userId: string;
  type: 'rfq_received' | 'quote_received' | 'order_placed' | 'order_status_updated' | 'project_completed' | 'system_alert';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: any; // Firestore timestamp
  expiresAt?: any; // Firestore timestamp
  metadata?: {
    rfqId?: string;
    quoteId?: string;
    orderId?: string;
    projectId?: string;
    [key: string]: any;
  };
}

export type NotificationType = Notification['type'];