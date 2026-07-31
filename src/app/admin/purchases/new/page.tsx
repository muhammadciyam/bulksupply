import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole, canManageCatalog } from "@/lib/roles";
import { createPurchaseInvoice } from "../../actions";
import { PurchaseInvoiceForm } from "../PurchaseInvoiceForm";

export default async function NewPurchaseInvoicePage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  if (!canManageCatalog(session.user.role)) redirect("/admin/orders");

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand-navy">New Purchase Invoice</h1>
      <PurchaseInvoiceForm products={products} action={createPurchaseInvoice} />
    </div>
  );
}
