import Link from "next/link";
import { Header } from "@/components/Header";
import { Logo } from "@/components/Logo";
import { CategorySidebar } from "@/components/CategorySidebar";
import { MobileCategoryFilter } from "@/components/MobileCategoryFilter";
import { BannerCarousel } from "@/components/BannerCarousel";
import { ProductCard } from "@/components/ProductCard";
import { getStorefrontProducts, getBannerImages, getCategories } from "@/lib/cached-data";
import { Prisma } from "@prisma/client";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const where: Prisma.ProductWhereInput = {};
  if (q) where.name = { contains: q };

  const categories = category ? await getCategories() : [];
  const matched = category ? categories.find((c) => c.slug === category) : undefined;
  if (category) {
    if (matched) {
      // A parent category also includes products from its subcategories;
      // a subcategory (or a category with no children) matches only itself.
      const childIds = categories.filter((c) => c.parentId === matched.id).map((c) => c.id);
      where.categoryId = childIds.length > 0 ? { in: [matched.id, ...childIds] } : matched.id;
    } else {
      where.category = { slug: category };
    }
  }

  // Row of subcategory chips shown above the product grid: viewing a parent
  // shows its children to drill into, viewing a subcategory shows its
  // siblings (via the shared parent) so it's easy to switch between them.
  const chipParent = matched ? (matched.parentId ? categories.find((c) => c.id === matched.parentId) : matched) : undefined;
  const subcategoryChips = chipParent ? categories.filter((c) => c.parentId === chipParent.id) : [];

  const [products, bannerImageRows] = await Promise.all([
    getStorefrontProducts(where),
    getBannerImages(),
  ]);

  const imagesBySlot: string[][] = [[], [], [], []];
  for (const img of bannerImageRows) {
    imagesBySlot[img.slot - 1]?.push(img.imageUrl);
  }

  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      <Header />
      <main className="max-w-[1600px] mx-auto w-full px-4 py-4 flex-1">
        <BannerCarousel imagesBySlot={imagesBySlot} />
        <div className="mt-4">
          <MobileCategoryFilter activeSlug={category} />
        </div>
        <div className="flex flex-col md:flex-row gap-6 mt-4 md:mt-6">
          <CategorySidebar activeSlug={category} />
          <section className="flex-1">
            {chipParent && subcategoryChips.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-1 px-1">
                <Link
                  href={`/?category=${chipParent.slug}`}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
                    matched?.id === chipParent.id
                      ? "bg-brand-green text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All {chipParent.name}
                </Link>
                {subcategoryChips.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/?category=${sub.slug}`}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
                      matched?.id === sub.id
                        ? "bg-brand-green text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
            {q && (
              <p className="text-sm text-gray-500 mb-3">
                Showing results for <span className="font-semibold">&quot;{q}&quot;</span>
              </p>
            )}
            {products.length === 0 ? (
              <p className="text-gray-400 text-sm py-12 text-center">No products found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      sku: p.sku,
                      stockStatus: p.stockStatus,
                      images: p.images.map((img) => img.imageUrl),
                      units: p.units,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-8">
      <div className="max-w-[1600px] mx-auto px-4 py-6 flex flex-col items-center gap-3 text-xs text-gray-400 text-center">
        <Logo />
        <p>© {new Date().getFullYear()} Bulk Supply. All rights reserved.</p>
      </div>
    </footer>
  );
}
