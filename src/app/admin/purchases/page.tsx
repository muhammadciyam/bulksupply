import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Plus, FileText } from "lucide-react";
import { formatMVR, formatDate } from "@/lib/format";
import { isStaffRole, canManageCatalog } from "@/lib/roles";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function PurchaseInvoicesPage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  if (!canManageCatalog(session.user.role)) redirect("/admin/orders");

  const invoices = await prisma.purchaseInvoice.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-navy">Purchase Invoices</h1>
        <Link
          href="/admin/purchases/new"
          className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-4 py-2 rounded-md"
        >
          <Plus size={16} /> New Purchase Invoice
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="font-normal px-4 py-3">Invoice #</th>
              <th className="font-normal px-4 py-3">Shop Name</th>
              <th className="font-normal px-4 py-3">Date</th>
              <th className="font-normal px-4 py-3">Total Amount</th>
              <th className="font-normal px-4 py-3">Status</th>
              <th className="font-normal px-4 py-3">Created By</th>
              <th className="font-normal px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-gray-600">{inv.shopName}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(inv.invoiceDate)}</td>
                <td className="px-4 py-3 text-gray-800 font-semibold">MVR {formatMVR(inv.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${STATUS_BADGE[inv.status]}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{inv.createdBy}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/purchases/${inv.id}`}
                    className="text-brand-green text-xs font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  <FileText className="mx-auto mb-2 text-gray-300" size={24} />
                  No purchase invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
