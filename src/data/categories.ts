// Central source of truth for Houses / Items / Services categories + subcategories.
// Keys match the ?type= URL param and listing.type stored in Firestore.

export type ListingType = "house" | "item" | "service" | "food";

export interface Category {
  type: ListingType;
  label: string;
  icon: string;
}

export interface Subcategory {
  label: string;
  slug: string;
}

export const CATEGORIES: Category[] = [
  { type: "house",   label: "Houses",   icon: "🏠" },
  { type: "item",    label: "Items",    icon: "🛋️" },
  { type: "service", label: "Services", icon: "🛠️" },
  { type: "food",    label: "Food",     icon: "🍲" },
];

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildSubs(labels: string[]): Subcategory[] {
  return labels.map((label) => ({ label, slug: toSlug(label) }));
}

export const SUBCATEGORIES: Record<string, Subcategory[]> = {
  house: buildSubs([
    "Studio", "Single Room", "2 Bedroom", "Apartment",
    "Hostel", "Guest House", "Shop",
  ]),
  item: buildSubs([
    "Phones", "Kitchen Utensils", "Beds & Mattresses",
    "Fridges", "Books", "Clothes", "Furniture",
  ]),
  service: buildSubs([
    "Tailoring", "Graphics Design", "Tutoring", "Plumbing",
    "Delivery", "Photography", "Hair Dressing",
  ]),
  food: buildSubs(["Local Dishes", "Snacks", "Drinks", "Catering"]),
};

export function getCategoryLabel(type: string): string {
  return CATEGORIES.find((c) => c.type === type)?.label ?? type;
}

export function getSubLabel(type: string, slug: string): string {
  const sub = (SUBCATEGORIES[type] ?? []).find((s) => s.slug === slug);
  return sub?.label ?? slug;
}
