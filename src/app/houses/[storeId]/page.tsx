"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Spinner, EmptyState } from "@/components/Shared";
import { StoreGallery } from "@/components/store/StoreGallery";
import { AmenitiesGrid } from "@/components/store/AmenitiesGrid";
import { ReviewsSection } from "@/components/store/ReviewsSection";
import { StickyCta } from "@/components/store/StickyCta";
import { ChatDrawer } from "@/components/store/ChatDrawer";
import type { House } from "@/types";

export default function HouseDetailPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [house, setHouse] = useState<House | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "houses", storeId));
        if (!snap.exists() || snap.data().status !== "active") {
          setHouse(null);
        } else {
          setHouse({ id: snap.id, ...snap.data() } as House);
        }
      } catch {
        setHouse(null);
      }
    }
    load();
  }, [storeId]);

  if (house === undefined) return <><Navbar /><Spinner /></>;
  if (house === null) return <><Navbar /><EmptyState text="This listing was not found or is no longer active." /></>;

  const formattedPrice = house.price > 0
    ? `${house.price.toLocaleString()} FCFA`
    : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pb-28">
        <StoreGallery images={house.images} alt={house.name} />

        <div className="px-4 pt-4">
          {/* Subcategory badge */}
          <span className="inline-block text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full mb-2">
            {house.subcategory}
          </span>

          {/* Name */}
          <h1 className="text-xl font-bold text-neutral-900">{house.name}</h1>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{house.location}</span>
          </div>

          {/* Price */}
          <div className="mt-3">
            {formattedPrice ? (
              <p className="text-2xl font-bold text-neutral-900">
                {formattedPrice}
                <span className="text-sm font-normal text-neutral-500 ml-1">
                  {house.priceUnit}
                </span>
              </p>
            ) : (
              <p className="text-lg font-semibold text-neutral-700">{house.priceUnit}</p>
            )}
            {house.monthlyPrice && (
              <p className="text-sm text-neutral-500 mt-0.5">
                or {house.monthlyPrice.toLocaleString()} FCFA / month
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <section className="px-4 py-5 border-t border-neutral-100 mt-4">
          <h2 className="font-bold text-neutral-900 mb-2">About this place</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">{house.description}</p>
        </section>

        <AmenitiesGrid subcategory={house.subcategory} />
        <ReviewsSection />

        <ChatDrawer houseId={house.id} houseName={house.name} />
        <StickyCta
          houseId={house.id}
          houseName={house.name}
          subcategory={house.subcategory}
          contactWhatsApp={house.contactWhatsApp}
        />
      </main>
    </>
  );
}
