"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState, Spinner, StatusBadge } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import type { Order } from "@/types";

function EarningsContent() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, "orders"),
      where("sellerId", "==", profile.id),
      where("status", "==", "delivered"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return () => unsub();
  }, [profile]);

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="card border-brand-300 bg-brand-50 text-center">
        <p className="text-sm text-brand-800">Total Sales (delivered orders)</p>
        <p className="text-3xl font-extrabold text-brand-700">{formatFcfa(totalSales)}</p>
        <p className="mt-1 text-xs text-neutral-500">
          Money is paid directly to your OM/MoMo by buyers — BUMAP never holds it.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState text="No completed sales yet." />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{o.buyerName}</p>
                <p className="text-xs text-neutral-500">{new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatFcfa(o.total)}</p>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SellerEarningsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Earnings</h1>
        <RoleGuard allow={["seller"]}>
          <EarningsContent />
        </RoleGuard>
      </main>
    </>
  );
}
