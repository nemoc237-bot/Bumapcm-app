"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard } from "@/components/ListingCard";
import { Spinner } from "@/components/Shared";
import type { Listing } from "@/types/listing";

// Firestore has no native full-text search. We pull the 300 most-recent listings
// and filter client-side across title, description, and subcategory.
// For a young marketplace this is fine; revisit with Algolia/Typesense if the
// collection grows into the thousands.
const FETCH_LIMIT = 300;

function matches(listing: Listing, term: string): boolean {
  const haystacks = [listing.title, listing.description, listing.subcategory];
  return haystacks.some((field) => (field || "").toLowerCase().includes(term));
}

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawQuery = searchParams.get("q") ?? "";
  const term = rawQuery.trim().toLowerCase();

  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function runSearch() {
      try {
        const q = query(
          collection(db, "listings"),
          orderBy("createdAt", "desc"),
          limit(FETCH_LIMIT)
        );
        const snapshot = await getDocs(q);
        if (cancelled) return;
        const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
        setResults(all.filter((listing) => matches(listing, term)));
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    runSearch();
    return () => { cancelled = true; };
  }, [term]);

  return (
    <>
      <Navbar />
      <div className="sticky top-[57px] z-20 bg-white border-b border-neutral-200 px-4 pt-4 pb-3">
        <button onClick={() => router.back()} className="text-sm text-neutral-500 mb-2">
          ← Back
        </button>
        <SearchBar initialValue={rawQuery} />
        {rawQuery && !loading && (
          <p className="mt-2 text-xs text-neutral-500">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{rawQuery}&rdquo;
          </p>
        )}
      </div>

      <main className="mx-auto max-w-5xl px-4 pt-4 pb-10">
        {!rawQuery && (
          <p className="text-center text-neutral-500 mt-16 text-sm">
            Type something above and press Enter or Go.
          </p>
        )}

        {loading && rawQuery && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-neutral-200 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-red-600 text-sm mt-8">
            Search failed: {error}
          </p>
        )}

        {!loading && !error && rawQuery && results.length === 0 && (
          <p className="text-center text-neutral-500 text-sm mt-16">
            No listings found for &ldquo;{rawQuery}&rdquo;. Try a different word.
          </p>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SearchInner />
    </Suspense>
  );
}
