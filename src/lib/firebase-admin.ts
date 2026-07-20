import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

/**
 * Parse the service account JSON robustly.
 *
 * Replit secrets can mangle the private_key field in two ways:
 *  1. Literal backslash-n sequences (\\n) that should be real newlines (\n)
 *  2. Actual unescaped newline characters inside the JSON string value
 *
 * We try three strategies in order.
 */
function parseServiceAccount(raw: string): Record<string, unknown> {
  const s = raw.trim();

  // Strategy 1 — plain parse (correctly stored secret)
  try {
    return JSON.parse(s);
  } catch (_) {}

  // Strategy 2 — double-escaped newlines (\\n → \n)
  try {
    return JSON.parse(s.replace(/\\n/g, "\n"));
  } catch (_) {}

  // Strategy 3 — actual newlines inside private_key value
  // Only escape newlines that appear between the private_key quotes.
  try {
    const fixed = s.replace(
      /("private_key"\s*:\s*")([\s\S]*?)("[\s,}])/,
      (_match, prefix, key, suffix) =>
        prefix + key.replace(/\n/g, "\\n") + suffix
    );
    return JSON.parse(fixed);
  } catch (_) {}

  throw new Error(
    "Could not parse FIREBASE_SERVICE_ACCOUNT. Make sure you pasted the full JSON from the Firebase service account file."
  );
}

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set.");
  }

  const parsed = parseServiceAccount(serviceAccount);

  app = initializeApp({
    credential: cert(parsed as Parameters<typeof cert>[0]),
  });

  return app;
}

export function adminDb() {
  return getFirestore(getAdminApp());
}
