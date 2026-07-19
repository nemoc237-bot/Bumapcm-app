"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState, Spinner } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import type { Driver, Order } from "@/types";

function EarningsContent() {
  const { profile } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const unsub = onSnapshot(doc(db, "drivers", profile.id), (snap) => {
      setDriver(snap.exists() ? ({ id: snap.id, ...snap.data() } as Driver) : null);
    });
    return () => unsub();
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, "orders"),
      where("driverId", "==", profile.id),
      where("status", "==", "delivered"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return () => unsub();
  }, [profile]);

  if (loading || !driver) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="card border-brand-300 bg-brand-50 text-center">
        <p className="text-sm text-brand-800">Total Earned</p>
        <p className="text-3xl font-extrabold text-brand-700">{formatFcfa(driver.totalEarnings)}</p>
        <p className="mt-1 text-xs text-neutral-500">{driver.completedDeliveries} completed deliveries</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState text="No completed deliveries yet." />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{o.pickupLocation} → {o.dropoffLocation}</p>
                <p className="text-xs text-neutral-500">{new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <p className="font-bold text-brand-700">{formatFcfa(o.deliveryFee)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DriverEarningsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Earnings</h1>
        <RoleGuard allow={["driver"]}>
          <EarningsContent />
        </RoleGuard>
      </main>
    </>
  );
}
