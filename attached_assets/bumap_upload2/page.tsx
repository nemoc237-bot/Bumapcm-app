// app/houses/[storeId]/page.tsx
//
// Server component: fetches the store directly via Prisma (no client-side
// fetch needed for the initial render — faster first paint on slow Buea
// connections), then hands off to client components for anything
// interactive (gallery, booking modal, chat).

import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StoreGallery } from "@/components/store/StoreGallery";
import { AmenitiesGrid } from "@/components/store/AmenitiesGrid";
import { ReviewsSection } from "@/components/store/ReviewsSection";
import { StickyCta } from "@/components/store/StickyCta";
import { ChatDrawer } from "@/components/store/ChatDrawer";

// Re-fetch at most every 60s — store details don't change often enough to
// need fully dynamic rendering on every request.
export const revalidate = 60;

async function getStore(storeId: string) {
  return prisma.store.findUnique({ where: { id: storeId } });
}

export default async function StoreDetailPage({
  params,
}: {
  params: { storeId: string };
}) {
  const store = await getStore(params.storeId);

  if (!store || store.status !== "active") {
    notFound();
  }

  const formattedPrice =
    store.price > 0 ? `${store.price.toLocaleString()} FCFA` : null;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Gallery */}
      <StoreGallery images={store.images} alt={store.name} />

      <div className="px-4 pt-4">
        {/* Subcategory badge */}
        <span className="inline-block text-xs font-semibold text-[#1fb567] bg-[#1fb567]/10 px-2.5 py-1 rounded-full mb-2">
          {store.subcategory}
        </span>

        {/* Name */}
        <h1 className="text-xl font-bold text-stone-900">{store.name}</h1>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-stone-500 mt-1">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{store.location}</span>
        </div>

        {/* Price */}
        <div className="mt-3">
          {formattedPrice ? (
            <p className="text-2xl font-bold text-stone-900">
              {formattedPrice}
              <span className="text-sm font-normal text-stone-500 ml-1">
                {store.priceUnit}
              </span>
            </p>
          ) : (
            <p className="text-lg font-semibold text-stone-700">{store.priceUnit}</p>
          )}
          {store.monthlyPrice && (
            <p className="text-sm text-stone-500 mt-0.5">
              or {store.monthlyPrice.toLocaleString()} FCFA / month
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <section className="px-4 py-5 border-t border-stone-100 mt-4">
        <h2 className="font-bold text-stone-900 mb-2">About this place</h2>
        <p className="text-sm text-stone-600 leading-relaxed">{store.description}</p>
      </section>

      <AmenitiesGrid subcategory={store.subcategory} />
      <ReviewsSection />

      {/* Chat with landlord */}
      <ChatDrawer storeId={store.id} storeName={store.name} />

      {/* Sticky CTA bar */}
      <StickyCta
        storeId={store.id}
        storeName={store.name}
        subcategory={store.subcategory}
        contactWhatsApp={store.contactWhatsApp}
      />
    </div>
  );
}
