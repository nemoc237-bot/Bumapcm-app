"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState, Spinner, StatusBadge } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import type { Order } from "@/types";

function OrdersContent() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, "orders"),
      where("buyerId", "==", profile.id),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return () => unsub();
  }, [profile]);

  if (loading) return <Spinner />;
  if (orders.length === 0) return <EmptyState text="No active orders yet." />;

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Link key={o.id} href={`/buyer/orders/${o.id}`} className="card flex items-center justify-between hover:border-brand-400">
          <div>
            <p className="font-semibold">{o.storeName}</p>
            <p className="text-xs text-neutral-500">{o.items.length} item(s) · {formatFcfa(o.total + o.deliveryFee)}</p>
          </div>
          <StatusBadge status={o.status} />
        </Link>
      ))}
    </div>
  );
}

export default function BuyerOrdersPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Order History</h1>
        <RoleGuard allow={["buyer"]}>
          <OrdersContent />
        </RoleGuard>
      </main>
    </>
  );
}
