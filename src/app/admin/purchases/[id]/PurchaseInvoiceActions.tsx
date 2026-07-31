"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";

export function PurchaseInvoiceActions({
  invoiceId,
  onApprove,
  onReject,
}: {
  invoiceId: string;
  onApprove: (invoiceId: string) => Promise<void>;
  onReject: (invoiceId: string, reason: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  function handleApprove() {
    if (!confirm("Approve this invoice? This will add the stock into inventory and update cost prices.")) return;
    setError("");
    startTransition(async () => {
      try {
        await onApprove(invoiceId);
      } catch (e) {
        if (isNextNavigationSignal(e)) throw e;
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleReject() {
    setError("");
    startTransition(async () => {
      try {
        await onReject(invoiceId, reason);
      } catch (e) {
        if (isNextNavigationSignal(e)) throw e;
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={pending}
          className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-60"
        >
          <Check size={15} /> {pending ? "Approving..." : "Approve"}
        </button>
        <button
          onClick={() => setShowReject((v) => !v)}
          disabled={pending}
          className="flex items-center gap-1.5 border border-red-200 text-brand-red text-sm font-semibold px-4 py-2 rounded hover:bg-red-50 disabled:opacity-60"
        >
          <X size={15} /> Reject
        </button>
      </div>
      {showReject && (
        <div className="space-y-2 max-w-md">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejecting"
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
          />
          <button
            onClick={handleReject}
            disabled={pending || !reason.trim()}
            className="bg-brand-red hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded disabled:opacity-60"
          >
            {pending ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-brand-red">{error}</p>}
    </div>
  );
}
