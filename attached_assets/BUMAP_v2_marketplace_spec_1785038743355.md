# BUMAP v2 — WhatsApp-Native Marketplace
### Optimized Build Spec (for a developer or an AI coding tool)

## 1. What we're removing
- ID card upload / photo verification during signup — dropped entirely, no trace of it in the new signup flow.
- Any "pending verification" or admin-approval gate for a new vendor — signup should end with a live, working store.

## 2. Core concept
BUMAP is not a checkout platform — **WhatsApp is the checkout**. BUMAP's job is discovery: help a buyer in Buea find the right product from the right seller fast, then get out of the way. Every product's terminal action is one tap into WhatsApp with a prefilled message. No cart, no payment integration, no in-app messaging to maintain.

That constraint is a feature: it removes the two hardest things about building a marketplace (payments, trust-heavy messaging) and replaces them with something Buea already trusts and uses daily.

## 3. Vendor signup (lightweight, no ID)
**Fields:**
- Full name
- Phone number (also functions as login — SMS OTP verification, this replaces ID verification as the trust anchor)
- WhatsApp number (defaults to phone number, editable — some vendors use a different WhatsApp line for business)
- Store name
- Store category (from existing 7: Houses, Items, Services, Food, Groceries, Fashion, Electronics)
- Store logo/cover photo (optional, not required to launch — don't block signup on this)
- Store description (1–2 sentences)

**Flow:** Phone number → OTP → 4 fields → store is live. Target: under 90 seconds, no waiting on an admin.

**Why phone OTP instead of ID:** it's the trust anchor that actually matters for a WhatsApp-first platform — a fake phone number can't receive real customer messages, so it self-selects for people who'll actually respond. ID cards don't verify that a seller is *responsive* or *legitimate on WhatsApp*, which is the thing buyers actually care about.

## 4. Store & product management (vendor side)
**Store page (vendor's own dashboard):**
- Edit store info (name, category, description, cover photo, WhatsApp number)
- Add/edit/delete products
- See simple analytics: views this week, WhatsApp button clicks this week, most-clicked product
- "Boost this product" button → premium carousel flow (see §6)

**Product fields:**
- Title, price (or "Contact for price"), 1–4 images, description, subcategory, in-stock toggle
- No inventory count needed — this is a discovery layer, not inventory software; a simple in-stock/out-of-stock toggle is enough

## 5. Buyer flow
1. **Home** → hero → **featured carousel** (§6) → category tiles → search bar
2. **Browse/search** → product grid (same card style already built) → tap a product
3. **Product detail page** → images, price, description, store name/logo (tappable → storefront), **"Chat on WhatsApp"** button
4. **WhatsApp deep link**, prefilled: `Hi, I'm interested in [Product Name] — [Price] — saw it on BUMAP` (opens `wa.me/[vendor whatsapp]?text=...`, same pattern already built for the Houses flow — now applied to every product, not just Houses stores)
5. **Storefront page** (`/store/[storeId]`) — every vendor gets one automatically: logo, name, category, all their products in a grid, one "Chat with [Store Name]" button at the top for general inquiries

This means **every product card everywhere** — home grid, search results, storefront, category page — carries the same WhatsApp CTA. Consistency here matters more than any other single design decision, because it's the one action a buyer needs to be able to do instinctively without thinking.

## 6. The featured carousel (your monetization engine)
**Placement:** horizontal auto-scrolling strip between hero and category tiles, labeled "🔥 Trending on BUMAP" or "Sponsored Picks" (be honest that it's paid — builds long-term trust more than pretending it's organic).

**Behavior:**
- Auto-advances every ~4s, swipeable/pausable on touch
- Each card: product image, price, small "Sponsored" tag, store name
- Tapping goes straight to the product detail page

**Monetization tiers** (this is the part that makes BUMAP self-sustaining):
| Tier | Price idea | Placement |
|---|---|---|
| Bronze | Cheapest | Rotates into carousel, lower priority in rotation weighting |
| Silver | Mid | Higher rotation weight, "Sponsored" badge |
| Gold | Highest | Guaranteed top-3 rotation slot + featured on relevant category pages too |

**Anti-stagnation rule:** cap how many days a single product can occupy Gold before it must rotate out or renew — a carousel that shows the same 3 products for a month stops getting attention, which kills the feature's value to *future* paying vendors too.

**Payment for boosts:** since checkout is WhatsApp-only, boost payment should be Mobile Money (MTN MoMo / Orange Money) — the same rails Buea already uses, not a card payment gateway that requires a bank account most small vendors won't have.

## 7. Trust & safety without ID cards
Replace document verification with behavioral trust signals, all visible to buyers:
- **Phone-verified** badge (from OTP at signup — automatic, not manual review)
- **Response rate** — track how often chats initiated from BUMAP lead to a reply within 24h (self-reported by buyer: "Did they respond?" prompt after tapping WhatsApp, optional)
- **Reviews** (already built) — real reviews replace hardcoded demo ones once there's real transaction volume
- **Report a listing** button on every product — flags for admin review, doesn't block the listing pending review (avoids re-introducing an approval bottleneck)
- **Store age** — "On BUMAP since [month/year]" shown on storefront, a lightweight longevity signal

## 8. Buea-specific details worth keeping
- FCFA pricing, Mobile Money for premium payments (not a card gateway)
- Location by neighborhood/quarter (Molyko, Bonduma, Great Soppo, Mile 4, etc.) — already the pattern used for Houses, extend it to every category
- Low-data mode: compressed images, lazy-loaded product grids — slow connections are a real constraint, not a nice-to-have
- Consider English + Pidgin toggle for product descriptions/UI copy later (not MVP, but plan the data model so descriptions aren't hardcoded to one language field)

## 9. MVP scope vs. Phase 2
**MVP (ship this first):**
- Vendor OTP signup + store creation + product upload
- Buyer browse/search/category pages (already built, reuse as-is)
- WhatsApp CTA on every product (extend the pattern already built for Houses to all categories)
- Storefront pages
- Featured carousel UI (can launch with BUMAP's own picks manually curated before self-serve boosting exists)

**Phase 2 (once there's real vendor volume):**
- Self-serve premium boost purchase flow + Mobile Money integration
- Vendor analytics dashboard
- Response-rate/trust badges
- Report/flagging admin queue

## 10. What carries over from what we've already built
- The 7-category structure (Houses, Items, Services, Food, Groceries, Fashion, Electronics) and their subcategories — unchanged
- Search page and card styles — unchanged, just extend the WhatsApp CTA pattern to every card
- The Houses store detail page (gallery, amenities, sticky CTA, chat drawer) — this becomes the *template* for all product/store detail pages, not a one-off for Houses
- Theme color `#1fb567`, mobile-first layout, Tailwind card conventions — unchanged
