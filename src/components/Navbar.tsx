"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const DASHBOARD_PATH: Record<string, string> = {
  buyer: "/buyer",
  seller: "/seller",
  driver: "/driver",
  admin: "/admin",
};

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const { lines } = useCart();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-brand-700">
          <span className="text-xl">🛒</span>
          <span>BUMAP.co</span>
        </Link>

        <div className="flex items-center gap-3">
          {profile?.role === "buyer" && (
            <>
              <Link href="/buyer/orders" className="hidden text-sm font-medium text-neutral-700 hover:text-brand-700 sm:inline">
                My Orders
              </Link>
              <Link href="/buyer/cart" className="relative text-sm font-medium text-neutral-700">
                🛍️ Cart
                {lines.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
                    {lines.length}
                  </span>
                )}
              </Link>
            </>
          )}

          {profile ? (
            <>
              <Link
                href={DASHBOARD_PATH[profile.role]}
                className="text-sm font-medium text-neutral-700 hover:text-brand-700"
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
                className="text-sm font-medium text-neutral-500 hover:text-red-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-neutral-700">
                Log in
              </Link>
              <Link href="/register" className="btn-primary !py-2 !px-3 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
