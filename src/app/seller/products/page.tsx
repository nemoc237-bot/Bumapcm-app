"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/upload";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState, ErrorNote, Spinner } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import type { Product, Store } from "@/types";

function ProductForm({ storeId, onDone }: { storeId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!photo) {
      setError("Please upload a photo.");
      return;
    }
    setSubmitting(true);
    try {
      const imageUrl = await uploadFile(photo, `products/${storeId}`);
      await addDoc(collection(db, "products"), {
        storeId,
        name,
        price: Number(price),
        imageUrl,
        description,
        available: true,
        weightKg: weightKg ? Number(weightKg) : null,
        createdAt: Date.now(),
      });
      setName(""); setPrice(""); setDescription(""); setWeightKg(""); setPhoto(null);
      onDone();
    } catch (err: any) {
      setError(err.message || "Could not add item.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <p className="font-semibold">Add Menu Item</p>
      <input className="input" placeholder="Item name" required value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input" placeholder="Price in FCFA" required type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
      <input className="input" placeholder="Weight in kg (optional, for bike eligibility)" type="number" min={0} step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
      <textarea className="input" placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <input className="input" type="file" accept="image/*" required onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
      <ErrorNote message={error} />
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? "Adding…" : "Add Item"}</button>
    </form>
  );
}

function ProductsContent() {
  const { profile } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getDocs(query(collection(db, "stores"), where("sellerId", "==", profile.id))).then((snap) => {
      if (!snap.empty) setStore({ id: snap.docs[0].id, ...snap.docs[0].data() } as Store);
    });
  }, [profile]);

  useEffect(() => {
    if (!store) return;
    const q = query(collection(db, "products"), where("storeId", "==", store.id));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    });
    return () => unsub();
  }, [store]);

  async function toggleAvailable(p: Product) {
    await updateDoc(doc(db, "products", p.id), { available: !p.available });
  }
  async function removeProduct(id: string) {
    if (!confirm("Delete this item?")) return;
    await deleteDoc(doc(db, "products", id));
  }

  if (!store) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Menu Management — {store.name}</h1>
      <ProductForm storeId={store.id} onDone={() => {}} />

      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <EmptyState text="No items yet. Add your first menu item above." />
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-brand-700">{formatFcfa(p.price)}</p>
              </div>
              <button
                onClick={() => toggleAvailable(p)}
                className={`badge ${p.available ? "bg-brand-100 text-brand-800" : "bg-neutral-200 text-neutral-600"}`}
              >
                {p.available ? "Available" : "Unavailable"}
              </button>
              <button onClick={() => removeProduct(p.id)} className="text-red-500">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SellerProductsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <RoleGuard allow={["seller"]}>
          <ProductsContent />
        </RoleGuard>
      </main>
    </>
  );
}
