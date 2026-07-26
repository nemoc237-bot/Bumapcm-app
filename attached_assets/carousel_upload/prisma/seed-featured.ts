// prisma/seed-featured.ts
//
// Adds demo Products to the 4 stores seeded earlier (prisma/seed.ts) and
// puts one of them in each FeaturedTier, so the carousel has real,
// working, tier-varied data to render immediately.
//
// Requires prisma/seed.ts to have run first (it looks up stores by name).
// Idempotent: checks for an existing product with the same title + store
// before creating, and upserts each product's FeaturedListing rather than
// duplicating it.
//
// Run with: npx ts-node prisma/seed-featured.ts

import { PrismaClient, FeaturedTier } from "@prisma/client";

const prisma = new PrismaClient();

const DAYS = 24 * 60 * 60 * 1000;

type DemoProductSeed = {
  storeName: string; // must match a store created by prisma/seed.ts
  title: string;
  price: number;
  priceUnit: string;
  description: string;
  images: string[];
  category: string;
  subcategory: string;
  featuredTier: FeaturedTier;
  featuredDays: number; // how many days from now this listing stays featured
};

const DEMO_PRODUCTS: DemoProductSeed[] = [
  {
    storeName: "Cityview Apartments by BUMAP",
    title: "Cityview 1-Bedroom — Molyko",
    price: 25000,
    priceUnit: "FCFA/night",
    description:
      "Fully furnished 1-bedroom apartment in Buea. 24/7 water, WiFi, AC, secured parking.",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    ],
    category: "Houses",
    subcategory: "Apartment",
    featuredTier: FeaturedTier.GOLD,
    featuredDays: 14,
  },
  {
    storeName: "Rose Garden Guesthouse",
    title: "Rose Garden — Cozy Double Room",
    price: 18000,
    priceUnit: "FCFA/night",
    description: "Breakfast included, restaurant on-site, 24hr security. 5min from UB.",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    ],
    category: "Houses",
    subcategory: "Guesthouse",
    featuredTier: FeaturedTier.SILVER,
    featuredDays: 7,
  },
  {
    storeName: "Scholars Nest Hostel",
    title: "Scholars Nest — Shared Bed",
    price: 8000,
    priceUnit: "FCFA/bed/night",
    description: "Student-friendly hostel. WiFi, laundry, study area. Monthly & daily rates.",
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    ],
    category: "Houses",
    subcategory: "Hostel",
    featuredTier: FeaturedTier.SILVER,
    featuredDays: 7,
  },
  {
    storeName: "House Essentials Shop",
    title: "Queen Size Mattress",
    price: 45000,
    priceUnit: "FCFA",
    description: "Quality foam mattress, delivery available in Buea.",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
    ],
    category: "Houses",
    subcategory: "Shop",
    featuredTier: FeaturedTier.BRONZE,
    featuredDays: 3,
  },
  {
    storeName: "House Essentials Shop",
    title: "5-Piece Kitchenware Set",
    price: 15000,
    priceUnit: "FCFA",
    description: "Pots, pans, and utensils bundle — everything to start a kitchen.",
    images: [
      "https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=800&q=80",
    ],
    category: "Houses",
    subcategory: "Shop",
    featuredTier: FeaturedTier.BRONZE,
    featuredDays: 3,
  },
];

async function main() {
  console.log("Seeding demo products + featured listings…");

  for (const demo of DEMO_PRODUCTS) {
    const store = await prisma.store.findFirst({
      where: { name: demo.storeName, isDemo: true },
      select: { id: true, name: true },
    });

    if (!store) {
      console.warn(
        `  ⚠ Skipping "${demo.title}" — store "${demo.storeName}" not found. Run prisma/seed.ts first.`
      );
      continue;
    }

    let product = await prisma.product.findFirst({
      where: { storeId: store.id, title: demo.title },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          storeId: store.id,
          title: demo.title,
          price: demo.price,
          priceUnit: demo.priceUnit,
          description: demo.description,
          images: demo.images,
          category: demo.category,
          subcategory: demo.subcategory,
        },
      });
      console.log(`  ✓ Created product "${product.title}"`);
    } else {
      console.log(`  ↺ Product "${product.title}" already exists`);
    }

    // Upsert the featured slot so re-running the script refreshes the
    // expiry instead of erroring on the unique productId constraint.
    await prisma.featuredListing.upsert({
      where: { productId: product.id },
      update: {
        tier: demo.featuredTier,
        expiresAt: new Date(Date.now() + demo.featuredDays * DAYS),
      },
      create: {
        productId: product.id,
        tier: demo.featuredTier,
        expiresAt: new Date(Date.now() + demo.featuredDays * DAYS),
      },
    });
    console.log(`    → Featured as ${demo.featuredTier} for ${demo.featuredDays} day(s)`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Featured seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
