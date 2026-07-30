import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMVR } from "@/lib/format";
import { canVerifyPayment } from "@/lib/roles";
import { Logo } from "@/components/Logo";
import { DownloadButton } from "./DownloadButton";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      businessAccount: true,
      items: { include: { product: true } },
      invoice: true,
    },
  });

  if (!order || !order.invoice) notFound();

  const isOwner = order.userId === session.user.id;
  if (!isOwner && !canVerifyPayment(session.user.role)) notFound();

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4 print:px-0 print:max-w-none">
        <div className="flex justify-end mb-4 no-print">
          <DownloadButton />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-10 print:border-0 print:shadow-none print:rounded-none">
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <Logo />
            <div className="text-right">
              <h1 className="text-2xl font-bold text-brand-navy">INVOICE</h1>
              <p className="text-sm text-gray-500 mt-1">Reference: {order.invoice.referenceNo}</p>
              <p className="text-sm text-gray-500">Issued: {formatDate(order.invoice.issuedAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
              <p className="text-gray-800 font-medium">
                {order.user.firstName} {order.user.lastName}
              </p>
              {order.businessAccount && <p className="text-gray-600">{order.businessAccount.name}</p>}
              <p className="text-gray-600">{order.user.phone}</p>
              <p className="text-gray-600">{order.user.email}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Order</p>
              <p className="text-gray-800">#{order.orderNumber}</p>
              <p className="text-gray-600">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-8">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-200">
                <th className="font-normal pb-2">Item</th>
                <th className="font-normal pb-2 text-right">Qty</th>
                <th className="font-normal pb-2 text-right">Unit</th>
                <th className="font-normal pb-2 text-right">Unit Price</th>
                <th className="font-normal pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id} className="border-b border-gray-100">
                  <td className="py-2 text-gray-800">{it.product.name}</td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right">{it.unitLabel}</td>
                  <td className="py-2 text-right">{formatMVR(it.unitPrice)}</td>
                  <td className="py-2 text-right">{formatMVR(it.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="pt-4 text-right font-semibold text-gray-500">
                  Total
                </td>
                <td className="pt-4 text-right font-bold text-brand-navy text-base">
                  MVR {formatMVR(order.invoice.amount)}
                </td>
              </tr>
            </tfoot>
          </table>

          <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
            Thank you for your business. This invoice was generated after payment verification for order
            #{order.orderNumber}.
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
