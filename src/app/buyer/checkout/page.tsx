"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/upload";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { ErrorNote, Spinner } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import type { Store } from "@/types";

function CheckoutContent() {
  const router = useRouter();
  const { lines, storeId, total, clearCart } = useCart();
  const { profile } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [presetNote, setPresetNote] = useState<"" | "Fragile" | "Big order - need Taxi">("");
  const [dropoff, setDropoff] = useState(profile?.location || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!storeId) return;
    getDoc(doc(db, "stores", storeId)).then((snap) => {
      setStore(snap.exists() ? ({ id: snap.id, ...snap.data() } as Store) : null);
    });
  }, [storeId]);

  if (lines.length === 0 || !storeId) {
    router.replace("/buyer/cart");
    return null;
  }

  async function handlePlaceOrder() {
    setError("");
    if (!screenshot) {
      setError("Please upload your payment screenshot to proceed.");
      return;
    }
    if (!dropoff.trim()) {
      setError("Please enter your delivery location.");
      return;
    }
    if (!store || !profile) return;

    setSubmitting(true);
    try {
      const screenshotUrl = await uploadFile(screenshot, `payment-screenshots/${profile.id}`);
      const finalNote = [presetNote, note].filter(Boolean).join(" — ");

      const orderRef = await addDoc(collection(db, "orders"), {
        buyerId: profile.id,
        buyerName: profile.name,
        buyerPhone: profile.phone,
        sellerId: store.sellerId,
        storeId: store.id,
        storeName: store.name,
        items: lines.map((l) => ({
          productId: l.product.id,
          name: l.product.name,
          price: l.product.price,
          qty: l.qty,
        })),
        total,
        deliveryFee: 0,
        deliveryType: null,
        note: finalNote || null,
        status: "pending_payment",
        paymentScreenshotUrl: screenshotUrl,
        paymentConfirmedBySeller: false,
        driverId: null,
        pickupLocation: store.location,
        dropoffLocation: dropoff,
        buyerConfirmedDelivery: false,
        sellerConfirmedDelivery: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      clearCart();
      router.push(`/buyer/orders/${orderRef.id}`);
    } catch (err: any) {
      setError(err.message || "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!store) return <Spinner />;

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-xl font-bold">Checkout</h1>

      <div className="card mt-4">
        <p className="font-semibold">Order Summary</p>
        {lines.map((l) => (
          <div key={l.product.id} className="mt-1 flex justify-between text-sm">
            <span>{l.qty}× {l.product.name}</span>
            <span>{formatFcfa(l.product.price * l.qty)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t pt-2 font-bold">
          <span>Total</span>
          <span>{formatFcfa(total)}</span>
        </div>
      </div>

      <div className="card mt-4 border-brand-300 bg-brand-50">
        <p className="font-semibold text-brand-800">Pay {store.name} directly</p>
        <p className="mt-1 text-sm text-neutral-700">{store.momoProvider}: <span className="font-mono font-bold">{store.momoNumber}</span></p>
        <p className="mt-1 text-xs text-neutral-500">Send {formatFcfa(total)}, then upload your screenshot below.</p>
      </div>

      <div className="mt-4">
        <label className="label">Payment Screenshot (required)</label>
        <input className="input" type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
      </div>

      <div className="mt-4">
        <label className="label">Delivery Location</label>
        <input className="input" value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="e.g. Behind Mile 17 Motor Park" />
      </div>

      <div className="mt-4">
        <label className="label">Note (optional)</label>
        <div className="mb-2 flex gap-2">
          {(["Fragile", "Big order - need Taxi"] as const).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setPresetNote(presetNote === tag ? "" : tag)}
              className={`rounded-full border px-3 py-1 text-xs ${presetNote === tag ? "border-brand-600 bg-brand-100 text-brand-800" : "border-neutral-300"}`}
            >
              {tag}
            </button>
          ))}
        </div>
        <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything else the seller/driver should know?" />
      </div>

      <ErrorNote message={error} />

      <button className="btn-primary mt-4 w-full" onClick={handlePlaceOrder} disabled={submitting}>
        {submitting ? "Placing order…" : "Place Order"}
      </button>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <RoleGuard allow={["buyer"]}>
        <CheckoutContent />
      </RoleGuard>
    </>
  );
}
