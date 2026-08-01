"use client";

import Link from "next/link";
import { X } from "lucide-react";

type Category = { id: string; name: string; slug: string; parentId: string | null };

export function CategoryDrawer({
  categories,
  activeSlug,
  open,
  onClose,
}: {
  categories: Category[];
  activeSlug?: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full rounded-t-2xl max-h-[70vh] overflow-y-auto p-4 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-brand-navy">Categories</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <Link
          href="/"
          onClick={onClose}
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
                  onClick={onClose}
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
                        onClick={onClose}
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
  );
}
