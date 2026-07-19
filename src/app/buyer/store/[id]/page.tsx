"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import { EmptyState, Spinner } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import type { Product, Store } from "@/types";

export default function StorePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, storeId, lines } = useCart();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStore() {
      const snap = await getDoc(doc(db, "stores", params.id));
      setStore(snap.exists() ? ({ id: snap.id, ...snap.data() } as Store) : null);
    }
    loadStore();

    const q = query(collection(db, "products"), where("storeId", "==", params.id));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    });
    return () => unsub();
  }, [params.id]);

  const whatsappHref = store
    ? `https://wa.me/?text=${encodeURIComponent(
        `Order from ${store.name} on BUMAP: ${typeof window !== "undefined" ? window.location.href : ""}`
      )}`
    : "#";

  if (loading) return (<><Navbar /><Spinner /></>);
  if (!store) return (<><Navbar /><EmptyState text="Store not found." /></>);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="card flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
            {store.logoUrl && <Image src={store.logoUrl} alt={store.name} fill sizes="80px" className="object-cover" />}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{store.name}</h1>
            <p className="text-sm text-neutral-500">{store.category} · {store.location}</p>
            <p className={`mt-1 badge ${store.isOpen ? "bg-brand-100 text-brand-800" : "bg-red-100 text-red-700"}`}>
              {store.isOpen ? "Open" : "Closed"}
            </p>
          </div>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-secondary !py-2 !px-3 text-sm">
            📱 Share
          </a>
        </div>
        <p className="mt-3 text-sm text-neutral-600">{store.description}</p>

        <h2 className="mt-6 mb-3 font-bold">Menu</h2>
        {products.length === 0 ? (
          <EmptyState text="This store hasn't added any items yet." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => (
              <div key={p.id} className="card flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill sizes="64px" className="object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-neutral-500 line-clamp-1">{p.description}</p>
                  <p className="mt-1 font-bold text-brand-700">{formatFcfa(p.price)}</p>
                </div>
                <button
                  className="btn-primary self-center !py-1.5 !px-3 text-sm"
                  disabled={!p.available || !store.isOpen}
                  onClick={() => addItem(p)}
                >
                  {p.available ? "Add" : "Sold out"}
                </button>
              </div>
            ))}
          </div>
        )}

        {lines.length > 0 && storeId === store.id && (
          <button onClick={() => router.push("/buyer/cart")} className="btn-primary fixed bottom-4 left-1/2 w-[90%] max-w-sm -translate-x-1/2 shadow-lg">
            View Cart ({lines.length}) →
          </button>
        )}
      </main>
    </>
  );
}
