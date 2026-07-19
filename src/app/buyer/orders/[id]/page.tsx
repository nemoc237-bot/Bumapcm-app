"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, increment, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { Spinner, StatusBadge, VehicleIcon } from "@/components/Shared";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STEPS, formatFcfa } from "@/lib/utils";
import type { Order } from "@/types";

function OrderTimeline({ status }: { status: Order["status"] }) {
  const activeIndex = ORDER_STATUS_STEPS.indexOf(status as any);
  return (
    <div className="card">
      <p className="mb-3 font-semibold">Order Status</p>
      <div className="space-y-3">
        {ORDER_STATUS_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                i <= activeIndex ? "bg-brand-600" : "bg-neutral-200"
              }`}
            />
            <span className={i <= activeIndex ? "font-medium text-neutral-900" : "text-neutral-400"}>
              {ORDER_STATUS_LABEL[step]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetail() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "orders", params.id), (snap) => {
      setOrder(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [params.id]);

  async function confirmDelivery() {
    if (!order) return;
    const willBeDelivered = order.sellerConfirmedDelivery;
    await updateDoc(doc(db, "orders", order.id), {
      buyerConfirmedDelivery: true,
      status: willBeDelivered ? "delivered" : order.status,
      updatedAt: Date.now(),
    });
    // Both sides have now confirmed: credit the driver's earnings tally.
    if (willBeDelivered && order.driverId) {
      await updateDoc(doc(db, "drivers", order.driverId), {
        totalEarnings: increment(order.deliveryFee),
        completedDeliveries: increment(1),
      });
    }
  }

  if (loading) return <Spinner />;
  if (!order) return <p className="text-center text-neutral-500">Order not found.</p>;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">{order.storeName}</p>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          {order.deliveryType ? <><VehicleIcon type={order.deliveryType} /> {order.deliveryType} delivery</> : "Delivery method not yet chosen"}
        </p>
        <div className="mt-3 space-y-1 text-sm">
          {order.items.map((it, i) => (
            <div key={i} className="flex justify-between">
              <span>{it.qty}× {it.name}</span>
              <span>{formatFcfa(it.price * it.qty)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 text-sm">
          <span>Items</span><span>{formatFcfa(order.total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery fee</span><span>{formatFcfa(order.deliveryFee)}</span>
        </div>
        <div className="mt-1 flex justify-between font-bold">
          <span>Total</span><span>{formatFcfa(order.total + order.deliveryFee)}</span>
        </div>
        {order.note && <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">Note: {order.note}</p>}
      </div>

      <OrderTimeline status={order.status} />

      <div className="card text-sm">
        <p><span className="font-semibold">Pickup:</span> {order.pickupLocation}</p>
        <p><span className="font-semibold">Drop-off:</span> {order.dropoffLocation}</p>
      </div>

      {order.paymentScreenshotUrl && (
        <div className="card">
          <p className="mb-2 font-semibold">Your payment screenshot</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.paymentScreenshotUrl} alt="Payment proof" className="w-full rounded-xl border" />
        </div>
      )}

      {order.status === "picked_up" && !order.buyerConfirmedDelivery && (
        <button className="btn-primary w-full" onClick={confirmDelivery}>
          Confirm I received my order
        </button>
      )}
      {order.buyerConfirmedDelivery && order.status !== "delivered" && (
        <p className="text-center text-sm text-neutral-500">Waiting for seller to confirm delivery too…</p>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-6">
        <RoleGuard allow={["buyer"]}>
          <OrderDetail />
        </RoleGuard>
      </main>
    </>
  );
}
