"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { EmptyState, Spinner } from "@/components/Shared";
import type { Store } from "@/types";

const CATEGORIES = ["All", "Food", "Groceries", "Fashion", "Electronics"];

function BuyerHomeInner() {
  const searchParams = useSearchParams();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "stores"), where("isOpen", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setStores(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Store)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = stores.filter((s) => {
    const matchesCategory = category === "All" || s.category === category;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch && s.verified;
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-bold text-brand-800">Shop in Buea</h1>

        <input
          className="input mt-4"
          placeholder="Search stores…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium ${
                category === c
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-300 text-neutral-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loading ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <EmptyState text="No stores found. Try another category or search." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((store) => (
                <Link key={store.id} href={`/buyer/store/${store.id}`} className="card flex gap-3 hover:border-brand-400">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    {store.logoUrl && (
                      <Image src={store.logoUrl} alt={store.name} fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{store.name}</p>
                    <p className="text-xs text-neutral-500">{store.category} · {store.location}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{store.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function BuyerHomePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <BuyerHomeInner />
    </Suspense>
  );
}
