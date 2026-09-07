"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductSearch({
  initialQuery = "",
  variant = "dark",
}: {
  initialQuery?: string;
  variant?: "dark" | "light";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  const inputClass =
    variant === "dark"
      ? "border-white/20 bg-white/5 text-cream placeholder:text-white/40"
      : "border-ink/15 bg-white text-ink placeholder:text-ink/40";

  return (
    <form onSubmit={handleSubmit} role="search" className="flex w-full flex-col gap-2 sm:flex-row">
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        type="search"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products…"
        className={`w-full min-w-0 rounded-md border px-3 py-2 text-sm outline-none focus:border-gold ${inputClass}`}
      />
      <button
        type="submit"
        className="w-full shrink-0 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-light sm:w-auto"
      >
        Search
      </button>
    </form>
  );
}
