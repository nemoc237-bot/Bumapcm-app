"use client";

// components/store/BookingModal.tsx
//
// One modal, reused by both "Book Now" and "Book Appointment to View" — the
// only difference is the `type` prop, which gets sent to the API and shown
// in the modal title so the user knows which request they're making.

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type BookingType = "BOOK_NOW" | "BOOK_APPOINTMENT";

export function BookingModal({
  open,
  onOpenChange,
  storeId,
  storeName,
  type,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  storeName: string;
  type: BookingType;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const title = type === "BOOK_NOW" ? "Book Now" : "Book Appointment to View";

  function resetForm() {
    setName("");
    setPhone("");
    setDate("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !date) {
      toast.error("Please fill in your name, phone, and a date.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          name: name.trim(),
          phone: phone.trim(),
          date,
          notes: notes.trim() || undefined,
          type,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      toast.success("Request sent. Aunty Rose will contact you.");
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast.error("Couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="booking-name">Name</Label>
            <Input
              id="booking-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="booking-phone">Phone</Label>
            <Input
              id="booking-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="6XX XXX XXX"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="booking-date">Date</Label>
            <Input
              id="booking-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="booking-notes">Notes (optional)</Label>
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Anything ${storeName}'s host should know…`}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
