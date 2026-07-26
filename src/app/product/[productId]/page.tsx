"use client";

/**
 * Product detail page — /product/[productId]
 *
 * Landing target for taps on the Featured Carousel (and any other product
 * link). Reads from the existing Firestore `products` collection and its
 * parent `stores` doc. Shows image, name, price, description, store name,
 * and a sticky "Chat on WhatsApp" CTA.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { Spinner, EmptyState } from "@/components/Shared";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatFcfa } from "@/lib/utils";
import type { Product, Store } from "@/types";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const productSnap = await getDoc(doc(db, "products", productId));
        if (!productSnap.exists()) { setLoading(false); return; }

        const p = { id: productSnap.id, ...productSnap.data() } as Product;
        setProduct(p);

        const storeSnap = await getDoc(doc(db, "stores", p.storeId));
        if (storeSnap.exists()) {
          setStore({ id: storeSnap.id, ...storeSnap.data() } as Store);
        }
      } catch {
        // permission or network error — fall through to "not found"
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  if (loading) return <><Navbar /><Spinner /></>;
  if (!product || !product.available) {
    return (
      <>
        <Navbar />
        <EmptyState text="This product is no longer available." />
      </>
    );
  }

  // Use the store's MoMo number as the WhatsApp contact (same number in Cameroon)
  const waPhone = store?.momoNumber ?? "";
  const waLink = waPhone ? buildWhatsAppLink(waPhone, product.name) : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl pb-28">
        {/* Hero image */}
        <div className="relative aspect-square w-full bg-neutral-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 672px) 100vw, 672px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-300">
              No photo
            </div>
          )}
        </div>

        <div className="px-4 pt-5 space-y-4">
          {/* Store link */}
          {store && (
            <Link
              href={`/buyer/store/${store.id}`}
              className="flex items-center gap-2 text-sm font-semibold text-brand-700"
            >
              {store.logoUrl && (
                <div className="relative h-6 w-6 overflow-hidden rounded-full bg-neutral-100">
                  <Image src={store.logoUrl} alt={store.name} fill sizes="24px" className="object-cover" />
                </div>
              )}
              {store.name} →
            </Link>
          )}

          {/* Product name + price */}
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900">{product.name}</h1>
            <p className="mt-1 text-xl font-bold text-brand-600">{formatFcfa(product.price)}</p>
          </div>

          {/* Store meta */}
          {store && (
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <span>📍 {store.location}</span>
              <span>·</span>
              <span>{store.category}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  store.isOpen ? "bg-brand-100 text-brand-800" : "bg-red-100 text-red-700"
                }`}
              >
                {store.isOpen ? "Open" : "Closed"}
              </span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed text-neutral-600">{product.description}</p>
          )}

          {/* Order in-app button (if store has products) */}
          {store && store.isOpen && (
            <button
              onClick={() => router.push(`/buyer/store/${store.id}`)}
              className="btn-secondary w-full"
            >
              View full store menu →
            </button>
          )}
        </div>
      </main>

      {/* Sticky WhatsApp CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white px-4 py-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary block w-full text-center"
          >
            💬 Chat on WhatsApp
          </a>
        ) : (
          store && (
            <button
              onClick={() => router.push(`/buyer/store/${store.id}`)}
              className="btn-primary w-full"
            >
              Order from {store.name}
            </button>
          )
        )}
        <p className="mt-1 text-center text-[11px] text-neutral-400">
          You'll be connected directly with the seller
        </p>
      </div>
    </>
  );
}
