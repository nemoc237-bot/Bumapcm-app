"use client";

// components/store/StickyCta.tsx
//
// Sticky on mobile (fixed to viewport bottom, safe-area aware for iOS/
// WhatsApp in-app browser notches). Buttons branch by subcategory:
//   Apartment/Hostel/Guesthouse -> Book Now / Book Appointment to View
//   Shop                       -> Order Now / WhatsApp Seller
// Book* buttons open BookingModal; Order/WhatsApp buttons open wa.me directly.

import { useState } from "react";
import { MessageCircle, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "./BookingModal";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export function StickyCta({
  storeId,
  storeName,
  subcategory,
  contactWhatsApp,
}: {
  storeId: string;
  storeName: string;
  subcategory: string;
  contactWhatsApp: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [bookingType, setBookingType] = useState<"BOOK_NOW" | "BOOK_APPOINTMENT">("BOOK_NOW");

  const isShop = subcategory === "Shop";
  const whatsappLink = buildWhatsAppLink(contactWhatsApp, storeName);

  function openBooking(type: "BOOK_NOW" | "BOOK_APPOINTMENT") {
    setBookingType(type);
    setModalOpen(true);
  }

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-3 flex gap-3 z-20"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {isShop ? (
          <>
            <Button asChild className="flex-1 bg-[#1fb567] hover:bg-[#1a9c58]">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                Order Now
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-1.5" />
                WhatsApp Seller
              </a>
            </Button>
          </>
        ) : (
          <>
            <Button
              className="flex-1 bg-[#1fb567] hover:bg-[#1a9c58]"
              onClick={() => openBooking("BOOK_NOW")}
            >
              Book Now
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => openBooking("BOOK_APPOINTMENT")}
            >
              <CalendarCheck className="w-4 h-4 mr-1.5" />
              Book Appointment
            </Button>
          </>
        )}
      </div>

      {!isShop && (
        <BookingModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          storeId={storeId}
          storeName={storeName}
          type={bookingType}
        />
      )}
    </>
  );
}
