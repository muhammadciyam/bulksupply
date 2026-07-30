"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, FileDown } from "lucide-react";
import { ORDER_STEPS, ORDER_STATUS_LABEL, formatDate, formatMVR } from "@/lib/format";
import { PaymentSlipUpload } from "./PaymentSlipUpload";

type OrderItem = {
  id: string;
  name: string;
  sku: string;
  unitLabel: string;
  quantity: number;
  amount: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  deliveryMethod: string;
  customerReference: string | null;
  createdAt: string;
  createdBy: string;
  contactNumber: string;
  items: OrderItem[];
  invoice: { referenceNo: string; amount: number } | null;
  delivery: { location: string; addressDetails: string | null; addressLocation: string | null } | null;
  paymentSlip: {
    fileName: string;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    rejectionReason: string | null;
  } | null;
};

const PAGE_SIZE = 12;

const STATUS_PILL: Record<string, string> = {
  RECEIVED: "bg-gray-100 text-gray-600",
  ORDER_CONFIRMED: "bg-sky-100 text-sky-700",
  PRICE_QUOTED: "bg-sky-100 text-sky-700",
  PAYMENT_PROCESSING: "bg-amber-100 text-amber-700",
  ORDER_INVOICED: "bg-sky-100 text-sky-700",
  ON_DELIVERY: "bg-sky-100 text-sky-700",
  COMPLETE: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function OrdersView({ orders }: { orders: Order[] }) {
  const [selectedId, setSelectedId] = useState(orders[0]?.id ?? null);
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const paged = useMemo(
    () => orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [orders, page]
  );
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-400">
        You have not placed any orders yet.
      </div>
    );
  }

  const stepIndex = selected ? ORDER_STEPS.findIndex((s) => s.key === selected.status) : -1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      <div className="bg-white border border-gray-200 rounded-lg flex flex-col">
        <h2 className="font-bold text-brand-navy px-4 pt-4 pb-2">My orders</h2>
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {paged.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                selectedId === o.id ? "ring-1 ring-inset ring-brand-green bg-emerald-50/40" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-brand-navy">Order#{o.orderNumber}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${STATUS_PILL[o.status]}`}>
                  {ORDER_STATUS_LABEL[o.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{formatDate(o.createdAt)}</p>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1 p-3 border-t border-gray-100 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40"
            disabled={page === 1}
          >
            Prev
          </button>
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-2.5 py-1 rounded ${
                page === i + 1 ? "bg-brand-green text-white" : "border border-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40"
            disabled={page === pageCount}
          >
            Next
          </button>
        </div>
      </div>

      {selected && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="font-bold text-brand-navy">Order Details - {selected.orderNumber}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoBlock
              title="Info"
              rows={[
                ["Order Status", ORDER_STATUS_LABEL[selected.status]],
                ["Delivery method", selected.deliveryMethod],
              ]}
            />
            <InfoBlock
              title=""
              rows={[
                ["Created by", selected.createdBy],
                ["Contact Number", selected.contactNumber],
                ["Customer Reference", selected.customerReference ?? "-"],
              ]}
            />
          </div>

          {selected.status !== "CANCELLED" && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-4">Progress</p>
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="flex items-center min-w-[560px]">
                  {ORDER_STEPS.map((step, i) => (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${
                            i <= stepIndex ? "bg-brand-green" : "bg-gray-200"
                          }`}
                        >
                          {i <= stepIndex ? <Check size={14} /> : ""}
                        </div>
                        <span className="text-[10px] text-gray-500 text-center w-16">{step.label}</span>
                      </div>
                      {i < ORDER_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 ${i < stepIndex ? "bg-brand-green" : "bg-gray-200"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Items</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                  <th className="font-normal pb-2">Item</th>
                  <th className="font-normal pb-2 text-right">Qty</th>
                  <th className="font-normal pb-2 text-right">Unit</th>
                  <th className="font-normal pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it) => (
                  <tr key={it.id} className="border-b border-gray-50">
                    <td className="py-2">
                      <p className="text-gray-800">{it.name}</p>
                      <p className="text-[11px] text-gray-400">{it.sku}</p>
                    </td>
                    <td className="text-right">{it.quantity}</td>
                    <td className="text-right">{it.unitLabel}</td>
                    <td className="text-right">{formatMVR(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 text-right font-semibold text-gray-500">
                    Total
                  </td>
                  <td className="pt-3 text-right font-bold text-brand-navy">
                    MVR {formatMVR(selected.items.reduce((s, it) => s + it.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {selected.status === "PAYMENT_PROCESSING" && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Payment Slip</p>
              <PaymentSlipUpload orderId={selected.id} slip={selected.paymentSlip} />
            </div>
          )}

          {selected.invoice && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Invoice</p>
              <div className="bg-gray-50 rounded-md p-4 text-sm space-y-2">
                <p>Reference: {selected.invoice.referenceNo}</p>
                <p>Amount: MVR {formatMVR(selected.invoice.amount)}</p>
                <Link
                  href={`/account/orders/${selected.id}/invoice`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-brand-green text-xs font-semibold hover:underline"
                >
                  <FileDown size={14} /> View &amp; Download Invoice
                </Link>
              </div>
            </div>
          )}

          {selected.delivery && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Delivery</p>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-500 w-40">Delivery Location</td>
                    <td className="py-1.5">{selected.delivery.location}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-500">Address Details</td>
                    <td className="py-1.5">{selected.delivery.addressDetails ?? "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-gray-500">Address Location</td>
                    <td className="py-1.5">{selected.delivery.addressLocation ?? "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div>
      {title && <p className="text-sm font-semibold text-gray-600 mb-2">{title}</p>}
      <div className="space-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k}>
            <p className="text-gray-400 text-xs">{k}</p>
            <p className="text-gray-800">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
