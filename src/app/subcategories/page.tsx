"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Spinner } from "@/components/Shared";
import { CATEGORIES, SUBCATEGORIES, getCategoryLabel } from "@/data/categories";

function SubcategoriesInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") ?? "";

  const subcategories = SUBCATEGORIES[type];
  const categoryLabel = getCategoryLabel(type);

  if (!subcategories) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="font-medium text-neutral-700 mb-1">
            {type ? `"${type}" isn't a known category.` : "No category selected."}
          </p>
          <p className="text-neutral-500 text-sm mb-6">
            Pick one of {CATEGORIES.map((c) => c.label).join(", ")} from the home page.
          </p>
          <button onClick={() => router.push("/")} className="btn-primary">
            Back to home
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="sticky top-[57px] z-20 bg-white border-b border-neutral-200 px-4 pt-4 pb-3">
        <button onClick={() => router.back()} className="text-sm text-neutral-500 mb-1">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-neutral-900">{categoryLabel}</h1>
        <p className="text-sm text-neutral-500">Choose a subcategory to browse</p>
      </div>

      <main className="mx-auto max-w-5xl px-4 pt-4 pb-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {subcategories.map((sub) => (
            <Link
              key={sub.slug}
              href={`/listings?type=${type}&sub=${sub.slug}`}
              className="card flex h-24 items-center justify-center text-center hover:border-brand-400 transition-colors"
            >
              <span className="font-semibold text-neutral-800 text-sm">{sub.label}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export default function SubcategoriesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SubcategoriesInner />
    </Suspense>
  );
}
