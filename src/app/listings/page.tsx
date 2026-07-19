"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { Spinner, EmptyState } from "@/components/Shared";
import { getCategoryLabel, getSubLabel } from "@/data/categories";
import type { Listing } from "@/types/listing";

function headerFor(type: string, subLabel: string): string {
  if (type === "house") return `${subLabel} for Rent in Buea`;
  if (type === "item") return `${subLabel} for Sale in Buea`;
  if (type === "service") return `${subLabel} Services in Buea`;
  return `${subLabel} in Buea`;
}

function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images?.[0];
  return (
    <div className="card flex overflow-hidden !p-0">
      <div className="w-24 h-24 flex-shrink-0 bg-neutral-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
            No photo
          </div>
        )}
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-semibold text-neutral-900 text-sm truncate">
            {listing.title || "Untitled listing"}
          </h3>
          <p className="text-brand-600 font-bold text-sm mt-0.5">
            {listing.price ? `${Number(listing.price).toLocaleString()} FCFA` : "Price on request"}
          </p>
          <p className="text-neutral-500 text-xs truncate">{listing.location || "Buea"}</p>
        </div>
        {listing.contact && (
          <a
            href={`tel:${listing.contact}`}
            className="mt-2 self-start px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold"
          >
            Contact
          </a>
        )}
      </div>
    </div>
  );
}

function ListingsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") ?? "";
  const sub = searchParams.get("sub") ?? "";

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !sub) { setLoading(false); return; }

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

  const subLabel = getSubLabel(type, sub);
  const categoryLabel = getCategoryLabel(type);

  return (
    <>
      <Navbar />
      <div className="sticky top-[57px] z-20 bg-white border-b border-neutral-200 px-4 pt-4 pb-3">
        <button onClick={() => router.back()} className="text-sm text-neutral-500 mb-1">
          ← Back
        </button>
        <h1 className="text-lg font-bold text-neutral-900">{headerFor(type, subLabel)}</h1>
        <p className="text-xs text-neutral-500">{categoryLabel} · {subLabel}</p>
      </div>

      <main className="mx-auto max-w-5xl px-4 pt-4 pb-10">
        <div className="flex justify-end mb-3">
          <Link
            href={`/post?type=${type}&sub=${sub}`}
            className="btn-primary !py-2 !px-3 text-sm"
          >
            + Post a Listing
          </Link>
        </div>

        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-neutral-200 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-red-600 text-sm mt-8">
            Couldn't load listings: {error}
          </p>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="text-center mt-16">
            <EmptyState text={`Be the first to post a ${subLabel} in Buea`} />
            <Link
              href={`/post?type=${type}&sub=${sub}`}
              className="btn-primary mt-4 inline-flex"
            >
              Post a Listing
            </Link>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="flex flex-col gap-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ListingsInner />
    </Suspense>
  );
}
