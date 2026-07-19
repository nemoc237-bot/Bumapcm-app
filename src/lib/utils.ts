import type { GeoPoint } from "@/types";

/** Format a FCFA amount with thousands separators, e.g. 12500 -> "12,500 FCFA" */
export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString("en-US")} FCFA`;
}

/** Haversine distance in km between two lat/lng points. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

/** Compute a delivery fee given base settings, vehicle type and distance. */
export function calcDeliveryFee(
  vehicleType: "bike" | "taxi",
  distance: number,
  settings: { bikeBaseFee: number; taxiBaseFee: number; perKmRate: number }
): number {
  const base = vehicleType === "bike" ? settings.bikeBaseFee : settings.taxiBaseFee;
  return Math.round(base + distance * settings.perKmRate);
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pending Payment",
  payment_confirmed: "Payment Confirmed",
  driver_requested: "Looking for Driver",
  driver_assigned: "Driver Assigned",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_STEPS = [
  "pending_payment",
  "payment_confirmed",
  "driver_assigned",
  "picked_up",
  "delivered",
] as const;

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
