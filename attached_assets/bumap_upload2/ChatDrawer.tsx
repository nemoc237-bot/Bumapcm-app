"use client";

// components/store/ChatDrawer.tsx
//
// Floating chat button + bottom sheet. Polls GET /api/chat/[storeId] every
// 4s while open and posts new messages via POST. This is intentionally
// simple (no websockets) — good enough for early BUMAP volume. If message
// traffic grows, swap the polling `useEffect` below for a websocket
// subscription (Pusher/Ably/socket.io); the API route's POST shape doesn't
// need to change.

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  id: string;
  sender: "CLIENT" | "LANDLORD";
  senderName: string | null;
  body: string;
  createdAt: string;
};

const POLL_INTERVAL_MS = 4000;

export function ChatDrawer({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/chat/${storeId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      // Silent fail on a poll tick — no need to spam errors for a background refresh.
    }
  }

  useEffect(() => {
    if (!open) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage() {
    const body = draft.trim();
    if (!body) return;

    setSending(true);
    setDraft("");
    try {
      const res = await fetch(`/api/chat/${storeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "CLIENT", body }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => [...prev, message]);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating action button, sits above the sticky CTA bar */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Chat with landlord"
        className="fixed bottom-20 right-4 z-20 w-12 h-12 rounded-full bg-[#1fb567] text-white shadow-lg flex items-center justify-center"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[75vh] flex flex-col p-0">
          <SheetHeader className="px-4 py-3 border-b border-stone-100 flex-row items-center justify-between space-y-0">
            <SheetTitle className="text-sm">Chat about {storeName}</SheetTitle>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
            {messages.length === 0 && (
              <p className="text-center text-stone-400 text-sm mt-8">
                Say hello — the host usually replies within a few hours.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  m.sender === "CLIENT"
                    ? "self-end bg-[#1fb567] text-white rounded-br-sm"
                    : "self-start bg-stone-100 text-stone-800 rounded-bl-sm"
                }`}
              >
                {m.body}
              </div>
            ))}
          </div>

          <div className="border-t border-stone-100 px-3 py-3 flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message…"
              className="flex-1"
            />
            <Button size="icon" onClick={sendMessage} disabled={sending || !draft.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
