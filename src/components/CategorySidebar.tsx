import Link from "next/link";
import { getCategories } from "@/lib/cached-data";

export async function CategorySidebar({ activeSlug }: { activeSlug?: string }) {
  const categories = await getCategories();
  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <aside className="hidden md:block md:w-56 shrink-0">
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
          {topLevel.map((c) => {
            const children = categories.filter((sub) => sub.parentId === c.id);
            return (
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
                {children.length > 0 && (
                  <ul className="pl-3 space-y-0.5">
                    {children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/?category=${sub.slug}`}
                          className={`block py-1 uppercase text-[11px] tracking-wide ${
                            activeSlug === sub.slug
                              ? "text-brand-green font-semibold"
                              : "text-gray-500 hover:text-brand-green"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
