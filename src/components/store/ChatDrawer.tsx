"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MessageSquare, Send, X } from "lucide-react";

type ChatMessage = {
  id: string;
  sender: "CLIENT" | "LANDLORD";
  body: string;
  createdAt: number;
};

export function ChatDrawer({ houseId, houseName }: { houseId: string; houseName: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Real-time listener while drawer is open
  useEffect(() => {
    if (!open) return;
    const q = query(
      collection(db, "houses", houseId, "chatMessages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    return () => unsub();
  }, [open, houseId]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setDraft("");
    try {
      await addDoc(collection(db, "houses", houseId, "chatMessages"), {
        sender: "CLIENT",
        body,
        createdAt: Date.now(),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button — sits above the sticky CTA bar */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Chat with landlord"
        className="fixed bottom-20 right-4 z-20 w-12 h-12 rounded-full bg-brand-600 text-white shadow-lg flex items-center justify-center hover:bg-brand-700 transition"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* Bottom drawer */}
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />

          <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col"
               style={{ height: "75vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <span className="font-semibold text-sm">Chat about {houseName}</span>
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {messages.length === 0 && (
                <p className="text-center text-neutral-400 text-sm mt-8">
                  Say hello — the host usually replies within a few hours.
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    m.sender === "CLIENT"
                      ? "self-end bg-brand-600 text-white rounded-br-sm"
                      : "self-start bg-neutral-100 text-neutral-800 rounded-bl-sm"
                  }`}
                >
                  {m.body}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-neutral-100 px-3 py-3 flex gap-2">
              <input
                className="input flex-1"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message…"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !draft.trim()}
                className="btn-primary !px-3 !py-2 disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
