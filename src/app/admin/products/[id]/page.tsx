import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";
import { updateProduct, deleteProduct } from "../../actions";
import { DeleteButton } from "./DeleteButton";
import { isStaffRole } from "@/lib/roles";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  if (session.user.role !== "ADMIN") redirect("/admin/orders");

  const { id } = await params;
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
      <ProductForm
        categories={categories}
        action={updateWithId}
        submitLabel="Save Changes"
        initial={{
          name: product.name,
          categoryId: product.categoryId,
          description: product.description ?? "",
          stockStatus: product.stockStatus,
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
