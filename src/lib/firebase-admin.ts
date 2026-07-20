import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set.");
  }

  app = initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
  });

  return app;
}

export function adminDb() {
  return getFirestore(getAdminApp());
}
