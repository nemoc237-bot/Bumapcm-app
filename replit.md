# BUMAP — Buea Market Place

A 3-sided marketplace for Buea, Cameroon: Sellers sell, Delivery Drivers deliver by Bike or Taxi, and Buyers order. Payments go directly to sellers via Orange Money / MTN MoMo — BUMAP never touches the money.

## Stack

- **Frontend / Backend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Database / Auth / Storage**: Firebase (Firestore, Authentication, Storage)
- **PWA**: next-pwa (installable on Android)

## Running the app

```bash
npm run dev      # starts on port 5000
npm run build    # production build
npm run start    # production server
```

The workflow "Start application" runs `npm run dev` automatically.

## Environment secrets

All 6 Firebase config values are stored as Replit Secrets:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Firebase setup checklist

Before using the app, ensure your Firebase project has:
- **Authentication** → Email/Password sign-in enabled
- **Firestore** → database created (start in test mode, then apply `firestore.rules`)
- **Storage** → bucket created (apply `storage.rules`)
- **Firestore indexes** → deploy with `firebase deploy --only firestore:indexes`

## Seed demo data

To populate demo sellers, drivers, and menu items:

1. Download a service account key from Firebase Console → Project Settings → Service Accounts
2. Save it as `serviceAccountKey.json` in the project root (do NOT commit this file)
3. Run: `npm run seed`

Demo accounts (password: `Bumap123!`):
- Seller: `nemo.seller@bumap.demo`
- Bike driver: `bike.driver@bumap.demo`
- Taxi driver: `taxi.driver@bumap.demo`

## User preferences

_None recorded yet._
