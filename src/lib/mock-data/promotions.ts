
import type { UserRole } from "./users";
import type { Timestamp } from "firebase/firestore";

export interface PromotionPost {
  id: string; // Firestore document ID
  authorId: string; 
  authorName: string; 
  authorRole: UserRole;
  authorAvatarUrl?: string;
  title: string;
  content: string;
  imageUrl?: string;
  imageHint?: string; 
  discountOffer?: string; 
  callToActionLink?: string; 
  callToActionText?: string; 
  postDate: Timestamp | string; // Firestore Timestamp or ISO string for mock
  tags?: string[]; 
  validUntil?: Timestamp | string; // Firestore Timestamp or ISO string for mock
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Sample mock data - for reference or initial seeding, not primary data source
export const samplePromotions: PromotionPost[] = [
  {
    id: "promo-001",
    authorId: "installer-user-001", 
    authorName: "ProSolar Installations Inc.", 
    authorRole: "installer",
    authorAvatarUrl: "https://placehold.co/100x100.png?text=PI",
    title: "Summer Solar Splash! 10% Off All Installations!",
    content: "Thinking about going solar? Now's the perfect time! Get a 10% discount on complete residential solar panel system installations booked this month. Our expert team ensures a seamless process from consultation to commissioning. Don't miss out on these sunny savings!",
    imageUrl: "https://placehold.co/600x300.png",
    imageHint: "summer solar panels",
    discountOffer: "10% Off Installation",
    callToActionText: "Get Free Quote",
    callToActionLink: "/homeowner/rfq",
    postDate: "2024-07-15",
    tags: ["Discount", "Installation", "Residential"],
    validUntil: "2024-08-15",
    createdAt: new Date() as any, // For mock, cast to any
    updatedAt: new Date() as any,
  },
  // ... other sample promotions can be kept for local testing or removed
];

export const getPromotionById = (id: string): PromotionPost | undefined => {
    // This is primarily for mock/testing if needed. Live data from Firestore.
    return samplePromotions.find(promo => promo.id === id);
};
