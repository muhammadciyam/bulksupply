import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMVR, ORDER_STATUS_LABEL } from "@/lib/format";
import { canVerifyPayment } from "@/lib/roles";
import { getBusinessDetails, getGstPercent } from "@/app/admin/actions";
import { Logo } from "@/components/Logo";
import { DownloadButton } from "./DownloadButton";
import { MapPin, Phone, Mail, Hash, Truck, Store } from "lucide-react";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { id } = await params;
  const [order, business, gstPercent] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        businessAccount: true,
        items: { include: { product: true } },
        invoice: true,
        delivery: true,
      },
    }),
    getBusinessDetails(),
    getGstPercent(),
  ]);

  if (!order || !order.invoice) notFound();

  const isOwner = order.userId === session.user.id;
  if (!isOwner && !canVerifyPayment(session.user.role)) notFound();

  const isDelivery = order.deliveryMethod === "delivery";

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4 print:px-0 print:max-w-none">
        <div className="flex justify-end mb-4 no-print">
          <DownloadButton />
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden print:border-0 print:shadow-none print:rounded-none">
          {/* Header band */}
          <div className="bg-gradient-to-r from-brand-navy to-brand-green px-8 sm:px-10 py-8 flex items-start justify-between flex-wrap gap-4 print:from-brand-navy print:to-brand-green">
            <Logo variant="dark" />
            <div className="text-right">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">INVOICE</h1>
              <p className="text-sm text-white/80 mt-1">Ref: {order.invoice.referenceNo}</p>
              <p className="text-sm text-white/80">Issued: {formatDate(order.invoice.issuedAt)}</p>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            {/* Seller / Bill To / Ship To */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 text-sm">
              <div>
                <p className="text-xs font-bold text-brand-green uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Store size={13} /> From
                </p>
                <p className="text-gray-900 font-semibold">{business.businessName}</p>
                {business.businessAddress && (
                  <p className="text-gray-600 flex items-start gap-1 mt-1">
                    <MapPin size={12} className="mt-0.5 shrink-0" /> {business.businessAddress}
                  </p>
                )}
                {business.businessPhone && (
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <Phone size={12} className="shrink-0" /> {business.businessPhone}
                  </p>
                )}
                {business.businessEmail && (
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <Mail size={12} className="shrink-0" /> {business.businessEmail}
                  </p>
                )}
                {business.businessGstNo && (
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <Hash size={12} className="shrink-0" /> GST: {business.businessGstNo}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-brand-green uppercase tracking-wide mb-2">Bill To</p>
                <p className="text-gray-900 font-semibold">
                  {order.user.firstName} {order.user.lastName}
                </p>
                {order.businessAccount && <p className="text-gray-600 mt-1">{order.businessAccount.name}</p>}
                <p className="text-gray-600 mt-1">{order.user.phone}</p>
                <p className="text-gray-600">{order.user.email}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-brand-green uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Truck size={13} /> {isDelivery ? "Ship To" : "Fulfilment"}
                </p>
                <p className="text-gray-900 font-semibold">{isDelivery ? "Delivery" : "Store Pickup"}</p>
                {isDelivery && order.delivery?.location && (
                  <p className="text-gray-600 mt-1">{order.delivery.location}</p>
                )}
                {isDelivery && order.delivery?.addressDetails && (
                  <p className="text-gray-600">{order.delivery.addressDetails}</p>
                )}
                {order.customerReference && (
                  <p className="text-gray-500 text-xs mt-1">Ref: {order.customerReference}</p>
                )}
              </div>
            </div>

            {/* Order meta strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 py-3 px-4 bg-surface-muted rounded-lg text-sm">
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide mr-1.5">Order</span>
                <span className="text-gray-800 font-semibold">#{order.orderNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide mr-1.5">Order Date</span>
                <span className="text-gray-800">{formatDate(order.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide mr-1.5">Status</span>
                <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded">
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
            </div>

            {/* Items */}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="text-left text-white text-xs bg-brand-navy">
                  <th className="font-semibold py-2.5 px-3 rounded-l-md">Item</th>
                  <th className="font-semibold py-2.5 px-3">SKU</th>
                  <th className="font-semibold py-2.5 px-3 text-right">Qty</th>
                  <th className="font-semibold py-2.5 px-3 text-right">Unit</th>
                  <th className="font-semibold py-2.5 px-3 text-right">Unit Price</th>
                  <th className="font-semibold py-2.5 px-3 text-right rounded-r-md">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => (
                  <tr key={it.id} className={idx % 2 === 0 ? "bg-white" : "bg-surface-muted/60"}>
                    <td className="py-2.5 px-3 text-gray-800 font-medium">{it.product.name}</td>
                    <td className="py-2.5 px-3 text-gray-500">{it.product.sku}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{it.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{it.unitLabel}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{formatMVR(it.unitPrice)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-800 font-semibold">{formatMVR(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-end mb-8">
              <div className="w-full sm:w-72">
                <div className="flex justify-between items-center bg-brand-green text-white rounded-lg px-4 py-3">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-extrabold text-lg">MVR {formatMVR(order.invoice.amount)}</span>
                </div>
                {gstPercent > 0 && (
                  <p className="text-[11px] text-gray-400 text-right mt-1.5">
                    Prices are inclusive of GST where applicable.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 space-y-1">
              <p>
                Thank you for your business. This invoice was generated after payment verification for order
                #{order.orderNumber}.
              </p>
              <p>This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </div>
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
