import { getCategories } from "@/lib/cached-data";
import { MobileCategoryFilterClient } from "./MobileCategoryFilterClient";

export async function MobileCategoryFilter({ activeSlug }: { activeSlug?: string }) {
  const categories = await getCategories();
  return <MobileCategoryFilterClient categories={categories} activeSlug={activeSlug} />;
}
