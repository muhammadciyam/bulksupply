import Link from "next/link";
import { getCategories } from "@/lib/cached-data";

export async function CategorySidebar({ activeSlug }: { activeSlug?: string }) {
  const categories = await getCategories();

  return (
    <aside className="w-full md:w-56 shrink-0">
      <nav className="text-sm">
        <Link
          href="/"
          className={`block py-2 font-semibold uppercase tracking-wide ${
            !activeSlug ? "text-brand-green" : "text-gray-800 hover:text-brand-green"
          }`}
        >
          All Categories
        </Link>
        <ul className="space-y-0.5">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/?category=${c.slug}`}
                className={`block py-1.5 uppercase text-xs tracking-wide ${
                  activeSlug === c.slug
                    ? "text-brand-green font-semibold"
                    : "text-gray-600 hover:text-brand-green"
                }`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
