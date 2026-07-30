import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";
import { updateProduct, deleteProduct } from "../../actions";
import { DeleteButton } from "./DeleteButton";
import { isStaffRole, canManageCatalog } from "@/lib/roles";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ imageError?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  if (!canManageCatalog(session.user.role)) redirect("/admin/orders");

  const { id } = await params;
  const { imageError } = await searchParams;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { units: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, product.id);
  const deleteWithId = deleteProduct.bind(null, product.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-navy">Edit Product</h1>
        <DeleteButton action={deleteWithId} />
      </div>
      {imageError && (
        <p className="text-sm text-brand-red bg-red-50 border border-red-100 rounded px-3 py-2">
          {imageError}
        </p>
      )}
      <ProductForm
        categories={categories}
        action={updateWithId}
        submitLabel="Save Changes"
        initial={{
          name: product.name,
          categoryId: product.categoryId,
          description: product.description ?? "",
          stockStatus: product.stockStatus,
          imageUrl: product.imageUrl,
          units: product.units.map((u) => ({
            id: u.id,
            label: u.label,
            packSize: u.packSize,
            price: String(u.price),
          })),
        }}
      />
    </div>
  );
}
