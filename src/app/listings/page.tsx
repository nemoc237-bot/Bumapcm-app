"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  collection, query, where, getDocs, addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { ListingCard } from "@/components/ListingCard";
import { Spinner } from "@/components/Shared";
import { getCategory, getSubcategory } from "@/data/categories";
import type { Listing } from "@/types/listing";

// ---------------------------------------------------------------------------
// Root page — decides which view to show based on URL params
// ---------------------------------------------------------------------------

function ListingsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") ?? "";
  const sub = searchParams.get("sub") ?? "";

  const category = getCategory(type);

  // Unknown category
  if (!category) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="font-medium text-neutral-700 mb-4">Unknown category.</p>
          <button onClick={() => router.push("/")} className="btn-primary">
            Back to home
          </button>
        </main>
      </>
    );
  }

  // No subcategory selected yet → show the subcategory grid
  if (!sub) {
    return (
      <>
        <Navbar />
        <div className="sticky top-[57px] z-20 bg-white border-b border-neutral-200 px-4 pt-4 pb-3">
          <button onClick={() => router.back()} className="text-sm text-neutral-500 mb-1">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-neutral-900">{category.name}</h1>
          <p className="text-sm text-neutral-500">Choose a subcategory to browse</p>
        </div>
        <main className="mx-auto max-w-5xl px-4 pt-4 pb-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {category.subcategories.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/listings?type=${type}&sub=${s.id}`)}
                className="card flex flex-col items-center gap-1 py-5 text-center hover:border-brand-400 transition-colors"
              >
                <span className="text-4xl">{s.icon}</span>
                <p className="font-semibold text-sm text-neutral-800 mt-1">{s.name}</p>
                <p className="text-xs text-neutral-500 leading-tight">{s.desc}</p>
              </button>
            ))}
          </div>
        </main>
      </>
    );
  }

  // Subcategory selected → Browse / Sell tabs
  return <SubcategoryTabs type={type} sub={sub} />;
}

// ---------------------------------------------------------------------------
// Browse + Sell tabs
// ---------------------------------------------------------------------------

function SubcategoryTabs({ type, sub }: { type: string; sub: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"browse" | "sell">("browse");

  const category = getCategory(type)!;
  const subcategory = getSubcategory(type, sub);
  const subName = subcategory?.name ?? sub;

  return (
    <>
      <Navbar />
      <div className="sticky top-[57px] z-20 bg-white border-b border-neutral-200 px-4 pt-4 pb-0">
        <button onClick={() => router.back()} className="text-sm text-neutral-500 mb-1">
          ← Back
        </button>
        <h1 className="text-lg font-bold text-neutral-900">{subName}</h1>
        <p className="text-xs text-neutral-500 mb-3">{category.name} · {subName}</p>

        {/* Tab bar */}
        <div className="flex gap-2 pb-0">
          {(["browse", "sell"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                tab === t
                  ? "border-brand-600 text-brand-600 bg-brand-50"
                  : "border-transparent text-neutral-500 bg-transparent hover:text-neutral-700"
              }`}
            >
              {t === "browse" ? "Browse" : "Sell"}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pt-4 pb-10">
        {tab === "browse" ? (
          <BrowseTab type={type} sub={sub} subName={subName} onSell={() => setTab("sell")} />
        ) : (
          <SellTab type={type} sub={sub} onPosted={() => setTab("browse")} />
        )}
      </main>
    </>
  );
}

// ---------------------------------------------------------------------------
// Browse tab — Firestore listings
// ---------------------------------------------------------------------------

function BrowseTab({
  type, sub, subName, onSell,
}: {
  type: string; sub: string; subName: string; onSell: () => void;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchListings() {
      try {
        const q = query(
          collection(db, "listings"),
          where("type", "==", type),
          where("subcategory", "==", sub)
        );
        const snapshot = await getDocs(q);
        if (cancelled) return;
        setListings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchListings();
    return () => { cancelled = true; };
  }, [type, sub]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-neutral-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-600 text-sm mt-8">
        Couldn&apos;t load listings: {error}
      </p>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center mt-16">
        <p className="text-neutral-600 font-medium mb-3">
          Be the first to post a {subName}
        </p>
        <button onClick={onSell} className="btn-primary">
          Post a Listing
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sell tab — inline quick-post form (no image upload)
// For full image upload use /post page.
// ---------------------------------------------------------------------------

const emptyForm = { title: "", price: "", description: "", location: "", contact: "" };

function SellTab({
  type, sub, onPosted,
}: {
  type: string; sub: string; onPosted: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.title || !form.price) {
      setErrorMsg("Title and price are required.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "listings"), {
        type,
        subcategory: sub,
        title: form.title.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        location: form.location.trim(),
        contact: form.contact.trim(),
        images: [],
        createdAt: serverTimestamp(),
      });
      setForm(emptyForm);
      onPosted(); // switch to Browse tab
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-lg mx-auto">
      <p className="text-xs text-neutral-500">
        Quick post — no photos.{" "}
        <a href={`/post?type=${type}&sub=${sub}`} className="text-brand-600 underline">
          Use full form for photos →
        </a>
      </p>

      <input
        className="input"
        placeholder="Title, e.g. Plate of Eru"
        value={form.title}
        onChange={(e) => update("title", e.target.value)}
      />
      <input
        className="input"
        type="number"
        min="0"
        placeholder="Price (FCFA)"
        value={form.price}
        onChange={(e) => update("price", e.target.value)}
      />
      <textarea
        className="input min-h-20"
        placeholder="Description"
        value={form.description}
        onChange={(e) => update("description", e.target.value)}
      />
      <input
        className="input"
        placeholder="Location, e.g. Molyko, Buea"
        value={form.location}
        onChange={(e) => update("location", e.target.value)}
      />
      <input
        className="input"
        placeholder="Contact (phone/WhatsApp)"
        value={form.contact}
        onChange={(e) => update("contact", e.target.value)}
      />

      {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full disabled:opacity-60"
      >
        {submitting ? "Posting…" : "Post Listing"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Export with Suspense boundary (required for useSearchParams in App Router)
// ---------------------------------------------------------------------------

export default function ListingsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ListingsInner />
    </Suspense>
  );
}
