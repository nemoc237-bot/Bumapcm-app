"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState } from "@/components/Shared";
import { formatFcfa } from "@/lib/utils";

function CartContent() {
  const { lines, setQty, removeItem, total } = useCart();
  const router = useRouter();

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-6">
        <EmptyState text="Your cart is empty. Go add something tasty!" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-xl font-bold">Your Cart</h1>
      <div className="mt-4 space-y-3">
        {lines.map((line) => (
          <div key={line.product.id} className="card flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
              {line.product.imageUrl && (
                <Image src={line.product.imageUrl} alt={line.product.name} fill sizes="56px" className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{line.product.name}</p>
              <p className="text-sm text-brand-700">{formatFcfa(line.product.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-7 w-7 rounded-full border" onClick={() => setQty(line.product.id, line.qty - 1)}>−</button>
              <span className="w-4 text-center">{line.qty}</span>
              <button className="h-7 w-7 rounded-full border" onClick={() => setQty(line.product.id, line.qty + 1)}>+</button>
            </div>
            <button className="text-sm text-red-500" onClick={() => removeItem(line.product.id)}>✕</button>
          </div>
        ))}
      </div>

      <div className="card mt-4 flex items-center justify-between">
        <span className="font-semibold">Subtotal</span>
        <span className="font-bold text-brand-700">{formatFcfa(total)}</span>
      </div>

      <button className="btn-primary mt-4 w-full" onClick={() => router.push("/buyer/checkout")}>
        Proceed to Checkout
      </button>
    </main>
  );
}

export default function CartPage() {
  return (
    <>
      <Navbar />
      <RoleGuard allow={["buyer"]}>
        <CartContent />
      </RoleGuard>
    </>
  );
}
