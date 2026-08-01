import { getCategories } from "@/lib/cached-data";
import { MobileBottomNavClient } from "./MobileBottomNavClient";

export async function MobileBottomNav() {
  const categories = await getCategories();
  return <MobileBottomNavClient categories={categories} />;
}
