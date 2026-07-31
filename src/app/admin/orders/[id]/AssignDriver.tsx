"use client";

import { useState, useTransition } from "react";
import { Truck } from "lucide-react";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";

export function AssignDriver({
  orderId,
  currentDriverId,
  drivers,
  onAssign,
}: {
  orderId: string;
  currentDriverId: string | null;
  drivers: { id: string; name: string }[];
  onAssign: (orderId: string, staffId: string | null) => Promise<void>;
}) {
  const [driverId, setDriverId] = useState(currentDriverId ?? "");
  const [prevCurrentDriverId, setPrevCurrentDriverId] = useState(currentDriverId);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (currentDriverId !== prevCurrentDriverId) {
    setPrevCurrentDriverId(currentDriverId);
    setDriverId(currentDriverId ?? "");
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const staffId = e.target.value || null;
    const prevDriverId = driverId;
    setError("");
    setDriverId(staffId ?? "");
    startTransition(async () => {
      try {
        await onAssign(orderId, staffId);
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setDriverId(prevDriverId);
        setError(err instanceof Error ? err.message : "Could not assign that driver");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Truck size={16} className="text-gray-400 shrink-0" />
      <select
        value={driverId}
        onChange={handleChange}
        disabled={pending}
        className="border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm disabled:opacity-60"
      >
        <option value="">Unassigned</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      {pending && <span className="text-xs text-gray-400">Saving...</span>}
      {error && <span className="text-xs text-brand-red">{error}</span>}
    </div>
  );
}
