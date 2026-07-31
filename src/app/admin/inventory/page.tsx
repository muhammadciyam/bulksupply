import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InventoryTable } from "./InventoryTable";
import { isStaffRole, canManageCatalog } from "@/lib/roles";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  if (!canManageCatalog(session.user.role)) redirect("/admin/orders");

  const items = await prisma.inventoryItem.findMany({
    include: { product: { include: { category: true, units: true } } },
    orderBy: { product: { name: "asc" } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand-navy">Inventory</h1>
      <InventoryTable
        items={items.map((i) => {
          const unit = i.product.units.find((u) => u.isDefault) ?? i.product.units[0];
          return {
            id: i.id,
            productName: i.product.name,
            sku: i.product.sku,
            category: i.product.category.name,
            quantityOnHand: i.quantityOnHand,
            lowStockThreshold: i.lowStockThreshold,
            unitId: unit?.id ?? null,
            unitLabel: unit?.label ?? null,
            sellingPrice: unit?.price ?? null,
            costPrice: unit?.costPrice ?? null,
          };
        })}
      />
    </div>
  );
}
