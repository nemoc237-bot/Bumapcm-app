// prisma/seed.ts
//
// Seeds 4 demo stores, one per Houses subcategory (Apartment, Guesthouse,
// Hostel, Shop). Safe to run multiple times: each store is looked up by
// name first, and creation is skipped if it already exists. We check by
// name rather than adding a DB-level unique constraint on `name`, since
// real (non-demo) stores may legitimately share a name later.
//
// Run with: npx ts-node prisma/seed.ts
// or wire into package.json:  "prisma": { "seed": "ts-node prisma/seed.ts" }
// then: npx prisma db seed

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Placeholder images via Unsplash's source endpoint — swap for real listing
// photos once hosts upload their own. Kept thematically relevant per store.
const APARTMENT_IMAGES = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80",
];

const GUESTHOUSE_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
  "https://images.unsplash.com/photo-1521783988139-89397d761dce?w=1200&q=80",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
];

const HOSTEL_IMAGES = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80",
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80",
  "https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=1200&q=80",
];

const SHOP_IMAGES = [
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
];

// Demo WhatsApp numbers — replace with real host numbers before going live.
const DEMO_WHATSAPP = "237670000001";

const DEMO_STORES = [
  {
    name: "Cityview Apartments by BUMAP",
    category: "Houses",
    subcategory: "Apartment",
    description:
      "Fully furnished 1-bedroom apartment in Buea. 24/7 water, WiFi, AC, secured parking. Perfect for students & visitors.",
    price: 25000,
    priceUnit: "per night",
    monthlyPrice: null,
    location: "Buea, Molyko, Southwest Region, CM",
    images: APARTMENT_IMAGES,
    contactWhatsApp: DEMO_WHATSAPP,
  },
  {
    name: "Rose Garden Guesthouse",
    category: "Houses",
    subcategory: "Guesthouse",
    description:
      "Cozy guesthouse with 8 rooms. Breakfast included, restaurant on-site, 24hr security. 5min from UB.",
    price: 18000,
    priceUnit: "per night",
    monthlyPrice: null,
    location: "Buea, Great Soppo, Southwest Region, CM",
    images: GUESTHOUSE_IMAGES,
    contactWhatsApp: DEMO_WHATSAPP,
  },
  {
    name: "Scholars Nest Hostel",
    category: "Houses",
    subcategory: "Hostel",
    description:
      "Student-friendly hostel. Shared rooms + private rooms. WiFi, laundry, study area. Monthly & daily rates.",
    price: 8000,
    priceUnit: "per bed per night",
    monthlyPrice: 60000,
    location: "Buea, Bonduma, Southwest Region, CM",
    images: HOSTEL_IMAGES,
    contactWhatsApp: DEMO_WHATSAPP,
  },
  {
    name: "House Essentials Shop",
    category: "Houses",
    subcategory: "Shop",
    description:
      "One-stop shop for house items: mattresses, kitchenware, fans, and house furniture. Delivery available in Buea.",
    price: 0,
    priceUnit: "Contact for price",
    monthlyPrice: null,
    location: "Buea, Mile 4, Southwest Region, CM",
    images: SHOP_IMAGES,
    contactWhatsApp: DEMO_WHATSAPP,
  },
] as const;

async function main() {
  console.log("Seeding BUMAP demo stores…");

  for (const store of DEMO_STORES) {
    const existing = await prisma.store.findFirst({
      where: { name: store.name, isDemo: true },
      select: { id: true },
    });

    if (existing) {
      console.log(`  ↺ Skipping "${store.name}" — already exists (${existing.id})`);
      continue;
    }

    const created = await prisma.store.create({
      data: {
        ...store,
        isDemo: true,
        status: "active",
      },
    });

    console.log(`  ✓ Created "${created.name}" (${created.id})`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
