import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import { formatMVR, STOCK_BADGE } from "@/lib/format";
import { isStaffRole } from "@/lib/roles";

export default async function AdminProductsPage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  if (session.user.role !== "ADMIN") redirect("/admin/orders");

  const products = await prisma.product.findMany({
    include: { category: true, units: true, inventory: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-navy">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-4 py-2 rounded-md"
        >
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="font-normal px-4 py-3">Product</th>
              <th className="font-normal px-4 py-3">Category</th>
              <th className="font-normal px-4 py-3">Price</th>
              <th className="font-normal px-4 py-3">Stock</th>
              <th className="font-normal px-4 py-3">Status</th>
              <th className="font-normal px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const badge = STOCK_BADGE[p.stockStatus];
              return (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.units[0] ? `MVR ${formatMVR(p.units[0].price)} / ${p.units[0].label}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.inventory?.quantityOnHand ?? "-"}</td>
                  <td className="px-4 py-3">
                    {badge?.label ? (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${badge.className}`}>
                        {badge.label}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-500">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-brand-green text-xs font-medium">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
