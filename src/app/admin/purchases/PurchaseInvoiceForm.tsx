"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, Receipt } from "lucide-react";
import { formatMVR } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";

type Product = { id: string; name: string; sku: string };
type ItemRow = { productId: string; quantity: string; costExGst: string; costIncGst: string };

function emptyRow(): ItemRow {
  return { productId: "", quantity: "1", costExGst: "", costIncGst: "" };
}

const inputClass =
  "w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green";

export function PurchaseInvoiceForm({
  products,
  action,
}: {
  products: Product[];
  action: (formData: FormData) => void;
}) {
  const [items, setItems] = useState<ItemRow[]>([emptyRow()]);

  function updateItem(i: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  const subtotal = items.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.costExGst) || 0), 0);
  const totalAmount = items.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.costIncGst) || 0), 0);
  const gstTotal = totalAmount - subtotal;

  return (
    <form action={action} className="space-y-6 max-w-5xl">
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-brand-navy">
          <FileText size={16} />
          <h2 className="text-sm font-semibold">Supplier & Invoice Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
            <input name="shopName" required placeholder="e.g. Allied Enterprises" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input name="gstNumber" placeholder="e.g. GST-1234567" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
            <input name="invoiceNumber" required placeholder="e.g. INV-00231" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="invoiceDate"
              required
              max={new Date().toISOString().slice(0, 10)}
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-navy">
            <Receipt size={16} />
            <h2 className="text-sm font-semibold">Items</h2>
          </div>
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, emptyRow()])}
            className="flex items-center gap-1 text-brand-green text-xs font-semibold hover:text-brand-green-dark"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm min-w-[760px] border-collapse">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                <th className="font-normal pb-2 pr-2">Details (Product)</th>
                <th className="font-normal pb-2 pr-2 w-20">Qty</th>
                <th className="font-normal pb-2 pr-2 w-32">Cost (excl. GST)</th>
                <th className="font-normal pb-2 pr-2 w-32">Cost (incl. GST)</th>
                <th className="font-normal pb-2 pr-2 w-28 text-right">GST</th>
                <th className="font-normal pb-2 pr-2 w-32 text-right">Line Total</th>
                <th className="font-normal pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => {
                const qty = Number(row.quantity) || 0;
                const exGst = Number(row.costExGst) || 0;
                const incGst = Number(row.costIncGst) || 0;
                const lineGst = qty * (incGst - exGst);
                const lineTotal = qty * incGst;
                return (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-2 align-top">
                      <select
                        name="itemProductId"
                        required
                        value={row.productId}
                        onChange={(e) => updateItem(i, { productId: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Select product…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <input
                        name="itemQuantity"
                        type="number"
                        min={1}
                        required
                        value={row.quantity}
                        onChange={(e) => updateItem(i, { quantity: e.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <input
                        name="itemCostExGst"
                        type="number"
                        step="0.01"
                        min={0}
                        required
                        placeholder="0.00"
                        value={row.costExGst}
                        onChange={(e) => updateItem(i, { costExGst: e.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <input
                        name="itemCostIncGst"
                        type="number"
                        step="0.01"
                        min={0}
                        required
                        placeholder="0.00"
                        value={row.costIncGst}
                        onChange={(e) => updateItem(i, { costIncGst: e.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-2 pt-4 text-right text-gray-500 whitespace-nowrap">
                      {formatMVR(lineGst)}
                    </td>
                    <td className="py-2 pr-2 pt-4 text-right font-semibold text-gray-800 whitespace-nowrap">
                      MVR {formatMVR(lineTotal)}
                    </td>
                    <td className="py-2 pt-4 text-right">
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                        disabled={items.length === 1}
                        title="Remove item"
                        className="text-gray-300 hover:text-brand-red disabled:opacity-30 disabled:hover:text-gray-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 pt-3 flex flex-col items-end gap-1.5 text-sm">
          <div className="flex justify-between w-64">
            <span className="text-gray-500">Subtotal (excl. GST)</span>
            <span className="text-gray-800">MVR {formatMVR(subtotal)}</span>
          </div>
          <div className="flex justify-between w-64">
            <span className="text-gray-500">GST Total</span>
            <span className="text-gray-800">MVR {formatMVR(gstTotal)}</span>
          </div>
          <div className="flex justify-between w-64 pt-1.5 border-t border-gray-100 font-bold">
            <span className="text-brand-navy">Total Bill Amount</span>
            <span className="text-brand-green">MVR {formatMVR(totalAmount)}</span>
          </div>
        </div>
      </div>

      <SubmitButton
        pendingLabel="Saving..."
        className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-6 py-2.5 rounded disabled:opacity-60"
      >
        Save Purchase Invoice
      </SubmitButton>
    </form>
  );
}
