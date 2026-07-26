"use client";

/**
 * Seller messages inbox — shows all buyer chat sessions for this seller's store.
 * Sellers can read and reply to each encrypted conversation.
 */

import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  doc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState, Spinner } from "@/components/Shared";
import type { Store } from "@/types";

// ─── Crypto (same as StoreChatDrawer) ────────────────────────────────────────

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

async function encryptMsg(storeId: string, buyerId: string, plaintext: string) {
  const key = await deriveKey(storeId, buyerId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return { encrypted: toBase64(ciphertext), iv: toBase64(iv) };
}

async function decryptMsg(storeId: string, buyerId: string, encrypted: string, iv: string) {
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

interface Session {
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  storeId: string;
  updatedAt: number;
}

interface RawMsg {
  id: string;
  senderId: string;
  senderName: string;
  encrypted: string;
  iv: string;
  createdAt: number;
}

interface Msg extends RawMsg { text: string; }

// ─── Bubble ───────────────────────────────────────────────────────────────────

function Bubble({ msg, isMine }: { msg: Msg; isMine: boolean }) {
  const time = new Date(msg.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
        isMine ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-white text-neutral-800"
      }`}>
        {!isMine && <p className="mb-0.5 text-xs font-semibold text-brand-700">{msg.senderName}</p>}
        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
        <p className={`mt-0.5 text-right text-[10px] ${isMine ? "text-brand-200" : "text-neutral-400"}`}>{time}</p>
      </div>
    </div>
  );
}

// ─── Chat thread ──────────────────────────────────────────────────────────────

function ChatThread({
  session,
  storeId,
  sellerId,
  sellerName,
  onBack,
}: {
  session: Session;
  storeId: string;
  sellerId: string;
  sellerName: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "stores", storeId, "chats", session.buyerId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, async (snap) => {
      const raws: RawMsg[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RawMsg));
      const decrypted = await Promise.all(
        raws.map(async (m) => ({
          ...m,
          text: await decryptMsg(storeId, session.buyerId, m.encrypted, m.iv),
        }))
      );
      setMessages(decrypted);
    });
    return () => unsub();
  }, [storeId, session.buyerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await setDoc(
        doc(db, "stores", storeId, "chats", session.buyerId),
        { updatedAt: Date.now() },
        { merge: true }
      );
      const { encrypted, iv } = await encryptMsg(storeId, session.buyerId, text.trim());
      await addDoc(
        collection(db, "stores", storeId, "chats", session.buyerId, "messages"),
        { senderId: sellerId, senderName: sellerName, encrypted, iv, createdAt: Date.now() }
      );
      setText("");
    } finally {
      setSending(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="flex h-[calc(100dvh-110px)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-3 mb-3">
        <button onClick={onBack} className="text-sm font-semibold text-brand-700">← Back</button>
        <div>
          <p className="font-bold">{session.buyerName}</p>
          {session.buyerPhone && (
            <p className="text-xs text-neutral-500">{session.buyerPhone}</p>
          )}
        </div>
        <span className="ml-auto text-[10px] text-neutral-400">🔒 AES-256</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-neutral-400">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <Bubble key={m.id} msg={m} isMine={m.senderId === sellerId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            className="input flex-1 resize-none"
            placeholder="Reply to buyer…"
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
    </div>
  );
}

// ─── Inbox list ───────────────────────────────────────────────────────────────

function Inbox() {
  const { profile } = useAuth();
  const [store, setStore] = useState<Store | null | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Session | null>(null);

  // Load seller's store
  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, "stores"), where("sellerId", "==", profile.id));
    getDocs(q).then((snap) => {
      setStore(snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Store));
    });
  }, [profile]);

  // Live sessions
  useEffect(() => {
    if (!store) return;
    const q = query(collection(db, "stores", store.id, "chats"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data() as Session);
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      setSessions(list);
      setLoading(false);
    });
    return () => unsub();
  }, [store]);

  if (store === undefined || loading) return <Spinner />;
  if (!store) return <EmptyState text="You don't have a store yet." />;

  if (active) {
    return (
      <ChatThread
        session={active}
        storeId={store.id}
        sellerId={profile!.id}
        sellerName={profile!.name}
        onBack={() => setActive(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">{store.name}</h2>
          <p className="text-xs text-neutral-500">💬 Customer Messages</p>
        </div>
        <span className="text-[10px] text-neutral-400">🔒 AES-256 encrypted</span>
      </div>

      {sessions.length === 0 ? (
        <EmptyState text="No customer messages yet. When buyers chat with your store, conversations appear here." />
      ) : (
        sessions.map((s) => (
          <button
            key={s.buyerId}
            onClick={() => setActive(s)}
            className="card w-full text-left hover:border-brand-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                {s.buyerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight">{s.buyerName}</p>
                {s.buyerPhone && (
                  <p className="text-xs text-neutral-500">{s.buyerPhone}</p>
                )}
              </div>
              <p className="shrink-0 text-xs text-neutral-400">
                {new Date(s.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function SellerMessagesPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <RoleGuard allow={["seller"]}>
          <Inbox />
        </RoleGuard>
      </main>
    </>
  );
}
