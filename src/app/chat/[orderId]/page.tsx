"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Spinner } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";
import { encryptMessage, decryptMessage } from "@/lib/chat-crypto";
import type { Order, Store } from "@/types";

// ─── types ───────────────────────────────────────────────────────────────────

interface RawMessage {
  id: string;
  senderId: string;
  senderName: string;
  encrypted: string;
  iv: string;
  createdAt: number;
}

interface ChatMessage extends RawMessage {
  text: string; // decrypted
}

// ─── sub-components ──────────────────────────────────────────────────────────

function MomoBadge({ store }: { store: Store }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(store.momoNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const providerColor =
    store.momoProvider === "MTN MoMo"
      ? "bg-yellow-50 border-yellow-300 text-yellow-900"
      : "bg-orange-50 border-orange-300 text-orange-900";

  return (
    <div className={`rounded-xl border-2 px-4 py-3 ${providerColor}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        Pay via {store.momoProvider} — locked by BUMAP.co 🔒
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-2xl font-extrabold tracking-widest">
          {store.momoNumber}
        </p>
        <button
          onClick={copy}
          className="rounded-lg border border-current px-3 py-1 text-xs font-medium"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <p className="mt-1 text-xs opacity-60">
        Send payment to {store.name} at this number, then upload your screenshot below.
      </p>
    </div>
  );
}

function Bubble({
  msg,
  isMine,
}: {
  msg: ChatMessage;
  isMine: boolean;
}) {
  const time = new Date(msg.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isMine
            ? "rounded-br-sm bg-brand-600 text-white"
            : "rounded-bl-sm bg-white text-neutral-800"
        }`}
      >
        {!isMine && (
          <p className="mb-0.5 text-xs font-semibold text-brand-700">
            {msg.senderName}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
        <p
          className={`mt-1 text-right text-[10px] ${
            isMine ? "text-brand-200" : "text-neutral-400"
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

function ChatContent() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const orderId = params.orderId;

  // Load order (real-time)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "orders", orderId), (snap) => {
      if (!snap.exists()) { setLoadingOrder(false); return; }
      setOrder({ id: snap.id, ...snap.data() } as Order);
      setLoadingOrder(false);
    });
    return () => unsub();
  }, [orderId]);

  // Load store once order is known
  useEffect(() => {
    if (!order?.storeId) return;
    const unsub = onSnapshot(doc(db, "stores", order.storeId), (snap) => {
      if (snap.exists()) setStore({ id: snap.id, ...snap.data() } as Store);
    });
    return () => unsub();
  }, [order?.storeId]);

  // Subscribe to messages and decrypt them
  useEffect(() => {
    const q = query(
      collection(db, "orders", orderId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, async (snap) => {
      const raws: RawMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RawMessage, "id">),
      }));
      const decrypted = await Promise.all(
        raws.map(async (m) => ({
          ...m,
          text: await decryptMessage(orderId, m.encrypted, m.iv),
        }))
      );
      setMessages(decrypted);
    });
    return () => unsub();
  }, [orderId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim() || !profile) return;
    setSending(true);
    try {
      const { encrypted, iv } = await encryptMessage(orderId, text.trim());
      await addDoc(collection(db, "orders", orderId, "messages"), {
        senderId: profile.id,
        senderName: profile.name,
        encrypted,
        iv,
        createdAt: Date.now(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ── auth guard ──────────────────────────────────────────────────────────
  if (authLoading) return <Spinner />;
  if (!profile) {
    router.replace("/login");
    return null;
  }

  if (loadingOrder) return <Spinner />;
  if (!order) {
    return (
      <p className="mt-20 text-center text-neutral-500">Order not found.</p>
    );
  }

  // Verify the current user is actually a participant
  const isBuyer = profile.id === order.buyerId;
  const isSeller = profile.id === order.sellerId;
  if (!isBuyer && !isSeller && profile.role !== "admin") {
    return (
      <p className="mt-20 text-center text-neutral-500">
        You don't have access to this conversation.
      </p>
    );
  }

  const statusColor: Record<string, string> = {
    pending_payment: "bg-amber-100 text-amber-800",
    payment_confirmed: "bg-blue-100 text-blue-800",
    driver_requested: "bg-purple-100 text-purple-800",
    driver_assigned: "bg-indigo-100 text-indigo-800",
    picked_up: "bg-cyan-100 text-cyan-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabel: Record<string, string> = {
    pending_payment: "Waiting for payment",
    payment_confirmed: "Payment confirmed",
    driver_requested: "Finding driver",
    driver_assigned: "Driver assigned",
    picked_up: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col">
      {/* ── header ── */}
      <div className="border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-brand-700 font-semibold text-sm"
            >
              ← Back
            </button>
            <div>
              <p className="font-bold leading-tight">{order.storeName}</p>
              <p className="text-xs text-neutral-500">
                {order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                statusColor[order.status] ?? "bg-neutral-100 text-neutral-700"
              }`}
            >
              {statusLabel[order.status] ?? order.status}
            </span>
            <span className="text-xs text-neutral-400" title="Messages are AES-256 encrypted">🔒</span>
          </div>
        </div>
      </div>

      {/* ── scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
          {/* Order summary card */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="mb-2 font-semibold text-sm text-neutral-700">Order Summary</p>
            <div className="space-y-1 text-sm">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>{it.qty}× {it.name}</span>
                  <span className="font-medium">{formatFcfa(it.price * it.qty)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                <span>Total</span>
                <span>{formatFcfa(order.total)}</span>
              </div>
            </div>
            {order.note && (
              <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">
                📝 {order.note}
              </p>
            )}
            <div className="mt-2 text-xs text-neutral-500">
              <span>📍 Deliver to: {order.dropoffLocation}</span>
            </div>
          </div>

          {/* MoMo payment info — only show if store loaded */}
          {store && (
            <MomoBadge store={store} />
          )}

          {/* Seller link to their orders page */}
          {isSeller && (
            <Link
              href="/seller/orders"
              className="block rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-center text-sm font-semibold text-brand-700"
            >
              Manage this order →
            </Link>
          )}

          {/* Divider before messages */}
          {messages.length === 0 ? (
            <p className="text-center text-sm text-neutral-400">
              No messages yet. Say hello to get started! 👋
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <Bubble key={m.id} msg={m} isMine={m.senderId === profile.id} />
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── input bar ── */}
      <div className="border-t bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            rows={1}
            className="input flex-1 resize-none"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
          />
          <button
            className="btn-primary shrink-0 !py-2.5 !px-4"
            disabled={!text.trim() || sending}
            onClick={send}
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
        <p className="mt-1 text-center text-[10px] text-neutral-400">
          🔒 Messages are AES-256 encrypted end-to-end
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <>
      <Navbar />
      <ChatContent />
    </>
  );
}
