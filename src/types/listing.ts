import type { ListingType } from "@/data/categories";

/** Firestore collection: "listings" */
export interface Listing {
  id: string;
  type: ListingType;
  subcategory: string;   // id from categoryData subcategories
  title: string;
  price: number;         // FCFA
  description: string;
  location: string;
  contact: string;
  images: string[];      // Storage download URLs
  imageUrl?: string;     // legacy field — some older docs may have this
  createdAt: number;
}
