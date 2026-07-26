"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState, Spinner, VehicleIcon } from "@/components/Shared";
import type { BumapUser, Driver, Store } from "@/types";

function PhotoLink({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <p className="mb-1 text-xs font-medium text-neutral-500">{label}</p>
      <div className="relative h-24 w-full overflow-hidden rounded-lg border bg-neutral-100">
        <Image src={url} alt={label} fill sizes="200px" className="object-cover" />
      </div>
    </a>
  );
}

function VerifyContent() {
  const [users, setUsers] = useState<BumapUser[]>([]);
  const [drivers, setDrivers] = useState<Record<string, Driver>>({});
  const [stores, setStores] = useState<Record<string, Store>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), where("verified", "==", false));
    const unsub = onSnapshot(q, async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BumapUser));
      setUsers(list);

      const driverIds = list.filter((u) => u.role === "driver").map((u) => u.id);
      const sellerIds = list.filter((u) => u.role === "seller").map((u) => u.id);

      const driverMap: Record<string, Driver> = {};
      for (const id of driverIds) {
        const dSnap = await getDocs(query(collection(db, "drivers"), where("userId", "==", id)));
        if (!dSnap.empty) driverMap[id] = { id: dSnap.docs[0].id, ...dSnap.docs[0].data() } as Driver;
      }
      setDrivers(driverMap);

      const storeMap: Record<string, Store> = {};
      for (const id of sellerIds) {
        const sSnap = await getDocs(query(collection(db, "stores"), where("sellerId", "==", id)));
        if (!sSnap.empty) storeMap[id] = { id: sSnap.docs[0].id, ...sSnap.docs[0].data() } as Store;
      }
      setStores(storeMap);

      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function verifyUser(u: BumapUser) {
    await updateDoc(doc(db, "users", u.id), { verified: true });
    if (u.role === "driver" && drivers[u.id]) {
      await updateDoc(doc(db, "drivers", drivers[u.id].id), { verified: true });
    }
    if (u.role === "seller" && stores[u.id]) {
      await updateDoc(doc(db, "stores", stores[u.id].id), { verified: true });
    }
  }

  async function rejectUser(u: BumapUser) {
    const reason = prompt("Reason for rejection?") || "ID verification failed";
    await updateDoc(doc(db, "users", u.id), { banned: true, banReason: reason });
  }

  if (loading) return <Spinner />;
  if (users.length === 0) return <EmptyState text="No pending verifications. All caught up!" />;

  return (
    <div className="space-y-4">
      {users.map((u) => (
        <div key={u.id} className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold capitalize">{u.name} <span className="badge bg-neutral-100 text-neutral-600">{u.role}</span></p>
              <p className="text-xs text-neutral-500">{u.phone} · {u.email} · {u.location}</p>
            </div>
            {u.role === "driver" && drivers[u.id] && (
              <p className="text-sm"><VehicleIcon type={drivers[u.id].vehicleType} /> {drivers[u.id].plateNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {u.idPhotoUrl && <PhotoLink label="ID Card" url={u.idPhotoUrl} />}
            {u.selfieUrl && <PhotoLink label="Selfie" url={u.selfieUrl} />}
            {u.role === "driver" && drivers[u.id] && (
              <>
                <PhotoLink label="Driver License" url={drivers[u.id].licenseUrl} />
                <PhotoLink label="Vehicle Photo" url={drivers[u.id].vehiclePhotoUrl} />
              </>
            )}
            {u.role === "seller" && stores[u.id] && (
              <PhotoLink label="Store Logo" url={stores[u.id].logoUrl} />
            )}
          </div>

          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={() => verifyUser(u)}>✅ Verify</button>
            <button className="btn-secondary flex-1 !border-red-500 !text-red-600" onClick={() => rejectUser(u)}>❌ Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminVerifyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Verify Sellers &amp; Drivers</h1>
        <RoleGuard allow={["admin"]}>
          <VerifyContent />
        </RoleGuard>
      </main>
    </>
  );
}
