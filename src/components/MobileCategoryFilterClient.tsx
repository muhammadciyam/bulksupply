"use client";

import Link from "next/link";
import { X } from "lucide-react";

type Category = { id: string; name: string; slug: string; parentId: string | null };

export function MobileCategoryFilterClient({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  const active = categories.find((c) => c.slug === activeSlug);
  if (!active) return null;

  return (
    <div className="md:hidden">
      <span className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full pl-3 pr-1.5 py-1 text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {active.name}
        <Link
          href="/"
          aria-label="Clear category filter"
          className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-gray-300"
        >
          <X size={11} />
        </Link>
      </span>
    </div>
  );
}
