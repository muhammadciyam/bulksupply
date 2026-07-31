import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Read-heavy storefront data, cached in memory (Next.js Data Cache) to avoid
// hitting Supabase on every request. Invalidated on-demand via revalidateTag
// from the admin actions that mutate this data, with a time-based fallback.

export const getStorefrontProducts = unstable_cache(
  async (where: Prisma.ProductWhereInput) => {
    return prisma.product.findMany({
      where,
      include: {
        units: { orderBy: { isDefault: "desc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  },
  ["storefront-products"],
  { tags: ["products"], revalidate: 60 }
);

export const getBannerImages = unstable_cache(
  async () => {
    return prisma.bannerImage.findMany({ orderBy: [{ slot: "asc" }, { sortOrder: "asc" }] });
  },
  ["banner-images"],
  { tags: ["banners"], revalidate: 60 }
);

export const getCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  },
  ["categories"],
  { tags: ["categories"], revalidate: 60 }
);
