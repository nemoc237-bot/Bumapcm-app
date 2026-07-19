// Central source of truth for categories + their subcategories.
// Keys are what goes in the ?type= URL param and in listing.type on Firestore.
// Each subcategory has a "label" (shown to users) and a "slug" (used in ?sub=
// and stored as listing.subcategory, so it's stable even if the label changes).

export const CATEGORIES = [
  { type: "house", label: "Houses", icon: "🏠" },
  { type: "item", label: "Items", icon: "🛋️" },
  { type: "service", label: "Services", icon: "🛠️" },
  { type: "food", label: "Food", icon: "🍲" },
];

function toSlug(label) {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildSubs(labels) {
  return labels.map((label) => ({ label, slug: toSlug(label) }));
}

export const SUBCATEGORIES = {
  house: buildSubs([
    "Studio",
    "Single Room",
    "2 Bedroom",
    "Apartment",
    "Hostel",
    "Guest House",
    "Shop",
  ]),
  item: buildSubs([
    "Phones",
    "Kitchen Utensils",
    "Beds & Mattresses",
    "Fridges",
    "Books",
    "Clothes",
    "Furniture",
  ]),
  service: buildSubs([
    "Tailoring",
    "Graphics Design",
    "Tutoring",
    "Plumbing",
    "Delivery",
    "Photography",
    "Hair Dressing",
  ]),
  // Placeholder so the Post form's "Food" option doesn't break — fill in
  // real subcategories whenever Food listings are ready to launch.
  food: buildSubs(["Local Dishes", "Snacks", "Drinks", "Catering"]),
};

export function getCategoryLabel(type) {
  return CATEGORIES.find((c) => c.type === type)?.label ?? type;
}

export function getSubLabel(type, slug) {
  const sub = (SUBCATEGORIES[type] || []).find((s) => s.slug === slug);
  return sub?.label ?? slug;
}
