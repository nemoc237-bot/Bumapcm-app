"use client";

// components/home/FeaturedCarousel.tsx
//
// Placement: between the hero and the category tiles on the homepage.
// - Auto-advances every 4s
// - Pauses while the user is touching/dragging (so auto-advance never
//   fights a real swipe)
// - Each card: image, price, "Sponsored" tag, store name
// - Tapping a card goes to that product's detail page

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type FeaturedProduct = {
  id: string;
  title: string;
  price: number;
  priceUnit: string;
  image: string | null;
  storeId: string;
  storeName: string;
  tier: "BRONZE" | "SILVER" | "GOLD";
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
    fetch("/api/featured")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-advance
  useEffect(() => {
    if (paused || items.length <= 1) return;
    const el = scrollerRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      const cardWidth = el.firstElementChild?.clientWidth ?? el.clientWidth;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + cardWidth + 12, // +12 = gap
        behavior: "smooth",
      });
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(interval);
  }, [paused, items.length]);

  // Nothing to show and not loading -> render nothing rather than an empty
  // section (e.g. before any vendor has bought a featured slot yet).
  if (!loading && items.length === 0) return null;

  return (
    <section className="py-4">
      <div className="px-4 flex items-center justify-between mb-2">
        <h2 className="font-bold text-stone-900">🔥 Trending on BUMAP</h2>
        <span className="text-[11px] text-stone-400">Sponsored placements</span>
      </div>

      {loading ? (
        <div className="flex gap-3 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-40 h-48 flex-shrink-0 rounded-2xl bg-stone-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          ref={scrollerRef}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="flex gap-3 px-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
        >
          {items.map((product) => (
            <button
              key={product.id}
              onClick={() => router.push(`/product/${product.id}`)}
              className="w-40 flex-shrink-0 snap-start text-left bg-white rounded-2xl shadow border border-stone-100 overflow-hidden"
            >
              <div className="relative w-full h-28 bg-stone-100">
                {product.image ? (
                  <Image src={product.image} alt={product.title} fill className="object-cover" sizes="160px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">
                    No photo
                  </div>
                )}
                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  Sponsored
                </span>
              </div>
              <div className="p-2.5">
                <p className="text-sm font-semibold text-stone-900 truncate">{product.title}</p>
                <p className="text-xs font-bold text-[#1fb567] mt-0.5">
                  {product.price > 0
                    ? `${product.price.toLocaleString()} ${product.priceUnit}`
                    : product.priceUnit}
                </p>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">{product.storeName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
