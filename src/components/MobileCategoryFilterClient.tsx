"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

type Category = { id: string; name: string; slug: string; parentId: string | null };

export function MobileCategoryFilterClient({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const active = categories.find((c) => c.slug === activeSlug);
  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 border border-gray-300 rounded-full px-3.5 py-1.5 text-sm font-medium text-gray-700 bg-white"
        >
          <SlidersHorizontal size={14} />
          Categories
        </button>
        {!active && (
          <span className="text-xs text-brand-green font-semibold uppercase tracking-wide">
            All Categories
          </span>
        )}
      </div>

      {active && (
        <div className="mt-2">
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
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white w-full rounded-t-2xl max-h-[70vh] overflow-y-auto p-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-brand-navy">Categories</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`block py-2.5 text-sm font-semibold uppercase tracking-wide ${
                !activeSlug ? "text-brand-green" : "text-gray-800"
              }`}
            >
              All Categories
            </Link>
            <div className="border-t border-gray-100 mt-1 pt-1">
              {topLevel.map((c) => {
                const children = categories.filter((sub) => sub.parentId === c.id);
                const isActiveBranch = activeSlug === c.slug || children.some((sub) => sub.slug === activeSlug);
                return (
                  <div key={c.id}>
                    <Link
                      href={`/?category=${c.slug}`}
                      onClick={() => setOpen(false)}
                      className={`block py-2.5 text-sm uppercase tracking-wide ${
                        activeSlug === c.slug ? "text-brand-green font-semibold" : "text-gray-700"
                      }`}
                    >
                      {c.name}
                    </Link>
                    {children.length > 0 && isActiveBranch && (
                      <div className="pl-4">
                        {children.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/?category=${sub.slug}`}
                            onClick={() => setOpen(false)}
                            className={`block py-2 text-xs uppercase tracking-wide ${
                              activeSlug === sub.slug ? "text-brand-green font-semibold" : "text-gray-500"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
