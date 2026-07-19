import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";

const CATEGORIES = [
  { name: "Food", icon: "🍲" },
  { name: "Groceries", icon: "🛒" },
  { name: "Fashion", icon: "👗" },
  { name: "Electronics", icon: "🔌" },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-12 text-center text-white">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Buea Market Place
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-brand-50">
            Shop from trusted local sellers. Pay them directly via Orange Money
            or MTN MoMo. Get it delivered by Bike 🛵 or Taxi 🚕.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/buyer" className="btn-primary bg-white !text-brand-700 hover:!bg-brand-50">
              Start Shopping
            </Link>
            <Link href="/register" className="btn-secondary border-white !text-white hover:!bg-brand-700">
              Become a Seller or Driver
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Browse by category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.name}
                href={`/buyer?category=${c.name}`}
                className="card flex flex-col items-center gap-2 py-8 text-center hover:border-brand-400"
              >
                <span className="text-3xl">{c.icon}</span>
                <span className="font-semibold">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <SearchBar />
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Houses, Items &amp; Services</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: "house",   icon: "🏠", label: "Houses",   blurb: "Rooms for rent" },
              { type: "item",    icon: "🛋️", label: "Items",    blurb: "Phones, beds…" },
              { type: "service", icon: "🛠️", label: "Services", blurb: "Tailors, Graphics" },
            ].map((tile) => (
              <Link
                key={tile.type}
                href={`/subcategories?type=${tile.type}`}
                className="card flex flex-col items-center gap-2 py-6 text-center hover:border-brand-400 transition-colors"
              >
                <span className="text-4xl">{tile.icon}</span>
                <p className="font-semibold text-sm">{tile.label}</p>
                <p className="text-xs text-neutral-500">{tile.blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="text-2xl">💳</p>
            <h3 className="mt-2 font-bold">Pay sellers directly</h3>
            <p className="text-sm text-neutral-600">
              Money never touches BUMAP. Pay via OM/MoMo and upload your
              screenshot as proof.
            </p>
          </div>
          <div className="card">
            <p className="text-2xl">🛵🚕</p>
            <h3 className="mt-2 font-bold">Bike or Taxi delivery</h3>
            <p className="text-sm text-neutral-600">
              Small orders go by Bike. Big or fragile orders go by Taxi —
              your choice at checkout.
            </p>
          </div>
          <div className="card">
            <p className="text-2xl">✅</p>
            <h3 className="mt-2 font-bold">Verified sellers &amp; drivers</h3>
            <p className="text-sm text-neutral-600">
              Every seller and driver is ID-checked by BUMAP admins before
              they go live.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
