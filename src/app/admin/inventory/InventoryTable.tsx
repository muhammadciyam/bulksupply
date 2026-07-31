"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { adjustInventory, setInventoryThreshold } from "../actions";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";

type Item = {
  id: string;
  productName: string;
  sku: string;
  category: string;
  quantityOnHand: number;
  lowStockThreshold: number;
};

export function InventoryTable({ items }: { items: Item[] }) {
  const [rows, setRows] = useState(items);
  const [pending, startTransition] = useTransition();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  function applyAdjustment(id: string, change: number) {
    if (change === 0) return;
    const prevRows = rows;
    setError("");
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, quantityOnHand: Math.max(0, r.quantityOnHand + change) } : r
      )
    );
    startTransition(async () => {
      try {
        await adjustInventory(id, change, change > 0 ? "Stock received" : "Stock removed");
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setRows(prevRows);
        setError(err instanceof Error ? err.message : "Could not save that change");
      }
    });
  }

  function applyThreshold(id: string, threshold: number) {
    const prevRows = rows;
    setError("");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, lowStockThreshold: threshold } : r)));
    startTransition(async () => {
      try {
        await setInventoryThreshold(id, threshold);
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setRows(prevRows);
        setError(err instanceof Error ? err.message : "Could not save that change");
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-brand-red">{error}</p>}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
            <th className="font-normal px-4 py-3">Product</th>
            <th className="font-normal px-4 py-3">Category</th>
            <th className="font-normal px-4 py-3">Stock on Hand</th>
            <th className="font-normal px-4 py-3">Adjust</th>
            <th className="font-normal px-4 py-3">Low Stock Threshold</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const low = r.quantityOnHand <= r.lowStockThreshold;
            return (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{r.productName}</p>
                  <p className="text-xs text-gray-400">{r.sku}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.category}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${low ? "text-brand-red" : "text-gray-800"}`}>
                    {r.quantityOnHand}
                  </span>
                  {low && <span className="ml-2 text-[10px] text-brand-red">LOW</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={pending}
                      onClick={() => applyAdjustment(r.id, -(Number(amounts[r.id]) || 1))}
                      className="p-1 border border-gray-200 rounded hover:border-brand-red hover:text-brand-red"
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={amounts[r.id] ?? ""}
                      placeholder="1"
                      onChange={(e) => setAmounts((a) => ({ ...a, [r.id]: e.target.value }))}
                      className="w-14 border border-gray-200 rounded px-1.5 py-1 text-xs text-center"
                    />
                    <button
                      disabled={pending}
                      onClick={() => applyAdjustment(r.id, Number(amounts[r.id]) || 1)}
                      className="p-1 border border-gray-200 rounded hover:border-brand-green hover:text-brand-green"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    defaultValue={r.lowStockThreshold}
                    onBlur={(e) => applyThreshold(r.id, Number(e.target.value) || 0)}
                    className="w-16 border border-gray-200 rounded px-1.5 py-1 text-xs"
                  />
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
