// Shared types across BUMAP. These mirror the Firestore schema described in the README.

export type UserRole = "buyer" | "seller" | "driver" | "admin";

export type VehicleType = "bike" | "taxi";

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Firestore collection: "users" */
export interface BumapUser {
  id: string; // == Firebase Auth uid
  role: UserRole;
  name: string;
  phone: string;
  email: string;
  idPhotoUrl?: string;  // only set for sellers & drivers
  selfieUrl?: string;   // only set for sellers & drivers
  verified: boolean;
  banned: boolean;
  banReason?: string;
  location: string; // free-text neighborhood in Buea, e.g. "Molyko"
  createdAt: number;
}

/** Firestore collection: "drivers" (one doc per driver, id == user id) */
export interface Driver {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  plateNumber: string;
  licenseUrl: string;
  vehiclePhotoUrl: string;
  isActive: boolean;
  currentLocation: GeoPoint | null;
  verified: boolean;
  totalEarnings: number;
  completedDeliveries: number;
}

/** Firestore collection: "stores" */
export interface Store {
  id: string;
  sellerId: string;
  name: string;
  category: "Food" | "Groceries" | "Fashion" | "Electronics" | "Other";
  description: string;
  logoUrl: string;
  momoNumber: string;
  momoProvider: "Orange Money" | "MTN MoMo";
  location: string;
  geo?: GeoPoint;
  isOpen: boolean;
  verified: boolean;
  createdAt: number;
}

/** Firestore collection: "products" */
export interface Product {
  id: string;
  storeId: string;
  name: string;
  price: number; // FCFA
  imageUrl: string;
  description: string;
  available: boolean;
  weightKg?: number; // used for bike (<10kg) vs taxi eligibility
  createdAt: number;
}

export type OrderStatus =
  | "pending_payment"
  | "payment_confirmed"
  | "driver_requested"
  | "driver_assigned"
  | "picked_up"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

/** Firestore collection: "orders" */
export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  total: number; // FCFA, items only
  deliveryFee: number;
  deliveryType: VehicleType | null;
  note?: string; // e.g. "Fragile" or "Big order - need Taxi"
  status: OrderStatus;
  paymentScreenshotUrl: string | null;
  paymentConfirmedBySeller: boolean;
  driverId: string | null;
  dropoffLocation: string;
  pickupLocation: string;
  buyerConfirmedDelivery: boolean;
  sellerConfirmedDelivery: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Firestore collection: "settings" (single doc "global") */
export interface Settings {
  bikeBaseFee: number;
  taxiBaseFee: number;
  perKmRate: number;
}

/** Firestore collection: "houses" — rental/accommodation listings */
export interface House {
  id: string;
  name: string;
  subcategory: "Apartment" | "Hostel" | "Guesthouse" | "Shop";
  description: string;
  price: number;       // FCFA; 0 = "contact for price"
  priceUnit: string;   // e.g. "per night", "per month", "Contact for price"
  monthlyPrice?: number;
  location: string;    // e.g. "Molyko, Buea, Southwest Region, CM"
  images: string[];    // Firebase Storage URLs
  contactWhatsApp: string; // digits only, e.g. "237670000000"
  status: "active" | "inactive" | "pending";
  isDemo?: boolean;
  createdAt: number;
}

/** Firestore collection: "houseBookings" */
export interface HouseBooking {
  id: string;
  houseId: string;
  name: string;
  phone: string;
  date: string;       // ISO date string
  notes?: string | null;
  type: "BOOK_NOW" | "BOOK_APPOINTMENT";
  createdAt: number;
}

/** Firestore subcollection: "houses/{houseId}/chatMessages" */
export interface HouseChatMessage {
  id: string;
  sender: "CLIENT" | "LANDLORD";
  body: string;
  createdAt: number;
}

/** Firestore collection: "disputes" */
export interface Dispute {
  id: string;
  orderId: string;
  raisedBy: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: number;
}
