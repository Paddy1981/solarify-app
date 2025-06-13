
import type { UserRole } from "./users";

export interface PromotionPost {
  id: string;
  authorId: string; // ID of the installer or supplier from mockUsers
  authorName: string; // CompanyName or FullName
  authorRole: UserRole;
  authorAvatarUrl?: string;
  title: string;
  content: string;
  imageUrl?: string;
  imageHint?: string; // For AI image generation if imageUrl is a placeholder
  discountOffer?: string; // e.g., "15% Off Installation", "$200 Off Inverters"
  callToActionLink?: string; // e.g., link to product page, contact form, or RFQ page
  callToActionText?: string; // e.g., "Learn More", "Get a Quote", "Shop Now"
  postDate: string; // ISO date string e.g., "2024-07-28"
  tags?: string[]; // e.g., ["Discount", "New Product", "Limited Time", "Installation"]
  validUntil?: string; // Optional expiry date for the promotion
}

// Sample mock data - we'd ideally fetch author details from users.ts
export const samplePromotions: PromotionPost[] = [
  {
    id: "promo-001",
    authorId: "installer-user-001", // Matches an ID in users.ts
    authorName: "ProSolar Installations Inc.", // Should match companyName for installer-user-001
    authorRole: "installer",
    authorAvatarUrl: "https://placehold.co/100x100.png?text=PI",
    title: "Summer Solar Splash! 10% Off All Installations!",
    content: "Thinking about going solar? Now's the perfect time! Get a 10% discount on complete residential solar panel system installations booked this month. Our expert team ensures a seamless process from consultation to commissioning. Don't miss out on these sunny savings!",
    imageUrl: "https://placehold.co/600x300.png",
    imageHint: "summer solar panels",
    discountOffer: "10% Off Installation",
    callToActionText: "Get Free Quote",
    callToActionLink: "/homeowner/rfq", // Or a specific contact page
    postDate: "2024-07-15",
    tags: ["Discount", "Installation", "Residential"],
    validUntil: "2024-08-15",
  },
  {
    id: "promo-002",
    authorId: "supplier-user-001", // Matches an ID in users.ts
    authorName: "EcoSolar Supplies Ltd.", // Should match companyName for supplier-user-001
    authorRole: "supplier",
    authorAvatarUrl: "https://placehold.co/100x100.png?text=ES",
    title: "New Arrival: Ultra-Efficient 500W Solar Panels",
    content: "Just in stock! Our latest 500W monocrystalline solar panels boast a 22.5% efficiency rate. Perfect for maximizing energy production in limited spaces. Check them out in our store today.",
    imageUrl: "https://placehold.co/600x300.png",
    imageHint: "new solar panel",
    callToActionText: "Shop Panels Now",
    callToActionLink: "/products/prod-001", // Assuming prod-001 is this panel
    postDate: "2024-07-20",
    tags: ["New Product", "Panels", "High Efficiency"],
  },
  {
    id: "promo-003",
    authorId: "installer-user-002",
    authorName: "GreenFuture Solar Tech",
    authorRole: "installer",
    authorAvatarUrl: "https://placehold.co/100x100.png?text=GF",
    title: "Free Energy Audit with Every Consultation",
    content: "Understand your home's energy needs better! We're offering a comprehensive energy audit, absolutely free, when you book a solar consultation with us. Learn how much you can save and the best system for your needs.",
    imageUrl: "https://placehold.co/600x300.png",
    imageHint: "energy audit home",
    callToActionText: "Book Consultation",
    callToActionLink: "/homeowner/rfq", // Could be a dedicated booking page
    postDate: "2024-07-22",
    tags: ["Free Service", "Consultation", "Energy Savings"],
  },
  {
    id: "promo-004",
    authorId: "supplier-user-002",
    authorName: "SunPower Components",
    authorRole: "supplier",
    authorAvatarUrl: "https://placehold.co/100x100.png?text=SC",
    title: "Bulk Discount on Inverters - Limited Time!",
    content: "Equipping multiple projects? Get 15% off when you order 5 or more grid-tie inverters. Offer valid while stocks last. Contact us for bulk pricing details.",
    discountOffer: "15% Off Bulk Inverters",
    imageUrl: "https://placehold.co/600x300.png",
    imageHint: "solar inverters stack",
    callToActionText: "Contact for Bulk Order",
    callToActionLink: "/supplier/store", // Generic link, ideally to a contact or specific offer page
    postDate: "2024-07-25",
    tags: ["Discount", "Inverters", "Bulk Order", "Limited Time"],
    validUntil: "2024-08-30",
  },
];

// Function to get author details (to be implemented or improved later)
// For now, the samplePromotions manually include authorName etc.
// In a real app, you'd fetch this from the users data using authorId.
export const getPromotionById = (id: string): PromotionPost | undefined => {
    return samplePromotions.find(promo => promo.id === id);
};
