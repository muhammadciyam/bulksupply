"use client";

import { Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";

export function DeleteButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this product? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton
        pendingLabel="Deleting..."
        className="flex items-center gap-1.5 text-brand-red text-sm font-medium border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 disabled:opacity-60"
      >
        <span className="flex items-center gap-1.5">
          <Trash2 size={14} /> Delete Product
        </span>
      </SubmitButton>
    </form>
  );
}
