"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getCountFromServer, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { Spinner } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import type { Order } from "@/types";

function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [ordersToday, setOrdersToday] = useState(0);
  const [activeBikes, setActiveBikes] = useState(0);
  const [activeTaxis, setActiveTaxis] = useState(0);
  const [topStores, setTopStores] = useState<{ name: string; sales: number }[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function load() {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [ordersSnap, bikesSnap, taxisSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "orders")),
        getCountFromServer(query(collection(db, "drivers"), where("vehicleType", "==", "bike"), where("isActive", "==", true))),
        getCountFromServer(query(collection(db, "drivers"), where("vehicleType", "==", "taxi"), where("isActive", "==", true))),
        getDocs(query(collection(db, "users"), where("verified", "==", false))),
      ]);

      const orders = ordersSnap.docs.map((d) => d.data() as Order);
      const todayCount = orders.filter((o) => o.createdAt >= startOfDay.getTime()).length;

      const salesByStore: Record<string, number> = {};
      orders.filter((o) => o.status === "delivered").forEach((o) => {
        salesByStore[o.storeName] = (salesByStore[o.storeName] || 0) + o.total;
      });
      const top = Object.entries(salesByStore)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setOrdersToday(todayCount);
      setActiveBikes(bikesSnap.data().count);
      setActiveTaxis(taxisSnap.data().count);
      setTopStores(top);
      setPendingCount(usersSnap.size);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-bold">Admin Panel</h1>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-brand-700">{ordersToday}</p>
          <p className="text-xs text-neutral-500">Orders Today</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-brand-700">🛵 {activeBikes}</p>
          <p className="text-xs text-neutral-500">Active Bikes</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-brand-700">🚕 {activeTaxis}</p>
          <p className="text-xs text-neutral-500">Active Taxis</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-neutral-500">Pending Verification</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Link href="/admin/verify" className="card text-center font-semibold hover:border-brand-400">✅ Verify Users</Link>
        <Link href="/admin/users" className="card text-center font-semibold hover:border-brand-400">👥 All Users</Link>
        <Link href="/admin/orders" className="card text-center font-semibold hover:border-brand-400">🧾 Order Archives</Link>
        <Link href="/admin/settings" className="card text-center font-semibold hover:border-brand-400">⚙️ Delivery Fees</Link>
      </div>

      <div className="card">
        <p className="mb-2 font-semibold">Top Stores (by delivered sales)</p>
        {topStores.length === 0 ? (
          <p className="text-sm text-neutral-500">No delivered orders yet.</p>
        ) : (
          <div className="space-y-1">
            {topStores.map((s) => (
              <div key={s.name} className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-semibold">{formatFcfa(s.sales)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <RoleGuard allow={["admin"]}>
          <AdminHome />
        </RoleGuard>
      </main>
    </>
  );
}
