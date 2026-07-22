"use client";

import { useState } from "react";
import { CalendarCheck, MessageCircle } from "lucide-react";
import { BookingModal } from "./BookingModal";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface Props {
  houseId: string;
  houseName: string;
  subcategory: string;
  contactWhatsApp: string;
}

export function StickyCta({ houseId, houseName, subcategory, contactWhatsApp }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [bookingType, setBookingType] = useState<"BOOK_NOW" | "BOOK_APPOINTMENT">("BOOK_NOW");

  const isShop = subcategory === "Shop";
  const waLink = buildWhatsAppLink(contactWhatsApp, houseName);

  function openBooking(type: "BOOK_NOW" | "BOOK_APPOINTMENT") {
    setBookingType(type);
    setModalOpen(true);
  }

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 flex gap-3 z-20"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {isShop ? (
          <>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 text-center">
              Order Now
            </a>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
              <MessageCircle className="w-4 h-4" /> WhatsApp Seller
            </a>
          </>
        ) : (
          <>
            <button className="btn-primary flex-1" onClick={() => openBooking("BOOK_NOW")}>
              Book Now
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-1.5" onClick={() => openBooking("BOOK_APPOINTMENT")}>
              <CalendarCheck className="w-4 h-4" /> Book Appointment
            </button>
          </>
        )}
      </div>

      {!isShop && (
        <BookingModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          houseId={houseId}
          houseName={houseName}
          type={bookingType}
        />
      )}
    </>
  );
}
