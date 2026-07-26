// lib/featured.ts
//
// Implements the rotation rule from the spec:
//   Gold   -> guaranteed top slots (up to GOLD_GUARANTEED_SLOTS)
//   Silver -> higher rotation weight than Bronze
//   Bronze -> lowest weight, still rotates in
//
// Uses weighted reservoir sampling (the "A-Res" algorithm) for Silver/Bronze
// so the order isn't just "all silvers then all bronzes" — it's a genuine
// weighted shuffle, re-randomized on every fetch. That's what keeps the
// carousel feeling alive instead of showing the same fixed order all day.

import type { FeaturedTier } from "@prisma/client";

export const TIER_WEIGHT: Record<FeaturedTier, number> = {
  GOLD: 5,
  SILVER: 3,
  BRONZE: 1,
};

export const GOLD_GUARANTEED_SLOTS = 3;
export const CAROUSEL_MAX_ITEMS = 10;

export type FeaturedItem<T> = { tier: FeaturedTier; item: T };

export function buildCarouselOrder<T>(items: FeaturedItem<T>[]): T[] {
  const golds = items.filter((i) => i.tier === "GOLD");
  const rest = items.filter((i) => i.tier !== "GOLD");

  // All Golds lead, up to the guaranteed-slot cap — if there are more Golds
  // than that, the overflow gets weighted-shuffled in with the rest rather
  // than silently dropped, so a Gold slot is never wasted.
  const guaranteedGolds = golds.slice(0, GOLD_GUARANTEED_SLOTS);
  const overflowGolds = golds.slice(GOLD_GUARANTEED_SLOTS);

  const shuffledRest = weightedShuffle([...overflowGolds, ...rest]);

  const ordered = [...guaranteedGolds, ...shuffledRest].slice(0, CAROUSEL_MAX_ITEMS);
  return ordered.map((i) => i.item);
}

function weightedShuffle<T>(items: FeaturedItem<T>[]): FeaturedItem<T>[] {
  // A-Res weighted reservoir sampling: assign each item a random key of
  // Math.random() ** (1 / weight), then sort descending. Higher-weight
  // items skew toward higher keys, but every item still has a real chance.
  return items
    .map((item) => ({ item, key: Math.random() ** (1 / TIER_WEIGHT[item.tier]) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}
