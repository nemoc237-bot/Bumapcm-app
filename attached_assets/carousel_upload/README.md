# BUMAP — Featured Carousel ("Trending on BUMAP")

Implements the monetization carousel from the v2 marketplace spec: a
horizontal, auto-advancing, swipeable strip between the hero and category
tiles, with Gold/Silver/Bronze tiered rotation.

## Stack
Same as the earlier Houses store-detail delivery: Next.js App Router +
Prisma + Postgres + Tailwind. If your real app is still the Vite/react-router
one, say so and I'll port this (mainly `FeaturedCarousel.tsx` and the
`/api/featured` fetch) to that instead.

## What's in this zip
- `prisma/schema.prisma` — **full schema**, including everything from the
  earlier Houses delivery (Store/Booking/Message) plus the two new models:
  `Product` and `FeaturedListing`. If you already applied the earlier
  schema, just add the `Product` and `FeaturedListing` blocks (clearly
  marked in the file) rather than re-running the whole thing.
- `prisma/seed-featured.ts` — adds demo products to the 4 stores seeded
  earlier and features one in each tier. **Run `prisma/seed.ts` (from the
  earlier delivery) first** — this script looks up stores by name and skips
  anything it can't find.
- `lib/featured.ts` — the actual rotation logic: Gold gets guaranteed top
  slots (up to 3), Silver/Bronze are weighted-shuffled by tier weight, and
  expired `FeaturedListing`s are excluded — that's the anti-stagnation rule
  from the spec.
- `app/api/featured/route.ts` — GET endpoint the carousel calls.
- `components/home/FeaturedCarousel.tsx` — the carousel itself.
- `app/product/[productId]/page.tsx` — minimal product detail page, enough
  to make tapping a carousel card go somewhere real (image, price,
  description, "Chat on WhatsApp" button). Not full parity with the Houses
  store page (no gallery/amenities) — extend it later if you want that.
- `app/page.tsx` — demo homepage showing the exact placement: hero →
  `<FeaturedCarousel />` → category tiles. If you already have a real
  homepage, just copy that one line into it in the same spot.

## Setup
```bash
# 1. Merge/apply the schema
npx prisma migrate dev --name featured_carousel

# 2. Seed (run in order)
npx ts-node prisma/seed.ts            # stores (from earlier delivery)
npx ts-node prisma/seed-featured.ts   # products + featured tiers (this delivery)

# 3. Run the app and visit "/"
npm run dev
```

Add the scrollbar-hiding utility to `globals.css` if you don't already have
it from the earlier delivery:
```css
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

## What you'll see
Reloading `/` shows the carousel with 5 demo products across all 3 tiers —
Gold (Cityview Apartments) always leads, Silver (Rose Garden, Scholars Nest)
and Bronze (the two House Essentials Shop items) reshuffle their order
between reloads because of the weighted rotation. Auto-advances every 4s,
pauses on touch/hover, and tapping any card opens a working product page
with a live "Chat on WhatsApp" button.

## Not built yet (flagged, not silently skipped)
- **Self-serve boost purchase / Mobile Money payment** — Phase 2 in the
  spec. Right now featured slots are seeded directly; there's no vendor-
  facing "pay to feature this" flow yet.
- **Admin renewal/cap enforcement beyond `expiresAt`** — a listing simply
  stops appearing once expired; nothing currently notifies the vendor or
  offers a renewal flow.
- **Category-page featuring for Gold** (spec mentions Gold should also
  appear on relevant category pages, not just the homepage carousel) — only
  the homepage carousel is wired up here.
