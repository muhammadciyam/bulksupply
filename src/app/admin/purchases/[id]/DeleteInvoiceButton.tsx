"use client";

import { SubmitButton } from "@/components/SubmitButton";

export function DeleteInvoiceButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this pending invoice? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton
        pendingLabel="Deleting..."
        className="text-xs text-gray-400 hover:text-brand-red disabled:opacity-60"
      >
        Delete this invoice
      </SubmitButton>
    </form>
  );
}
