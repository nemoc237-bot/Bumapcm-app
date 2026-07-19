# BUMAP — Subcategory Navigation + Listings

## Files
- `src/data/categories.js` — single source of truth for category/subcategory labels + slugs
- `src/firebase.js` — Firestore/Storage init (merge with your existing config, don't duplicate)
- `src/components/Card.jsx` — shared card shell; swap classes for your real card style if it differs
- `src/components/HomeTiles.jsx` — the 3 homepage tiles, wired to `/subcategories?type=...`
- `src/pages/Subcategories.jsx` — grid of subcategory cards for a given `?type`
- `src/pages/Listings.jsx` — Firestore-backed listings grid for a given `?type&sub`
- `src/pages/PostForm.jsx` — post form with cascading Category → Subcategory dropdowns
- `src/App.jsx` — example route wiring

## Install
```
npm install firebase react-router-dom
```

## Firestore setup
1. **Composite index required.** The Listings query filters on `type` AND `subcategory` together, so Firestore will ask you to create a composite index the first time you run it — click the link in the console error, or add manually:
   - Collection: `listings`
   - Fields: `type` (Ascending), `subcategory` (Ascending)

2. **Listing document shape** written by PostForm and read by Listings:
   ```js
   {
     type: "house",            // "house" | "item" | "service" | "food"
     subcategory: "studio",    // slug from src/data/categories.js
     title: "Clean Studio near Molyko",
     price: 25000,
     description: "...",
     location: "Molyko, Buea",
     contact: "6XXXXXXXX",
     images: ["https://..."],
     createdAt: <server timestamp>,
   }
   ```

3. **Storage rules / Firestore rules** — add write rules appropriate for your auth setup (these files assume anyone can post; tighten with `request.auth != null` if BUMAP requires login to post).

## Adding a 4th homepage tile later
Everything (Subcategories grid, Post form dropdowns) reads from `CATEGORIES` / `SUBCATEGORIES` in `src/data/categories.js` — add a category there and it shows up everywhere automatically. `food` is already stubbed in with placeholder subcategories.

## Notes
- Mobile-first: tiles are `grid-cols-2`/`grid-cols-3`, cards stack vertically on Listings, form inputs are full-width with generous tap targets.
- Colors used: emerald-700 (primary/CTA) and amber-500 (contact button) — swap for BUMAP's actual brand colors if these don't match the homepage.
- Empty state on Listings ("Be the first to post a {sub}") links straight into `/post?type=...&sub=...` so the category is pre-filled.
