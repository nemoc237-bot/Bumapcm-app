"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState, Spinner, VehicleIcon } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import type { Driver, Order } from "@/types";

function DriverHome() {
  const { profile } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [requests, setRequests] = useState<Order[]>([]);
  const [myOrder, setMyOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const unsub = onSnapshot(doc(db, "drivers", profile.id), (snap) => {
      setDriver(snap.exists() ? ({ id: snap.id, ...snap.data() } as Driver) : null);
    });
    return () => unsub();
  }, [profile]);

  // Active job assigned to me (not yet delivered).
  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, "orders"),
      where("driverId", "==", profile.id),
      where("status", "in", ["driver_assigned", "picked_up"])
    );
    const unsub = onSnapshot(q, (snap) => {
      setMyOrder(snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Order));
    });
    return () => unsub();
  }, [profile]);

  // Incoming requests: bikes only see "bike" jobs, taxis see all.
  useEffect(() => {
    if (!driver) {
      setLoading(false);
      return;
    }
    const base = query(collection(db, "orders"), where("status", "==", "driver_requested"));
    const unsub = onSnapshot(base, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      // Taxis can take any job. Bikes only see jobs the seller marked "Bike".
      // (Weight-based <10kg filtering can be added once OrderItem tracks
      // per-line weight end-to-end; product weightKg is captured today.)
      const matching = all.filter((o) =>
        driver.vehicleType === "taxi" ? true : o.deliveryType === "bike"
      );
      setRequests(matching);
      setLoading(false);
    });
    return () => unsub();
  }, [driver]);

  async function toggleActive() {
    if (!driver) return;
    await updateDoc(doc(db, "drivers", driver.id), { isActive: !driver.isActive });
  }

  async function acceptOrder(orderId: string) {
    if (!profile) return;
    try {
      // Transaction guarantees only the first driver to accept gets the job.
      await runTransaction(db, async (tx) => {
        const orderRef = doc(db, "orders", orderId);
        const snap = await tx.get(orderRef);
        if (!snap.exists()) throw new Error("Order no longer exists.");
        const data = snap.data() as Order;
        if (data.status !== "driver_requested" || data.driverId) {
          throw new Error("Another driver already accepted this job.");
        }
        tx.update(orderRef, {
          driverId: profile.id,
          status: "driver_assigned",
          updatedAt: Date.now(),
        });
      });
    } catch (err: any) {
      alert(err.message || "Could not accept order.");
    }
  }

  async function markPickedUp() {
    if (!myOrder) return;
    await updateDoc(doc(db, "orders", myOrder.id), { status: "picked_up", updatedAt: Date.now() });
  }

  if (!driver) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card flex items-center justify-between">
        <div>
          <p className="font-bold">
            <VehicleIcon type={driver.vehicleType} /> {driver.vehicleType === "bike" ? "Bike" : "Taxi"} Driver
          </p>
          <p className="text-xs text-neutral-500">Plate: {driver.plateNumber}</p>
          {!driver.verified && <p className="badge mt-1 bg-amber-100 text-amber-800">Pending admin verification</p>}
        </div>
        <button
          onClick={toggleActive}
          disabled={!driver.verified}
          className={`badge ${driver.isActive ? "bg-brand-100 text-brand-800" : "bg-neutral-200 text-neutral-600"}`}
        >
          {driver.isActive ? "Active (tap to go offline)" : "Offline (tap to go active)"}
        </button>
      </div>

      <Link href="/driver/earnings" className="card block text-center font-semibold hover:border-brand-400">
        💰 Earnings: {formatFcfa(driver.totalEarnings)} · {driver.completedDeliveries} deliveries
      </Link>

      {myOrder && (
        <div className="card border-brand-400 bg-brand-50">
          <p className="font-semibold text-brand-800">Active Delivery</p>
          <p className="text-sm">Pickup: {myOrder.pickupLocation}</p>
          <p className="text-sm">Drop-off: {myOrder.dropoffLocation}</p>
          <p className="text-sm">Fee: {formatFcfa(myOrder.deliveryFee)}</p>
          {myOrder.note && <p className="text-xs text-amber-800">Note: {myOrder.note}</p>}
          {myOrder.status === "driver_assigned" ? (
            <button className="btn-primary mt-2 w-full" onClick={markPickedUp}>Mark as Picked Up</button>
          ) : (
            <p className="mt-2 text-center text-sm text-neutral-500">Waiting for buyer &amp; seller to confirm delivery…</p>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-2 font-bold">Incoming Requests</h2>
        {!driver.isActive ? (
          <EmptyState text="Go Active to see delivery requests." />
        ) : loading ? (
          <Spinner />
        ) : requests.length === 0 ? (
          <EmptyState text="No active orders yet." />
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    <VehicleIcon type={r.deliveryType} /> {r.pickupLocation} → {r.dropoffLocation}
                  </p>
                  <p className="text-xs text-neutral-500">{r.storeName} · {r.items.length} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-700">{formatFcfa(r.deliveryFee)}</p>
                  <button className="btn-primary mt-1 !py-1.5 !px-3 text-xs" disabled={!!myOrder} onClick={() => acceptOrder(r.id)}>
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <RoleGuard allow={["driver"]}>
          <DriverHome />
        </RoleGuard>
      </main>
    </>
  );
}
