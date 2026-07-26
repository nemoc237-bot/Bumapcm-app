// app/product/[productId]/page.tsx
//
// Minimal product detail page — enough to make the carousel's tap target
// real and working for the demo. Not as elaborate as the Houses store page
// (no gallery carousel/amenities) since that wasn't in scope for this task;
// extend it later using StoreGallery/AmenitiesGrid patterns from the Houses
// delivery if you want full parity.

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const revalidate = 60;

export default async function ProductDetailPage({
  params,
}: {
  params: { productId: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: { store: true },
  });

  if (!product || !product.inStock) notFound();

  const waLink = buildWhatsAppLink(product.store.contactWhatsApp, product.title);

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="relative w-full aspect-square bg-stone-100">
        {product.images[0] ? (
          <Image src={product.images[0]} alt={product.title} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm">
            No photo
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {/* Links to the Houses store detail route built earlier — once a
            generic /store/[storeId] page exists for all categories (per the
            v2 marketplace spec), swap this href to that instead. */}
        <Link href={`/houses/${product.store.id}`} className="text-xs text-[#1fb567] font-semibold">
          {product.store.name} →
        </Link>
        <h1 className="text-xl font-bold text-stone-900 mt-1">{product.title}</h1>

        <div className="flex items-center gap-1 text-sm text-stone-500 mt-1">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{product.store.location}</span>
        </div>

        <p className="text-2xl font-bold text-stone-900 mt-3">
          {product.price > 0
            ? `${product.price.toLocaleString()} ${product.priceUnit}`
            : product.priceUnit}
        </p>

        {product.description && (
          <p className="text-sm text-stone-600 leading-relaxed mt-4">{product.description}</p>
        )}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-3 z-20"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 rounded-xl bg-[#1fb567] text-white font-semibold"
        >
          Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
