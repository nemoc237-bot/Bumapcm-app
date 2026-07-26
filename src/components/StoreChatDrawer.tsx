"use client";

/**
 * StoreChatDrawer — AES-256 encrypted real-time chat between a buyer and
 * a store owner. Messages are stored in:
 *   stores/{storeId}/chats/{buyerId}/messages/{msgId}
 *
 * The encryption key is derived from `store_${storeId}_buyer_${buyerId}`,
 * which both the buyer (who knows their own uid) and the seller (who can
 * read all sessions under their store) can independently reconstruct.
 */

import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// ─── Crypto helpers (same pattern as order chat) ──────────────────────────────

const SALT = new TextEncoder().encode("bumap-store-chat-v1");

async function deriveKey(storeId: string, buyerId: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`store_${storeId}_buyer_${buyerId}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: 100_000, hash: "SHA-256" },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Uint8Array(bytes.buffer.slice(0) as ArrayBuffer);
}

async function encrypt(storeId: string, buyerId: string, plaintext: string) {
  const key = await deriveKey(storeId, buyerId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return { encrypted: toBase64(ciphertext), iv: toBase64(iv) };
}

async function decrypt(storeId: string, buyerId: string, encrypted: string, iv: string) {
  try {
    const key = await deriveKey(storeId, buyerId);
    const buf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(iv) },
      key,
      fromBase64(encrypted)
    );
    return new TextDecoder().decode(buf);
  } catch {
    return "[encrypted message]";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawMsg {
  id: string;
  senderId: string;
  senderName: string;
  encrypted: string;
  iv: string;
  createdAt: number;
}

interface Msg extends RawMsg {
  text: string;
}

// ─── Bubble ───────────────────────────────────────────────────────────────────

function Bubble({ msg, isMine }: { msg: Msg; isMine: boolean }) {
  const time = new Date(msg.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isMine
            ? "rounded-br-sm bg-brand-600 text-white"
            : "rounded-bl-sm bg-white text-neutral-800"
        }`}
      >
        {!isMine && (
          <p className="mb-0.5 text-xs font-semibold text-brand-700">{msg.senderName}</p>
        )}
        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
        <p className={`mt-0.5 text-right text-[10px] ${isMine ? "text-brand-200" : "text-neutral-400"}`}>
          {time}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  storeId: string;
  storeName: string;
}

export default function StoreChatDrawer({ storeId, storeName }: Props) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const buyerId = profile?.id ?? null;

  // Subscribe to messages only when drawer is open and user is logged in
  useEffect(() => {
    if (!open || !buyerId) return;
    const q = query(
      collection(db, "stores", storeId, "chats", buyerId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, async (snap) => {
      const raws: RawMsg[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RawMsg));
      const decrypted = await Promise.all(
        raws.map(async (m) => ({
          ...m,
          text: await decrypt(storeId, buyerId, m.encrypted, m.iv),
        }))
      );
      setMessages(decrypted);
    });
    return () => unsub();
  }, [open, buyerId, storeId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim() || !profile || !buyerId) return;
    setSending(true);
    try {
      // Ensure the session doc exists (for seller to discover)
      await setDoc(
        doc(db, "stores", storeId, "chats", buyerId),
        {
          buyerId,
          buyerName: profile.name,
          buyerPhone: profile.phone,
          storeId,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      const { encrypted, iv } = await encrypt(storeId, buyerId, text.trim());
      await addDoc(collection(db, "stores", storeId, "chats", buyerId, "messages"), {
        senderId: buyerId,
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
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl shadow-lg hover:bg-brand-700 transition-colors"
        aria-label="Chat with store"
        title={`Chat with ${storeName}`}
      >
        💬
      </button>

      {/* ── Drawer backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer panel ── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "75dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-bold leading-tight">{storeName}</p>
            <p className="flex items-center gap-1 text-xs text-neutral-500">
              <span>🔒</span> AES-256 encrypted
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-200"
          >
            Close
          </button>
        </div>

        {/* Body */}
        {!profile ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-4xl">🔐</p>
            <p className="font-semibold text-neutral-700">Log in to chat with {storeName}</p>
            <a href="/login" className="btn-primary !py-2 !px-5 text-sm">Log in</a>
            <a href="/register" className="text-sm text-brand-700 underline">Create account</a>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="mt-8 text-center">
                  <p className="text-3xl mb-2">👋</p>
                  <p className="text-sm text-neutral-500">
                    Send a message to start chatting with {storeName}
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <Bubble key={m.id} msg={m} isMine={m.senderId === buyerId} />
                ))
              )}
              <div ref={bottomRef} />
            </div>
            <div className="border-t bg-white px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                  className="input flex-1 resize-none"
                  placeholder="Message the store…"
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
            </div>
          </>
        )}
      </div>
    </>
  );
}
