"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import { EmptyState, Spinner } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import StoreChatDrawer from "@/components/StoreChatDrawer";
import type { Product, Store } from "@/types";

// ─── Order modal ─────────────────────────────────────────────────────────────

interface OrderModalProps {
  product: Product;
  store: Store;
  onClose: () => void;
}

function OrderModal({ product, store, onClose }: OrderModalProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [dropoff, setDropoff] = useState(profile?.location ?? "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function placeOrder() {
    if (!profile) {
      router.push("/login");
      return;
    }
    if (!dropoff.trim()) {
      setError("Please enter your delivery address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const total = product.price * qty;
      const orderRef = await addDoc(collection(db, "orders"), {
        buyerId: profile.id,
        buyerName: profile.name,
        buyerPhone: profile.phone,
        sellerId: store.sellerId,
        storeId: store.id,
        storeName: store.name,
        items: [{ productId: product.id, name: product.name, price: product.price, qty }],
        total,
        deliveryFee: 0,
        deliveryType: null,
        note: note.trim() || null,
        status: "pending_payment",
        paymentScreenshotUrl: null,
        paymentConfirmedBySeller: false,
        driverId: null,
        pickupLocation: store.location,
        dropoffLocation: dropoff.trim(),
        buyerConfirmedDelivery: false,
        sellerConfirmedDelivery: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      router.push(`/chat/${orderRef.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not place order.");
      setSubmitting(false);
    }
  }

  const providerColor =
    store.momoProvider === "MTN MoMo"
      ? "bg-yellow-50 border-yellow-300 text-yellow-900"
      : "bg-orange-50 border-orange-300 text-orange-900";

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        {/* Product info */}
        <div className="flex items-center gap-3 border-b pb-4">
          {product.imageUrl && (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
              <Image src={product.imageUrl} alt={product.name} fill sizes="56px" className="object-cover" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-bold">{product.name}</p>
            <p className="text-sm text-brand-700 font-semibold">{formatFcfa(product.price)} each</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-xl leading-none">✕</button>
        </div>

        {/* Quantity selector */}
        <div className="mt-4">
          <label className="label">How many do you want?</label>
          <div className="mt-1 flex items-center gap-4">
            <button
              className="h-10 w-10 rounded-full bg-neutral-100 text-xl font-bold hover:bg-brand-100"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="w-8 text-center text-xl font-bold">{qty}</span>
            <button
              className="h-10 w-10 rounded-full bg-neutral-100 text-xl font-bold hover:bg-brand-100"
              onClick={() => setQty((q) => q + 1)}
            >
              +
            </button>
            <span className="ml-auto font-bold text-lg text-brand-700">
              {formatFcfa(product.price * qty)}
            </span>
          </div>
        </div>

        {/* Delivery location */}
        <div className="mt-4">
          <label className="label">Delivery address</label>
          <input
            className="input mt-1"
            placeholder="e.g. Molyko, near UB gate"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
          />
        </div>

        {/* Note */}
        <div className="mt-3">
          <label className="label">Note for seller (optional)</label>
          <input
            className="input mt-1"
            placeholder="e.g. extra pepper, no onions…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* MoMo info — locked */}
        <div className={`mt-4 rounded-xl border-2 px-4 py-3 ${providerColor}`}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Payment via {store.momoProvider} 🔒
          </p>
          <p className="mt-0.5 text-xl font-extrabold tracking-widest">{store.momoNumber}</p>
          <p className="text-xs opacity-60">
            Send payment to this number after placing your order, then upload the screenshot in the chat.
          </p>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          className="btn-primary mt-4 w-full"
          disabled={submitting}
          onClick={placeOrder}
        >
          {submitting ? "Placing order…" : `Place Order & Open Chat →`}
        </button>
        {!profile && (
          <p className="mt-2 text-center text-xs text-neutral-500">
            You need to{" "}
            <a href="/login" className="font-semibold text-brand-700 underline">log in</a>{" "}
            to place an order.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Store page ───────────────────────────────────────────────────────────────

export default function StorePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, storeId, lines } = useCart();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderTarget, setOrderTarget] = useState<Product | null>(null);

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

  if (loading) return (<><Navbar /><Spinner /></>);
  if (!store) return (<><Navbar /><EmptyState text="Store not found." /></>);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Store header */}
        <div className="card flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
            {store.logoUrl && (
              <Image src={store.logoUrl} alt={store.name} fill sizes="80px" className="object-cover" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{store.name}</h1>
            <p className="text-sm text-neutral-500">{store.category} · {store.location}</p>
            <span className={`mt-1 badge ${store.isOpen ? "bg-brand-100 text-brand-800" : "bg-red-100 text-red-700"}`}>
              {store.isOpen ? "Open" : "Closed"}
            </span>
          </div>
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
                  {p.imageUrl && (
                    <Image src={p.imageUrl} alt={p.name} fill sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-neutral-500 line-clamp-1">{p.description}</p>
                  <p className="mt-1 font-bold text-brand-700">{formatFcfa(p.price)}</p>
                </div>
                <div className="flex flex-col gap-1.5 self-center">
                  {/* Primary: Order direct (opens modal → chat) */}
                  <button
                    className="btn-primary !py-1.5 !px-3 text-sm"
                    disabled={!p.available || !store.isOpen}
                    onClick={() => setOrderTarget(p)}
                  >
                    {p.available ? "Order" : "Sold out"}
                  </button>
                  {/* Secondary: Add to cart for multi-item orders */}
                  <button
                    className="btn-secondary !py-1 !px-3 text-xs"
                    disabled={!p.available || !store.isOpen}
                    onClick={() => addItem(p)}
                    title="Add to cart for a multi-item order"
                  >
                    + Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {lines.length > 0 && storeId === store.id && (
          <button
            onClick={() => router.push("/buyer/cart")}
            className="btn-primary fixed bottom-4 left-1/2 w-[90%] max-w-sm -translate-x-1/2 shadow-lg"
          >
            View Cart ({lines.length}) →
          </button>
        )}
      </main>

      {/* Encrypted store chat */}
      <StoreChatDrawer storeId={store.id} storeName={store.name} />

      {/* Order modal */}
      {orderTarget && store && (
        <OrderModal
          product={orderTarget}
          store={store}
          onClose={() => setOrderTarget(null)}
        />
      )}
    </>
  );
}
