// components/store/ReviewsSection.tsx
import { Star } from "lucide-react";
import { DEMO_REVIEWS } from "@/lib/reviews";

export function ReviewsSection() {
  const avg =
    DEMO_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / DEMO_REVIEWS.length;

  return (
    <section className="px-4 py-5 border-t border-stone-100">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-bold text-stone-900">Reviews</h2>
        <div className="flex items-center gap-1 text-sm text-stone-600">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{avg.toFixed(1)}</span>
          <span className="text-stone-400">· {DEMO_REVIEWS.length} reviews</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {DEMO_REVIEWS.map((review) => (
          <div key={review.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-stone-900">{review.name}</span>
              <span className="text-xs text-stone-400">{review.date}</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < review.rating ? "fill-amber-400 text-amber-400" : "text-stone-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-stone-600">{review.comment}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
