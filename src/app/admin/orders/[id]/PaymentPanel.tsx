"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Check, X, Receipt } from "lucide-react";

type Slip = {
  fileName: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  uploadedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
};

type InvoiceInfo = {
  referenceNo: string;
  amount: number;
  issuedAt: string;
};

const STATUS_BADGE: Record<Slip["status"], string> = {
  PENDING: "bg-amber-100 text-amber-700",
  VERIFIED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export function PaymentPanel({
  orderId,
  slip,
  invoice,
  canVerify,
  canGenerate,
  onVerify,
  onReject,
  onGenerate,
}: {
  orderId: string;
  slip: Slip | null;
  invoice: InvoiceInfo | null;
  canVerify: boolean;
  canGenerate: boolean;
  onVerify: (orderId: string) => Promise<void>;
  onReject: (orderId: string, reason: string) => Promise<void>;
  onGenerate: (orderId: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  function handleVerify() {
    setError("");
    startTransition(async () => {
      try {
        await onVerify(orderId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleReject() {
    setError("");
    startTransition(async () => {
      try {
        await onReject(orderId, reason);
        setShowReject(false);
        setReason("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleGenerate() {
    setError("");
    startTransition(async () => {
      try {
        await onGenerate(orderId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Payment Slip
        </h3>
        {!slip ? (
          <p className="text-sm text-gray-400">Customer has not uploaded a payment slip yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/api/orders/${orderId}/payment-slip/file`}
                target="_blank"
                className="flex items-center gap-1.5 text-sm text-brand-green font-medium hover:underline"
              >
                <FileText size={15} /> {slip.fileName}
              </Link>
              <span className={`text-[10px] font-bold px-2 py-1 rounded ${STATUS_BADGE[slip.status]}`}>
                {slip.status}
              </span>
            </div>
            {slip.status === "REJECTED" && slip.rejectionReason && (
              <p className="text-xs text-brand-red bg-red-50 rounded px-3 py-2">
                Rejected: {slip.rejectionReason}
              </p>
            )}
            {slip.status === "VERIFIED" && slip.verifiedBy && (
              <p className="text-xs text-gray-400">
                Verified by {slip.verifiedBy}
                {slip.verifiedAt ? ` on ${new Date(slip.verifiedAt).toLocaleString()}` : ""}
              </p>
            )}
            {canVerify && slip.status === "PENDING" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVerify}
                    disabled={pending}
                    className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold px-3 py-1.5 rounded disabled:opacity-60"
                  >
                    <Check size={14} /> Verify
                  </button>
                  <button
                    onClick={() => setShowReject((v) => !v)}
                    disabled={pending}
                    className="flex items-center gap-1.5 border border-red-200 text-brand-red text-xs font-semibold px-3 py-1.5 rounded hover:bg-red-50 disabled:opacity-60"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
                {showReject && (
                  <div className="space-y-2">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason for rejecting (shown to the customer)"
                      rows={2}
                      className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
                    />
                    <button
                      onClick={handleReject}
                      disabled={pending || !reason.trim()}
                      className="bg-brand-red hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded disabled:opacity-60"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Invoice</h3>
        {invoice ? (
          <div className="text-sm space-y-1">
            <p className="text-gray-800">Reference: {invoice.referenceNo}</p>
            <p className="text-gray-800">Amount: MVR {invoice.amount.toFixed(2)}</p>
            <p className="text-xs text-gray-400">
              Issued {new Date(invoice.issuedAt).toLocaleString()}
            </p>
          </div>
        ) : canGenerate ? (
          <button
            onClick={handleGenerate}
            disabled={pending || slip?.status !== "VERIFIED"}
            title={slip?.status !== "VERIFIED" ? "Payment must be verified first" : undefined}
            className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Receipt size={15} /> Generate Invoice
          </button>
        ) : (
          <p className="text-sm text-gray-400">No invoice generated yet.</p>
        )}
      </div>

      {error && <p className="text-xs text-brand-red">{error}</p>}
    </div>
  );
}
