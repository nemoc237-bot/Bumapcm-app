"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState, Spinner, StatusBadge, VehicleIcon } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import type { Order, Settings, VehicleType } from "@/types";

function OrderRow({ order, settings }: { order: Order; settings: Settings }) {
  const [busy, setBusy] = useState(false);

  async function confirmPayment() {
    setBusy(true);
    await updateDoc(doc(db, "orders", order.id), {
      paymentConfirmedBySeller: true,
      status: "payment_confirmed",
      updatedAt: Date.now(),
    });
    setBusy(false);
  }

  async function requestDelivery(vehicleType: VehicleType) {
    setBusy(true);
    // Simplified MVP fee: base fee for the chosen vehicle. A real deployment
    // would compute distance between store and drop-off (see distanceKm in
    // src/lib/utils.ts) and add settings.perKmRate * distance.
    const fee = vehicleType === "bike" ? settings.bikeBaseFee : settings.taxiBaseFee;
    await updateDoc(doc(db, "orders", order.id), {
      deliveryType: vehicleType,
      deliveryFee: fee,
      status: "driver_requested",
      updatedAt: Date.now(),
    });
    setBusy(false);
  }

  async function confirmDelivery() {
    setBusy(true);
    const willBeDelivered = order.buyerConfirmedDelivery;
    await updateDoc(doc(db, "orders", order.id), {
      sellerConfirmedDelivery: true,
      status: willBeDelivered ? "delivered" : order.status,
      updatedAt: Date.now(),
    });
    if (willBeDelivered && order.driverId) {
      await updateDoc(doc(db, "drivers", order.driverId), {
        totalEarnings: increment(order.deliveryFee),
        completedDeliveries: increment(1),
      });
    }
    setBusy(false);
  }

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{order.buyerName}</p>
          <p className="text-xs text-neutral-500">{order.buyerPhone} · {order.dropoffLocation}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="text-sm">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between">
            <span>{it.qty}× {it.name}</span>
            <span>{formatFcfa(it.price * it.qty)}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between font-bold">
          <span>Total</span><span>{formatFcfa(order.total)}</span>
        </div>
      </div>

      {order.note && <p className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">Note: {order.note}</p>}

      {order.paymentScreenshotUrl && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-brand-700">View payment screenshot</summary>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.paymentScreenshotUrl} alt="Payment proof" className="mt-2 max-w-xs rounded-xl border" />
        </details>
      )}

      {order.status === "pending_payment" && (
        <button className="btn-primary w-full" disabled={busy} onClick={confirmPayment}>
          ✅ Confirm Payment
        </button>
      )}

      {order.status === "payment_confirmed" && (
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" disabled={busy} onClick={() => requestDelivery("bike")}>🛵 Bike Delivery</button>
          <button className="btn-secondary flex-1" disabled={busy} onClick={() => requestDelivery("taxi")}>🚕 Taxi Delivery</button>
        </div>
      )}

      {order.status === "driver_requested" && (
        <p className="text-center text-sm text-neutral-500">
          <VehicleIcon type={order.deliveryType} /> Waiting for a driver to accept…
        </p>
      )}

      {(order.status === "driver_assigned" || order.status === "picked_up") && !order.sellerConfirmedDelivery && (
        <button className="btn-primary w-full" disabled={busy} onClick={confirmDelivery}>
          Confirm order was delivered
        </button>
      )}

      <Link
        href={`/chat/${order.id}`}
        className="btn-secondary flex w-full items-center justify-center gap-2 text-sm"
      >
        💬 Chat with Buyer
      </Link>
    </div>
  );
}

function OrdersContent() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "settings", "global")).then((snap) => {
      setSettings(
        snap.exists()
          ? (snap.data() as Settings)
          : { bikeBaseFee: 500, taxiBaseFee: 1500, perKmRate: 100 }
      );
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, "orders"),
      where("sellerId", "==", profile.id),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return () => unsub();
  }, [profile]);

  if (loading || !settings) return <Spinner />;
  if (orders.length === 0) return <EmptyState text="No active orders yet." />;

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <OrderRow key={o.id} order={o} settings={settings} />
      ))}
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Orders</h1>
        <RoleGuard allow={["seller"]}>
          <OrdersContent />
        </RoleGuard>
      </main>
    </>
  );
}
