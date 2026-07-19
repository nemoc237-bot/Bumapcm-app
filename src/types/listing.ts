import type { ListingType } from "@/data/categories";

/** Firestore collection: "listings" */
export interface Listing {
  id: string;
  type: ListingType;
  subcategory: string;   // slug from SUBCATEGORIES
  title: string;
  price: number;         // FCFA
  description: string;
  location: string;
  contact: string;
  images: string[];      // Storage download URLs
  createdAt: number;
}
