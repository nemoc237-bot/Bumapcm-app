"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

/**
 * Wrap any dashboard page with this to make sure only signed-in users with
 * the right role can view it. Unverified sellers/drivers still see their
 * dashboard (so they can check status) but are blocked from earning actions
 * by each page individually.
 */
export default function RoleGuard({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const { profile, loading, firebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (profile && !allow.includes(profile.role)) {
      router.replace("/");
    }
  }, [loading, firebaseUser, profile, allow, router]);

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!allow.includes(profile.role)) return null;

  if (profile.banned) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-lg font-semibold text-red-600">Account suspended</p>
        <p className="mt-2 text-sm text-neutral-600">
          Reason: {profile.banReason || "Contact BUMAP.co support for details."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
