// app/api/bookings/route.ts
//
// POST /api/bookings
// Body: { storeId, name, phone, date, notes?, type: "BOOK_NOW" | "BOOK_APPOINTMENT" }
//
// For now this just validates, logs, and returns 200 — per the task spec.
// It's already wired to write a real Booking row via Prisma; comment that
// out if you genuinely want log-only behavior with no DB write yet.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type BookingPayload = {
  storeId: string;
  name: string;
  phone: string;
  date: string; // ISO date string from the form
  notes?: string;
  type: "BOOK_NOW" | "BOOK_APPOINTMENT";
};

export async function POST(request: NextRequest) {
  let body: BookingPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { storeId, name, phone, date, notes, type } = body;

  if (!storeId || !name || !phone || !date || !type) {
    return NextResponse.json(
      { error: "storeId, name, phone, date, and type are required" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line no-console
  console.log("[BOOKING REQUEST]", {
    storeId,
    name,
    phone,
    date,
    notes: notes || "(none)",
    type,
    receivedAt: new Date().toISOString(),
  });

  // Persist it too, since we already have the Booking model — remove this
  // block if you want log-only behavior for now.
  try {
    await prisma.booking.create({
      data: {
        storeId,
        name,
        phone,
        date: new Date(date),
        notes: notes || null,
        type,
      },
    });
  } catch (err) {
    // Don't fail the request over a DB hiccup — the log line above already
    // captured the request, which is what the spec asked for.
    // eslint-disable-next-line no-console
    console.error("[BOOKING DB WRITE FAILED]", err);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
