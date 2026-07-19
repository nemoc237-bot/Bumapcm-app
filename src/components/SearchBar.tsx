"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  /** Pre-fill the input with an existing query (used on the Search results page). */
  initialValue?: string;
}

export function SearchBar({ initialValue = "" }: SearchBarProps) {
  const [term, setTerm] = useState(initialValue);
  const router = useRouter();

  function runSearch() {
    const trimmed = term.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
      <span className="text-neutral-400">🔍</span>
      <input
        type="text"
        inputMode="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && runSearch()}
        placeholder="Search BUMAP: Fufu, iPhone, Studio…"
        className="flex-1 bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
      />
      {term && (
        <button
          onClick={runSearch}
          className="px-1 text-xs font-semibold text-brand-600"
          aria-label="Search"
        >
          Go
        </button>
      )}
    </div>
  );
}
