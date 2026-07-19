"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState, Spinner, StatusBadge, VehicleIcon } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import type { Order } from "@/types";

function OrdersArchiveContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = orders.filter(
    (o) =>
      o.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      o.storeName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <input
        className="input"
        placeholder="Search by buyer or store name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filtered.length === 0 ? (
        <EmptyState text="No orders found." />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <details key={o.id} className="card">
              <summary className="flex cursor-pointer items-center justify-between">
                <span className="font-semibold">{o.storeName} → {o.buyerName}</span>
                <span className="flex items-center gap-2">
                  <VehicleIcon type={o.deliveryType} />
                  <StatusBadge status={o.status} />
                </span>
              </summary>
              <div className="mt-3 space-y-2 text-sm">
                <p>Pickup: {o.pickupLocation} · Drop-off: {o.dropoffLocation}</p>
                <p>Total: {formatFcfa(o.total)} + delivery {formatFcfa(o.deliveryFee)}</p>
                <p>Placed: {new Date(o.createdAt).toLocaleString()}</p>
                {o.note && <p className="text-amber-700">Note: {o.note}</p>}
                {o.paymentScreenshotUrl && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-neutral-500">Payment Screenshot</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.paymentScreenshotUrl} alt="Payment proof" className="max-w-xs rounded-xl border" />
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Order Archives</h1>
        <p className="mb-4 text-sm text-neutral-500">
          Orders and payment screenshots are kept for 2 years for dispute resolution.
        </p>
        <RoleGuard allow={["admin"]}>
          <OrdersArchiveContent />
        </RoleGuard>
      </main>
    </>
  );
}
