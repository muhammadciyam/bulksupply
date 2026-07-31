"use client";

import { useState, useTransition } from "react";
import { updateAppSettings } from "../actions";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";

export function SettingsForm({ initialDays }: { initialDays: number }) {
  const [days, setDays] = useState(String(initialDays));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    startTransition(async () => {
      try {
        await updateAppSettings(Number(days));
        setSuccess(true);
      } catch (e) {
        if (isNextNavigationSignal(e)) throw e;
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Days before auto-cancel</label>
        <input
          type="number"
          min={1}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-32 border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
        />
      </div>
      {error && <p className="text-sm text-brand-red">{error}</p>}
      {success && <p className="text-sm text-brand-green">Settings saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-5 py-2 rounded text-sm disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
