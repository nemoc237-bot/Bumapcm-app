"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/upload";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { ErrorNote, Spinner } from "@/components/Shared";
import type { Store } from "@/types";

function SellerHome() {
  const { profile } = useAuth();
  const [store, setStore] = useState<Store | null | undefined>(undefined); // undefined = loading
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Store["category"]>("Food");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [momoProvider, setMomoProvider] = useState<Store["momoProvider"]>("MTN MoMo");
  const [momoNumber, setMomoNumber] = useState("");
  const [location, setLocation] = useState(profile?.location || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, "stores"), where("sellerId", "==", profile.id));
    getDocs(q).then((snap) => {
      setStore(snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Store));
    });
  }, [profile]);

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError("");
    if (!logo) {
      setError("Please upload a store logo.");
      return;
    }
    setSubmitting(true);
    try {
      const logoUrl = await uploadFile(logo, `store-logos/${profile.id}`);
      const ref = doc(collection(db, "stores"));
      const newStore: Store = {
        id: ref.id,
        sellerId: profile.id,
        name,
        category,
        description,
        logoUrl,
        momoNumber,
        momoProvider,
        location,
        isOpen: true,
        verified: false,
        createdAt: Date.now(),
      };
      await setDoc(ref, newStore);
      setStore(newStore);
    } catch (err: any) {
      setError(err.message || "Could not create store.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleOpen() {
    if (!store) return;
    const next = !store.isOpen;
    await updateDoc(doc(db, "stores", store.id), { isOpen: next });
    setStore({ ...store, isOpen: next });
  }

  if (store === undefined) return <Spinner />;

  if (store === null) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-bold text-brand-800">Set up your store</h1>
        <p className="mt-1 text-sm text-neutral-600">
          An admin will verify your store before it appears to buyers.
        </p>
        <form onSubmit={createStore} className="mt-4 space-y-4">
          <div>
            <label className="label">Store Name</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Store["category"])}>
              {["Food", "Groceries", "Fashion", "Electronics", "Other"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Store Logo</label>
            <input className="input" required type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="label">Mobile Money Provider</label>
            <select className="input" value={momoProvider} onChange={(e) => setMomoProvider(e.target.value as Store["momoProvider"])}>
              <option value="MTN MoMo">MTN MoMo</option>
              <option value="Orange Money">Orange Money</option>
            </select>
          </div>
          <div>
            <label className="label">OM/MoMo Number</label>
            <input className="input" required value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} placeholder="6XX XXX XXX" />
          </div>
          <div>
            <label className="label">Store Location (Buea)</label>
            <input className="input" required value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <ErrorNote message={error} />
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Creating…" : "Create Store"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{store.name}</h1>
          <p className="text-sm text-neutral-500">{store.category} · {store.location}</p>
          {!store.verified && (
            <p className="badge mt-2 bg-amber-100 text-amber-800">Pending admin verification</p>
          )}
        </div>
        <button
          onClick={toggleOpen}
          className={`badge ${store.isOpen ? "bg-brand-100 text-brand-800" : "bg-red-100 text-red-700"}`}
        >
          {store.isOpen ? "Store Open (tap to close)" : "Store Closed (tap to open)"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:grid-rows-2">
        <Link href="/seller/products" className="card text-center font-semibold hover:border-brand-400">📦 Manage Menu</Link>
        <Link href="/seller/orders" className="card text-center font-semibold hover:border-brand-400">🧾 Orders</Link>
        <Link href="/seller/earnings" className="card text-center font-semibold hover:border-brand-400">💰 Earnings</Link>
        <Link href="/seller/messages" className="card text-center font-semibold hover:border-brand-400 sm:col-span-3">💬 Customer Messages</Link>
      </div>
    </div>
  );
}

export default function SellerPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <RoleGuard allow={["seller"]}>
          <SellerHome />
        </RoleGuard>
      </main>
    </>
  );
}
