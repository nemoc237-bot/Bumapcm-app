/**
 * Seed script — creates demo data for BUMAP:
 *   - 1 demo Seller "Nemo's Eatery" with 3 menu items
 *   - 1 demo Bike Driver
 *   - 1 demo Taxi Driver
 *   - default delivery fee settings
 *
 * Usage:
 *   1. Download a service account key from Firebase Console:
 *      Project Settings > Service Accounts > Generate new private key
 *      Save it as ./serviceAccountKey.json in the project root (do NOT
 *      commit this file — it's already in .gitignore).
 *   2. Run:  npm run seed
 *
 * All demo accounts use the password: Bumap123!
 */
import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

const keyPath = path.resolve(
  process.cwd(),
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH || "./serviceAccountKey.json"
);

if (!fs.existsSync(keyPath)) {
  console.error(
    `\nMissing service account key at ${keyPath}.\n` +
      `Download one from Firebase Console > Project Settings > Service Accounts,\n` +
      `save it as serviceAccountKey.json in the project root, then re-run "npm run seed".\n`
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(keyPath),
});

const auth = admin.auth();
const db = admin.firestore();

const DEMO_PASSWORD = "Bumap123!";
const PLACEHOLDER_IMG = "https://via.placeholder.com/400x300.png?text=BUMAP";

async function getOrCreateAuthUser(email: string, displayName: string) {
  try {
    return await auth.getUserByEmail(email);
  } catch {
    return auth.createUser({ email, password: DEMO_PASSWORD, displayName });
  }
}

async function seed() {
  console.log("Seeding BUMAP demo data...");

  // ---- Demo Seller: Nemo's Eatery -----------------------------------
  const sellerUser = await getOrCreateAuthUser("nemo.seller@bumap.demo", "Nemo (Seller)");
  await db.collection("users").doc(sellerUser.uid).set(
    {
      role: "seller",
      name: "Nemo",
      phone: "677000001",
      email: "nemo.seller@bumap.demo",
      idPhotoUrl: PLACEHOLDER_IMG,
      selfieUrl: PLACEHOLDER_IMG,
      verified: true,
      banned: false,
      location: "Molyko, Buea",
      createdAt: Date.now(),
    },
    { merge: true }
  );

  const storeRef = db.collection("stores").doc("nemo-eatery-demo");
  await storeRef.set(
    {
      id: storeRef.id,
      sellerId: sellerUser.uid,
      name: "Nemo's Eatery",
      category: "Food",
      description: "Home-style Cameroonian dishes made fresh daily.",
      logoUrl: PLACEHOLDER_IMG,
      momoNumber: "677000001",
      momoProvider: "MTN MoMo",
      location: "Molyko, Buea",
      isOpen: true,
      verified: true,
      createdAt: Date.now(),
    },
    { merge: true }
  );

  const demoProducts = [
    { name: "Jollof Rice & Chicken", price: 2000, description: "Spicy jollof rice with grilled chicken.", weightKg: 1 },
    { name: "Eru & Water Fufu", price: 2500, description: "Traditional eru with fresh water fufu.", weightKg: 1.5 },
    { name: "Puff-Puff (10 pieces)", price: 1000, description: "Sweet, fluffy fried dough balls.", weightKg: 0.5 },
  ];
  for (const [i, p] of demoProducts.entries()) {
    await db.collection("products").doc(`nemo-product-${i + 1}`).set(
      {
        storeId: storeRef.id,
        name: p.name,
        price: p.price,
        imageUrl: PLACEHOLDER_IMG,
        description: p.description,
        available: true,
        weightKg: p.weightKg,
        createdAt: Date.now(),
      },
      { merge: true }
    );
  }

  // ---- Demo Bike Driver ------------------------------------------------
  const bikeUser = await getOrCreateAuthUser("bike.driver@bumap.demo", "Divine (Bike Driver)");
  await db.collection("users").doc(bikeUser.uid).set(
    {
      role: "driver",
      name: "Divine",
      phone: "677000002",
      email: "bike.driver@bumap.demo",
      idPhotoUrl: PLACEHOLDER_IMG,
      selfieUrl: PLACEHOLDER_IMG,
      verified: true,
      banned: false,
      location: "Great Soppo, Buea",
      createdAt: Date.now(),
    },
    { merge: true }
  );
  await db.collection("drivers").doc(bikeUser.uid).set(
    {
      id: bikeUser.uid,
      userId: bikeUser.uid,
      vehicleType: "bike",
      plateNumber: "SW 123 AB",
      licenseUrl: PLACEHOLDER_IMG,
      vehiclePhotoUrl: PLACEHOLDER_IMG,
      isActive: true,
      currentLocation: { lat: 4.1553, lng: 9.2621 },
      verified: true,
      totalEarnings: 0,
      completedDeliveries: 0,
    },
    { merge: true }
  );

  // ---- Demo Taxi Driver --------------------------------------------
  const taxiUser = await getOrCreateAuthUser("taxi.driver@bumap.demo", "Bertrand (Taxi Driver)");
  await db.collection("users").doc(taxiUser.uid).set(
    {
      role: "driver",
      name: "Bertrand",
      phone: "677000003",
      email: "taxi.driver@bumap.demo",
      idPhotoUrl: PLACEHOLDER_IMG,
      selfieUrl: PLACEHOLDER_IMG,
      verified: true,
      banned: false,
      location: "Mile 17, Buea",
      createdAt: Date.now(),
    },
    { merge: true }
  );
  await db.collection("drivers").doc(taxiUser.uid).set(
    {
      id: taxiUser.uid,
      userId: taxiUser.uid,
      vehicleType: "taxi",
      plateNumber: "SW 456 CD",
      licenseUrl: PLACEHOLDER_IMG,
      vehiclePhotoUrl: PLACEHOLDER_IMG,
      isActive: true,
      currentLocation: { lat: 4.1443, lng: 9.2317 },
      verified: true,
      totalEarnings: 0,
      completedDeliveries: 0,
    },
    { merge: true }
  );

  // ---- Default settings ----------------------------------------------
  await db.collection("settings").doc("global").set(
    { bikeBaseFee: 500, taxiBaseFee: 1500, perKmRate: 100 },
    { merge: true }
  );

  console.log("\nSeed complete!");
  console.log("Demo accounts (password for all: Bumap123!):");
  console.log("  Seller:      nemo.seller@bumap.demo");
  console.log("  Bike Driver: bike.driver@bumap.demo");
  console.log("  Taxi Driver: taxi.driver@bumap.demo");
  console.log("\nSign up your own buyer and admin accounts via /register.");
  console.log("To make an account an admin, manually set role: 'admin' on its users/{uid} doc in the Firebase Console.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
