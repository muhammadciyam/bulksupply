import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";
import { createProduct, getGstPercent } from "../../actions";
import { isStaffRole, canManageCatalog } from "@/lib/roles";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  if (!canManageCatalog(session.user.role)) redirect("/admin/orders");

  const [categories, gstPercent] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    getGstPercent(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand-navy">Add Product</h1>
      <ProductForm
        categories={categories}
        action={createProduct}
        submitLabel="Create Product"
        showInventoryFields
        showSku
        gstPercent={gstPercent}
      />
    </div>
  );
}
