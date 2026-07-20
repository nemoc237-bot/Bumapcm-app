/**
 * BUMAP Demo Seed Data
 * Run via:  POST /api/seed   (protected by SEED_SECRET header)
 *
 * Creates:
 *  - 1 settings doc
 *  - 4 seller users  + 4 stores  + ~4 products each
 *  - 3 driver users  + 3 driver docs
 *  - 12 listings     (houses, items, services, food, groceries, fashion, electronics)
 */

import type { Firestore } from "firebase-admin/firestore";

// ─── helpers ────────────────────────────────────────────────────────────────

const now = Date.now();
const ago = (days: number) => now - days * 86_400_000;

function fakePhotoUrl(seed: string | number) {
  return `https://picsum.photos/seed/${seed}/400/400`;
}

// ─── settings ───────────────────────────────────────────────────────────────

export const settings = {
  bikeBaseFee: 500,
  taxiBaseFee: 1000,
  perKmRate: 150,
};

// ─── sellers ────────────────────────────────────────────────────────────────

export const sellers = [
  {
    id: "demo-seller-1",
    role: "seller",
    name: "Amina Ngole",
    phone: "6701234001",
    email: "amina@demo.bumap",
    idPhotoUrl: fakePhotoUrl("amina-id"),
    selfieUrl: fakePhotoUrl("amina-selfie"),
    verified: true,
    banned: false,
    location: "Molyko",
    createdAt: ago(30),
  },
  {
    id: "demo-seller-2",
    role: "seller",
    name: "Bertrand Fon",
    phone: "6701234002",
    email: "bertrand@demo.bumap",
    idPhotoUrl: fakePhotoUrl("bert-id"),
    selfieUrl: fakePhotoUrl("bert-selfie"),
    verified: true,
    banned: false,
    location: "Mile 16",
    createdAt: ago(25),
  },
  {
    id: "demo-seller-3",
    role: "seller",
    name: "Cynthia Mbi",
    phone: "6701234003",
    email: "cynthia@demo.bumap",
    idPhotoUrl: fakePhotoUrl("cynthia-id"),
    selfieUrl: fakePhotoUrl("cynthia-selfie"),
    verified: true,
    banned: false,
    location: "Bonduma",
    createdAt: ago(20),
  },
  {
    id: "demo-seller-4",
    role: "seller",
    name: "David Epie",
    phone: "6701234004",
    email: "david@demo.bumap",
    idPhotoUrl: fakePhotoUrl("david-id"),
    selfieUrl: fakePhotoUrl("david-selfie"),
    verified: true,
    banned: false,
    location: "Great Soppo",
    createdAt: ago(15),
  },
];

// ─── stores ─────────────────────────────────────────────────────────────────

export const stores = [
  {
    id: "demo-store-food",
    sellerId: "demo-seller-1",
    name: "Amina's Kitchen",
    category: "Food",
    description: "Authentic Cameroonian home cooked meals — Eru, Achu, Ndolé and more. Fresh daily.",
    logoUrl: fakePhotoUrl("amina-store"),
    momoNumber: "6701234001",
    momoProvider: "MTN MoMo",
    location: "Molyko, beside UB Gate",
    isOpen: true,
    verified: true,
    createdAt: ago(28),
  },
  {
    id: "demo-store-groceries",
    sellerId: "demo-seller-2",
    name: "Fon Fresh Market",
    category: "Groceries",
    description: "Fresh vegetables, palm oil, groundnuts and daily supplies from Mile 16 farms.",
    logoUrl: fakePhotoUrl("bert-store"),
    momoNumber: "6701234002",
    momoProvider: "Orange Money",
    location: "Mile 16 Market",
    isOpen: true,
    verified: true,
    createdAt: ago(23),
  },
  {
    id: "demo-store-fashion",
    sellerId: "demo-seller-3",
    name: "Cynthia's Boutique",
    category: "Fashion",
    description: "Ladies and gents fashion — Ankara prints, casual wear, and school uniforms.",
    logoUrl: fakePhotoUrl("cynthia-store"),
    momoNumber: "6701234003",
    momoProvider: "MTN MoMo",
    location: "Bonduma Market",
    isOpen: true,
    verified: true,
    createdAt: ago(18),
  },
  {
    id: "demo-store-electronics",
    sellerId: "demo-seller-4",
    name: "Epie Tech Hub",
    category: "Electronics",
    description: "Phones, accessories, chargers, power banks and laptop repairs. Great Soppo.",
    logoUrl: fakePhotoUrl("david-store"),
    momoNumber: "6701234004",
    momoProvider: "Orange Money",
    location: "Great Soppo Junction",
    isOpen: true,
    verified: true,
    createdAt: ago(13),
  },
];

// ─── products ────────────────────────────────────────────────────────────────

export const products = [
  // Amina's Kitchen — Food
  {
    id: "prod-eru-1",
    storeId: "demo-store-food",
    name: "Eru & Waterfufu (Plate)",
    price: 1500,
    imageUrl: fakePhotoUrl("eru-waterfufu"),
    description: "Large plate of Eru cooked with crayfish, palm oil and soft waterfufu.",
    available: true,
    weightKg: 0.8,
    createdAt: ago(10),
  },
  {
    id: "prod-achu-1",
    storeId: "demo-store-food",
    name: "Achu & Yellow Soup",
    price: 1200,
    imageUrl: fakePhotoUrl("achu-soup"),
    description: "Fresh pounded achu with yellow huckleberry soup and smoked fish.",
    available: true,
    weightKg: 0.9,
    createdAt: ago(9),
  },
  {
    id: "prod-ndole-1",
    storeId: "demo-store-food",
    name: "Ndolé & Plantain",
    price: 1800,
    imageUrl: fakePhotoUrl("ndole-plantain"),
    description: "Authentic Ndolé with grilled plantain and choice of beef or fish.",
    available: true,
    weightKg: 1.0,
    createdAt: ago(8),
  },
  {
    id: "prod-jollof-1",
    storeId: "demo-store-food",
    name: "Jollof Rice & Chicken",
    price: 1500,
    imageUrl: fakePhotoUrl("jollof-chicken"),
    description: "Spicy Cameroonian jollof rice with a full piece of fried chicken.",
    available: true,
    weightKg: 0.9,
    createdAt: ago(7),
  },

  // Fon Fresh Market — Groceries
  {
    id: "prod-palmoil-1",
    storeId: "demo-store-groceries",
    name: "Red Palm Oil (1 Litre)",
    price: 1200,
    imageUrl: fakePhotoUrl("palm-oil"),
    description: "Fresh unrefined red palm oil from Mile 16 farms. Rich & natural.",
    available: true,
    weightKg: 1.0,
    createdAt: ago(12),
  },
  {
    id: "prod-tomatoes-1",
    storeId: "demo-store-groceries",
    name: "Fresh Tomatoes (1 kg)",
    price: 500,
    imageUrl: fakePhotoUrl("tomatoes"),
    description: "Fresh red tomatoes, harvested daily from local farms.",
    available: true,
    weightKg: 1.0,
    createdAt: ago(11),
  },
  {
    id: "prod-groundnuts-1",
    storeId: "demo-store-groceries",
    name: "Groundnuts — Raw (500g)",
    price: 600,
    imageUrl: fakePhotoUrl("groundnuts"),
    description: "Clean, dry raw groundnuts. Great for soup or roasting.",
    available: true,
    weightKg: 0.5,
    createdAt: ago(10),
  },
  {
    id: "prod-huckleberry-1",
    storeId: "demo-store-groceries",
    name: "Huckleberry Leaves (Bunch)",
    price: 300,
    imageUrl: fakePhotoUrl("huckleberry"),
    description: "Fresh huckleberry (njama njama) leaves, perfect for stew.",
    available: true,
    weightKg: 0.3,
    createdAt: ago(9),
  },

  // Cynthia's Boutique — Fashion
  {
    id: "prod-ankara-dress-1",
    storeId: "demo-store-fashion",
    name: "Ankara Maxi Dress",
    price: 12000,
    imageUrl: fakePhotoUrl("ankara-dress"),
    description: "Vibrant Ankara print maxi dress, sizes S to XL. Custom fit available.",
    available: true,
    weightKg: 0.4,
    createdAt: ago(14),
  },
  {
    id: "prod-kaba-1",
    storeId: "demo-store-fashion",
    name: "Kaba & Slit Set",
    price: 18000,
    imageUrl: fakePhotoUrl("kaba-slit"),
    description: "Elegant kaba & slit set in Kente-inspired fabric. Tailored to order.",
    available: true,
    weightKg: 0.5,
    createdAt: ago(13),
  },
  {
    id: "prod-shirt-1",
    storeId: "demo-store-fashion",
    name: "Men's Senator Suit",
    price: 22000,
    imageUrl: fakePhotoUrl("senator-suit"),
    description: "Two-piece Nigerian senator suit, embroidered. Sizes M–3XL.",
    available: true,
    weightKg: 0.6,
    createdAt: ago(12),
  },
  {
    id: "prod-uniform-1",
    storeId: "demo-store-fashion",
    name: "School Uniform Set",
    price: 8000,
    imageUrl: fakePhotoUrl("school-uniform"),
    description: "Full school uniform set (shirt + trousers/skirt). Any school's colors.",
    available: true,
    weightKg: 0.5,
    createdAt: ago(11),
  },

  // Epie Tech Hub — Electronics
  {
    id: "prod-samsung-a15-1",
    storeId: "demo-store-electronics",
    name: "Samsung Galaxy A15 (128GB)",
    price: 115000,
    imageUrl: fakePhotoUrl("samsung-a15"),
    description: "Brand new Samsung Galaxy A15, 128GB storage, 4GB RAM. Full box.",
    available: true,
    weightKg: 0.3,
    createdAt: ago(7),
  },
  {
    id: "prod-charger-1",
    storeId: "demo-store-electronics",
    name: "USB-C Fast Charger 65W",
    price: 4500,
    imageUrl: fakePhotoUrl("usb-charger"),
    description: "65W GaN USB-C fast charger. Compatible with laptops, phones & tablets.",
    available: true,
    weightKg: 0.2,
    createdAt: ago(6),
  },
  {
    id: "prod-powerbank-1",
    storeId: "demo-store-electronics",
    name: "Power Bank 20000mAh",
    price: 12000,
    imageUrl: fakePhotoUrl("powerbank"),
    description: "High-capacity 20000mAh power bank with dual USB + USB-C output.",
    available: true,
    weightKg: 0.4,
    createdAt: ago(5),
  },
  {
    id: "prod-earbuds-1",
    storeId: "demo-store-electronics",
    name: "Wireless Earbuds (TWS)",
    price: 7500,
    imageUrl: fakePhotoUrl("earbuds"),
    description: "True wireless stereo earbuds with charging case, 6hr battery.",
    available: true,
    weightKg: 0.1,
    createdAt: ago(4),
  },
];

// ─── drivers ─────────────────────────────────────────────────────────────────

export const driverUsers = [
  {
    id: "demo-driver-1",
    role: "driver",
    name: "Elvis Mbah",
    phone: "6709990001",
    email: "elvis@demo.bumap",
    idPhotoUrl: fakePhotoUrl("elvis-id"),
    selfieUrl: fakePhotoUrl("elvis-selfie"),
    verified: true,
    banned: false,
    location: "Molyko",
    createdAt: ago(20),
  },
  {
    id: "demo-driver-2",
    role: "driver",
    name: "Francis Nkemdirim",
    phone: "6709990002",
    email: "francis@demo.bumap",
    idPhotoUrl: fakePhotoUrl("francis-id"),
    selfieUrl: fakePhotoUrl("francis-selfie"),
    verified: true,
    banned: false,
    location: "Bonduma",
    createdAt: ago(18),
  },
  {
    id: "demo-driver-3",
    role: "driver",
    name: "Grace Ewang",
    phone: "6709990003",
    email: "grace@demo.bumap",
    idPhotoUrl: fakePhotoUrl("grace-id"),
    selfieUrl: fakePhotoUrl("grace-selfie"),
    verified: true,
    banned: false,
    location: "Great Soppo",
    createdAt: ago(15),
  },
];

export const driverDocs = [
  {
    id: "demo-driver-1",
    userId: "demo-driver-1",
    vehicleType: "bike",
    plateNumber: "LT 1234 SW",
    licenseUrl: fakePhotoUrl("elvis-license"),
    vehiclePhotoUrl: fakePhotoUrl("elvis-bike"),
    isActive: true,
    currentLocation: { lat: 4.1537, lng: 9.2522 }, // Molyko
    verified: true,
    totalEarnings: 47500,
    completedDeliveries: 38,
  },
  {
    id: "demo-driver-2",
    userId: "demo-driver-2",
    vehicleType: "bike",
    plateNumber: "LT 5678 SW",
    licenseUrl: fakePhotoUrl("francis-license"),
    vehiclePhotoUrl: fakePhotoUrl("francis-bike"),
    isActive: true,
    currentLocation: { lat: 4.1498, lng: 9.2611 }, // Bonduma
    verified: true,
    totalEarnings: 31000,
    completedDeliveries: 24,
  },
  {
    id: "demo-driver-3",
    userId: "demo-driver-3",
    vehicleType: "taxi",
    plateNumber: "LT 9101 SW",
    licenseUrl: fakePhotoUrl("grace-license"),
    vehiclePhotoUrl: fakePhotoUrl("grace-taxi"),
    isActive: false,
    currentLocation: null,
    verified: true,
    totalEarnings: 88000,
    completedDeliveries: 61,
  },
];

// ─── listings (classifieds) ──────────────────────────────────────────────────

export const listings = [
  // Houses
  {
    id: "listing-house-1",
    type: "house",
    subcategory: "studio",
    title: "Self-Contained Studio — Molyko",
    price: 30000,
    description:
      "Clean self-contained studio with private bathroom, kitchen corner and security door. Near UB main gate. Water & light included.",
    location: "Molyko, Buea",
    contact: "6781000001",
    images: [fakePhotoUrl("studio-room")],
    postedBy: "demo-seller-1",
    createdAt: ago(5),
  },
  {
    id: "listing-house-2",
    type: "house",
    subcategory: "single-room",
    title: "Single Room — Bonduma (Shared Compound)",
    price: 15000,
    description:
      "Tiled single room in a quiet compound of 6 tenants. Shared kitchen & bathroom. Very close to Bonduma junction.",
    location: "Bonduma, Buea",
    contact: "6781000002",
    images: [fakePhotoUrl("single-room")],
    postedBy: "demo-seller-2",
    createdAt: ago(4),
  },
  {
    id: "listing-house-3",
    type: "house",
    subcategory: "2-bedroom",
    title: "2-Bedroom Apartment — Great Soppo",
    price: 55000,
    description:
      "Modern 2-bedroom apartment, fully tiled, CRTV road Great Soppo. Running water, ENEO connection, secure compound with gate.",
    location: "Great Soppo, Buea",
    contact: "6781000003",
    images: [fakePhotoUrl("2bedroom")],
    postedBy: "demo-seller-3",
    createdAt: ago(3),
  },

  // Items
  {
    id: "listing-item-1",
    type: "item",
    subcategory: "phones",
    title: "iPhone 12 — 64GB (Used, Good Condition)",
    price: 145000,
    description:
      "iPhone 12 in excellent condition. Battery health 87%, no cracks, comes with original charger. Reason for sale: upgrading.",
    location: "Molyko, Buea",
    contact: "6782000001",
    images: [fakePhotoUrl("iphone12")],
    postedBy: "demo-seller-4",
    createdAt: ago(6),
  },
  {
    id: "listing-item-2",
    type: "item",
    subcategory: "furniture",
    title: "Wooden Dining Table + 4 Chairs",
    price: 45000,
    description:
      "Solid wood dining table with 4 cushioned chairs. Barely used, moving out of Buea. Available for pickup in Bonduma.",
    location: "Bonduma, Buea",
    contact: "6782000002",
    images: [fakePhotoUrl("dining-table")],
    postedBy: "demo-seller-2",
    createdAt: ago(7),
  },
  {
    id: "listing-item-3",
    type: "item",
    subcategory: "beds-and-mattresses",
    title: "Queen Size Bed Frame + Foam Mattress",
    price: 60000,
    description:
      "Iron queen size bed frame with 10-inch foam mattress. Very clean. Selling because I bought a new one.",
    location: "Mile 16, Buea",
    contact: "6782000003",
    images: [fakePhotoUrl("bed-mattress")],
    postedBy: "demo-seller-3",
    createdAt: ago(8),
  },

  // Services
  {
    id: "listing-service-1",
    type: "service",
    subcategory: "graphics-design",
    title: "Professional Logo & Flyer Design",
    price: 5000,
    description:
      "I design logos, event flyers, business cards and social media graphics. Delivery in 24hrs. Revisions included.",
    location: "Molyko, Buea (Remote)",
    contact: "6783000001",
    images: [fakePhotoUrl("graphics-design")],
    postedBy: "demo-seller-1",
    createdAt: ago(9),
  },
  {
    id: "listing-service-2",
    type: "service",
    subcategory: "tailoring",
    title: "Tailoring — Ankara & Senator Styles",
    price: 8000,
    description:
      "Experienced tailor specializing in Ankara dresses, senators, uniforms and alterations. Quick turnaround. Based in Bonduma.",
    location: "Bonduma, Buea",
    contact: "6783000002",
    images: [fakePhotoUrl("tailoring-service")],
    postedBy: "demo-seller-3",
    createdAt: ago(10),
  },

  // Food
  {
    id: "listing-food-1",
    type: "food",
    subcategory: "cooked-meals",
    title: "Hot Eru & Waterfufu — Daily",
    price: 1500,
    description:
      "Fresh Eru cooked with dry fish, crayfish and palm oil. Served with soft waterfufu. Order by 11am for lunch delivery.",
    location: "Molyko, Buea",
    contact: "6701234001",
    images: [fakePhotoUrl("eru-listing")],
    postedBy: "demo-seller-1",
    createdAt: ago(2),
  },
  {
    id: "listing-food-2",
    type: "food",
    subcategory: "street-food",
    title: "Fresh Puff Puff & Beans — Morning",
    price: 200,
    description:
      "Hot puff puff and beans porridge every morning from 7am–10am. Come or order delivery. Near Molyko Roundabout.",
    location: "Molyko Roundabout, Buea",
    contact: "6784000002",
    images: [fakePhotoUrl("puff-puff")],
    postedBy: "demo-seller-2",
    createdAt: ago(1),
  },

  // Groceries
  {
    id: "listing-grocery-1",
    type: "groceries",
    subcategory: "fresh-produce",
    title: "Fresh Vegetables Bundle (Weekly)",
    price: 3500,
    description:
      "Weekly vegetable bundle: tomatoes, onions, pepper, huckleberry, cabbages. Delivered to your door from Mile 16 farms.",
    location: "Mile 16, Buea",
    contact: "6701234002",
    images: [fakePhotoUrl("veggie-bundle")],
    postedBy: "demo-seller-2",
    createdAt: ago(3),
  },

  // Fashion
  {
    id: "listing-fashion-1",
    type: "fashion",
    subcategory: "womens-wear",
    title: "Ankara Wrap Skirt — All Sizes",
    price: 6500,
    description:
      "Beautiful wrap skirts in various Ankara prints. Sizes XS–3XL available. Pickup Bonduma or pay for delivery.",
    location: "Bonduma, Buea",
    contact: "6701234003",
    images: [fakePhotoUrl("ankara-skirt")],
    postedBy: "demo-seller-3",
    createdAt: ago(4),
  },

  // Electronics
  {
    id: "listing-electronics-1",
    type: "electronics",
    subcategory: "phones-tablets",
    title: "Tecno Spark 20 — Brand New",
    price: 85000,
    description:
      "Brand new Tecno Spark 20, 256GB internal storage, 8GB RAM. Sealed box with 1-year warranty card. Great Soppo.",
    location: "Great Soppo, Buea",
    contact: "6701234004",
    images: [fakePhotoUrl("tecno-spark")],
    postedBy: "demo-seller-4",
    createdAt: ago(2),
  },
];

// ─── main seeder ─────────────────────────────────────────────────────────────

export async function runSeed(db: Firestore) {
  const results: string[] = [];

  // settings
  await db.collection("settings").doc("global").set(settings);
  results.push("✅ settings/global");

  // seller users
  for (const u of sellers) {
    await db.collection("users").doc(u.id).set(u);
  }
  results.push(`✅ ${sellers.length} seller users`);

  // driver users + driver docs
  for (const u of driverUsers) {
    await db.collection("users").doc(u.id).set(u);
  }
  for (const d of driverDocs) {
    await db.collection("drivers").doc(d.id).set(d);
  }
  results.push(`✅ ${driverUsers.length} drivers`);

  // stores
  for (const s of stores) {
    await db.collection("stores").doc(s.id).set(s);
  }
  results.push(`✅ ${stores.length} stores`);

  // products
  for (const p of products) {
    await db.collection("products").doc(p.id).set(p);
  }
  results.push(`✅ ${products.length} products`);

  // listings
  for (const l of listings) {
    await db.collection("listings").doc(l.id).set(l);
  }
  results.push(`✅ ${listings.length} listings`);

  return results;
}
