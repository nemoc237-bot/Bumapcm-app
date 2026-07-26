/**
 * Featured carousel rotation logic — ported from the v2 spec.
 *
 * Gold   → guaranteed top slots (up to GOLD_GUARANTEED_SLOTS)
 * Silver → higher rotation weight than Bronze
 * Bronze → lowest weight, still rotates in
 *
 * Uses weighted reservoir sampling (A-Res algorithm) for Silver/Bronze so the
 * order isn't always the same — it's a genuine weighted shuffle on every load.
 */

export type FeaturedTier = "GOLD" | "SILVER" | "BRONZE";

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

  // All Golds lead up to the guaranteed cap — overflow rejoins the weighted shuffle
  const guaranteedGolds = golds.slice(0, GOLD_GUARANTEED_SLOTS);
  const overflowGolds = golds.slice(GOLD_GUARANTEED_SLOTS);

  const shuffledRest = weightedShuffle([...overflowGolds, ...rest]);
  return [...guaranteedGolds, ...shuffledRest]
    .slice(0, CAROUSEL_MAX_ITEMS)
    .map((i) => i.item);
}

function weightedShuffle<T>(items: FeaturedItem<T>[]): FeaturedItem<T>[] {
  // A-Res: assign each item key = random^(1/weight), sort descending.
  // Higher-weight items skew toward higher keys but every item has a real chance.
  return items
    .map((item) => ({ item, key: Math.random() ** (1 / TIER_WEIGHT[item.tier]) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}
