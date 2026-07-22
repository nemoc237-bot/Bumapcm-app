"use client";

import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, Loader2 } from "lucide-react";

type BookingType = "BOOK_NOW" | "BOOK_APPOINTMENT";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string;
  houseName: string;
  type: BookingType;
}

export function BookingModal({ open, onOpenChange, houseId, houseName, type }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const title = type === "BOOK_NOW" ? "Book Now" : "Book Appointment to View";

  function reset() {
    setName(""); setPhone(""); setDate(""); setNotes("");
    setSuccess(false); setError("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !date) {
      setError("Please fill in your name, phone, and a date.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await addDoc(collection(db, "houseBookings"), {
        houseId,
        name: name.trim(),
        phone: phone.trim(),
        date,
        notes: notes.trim() || null,
        type,
        createdAt: Date.now(),
      });
      setSuccess(true);
      // Auto-close after 2s
      setTimeout(handleClose, 2000);
    } catch {
      setError("Couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={handleClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-neutral-800">Request sent!</p>
            <p className="text-sm text-neutral-500 mt-1">
              The host of {houseName} will contact you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">Name</label>
              <input
                className="input mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                className="input mt-1"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="6XX XXX XXX"
                required
              />
            </div>

            <div>
              <label className="label">Date</label>
              <input
                className="input mt-1"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                className="input mt-1 resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Anything ${houseName}'s host should know…`}
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                "Send Request"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
