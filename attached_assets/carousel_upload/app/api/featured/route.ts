// app/api/featured/route.ts
//
// GET /api/featured
// Returns the current carousel order: expired FeaturedListings are excluded
// (that's the anti-stagnation mechanism from the spec), Gold is guaranteed
// top placement, Silver/Bronze are weighted-shuffled. Re-running this
// endpoint gives a fresh shuffle each time, so reloading the homepage
// doesn't always show the same order.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCarouselOrder, type FeaturedItem } from "@/lib/featured";

export async function GET() {
  const listings = await prisma.featuredListing.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: {
      product: {
        include: {
          store: { select: { id: true, name: true, contactWhatsApp: true } },
        },
      },
    },
  });

  const items: FeaturedItem<{
    id: string;
    title: string;
    price: number;
    priceUnit: string;
    image: string | null;
    storeId: string;
    storeName: string;
    tier: string;
  }>[] = listings
    .filter((l) => l.product.inStock) // don't feature something that's out of stock
    .map((l) => ({
      tier: l.tier,
      item: {
        id: l.product.id,
        title: l.product.title,
        price: l.product.price,
        priceUnit: l.product.priceUnit,
        image: l.product.images[0] ?? null,
        storeId: l.product.store.id,
        storeName: l.product.store.name,
        tier: l.tier,
      },
    }));

  const ordered = buildCarouselOrder(items);

  return NextResponse.json({ items: ordered });
}
