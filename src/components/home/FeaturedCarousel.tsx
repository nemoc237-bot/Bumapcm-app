"use client";

/**
 * FeaturedCarousel — "🔥 Trending on BUMAP"
 *
 * Reads directly from Firestore `featuredListings` collection (no API route
 * needed — Firebase client SDK handles this). Expired listings are excluded
 * at query time. Gold items always lead; Silver/Bronze are weighted-shuffled
 * via the A-Res algorithm in lib/featured.ts.
 *
 * Placement: between the hero and the category tiles on the homepage.
 *
 * Firestore document shape (featuredListings/{id}):
 *   productId   string
 *   tier        "GOLD" | "SILVER" | "BRONZE"
 *   expiresAt   number  (ms timestamp — listing stops appearing after this)
 *   title       string  (denormalized from product.name)
 *   price       number  (FCFA; 0 = contact for price)
 *   priceUnit   string  ("FCFA", "FCFA/month", "Contact for price" …)
 *   image       string | null  (denormalized from product.imageUrl)
 *   storeId     string
 *   storeName   string
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildCarouselOrder, type FeaturedItem, type FeaturedTier } from "@/lib/featured";

type FeaturedProduct = {
  id: string;          // Firestore doc id of the featuredListing
  productId: string;
  title: string;
  price: number;
  priceUnit: string;
  image: string | null;
  storeId: string;
  storeName: string;
  tier: FeaturedTier;
};

const AUTO_ADVANCE_MS = 4000;

export function FeaturedCarousel() {
  const [items, setItems] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const now = Date.now();
        const q = query(
          collection(db, "featuredListings"),
          where("expiresAt", ">", now)
        );
        const snap = await getDocs(q);

        const raw: FeaturedItem<FeaturedProduct>[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            tier: data.tier as FeaturedTier,
            item: {
              id: d.id,
              productId: data.productId,
              title: data.title,
              price: data.price,
              priceUnit: data.priceUnit,
              image: data.image ?? null,
              storeId: data.storeId,
              storeName: data.storeName,
              tier: data.tier as FeaturedTier,
            },
          };
        });

        if (!cancelled) setItems(buildCarouselOrder(raw));
      } catch {
        // Silently skip — carousel simply won't render if data unavailable
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Auto-advance
  useEffect(() => {
    if (paused || items.length <= 1) return;
    const el = scrollerRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      const cardWidth = (el.firstElementChild as HTMLElement)?.offsetWidth ?? el.clientWidth;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + cardWidth + 12, // +12 = gap
        behavior: "smooth",
      });
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(interval);
  }, [paused, items.length]);

  // Don't render an empty section before any vendor has a featured slot
  if (!loading && items.length === 0) return null;

  return (
    <section className="py-4">
      <div className="mb-2 flex items-center justify-between px-4">
        <h2 className="font-bold text-neutral-900">🔥 Trending on BUMAP</h2>
        <span className="text-[11px] text-neutral-400">Sponsored</span>
      </div>

      {loading ? (
        <div className="flex gap-3 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 w-40 flex-shrink-0 animate-pulse rounded-2xl bg-neutral-200" />
          ))}
        </div>
      ) : (
        <div
          ref={scrollerRef}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory px-4"
        >
          {items.map((product) => (
            <button
              key={product.id}
              onClick={() => router.push(`/product/${product.productId}`)}
              className="w-40 flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-neutral-100 bg-white text-left shadow-sm transition hover:shadow-md"
            >
              <div className="relative h-28 w-full bg-neutral-100">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-neutral-300">
                    No photo
                  </div>
                )}
                <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {product.tier === "GOLD" ? "⭐ Gold" : "Sponsored"}
                </span>
              </div>
              <div className="p-2.5">
                <p className="truncate text-sm font-semibold text-neutral-900">{product.title}</p>
                <p className="mt-0.5 text-xs font-bold text-brand-600">
                  {product.price > 0
                    ? `${product.price.toLocaleString()} ${product.priceUnit}`
                    : product.priceUnit}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-neutral-400">{product.storeName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
