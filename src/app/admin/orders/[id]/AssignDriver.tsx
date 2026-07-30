"use client";

import { useTransition } from "react";
import { Truck } from "lucide-react";

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
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const staffId = e.target.value || null;
    startTransition(async () => {
      await onAssign(orderId, staffId);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Truck size={16} className="text-gray-400 shrink-0" />
      <select
        defaultValue={currentDriverId ?? ""}
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
    </div>
  );
}
