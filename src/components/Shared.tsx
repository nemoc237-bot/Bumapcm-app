import { ORDER_STATUS_LABEL, classNames } from "@/lib/utils";
import type { OrderStatus, VehicleType } from "@/types";

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  payment_confirmed: "bg-blue-100 text-blue-800",
  driver_requested: "bg-purple-100 text-purple-800",
  driver_assigned: "bg-indigo-100 text-indigo-800",
  picked_up: "bg-orange-100 text-orange-800",
  delivered: "bg-brand-100 text-brand-800",
  cancelled: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={classNames("badge", STATUS_COLOR[status])}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function VehicleIcon({ type }: { type: VehicleType | null }) {
  if (!type) return null;
  return <span title={type}>{type === "bike" ? "🛵" : "🚕"}</span>;
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 py-12 text-center text-neutral-500">
      <span className="text-3xl">📭</span>
      <p>{text}</p>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
  );
}
