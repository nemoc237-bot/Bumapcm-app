# BUMAP — Houses Store Detail Flow

## Stack note
Everything earlier in this project was a Vite/CRA React app with `react-router`
and `window.location.href` navigation — not Next.js. This task's spec
(`/houses/[storeId]/page.tsx`, `/api/bookings`) is a Next.js App Router shape,
so that's what this is built as. **If BUMAP is actually still on the old
stack, this needs adapting**: the page becomes a route component, the API
route becomes an Express handler, and `next/image`/`next/navigation` imports
go away. Say the word and I'll port it.

## Install
```bash
npm install @prisma/client sonner lucide-react
npm install -D prisma ts-node

# shadcn/ui components used here (run if not already installed):
npx shadcn@latest add dialog input label textarea button sheet
```
Mount `<Toaster />` (from `sonner`) once in your root layout for the booking
toast to show:
```tsx
// app/layout.tsx
import { Toaster } from "sonner";
// ...inside <body>:
<Toaster position="top-center" />
```

## Database
```bash
cp .env.example .env   # fill in DATABASE_URL
npx prisma migrate dev --name store_booking_message
```

Add to `package.json`:
```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```
Then seed:
```bash
npx prisma db seed
```
Re-running is safe — each store is looked up by name first and skipped if
it already exists (see comments in `prisma/seed.ts`).

## CSS: hide scrollbar on the gallery
`StoreGallery.tsx` uses a `no-scrollbar` class that isn't a Tailwind
built-in. Add to `globals.css`:
```css
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

## Files in this delivery
- `prisma/schema.prisma` — Store, Booking, Message models
- `prisma/seed.ts` — idempotent seed for the 4 demo stores
- `lib/prisma.ts`, `lib/amenities.ts`, `lib/reviews.ts`, `lib/whatsapp.ts`
- `app/houses/[storeId]/page.tsx` — the store detail page (server component)
- `app/houses/[storeId]/{loading,error,not-found}.tsx` — loading/error states
- `app/api/bookings/route.ts` — logs + persists booking requests
- `app/api/chat/[storeId]/route.ts` — polling chat backend
- `components/store/*` — Gallery, BookingModal, AmenitiesGrid, ReviewsSection, StickyCta, ChatDrawer

## Design decisions worth knowing about
- **Chat is polling-based (4s interval), not real-time.** No spec was given
  for this feature, so I built the smallest thing that actually works —
  good enough for early volume. Swap for Pusher/Ably/socket.io later if
  message volume grows; the API shape barely changes.
- **`wa.me` links use `contactWhatsApp` as-is, stripped of non-digits.**
  Seeded demo stores share one placeholder number (`237670000001`) — replace
  before this goes anywhere near real users.
- **Amenities and reviews are hardcoded**, per the task spec. They're not
  stored per-store, so every store in the same subcategory currently shows
  identical amenities and identical reviews. Fine for demo purposes; flagging
  so it's not mistaken for a bug later.
- **Colors**: `#1fb567` used throughout, matching BUMAP's real theme color
  (confirmed from the live app earlier in this project).
