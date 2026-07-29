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
  const canCancel = allowedStatuses.includes("CANCELLED" as OrderStatus);

  function setStatus(status: OrderStatus) {
    if (!allowedStatuses.includes(status)) return;
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
        <div className="flex items-center">
          {ORDER_STEPS.map((step, i) => {
            const allowed = allowedStatuses.includes(step.key as OrderStatus);
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  disabled={pending || !allowed}
                  onClick={() => setStatus(step.key as OrderStatus)}
                  className={`flex flex-col items-center gap-1 group ${
                    allowed ? "" : "cursor-not-allowed opacity-60"
                  }`}
                  title={allowed ? `Mark as ${step.label}` : `${step.label} is handled by another role`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs transition-colors ${
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
      )}
      {error && <p className="text-xs text-brand-red">{error}</p>}
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400">Click a step to update order status.</p>
        {!isCancelled ? (
          canCancel && (
            <button
              onClick={() => setStatus("CANCELLED" as OrderStatus)}
              disabled={pending}
              className="text-xs text-brand-red font-medium ml-auto"
            >
              Cancel Order
            </button>
          )
        ) : (
          <span className="text-xs text-brand-red font-semibold ml-auto">This order is cancelled</span>
        )}
      </div>
    </div>
  );
}
