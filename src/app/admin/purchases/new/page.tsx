import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole, canManageCatalog } from "@/lib/roles";
import { createPurchaseInvoice, getGstPercent } from "../../actions";
import { PurchaseInvoiceForm } from "../PurchaseInvoiceForm";

export default async function NewPurchaseInvoicePage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  if (!canManageCatalog(session.user.role)) redirect("/admin/orders");

  const [productRows, gstPercent] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        units: { where: { isDefault: true }, select: { gstApplicable: true }, take: 1 },
      },
    }),
    getGstPercent(),
  ]);

  // A product's GST-applicable flag comes from its own pricing setup (set on
  // the product form) — the purchase invoice just inherits it automatically
  // rather than asking the admin to decide GST again for every line item.
  const products = productRows.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    gstApplicable: p.units[0]?.gstApplicable ?? false,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand-navy">New Purchase Invoice</h1>
      <PurchaseInvoiceForm products={products} gstPercent={gstPercent} action={createPurchaseInvoice} />
    </div>
  );
}
