"use client";

// components/store/StoreGallery.tsx
//
// Swipeable image gallery. Uses native CSS scroll-snap instead of a carousel
// library — one less dependency, and scroll-snap is genuinely smoother than
// most JS carousels inside a WhatsApp in-app browser on a slow connection.

import { useRef, useState } from "react";
import Image from "next/image";

export function StoreGallery({ images, alt }: { images: string[]; alt: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }

  function goTo(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-stone-100 flex items-center justify-center text-stone-400 text-sm">
        No photos yet
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
      >
        {images.map((src, i) => (
          <div key={src + i} className="w-full flex-shrink-0 snap-center aspect-[4/3] relative">
            <Image
              src={src}
              alt={`${alt} photo ${i + 1}`}
              fill
              className="object-cover"
              // First image is above the fold — load it eagerly, defer the rest.
              priority={i === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
