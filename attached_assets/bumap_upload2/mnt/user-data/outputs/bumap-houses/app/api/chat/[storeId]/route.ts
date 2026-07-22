// app/api/chat/[storeId]/route.ts
//
// Minimal chat backend: GET returns the message history for a store, POST
// appends a new message. The frontend polls GET every few seconds — good
// enough for a demo/MVP. For real-time, swap the polling for a websocket
// provider (Pusher, Ably, or a self-hosted socket.io server) without
// changing this route's shape much — POST stays the same, GET becomes the
// initial-load fetch instead of the only source of truth.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const messages = await prisma.message.findMany({
    where: { storeId: params.storeId },
    orderBy: { createdAt: "asc" },
    take: 200, // cap history for a demo chat; add pagination if this matters later
  });

  return NextResponse.json({ messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  let body: { sender: "CLIENT" | "LANDLORD"; senderName?: string; body: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.body?.trim() || !body.sender) {
    return NextResponse.json({ error: "sender and body are required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      storeId: params.storeId,
      sender: body.sender,
      senderName: body.senderName || null,
      body: body.body.trim(),
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
