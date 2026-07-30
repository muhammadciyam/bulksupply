import { Header } from "@/components/Header";
import { Logo } from "@/components/Logo";
import { CategorySidebar } from "@/components/CategorySidebar";
import { BannerCarousel } from "@/components/BannerCarousel";
import { ProductCard } from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const where: Prisma.ProductWhereInput = {};
  if (category) where.category = { slug: category };
  if (q) where.name = { contains: q };

  const products = await prisma.product.findMany({
    where,
    include: { units: { orderBy: { isDefault: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="max-w-[1400px] mx-auto w-full px-4 py-4 flex-1">
        <BannerCarousel />
        <div className="flex flex-col md:flex-row gap-6 mt-6">
          <CategorySidebar activeSlug={category} />
          <section className="flex-1">
            {q && (
              <p className="text-sm text-gray-500 mb-3">
                Showing results for <span className="font-semibold">&quot;{q}&quot;</span>
              </p>
            )}
            {products.length === 0 ? (
              <p className="text-gray-400 text-sm py-12 text-center">No products found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      sku: p.sku,
                      stockStatus: p.stockStatus,
                      imageUrl: p.imageUrl,
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
      <div className="max-w-[1400px] mx-auto px-4 py-6 flex flex-col items-center gap-3 text-xs text-gray-400 text-center">
        <Logo />
        <p>© {new Date().getFullYear()} Bulk Supply. All rights reserved.</p>
      </div>
    </footer>
  );
}
