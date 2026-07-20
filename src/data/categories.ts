// Single source of truth for all 7 categories + their subcategories.
// Keys match the ?type= URL param and listing.type stored in Firestore.

export type ListingType =
  | "house"
  | "item"
  | "service"
  | "food"
  | "groceries"
  | "fashion"
  | "electronics";

export interface Subcategory {
  id: string;    // used in ?sub= URL param and stored on Firestore doc
  name: string;  // shown to users
  icon: string;
  desc: string;  // short example text shown under the card
}

export interface Category {
  type: ListingType;
  name: string;
  icon: string;
  subcategories: Subcategory[];
}

export const categoryData: Record<string, Category> = {
  house: {
    type: "house",
    name: "Houses",
    icon: "🏠",
    subcategories: [
      { id: "studio",       name: "Studio",       icon: "🏠", desc: "Self-contained, one room" },
      { id: "single-room",  name: "Single Room",  icon: "🚪", desc: "One room, shared compound" },
      { id: "2-bedroom",    name: "2 Bedroom",    icon: "🛏️", desc: "Two bedrooms" },
      { id: "apartment",    name: "Apartment",    icon: "🏢", desc: "Full flat, multiple rooms" },
      { id: "hostel",       name: "Hostel",       icon: "🏘️", desc: "Student hostel rooms" },
      { id: "guest-house",  name: "Guest House",  icon: "🛎️", desc: "Short stays, guest houses" },
      { id: "shop",         name: "Shop",         icon: "🏪", desc: "Commercial shop space" },
    ],
  },
  item: {
    type: "item",
    name: "Items",
    icon: "🛍️",
    subcategories: [
      { id: "phones",            name: "Phones",           icon: "📱", desc: "New & used phones" },
      { id: "kitchen-utensils",  name: "Kitchen Utensils", icon: "🍳", desc: "Pots, pans, cutlery" },
      { id: "beds-and-mattresses", name: "Beds & Mattresses", icon: "🛏️", desc: "Beds, mattresses" },
      { id: "fridges",           name: "Fridges",          icon: "🧊", desc: "Fridges & freezers" },
      { id: "books",             name: "Books",            icon: "📚", desc: "Textbooks & novels" },
      { id: "clothes",           name: "Clothes",          icon: "👕", desc: "New & second-hand clothes" },
      { id: "furniture",         name: "Furniture",        icon: "🪑", desc: "Chairs, tables, shelves" },
    ],
  },
  service: {
    type: "service",
    name: "Services",
    icon: "🛠️",
    subcategories: [
      { id: "tailoring",      name: "Tailoring",       icon: "🧵", desc: "Sewing & alterations" },
      { id: "graphics-design", name: "Graphics Design", icon: "🎨", desc: "Logos, flyers, design" },
      { id: "tutoring",       name: "Tutoring",        icon: "📖", desc: "Lessons & exam prep" },
      { id: "plumbing",       name: "Plumbing",        icon: "🔧", desc: "Pipes, taps, repairs" },
      { id: "delivery",       name: "Delivery",        icon: "🛵", desc: "Errands & delivery" },
      { id: "photography",    name: "Photography",     icon: "📷", desc: "Photo & video shoots" },
      { id: "hair-dressing",  name: "Hair Dressing",   icon: "💇", desc: "Braiding, styling, cuts" },
    ],
  },
  food: {
    type: "food",
    name: "Food",
    icon: "🍛",
    subcategories: [
      { id: "cooked-meals",  name: "Cooked Meals",  icon: "🍛", desc: "Achu, Eru, Jollof, etc" },
      { id: "street-food",   name: "Street Food",   icon: "🌯", desc: "Suya, Puff puff, Shawarma" },
      { id: "catering",      name: "Catering",      icon: "🎉", desc: "Events, parties" },
      { id: "african-food",  name: "African Food",  icon: "🍲", desc: "Traditional Cameroonian dishes" },
      { id: "fufu-eru",      name: "Fufu & Eru",    icon: "🥬", desc: "Fufu corn with Eru" },
      { id: "achu",          name: "Achu",          icon: "🍵", desc: "Achu & yellow soup" },
      { id: "khati-khati",   name: "Khati Khati",   icon: "🍖", desc: "Spicy Cameroonian stew" },
      { id: "bakeries",      name: "Bakeries & Pastries", icon: "🥐", desc: "Bread, cakes, pastries" },
      { id: "drinks-juice",  name: "Drinks & Juice", icon: "🥤", desc: "Cold drinks, fresh juice" },
    ],
  },
  groceries: {
    type: "groceries",
    name: "Groceries",
    icon: "🛒",
    subcategories: [
      { id: "staples",    name: "Staples",            icon: "🍚", desc: "Rice, Beans, Garri" },
      { id: "oil-spices", name: "Oil & Spices",       icon: "🧂", desc: "Palm oil, Maggi" },
      { id: "produce",    name: "Fruits & Vegetables", icon: "🥬", desc: "Plantain, Tomatoes" },
    ],
  },
  fashion: {
    type: "fashion",
    name: "Fashion",
    icon: "👗",
    subcategories: [
      { id: "mens-wear",   name: "Men's Wear",    icon: "👔", desc: "Shirts, Trousers" },
      { id: "womens-wear", name: "Women's Wear",  icon: "👗", desc: "Dresses, Skirts" },
      { id: "shoes-bags",  name: "Shoes & Bags",  icon: "👠", desc: "Shoes, Handbags" },
    ],
  },
  electronics: {
    type: "electronics",
    name: "Electronics",
    icon: "📱",
    subcategories: [
      { id: "phones",           name: "Phones & Accessories", icon: "📱", desc: "iPhone, Samsung" },
      { id: "computers",        name: "Computers",            icon: "💻", desc: "Laptops, Desktops" },
      { id: "home-electronics", name: "Home Electronics",     icon: "📺", desc: "TV, Fridge" },
    ],
  },
};

/** All categories as an ordered array for iteration. */
export const CATEGORIES: Category[] = Object.values(categoryData);

// --- Lookup helpers ---

export function getCategory(type: string): Category | null {
  return categoryData[type] ?? null;
}

export function getSubcategory(type: string, subId: string): Subcategory | null {
  return categoryData[type]?.subcategories.find((s) => s.id === subId) ?? null;
}

export function getCategoryLabel(type: string): string {
  return categoryData[type]?.name ?? type;
}

export function getSubLabel(type: string, subId: string): string {
  return getSubcategory(type, subId)?.name ?? subId;
}
