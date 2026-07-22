// components/store/AmenitiesGrid.tsx
// Server component — no interactivity needed, so no "use client".

import { getAmenities } from "@/lib/amenities";

export function AmenitiesGrid({ subcategory }: { subcategory: string }) {
  const amenities = getAmenities(subcategory);
  if (amenities.length === 0) return null;

  return (
    <section className="px-4 py-5 border-t border-stone-100">
      <h2 className="font-bold text-stone-900 mb-3">Amenities</h2>
      <div className="grid grid-cols-2 gap-3">
        {amenities.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-stone-700">
            <Icon className="w-4 h-4 text-[#1fb567] flex-shrink-0" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
