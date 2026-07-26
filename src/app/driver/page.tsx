"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
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

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card flex-1 text-center">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold text-brand-700">{value}</p>
    </div>
  );
}

// ─── Active job card ──────────────────────────────────────────────────────────

function ActiveJob({ order, onMarkPickedUp }: { order: Order; onMarkPickedUp: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-bold text-brand-800">🚀 Active Delivery</p>
        <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
          {order.status === "driver_assigned" ? "Assigned" : "Picked Up"}
        </span>
      </div>
      <div className="space-y-1 text-sm">
        <p><span className="text-neutral-500">Pickup:</span> <span className="font-medium">{order.pickupLocation}</span></p>
        <p><span className="text-neutral-500">Drop-off:</span> <span className="font-medium">{order.dropoffLocation}</span></p>
        <p><span className="text-neutral-500">Store:</span> <span className="font-medium">{order.storeName}</span></p>
        <p><span className="text-neutral-500">Items:</span> {order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
        {order.note && (
          <p className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">📝 {order.note}</p>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-lg font-extrabold text-brand-700">{formatFcfa(order.deliveryFee)}</p>
        {order.status === "driver_assigned" ? (
          <button className="btn-primary !py-2 !px-4 text-sm" onClick={onMarkPickedUp}>
            ✅ Mark Picked Up
          </button>
        ) : (
          <p className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
            Waiting for delivery confirmation
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({
  order,
  hasActiveJob,
  onAccept,
}: {
  order: Order;
  hasActiveJob: boolean;
  onAccept: () => void;
}) {
  return (
    <div className="card flex items-start justify-between gap-3">
      <div className="flex-1">
        <p className="font-semibold text-sm">
          <VehicleIcon type={order.deliveryType ?? "bike"} />{" "}
          {order.pickupLocation} → {order.dropoffLocation}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {order.storeName} · {order.items.length} item(s)
        </p>
        {order.note && (
          <p className="mt-1 text-xs text-amber-700">📝 {order.note}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="font-extrabold text-brand-700">{formatFcfa(order.deliveryFee)}</p>
        <button
          className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-50"
          disabled={hasActiveJob}
          onClick={onAccept}
          title={hasActiveJob ? "Finish your current delivery first" : "Accept this job"}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

// ─── Main driver content ──────────────────────────────────────────────────────

function DriverHome() {
  const { profile } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [requests, setRequests] = useState<Order[]>([]);
  const [myOrder, setMyOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptError, setAcceptError] = useState("");

  // Driver profile — live
  useEffect(() => {
    if (!profile) return;
    const unsub = onSnapshot(doc(db, "drivers", profile.id), (snap) => {
      setDriver(snap.exists() ? ({ id: snap.id, ...snap.data() } as Driver) : null);
    });
    return () => unsub();
  }, [profile]);

  // My active job
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

  // Available requests (filtered by vehicle type)
  useEffect(() => {
    if (!driver) { setLoading(false); return; }
    const q = query(collection(db, "orders"), where("status", "==", "driver_requested"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      const matching = driver.vehicleType === "taxi"
        ? all
        : all.filter((o) => o.deliveryType === "bike");
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
    setAcceptError("");
    try {
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
      setAcceptError(err.message || "Could not accept order.");
    }
  }

  async function markPickedUp() {
    if (!myOrder) return;
    await updateDoc(doc(db, "orders", myOrder.id), { status: "picked_up", updatedAt: Date.now() });
  }

  if (!driver) return <Spinner />;

  const isVerified = driver.verified;

  return (
    <div className="space-y-5">
      {/* ── Driver identity card ── */}
      <div className="card flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl">
          {driver.vehicleType === "bike" ? "🛵" : "🚕"}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg leading-tight">{profile?.name}</p>
          <p className="text-xs text-neutral-500 capitalize">
            {driver.vehicleType} · Plate: {driver.plateNumber}
          </p>
          {isVerified ? (
            <span className="badge mt-1 bg-brand-100 text-brand-800">✅ Verified</span>
          ) : (
            <span className="badge mt-1 bg-amber-100 text-amber-800">⏳ Pending admin verification</span>
          )}
        </div>
        {/* Active toggle */}
        <button
          onClick={toggleActive}
          disabled={!isVerified}
          title={!isVerified ? "Wait for admin verification before going active" : ""}
          className={`rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${
            driver.isActive
              ? "bg-brand-600 text-white hover:bg-brand-700"
              : "border border-neutral-300 bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {driver.isActive ? "🟢 Active" : "⚫ Offline"}
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="flex gap-3">
        <StatCard label="Total Earned" value={formatFcfa(driver.totalEarnings)} />
        <StatCard label="Deliveries" value={String(driver.completedDeliveries)} />
      </div>

      <Link href="/driver/earnings" className="card block text-center text-sm font-semibold text-brand-700 hover:border-brand-400">
        📊 Full Earnings History →
      </Link>

      {/* ── Active job ── */}
      {myOrder && (
        <ActiveJob order={myOrder} onMarkPickedUp={markPickedUp} />
      )}

      {/* ── Incoming requests ── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">Available Deliveries</h2>
          {requests.length > 0 && (
            <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-bold text-white">
              {requests.length}
            </span>
          )}
        </div>

        {!isVerified ? (
          <div className="card border-amber-200 bg-amber-50 text-center">
            <p className="text-sm text-amber-800">
              Your account is pending admin verification. Once approved, deliveries will appear here.
            </p>
          </div>
        ) : !driver.isActive ? (
          <EmptyState text="You're offline. Tap Active to start receiving delivery requests." />
        ) : loading ? (
          <Spinner />
        ) : requests.length === 0 ? (
          <EmptyState text="No delivery requests right now. Check back soon." />
        ) : (
          <div className="space-y-2">
            {acceptError && (
              <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{acceptError}</p>
            )}
            {requests.map((r) => (
              <RequestCard
                key={r.id}
                order={r}
                hasActiveJob={!!myOrder}
                onAccept={() => acceptOrder(r.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function DriverPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-5 text-xl font-bold text-brand-800">Delivery Portal</h1>
        <RoleGuard allow={["driver"]}>
          <DriverHome />
        </RoleGuard>
      </main>
    </>
  );
}
