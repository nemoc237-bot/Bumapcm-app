# BUMAP — Buea Market Place

A 3-sided marketplace for Buea, Cameroon: **Sellers** sell, **Delivery Drivers** deliver by 🛵 Bike or 🚕 Taxi, and **Buyers** order. Payments go **directly to sellers** via Orange Money / MTN MoMo — BUMAP never touches the money. Buyers prove payment by uploading a screenshot.

Built with **Next.js 14 (App Router) + TypeScript + TailwindCSS + Firebase** (Auth, Firestore, Storage). No payment API — manual OM/MoMo + screenshot verification.

---

## 1. What's included

- **Auth & roles**: Buyer, Seller, Delivery Driver, Admin. Registration collects ID card photo + selfie for everyone, plus vehicle plate/license/photo for drivers. Nothing goes live until an Admin verifies it.
- **Buyer**: browse stores by category, search, add to cart, checkout with seller's OM/MoMo number shown, mandatory payment-screenshot upload, order notes ("Fragile" / "Big order - need Taxi"), live order tracking, order history.
- **Seller**: store setup, open/closed toggle, menu CRUD with photos and availability toggle, order queue with "Confirm Payment" → "Request Delivery" (choose Bike or Taxi), earnings page.
- **Driver**: Go Active/Offline, incoming request feed (bikes only see Bike jobs; taxis see everything), first-to-accept wins the job (enforced with a Firestore transaction), status updates, earnings page.
- **Admin**: verify/reject sellers & drivers (view ID, selfie, license, vehicle photos), ban/unban users with a stored reason, order archive with payment screenshots for disputes, delivery-fee settings (bike/taxi base fee + per-km rate), simple analytics (orders today, active drivers by vehicle type, top stores).
- **PWA**: installable on Android via `manifest.json` + service worker (`next-pwa`).
- Mobile-first UI in green & white.

## 2. Project structure

```
src/
  app/                 Next.js App Router pages (one folder per route)
    buyer/ seller/ driver/ admin/   role dashboards
    register/ login/
  components/          Shared UI (Navbar, RoleGuard, StatusBadge, etc.)
  context/             AuthContext (current user/profile), CartContext
  lib/                 firebase.ts (SDK init), upload.ts, utils.ts
  types/               Shared TypeScript types = Firestore schema
scripts/seed.ts        Demo data seeder (firebase-admin)
firestore.rules        Firestore security rules
storage.rules          Storage security rules (private ID/license photos)
firestore.indexes.json Composite indexes the dashboards need
firebase.json          Firebase CLI config (Firestore rules/Storage/Hosting)
```

## 3. Firestore schema

| Collection  | Doc shape (see `src/types/index.ts` for full types) |
|---|---|
| `users`     | `{ role, name, phone, email, idPhotoUrl, selfieUrl, verified, banned, location }` |
| `drivers`   | `{ userId, vehicleType: "bike"\|"taxi", plateNumber, licenseUrl, vehiclePhotoUrl, isActive, verified, totalEarnings, completedDeliveries }` |
| `stores`    | `{ sellerId, name, category, logoUrl, momoNumber, momoProvider, isOpen, verified }` |
| `products`  | `{ storeId, name, price, imageUrl, description, available, weightKg }` |
| `orders`    | `{ buyerId, sellerId, storeId, items[], total, deliveryFee, deliveryType, status, paymentScreenshotUrl, driverId, ... }` |
| `settings`  | single doc `global`: `{ bikeBaseFee, taxiBaseFee, perKmRate }` |
| `disputes`  | `{ orderId, raisedBy, reason, status }` |

Order status flow: `pending_payment → payment_confirmed → driver_requested → driver_assigned → picked_up → delivered` (or `cancelled`).

## 4. Step-by-step setup

### 4.1 Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it `bumap` (or anything).
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** → start in **production mode** → pick a region close to Cameroon (e.g. `europe-west1`).
4. **Build → Storage → Get started** → production mode, same region.
5. **Project settings (gear icon) → General → Your apps → Web (</>) icon** → register an app named `BUMAP Web`. Copy the `firebaseConfig` values — you'll need them in step 4.2.

### 4.2 Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with the values from step 4.1:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4.3 Install dependencies and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4.4 Deploy Firestore & Storage security rules

Install the Firebase CLI once, then deploy rules/indexes from this project's root:

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # pick your bumap project, give it an alias like "default"
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 4.5 Create your first Admin account

There's no public "sign up as verified admin" flow (on purpose — admins shouldn't be self-service). To create one:

1. Register normally at `/register`, picking any role (e.g. Buyer).
2. In the Firebase Console → Firestore → `users/{your-uid}` → edit the doc → set `role: "admin"` and `verified: true`.
3. Log out and back in (or just refresh) — you'll now land on `/admin`.

### 4.6 Seed demo data (optional but recommended for testing)

1. Firebase Console → Project Settings → **Service Accounts** → **Generate new private key** → save the downloaded JSON as `serviceAccountKey.json` in the project root (already gitignored).
2. Run:
   ```bash
   npm run seed
   ```
   This creates:
   - Seller **Nemo's Eatery** (`nemo.seller@bumap.demo`) with 3 menu items, pre-verified
   - Bike driver **Divine** (`bike.driver@bumap.demo`), pre-verified & active
   - Taxi driver **Bertrand** (`taxi.driver@bumap.demo`), pre-verified & active
   - Default delivery-fee settings

   All demo accounts use password `Bumap123!`.

### 4.7 Test the full flow

1. Run the seed script (step 4.6) or manually register+verify a Taxi Driver and a Seller through `/register` and `/admin/verify`.
2. As a **Buyer** (register a new account): browse to Nemo's Eatery, add items to cart, checkout — you'll see the seller's MoMo number. Upload any image as the "payment screenshot" and place the order.
3. As the **Seller**: go to `/seller/orders`, open the order, view the screenshot, tap **Confirm Payment**, then **Taxi Delivery**.
4. As the **Taxi Driver**: go to `/driver`, tap **Go Active** if needed, **Accept** the incoming request, then **Mark as Picked Up**.
5. As **Buyer** and **Seller**: each tap "Confirm delivery" on the order — once both have confirmed, status flips to **Delivered** and the driver's earnings update automatically.

### 4.8 Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it
vercel
```

- When prompted, add the same six `NEXT_PUBLIC_FIREBASE_*` env vars from `.env.local` in the Vercel project settings (**Settings → Environment Variables**), for both Preview and Production.
- Add your Vercel domain (e.g. `bumap.vercel.app`) to Firebase Console → Authentication → Settings → **Authorized domains**, or sign-in will be blocked.
- Redeploy after adding env vars: `vercel --prod`.

Firebase Hosting config (`firebase.json`) is also included as an alternative if you'd rather self-host on Firebase, but Vercel (native Next.js support, including SSR) is the recommended target for this project.

## 5. Notes & known simplifications (v1 MVP)

- **Delivery fee** is currently `base fee` only (bike or taxi, set in `/admin/settings`). The per-km rate and a real distance calculation (`distanceKm()` in `src/lib/utils.ts`, using Leaflet-picked coordinates) are wired up as utilities but not yet plugged into an auto-geocoded distance — hook them up once you add a location picker to store/checkout.
- **"Bikes only see jobs under 10kg"**: `products.weightKg` is captured at menu-item level; aggregating per-order weight end-to-end is a straightforward follow-up (`OrderItem` would need a `weightKg` field copied in at checkout).
- **Notifications** ("goes to all Active Drivers within 5km") are implemented as a live Firestore query drivers poll in real time (`onSnapshot`), rather than push notifications — add FCM (Firebase Cloud Messaging) for true push alerts.
- **Order archiving for 2 years** — orders are never auto-deleted, so they're retained indefinitely by default; add a scheduled Cloud Function if you want automatic purging after 2 years.
- **Leaflet map** utilities (`react-leaflet`, `leaflet`) are included as dependencies for driver/store location pickers — wire up a `<MapContainer>` in the store-setup and checkout forms if you want visual pin-dropping instead of free-text locations.
- Photo uploads use plain `<input type="file">` + Firebase Storage — no compression; consider client-side image compression for slow Cameroonian mobile networks before going to production.

## 6. Tech stack recap

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Firebase Auth, Firestore, Storage
- **Maps**: Leaflet.js / react-leaflet (utilities included, ready to wire into forms)
- **Payments**: Manual — Orange Money / MTN MoMo + screenshot proof, no payment API
- **PWA**: `next-pwa`, installable on Android
- **Deployment**: Vercel (recommended) or Firebase Hosting

---

**BUMAP - Buea Market Place. Bike and Taxi Delivery. All payments are direct to sellers. Upload proof.**
