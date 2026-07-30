"use client";

import { useState, useTransition } from "react";
import { Check, Lock } from "lucide-react";
import { ORDER_STEPS } from "@/lib/format";
import { updateOrderStatus } from "../../actions";
import type { OrderStatus } from "@prisma/client";

export function StatusControls({
  orderId,
  currentStatus,
  allowedStatuses,
}: {
  orderId: string;
  currentStatus: string;
  allowedStatuses: OrderStatus[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const stepIndex = ORDER_STEPS.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === "CANCELLED";
  const isComplete = currentStatus === "COMPLETE";
  const isFinalized = isCancelled || isComplete;
  const canCancel = allowedStatuses.includes("CANCELLED" as OrderStatus) && !isFinalized;

  function setStatus(status: OrderStatus) {
    if (!allowedStatuses.includes(status) || isFinalized) return;
    setError("");
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status);
      } catch {
        setError("You don't have permission to set this status.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {!isCancelled && (
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex items-center min-w-[640px]">
            {ORDER_STEPS.map((step, i) => {
              const allowed = allowedStatuses.includes(step.key as OrderStatus);
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    disabled={pending || !allowed || isComplete}
                    onClick={() => setStatus(step.key as OrderStatus)}
                    className={`flex flex-col items-center gap-1 group ${
                      allowed && !isComplete ? "" : "cursor-not-allowed opacity-60"
                    }`}
                    title={
                      isComplete
                        ? "This order is complete and can no longer be changed"
                        : allowed
                          ? `Mark as ${step.label}`
                          : step.key === "ORDER_INVOICED"
                            ? "Set automatically when an invoice is generated"
                            : `${step.label} is handled by another role`
                    }
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs transition-colors shrink-0 ${
                        i <= stepIndex ? "bg-brand-green" : allowed ? "bg-gray-200 group-hover:bg-gray-300" : "bg-gray-100"
                      }`}
                    >
                      {i <= stepIndex ? <Check size={15} /> : !allowed ? <Lock size={11} className="text-gray-400" /> : ""}
                    </div>
                    <span className="text-[10px] text-gray-500 text-center w-20">{step.label}</span>
                  </button>
                  {i < ORDER_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 ${i < stepIndex ? "bg-brand-green" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-brand-red">{error}</p>}
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400">
          {isComplete ? "This order is complete and can no longer be changed." : "Click a step to update order status."}
        </p>
        {isCancelled && <span className="text-xs text-brand-red font-semibold ml-auto">This order is cancelled</span>}
        {canCancel && (
          <button
            onClick={() => setStatus("CANCELLED" as OrderStatus)}
            disabled={pending}
            className="text-xs text-brand-red font-medium ml-auto"
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}
