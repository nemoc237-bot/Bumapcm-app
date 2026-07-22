export type Review = {
  name: string;
  rating: number;
  date: string;
  comment: string;
};

export const DEMO_REVIEWS: Review[] = [
  {
    name: "Amara N.",
    rating: 5,
    date: "June 2025",
    comment:
      "Great place, very clean and the landlord responded quickly. Would recommend to any student.",
  },
  {
    name: "Brice T.",
    rating: 4,
    date: "May 2025",
    comment:
      "Good location near UB. Water supply is reliable. A bit pricey but worth it.",
  },
  {
    name: "Fatoumata D.",
    rating: 5,
    date: "April 2025",
    comment:
      "Moved in within 2 days of booking. Everything was as described. Very happy!",
  },
];
