import {
  Wifi, Droplets, Zap, Wind, Shield, Car, Utensils, Tv,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Amenity = { label: string; icon: LucideIcon };

const AMENITIES: Record<string, Amenity[]> = {
  Apartment: [
    { label: "Wi-Fi", icon: Wifi },
    { label: "Running Water", icon: Droplets },
    { label: "Electricity (AES)", icon: Zap },
    { label: "Air Conditioning", icon: Wind },
    { label: "Security", icon: Shield },
    { label: "Parking", icon: Car },
    { label: "Kitchen", icon: Utensils },
    { label: "TV", icon: Tv },
  ],
  Hostel: [
    { label: "Wi-Fi", icon: Wifi },
    { label: "Running Water", icon: Droplets },
    { label: "Electricity (AES)", icon: Zap },
    { label: "Security", icon: Shield },
    { label: "Shared Kitchen", icon: Utensils },
  ],
  Guesthouse: [
    { label: "Wi-Fi", icon: Wifi },
    { label: "Running Water", icon: Droplets },
    { label: "Electricity (AES)", icon: Zap },
    { label: "Air Conditioning", icon: Wind },
    { label: "Security", icon: Shield },
    { label: "TV", icon: Tv },
  ],
  Shop: [],
};

export function getAmenities(subcategory: string): Amenity[] {
  return AMENITIES[subcategory] ?? [];
}
