"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/Shared";

// /subcategories?type=X is now handled by /listings?type=X (no sub).
// This redirect keeps old links working.

function SubcategoriesRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") ?? "";

  useEffect(() => {
    router.replace(`/listings?type=${type}`);
  }, [router, type]);

  return <Spinner />;
}

export default function SubcategoriesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SubcategoriesRedirect />
    </Suspense>
  );
}
