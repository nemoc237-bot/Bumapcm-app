import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { runSeed } from "../../../../scripts/seed-data";

export async function POST(req: Request) {
  // Simple secret guard so random users can't wipe and re-seed
  const secret = req.headers.get("x-seed-secret");
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = adminDb();
    const results = await runSeed(db);
    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[seed]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
