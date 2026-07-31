import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMVR, formatDate } from "@/lib/format";
import { isStaffRole, canManageCatalog, canApprovePurchaseInvoice } from "@/lib/roles";
import { approvePurchaseInvoice, rejectPurchaseInvoice, deletePurchaseInvoice } from "../../actions";
import { PurchaseInvoiceActions } from "./PurchaseInvoiceActions";
import { DeleteInvoiceButton } from "./DeleteInvoiceButton";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function PurchaseInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  if (!canManageCatalog(session.user.role)) redirect("/admin/orders");

  const { id } = await params;
  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!invoice) notFound();

  const deleteWithId = deletePurchaseInvoice.bind(null, invoice.id);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-navy">Purchase Invoice #{invoice.invoiceNumber}</h1>
        <span className={`text-xs font-bold px-2.5 py-1 rounded ${STATUS_BADGE[invoice.status]}`}>
          {invoice.status}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400 text-xs">Shop Name</p>
          <p className="text-gray-800">{invoice.shopName}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">GST Number</p>
          <p className="text-gray-800">{invoice.gstNumber ?? "-"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Invoice Date</p>
          <p className="text-gray-800">{formatDate(invoice.invoiceDate)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Created By</p>
          <p className="text-gray-800">{invoice.createdBy}</p>
        </div>
        {invoice.approvedBy && (
          <div>
            <p className="text-gray-400 text-xs">{invoice.status === "REJECTED" ? "Rejected By" : "Approved By"}</p>
            <p className="text-gray-800">
              {invoice.approvedBy}
              {invoice.approvedAt ? ` on ${formatDate(invoice.approvedAt)}` : ""}
            </p>
          </div>
        )}
        {invoice.status === "REJECTED" && invoice.rejectionReason && (
          <div className="sm:col-span-2">
            <p className="text-gray-400 text-xs">Rejection Reason</p>
            <p className="text-brand-red">{invoice.rejectionReason}</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="font-normal pb-2">Product</th>
              <th className="font-normal pb-2 text-right">Qty</th>
              <th className="font-normal pb-2 text-right">Cost (excl. GST)</th>
              <th className="font-normal pb-2 text-right">Cost (incl. GST)</th>
              <th className="font-normal pb-2 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => (
              <tr key={it.id} className="border-b border-gray-50">
                <td className="py-2 text-gray-800">
                  {it.product.name} <span className="text-gray-400 text-xs">({it.product.sku})</span>
                </td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">MVR {formatMVR(it.costPriceExGst)}</td>
                <td className="py-2 text-right">MVR {formatMVR(it.costPriceIncGst)}</td>
                <td className="py-2 text-right font-medium">MVR {formatMVR(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-gray-100 pt-3 mt-3 flex flex-col items-end gap-1 text-sm">
          <div className="flex justify-between w-56">
            <span className="text-gray-500">Subtotal (excl. GST)</span>
            <span className="text-gray-800">MVR {formatMVR(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between w-56">
            <span className="text-gray-500">GST Total</span>
            <span className="text-gray-800">MVR {formatMVR(invoice.gstTotal)}</span>
          </div>
          <div className="flex justify-between w-56 font-bold">
            <span className="text-brand-navy">Total Bill Amount</span>
            <span className="text-brand-green">MVR {formatMVR(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      {invoice.status === "PENDING" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          {canApprovePurchaseInvoice(session.user.role) ? (
            <PurchaseInvoiceActions
              invoiceId={invoice.id}
              onApprove={approvePurchaseInvoice}
              onReject={rejectPurchaseInvoice}
            />
          ) : (
            <p className="text-sm text-gray-400">Waiting for an admin to approve or reject this invoice.</p>
          )}
          <DeleteInvoiceButton action={deleteWithId} />
        </div>
      )}
    </div>
  );
}
