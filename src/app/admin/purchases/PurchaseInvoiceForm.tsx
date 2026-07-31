"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, Receipt } from "lucide-react";
import { formatMVR } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";

type Product = { id: string; name: string; sku: string; gstApplicable: boolean };
type ItemRow = {
  productId: string;
  quantity: string;
  costExGst: string;
  costIncGst: string;
};

function emptyRow(): ItemRow {
  return { productId: "", quantity: "1", costExGst: "", costIncGst: "" };
}

// Derives the GST-inclusive amount from an excl.-GST amount + the shop-wide
// GST percentage (set in Settings). A 0% rate is a valid rate (not "unset"),
// so this still computes (incl. = excl. when the rate is 0) — it only
// bails out when there's no excl.-GST amount to work from yet.
function calcIncGst(exGst: string, gstPercent: number): string {
  const ex = Number(exGst);
  if (!ex) return "";
  return (ex * (1 + gstPercent / 100)).toFixed(2);
}

const inputClass =
  "w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green";

export function PurchaseInvoiceForm({
  products,
  gstPercent,
  action,
}: {
  products: Product[];
  gstPercent: number;
  action: (formData: FormData) => void;
}) {
  const [items, setItems] = useState<ItemRow[]>([emptyRow()]);

  function isGstRow(row: ItemRow): boolean {
    return products.find((p) => p.id === row.productId)?.gstApplicable ?? false;
  }

  function updateItem(i: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  // A product carries its own GST-applicable flag (set on the product form),
  // so switching the selected product can flip whether this row is GST-costed
  // at all — recompute the incl.-GST field immediately rather than leaving it
  // stale from whatever product was selected before.
  function handleProductChange(i: number, productId: string) {
    setItems((prev) =>
      prev.map((row, idx) => {
        if (idx !== i) return row;
        const next = { ...row, productId };
        const gstApplicable = products.find((p) => p.id === productId)?.gstApplicable ?? false;
        next.costIncGst = gstApplicable ? calcIncGst(row.costExGst, gstPercent) : "";
        return next;
      })
    );
  }

  function handleCostExGstChange(i: number, value: string) {
    setItems((prev) =>
      prev.map((row, idx) => {
        if (idx !== i) return row;
        const next = { ...row, costExGst: value };
        if (isGstRow(row)) {
          const nextIncGst = calcIncGst(value, gstPercent);
          if (nextIncGst) next.costIncGst = nextIncGst;
        }
        return next;
      })
    );
  }

  const subtotal = items.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.costExGst) || 0), 0);
  const totalAmount = items.reduce((sum, r) => {
    const exGst = Number(r.costExGst) || 0;
    const incGst = isGstRow(r) ? Number(r.costIncGst) || 0 : exGst;
    return sum + (Number(r.quantity) || 0) * incGst;
  }, 0);
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
        <p className="text-[11px] text-gray-400 -mt-1">
          GST rate is {gstPercent}%, set shop-wide in{" "}
          <a href="/admin/settings" className="text-brand-green hover:underline">
            Settings
          </a>
          . Applied automatically to items whose product has GST enabled.
        </p>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm min-w-[760px] border-collapse">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                <th className="font-normal pb-2 pr-2">Details (Product)</th>
                <th className="font-normal pb-2 pr-2 w-16">Qty</th>
                <th className="font-normal pb-2 pr-2 w-36">Cost Price</th>
                <th className="font-normal pb-2 pr-2 w-24 text-right">GST Amt</th>
                <th className="font-normal pb-2 pr-2 w-28 text-right">Line Total</th>
                <th className="font-normal pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => {
                const gstApplicable = isGstRow(row);
                const qty = Number(row.quantity) || 0;
                const exGst = Number(row.costExGst) || 0;
                const incGst = gstApplicable ? Number(row.costIncGst) || 0 : exGst;
                const lineGst = qty * (incGst - exGst);
                const lineTotal = qty * incGst;
                return (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-2 align-top">
                      <select
                        name="itemProductId"
                        required
                        value={row.productId}
                        onChange={(e) => handleProductChange(i, e.target.value)}
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
                      <div className="space-y-1">
                        <input
                          name="itemCostExGst"
                          type="number"
                          step="0.01"
                          min={0}
                          required
                          placeholder={gstApplicable ? "Excl. GST" : "Cost Price"}
                          value={row.costExGst}
                          onChange={(e) => handleCostExGstChange(i, e.target.value)}
                          className={inputClass}
                        />
                        {gstApplicable && (
                          <input
                            name={`itemCostIncGst_${i}`}
                            type="number"
                            step="0.01"
                            min={0}
                            required
                            readOnly
                            title="Computed from Cost (excl. GST) and the GST rate in Settings"
                            placeholder="Incl. GST"
                            value={row.costIncGst}
                            className={`${inputClass} bg-gray-100 text-gray-600 cursor-not-allowed`}
                          />
                        )}
                      </div>
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
