// app/page.tsx
//
// Demo homepage showing exactly where the carousel sits: hero -> carousel
// -> category tiles. If your real homepage already exists elsewhere, just
// copy the <FeaturedCarousel /> line into it in this position — everything
// else here is placeholder/example.

import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";

const CATEGORIES = [
  { type: "house", label: "Houses", icon: "🏠" },
  { type: "item", label: "Items", icon: "🛍️" },
  { type: "service", label: "Services", icon: "🛠️" },
  { type: "food", label: "Food", icon: "🍛" },
  { type: "groceries", label: "Groceries", icon: "🛒" },
  { type: "fashion", label: "Fashion", icon: "👗" },
  { type: "electronics", label: "Electronics", icon: "📱" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <header className="px-4 pt-6 pb-4 bg-white">
        <h1 className="text-lg font-bold text-stone-900">🛒 BUMAP</h1>
        <p className="text-sm text-stone-500 mt-1">
          Buy, rent, or book anything in Buea — straight to WhatsApp.
        </p>
      </header>

      {/* Featured carousel sits right here, between hero and categories */}
      <FeaturedCarousel />

      {/* Category tiles */}
      <div className="px-4 pt-2 pb-8">
        <h2 className="font-bold text-stone-900 mb-3">Browse Categories</h2>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((c) => (
            <a
              key={c.type}
              href={`/listings?type=${c.type}`}
              className="bg-white rounded-2xl shadow p-4 text-center border border-stone-100"
            >
              <div className="text-3xl">{c.icon}</div>
              <p className="font-semibold mt-2 text-sm">{c.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
