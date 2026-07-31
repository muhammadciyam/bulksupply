"use client";

import { useState, useTransition } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { updateBusinessAccountStatus } from "../actions";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";
import type { AccountStatus } from "@prisma/client";

type AccountRow = {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
};

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

export function AccountsAdminTable({ accounts }: { accounts: AccountRow[] }) {
  const [rows, setRows] = useState(accounts);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function setStatus(id: string, status: AccountStatus) {
    const prevRows = rows;
    setError("");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    startTransition(async () => {
      try {
        await updateBusinessAccountStatus(id, status);
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setRows(prevRows);
        setError(err instanceof Error ? err.message : "Could not update that account's status");
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-brand-red">{error}</p>}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table className="w-full text-sm min-w-[820px]">
        <thead>
          <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
            <th className="font-normal px-4 py-3">Business</th>
            <th className="font-normal px-4 py-3">Owner</th>
            <th className="font-normal px-4 py-3">Type</th>
            <th className="font-normal px-4 py-3">Location</th>
            <th className="font-normal px-4 py-3">Status</th>
            <th className="font-normal px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{a.name}</td>
              <td className="px-4 py-3 text-gray-600">
                <p>{a.ownerName}</p>
                <p className="text-xs text-gray-400">
                  {a.ownerEmail} · {a.ownerPhone}
                </p>
              </td>
              <td className="px-4 py-3 text-gray-600 uppercase text-xs">{a.type}</td>
              <td className="px-4 py-3 text-gray-600">{a.location}</td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded lowercase ${STATUS_STYLE[a.status]}`}>
                  {a.status.toLowerCase()}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {a.status !== "APPROVED" && (
                    <button
                      disabled={pending}
                      onClick={() => setStatus(a.id, "APPROVED" as AccountStatus)}
                      title="Approve"
                      className="flex items-center gap-1 text-xs font-medium text-brand-green border border-emerald-200 hover:bg-emerald-50 px-2 py-1 rounded"
                    >
                      <Check size={13} /> Approve
                    </button>
                  )}
                  {a.status !== "CLOSED" && (
                    <button
                      disabled={pending}
                      onClick={() => setStatus(a.id, "CLOSED" as AccountStatus)}
                      title="Close"
                      className="flex items-center gap-1 text-xs font-medium text-brand-red border border-red-200 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      <X size={13} /> Close
                    </button>
                  )}
                  {a.status !== "PENDING" && (
                    <button
                      disabled={pending}
                      onClick={() => setStatus(a.id, "PENDING" as AccountStatus)}
                      title="Set Pending"
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 px-2 py-1 rounded"
                    >
                      <RotateCcw size={13} /> Pending
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                No customer business accounts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
