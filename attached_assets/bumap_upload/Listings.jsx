import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Card } from "../components/Card";
import { getCategoryLabel, getSubLabel } from "../data/categories";

// Human-friendly action verb per category, e.g. "Studio for Rent" vs
// "Phones for Sale" vs "Tailoring Services".
function headerFor(type, subLabel) {
  if (type === "house") return `${subLabel} for Rent in Buea`;
  if (type === "item") return `${subLabel} for Sale in Buea`;
  if (type === "service") return `${subLabel} Services in Buea`;
  return `${subLabel} in Buea`;
}

export default function Listings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get("type");
  const sub = searchParams.get("sub");

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!type || !sub) {
      setLoading(false);
      return;
    }

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
        setListings(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchListings();
    return () => {
      cancelled = true;
    };
  }, [type, sub]);

  const subLabel = getSubLabel(type, sub);
  const categoryLabel = getCategoryLabel(type);

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      <header className="px-4 pt-5 pb-4 bg-white border-b border-stone-100 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-sm text-stone-500 mb-1">
          ← Back
        </button>
        <h1 className="text-lg font-bold text-stone-900">
          {headerFor(type, subLabel)}
        </h1>
        <p className="text-xs text-stone-500">{categoryLabel} · {subLabel}</p>
      </header>

      <div className="px-4 pt-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-stone-200 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-red-600 text-sm mt-8">
            Couldn't load listings: {error}
          </p>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-stone-600 font-medium mb-3">
              Be the first to post a {subLabel}
            </p>
            <button
              onClick={() =>
                navigate(`/post?type=${type}&sub=${sub}`)
              }
              className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold"
            >
              Post a Listing
            </button>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="flex flex-col gap-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing }) {
  const {
    title,
    price,
    location,
    imageUrl,
    images,
    contact,
  } = listing;

  const cover = imageUrl || images?.[0];

  return (
    <Card className="flex overflow-hidden">
      <div className="w-24 h-24 flex-shrink-0 bg-stone-100">
        {cover ? (
          <img src={cover} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">
            No photo
          </div>
        )}
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-semibold text-stone-900 text-sm truncate">
            {title || "Untitled listing"}
          </h3>
          <p className="text-emerald-700 font-bold text-sm mt-0.5">
            {price ? `${Number(price).toLocaleString()} FCFA` : "Price on request"}
          </p>
          <p className="text-stone-500 text-xs truncate">{location || "Buea"}</p>
        </div>
        {contact && (
          <a
            href={`tel:${contact}`}
            className="mt-2 self-start px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold"
          >
            Contact
          </a>
        )}
      </div>
    </Card>
  );
}
