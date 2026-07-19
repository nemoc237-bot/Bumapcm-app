import type { Listing } from "@/types/listing";

/** Shared card used on both /listings and /search. */
export function ListingCard({ listing }: { listing: Listing & { imageUrl?: string } }) {
  const { title, price, location, contact } = listing;
  // Support both imageUrl (legacy) and images[] (current schema)
  const cover = listing.imageUrl ?? listing.images?.[0];

  return (
    <div className="card flex overflow-hidden !p-0">
      <div className="w-24 h-24 flex-shrink-0 bg-neutral-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
            No photo
          </div>
        )}
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-semibold text-neutral-900 text-sm truncate">
            {title || "Untitled listing"}
          </h3>
          <p className="text-brand-600 font-bold text-sm mt-0.5">
            {price ? `${Number(price).toLocaleString()} FCFA` : "Price on request"}
          </p>
          <p className="text-neutral-500 text-xs truncate">{location || "Buea"}</p>
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
    </div>
  );
}
